using DigitalTwin.Api.Persistence;
using DigitalTwin.Domain.Player;
using DigitalTwin.Domain.Temporal;

namespace DigitalTwin.Api.Timeline;

/// <summary>
/// La valeur temporelle telle que l'écran doit pouvoir l'afficher.
///
/// <para><b>La granularité voyage avec la date.</b> N'exposer qu'un
/// intervalle perdrait ce que l'utilisateur a déclaré : « vers 1995 »
/// s'afficherait comme « 1995 », et l'incertitude assumée — le seul
/// différenciateur réellement vacant du produit — disparaîtrait à
/// l'affichage.</para>
/// </summary>
public sealed record TemporalView(
    string Kind,
    string? Date = null,
    int? Year = null,
    int? Month = null,
    int? EndYear = null,
    int? Margin = null,
    int? Age = null);

public sealed record MomentView(
    string Id, string Type, string TargetKind, string TargetId,
    string Confidence, TemporalView OccurredAt);

public sealed record IntervalView(string Start, string End);

public sealed record EntryView(
    bool IsEpisode, IntervalView Interval, IReadOnlyList<MomentView> Moments);

public sealed record WarningView(
    string ExpectedEarlierId, string ExpectedLaterId, string Message);

public sealed record TimelineView(
    IReadOnlyList<EntryView> Entries,
    IReadOnlyList<MomentView> Undated,
    IReadOnlyList<WarningView> Warnings);

public static class TimelineEndpoints
{
    public static IEndpointRouteBuilder MapTimeline(this IEndpointRouteBuilder routes)
    {
        routes.MapGet("/timeline/{userId}", async (
            string userId, int? birthYear, EventStore magasin, CancellationToken ct) =>
        {
            var journal = await magasin.ReadAsync(userId, ct);

            // L'horizon se construit À LA LECTURE, avec l'année de naissance
            // du moment. C'est ce qui permet de la renseigner plus tard et de
            // replacer tous les moments concernés — sans réécrire un seul
            // événement, ce que le journal en ajout seul interdirait.
            var horizon = new TemporalHorizon(
                DateOnly.FromDateTime(DateTime.UtcNow), birthYear);

            // Aucun ordonnancement ici. Le domaine en a 387 tests ; le
            // réimplémenter, même partiellement, le ferait diverger sans que
            // rien ne le signale — et la timeline bougerait d'une visite à
            // l'autre, ce que l'utilisateur ne distingue pas d'une perte de
            // données.
            var tri = TimelineSorter.Sort(journal, horizon);

            return Results.Ok(new TimelineView(
                [.. tri.Entries.Select(e => new EntryView(
                    e.IsEpisode,
                    new IntervalView(
                        e.Interval.Start.ToString("yyyy-MM-dd"),
                        e.Interval.End.ToString("yyyy-MM-dd")),
                    [.. e.Moments.Select(Voir)]))],
                [.. tri.Undated.Select(Voir)],
                [.. tri.Warnings.Select(w => new WarningView(
                    w.ExpectedEarlierId, w.ExpectedLaterId, w.Message))]));
        });

        return routes;
    }

    private static MomentView Voir(PlayerEvent e)
        => new(e.Id, e.Type, e.Target.Kind, e.Target.Id,
               e.Confidence.ToString(), Voir(e.OccurredAt));

    /// <summary>
    /// Traduit la valeur temporelle <b>sans l'aplatir</b>.
    ///
    /// <para>L'expression est exhaustive par construction : la hiérarchie est
    /// fermée, donc une huitième variante échouerait à la compilation plutôt
    /// que de s'afficher comme « inconnu ».</para>
    /// </summary>
    private static TemporalView Voir(TemporalValue v) => v switch
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
