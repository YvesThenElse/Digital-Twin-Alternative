using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using DigitalTwin.Api.Health;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace DigitalTwin.Api.Tests;

/// <summary>
/// L'état de la sélection, relu.
///
/// <para><b>L'écran ne relisait rien.</b> Un rechargement montrait toutes les
/// lignes décochées alors que les déclarations étaient en base : le
/// testeur en concluait qu'il avait tout perdu — le pire mensonge qu'un
/// écran puisse faire sur un travail de saisie de deux heures.</para>
///
/// <para>La source de vérité du « j'y ai joué » est le <b>journal</b>, pas la
/// table des jugements : cocher une ligne n'écrit aucune déclaration
/// permanente. Confondre les deux est exactement ce qui faisait rendre zéro
/// à la mesure des plateformes (§22.3 B).</para>
/// </summary>
[Collection("postgres")]
public class SelectionEtatTests(PostgresFixture bdd)
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
        IEnumerable<object> entrees)
        => new
        {
            batchId, userId, platformId = plateforme,
            period = new { kind = "year", year = 1995 },
            entries = entrees,
        };

    private static async Task<JsonElement> Etat(HttpClient c, string user, string plateforme)
        => await c.GetFromJsonAsync<JsonElement>($"/selection/{user}/{plateforme}");

    private static JsonElement Ligne(JsonElement etat, string workId)
        => etat.EnumerateArray().Single(l => l.GetProperty("workId").GetString() == workId);

    // ------------------------------------------------------------- relire

    [Fact]
    public async Task Un_titre_coche_se_relit_comme_declare()
    {
        using var usine = Usine();
        var client = usine.CreateClient();
        var (pf, oeuvres) = await Snes(client);

        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_relu", "usr_relu", pf, [new { workId = oeuvres[0] }]));

        var etat = await Etat(client, "usr_relu", pf);
        Assert.True(Ligne(etat, oeuvres[0]).GetProperty("played").GetBoolean());
    }

    [Fact]
    public async Task Un_titre_jamais_coche_n_apparait_pas()
    {
        // L'état ne liste QUE ce dont l'utilisateur s'est prononcé. Rendre
        // 221 lignes dont 220 vides ferait payer la relecture au chargement
        // de chaque écran, pour ne rien dire.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (pf, oeuvres) = await Snes(client);

        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_etat_partiel", "usr_etat_partiel", pf, [new { workId = oeuvres[0] }]));

        var etat = await Etat(client, "usr_etat_partiel", pf);
        Assert.Equal(1, etat.GetArrayLength());
        Assert.DoesNotContain(oeuvres[1], etat.ToString(), StringComparison.Ordinal);
    }

    [Fact]
    public async Task L_etat_ne_montre_que_la_plateforme_demandee()
    {
        // Sinon l'écran Super Nintendo cocherait des lignes d'après des
        // déclarations faites sur Game Boy.
        using var usine = Usine();
        var client = usine.CreateClient();
        var plateformes = await client.GetFromJsonAsync<JsonElement>("/platforms");
        var a = plateformes[0].GetProperty("id").GetString()!;
        var b = plateformes[1].GetProperty("id").GetString()!;
        var oeuvresA = await client.GetFromJsonAsync<JsonElement>($"/platforms/{a}/works");
        var oeuvresB = await client.GetFromJsonAsync<JsonElement>($"/platforms/{b}/works");

        await client.PostAsJsonAsync("/declarations", Lot("bat_a", "usr_deux_ecrans", a,
            [new { workId = oeuvresA[0].GetProperty("id").GetString()! }]));
        await client.PostAsJsonAsync("/declarations", Lot("bat_b", "usr_deux_ecrans", b,
            [new { workId = oeuvresB[0].GetProperty("id").GetString()! }]));

        Assert.Equal(1, (await Etat(client, "usr_deux_ecrans", a)).GetArrayLength());
        Assert.Equal(1, (await Etat(client, "usr_deux_ecrans", b)).GetArrayLength());
    }

    [Fact]
    public async Task L_etat_d_un_profil_vierge_est_une_liste_vide_et_non_une_erreur()
    {
        using var usine = Usine();
        var client = usine.CreateClient();
        var (pf, _) = await Snes(client);

        Assert.Equal(0, (await Etat(client, "usr_jamais_vu", pf)).GetArrayLength());
    }

    // -------------------------------------------------- ce que la passe 2 ajoute

    [Fact]
    public async Task L_achevement_se_relit()
    {
        using var usine = Usine();
        var client = usine.CreateClient();
        var (pf, oeuvres) = await Snes(client);

        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_fini", "usr_etat_fini", pf,
            [new { workId = oeuvres[0], completion = "finished" }]));

        var ligne = Ligne(await Etat(client, "usr_etat_fini", pf), oeuvres[0]);
        Assert.Equal("finished", ligne.GetProperty("completion").GetString());
    }

    [Fact]
    public async Task Un_abandon_ne_se_relit_pas_comme_un_achevement()
    {
        // Les deux produisent un événement distinct ; les confondre
        // afficherait « fini » sur un jeu que le joueur a laissé tomber.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (pf, oeuvres) = await Snes(client);

        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_abandon", "usr_etat_abandon", pf,
            [new { workId = oeuvres[0], completion = "abandoned" }]));

        var ligne = Ligne(await Etat(client, "usr_etat_abandon", pf), oeuvres[0]);
        Assert.Equal("abandoned", ligne.GetProperty("completion").GetString());
    }

    [Fact]
    public async Task La_provenance_se_relit()
    {
        using var usine = Usine();
        var client = usine.CreateClient();
        var (pf, oeuvres) = await Snes(client);

        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_prov", "usr_prov", pf,
            [new { workId = oeuvres[0], provenance = "borrowed" }]));

        var ligne = Ligne(await Etat(client, "usr_prov", pf), oeuvres[0]);
        Assert.Equal("borrowed", ligne.GetProperty("provenance").GetString());
    }

    [Fact]
    public async Task Un_titre_sans_affinage_se_relit_sans_valeur_inventee()
    {
        // `null` et « toujours en cours » ne sont pas la même chose : l'un dit
        // qu'on ne s'est pas prononcé, l'autre qu'on y joue encore.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (pf, oeuvres) = await Snes(client);

        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_nu", "usr_nu", pf, [new { workId = oeuvres[0] }]));

        var ligne = Ligne(await Etat(client, "usr_nu", pf), oeuvres[0]);
        Assert.Equal(JsonValueKind.Null, ligne.GetProperty("completion").ValueKind);
        Assert.Equal(JsonValueKind.Null, ligne.GetProperty("provenance").ValueKind);
    }

    [Fact]
    public async Task Jamais_joue_se_relit_sans_etre_confondu_avec_joue()
    {
        // §24.3 : « il ne l'a pas joué » n'est pas « il ne s'est pas
        // prononcé ». L'écran doit pouvoir montrer la différence.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (pf, oeuvres) = await Snes(client);

        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_jamais", "usr_jamais_etat", pf,
            [new { workId = oeuvres[0], neverPlayed = true }]));

        var ligne = Ligne(await Etat(client, "usr_jamais_etat", pf), oeuvres[0]);
        Assert.True(ligne.GetProperty("neverPlayed").GetBoolean());
        Assert.False(ligne.GetProperty("played").GetBoolean());
    }

    [Fact]
    public async Task Toujours_en_cours_se_relit_comme_une_reponse()
    {
        // §4.6 : « commencé, jamais refermé — il pourrait y revenir ». La
        // chip revenait VIERGE au rechargement : le traducteur traitait la
        // réponse comme une absence, et le testeur voyait disparaître ce
        // qu'il venait de dire.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (pf, oeuvres) = await Snes(client);

        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_encours_etat", "usr_encours_etat", pf,
            [new { workId = oeuvres[0], completion = "stillPlaying" }]));

        var ligne = Ligne(await Etat(client, "usr_encours_etat", pf), oeuvres[0]);
        Assert.Equal("stillPlaying", ligne.GetProperty("completion").GetString());
        Assert.True(ligne.GetProperty("played").GetBoolean());
    }

    [Fact]
    public async Task Un_titre_simplement_coche_ne_se_relit_pas_en_cours()
    {
        // LE témoin de l'item, et la raison pour laquelle le journal ne
        // suffisait pas : un jeu coché et un jeu déclaré « en cours »
        // produisent EXACTEMENT les mêmes événements. Sans jugement, les
        // deux se relisaient pareil — et « il n'a rien dit » devenait « il y
        // joue encore ».
        using var usine = Usine();
        var client = usine.CreateClient();
        var (pf, oeuvres) = await Snes(client);

        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_coche_simple", "usr_coche_simple", pf,
            [new { workId = oeuvres[0] }]));

        var ligne = Ligne(await Etat(client, "usr_coche_simple", pf), oeuvres[0]);
        Assert.Equal(JsonValueKind.Null, ligne.GetProperty("completion").ValueKind);
    }

    [Fact]
    public async Task Une_fermeture_referme_toujours_en_cours()
    {
        // Sans cela, « fini » laisserait « en cours » derrière lui : l'écran
        // relirait les deux, et le plus fort — l'événement daté — masquerait
        // un jugement contradictoire resté en base.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (pf, oeuvres) = await Snes(client);

        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_ferme_1", "usr_ferme_encours", pf,
            [new { workId = oeuvres[0], completion = "stillPlaying" }]));
        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_ferme_2", "usr_ferme_encours", pf,
            [new { workId = oeuvres[0], completion = "finished" }]));

        var ligne = Ligne(await Etat(client, "usr_ferme_encours", pf), oeuvres[0]);
        Assert.Equal("finished", ligne.GetProperty("completion").GetString());

        // Et le JUGEMENT lui-même ne dit plus « encore ». L'état relu ne
        // suffit pas à le prouver : l'événement daté y masque le jugement
        // quoi qu'il contienne. Un « en cours » resté en base serait donc
        // invisible jusqu'au jour où un écran de Phase 3 le lirait.
        var jugements = await client.GetFromJsonAsync<JsonElement>(
            "/declarations/usr_ferme_encours");
        var jugement = jugements.EnumerateArray()
            .Single(j => j.GetProperty("workId").GetString() == oeuvres[0]);
        Assert.False(jugement.GetProperty("stillPlaying").GetBoolean());
    }

    [Fact]
    public async Task Toujours_en_cours_leve_jamais_joue()
    {
        // Invariant 10 : une correction, jamais un refus. Un testeur qui
        // écarte un titre puis se reprend doit retrouver sa réponse, pas un
        // refus.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (pf, oeuvres) = await Snes(client);

        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_jamais_puis", "usr_jamais_puis_encours", pf,
            [new { workId = oeuvres[0], neverPlayed = true }]));
        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_puis_encours", "usr_jamais_puis_encours", pf,
            [new { workId = oeuvres[0], completion = "stillPlaying" }]));

        var ligne = Ligne(await Etat(client, "usr_jamais_puis_encours", pf), oeuvres[0]);
        Assert.False(ligne.GetProperty("neverPlayed").GetBoolean());
        Assert.Equal("stillPlaying", ligne.GetProperty("completion").GetString());
    }

    // ------------------------------------- affiner APRÈS avoir coché

    [Fact]
    public async Task Affiner_une_ligne_deja_cochee_dans_le_meme_lot_est_enregistre()
    {
        // L'idempotence portait sur le couple (lot, cible) : la ligne étant
        // déjà dans le lot, l'événement d'achèvement était SILENCIEUSEMENT
        // jeté. L'utilisateur cochait « fini » et rien ne se passait.
        //
        // Elle porte désormais sur l'identifiant d'événement, qui encode
        // déjà (lot, cible, type) — plus fin, et sans concept en double.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (pf, oeuvres) = await Snes(client);

        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_affine", "usr_affine", pf, [new { workId = oeuvres[0] }]));
        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_affine", "usr_affine", pf,
            [new { workId = oeuvres[0], completion = "finished" }]));

        var ligne = Ligne(await Etat(client, "usr_affine", pf), oeuvres[0]);
        Assert.True(ligne.GetProperty("played").GetBoolean());
        Assert.Equal("finished", ligne.GetProperty("completion").GetString());
    }

    [Fact]
    public async Task Rejouer_le_meme_lot_a_l_identique_ne_duplique_toujours_rien()
    {
        // La raison d'être de l'idempotence. La rendre plus fine ne doit pas
        // la rendre inopérante.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (pf, oeuvres) = await Snes(client);

        var lot = Lot("bat_rejeu", "usr_rejeu", pf,
            [new { workId = oeuvres[0], completion = "finished" }]);
        await client.PostAsJsonAsync("/declarations", lot);
        var second = await client.PostAsJsonAsync("/declarations", lot);

        var corps = await second.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(0, corps.GetProperty("created").GetInt32());
        Assert.True(corps.GetProperty("alreadyRecorded").GetBoolean());
    }

    // ------------------------------------------------ la rétractation

    [Fact]
    public async Task Decocher_un_titre_le_retire_de_l_etat()
    {
        // Le geste le plus fréquent de l'écran — le dépôt le dit lui-même —
        // ne quittait pas le navigateur. Depuis que l'état est relu, la
        // correction se défaisait sous les yeux de l'utilisateur au premier
        // rechargement.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (pf, oeuvres) = await Snes(client);

        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_retract", "usr_retract", pf, [new { workId = oeuvres[0] }]));
        Assert.True(Ligne(await Etat(client, "usr_retract", pf), oeuvres[0])
            .GetProperty("played").GetBoolean());

        var reponse = await client.PostAsJsonAsync("/declarations/retract", new
        {
            userId = "usr_retract", platformId = pf, workId = oeuvres[0],
        });

        Assert.Equal(HttpStatusCode.OK, reponse.StatusCode);
        Assert.Empty((await Etat(client, "usr_retract", pf)).EnumerateArray());
    }

    [Fact]
    public async Task Decocher_CONSERVE_l_evenement_en_base()
    {
        // §5.3 : « la révision est conservée côté système sans être
        // exposée ». Le journal est en ajout seul — rien n'en sort, on pose
        // un marqueur. Effacer réellement serait réécrire une histoire.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (pf, oeuvres) = await Snes(client);

        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_trace", "usr_trace", pf, [new { workId = oeuvres[0] }]));
        await client.PostAsJsonAsync("/declarations/retract", new
        {
            userId = "usr_trace", platformId = pf, workId = oeuvres[0],
        });

        await using var db = bdd.CreerContexte();
        var lignes = db.PlayerEvents.Where(e => e.UserId == "usr_trace").ToList();
        Assert.Single(lignes);
        Assert.NotNull(lignes[0].SupersededByEventId);
    }

    [Fact]
    public async Task Decocher_retire_aussi_l_affinage()
    {
        // Sinon « je l'avais » survivrait à un jeu qu'on ne déclare plus :
        // un jugement orphelin, que plus aucun écran ne saurait montrer.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (pf, oeuvres) = await Snes(client);

        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_aff", "usr_aff_retract", pf,
            [new { workId = oeuvres[0], provenance = "owned", completion = "finished" }]));
        await client.PostAsJsonAsync("/declarations/retract", new
        {
            userId = "usr_aff_retract", platformId = pf, workId = oeuvres[0],
        });

        Assert.Empty((await Etat(client, "usr_aff_retract", pf)).EnumerateArray());
    }

    [Fact]
    public async Task Retirer_un_jamais_joue_le_ramene_a_l_absence_d_avis()
    {
        // E02 : une ligne marquée « jamais joué » « s'estompe sans
        // disparaître, POUR RESTER CORRIGEABLE ». Sans ce chemin, un
        // balayage par erreur serait définitif — sur une déclaration que le
        // joueur n'a pas faite.
        //
        // Et « pas prononcé » doit être ATTEIGNABLE : le ramener à « joué »
        // ferait dire au profil l'inverse de ce qu'il disait, au lieu de le
        // rendre muet (principes §6 bis).
        using var usine = Usine();
        var client = usine.CreateClient();
        var (pf, oeuvres) = await Snes(client);

        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_retire_jamais", "usr_retire_jamais", pf,
            [new { workId = oeuvres[0], neverPlayed = true }]));

        var reponse = await client.PostAsJsonAsync("/declarations/retract", new
        {
            userId = "usr_retire_jamais", platformId = pf, workId = oeuvres[0],
        });
        Assert.Equal(HttpStatusCode.OK, reponse.StatusCode);

        // La ligne disparaît de l'état : plus aucun avis n'est porté sur ce
        // titre. « Jamais joué » à `false` dirait la même chose, mais seule
        // l'absence de ligne dit qu'il n'y a RIEN — pas même une ligne de
        // jugement vide.
        Assert.Equal(0, (await Etat(client, "usr_retire_jamais", pf)).GetArrayLength());
    }

    [Fact]
    public async Task Decocher_ce_qui_n_a_jamais_ete_declare_ne_casse_rien()
    {
        // Un double tap, un renvoi réseau : le geste doit être rejouable.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (pf, oeuvres) = await Snes(client);

        var reponse = await client.PostAsJsonAsync("/declarations/retract", new
        {
            userId = "usr_jamais_declare", platformId = pf, workId = oeuvres[0],
        });

        Assert.Equal(HttpStatusCode.OK, reponse.StatusCode);
    }

    [Fact]
    public async Task Decocher_ne_touche_pas_aux_AUTRES_titres()
    {
        using var usine = Usine();
        var client = usine.CreateClient();
        var (pf, oeuvres) = await Snes(client);

        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_voisin", "usr_voisin", pf,
            [new { workId = oeuvres[0] }, new { workId = oeuvres[1] }]));
        await client.PostAsJsonAsync("/declarations/retract", new
        {
            userId = "usr_voisin", platformId = pf, workId = oeuvres[0],
        });

        var etat = await Etat(client, "usr_voisin", pf);
        Assert.Equal(1, etat.GetArrayLength());
        Assert.True(Ligne(etat, oeuvres[1]).GetProperty("played").GetBoolean());
    }

    [Fact]
    public async Task Un_titre_retracte_disparait_aussi_de_la_timeline()
    {
        // « Conservée côté système SANS ÊTRE EXPOSÉE » : le moment ne doit
        // plus paraître sur l'axe, sinon la correction n'en est pas une.
        using var usine = Usine();
        var client = usine.CreateClient();
        var (pf, oeuvres) = await Snes(client);

        await client.PostAsJsonAsync("/declarations", Lot(
            "bat_axe", "usr_axe_retract", pf, [new { workId = oeuvres[0] }]));
        await client.PostAsJsonAsync("/declarations/retract", new
        {
            userId = "usr_axe_retract", platformId = pf, workId = oeuvres[0],
        });

        var axe = await client.GetFromJsonAsync<JsonElement>("/timeline/usr_axe_retract");
        Assert.Equal(0, axe.GetProperty("entries").GetArrayLength());
    }
}
