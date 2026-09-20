using DigitalTwin.Domain.Temporal;

namespace DigitalTwin.Domain.Tests.Temporal;

/// <summary>
/// Item 08 — l'agrégation en épisodes.
///
/// Référence : ORDONNANCEMENT-TEMPOREL §4.4, vecteur T8, et E03 repère B —
/// « une déclaration en masse apparaît comme une bande agrégée, pas comme 12
/// points identiques, sans quoi la timeline devient illisible dès la première
/// session ».
/// </summary>
public class AggregationTests
{
    private static readonly TemporalHorizon Horizon =
        new(new DateOnly(2026, 9, 20), BirthYear: null);

    private sealed record Moment(
        string Id, TemporalValue OccurredAt, DateTime RecordedAt,
        string? BatchId) : ISortableMoment;

    private static Moment M(string id, TemporalValue when,
                            string? lot = null, int recordedDay = 1) =>
        new(id, when, new DateTime(2026, 1, recordedDay, 12, 0, 0, DateTimeKind.Utc), lot);

    // ---------- T8 : le lot forme un épisode ------------------------------

    [Fact]
    public void T8_douze_titres_declares_en_lot_forment_un_seul_episode()
    {
        var lot = Enumerable.Range(1, 12)
            .Select(i => M($"jeu{i:00}", new YearRange(1993, 1997), lot: "e02-1"))
            .ToArray();

        var tri = TimelineSorter.Sort(lot, Horizon);

        var entree = Assert.Single(tri.Entries);
        Assert.True(entree.IsEpisode);
        Assert.Equal(12, entree.Moments.Count);
    }

    [Fact]
    public void T8_l_episode_porte_l_intervalle_de_la_periode_declaree()
    {
        var lot = Enumerable.Range(1, 12)
            .Select(i => M($"jeu{i:00}", new YearRange(1993, 1997), lot: "e02-1"))
            .ToArray();

        var entree = Assert.Single(TimelineSorter.Sort(lot, Horizon).Entries);

        Assert.Equal(new DateOnly(1993, 1, 1), entree.Interval.Start);
        Assert.Equal(new DateOnly(1997, 12, 31), entree.Interval.End);
        Assert.Equal(new DateOnly(1995, 7, 2), entree.Interval.SortKey);
    }

    [Fact]
    public void T8_les_douze_moments_restent_accessibles_pour_le_depliage()
    {
        // E03 : « clic sur une bande agrégée → déplie les jeux qu'elle
        // contient ». L'agrégation est un regroupement d'affichage, elle ne
        // fait disparaître aucun moment.
        var lot = Enumerable.Range(1, 12)
            .Select(i => M($"jeu{i:00}", new YearRange(1993, 1997), lot: "e02-1"))
            .ToArray();

        var tri = TimelineSorter.Sort(lot, Horizon);

        Assert.Equal(12, tri.OnAxis.Count);
        Assert.Equal(
            lot.Select(m => m.Id).OrderBy(x => x),
            tri.Entries.SelectMany(e => e.Moments).Select(m => m.Id).OrderBy(x => x));
    }

    // ---------- ce qui ne forme PAS un épisode ----------------------------

    [Fact]
    public void Deux_lots_distincts_ne_fusionnent_pas()
    {
        // Même période, mais deux sessions de saisie : ce sont deux épisodes.
        // Fusionner effacerait la trace de deux moments de vie distincts.
        var tri = TimelineSorter.Sort(
            [M("a1", new YearRange(1993, 1997), lot: "session-1"),
             M("a2", new YearRange(1993, 1997), lot: "session-1"),
             M("b1", new YearRange(1993, 1997), lot: "session-2")],
            Horizon);

        Assert.Equal(2, tri.Entries.Count);
    }

