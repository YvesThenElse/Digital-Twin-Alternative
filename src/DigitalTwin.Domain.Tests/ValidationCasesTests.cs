using DigitalTwin.Domain.Player;
using DigitalTwin.Domain.Reference;
using DigitalTwin.Domain.Temporal;

namespace DigitalTwin.Domain.Tests;

/// <summary>
/// Item 13 — <b>les huit cas de validation. C'est la porte de sortie de la
/// Phase 0.</b>
///
/// MODELE-DE-DOMAINE §12 : « Le modèle est validé quand ces parcours se
/// rejouent en produisant l'état attendu. » PHASING §3 ajoute : « pas quand
/// le diagramme paraît élégant ».
///
/// Chacun est écrit comme un <b>jeu d'événements de référence</b>, conservé
/// en test de non-régression permanent (§17.4).
/// </summary>
public class ValidationCasesTests
{
    private static readonly DateTime Saisie =
        new(2026, 1, 15, 12, 0, 0, DateTimeKind.Utc);

    private static TemporalHorizon Horizon(int? naissance = null) =>
        new(new DateOnly(2026, 9, 20), naissance);

    private static PlayerEvent Ev(string id, string type, string cible,
                                  TemporalValue quand, int jourSaisie = 15) =>
        new(id, "usr_yves", type, new EventTarget("Work", cible), quand,
            new DateTime(2026, 1, jourSaisie, 12, 0, 0, DateTimeKind.Utc));

    // =====================================================================
    // Cas 1 — Game Boy 1991 → retrogaming 2018
    // =====================================================================

    [Fact]
    public void Cas1_trente_ans_avec_une_console_revendue_puis_rachetee()
    {
        // §7.1. La même plateforme, acquise, cédée, puis rachetée vingt-quatre
        // ans plus tard. Le modèle doit rendre cette histoire SANS bricolage :
        // trois événements, pas un champ « possédé » qu'on bascule.
        var events = new[]
        {
            Ev("e1", PlayerEventType.AcquiredItem, "plt_gameboy", new Year(1991)),
            Ev("e2", PlayerEventType.StartedGame, "wrk_tetris", new Year(1991)),
            Ev("e3", PlayerEventType.SoldItem, "plt_gameboy", new Year(1994)),
            Ev("e4", PlayerEventType.AcquiredItem, "plt_gameboy", new Year(2018)),
            Ev("e5", PlayerEventType.ReplayedGame, "wrk_tetris", new Year(2018)),
        };

        var tri = TimelineSorter.Sort(events, Horizon());

        // La timeline restitue les trente ans dans l'ordre, sans avertissement :
        // revendre puis racheter n'a rien d'incohérent.
        Assert.Equal(["e1", "e2", "e3", "e4", "e5"], tri.OnAxis.Select(e => e.Id));
        Assert.Empty(tri.Warnings);

        // Et la possession se lit À UNE DATE, pas comme un état courant.
        var exemplaire = new OwnedConsole("plt_gameboy", new Year(1991), new Year(1994));
        Assert.Equal(Certainty.Certain,
            OwnershipProjection.OwnedDuring(
                exemplaire.AcquiredAt, exemplaire.DisposedAt, new Year(1992), Horizon()));
        Assert.Equal(Certainty.No,
            OwnershipProjection.OwnedDuring(
                exemplaire.AcquiredAt, exemplaire.DisposedAt, new Year(2000), Horizon()));
    }

    private sealed record OwnedConsole(
        string Id, TemporalValue AcquiredAt, TemporalValue? DisposedAt) : IOwnableItem;

    // =====================================================================
    // Cas 2 — Final Fantasy VII, et le remake HORS de la chaîne
    // =====================================================================

