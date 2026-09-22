using System.Net;
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
/// Le souvenir minimal (§9).
///
/// <para>Une liste de jeux cochés ne ressemble à personne. Ce qui rend un
/// profil personnel, c'est « on l'a fini à deux avec mon frère pendant les
/// vacances de 1997 » — et c'est exactement ce que la porte de Phase 2
/// mesure. Cette fonctionnalité est peu coûteuse et directement alignée sur
/// le critère de sortie (§9.3).</para>
/// </summary>
[Collection("postgres")]
public class MemoryTests(PostgresFixture bdd)
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

    private static async Task<string> UneOeuvre(HttpClient c)
    {
        var plateformes = await c.GetFromJsonAsync<JsonElement>("/platforms");
        var id = plateformes[0].GetProperty("id").GetString()!;
        var oeuvres = await c.GetFromJsonAsync<JsonElement>($"/platforms/{id}/works");
        return oeuvres[0].GetProperty("id").GetString()!;
    }

    private static Task<HttpResponseMessage> Ecrire(
        HttpClient c, string user, string cibleKind, string cibleId, string texte,
        string? titre = null)
        => c.PostAsJsonAsync("/memories", new
        {
            userId = user,
            targetKind = cibleKind,
            targetId = cibleId,
            text = texte,
            title = titre,
        });

    private static async Task<JsonElement> Lire(HttpClient c, string user)
        => await c.GetFromJsonAsync<JsonElement>($"/memories/{user}");

    // ------------------------------------------------------------- écrire

    [Fact]
    public async Task Un_souvenir_s_attache_a_une_oeuvre_et_survit_au_rechargement()
    {
        using var usine = Usine();
        var client = usine.CreateClient();
        var oeuvre = await UneOeuvre(client);

        var reponse = await Ecrire(client, "usr_souvenir", "work", oeuvre,
            "On l'a fini à deux avec mon frère pendant les vacances de 1997.");
        Assert.Equal(HttpStatusCode.OK, reponse.StatusCode);

        // Relu par une AUTRE requête : la note vient de la base, pas d'un
        // état en mémoire.
        var souvenirs = await Lire(client, "usr_souvenir");
        Assert.Equal(1, souvenirs.GetArrayLength());
        Assert.Equal("On l'a fini à deux avec mon frère pendant les vacances de 1997.",
            souvenirs[0].GetProperty("text").GetString());
        Assert.Equal(oeuvre, souvenirs[0].GetProperty("targetId").GetString());
    }

    [Fact]
    public async Task Le_texte_est_conserve_tel_qu_il_a_ete_ecrit()
    {
        // Le contenu le plus précieux du produit, et le seul qui ne soit pas
        // généré : le normaliser, le tronquer ou le nettoyer lui retirerait
        // exactement ce qui le rend personnel.
        using var usine = Usine();
        var client = usine.CreateClient();
        var oeuvre = await UneOeuvre(client);
        var texte = "Noël 1994.\nMon père avait caché la console dans le garage… 🎁";

        await Ecrire(client, "usr_verbatim", "work", oeuvre, $"  {texte}  ");

        var souvenirs = await Lire(client, "usr_verbatim");
        // Seuls les bords sont rognés : les retours à la ligne, la
        // ponctuation et les emoji du milieu sont le souvenir.
        Assert.Equal(texte, souvenirs[0].GetProperty("text").GetString());
    }

    [Fact]
    public async Task Un_souvenir_peut_s_attacher_a_un_titre_libre()
    {
        // C'est là que vit le contenu le plus personnel : un jeu absent du
        // référentiel est souvent un jeu dont on se souvient précisément
        // parce qu'il est obscur.
        using var usine = Usine();
        var client = usine.CreateClient();

        var reponse = await Ecrire(client, "usr_libre", "unresolvedClaim", "ucl_ABC",
            "Le jeu de mon cousin, jamais retrouvé le nom.");

        Assert.Equal(HttpStatusCode.OK, reponse.StatusCode);
        Assert.Equal(1, (await Lire(client, "usr_libre")).GetArrayLength());
    }

    [Fact]
    public async Task Reviser_un_souvenir_le_remplace_au_lieu_d_en_empiler_un_second()
    {
        // §9.2 demande UNE note par cible. En empiler deux ferait un fil de
        // discussion avec soi-même, et l'écran ne saurait laquelle montrer.
        using var usine = Usine();
        var client = usine.CreateClient();
        var oeuvre = await UneOeuvre(client);

        await Ecrire(client, "usr_revise", "work", oeuvre, "Première version.");
        await Ecrire(client, "usr_revise", "work", oeuvre, "Finalement, c'était 1996.");

        var souvenirs = await Lire(client, "usr_revise");
        Assert.Equal(1, souvenirs.GetArrayLength());
        Assert.Equal("Finalement, c'était 1996.", souvenirs[0].GetProperty("text").GetString());
    }

    [Fact]
    public async Task Deux_oeuvres_portent_deux_souvenirs_distincts()
    {
        using var usine = Usine();
        var client = usine.CreateClient();
        var plateformes = await client.GetFromJsonAsync<JsonElement>("/platforms");
        var pf = plateformes[0].GetProperty("id").GetString()!;
        var oeuvres = await client.GetFromJsonAsync<JsonElement>($"/platforms/{pf}/works");

        await Ecrire(client, "usr_deux", "work", oeuvres[0].GetProperty("id").GetString()!, "A");
        await Ecrire(client, "usr_deux", "work", oeuvres[1].GetProperty("id").GetString()!, "B");

        Assert.Equal(2, (await Lire(client, "usr_deux")).GetArrayLength());
    }

    // -------------------------------------------------------------- refus

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("\n\t ")]
    public async Task Un_souvenir_vide_est_refuse(string texte)
    {
        // Rien à garder. Accepter produirait une note invisible qui occupe
        // une place à l'écran et fait croire à un souvenir.
        using var usine = Usine();
        var client = usine.CreateClient();
        var oeuvre = await UneOeuvre(client);

        var reponse = await Ecrire(client, $"usr_vide_{texte.Length}", "work", oeuvre, texte);

        Assert.Equal(HttpStatusCode.BadRequest, reponse.StatusCode);
        Assert.Contains("vide", await reponse.Content.ReadAsStringAsync(),
            StringComparison.Ordinal);
    }

    [Fact]
    public async Task Une_cible_d_un_genre_inconnu_est_refusee_en_le_nommant()
    {
        using var usine = Usine();
        var client = usine.CreateClient();

        var reponse = await Ecrire(client, "usr_genre", "planete", "plt_x", "Un texte");

        Assert.Equal(HttpStatusCode.BadRequest, reponse.StatusCode);
        Assert.Contains("planete", await reponse.Content.ReadAsStringAsync(),
            StringComparison.Ordinal);
    }

    [Fact]
    public async Task Un_souvenir_sur_une_oeuvre_inconnue_est_refuse_en_la_nommant()
    {
        // Sinon une faute de frappe du client produirait un souvenir orphelin,
        // que plus aucun écran ne montrerait — et le contenu le plus précieux
        // du produit disparaîtrait sans erreur.
        using var usine = Usine();
        var client = usine.CreateClient();

        var reponse = await Ecrire(client, "usr_orphelin", "work", "wrk_fantome", "Un texte");

        Assert.Equal(HttpStatusCode.BadRequest, reponse.StatusCode);
        Assert.Contains("wrk_fantome", await reponse.Content.ReadAsStringAsync(),
            StringComparison.Ordinal);
    }

    // ------------------------------------------------------------ facultatif

    [Fact]
    public async Task Declarer_sans_souvenir_reste_possible()
    {
        // §9 est un COMPLÉMENT, jamais un passage obligé : exiger une phrase
        // par jeu détruirait le budget d'un tap par ligne.
        using var usine = Usine();
        var client = usine.CreateClient();
        var plateformes = await client.GetFromJsonAsync<JsonElement>("/platforms");
        var pf = plateformes[0].GetProperty("id").GetString()!;
        var oeuvres = await client.GetFromJsonAsync<JsonElement>($"/platforms/{pf}/works");

        var reponse = await client.PostAsJsonAsync("/declarations", new
        {
            batchId = "bat_sans_note",
            userId = "usr_sans_note",
            platformId = pf,
            period = new { kind = "year", year = 1995 },
            entries = new[] { new { workId = oeuvres[0].GetProperty("id").GetString()! } },
        });

        Assert.Equal(HttpStatusCode.OK, reponse.StatusCode);
        Assert.Equal(0, (await Lire(client, "usr_sans_note")).GetArrayLength());
    }

    // ------------------------------------------------------------ le repère

    [Fact]
    public async Task Un_titre_court_accompagne_le_souvenir_et_se_relit()
    {
        // §9.2 : « optionnellement un titre court, servant de repère sur la
        // timeline ». Le texte complet ne peut pas tenir ce rôle — une phrase
        // de trois lignes sur un axe de trente ans n'est plus un repère, c'est
        // un mur.
        using var usine = Usine();
        var client = usine.CreateClient();
        var oeuvre = await UneOeuvre(client);

        await Ecrire(client, "usr_repere", "work", oeuvre,
            "On l'a fini à deux avec mon frère pendant les vacances.",
            "L'été 1997");

        var souvenirs = await Lire(client, "usr_repere");
        Assert.Equal("L'été 1997", souvenirs[0].GetProperty("title").GetString());
        // Le repère ne REMPLACE pas le texte : il l'annonce.
        Assert.Equal("On l'a fini à deux avec mon frère pendant les vacances.",
            souvenirs[0].GetProperty("text").GetString());
    }

    [Fact]
    public async Task Un_souvenir_sans_titre_reste_un_souvenir()
    {
        // « Optionnellement » : exiger un titre ajouterait un champ obligatoire
        // au seul contenu que personne ne réécrira s'il est perdu.
        using var usine = Usine();
        var client = usine.CreateClient();
        var oeuvre = await UneOeuvre(client);

        var reponse = await Ecrire(client, "usr_sans_repere", "work", oeuvre,
            "Une phrase, et rien d'autre.");

        Assert.Equal(HttpStatusCode.OK, reponse.StatusCode);
        var souvenirs = await Lire(client, "usr_sans_repere");
        // NUL, jamais une chaîne vide : un repère muet occuperait une place
        // sur l'axe sans rien dire — et une valeur par défaut est une
        // affirmation.
        Assert.Equal(JsonValueKind.Null, souvenirs[0].GetProperty("title").ValueKind);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("\n\t ")]
    public async Task Un_titre_blanc_vaut_absence_de_titre(string titre)
    {
        // Le champ vidé puis quitté ne doit pas écrire un repère invisible.
        using var usine = Usine();
        var client = usine.CreateClient();
        var oeuvre = await UneOeuvre(client);

        await Ecrire(client, $"usr_repere_blanc_{titre.Length}", "work", oeuvre,
            "Un texte", titre);

        var souvenirs = await Lire(client, $"usr_repere_blanc_{titre.Length}");
        Assert.Equal(JsonValueKind.Null, souvenirs[0].GetProperty("title").ValueKind);
    }

    [Fact]
    public async Task Un_titre_trop_long_est_refuse_en_disant_la_limite()
    {
        // Un repère est court par définition ; une page entière collée dans ce
        // champ rendrait l'axe illisible pour tous les autres moments. La règle
        // est ICI parce qu'elle porte sur la validité de la donnée : écrite
        // dans l'écran seul, elle n'existerait pas.
        using var usine = Usine();
        var client = usine.CreateClient();
        var oeuvre = await UneOeuvre(client);

        var reponse = await Ecrire(client, "usr_repere_long", "work", oeuvre,
            "Un texte", new string('a', 81));

        Assert.Equal(HttpStatusCode.BadRequest, reponse.StatusCode);
        // La limite est DITE : « trop long » sans chiffre oblige à deviner.
        Assert.Contains("80", await reponse.Content.ReadAsStringAsync(),
            StringComparison.Ordinal);
    }

    [Fact]
    public async Task Le_titre_de_la_limite_exacte_passe()
    {
        // Le garde doit refuser au-delà, pas à partir de. Sans ce témoin, une
        // borne décalée d'un caractère passerait inaperçue.
        using var usine = Usine();
        var client = usine.CreateClient();
        var oeuvre = await UneOeuvre(client);

        var reponse = await Ecrire(client, "usr_repere_limite", "work", oeuvre,
            "Un texte", new string('a', 80));

        Assert.Equal(HttpStatusCode.OK, reponse.StatusCode);
    }

    [Fact]
    public async Task Reviser_un_souvenir_ecrit_le_couple_entier()
    {
        // La requête porte le souvenir COMPLET, pas un correctif : retirer le
        // titre à l'écran doit le retirer en base. Conserver l'ancien ferait
        // réapparaître sur l'axe un repère que l'utilisateur vient d'effacer,
        // et aucun geste ne permettrait plus de s'en débarrasser.
        using var usine = Usine();
        var client = usine.CreateClient();
        var oeuvre = await UneOeuvre(client);

        await Ecrire(client, "usr_repere_revise", "work", oeuvre, "Texte", "Un repère");
        await Ecrire(client, "usr_repere_revise", "work", oeuvre, "Texte");

        var souvenirs = await Lire(client, "usr_repere_revise");
        Assert.Equal(1, souvenirs.GetArrayLength());
        Assert.Equal(JsonValueKind.Null, souvenirs[0].GetProperty("title").ValueKind);
    }

    // ------------------------------------------------------------- la purge

    [Fact]
    public async Task La_purge_efface_aussi_les_souvenirs()
    {
        // Quatrième table de USER DATA — et la plus sensible : un souvenir
        // est la donnée la plus personnelle du produit. L'oublier dans la
        // purge serait le manquement le plus grave au droit à l'effacement.
        using var usine = Usine();
        var client = usine.CreateClient();
        var oeuvre = await UneOeuvre(client);

        await Ecrire(client, "usr_purge_mem", "work", oeuvre, "À effacer");

        await using (var db = bdd.CreerContexte())
        {
            var efface = await new EventStore(db).PurgeUserAsync("usr_purge_mem");
            Assert.Equal(1, efface);
        }

        Assert.Equal(0, (await Lire(client, "usr_purge_mem")).GetArrayLength());
    }
}