    [Fact]
    public void Un_moment_sans_lot_ne_s_agrege_a_rien()
    {
        // Une saisie unitaire n'a pas de lot. Deux moments de même période
        // saisis séparément restent deux moments — regrouper sur la seule
        // égalité d'intervalle inventerait une session qui n'a pas eu lieu.
        var tri = TimelineSorter.Sort(
            [M("seul1", new YearRange(1993, 1997)),
             M("seul2", new YearRange(1993, 1997))],
            Horizon);

        Assert.Equal(2, tri.Entries.Count);
        Assert.All(tri.Entries, e => Assert.False(e.IsEpisode));
    }

    [Fact]
    public void Un_titre_affine_quitte_la_bande()
    {
        // La saisie en deux passes d'E02 : un tap déclare la période, puis
        // l'utilisateur précise un titre. Son intervalle change, donc il
        // sort de l'épisode — c'est exactement le comportement voulu, et
        // c'est pourquoi la règle 1 exige l'égalité d'intervalle.
        var tri = TimelineSorter.Sort(
            [M("groupe1", new YearRange(1993, 1997), lot: "e02-1"),
             M("groupe2", new YearRange(1993, 1997), lot: "e02-1"),
             M("affine", new Year(1995), lot: "e02-1")],
            Horizon);

        Assert.Equal(2, tri.Entries.Count);
        var episode = tri.Entries.Single(e => e.IsEpisode);
        Assert.Equal(2, episode.Moments.Count);
        Assert.DoesNotContain("affine", episode.Moments.Select(m => m.Id));
    }

    [Fact]
    public void Un_lot_d_un_seul_moment_n_est_pas_un_episode()
    {
        // Cas dégénéré : le lot existe mais ne contient qu'un titre. Une
        // « bande » d'un seul jeu serait un rendu trompeur.
        var tri = TimelineSorter.Sort(
            [M("unique", new YearRange(1993, 1997), lot: "e02-1")], Horizon);

        Assert.False(Assert.Single(tri.Entries).IsEpisode);
    }

    // ---------- règle 4 : jamais par-dessus la frontière du datable -------

    [Fact]
    public void Un_moment_sans_date_n_est_jamais_absorbe_par_un_episode()
    {
        // Règle 4. Le lot peut contenir des titres non datés — l'utilisateur
        // a coché « je ne sais plus » pour certains. Ils vont au tiroir, pas
        // dans la bande.
        var tri = TimelineSorter.Sort(
            [M("date1", new YearRange(1993, 1997), lot: "e02-1"),
             M("date2", new YearRange(1993, 1997), lot: "e02-1"),
             M("sansdate", Unknown.Instance, lot: "e02-1")],
            Horizon);

        var episode = Assert.Single(tri.Entries);
        Assert.Equal(2, episode.Moments.Count);
        Assert.Equal(["sansdate"], tri.Undated.Select(m => m.Id));
    }

    [Fact]
    public void Un_age_non_resolu_du_meme_lot_reste_au_tiroir()
    {
        // Même règle par l'autre porte : Age sans année de naissance n'a pas
        // d'intervalle, donc pas d'épisode possible.
        var tri = TimelineSorter.Sort(
            [M("date1", new YearRange(1993, 1997), lot: "e02-1"),
             M("date2", new YearRange(1993, 1997), lot: "e02-1"),
             M("age", new Age(12), lot: "e02-1")],
            Horizon);

        Assert.Equal(2, Assert.Single(tri.Entries).Moments.Count);
        Assert.Equal(["age"], tri.Undated.Select(m => m.Id));
    }

    // ---------- règle 3 : l'épisode se trie comme un moment unique --------

    [Fact]
    public void L_episode_se_trie_par_la_meme_cascade()
    {
        var tri = TimelineSorter.Sort(
            [M("apres", new Year(2001)),
             M("lot1", new YearRange(1993, 1997), lot: "e02-1"),
             M("lot2", new YearRange(1993, 1997), lot: "e02-1"),
             M("avant", new Year(1990))],
            Horizon);

        Assert.Equal(3, tri.Entries.Count);
        Assert.Equal(["avant", "lot1", "lot2", "apres"], tri.OnAxis.Select(m => m.Id));
    }

