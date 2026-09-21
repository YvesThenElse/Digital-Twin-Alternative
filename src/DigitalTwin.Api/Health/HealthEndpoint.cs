namespace DigitalTwin.Api.Health;

/// <summary>
/// Le point de santé. <b>Il répond de la base, pas du processus.</b>
///
/// <para>Un point de santé qui rend « ok » parce que l'application est
/// vivante est vert exactement quand on a besoin qu'il soit rouge. Celui-ci
/// interroge la base et rend <c>503</c> si elle ne répond pas — le code que
/// lit un orchestrateur, et non un détail enfoui dans le corps JSON.</para>
/// </summary>
public static class HealthEndpoint
{
    public static IEndpointRouteBuilder MapHealth(this IEndpointRouteBuilder routes)
    {
        routes.MapGet("/health", async (IDatabaseProbe sonde, CancellationToken ct) =>
        {
            DatabaseStatus statut;
            try
            {
                statut = await sonde.CheckAsync(ct);
            }
            catch (Exception e)
            {
                // Npgsql lève plutôt qu'il ne rend « injoignable ». Propager
                // donnerait un 500, indistinguable d'un bug de l'API alors
                // que la cause est connue et nommable.
                statut = DatabaseStatus.Unreachable(e.Message);
            }

            var corps = new
            {
                status = statut.IsReachable ? "ok" : "degraded",
                database = new
                {
                    status = statut.IsReachable ? "ok" : "unreachable",
                    detail = statut.Detail,
                },
            };

            return statut.IsReachable
                ? Results.Ok(corps)
                : Results.Json(corps, statusCode: StatusCodes.Status503ServiceUnavailable);
        });

        return routes;
    }
}
