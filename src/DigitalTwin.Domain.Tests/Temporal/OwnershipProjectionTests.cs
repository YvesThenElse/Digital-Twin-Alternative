using DigitalTwin.Domain.Temporal;

namespace DigitalTwin.Domain.Tests.Temporal;

/// <summary>
/// Item 10 — les projections d'état à trois valeurs.
///
/// Référence : ORDONNANCEMENT-TEMPOREL §7.3, vecteur T10.
/// </summary>
public class OwnershipProjectionTests
{
    private static readonly TemporalHorizon Horizon =
        new(new DateOnly(2026, 9, 20), BirthYear: 1982);

    private sealed record Item(
        string Id, TemporalValue AcquiredAt, TemporalValue? DisposedAt) : IOwnableItem;

    private static Certainty Certitude(
        TemporalValue acquise, TemporalValue? cedee, TemporalValue periode) =>
        OwnershipProjection.OwnedDuring(acquise, cedee, periode, Horizon);

    // ---------- T10 -------------------------------------------------------

    [Fact]
    public void T10_acquisition_floue_recouvrant_la_periode_donne_possible()
    {
        // Acquisition déclarée 1993–1997, cession en 1999, requête sur 1997.
        // L'acquisition PEUT avoir eu lieu pendant 1997 : la possession n'est
        // donc pas garantie sur toute l'année, sans être impossible.
        Assert.Equal(Certainty.Possible,
            Certitude(new YearRange(1993, 1997), new Year(1999), new Year(1997)));
    }

    [Fact]
    public void T10_le_strict_ecarte_le_possible_et_le_permissif_le_marque()
    {
        // « Le mode strict ne retient que certain. Le permissif retient
        // certain + possible, et DISTINGUE les deux à l'affichage. »
        var items = new[]
        {
            new Item("sur", new Year(1993), new Year(1999)),
            new Item("peut_etre", new YearRange(1993, 1997), new Year(1999)),
        };

        var strict = OwnershipProjection.At(items, new Year(1997), QueryMode.Strict, Horizon);
        var permissif = OwnershipProjection.At(items, new Year(1997), QueryMode.Permissive, Horizon);

        Assert.Equal(["sur"], strict.Retained.Select(i => i.Id));
        Assert.Equal(["sur", "peut_etre"], permissif.Retained.Select(i => i.Id));

        // La distinction survit au mode : les deux listes restent séparées.
        Assert.Equal(["sur"], permissif.Certain.Select(i => i.Id));
        Assert.Equal(["peut_etre"], permissif.Possible.Select(i => i.Id));
    }

    // ---------- les trois valeurs -----------------------------------------

    [Fact]
    public void Certain_quand_l_acquisition_precede_et_la_cession_suit()
    {
        Assert.Equal(Certainty.Certain,
            Certitude(new Year(1993), new Year(1999), new Year(1997)));
    }

    [Fact]
    public void Certain_aussi_quand_le_jeu_n_a_jamais_ete_cede()
    {
        // Pas de cession : rien ne peut interrompre la possession.
        Assert.Equal(Certainty.Certain,
            Certitude(new Year(1993), null, new Year(1997)));
    }

    [Fact]
    public void Non_quand_l_acquisition_est_certainement_posterieure()
    {
        Assert.Equal(Certainty.No,
            Certitude(new Year(1999), null, new Year(1997)));
    }

    [Fact]
    public void Non_quand_la_cession_est_certainement_anterieure()
    {
        Assert.Equal(Certainty.No,
            Certitude(new Year(1990), new Year(1993), new Year(1997)));
    }

    [Fact]
    public void Possible_quand_la_cession_peut_tomber_dans_la_periode()
    {
        // Symétrique de T10, par l'autre bout : la cession déclarée
        // 1996–1998 peut avoir eu lieu pendant 1997.
        Assert.Equal(Certainty.Possible,
            Certitude(new Year(1990), new YearRange(1996, 1998), new Year(1997)));
    }

