using System.Text.Json;

namespace DigitalTwin.Domain.Reference;

/// <summary>Une anomalie du dataset, <b>nommant l'entrée fautive</b>.</summary>
/// <param name="EntryId">
/// L'identifiant en cause. « Le dataset est invalide » ne sert à personne sur
/// 893 entrées ; c'est la leçon que ce dépôt a payée plusieurs fois.
/// </param>
public sealed record DatasetViolation(string Rule, string EntryId, string Message);

/// <summary>Le dataset chargé, et ce qu'on a trouvé à lui reprocher.</summary>
public sealed record DatasetLoadResult(
    string Version,
    IReadOnlyList<Platform> Platforms,
    IReadOnlyList<Work> Works,
    IReadOnlyList<DatasetRelease> Releases,
    IReadOnlyDictionary<string, string> Redirects,
    IReadOnlyList<DatasetViolation> Violations)
{
    public bool IsValid => Violations.Count == 0;

    /// <summary>
    /// Les sorties sans région <b>sur une machine zonée</b> — la dette de
    /// curation réelle.
    ///
    /// <para>Sur une machine sans zonage, l'absence de région signifie
    /// « mondiale » et ne se cure pas. Les compter ensemble gonflait la dette
    /// d'un tiers et aurait fait recurer une absence qui est déjà la bonne
    /// réponse.</para>
    /// </summary>
    /// <summary>
    /// Ce qu'on sait de cette œuvre dans cette région, sur cette plateforme.
    ///
    /// <para>La réponse se lit à deux endroits : une sortie listée vaut
    /// <see cref="RegionAvailability.Released"/> ; à défaut, la table des
    /// statuts. Sans rien des deux, <see cref="RegionAvailability.Unknown"/>
    /// — <b>jamais</b> <c>NotReleased</c>. Une absence de donnée n'est pas
    /// une non-sortie, et c'est l'erreur qui retirerait au testeur un jeu
    /// qu'il a possédé.</para>
    /// </summary>
    public RegionAvailability AvailabilityIn(string workId, string platformId, string region)
    {
        if (Releases.Any(r => r.WorkId == workId && r.PlatformId == platformId
                              && r.Region == region))
        {
            return RegionAvailability.Released;
        }
        var oeuvre = Works.FirstOrDefault(w => w.CanonicalId == workId);
        return oeuvre?.DeclaredStatusIn(platformId, region) ?? RegionAvailability.Unknown;
    }

    public IReadOnlyList<DatasetRelease> ReleasesMissingRegion
    {
        get
        {
            var libres = Platforms.Where(p => p.RegionFree)
                .Select(p => p.CanonicalId).ToHashSet(StringComparer.Ordinal);
            return [.. Releases.Where(r => string.IsNullOrEmpty(r.Region)
                                           && !libres.Contains(r.PlatformId))];
        }
    }
}

/// <summary>Une sortie telle que le dataset la porte, avec sa qualité déclarée.</summary>
public sealed record DatasetRelease(
    string CanonicalId, string WorkId, string PlatformId,
    string? Region, string Date, string Precision, string Confidence);

/// <summary>
/// Lit <c>dataset/poc.json</c> et vérifie ses invariants structurels.
///
/// <para>Le chargement <b>ne refuse jamais</b> : il rend le dataset ET la
/// liste de ses anomalies. Un référentiel imparfait reste utilisable, et
/// c'est cohérent avec la décision de COUT-DE-CURATION §4.1 — le référentiel
/// porte son incertitude plutôt que de prétendre à une exactitude qu'il n'a
/// pas payée.</para>
/// </summary>
public static class DatasetLoader
{
    /// <summary>
    /// Les préfixes de §10.2. Un identifiant mal préfixé se glisserait là où
    /// un autre type est attendu — la bévue que le préfixe existe pour
    /// empêcher.
    /// </summary>
    private static readonly Dictionary<string, string> Prefixes = new(StringComparer.Ordinal)
    {
        ["platform"] = "plt_",
        ["work"] = "wrk_",
        ["release"] = "rel_",
    };

