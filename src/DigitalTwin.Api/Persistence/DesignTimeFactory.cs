using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace DigitalTwin.Api.Persistence;

/// <summary>
/// Utilisée par <c>dotnet ef</c> uniquement. Elle évite que l'outillage ait
/// besoin de démarrer l'application — donc de trouver le référentiel, de
/// joindre la base, et d'échouer pour des raisons sans rapport avec le
/// schéma.
/// </summary>
public sealed class DesignTimeFactory : IDesignTimeDbContextFactory<PlayerEventDbContext>
{
    public PlayerEventDbContext CreateDbContext(string[] args)
        => new(new DbContextOptionsBuilder<PlayerEventDbContext>()
            .UseNpgsql("Host=localhost;Port=5433;Database=digitaltwin;"
                       + "Username=digitaltwin;Password=digitaltwin")
            .Options);
}
