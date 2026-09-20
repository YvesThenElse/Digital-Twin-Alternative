namespace DigitalTwin.Domain.Temporal;

/// <summary>
/// Les deux manières d'interroger une période (ORDONNANCEMENT-TEMPOREL §7.1).
///
/// Les deux prédicats sont exacts ; ils ne répondent simplement pas à la même
/// question. Le mode retenu doit rester <b>visible et commutable</b> dans
/// l'interface (§7.7).
/// </summary>
public enum QueryMode
{
    /// <summary>
    /// <c>I ⊆ P</c> — ce dont on est sûr. Le défaut de tout chiffre annoncé.
    /// </summary>
    Strict,

    /// <summary>
    /// <c>I ∩ P ≠ ∅</c> — ce qui est possible. Le défaut de toute restitution
    /// narrative.
    /// </summary>
    Permissive,
}

/// <summary>
/// Le résultat d'une requête temporelle — <b>jamais un nombre seul</b>.
///
/// §7.2 : « 12 jeux en 1995 » calculé sur des intervalles dont 7 sont trop
/// larges et 4 sans date est un chiffre faux présenté comme vrai. La plus
/// petite unité que ce domaine accepte de rendre porte donc les trois
/// catégories ensemble, et rien ne permet d'obtenir la première sans les
/// autres.
/// </summary>
/// <param name="Mode">Le mode employé — à afficher, il change la réponse.</param>
/// <param name="Matched">Les moments retenus.</param>
/// <param name="TooImprecise">
/// Les moments qui chevauchent la période sans y être inclus, donc écartés
/// par le mode strict. <b>Toujours vide en permissif</b>, qui les retient.
/// </param>
/// <param name="Undated">
/// Les moments sans intervalle — <c>Unknown</c>, <c>Age</c> non résolu. Ils
/// ne sont ni dedans ni dehors : ils ne sont pas sur l'axe (invariant 2).
/// </param>
public sealed record TemporalQueryResult<T>(
    QueryMode Mode,
    IReadOnlyList<T> Matched,
    IReadOnlyList<T> TooImprecise,
    IReadOnlyList<T> Undated)
{
    /// <summary>
    /// La forme que §7.2 impose, rendue ici parce qu'aucune autre couche ne
    /// peut garantir qu'elle sera écrite. Le domaine ne dessine pas, mais il
    /// refuse de livrer le premier nombre sans les deux autres.
    ///
    /// Les trois catégories sont nommées <b>même à zéro</b> : une mention qui
    /// disparaîtrait quand elle vaut zéro laisserait l'utilisateur incapable
    /// de distinguer « aucun écarté » de « on ne vous le dit pas ».
    /// </summary>
    public string Summary =>
        $"{Matched.Count} retenus · {TooImprecise.Count} trop imprécis · " +
        $"{Undated.Count} sans date";
}

/// <summary>
/// Interroge une collection de moments sur une période.
/// </summary>
public static class TemporalQueries
{
    public static TemporalQueryResult<T> Over<T>(
        IEnumerable<T> moments,
        TemporalValue period,
        QueryMode mode,
        TemporalHorizon horizon) where T : ISortableMoment
    {
        var periode = TemporalNormalizer.Normalize(period, horizon);

        var retenus = new List<T>();
        var imprecis = new List<T>();
        var sansDate = new List<T>();

        foreach (var moment in moments)
        {
            var i = TemporalNormalizer.Normalize(moment.OccurredAt, horizon);
            if (i is null)
            {
                // Ni dedans ni dehors : hors de l'axe (invariant 2).
                sansDate.Add(moment);
                continue;
            }

            if (periode is null)
            {
                // Interroger « sur Unknown » n'a pas de sens : aucune
                // comparaison n'est possible, donc rien n'est retenu. On ne
                // compte pas ces moments comme écartés pour imprécision —
                // c'est la requête qui est muette, pas eux.
                continue;
            }

            var relation = IntervalAlgebra.Relate(i, periode);
            var inclus = relation is IntervalRelation.ContainedIn or IntervalRelation.Equal;
            var chevauche = relation is not (IntervalRelation.Before
                or IntervalRelation.After or IntervalRelation.Incomparable);

            if (mode == QueryMode.Strict)
            {
                if (inclus)
                {
                    retenus.Add(moment);
                }
                else if (chevauche)
                {
                    // Il touche la période sans y tenir : c'est LUI que §7.2
                    // exige d'annoncer. Un moment simplement situé ailleurs
                    // n'entre pas dans ce compte — le confondre gonflerait un
                    // chiffre dont le rôle est d'alerter.
                    imprecis.Add(moment);
                }
            }
            else if (chevauche)
            {
                retenus.Add(moment);
            }
        }

        return new TemporalQueryResult<T>(mode, retenus, imprecis, sansDate);
    }
}
