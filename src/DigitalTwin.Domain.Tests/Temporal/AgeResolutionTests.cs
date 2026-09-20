using DigitalTwin.Domain.Temporal;

namespace DigitalTwin.Domain.Tests.Temporal;

/// <summary>
/// Item 07 — la résolution de <c>Age</c>.
///
/// Référence : ORDONNANCEMENT-TEMPOREL §8, vecteur T6, et MODELE-DE-DOMAINE
/// §3 règle 3 (« stocké brut, jamais converti à l'écriture »).
/// </summary>
public class AgeResolutionTests
{
    private static readonly DateOnly Aujourdhui = new(2026, 9, 20);

    private static TemporalHorizon SansNaissance => new(Aujourdhui, null);
    private static TemporalHorizon Ne(int annee) => new(Aujourdhui, annee);
    private static TemporalHorizon NeLe(DateOnly date) =>
        new(Aujourdhui, date.Year) { BirthDate = date };

    private sealed record Moment(
        string Id, TemporalValue OccurredAt, DateTime RecordedAt) : ISortableMoment;

    private static Moment M(string id, TemporalValue when) =>
        new(id, when, new DateTime(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc));

    // ---------- la table de §8, ligne par ligne ---------------------------

    [Fact]
    public void Sans_annee_de_naissance_Age_n_a_aucun_intervalle()
    {
        // §7.6 : « sans année de naissance, Age reste non résolu et se
        // comporte comme Unknown ». Inventer un intervalle ici placerait sur
        // l'axe un moment que personne n'a daté.
        Assert.Null(TemporalNormalizer.Normalize(new Age(12), SansNaissance));
    }

    [Fact]
    public void Avec_l_annee_de_naissance_Age_couvre_deux_annees_civiles()
    {
        // « La personne a x ans depuis son anniversaire de l'année b+x
        // jusqu'à celui de l'année b+x+1. » Sans connaître le jour de
        // l'anniversaire, la fenêtre couvre les deux années civiles — et
        // c'est cette largeur qui PORTE l'imprécision de « vers mes 12 ans ».
        var i = TemporalNormalizer.Normalize(new Age(12), Ne(1982))!;

        Assert.Equal(new DateOnly(1994, 1, 1), i.Start);
        Assert.Equal(new DateOnly(1995, 12, 31), i.End);
    }

    [Fact]
    public void Avec_la_date_de_naissance_complete_la_fenetre_se_resserre()
    {
        // Douze mois au lieu de vingt-quatre, d'anniversaire à veille
        // d'anniversaire.
        var i = TemporalNormalizer.Normalize(
            new Age(12), NeLe(new DateOnly(1982, 6, 15)))!;

        Assert.Equal(new DateOnly(1994, 6, 15), i.Start);
        Assert.Equal(new DateOnly(1995, 6, 14), i.End);
    }

    [Fact]
    public void La_date_de_naissance_seule_suffit_a_resoudre()
    {
        // Trou révélé par une mutation annoncée survivante, et qui l'a été :
        // l'utilitaire `NeLe` renseignait TOUJOURS l'année ET la date, donc
        // le repli de l'une vers l'autre n'était jamais éprouvé. Un profil
        // ne portant que la date complète aurait cessé de résoudre `Age`,
        // sans qu'aucun test ne le dise.
        var seulementLaDate = new TemporalHorizon(Aujourdhui, null)
        {
            BirthDate = new DateOnly(1982, 6, 15),
        };

        Assert.Equal(1982, seulementLaDate.EffectiveBirthYear);
        Assert.Equal(1982, seulementLaDate.FloorYear);

        var i = TemporalNormalizer.Normalize(new Age(12), seulementLaDate)!;
        Assert.Equal(new DateOnly(1994, 6, 15), i.Start);
        Assert.Equal(new DateOnly(1995, 6, 14), i.End);
    }

    [Fact]
    public void La_date_complete_est_plus_precise_que_l_annee_seule()
    {
        // Le rapport entre les deux lignes de la table, vérifié plutôt que
        // supposé : la seconde doit être strictement incluse dans la première.
        var large = TemporalNormalizer.Normalize(new Age(12), Ne(1982))!;
        var serre = TemporalNormalizer.Normalize(
            new Age(12), NeLe(new DateOnly(1982, 6, 15)))!;

        Assert.Equal(IntervalRelation.Contains, IntervalAlgebra.Relate(large, serre));
        Assert.True(serre.WidthInDays < large.WidthInDays);
    }

    // ---------- T6 : la résolution est rétroactive ------------------------

    [Fact]
    public void T6_renseigner_l_annee_de_naissance_fait_quitter_le_tiroir()
    {
        var moments = new[] { M("age", new Age(12)), M("ancre", new Year(1994)) };

        var avant = TimelineSorter.Sort(moments, SansNaissance);
        Assert.Equal(["age"], avant.Undated.Select(m => m.Id));
        Assert.Equal(["ancre"], avant.OnAxis.Select(m => m.Id));

        var apres = TimelineSorter.Sort(moments, Ne(1982));
        Assert.Empty(apres.Undated);
        Assert.Equal(2, apres.OnAxis.Count);
    }

