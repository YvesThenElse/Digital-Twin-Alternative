using System.Net.Http.Json;
using System.Text.Json;
using DigitalTwin.Api.Health;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace DigitalTwin.Api.Tests;

/// <summary>
/// L'affect (§4.7) — <b>la troisième capacité sans producteur</b>.
///
/// <para>La colonne existait, la lecture la rendait, le domaine savait
/// qu'elle lève « jamais joué » et qu'un seul préféré vit par plateforme — et
/// <b>aucun geste ne l'écrivait</b>. C'est le défaut que l'audit a trouvé
/// partout : vert, donc personne ne le cherche.</para>
///
/// <para>Il passe par le <b>même</b> point d'entrée que la sélection
/// massive : un second chemin produirait des jugements de forme différente
/// pour le même geste.</para>
/// </summary>
[Collection("postgres")]
public class AffectTests(PostgresFixture bdd)
{
    private WebApplicationFactory<Program> Usine() =>
        new WebApplicationFactory<Program>().WithWebHostBuilder(b =>
        {
            b.ConfigureAppConfiguration((_, c) => c.AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["ConnectionStrings:Postgres"] = bdd.ConnectionString,
                }));
            b.ConfigureServices(s =>
            {
                s.RemoveAll<IDatabaseProbe>();
                s.AddSingleton<IDatabaseProbe>(new SondeVerte());
            });
        });

    private sealed class SondeVerte : IDatabaseProbe
    {
        public Task<DatabaseStatus> CheckAsync(CancellationToken ct = default)
            => Task.FromResult(DatabaseStatus.Reachable("sans objet"));
    }

    private static string Neuf() => $"usr_aff_{Guid.NewGuid():N}"[..24];

    private static async Task<(string Pf, string[] Oeuvres)> Catalogue(HttpClient c)
    {
        var plateformes = await c.GetFromJsonAsync<JsonElement>("/platforms");
        var pf = plateformes[0].GetProperty("id").GetString()!;
        var oeuvres = await c.GetFromJsonAsync<JsonElement>($"/platforms/{pf}/works");
        return (pf, [.. oeuvres.EnumerateArray().Take(2)
            .Select(o => o.GetProperty("id").GetString()!)]);
    }

    private static Task<HttpResponseMessage> Declarer(
        HttpClient c, string user, string pf, object entree, string lot = "bat_aff")
        => c.PostAsJsonAsync("/declarations", new
        {
            batchId = $"{lot}_{user}",
            userId = user,
            platformId = pf,
            period = new { kind = "year", year = 1995 },
            entries = new[] { entree },
        });

    private static async Task<JsonElement> Etat(HttpClient c, string user, string pf)
        => await c.GetFromJsonAsync<JsonElement>($"/selection/{user}/{pf}");

    [Fact]
    public async Task Un_affect_declare_s_enregistre_et_se_relit()
    {
        using var usine = Usine();
        var client = usine.CreateClient();
        var user = Neuf();
        var (pf, oeuvres) = await Catalogue(client);

        var reponse = await Declarer(client, user, pf,
            new { workId = oeuvres[0], affect = "loved" });
        reponse.EnsureSuccessStatusCode();

        var lignes = (await Etat(client, user, pf)).EnumerateArray().ToList();
        // Le vocabulaire de l'ÉCRAN, pas celui du domaine : `/selection` sert
        // à remplir des chips, et faire remonter `Loved` violerait le
        // principe 9.
        Assert.Equal("loved", lignes.Single(l =>
            l.GetProperty("workId").GetString() == oeuvres[0])
            .GetProperty("affect").GetString());
    }

    [Fact]
    public async Task Un_affect_leve_jamais_joue()
    {
        // Invariant 10 : jamais de refus. Déclarer « j'ai adoré » sur un jeu
        // marqué « jamais joué » est une CORRECTION, pas une erreur — et
        // c'est le domaine qui le sait.
        using var usine = Usine();
        var client = usine.CreateClient();
        var user = Neuf();
        var (pf, oeuvres) = await Catalogue(client);

        await Declarer(client, user, pf, new { workId = oeuvres[0], neverPlayed = true });
        var avant = (await Etat(client, user, pf)).EnumerateArray()
            .Single(l => l.GetProperty("workId").GetString() == oeuvres[0]);
        Assert.True(avant.GetProperty("neverPlayed").GetBoolean());

        await Declarer(client, user, pf,
            new { workId = oeuvres[0], affect = "loved" }, lot: "bat_aff2");

        var apres = (await Etat(client, user, pf)).EnumerateArray()
            .Single(l => l.GetProperty("workId").GetString() == oeuvres[0]);
        Assert.False(apres.GetProperty("neverPlayed").GetBoolean());
        Assert.Equal("loved", apres.GetProperty("affect").GetString());
    }

    [Fact]
    public async Task Un_seul_prefere_par_plateforme_et_le_precedent_est_retrograde()
    {
        // Invariant 6. « Le modèle ne refuse pas le nouveau choix, il ajuste
        // l'ancien » : refuser obligerait le joueur à défaire avant de faire,
        // sur une question qui n'a qu'une bonne réponse à la fois.
        using var usine = Usine();
        var client = usine.CreateClient();
        var user = Neuf();
        var (pf, oeuvres) = await Catalogue(client);

        await Declarer(client, user, pf,
            new { workId = oeuvres[0], affect = "favourite" }, lot: "bat_p1");
        await Declarer(client, user, pf,
            new { workId = oeuvres[1], affect = "favourite" }, lot: "bat_p2");

        var lignes = (await Etat(client, user, pf)).EnumerateArray().ToList();
        // Le vocabulaire de l'ÉCRAN, pas celui du domaine : `/selection` sert
        // à remplir des chips, et faire remonter `Loved` violerait le
        // principe 9.
        Assert.Equal("loved", lignes.Single(l =>
            l.GetProperty("workId").GetString() == oeuvres[0])
            .GetProperty("affect").GetString());
        Assert.Equal("favourite", lignes.Single(l =>
            l.GetProperty("workId").GetString() == oeuvres[1])
            .GetProperty("affect").GetString());
    }

    [Fact]
    public async Task Un_affect_n_efface_pas_la_provenance()
    {
        // Une déclaration porte trois champs indépendants. Réécrire la ligne
        // entière ferait disparaître « je l'avais » parce qu'on a dit
        // « j'ai adoré » — le défaut exact que l'INTENTION existe pour
        // éviter.
        using var usine = Usine();
        var client = usine.CreateClient();
        var user = Neuf();
        var (pf, oeuvres) = await Catalogue(client);

        await Declarer(client, user, pf,
            new { workId = oeuvres[0], provenance = "owned" }, lot: "bat_pr");
        await Declarer(client, user, pf,
            new { workId = oeuvres[0], affect = "favourite" }, lot: "bat_af");

        var ligne = (await Etat(client, user, pf)).EnumerateArray()
            .Single(l => l.GetProperty("workId").GetString() == oeuvres[0]);
        Assert.Equal("owned", ligne.GetProperty("provenance").GetString());
        Assert.Equal("favourite", ligne.GetProperty("affect").GetString());
    }

    [Fact]
    public async Task Un_affect_inconnu_ne_dit_rien_plutot_que_d_affirmer()
    {
        using var usine = Usine();
        var client = usine.CreateClient();
        var user = Neuf();
        var (pf, oeuvres) = await Catalogue(client);

        await Declarer(client, user, pf, new { workId = oeuvres[0], affect = "génial" });

        var ligne = (await Etat(client, user, pf)).EnumerateArray()
            .Single(l => l.GetProperty("workId").GetString() == oeuvres[0]);
        // `null`, pas « Unstated » : « pas prononcé » n'est pas une réponse,
        // et l'afficher comme telle en inventerait une.
        Assert.Equal(JsonValueKind.Null, ligne.GetProperty("affect").ValueKind);
    }
}
