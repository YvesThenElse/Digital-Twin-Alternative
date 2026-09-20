using DigitalTwin.Domain.Temporal;

namespace DigitalTwin.Domain.Tests.Temporal;

/// <summary>
/// Item 05 — la cascade de départage.
///
/// Référence : ORDONNANCEMENT-TEMPOREL §4.1, et les vecteurs T1, T2, T3, T11
/// de §10.
/// </summary>
public class TimelineSorterTests
{
    private static readonly TemporalHorizon Horizon =
        new(new DateOnly(2026, 9, 20), BirthYear: null);

    /// <summary>Double de test minimal : ce que le tri exige, rien de plus.</summary>
    private sealed record Moment(
        string Id, TemporalValue OccurredAt, DateTime RecordedAt) : ISortableMoment;

    private static Moment M(string id, TemporalValue when, int recordedDay = 1) =>
        new(id, when, new DateTime(2026, 1, recordedDay, 12, 0, 0, DateTimeKind.Utc));

    private static IReadOnlyList<string> OrdreDe(params Moment[] moments) =>
        TimelineSorter.Sort(moments, Horizon).OnAxis.Select(m => m.Id).ToArray();

    // ---------- vecteurs de §10 -------------------------------------------

    [Fact]
    public void T1_deux_annees_disjointes_s_ordonnent_sans_departage()
    {
        Assert.Equal(["a", "b"], OrdreDe(M("b", new Year(1993)), M("a", new Year(1991))));
    }

    [Fact]
    public void T2_a_milieu_egal_la_bande_s_ouvre_au_dessus_du_point_qu_elle_contient()
    {
        // Range(1993–1997) et Year(1995) ont le MÊME milieu — 2 juillet 1995.
        // Le critère 2 départage : la période commence plus tôt, donc au-dessus.
        var ordre = OrdreDe(
            M("annee", new Year(1995)),
            M("bande", new YearRange(1993, 1997)));

        Assert.Equal(["bande", "annee"], ordre);
    }

    [Fact]
    public void T3_a_milieu_egal_l_approximation_precede_l_annee_precise()
    {
        // ApproximateYear(1994±2) et Year(1994) ont aussi le même milieu.
        // Deux rendus distincts — halo contre point creux — pour des
        // intervalles imbriqués.
        var ordre = OrdreDe(
            M("precise", new Year(1994)),
            M("vers", new ApproximateYear(1994, 2)));

        Assert.Equal(["vers", "precise"], ordre);
    }

    [Fact]
    public void T11_le_tri_ne_depend_pas_de_l_ordre_d_insertion()
    {
        // « Un tri qui dépend de l'ordre d'insertion produit une timeline qui
        // bouge d'une visite à l'autre — un utilisateur ne distingue pas cela
        // d'une perte de données. »
        //
        // On ne compare pas deux exécutions identiques : on PERTURBE l'entrée
        // et on exige la même sortie.
        var moments = new[]
        {
            M("a", new Year(1991)),
            M("b", new YearRange(1993, 1997)),
            M("c", new Year(1995)),
            M("d", new ApproximateYear(1994, 2)),
            M("e", new Year(1994)),
            M("f", new ExactDate(new DateOnly(1994, 7, 2))),
            M("g", new YearRange(1994, 1994)),
        };

        var reference = OrdreDe(moments);

        foreach (var permutation in Permutations(moments))
        {
            Assert.Equal(reference, OrdreDe(permutation));
        }
    }

    // ---------- la cascade, critère par critère ---------------------------

    [Fact]
    public void Critere_1_le_point_representatif_ordonne_d_abord()
    {
        Assert.Equal(["tot", "tard"],
            OrdreDe(M("tard", new Year(2000)), M("tot", new Year(1990))));
    }

