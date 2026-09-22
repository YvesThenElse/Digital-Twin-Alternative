using DigitalTwin.Domain.Player;

namespace DigitalTwin.Domain.Tests.Player;

/// <summary>
/// Item 11, seconde moitié — <c>PlayDeclaration</c>.
///
/// Référence : MODELE-DE-DOMAINE §5, invariants 6 et 8 de §7.
/// </summary>
public class PlayDeclarationTests
{
    private static PlayDeclaration D(
        string work = "wrk_ffvii",
        Provenance provenance = Provenance.Unknown,
        Affect affect = Affect.Indifferent) =>
        new("usr_yves", work, "plt_ps1") { Provenance = provenance, Affect = affect };

    // ---------- §2 : une déclaration n'a pas de date ----------------------

    [Fact]
    public void Une_declaration_n_a_pas_de_moment()
    {
        // « Si la question quand ? a une réponse, c'est un événement ; sinon
        // c'est une déclaration. » « J'ai adoré ce jeu » n'a pas de date, et
        // forcer un horodatage inventerait une précision que §7.4 interdit.
        var proprietes = typeof(PlayDeclaration).GetProperties().Select(p => p.Name);

        Assert.DoesNotContain(proprietes, n => n.Contains("OccurredAt", StringComparison.Ordinal));
        Assert.DoesNotContain(proprietes, n => n.Contains("Date", StringComparison.Ordinal));
    }

    [Fact]
    public void Une_declaration_porte_son_utilisateur()
    {
        // Invariant 11, comme pour les événements : condition de la purge.
        Assert.Equal("usr_yves", D().UserId);
    }

    // ---------- invariant 8 : NeverPlayed exclut tout le reste ------------

    [Fact]
    public void Jamais_joue_est_une_declaration_positive()
    {
        // §24.3 : distincte du silence. Ne rien dire et dire « je n'y ai
        // jamais joué » sont deux informations différentes, et la seconde
        // fait avancer la reconstruction.
        Assert.True(D().DeclareNeverPlayed().NeverPlayed);
    }

    [Fact]
    public void Un_jugement_neuf_ne_porte_aucun_affect_declare()
    {
        // « Sans plus » est une RÉPONSE — « ça ne m'a rien laissé » —, pas
        // l'absence de réponse. Les principes transverses rangent les deux
        // parmi les distinctions que le modèle existe pour tenir : « ça ne
        // lui a rien laissé » contre « il n'a rien dit ».
        //
        // L'enum n'avait pas de valeur pour la seconde, si bien que la ligne
        // de base tombait sur `Indifferent` par défaut. Quatre jeux d'un
        // profil de test portaient ainsi un avis que personne n'avait donné —
        // et sur une plateforme de mémoire, « ça ne m'a rien laissé » est
        // l'inverse de ce qu'on veut supposer.
        var neuf = new PlayDeclaration("usr_yves", "wrk_ffvii", "plt_ps1");

        Assert.Equal(Affect.Unstated, neuf.Affect);
        Assert.NotEqual(Affect.Indifferent, neuf.Affect);
    }

    [Fact]
    public void L_absence_de_reponse_est_la_valeur_par_defaut_de_l_enum()
    {
        // Elle doit valoir zéro : toute structure construite sans affect
        // explicite y tombe, et c'est le seul moyen qu'aucun chemin
        // n'invente « sans plus » en silence.
        Assert.Equal(Affect.Unstated, default(Affect));
    }

    [Fact]
    public void Jamais_joue_efface_l_affect_et_la_provenance()
    {
        // Invariant 8. Les garder produirait une déclaration contradictoire :
        // « je n'y ai jamais joué, et je l'ai adoré ».
        var contradictoire = D(provenance: Provenance.Owned, affect: Affect.Loved);
        var jamais = contradictoire.DeclareNeverPlayed();

        Assert.True(jamais.NeverPlayed);
        Assert.Equal(Provenance.Unknown, jamais.Provenance);
        // Effacé veut dire « pas prononcé », pas « sans plus » : « je n'y ai
        // jamais joué » ne dit rien de ce que le jeu lui a laissé.
        Assert.Equal(Affect.Unstated, jamais.Affect);
    }

