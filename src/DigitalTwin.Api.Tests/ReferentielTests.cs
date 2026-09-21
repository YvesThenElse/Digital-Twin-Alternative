using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using DigitalTwin.Api.Health;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace DigitalTwin.Api.Tests;

/// <summary>
/// Le référentiel, chargé une fois au démarrage.
///
/// <para>Deux exigences, et la seconde compte autant que la première : servir
/// les œuvres dans le bon ordre, et <b>refuser de démarrer</b> sur un dataset
/// fautif. Une API qui démarre avec un référentiel vide sert des listes vides
/// sans erreur — le testeur conclut que le jeu n'existe pas.</para>
/// </summary>
public class ReferentielTests
{
    /// <summary>La base n'a rien à voir ici : on la neutralise.</summary>
    private sealed class SondeVerte : IDatabaseProbe
    {
        public Task<DatabaseStatus> CheckAsync(CancellationToken ct = default)
            => Task.FromResult(DatabaseStatus.Reachable("sans objet"));
    }

    private static WebApplicationFactory<Program> Usine(string? cheminDataset = null)
        => new WebApplicationFactory<Program>().WithWebHostBuilder(b =>
        {
            if (cheminDataset is not null)
            {
                b.ConfigureAppConfiguration((_, c) => c.AddInMemoryCollection(
                    new Dictionary<string, string?> { ["Dataset:Path"] = cheminDataset }));
            }
            b.ConfigureServices(s =>
            {
                s.RemoveAll<IDatabaseProbe>();
                s.AddSingleton<IDatabaseProbe>(new SondeVerte());
            });
        });

    private static async Task<JsonElement> Lire(HttpClient client, string url)
        => await client.GetFromJsonAsync<JsonElement>(url);

    private static async Task<string> IdPlateforme(HttpClient client, string nom)
    {
        var plateformes = await Lire(client, "/platforms");
        return plateformes.EnumerateArray()
            .Single(p => p.GetProperty("name").GetString() == nom)
            .GetProperty("id").GetString()!;
    }

    // ------------------------------------------------------------ démarrage

    [Fact]
    public async Task Le_dataset_reel_permet_de_demarrer()
    {
        using var usine = Usine();
        var reponse = await usine.CreateClient().GetAsync("/platforms");

        Assert.Equal(HttpStatusCode.OK, reponse.StatusCode);
    }

    [Fact]
    public void Un_dataset_fautif_empeche_le_demarrage_en_nommant_l_entree()
    {
        // Le cœur de l'item. Servir un référentiel dont on sait qu'il est
        // faux est pire que ne pas démarrer : la faute devient invisible et
        // se propage dans les déclarations des testeurs.
        var chemin = Path.Combine(Path.GetTempPath(), $"poc-fautif-{Guid.NewGuid():N}.json");
        File.WriteAllText(chemin, DatasetFautif);
        try
        {
            using var usine = Usine(chemin);
            var erreur = Assert.ThrowsAny<Exception>(() => usine.CreateClient());

            var message = Aplatir(erreur);
            Assert.Contains("wrk_doublon", message, StringComparison.Ordinal);
        }
        finally { File.Delete(chemin); }
    }

    [Fact]
    public void Un_dataset_introuvable_empeche_le_demarrage_en_disant_ou_il_a_cherche()
    {
        // Un fichier absent produirait un catalogue vide, donc des listes
        // vides sans la moindre erreur. C'est le motif récurrent de ce dépôt :
        // une donnée manquante se lit comme un fait.
        var absent = Path.Combine(Path.GetTempPath(), $"nulle-part-{Guid.NewGuid():N}.json");

        using var usine = Usine(absent);
        var erreur = Assert.ThrowsAny<Exception>(() => usine.CreateClient());

        var message = Aplatir(erreur);
        Assert.Contains(absent, message, StringComparison.Ordinal);
        // Le chemin seul ne suffit pas : une FileNotFoundException le contient
        // déjà. Ce qu'on exige, c'est que le message dise POURQUOI l'API
        // s'arrête — sinon on croit à un incident d'accès au fichier.
        Assert.Contains("ne démarre pas", message, StringComparison.Ordinal);
    }

    private static string Aplatir(Exception e)
    {
        var texte = e.Message;
        for (var inner = e.InnerException; inner is not null; inner = inner.InnerException)
        {
            texte += " | " + inner.Message;
        }
        return texte;
    }

    // ----------------------------------------------------------- plateformes

    [Fact]
    public async Task Les_huit_plateformes_sont_exposees()
    {
        using var usine = Usine();
        var plateformes = await Lire(usine.CreateClient(), "/platforms");

        Assert.Equal(8, plateformes.GetArrayLength());
        Assert.All(plateformes.EnumerateArray(), p =>
            Assert.StartsWith("plt_", p.GetProperty("id").GetString()!, StringComparison.Ordinal));
    }

