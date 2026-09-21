using DigitalTwin.Api.Persistence;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace DigitalTwin.Api.Tests;

/// <summary>
/// Une base de test réelle, recréée à chaque exécution.
///
/// <para><b>Pas de base en mémoire, pas de SQLite.</b> Le domaine est
/// temporel, et c'est précisément là que les fournisseurs divergent :
/// <c>timestamptz</c>, <c>date</c>, la précision à la microseconde, les
/// déclencheurs. Valider ailleurs puis migrer ferait réapparaître la classe
/// de défaut la plus coûteuse de ce dépôt — celle qui ne lève jamais
/// d'exception.</para>
///
/// <para>La base est <b>supprimée puis recréée</b> : un reste d'exécution
/// précédente ferait passer ou échouer des tests pour une raison invisible.
/// </para>
/// </summary>
public sealed class PostgresFixture : IAsyncLifetime
{
    private const string Hote = "Host=127.0.0.1;Port=5433;Username=digitaltwin;Password=digitaltwin";
    private const string BaseDeTest = "digitaltwin_test";

    public string ConnectionString { get; } = $"{Hote};Database={BaseDeTest}";

    public async Task InitializeAsync()
    {
        await using (var admin = new NpgsqlConnection($"{Hote};Database=postgres"))
        {
            try
            {
                await admin.OpenAsync();
            }
            catch (Exception e)
            {
                // Échouer en disant quoi faire. « Connection refused » seul
                // enverrait chercher un bug dans le code.
                throw new InvalidOperationException(
                    "PostgreSQL injoignable sur 127.0.0.1:5433. `./test.sh` le démarre ; "
                    + "en direct, lancer `docker compose up -d postgres`.", e);
            }

            await Executer(admin,
                $"""
                 SELECT pg_terminate_backend(pid) FROM pg_stat_activity
                 WHERE datname = '{BaseDeTest}' AND pid <> pg_backend_pid();
                 """);
            await Executer(admin, $"DROP DATABASE IF EXISTS {BaseDeTest};");
            await Executer(admin, $"CREATE DATABASE {BaseDeTest};");
        }

        await using var db = CreerContexte();
        await db.Database.MigrateAsync();
    }

    public Task DisposeAsync() => Task.CompletedTask;

    public PlayerEventDbContext CreerContexte()
        => new(new DbContextOptionsBuilder<PlayerEventDbContext>()
            .UseNpgsql(ConnectionString).Options);

    private static async Task Executer(NpgsqlConnection c, string sql)
    {
        await using var cmd = new NpgsqlCommand(sql, c);
        await cmd.ExecuteNonQueryAsync();
    }
}

[CollectionDefinition("postgres")]
public sealed class PostgresCollection : ICollectionFixture<PostgresFixture>;
