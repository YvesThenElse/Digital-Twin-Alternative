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
        Assert.Equal(221, resultat.Works.Count);
        Assert.Equal(593, resultat.Releases.Count);
    }

    [Fact]
    public void Les_identifiants_du_dataset_reel_sont_tous_distincts()
    {
        var resultat = DatasetLoader.Load(LireDatasetReel());

        var tous = resultat.Platforms.Select(p => p.CanonicalId)
            .Concat(resultat.Works.Select(w => w.CanonicalId))
            .Concat(resultat.Releases.Select(r => r.CanonicalId))
            .ToList();

        Assert.Equal(822, tous.Count);
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
        string secondeOeuvre = "wrk_zelda",
        string? notabilite = null,
        string redirects = "{}",
        string statutRegional = "{}",
        string date = "1987-05-15",
        string anneeLancement = "1983")
    {
        // Par défaut, l'œuvre est classée sur la plateforme où elle sort.
        notabilite ??= $$"""{"{{releasePlatform}}": 1}""";
        return $$"""
        {
          "dataset_version": "0.1.0",
          "license": "CC BY-SA 4.0",
          "sources": [],
          "redirects": {{redirects}},
          "platforms": [
            {"canonical_id": "{{platformId}}", "name": "NES", "region_free": false,
             "launch_year": {{anneeLancement}}},
            {"canonical_id": "plt_switch", "name": "Switch", "region_free": true,
             "launch_year": 2017}],
          "works": [
            {"canonical_id": "{{workId}}", "title": "Super Mario Bros.",
             "notability": {{notabilite}},
             "region_status": {{statutRegional}},
             "releases": [
               {"canonical_id": "{{releaseId}}", "platform": "{{releasePlatform}}",
                "region": "EU", "date": "{{date}}",
                "precision": "{{precision}}", "confidence": "{{confidence}}"}]},
            {"canonical_id": "{{secondeOeuvre}}", "title": "Zelda",
             "notability": {},
             "releases": []}
          ]
        }
        """;
    }

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

        var violation = Assert.Single(
            resultat.Violations.Where(v => v.Rule == "plateforme"));
        Assert.Equal("rel_mario_eu", violation.EntryId);
        Assert.Contains("plt_fantome", violation.Message, StringComparison.Ordinal);
    }

    // ------------------------------------------------ notoriété par plateforme

    [Fact]
    public void La_notoriete_se_lit_par_plateforme()
    {
        var oeuvre = DatasetLoader.Load(Squelette()).Works
            .Single(w => w.CanonicalId == "wrk_mario");

        Assert.Equal(1, oeuvre.NotabilityOn("plt_nes"));
        // Un rang absent n'est pas le rang 0 : le confondre placerait en tête
        // ce qu'on n'a pas su classer.
        Assert.Null(oeuvre.NotabilityOn("plt_switch"));
    }

    [Fact]
    public void Une_oeuvre_non_classee_sur_une_plateforme_ou_elle_sort_est_signalee()
    {
        // Sans rang, E02 ne sait pas où la placer : elle disparaît de la
        // liste sans que rien ne le dise.
        var resultat = DatasetLoader.Load(Squelette(notabilite: "{}"));

        var violation = Assert.Single(
            resultat.Violations.Where(v => v.Rule == "notabilite"));
        Assert.Equal("wrk_mario", violation.EntryId);
        Assert.Contains("plt_nes", violation.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void Un_rang_sur_une_plateforme_ou_l_oeuvre_ne_sort_pas_est_signale()
    {
        var resultat = DatasetLoader.Load(
            Squelette(notabilite: """{"plt_nes": 1, "plt_switch": 4}"""));

        var violation = Assert.Single(
            resultat.Violations.Where(v => v.Rule == "notabilite"));
        Assert.Equal("wrk_mario", violation.EntryId);
        Assert.Contains("plt_switch", violation.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void Une_oeuvre_sans_aucune_sortie_n_a_pas_besoin_d_un_rang()
    {
        // wrk_zelda n'a aucune sortie et aucune notoriété : c'est cohérent.
        Assert.Empty(DatasetLoader.Load(Squelette()).Violations);
    }

    // ------------------------------------------------------------- zonage

    [Fact]
    public void Une_plateforme_sans_zonage_se_distingue_d_une_plateforme_zonee()
    {
        var resultat = DatasetLoader.Load(Squelette());

        Assert.False(resultat.Platforms.Single(p => p.CanonicalId == "plt_nes").RegionFree);
        Assert.True(resultat.Platforms.Single(p => p.CanonicalId == "plt_switch").RegionFree);
    }

    [Fact]
    public void Une_sortie_sans_region_n_est_une_lacune_que_sur_une_machine_zonee()
    {
        // Les deux sorties sont dépourvues de région. Sur la NES c'est une
        // lacune de curation ; sur la Switch c'est la bonne réponse.
        var resultat = DatasetLoader.Load(DeuxSortiesSansRegion());

        var lacune = Assert.Single(resultat.ReleasesMissingRegion);
        Assert.Equal("rel_zonee", lacune.CanonicalId);
    }

    private static string DeuxSortiesSansRegion() => """
        {
          "dataset_version": "0.1.0", "license": "x", "sources": [], "redirects": {},
          "platforms": [
            {"canonical_id": "plt_nes", "name": "NES", "region_free": false, "launch_year": 1983},
            {"canonical_id": "plt_switch", "name": "Switch", "region_free": true, "launch_year": 2017}],
          "works": [
            {"canonical_id": "wrk_a", "title": "A",
             "notability": {"plt_nes": 1, "plt_switch": 1},
             "releases": [
               {"canonical_id": "rel_zonee", "platform": "plt_nes", "region": null,
                "date": "1987", "precision": "year", "confidence": "low"},
               {"canonical_id": "rel_libre", "platform": "plt_switch", "region": null,
                "date": "2017", "precision": "year", "confidence": "low"}]}]
        }
        """;

    // ------------------------------------------------- disponibilité régionale

    [Fact]
    public void Une_region_avec_une_sortie_est_disponible()
    {
        var resultat = DatasetLoader.Load(Squelette());

        Assert.Equal(RegionAvailability.Released,
            resultat.AvailabilityIn("wrk_mario", "plt_nes", "EU"));
    }

    [Fact]
    public void Une_non_sortie_etablie_se_distingue_d_une_region_non_renseignee()
    {
        // C'est LE point : « jamais sorti en Europe » et « on ne sait pas »
        // cassent la reconnaissance en sens inverse. Les confondre retirerait
        // un jeu que le testeur a possédé, ou lui en proposerait un qu'il n'a
        // jamais pu voir.
        var resultat = DatasetLoader.Load(Squelette(
            statutRegional: """{"plt_nes": {"NTSC-J": "absent", "PAL": "inconnu"}}"""));

        Assert.Equal(RegionAvailability.NotReleased,
            resultat.AvailabilityIn("wrk_mario", "plt_nes", "NTSC-J"));
        Assert.Equal(RegionAvailability.Unknown,
            resultat.AvailabilityIn("wrk_mario", "plt_nes", "PAL"));
    }

    [Fact]
    public void Une_region_sans_statut_ni_sortie_est_inconnue_et_non_absente()
    {
        // Le défaut ne doit jamais être « absent » : le silence d'une source
        // n'est pas une preuve de non-sortie. L'infobox anglophone omet les
        // sorties japonaises de Crash Bandicoot et de Banjo-Kazooie.
        var resultat = DatasetLoader.Load(Squelette());

        Assert.Equal(RegionAvailability.Unknown,
            resultat.AvailabilityIn("wrk_mario", "plt_nes", "NTSC-J"));
    }

    [Fact]
    public void Un_statut_regional_contredisant_une_sortie_est_signale()
    {
        // « pas sorti en Europe » alors qu'une sortie européenne est listée.
        var resultat = DatasetLoader.Load(Squelette(
            statutRegional: """{"plt_nes": {"EU": "absent"}}"""));

        var violation = Assert.Single(
            resultat.Violations.Where(v => v.Rule == "region"));
        Assert.Equal("wrk_mario", violation.EntryId);
        Assert.Contains("EU", violation.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void Le_dataset_reel_etablit_vingt_deux_non_sorties()
    {
        var oeuvres = DatasetLoader.Load(LireDatasetReel()).Works;

        var absentes = oeuvres.Sum(w => w.RegionStatus
            .Sum(p => p.Value.Count(r => r.Value == RegionAvailability.NotReleased)));
        var inconnues = oeuvres.Sum(w => w.RegionStatus
            .Sum(p => p.Value.Count(r => r.Value == RegionAvailability.Unknown)));

        Assert.Equal(22, absentes);
        Assert.Equal(32, inconnues);
    }

    // -------------------------------------------------------- redirections

    [Fact]
    public void Une_redirection_vers_une_oeuvre_inconnue_est_signalee()
    {
        var resultat = DatasetLoader.Load(
            Squelette(redirects: """{"wrk_ancien": "wrk_disparu"}"""));

        var violation = Assert.Single(
            resultat.Violations.Where(v => v.Rule == "redirection"));
        Assert.Equal("wrk_ancien", violation.EntryId);
        Assert.Contains("wrk_disparu", violation.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void Un_identifiant_a_la_fois_vivant_et_redirige_est_signale()
    {
        // §10.2 : un identifiant retiré de la circulation ne revient pas.
        var resultat = DatasetLoader.Load(
            Squelette(redirects: """{"wrk_mario": "wrk_zelda"}"""));

        var violation = Assert.Single(
            resultat.Violations.Where(v => v.Rule == "redirection"));
        Assert.Equal("wrk_mario", violation.EntryId);
    }

    [Fact]
    public void Une_chaine_de_redirections_est_acceptee()
    {
        // Le cas de validation n°7 exige qu'une redirection en chaîne se
        // résolve. Elle doit donc pouvoir s'écrire : wrk_ancien pointe vers
        // wrk_intermediaire, qui n'est plus une œuvre vivante mais une étape.
        var resultat = DatasetLoader.Load(Squelette(redirects:
            """{"wrk_ancien": "wrk_intermediaire", "wrk_intermediaire": "wrk_zelda"}"""));

        Assert.Empty(resultat.Violations);
        Assert.Equal("wrk_intermediaire", resultat.Redirects["wrk_ancien"]);
        Assert.Equal("wrk_zelda", resultat.Redirects["wrk_intermediaire"]);
    }

    [Fact]
    public void Une_chaine_dont_le_bout_n_existe_pas_est_signalee()
    {
        // La chaîne est admise, pas l'impasse : sans ce contrôle, autoriser
        // les chaînes autoriserait n'importe quelle cible inconnue.
        var resultat = DatasetLoader.Load(Squelette(redirects:
            """{"wrk_ancien": "wrk_intermediaire", "wrk_intermediaire": "wrk_nulle_part"}"""));

        var violation = Assert.Single(
            resultat.Violations.Where(v => v.Rule == "redirection"));
        Assert.Equal("wrk_intermediaire", violation.EntryId);
        Assert.Contains("wrk_nulle_part", violation.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void Une_chaine_qui_boucle_est_signalee()
    {
        // Chaque cible existe, et pourtant rien ne se résout — et le code qui
        // suit la chaîne boucle indéfiniment.
        var resultat = DatasetLoader.Load(Squelette(redirects:
            """{"wrk_a": "wrk_b", "wrk_b": "wrk_a"}"""));

        var boucles = resultat.Violations.Where(v => v.Rule == "redirection").ToList();
        Assert.Equal(2, boucles.Count);
        Assert.All(boucles, v => Assert.Contains("boucle", v.Message, StringComparison.Ordinal));
    }

    [Fact]
    public void Une_redirection_valide_est_exposee_telle_quelle()
    {
        var resultat = DatasetLoader.Load(
            Squelette(redirects: """{"wrk_ancien": "wrk_zelda"}"""));

        Assert.Empty(resultat.Violations);
        Assert.Equal("wrk_zelda", resultat.Redirects["wrk_ancien"]);
    }

    // ---------------------------------------- une sortie ne précède pas sa machine

    [Fact]
    public void Une_sortie_anterieure_au_lancement_de_sa_machine_est_signalee()
    {
        // Bubble Bobble sur Game Boy portait la date Famicom du 30 octobre
        // 1987 ; la Game Boy est sortie en 1989. Une seule sortie sur 592, et
        // elle n'aurait jamais levé d'erreur.
        var resultat = DatasetLoader.Load(Squelette(date: "1980-05-15"));

        var violation = Assert.Single(resultat.Violations.Where(v => v.Rule == "anachronisme"));
        Assert.Equal("rel_mario_eu", violation.EntryId);
        Assert.Contains("1980", violation.Message, StringComparison.Ordinal);
        Assert.Contains("1983", violation.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void Une_sortie_l_annee_meme_du_lancement_est_acceptee()
    {
        // La borne est inclusive : un jeu de lancement sort l'année de la
        // machine, et c'est fréquent parmi les titres les mieux classés.
        Assert.Empty(DatasetLoader.Load(Squelette(date: "1983-07-15")).Violations);
    }

    [Fact]
    public void Une_plateforme_sans_annee_de_lancement_est_signalee()
    {
        // LE garde-fou. Sans année, le contrôle ci-dessus ne s'applique à
        // rien — et une vérification qui ne vérifie rien rend vert.
        var resultat = DatasetLoader.Load(Squelette(anneeLancement: "null"));

        var violation = Assert.Single(resultat.Violations.Where(v => v.Rule == "plateforme"));
        Assert.Equal("plt_nes", violation.EntryId);
        Assert.Contains("lancement", violation.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void Chaque_plateforme_reelle_porte_son_annee_de_lancement()
    {
        var plateformes = DatasetLoader.Load(LireDatasetReel()).Platforms;

        Assert.Equal(8, plateformes.Count);
        Assert.All(plateformes, p => Assert.NotNull(p.LaunchYear));
        Assert.Equal(1989, plateformes.Single(p => p.Name == "Game Boy").LaunchYear);
    }

    [Fact]
    public void Aucune_sortie_reelle_ne_precede_sa_machine()
    {
        var resultat = DatasetLoader.Load(LireDatasetReel());
        var lancement = resultat.Platforms.ToDictionary(p => p.CanonicalId, p => p.LaunchYear);

        var anachronismes = resultat.Releases
            .Where(r => int.Parse(r.Date[..4]) < lancement[r.PlatformId])
            .Select(r => $"{r.CanonicalId} ({r.Date})")
            .ToList();

        Assert.Empty(anachronismes);
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
