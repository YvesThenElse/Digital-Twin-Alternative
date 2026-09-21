using DigitalTwin.Api.Persistence;
using DigitalTwin.Api.Reference;

namespace DigitalTwin.Api.Memories;

/// <summary>Une note libre attachée à une œuvre ou à un titre saisi librement.</summary>
public sealed record MemoryRequest(
    string UserId, string TargetKind, string TargetId, string Text);

public static class MemoryEndpoints
{
    private const string Oeuvre = "work";
    private const string TitreLibre = "unresolvedClaim";

    public static IEndpointRouteBuilder MapMemories(this IEndpointRouteBuilder routes)
    {
        routes.MapPost("/memories", async (
            MemoryRequest requete,
            ReferenceCatalogSource source,
            EventStore magasin,
            CancellationToken ct) =>
        {
            // Seuls les bords sont rognés. Les retours à la ligne, la
            // ponctuation et les emoji du milieu SONT le souvenir : les
            // normaliser retirerait exactement ce qui le rend personnel.
            var texte = requete.Text?.Trim() ?? "";
            if (texte.Length == 0)
            {
                return Results.BadRequest(new
                {
                    error = "Un souvenir vide n'est pas un souvenir : rien à garder.",
                });
            }

            if (requete.TargetKind is not (Oeuvre or TitreLibre))
            {
                return Results.BadRequest(new
                {
                    error = $"Cible inconnue : « {requete.TargetKind} ». Attendu : "
                            + $"{Oeuvre} ou {TitreLibre}.",
                });
            }

            // Une cible qui n'existe pas produirait un souvenir orphelin, que
            // plus aucun écran ne montrerait — le contenu le plus précieux du
            // produit disparaîtrait sans erreur.
            if (requete.TargetKind == Oeuvre
                && !source.Dataset.Works.Any(w => w.CanonicalId == requete.TargetId))
            {
                return Results.BadRequest(new
                {
                    error = $"Œuvre inconnue : « {requete.TargetId} ».",
                });
            }

            await magasin.UpsertMemoryAsync(
                requete.UserId, requete.TargetKind, requete.TargetId, texte, ct);

            return Results.Ok(new { targetId = requete.TargetId });
        });

        routes.MapGet("/memories/{userId}", async (
            string userId, EventStore magasin, CancellationToken ct) =>
        {
            var souvenirs = await magasin.ReadMemoriesAsync(userId, ct);
            return Results.Ok(souvenirs.Select(m => new
            {
                targetKind = m.TargetKind,
                targetId = m.TargetId,
                text = m.Text,
                updatedAt = m.UpdatedAt,
            }).ToList());
        });

        return routes;
    }
}
