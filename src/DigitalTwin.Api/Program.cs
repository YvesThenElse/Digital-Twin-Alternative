using DigitalTwin.Api.Health;
using DigitalTwin.Api.Memories;
using DigitalTwin.Api.Persistence;
using DigitalTwin.Api.Reference;
using DigitalTwin.Api.Selection;
using DigitalTwin.Api.Timeline;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// ⚠️ La chaîne de connexion se lit DANS LES FABRIQUES, jamais ici.
//
// Les sources de configuration ajoutées par l'hôte de test ne sont versées
// qu'au moment du `Build()`. Lire `GetConnectionString` à cette ligne rendait
// le défaut — la base de développement — quoi que le test demande, et les
// tests de déclaration s'écrasaient sur une base sans schéma. La même faute
// avait déjà été commise sur le chemin du dataset.
static string Connexion(IServiceProvider sp)
    => sp.GetRequiredService<IConfiguration>().GetConnectionString("Postgres")
       // Défaut aligné sur le docker-compose du dépôt : `docker compose up`
       // puis `./dotnet.sh run` suffisent, sans variable à exporter.
       ?? "Host=localhost;Port=5433;Database=digitaltwin;"
          + "Username=digitaltwin;Password=digitaltwin";

builder.Services.AddSingleton<IDatabaseProbe>(sp => new PostgresProbe(Connexion(sp)));
builder.Services.AddDbContext<PlayerEventDbContext>(
    (sp, o) => o.UseNpgsql(Connexion(sp)));
builder.Services.AddScoped<EventStore>();

// L'enregistrement est paresseux, la vérification ne l'est pas.
//
// Lire `builder.Configuration` ICI donnerait la mauvaise valeur : les sources
// de configuration ajoutées par l'hôte de test ne sont versées qu'au moment
// du `Build()`. Le test qui pointait un dataset fautif voyait donc le vrai
// dataset, et passait pour la mauvaise raison. On lit la configuration dans
// la fabrique, et on FORCE la résolution juste après la construction — le
// démarrage échoue alors avant la première requête, ce qui est le but.
builder.Services.AddSingleton(sp =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    var chemin = config["Dataset:Path"]
        ?? ReferenceCatalogSource.Localiser(AppContext.BaseDirectory);
    return new ReferenceCatalogSource(chemin);
});

var app = builder.Build();

// Un dataset absent ou fautif doit empêcher le démarrage, pas se découvrir
// devant un testeur.
app.Services.GetRequiredService<ReferenceCatalogSource>();

app.MapHealth();
app.MapReference();
app.MapDeclarations();
app.MapTimeline();
app.MapMemories();
app.Run();

/// <summary>
/// Rendue visible pour <c>WebApplicationFactory</c>. Les tests substituent
/// <see cref="IDatabaseProbe"/> : le cas qui compte est celui où la base est
/// tombée, et on ne peut pas éteindre une base réelle dans une boucle.
/// </summary>
public partial class Program;
