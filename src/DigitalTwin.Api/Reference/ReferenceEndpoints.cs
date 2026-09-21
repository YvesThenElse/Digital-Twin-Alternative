using DigitalTwin.Domain.Reference;

namespace DigitalTwin.Api.Reference;

/// <summary>Une plateforme, telle que l'écran de choix de machine la lit.</summary>
public sealed record PlatformView(string Id, string Name, bool RegionFree, int WorksCount);

/// <summary>Une sortie, restreinte à la plateforme demandée.</summary>
public sealed record ReleaseView(string? Region, string Date, string Precision, string Confidence);

/// <summary>
/// Une œuvre vue depuis <b>une</b> plateforme : son rang y est propre, et ses
/// sorties comme son statut régional n'y décrivent que cette machine.
/// </summary>
public sealed record WorkView(
    string Id, string Title, int Notability,
    IReadOnlyList<ReleaseView> Releases,
    IReadOnlyDictionary<string, string> RegionStatus);

public static class ReferenceEndpoints
{
    public static IEndpointRouteBuilder MapReference(this IEndpointRouteBuilder routes)
    {
        routes.MapGet("/platforms", (ReferenceCatalogSource source) =>
        {
            var d = source.Dataset;
            // L'ordre est celui du dataset, qui suit les générations. Le
            // conserver évite d'inventer un tri que la donnée ne porte pas.
            return d.Platforms.Select(p => new PlatformView(
                p.CanonicalId, p.Name, p.RegionFree,
                d.Works.Count(w => w.Notability.ContainsKey(p.CanonicalId)))).ToList();
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
                    Statuts(w, platformId)))
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