    [Fact]
    public async Task Les_plateformes_reviennent_dans_l_ordre_chronologique()
    {
        // L'ordre du dataset ne l'est pas : la Super Nintendo (1990) y précède
        // la Game Boy (1989). Un joueur qui remonte le temps attend ses
        // machines dans l'ordre où il les a connues.
        using var usine = Usine();
        var plateformes = await Lire(usine.CreateClient(), "/platforms");

        var noms = plateformes.EnumerateArray()
            .Select(p => p.GetProperty("name").GetString()).ToList();
        var annees = plateformes.EnumerateArray()
            .Select(p => p.GetProperty("launchYear").GetInt32()).ToList();

        Assert.Equal(annees.Order(), annees);
        Assert.Equal(
            [
                "Nintendo Entertainment System", "Game Boy",
                "Super Nintendo Entertainment System", "PlayStation",
                "Nintendo 64", "PlayStation 2", "Game Boy Advance",
                "Nintendo Switch",
            ],
            noms);
    }

    [Fact]
    public async Task Chaque_plateforme_expose_son_annee_de_lancement()
    {
        // L'écran de période s'en sert pour borner son curseur : proposer
        // 1985 sur une Nintendo 64 ferait perdre du temps à tout le monde.
        using var usine = Usine();
        var plateformes = await Lire(usine.CreateClient(), "/platforms");

        Assert.All(plateformes.EnumerateArray(), p =>
            Assert.True(p.GetProperty("launchYear").GetInt32() > 1970));
        Assert.Equal(1989, plateformes.EnumerateArray()
            .Single(p => p.GetProperty("name").GetString() == "Game Boy")
            .GetProperty("launchYear").GetInt32());
    }

    [Fact]
    public async Task Une_plateforme_sans_zonage_se_declare_comme_telle()
    {
        // L'écran doit pouvoir dire « mondiale » plutôt que « région
        // inconnue » sur Switch. Sans cet indicateur, il ne le peut pas.
        using var usine = Usine();
        var plateformes = await Lire(usine.CreateClient(), "/platforms");

        var libres = plateformes.EnumerateArray()
            .Where(p => p.GetProperty("regionFree").GetBoolean())
            .Select(p => p.GetProperty("name").GetString())
            .ToList();

        Assert.Equal(["Nintendo Switch"], libres);
    }

    [Fact]
    public async Task Une_plateforme_inconnue_rend_404_en_la_nommant()
    {
        using var usine = Usine();
        var reponse = await usine.CreateClient().GetAsync("/platforms/plt_fantome/works");

        Assert.Equal(HttpStatusCode.NotFound, reponse.StatusCode);
        Assert.Contains("plt_fantome", await reponse.Content.ReadAsStringAsync(),
            StringComparison.Ordinal);
    }

    // --------------------------------------------------------------- œuvres

    [Fact]
    public async Task Les_oeuvres_reviennent_ordonnees_par_le_rang_de_cette_plateforme()
    {
        using var usine = Usine();
        var client = usine.CreateClient();
        var snes = await IdPlateforme(client, "Super Nintendo Entertainment System");

        var oeuvres = await Lire(client, $"/platforms/{snes}/works");
        var rangs = oeuvres.EnumerateArray()
            .Select(w => w.GetProperty("notability").GetInt32()).ToList();

        Assert.Equal(35, rangs.Count);
        Assert.Equal(rangs.Order(), rangs);
        Assert.Equal(1, rangs[0]);
        Assert.Equal("Super Mario World",
            oeuvres[0].GetProperty("title").GetString());
    }

    [Fact]
    public async Task Bubble_Bobble_figure_sur_les_deux_plateformes_avec_deux_rangs()
    {
        // Une seule œuvre, deux machines, deux rangs. C'est ce que la carte
        // `notability` existe pour permettre, et l'ancien entier unique
        // forçait soit un rang faux, soit deux œuvres pour un même identifiant
        // externe.
        using var usine = Usine();
        var client = usine.CreateClient();

        var surGb = await Trouver(client, "Game Boy", "Bubble Bobble");
        var surNes = await Trouver(client, "Nintendo Entertainment System", "Bubble Bobble");

        Assert.Equal(19, surGb.GetProperty("notability").GetInt32());
        Assert.Equal(22, surNes.GetProperty("notability").GetInt32());
        Assert.Equal(surGb.GetProperty("id").GetString(), surNes.GetProperty("id").GetString());
    }

