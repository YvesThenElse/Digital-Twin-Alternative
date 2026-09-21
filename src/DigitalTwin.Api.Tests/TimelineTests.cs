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
/// La projection de timeline, servie par l'API.
///
/// <para><b>L'API ne retrie rien.</b> Tout l'ordonnancement vit dans
/// <c>TimelineSorter</c>, validé par 387 tests du domaine ; l'endpoint le
/// rend tel quel. Ces tests vérifient d'abord cela — qu'aucune logique n'a
/// été réimplémentée en chemin —, puis rejouent les cas de validation qui
/// portent sur l'ordre.</para>
///
/// <para>Les événements sont écrits directement dans le magasin plutôt que
/// par <c>/declarations</c> : ce dernier ne produit volontairement que les
/// types de la sélection massive, et les cas de §7.1 ont besoin d'une
/// acquisition de <b>console</b> et d'une reprise. C'est le chemin de
/// LECTURE que cet item livre.</para>
/// </summary>
[Collection("postgres")]
public class TimelineTests(PostgresFixture bdd)
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
        int jourSaisie = 15, string? lot = null)
        => new(id, user, type, new EventTarget("work", cible), quand,
               new DateTime(2026, 1, jourSaisie, 12, 0, 0, DateTimeKind.Utc))
        {
            BatchId = lot,
        };

    private async Task Semer(params PlayerEvent[] evenements)
    {
        await using var db = bdd.CreerContexte();
        await new EventStore(db).AppendAsync(evenements);
    }

    private static async Task<JsonElement> Timeline(
        HttpClient c, string userId, int? naissance = null)
    {
        var url = naissance is null
            ? $"/timeline/{userId}"
            : $"/timeline/{userId}?birthYear={naissance}";
        return await c.GetFromJsonAsync<JsonElement>(url);
    }

    private static List<string> SurAxe(JsonElement timeline)
        => [.. timeline.GetProperty("entries").EnumerateArray()
            .SelectMany(e => e.GetProperty("moments").EnumerateArray())
            .Select(m => m.GetProperty("id").GetString()!)];

    private static List<string> Tiroir(JsonElement timeline)
        => [.. timeline.GetProperty("undated").EnumerateArray()
            .Select(m => m.GetProperty("id").GetString()!)];

    // ------------------------------------------- l'API ne retrie rien

    [Fact]
    public async Task L_ordre_rendu_par_l_API_est_exactement_celui_du_domaine()
    {
        // LE test de cet item. Tout ordonnancement réimplémenté dans l'API
        // divergerait du domaine sans que rien ne le signale — et c'est la
        // timeline qui bougerait d'une visite à l'autre, ce que l'utilisateur
        // ne distingue pas d'une perte de données.
        var user = "usr_miroir";
        var evenements = new[]
        {
            Ev("m1", user, PlayerEventType.StartedGame, "wrk_a", new Year(1998)),
            Ev("m2", user, PlayerEventType.StartedGame, "wrk_b", new YearRange(1993, 1997)),
            Ev("m3", user, PlayerEventType.StartedGame, "wrk_c", new ApproximateYear(1995, 2)),
            Ev("m4", user, PlayerEventType.StartedGame, "wrk_d", new ExactDate(new DateOnly(1996, 3, 4))),
            Ev("m5", user, PlayerEventType.StartedGame, "wrk_e", Unknown.Instance),
            Ev("m6", user, PlayerEventType.StartedGame, "wrk_f", new Month(1994, 7)),
        };
        await Semer(evenements);

        using var usine = Usine();
        var rendu = await Timeline(usine.CreateClient(), user);

        var attendu = TimelineSorter.Sort(evenements, new TemporalHorizon(Aujourdhui, null));
        Assert.Equal(attendu.OnAxis.Select(e => e.Id), SurAxe(rendu));
        Assert.Equal(attendu.Undated.Select(e => e.Id), Tiroir(rendu));
    }

    private static readonly DateOnly Aujourdhui = DateOnly.FromDateTime(DateTime.UtcNow);

    [Fact]
    public async Task Les_moments_sans_date_reviennent_dans_le_tiroir_et_non_melanges()
    {
        // Invariant 2 : ce qui n'a pas d'intervalle ne va pas sur l'axe.
        // Les mêler placerait « je ne sais plus » à une date, ce qui est
        // exactement ce que le type `Unknown` existe pour éviter.
        var user = "usr_tiroir";
        await Semer(
            Ev("t1", user, PlayerEventType.StartedGame, "wrk_a", new Year(1998)),
            Ev("t2", user, PlayerEventType.StartedGame, "wrk_b", Unknown.Instance),
            Ev("t3", user, PlayerEventType.StartedGame, "wrk_c", new Age(12)));

        using var usine = Usine();
        var rendu = await Timeline(usine.CreateClient(), user);

        Assert.Equal(["t1"], SurAxe(rendu));
        // `Age` non résolu rejoint le tiroir : l'année de naissance manque.
        Assert.Equal(["t2", "t3"], Tiroir(rendu).Order());
    }

    // --------------------------------------- les cas de validation, par l'API

    [Fact]
    public async Task Cas1_trente_ans_avec_une_console_revendue_puis_rachetee()
    {
        // §7.1, rejoué par l'API. Revendre puis racheter n'a rien
        // d'incohérent : c'est le parcours qui avait révélé, à l'item 13 de la
        // Phase 0, une lecture fautive de §5.4.
        var user = "usr_cas1";
        await Semer(
            Ev("e1", user, PlayerEventType.AcquiredItem, "plt_gameboy", new Year(1991)),
            Ev("e2", user, PlayerEventType.StartedGame, "wrk_tetris", new Year(1991)),
            Ev("e3", user, PlayerEventType.SoldItem, "plt_gameboy", new Year(1994)),
            Ev("e4", user, PlayerEventType.AcquiredItem, "plt_gameboy", new Year(2018)),
            Ev("e5", user, PlayerEventType.ReplayedGame, "wrk_tetris", new Year(2018)));

        using var usine = Usine();
        var rendu = await Timeline(usine.CreateClient(), user);

        Assert.Equal(["e1", "e2", "e3", "e4", "e5"], SurAxe(rendu));
        Assert.Empty(rendu.GetProperty("warnings").EnumerateArray());
    }

    [Fact]
    public async Task Cas4_renseigner_l_annee_de_naissance_recalcule_tous_les_moments()
    {
        // L'âge se stocke brut et se résout À LA LECTURE. C'est ce qui permet
        // à une année de naissance renseignée plus tard de replacer TOUS les
        // moments concernés — sans réécrire un seul événement.
        var user = "usr_cas4";
        await Semer(
            Ev("vers_12_ans", user, PlayerEventType.StartedGame, "wrk_a", new Age(12)),
            Ev("ancre_1990", user, PlayerEventType.StartedGame, "wrk_b", new Year(1990)),
            Ev("ancre_2000", user, PlayerEventType.StartedGame, "wrk_c", new Year(2000)));

        using var usine = Usine();
        var client = usine.CreateClient();

        var sans = await Timeline(client, user);
        Assert.Equal(["vers_12_ans"], Tiroir(sans));

        var avec = await Timeline(client, user, naissance: 1982);
        Assert.Empty(Tiroir(avec));
        Assert.Equal(["ancre_1990", "vers_12_ans", "ancre_2000"], SurAxe(avec));

        var corrige = await Timeline(client, user, naissance: 1976);
        Assert.Equal(["vers_12_ans", "ancre_1990", "ancre_2000"], SurAxe(corrige));
    }

    // --------------------------------------------- avertissements, pas refus

    [Fact]
    public async Task Une_incoherence_causale_revient_en_avertissement_et_ne_bloque_rien()
    {
        // Invariant 10 : une incohérence produit un avertissement, JAMAIS un
        // refus. Refuser la lecture priverait le joueur de toute sa timeline
        // à cause d'un souvenir mal daté.
        var user = "usr_incoherent";
        await Semer(
            Ev("fini_avant", user, PlayerEventType.CompletedGame, "wrk_x", new Year(1990)),
            Ev("commence_apres", user, PlayerEventType.StartedGame, "wrk_x", new Year(1995)));

        using var usine = Usine();
        var reponse = await usine.CreateClient().GetAsync($"/timeline/{user}");

        Assert.Equal(HttpStatusCode.OK, reponse.StatusCode);
        var rendu = await reponse.Content.ReadFromJsonAsync<JsonElement>();

        var avertissements = rendu.GetProperty("warnings").EnumerateArray().ToList();
        Assert.Single(avertissements);
        Assert.Equal("commence_apres",
            avertissements[0].GetProperty("expectedEarlierId").GetString());
        Assert.Equal("fini_avant",
            avertissements[0].GetProperty("expectedLaterId").GetString());
        // Et les deux moments sont bien rendus : rien n'est caché.
        Assert.Equal(2, SurAxe(rendu).Count);
    }

    // ------------------------------------------------------- les épisodes

    [Fact]
    public async Task Les_moments_d_un_meme_lot_sur_la_meme_periode_forment_un_episode()
    {
        // §4.4 : douze titres cochés d'un coup forment UN épisode. Sans
        // regroupement, l'axe montrerait une pile de points identiques — et
        // l'utilisateur croirait à douze moments distincts.
        var user = "usr_episode_api";
        await Semer(
            Ev("l1", user, PlayerEventType.StartedGame, "wrk_a", new Year(1995), lot: "bat_1"),
            Ev("l2", user, PlayerEventType.StartedGame, "wrk_b", new Year(1995), lot: "bat_1"),
            Ev("l3", user, PlayerEventType.StartedGame, "wrk_c", new Year(1995), lot: "bat_1"),
            Ev("seul", user, PlayerEventType.StartedGame, "wrk_d", new Year(1999)));

        using var usine = Usine();
        var rendu = await Timeline(usine.CreateClient(), user);

        var entrees = rendu.GetProperty("entries").EnumerateArray().ToList();
        Assert.Equal(2, entrees.Count);
        Assert.True(entrees[0].GetProperty("isEpisode").GetBoolean());
        Assert.Equal(3, entrees[0].GetProperty("moments").GetArrayLength());
        Assert.False(entrees[1].GetProperty("isEpisode").GetBoolean());
    }

    [Fact]
    public async Task Deux_moments_de_lots_differents_ne_forment_pas_un_episode()
    {
        // Regrouper sur la seule égalité d'intervalle inventerait une session
        // qui n'a pas eu lieu.
        var user = "usr_deux_lots";
        await Semer(
            Ev("a", user, PlayerEventType.StartedGame, "wrk_a", new Year(1995), lot: "bat_a"),
            Ev("b", user, PlayerEventType.StartedGame, "wrk_b", new Year(1995), lot: "bat_b"));

        using var usine = Usine();
        var rendu = await Timeline(usine.CreateClient(), user);

        Assert.Equal(2, rendu.GetProperty("entries").GetArrayLength());
        Assert.All(rendu.GetProperty("entries").EnumerateArray(),
            e => Assert.False(e.GetProperty("isEpisode").GetBoolean()));
    }

    // ------------------------------------------------------- ce qui est rendu

    [Fact]
    public async Task Chaque_moment_porte_sa_cible_sa_confiance_et_sa_valeur_temporelle()
    {
        // L'écran doit pouvoir afficher l'incertitude (item 10) : un rendu
        // qui n'expose qu'une date perdrait la granularité déclarée, et
        // « vers 1995 » s'afficherait comme « 1995 ».
        var user = "usr_rendu";
        await Semer(Ev("r1", user, PlayerEventType.StartedGame, "wrk_a",
                       new ApproximateYear(1995, 2)));

        using var usine = Usine();
        var rendu = await Timeline(usine.CreateClient(), user);

        var moment = rendu.GetProperty("entries")[0].GetProperty("moments")[0];
        Assert.Equal("StartedGame", moment.GetProperty("type").GetString());
        Assert.Equal("work", moment.GetProperty("targetKind").GetString());
        Assert.Equal("wrk_a", moment.GetProperty("targetId").GetString());
        Assert.Equal("Low", moment.GetProperty("confidence").GetString());

        var quand = moment.GetProperty("occurredAt");
        Assert.Equal("ApproximateYear", quand.GetProperty("kind").GetString());
        Assert.Equal(1995, quand.GetProperty("year").GetInt32());
        Assert.Equal(2, quand.GetProperty("margin").GetInt32());
    }

    [Fact]
    public async Task Un_moment_date_par_l_age_reste_un_age_meme_une_fois_place_sur_l_axe()
    {
        // MODELE §3, règle 3 : `Age` se stocke BRUT. L'horizon le RÉSOUT pour
        // le placer, il ne le remplace pas. L'écran doit pouvoir écrire
        // « vers mes 12 ans » — afficher « 1994 » dirait une précision que le
        // joueur n'a jamais déclarée, et l'année changerait si l'année de
        // naissance était corrigée.
        var user = "usr_age_rendu";
        await Semer(Ev("a1", user, PlayerEventType.StartedGame, "wrk_a", new Age(12)));

        using var usine = Usine();
        var rendu = await Timeline(usine.CreateClient(), user, naissance: 1982);

        // Placé sur l'axe, donc résolu…
        Assert.Equal(["a1"], SurAxe(rendu));

        // …et pourtant rendu tel qu'il a été déclaré.
        var quand = rendu.GetProperty("entries")[0]
            .GetProperty("moments")[0].GetProperty("occurredAt");
        Assert.Equal("Age", quand.GetProperty("kind").GetString());
        Assert.Equal(12, quand.GetProperty("age").GetInt32());
    }

    [Fact]
    public async Task Chaque_entree_porte_l_intervalle_qui_la_situe()
    {
        // La bande d'époque de E03 se dessine à partir de lui. Sans
        // intervalle, l'écran devrait le recalculer — donc réimplémenter la
        // normalisation.
        var user = "usr_intervalle";
        await Semer(Ev("i1", user, PlayerEventType.StartedGame, "wrk_a", new Year(1994)));

        using var usine = Usine();
        var rendu = await Timeline(usine.CreateClient(), user);

        var intervalle = rendu.GetProperty("entries")[0].GetProperty("interval");
        Assert.Equal("1994-01-01", intervalle.GetProperty("start").GetString());
        Assert.Equal("1994-12-31", intervalle.GetProperty("end").GetString());
    }

    [Fact]
    public async Task Une_timeline_vide_n_est_pas_une_erreur()
    {
        // Un utilisateur qui n'a rien déclaré a une timeline vide, pas une
        // absence de timeline. Rendre 404 ferait croire à un compte inexistant.
        using var usine = Usine();
        var reponse = await usine.CreateClient().GetAsync("/timeline/usr_personne");

        Assert.Equal(HttpStatusCode.OK, reponse.StatusCode);
        var rendu = await reponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Empty(rendu.GetProperty("entries").EnumerateArray());
        Assert.Empty(rendu.GetProperty("undated").EnumerateArray());
    }
}