    [Fact]
    public void Declarer_un_affect_leve_jamais_joue()
    {
        // La réciproque, et c'est ce qui rend l'invariant tenable : dire
        // « j'ai adoré » après avoir dit « jamais joué » est une CORRECTION,
        // pas une erreur à refuser (invariant 10).
        var jamais = D().DeclareNeverPlayed();
        var corrige = jamais.WithAffect(Affect.Loved);

        Assert.False(corrige.NeverPlayed);
        Assert.Equal(Affect.Loved, corrige.Affect);
    }

    [Fact]
    public void Declarer_une_provenance_leve_aussi_jamais_joue()
    {
        var corrige = D().DeclareNeverPlayed().WithProvenance(Provenance.Borrowed);

        Assert.False(corrige.NeverPlayed);
        Assert.Equal(Provenance.Borrowed, corrige.Provenance);
    }

    // ---------- invariant 6 : un seul préféré par plateforme --------------

    [Fact]
    public void Designer_un_prefere_retrograde_le_precedent()
    {
        // « En désigner un second rétrograde le précédent en Loved. » Le
        // modèle ne refuse pas le second choix : il ajuste le premier.
        var collection = new[] { D("wrk_ffvii", affect: Affect.Favourite), D("wrk_zelda") };

        var apres = PlayDeclaration.DesignateFavourite(collection, "wrk_zelda", "plt_ps1");

        Assert.Equal(Affect.Loved, apres.Single(d => d.WorkId == "wrk_ffvii").Affect);
        Assert.Equal(Affect.Favourite, apres.Single(d => d.WorkId == "wrk_zelda").Affect);
    }

    [Fact]
    public void La_retrogradation_ne_franchit_pas_les_plateformes()
    {
        // « Unique PAR PLATEFORME » : un préféré Super Nintendo n'a rien à
        // voir avec un préféré PlayStation.
        var snes = new PlayDeclaration("usr_yves", "wrk_chrono", "plt_snes")
        {
            Affect = Affect.Favourite,
        };
        var collection = new[] { snes, D("wrk_zelda") };

        var apres = PlayDeclaration.DesignateFavourite(collection, "wrk_zelda", "plt_ps1");

        Assert.Equal(Affect.Favourite, apres.Single(d => d.WorkId == "wrk_chrono").Affect);
        Assert.Equal(Affect.Favourite, apres.Single(d => d.WorkId == "wrk_zelda").Affect);
    }

    [Fact]
    public void Invariant_une_plateforme_n_a_jamais_deux_preferes()
    {
        // Le cas dégénéré : une collection déjà fautive. Désigner un préféré
        // doit la réparer, pas ajouter un troisième.
        var fautive = new[]
        {
            D("wrk_a", affect: Affect.Favourite),
            D("wrk_b", affect: Affect.Favourite),
            D("wrk_c"),
        };

        var apres = PlayDeclaration.DesignateFavourite(fautive, "wrk_c", "plt_ps1");

        Assert.Single(apres.Where(d => d.Affect == Affect.Favourite));
    }

    [Fact]
    public void Redesigner_le_meme_prefere_ne_change_rien()
    {
        var collection = new[] { D("wrk_ffvii", affect: Affect.Favourite) };

        var apres = PlayDeclaration.DesignateFavourite(collection, "wrk_ffvii", "plt_ps1");

        Assert.Equal(Affect.Favourite, Assert.Single(apres).Affect);
    }

    [Fact]
    public void Designer_un_prefere_leve_jamais_joue()
    {
        // Cohérent avec l'invariant 8 : on ne peut pas préférer un jeu auquel
        // on déclare n'avoir jamais joué.
        var collection = new[] { D("wrk_zelda").DeclareNeverPlayed() };

        var apres = PlayDeclaration.DesignateFavourite(collection, "wrk_zelda", "plt_ps1");

        Assert.False(Assert.Single(apres).NeverPlayed);
    }
}
