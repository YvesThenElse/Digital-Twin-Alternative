using DigitalTwin.Domain.Temporal;

namespace DigitalTwin.Domain.Tests.Temporal;

/// <summary>
/// Item 06 — la cohérence causale.
///
/// Référence : ORDONNANCEMENT-TEMPOREL §4.3, vecteurs T4 et T5, invariant 10
/// de MODELE-DE-DOMAINE §7.
/// </summary>
public class CausalCoherenceTests
{
    private static readonly TemporalHorizon Horizon =
        new(new DateOnly(2026, 9, 20), BirthYear: null);

    private sealed record Moment(
        string Id, TemporalValue OccurredAt, DateTime RecordedAt,
        string? SubjectId, string? Kind) : ISortableMoment;

    private static Moment M(string id, TemporalValue when, string kind,
                            string subject = "ffvii", int recordedDay = 1) =>
        new(id, when, new DateTime(2026, 1, recordedDay, 12, 0, 0, DateTimeKind.Utc),
            subject, kind);

    private static TimelineOrder<Moment> Trier(params Moment[] m) =>
        TimelineSorter.Sort(m, Horizon);

    // ---------- la séquence déclarée par §4.3 ------------------------------

    [Theory]
    [InlineData("DiscoveredGame", "StartedGame")]
    [InlineData("StartedGame", "CompletedGame")]
    [InlineData("StartedGame", "AbandonedGame")]
    [InlineData("StartedGame", "ReplayedGame")]       // on ne rejoue pas ce
                                                      // qu'on n'a pas commencé
    [InlineData("DiscoveredGame", "CompletedGame")]   // par transitivité
    [InlineData("DiscoveredGame", "ReplayedGame")]    // par transitivité
    [InlineData("AcquiredItem", "SoldItem")]
    public void La_sequence_causale_ordonne_ces_couples(string avant, string apres)
    {
        Assert.True(CausalSequence.Precedes(avant, apres));
        Assert.False(CausalSequence.Precedes(apres, avant));
    }

    [Theory]
    [InlineData("CompletedGame", "AbandonedGame")]    // exclusifs, pas ordonnés
    [InlineData("StartedGame", "AcquiredItem")]       // deux chaînes distinctes
    [InlineData("CompletedGame", "SoldItem")]
    [InlineData("SoldItem", "ReplayedGame")]          // ⚠️ le maillon retiré
    [InlineData("ReplayedGame", "SoldItem")]          // ni dans l'autre sens
    public void La_sequence_causale_n_ordonne_pas_ces_couples(string a, string b)
    {
        // Ne pas inventer d'ordre que §4.3 n'énonce pas. « Terminé » et
        // « abandonné » sont exclusifs (invariant 7) ; jouer et posséder sont
        // deux axes indépendants (§4.2 du modèle).
        Assert.False(CausalSequence.Precedes(a, b));
        Assert.False(CausalSequence.Precedes(b, a));
    }

    [Fact]
    public void Rejouer_avant_de_vendre_est_un_parcours_ordinaire()
    {
        // LE cas qui a fait arrêter la boucle. Acquis en 1997, rejoué en
        // 1999, vendu en 2002 : rien d'incohérent là-dedans, et aucun
        // avertissement ne doit être levé.
        //
        // L'ancienne chaîne posait SoldItem → ReplayedGame, ce qui
        // contredisait SPECIFICATION §5.4 — « joué après avoir vendu » y est
        // rangé parmi les cas INHABITUELS, donc l'inverse est la norme.
        var tri = Trier(
            M("acquis", new Year(1997), "AcquiredItem"),
            M("rejoue", new Year(1999), "ReplayedGame"),
            M("vendu", new Year(2002), "SoldItem"));

        Assert.Empty(tri.Warnings);
        Assert.Equal(["acquis", "rejoue", "vendu"], tri.OnAxis.Select(m => m.Id));
    }

    [Fact]
    public void Rejouer_avant_d_avoir_commence_reste_une_incoherence()
    {
        // La contrepartie : le maillon qui remplace l'ancien doit mordre.
        var tri = Trier(
            M("rejoue", new Year(1995), "ReplayedGame"),
            M("commence", new Year(1998), "StartedGame"));

        var a = Assert.Single(tri.Warnings);
        Assert.Equal("commence", a.ExpectedEarlierId);
        Assert.Equal("rejoue", a.ExpectedLaterId);
    }

