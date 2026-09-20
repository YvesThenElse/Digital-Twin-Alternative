using DigitalTwin.Domain.Temporal;

namespace DigitalTwin.Domain.Tests.Temporal;

/// <summary>
/// Item 03 — bornes ouvertes et horizon de domaine.
///
/// Référence : ORDONNANCEMENT-TEMPOREL §2.3, et le vecteur T7 de §10.
/// </summary>
public class HorizonTests
{
    private static readonly TemporalHorizon Aujourdhui =
        new(new DateOnly(2026, 9, 20), BirthYear: null);

    // ---------- l'horizon lui-même ----------------------------------------

    [Fact]
    public void Sans_annee_de_naissance_le_plancher_est_1972()
    {
        // §2.3 : « antérieurement, il n'y a rien à déclarer ».
        Assert.Equal(1972, Aujourdhui.FloorYear);
    }

    [Fact]
    public void L_annee_de_naissance_releve_le_plancher()
    {
        var ne1982 = new TemporalHorizon(new DateOnly(2026, 9, 20), BirthYear: 1982);
        Assert.Equal(1982, ne1982.FloorYear);
    }

    [Fact]
    public void Le_plafond_est_le_jour_fourni_et_non_l_horloge()
    {
        // §10, note d'implémentation : « toute fonction de normalisation le
        // reçoit en paramètre. Sans quoi les tests T7 et T11 deviennent non
        // reproductibles. » Lire DateTime.Today ici rendrait la suite
        // dépendante du jour où on l'exécute.
        Assert.Equal(new DateOnly(2026, 9, 20), Aujourdhui.Ceiling);
    }

    // ---------- vecteur T7 -------------------------------------------------

    [Fact]
    public void T7_une_periode_ouverte_se_ferme_sur_aujourd_hui()
    {
        var i = Normalize(new YearRange(2001, null), Aujourdhui);

        Assert.Equal(new DateOnly(2001, 1, 1), i.Start);
        Assert.Equal(new DateOnly(2026, 9, 20), i.End);
    }

    [Fact]
    public void T7_une_periode_ouverte_se_trie_sur_sa_borne_connue()
    {
        // LE point de §2.3. Le milieu d'un intervalle appuyé sur le plafond
        // dériverait chaque jour ; la borne connue, non.
        var i = Normalize(new YearRange(2001, null), Aujourdhui);
        Assert.Equal(new DateOnly(2001, 1, 1), i.SortKey);
    }

    [Fact]
    public void T7_l_ordre_ne_change_pas_d_un_jour_a_l_autre()
    {
        // La vérification qui compte vraiment : deux horizons distants de
        // plusieurs mois doivent produire la MÊME clé de tri. C'est ce que le
        // milieu aurait cassé, silencieusement — la timeline aurait bougé
        // entre deux visites sans qu'aucune erreur ne soit levée.
        var ouvert = new YearRange(2001, null);

        var aujourdhui = Normalize(ouvert, Aujourdhui);
        var dansSixMois = Normalize(
            ouvert, new TemporalHorizon(new DateOnly(2027, 3, 5), null));

        Assert.Equal(aujourdhui.SortKey, dansSixMois.SortKey);
        Assert.NotEqual(aujourdhui.End, dansSixMois.End);   // le plafond, lui, bouge
    }

    [Fact]
    public void Une_periode_fermee_garde_son_milieu_comme_cle()
    {
        // La règle de la borne connue ne vaut QUE pour le semi-ouvert. Une
        // période fermée reste triée par son milieu (§2.1), horizon ou pas.
        var fermee = new YearRange(1993, 1997);

        var avec = Normalize(fermee, Aujourdhui);
        var sans = TemporalNormalizer.Normalize(fermee)!;

        Assert.Equal(sans.SortKey, avec.SortKey);
        Assert.Equal(new DateOnly(1995, 7, 2), avec.SortKey);
    }

    // ---------- le cas dégénéré, que l'item 02 a appris à ne pas oublier ---

    [Fact]
    public void Une_periode_ouverte_commencant_apres_aujourd_hui_n_est_pas_placable()
    {
        // « Un souvenir ne se situe pas dans l'avenir » (§2.3). Fermer sur le
        // plafond donnerait ici un intervalle inversé.
        //
        // Elle n'est pas refusée pour autant — invariant 10 : « une
        // incohérence produit un avertissement, jamais un refus ». La valeur
        // reste valide et rejoint les moments sans date, comme Unknown.
        var futur = new YearRange(2030, null);
        Assert.Null(TemporalNormalizer.Normalize(futur, Aujourdhui));
    }

    [Fact]
    public void Une_periode_ouverte_commencant_cette_annee_reste_placable()
    {
        // La borne exacte du cas précédent : l'année en cours est encore du
        // passé pour ses premiers mois. Sans ce test, un « > » au lieu d'un
        // « >= » passerait inaperçu.
        var i = Normalize(new YearRange(2026, null), Aujourdhui);
        Assert.Equal(new DateOnly(2026, 1, 1), i.Start);
        Assert.Equal(new DateOnly(2026, 9, 20), i.End);
    }

    // ---------- l'horizon ne change rien à ce qui n'en a pas besoin --------

    [Theory]
    [MemberData(nameof(ValeursFermees))]
    public void L_horizon_ne_modifie_pas_une_valeur_deja_fermee(TemporalValue value)
    {
        // « L'horizon est un artefact de rendu et de tri. Il ne s'écrit jamais
        // dans la donnée. » Une valeur qui se normalise sans lui doit donner
        // exactement le même intervalle avec lui.
        var sans = TemporalNormalizer.Normalize(value)!;
        var avec = Normalize(value, Aujourdhui);

        Assert.Equal(sans.Start, avec.Start);
        Assert.Equal(sans.End, avec.End);
        Assert.Equal(sans.SortKey, avec.SortKey);
    }

    [Theory]
    [MemberData(nameof(ValeursFermees))]
    public void Invariant_la_cle_de_tri_reste_dans_l_intervalle(TemporalValue value)
    {
        var i = Normalize(value, Aujourdhui);
        Assert.InRange(i.SortKey, i.Start, i.End);
    }

    [Fact]
    public void Invariant_la_cle_de_tri_reste_dans_l_intervalle_meme_ouvert()
    {
        // Le cas dégénéré de l'invariant : pour un semi-ouvert la clé est la
        // borne de début, donc à l'extrémité de l'intervalle et non dedans.
        var i = Normalize(new YearRange(2001, null), Aujourdhui);
        Assert.InRange(i.SortKey, i.Start, i.End);
        Assert.Equal(i.Start, i.SortKey);
    }

    public static TheoryData<TemporalValue> ValeursFermees() =>
    [
        new ExactDate(new DateOnly(1994, 3, 15)),
        new Month(1994, 2),
        new Year(1994),
        new YearRange(1993, 1997),
        new ApproximateYear(1994, 2),
    ];

    private static TemporalInterval Normalize(TemporalValue v, TemporalHorizon h) =>
        TemporalNormalizer.Normalize(v, h)
        ?? throw new InvalidOperationException(
            $"{v.GetType().Name} devrait être normalisable avec un horizon.");
}