    public static DatasetLoadResult Load(string json)
    {
        using var doc = JsonDocument.Parse(json);
        var racine = doc.RootElement;

        var violations = new List<DatasetViolation>();
        var vus = new Dictionary<string, string>(StringComparer.Ordinal);

        void Enregistrer(string id, string type)
        {
            if (!id.StartsWith(Prefixes[type], StringComparison.Ordinal))
            {
                violations.Add(new DatasetViolation(
                    "prefixe", id,
                    $"« {id} » devrait commencer par « {Prefixes[type]} » pour un {type}."));
            }
            // Invariant 9 : un CanonicalId n'est jamais réattribué. Deux
            // entrées le partageant feraient converger deux histoires.
            if (!vus.TryAdd(id, type))
            {
                violations.Add(new DatasetViolation(
                    "unicite", id,
                    $"« {id} » est déjà utilisé par un {vus[id]}."));
            }
        }

        var plateformes = new List<Platform>();
        foreach (var p in racine.GetProperty("platforms").EnumerateArray())
        {
            var id = p.GetProperty("canonical_id").GetString()!;
            Enregistrer(id, "platform");
            var lancement = p.TryGetProperty("launch_year", out var annee)
                            && annee.ValueKind == JsonValueKind.Number
                ? annee.GetInt32() : (int?)null;

            if (lancement is null)
            {
                // Sans année, le contrôle d'anachronisme ne s'applique à
                // rien — et une vérification qui ne vérifie rien rend vert.
                violations.Add(new DatasetViolation(
                    "plateforme", id,
                    $"« {id} » n'a pas d'année de lancement : aucune sortie ne "
                    + "peut donc être datée par rapport à elle."));
            }

            plateformes.Add(new Platform(id, p.GetProperty("name").GetString()!)
            {
                RegionFree = p.TryGetProperty("region_free", out var libre)
                             && libre.GetBoolean(),
                LaunchYear = lancement,
            });
        }

        var idsPlateformes = plateformes.Select(p => p.CanonicalId).ToHashSet(StringComparer.Ordinal);
        var oeuvres = new List<Work>();
        var sorties = new List<DatasetRelease>();

        foreach (var w in racine.GetProperty("works").EnumerateArray())
        {
            var workId = w.GetProperty("canonical_id").GetString()!;
            Enregistrer(workId, "work");

            var rangs = new Dictionary<string, int>(StringComparer.Ordinal);
            foreach (var rang in w.GetProperty("notability").EnumerateObject())
            {
                rangs[rang.Name] = rang.Value.GetInt32();
            }
            var statuts = LireStatutsRegionaux(w);
            oeuvres.Add(new Work(workId, w.GetProperty("title").GetString()!)
            {
                Notability = rangs,
                RegionStatus = statuts,
            });

            var plateformesDeLOeuvre = new HashSet<string>(StringComparer.Ordinal);

            foreach (var r in w.GetProperty("releases").EnumerateArray())
            {
                var releaseId = r.GetProperty("canonical_id").GetString()!;
                Enregistrer(releaseId, "release");

                var platformId = r.GetProperty("platform").GetString();
                if (string.IsNullOrEmpty(platformId) || !idsPlateformes.Contains(platformId))
                {
                    violations.Add(new DatasetViolation(
                        "plateforme", releaseId,
                        $"« {releaseId} » désigne une plateforme inconnue : « {platformId} »."));
                }

                var precision = r.GetProperty("precision").GetString()!;
                var confidence = r.GetProperty("confidence").GetString()!;
                var date = r.GetProperty("date").GetString()!;
                VerifierQualite(releaseId, precision, confidence, violations);
                VerifierAnachronisme(releaseId, date, platformId, plateformes, violations);

                if (!string.IsNullOrEmpty(platformId)) plateformesDeLOeuvre.Add(platformId);

                sorties.Add(new DatasetRelease(
                    releaseId, workId, platformId ?? "",
                    r.GetProperty("region").ValueKind == JsonValueKind.Null
                        ? null : r.GetProperty("region").GetString(),
                    date, precision, confidence));
            }

            VerifierNotoriete(workId, rangs, plateformesDeLOeuvre, violations);
            VerifierStatutsRegionaux(workId, statuts, sorties, violations);
        }

        var redirections = LireRedirections(racine, vus, violations);

        return new DatasetLoadResult(
            racine.GetProperty("dataset_version").GetString()!,
            plateformes, oeuvres, sorties, redirections, violations);
    }

