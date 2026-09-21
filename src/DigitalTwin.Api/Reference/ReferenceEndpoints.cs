using DigitalTwin.Domain.Reference;

namespace DigitalTwin.Api.Reference;

/// <summary>
/// Une plateforme, telle que l'écran de choix de machine la lit.
/// </summary>
/// <param name="LaunchYear">
/// L'écran de période s'en sert pour borner son curseur : proposer 1985 sur
/// une Nintendo 64 ferait perdre du temps à tout le monde.
/// </param>
public sealed record PlatformView(
    string Id, string Name, bool RegionFree, int? LaunchYear, int WorksCount);

/// <summary>Une sortie, restreinte à la plateforme demandée.</summary>
public sealed record ReleaseView(string? Region, string Date, string Precision, string Confidence);

/// <summary>
/// Une œuvre vue depuis <b>une</b> plateforme : son rang y est propre, et ses
/// sorties comme son statut régional n'y décrivent que cette machine.
/// </summary>
/// <param name="CoverUrl">
/// <c>null</c> quand aucune jaquette n'existe — l'écran compose alors une
/// tuile, qui est le socle permanent de §19.2 et non un repli d'erreur.
/// </param>
public sealed record WorkView(
    string Id, string Title, int Notability,
    IReadOnlyList<ReleaseView> Releases,
    IReadOnlyDictionary<string, string> RegionStatus,
    string? CoverUrl);

public static class ReferenceEndpoints
{
    public static IEndpointRouteBuilder MapReference(this IEndpointRouteBuilder routes)
    {
        routes.MapGet("/platforms", (ReferenceCatalogSource source) =>
        {
            var d = source.Dataset;
            // Ordre CHRONOLOGIQUE, calculé depuis l'année de lancement.
            //
            // L'ordre du dataset ne l'est pas : la Super Nintendo (1990) y
            // précède la Game Boy (1989), parce qu'il suit les familles et
            // non les dates. Un joueur qui remonte le temps attend ses
            // machines dans l'ordre où il les a connues.
            return d.Platforms
                .OrderBy(p => p.LaunchYear ?? int.MaxValue)
                .ThenBy(p => p.Name, StringComparer.Ordinal)
                .Select(p => new PlatformView(
                    p.CanonicalId, p.Name, p.RegionFree, p.LaunchYear,
                    d.Works.Count(w => w.Notability.ContainsKey(p.CanonicalId))))
                .ToList();
        });

        routes.MapGet("/platforms/{platformId}/works",
            (string platformId, ReferenceCatalogSource source) =>
        {
            var d = source.Dataset;
            if (!d.Platforms.Any(p => p.CanonicalId == platformId))
            {
                // Nommer la plateforme demandée : « introuvable » seul oblige
                // à deviner ce que le client a envoyé.
                return Results.NotFound(new
                {
                    error = $"Plateforme inconnue : « {platformId} ».",
                });
            }

            var oeuvres = d.Works
                .Where(w => w.Notability.ContainsKey(platformId))
                .OrderBy(w => w.Notability[platformId])
                .Select(w => new WorkView(
                    w.CanonicalId,
                    w.Title,
                    w.Notability[platformId],
                    [.. d.Releases
                        .Where(r => r.WorkId == w.CanonicalId && r.PlatformId == platformId)
                        .OrderBy(r => r.Date)
                        .Select(r => new ReleaseView(r.Region, r.Date, r.Precision, r.Confidence))],
                    Statuts(w, platformId),
                    source.WorksWithCover.Contains(w.CanonicalId)
                        ? $"/covers/{w.CanonicalId}" : null))
                .ToList();

            return Results.Ok(oeuvres);
        });

        return routes;
    }

    /// <summary>
    /// Les trois états de §3.4, tels que l'écran doit pouvoir les distinguer.
    /// Une région <b>absente de cette table</b> a une sortie : son état est
    /// dit par la sortie elle-même.
    /// </summary>
    private static Dictionary<string, string> Statuts(Work oeuvre, string platformId)
    {
        var sortie = new Dictionary<string, string>(StringComparer.Ordinal);
        if (!oeuvre.RegionStatus.TryGetValue(platformId, out var regions)) return sortie;

        foreach (var (region, statut) in regions)
        {
            sortie[region] = statut switch
            {
                RegionAvailability.NotReleased => "notReleased",
                RegionAvailability.Released => "released",
                _ => "unknown",
            };
        }
        return sortie;
    }
}
