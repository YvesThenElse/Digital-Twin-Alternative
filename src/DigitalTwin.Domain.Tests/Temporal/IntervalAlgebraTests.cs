using DigitalTwin.Domain.Temporal;

namespace DigitalTwin.Domain.Tests.Temporal;

/// <summary>
/// Item 04 — l'algèbre d'intervalles.
///
/// Référence : ORDONNANCEMENT-TEMPOREL §3. Sept relations, dont <b>une
/// seule</b> est un ordre.
/// </summary>
public class IntervalAlgebraTests
{
    // ---------- les sept relations, une par une ---------------------------

    [Fact]
    public void Avant_quand_la_fin_precede_strictement_le_debut()
    {
        Assert.Equal(IntervalRelation.Before, Relate(new Year(1991), new Year(1993)));
    }

    [Fact]
    public void Apres_est_le_symetrique_d_avant()
    {
        Assert.Equal(IntervalRelation.After, Relate(new Year(1993), new Year(1991)));
    }

    [Fact]
    public void Contient_quand_une_periode_englobe_un_moment()
    {
        // La conséquence que §3 énonce en premier : Range(1993–1997) et
        // Year(1995) sont en relation Contient, PAS en relation d'ordre.
        Assert.Equal(IntervalRelation.Contains,
            Relate(new YearRange(1993, 1997), new Year(1995)));
    }

    [Fact]
    public void Contenu_dans_est_le_symetrique_de_contient()
    {
        Assert.Equal(IntervalRelation.ContainedIn,
            Relate(new Year(1995), new YearRange(1993, 1997)));
    }

    [Fact]
    public void Chevauche_quand_l_intersection_n_est_pas_vide_sans_inclusion()
    {
        Assert.Equal(IntervalRelation.Overlaps,
            Relate(new YearRange(1993, 1996), new YearRange(1995, 1998)));
    }

    [Fact]
    public void Egal_quand_les_bornes_sont_identiques()
    {
        // « Rare, mais pas un chevauchement. » Et deux moments Égaux ne sont
        // pas simultanés : ils sont indiscernables à la granularité déclarée.
        // Year(1994) et YearRange(1994,1994) ont les mêmes bornes et restent
        // deux valeurs distinctes (§2.2).
        Assert.Equal(IntervalRelation.Equal,
            Relate(new Year(1994), new YearRange(1994, 1994)));
    }

    [Fact]
    public void Incomparable_quand_l_un_des_deux_n_a_pas_d_intervalle()
    {
        var annee = TemporalNormalizer.Normalize(new Year(1994));
        Assert.Equal(IntervalRelation.Incomparable,
            IntervalAlgebra.Relate(annee, null));
        Assert.Equal(IntervalRelation.Incomparable,
            IntervalAlgebra.Relate(null, annee));
        Assert.Equal(IntervalRelation.Incomparable,
            IntervalAlgebra.Relate(null, null));
    }

    // ---------- une seule relation est un ordre ---------------------------

    [Fact]
    public void Seul_avant_ordonne()
    {
        Assert.True(Precedes(new Year(1991), new Year(1993)));
    }

    [Theory]
    [MemberData(nameof(CouplesNonOrdonnes))]
    public void Tout_le_reste_n_ordonne_dans_aucun_sens(TemporalValue a, TemporalValue b)
    {
        // « Tout le reste est un chevauchement, et un chevauchement n'est PAS
        // un ordre. » Les afficher l'un au-dessus de l'autre n'affirme rien —
        // c'est ce qui rend la cascade de départage nécessaire (item 05).
        Assert.False(Precedes(a, b), $"{Describe(a)} ne doit pas précéder {Describe(b)}");
        Assert.False(Precedes(b, a), $"{Describe(b)} ne doit pas précéder {Describe(a)}");
    }

    public static TheoryData<TemporalValue, TemporalValue> CouplesNonOrdonnes() => new()
    {
        { new YearRange(1993, 1997), new Year(1995) },        // Contient
        { new Year(1995), new YearRange(1993, 1997) },        // Contenu dans
        { new YearRange(1993, 1996), new YearRange(1995, 1998) }, // Chevauche
        { new Year(1994), new YearRange(1994, 1994) },        // Égal
        { new ApproximateYear(1994, 2), new Year(1994) },     // Contient
    };

    // ---------- cas dégénérés ---------------------------------------------

    [Fact]
    public void Deux_journees_identiques_sont_egales()
    {
        // Largeur nulle des deux côtés — le cas que l'item 02 a appris à ne
        // pas oublier.
        var d = new ExactDate(new DateOnly(1994, 3, 15));
        Assert.Equal(IntervalRelation.Equal, Relate(d, d));
    }

    [Fact]
    public void Une_journee_dans_une_annee_est_contenue()
    {
        Assert.Equal(IntervalRelation.ContainedIn,
            Relate(new ExactDate(new DateOnly(1994, 3, 15)), new Year(1994)));
    }

    [Fact]
    public void Deux_journees_consecutives_sont_ordonnees()
    {
        // L'écart minimal qui produit encore un ordre : un jour d'intervalle
        // suffit, puisque la condition est une inégalité stricte.
        Assert.Equal(IntervalRelation.Before,
            Relate(new ExactDate(new DateOnly(1994, 3, 15)),
                   new ExactDate(new DateOnly(1994, 3, 16))));
    }

