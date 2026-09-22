using System.Net.Http.Json;
using System.Text.Json;
using DigitalTwin.Api.Health;
using DigitalTwin.Api.Persistence;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace DigitalTwin.Api.Tests;

/// <summary>
/// Le contrat entre l'API et le client (audit, item 35).
///
/// <para><b>Le client fait un <c>as T</c>.</b> Un champ ajouté, renommé ou
/// rendu facultatif disparaît côté front sans qu'aucun outil ne puisse le
/// dire — c'est l'apprentissage 56, et l'inventaire écrit dans
/// <c>client.ts</c> n'était vérifié par rien.</para>
///
/// <para>Faute de schéma partagé, <c>CONTRAT-API.json</c> EST le contrat.
/// Ce test compare les champs <b>réellement rendus</b> à ce qui y est
/// déclaré : un champ de plus, de moins, ou renommé fait échouer la suite en
/// le nommant. Le pendant côté front exige que chaque champ lu le soit
/// vraiment, et qu'aucun champ ignoré ne le soit.</para>
///
/// <para>⚠️ Il compare des <b>ensembles de noms</b>, pas des types. Une
/// chaîne qui devient un nombre lui échappe ; c'est la limite assumée d'un
/// contrat écrit à la main, et la dérive de type connue — <c>launchYear</c>
/// facultative côté API, requise côté client — est gardée ailleurs, par
/// <c>ReferentielTests</c>.</para>
/// </summary>
[Collection("postgres")]
public class ContratApiTests(PostgresFixture bdd)
{
    private WebApplicationFactory<Program> Usine() =>
        new WebApplicationFactory<Program>().WithWebHostBuilder(b =>
        {
            b.ConfigureAppConfiguration((_, c) => c.AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["ConnectionStrings:Postgres"] = bdd.ConnectionString,
                }));
            b.ConfigureServices(s =>
            {
                s.RemoveAll<IDatabaseProbe>();
                s.AddSingleton<IDatabaseProbe>(new SondeVerte());
            });
        });

    private sealed class SondeVerte : IDatabaseProbe
    {
        public Task<DatabaseStatus> CheckAsync(CancellationToken ct = default)
            => Task.FromResult(DatabaseStatus.Reachable("PostgreSQL de test"));
    }

    /// <summary>
    /// Le contrat, lu depuis la racine du dépôt — pas recopié ici. Deux
    /// copies d'un contrat finissent par diverger, et c'est précisément le
    /// défaut qu'il existe pour empêcher.
    /// </summary>
    private static JsonElement Contrat()
    {
        var racine = new DirectoryInfo(AppContext.BaseDirectory);
        while (racine is not null && !File.Exists(Path.Combine(racine.FullName, "CONTRAT-API.json")))
        {
            racine = racine.Parent;
        }
        Assert.NotNull(racine);
        return JsonDocument
            .Parse(File.ReadAllText(Path.Combine(racine!.FullName, "CONTRAT-API.json")))
            .RootElement.GetProperty("points");
    }

    /// <summary>
    /// Les champs d'un objet, atteints par un CHEMIN du contrat : <c>""</c>
    /// pour la racine, <c>a[]</c> pour le premier élément d'un tableau,
    /// <c>a.b</c> pour un objet imbriqué.
    ///
    /// <para>Rendre <c>null</c> quand le chemin ne mène nulle part est
    /// volontaire : un contrat qui décrit une forme que la réponse ne
    /// contient pas doit échouer en le disant, et non passer pour vide.</para>
    /// </summary>
    private static SortedSet<string>? ChampsA(JsonElement racine, string chemin)
    {
        var courant = racine;
        // La RACINE peut être une liste — `/platforms` en rend une. Le contrat
        // décrit alors l'élément, et les chemins imbriqués partent de lui.
        if (courant.ValueKind == JsonValueKind.Array)
        {
            if (courant.GetArrayLength() == 0) return null;
            courant = courant[0];
        }
        if (chemin.Length > 0)
        {
            foreach (var pas in chemin.Split('.'))
            {
                var nom = pas.EndsWith("[]", StringComparison.Ordinal) ? pas[..^2] : pas;
                if (nom.Length > 0)
                {
                    if (courant.ValueKind != JsonValueKind.Object
                        || !courant.TryGetProperty(nom, out var suivant)) return null;
                    courant = suivant;
                }
                if (pas.EndsWith("[]", StringComparison.Ordinal))
                {
                    if (courant.ValueKind != JsonValueKind.Array
                        || courant.GetArrayLength() == 0) return null;
                    courant = courant[0];
                }
            }
        }

        // La racine d'une liste : on décrit l'ÉLÉMENT, pas le tableau.
        if (courant.ValueKind == JsonValueKind.Array)
        {
            if (courant.GetArrayLength() == 0) return null;
            courant = courant[0];
        }
        if (courant.ValueKind != JsonValueKind.Object) return null;

        return [.. courant.EnumerateObject().Select(p => p.Name)];
    }

    private static void Confronter(string point, JsonElement reponse)
    {
        var attendu = Contrat().GetProperty(point);
        foreach (var chemin in attendu.EnumerateObject())
        {
            var declares = new SortedSet<string>(
                chemin.Value.GetProperty("lit").EnumerateArray().Select(v => v.GetString()!));
            foreach (var ignore in chemin.Value.GetProperty("ignore").EnumerateObject())
            {
                declares.Add(ignore.Name);
            }

            var rendus = ChampsA(reponse, chemin.Name);
            Assert.True(rendus is not null,
                $"{point} — le contrat décrit « {chemin.Name} », que la réponse ne contient pas.");

            var enTrop = rendus!.Except(declares).ToList();
            var manquants = declares.Except(rendus!).ToList();

            Assert.True(enTrop.Count == 0,
                $"{point} « {chemin.Name} » rend des champs que le contrat ignore : "
                + $"{string.Join(", ", enTrop)}. Le client les jetterait en silence — "
                + "inscrivez-les dans CONTRAT-API.json, lus ou ignorés avec leur raison.");
            Assert.True(manquants.Count == 0,
                $"{point} « {chemin.Name} » ne rend plus : {string.Join(", ", manquants)}. "
                + "Le client les lit, et recevrait `undefined`.");
        }
    }

    private static async Task<JsonElement> Lire(HttpClient c, string url)
        => await c.GetFromJsonAsync<JsonElement>(url);

    /// <summary>Un profil qui a TOUT : c'est la condition pour que le contrat
    /// décrive autre chose que des listes vides.</summary>
    private static async Task<(string user, string pf, string oeuvre)> ProfilComplet(HttpClient c)
    {
        var user = $"usr_contrat_{Guid.NewGuid():N}"[..24];
        var plateformes = await Lire(c, "/platforms");
        var pf = plateformes[0].GetProperty("id").GetString()!;
        var oeuvres = await Lire(c, $"/platforms/{pf}/works");
        var oeuvre = oeuvres[0].GetProperty("id").GetString()!;

        await c.PostAsJsonAsync("/declarations", new
        {
            batchId = $"bat_{user}",
            userId = user,
            platformId = pf,
            period = new { kind = "year", year = 1995 },
            entries = new object[]
            {
                new { workId = oeuvre, completion = "finished", provenance = "owned" },
                new { title = "Un titre absent du référentiel" },
            },
        });
        await c.PostAsJsonAsync("/memories", new
        {
            userId = user, targetKind = "work", targetId = oeuvre,
            text = "Une phrase.", title = "Un repère",
        });
        return (user, pf, oeuvre);
    }

    [Fact]
    public async Task Le_referentiel_rend_exactement_ce_que_le_contrat_declare()
    {
        using var usine = Usine();
        var client = usine.CreateClient();
        var plateformes = await Lire(client, "/platforms");
        Confronter("GET /platforms", plateformes);

        var pf = plateformes[0].GetProperty("id").GetString()!;
        Confronter("GET /platforms/{id}/works", await Lire(client, $"/platforms/{pf}/works"));
    }

    [Fact]
    public async Task Les_donnees_du_joueur_rendent_exactement_ce_que_le_contrat_declare()
    {
        using var usine = Usine();
        var client = usine.CreateClient();
        var (user, pf, _) = await ProfilComplet(client);

        Confronter("GET /selection/{user}/{platform}", await Lire(client, $"/selection/{user}/{pf}"));
        Confronter("GET /memories/{user}", await Lire(client, $"/memories/{user}"));
        Confronter("GET /unresolved/{user}", await Lire(client, $"/unresolved/{user}"));
    }

    [Fact]
    public async Task L_axe_rend_exactement_ce_que_le_contrat_declare()
    {
        // La timeline est la réponse la plus PROFONDE du produit : entrées,
        // intervalle, moments, avertissements. C'est aussi celle où deux
        // champs ont déjà été rendus sans être lus.
        using var usine = Usine();
        var client = usine.CreateClient();
        var user = "usr_contrat_axe";

        // Une incohérence VOLONTAIRE, pour que `warnings` ne soit pas vide :
        // un contrat vérifié sur un tableau vide ne vérifie rien.
        await using (var db = bdd.CreerContexte())
        {
            var magasin = new EventStore(db);
            await magasin.AppendAsync([
                new DigitalTwin.Domain.Player.PlayerEvent(
                    "ctr1", user, DigitalTwin.Domain.Player.PlayerEventType.CompletedGame,
                    new DigitalTwin.Domain.Player.EventTarget("work", "wrk_contrat"),
                    new DigitalTwin.Domain.Temporal.Year(1990),
                    new DateTime(2026, 1, 15, 12, 0, 0, DateTimeKind.Utc)),
                new DigitalTwin.Domain.Player.PlayerEvent(
                    "ctr2", user, DigitalTwin.Domain.Player.PlayerEventType.StartedGame,
                    new DigitalTwin.Domain.Player.EventTarget("work", "wrk_contrat"),
                    new DigitalTwin.Domain.Temporal.Year(1995),
                    new DateTime(2026, 1, 15, 12, 0, 0, DateTimeKind.Utc)),
            ]);
            await magasin.UpsertMemoryAsync(user, "work", "wrk_contrat", "Une phrase.", "Un repère");
        }

        var axe = await Lire(client, $"/timeline/{user}");
        Assert.NotEmpty(axe.GetProperty("warnings").EnumerateArray());
        Confronter("GET /timeline/{user}", axe);
    }

    [Fact]
    public async Task La_sante_rend_exactement_ce_que_le_contrat_declare()
    {
        using var usine = Usine();
        Confronter("GET /health", await Lire(usine.CreateClient(), "/health"));
    }

    [Fact]
    public async Task Les_ecritures_rendent_exactement_ce_que_le_contrat_declare()
    {
        using var usine = Usine();
        var client = usine.CreateClient();
        var (user, pf, oeuvre) = await ProfilComplet(client);

        var lot = await client.PostAsJsonAsync("/declarations", new
        {
            batchId = $"bat2_{user}",
            userId = user,
            platformId = pf,
            period = new { kind = "year", year = 1996 },
            entries = new object[] { new { title = "Un second titre absent" } },
        });
        Confronter("POST /declarations", await lot.Content.ReadFromJsonAsync<JsonElement>());

        var retrait = await client.PostAsJsonAsync("/declarations/retract", new
        {
            userId = user, platformId = pf, workId = oeuvre,
        });
        Confronter("POST /declarations/retract",
            await retrait.Content.ReadFromJsonAsync<JsonElement>());

        var note = await client.PostAsJsonAsync("/memories", new
        {
            userId = user, targetKind = "work", targetId = oeuvre, text = "Une autre.",
        });
        Confronter("POST /memories", await note.Content.ReadFromJsonAsync<JsonElement>());
    }

    [Fact]
    public void Le_contrat_couvre_tout_ce_que_le_client_appelle()
    {
        // Un contrat qui oublie un point d'entrée est un contrat vert sur ce
        // qu'il ne regarde pas — le défaut exact qu'il existe pour empêcher.
        // La liste vient du CLIENT, c'est-à-dire de l'appelant réel.
        var racine = new DirectoryInfo(AppContext.BaseDirectory);
        while (racine is not null && !File.Exists(Path.Combine(racine.FullName, "CONTRAT-API.json")))
        {
            racine = racine.Parent;
        }
        var source = File.ReadAllText(
            Path.Combine(racine!.FullName, "web", "src", "api", "client.ts"));

        var appeles = new[]
        {
            ("GET /platforms", "\"/platforms\""),
            ("GET /platforms/{id}/works", "/works`"),
            ("GET /selection/{user}/{platform}", "`/selection/"),
            ("GET /memories/{user}", "`/memories/"),
            ("GET /unresolved/{user}", "`/unresolved/"),
            ("GET /timeline/{user}", "`/timeline/"),
            ("GET /health", "/health`"),
            ("POST /declarations", "\"/declarations\""),
            ("POST /declarations/retract", "\"/declarations/retract\""),
            ("POST /memories", "\"/memories\""),
        };

        var contrat = Contrat();
        foreach (var (point, marque) in appeles)
        {
            Assert.True(source.Contains(marque, StringComparison.Ordinal),
                $"Le client n'appelle plus « {marque} » : la liste de ce test a vieilli.");
            Assert.True(contrat.TryGetProperty(point, out _),
                $"Le client appelle « {point} », que CONTRAT-API.json ne décrit pas.");
        }
    }
}
