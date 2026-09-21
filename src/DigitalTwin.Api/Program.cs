using DigitalTwin.Api.Health;

var builder = WebApplication.CreateBuilder(args);

// La chaîne de connexion vient de la configuration, avec un défaut qui
// correspond au docker-compose du dépôt : `docker compose up` puis
// `./dotnet.sh run` doivent suffire, sans variable à exporter.
var connexion = builder.Configuration.GetConnectionString("Postgres")
    ?? "Host=localhost;Port=5433;Database=digitaltwin;Username=digitaltwin;Password=digitaltwin";

builder.Services.AddSingleton<IDatabaseProbe>(new PostgresProbe(connexion));

var app = builder.Build();
app.MapHealth();
app.Run();

/// <summary>
/// Rendue visible pour <c>WebApplicationFactory</c>. Les tests substituent
/// <see cref="IDatabaseProbe"/> : le cas qui compte est celui où la base est
/// tombée, et on ne peut pas éteindre une base réelle dans une boucle.
/// </summary>
public partial class Program;