    [Fact]
    public void Les_moments_d_un_episode_restent_adjacents()
    {
        // Sans quoi « déplier la bande » n'aurait pas de sens : les jeux
        // qu'elle contient doivent former un bloc dans la séquence.
        var tri = TimelineSorter.Sort(
            [M("lot1", new YearRange(1993, 1997), lot: "e02-1"),
             M("intrus", new Year(1995)),
             M("lot2", new YearRange(1993, 1997), lot: "e02-1")],
            Horizon);

        var ids = tri.OnAxis.Select(m => m.Id).ToArray();
        var i1 = Array.IndexOf(ids, "lot1");
        var i2 = Array.IndexOf(ids, "lot2");
        Assert.Equal(1, Math.Abs(i2 - i1));
    }

    // ---------- invariants --------------------------------------------------

    [Fact]
    public void Invariant_l_agregation_ne_perd_aucun_moment()
    {
        var moments = new[]
        {
            M("a", new YearRange(1993, 1997), lot: "e02-1"),
            M("b", new YearRange(1993, 1997), lot: "e02-1"),
            M("c", new Year(1995)),
            M("d", Unknown.Instance, lot: "e02-1"),
            M("e", new Age(12)),
        };

        var tri = TimelineSorter.Sort(moments, Horizon);

        Assert.Equal(moments.Length, tri.OnAxis.Count + tri.Undated.Count);
        Assert.Equal(tri.OnAxis.Count, tri.Entries.Sum(e => e.Moments.Count));
    }

    [Fact]
    public void Invariant_l_agregation_ne_depend_pas_de_l_ordre_d_insertion()
    {
        var moments = new[]
        {
            M("a", new YearRange(1993, 1997), lot: "e02-1", recordedDay: 5),
            M("b", new YearRange(1993, 1997), lot: "e02-1", recordedDay: 2),
            M("c", new YearRange(1993, 1997), lot: "e02-2", recordedDay: 9),
            M("d", new Year(1995)),
        };

        var reference = TimelineSorter.Sort(moments, Horizon)
            .Entries.Select(e => string.Join("+", e.Moments.Select(m => m.Id))).ToArray();

        Assert.Equal(reference, TimelineSorter.Sort(moments.Reverse().ToArray(), Horizon)
            .Entries.Select(e => string.Join("+", e.Moments.Select(m => m.Id))));
        for (var d = 1; d < moments.Length; d++)
        {
            var permute = moments.Skip(d).Concat(moments.Take(d)).ToArray();
            Assert.Equal(reference, TimelineSorter.Sort(permute, Horizon)
                .Entries.Select(e => string.Join("+", e.Moments.Select(m => m.Id))));
        }
    }

    [Fact]
    public void Invariant_un_episode_ne_contient_que_des_intervalles_identiques()
    {
        // Constat, pas éprouvé : la règle 1 l'impose, donc l'union de la
        // règle 2 est nécessairement égale à chacun de ses membres. Ce test
        // le VÉRIFIE — si un jour la règle 1 s'assouplissait, il échouerait,
        // et ce serait le signal qu'il faut alors une vraie union.
        var tri = TimelineSorter.Sort(
            [M("a", new YearRange(1993, 1997), lot: "e02-1"),
             M("b", new YearRange(1993, 1997), lot: "e02-1"),
             M("c", new YearRange(1993, 1997), lot: "e02-1")],
            Horizon);

        var episode = Assert.Single(tri.Entries);
        foreach (var moment in episode.Moments)
        {
            var i = TemporalNormalizer.Normalize(moment.OccurredAt, Horizon)!;
            Assert.Equal(episode.Interval.Start, i.Start);
            Assert.Equal(episode.Interval.End, i.End);
        }
    }
}
