using System.Text.Json;
using DigitalTwin.Domain.Reference;

namespace DigitalTwin.Domain.Tests.Reference;

public class DatasetLoaderTests
{
    /// <summary>
    /// Le dataset réel, remonté depuis le binaire de test. S'il est
    /// introuvable, on échoue en le disant — un test qui se contente de
    /// passer parce qu'il n'a rien trouvé est le pire des deux mondes.
    /// </summary>
    private static string LireDatasetReel()
    {
        var dossier = new DirectoryInfo(AppContext.BaseDirectory);
        while (dossier is not null)
        {
            var candidat = Path.Combine(dossier.FullName, "dataset", "poc.json");
            if (File.Exists(candidat)) return File.ReadAllText(candidat);
            dossier = dossier.Parent;
        }
        throw new FileNotFoundException(
            $"dataset/poc.json introuvable en remontant depuis {AppContext.BaseDirectory}");
    }

    // ---------------------------------------------------------------- réel

    [Fact]
    public void Le_dataset_reel_ne_viole_aucun_invariant()
    {
        var resultat = DatasetLoader.Load(LireDatasetReel());

        Assert.True(resultat.IsValid,
            "anomalies : " + string.Join(" | ", resultat.Violations.Select(v => v.Message)));
    }

    [Fact]
    public void Le_dataset_reel_a_la_taille_annoncee_par_son_README()
    {
        var resultat = DatasetLoader.Load(LireDatasetReel());

        Assert.Equal(8, resultat.Platforms.Count);
        Assert.Equal(222, resultat.Works.Count);
        Assert.Equal(663, resultat.Releases.Count);
    }

    [Fact]
    public void Les_identifiants_du_dataset_reel_sont_tous_distincts()
    {
        var resultat = DatasetLoader.Load(LireDatasetReel());

        var tous = resultat.Platforms.Select(p => p.CanonicalId)
            .Concat(resultat.Works.Select(w => w.CanonicalId))
            .Concat(resultat.Releases.Select(r => r.CanonicalId))
            .ToList();

        Assert.Equal(893, tous.Count);
        Assert.Equal(tous.Count, tous.Distinct(StringComparer.Ordinal).Count());
    }

    [Fact]
    public void Chaque_sortie_reelle_designe_une_plateforme_du_dataset()
    {
        var resultat = DatasetLoader.Load(LireDatasetReel());
        var connues = resultat.Platforms.Select(p => p.CanonicalId).ToHashSet(StringComparer.Ordinal);

        Assert.NotEmpty(resultat.Releases);
        Assert.All(resultat.Releases, r => Assert.Contains(r.PlatformId, connues));
    }

    // --------------------------------------------------- squelette corruptible

    /// <summary>
    /// Un dataset minimal mais <b>valide</b>, que chaque test corrompt d'une
    /// seule manière. Si la corruption seule provoque la violation, on sait
    /// ce qui l'a provoquée.
    /// </summary>
    private static string Squelette(
        string platformId = "plt_nes",
        string workId = "wrk_mario",
        string releaseId = "rel_mario_eu",
        string releasePlatform = "plt_nes",
        string precision = "day",
        string confidence = "high",
        string secondeOeuvre = "wrk_zelda")
        => $$"""
        {
          "dataset_version": "0.1.0",
          "license": "CC BY-SA 4.0",
          "sources": [],
          "platforms": [{"canonical_id": "{{platformId}}", "name": "NES"}],
          "works": [
            {"canonical_id": "{{workId}}", "title": "Super Mario Bros.", "notability": 1,
             "releases": [
               {"canonical_id": "{{releaseId}}", "platform": "{{releasePlatform}}",
                "region": "EU", "date": "1987-05-15",
                "precision": "{{precision}}", "confidence": "{{confidence}}"}]},
            {"canonical_id": "{{secondeOeuvre}}", "title": "Zelda", "notability": 2,
             "releases": []}
          ]
        }
        """;

    [Fact]
    public void Le_squelette_intact_est_valide()
    {
        // Sans cette garantie, tous les tests de corruption ci-dessous
        // pourraient passer pour une raison qui n'a rien à voir avec eux.
        Assert.Empty(DatasetLoader.Load(Squelette()).Violations);
    }

    // ------------------------------------------------------------ corruptions

