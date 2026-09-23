using System.Text.RegularExpressions;

namespace DigitalTwin.Domain.Tests.Plan;

/// <summary>
/// <b>Aucun lien promis ne mène nulle part.</b>
///
/// <para>Le défaut qui a produit la liste des écrans manquants est
/// structurel : le graphe de navigation promet des destinations, et
/// <b>rien ne comparait la promesse au plan</b>. Quatre fiches se sont
/// déclarées « Phase 1 » sans être construites ; E06 a promis une recherche
/// transverse au périmètre d'un POC ; E07 a laissé trois capacités vertes et
/// sans producteur.</para>
///
/// <para>Ce test applique le patron des gardes de documentation
/// (apprentissage 77) : prendre l'ensemble à sa <b>source d'autorité</b> — la
/// table des liens —, le comparer au plan <b>dans les deux sens</b>, ancrer
/// la lecture sur une section plutôt que sur le fichier entier, et porter un
/// témoin qui éprouve la logique.</para>
///
/// <para>Il ne juge pas ce qui est construit : différer est légitime. Il
/// exige que la décision soit <b>écrite</b> — et que les deux documents qui
/// la portent disent la même chose.</para>
/// </summary>
public class GrapheDeNavigationTests
{
    private static DirectoryInfo Racine()
    {
        var racine = new DirectoryInfo(AppContext.BaseDirectory);
        while (racine is not null && !File.Exists(Path.Combine(racine.FullName, "PHASING.md")))
        {
            racine = racine.Parent;
        }
        Assert.NotNull(racine);
        return racine!;
    }

    private static string Lire(params string[] chemin)
        => File.ReadAllText(Path.Combine([Racine().FullName, .. chemin]));

    /// <summary>
    /// Les lignes d'un tableau markdown, sous un titre donné et jusqu'au
    /// titre suivant.
    ///
    /// <para>Ancré sur la SECTION, jamais sur le fichier : un tableau qui
    /// déborderait sur la section d'après ramasserait n'importe quoi, et le
    /// contrôle se croirait satisfait par un document assez long.</para>
    /// </summary>
    private static IEnumerable<string[]> Lignes(string document, string titre)
    {
        var debut = document.IndexOf(titre, StringComparison.Ordinal);
        Assert.True(debut >= 0, $"« {titre} » a disparu du document.");

        var suite = document[(debut + titre.Length)..];
        var fin = suite.IndexOf("\n#", StringComparison.Ordinal);
        var section = fin < 0 ? suite : suite[..fin];

        return section.Split('\n')
            .Where(l => l.TrimStart().StartsWith("| **E", StringComparison.Ordinal))
            .Select(l => l.Split('|'));
    }

    private const string TitreLiens = "## 3. Table des liens";
    private const string TitrePlan = "### Les dix-sept écrans, et la phase où chacun va";

    /// <summary>
    /// Les écrans vers lesquels le graphe promet de mener — <b>colonne
    /// « Mène vers »</b>, la troisième.
    /// </summary>
    internal static SortedSet<string> Destinations(string parcours) =>
        [.. Lignes(parcours, TitreLiens)
            .Where(cellules => cellules.Length > 3)
            .SelectMany(cellules => Regex.Matches(cellules[3], @"E\d\d").Select(m => m.Value))];

    /// <summary>Les écrans que le plan situe, avec la phase qu'il leur donne.</summary>
    internal static Dictionary<string, int> Inscrits(string phasing) =>
        Lignes(phasing, TitrePlan)
            .Where(c => c.Length > 2)
            .Select(c => (
                Ecran: Regex.Match(c[1], @"E\d\d").Value,
                Phase: Regex.Match(c[2], @"\d+").Value))
            .Where(x => x.Ecran.Length > 0 && x.Phase.Length > 0)
            .ToDictionary(x => x.Ecran, x => int.Parse(x.Phase));

    /// <summary>
    /// La phase que la FICHE se donne, première valeur de son en-tête.
    ///
    /// <para>Un écran livré en tranches — E04 fusionné puis autonome, E07 en
    /// trois morceaux — porte sa première phase ; la nuance vit dans la
    /// fiche, qui est le seul endroit où elle a de la place.</para>
    /// </summary>
    private static int? PhaseDeLaFiche(string ecran)
    {
        var fiche = Directory.GetFiles(
            Path.Combine(Racine().FullName, "ecrans"), $"{ecran}-*.md").SingleOrDefault();
        if (fiche is null) return null;

        var entete = File.ReadLines(fiche)
            .FirstOrDefault(l => l.StartsWith("**Type**", StringComparison.Ordinal));
        if (entete is null) return null;

        var phase = Regex.Match(entete, @"\*\*Phase\*\* : [^\d]*(\d+)");
        return phase.Success ? int.Parse(phase.Groups[1].Value) : null;
    }

