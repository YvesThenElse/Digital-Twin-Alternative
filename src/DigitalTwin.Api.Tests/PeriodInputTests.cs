using DigitalTwin.Api.Selection;
using DigitalTwin.Domain.Temporal;

namespace DigitalTwin.Api.Tests;

/// <summary>
/// La traduction du choix de période de la passe 1 vers le domaine.
///
/// <para>Un seul risque compte ici : <b>rendre exacte une déclaration que
/// l'utilisateur a faite approximative</b>. Le reste du système traite
/// ensuite cette valeur comme une vérité, et l'imprécision perdue ne se
/// retrouve pas.</para>
/// </summary>
public class PeriodInputTests
{
    [Fact]
    public void Une_annee_donne_une_annee()
    {
        Assert.Equal(new Year(1995), new PeriodInput("year", Year: 1995).ToTemporalValue());
    }

    [Fact]
    public void Une_periode_donne_une_periode()
    {
        // L'exemple même de §24.3 : « Super Nintendo, 1993–1997 ».
        Assert.Equal(new YearRange(1993, 1997),
            new PeriodInput("range", From: 1993, To: 1997).ToTemporalValue());
    }

    [Fact]
    public void Une_periode_sans_fin_reste_ouverte()
    {
        // « depuis 1994 ». La refermer sur son début inventerait une fin que
        // personne n'a déclarée.
        var valeur = Assert.IsType<YearRange>(
            new PeriodInput("range", From: 1994).ToTemporalValue());

        Assert.Equal(1994, valeur.StartYear);
        Assert.Null(valeur.EndYear);
        Assert.True(valeur.IsOpenEnded);
    }

    [Fact]
    public void Une_periode_d_une_seule_annee_reste_une_periode()
    {
        // Normaliser AJOUTE, ne remplace jamais : `Year(1994)` et
        // `YearRange(1994, 1994)` partagent un intervalle et s'affichent
        // différemment. Replier l'une sur l'autre perdrait ce que
        // l'utilisateur a dit.
        var valeur = new PeriodInput("range", From: 1994, To: 1994).ToTemporalValue();

        Assert.IsType<YearRange>(valeur);
        Assert.NotEqual(new Year(1994), valeur);
    }

    [Fact]
    public void Un_vers_donne_une_annee_approchee_et_jamais_une_annee_exacte()
    {
        var valeur = Assert.IsType<ApproximateYear>(
            new PeriodInput("approximate", Year: 1995, Margin: 3).ToTemporalValue());

        Assert.Equal(1995, valeur.Year);
        Assert.Equal(3, valeur.Margin);
    }

    [Theory]
    [InlineData(null)]
    [InlineData(0)]
    [InlineData(-1)]
    public void Un_vers_sans_marge_utilisable_garde_une_marge_d_au_moins_un(int? marge)
    {
        // Une marge nulle dirait exactement ce que dit une année. Accepter
        // zéro reviendrait à transformer « vers 1995 » en « 1995 » — la
        // déclaration d'incertitude disparaîtrait sans trace.
        var valeur = Assert.IsType<ApproximateYear>(
            new PeriodInput("approximate", Year: 1995, Margin: marge).ToTemporalValue());

        Assert.True(valeur.Margin >= 1, $"marge obtenue : {valeur.Margin}");
        Assert.Equal(PeriodInput.MargeParDefaut, valeur.Margin);
        // La VALEUR, pas seulement la constante : s'appuyer sur
        // `MargeParDefaut` seul laisserait passer n'importe quel changement de
        // marge. Deux ans, comme l'exemple « 1994 ± 2 » de MODELE §3.
        Assert.Equal(2, valeur.Margin);
    }

    [Fact]
    public void Je_ne_sais_plus_donne_inconnu()
    {
        Assert.IsType<Unknown>(new PeriodInput("unknown").ToTemporalValue());
    }

    [Fact]
    public void Un_genre_inconnu_est_refuse_et_non_replie_sur_inconnu()
    {
        // Les confondre transformerait une faute de l'appelant en souvenir
        // sans date, et le jeu glisserait dans la zone sans date sans que
        // rien ne l'explique.
        var erreur = Assert.Throws<ArgumentException>(
            () => new PeriodInput("saison").ToTemporalValue());

        Assert.Contains("saison", erreur.Message, StringComparison.Ordinal);
    }

    [Theory]
    [InlineData("year")]
    [InlineData("approximate")]
    public void Une_annee_manquante_est_refusee_en_nommant_le_champ(string genre)
    {
        var erreur = Assert.Throws<ArgumentException>(
            () => new PeriodInput(genre).ToTemporalValue());

        Assert.Contains("year", erreur.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void Une_periode_inversee_est_refusee()
    {
        Assert.Throws<ArgumentException>(
            () => new PeriodInput("range", From: 1997, To: 1993).ToTemporalValue());
    }

    [Fact]
    public void La_confiance_deduite_d_une_periode_est_basse_et_jamais_demandee()
    {
        // La granularité choisie donne déjà la fiabilité : la demander en
        // plus ajouterait une décision par saisie pour rien.
        var evenement = new DigitalTwin.Domain.Player.PlayerEvent(
            "evt_1", "usr_1", DigitalTwin.Domain.Player.PlayerEventType.StartedGame,
            new DigitalTwin.Domain.Player.EventTarget("work", "wrk_1"),
            new PeriodInput("approximate", Year: 1995).ToTemporalValue(),
            new DateTime(2026, 9, 21, 0, 0, 0, DateTimeKind.Utc));

        Assert.Equal(DigitalTwin.Domain.Player.ConfidenceLevel.Low, evenement.Confidence);
    }
}
