using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using DigitalTwin.Api.Health;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace DigitalTwin.Api.Tests;

/// <summary>
/// Le point de santé, et la seule chose qu'on lui demande : <b>ne pas mentir
/// quand la base est tombée</b>.
///
/// <para>Un point de santé qui répond « ok » parce que le processus est
/// vivant ne sert à rien : c'est précisément le cas où l'on a besoin de lui.
/// Ces tests vérifient donc surtout le cas dégradé.</para>
/// </summary>
public class HealthTests
{
    /// <summary>Une sonde dont on décide de la réponse.</summary>
    private sealed class SondeFeinte(DatabaseStatus reponse) : IDatabaseProbe
    {
        public Task<DatabaseStatus> CheckAsync(CancellationToken ct = default)
            => Task.FromResult(reponse);
    }

    private static WebApplicationFactory<Program> Avec(DatabaseStatus reponse)
        => new WebApplicationFactory<Program>().WithWebHostBuilder(b =>
            b.ConfigureServices(s =>
            {
                s.RemoveAll<IDatabaseProbe>();
                s.AddSingleton<IDatabaseProbe>(new SondeFeinte(reponse));
            }));

    [Fact]
    public async Task Quand_la_base_repond_le_point_de_sante_est_vert()
    {
        using var usine = Avec(DatabaseStatus.Reachable("PostgreSQL 17.2"));
        var reponse = await usine.CreateClient().GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, reponse.StatusCode);
        var corps = await reponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("ok", corps.GetProperty("status").GetString());
        Assert.Equal("ok", corps.GetProperty("database").GetProperty("status").GetString());
    }

    [Fact]
    public async Task Quand_la_base_ne_repond_pas_le_point_de_sante_n_est_pas_vert()
    {
        // LE test de cet item. 503 et non 200 : un orchestrateur qui lit le
        // code de statut doit retirer l'instance du service, pas la garder
        // parce que le corps JSON contenait un détail qu'il ne lit pas.
        using var usine = Avec(DatabaseStatus.Unreachable("connexion refusée"));
        var reponse = await usine.CreateClient().GetAsync("/health");

        Assert.Equal(HttpStatusCode.ServiceUnavailable, reponse.StatusCode);
    }

    [Fact]
    public async Task Le_point_de_sante_nomme_ce_qui_est_tombe()
    {
        // « dégradé » sans dire quoi oblige à aller lire les journaux.
        using var usine = Avec(DatabaseStatus.Unreachable("connexion refusée"));
        var reponse = await usine.CreateClient().GetAsync("/health");

        var corps = await reponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("degraded", corps.GetProperty("status").GetString());
        var base_ = corps.GetProperty("database");
        Assert.Equal("unreachable", base_.GetProperty("status").GetString());
        Assert.Contains("connexion refusée", base_.GetProperty("detail").GetString()!,
            StringComparison.Ordinal);
    }

    [Fact]
    public async Task Le_detail_de_la_base_est_rendu_meme_quand_tout_va_bien()
    {
        // Pouvoir lire la version en production évite la question « contre
        // quelle base tourne-t-on, au juste ».
        using var usine = Avec(DatabaseStatus.Reachable("PostgreSQL 17.2"));
        var corps = await usine.CreateClient().GetFromJsonAsync<JsonElement>("/health");

        Assert.Contains("17.2",
            corps.GetProperty("database").GetProperty("detail").GetString()!,
            StringComparison.Ordinal);
    }

    [Fact]
    public async Task Une_sonde_qui_leve_une_exception_degrade_au_lieu_de_faire_tomber_l_API()
    {
        // Npgsql lève plutôt qu'il ne rend « injoignable ». Si le point de
        // santé propage l'exception, il rend 500 — indistinguable d'un bug de
        // l'API, alors que la cause est connue.
        using var usine = new WebApplicationFactory<Program>().WithWebHostBuilder(b =>
            b.ConfigureServices(s =>
            {
                s.RemoveAll<IDatabaseProbe>();
                s.AddSingleton<IDatabaseProbe>(new SondeQuiLeve());
            }));

        var reponse = await usine.CreateClient().GetAsync("/health");

        Assert.Equal(HttpStatusCode.ServiceUnavailable, reponse.StatusCode);
        var corps = await reponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Contains("hôte introuvable",
            corps.GetProperty("database").GetProperty("detail").GetString()!,
            StringComparison.Ordinal);
    }

    private sealed class SondeQuiLeve : IDatabaseProbe
    {
        public Task<DatabaseStatus> CheckAsync(CancellationToken ct = default)
            => throw new InvalidOperationException("hôte introuvable");
    }
}
