using System.Text.RegularExpressions;
using DigitalTwin.Domain.Player;
using DigitalTwin.Domain.Temporal;

namespace DigitalTwin.Domain.Tests.Player;

/// <summary>
/// La synthèse de l'en-tête de <c>/mon-histoire</c> (E04, blocs A et B).
///
/// <para><b>Elle est ici et non dans l'écran.</b> Un chiffre recompté par le
/// front porterait sur ce qui est affiché — trente lignes chargées, une
/// plateforme — et non sur ce que le joueur a déclaré. Il dirait « 1 console »
/// à quelqu'un qui en a saisi quatre, et personne ne le verrait : le nombre
/// serait juste par rapport à l'écran.</para>
///
/// <para>E04 pose la contrainte dure : « Des statistiques calculées sur cinq
/// jeux détruisent la crédibilité de l'écran — c'est le principal risque de
/// cette page. »</para>
/// </summary>
public class ProfileProjectionTests
{
    private static readonly TemporalHorizon Aujourdhui =
        new(new DateOnly(2026, 9, 23), null);

    private static readonly DateTime Saisie =
        new(2026, 1, 15, 12, 0, 0, DateTimeKind.Utc);

    private static PlayerEvent E(
        string type, string cible, TemporalValue quand,
        string? plateforme = "plt_snes", string genre = "work", string? id = null) =>
        new(id ?? $"evt_{Guid.NewGuid():N}"[..24], "usr_yves", type,
            new EventTarget(genre, cible), quand, Saisie)
        { PlatformId = plateforme };

    private static ProfileSummary Synthese(
        IEnumerable<PlayerEvent> journal, params EventTarget[] souvenirs) =>
        ProfileProjection.Summarize([.. journal], souvenirs, Aujourdhui);

    /// <summary>Assez de moments pour que le portrait tienne — le seuil de la fiche.</summary>
    private static List<PlayerEvent> Nourri(int combien = ProfileSummary.PortraitThreshold) =>
        [.. Enumerable.Range(0, combien).Select(i =>
            E(PlayerEventType.StartedGame, $"wrk_{i}", new Year(2000 + i), id: $"evt_n{i}"))];

    // ---------- les quatre chiffres ---------------------------------------

    [Fact]
    public void Les_quatre_chiffres_viennent_du_journal()
    {
        var journal = new List<PlayerEvent>
        {
            E(PlayerEventType.StartedGame, "wrk_a", new Year(1995)),
            E(PlayerEventType.CompletedGame, "wrk_a", new Year(1996)),
            E(PlayerEventType.StartedGame, "wrk_b", new Year(1997)),
            E(PlayerEventType.StartedGame, "wrk_c", new Year(2001), plateforme: "plt_ps2"),
        };

        var synthese = Synthese(journal, new EventTarget("work", "wrk_a"));

        Assert.Equal(2, synthese.Consoles);
        Assert.Equal(3, synthese.GamesDeclared);
        Assert.Equal(1, synthese.Finished);
        Assert.Equal(1, synthese.MemoriesWritten);
    }

    [Fact]
    public void Le_titre_saisi_hors_referentiel_compte_comme_un_jeu()
    {
        // §3.5 : une revendication est « visible dans son profil comme les
        // autres ». L'écarter du compte ferait mentir le chiffre pour celui
        // qui a justement pris la peine de saisir ce que le catalogue ignore.
        var synthese = Synthese([
            E(PlayerEventType.StartedGame, "wrk_a", new Year(1995)),
            E(PlayerEventType.StartedGame, "ucl_x", new Year(1995), genre: "unresolvedClaim"),
        ]);

        Assert.Equal(2, synthese.GamesDeclared);
    }

    [Fact]
    public void Posseder_n_est_pas_jouer()
    {
        // Invariant 5. Le chiffre annoncé est « jeux déclarés », et une
        // cartouche achetée jamais lancée n'en est pas un.
        var possede = Synthese([
            E(PlayerEventType.AcquiredItem, "wrk_a", new Year(1995)),
        ]);
        Assert.Equal(0, possede.GamesDeclared);

        // Le témoin : le MÊME titre, joué, entre bien au compte. Sans lui, un
        // compteur en panne rendrait zéro et ce test le féliciterait.
        var joue = Synthese([
            E(PlayerEventType.AcquiredItem, "wrk_a", new Year(1995)),
            E(PlayerEventType.StartedGame, "wrk_a", new Year(1995)),
        ]);
        Assert.Equal(1, joue.GamesDeclared);
    }