    [Fact]
    public void Cas2_le_remake_est_une_autre_oeuvre_reliee_mais_distincte()
    {
        var catalogue = new ReferenceCatalog()
            .Add(new Work("wrk_ffvii", "Final Fantasy VII"))
            .Add(new Work("wrk_ffvii_remake", "Final Fantasy VII Remake"))
            .Relate("wrk_ffvii_remake", "wrk_ffvii", WorkRelationKind.Remake);

        // Deux œuvres, pas une. Les confondre ferait disparaître 1997 derrière
        // 2020 — ou l'inverse — dans le parcours d'un joueur qui a connu les
        // deux.
        Assert.NotEqual(catalogue.ById("wrk_ffvii"), catalogue.ById("wrk_ffvii_remake"));
        Assert.False(catalogue.SameWork("wrk_ffvii", "wrk_ffvii_remake"));

        // Mais reliées, et par un lien NOMMÉ.
        var lien = Assert.Single(catalogue.RelationsOf("wrk_ffvii_remake"));
        Assert.Equal(WorkRelationKind.Remake, lien.Kind);
    }

    [Fact]
    public void Cas2_la_meme_oeuvre_possedee_plusieurs_fois_sur_trois_decennies()
    {
        // §6.1 : PS PAL Platinum, puis version numérique. Deux exemplaires
        // d'une même œuvre, à deux époques — ce que la chaîne à quatre
        // niveaux existe pour permettre.
        var exemplaires = new[]
        {
            new Copy("edt_platinum", new Year(1998), new Year(2003)),
            new Copy("edt_numerique", new Year(2013), null),
        };

        var en2000 = exemplaires
            .Select(c => OwnershipProjection.OwnedDuring(
                c.AcquiredAt, c.DisposedAt, new Year(2000), Horizon()))
            .ToArray();
        var en2020 = exemplaires
            .Select(c => OwnershipProjection.OwnedDuring(
                c.AcquiredAt, c.DisposedAt, new Year(2020), Horizon()))
            .ToArray();

        Assert.Equal([Certainty.Certain, Certainty.No], en2000);
        Assert.Equal([Certainty.No, Certainty.Certain], en2020);
    }

    private sealed record Copy(
        string Id, TemporalValue AcquiredAt, TemporalValue? DisposedAt) : IOwnableItem;

    // =====================================================================
    // Cas 3 — joué sans posséder
    // =====================================================================

    [Fact]
    public void Cas3_street_fighter_chez_un_cousin_sans_aucun_exemplaire()
    {
        // Invariant 5 : possession et expérience sont indépendantes. Le
        // parcours doit tenir SANS qu'aucun exemplaire n'existe.
        var declaration = new PlayDeclaration("usr_yves", "wrk_sf2", "plt_snes")
            .WithProvenance(Provenance.Elsewhere);

        var events = new[] { Ev("e1", PlayerEventType.StartedGame, "wrk_sf2", new Year(1993)) };

        Assert.Equal(Provenance.Elsewhere, declaration.Provenance);
        Assert.Equal(CompletionPosition.StillPlaying,
            CompletionProjection.PositionOf(events, "wrk_sf2"));

        // Aucun événement de possession : le jeu compte dans le parcours et
        // pas dans la collection.
        Assert.DoesNotContain(events, e =>
            e.Type is PlayerEventType.AcquiredItem or PlayerEventType.SoldItem);
        Assert.Equal(1, CompletionProjection.Rate(events).Declared);
    }

    // =====================================================================
    // Cas 4 — le souvenir flou, recalculé rétroactivement
    // =====================================================================

    [Fact]
    public void Cas4_renseigner_l_annee_de_naissance_recalcule_tous_les_moments()
    {
        var events = new[]
        {
            Ev("vers_12_ans", PlayerEventType.StartedGame, "wrk_a", new Age(12)),
            Ev("ancre_1990", PlayerEventType.StartedGame, "wrk_b", new Year(1990)),
            Ev("ancre_2000", PlayerEventType.StartedGame, "wrk_c", new Year(2000)),
        };

        // Sans année de naissance : le moment flou reste au tiroir.
        var avant = TimelineSorter.Sort(events, Horizon());
        Assert.Equal(["vers_12_ans"], avant.Undated.Select(e => e.Id));

        // Renseignée : il rejoint l'axe, à sa place.
        var apres = TimelineSorter.Sort(events, Horizon(1982));
        Assert.Empty(apres.Undated);
        Assert.Equal(["ancre_1990", "vers_12_ans", "ancre_2000"],
                     apres.OnAxis.Select(e => e.Id));

        // Corrigée : TOUS les moments concernés se recalculent.
        var corrige = TimelineSorter.Sort(events, Horizon(1976));
        Assert.Equal(["vers_12_ans", "ancre_1990", "ancre_2000"],
                     corrige.OnAxis.Select(e => e.Id));
    }

