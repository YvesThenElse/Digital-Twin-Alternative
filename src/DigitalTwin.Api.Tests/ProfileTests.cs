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
/// La synthèse qui forme l'en-tête de <c>/mon-histoire</c> (E04, blocs A et B).
///
/// <para><b>Le point d'entrée existe pour que l'écran ne compte pas.</b> Un
/// front qui recompterait ses lignes parlerait de ce qu'il a chargé — une
/// plateforme, trente titres visibles — et non de l'histoire. Le nombre
/// serait juste par rapport à l'écran, et personne ne verrait qu'il est faux.
/// </para>
///
/// <para>Ce que l'API ajoute au domaine tient en deux gestes : elle RÉSOUT le
/// nom de la machine — l'écran n'a pas le référentiel — et elle
/// <b>n'envoie pas les chiffres</b> quand le profil est trop maigre pour
/// qu'ils veuillent dire quelque chose.</para>
/// </summary>
[Collection("postgres")]
public class ProfileTests(PostgresFixture bdd)
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

    private static PlayerEvent Ev(
        string id, string user, string type, string cible, TemporalValue quand,
        string? plateforme = null, string genre = "work")
        => new(id, user, type, new EventTarget(genre, cible), quand,
               new DateTime(2026, 1, 15, 12, 0, 0, DateTimeKind.Utc))
        {
            PlatformId = plateforme,
        };

    private async Task Ecrire(params PlayerEvent[] journal)
    {
        await using var db = bdd.CreerContexte();
        await new EventStore(db).AppendAsync(journal);
    }

    private static string Neuf(string quoi) => $"usr_{quoi}_{Guid.NewGuid():N}"[..24];

    /// <summary>La première plateforme du référentiel, identifiant et nom.</summary>
    private static async Task<(string Id, string Nom)> UneMachine(HttpClient c)
    {
        var plateformes = await c.GetFromJsonAsync<JsonElement>("/platforms");
        return (plateformes[0].GetProperty("id").GetString()!,
                plateformes[0].GetProperty("name").GetString()!);
    }

    [Fact]
    public async Task Un_profil_nourri_rend_ses_quatre_chiffres()
    {
        using var usine = Usine();
        var client = usine.CreateClient();
        var user = Neuf("nourri");
        var (machine, _) = await UneMachine(client);

        // Douze moments : au-dessus du seuil du portrait. Dix titres joués,
        // dont trois terminés, sur une seule machine.
        var journal = new List<PlayerEvent>();
        for (var i = 0; i < 10; i++)
        {
            journal.Add(Ev($"evt_p{i}", user, PlayerEventType.StartedGame,
                $"wrk_p{i}", new Year(1995), machine));
        }
        journal.Add(Ev("evt_f0", user, PlayerEventType.CompletedGame,
            "wrk_p0", new Year(1996), machine));
        journal.Add(Ev("evt_f1", user, PlayerEventType.CompletedGame,
            "wrk_p1", new Year(1996), machine));
        await Ecrire([.. journal]);

        var vue = await client.GetFromJsonAsync<JsonElement>($"/profile/{user}");
        var chiffres = vue.GetProperty("figures");

        Assert.Equal(1, chiffres.GetProperty("consoles").GetInt32());
        Assert.Equal(10, chiffres.GetProperty("gamesDeclared").GetInt32());
        Assert.Equal(2, chiffres.GetProperty("finished").GetInt32());
        Assert.Equal(0, chiffres.GetProperty("memoriesWritten").GetInt32());
    }

    [Fact]
    public async Task Les_souvenirs_ecrits_sont_comptes()
    {
        // Le quatrième chiffre remplace le « à 100 % » de la fiche, que §4.6
        // a sorti du modèle. Il porte le seul contenu non générable du
        // produit — celui dont §9.1 fait le porteur du « oui, ça me
        // ressemble ».
        using var usine = Usine();
        var client = usine.CreateClient();
        var user = Neuf("notes");
        var (machine, _) = await UneMachine(client);

        var journal = Enumerable.Range(0, 10).Select(i => Ev(
            $"evt_n{i}", user, PlayerEventType.StartedGame, $"wrk_n{i}",
            new Year(1995), machine)).ToArray();
        await Ecrire(journal);

        await using (var db = bdd.CreerContexte())
        {
            var magasin = new EventStore(db);
            await magasin.UpsertMemoryAsync(user, "work", "wrk_n0", "Une phrase.", null);
            // Réécrit sur la MÊME cible : le souvenir appartient au jeu, pas
            // au moment. Deux écritures ne font pas deux souvenirs.
            await magasin.UpsertMemoryAsync(user, "work", "wrk_n0", "Une autre.", null);
            await magasin.UpsertMemoryAsync(user, "work", "wrk_n1", "Une seconde.", "Repère");
        }

        var vue = await client.GetFromJsonAsync<JsonElement>($"/profile/{user}");

        Assert.Equal(2, vue.GetProperty("figures")
            .GetProperty("memoriesWritten").GetInt32());
    }

    [Fact]
    public async Task Un_profil_trop_maigre_n_a_pas_de_chiffres_a_zero_il_n_en_a_pas()
    {
        // E04 : « Des statistiques calculées sur cinq jeux détruisent la
        // crédibilité de l'écran. » L'API ne les envoie donc pas — plutôt que
        // de les envoyer en comptant sur l'écran pour les cacher. Un défaut
        // d'affichage ne peut alors pas faire fuiter un chiffre qui ment.
        using var usine = Usine();
        var client = usine.CreateClient();
        var maigre = Neuf("maigre");
        var (machine, _) = await UneMachine(client);

        await Ecrire(Ev("evt_m0", maigre, PlayerEventType.StartedGame,
            "wrk_m0", new Year(1995), machine));

        var vue = await client.GetFromJsonAsync<JsonElement>($"/profile/{maigre}");
        Assert.Equal(JsonValueKind.Null, vue.GetProperty("figures").ValueKind);

        // Le témoin (apprentissage 78) : le MÊME point d'entrée, nourri,
        // rend bien des chiffres. Sans lui, « null » se satisferait d'un
        // champ disparu ou d'une projection en panne.
        var nourri = Neuf("temoin");
        await Ecrire([.. Enumerable.Range(0, 10).Select(i => Ev(
            $"evt_t{i}", nourri, PlayerEventType.StartedGame, $"wrk_t{i}",
            new Year(1995), machine))]);
        var plein = await client.GetFromJsonAsync<JsonElement>($"/profile/{nourri}");
        Assert.Equal(JsonValueKind.Object, plein.GetProperty("figures").ValueKind);
    }

    [Fact]
    public async Task Le_nombre_de_moments_est_rendu_meme_sous_le_seuil_du_portrait()
    {
        // C'est la seule chose qu'un profil MAIGRE puisse dire de lui-même, et
        // elle a un lecteur : l'accueil propose de reprendre son histoire à
        // qui en a déjà une (E01). Sans ce compte, l'offre devrait se fonder
        // sur `figures`, qui disparaît justement sous le seuil — et un joueur
        // avec trois déclarations se verrait proposer de tout recommencer.
        using var usine = Usine();
        var client = usine.CreateClient();
        var user = Neuf("compte");
        var (machine, _) = await UneMachine(client);

        await Ecrire(
            Ev("evt_c0", user, PlayerEventType.StartedGame, "wrk_c0", new Year(1995), machine),
            Ev("evt_c1", user, PlayerEventType.StartedGame, "wrk_c1", new Year(1995), machine));

        var vue = await client.GetFromJsonAsync<JsonElement>($"/profile/{user}");

        Assert.Equal(2, vue.GetProperty("moments").GetInt32());
        // Le témoin : les chiffres, eux, sont bien absents à ce compte-là.
        Assert.Equal(JsonValueKind.Null, vue.GetProperty("figures").ValueKind);
    }

    [Fact]
    public async Task La_bande_d_activite_suit_le_seuil_du_portrait()
    {
        // Une densité dessinée sur cinq moments dit aussi peu qu'un taux
        // calculé sur cinq jeux, et pour la même raison. Elle disparaît donc
        // avec les chiffres — pas séparément, ce qui ferait deux seuils à
        // tenir.
        using var usine = Usine();
        var client = usine.CreateClient();
        var maigre = Neuf("actmaigre");
        var (machine, _) = await UneMachine(client);

        await Ecrire(Ev("evt_am", maigre, PlayerEventType.StartedGame,
            "wrk_am", new Year(1995), machine));
        var vue = await client.GetFromJsonAsync<JsonElement>($"/profile/{maigre}");
        Assert.Equal(JsonValueKind.Null, vue.GetProperty("activity").ValueKind);

        // Le témoin (78) : nourri, le MÊME point d'entrée la rend — et elle
        // porte les décennies vides, jusqu'à aujourd'hui.
        var nourri = Neuf("actnourri");
        await Ecrire([.. Enumerable.Range(0, 10).Select(i => Ev(
            $"evt_an{i}", nourri, PlayerEventType.StartedGame, $"wrk_an{i}",
            new Year(1995), machine))]);
        var pleine = (await client.GetFromJsonAsync<JsonElement>($"/profile/{nourri}"))
            .GetProperty("activity").EnumerateArray().ToList();

        Assert.Equal(1990, pleine[0].GetProperty("decade").GetInt32());
        Assert.Equal(10, pleine[0].GetProperty("moments").GetInt32());
        Assert.Contains(pleine, t => t.GetProperty("moments").GetInt32() == 0);
    }

    [Fact]
    public async Task Un_profil_vide_ne_rend_ni_chiffres_ni_debut()
    {
        // Il n'existe pas dans le parcours normal — E01 garantit un moment —
        // mais l'URL du profil est adressable, et un écran qui reçoit une
        // erreur 500 ne dit rien de plus qu'une page blanche.
        using var usine = Usine();
        var vue = await usine.CreateClient()
            .GetFromJsonAsync<JsonElement>($"/profile/{Neuf("vide")}");

        Assert.Equal(JsonValueKind.Null, vue.GetProperty("figures").ValueKind);
        Assert.Equal(JsonValueKind.Null, vue.GetProperty("opening").ValueKind);
        Assert.Equal(JsonValueKind.Null, vue.GetProperty("activity").ValueKind);
        // Zéro moment, et c'est un FAIT, pas une absence : c'est ce qui
        // permet à l'accueil de ne rien proposer plutôt que de se taire
        // faute de savoir.
        Assert.Equal(0, vue.GetProperty("moments").GetInt32());
    }

    [Fact]
    public async Task Le_debut_porte_le_NOM_de_la_machine_pas_son_identifiant()
    {
        // L'écran de lecture n'a pas le référentiel : il traverse toutes les
        // plateformes et n'en a chargé aucune. Lui rendre « plt_snes » le
        // forcerait soit à afficher un identifiant, soit à recharger le
        // catalogue pour une seule ligne.
        using var usine = Usine();
        var client = usine.CreateClient();
        var user = Neuf("debut");
        var (machine, nom) = await UneMachine(client);

        await Ecrire(Ev("evt_d0", user, PlayerEventType.StartedGame,
            "wrk_d0", new ApproximateYear(1991, 2), machine));

        var debut = (await client.GetFromJsonAsync<JsonElement>($"/profile/{user}"))
            .GetProperty("opening");

        Assert.Equal(nom, debut.GetProperty("platform").GetString());
        Assert.NotEqual(machine, debut.GetProperty("platform").GetString());
    }

    [Fact]
    public async Task La_granularite_du_debut_voyage_avec_lui()
    {
        // « vers 1991 » n'est pas « 1991 ». Rendre une année nue ferait
        // afficher à l'en-tête une date que personne n'a déclarée — le premier
        // des trois interdits des principes §2.
        using var usine = Usine();
        var client = usine.CreateClient();
        var user = Neuf("granu");
        var (machine, _) = await UneMachine(client);

        await Ecrire(Ev("evt_g0", user, PlayerEventType.StartedGame,
            "wrk_g0", new ApproximateYear(1991, 2), machine));

        var debut = (await client.GetFromJsonAsync<JsonElement>($"/profile/{user}"))
            .GetProperty("opening");

        Assert.Equal("ApproximateYear", debut.GetProperty("occurredAt")
            .GetProperty("kind").GetString());
        Assert.Equal(1991, debut.GetProperty("occurredAt")
            .GetProperty("year").GetInt32());
    }

    [Fact]
    public async Task Un_evenement_retracte_ne_compte_plus()
    {
        // §5.3 : la révision est « conservée côté système sans être
        // exposée ». Un chiffre qui compterait les déclarations retirées
        // dirait au joueur qu'il a déclaré ce qu'il vient de décocher — et
        // c'est le moment où il vérifie si le produit l'a écouté.
        using var usine = Usine();
        var client = usine.CreateClient();
        var user = Neuf("retrait");
        var (machine, _) = await UneMachine(client);

        await Ecrire([.. Enumerable.Range(0, 11).Select(i => Ev(
            $"evt_r{i}", user, PlayerEventType.StartedGame, $"wrk_r{i}",
            new Year(1995), machine))]);

        await using (var db = bdd.CreerContexte())
        {
            await new EventStore(db).MarkSupersededAsync(user, "evt_r0", "evt_r1");
        }

        var vue = await client.GetFromJsonAsync<JsonElement>($"/profile/{user}");
        Assert.Equal(10, vue.GetProperty("figures")
            .GetProperty("gamesDeclared").GetInt32());
    }
}
