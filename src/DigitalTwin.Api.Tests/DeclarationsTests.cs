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
/// La passe 2 de la sélection massive : un lot de déclarations devient un lot
/// d'événements.
///
/// <para>Deux exigences portent tout le reste. <b>Rejouer un lot ne duplique
/// rien</b> — un testeur dont la connexion hésite ne doit pas découvrir son
/// profil en double. Et <b>« terminé » implique « joué »</b> sans produire
/// deux événements que la cohérence causale refuserait.</para>
/// </summary>
[Collection("postgres")]
public class DeclarationsTests(PostgresFixture bdd)
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

    // ------------------------------------------------------------ outillage

    private static async Task<(string plateforme, List<string> oeuvres)> Snes(HttpClient c)
    {
        var plateformes = await c.GetFromJsonAsync<JsonElement>("/platforms");
        var id = plateformes.EnumerateArray()
            .Single(p => p.GetProperty("name").GetString() == "Super Nintendo Entertainment System")
            .GetProperty("id").GetString()!;
        var oeuvres = await c.GetFromJsonAsync<JsonElement>($"/platforms/{id}/works");
        return (id, [.. oeuvres.EnumerateArray().Select(w => w.GetProperty("id").GetString()!)]);
    }

    private static object Lot(
        string batchId, string userId, string plateforme, IEnumerable<object> entrees,
        object? periode = null)
        => new
        {
            batchId,
            userId,
            platformId = plateforme,
            period = periode ?? new { kind = "range", from = 1993, to = 1997 },
            entries = entrees,
        };

    private async Task<IReadOnlyList<PlayerEvent>> Journal(string userId)
    {
        await using var db = bdd.CreerContexte();
        var lignes = await db.PlayerEvents.AsNoTracking()
            .Where(e => e.UserId == userId).ToListAsync();
        return [.. lignes.Select(PlayerEventMapping.ToDomain)];
    }

    // ------------------------------------------------------------- le lot

    [Fact]
    public async Task Trente_declarations_en_un_appel_produisent_trente_evenements()
    {
        // Le geste central du produit : trente titres cochés d'un coup.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (plateforme, oeuvres) = await Snes(client);

        var reponse = await client.PostAsJsonAsync("/declarations", Lot(
            "bat_trente", "usr_trente", plateforme,
            oeuvres.Take(30).Select(w => new { workId = w })));

        Assert.Equal(HttpStatusCode.OK, reponse.StatusCode);
        var corps = await reponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(30, corps.GetProperty("created").GetInt32());
        Assert.Equal(30, (await Journal("usr_trente")).Count);
    }

    [Fact]
    public async Task Rejouer_le_meme_lot_ne_duplique_rien()
    {
        // Une connexion qui hésite ne doit pas produire un profil en double.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (plateforme, oeuvres) = await Snes(client);
        var lot = Lot("bat_rejoue", "usr_rejoue", plateforme,
            oeuvres.Take(5).Select(w => new { workId = w }));

        await client.PostAsJsonAsync("/declarations", lot);
        var seconde = await client.PostAsJsonAsync("/declarations", lot);

        Assert.Equal(HttpStatusCode.OK, seconde.StatusCode);
        var corps = await seconde.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(0, corps.GetProperty("created").GetInt32());
        Assert.True(corps.GetProperty("alreadyRecorded").GetBoolean());
        Assert.Equal(5, (await Journal("usr_rejoue")).Count);
    }

    [Fact]
    public async Task Tous_les_evenements_d_un_lot_en_portent_l_identifiant()
    {
        // §4.4 : douze titres cochés d'un coup forment UN épisode, pas douze
        // points identiques. Sans identifiant de lot, la timeline ne peut pas
        // les regrouper — et regrouper sur la seule égalité d'intervalle
        // inventerait une session qui n'a pas eu lieu.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (plateforme, oeuvres) = await Snes(client);

        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_episode", "usr_episode", plateforme,
            oeuvres.Take(4).Select(w => new { workId = w })));

        var journal = await Journal("usr_episode");
        Assert.All(journal, e => Assert.Equal("bat_episode", e.BatchId));
    }

    [Fact]
    public async Task La_periode_du_lot_devient_la_date_de_chaque_evenement()
    {
        using var usine = Usine();
        var client = usine.CreateClient();
        var (plateforme, oeuvres) = await Snes(client);

        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_periode", "usr_periode", plateforme,
            oeuvres.Take(3).Select(w => new { workId = w }),
            periode: new { kind = "approximate", year = 1995 }));

        var journal = await Journal("usr_periode");
        Assert.All(journal, e =>
        {
            var quand = Assert.IsType<ApproximateYear>(e.OccurredAt);
            Assert.Equal(1995, quand.Year);
            Assert.True(quand.Margin >= 1);
        });
    }

    // ------------------------------------------------- terminé implique joué

    [Fact]
    public async Task Termine_implique_joue_et_les_deux_evenements_sont_coherents()
    {
        // Déclarer « fini » sans « commencé » produirait un moment sans
        // prédécesseur valide — exactement ce que §5.4 appelle une
        // incohérence. L'implication n'est donc pas un confort : c'est ce qui
        // rend la déclaration représentable.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (plateforme, oeuvres) = await Snes(client);

        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_fini", "usr_fini", plateforme,
            [new { workId = oeuvres[0], completion = "finished" }]));

        var journal = await Journal("usr_fini");
        Assert.Equal(
            [PlayerEventType.CompletedGame, PlayerEventType.StartedGame],
            journal.Select(e => e.Type).OrderBy(x => x, StringComparer.Ordinal));

        var avertissements = TimelineSorter.Sort(
            journal, new TemporalHorizon(new DateOnly(2026, 9, 21), 1980)).Warnings;
        Assert.Empty(avertissements);
    }

    [Fact]
    public async Task Toujours_en_cours_ne_produit_aucun_evenement_supplementaire()
    {
        // « Toujours en cours » est une ABSENCE, pas un événement : un
        // `StartedGame` que rien n'a refermé. Lui donner un type ferait de la
        // position un état à maintenir, donc à désynchroniser.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (plateforme, oeuvres) = await Snes(client);

        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_encours", "usr_encours", plateforme,
            [new { workId = oeuvres[0], completion = "stillPlaying" }]));

        var journal = await Journal("usr_encours");
        Assert.Equal([PlayerEventType.StartedGame], journal.Select(e => e.Type));
    }

    [Fact]
    public async Task Abandonne_produit_l_abandon_et_le_commencement()
    {
        using var usine = Usine();
        var client = usine.CreateClient();
        var (plateforme, oeuvres) = await Snes(client);

        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_abandon", "usr_abandon", plateforme,
            [new { workId = oeuvres[0], completion = "abandoned" }]));

        var journal = await Journal("usr_abandon");
        Assert.Equal(
            [PlayerEventType.AbandonedGame, PlayerEventType.StartedGame],
            journal.Select(e => e.Type).OrderBy(x => x, StringComparer.Ordinal));
    }

    // ---------------------------------------------------------- possession

    [Fact]
    public async Task Je_l_avais_produit_une_acquisition()
    {
        using var usine = Usine();
        var client = usine.CreateClient();
        var (plateforme, oeuvres) = await Snes(client);

        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_possede", "usr_possede", plateforme,
            [new { workId = oeuvres[0], provenance = "owned" }]));

        var journal = await Journal("usr_possede");
        Assert.Contains(PlayerEventType.AcquiredItem, journal.Select(e => e.Type));
    }

    [Theory]
    [InlineData("elsewhere")]
    [InlineData("borrowed")]
    public async Task Jouer_sans_posseder_ne_produit_aucune_acquisition(string provenance)
    {
        // Jouer sans posséder était la norme avant la dématérialisation —
        // chez un cousin, chez le copain qui avait l'autre console. Inventer
        // une acquisition ferait apparaître dans la collection un exemplaire
        // que le joueur n'a jamais eu.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (plateforme, oeuvres) = await Snes(client);
        var user = $"usr_{provenance}";

        await client.PostAsJsonAsync("/declarations", Lot(
            $"bat_{provenance}", user, plateforme,
            [new { workId = oeuvres[0], provenance }]));

        var journal = await Journal(user);
        Assert.DoesNotContain(PlayerEventType.AcquiredItem, journal.Select(e => e.Type));
        Assert.Equal([PlayerEventType.StartedGame], journal.Select(e => e.Type));
    }

    // ------------------------------------------------------------- refus

    [Fact]
    public async Task Une_plateforme_inconnue_est_refusee_en_la_nommant()
    {
        using var usine = Usine();
        var client = usine.CreateClient();
        var (_, oeuvres) = await Snes(client);

        var reponse = await client.PostAsJsonAsync("/declarations", Lot(
            "bat_pf", "usr_pf", "plt_fantome", [new { workId = oeuvres[0] }]));

        Assert.Equal(HttpStatusCode.BadRequest, reponse.StatusCode);
        Assert.Contains("plt_fantome", await reponse.Content.ReadAsStringAsync(),
            StringComparison.Ordinal);
    }

    [Fact]
    public async Task Une_oeuvre_inconnue_est_refusee_en_la_nommant()
    {
        using var usine = Usine();
        var client = usine.CreateClient();
        var (plateforme, _) = await Snes(client);

        var reponse = await client.PostAsJsonAsync("/declarations", Lot(
            "bat_wrk", "usr_wrk", plateforme, [new { workId = "wrk_fantome" }]));

        Assert.Equal(HttpStatusCode.BadRequest, reponse.StatusCode);
        Assert.Contains("wrk_fantome", await reponse.Content.ReadAsStringAsync(),
            StringComparison.Ordinal);
    }

    [Fact]
    public async Task Une_oeuvre_absente_de_cette_plateforme_est_refusee_en_nommant_les_deux()
    {
        // Cocher un jeu Game Boy sur l'écran Super Nintendo est une faute du
        // client, pas une déclaration du joueur : l'accepter attribuerait un
        // souvenir à une machine où le jeu n'existe pas.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (snes, _) = await Snes(client);
        var plateformes = await client.GetFromJsonAsync<JsonElement>("/platforms");
        var gb = plateformes.EnumerateArray()
            .Single(p => p.GetProperty("name").GetString() == "Game Boy")
            .GetProperty("id").GetString()!;
        var oeuvresGb = await client.GetFromJsonAsync<JsonElement>($"/platforms/{gb}/works");
        var titreGb = oeuvresGb[0].GetProperty("id").GetString()!;

        var reponse = await client.PostAsJsonAsync("/declarations", Lot(
            "bat_croise", "usr_croise", snes, [new { workId = titreGb }]));

        Assert.Equal(HttpStatusCode.BadRequest, reponse.StatusCode);
        var texte = await reponse.Content.ReadAsStringAsync();
        Assert.Contains(titreGb, texte, StringComparison.Ordinal);
        Assert.Contains(snes, texte, StringComparison.Ordinal);
    }

    [Fact]
    public async Task Une_valeur_de_completion_inconnue_est_refusee_en_la_nommant()
    {
        using var usine = Usine();
        var client = usine.CreateClient();
        var (plateforme, oeuvres) = await Snes(client);

        var reponse = await client.PostAsJsonAsync("/declarations", Lot(
            "bat_compl", "usr_compl", plateforme,
            [new { workId = oeuvres[0], completion = "presque" }]));

        Assert.Equal(HttpStatusCode.BadRequest, reponse.StatusCode);
        Assert.Contains("presque", await reponse.Content.ReadAsStringAsync(),
            StringComparison.Ordinal);
    }

    [Fact]
    public async Task Un_lot_vide_est_refuse()
    {
        // Rien à déclarer n'est pas une déclaration. Accepter produirait un
        // lot sans événement, donc un épisode vide dans la timeline.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (plateforme, _) = await Snes(client);

        var reponse = await client.PostAsJsonAsync("/declarations", Lot(
            "bat_vide", "usr_vide", plateforme, []));

        Assert.Equal(HttpStatusCode.BadRequest, reponse.StatusCode);
    }

    [Fact]
    public async Task Aucun_evenement_n_est_ecrit_quand_une_seule_entree_est_fautive()
    {
        // Tout ou rien : accepter les vingt-neuf bonnes et refuser la
        // trentième laisserait le client incapable de savoir ce qui a été
        // enregistré, et un nouvel envoi dupliquerait les vingt-neuf.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (plateforme, oeuvres) = await Snes(client);

        var reponse = await client.PostAsJsonAsync("/declarations", Lot(
            "bat_partiel", "usr_partiel", plateforme,
            [
                new { workId = oeuvres[0] },
                new { workId = "wrk_fantome" },
            ]));

        Assert.Equal(HttpStatusCode.BadRequest, reponse.StatusCode);
        Assert.Empty(await Journal("usr_partiel"));
    }
}