    // =====================================================================
    // Cas 5 — la compilation
    // =====================================================================

    [Fact]
    public void Cas5_posseder_la_compilation_ne_fait_pas_posseder_les_jeux()
    {
        // §6.3, réponse attendue : NON. Une compilation est un objet
        // commercial ; les œuvres qu'elle réunit gardent leur existence
        // propre, et le joueur n'en possède aucun exemplaire séparé.
        var compilation = new Edition("edt_compil", "rel_x", "Collection Anniversaire")
        {
            ContainedWorkIds = ["wrk_jeu1", "wrk_jeu2", "wrk_jeu3"],
        };
        var catalogue = new ReferenceCatalog().Add(compilation);

        var possession = Ev("e1", PlayerEventType.AcquiredItem, "edt_compil", new Year(2015));

        // Ce qui est possédé, c'est l'édition — pas les trois œuvres.
        Assert.Equal("edt_compil", possession.Target.Id);
        Assert.DoesNotContain(compilation.ContainedWorkIds, w => w == possession.Target.Id);

        // Mais l'expérience de chaque jeu reste déclarable, séparément.
        var joues = compilation.ContainedWorkIds
            .Select((w, i) => Ev($"j{i}", PlayerEventType.StartedGame, w, new Year(2015)))
            .ToArray();

        Assert.All(compilation.ContainedWorkIds, w =>
            Assert.Equal(CompletionPosition.StillPlaying,
                CompletionProjection.PositionOf(joues, w)));
        Assert.Equal(3, CompletionProjection.Rate(joues).Declared);
        Assert.NotNull(catalogue.EditionById("edt_compil"));
    }

    // =====================================================================
    // Cas 6 — la rétrocompatibilité
    // =====================================================================

    [Fact]
    public void Cas6_jouer_un_jeu_mega_drive_sur_switch_change_la_sortie_pas_l_oeuvre()
    {
        // La question de §6.3 : « relève de quelle Release ? » La réponse que
        // la chaîne à quatre niveaux impose : l'ŒUVRE est la même, la SORTIE
        // diffère. C'est exactement ce que la distinction existe pour dire.
        var catalogue = new ReferenceCatalog().Add(new Work("wrk_sonic", "Sonic"));

        var surMegaDrive = new Release("rel_sonic_md", "gvr_sonic", "plt_megadrive", "PAL");
        var surSwitch = new Release("rel_sonic_switch", "gvr_sonic", "plt_switch", "PAL");

        Assert.NotEqual(surMegaDrive.CanonicalId, surSwitch.CanonicalId);
        Assert.Equal(surMegaDrive.GameVersionId, surSwitch.GameVersionId);

        // Deux parties, deux plateformes, une seule œuvre : le parcours ne se
        // dédouble pas.
        var events = new[]
        {
            Ev("md", PlayerEventType.StartedGame, "wrk_sonic", new Year(1992)),
            Ev("switch", PlayerEventType.ReplayedGame, "wrk_sonic", new Year(2023)),
        };

        Assert.Equal(1, CompletionProjection.Rate(events).Declared);
        Assert.NotNull(catalogue.ById("wrk_sonic"));
    }

    // =====================================================================
    // Cas 7 — la scission
    // =====================================================================