    [Fact]
    public void Vendre_avant_d_avoir_acquis_est_une_incoherence()
    {
        // La chaîne de possession n'était éprouvée que par le prédicat :
        // renommer ses types ne tuait qu'un seul test. Elle mérite la même
        // vérification de bout en bout que la chaîne d'expérience.
        var tri = Trier(
            M("vendu", new Year(1995), "SoldItem"),
            M("acquis", new Year(1998), "AcquiredItem"));

        var a = Assert.Single(tri.Warnings);
        Assert.Equal("acquis", a.ExpectedEarlierId);
        Assert.Equal("vendu", a.ExpectedLaterId);
        Assert.Contains("AcquiredItem", a.Message);
        Assert.Contains("SoldItem", a.Message);
    }

    [Fact]
    public void Un_type_inconnu_n_ordonne_rien()
    {
        Assert.False(CausalSequence.Precedes("Inconnu", "StartedGame"));
        Assert.False(CausalSequence.Precedes("StartedGame", "Inconnu"));
    }

    // ---------- T4 : à intervalle non ordonné, la causalité départage ------

    [Fact]
    public void T4_commence_s_affiche_au_dessus_de_termine_meme_saisi_apres()
    {
        // Intervalles ÉGAUX. Sans le critère 4, RecordedAt l'emporterait et
        // « terminé » passerait au-dessus de « commencé » au seul motif
        // d'avoir été saisi en premier.
        var tri = Trier(
            M("termine", new Year(1997), "CompletedGame", recordedDay: 3),
            M("commence", new Year(1997), "StartedGame", recordedDay: 20));

        Assert.Equal(["commence", "termine"], tri.OnAxis.Select(m => m.Id));
        Assert.Empty(tri.Warnings);   // rien de contradictoire n'a été déclaré
    }

    [Fact]
    public void T4_vaut_aussi_quand_les_intervalles_se_chevauchent()
    {
        // §4.3 dit « égaux, chevauchants, contenus » — pas seulement égaux.
        var tri = Trier(
            M("termine", new YearRange(1997, 1999), "CompletedGame", recordedDay: 3),
            M("commence", new YearRange(1997, 1999), "StartedGame", recordedDay: 20));

        Assert.Equal(["commence", "termine"], tri.OnAxis.Select(m => m.Id));
    }

    [Fact]
    public void La_causalite_ne_s_applique_qu_a_la_meme_oeuvre()
    {
        // Deux jeux différents : aucun lien causal, donc RecordedAt reprend
        // la main. Sans cette restriction, le tri imposerait un ordre entre
        // des souvenirs qui n'en ont aucun.
        var tri = Trier(
            M("termine_zelda", new Year(1997), "CompletedGame", subject: "zelda", recordedDay: 3),
            M("commence_ffvii", new Year(1997), "StartedGame", subject: "ffvii", recordedDay: 20));

        Assert.Equal(["termine_zelda", "commence_ffvii"], tri.OnAxis.Select(m => m.Id));
    }

    // ---------- T5 : à intervalle strictement inversé, on avertit ----------

    [Fact]
    public void T5_un_ordre_strictement_inverse_s_affiche_tel_que_declare()
    {
        // « Réordonner silencieusement serait pire que l'incohérence : le
        // produit prétendrait connaître le souvenir mieux que son auteur. »
        var tri = Trier(
            M("termine", new Year(1995), "CompletedGame"),
            M("commence", new Year(1998), "StartedGame"));

        Assert.Equal(["termine", "commence"], tri.OnAxis.Select(m => m.Id));
    }

    [Fact]
    public void T5_leve_un_avertissement_doux()
    {
        // Invariant 10 : une incohérence produit un avertissement, JAMAIS un
        // refus. Le tri aboutit, la liste est complète, et l'anomalie est
        // signalée à côté.
        var tri = Trier(
            M("termine", new Year(1995), "CompletedGame"),
            M("commence", new Year(1998), "StartedGame"));

        var avertissement = Assert.Single(tri.Warnings);
        Assert.Equal("commence", avertissement.ExpectedEarlierId);
        Assert.Equal("termine", avertissement.ExpectedLaterId);
        // Le message doit nommer les deux moments : « incohérence détectée »
        // ne sert à personne sur une timeline de trois cents entrées.
        Assert.Contains("StartedGame", avertissement.Message);
        Assert.Contains("CompletedGame", avertissement.Message);
    }

