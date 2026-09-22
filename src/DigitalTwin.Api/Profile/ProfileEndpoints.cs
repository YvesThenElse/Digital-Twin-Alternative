using DigitalTwin.Api.Persistence;
using DigitalTwin.Api.Reference;
using DigitalTwin.Api.Timeline;
using DigitalTwin.Domain.Player;
using DigitalTwin.Domain.Temporal;

namespace DigitalTwin.Api.Profile;

/// <summary>
/// Les quatre chiffres de l'en-tête (E04, bloc B).
///
/// <para><b>Rendus, ou absents — jamais à zéro.</b> §8.2 en liste treize ;
/// E04 tranche à quatre, « les afficher tous produirait un tableau de bord,
/// pas un portrait ».</para>
/// </summary>
public sealed record FiguresView(
    int Consoles, int GamesDeclared, int Finished, int MemoriesWritten);

/// <summary>
/// Le début de l'histoire (E04, bloc A).
/// </summary>
/// <param name="Years">
/// Les années écoulées, <b>toujours approchées</b> : le premier moment
/// DÉCLARÉ n'est pas le premier moment vécu. <c>null</c> sous un an.
/// </param>
/// <param name="Platform">
/// Le NOM de la machine, résolu ici. L'écran de lecture traverse toutes les
/// plateformes et n'en a chargé aucune : lui rendre l'identifiant le
/// forcerait à l'afficher tel quel ou à recharger le catalogue pour une
/// ligne. <c>null</c> quand la déclaration ne vient pas d'une machine.
/// </param>
/// <param name="OccurredAt">
/// La valeur déclarée avec sa granularité — « vers 1991 » n'est pas « 1991 ».
/// </param>
public sealed record OpeningView(int? Years, string? Platform, TemporalView OccurredAt);

/// <param name="Figures">
/// <b><c>null</c> quand le profil est trop maigre pour un portrait.</b> E04 :
/// « Des statistiques calculées sur cinq jeux détruisent la crédibilité de
/// l'écran — c'est le principal risque de cette page. » Les envoyer en
/// comptant sur l'écran pour les cacher ferait dépendre cette règle d'un
/// `if` de rendu ; ici, un défaut d'affichage ne peut pas faire fuiter un
/// chiffre qui ment.
/// </param>
public sealed record ProfileView(FiguresView? Figures, OpeningView? Opening);

public static class ProfileEndpoints
{
    public static IEndpointRouteBuilder MapProfile(this IEndpointRouteBuilder routes)
    {
        routes.MapGet("/profile/{userId}", async (
            string userId, int? birthYear, EventStore magasin,
            ReferenceCatalogSource source, CancellationToken ct) =>
        {
            var journal = await magasin.ReadAsync(userId, ct);
            var souvenirs = await magasin.ReadMemoriesAsync(userId, ct);

            // Le même horizon qu'à la lecture de l'axe, construit avec
            // l'année de naissance du MOMENT : renseignée plus tard, elle
            // replace les souvenirs datés par l'âge sans réécrire un
            // événement.
            var horizon = new TemporalHorizon(
                DateOnly.FromDateTime(DateTime.UtcNow), birthYear);

            var synthese = ProfileProjection.Summarize(
                journal,
                souvenirs.Select(m => new EventTarget(m.TargetKind, m.TargetId)),
                horizon);

            var machines = source.Dataset.Platforms.ToDictionary(
                p => p.CanonicalId, p => p.Name, StringComparer.Ordinal);

            return Results.Ok(new ProfileView(
                synthese.MakesAPortrait
                    ? new FiguresView(
                        synthese.Consoles, synthese.GamesDeclared,
                        synthese.Finished, synthese.MemoriesWritten)
                    : null,
                synthese.Opening is { } debut
                    ? new OpeningView(
                        debut.Years,
                        debut.PlatformId is { } id
                            // Inconnue du référentiel : on ne la nomme pas
                            // plutôt que d'afficher un identifiant.
                            ? machines.GetValueOrDefault(id)
                            : null,
                        TemporalEncoding.Voir(debut.OccurredAt))
                    : null));
        });

        return routes;
    }
}