    [Fact]
    public void Cas7_une_fiche_scindee_redirige_les_evenements_sans_perte()
    {
        // §10.2 : le CanonicalId d'origine reste sur l'entité qui conserve la
        // majorité des correspondances externes ; l'autre en reçoit un
        // nouveau. Les références anciennes se redirigent.
        var catalogue = new ReferenceCatalog()
            .Add(new Work("wrk_ancien", "Fiche fourre-tout"))
            .Add(new Work("wrk_scinde", "Le vrai jeu"))
            .RecordSplit("wrk_ancien", "wrk_scinde");

        // Un événement saisi AVANT la scission pointe encore sur l'ancien id.
        var ancien = Ev("e1", PlayerEventType.CompletedGame, "wrk_ancien", new Year(1998));

        // Il se résout sans perte.
        Assert.Equal("wrk_scinde", catalogue.Resolve(ancien.Target.Id));
        Assert.Equal("Le vrai jeu", catalogue.ById(ancien.Target.Id)!.Title);

        // Et l'identifiant retiré n'est jamais réutilisé pour autre chose
        // (invariant 9) : il ne désigne plus qu'une redirection.
        Assert.True(catalogue.SameWork("wrk_ancien", "wrk_scinde"));
    }

    [Fact]
    public void Cas7_une_redirection_en_chaine_se_resout_aussi()
    {
        // Cas dégénéré : deux scissions successives. Un export de trois ans
        // doit encore trouver son œuvre.
        var catalogue = new ReferenceCatalog()
            .Add(new Work("wrk_final", "Final"))
            .RecordSplit("wrk_v1", "wrk_v2")
            .RecordSplit("wrk_v2", "wrk_final");

        Assert.Equal("wrk_final", catalogue.Resolve("wrk_v1"));
    }

    // =====================================================================
    // Cas 8 — Pokémon Rouge, trois entités pour un souvenir
    // =====================================================================

    [Fact]
    public void Cas8_trois_fiches_de_la_source_designent_une_seule_oeuvre()
    {
        // Constaté sur pièces lors de la calibration : Wikidata porte
        // Q91030617 (Rouge/Vert, Japon 1996), Q25536523 (Rouge, 1996) et
        // Q637137 (Rouge/Bleu, international 1998).
        var catalogue = new ReferenceCatalog()
            .Add(new Work("wrk_pokemon_rouge", "Pokémon Rouge")
            {
                ExternalIds = ["Q91030617", "Q25536523", "Q637137"],
            });

        Assert.Equal("wrk_pokemon_rouge", catalogue.ByExternalId("Q91030617")!.CanonicalId);
        Assert.Equal("wrk_pokemon_rouge", catalogue.ByExternalId("Q637137")!.CanonicalId);

        // Un joueur français de 1999 et un joueur japonais de 1996 doivent
        // pouvoir se comparer : leurs deux références désignent la même œuvre.
        Assert.True(catalogue.SameWork("Q637137", "Q91030617"));
    }

    [Fact]
    public void Cas8_aucune_duplication_dans_un_profil()
    {
        // L'attendu opérationnel : deux événements saisis depuis deux fiches
        // différentes de la source ne font qu'un titre dans le parcours.
        var catalogue = new ReferenceCatalog()
            .Add(new Work("wrk_pokemon_rouge", "Pokémon Rouge")
            {
                ExternalIds = ["Q91030617", "Q637137"],
            });

        var canonique = new[] { "Q91030617", "Q637137" }
            .Select(id => catalogue.ByExternalId(id)!.CanonicalId)
            .Distinct()
            .ToArray();

        Assert.Single(canonique);

        var events = canonique
            .Select(id => Ev("e", PlayerEventType.CompletedGame, id, new Year(1999)))
            .ToArray();

        Assert.Equal(1, CompletionProjection.Rate(events).Declared);
    }

    // =====================================================================
    // La porte
    // =====================================================================

    [Fact]
    public void Les_huit_cas_de_validation_sont_couverts()
    {
        // PHASING §3 : « Le modèle est validé quand ils se rejouent en
        // produisant l'état attendu — pas quand le diagramme paraît élégant. »
        //
        // Ce test constate la couverture. Il échouera si un cas disparaît,
        // ce qui est exactement le signal qu'on voudrait recevoir.
        var methodes = typeof(ValidationCasesTests)
            .GetMethods()
            .Select(m => m.Name)
            .Where(n => n.StartsWith("Cas", StringComparison.Ordinal))
            .ToArray();

        foreach (var numero in Enumerable.Range(1, 8))
        {
            Assert.Contains(methodes, n =>
                n.StartsWith($"Cas{numero}_", StringComparison.Ordinal));
        }
    }
}
