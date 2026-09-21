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
            // Les cibles DÉJÀ dans ce lot. Un lot se remplit au fil des
            // gestes : on retire ce qui y est, on garde le reste. Rejeter le
            // lot entier ne conservait que la première déclaration.
            var dejaLa = await magasin.BatchTargetsAsync(lot.UserId, lot.BatchId, ct);

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

            // Le filtrage a lieu APRÈS la traduction : une entrée fautive
            // doit être refusée même si sa cible est déjà dans le lot,
            // sinon un renvoi masquerait la faute.
            var nouveaux = evenements!
                .Where(e => !dejaLa.Contains(e.Target.Id))
                .ToList();

            // Pas de retour anticipé quand il n'y a rien de nouveau à écrire :
            // un lot de « jamais joué » ne produit AUCUN événement, et
            // s'arrêter là sauterait l'écriture des jugements. Le test l'a
            // attrapé immédiatement.
            var evenementsAEcrire = nouveaux;
            if (evenementsAEcrire.Count > 0)
            {
                await magasin.AppendAsync(evenementsAEcrire, ct);
            }
            var jugements = await magasin.ApplyDeclarationsAsync(lot.UserId, declarations!, ct);

            return Results.Ok(new
            {
                batchId = lot.BatchId,
                created = evenementsAEcrire.Count,
                declarationsRecorded = jugements,
                // « Déjà enregistré » ne vaut que si le lot portait des
                // événements ET que tous étaient déjà là.
                alreadyRecorded = evenements!.Count > 0 && evenementsAEcrire.Count == 0,
                eventIds = evenementsAEcrire.Select(e => e.Id).ToList(),
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