    [Fact]
    public void Un_ordre_conforme_n_avertit_pas()
    {
        var tri = Trier(
            M("commence", new Year(1995), "StartedGame"),
            M("termine", new Year(1998), "CompletedGame"));

        Assert.Empty(tri.Warnings);
        Assert.Equal(["commence", "termine"], tri.OnAxis.Select(m => m.Id));
    }

    [Fact]
    public void Un_chevauchement_n_avertit_pas()
    {
        // L'avertissement ne vaut QUE pour un ordre strictement inversé. Un
        // chevauchement n'est pas une contradiction : l'utilisateur n'a rien
        // déclaré d'impossible.
        var tri = Trier(
            M("termine", new YearRange(1995, 1999), "CompletedGame"),
            M("commence", new YearRange(1997, 2001), "StartedGame"));

        Assert.Empty(tri.Warnings);
    }

    [Fact]
    public void Deux_oeuvres_differentes_n_avertissent_pas()
    {
        var tri = Trier(
            M("termine_zelda", new Year(1995), "CompletedGame", subject: "zelda"),
            M("commence_ffvii", new Year(1998), "StartedGame", subject: "ffvii"));

        Assert.Empty(tri.Warnings);
    }

    // ---------- invariants -------------------------------------------------

    [Fact]
    public void Invariant_une_incoherence_ne_retire_jamais_un_moment()
    {
        // Invariant 10, vérifié sur le résultat et non sur l'intention : la
        // liste reste complète quoi qu'il arrive.
        var moments = new[]
        {
            M("a", new Year(1995), "CompletedGame"),
            M("b", new Year(1998), "StartedGame"),
            M("c", new Year(1990), "AbandonedGame"),
            M("d", Unknown.Instance, "DiscoveredGame"),
        };

        var tri = TimelineSorter.Sort(moments, Horizon);

        Assert.Equal(moments.Length, tri.OnAxis.Count + tri.Undated.Count);
    }

    [Fact]
    public void Invariant_la_causalite_ne_casse_pas_le_determinisme()
    {
        // La causalité introduit une comparaison qui dépend du COUPLE, là où
        // les critères 1 à 3 sont des clés indépendantes. C'est exactement le
        // genre d'ajout qui rend un tri instable — donc on le perturbe.
        var moments = new[]
        {
            M("t", new Year(1997), "CompletedGame", recordedDay: 3),
            M("c", new Year(1997), "StartedGame", recordedDay: 20),
            M("d", new Year(1997), "DiscoveredGame", recordedDay: 11),
            M("autre", new Year(1997), "StartedGame", subject: "zelda", recordedDay: 2),
        };

        var reference = TimelineSorter.Sort(moments, Horizon).OnAxis.Select(m => m.Id).ToArray();

        for (var decalage = 1; decalage < moments.Length; decalage++)
        {
            var permute = moments.Skip(decalage).Concat(moments.Take(decalage)).ToArray();
            Assert.Equal(reference,
                TimelineSorter.Sort(permute, Horizon).OnAxis.Select(m => m.Id));
        }
        Assert.Equal(reference,
            TimelineSorter.Sort(moments.Reverse().ToArray(), Horizon).OnAxis.Select(m => m.Id));
    }

    [Fact]
    public void Invariant_une_chaine_complete_s_ordonne_entierement()
    {
        // Cas dégénéré à l'autre bout : tous les moments d'une chaîne, tous
        // au même instant, saisis dans le désordre.
        var tri = Trier(
            M("termine", new Year(1997), "CompletedGame", recordedDay: 1),
            M("commence", new Year(1997), "StartedGame", recordedDay: 2),
            M("decouvre", new Year(1997), "DiscoveredGame", recordedDay: 3));

        Assert.Equal(["decouvre", "commence", "termine"], tri.OnAxis.Select(m => m.Id));
    }
}