    /// <summary>
    /// <b>Le classement couvre exactement les plateformes où l'œuvre sort.</b>
    ///
    /// Sans rang, E02 ne sait pas où placer le titre : il disparaît de la
    /// liste sans que rien ne le signale — l'échec qui casse la
    /// reconnaissance (§3.3). Un rang sur une plateforme où l'œuvre ne sort
    /// pas est le symptôme inverse : un classement qui a survécu à la
    /// disparition de sa sortie.
    /// </summary>
    private static void VerifierNotoriete(
        string workId, Dictionary<string, int> rangs,
        HashSet<string> plateformes, List<DatasetViolation> violations)
    {
        foreach (var manquante in plateformes.Where(p => !rangs.ContainsKey(p)))
        {
            violations.Add(new DatasetViolation(
                "notabilite", workId,
                $"« {workId} » sort sur « {manquante} » sans y être classée."));
        }
        foreach (var orpheline in rangs.Keys.Where(p => !plateformes.Contains(p)))
        {
            violations.Add(new DatasetViolation(
                "notabilite", workId,
                $"« {workId} » est classée sur « {orpheline} » où elle ne sort pas."));
        }
    }

    /// <summary>
    /// Lit <c>region_status</c> : les régions <b>sans sortie</b>, et ce qu'on
    /// en sait. Une valeur inconnue du vocabulaire devient
    /// <see cref="RegionAvailability.Unknown"/> — jamais <c>NotReleased</c> :
    /// en cas de doute, on ne retire rien au joueur.
    /// </summary>
    private static Dictionary<string, IReadOnlyDictionary<string, RegionAvailability>>
        LireStatutsRegionaux(JsonElement w)
    {
        var sortie = new Dictionary<string, IReadOnlyDictionary<string, RegionAvailability>>(
            StringComparer.Ordinal);
        if (!w.TryGetProperty("region_status", out var table)) return sortie;

        foreach (var plateforme in table.EnumerateObject())
        {
            var regions = new Dictionary<string, RegionAvailability>(StringComparer.Ordinal);
            foreach (var region in plateforme.Value.EnumerateObject())
            {
                regions[region.Name] = region.Value.GetString() == "absent"
                    ? RegionAvailability.NotReleased
                    : RegionAvailability.Unknown;
            }
            sortie[plateforme.Name] = regions;
        }
        return sortie;
    }

    /// <summary>
    /// <b>La table ne porte que les régions sans sortie.</b> Y trouver une
    /// région qui en a une est une contradiction : deux réponses opposées à
    /// la même question, et rien ne dit laquelle l'emporte.
    /// </summary>
    private static void VerifierStatutsRegionaux(
        string workId,
        Dictionary<string, IReadOnlyDictionary<string, RegionAvailability>> statuts,
        List<DatasetRelease> sorties,
        List<DatasetViolation> violations)
    {
        foreach (var (plateforme, regions) in statuts)
        {
            foreach (var region in regions.Keys)
            {
                var contredite = sorties.Any(
                    r => r.WorkId == workId && r.PlatformId == plateforme
                         && r.Region == region);
                if (contredite)
                {
                    violations.Add(new DatasetViolation(
                        "region", workId,
                        $"« {workId} » déclare un statut pour « {region} » sur " +
                        $"« {plateforme} » alors qu'une sortie y est listée."));
                }
            }
        }
    }

    /// <summary>
    /// La table de redirection de §10.2, qui n'est jamais purgée.
    ///
    /// <para>Deux fautes la rendent inutile : pointer vers un identifiant qui
    /// n'existe pas — l'export de l'utilisateur ne se résout plus — et
    /// rediriger un identifiant encore vivant, qui ferait exister la même
    /// œuvre sous deux adresses dont l'une mène ailleurs.</para>
    /// </summary>
    private static Dictionary<string, string> LireRedirections(
        JsonElement racine, Dictionary<string, string> vus,
        List<DatasetViolation> violations)
    {
        var redirections = new Dictionary<string, string>(StringComparer.Ordinal);
        if (!racine.TryGetProperty("redirects", out var table)) return redirections;

        // Deux passes, et non une. La table entière doit être connue avant de
        // valider quoi que ce soit : une chaîne A → B → C écrite dans cet
        // ordre voyait B « inexistant » au moment de contrôler A. Le verdict
        // dépendait de l'ORDRE DES CLÉS JSON — vrai ou faux selon l'humeur du
        // sérialiseur.
        foreach (var lien in table.EnumerateObject())
        {
            redirections[lien.Name] = lien.Value.GetString()!;
        }

        foreach (var (depuis, cible) in redirections)
        {
            if (vus.ContainsKey(depuis))
            {
                violations.Add(new DatasetViolation(
                    "redirection", depuis,
                    $"« {depuis} » est redirigé alors qu'il désigne encore une entrée."));
            }
            if (!vus.ContainsKey(cible) && !redirections.ContainsKey(cible))
            {
                violations.Add(new DatasetViolation(
                    "redirection", depuis,
                    $"« {depuis} » redirige vers « {cible} », qui n'existe pas."));
            }
        }

        DetecterCycles(redirections, vus, violations);
        return redirections;
    }

