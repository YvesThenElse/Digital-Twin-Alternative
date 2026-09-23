using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using DigitalTwin.Api.Health;
using DigitalTwin.Api.Persistence;
using DigitalTwin.Domain.Player;
using DigitalTwin.Domain.Temporal;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace DigitalTwin.Api.Tests;

/// <summary>
/// La correction d'une date (E07 · §5.3).
///
/// <para><b>Le journal est en ajout seul.</b> « Corriger ne réécrit pas :
/// cela chaîne un nouvel événement et marque l'ancien comme remplacé », et
/// la révision est « conservée côté système sans être exposée ».</para>
///
/// <para>C'est aussi le premier geste du produit capable de produire une
/// <b>incohérence causale</b> — §5.4 était calculé, rendu et affiché sans
/// qu'aucun geste puisse en déclencher un seul.</para>
/// </summary>
[Collection("postgres")]
public class CorrectionDeDateTests(PostgresFixture bdd)
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

    private static string Neuf(string quoi) => $"usr_{quoi}_{Guid.NewGuid():N}"[..24];

    private async Task Ecrire(params PlayerEvent[] journal)
    {
        await using var db = bdd.CreerContexte();
        await new EventStore(db).AppendAsync(journal);
    }

    private static PlayerEvent Ev(
        string id, string user, string type, string cible, TemporalValue quand,
        string? lot = "bat_origine", string? plateforme = "plt_snes")
        => new(id, user, type, new EventTarget("work", cible), quand,
               new DateTime(2026, 1, 15, 12, 0, 0, DateTimeKind.Utc))
        {
            BatchId = lot,
            PlatformId = plateforme,
        };

    private static async Task<HttpResponseMessage> Corriger(
        HttpClient c, string user, string eventId, object periode)
        => await c.PostAsJsonAsync($"/moments/{eventId}/date", new { userId = user, period = periode });

    private static async Task<JsonElement> Axe(HttpClient c, string user)
        => await c.GetFromJsonAsync<JsonElement>($"/timeline/{user}");

    private static List<JsonElement> Moments(JsonElement axe) =>
        [.. axe.GetProperty("entries").EnumerateArray()
            .SelectMany(e => e.GetProperty("moments").EnumerateArray()),
          .. axe.GetProperty("undated").EnumerateArray()];

    [Fact]
    public async Task Chaine_un_nouvel_evenement_et_masque_l_ancien()
    {
        using var usine = Usine();
        var client = usine.CreateClient();
        var user = Neuf("corr");
        await Ecrire(Ev("evt_origine", user, PlayerEventType.StartedGame, "wrk_a", new Year(1995)));

        var reponse = await Corriger(client, user, "evt_origine", new { kind = "year", year = 1998 });
        reponse.EnsureSuccessStatusCode();

        // UN seul moment : l'ancien est marqué, pas dupliqué. Deux lignes
        // feraient croire au joueur qu'il a déclaré deux fois.
        var moments = Moments(await Axe(client, user));
        Assert.Single(moments);
        Assert.Equal(1998, moments[0].GetProperty("occurredAt").GetProperty("year").GetInt32());
        Assert.NotEqual("evt_origine", moments[0].GetProperty("id").GetString());
    }

    [Fact]
    public async Task L_ancien_est_conserve_en_base_sans_etre_expose()
    {
        // §5.3 : « la révision est conservée côté système sans être
        // exposée ». L'effacer perdrait l'audit — et le journal cesserait
        // d'être en ajout seul.
        using var usine = Usine();
        var client = usine.CreateClient();
        var user = Neuf("garde");
        await Ecrire(Ev("evt_garde", user, PlayerEventType.StartedGame, "wrk_a", new Year(1995)));

        var reponse = await Corriger(client, user, "evt_garde", new { kind = "year", year = 1998 });
        var corrige = (await reponse.Content.ReadFromJsonAsync<JsonElement>())
            .GetProperty("eventId").GetString();

        await using var db = bdd.CreerContexte();
        var ancien = db.PlayerEvents.Single(e => e.Id == "evt_garde");
        Assert.Equal(corrige, ancien.SupersededByEventId);
    }

    [Fact]
    public async Task Le_nouvel_evenement_garde_type_cible_plateforme_et_lot()
    {
        // Le LOT n'est pas un détail : c'est lui qui fait l'épisode (§4.4).
        // Le perdre ferait sortir le moment corrigé de la bande où le joueur
        // l'a déclaré, et l'axe montrerait une session qui n'a pas eu lieu.
        using var usine = Usine();
        var client = usine.CreateClient();
        var user = Neuf("memes");
        await Ecrire(Ev("evt_memes", user, PlayerEventType.CompletedGame, "wrk_b",
            new Year(1995), lot: "bat_ancien", plateforme: "plt_nes"));

        await Corriger(client, user, "evt_memes", new { kind = "year", year = 1997 });

        await using var db = bdd.CreerContexte();
        var nouveau = db.PlayerEvents.Single(e => e.Id != "evt_memes" && e.UserId == user);
        Assert.Equal(PlayerEventType.CompletedGame, nouveau.Type);
        Assert.Equal("wrk_b", nouveau.TargetId);
        Assert.Equal("plt_nes", nouveau.PlatformId);
        Assert.Equal("bat_ancien", nouveau.BatchId);
    }

    [Fact]
    public async Task Les_sept_granularites_sont_acceptees_par_ce_chemin()
    {
        // La correction passe par le MÊME traducteur de période que la
        // sélection massive : ce qu'il accepte, elle l'accepte. « Je ne sais
        // plus » y compris — c'est une réponse (§7.3), et le moment tombe
        // alors dans le tiroir sans date.
        using var usine = Usine();
        var client = usine.CreateClient();
        var user = Neuf("granu");
        await Ecrire(Ev("evt_granu", user, PlayerEventType.StartedGame, "wrk_c", new Year(1995)));

        await Corriger(client, user, "evt_granu", new { kind = "unknown" });

        var axe = await Axe(client, user);
        Assert.Empty(axe.GetProperty("entries").EnumerateArray());
        Assert.Single(axe.GetProperty("undated").EnumerateArray());
    }

    [Fact]
    public async Task Un_moment_deja_remplace_ne_se_corrige_plus()
    {
        // Sinon deux corrections concurrentes produiraient deux successeurs
        // du même moment, et l'axe en montrerait deux là où le joueur n'en a
        // qu'un.
        using var usine = Usine();
        var client = usine.CreateClient();
        var user = Neuf("deuxfois");
        await Ecrire(Ev("evt_deux", user, PlayerEventType.StartedGame, "wrk_d", new Year(1995)));

        var premiere = await Corriger(client, user, "evt_deux", new { kind = "year", year = 1996 });
        premiere.EnsureSuccessStatusCode();
        var seconde = await Corriger(client, user, "evt_deux", new { kind = "year", year = 1997 });

        Assert.Equal(HttpStatusCode.NotFound, seconde.StatusCode);
        Assert.Single(Moments(await Axe(client, user)));
    }

    [Fact]
    public async Task Le_moment_d_un_autre_profil_ne_se_corrige_pas()
    {
        // Il n'y a AUCUNE authentification (PHASING §4) : le profil s'adresse
        // par l'URL. La seule chose qui protège un journal est donc que
        // chaque écriture nomme son propriétaire — et le vérifie.
        using var usine = Usine();
        var client = usine.CreateClient();
        var proprietaire = Neuf("mien");
        await Ecrire(Ev("evt_mien", proprietaire, PlayerEventType.StartedGame, "wrk_e", new Year(1995)));

        var reponse = await Corriger(client, Neuf("autre"), "evt_mien", new { kind = "year", year = 2020 });

        Assert.Equal(HttpStatusCode.NotFound, reponse.StatusCode);
        var moments = Moments(await Axe(client, proprietaire));
        Assert.Equal(1995, moments[0].GetProperty("occurredAt").GetProperty("year").GetInt32());
    }

    [Fact]
    public async Task Une_correction_peut_enfin_produire_une_incoherence_causale()
    {
        // ⚠️ LE test de l'item. §5.4 était calculé par le domaine, rendu par
        // l'API, affiché par l'axe — et AUCUN geste du produit ne pouvait en
        // déclencher un : la sélection massive émet toujours le commencement
        // avec l'achèvement, à la même date.
        using var usine = Usine();
        var client = usine.CreateClient();
        var user = Neuf("incoh");
        await Ecrire(
            Ev("evt_debut", user, PlayerEventType.StartedGame, "wrk_f", new Year(1995)),
            Ev("evt_fin", user, PlayerEventType.CompletedGame, "wrk_f", new Year(1996)));

        // Avant : aucun avertissement. C'est le témoin (78) — sans lui, le
        // « il y en a un » ci-dessous ne dirait pas d'où il vient.
        Assert.Empty((await Axe(client, user)).GetProperty("warnings").EnumerateArray());

        // Terminé AVANT d'avoir commencé : possible, et signalé.
        await Corriger(client, user, "evt_fin", new { kind = "year", year = 1990 });

        var avertissements = (await Axe(client, user)).GetProperty("warnings").EnumerateArray().ToList();
        Assert.Single(avertissements);
    }

    [Fact]
    public async Task Une_periode_illisible_est_refusee_en_la_nommant()
    {
        using var usine = Usine();
        var client = usine.CreateClient();
        var user = Neuf("refus");
        await Ecrire(Ev("evt_refus", user, PlayerEventType.StartedGame, "wrk_g", new Year(1995)));

        var reponse = await Corriger(client, user, "evt_refus", new { kind = "siecle" });

        Assert.Equal(HttpStatusCode.BadRequest, reponse.StatusCode);
        Assert.Contains("siecle", await reponse.Content.ReadAsStringAsync(), StringComparison.Ordinal);
    }
}