    [Fact]
    public void Un_identifiant_reutilise_est_signale_en_nommant_l_identifiant()
    {
        var resultat = DatasetLoader.Load(Squelette(secondeOeuvre: "wrk_mario"));

        var violation = Assert.Single(resultat.Violations);
        Assert.Equal("unicite", violation.Rule);
        Assert.Equal("wrk_mario", violation.EntryId);
        Assert.Contains("wrk_mario", violation.Message, StringComparison.Ordinal);
    }

    [Theory]
    [InlineData("platform")]
    [InlineData("work")]
    [InlineData("release")]
    public void Un_prefixe_qui_ment_sur_le_type_est_signale(string type)
    {
        var json = type switch
        {
            "platform" => Squelette(platformId: "wrk_nes", releasePlatform: "wrk_nes"),
            "work" => Squelette(workId: "rel_mario"),
            _ => Squelette(releaseId: "plt_mario_eu"),
        };

        var violation = Assert.Single(
            DatasetLoader.Load(json).Violations.Where(v => v.Rule == "prefixe"));
        Assert.Contains(violation.EntryId, violation.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void Une_sortie_sur_une_plateforme_inconnue_est_signalee_par_son_identifiant()
    {
        var resultat = DatasetLoader.Load(Squelette(releasePlatform: "plt_fantome"));

        var violation = Assert.Single(resultat.Violations);
        Assert.Equal("plateforme", violation.Rule);
        Assert.Equal("rel_mario_eu", violation.EntryId);
        Assert.Contains("plt_fantome", violation.Message, StringComparison.Ordinal);
    }

    // ------------------------------------------------- précision vs confiance

    /// <summary>
    /// Les couples que le dataset réel porte effectivement. Le premier
    /// invariant que j'avais supposé — « precision correspond à confidence »
    /// — était faux : 48 sorties sont datées au mois avec une confiance
    /// moyenne, 204 au jour avec une confiance moyenne. Ce test <b>interdit
    /// de revenir</b> à la règle stricte.
    /// </summary>
    [Theory]
    [InlineData("day", "high")]
    [InlineData("day", "medium")]
    [InlineData("month", "medium")]
    [InlineData("year", "medium")]
    [InlineData("year", "low")]
    public void Une_precision_soutenue_par_sa_confiance_passe(string precision, string confidence)
    {
        Assert.Empty(DatasetLoader.Load(Squelette(precision: precision, confidence: confidence))
            .Violations);
    }

    [Theory]
    [InlineData("year", "high")]
    [InlineData("month", "high")]
    [InlineData("day", "low")]
    [InlineData("month", "low")]
    public void Une_precision_que_la_confiance_ne_soutient_pas_est_signalee(
        string precision, string confidence)
    {
        var resultat = DatasetLoader.Load(Squelette(precision: precision, confidence: confidence));

        var violation = Assert.Single(resultat.Violations);
        Assert.Equal("qualite", violation.Rule);
        Assert.Equal("rel_mario_eu", violation.EntryId);
        Assert.Contains(precision, violation.Message, StringComparison.Ordinal);
    }

    // ------------------------------------------------------------ posture

    [Fact]
    public void Un_dataset_fautif_reste_charge_avec_ses_donnees()
    {
        // Le chargeur rapporte, il ne refuse pas : un référentiel imparfait
        // reste exploitable, et l'incertitude est portée plutôt que fatale.
        var resultat = DatasetLoader.Load(Squelette(precision: "year", confidence: "high"));

        Assert.False(resultat.IsValid);
        Assert.Equal(2, resultat.Works.Count);
        Assert.Single(resultat.Releases);
        Assert.Equal("0.1.0", resultat.Version);
    }

    [Fact]
    public void Chaque_sortie_garde_le_lien_vers_son_oeuvre()
    {
        var resultat = DatasetLoader.Load(Squelette());

        var sortie = Assert.Single(resultat.Releases);
        Assert.Equal("wrk_mario", sortie.WorkId);
        Assert.Equal("EU", sortie.Region);
        Assert.Equal("1987-05-15", sortie.Date);
    }

    [Fact]
    public void Plusieurs_anomalies_sont_toutes_rapportees()
    {
        // Rendre la première et s'arrêter obligerait à recharger autant de
        // fois qu'il y a de fautes.
        var resultat = DatasetLoader.Load(
            Squelette(workId: "rel_mario", releasePlatform: "plt_fantome",
                      precision: "year", confidence: "high"));

        Assert.Equal(3, resultat.Violations.Count);
        Assert.Equal(
            new[] { "plateforme", "prefixe", "qualite" },
            resultat.Violations.Select(v => v.Rule).OrderBy(r => r, StringComparer.Ordinal));
    }
}