    /// <summary>
    /// Une chaîne de redirections doit <b>aboutir</b>.
    ///
    /// <para>A → B → A satisfait toutes les règles précédentes — chaque cible
    /// existe — et ne résout rien. Pire, le code qui suit la chaîne pour
    /// retrouver l'œuvre boucle indéfiniment. Le contrôle est ici parce que
    /// c'est ici qu'on connaît la table entière.</para>
    /// </summary>
    private static void DetecterCycles(
        Dictionary<string, string> redirections,
        Dictionary<string, string> vus,
        List<DatasetViolation> violations)
    {
        foreach (var depart in redirections.Keys)
        {
            var visites = new HashSet<string>(StringComparer.Ordinal) { depart };
            var courant = depart;
            while (redirections.TryGetValue(courant, out var suivant))
            {
                if (!visites.Add(suivant))
                {
                    violations.Add(new DatasetViolation(
                        "redirection", depart,
                        $"« {depart} » ouvre une chaîne qui boucle sur « {suivant} »."));
                    break;
                }
                courant = suivant;
            }
        }
    }

    /// <summary>
    /// <b>Une sortie ne peut pas précéder la machine sur laquelle elle
    /// paraît.</b>
    ///
    /// <para>La contrainte paraît triviale et elle a pourtant attrapé une
    /// date Famicom de 1987 attribuée à la Game Boy, sortie en 1989 — une
    /// sortie sur 592, qui n'aurait jamais levé d'erreur. C'est la borne que
    /// les replis d'un analyseur de source ne peuvent pas franchir.</para>
    ///
    /// <para>La borne est <b>inclusive</b> : un jeu de lancement paraît
    /// l'année de la machine, et c'est fréquent parmi les titres les mieux
    /// classés.</para>
    /// </summary>
    private static void VerifierAnachronisme(
        string id, string date, string? platformId,
        List<Platform> plateformes, List<DatasetViolation> violations)
    {
        var plateforme = plateformes.FirstOrDefault(p => p.CanonicalId == platformId);
        if (plateforme?.LaunchYear is not { } lancement) return;
        if (!int.TryParse(date.AsSpan(0, 4), out var annee) || annee >= lancement) return;

        violations.Add(new DatasetViolation(
            "anachronisme", id,
            $"« {id} » est daté de {annee} sur « {plateforme.Name} », "
            + $"parue en {lancement}."));
    }

    /// <summary>
    /// <b>La précision ne dépasse jamais ce que la confiance soutient.</b>
    ///
    /// Ce n'est pas une correspondance stricte : une date venue d'une source
    /// secondaire peut être précise au jour tout en n'étant que moyennement
    /// sûre. Ce qui est interdit, c'est l'inverse — revendiquer un jour quand
    /// on ne sait même pas de quelle sortie la date parle, ou annoncer une
    /// certitude haute sur une simple année.
    /// </summary>
    private static void VerifierQualite(
        string id, string precision, string confidence, List<DatasetViolation> violations)
    {
        if (confidence == "high" && precision != "day")
        {
            violations.Add(new DatasetViolation(
                "qualite", id,
                $"« {id} » annonce une confiance haute sur une précision « {precision} »."));
        }
        if (confidence == "low" && precision != "year")
        {
            violations.Add(new DatasetViolation(
                "qualite", id,
                $"« {id} » revendique une précision « {precision} » avec une confiance basse."));
        }
    }
}