    [Fact]
    public void Possible_quand_l_acquisition_n_est_pas_datee()
    {
        // Sans date d'acquisition, on ne peut ni garantir ni exclure : le jeu
        // a pu être acquis avant la période. Répondre « non » inventerait une
        // certitude, répondre « certain » aussi.
        Assert.Equal(Certainty.Possible,
            Certitude(Unknown.Instance, null, new Year(1997)));
    }

    [Fact]
    public void Possible_quand_la_cession_n_est_pas_datee()
    {
        Assert.Equal(Certainty.Possible,
            Certitude(new Year(1993), Unknown.Instance, new Year(1997)));
    }

    [Fact]
    public void Une_periode_sans_intervalle_ne_permet_aucune_projection()
    {
        // Interroger « sur Unknown » : aucune comparaison possible. La réponse
        // honnête est Possible — on ne sait rien, ce qui n'est ni un oui ni
        // un non.
        Assert.Equal(Certainty.Possible,
            Certitude(new Year(1993), new Year(1999), Unknown.Instance));
    }

    // ---------- les bornes, là où l'interprétation se joue ----------------

    [Fact]
    public void L_acquisition_finissant_le_premier_jour_de_la_periode_n_est_pas_certaine()
    {
        // LE point d'interprétation. La spécification écrit « l'acquisition se
        // termine avant D » en traitant D comme un point, alors que les
        // requêtes portent sur des périodes.
        //
        // Lecture retenue : Certain = posséder PENDANT TOUTE la période. Si
        // l'acquisition peut tomber le 1er janvier 1997, la possession n'est
        // pas garantie le matin de ce jour-là.
        // ⚠️ Ce test affirmait d'abord `YearRange(1990, 1996)` -> Possible.
        // C'était FAUX : cette période finit le 31 décembre 1996, donc
        // strictement avant 1997, et la réponse correcte est Certain. Le cas
        // que je voulais éprouver est une acquisition pouvant tomber LE
        // premier jour de la période — ce qui s'écrit ainsi :
        Assert.Equal(Certainty.Possible,
            Certitude(new ExactDate(new DateOnly(1997, 1, 1)), null, new Year(1997)));

        // Une acquisition qui finit la veille, elle, est certaine.
        Assert.Equal(Certainty.Certain,
            Certitude(new ExactDate(new DateOnly(1996, 12, 31)), null, new Year(1997)));
    }

    [Fact]
    public void Une_acquisition_le_dernier_jour_de_la_periode_n_est_pas_un_non()
    {
        // L'autre borne : acquise le 31 décembre 1997, on la possède bien ce
        // jour-là. Un « ≥ » mis à la place du « > » basculerait ici.
        Assert.Equal(Certainty.Possible,
            Certitude(new ExactDate(new DateOnly(1997, 12, 31)), null, new Year(1997)));

        // Le lendemain, en revanche, c'est non.
        Assert.Equal(Certainty.No,
            Certitude(new ExactDate(new DateOnly(1998, 1, 1)), null, new Year(1997)));
    }

    [Fact]
    public void Une_cession_le_premier_jour_de_la_periode_n_est_pas_un_non()
    {
        Assert.Equal(Certainty.Possible,
            Certitude(new Year(1990), new ExactDate(new DateOnly(1997, 1, 1)), new Year(1997)));

        Assert.Equal(Certainty.No,
            Certitude(new Year(1990), new ExactDate(new DateOnly(1996, 12, 31)), new Year(1997)));
    }

    // ---------- la collection à une date ----------------------------------

    [Fact]
    public void Le_non_n_apparait_dans_aucune_des_deux_listes()
    {
        var items = new[]
        {
            new Item("garde", new Year(1993), null),
            new Item("vendu_avant", new Year(1990), new Year(1993)),
            new Item("acquis_apres", new Year(1999), null),
        };

        var r = OwnershipProjection.At(items, new Year(1997), QueryMode.Permissive, Horizon);

        Assert.Equal(["garde"], r.Retained.Select(i => i.Id));
        Assert.Empty(r.Possible);
    }

