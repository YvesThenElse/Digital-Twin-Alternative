using System.Reflection;
using DigitalTwin.Domain.Player;
using DigitalTwin.Domain.Temporal;

namespace DigitalTwin.Domain.Tests.Player;

/// <summary>
/// Item 11 — <c>PlayerEvent</c> et <c>PlayDeclaration</c>.
///
/// Référence : MODELE-DE-DOMAINE §5 et les invariants 1, 3, 4 de §7.
/// </summary>
public class PlayerEventTests
{
    private static readonly EventTarget Cible = new("Work", "wrk_ffvii");
    private static readonly DateTime Saisie =
        new(2026, 1, 15, 12, 0, 0, DateTimeKind.Utc);

    private static PlayerEvent E(TemporalValue quand, string type = PlayerEventType.StartedGame) =>
        new("evt_1", "usr_yves", type, Cible, quand, Saisie);

    // ---------- invariant 1 : les deux axes temporels ---------------------

    [Fact]
    public void Tout_evenement_porte_les_deux_axes_temporels()
    {
        var e = E(new Year(1997));

        Assert.Equal(new Year(1997), e.OccurredAt);
        Assert.Equal(Saisie, e.RecordedAt);
    }

    [Fact]
    public void Un_evenement_sans_moment_vecu_est_refuse()
    {
        // Invariant 1. `Unknown` est une réponse valide ; `null` n'en est pas
        // une. Le premier dit « je ne sais plus », le second ne dit rien.
        Assert.Throws<ArgumentNullException>(() =>
            new PlayerEvent("evt_1", "usr_yves", PlayerEventType.StartedGame,
                            Cible, null!, Saisie));
    }

    [Fact]
    public void Un_evenement_sans_horodatage_de_saisie_est_refuse()
    {
        Assert.Throws<ArgumentException>(() =>
            new PlayerEvent("evt_1", "usr_yves", PlayerEventType.StartedGame,
                            Cible, new Year(1997), default));
    }

    [Fact]
    public void Les_deux_axes_ne_se_confondent_pas()
    {
        // §5.2 : un utilisateur déclare en 2026 avoir terminé un jeu en 1998.
        // Les confondre rend impossibles à la fois la timeline — qui lit
        // OccurredAt — et l'audit, qui lit RecordedAt.
        var e = E(new Year(1998));

        Assert.Equal(1998, Assert.IsType<Year>(e.OccurredAt).Value);
        Assert.Equal(2026, e.RecordedAt.Year);
    }

    // ---------- invariant 11 : joignable par UserId seul -------------------

    [Fact]
    public void Tout_evenement_porte_son_utilisateur()
    {
        // Condition de la purge (§10.1) : sans UserId sur chaque
        // enregistrement, l'effacement par utilisateur devient impossible.
        Assert.Equal("usr_yves", E(new Year(1997)).UserId);
    }

    [Fact]
    public void Un_evenement_sans_utilisateur_est_refuse()
    {
        Assert.Throws<ArgumentException>(() =>
            new PlayerEvent("evt_1", "", PlayerEventType.StartedGame,
                            Cible, new Year(1997), Saisie));
    }

    // ---------- invariant 4 : Confidence dérivé, jamais saisi -------------

    [Theory]
    [InlineData(ConfidenceLevel.High)]
    public void Une_date_exacte_donne_une_confiance_haute(ConfidenceLevel attendu)
    {
        Assert.Equal(attendu, E(new ExactDate(new DateOnly(1997, 3, 15))).Confidence);
    }

    [Fact]
    public void Un_mois_donne_aussi_une_confiance_haute()
    {
        Assert.Equal(ConfidenceLevel.High, E(new Month(1997, 3)).Confidence);
    }

    [Fact]
    public void Une_annee_donne_une_confiance_moyenne()
    {
        Assert.Equal(ConfidenceLevel.Medium, E(new Year(1997)).Confidence);
    }

    [Fact]
    public void Une_periode_donne_une_confiance_basse()
    {
        Assert.Equal(ConfidenceLevel.Low, E(new YearRange(1993, 1997)).Confidence);
    }

    [Fact]
    public void Un_vers_donne_une_confiance_basse()
    {
        Assert.Equal(ConfidenceLevel.Low, E(new ApproximateYear(1997, 2)).Confidence);
    }

    [Fact]
    public void Un_age_donne_une_confiance_basse()
    {
        // « Vers mes 12 ans » est une approximation, et la fenêtre de deux
        // années civiles le dit. La confiance ne dépend PAS de savoir si on
        // peut la résoudre : l'année de naissance manquante est notre lacune,
        // pas celle du souvenir.
        Assert.Equal(ConfidenceLevel.Low, E(new Age(12)).Confidence);
    }

    [Fact]
    public void Un_moment_inconnu_donne_une_confiance_nulle()
    {
        Assert.Equal(ConfidenceLevel.None, E(Unknown.Instance).Confidence);
    }