    [Fact]
    public async Task Les_sorties_rendues_sont_celles_de_la_plateforme_demandee()
    {
        // Sans ce filtrage, la fiche Game Boy de Bubble Bobble afficherait la
        // date NES — une date juste, au mauvais endroit.
        using var usine = Usine();
        var client = usine.CreateClient();

        var surGb = await Trouver(client, "Game Boy", "Bubble Bobble");
        var surNes = await Trouver(client, "Nintendo Entertainment System", "Bubble Bobble");

        // La Game Boy a désormais SA propre sortie japonaise (décembre 1990)
        // et sa sortie américaine, et non plus la date de la fiche NES.
        Assert.Equal(["NTSC-J", "NTSC-U"], Regions(surGb));
        Assert.Equal(["NTSC-J", "NTSC-U", "PAL"], Regions(surNes));
    }

    [Fact]
    public async Task Une_region_peut_porter_plusieurs_dates_et_l_API_les_rend_toutes()
    {
        // Wikidata qualifie ses dates par PAYS, pas par région : le Royaume-Uni
        // et l'Allemagne donnent deux dates PAL pour une même sortie. 29
        // couples (œuvre, plateforme, région) sont dans ce cas.
        //
        // L'API les rend telles quelles plutôt que d'en choisir une : c'est à
        // l'écran de décider ce qu'il affiche, et une sélection faite ici
        // serait invisible et irréversible.
        using var usine = Usine();
        var client = usine.CreateClient();

        var bubble = await Trouver(client, "Nintendo Entertainment System", "Bubble Bobble");
        var pal = bubble.GetProperty("releases").EnumerateArray()
            .Where(r => r.GetProperty("region").GetString() == "PAL")
            .Select(r => r.GetProperty("date").GetString())
            .ToList();

        Assert.Equal(["1990-01-01", "1990-10-26"], pal);
    }

    [Fact]
    public async Task Une_non_sortie_etablie_se_distingue_d_une_region_inconnue()
    {
        // Les trois états doivent traverser l'API : l'écran ne peut pas les
        // afficher différemment s'ils lui arrivent identiques.
        using var usine = Usine();
        var client = usine.CreateClient();

        var chrono = await Trouver(client, "Super Nintendo Entertainment System",
            "Chrono Trigger");
        var bubble = await Trouver(client, "Game Boy", "Bubble Bobble");

        Assert.Equal("notReleased",
            chrono.GetProperty("regionStatus").GetProperty("PAL").GetString());
        Assert.Equal("unknown",
            bubble.GetProperty("regionStatus").GetProperty("PAL").GetString());
    }

    [Fact]
    public async Task Le_referentiel_n_est_lu_qu_une_fois()
    {
        // Relire le fichier à chaque requête coûterait 600 ko par appel et,
        // pire, permettrait à un dataset modifié à chaud d'entrer sans
        // repasser par la vérification de démarrage.
        using var usine = Usine();
        var client = usine.CreateClient();

        var a = await Lire(client, "/platforms");
        var b = await Lire(client, "/platforms");

        Assert.Equal(a.ToString(), b.ToString());
        Assert.Same(
            usine.Services.GetRequiredService<Reference.ReferenceCatalogSource>(),
            usine.Services.GetRequiredService<Reference.ReferenceCatalogSource>());
    }

    /// <summary>Les régions distinctes — une région peut porter plusieurs dates.</summary>
    private static List<string> Regions(JsonElement oeuvre)
        => [.. oeuvre.GetProperty("releases").EnumerateArray()
            .Select(r => r.GetProperty("region").GetString()!)
            .Where(r => r is not null)
            .Distinct(StringComparer.Ordinal)
            .Order()];

    private static async Task<JsonElement> Trouver(HttpClient client, string plateforme, string titre)
    {
        var id = await IdPlateforme(client, plateforme);
        var oeuvres = await Lire(client, $"/platforms/{id}/works");
        return oeuvres.EnumerateArray()
            .Single(w => w.GetProperty("title").GetString() == titre);
    }

    /// <summary>
    /// Deux œuvres partageant un identifiant : une violation d'unicité, que
    /// <c>DatasetLoader</c> nomme.
    /// </summary>
    private const string DatasetFautif = """
        {
          "dataset_version": "0.0.0",
          "license": "essai",
          "sources": [],
          "redirects": {},
          "platforms": [{"canonical_id": "plt_nes", "name": "NES", "region_free": false}],
          "works": [
            {"canonical_id": "wrk_doublon", "title": "A", "notability": {"plt_nes": 1},
             "region_status": {},
             "releases": [{"canonical_id": "rel_a", "platform": "plt_nes", "region": "PAL",
                           "date": "1987-05-15", "precision": "day", "confidence": "high"}]},
            {"canonical_id": "wrk_doublon", "title": "B", "notability": {"plt_nes": 2},
             "region_status": {},
             "releases": [{"canonical_id": "rel_b", "platform": "plt_nes", "region": "PAL",
                           "date": "1988-05-15", "precision": "day", "confidence": "high"}]}
          ]
        }
        """;
}
