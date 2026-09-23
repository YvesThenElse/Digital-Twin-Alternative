using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using DigitalTwin.Api.Health;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace DigitalTwin.Api.Tests;

/// <summary>
/// La fiche d'une œuvre (E05, variante A) — <b>la couche référentiel</b>.
///
/// <para>La couche personnelle, elle, ne passe pas par ici : elle est déjà
/// dans l'axe. Ce point d'entrée ne rend que ce que le catalogue sait, et
/// c'est ce qui lui permet d'ignorer complètement l'utilisateur.</para>
///
/// <para><b>Toutes les plateformes, pas une.</b> <c>/platforms/{id}/works</c>
/// répond à « que puis-je déclarer sur cette machine ? » et restreint donc
/// ses sorties à elle. La fiche répond à « qu'est-ce que ce jeu ? », et
/// E05 y veut les « éditions connues » — qui traversent les machines.</para>
/// </summary>
public class FicheOeuvreTests
{
    private static WebApplicationFactory<Program> Usine() =>
        new WebApplicationFactory<Program>().WithWebHostBuilder(b =>
            b.ConfigureServices(s =>
            {
                s.RemoveAll<IDatabaseProbe>();
                s.AddSingleton<IDatabaseProbe>(new SondeVerte());
            }));

    private sealed class SondeVerte : IDatabaseProbe
    {
        public Task<DatabaseStatus> CheckAsync(CancellationToken ct = default)
            => Task.FromResult(DatabaseStatus.Reachable("sans objet"));
    }

    private static async Task<(string Id, string Titre)> UneOeuvre(HttpClient c)
    {
        var plateformes = await c.GetFromJsonAsync<JsonElement>("/platforms");
        var pf = plateformes[0].GetProperty("id").GetString()!;
        var oeuvres = await c.GetFromJsonAsync<JsonElement>($"/platforms/{pf}/works");
        return (oeuvres[0].GetProperty("id").GetString()!,
                oeuvres[0].GetProperty("title").GetString()!);
    }

    [Fact]
    public async Task Rend_le_titre_et_la_jaquette_de_l_oeuvre()
    {
        using var usine = Usine();
        var client = usine.CreateClient();
        var (id, titre) = await UneOeuvre(client);

        var fiche = await client.GetFromJsonAsync<JsonElement>($"/works/{id}");

        Assert.Equal(id, fiche.GetProperty("id").GetString());
        Assert.Equal(titre, fiche.GetProperty("title").GetString());
    }

    [Fact]
    public async Task Chaque_edition_porte_sa_machine_et_sa_region()
    {
        // E05, pièges : « Afficher les éditions sans région : deux Release
        // PAL et NTSC ne sont pas interchangeables (§3.4). » Et sans la
        // machine, « éditions connues » ne distingue plus rien.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (id, _) = await UneOeuvre(client);

        var editions = (await client.GetFromJsonAsync<JsonElement>($"/works/{id}"))
            .GetProperty("editions");

        Assert.NotEmpty(editions.EnumerateArray());
        foreach (var edition in editions.EnumerateArray())
        {
            Assert.False(string.IsNullOrWhiteSpace(
                edition.GetProperty("platformName").GetString()));
            Assert.False(string.IsNullOrWhiteSpace(
                edition.GetProperty("date").GetString()));
            // La région peut être NULLE — une sortie mondiale n'en a pas —,
            // mais la CLÉ doit être là : absente, le client lirait
            // `undefined` et n'afficherait rien sans le savoir.
            Assert.True(edition.TryGetProperty("region", out _));
            Assert.False(string.IsNullOrWhiteSpace(
                edition.GetProperty("precision").GetString()));
        }
    }

    [Fact]
    public async Task Les_editions_traversent_les_plateformes()
    {
        // Le dataset POC ne compte qu'une œuvre multi-plateforme, et c'est
        // elle qui prouve que ce point d'entrée ne restreint rien. Sans ce
        // test, la fiche se comporterait comme la liste d'une machine, et
        // « éditions connues » n'aurait jamais été livré.
        using var usine = Usine();
        var client = usine.CreateClient();

        var plateformes = await client.GetFromJsonAsync<JsonElement>("/platforms");
        var vues = new Dictionary<string, int>(StringComparer.Ordinal);
        foreach (var p in plateformes.EnumerateArray())
        {
            var oeuvres = await client.GetFromJsonAsync<JsonElement>(
                $"/platforms/{p.GetProperty("id").GetString()}/works");
            foreach (var o in oeuvres.EnumerateArray())
            {
                var id = o.GetProperty("id").GetString()!;
                vues[id] = vues.GetValueOrDefault(id) + 1;
            }
        }

        var multi = vues.FirstOrDefault(kv => kv.Value > 1);
        Assert.True(multi.Key is not null,
            "Aucune œuvre multi-plateforme dans le dataset : ce test ne prouve rien.");

        var editions = (await client.GetFromJsonAsync<JsonElement>($"/works/{multi.Key}"))
            .GetProperty("editions");
        var machines = editions.EnumerateArray()
            .Select(e => e.GetProperty("platformId").GetString())
            .Distinct()
            .Count();

        Assert.True(machines > 1,
            $"La fiche de « {multi.Key} » ne rend qu'une machine : elle restreint comme la liste.");
    }

    [Fact]
    public async Task Une_oeuvre_inconnue_se_dit_introuvable_en_la_nommant()
    {
        // Une fiche vide pour un identifiant inexistant se lirait comme un
        // jeu sans éditions. Et « introuvable » seul oblige à deviner ce que
        // le client a envoyé.
        using var usine = Usine();

        var reponse = await usine.CreateClient().GetAsync("/works/wrk_inexistante");

        Assert.Equal(HttpStatusCode.NotFound, reponse.StatusCode);
        var corps = await reponse.Content.ReadAsStringAsync();
        Assert.Contains("wrk_inexistante", corps, StringComparison.Ordinal);
    }

    [Fact]
    public async Task Un_titre_saisi_hors_referentiel_n_a_pas_de_fiche()
    {
        // §3.5 : une revendication n'est pas une œuvre curée. Lui rendre une
        // fiche de référentiel ferait passer pour un fait ce que le joueur a
        // tapé — et E05 lui réserve au contraire une « fiche minimale,
        // marquée jeu non répertorié ».
        using var usine = Usine();

        var reponse = await usine.CreateClient().GetAsync("/works/ucl_quelque_chose");

        Assert.Equal(HttpStatusCode.NotFound, reponse.StatusCode);
    }
}
