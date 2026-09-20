using System.Reflection;
using DigitalTwin.Domain.Temporal;

namespace DigitalTwin.Domain.Tests.Temporal;

/// <summary>
/// Item 09 — les requêtes strict et permissif.
///
/// Référence : ORDONNANCEMENT-TEMPOREL §7.1 et §7.2, vecteur T9.
/// </summary>
public class TemporalQueryTests
{
    private static readonly TemporalHorizon Horizon =
        new(new DateOnly(2026, 9, 20), BirthYear: 1982);

    private sealed record Moment(
        string Id, TemporalValue OccurredAt, DateTime RecordedAt) : ISortableMoment;

    private static Moment M(string id, TemporalValue when) =>
        new(id, when, new DateTime(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc));

    // ---------- §7.1 : les deux prédicats ---------------------------------

    [Fact]
    public void Strict_ne_retient_que_ce_qui_est_entierement_inclus()
    {
        var r = TemporalQueries.Over(
            [M("dedans", new Year(1995)),
             M("trop_large", new YearRange(1993, 1997)),
             M("ailleurs", new Year(1990))],
            new Year(1995), QueryMode.Strict, Horizon);

        Assert.Equal(["dedans"], r.Matched.Select(m => m.Id));
    }

    [Fact]
    public void Permissif_retient_tout_ce_qui_chevauche()
    {
        var r = TemporalQueries.Over(
            [M("dedans", new Year(1995)),
             M("trop_large", new YearRange(1993, 1997)),
             M("ailleurs", new Year(1990))],
            new Year(1995), QueryMode.Permissive, Horizon);

        Assert.Equal(["dedans", "trop_large"], r.Matched.Select(m => m.Id).Order());
    }

    [Fact]
    public void Les_deux_modes_repondent_a_des_questions_differentes()
    {
        // « Les deux prédicats sont exacts ; ils ne répondent simplement pas à
        // la même question. » Sur la même entrée, l'un compte ce dont on est
        // sûr, l'autre ce qui est possible.
        var moments = new[]
        {
            M("sur", new Year(1995)),
            M("possible", new YearRange(1993, 1997)),
        };

        var strict = TemporalQueries.Over(moments, new Year(1995), QueryMode.Strict, Horizon);
        var permissif = TemporalQueries.Over(moments, new Year(1995), QueryMode.Permissive, Horizon);

        Assert.Single(strict.Matched);
        Assert.Equal(2, permissif.Matched.Count);
    }

    // ---------- T9 : les trois nombres ------------------------------------

    [Fact]
    public void T9_un_decompte_strict_rend_les_trois_nombres()
    {
        // « 12 jeux en 1995 » calculé sur des intervalles dont 7 sont trop
        // larges et 4 sans date est un chiffre faux présenté comme vrai.
        var moments =
            Enumerable.Range(1, 12).Select(i => M($"dedans{i:00}", new Year(1995)))
            .Concat(Enumerable.Range(1, 7).Select(i => M($"large{i}", new YearRange(1993, 1997))))
            .Concat(Enumerable.Range(1, 4).Select(i => M($"sansdate{i}", Unknown.Instance)))
            .ToArray();

        var r = TemporalQueries.Over(moments, new Year(1995), QueryMode.Strict, Horizon);

        Assert.Equal(12, r.Matched.Count);
        Assert.Equal(7, r.TooImprecise.Count);
        Assert.Equal(4, r.Undated.Count);
    }

    [Fact]
    public void T9_les_trois_nombres_se_rendent_sous_la_forme_attendue()
    {
        // La forme que §7.2 impose : « 12 jeux en 1995 · 7 moments trop
        // imprécis · 4 sans date ». Le domaine ne dessine pas, mais il refuse
        // de livrer le premier nombre sans les deux autres.
        var moments =
            Enumerable.Range(1, 12).Select(i => M($"d{i:00}", new Year(1995)))
            .Concat(Enumerable.Range(1, 7).Select(i => M($"l{i}", new YearRange(1993, 1997))))
            .Concat(Enumerable.Range(1, 4).Select(i => M($"s{i}", Unknown.Instance)))
            .ToArray();

        var r = TemporalQueries.Over(moments, new Year(1995), QueryMode.Strict, Horizon);

        Assert.Contains("12", r.Summary);
        Assert.Contains("7", r.Summary);
        Assert.Contains("4", r.Summary);
    }

