using Npgsql;

namespace DigitalTwin.Api.Health;

/// <summary>Ce que la sonde a trouvé, et de quoi le dire à un humain.</summary>
/// <param name="IsReachable">La base a répondu à une requête, pas seulement ouvert un socket.</param>
/// <param name="Detail">Version, ou cause de l'échec. Jamais vide.</param>
public sealed record DatabaseStatus(bool IsReachable, string Detail)
{
    public static DatabaseStatus Reachable(string detail) => new(true, detail);
    public static DatabaseStatus Unreachable(string detail) => new(false, detail);
}

/// <summary>
/// Interroge la base. <b>Une interface, parce que le cas qui compte est le
/// cas dégradé</b> — et qu'on ne peut pas éteindre une base réelle dans une
/// boucle de test.
/// </summary>
public interface IDatabaseProbe
{
    Task<DatabaseStatus> CheckAsync(CancellationToken ct = default);
}

/// <summary>
/// La sonde réelle. Elle exécute <c>SELECT version()</c> plutôt que d'ouvrir
/// une connexion et de la refermer : PostgreSQL accepte la connexion avant
/// d'être prêt à servir, et un simple « connecté » a déjà laissé passer une
/// base en cours de récupération.
/// </summary>
public sealed class PostgresProbe(string connectionString) : IDatabaseProbe
{
    public async Task<DatabaseStatus> CheckAsync(CancellationToken ct = default)
    {
        await using var connexion = new NpgsqlConnection(connectionString);
        await connexion.OpenAsync(ct);
        await using var commande = new NpgsqlCommand("SELECT version()", connexion);
        var version = (string?)await commande.ExecuteScalarAsync(ct);
        return DatabaseStatus.Reachable(version ?? "version inconnue");
    }
}