    [Fact]
    public void Chaque_destination_du_graphe_est_situee_par_le_plan()
    {
        var destinations = Destinations(Lire("ecrans", "PARCOURS-ET-LIENS.md"));
        var inscrits = Inscrits(Lire("PHASING.md"));

        var orphelines = destinations.Except(inscrits.Keys).ToList();

        Assert.True(orphelines.Count == 0,
            "Le graphe mène vers des écrans que PHASING.md ne situe pas : "
            + string.Join(", ", orphelines)
            + ". Un lien vers un écran qu'aucune phase ne porte est une promesse "
            + "que personne ne tient — inscrivez-le, livré ou différé.");
    }

    [Fact]
    public void Le_plan_ne_situe_aucun_ecran_qui_n_existe_pas()
    {
        var inscrits = Inscrits(Lire("PHASING.md"));

        var fantomes = inscrits.Keys.Where(e => PhaseDeLaFiche(e) is null).ToList();

        Assert.True(fantomes.Count == 0,
            "PHASING.md situe des écrans sans fiche : " + string.Join(", ", fantomes)
            + ". Un plan qui porte un écran que personne n'a décrit promet deux fois.");
    }

    [Fact]
    public void Le_plan_et_les_fiches_disent_la_MEME_phase()
    {
        // C'est la divergence que ce dépôt trouve le plus souvent : E06 se
        // disait Phase 1 pendant que le plan l'ignorait, E07 se disait
        // Phase 1 pendant que le plan le situait en Phase 3. Deux écritures
        // d'un même fait finissent toujours par se contredire ; celle-ci
        // échoue quand elles le font.
        var desaccords = Inscrits(Lire("PHASING.md"))
            .Where(paire => PhaseDeLaFiche(paire.Key) is { } fiche && fiche != paire.Value)
            .Select(paire =>
                $"{paire.Key} : plan {paire.Value}, fiche {PhaseDeLaFiche(paire.Key)}")
            .ToList();

        Assert.True(desaccords.Count == 0,
            "Le plan et les fiches se contredisent — " + string.Join(" ; ", desaccords) + ".");
    }

    // ------------------------------------------------------------ les témoins

    [Fact]
    public void Le_graphe_est_reellement_lu()
    {
        // Une lecture qui ne trouverait aucune ligne rendrait le contrôle
        // inopérant, et son silence ressemblerait à une garantie.
        var destinations = Destinations(Lire("ecrans", "PARCOURS-ET-LIENS.md"));
        Assert.NotEmpty(destinations);

        // Et qu'on lit la BONNE colonne. E07 n'est la source d'aucun lien —
        // « il retourne toujours à l'écran appelant et ne conduit nulle part
        // ailleurs » —, donc aucune ligne ne le nomme dans « vient de ». Il
        // est pourtant une destination, depuis E02, E03, E05 et E06 : c'est
        // le seul écran qui distingue les deux colonnes, et s'il manque,
        // c'est qu'on lit celle d'à côté.
        Assert.Contains("E07", destinations);
    }

    [Fact]
    public void Le_plan_est_reellement_lu()
    {
        Assert.NotEmpty(Inscrits(Lire("PHASING.md")));
    }

    [Fact]
    public void Une_destination_non_situee_est_detectee()
    {
        // Le témoin qui éprouve la LOGIQUE : un plan amputé d'une ligne doit
        // laisser la destination correspondante orpheline.
        var ampute = Lire("PHASING.md").Replace(
            "| **E08** Collection | 3 |", "| **X08** Collection | 3 |",
            StringComparison.Ordinal);

        Assert.DoesNotContain("E08", Inscrits(ampute).Keys);
        Assert.Contains("E08", Destinations(Lire("ecrans", "PARCOURS-ET-LIENS.md")));
    }

    [Fact]
    public void La_lecture_s_arrete_a_la_fin_de_la_section()
    {
        // Le premier essai d'un garde de ce genre ramassait onze lignes d'un
        // tableau sans rapport. On vérifie donc que la section lue ne déborde
        // pas : le plan ne situe QUE des écrans, et jamais dix-huit.
        Assert.True(Inscrits(Lire("PHASING.md")).Count == 17,
            "Le tableau des écrans ne compte plus dix-sept lignes : la lecture "
            + "déborde, ou le plan a changé sans qu'on le dise.");
    }
}
