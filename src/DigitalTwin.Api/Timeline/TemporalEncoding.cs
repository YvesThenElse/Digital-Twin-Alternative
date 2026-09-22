using DigitalTwin.Domain.Temporal;

namespace DigitalTwin.Api.Timeline;

/// <summary>
/// La traduction d'une valeur temporelle vers ce que l'écran affiche.
///
/// <para><b>Une seule.</b> Elle vivait en privé dans l'endpoint de la
/// timeline ; le profil en a besoin pour rendre le début de l'histoire avec
/// sa granularité. Deux traductions du même type finiraient par diverger —
/// l'une porterait « vers 1991 » et l'autre « 1991 », et rien ne dirait
/// laquelle a raison.</para>
/// </summary>
public static class TemporalEncoding
{
    /// <summary>
    /// Traduit la valeur temporelle <b>sans l'aplatir</b>.
    ///
    /// <para>L'expression est exhaustive par construction : la hiérarchie est
    /// fermée, donc une huitième variante échouerait à la compilation plutôt
    /// que de s'afficher comme « inconnu ».</para>
    /// </summary>
    public static TemporalView Voir(TemporalValue v) => v switch
    {
        ExactDate x => new TemporalView("ExactDate", Date: x.Date.ToString("yyyy-MM-dd")),
        Month m => new TemporalView("Month", Year: m.Year, Month: m.MonthOfYear),
        Year y => new TemporalView("Year", Year: y.Value),
        YearRange r => new TemporalView("YearRange", Year: r.StartYear, EndYear: r.EndYear),
        ApproximateYear a => new TemporalView("ApproximateYear", Year: a.Year, Margin: a.Margin),
        // Brut, jamais résolu : l'écran affiche « vers mes 12 ans » et la
        // résolution appartient à l'horizon, pas à la valeur.
        Age g => new TemporalView("Age", Age: g.Years),
        Unknown => new TemporalView("Unknown"),
        _ => throw new NotSupportedException(
            $"Variante temporelle non rendue : {v.GetType().Name}."),
    };
}
