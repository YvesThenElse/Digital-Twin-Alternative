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
    public async Task Un_lot_se_remplit_geste_apres_geste_sans_perdre_les_suivants()
    {
        // LE défaut trouvé par le parcours de bout en bout. Le front envoie
        // chaque ligne dès qu'elle est cochée, sous le MÊME identifiant de
        // lot, pour que la timeline les regroupe en un épisode (§4.4).
        // Traiter un lot connu comme « déjà enregistré » ne gardait que la
        // PREMIÈRE des trente déclarations.
        //
        // Aucun test d'API ne pouvait le voir : ils envoyaient tous le lot
        // complet en un seul appel.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (plateforme, oeuvres) = await Snes(client);

        foreach (var oeuvre in oeuvres.Take(5))
        {
            var reponse = await client.PostAsJsonAsync("/declarations", Lot(
                "bat_progressif", "usr_progressif", plateforme,
                [new { workId = oeuvre }]));
            Assert.Equal(HttpStatusCode.OK, reponse.StatusCode);
        }

        var journal = await Journal("usr_progressif");
        Assert.Equal(5, journal.Count);
        Assert.All(journal, e => Assert.Equal("bat_progressif", e.BatchId));
    }

    [Fact]
    public async Task Renvoyer_une_ligne_deja_dans_le_lot_ne_la_duplique_pas()
    {
        // L'idempotence porte sur le couple (lot, cible) : un renvoi de la
        // même ligne ne crée rien, mais une ligne NOUVELLE du même lot passe.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (plateforme, oeuvres) = await Snes(client);
        var lot = Lot("bat_renvoi", "usr_renvoi", plateforme,
            [new { workId = oeuvres[0] }]);

        await client.PostAsJsonAsync("/declarations", lot);
        var seconde = await client.PostAsJsonAsync("/declarations", lot);

        var corps = await seconde.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(0, corps.GetProperty("created").GetInt32());
        Assert.True(corps.GetProperty("alreadyRecorded").GetBoolean());

        // …et la ligne suivante du même lot passe bien.
        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_renvoi", "usr_renvoi", plateforme, [new { workId = oeuvres[1] }]));
        Assert.Equal(2, (await Journal("usr_renvoi")).Count);
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

    // -------------------------------------------- « jamais joué » (§24.3)

    private async Task<JsonElement> Jugements(HttpClient c, string userId)
        => await c.GetFromJsonAsync<JsonElement>($"/declarations/{userId}");

    [Fact]
    public async Task Jamais_joue_ne_produit_aucun_evenement()
    {
        // « Je n'y ai jamais joué » n'a pas de date. Lui forger un événement
        // inventerait un moment qui n'a pas eu lieu, et la timeline
        // afficherait une partie que personne n'a jouée.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (plateforme, oeuvres) = await Snes(client);

        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_jamais", "usr_jamais", plateforme,
            [new { workId = oeuvres[0], neverPlayed = true }]));

        Assert.Empty(await Journal("usr_jamais"));
    }

    [Fact]
    public async Task Jamais_joue_se_distingue_d_un_titre_non_coche_et_survit_au_rechargement()
    {
        // LE point de l'item. Ne rien dire et dire « je n'y ai jamais joué »
        // sont deux informations différentes, et la seconde fait avancer la
        // reconstruction.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (plateforme, oeuvres) = await Snes(client);

        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_distinction", "usr_distinction", plateforme,
            [
                new { workId = oeuvres[0], neverPlayed = true },
                new { workId = oeuvres[1] },
            ]));

        // Relu par une AUTRE requête, donc un autre contexte : la distinction
        // vient de la base, pas d'un état en mémoire.
        var jugements = await Jugements(client, "usr_distinction");
        var declares = jugements.EnumerateArray()
            .ToDictionary(j => j.GetProperty("workId").GetString()!,
                          j => j.GetProperty("neverPlayed").GetBoolean());

        Assert.True(declares[oeuvres[0]]);
        // oeuvres[1] a été JOUÉ — il n'a pas de jugement « jamais joué ».
        Assert.False(declares.GetValueOrDefault(oeuvres[1]));
        // oeuvres[2] n'a RIEN reçu : absent de la liste, et c'est la
        // troisième réponse, distincte des deux autres.
        Assert.DoesNotContain(oeuvres[2], declares.Keys);
    }

    [Theory]
    [InlineData("completion", "finished")]
    [InlineData("provenance", "owned")]
    public async Task Jamais_joue_combine_a_une_autre_declaration_est_refuse(
        string champ, string valeur)
    {
        // Invariant 8 : `NeverPlayed` exclut toute autre déclaration sur la
        // même œuvre. Les garder produirait « je n'y ai jamais joué, et je
        // l'ai fini ».
        using var usine = Usine();
        var client = usine.CreateClient();
        var (plateforme, oeuvres) = await Snes(client);

        object entree = champ == "completion"
            ? new { workId = oeuvres[0], neverPlayed = true, completion = valeur }
            : new { workId = oeuvres[0], neverPlayed = true, provenance = valeur };

        var reponse = await client.PostAsJsonAsync("/declarations", Lot(
            $"bat_inv8_{champ}", $"usr_inv8_{champ}", plateforme, [entree]));

        Assert.Equal(HttpStatusCode.BadRequest, reponse.StatusCode);
        var texte = await reponse.Content.ReadAsStringAsync();
        Assert.Contains(oeuvres[0], texte, StringComparison.Ordinal);
        Assert.Contains("invariant 8", texte, StringComparison.Ordinal);
    }

    [Fact]
    public async Task Un_lot_mele_des_joues_et_des_jamais_joues()
    {
        // Le cas réel : on parcourt une liste et on tranche dans les deux
        // sens. Exiger deux appels doublerait la friction du geste central.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (plateforme, oeuvres) = await Snes(client);

        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_mele", "usr_mele", plateforme,
            [
                new { workId = oeuvres[0] },
                new { workId = oeuvres[1], neverPlayed = true },
                new { workId = oeuvres[2] },
            ]));

        Assert.Equal(2, (await Journal("usr_mele")).Count);
        var jugements = await Jugements(client, "usr_mele");
        Assert.Equal(1, jugements.GetArrayLength());
        Assert.True(jugements[0].GetProperty("neverPlayed").GetBoolean());
    }

    [Fact]
    public async Task Declarer_jamais_joue_deux_fois_ne_produit_pas_deux_lignes()
    {
        // Une déclaration est un jugement COURANT, pas un journal : la
        // réécrire est normal, la dupliquer ne l'est pas.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (plateforme, oeuvres) = await Snes(client);

        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_deux1", "usr_deux", plateforme,
            [new { workId = oeuvres[0], neverPlayed = true }]));
        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_deux2", "usr_deux", plateforme,
            [new { workId = oeuvres[0], neverPlayed = true }]));

        Assert.Equal(1, (await Jugements(client, "usr_deux")).GetArrayLength());
    }

    [Fact]
    public async Task Avoir_joue_apres_avoir_dit_jamais_joue_est_une_correction_et_non_un_refus()
    {
        // Invariant 10 : une incohérence produit un avertissement, jamais un
        // refus. Refuser obligerait le joueur à défaire avant de corriger —
        // exactement la friction que le produit combat.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (plateforme, oeuvres) = await Snes(client);

        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_corr1", "usr_corr", plateforme,
            [new { workId = oeuvres[0], neverPlayed = true }]));

        var seconde = await client.PostAsJsonAsync("/declarations", Lot(
            "bat_corr2", "usr_corr", plateforme,
            [new { workId = oeuvres[0], provenance = "owned" }]));

        Assert.Equal(HttpStatusCode.OK, seconde.StatusCode);
        var jugements = await Jugements(client, "usr_corr");
        Assert.False(jugements[0].GetProperty("neverPlayed").GetBoolean());
        Assert.Equal("Owned", jugements[0].GetProperty("provenance").GetString());
    }

    [Fact]
    public async Task Declarer_une_provenance_ne_efface_pas_un_affect_deja_posé()
    {
        // Une déclaration porte TROIS champs indépendants. Réécrire la ligne
        // entière à chaque geste effacerait ceux qu'on n'a pas touchés — et
        // « mon préféré sur Super Nintendo » disparaîtrait parce qu'on a dit
        // « je l'avais ». Aucun écran n'écrit encore l'affect : le défaut
        // serait donc resté invisible jusqu'à ce qu'il coûte cher.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (plateforme, oeuvres) = await Snes(client);

        await using (var db = bdd.CreerContexte())
        {
            db.PlayDeclarations.Add(new PlayDeclarationRow
            {
                UserId = "usr_affect",
                WorkId = oeuvres[0],
                PlatformId = plateforme,
                Affect = "Favourite",
            });
            await db.SaveChangesAsync();
        }

        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_affect", "usr_affect", plateforme,
            [new { workId = oeuvres[0], provenance = "owned" }]));

        var jugements = await Jugements(client, "usr_affect");
        Assert.Equal("Owned", jugements[0].GetProperty("provenance").GetString());
        Assert.Equal("Favourite", jugements[0].GetProperty("affect").GetString());
    }

    [Fact]
    public async Task La_purge_efface_aussi_les_declarations()
    {
        // §10.1 : une opération unique suffit à TOUT effacer. Une table
        // oubliée laisserait des données personnelles après un droit à
        // l'effacement, et rien ne le signalerait.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (plateforme, oeuvres) = await Snes(client);

        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_purge", "usr_purge", plateforme,
            [
                new { workId = oeuvres[0] },
                new { workId = oeuvres[1], neverPlayed = true },
            ]));

        await using (var db = bdd.CreerContexte())
        {
            var efface = await new EventStore(db).PurgeUserAsync("usr_purge");
            Assert.Equal(2, efface);
        }

        Assert.Empty(await Journal("usr_purge"));
        Assert.Equal(0, (await Jugements(client, "usr_purge")).GetArrayLength());
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

    [Fact]
    public async Task Une_declaration_sans_question_posee_ne_porte_aucun_affect()
    {
        // Le chemin réel du défaut : l'écran ne demande pas « ça vous a
        // marqué ? », et la base enregistrait pourtant « sans plus » sur
        // chaque ligne. Un test de session réelle l'a trouvé ; aucun des 709
        // tests ne le voyait, parce qu'aucun ne regardait un champ que
        // personne ne remplissait.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (plateforme, oeuvres) = await Snes(client);

        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_sans_affect", "usr_sans_affect", plateforme,
            [new { workId = oeuvres[0], provenance = "owned" }]));

        var jugements = await client.GetFromJsonAsync<JsonElement>(
            "/declarations/usr_sans_affect");
        var jugement = jugements[0];

        // Ce point d'entrée rend le vocabulaire du DOMAINE (« Owned »), là
        // où /selection rend celui de l'écran (« owned »). Deux vocabulaires
        // pour un même fait : c'est un écart à surveiller, pas un défaut —
        // le front ne lit que le second.
        Assert.Equal("Owned", jugement.GetProperty("provenance").GetString());
        Assert.Equal("Unstated", jugement.GetProperty("affect").GetString());
    }

    [Fact]
    public async Task Une_periode_anterieure_a_la_machine_est_refusee_en_la_nommant()
    {
        // L'écran refuse déjà « 1985 sur Super Nintendo » et **nomme** l'année
        // de sortie de la console. L'API, elle, acceptait : la règle
        // n'existait que dans le navigateur, et la couche qui fait foi était
        // la plus permissive.
        //
        // Un joueur ne peut pas avoir joué sur une machine qui n'existait
        // pas. Accepter place le moment à une position absurde sur l'axe,
        // sans que rien ne l'explique.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (plateforme, oeuvres) = await Snes(client);

        var reponse = await client.PostAsJsonAsync("/declarations", Lot(
            "bat_avant_machine", "usr_avant_machine", plateforme,
            [new { workId = oeuvres[0] }],
            periode: new { kind = "year", year = 1985 }));

        Assert.Equal(HttpStatusCode.BadRequest, reponse.StatusCode);
        var corps = await reponse.Content.ReadAsStringAsync();
        Assert.Contains("1990", corps, StringComparison.Ordinal);
    }

    [Fact]
    public async Task Une_periode_posterieure_a_la_machine_reste_acceptee()
    {
        // Le rétrogaming est un cas NOMINAL : jouer à un jeu Game Boy en
        // 2018 est le cas de validation n°1 du modèle. Seule la borne basse
        // est une impossibilité.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (plateforme, oeuvres) = await Snes(client);

        var reponse = await client.PostAsJsonAsync("/declarations", Lot(
            "bat_retro", "usr_retro", plateforme,
            [new { workId = oeuvres[0] }],
            periode: new { kind = "year", year = 2018 }));

        Assert.Equal(HttpStatusCode.OK, reponse.StatusCode);
    }

    // --------------------------------- la plateforme, pour la mesure §22.3

    [Fact]
    public async Task Chaque_evenement_porte_la_plateforme_sur_laquelle_il_a_ete_declare()
    {
        // Le lot la donne, l'API la valide… et elle était jetée. Or §22.3 B
        // engage une cible sur « testeurs ayant déclaré sur ≥ 2 plateformes »
        // : sans elle, la requête de mesure rend ZÉRO, et un zéro se lit
        // « aucune plateforme » et non « la donnée n'existe pas ».
        //
        // La déduire de l'œuvre serait pire : une seule des 221 œuvres du
        // dataset est multi-plateforme, donc la déduction « marcherait »
        // aujourd'hui et se mettrait à mentir dès que le référentiel grandit.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (plateforme, oeuvres) = await Snes(client);

        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_plateforme", "usr_plateforme", plateforme,
            [new { workId = oeuvres[0] }, new { title = "Le jeu de mon cousin" }]));

        var journal = await Journal("usr_plateforme");
        Assert.Equal(2, journal.Count);
        // Le titre SAISI aussi : c'est sur cette machine que le joueur l'a
        // cherché, et c'est ce que le référentiel doit apprendre (§3.5).
        Assert.All(journal, e => Assert.Equal(plateforme, e.PlatformId));
    }

    [Fact]
    public async Task Deux_plateformes_declarees_se_comptent_pour_deux()
    {
        // L'indicateur lui-même, joué de bout en bout. Le tester sur un seul
        // lot laisserait passer une valeur figée au premier lot reçu.
        using var usine = Usine();
        var client = usine.CreateClient();
        var plateformes = await client.GetFromJsonAsync<JsonElement>("/platforms");

        foreach (var (indice, nom) in new[] { (0, "bat_pf_a"), (1, "bat_pf_b") })
        {
            var pf = plateformes[indice].GetProperty("id").GetString()!;
            var oeuvres = await client.GetFromJsonAsync<JsonElement>($"/platforms/{pf}/works");
            await client.PostAsJsonAsync("/declarations", Lot(
                nom, "usr_deux_pf", pf,
                [new { workId = oeuvres[0].GetProperty("id").GetString()! }]));
        }

        var journal = await Journal("usr_deux_pf");
        Assert.Equal(2, journal.Select(e => e.PlatformId).Distinct().Count());
    }
}
