using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using DigitalTwin.Api.Health;
using DigitalTwin.Api.Persistence;
using DigitalTwin.Domain.Player;
using DigitalTwin.Domain.Temporal;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace DigitalTwin.Api.Tests;

/// <summary>
/// L'année de naissance, et les quatre granularités qu'elle débloque (§7.6).
///
/// <para><b>Sans elle, « vers mes 12 ans » n'est nulle part.</b> Le domaine
/// le traite comme <c>Unknown</c> : le moment reste déclaré, affiché, mais
/// hors de l'axe. C'est pourquoi E07 ne propose l'âge qu'une fois l'année
/// connue — et propose d'abord de la renseigner.</para>
/// </summary>
[Collection("postgres")]
public class AnneeDeNaissanceTests(PostgresFixture bdd)
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
            => Task.FromResult(DatabaseStatus.Reachable("sans objet"));
    }

    private static string Neuf(string quoi) => $"usr_{quoi}_{Guid.NewGuid():N}"[..24];

    private async Task Ecrire(params PlayerEvent[] journal)
    {
        await using var db = bdd.CreerContexte();
        await new EventStore(db).AppendAsync(journal);
    }

    private static PlayerEvent Ev(string id, string user, TemporalValue quand)
        => new(id, user, PlayerEventType.StartedGame, new EventTarget("work", "wrk_a"),
               quand, new DateTime(2026, 1, 15, 12, 0, 0, DateTimeKind.Utc));

    [Fact]
    public async Task Un_profil_neuf_n_en_a_pas_et_c_est_l_etat_normal()
    {
        using var usine = Usine();
        var vue = await usine.CreateClient()
            .GetFromJsonAsync<JsonElement>($"/profile/{Neuf("neuf")}");

        Assert.Equal(JsonValueKind.Null, vue.GetProperty("birthYear").ValueKind);
    }

    [Fact]
    public async Task Elle_s_ecrit_et_se_relit()
    {
        using var usine = Usine();
        var client = usine.CreateClient();
        var user = Neuf("naiss");

        var ecriture = await client.PostAsJsonAsync(
            $"/profile/{user}/birth-year", new { birthYear = 1982 });
        ecriture.EnsureSuccessStatusCode();

        var vue = await client.GetFromJsonAsync<JsonElement>($"/profile/{user}");
        Assert.Equal(1982, vue.GetProperty("birthYear").GetInt32());
    }

    [Fact]
    public async Task Elle_se_corrige_et_REPLACE_les_moments_dates_par_un_age()
    {
        // MODELE §3, règle 3 : l'âge est stocké BRUT, jamais converti à
        // l'écriture. C'est ce qui permet à une correction de l'année de
        // naissance de replacer tous les moments concernés — sans réécrire
        // un seul événement, ce que le journal en ajout seul interdirait.
        using var usine = Usine();
        var client = usine.CreateClient();
        var user = Neuf("replace");
        await Ecrire(Ev("evt_age", user, new Age(12)));

        await client.PostAsJsonAsync($"/profile/{user}/birth-year", new { birthYear = 1980 });
        var premier = await client.GetFromJsonAsync<JsonElement>($"/timeline/{user}");
        var avant = premier.GetProperty("entries")[0].GetProperty("interval")
            .GetProperty("start").GetString();

        await client.PostAsJsonAsync($"/profile/{user}/birth-year", new { birthYear = 1990 });
        var second = await client.GetFromJsonAsync<JsonElement>($"/timeline/{user}");
        var apres = second.GetProperty("entries")[0].GetProperty("interval")
            .GetProperty("start").GetString();

        Assert.StartsWith("1992", avant, StringComparison.Ordinal);
        Assert.StartsWith("2002", apres, StringComparison.Ordinal);
    }

    [Fact]
    public async Task Sans_elle_un_age_reste_hors_de_l_axe()
    {
        // §7.6 : « sans année de naissance, il se comporte comme `Unknown` ».
        // Le moment reste DÉCLARÉ et affiché — dans le tiroir —, il n'est
        // simplement pas projeté à une position qu'on ne connaît pas.
        using var usine = Usine();
        var client = usine.CreateClient();
        var user = Neuf("sansnaiss");
        await Ecrire(Ev("evt_sans", user, new Age(12)));

        var axe = await client.GetFromJsonAsync<JsonElement>($"/timeline/{user}");

        Assert.Empty(axe.GetProperty("entries").EnumerateArray());
        Assert.Single(axe.GetProperty("undated").EnumerateArray());

        // Le témoin (78) : l'année donnée, le MÊME moment rejoint l'axe.
        await client.PostAsJsonAsync($"/profile/{user}/birth-year", new { birthYear = 1980 });
        var situe = await client.GetFromJsonAsync<JsonElement>($"/timeline/{user}");
        Assert.Single(situe.GetProperty("entries").EnumerateArray());
        Assert.Empty(situe.GetProperty("undated").EnumerateArray());
    }

    [Theory]
    [InlineData(1800)]
    [InlineData(3000)]
    public async Task Une_annee_invraisemblable_est_refusee_en_la_nommant(int annee)
    {
        using var usine = Usine();

        var reponse = await usine.CreateClient().PostAsJsonAsync(
            $"/profile/{Neuf("invr")}/birth-year", new { birthYear = annee });

        Assert.Equal(HttpStatusCode.BadRequest, reponse.StatusCode);
        Assert.Contains(annee.ToString(), await reponse.Content.ReadAsStringAsync(),
            StringComparison.Ordinal);
    }

    [Fact]
    public async Task Elle_s_efface_avec_le_profil()
    {
        // §10.1 : elle porte `user_id`, donc elle entre dans la purge. Une
        // donnée « jamais publiée » n'est pas une donnée qu'on garde.
        using var usine = Usine();
        var client = usine.CreateClient();
        var user = Neuf("purge");
        await client.PostAsJsonAsync($"/profile/{user}/birth-year", new { birthYear = 1982 });

        await using (var db = bdd.CreerContexte())
        {
            await new EventStore(db).PurgeUserAsync(user);
        }

        var vue = await client.GetFromJsonAsync<JsonElement>($"/profile/{user}");
        Assert.Equal(JsonValueKind.Null, vue.GetProperty("birthYear").ValueKind);
    }

    // ---------------------------------------- les quatre granularités rendues

    [Theory]
    [InlineData("month", "Month")]
    [InlineData("date", "ExactDate")]
    [InlineData("approximate", "ApproximateYear")]
    [InlineData("age", "Age")]
    public async Task Le_repli_de_precision_atteint_les_quatre_variantes(
        string genre, string attendu)
    {
        // Elles étaient construites, testées, rendues par l'axe — et AUCUN
        // écran ne les envoyait. C'est le défaut que l'audit a trouvé
        // partout : une capacité verte que personne ne cherche.
        using var usine = Usine();
        var client = usine.CreateClient();
        var user = Neuf($"gr{genre}");
        await client.PostAsJsonAsync($"/profile/{user}/birth-year", new { birthYear = 1980 });
        await Ecrire(Ev($"evt_{genre}", user, new Year(1995)));

        object periode = genre switch
        {
            "month" => new { kind = genre, year = 1998, month = 11 },
            "date" => new { kind = genre, date = "1998-11-08" },
            "approximate" => new { kind = genre, year = 1998, margin = 2 },
            _ => new { kind = genre, age = 12 },
        };
        var reponse = await client.PostAsJsonAsync(
            $"/moments/evt_{genre}/date", new { userId = user, period = periode });
        reponse.EnsureSuccessStatusCode();

        var axe = await client.GetFromJsonAsync<JsonElement>($"/timeline/{user}");
        var moment = axe.GetProperty("entries")[0].GetProperty("moments")[0];
        Assert.Equal(attendu, moment.GetProperty("occurredAt").GetProperty("kind").GetString());
    }

    [Fact]
    public async Task Une_periode_ouverte_se_pose_et_se_lit()
    {
        // « Depuis 1994 » : l'API l'accepte, l'axe la rend, et aucun écran ne
        // la posait. La refermer sur son début inventerait une fin que
        // personne n'a déclarée.
        using var usine = Usine();
        var client = usine.CreateClient();
        var user = Neuf("ouverte");
        await Ecrire(Ev("evt_ouv", user, new Year(1995)));

        await client.PostAsJsonAsync("/moments/evt_ouv/date", new
        {
            userId = user,
            period = new { kind = "range", from = 1994, to = (int?)null },
        });

        var axe = await client.GetFromJsonAsync<JsonElement>($"/timeline/{user}");
        var quand = axe.GetProperty("entries")[0].GetProperty("moments")[0]
            .GetProperty("occurredAt");
        Assert.Equal("YearRange", quand.GetProperty("kind").GetString());
        Assert.Equal(JsonValueKind.Null, quand.GetProperty("endYear").ValueKind);
    }

    [Fact]
    public async Task Une_date_illisible_est_refusee_plutot_que_repliee()
    {
        // La replier sur son année ferait dire au joueur autre chose que ce
        // qu'il a saisi, sans trace.
        using var usine = Usine();
        var client = usine.CreateClient();
        var user = Neuf("illisible");
        await Ecrire(Ev("evt_ill", user, new Year(1995)));

        var reponse = await client.PostAsJsonAsync("/moments/evt_ill/date", new
        {
            userId = user,
            period = new { kind = "date", date = "8 novembre 1998" },
        });

        Assert.Equal(HttpStatusCode.BadRequest, reponse.StatusCode);
    }
}