    [Fact]
    public void Une_console_sans_declaration_ne_se_compte_pas_deux_fois()
    {
        // Les consoles se comptent sur la plateforme REÇUE avec la
        // déclaration (PlayerEvent.PlatformId), jamais déduite de l'œuvre :
        // le dataset POC n'a qu'un titre multi-plateforme, et une déduction
        // passerait ici pour se mettre à mentir dès qu'il grandit.
        var synthese = Synthese([
            E(PlayerEventType.StartedGame, "wrk_a", new Year(1995)),
            E(PlayerEventType.StartedGame, "wrk_b", new Year(1995)),
            E(PlayerEventType.StartedGame, "wrk_c", new Year(1995), plateforme: null),
        ]);

        Assert.Equal(1, synthese.Consoles);
    }

    [Fact]
    public void Deux_souvenirs_sur_la_meme_cible_ne_comptent_qu_une_fois()
    {
        // Le modèle attache le souvenir à la CIBLE (MODELE §5) : trois
        // moments du même jeu en portent un seul.
        var synthese = Synthese(
            [E(PlayerEventType.StartedGame, "wrk_a", new Year(1995))],
            new EventTarget("work", "wrk_a"),
            new EventTarget("work", "wrk_a"),
            new EventTarget("unresolvedClaim", "ucl_x"));

        Assert.Equal(2, synthese.MemoriesWritten);
    }

    // ---------- le seuil du portrait --------------------------------------

    [Fact]
    public void Un_profil_vide_ne_fait_pas_un_portrait()
    {
        var vide = Synthese([]);
        Assert.False(vide.MakesAPortrait);

        // Le témoin (apprentissage 78) : un profil nourri en fait un. Sans
        // lui, « faux » se satisfairait d'un seuil devenu inatteignable.
        Assert.True(Synthese(Nourri()).MakesAPortrait);
    }

    [Fact]
    public void Le_seuil_est_celui_de_la_fiche_dix_moments()
    {
        // E04, états : « Trop maigre pour un portrait (moins de ~10
        // moments) : afficher la phrase […], MASQUER les chiffres. »
        Assert.False(Synthese(Nourri(ProfileSummary.PortraitThreshold - 1)).MakesAPortrait);
        Assert.True(Synthese(Nourri(ProfileSummary.PortraitThreshold)).MakesAPortrait);
    }

    [Fact]
    public void Le_seuil_est_celui_QUE_LA_FICHE_ECRIT()
    {
        // Le test ci-dessus est relatif à la constante : il éprouve la borne
        // (« moins de » et non « au plus »), et resterait vert si le seuil
        // passait à trois. Or le nombre est écrit DEUX FOIS — dans la fiche et
        // ici —, et deux écritures d'un même nombre divergent. C'est la fiche
        // qui fait foi (apprentissage 77).
        var fiche = Lire("ecrans", "E04-profil.md");
        var ecrit = Regex.Match(fiche, @"moins de ~(\d+) moments");

        Assert.True(ecrit.Success,
            "E04 n'écrit plus « moins de ~N moments » : le seuil du portrait "
            + "n'a plus de source, et le code est seul à le connaître.");
        Assert.Equal(int.Parse(ecrit.Groups[1].Value), ProfileSummary.PortraitThreshold);
    }

    // ---------- l'étendue (bloc ⒞) ----------------------------------------

    [Fact]
    public void L_etendue_porte_les_deux_bornes_de_l_histoire()
    {
        var journal = new List<PlayerEvent>
        {
            E(PlayerEventType.StartedGame, "wrk_a", new Year(1991)),
            E(PlayerEventType.StartedGame, "wrk_b", new Year(2004)),
            E(PlayerEventType.CompletedGame, "wrk_c", new Year(2019)),
        };

        var etendue = Synthese(journal).Span;

        Assert.NotNull(etendue);
        Assert.Equal(1991, etendue.FirstYear);
        Assert.Equal(2019, etendue.LastYear);
    }

