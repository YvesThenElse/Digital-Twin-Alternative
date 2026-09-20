using System.Reflection;
using DigitalTwin.Domain.Temporal;

namespace DigitalTwin.Domain.Tests.Temporal;

/// <summary>
/// Item 02 — la forme normale.
///
/// Référence : ORDONNANCEMENT-TEMPOREL §2.1 (table des intervalles) et §2.2
/// (les deux règles qui gouvernent tout le reste).
/// </summary>
public class NormalizationTests
{
    // ---------- la table de §2.1, ligne par ligne -------------------------

    [Fact]
    public void ExactDate_se_normalise_en_un_point()
    {
        var i = Normalize(new ExactDate(new DateOnly(1994, 3, 15)));
        Assert.Equal(new DateOnly(1994, 3, 15), i.Start);
        Assert.Equal(new DateOnly(1994, 3, 15), i.End);
    }

    [Fact]
    public void Month_couvre_le_mois_entier()
    {
        var i = Normalize(new Month(1994, 2));
        Assert.Equal(new DateOnly(1994, 2, 1), i.Start);
        Assert.Equal(new DateOnly(1994, 2, 28), i.End);
    }

    [Fact]
    public void Month_tient_compte_des_annees_bissextiles()
    {
        // 1996 est bissextile. Un « dernier jour du mois » codé en dur à 28
        // passerait tous les autres tests sans jamais se signaler.
        var i = Normalize(new Month(1996, 2));
        Assert.Equal(new DateOnly(1996, 2, 29), i.End);
    }

    [Fact]
    public void Year_couvre_l_annee_entiere()
    {
        var i = Normalize(new Year(1994));
        Assert.Equal(new DateOnly(1994, 1, 1), i.Start);
        Assert.Equal(new DateOnly(1994, 12, 31), i.End);
    }

    [Fact]
    public void YearRange_couvre_de_la_premiere_a_la_derniere_annee()
    {
        var i = Normalize(new YearRange(1993, 1997));
        Assert.Equal(new DateOnly(1993, 1, 1), i.Start);
        Assert.Equal(new DateOnly(1997, 12, 31), i.End);
    }

    [Fact]
    public void ApproximateYear_s_etend_de_part_et_d_autre()
    {
        var i = Normalize(new ApproximateYear(1994, 2));
        Assert.Equal(new DateOnly(1992, 1, 1), i.Start);
        Assert.Equal(new DateOnly(1996, 12, 31), i.End);
    }

    [Fact]
    public void Unknown_n_a_aucun_intervalle()
    {
        // Invariant 2 : « Unknown n'est jamais projeté sur un axe temporel. »
        Assert.Null(TemporalNormalizer.Normalize(Unknown.Instance));
    }

    [Fact]
    public void Age_non_resolu_n_a_aucun_intervalle()
    {
        // §7.6 : sans année de naissance, Age se comporte comme Unknown.
        // Sa résolution appartient à l'item 07.
        Assert.Null(TemporalNormalizer.Normalize(new Age(12)));
    }

    [Fact]
    public void Une_periode_ouverte_n_est_pas_normalisable_sans_horizon()
    {
        // §2.3 : une borne manquante se ferme sur l'horizon de domaine, qui
        // dépend de l'utilisateur et du jour. Sans lui, la réponse honnête est
        // « je ne peux pas », et non un intervalle inventé. L'item 03 fournit
        // l'horizon.
        Assert.Null(TemporalNormalizer.Normalize(new YearRange(2001, null)));
    }

    // ---------- §2.2, première règle : la normalisation AJOUTE ------------

    [Fact]
    public void Year_et_YearRange_d_une_annee_ont_le_meme_intervalle()
    {
        var a = Normalize(new Year(1994));
        var b = Normalize(new YearRange(1994, 1994));

        Assert.Equal(a.Start, b.Start);
        Assert.Equal(a.End, b.End);
    }

