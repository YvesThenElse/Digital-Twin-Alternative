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

/// <summary>
/// Une décennie de la bande de densité (E04, bloc ⒟).
///
/// <para><b>Les décennies vides sont rendues</b>, à zéro : c'est le creux
/// qui fait dire « j'ai peu joué entre 2005 et 2010 », et les retirer
/// dessinerait une bande pleine qui ne dit plus rien.</para>
/// </summary>
public sealed record ActivityView(int Decade, int Moments);

/// <param name="Figures">
/// <b><c>null</c> quand le profil est trop maigre pour un portrait.</b> E04 :
/// « Des statistiques calculées sur cinq jeux détruisent la crédibilité de
/// l'écran — c'est le principal risque de cette page. » Les envoyer en
/// comptant sur l'écran pour les cacher ferait dépendre cette règle d'un
/// `if` de rendu ; ici, un défaut d'affichage ne peut pas faire fuiter un
/// chiffre qui ment.
/// </param>
/// <param name="Moments">
/// Tout le journal — <b>le seul chiffre qu'un profil maigre puisse dire de
/// lui-même</b>. Il n'est pas là pour être affiché comme les quatre autres :
/// il répond à « cet historique est-il vide ? », question que l'accueil pose
/// avant de proposer une reprise (E01). Le fonder sur <c>Figures</c>, qui
/// disparaît sous le seuil du portrait, ferait proposer de tout recommencer
/// à qui a déjà trois déclarations.
/// </param>
/// <param name="BirthYear">
/// <c>null</c> tant qu'elle n'a pas été donnée, et c'est l'état normal.
/// Elle n'est pas un chiffre du portrait : elle dit au repli de précision
/// d'E07 s'il peut proposer « vers mes … ans » — sans elle, un âge n'a pas
/// de place sur l'axe (§7.6).
/// </param>
/// <param name="Activity">
/// <b><c>null</c> sous le seuil du portrait</b>, comme les chiffres : une
/// densité dessinée sur cinq moments dit aussi peu qu'un taux calculé sur
/// cinq jeux, et pour la même raison.
/// </param>
public sealed record ProfileView(
    int Moments, int? BirthYear, FiguresView? Figures,
    IReadOnlyList<ActivityView>? Activity, OpeningView? Opening);

/// <summary>
/// L'année de naissance, seule — <b>jamais publiée</b> (§12.3), et demandée
/// au moment où elle sert : le repli de précision d'E07.
/// </summary>
public sealed record AnneeDeNaissance(int? BirthYear);

public static class ProfileEndpoints
{
    public static IEndpointRouteBuilder MapProfile(this IEndpointRouteBuilder routes)
    {
        routes.MapGet("/profile/{userId}", async (
            string userId, EventStore magasin,
            ReferenceCatalogSource source, CancellationToken ct) =>
        {
            var journal = await magasin.ReadAsync(userId, ct);
            var souvenirs = await magasin.ReadMemoriesAsync(userId, ct);
            // Lue en base, plus reçue en paramètre : une année de naissance
            // que l'appelant fournit à chaque requête finirait par différer
            // d'un écran à l'autre, et les mêmes moments changeraient de
            // place selon la page.
            var birthYear = await magasin.BirthYearAsync(userId, ct);

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
                synthese.Moments,
                birthYear,
                synthese.MakesAPortrait
                    ? new FiguresView(
                        synthese.Consoles, synthese.GamesDeclared,
                        synthese.Finished, synthese.MemoriesWritten)
                    : null,
                synthese.MakesAPortrait && synthese.Activity.Count > 0
                    ? [.. synthese.Activity.Select(t => new ActivityView(t.Decade, t.Moments))]
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

        routes.MapPost("/profile/{userId}/birth-year", async (
            string userId, AnneeDeNaissance donnee, EventStore magasin,
            CancellationToken ct) =>
        {
            // Bornée aux deux extrémités : une année au-delà d'aujourd'hui
            // placerait tous les âges dans l'avenir, et une année
            // invraisemblablement basse ferait la même chose à l'envers. On
            // refuse en NOMMANT, plutôt que de corriger en silence.
            var aujourdhui = DateTime.UtcNow.Year;
            if (donnee.BirthYear is { } annee
                && (annee < aujourdhui - MaxAge || annee > aujourdhui))
            {
                return Results.BadRequest(new
                {
                    error = $"Année de naissance invraisemblable : {annee}. "
                            + $"Attendu entre {aujourdhui - MaxAge} et {aujourdhui}.",
                });
            }

            await magasin.SetBirthYearAsync(userId, donnee.BirthYear, ct);
            return Results.Ok(new AnneeDeNaissance(donnee.BirthYear));
        });

        return routes;
    }

    /// <summary>
    /// La borne de vraisemblance, la même que celle du domaine pour un âge.
    /// </summary>
    private const int MaxAge = 150;
}
