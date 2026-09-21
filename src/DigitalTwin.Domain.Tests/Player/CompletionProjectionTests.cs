using DigitalTwin.Domain.Player;
using DigitalTwin.Domain.Temporal;

namespace DigitalTwin.Domain.Tests.Player;

/// <summary>
/// Item 12 — les projections d'état.
///
/// Référence : MODELE-DE-DOMAINE §6, invariant 7, et SPECIFICATION §4.6
/// (« trois positions, pas quatre états »).
/// </summary>
public class CompletionProjectionTests
{
    private static readonly EventTarget Ffvii = new("Work", "wrk_ffvii");
    private static readonly DateTime Saisie =
        new(2026, 1, 15, 12, 0, 0, DateTimeKind.Utc);

    private static PlayerEvent E(string type, int annee, string? id = null) =>
        new(id ?? $"evt_{type}_{annee}", "usr_yves", type, Ffvii, new Year(annee), Saisie);

    private static CompletionPosition Position(params PlayerEvent[] events) =>
        CompletionProjection.PositionOf(events, "wrk_ffvii");

    // ---------- les quatre positions de §4.6 ------------------------------

    [Fact]
    public void Sans_aucun_evenement_il_n_y_a_pas_de_position()
    {
        // La première ligne de §4.6 est « (rien) » : il y a joué, sans plus
        // de précision. C'est une position, pas un manque de données.
        Assert.Equal(CompletionPosition.Unspecified, Position());
    }

    [Fact]
    public void Termine_donne_fini()
    {
        Assert.Equal(CompletionPosition.Finished,
            Position(E(PlayerEventType.StartedGame, 1997),
                     E(PlayerEventType.CompletedGame, 1998)));
    }

    [Fact]
    public void Abandonne_donne_abandonne()
    {
        Assert.Equal(CompletionPosition.Abandoned,
            Position(E(PlayerEventType.StartedGame, 1997),
                     E(PlayerEventType.AbandonedGame, 1998)));
    }

    [Fact]
    public void Commence_sans_fin_ni_abandon_donne_toujours_en_cours()
    {
        // « La projection la plus subtile du modèle. » Aucun événement ne dit
        // « en cours » : c'est l'ABSENCE des deux autres qui le dit.
        Assert.Equal(CompletionPosition.StillPlaying,
            Position(E(PlayerEventType.StartedGame, 1997)));
    }

    [Fact]
    public void Toujours_en_cours_n_est_porte_par_aucun_type_d_evenement()
    {
        // Le corollaire, vérifié plutôt que supposé : si un type
        // « StillPlayingGame » existait, la position cesserait d'être une
        // absence et deviendrait un état à maintenir — donc à désynchroniser.
        Assert.DoesNotContain(PlayerEventType.All,
            t => t.Contains("StillPlaying", StringComparison.Ordinal)
              || t.Contains("InProgress", StringComparison.Ordinal));
    }

    [Fact]
    public void Decouvrir_ne_suffit_pas_a_etre_en_cours()
    {
        // Découvrir n'est pas commencer. Sans StartedGame, il n'y a rien à
        // poursuivre — et proposer « vous y jouez toujours » serait faux.
        Assert.Equal(CompletionPosition.Unspecified,
            Position(E(PlayerEventType.DiscoveredGame, 1997)));
    }

    [Fact]
    public void Rejouer_remet_la_partie_en_cours()
    {
        // Rejoué après avoir fini : la partie est rouverte. C'est le cas que
        // §4.6 décrit par « il pourrait y revenir », vu après coup.
        Assert.Equal(CompletionPosition.StillPlaying,
            Position(E(PlayerEventType.StartedGame, 1997),
                     E(PlayerEventType.CompletedGame, 1998),
                     E(PlayerEventType.ReplayedGame, 2020)));
    }

    // ---------- invariant 7 : les trois positions sont exclusives ---------

    [Fact]
    public void Fini_et_abandonne_declares_ensemble_ne_donnent_qu_une_position()
    {
        // Invariant 7. L'utilisateur a pu se tromper, ou corriger sans que la
        // première déclaration soit retirée. On ne refuse pas (invariant 10),
        // on tranche : le plus récemment DÉCLARÉ fait foi, car c'est le
        // dernier état de connaissance de son auteur.
        var fini = new PlayerEvent("a", "usr_yves", PlayerEventType.CompletedGame,
                                   Ffvii, new Year(1998), Saisie);
        var abandonne = new PlayerEvent("b", "usr_yves", PlayerEventType.AbandonedGame,
                                        Ffvii, new Year(1998), Saisie.AddDays(10));

        Assert.Equal(CompletionPosition.Abandoned, Position(fini, abandonne));
        Assert.Equal(CompletionPosition.Abandoned, Position(abandonne, fini));
    }

    [Fact]
    public void La_position_ne_depend_pas_de_l_ordre_des_evenements()
    {
        var events = new[]
        {
            E(PlayerEventType.CompletedGame, 1998),
            E(PlayerEventType.StartedGame, 1997),
            E(PlayerEventType.DiscoveredGame, 1996),
        };

        Assert.Equal(Position(events), Position(events.Reverse().ToArray()));
    }

    // ---------- la projection ne voit que son œuvre -----------------------

    [Fact]
    public void Les_evenements_d_une_autre_oeuvre_sont_ignores()
    {
        var zelda = new PlayerEvent("z", "usr_yves", PlayerEventType.CompletedGame,
                                    new EventTarget("Work", "wrk_zelda"),
                                    new Year(1998), Saisie);

        Assert.Equal(CompletionPosition.StillPlaying,
            Position(E(PlayerEventType.StartedGame, 1997), zelda));
    }

