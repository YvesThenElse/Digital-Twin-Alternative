namespace DigitalTwin.Domain.Temporal;

/// <summary>
/// Les sept relations retenues entre deux intervalles
/// (ORDONNANCEMENT-TEMPOREL §3).
///
/// Les treize relations d'Allen sont complètes mais surdimensionnées ici.
/// Sept suffisent, et <b>une seule</b> est un ordre.
/// </summary>
public enum IntervalRelation
{
    /// <summary>`a.fin &lt; b.début`. <b>La seule relation d'ordre strict.</b></summary>
    Before,

    /// <summary>Symétrique de <see cref="Before"/>.</summary>
    After,

    /// <summary>Une période englobe un moment.</summary>
    Contains,

    /// <summary>Un moment précis dans une période floue.</summary>
    ContainedIn,

    /// <summary>Intersection non vide, aucun ne contient l'autre. Le cas fréquent.</summary>
    Overlaps,

    /// <summary>
    /// Bornes identiques. Rare, mais <b>pas</b> un chevauchement — et deux
    /// moments égaux ne sont pas simultanés : ils sont indiscernables à la
    /// granularité déclarée.
    /// </summary>
    Equal,

    /// <summary>
    /// L'un des deux n'a pas d'intervalle : <c>Unknown</c>, <c>Age</c> non
    /// résolu, ou période ouverte sans horizon.
    /// </summary>
    Incomparable,
}

/// <summary>
/// Compare deux intervalles. <b>C'est la seule voie de comparaison du
/// domaine.</b>
///
/// La règle impérative n°1 interdit de comparer deux moments par un
/// <c>&lt;</c> sur des dates ; elle n'interdit pas de comparer des bornes —
/// §3 définit d'ailleurs ses propres relations ainsi. La discipline porte
/// donc sur l'appelant : il passe par <see cref="Relate"/> ou
/// <see cref="Precedes"/>, jamais par les bornes directement.
/// </summary>
public static class IntervalAlgebra
{
    public static IntervalRelation Relate(TemporalInterval? a, TemporalInterval? b)
    {
        // Invariant 2 : ce qui n'a pas d'intervalle n'est pas sur l'axe, et ne
        // se compare donc à rien. Rendre Before ou After ici placerait
        // arbitrairement un moment que personne n'a daté.
        if (a is null || b is null)
        {
            return IntervalRelation.Incomparable;
        }

        // Égal se teste EN PREMIER : des bornes identiques satisfont aussi les
        // deux conditions d'inclusion, et §3 en fait une relation distincte.
        if (a.Start == b.Start && a.End == b.End)
        {
            return IntervalRelation.Equal;
        }

        if (a.End < b.Start)
        {
            return IntervalRelation.Before;
        }

        if (b.End < a.Start)
        {
            return IntervalRelation.After;
        }

        // Les bornes sont incluses : partager un seul jour suffit à rendre
        // l'intersection non vide. D'où les comparaisons larges.
        if (a.Start <= b.Start && b.End <= a.End)
        {
            return IntervalRelation.Contains;
        }

        if (b.Start <= a.Start && a.End <= b.End)
        {
            return IntervalRelation.ContainedIn;
        }

        return IntervalRelation.Overlaps;
    }

    /// <summary>
    /// <c>a ≺ b</c> si et seulement si <c>a.fin &lt; b.début</c>.
    ///
    /// Tout le reste est un chevauchement, et un chevauchement <b>n'est pas</b>
    /// un ordre : deux moments qui se chevauchent affichés l'un au-dessus de
    /// l'autre n'affirment rien. C'est ce qui rend la cascade de départage
    /// nécessaire.
    /// </summary>
    public static bool Precedes(TemporalInterval? a, TemporalInterval? b) =>
        Relate(a, b) == IntervalRelation.Before;
}