    [Fact]
    public void Deux_periodes_qui_partagent_une_annee_se_chevauchent()
    {
        // Ce test s'appelait « qui se touchent par un jour ». C'était faux :
        // ces deux périodes se recouvrent sur TOUTE l'année 1995, soit 365
        // jours. Le nom décrivait une intention, pas la donnée — et un nom qui
        // ment est pire qu'un nom absent, puisqu'il dissuade d'écrire le vrai
        // cas. Celui-ci est juste en dessous.
        Assert.Equal(IntervalRelation.Overlaps,
            Relate(new YearRange(1993, 1996), new YearRange(1995, 1998)));
    }

    [Fact]
    public void Deux_intervalles_qui_se_touchent_par_un_seul_jour_ne_sont_pas_ordonnes()
    {
        // LE vrai cas limite : la fin de l'un est exactement le début de
        // l'autre. Les intervalles étant fermés, ils partagent ce jour, donc
        // l'intersection n'est pas vide et il n'y a pas d'ordre.
        //
        // C'est ici qu'un « <= » mis à la place du « < » de la relation Avant
        // se verrait — et nulle part ailleurs.
        var periode = new YearRange(1993, 1994);              // finit le 31/12/1994
        var jour = new ExactDate(new DateOnly(1994, 12, 31)); // commence le même jour

        Assert.Equal(IntervalRelation.Contains, Relate(periode, jour));
        Assert.False(Precedes(periode, jour));
    }

    [Fact]
    public void Une_contenance_peut_partager_une_borne()
    {
        // Trou révélé par une mutation qui a SURVÉCU : rendre l'inclusion
        // stricte ne cassait aucun test, parce qu'aucune donnée ne présentait
        // de contenance partageant une borne. Elles avaient toutes de la marge
        // des deux côtés.
        //
        // Janvier 1994 commence le même jour que l'année 1994, et décembre
        // 1994 finit le même jour qu'elle.
        Assert.Equal(IntervalRelation.Contains,
            Relate(new Year(1994), new Month(1994, 1)));
        Assert.Equal(IntervalRelation.Contains,
            Relate(new Year(1994), new Month(1994, 12)));
        Assert.Equal(IntervalRelation.ContainedIn,
            Relate(new Month(1994, 1), new Year(1994)));
    }

    [Fact]
    public void Deux_annees_consecutives_sont_ordonnees()
    {
        // À un jour près du cas précédent, et l'issue est l'inverse.
        Assert.Equal(IntervalRelation.Before, Relate(new Year(1994), new Year(1995)));
    }

    // ---------- invariants --------------------------------------------------

    [Theory]
    [MemberData(nameof(Couples))]
    public void Invariant_la_relation_inverse_est_le_miroir(TemporalValue a, TemporalValue b)
    {
        var direct = Relate(a, b);
        var inverse = Relate(b, a);

        Assert.Equal(Miroir(direct), inverse);
    }

    [Theory]
    [MemberData(nameof(Valeurs))]
    public void Invariant_une_valeur_est_egale_a_elle_meme(TemporalValue v)
    {
        Assert.Equal(IntervalRelation.Equal, Relate(v, v));
    }

    [Theory]
    [MemberData(nameof(Couples))]
    public void Invariant_avant_et_apres_s_excluent(TemporalValue a, TemporalValue b)
    {
        Assert.False(Precedes(a, b) && Precedes(b, a),
            $"{Describe(a)} et {Describe(b)} se précèdent mutuellement");
    }

    private static IntervalRelation Miroir(IntervalRelation r) => r switch
    {
        IntervalRelation.Before => IntervalRelation.After,
        IntervalRelation.After => IntervalRelation.Before,
        IntervalRelation.Contains => IntervalRelation.ContainedIn,
        IntervalRelation.ContainedIn => IntervalRelation.Contains,
        _ => r,     // Égal, Chevauche et Incomparable sont leurs propres miroirs
    };

    /// <summary>
    /// Le jeu de référence des invariants. Déclaré une fois, parcouru en
    /// produit croisé : c'est là que se logent les erreurs qu'on n'a pas
    /// pensées, notamment l'ordre des tests dans `Relate`.
    /// </summary>
    private static readonly TemporalValue[] JeuDeReference =
    [
        new ExactDate(new DateOnly(1994, 3, 15)),
        new Month(1994, 2),
        new Year(1994),
        new YearRange(1993, 1997),
        new ApproximateYear(1994, 2),
    ];

    public static TheoryData<TemporalValue> Valeurs()
    {
        var data = new TheoryData<TemporalValue>();
        foreach (var v in JeuDeReference)
        {
            data.Add(v);
        }
        return data;
    }

    public static TheoryData<TemporalValue, TemporalValue> Couples()
    {
        var data = new TheoryData<TemporalValue, TemporalValue>();
        foreach (var a in JeuDeReference)
        {
            foreach (var b in JeuDeReference)
            {
                data.Add(a, b);
            }
        }
        return data;
    }

    // ---------- utilitaires -------------------------------------------------

    private static IntervalRelation Relate(TemporalValue a, TemporalValue b) =>
        IntervalAlgebra.Relate(
            TemporalNormalizer.Normalize(a), TemporalNormalizer.Normalize(b));

    private static bool Precedes(TemporalValue a, TemporalValue b) =>
        IntervalAlgebra.Precedes(
            TemporalNormalizer.Normalize(a), TemporalNormalizer.Normalize(b));

    private static string Describe(TemporalValue v) => v.ToString() ?? v.GetType().Name;
}
