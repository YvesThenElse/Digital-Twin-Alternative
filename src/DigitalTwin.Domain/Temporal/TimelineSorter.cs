namespace DigitalTwin.Domain.Temporal;

/// <summary>
/// Ce dont le tri a besoin pour placer un moment, et rien de plus.
///
/// Le contrat est minimal à dessein : <c>PlayerEvent</c> l'implémentera
/// (item 11) sans que le tri ait à connaître les événements.
/// </summary>
public interface ISortableMoment
{
    /// <summary>Quand cela s'est produit dans la vie du joueur — incertain.</summary>
    TemporalValue OccurredAt { get; }

    /// <summary>Quand la déclaration a été enregistrée — exact (§5.2).</summary>
    DateTime RecordedAt { get; }

    /// <summary>Identifiant total, jamais réattribué (§10.2).</summary>
    string Id { get; }
}

/// <summary>
/// Le résultat d'un tri : ce qui tient sur l'axe, et ce qui n'y a pas sa place.
/// </summary>
public sealed record TimelineOrder<T>(IReadOnlyList<T> OnAxis, IReadOnlyList<T> Undated);

/// <summary>
/// Produit une séquence affichable à partir d'un ordre qui n'est que partiel
/// (ORDONNANCEMENT-TEMPOREL §4.1).
///
/// <para><b>L'ordre d'affichage n'affirme pas « puis ».</b> Deux moments qui
/// se chevauchent sont rendus dans un ordre déterminé par cette cascade, mais
/// leur succession ne veut rien dire — c'est au rendu de montrer le
/// chevauchement (§4.2).</para>
///
/// <para><b>Le déterminisme n'est pas un détail.</b> E03 est un écran où l'on
/// revient. Un tri qui dépend de l'ordre d'insertion produit une timeline qui
/// bouge d'une visite à l'autre, et l'utilisateur ne distingue pas cela d'une
/// perte de données. Les critères 5 et 6 n'existent que pour fermer ce
/// cas.</para>
/// </summary>
public static class TimelineSorter
{
    public static TimelineOrder<T> Sort<T>(IEnumerable<T> moments, TemporalHorizon horizon)
        where T : ISortableMoment
    {
        var surAxe = new List<(T Moment, TemporalInterval Interval)>();
        var sansDate = new List<T>();

        foreach (var moment in moments)
        {
            var intervalle = TemporalNormalizer.Normalize(moment.OccurredAt, horizon);
            if (intervalle is null)
            {
                // Invariant 2 : ce qui n'a pas d'intervalle ne va pas sur l'axe.
                sansDate.Add(moment);
            }
            else
            {
                surAxe.Add((moment, intervalle));
            }
        }

        // La cascade. Chaque critère ne s'applique qu'à égalité du précédent.
        //
        // Critère 1 est une CLÉ, pas une comparaison : la position d'un
        // élément ne dépend jamais des autres, ce qui est la condition pour
        // qu'ajouter un moment ne déplace pas les autres.
        var ordonne = surAxe
            .OrderBy(x => x.Interval.SortKey)                 // 1
            .ThenBy(x => x.Interval.Start)                    // 2
            .ThenBy(x => x.Interval.WidthInDays)              // 3
            // 4 — cohérence causale : inséré ici par l'item 06. Sa place dans
            //     la cascade est arrêtée par §4.1 et ne doit pas bouger : il
            //     départage AVANT RecordedAt, sans quoi « terminé » pourrait
            //     s'afficher au-dessus de « commencé » au seul motif d'avoir
            //     été saisi en premier.
            .ThenBy(x => x.Moment.RecordedAt)                 // 5
            .ThenBy(x => x.Moment.Id, StringComparer.Ordinal) // 6
            .Select(x => x.Moment)
            .ToArray();

        // §6 : dans le tiroir, le plus récemment déclaré d'abord — il n'y a
        // pas d'autre axe disponible, et c'est celui qui sert. L'identifiant
        // ferme le cas des saisies simultanées, comme sur l'axe.
        var tiroir = sansDate
            .OrderByDescending(m => m.RecordedAt)
            .ThenBy(m => m.Id, StringComparer.Ordinal)
            .ToArray();

        return new TimelineOrder<T>(ordonne, tiroir);
    }
}
