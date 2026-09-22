using DigitalTwin.Api.Persistence;
using DigitalTwin.Api.Reference;

namespace DigitalTwin.Api.Memories;

/// <summary>
/// Une note libre attachée à une œuvre ou à un titre saisi librement, et son
/// repère facultatif (§9.2).
///
/// <para><b>La requête porte le souvenir entier</b>, jamais un correctif :
/// <c>Title</c> absent vaut « pas de repère », et efface celui qui existait.
/// Lire l'absence comme « ne change rien » rendrait un repère ineffaçable.</para>
/// </summary>
public sealed record MemoryRequest(
    string UserId, string TargetKind, string TargetId, string Text,
    string? Title = null);

public static class MemoryEndpoints
{
    private const string Oeuvre = "work";
    private const string TitreLibre = "unresolvedClaim";

    /// <summary>
    /// Ce qu'un <b>repère</b> peut faire de long.
    ///
    /// <para>§9.2 dit « un titre court » ; l'axe de E03 lui donne une ligne
    /// au milieu de trente ans de moments. Une page collée dans ce champ ne
    /// serait plus un repère et repousserait tous les autres moments hors de
    /// l'écran. La règle vit ici, dans la couche qui écrit : répétée par
    /// l'écran seul, elle n'existerait pas.</para>
    /// </summary>
    private const int LongueurMaxTitre = 80;

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

            // Vide vaut ABSENCE : le champ effacé puis quitté ne doit pas
            // écrire un repère muet, qui s'afficherait sur l'axe comme une
            // marque annonçant une phrase introuvable.
            var titre = requete.Title?.Trim();
            if (titre?.Length == 0) titre = null;
            if (titre is not null && titre.Length > LongueurMaxTitre)
            {
                return Results.BadRequest(new
                {
                    error = $"Un repère de souvenir tient en {LongueurMaxTitre} "
                            + $"caractères ; celui-ci en fait {titre.Length}.",
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
                requete.UserId, requete.TargetKind, requete.TargetId, texte, titre, ct);

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
                title = m.Title,
                updatedAt = m.UpdatedAt,
            }).ToList());
        });

        return routes;
    }
}
