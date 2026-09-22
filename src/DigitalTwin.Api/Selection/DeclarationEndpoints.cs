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
            var dejaLa = await magasin.BatchEventIdsAsync(lot.UserId, lot.BatchId, ct);

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

            // Un joueur ne peut pas avoir joué sur une machine qui n'existait
            // pas. L'écran le refusait déjà — et **le nommait** — mais la
            // règle n'existait que dans le navigateur : la couche qui fait
            // foi était la plus permissive.
            //
            // On ne refuse que l'IMPOSSIBLE CERTAIN, c'est-à-dire quand
            // l'année la plus tardive que la période autorise précède encore
            // la sortie de la machine. Une imprécision qui chevauche
            // l'impossible reste acceptée : « vers 1991 » sur une console de
            // 1990 peut vouloir dire 1992, et refuser reviendrait à exiger
            // une précision que §7.3 interdit de demander.
            var lancement = d.Platforms
                .FirstOrDefault(p => p.CanonicalId == lot.PlatformId)?.LaunchYear;
            if (lancement is { } annee && DerniereAnneePossible(lot.Period) is { } fin
                && fin < annee)
            {
                return Results.BadRequest(new
                {
                    error = $"La machine « {lot.PlatformId} » est sortie en {annee} : "
                          + "la période déclarée lui est entièrement antérieure.",
                });
            }

            // Le filtrage a lieu APRÈS la traduction : une entrée fautive
            // doit être refusée même si sa cible est déjà dans le lot,
            // sinon un renvoi masquerait la faute.
            var nouveaux = evenements!
                .Where(e => !dejaLa.Contains(e.Id))
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
                // Les revendications frappées ici, rendues à l'appelant. Le
                // front saisit un titre, l'API décide de l'identifiant : sans
                // ce retour, plus rien ne peut s'y rattacher — et §9 place
                // justement là le contenu le plus personnel du produit. La
                // liste est TOUJOURS présente, vide le cas échéant : « aucune
                // revendication » et « le serveur n'en parle pas » ne doivent
                // pas se distinguer à l'absence d'un champ.
                claims = titres
                    .Select(titre => new { title = titre!, id = revendications[titre!] })
                    .ToList(),
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
                // Rendu ici comme les trois autres : un jugement qu'aucun
                // point d'entrée ne montre ne peut pas être éprouvé, et
                // c'est ainsi qu'une fermeture manquée resterait invisible
                // jusqu'à ce qu'un écran de Phase 3 la lise.
                stillPlaying = d.StillPlaying,
                provenance = d.Provenance,
                affect = d.Affect,
            }).ToList());
        });

        routes.MapPost("/declarations/retract", async (
            RetractRequest requete, EventStore magasin, CancellationToken ct) =>
        {
            // Rejouable : un double tap ou un renvoi réseau ne doit pas
            // échouer. Retirer ce qui n'a jamais été déclaré ne fait rien,
            // et le dit en rendant zéro.
            var retires = await magasin.RetractAsync(
                requete.UserId, requete.PlatformId, requete.WorkId, ct);
            return Results.Ok(new { retracted = retires });
        });

        routes.MapGet("/selection/{userId}/{platformId}", async (
            string userId, string platformId, EventStore magasin, CancellationToken ct) =>
        {
            // Ce que l'écran doit pouvoir remontrer après un rechargement.
            // Sans lui, toutes les lignes revenaient décochées alors que les
            // déclarations étaient en base : le testeur en concluait qu'il
            // avait tout perdu.
            var etat = await magasin.SelectionStateAsync(userId, platformId, ct);
            return Results.Ok(etat.Select(l => new
            {
                workId = l.WorkId,
                played = l.Played,
                completion = l.Completion,
                provenance = l.Provenance,
                neverPlayed = l.NeverPlayed,
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

    /// <summary>
    /// L'année la plus tardive que cette période autorise, ou <c>null</c>
    /// quand elle n'en borne aucune.
    ///
    /// <para><b>La plus tardive, et non la plus ancienne</b> : c'est ce qui
    /// rend le refus sûr. Une période ouverte s'étend jusqu'à aujourd'hui et
    /// n'est jamais impossible ; « je ne sais plus » non plus.</para>
    /// </summary>
    private static int? DerniereAnneePossible(PeriodInput periode) => periode.Kind switch
    {
        "year" => periode.Year,
        "approximate" => periode.Year is { } a
            ? a + (periode.Margin is { } m && m >= 1 ? m : PeriodInput.MargeParDefaut)
            : null,
        // Une fin absente veut dire « depuis » : la période court jusqu'à
        // aujourd'hui, donc aucune borne haute à opposer.
        "range" => periode.To,
        _ => null,
    };
}

/// <summary>
/// Ce qu'on retire. Par (utilisateur, plateforme, œuvre) et non par lot :
/// on décoche une ligne sur un écran, pas un passage entier — et la ligne
/// peut avoir été cochée lors d'une visite précédente.
/// </summary>
public sealed record RetractRequest(string UserId, string PlatformId, string WorkId);

/// <summary>L'œuvre à laquelle rattacher une revendication (§3.5).</summary>
public sealed record ResolveRequest(string WorkId);