    [Fact]
    public void Le_resume_annonce_les_deux_natures_meme_a_zero()
    {
        // Même exigence qu'à l'item 09 : « une collection telle qu'en 1997
        // dont la moitié est incertaine doit le montrer ».
        var r = OwnershipProjection.At(
            [new Item("sur", new Year(1993), null)],
            new Year(1997), QueryMode.Permissive, Horizon);

        Assert.Contains("1", r.Summary);
        Assert.Contains("0", r.Summary);
    }

    [Fact]
    public void Une_collection_vide_rend_deux_listes_vides()
    {
        var r = OwnershipProjection.At(
            Array.Empty<Item>(), new Year(1997), QueryMode.Strict, Horizon);

        Assert.Empty(r.Certain);
        Assert.Empty(r.Possible);
        Assert.Empty(r.Retained);
    }

    // ---------- invariants --------------------------------------------------

    [Theory]
    [InlineData(QueryMode.Strict)]
    [InlineData(QueryMode.Permissive)]
    public void Invariant_les_deux_listes_sont_disjointes(QueryMode mode)
    {
        var items = new[]
        {
            new Item("a", new Year(1993), null),
            new Item("b", new YearRange(1993, 1997), new Year(1999)),
            new Item("c", new Year(1999), null),
            new Item("d", Unknown.Instance, null),
        };

        var r = OwnershipProjection.At(items, new Year(1997), mode, Horizon);

        // ⚠️ La disjonction seule est un invariant FAIBLE : il passe
        // trivialement si l'une des listes est vide, donc il ne protège pas
        // d'une fusion des deux. Révélé par une mutation qui fusionnait les
        // listes sans le faire échouer. On exige donc que les deux soient
        // peuplées avant de vérifier qu'elles sont disjointes.
        Assert.NotEmpty(r.Certain);
        Assert.NotEmpty(r.Possible);
        Assert.Empty(r.Certain.Select(i => i.Id).Intersect(r.Possible.Select(i => i.Id)));
    }

    [Fact]
    public void Invariant_le_strict_est_inclus_dans_le_permissif()
    {
        var items = new[]
        {
            new Item("a", new Year(1993), null),
            new Item("b", new YearRange(1993, 1997), new Year(1999)),
            new Item("c", new Year(1999), null),
        };

        var strict = OwnershipProjection.At(items, new Year(1997), QueryMode.Strict, Horizon);
        var permissif = OwnershipProjection.At(items, new Year(1997), QueryMode.Permissive, Horizon);

        Assert.Subset(
            permissif.Retained.Select(i => i.Id).ToHashSet(),
            strict.Retained.Select(i => i.Id).ToHashSet());
    }

    [Fact]
    public void Invariant_le_mode_ne_change_pas_la_certitude_calculee()
    {
        // Le mode filtre ce qu'on RETIENT ; il ne doit jamais changer ce
        // qu'on SAIT. Confondre les deux ferait dépendre la vérité de la
        // question posée.
        var items = new[] { new Item("b", new YearRange(1993, 1997), new Year(1999)) };

        var strict = OwnershipProjection.At(items, new Year(1997), QueryMode.Strict, Horizon);
        var permissif = OwnershipProjection.At(items, new Year(1997), QueryMode.Permissive, Horizon);

        Assert.Equal(strict.Certain.Select(i => i.Id), permissif.Certain.Select(i => i.Id));
        Assert.Equal(strict.Possible.Select(i => i.Id), permissif.Possible.Select(i => i.Id));
    }

    [Theory]
    [InlineData(QueryMode.Strict)]
    [InlineData(QueryMode.Permissive)]
    public void Le_resultat_rapporte_le_mode_employe(QueryMode mode)
    {
        // La leçon de l'item 09, appliquée d'emblée : un champ porté pour une
        // interface encore absente doit être vérifié au moment où on l'écrit.
        var r = OwnershipProjection.At(
            [new Item("a", new Year(1993), null)], new Year(1997), mode, Horizon);

        Assert.Equal(mode, r.Mode);
    }
}