    [Fact]
    public void La_confiance_n_a_pas_de_setter_public()
    {
        // Invariant 4, vérifié sur la forme : si elle pouvait être assignée,
        // une interface finirait par la demander — et §2 des principes
        // transverses interdit de faire noter à quelqu'un la fiabilité de son
        // propre souvenir.
        var propriete = typeof(PlayerEvent).GetProperty(nameof(PlayerEvent.Confidence))!;

        Assert.Null(propriete.SetMethod);
        Assert.DoesNotContain(
            typeof(PlayerEvent).GetConstructors()
                .SelectMany(c => c.GetParameters())
                .Select(p => p.Name),
            n => n!.Contains("onfidence", StringComparison.Ordinal));
    }

    [Fact]
    public void La_confiance_suit_la_valeur_et_non_l_inverse()
    {
        // Le comportement plutôt que la forme : corriger la date change la
        // confiance, sans que personne ne l'ait touchée.
        var flou = E(new YearRange(1990, 2000));
        var precis = flou with { OccurredAt = new ExactDate(new DateOnly(1997, 3, 15)) };

        Assert.Equal(ConfidenceLevel.Low, flou.Confidence);
        Assert.Equal(ConfidenceLevel.High, precis.Confidence);
    }

    // ---------- le type d'événement ---------------------------------------

    [Theory]
    [InlineData(PlayerEventType.DiscoveredGame)]
    [InlineData(PlayerEventType.StartedGame)]
    [InlineData(PlayerEventType.CompletedGame)]
    [InlineData(PlayerEventType.AbandonedGame)]
    [InlineData(PlayerEventType.ReplayedGame)]
    [InlineData(PlayerEventType.AcquiredItem)]
    [InlineData(PlayerEventType.SoldItem)]
    [InlineData(PlayerEventType.LostItem)]
    [InlineData(PlayerEventType.LentItem)]
    [InlineData(PlayerEventType.BorrowedItem)]
    [InlineData(PlayerEventType.ReturnedItem)]
    public void Les_types_du_modele_sont_acceptes(string type)
    {
        Assert.Equal(type, E(new Year(1997), type).Type);
    }

    [Fact]
    public void Un_type_hors_du_modele_est_refuse()
    {
        // La liste de §5 est fermée. Un type inventé passerait silencieusement
        // à travers la séquence causale — qui n'ordonne rien qu'elle ne
        // connaît pas — et ne se verrait nulle part.
        var ex = Assert.Throws<ArgumentException>(() => E(new Year(1997), "FiniLeJeu"));
        Assert.Contains("FiniLeJeu", ex.Message);
    }

    // ---------- l'événement se trie ---------------------------------------

    [Fact]
    public void Un_evenement_est_triable_par_la_timeline()
    {
        // Le contrat posé à l'item 05 trouve ici son implémentation réelle :
        // le tri n'a jamais eu besoin de connaître les événements.
        var horizon = new TemporalHorizon(new DateOnly(2026, 9, 20), null);
        var tri = TimelineSorter.Sort(
            [new PlayerEvent("b", "usr", PlayerEventType.CompletedGame, Cible,
                             new Year(1999), Saisie),
             new PlayerEvent("a", "usr", PlayerEventType.StartedGame, Cible,
                             new Year(1997), Saisie)],
            horizon);

        Assert.Equal(["a", "b"], tri.OnAxis.Select(e => e.Id));
    }

    [Fact]
    public void Le_sujet_et_le_type_alimentent_la_coherence_causale()
    {
        // L'événement expose SubjectId et Kind, donc le critère 4 s'applique
        // sans que TimelineSorter change d'une ligne.
        var horizon = new TemporalHorizon(new DateOnly(2026, 9, 20), null);
        var tri = TimelineSorter.Sort(
            [new PlayerEvent("termine", "usr", PlayerEventType.CompletedGame, Cible,
                             new Year(1995), Saisie),
             new PlayerEvent("commence", "usr", PlayerEventType.StartedGame, Cible,
                             new Year(1998), Saisie)],
            horizon);

        var a = Assert.Single(tri.Warnings);
        Assert.Equal("commence", a.ExpectedEarlierId);
    }

    [Fact]
    public void Le_sujet_d_un_evenement_est_sa_cible()
    {
        var e = E(new Year(1997));
        Assert.Equal("wrk_ffvii", e.SubjectId);
        Assert.Equal(PlayerEventType.StartedGame, e.Kind);
    }

    // ---------- §5.3 : la correction est une fonctionnalité ---------------

    [Fact]
    public void Un_evenement_peut_etre_remplace_par_sa_correction()
    {
        // « La correction est une fonctionnalité, pas une exception. » Le
        // journal étant en ajout seul, corriger signifie chaîner, pas écraser.
        var origine = E(new Year(1997));
        var corrige = origine with { Id = "evt_2", OccurredAt = new Year(1998) };
        var remplace = origine.SupersededBy(corrige.Id);

        Assert.Equal("evt_2", remplace.SupersededByEventId);
        Assert.Null(origine.SupersededByEventId);   // l'original est intact
    }

    [Fact]
    public void Un_evenement_non_corrige_ne_designe_aucun_successeur()
    {
        Assert.Null(E(new Year(1997)).SupersededByEventId);
    }
}