    [Fact]
    public void T6_le_moment_resolu_se_place_sur_le_bon_intervalle()
    {
        var i = TemporalNormalizer.Normalize(new Age(12), Ne(1982))!;
        Assert.Equal(new DateOnly(1994, 1, 1), i.Start);
        Assert.Equal(new DateOnly(1995, 12, 31), i.End);
    }

    [Fact]
    public void T6_corriger_l_annee_de_naissance_retrie_l_ensemble()
    {
        // « La résolution est globale et rétroactive. » C'est la raison d'être
        // du stockage brut : une conversion à l'écriture rendrait ce recalcul
        // impossible.
        var moments = new[]
        {
            M("age", new Age(12)),
            M("ancre_1990", new Year(1990)),
            M("ancre_2000", new Year(2000)),
        };

        var ne1982 = TimelineSorter.Sort(moments, Ne(1982)).OnAxis.Select(m => m.Id);
        var ne1976 = TimelineSorter.Sort(moments, Ne(1976)).OnAxis.Select(m => m.Id);

        // Né en 1982, « mes 12 ans » tombe en 1994-1995 : entre les deux ancres.
        Assert.Equal(["ancre_1990", "age", "ancre_2000"], ne1982);
        // Né en 1976, cela tombe en 1988-1989 : avant les deux.
        Assert.Equal(["age", "ancre_1990", "ancre_2000"], ne1976);
    }

    [Fact]
    public void La_valeur_stockee_ne_change_jamais_quel_que_soit_l_horizon()
    {
        // Règle impérative 3, vérifiée sur le comportement et non sur la
        // forme : la MÊME instance se résout différemment selon l'horizon,
        // donc rien n'a été figé à l'écriture.
        var age = new Age(12);

        var a = TemporalNormalizer.Normalize(age, Ne(1982))!;
        var b = TemporalNormalizer.Normalize(age, Ne(1976))!;

        Assert.NotEqual(a.Start, b.Start);
        Assert.Equal(12, age.Years);
        Assert.Same(age, a.Source);
        Assert.Same(age, b.Source);
    }

    // ---------- cas dégénérés ---------------------------------------------

    [Fact]
    public void Un_age_qui_tomberait_dans_l_avenir_n_est_pas_placable()
    {
        // Né en 2020, « quand j'avais 12 ans » désigne 2032 — un souvenir ne
        // se situe pas dans l'avenir (§2.3). Non plaçable, mais jamais refusé
        // (invariant 10) : le moment rejoint le tiroir.
        Assert.Null(TemporalNormalizer.Normalize(new Age(12), Ne(2020)));
    }

    [Fact]
    public void Un_age_a_cheval_sur_aujourd_hui_se_ferme_sur_le_plafond()
    {
        // Né en 2013, « mes 12 ans » couvre 2025-2026 : la fenêtre commence
        // dans le passé et finirait après aujourd'hui. On la ferme sur le
        // plafond plutôt que de laisser déborder.
        var i = TemporalNormalizer.Normalize(new Age(12), Ne(2013))!;

        Assert.Equal(new DateOnly(2025, 1, 1), i.Start);
        Assert.Equal(Aujourdhui, i.End);
    }

    [Fact]
    public void Age_zero_est_resolu_comme_les_autres()
    {
        // La première année de vie. Rien dans la règle ne l'exclut, et un
        // « quand j'étais bébé » n'a rien d'absurde pour une console vue chez
        // les parents.
        var i = TemporalNormalizer.Normalize(new Age(0), Ne(1982))!;

        Assert.Equal(new DateOnly(1982, 1, 1), i.Start);
        Assert.Equal(new DateOnly(1983, 12, 31), i.End);
    }

    [Fact]
    public void Un_age_anterieur_a_la_naissance_est_impossible_par_construction()
    {
        // Il n'existe pas d'âge négatif (item 01), donc la fenêtre commence
        // toujours à la naissance ou après. Ce test CONSTATE cette propriété
        // plutôt que de la supposer.
        foreach (var annees in new[] { 0, 1, 12, 40 })
        {
            var i = TemporalNormalizer.Normalize(new Age(annees), Ne(1982))!;
            Assert.True(i.Start >= new DateOnly(1982, 1, 1),
                $"Age({annees}) commence avant la naissance : {i.Start}");
        }
    }

    // ---------- invariants --------------------------------------------------

    [Theory]
    [InlineData(1970)]
    [InlineData(1982)]
    [InlineData(2000)]
    public void Invariant_la_fenetre_de_l_annee_seule_couvre_deux_ans(int naissance)
    {
        var i = TemporalNormalizer.Normalize(new Age(12), Ne(naissance))!;
        Assert.Equal(new DateOnly(naissance + 12, 1, 1), i.Start);
        Assert.Equal(new DateOnly(naissance + 13, 12, 31), i.End);
    }

    [Fact]
    public void Invariant_un_age_plus_grand_place_le_moment_plus_tard()
    {
        var horizon = Ne(1982);
        DateOnly? precedent = null;

        foreach (var annees in new[] { 0, 5, 12, 20, 40 })
        {
            var i = TemporalNormalizer.Normalize(new Age(annees), horizon)!;
            if (precedent is { } avant)
            {
                Assert.True(i.Start > avant,
                    $"Age({annees}) devrait commencer après le précédent");
            }
            precedent = i.Start;
        }
    }
}