    [Fact]
    public void En_permissif_rien_n_est_ecarte_pour_imprecision()
    {
        // TooImprecise n'a de sens qu'en strict : le permissif accepte
        // justement ce que le strict écarte.
        var moments = new[]
        {
            M("dedans", new Year(1995)),
            M("large", new YearRange(1993, 1997)),
            M("sansdate", Unknown.Instance),
        };

        var r = TemporalQueries.Over(moments, new Year(1995), QueryMode.Permissive, Horizon);

        Assert.Empty(r.TooImprecise);
        Assert.Single(r.Undated);
    }

    [Fact]
    public void Ce_qui_est_hors_periode_n_est_pas_compte_comme_ecarte()
    {
        // Un moment de 1990 interrogé sur 1995 n'est pas « trop imprécis » :
        // il est simplement ailleurs, et personne ne s'attend à le voir. Le
        // confondre avec une exclusion pour imprécision gonflerait un chiffre
        // censé alerter.
        var r = TemporalQueries.Over(
            [M("ailleurs", new Year(1990))],
            new Year(1995), QueryMode.Strict, Horizon);

        Assert.Empty(r.Matched);
        Assert.Empty(r.TooImprecise);
        Assert.Empty(r.Undated);
    }

    // ---------- l'exigence de structure -----------------------------------

    [Fact]
    public void Aucune_methode_ne_rend_un_decompte_nu()
    {
        // « Le total silencieux est impossible par construction. » Aucune
        // surcharge ne doit livrer un entier seul : la plus petite unité que
        // l'API accepte de rendre porte les trois nombres ensemble.
        var rendus = typeof(TemporalQueries)
            .GetMethods(BindingFlags.Public | BindingFlags.Static)
            .Where(m => m.DeclaringType == typeof(TemporalQueries))
            .Select(m => m.ReturnType)
            .ToArray();

        Assert.NotEmpty(rendus);
        Assert.DoesNotContain(typeof(int), rendus);
        Assert.All(rendus, t =>
            Assert.StartsWith("TemporalQueryResult", t.Name, StringComparison.Ordinal));
    }

    [Theory]
    [InlineData(QueryMode.Strict)]
    [InlineData(QueryMode.Permissive)]
    public void Le_resultat_rapporte_le_mode_employe(QueryMode mode)
    {
        // Trou révélé par une mutation annoncée survivante : forcer le mode
        // rapporté à Strict ne cassait rien. Le champ existe pourtant parce
        // que §7.1 exige que le mode retenu soit VISIBLE — un résultat qui
        // se déclarerait strict alors qu'il est permissif afficherait un
        // chiffre juste sous une étiquette fausse.
        var r = TemporalQueries.Over(
            [M("a", new Year(1995))], new Year(1995), mode, Horizon);

        Assert.Equal(mode, r.Mode);
    }

    [Fact]
    public void Le_resume_nomme_les_trois_categories_meme_a_zero()
    {
        // À zéro écarté, la mention disparaîtrait si on la conditionnait — et
        // l'utilisateur ne saurait plus si elle est absente ou nulle.
        var r = TemporalQueries.Over(
            [M("dedans", new Year(1995))], new Year(1995), QueryMode.Strict, Horizon);

        Assert.Contains("1", r.Summary);
        Assert.Contains("0", r.Summary);
    }

    // ---------- cas dégénérés ---------------------------------------------

    [Fact]
    public void Une_collection_vide_rend_trois_zeros()
    {
        var r = TemporalQueries.Over(
            Array.Empty<Moment>(), new Year(1995), QueryMode.Strict, Horizon);

        Assert.Empty(r.Matched);
        Assert.Empty(r.TooImprecise);
        Assert.Empty(r.Undated);
    }