    // ---------- taux de complétion ----------------------------------------

    [Fact]
    public void Le_taux_de_completion_rapporte_les_finis_aux_declares()
    {
        // « fini ÷ déclaré ». Le dénominateur est ce que le joueur a déclaré
        // avoir joué — pas le catalogue, qui ferait un taux dérisoire et
        // décourageant.
        var events = new[]
        {
            new PlayerEvent("1", "u", PlayerEventType.CompletedGame,
                            new EventTarget("Work", "a"), new Year(1997), Saisie),
            new PlayerEvent("2", "u", PlayerEventType.StartedGame,
                            new EventTarget("Work", "b"), new Year(1997), Saisie),
            new PlayerEvent("3", "u", PlayerEventType.AbandonedGame,
                            new EventTarget("Work", "c"), new Year(1997), Saisie),
        };

        var taux = CompletionProjection.Rate(events);

        Assert.Equal(3, taux.Declared);
        Assert.Equal(1, taux.Finished);
    }

    [Fact]
    public void Un_jeu_seulement_possede_n_entre_pas_au_denominateur()
    {
        // Trou révélé par mutation : rien ne vérifiait l'exclusion de la
        // possession. Invariant 5 — posséder n'est pas jouer. Un joueur avec
        // 200 jeux dans sa collection et 20 parties verrait sinon son taux
        // calculé sur 200, ce qui mesurerait sa bibliothèque et non son
        // parcours.
        var events = new[]
        {
            new PlayerEvent("1", "u", PlayerEventType.CompletedGame,
                            new EventTarget("Work", "joue"), new Year(1997), Saisie),
            new PlayerEvent("2", "u", PlayerEventType.AcquiredItem,
                            new EventTarget("Work", "jamais_lance"), new Year(1997), Saisie),
            new PlayerEvent("3", "u", PlayerEventType.SoldItem,
                            new EventTarget("Work", "revendu_sans_y_toucher"),
                            new Year(1999), Saisie),
        };

        var taux = CompletionProjection.Rate(events);

        Assert.Equal(1, taux.Declared);
        Assert.Equal(1, taux.Finished);
        Assert.Equal(1.0, taux.Ratio);
    }

    [Fact]
    public void Le_taux_n_expose_pas_un_pourcentage_nu()
    {
        // Même exigence qu'aux items 09 et 10 : un chiffre annoncé sort avec
        // ce qui le compose. « 33 % » seul ne dit pas sur combien de titres.
        var taux = CompletionProjection.Rate(
            [new PlayerEvent("1", "u", PlayerEventType.CompletedGame,
                             new EventTarget("Work", "a"), new Year(1997), Saisie)]);

        Assert.Contains("1", taux.Summary);
    }

    [Fact]
    public void Un_taux_sans_aucune_declaration_ne_divise_pas_par_zero()
    {
        // Cas dégénéré : un profil vide. Le taux n'est pas zéro, il n'existe
        // pas — et l'afficher à 0 % accuserait le joueur de n'avoir rien fini
        // alors qu'il n'a rien déclaré.
        var taux = CompletionProjection.Rate(Array.Empty<PlayerEvent>());

        Assert.Equal(0, taux.Declared);
        Assert.Null(taux.Ratio);
    }

    [Fact]
    public void Une_oeuvre_n_est_comptee_qu_une_fois_dans_le_denominateur()
    {
        // Plusieurs événements sur la même œuvre — découvert, commencé,
        // terminé — ne font qu'un titre déclaré.
        var events = new[]
        {
            E(PlayerEventType.DiscoveredGame, 1996),
            E(PlayerEventType.StartedGame, 1997),
            E(PlayerEventType.CompletedGame, 1998),
        };

        var taux = CompletionProjection.Rate(events);

        Assert.Equal(1, taux.Declared);
        Assert.Equal(1, taux.Finished);
    }

    // ---------- invariants --------------------------------------------------

    [Theory]
    [InlineData(PlayerEventType.DiscoveredGame)]
    [InlineData(PlayerEventType.StartedGame)]
    [InlineData(PlayerEventType.CompletedGame)]
    [InlineData(PlayerEventType.AbandonedGame)]
    [InlineData(PlayerEventType.ReplayedGame)]
    [InlineData(PlayerEventType.AcquiredItem)]
    [InlineData(PlayerEventType.SoldItem)]
    public void Invariant_tout_jeu_d_evenements_donne_exactement_une_position(string type)
    {
        // Le type de retour l'impose, mais le test garde contre une valeur
        // d'énumération hors domaine — par exemple un default(T) silencieux.
        var position = Position(E(type, 1997));

        Assert.Contains(position, Enum.GetValues<CompletionPosition>());
    }

    [Fact]
    public void Invariant_la_possession_ne_change_jamais_la_position_de_jeu()
    {
        // Invariant 5 : possession et expérience sont indépendantes. Acheter
        // n'est pas jouer, et vendre n'est pas abandonner.
        var sansPossession = Position(E(PlayerEventType.StartedGame, 1997));
        var avecPossession = Position(
            E(PlayerEventType.StartedGame, 1997),
            E(PlayerEventType.AcquiredItem, 1997),
            E(PlayerEventType.SoldItem, 2002));

        Assert.Equal(sansPossession, avecPossession);
        Assert.Equal(CompletionPosition.StillPlaying, avecPossession);
    }
}
