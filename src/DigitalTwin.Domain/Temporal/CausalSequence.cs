namespace DigitalTwin.Domain.Temporal;

/// <summary>
/// L'ordre logique que certains couples d'événements ont indépendamment des
/// dates déclarées (ORDONNANCEMENT-TEMPOREL §4.3).
///
/// Les chaînes sont celles de la spécification, et <b>rien d'autre</b> :
///
/// <code>
/// DiscoveredGame → StartedGame → CompletedGame | AbandonedGame
///                  StartedGame → ReplayedGame
/// AcquiredItem   → SoldItem
/// </code>
///
/// <para><b>Le principe : n'affirmer un ordre que là où il en existe
/// réellement un.</b> La spécification posait auparavant
/// <c>SoldItem → ReplayedGame</c>, ce qui faisait lever un avertissement sur
/// un parcours banal — acquis 1997, rejoué 1999, vendu 2002. Rejouer ne
/// suppose aucune vente préalable. En revanche on ne rejoue pas ce qu'on n'a
/// jamais commencé : c'est <c>StartedGame → ReplayedGame</c> qui est
/// causal.</para>
///
/// <para>Trois absences sont volontaires. <c>CompletedGame</c> et
/// <c>AbandonedGame</c> ne sont pas ordonnés entre eux : ils sont exclusifs
/// (invariant 7), pas successifs. Les deux chaînes sont <b>indépendantes</b>
/// — jouer et posséder sont deux axes distincts (§4.2 du modèle), donc rien
/// ne dit qu'on acquiert avant de commencer. Et rien ne relie plus la
/// possession au rejeu.</para>
/// </summary>
public static class CausalSequence
{
    // Successeurs directs. La fermeture transitive est calculée à la lecture ;
    // à cette taille, la clarté prime sur la précomputation.
    private static readonly Dictionary<string, string[]> Suivants = new(StringComparer.Ordinal)
    {
        ["DiscoveredGame"] = ["StartedGame"],
        ["StartedGame"] = ["CompletedGame", "AbandonedGame", "ReplayedGame"],
        ["AcquiredItem"] = ["SoldItem"],
    };

    /// <summary>
    /// <c>true</c> si <paramref name="earlier"/> doit logiquement précéder
    /// <paramref name="later"/>. Un type inconnu n'ordonne rien : le
    /// référentiel des types appartient à <c>PlayerEvent</c> (item 11), et
    /// inventer un ordre pour ce qu'on ne connaît pas serait pire que de
    /// n'en imposer aucun.
    /// </summary>
    public static bool Precedes(string? earlier, string? later)
    {
        if (earlier is null || later is null || earlier == later)
        {
            return false;
        }

        var vus = new HashSet<string>(StringComparer.Ordinal);
        var aVisiter = new Stack<string>();
        aVisiter.Push(earlier);

        while (aVisiter.Count > 0)
        {
            var courant = aVisiter.Pop();
            if (!Suivants.TryGetValue(courant, out var suivants))
            {
                continue;
            }

            foreach (var suivant in suivants)
            {
                if (suivant == later)
                {
                    return true;
                }
                if (vus.Add(suivant))
                {
                    aVisiter.Push(suivant);
                }
            }
        }

        return false;
    }
}

/// <summary>
/// Une incohérence constatée entre deux moments : l'ordre déclaré contredit
/// la séquence causale.
///
/// <b>C'est un avertissement, jamais un refus</b> (invariant 10). Le moment
/// reste affiché tel que son auteur l'a déclaré — réordonner silencieusement
/// reviendrait à prétendre connaître son souvenir mieux que lui.
/// </summary>
public sealed record CoherenceWarning(
    string ExpectedEarlierId,
    string ExpectedLaterId,
    string Message);