    [Fact]
    public void Une_periode_sans_intervalle_ne_retient_rien_et_le_dit()
    {
        // Interroger « sur Unknown » n'a pas de sens : aucune comparaison
        // n'est possible. Tous les moments datés deviennent hors période, et
        // les non datés restent non datés.
        var r = TemporalQueries.Over(
            [M("dedans", new Year(1995)), M("sansdate", Unknown.Instance)],
            Unknown.Instance, QueryMode.Strict, Horizon);

        Assert.Empty(r.Matched);
        Assert.Empty(r.TooImprecise);
        Assert.Single(r.Undated);
    }

    [Fact]
    public void Un_moment_egal_a_la_periode_est_inclus_en_strict()
    {
        // Le cas limite de l'inclusion : bornes identiques. Un « ⊂ » strict
        // mis à la place du « ⊆ » basculerait exactement ici.
        var r = TemporalQueries.Over(
            [M("exact", new Year(1995))], new Year(1995), QueryMode.Strict, Horizon);

        Assert.Single(r.Matched);
    }

    [Fact]
    public void Un_moment_qui_touche_la_periode_par_un_jour_chevauche()
    {
        // 1995 et la période 1995–1997 partagent toute l'année 1995 ; mais
        // une journée du 31 décembre 1994 ne touche pas 1995 du tout.
        var r = TemporalQueries.Over(
            [M("veille", new ExactDate(new DateOnly(1994, 12, 31))),
             M("premier", new ExactDate(new DateOnly(1995, 1, 1)))],
            new Year(1995), QueryMode.Permissive, Horizon);

        Assert.Equal(["premier"], r.Matched.Select(m => m.Id));
    }

    // ---------- invariants --------------------------------------------------

    [Theory]
    [InlineData(QueryMode.Strict)]
    [InlineData(QueryMode.Permissive)]
    public void Invariant_aucun_moment_n_est_compte_deux_fois(QueryMode mode)
    {
        var moments = new[]
        {
            M("a", new Year(1995)), M("b", new YearRange(1993, 1997)),
            M("c", new Year(1990)), M("d", Unknown.Instance), M("e", new Age(13)),
        };

        var r = TemporalQueries.Over(moments, new Year(1995), mode, Horizon);
        var vus = r.Matched.Concat(r.TooImprecise).Concat(r.Undated)
            .Select(m => m.Id).ToArray();

        Assert.Equal(vus.Length, vus.Distinct().Count());
    }

    [Fact]
    public void Invariant_le_strict_est_inclus_dans_le_permissif()
    {
        // Le rapport entre les deux modes, vérifié plutôt que supposé :
        // I ⊆ P implique I ∩ P ≠ ∅.
        var moments = new[]
        {
            M("a", new Year(1995)), M("b", new YearRange(1993, 1997)),
            M("c", new Year(1990)), M("d", new Month(1995, 6)),
            M("e", new ApproximateYear(1995, 1)),
        };

        var strict = TemporalQueries.Over(moments, new Year(1995), QueryMode.Strict, Horizon);
        var permissif = TemporalQueries.Over(moments, new Year(1995), QueryMode.Permissive, Horizon);

        Assert.Subset(
            permissif.Matched.Select(m => m.Id).ToHashSet(),
            strict.Matched.Select(m => m.Id).ToHashSet());
    }

    [Fact]
    public void Invariant_les_ecartes_du_strict_sont_retenus_par_le_permissif()
    {
        // La contrepartie : ce que le strict écarte pour imprécision est
        // exactement ce que le permissif ajoute.
        var moments = new[]
        {
            M("a", new Year(1995)), M("b", new YearRange(1993, 1997)),
            M("c", new ApproximateYear(1995, 1)), M("d", new Year(1990)),
        };

        var strict = TemporalQueries.Over(moments, new Year(1995), QueryMode.Strict, Horizon);
        var permissif = TemporalQueries.Over(moments, new Year(1995), QueryMode.Permissive, Horizon);

        var ajoutes = permissif.Matched.Select(m => m.Id)
            .Except(strict.Matched.Select(m => m.Id)).Order();

        Assert.Equal(strict.TooImprecise.Select(m => m.Id).Order(), ajoutes);
    }
}