    [Fact]
    public void L_etendue_s_arrete_a_la_derniere_declaration_et_PAS_a_aujourd_hui()
    {
        // Le contraire de la bande de densité, qui court jusqu'à aujourd'hui
        // pour montrer le silence. Ici c'est l'ÉTENDUE DE L'HISTOIRE : la
        // faire courir jusqu'à 2026 annoncerait une histoire qui va
        // jusqu'à aujourd'hui alors que rien n'y a été déclaré depuis 2004,
        // et les deux blocs diraient la même chose.
        var journal = new List<PlayerEvent>
        {
            E(PlayerEventType.StartedGame, "wrk_a", new Year(1991)),
            E(PlayerEventType.StartedGame, "wrk_b", new Year(2004)),
        };

        var synthese = Synthese(journal);

        Assert.Equal(2004, synthese.Span!.LastYear);
        // Témoin : la bande, elle, va bien jusqu'à la décennie d'aujourd'hui.
        Assert.Equal(2020, synthese.Activity[^1].Decade);
    }

    [Fact]
    public void L_etendue_ne_compte_que_ce_qui_est_JOUE_comme_la_phrase()
    {
        // Invariant 5, la même raison que pour la phrase : une console
        // achetée d'occasion en 1985 antidaterait l'histoire de quelqu'un
        // qui n'y avait pas encore touché — et la ligne dirait 1985 sous une
        // phrase qui dit 1991.
        var journal = new List<PlayerEvent>
        {
            E(PlayerEventType.AcquiredItem, "wrk_vieux", new Year(1985)),
            E(PlayerEventType.StartedGame, "wrk_a", new Year(1991)),
            E(PlayerEventType.StartedGame, "wrk_b", new Year(2004)),
        };

        var synthese = Synthese(journal);

        Assert.Equal(1991, synthese.Span!.FirstYear);
        Assert.Equal(1991, ((Year)synthese.Opening!.OccurredAt).Value);
    }

    [Fact]
    public void L_etendue_ne_s_inverse_pas_quand_une_periode_commence_avant_le_premier_de_l_axe()
    {
        // Le piège : l'axe trie par POINT REPRÉSENTATIF — le milieu, pour une
        // période — tandis que l'année affichée est celle qui a été DÉCLARÉE,
        // soit le début. Prendre la première et la dernière entrée de l'axe
        // rendrait donc ici 1990 → 1985 : une ligne à l'envers.
        //
        // Et une période ne compte que par son DÉBUT, partout dans cette
        // projection — « une période commence à son début ». La borne haute
        // vaut donc 1990 et non 2005 : la ligne sous-couvre ce moment-là,
        // exactement comme la bande de densité qui le range dans les
        // années 80. Une seconde règle ici ferait diverger les deux blocs.
        var journal = new List<PlayerEvent>
        {
            E(PlayerEventType.StartedGame, "wrk_a", new Year(1990)),
            E(PlayerEventType.StartedGame, "wrk_b", new YearRange(1985, 2005)),
        };

        var etendue = Synthese(journal).Span;

        Assert.NotNull(etendue);
        Assert.True(etendue.FirstYear <= etendue.LastYear,
            $"Ligne inversée : {etendue.FirstYear} → {etendue.LastYear}.");
        Assert.Equal(1985, etendue.FirstYear);
        Assert.Equal(1990, etendue.LastYear);
    }

    [Fact]
    public void L_etendue_ne_commence_jamais_apres_la_phrase()
    {
        // La propriété qui tient les deux blocs ensemble, quel que soit le
        // journal : l'en-tête ne peut pas dire « tout a commencé en 1990 »
        // au-dessus d'une ligne qui part de 1995.
        var journal = new List<PlayerEvent>
        {
            E(PlayerEventType.StartedGame, "wrk_a", new Year(1990)),
            E(PlayerEventType.StartedGame, "wrk_b", new YearRange(1985, 2005)),
            E(PlayerEventType.StartedGame, "wrk_c", new ApproximateYear(1994, 3)),
        };

        var synthese = Synthese(journal);
        var dite = ((Year)synthese.Opening!.OccurredAt).Value;

        Assert.True(synthese.Span!.FirstYear <= dite,
            $"La ligne part de {synthese.Span.FirstYear}, la phrase dit {dite}.");
    }

