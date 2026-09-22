using System.Text.RegularExpressions;

namespace DigitalTwin.Domain.Tests.Temporal;

/// <summary>
/// Le tiroir sans date est une <b>tâche</b>, et la tâche est située.
///
/// <para><c>ORDONNANCEMENT-TEMPOREL.md</c> §6 promet que « le tiroir est
/// dimensionné pour être vidé — c'est la relance de session la moins
/// coûteuse du produit ». La Phase 1 ne le tient pas : le tiroir affiche et
/// n'accepte aucun geste. L'écran qui le viderait existe — E14 — et il a
/// <b>deux entrants</b>, qui n'arrivent pas dans la même phase.</para>
///
/// <para><b>Ce test ne demande pas que ce soit construit.</b> Il demande que
/// chaque entrant déclaré par la fiche soit SITUÉ par le plan : une porte
/// qu'aucune phase ne prévoit est une porte qui n'existera jamais, et c'est
/// ainsi que la passe temporelle n'était inscrite nulle part.</para>
/// </summary>
public class PasseTemporelleTests
{
    private static string Lire(params string[] chemin)
    {
        var racine = new DirectoryInfo(AppContext.BaseDirectory);
        while (racine is not null && !File.Exists(Path.Combine(racine.FullName, "PHASING.md")))
        {
            racine = racine.Parent;
        }
        Assert.NotNull(racine);
        return File.ReadAllText(Path.Combine([racine!.FullName, .. chemin]));
    }

    /// <summary>
    /// La source d'AUTORITÉ : la ligne « Entrant » de la fiche E14. Recopier
    /// ici la liste des portes ferait exactement ce que ce test reproche au
    /// plan — une seconde description, qui se périme seule.
    /// </summary>
    internal static SortedSet<string> EntrantsDeclares(string fiche)
    {
        var ligne = fiche.Split('\n')
            .FirstOrDefault(l => l.Contains("**Entrant**", StringComparison.Ordinal));
        Assert.NotNull(ligne);

        // Jusqu'au « Sortant » : ce qui suit décrit l'autre sens, et l'y
        // inclure ferait passer une sortie pour une porte d'entrée.
        var fin = ligne!.IndexOf("**Sortant**", StringComparison.Ordinal);
        var entrants = fin < 0 ? ligne : ligne[..fin];

        return [.. Regex.Matches(entrants, @"E\d\d").Select(m => m.Value)];
    }

    [Fact]
    public void Chaque_entrant_de_la_passe_temporelle_est_situe_par_le_plan()
    {
        var entrants = EntrantsDeclares(Lire("ecrans", "E14-passe-temporelle.md"));
        var plan = Lire("PHASING.md");

        var tableau = plan[plan.IndexOf(
            "#### La passe temporelle par le tiroir", StringComparison.Ordinal)..];
        Assert.True(tableau.Length > 0, "La section de la passe temporelle a disparu du plan.");

        // La SECTION seule, pas la suite du document : un code trouvé trois
        // pages plus loin ne situerait rien.
        var section = tableau[..tableau.IndexOf("\n### ", StringComparison.Ordinal)];

        // Le code nu, sans exiger de mise en forme : ce qui compte est que la
        // porte soit nommée, pas qu'elle soit en gras.
        var absents = entrants
            .Where(e => !Regex.IsMatch(section, $@"\b{e}\b"))
            .ToList();

        Assert.True(absents.Count == 0,
            "PHASING.md ne situe pas ces portes vers E14 : " + string.Join(", ", absents)
            + ". Une porte qu'aucune phase ne prévoit est une porte qui n'existera jamais.");
    }

    [Fact]
    public void La_fiche_declare_bien_des_entrants()
    {
        // Témoin : une lecture qui ne trouverait aucune porte rendrait le
        // contrôle inopérant, et son silence ressemblerait à une garantie.
        Assert.NotEmpty(EntrantsDeclares(Lire("ecrans", "E14-passe-temporelle.md")));
    }

    [Fact]
    public void Une_sortie_n_est_pas_prise_pour_une_entree()
    {
        // Le témoin qui éprouve la LOGIQUE : sans la coupure au « Sortant »,
        // l'écran d'arrivée compterait comme une porte d'entrée, et le
        // contrôle réclamerait au plan de situer une porte qui n'existe pas.
        var fabriquee = "**Entrant** : E13 · E03. **Sortant** : E99.";

        Assert.Equal(["E03", "E13"], EntrantsDeclares(fabriquee));
    }
}
