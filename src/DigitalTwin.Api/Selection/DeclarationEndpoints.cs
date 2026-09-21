using DigitalTwin.Api.Persistence;
using DigitalTwin.Api.Reference;

namespace DigitalTwin.Api.Selection;

public static class DeclarationEndpoints
{
    public static IEndpointRouteBuilder MapDeclarations(this IEndpointRouteBuilder routes)
    {
        routes.MapPost("/declarations", async (
            DeclarationBatch lot,
            ReferenceCatalogSource source,
            EventStore magasin,
            CancellationToken ct) =>
        {
            // Reconnaître le lot AVANT de traduire : un renvoi ne doit ni
            // dupliquer, ni échouer, ni coûter la validation complète.
            if (await magasin.BatchExistsAsync(lot.UserId, lot.BatchId, ct))
            {
                return Results.Ok(new
                {
                    batchId = lot.BatchId,
                    created = 0,
                    alreadyRecorded = true,
                });
            }

            var d = source.Dataset;

            // Les revendications sont créées AVANT la traduction, et non
            // depuis un rappel : bloquer sur de l'asynchrone au milieu d'une
            // requête est un piège qu'on ne laisse pas derrière soi. La
            // traduction ne fait plus qu'une lecture de table.
            var titres = lot.Entries
                .Select(e => e.Title?.Trim())
                .Where(titre => !string.IsNullOrEmpty(titre))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            var revendications = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            foreach (var titre in titres)
            {
                revendications[titre!] = await magasin.EnsureClaimAsync(
                    lot.UserId, titre!, lot.PlatformId, ct);
            }

            var (evenements, declarations, refus) = DeclarationTranslator.Translate(
                lot,
                plateformeConnue: id => d.Platforms.Any(p => p.CanonicalId == id),
                oeuvreConnue: id => d.Works.Any(w => w.CanonicalId == id),
                surLaPlateforme: (oeuvre, plateforme) => d.Works
                    .Any(w => w.CanonicalId == oeuvre && w.Notability.ContainsKey(plateforme)),
                cibleRevendication: intention => revendications[intention.Title],
                // L'axe exact, toujours en UTC : il sert l'audit et le
                // départage, jamais l'affichage.
                enregistreA: DateTime.UtcNow);

            if (refus is not null)
            {
                return Results.BadRequest(new { error = refus.Message });
            }

            await magasin.AppendAsync(evenements!, ct);
            var jugements = await magasin.ApplyDeclarationsAsync(lot.UserId, declarations!, ct);

            return Results.Ok(new
            {
                batchId = lot.BatchId,
                created = evenements!.Count,
                declarationsRecorded = jugements,
                alreadyRecorded = false,
                eventIds = evenements.Select(e => e.Id).ToList(),
            });
        });

        routes.MapGet("/declarations/{userId}", async (
            string userId, EventStore magasin, CancellationToken ct) =>
        {
            // Prouve la distinction qui fait tout l'intérêt de §24.3 : une
            // œuvre ABSENTE de cette liste n'a pas été déclarée, une œuvre
            // présente avec `neverPlayed` l'a été explicitement.
            var declarations = await magasin.ReadDeclarationsAsync(userId, ct);
            return Results.Ok(declarations.Select(d => new
            {
                workId = d.WorkId,
                platformId = d.PlatformId,
                neverPlayed = d.NeverPlayed,
                provenance = d.Provenance,
                affect = d.Affect,
            }).ToList());
        });

        routes.MapGet("/unresolved/{userId}", async (
            string userId, EventStore magasin, CancellationToken ct) =>
        {
            var revendications = await magasin.ReadClaimsAsync(userId, ct);
            return Results.Ok(revendications.Select(c => new
            {
                id = c.Id,
                title = c.Title,
                platformId = c.PlatformId,
                resolved = c.ResolvedWorkId is not null,
                resolvedWorkId = c.ResolvedWorkId,
            }).ToList());
        });

        routes.MapPost("/unresolved/{userId}/{claimId}/resolve", async (
            string userId, string claimId, ResolveRequest requete,
            ReferenceCatalogSource source, EventStore magasin, CancellationToken ct) =>
        {
            if (!source.Dataset.Works.Any(w => w.CanonicalId == requete.WorkId))
            {
                return Results.BadRequest(new
                {
                    error = $"Œuvre inconnue : « {requete.WorkId} ».",
                });
            }

            var rattachee = await magasin.ResolveClaimAsync(
                userId, claimId, requete.WorkId, ct);

            return rattachee
                ? Results.Ok(new { claimId, resolvedWorkId = requete.WorkId })
                : Results.NotFound(new
                {
                    error = $"Revendication inconnue : « {claimId} » pour « {userId} ».",
                });
        });

        return routes;
    }
}

/// <summary>L'œuvre à laquelle rattacher une revendication (§3.5).</summary>
public sealed record ResolveRequest(string WorkId);
