using System.Reflection;
using DigitalTwin.Domain.Temporal;

namespace DigitalTwin.Domain.Tests.Temporal;

/// <summary>
/// Chaque variante temporelle est <b>atteignable, ou inscrite</b>.
///
/// <para>L'audit du 22 septembre 2026 a trouvé partout le même défaut : une
/// capacité construite, testée, documentée — et qu'aucun geste ne produit.
/// Elle est verte, donc personne ne la cherche. Trois des sept variantes de
/// <see cref="TemporalValue"/> sont dans ce cas, et la période <b>ouverte</b>
/// avec elles : l'API l'accepte, l'axe la rend « depuis 1994 », aucun écran
/// ne la pose.</para>
///
/// <para><b>Ce test ne juge pas ce qui est construit</b> — différer est une
/// décision légitime. Il exige seulement que la décision soit ÉCRITE, et il
/// demande l'ensemble à sa source d'autorité plutôt qu'à une liste : la
/// hiérarchie scellée. Une huitième variante ajoutée demain fera échouer la
/// suite jusqu'à ce que quelqu'un dise où elle va (apprentissages 66 et
/// 69).</para>
/// </summary>
public class CapacitesTemporellesTests
{
    /// <summary>
    /// La source d'AUTORITÉ : la hiérarchie elle-même, pas une énumération
    /// recopiée. C'est toute la différence entre couvrir des cas et couvrir
    /// un ensemble.
    /// </summary>
    private static SortedSet<string> VariantesDuDomaine() =>
        [.. typeof(TemporalValue).Assembly.GetTypes()
            .Where(t => t.IsSealed && t.IsSubclassOf(typeof(TemporalValue)))
            .Select(t => t.Name)];

    private static string Phasing()
    {
        var racine = new DirectoryInfo(AppContext.BaseDirectory);
        while (racine is not null && !File.Exists(Path.Combine(racine.FullName, "PHASING.md")))
        {
            racine = racine.Parent;
        }
        Assert.NotNull(racine);
        return File.ReadAllText(Path.Combine(racine!.FullName, "PHASING.md"));
    }

    /// <summary>Le titre qui ancre le tableau. Le chercher par son intitulé
    /// évite de ramasser les autres tableaux du document — celui du modèle de
    /// données en contient onze lignes de la même forme.</summary>
    private const string Titre = "#### Les sept granularités temporelles";

    /// <summary>
    /// Les variantes que le tableau de `PHASING.md` inscrit, quelle que soit
    /// sa colonne : ce qui compte ici est qu'elles soient NOMMÉES et situées,
    /// pas qu'elles soient livrées.
    /// </summary>
    internal static SortedSet<string> VariantesInscrites(string phasing)
    {
        var debut = phasing.IndexOf(Titre, StringComparison.Ordinal);
        Assert.True(debut >= 0, $"« {Titre} » a disparu de PHASING.md.");

        // Jusqu'au titre suivant, quel que soit son niveau : un tableau qui
        // déborderait sur la section d'après inscrirait n'importe quoi.
        var suite = phasing[(debut + Titre.Length)..];
        var fin = suite.IndexOf("\n#", StringComparison.Ordinal);
        var section = fin < 0 ? suite : suite[..fin];

        return [.. section.Split('\n')
            .Where(l => l.TrimStart().StartsWith("| `", StringComparison.Ordinal))
            .Select(l => l.TrimStart()[3..])
            .Select(l => l[..Math.Max(l.IndexOf('`'), 0)])
            .Where(n => n.Length > 0)];
    }

    [Fact]
    public void Chaque_variante_temporelle_est_atteignable_ou_inscrite()
    {
        var domaine = VariantesDuDomaine();
        var inscrites = VariantesInscrites(Phasing());

        var muettes = domaine.Except(inscrites).ToList();
        Assert.True(muettes.Count == 0,
            "PHASING.md ne dit rien de : " + string.Join(", ", muettes)
            + ". Une capacité que le modèle porte et qu'aucun geste ne produit "
            + "doit être inscrite — livrée ou différée —, sinon elle reste verte "
            + "et inatteignable.");

        var fantomes = inscrites.Except(domaine).ToList();
        Assert.True(fantomes.Count == 0,
            "PHASING.md inscrit des variantes qui n'existent plus : "
            + string.Join(", ", fantomes) + ".");
    }

    [Fact]
    public void Les_sept_variantes_sont_bien_sept()
    {
        // Témoin de la source d'autorité : si la réflexion ne trouvait rien,
        // le test ci-dessus passerait sur un ensemble vide — vert sans avoir
        // rien regardé, exactement ce que l'audit reprochait.
        Assert.Equal(7, VariantesDuDomaine().Count);
    }

    [Fact]
    public void Le_tableau_de_phasing_est_reellement_lu()
    {
        // Second témoin : une lecture qui ne trouverait aucune ligne rendrait
        // le contrôle inopérant, et son silence ressemblerait à une garantie.
        Assert.NotEmpty(VariantesInscrites(Phasing()));
    }

    [Fact]
    public void Une_variante_absente_du_tableau_est_detectee()
    {
        // Le témoin qui éprouve la LOGIQUE, pas l'arbre : on lui donne un
        // document où il manque une ligne, et on exige qu'il la nomme.
        var ampute = Phasing().Replace("| `Age` |", "| `Autre` |", StringComparison.Ordinal);

        Assert.DoesNotContain("Age", VariantesInscrites(ampute));
    }
}
