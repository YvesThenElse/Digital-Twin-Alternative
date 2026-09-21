using DigitalTwin.Api.Reference;

namespace DigitalTwin.Api.Reference;

public static class CoverEndpoints
{
    /// <summary>
    /// Les types servables. <b>Liste fermée</b> : deviner le type depuis
    /// l'extension d'un fichier venu d'une source tierce reviendrait à servir
    /// ce qu'on n'a pas examiné.
    /// </summary>
    private static readonly Dictionary<string, string> Types = new(StringComparer.OrdinalIgnoreCase)
    {
        [".png"] = "image/png",
        [".jpg"] = "image/jpeg",
        [".jpeg"] = "image/jpeg",
        [".webp"] = "image/webp",
    };

    /// <summary>
    /// Sert les jaquettes annoncées par <c>coverUrl</c>.
    ///
    /// <para>L'API les <b>annonçait sans les servir</b> : la grille desktop
    /// affichait 218 images cassées, alors que la reconnaissance est la
    /// mécanique centrale de E02 (§19.2). Une URL est une promesse.</para>
    ///
    /// <para>Le chemin vient du manifeste, jamais de la requête : accepter un
    /// nom de fichier laisserait remonter l'arborescence.</para>
    /// </summary>
    public static IEndpointRouteBuilder MapCovers(this IEndpointRouteBuilder routes)
    {
        routes.MapGet("/covers/{workId}", (string workId, ReferenceCatalogSource source) =>
        {
            var fichier = source.CoverFile(workId);
            if (fichier is null || !File.Exists(fichier))
            {
                return Results.NotFound(new
                {
                    error = $"Aucune jaquette servable pour « {workId} ».",
                });
            }

            var extension = Path.GetExtension(fichier);
            if (!Types.TryGetValue(extension, out var type))
            {
                return Results.NotFound(new
                {
                    error = $"Type de fichier non servable : « {extension} ».",
                });
            }

            return Results.File(fichier, type);
        });

        return routes;
    }
}
