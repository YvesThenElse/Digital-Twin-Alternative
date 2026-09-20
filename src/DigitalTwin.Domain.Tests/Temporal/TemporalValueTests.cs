using DigitalTwin.Domain.Temporal;

namespace DigitalTwin.Domain.Tests.Temporal;

/// <summary>
/// Item 01 — les sept variantes de <see cref="TemporalValue"/>.
///
/// Référence : MODELE-DE-DOMAINE §3 (« type valeur, jamais une entité »,
/// sept variantes et pas huit) et ORDONNANCEMENT-TEMPOREL §2.
///
/// Ce qui est vérifié ici est la CONSTRUCTION : chaque variante se construit,
/// et une construction absurde est refusée au lieu de produire une valeur qui
/// paraîtra normale plus tard. La normalisation en intervalle relève de
/// l'item 02.
/// </summary>
public class TemporalValueTests
{
    // ---------- les sept variantes existent et se construisent -------------

    [Fact]
    public void Les_sept_variantes_se_construisent()
    {
        TemporalValue[] toutes =
        [
            new ExactDate(new DateOnly(1994, 3, 15)),
            new Month(1994, 3),
            new Year(1994),
            new YearRange(1993, 1997),
            new ApproximateYear(1994, 2),
            new Age(12),
            Unknown.Instance,
        ];

        Assert.Equal(7, toutes.Length);
        Assert.Equal(7, toutes.Select(v => v.GetType()).Distinct().Count());
    }

    [Fact]
    public void Une_valeur_temporelle_a_une_semantique_de_valeur()
    {
        // MODELE-DE-DOMAINE §3 : « type valeur, jamais une entité ». Deux
        // valeurs identiques sont interchangeables — sans quoi comparer deux
        // souvenirs équivalents renverrait faux sans rien signaler.
        Assert.Equal(new Year(1994), new Year(1994));
        Assert.Equal(new Year(1994).GetHashCode(), new Year(1994).GetHashCode());
        Assert.NotEqual<TemporalValue>(new Year(1994), new Year(1995));
    }

    [Fact]
    public void Year_et_Range_d_une_seule_annee_restent_distinguables()
    {
        // ORDONNANCEMENT-TEMPOREL §2.2 : la normalisation AJOUTE, elle ne
        // remplace pas. Ces deux-là auront le même intervalle et un rendu
        // différent ; les confondre dès le type perdrait ce que l'utilisateur
        // a dit. L'intervalle lui-même est vérifié à l'item 02.
        TemporalValue annee = new Year(1994);
        TemporalValue periode = new YearRange(1994, 1994);

        Assert.NotEqual(annee, periode);
        Assert.NotEqual(annee.GetType(), periode.GetType());
    }

    [Fact]
    public void Unknown_est_un_singleton()
    {
        // « Unknown | rien ». Il n'a pas d'état, donc pas de raison d'exister
        // en plusieurs exemplaires distincts.
        Assert.Same(Unknown.Instance, Unknown.Instance);
        Assert.Equal<TemporalValue>(Unknown.Instance, Unknown.Instance);
    }

    // ---------- les constructions absurdes sont refusées -------------------

    [Theory]
    [InlineData(1994, 13)]   // mois 13
    [InlineData(1994, 0)]    // mois 0
    [InlineData(1994, -1)]
    public void Month_refuse_un_mois_hors_bornes(int year, int month)
    {
        var ex = Assert.Throws<ArgumentOutOfRangeException>(() => new Month(year, month));
        Assert.Contains(month.ToString(), ex.Message);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1994)]
    [InlineData(10000)]
    public void Year_refuse_une_annee_hors_bornes(int year)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new Year(year));
    }

    [Fact]
    public void Month_refuse_aussi_une_annee_hors_bornes()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new Month(0, 3));
    }

    [Fact]
    public void Range_refuse_des_bornes_inversees()
    {
        var ex = Assert.Throws<ArgumentException>(() => new YearRange(1997, 1993));
        // Le message doit nommer les deux bornes : « l'assertion a échoué » ne
        // sert à personne à la trentième entrée d'un import.
        Assert.Contains("1997", ex.Message);
        Assert.Contains("1993", ex.Message);
    }

    [Fact]
    public void Range_accepte_une_borne_ouverte_vers_le_futur()
    {
        // ORDONNANCEMENT-TEMPOREL §2.3 : « bien plus tard » produit Range(a, …).
        // La fermeture sur l'horizon est affaire de normalisation (item 03) ;
        // le type doit simplement pouvoir porter l'absence de fin.
        var ouvert = new YearRange(2001, null);
        Assert.Equal(2001, ouvert.StartYear);
        Assert.Null(ouvert.EndYear);
        Assert.True(ouvert.IsOpenEnded);
    }

    [Fact]
    public void Range_d_une_seule_annee_est_accepte()
    {
        var unique = new YearRange(1994, 1994);
        Assert.False(unique.IsOpenEnded);
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(0)]
    public void ApproximateYear_refuse_une_marge_non_positive(int margin)
    {
        // Une marge nulle dirait exactement ce que dit Year(a). Deux manières
        // d'exprimer la même chose finissent toujours par diverger — le même
        // motif qui a fait refuser une huitième variante (MODELE §3).
        Assert.Throws<ArgumentOutOfRangeException>(() => new ApproximateYear(1994, margin));
    }

    [Fact]
    public void ApproximateYear_accepte_une_marge_positive()
    {
        var vers = new ApproximateYear(1994, 2);
        Assert.Equal(1994, vers.Year);
        Assert.Equal(2, vers.Margin);
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(151)]
    public void Age_refuse_un_age_invraisemblable(int years)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new Age(years));
    }

    [Fact]
    public void Age_conserve_l_age_brut()
    {
        // MODELE-DE-DOMAINE §3, règle 3 : « Age se stocke brut. Jamais
        // converti à l'écriture. » Le type ne doit donc exposer aucune année :
        // corriger l'année de naissance doit recalculer, pas réconcilier.
        var age = new Age(12);
        Assert.Equal(12, age.Years);

        var proprietes = typeof(Age).GetProperties().Select(p => p.Name).ToArray();
        Assert.DoesNotContain("Year", proprietes);
        Assert.DoesNotContain("BirthYear", proprietes);
    }

    [Fact]
    public void ExactDate_accepte_une_date_valide()
    {
        var d = new ExactDate(new DateOnly(1994, 3, 15));
        Assert.Equal(new DateOnly(1994, 3, 15), d.Date);
    }
}
