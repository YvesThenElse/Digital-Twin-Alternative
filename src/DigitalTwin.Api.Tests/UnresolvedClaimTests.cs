using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using DigitalTwin.Api.Health;
using DigitalTwin.Api.Persistence;
using DigitalTwin.Domain.Player;
using DigitalTwin.Domain.Temporal;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace DigitalTwin.Api.Tests;

/// <summary>
/// Le jeu absent du référentiel (§3.5).
///
/// <para>Sur 221 titres, le cas est <b>permanent</b> : sans issue, le testeur
/// est bloqué au premier titre manquant et le test de Phase 2 ne mesure plus
/// l'UX mais la couverture du dataset.</para>
///
/// <para>Deux exigences opposées se tiennent ici : la déclaration est
/// enregistrée <b>normalement</b> — elle compte dans le profil — et elle
/// n'est <b>jamais confondue</b> avec une œuvre curée, faute de quoi elle
/// polluerait les statistiques et les fiches.</para>
/// </summary>
[Collection("postgres")]
public class UnresolvedClaimTests(PostgresFixture bdd)
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

    private static async Task<(string plateforme, List<string> oeuvres)> Snes(HttpClient c)
    {
        var plateformes = await c.GetFromJsonAsync<JsonElement>("/platforms");
        var id = plateformes.EnumerateArray()
            .Single(p => p.GetProperty("name").GetString() == "Super Nintendo Entertainment System")
            .GetProperty("id").GetString()!;
        var oeuvres = await c.GetFromJsonAsync<JsonElement>($"/platforms/{id}/works");
        return (id, [.. oeuvres.EnumerateArray().Select(w => w.GetProperty("id").GetString()!)]);
    }

    private static object Lot(string batchId, string userId, string plateforme,
        IEnumerable<object> entrees, object? periode = null)
        => new
        {
            batchId, userId, platformId = plateforme,
            period = periode ?? new { kind = "year", year = 1995 },
            entries = entrees,
        };

    private async Task<IReadOnlyList<PlayerEvent>> Journal(string userId)
    {
        await using var db = bdd.CreerContexte();
        var lignes = await db.PlayerEvents.AsNoTracking()
            .Where(e => e.UserId == userId).ToListAsync();
        return [.. lignes.Select(PlayerEventMapping.ToDomain)];
    }

    private async Task<JsonElement> Revendications(HttpClient c, string userId)
        => await c.GetFromJsonAsync<JsonElement>($"/unresolved/{userId}");

    // ------------------------------------------------------ la saisie libre

    [Fact]
    public async Task Un_titre_absent_du_referentiel_est_accepte_et_non_bloquant()
    {
        using var usine = Usine();
        var client = usine.CreateClient();
        var (plateforme, _) = await Snes(client);

        var reponse = await client.PostAsJsonAsync("/declarations", Lot(
            "bat_abs", "usr_abs", plateforme,
            [new { title = "Un jeu que personne n'a curé" }]));

        Assert.Equal(HttpStatusCode.OK, reponse.StatusCode);
        Assert.Single(await Journal("usr_abs"));
    }

    [Fact]
    public async Task Une_declaration_non_resolue_ne_cible_pas_une_oeuvre()
    {
        // La cible dit le TYPE : la confondre avec une œuvre ferait apparaître
        // un titre libre dans les fiches et les statistiques agrégées, que
        // §3.5 exclut explicitement.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (plateforme, _) = await Snes(client);

        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_cible", "usr_cible", plateforme,
            [new { title = "Titre libre" }]));

        var evenement = Assert.Single(await Journal("usr_cible"));
        Assert.Equal("unresolvedClaim", evenement.Target.Kind);
        Assert.StartsWith("ucl_", evenement.Target.Id, StringComparison.Ordinal);
    }

    [Fact]
    public async Task Une_declaration_non_resolue_se_relit_avec_son_titre()
    {
        // « Ce que les utilisateurs cherchent et ne trouvent pas » est le
        // meilleur signal de priorisation du référentiel : perdre le titre
        // perdrait le signal.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (plateforme, _) = await Snes(client);

        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_titre", "usr_titre", plateforme,
            [new { title = "Terranigma bis" }]));

        var revendications = await Revendications(client, "usr_titre");
        Assert.Equal(1, revendications.GetArrayLength());
        Assert.Equal("Terranigma bis", revendications[0].GetProperty("title").GetString());
        Assert.Equal(plateforme, revendications[0].GetProperty("platformId").GetString());
        Assert.False(revendications[0].GetProperty("resolved").GetBoolean());
    }

    [Fact]
    public async Task Le_meme_titre_saisi_deux_fois_ne_cree_qu_une_revendication()
    {
        // Sinon le signal de priorisation compte des doublons, et le profil
        // affiche deux fois le même jeu. La comparaison ignore la casse et
        // les espaces de bord : « zelda bis » et « Zelda Bis » sont le même
        // titre pour quelqu'un qui le saisit deux fois.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (plateforme, _) = await Snes(client);

        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_dup1", "usr_dup", plateforme, [new { title = "Zelda Bis" }]));
        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_dup2", "usr_dup", plateforme, [new { title = "  zelda bis  " }]));

        Assert.Equal(1, (await Revendications(client, "usr_dup")).GetArrayLength());
        Assert.Equal(2, (await Journal("usr_dup")).Count);
    }

    // ------------------------------------------------------------- refus

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task Un_titre_vide_est_refuse(string titre)
    {
        // Un titre vide ne dit rien et ne se rattache à rien : il polluerait
        // le signal de priorisation sans jamais pouvoir être résolu.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (plateforme, _) = await Snes(client);

        var reponse = await client.PostAsJsonAsync("/declarations", Lot(
            $"bat_vide_{titre.Length}", $"usr_vide_{titre.Length}", plateforme,
            [new { title = titre }]));

        Assert.Equal(HttpStatusCode.BadRequest, reponse.StatusCode);
        // Le CODE ne suffit pas : sans le contrôle, l'entrée tombait dans la
        // branche « œuvre curée » et était refusée comme « œuvre inconnue ».
        // Le test passait, pour la mauvaise raison — une mutation l'a montré.
        Assert.Contains("titre libre ne peut pas être vide",
            await reponse.Content.ReadAsStringAsync(), StringComparison.Ordinal);
    }

    [Fact]
    public async Task Une_entree_portant_a_la_fois_un_titre_et_une_oeuvre_est_refusee()
    {
        // Ambiguë : on ne sait pas si le testeur a trouvé son jeu ou non.
        // Deviner ferait taire la question au mauvais moment.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (plateforme, oeuvres) = await Snes(client);

        var reponse = await client.PostAsJsonAsync("/declarations", Lot(
            "bat_ambigu", "usr_ambigu", plateforme,
            [new { workId = oeuvres[0], title = "Autre chose" }]));

        Assert.Equal(HttpStatusCode.BadRequest, reponse.StatusCode);
        Assert.Contains("Autre chose", await reponse.Content.ReadAsStringAsync(),
            StringComparison.Ordinal);
    }

    [Fact]
    public async Task Une_entree_sans_oeuvre_ni_titre_est_refusee()
    {
        using var usine = Usine();
        var client = usine.CreateClient();
        var (plateforme, _) = await Snes(client);

        var reponse = await client.PostAsJsonAsync("/declarations", Lot(
            "bat_ni", "usr_ni", plateforme, [new { completion = "finished" }]));

        Assert.Equal(HttpStatusCode.BadRequest, reponse.StatusCode);
        // Même piège : sans le contrôle, l'entrée était refusée comme
        // « œuvre inconnue : «  » », message qui n'aide personne.
        Assert.Contains("une œuvre ou un titre libre",
            await reponse.Content.ReadAsStringAsync(), StringComparison.Ordinal);
    }

    // ------------------------------------------------------- le rattachement

    [Fact]
    public async Task Rattacher_une_revendication_conserve_les_evenements_et_leurs_dates()
    {
        // §3.5 : « rattachables ultérieurement à une entité canonique, sans
        // perte de l'historique ni des dates ». Le journal étant en ajout
        // seul, on ne réécrit PAS les événements : la revendication porte la
        // résolution, et les événements continuent de la cibler.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (plateforme, oeuvres) = await Snes(client);

        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_ratt", "usr_ratt", plateforme,
            [new { title = "Bientôt curé" }],
            periode: new { kind = "approximate", year = 1994 }));

        var avant = await Journal("usr_ratt");
        var claimId = avant[0].Target.Id;

        var resolution = await client.PostAsJsonAsync(
            $"/unresolved/usr_ratt/{claimId}/resolve", new { workId = oeuvres[0] });
        Assert.Equal(HttpStatusCode.OK, resolution.StatusCode);

        var apres = await Journal("usr_ratt");
        Assert.Equal(avant.Count, apres.Count);
        Assert.Equal(avant[0].Id, apres[0].Id);
        Assert.Equal(avant[0].OccurredAt, apres[0].OccurredAt);
        Assert.Equal(claimId, apres[0].Target.Id);

        var revendications = await Revendications(client, "usr_ratt");
        Assert.True(revendications[0].GetProperty("resolved").GetBoolean());
        Assert.Equal(oeuvres[0], revendications[0].GetProperty("resolvedWorkId").GetString());
    }

    [Fact]
    public async Task Rattacher_a_une_oeuvre_inconnue_est_refuse_en_la_nommant()
    {
        using var usine = Usine();
        var client = usine.CreateClient();
        var (plateforme, _) = await Snes(client);

        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_ratt2", "usr_ratt2", plateforme, [new { title = "X" }]));
        var claimId = (await Journal("usr_ratt2"))[0].Target.Id;

        var reponse = await client.PostAsJsonAsync(
            $"/unresolved/usr_ratt2/{claimId}/resolve", new { workId = "wrk_fantome" });

        Assert.Equal(HttpStatusCode.BadRequest, reponse.StatusCode);
        Assert.Contains("wrk_fantome", await reponse.Content.ReadAsStringAsync(),
            StringComparison.Ordinal);
    }

    [Fact]
    public async Task Rattacher_une_revendication_inconnue_rend_404()
    {
        using var usine = Usine();
        var client = usine.CreateClient();
        var (_, oeuvres) = await Snes(client);

        var reponse = await client.PostAsJsonAsync(
            "/unresolved/usr_neant/ucl_fantome/resolve", new { workId = oeuvres[0] });

        Assert.Equal(HttpStatusCode.NotFound, reponse.StatusCode);
    }

    // ------------------------------------------------------------- la purge

    [Fact]
    public async Task La_purge_efface_aussi_les_revendications()
    {
        // Troisième table de USER DATA. §10.1 : une opération unique suffit à
        // tout effacer — une table oubliée laisserait des données
        // personnelles après un droit à l'effacement.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (plateforme, _) = await Snes(client);

        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_purge_ucl", "usr_purge_ucl", plateforme, [new { title = "À effacer" }]));

        await using (var db = bdd.CreerContexte())
        {
            await new EventStore(db).PurgeUserAsync("usr_purge_ucl");
        }

        Assert.Empty(await Journal("usr_purge_ucl"));
        Assert.Equal(0, (await Revendications(client, "usr_purge_ucl")).GetArrayLength());
    }

    [Fact]
    public async Task Un_lot_mele_des_oeuvres_curees_et_des_titres_libres()
    {
        // Le cas réel : on parcourt la liste, on coche ce qu'on reconnaît, et
        // on ajoute ce qui manque. Exiger deux gestes séparés casserait le
        // rythme que tout l'écran cherche à tenir.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (plateforme, oeuvres) = await Snes(client);

        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_mele_ucl", "usr_mele_ucl", plateforme,
            [
                new { workId = oeuvres[0] },
                new { title = "Le jeu de mon cousin" },
                new { workId = oeuvres[1] },
            ]));

        var journal = await Journal("usr_mele_ucl");
        Assert.Equal(3, journal.Count);
        Assert.Equal(2, journal.Count(e => e.Target.Kind == "work"));
        Assert.Single(journal.Where(e => e.Target.Kind == "unresolvedClaim"));
        Assert.All(journal, e => Assert.Equal(new Year(1995), e.OccurredAt));
    }
}