    [Fact]
    public void Sans_rien_sur_l_axe_il_n_y_a_pas_d_etendue()
    {
        // Comme la phrase : un moment sans date n'a pas de place sur l'axe
        // (invariant 2), et une ligne temporelle sans bornes n'a rien à
        // montrer. Elle est absente, pas dessinée à zéro.
        var journal = new List<PlayerEvent>
        {
            E(PlayerEventType.StartedGame, "wrk_a", Unknown.Instance),
        };

        var synthese = Synthese(journal);

        Assert.Null(synthese.Span);
        Assert.Null(synthese.Opening);
    }

    [Fact]
    public void Une_seule_annee_declaree_donne_une_etendue_des_deux_cotes()
    {
        // Pas de cas particulier : un point reste une ligne dont les deux
        // bornes coïncident. L'écran décide quoi en faire ; le domaine ne
        // rend pas `null` pour une histoire qui tient en une année.
        var synthese = Synthese([E(PlayerEventType.StartedGame, "wrk_a", new Year(1998))]);

        Assert.Equal(1998, synthese.Span!.FirstYear);
        Assert.Equal(1998, synthese.Span.LastYear);
    }

    private static string Lire(params string[] chemin)
    {
        var racine = new DirectoryInfo(AppContext.BaseDirectory);
        while (racine is not null && !File.Exists(Path.Combine(racine.FullName, "PHASING.md")))
        {
            racine = racine.Parent;
        }
        Assert.NotNull(racine);
        return File.ReadAllText(Path.Combine([racine!.FullName, .. chemin]));
    }

    // ---------- la densité par décennie (bloc ⒟) --------------------------

    [Fact]
    public void La_densite_compte_les_moments_par_decennie()
    {
        var densite = Synthese([
            E(PlayerEventType.StartedGame, "wrk_a", new Year(1995)),
            E(PlayerEventType.StartedGame, "wrk_b", new Year(1997)),
            E(PlayerEventType.StartedGame, "wrk_c", new Year(2012)),
        ]).Activity;

        Assert.Equal(1990, densite[0].Decade);
        Assert.Equal(2, densite[0].Moments);
        Assert.Equal(1, densite.Single(t => t.Decade == 2010).Moments);
    }

    [Fact]
    public void Les_decennies_VIDES_sont_dedans()
    {
        // C'est le creux qui fait dire « j'ai peu joué entre 2005 et 2010 ».
        // Une liste des seules décennies peuplées dessinerait une bande
        // pleine, et ne dirait plus rien.
        var densite = Synthese([
            E(PlayerEventType.StartedGame, "wrk_a", new Year(1995)),
            E(PlayerEventType.StartedGame, "wrk_b", new Year(2015)),
        ]).Activity;

        Assert.Equal([1990, 2000, 2010, 2020], densite.Select(t => t.Decade));
        Assert.Equal(0, densite.Single(t => t.Decade == 2000).Moments);
    }

    [Fact]
    public void Elle_va_jusqu_a_AUJOURD_HUI_et_non_a_la_derniere_declaration()
    {
        // Une histoire qui s'arrête en 1995 doit montrer trente ans de
        // silence : c'est l'information la plus utile de la bande, et
        // l'arrêter à la dernière déclaration la ferait disparaître.
        var densite = Synthese([
            E(PlayerEventType.StartedGame, "wrk_a", new Year(1995)),
        ]).Activity;

        Assert.Equal(2020, densite[^1].Decade);
    }

    [Fact]
    public void Un_moment_sans_date_n_a_pas_de_decennie()
    {
        // Invariant 2 : lui en attribuer une inventerait la position que le
        // joueur a refusé de donner. Le tiroir les montre ailleurs.
        var densite = Synthese([
            E(PlayerEventType.StartedGame, "wrk_a", new Year(1995)),
            E(PlayerEventType.StartedGame, "wrk_b", Unknown.Instance),
        ]).Activity;

        Assert.Equal(1, densite.Sum(t => t.Moments));
    }

    [Fact]
    public void Un_profil_sans_aucune_date_n_a_pas_de_bande()
    {
        // Pas une bande plate : pas de bande. Une forme sans relief se lit
        // comme un défaut d'affichage.
        Assert.Empty(Synthese([
            E(PlayerEventType.StartedGame, "wrk_a", Unknown.Instance),
        ]).Activity);

        // Le témoin (78) : une seule date suffit à la faire naître.
        Assert.NotEmpty(Synthese([
            E(PlayerEventType.StartedGame, "wrk_a", new Year(1995)),
        ]).Activity);
    }

