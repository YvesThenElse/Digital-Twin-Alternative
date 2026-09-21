using System.Text.Json;
using DigitalTwin.Domain.Reference;

namespace DigitalTwin.Api.Reference;

/// <summary>
/// Le référentiel, lu <b>une fois au démarrage</b> et gardé en mémoire.
///
/// <para>221 œuvres et 592 sorties tiennent en quelques centaines de
/// kilo-octets : §17.1 autorise explicitement « SQLite ou fichier précompilé
/// simple », et le fichier évite une étape de construction pour un gain nul à
/// cette échelle.</para>
///
/// <para><b>Le chargement échoue fort.</b> Un fichier absent produirait un
/// catalogue vide, donc des listes vides sans la moindre erreur — un testeur
/// en conclurait que ses jeux n'existent pas. Un dataset fautif servirait des
/// données dont on sait qu'elles sont fausses. Dans les deux cas, l'API ne
/// démarre pas.</para>
/// </summary>
public sealed class ReferenceCatalogSource
{
    public DatasetLoadResult Dataset { get; }

    /// <summary>
    /// Les œuvres dont la jaquette est <b>réellement servable</b> : présente
    /// au manifeste ET sur le disque.
    ///
    /// <para>Le manifeste enregistre une <i>acquisition</i> ; il ne prouve
    /// pas une <i>présence</i>. Les images sont hors du dépôt — emprunt
    /// révocable sous fair use (VERIFICATION-JURIDIQUE §3.3) —, donc un clone
    /// neuf n'en a aucune. Annoncer une adresse pour un fichier absent
    /// produirait une image cassée, <b>pire qu'un trou parce que ça
    /// ressemble à une panne</b>.</para>
    ///
    /// <para>Un manifeste absent, ou des fichiers absents, donnent un
    /// catalogue tout en tuiles composées. C'est délibérément silencieux :
    /// §19.2 en fait le socle permanent, pas un repli d'erreur.</para>
    /// </summary>
    public IReadOnlySet<string> WorksWithCover { get; }

    /// <summary>Le fichier de jaquette d'une œuvre, ou <c>null</c>.</summary>
    public string? CoverFile(string workId)
        => _fichiersDeJaquette.TryGetValue(workId, out var chemin) ? chemin : null;

    private readonly Dictionary<string, string> _fichiersDeJaquette =
        new(StringComparer.Ordinal);

    public ReferenceCatalogSource(string chemin)
    {
        if (!File.Exists(chemin))
        {
            throw new InvalidOperationException(
                $"Référentiel introuvable : « {chemin} ». L'API ne démarre pas sans lui — "
                + "un catalogue vide servirait des listes vides sans erreur.");
        }

        Dataset = DatasetLoader.Load(File.ReadAllText(chemin));

        WorksWithCover = LireManifeste(chemin, _fichiersDeJaquette);

        if (!Dataset.IsValid)
        {
            // Les dix premières suffisent à diagnostiquer, et chacune nomme
            // son entrée : « le dataset est invalide » ne sert à rien sur
            // 821 identifiants.
            var anomalies = string.Join("\n  ", Dataset.Violations.Take(10)
                .Select(v => $"[{v.Rule}] {v.Message}"));
            var reste = Dataset.Violations.Count > 10
                ? $"\n  … et {Dataset.Violations.Count - 10} autre(s)." : "";
            throw new InvalidOperationException(
                $"Référentiel fautif ({Dataset.Violations.Count} anomalie(s)) dans "
                + $"« {chemin} » :\n  {anomalies}{reste}");
        }
    }

    /// <summary>
    /// Le manifeste des jaquettes, s'il est là. Il vit à côté du dataset.
    /// </summary>
    private static IReadOnlySet<string> LireManifeste(
        string cheminDataset, Dictionary<string, string> fichiers)
    {
        var dossier = Path.Combine(Path.GetDirectoryName(cheminDataset) ?? ".", "covers");
        var manifeste = Path.Combine(dossier, "MANIFEST.json");
        if (!File.Exists(manifeste)) return new HashSet<string>(StringComparer.Ordinal);

        using var doc = JsonDocument.Parse(File.ReadAllText(manifeste));
        foreach (var entree in doc.RootElement.EnumerateObject())
        {
            if (!entree.Value.TryGetProperty("file", out var nom)) continue;
            var fichier = Path.Combine(dossier, nom.GetString()!);
            // PRÉSENT, pas seulement annoncé. Le manifeste survit au clone,
            // les images non.
            if (File.Exists(fichier)) fichiers[entree.Name] = fichier;
        }
        return fichiers.Keys.ToHashSet(StringComparer.Ordinal);
    }

    /// <summary>
    /// Où chercher le dataset quand la configuration ne le dit pas.
    ///
    /// <para>On remonte depuis le répertoire d'exécution jusqu'à trouver
    /// <c>dataset/poc.json</c> : l'API se lance aussi bien depuis la racine du
    /// dépôt que depuis son propre dossier, et les tests depuis leur
    /// <c>bin/</c>. <b>Si rien n'est trouvé, on rend le chemin cherché plutôt
    /// que <c>null</c></b> — le message d'erreur doit dire où l'on a regardé.
    /// </para>
    /// </summary>
    public static string Localiser(string depart)
    {
        for (var d = new DirectoryInfo(depart); d is not null; d = d.Parent)
        {
            var candidat = Path.Combine(d.FullName, "dataset", "poc.json");
            if (File.Exists(candidat)) return candidat;
        }
        return Path.Combine(depart, "dataset", "poc.json");
    }
}
