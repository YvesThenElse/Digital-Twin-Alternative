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
    IReadOnlyList<DatasetViolation> Violations)
{
    public bool IsValid => Violations.Count == 0;
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
            plateformes.Add(new Platform(id, p.GetProperty("name").GetString()!));
        }

        var idsPlateformes = plateformes.Select(p => p.CanonicalId).ToHashSet(StringComparer.Ordinal);
        var oeuvres = new List<Work>();
        var sorties = new List<DatasetRelease>();

        foreach (var w in racine.GetProperty("works").EnumerateArray())
        {
            var workId = w.GetProperty("canonical_id").GetString()!;
            Enregistrer(workId, "work");
            oeuvres.Add(new Work(workId, w.GetProperty("title").GetString()!)
            {
                Notability = w.GetProperty("notability").GetInt32(),
            });

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
                VerifierQualite(releaseId, precision, confidence, violations);

                sorties.Add(new DatasetRelease(
                    releaseId, workId, platformId ?? "",
                    r.GetProperty("region").ValueKind == JsonValueKind.Null
                        ? null : r.GetProperty("region").GetString(),
                    r.GetProperty("date").GetString()!, precision, confidence));
            }
        }

        return new DatasetLoadResult(
            racine.GetProperty("dataset_version").GetString()!,
            plateformes, oeuvres, sorties, violations);
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