    [Fact]
    public void Critere_1_janvier_1994_precede_l_annee_1994()
    {
        // ⚠️ Ce test s'appelait « Critere_3 » et prétendait éprouver la
        // largeur. C'était faux : janvier 1994 a pour milieu le 16 janvier,
        // l'année 1994 le 2 juillet. Le critère 1 tranche donc, et la largeur
        // n'est jamais consultée.
        //
        // Révélé par une mutation qui aurait dû tuer ce test et ne l'a pas
        // fait — inverser le sens de la largeur ne change rien ici.
        var ordre = OrdreDe(
            M("annee", new Year(1994)),
            M("mois", new Month(1994, 1)));

        Assert.Equal(["mois", "annee"], ordre);
    }

    [Fact]
    public void Le_critere_3_n_est_pas_atteignable_avec_les_sept_variantes()
    {
        // Le milieu vaut `début + largeur / 2`. À début ET milieu égaux, les
        // largeurs ne peuvent donc différer que de 1 — ce qu'aucune des sept
        // variantes ne produit : toutes celles qui commencent un 1er janvier
        // finissent un 31 décembre.
        //
        // Le critère 3 est défensif, pas opérant. Ce test le CONSTATE plutôt
        // que de prétendre l'éprouver : si une huitième variante le rendait
        // atteignable un jour, il échouerait, et c'est exactement le signal
        // qu'on voudrait alors recevoir.
        var valeurs = new TemporalValue[]
        {
            new Year(1994), new YearRange(1994, 1994), new Month(1994, 1),
            new Month(1994, 12), new YearRange(1993, 1997),
            new ApproximateYear(1995, 2), new ExactDate(new DateOnly(1994, 7, 2)),
        };

        var cles = valeurs
            .Select(v => TemporalNormalizer.Normalize(v, Horizon)!)
            .Select(i => (i.SortKey, i.Start, i.WidthInDays))
            .ToArray();

        foreach (var a in cles)
        {
            foreach (var b in cles)
            {
                if (a.SortKey == b.SortKey && a.Start == b.Start)
                {
                    Assert.Equal(a.WidthInDays, b.WidthInDays);
                }
            }
        }
    }

    [Fact]
    public void Critere_5_a_intervalle_identique_le_plus_anciennement_saisi_vient_d_abord()
    {
        // Même valeur temporelle des deux côtés : seul RecordedAt départage.
        var ordre = OrdreDe(
            M("saisi_apres", new Year(1994), recordedDay: 20),
            M("saisi_avant", new Year(1994), recordedDay: 3));

        Assert.Equal(["saisi_avant", "saisi_apres"], ordre);
    }

    [Fact]
    public void Critere_6_l_identifiant_ferme_le_dernier_cas()
    {
        // Tout est identique, jusqu'à l'horodatage de saisie. Sans ce dernier
        // critère, l'ordre dépendrait de l'implémentation du tri.
        var ordre = OrdreDe(
            M("zzz", new Year(1994), recordedDay: 5),
            M("aaa", new Year(1994), recordedDay: 5));

        Assert.Equal(["aaa", "zzz"], ordre);
    }

    // ---------- la zone sans date (§6) -------------------------------------

    [Fact]
    public void Les_moments_sans_date_sortent_de_l_axe()
    {
        // Invariant 2 : Unknown n'est jamais projeté sur un axe temporel.
        var tri = TimelineSorter.Sort(
            [M("date", new Year(1994)),
             M("inconnu", Unknown.Instance),
             M("age", new Age(12))],
            Horizon);

        Assert.Equal(["date"], tri.OnAxis.Select(m => m.Id));
        Assert.Equal(2, tri.Undated.Count);
    }

    [Fact]
    public void Le_tiroir_montre_le_plus_recemment_saisi_en_premier()
    {
        // §6 : « le plus récemment déclaré d'abord. Il n'y a pas d'autre axe
        // disponible, et c'est celui qui sert : ce qu'on vient de saisir est
        // ce qu'on se rappelle le mieux dater. »
        var tri = TimelineSorter.Sort(
            [M("vieux", Unknown.Instance, recordedDay: 2),
             M("recent", Unknown.Instance, recordedDay: 25)],
            Horizon);

        Assert.Equal(["recent", "vieux"], tri.Undated.Select(m => m.Id));
    }