    // ---------- le début de l'histoire (bloc A) ---------------------------

    [Fact]
    public void Le_debut_est_le_premier_moment_de_l_axe_et_il_porte_sa_machine()
    {
        var journal = new List<PlayerEvent>
        {
            E(PlayerEventType.StartedGame, "wrk_b", new Year(2001), plateforme: "plt_ps2"),
            E(PlayerEventType.StartedGame, "wrk_a", new Year(1991), plateforme: "plt_gb"),
        };

        var debut = Synthese(journal).Opening;

        Assert.NotNull(debut);
        Assert.Equal(new Year(1991), debut!.OccurredAt);
        Assert.Equal("plt_gb", debut.PlatformId);
    }

    [Fact]
    public void La_duree_se_compte_depuis_l_annee_declaree_pas_depuis_l_intervalle_elargi()
    {
        // « vers 1991 » s'étend de 1989 à 1993 sur l'axe. Compter depuis sa
        // borne rendrait « 37 ans » sous une phrase qui dit 1991 : l'écran se
        // contredirait tout seul.
        var debut = Synthese([
            E(PlayerEventType.StartedGame, "wrk_a", new ApproximateYear(1991, 2)),
        ]).Opening;

        Assert.Equal(2026 - 1991, debut!.Years);
    }

    [Fact]
    public void Moins_d_un_an_ne_se_dit_pas()
    {
        // « Vous jouez depuis ≈ 0 ans » n'est pas une phrase. L'absence de
        // durée est une réponse ; un zéro n'en est pas une.
        var debut = Synthese([
            E(PlayerEventType.StartedGame, "wrk_a", new Year(2026)),
        ]).Opening;

        Assert.NotNull(debut);
        Assert.Null(debut!.Years);

        // Le témoin : la même phrase sur une année ancienne porte sa durée.
        Assert.Equal(31, Synthese([
            E(PlayerEventType.StartedGame, "wrk_a", new Year(1995)),
        ]).Opening!.Years);
    }

    [Fact]
    public void Posseder_ne_commence_pas_une_histoire_de_jeu()
    {
        // « Vous jouez depuis… » ne peut pas partir d'une acquisition :
        // invariant 5, posséder n'est pas jouer. Une console achetée
        // d'occasion en 1985 antidaterait toute l'histoire.
        var debut = Synthese([
            E(PlayerEventType.AcquiredItem, "wrk_a", new Year(1985)),
            E(PlayerEventType.StartedGame, "wrk_a", new Year(1995)),
        ]).Opening;

        Assert.Equal(new Year(1995), debut!.OccurredAt);
    }

    [Fact]
    public void Un_profil_dont_aucun_moment_n_est_date_n_a_pas_de_debut()
    {
        // Invariant 2 : « je ne sais plus » ne se projette à aucune position.
        // Il n'y a donc pas de première fois à raconter.
        var sansDate = Synthese([
            E(PlayerEventType.StartedGame, "wrk_a", Unknown.Instance),
        ]);
        Assert.Null(sansDate.Opening);

        // Le témoin : un seul moment daté suffit à faire naître la phrase.
        Assert.NotNull(Synthese([
            E(PlayerEventType.StartedGame, "wrk_a", Unknown.Instance),
            E(PlayerEventType.StartedGame, "wrk_b", new Year(1995)),
        ]).Opening);
    }

    [Fact]
    public void Un_age_sans_annee_de_naissance_ne_commence_rien()
    {
        // §7.6 : sans année de naissance, l'âge reste déclaré mais hors de
        // l'axe. Le résoudre au hasard placerait le début de l'histoire à une
        // date que personne n'a donnée.
        Assert.Null(Synthese([E(PlayerEventType.StartedGame, "wrk_a", new Age(12))]).Opening);

        // Le témoin : la MÊME déclaration, l'année de naissance connue.
        var situe = ProfileProjection.Summarize(
            [E(PlayerEventType.StartedGame, "wrk_a", new Age(12))],
            [],
            new TemporalHorizon(new DateOnly(2026, 9, 23), 1979));
        Assert.Equal(2026 - (1979 + 12), situe.Opening!.Years);
    }
}
