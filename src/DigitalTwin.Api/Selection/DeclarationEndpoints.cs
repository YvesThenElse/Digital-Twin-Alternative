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
            var (evenements, declarations, refus) = DeclarationTranslator.Translate(
                lot,
                plateformeConnue: id => d.Platforms.Any(p => p.CanonicalId == id),
                oeuvreConnue: id => d.Works.Any(w => w.CanonicalId == id),
                surLaPlateforme: (oeuvre, plateforme) => d.Works
                    .Any(w => w.CanonicalId == oeuvre && w.Notability.ContainsKey(plateforme)),
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

        return routes;
    }
}