    [Fact]
    public void Le_tiroir_departage_par_identifiant_a_saisie_simultanee()
    {
        // Trou révélé par une mutation annoncée survivante, et qui l'a été :
        // rien ne vérifiait l'ordre du tiroir quand deux moments partagent
        // leur horodatage de saisie. Le tiroir est pourtant lui aussi un
        // écran où l'on revient, et le déterminisme y vaut autant que sur
        // l'axe (§4.1, critère 6).
        var tri = TimelineSorter.Sort(
            [M("zzz", Unknown.Instance, recordedDay: 7),
             M("aaa", Unknown.Instance, recordedDay: 7)],
            Horizon);

        Assert.Equal(["aaa", "zzz"], tri.Undated.Select(m => m.Id));
    }

    [Fact]
    public void Une_periode_ouverte_se_place_sur_sa_borne_connue()
    {
        // §2.3 vu depuis le tri : la période ouverte s'étend jusqu'à
        // aujourd'hui mais se range à 2001, donc AVANT une année 2010 dont le
        // milieu est pourtant plus proche du sien.
        var ordre = OrdreDe(
            M("plus_tard", new Year(2010)),
            M("ouverte", new YearRange(2001, null)));

        Assert.Equal(["ouverte", "plus_tard"], ordre);
    }

    // ---------- invariants --------------------------------------------------

    [Fact]
    public void Invariant_le_tri_conserve_tous_les_moments()
    {
        var moments = new[]
        {
            M("a", new Year(1991)), M("b", Unknown.Instance),
            M("c", new Age(12)), M("d", new YearRange(2001, null)),
            M("e", new ExactDate(new DateOnly(1994, 3, 15))),
        };

        var tri = TimelineSorter.Sort(moments, Horizon);

        Assert.Equal(moments.Length, tri.OnAxis.Count + tri.Undated.Count);
        Assert.Equal(
            moments.Select(m => m.Id).OrderBy(x => x),
            tri.OnAxis.Concat(tri.Undated).Select(m => m.Id).OrderBy(x => x));
    }

    [Fact]
    public void Invariant_une_collection_vide_ne_casse_pas_le_tri()
    {
        // Le cas dégénéré que l'item 02 a appris à ne pas oublier.
        var tri = TimelineSorter.Sort(Array.Empty<Moment>(), Horizon);

        Assert.Empty(tri.OnAxis);
        Assert.Empty(tri.Undated);
    }

    [Fact]
    public void Invariant_un_seul_moment_se_trie_sans_departage()
    {
        var tri = TimelineSorter.Sort([M("seul", new Year(1994))], Horizon);
        Assert.Equal(["seul"], tri.OnAxis.Select(m => m.Id));
    }

    [Fact]
    public void Invariant_la_sequence_est_croissante_sur_la_cle_de_tri()
    {
        var moments = new[]
        {
            M("a", new Year(1991)), M("b", new YearRange(1993, 1997)),
            M("c", new Year(1995)), M("d", new ApproximateYear(1994, 2)),
            M("e", new ExactDate(new DateOnly(2001, 6, 1))),
        };

        var axe = TimelineSorter.Sort(moments, Horizon).OnAxis;

        for (var i = 1; i < axe.Count; i++)
        {
            var precedent = TemporalNormalizer.Normalize(axe[i - 1].OccurredAt, Horizon)!;
            var courant = TemporalNormalizer.Normalize(axe[i].OccurredAt, Horizon)!;
            Assert.True(precedent.SortKey <= courant.SortKey,
                $"{axe[i - 1].Id} ({precedent.SortKey}) devrait précéder " +
                $"{axe[i].Id} ({courant.SortKey})");
        }
    }

    // ---------- utilitaire ---------------------------------------------------

    private static IEnumerable<Moment[]> Permutations(Moment[] source)
    {
        // Quelques permutations suffisent : l'inversion, et des rotations.
        yield return source.Reverse().ToArray();
        for (var decalage = 1; decalage < source.Length; decalage++)
        {
            yield return source.Skip(decalage).Concat(source.Take(decalage)).ToArray();
        }
    }
}