    [Fact]
    public void Mais_la_variante_d_origine_survit_a_la_normalisation()
    {
        // LE point de §2.2. Ces deux-là ont le même intervalle et un rendu
        // différent — point creux contre bande. Un modèle qui ne garderait que
        // l'intervalle aurait perdu ce que l'utilisateur a dit, sans que rien
        // ne le signale.
        TemporalValue annee = new Year(1994);
        TemporalValue periode = new YearRange(1994, 1994);

        Assert.Equal(annee, TemporalNormalizer.Normalize(annee)!.Source);
        Assert.Equal(periode, TemporalNormalizer.Normalize(periode)!.Source);
        Assert.NotEqual(
            TemporalNormalizer.Normalize(annee)!.Source,
            TemporalNormalizer.Normalize(periode)!.Source);
    }

    // ---------- §2.2, seconde règle : le point est une clé de tri ---------

    [Fact]
    public void Le_point_representatif_est_le_milieu_arrondi_vers_le_bas()
    {
        // La spécification donne elle-même la valeur : « Le milieu de
        // Year(1994) est le 2 juillet 1994 ».
        Assert.Equal(new DateOnly(1994, 7, 2), Normalize(new Year(1994)).SortKey);
    }

    [Fact]
    public void Des_valeurs_differentes_peuvent_partager_le_meme_point()
    {
        // Vecteur T2 : Range(1993–1997) et Year(1995) ont le MÊME milieu.
        // C'est ce qui rend la cascade de départage nécessaire (item 05) —
        // un tri sur le seul point représentatif serait non déterministe.
        Assert.Equal(
            Normalize(new YearRange(1993, 1997)).SortKey,
            Normalize(new Year(1995)).SortKey);
    }

    [Fact]
    public void Le_point_representatif_n_est_pas_exposé_au_rendu()
    {
        // §2.2 : « Il ne s'affiche jamais, ne s'exporte jamais, n'entre dans
        // aucun calcul annoncé à l'utilisateur. » L'afficher fabriquerait la
        // précision que §7.4 interdit — le 2 juillet 1994 n'a jamais été dit
        // par personne.
        //
        // La discipline est donc portée par le type : la clé de tri est
        // internal, invisible hors du domaine. Une simple convention de nommage
        // finirait par céder.
        var publiques = typeof(TemporalInterval)
            .GetProperties(BindingFlags.Public | BindingFlags.Instance)
            .Select(p => p.Name)
            .ToArray();

        Assert.Contains("Start", publiques);
        Assert.Contains("End", publiques);
        Assert.DoesNotContain("SortKey", publiques);
        Assert.DoesNotContain(publiques, n => n.Contains("Midpoint", StringComparison.OrdinalIgnoreCase));
        Assert.DoesNotContain(publiques, n => n.Contains("Representative", StringComparison.OrdinalIgnoreCase));
    }

    // ---------- cohérence générale ----------------------------------------

    [Theory]
    [MemberData(nameof(ValeursNormalisables))]
    public void Tout_intervalle_contient_son_point_representatif(TemporalValue value)
    {
        var i = Normalize(value);
        Assert.InRange(i.SortKey, i.Start, i.End);
    }

    [Theory]
    [MemberData(nameof(ValeursNormalisables))]
    public void Aucun_intervalle_n_est_inverse(TemporalValue value)
    {
        var i = Normalize(value);
        Assert.True(i.Start <= i.End,
            $"Intervalle inversé pour {value.GetType().Name} : {i.Start} → {i.End}");
    }

    public static TheoryData<TemporalValue> ValeursNormalisables() =>
    [
        new ExactDate(new DateOnly(1994, 3, 15)),
        new Month(1994, 2),
        new Month(1996, 2),
        new Month(1994, 12),
        new Year(1994),
        new YearRange(1993, 1997),
        new YearRange(1994, 1994),
        new ApproximateYear(1994, 2),
        new ApproximateYear(2000, 1),
    ];

    private static TemporalInterval Normalize(TemporalValue v) =>
        TemporalNormalizer.Normalize(v)
        ?? throw new InvalidOperationException(
            $"{v.GetType().Name} devrait être normalisable sans horizon.");
}
