namespace DigitalTwin.Domain.Temporal;

/// <summary>
/// Projette une <see cref="TemporalValue"/> vers sa forme normale, selon la
/// table de ORDONNANCEMENT-TEMPOREL §2.1.
///
/// Trois valeurs n'ont <b>aucun</b> intervalle, et la fonction rend
/// <c>null</c> plutôt que d'en inventer un :
///
/// <list type="bullet">
/// <item><c>Unknown</c> — invariant 2 : jamais projeté sur un axe.</item>
/// <item><c>Age</c> non résolu — §7.6 : sans année de naissance, il se
/// comporte comme <c>Unknown</c>. Sa résolution appartient à l'item 07.</item>
/// <item>une période <b>ouverte</b> — §2.3 : la borne manquante se ferme sur
/// l'horizon de domaine, qui dépend de l'utilisateur et du jour. L'horizon
/// arrive à l'item 03.</item>
/// </list>
///
/// Rendre <c>null</c> est la réponse honnête : un intervalle fabriqué se
/// lirait comme une donnée normale et ne lèverait jamais d'erreur.
/// </summary>
public static class TemporalNormalizer
{
    public static TemporalInterval? Normalize(TemporalValue value) => value switch
    {
        ExactDate d => Interval(d, d.Date, d.Date),

        Month m => Interval(m,
            new DateOnly(m.Year, m.MonthOfYear, 1),
            new DateOnly(m.Year, m.MonthOfYear,
                         DateTime.DaysInMonth(m.Year, m.MonthOfYear))),

        Year y => Interval(y, FirstDayOf(y.Value), LastDayOf(y.Value)),

        YearRange { EndYear: { } fin } r =>
            Interval(r, FirstDayOf(r.StartYear), LastDayOf(fin)),

        ApproximateYear a =>
            Interval(a, FirstDayOf(a.Year - a.Margin), LastDayOf(a.Year + a.Margin)),

        // Période ouverte, Age non résolu, Unknown : pas d'intervalle ici.
        _ => null,
    };

    private static TemporalInterval Interval(TemporalValue source, DateOnly start, DateOnly end)
        => new(source, start, end);

    private static DateOnly FirstDayOf(int year) => new(year, 1, 1);

    private static DateOnly LastDayOf(int year) => new(year, 12, 31);
}
