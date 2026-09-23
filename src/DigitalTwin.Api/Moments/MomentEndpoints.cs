using DigitalTwin.Api.Persistence;
using DigitalTwin.Api.Selection;
using DigitalTwin.Domain.Temporal;

namespace DigitalTwin.Api.Moments;

/// <param name="Period">
/// La nouvelle date, dans le <b>même vocabulaire</b> que la période de la
/// sélection massive. Un second vocabulaire pour dire la même chose finirait
/// par diverger.
/// </param>
public sealed record CorrectionDeDate(string UserId, PeriodInput Period);

/// <summary>Ce que la correction rend : l'identifiant du moment qui remplace.</summary>
public sealed record MomentCorrigeView(string EventId);

/// <summary>
/// La correction d'un moment (E07 · §5.3).
///
/// <para><b>« La correction est banale.</b> Aucun avertissement ni
/// confirmation pour modifier un moment : ce sont des souvenirs, ils se
/// corrigent. La révision est conservée côté système sans être
/// exposée. »</para>
/// </summary>
public static class MomentEndpoints
{
    public static IEndpointRouteBuilder MapMoments(this IEndpointRouteBuilder routes)
    {
        routes.MapPost("/moments/{eventId}/date", async (
            string eventId, CorrectionDeDate correction, EventStore magasin,
            CancellationToken ct) =>
        {
            TemporalValue quand;
            try
            {
                quand = correction.Period.ToTemporalValue();
            }
            catch (ArgumentException e)
            {
                // Nommer ce qu'on a reçu : un genre inconnu replié sur « je
                // ne sais plus » transformerait une faute de l'appelant en
                // souvenir sans date, et le joueur verrait son moment glisser
                // dans le tiroir sans que rien ne l'explique.
                return Results.BadRequest(new { error = e.Message });
            }

            var nouveau = await magasin.RescheduleAsync(
                correction.UserId, eventId, quand,
                // L'axe exact, toujours en UTC : il sert l'audit et le
                // départage, jamais l'affichage.
                DateTime.UtcNow, ct);

            if (nouveau is null)
            {
                // Introuvable OU déjà remplacé : les deux se disent de la
                // même façon. Il n'y a rien à corriger dans les deux cas, et
                // les distinguer apprendrait à un tiers qu'un identifiant
                // existe — sur une application sans authentification, c'est
                // la seule discrétion disponible.
                return Results.NotFound(new
                {
                    error = $"Moment introuvable ou déjà corrigé : « {eventId} ».",
                });
            }

            return Results.Ok(new MomentCorrigeView(nouveau));
        });

        return routes;
    }
}
