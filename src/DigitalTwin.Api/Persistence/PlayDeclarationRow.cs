namespace DigitalTwin.Api.Persistence;

/// <summary>
/// Une déclaration permanente, telle qu'elle est stockée.
///
/// <para><b>Ce n'est pas un événement, et la table n'est pas en ajout
/// seul.</b> La règle de partage est celle de MODELE §5 : si la question
/// « quand ? » a une réponse, c'est un événement ; sinon c'est une
/// déclaration. « Je n'y ai jamais joué » n'a pas de date, et lui en forcer
/// une inventerait une précision que §7.4 interdit.</para>
///
/// <para>Une déclaration se <b>révise</b> — invariant 10 : une incohérence
/// produit un avertissement, jamais un refus. La ligne est donc mise à jour
/// en place, contrairement au journal.</para>
/// </summary>
public sealed class PlayDeclarationRow
{
    /// <summary>Invariant 11 : joignable par lui seul, condition de la purge.</summary>
    public string UserId { get; set; } = "";

    public string WorkId { get; set; } = "";

    /// <summary>
    /// La plateforme sur laquelle porte l'affect — <c>Favourite</c> y est
    /// unique (invariant 6). C'est elle qui oblige la clé à porter trois
    /// colonnes et non deux.
    /// </summary>
    public string PlatformId { get; set; } = "";

    /// <summary>
    /// Déclaration <b>positive</b>, distincte du silence (§24.3). L'absence
    /// de ligne dit « il ne s'est pas prononcé » ; <c>true</c> dit « il n'y a
    /// jamais joué ». Les confondre ferait disparaître une information que la
    /// reconstruction utilise.
    /// </summary>
    public bool NeverPlayed { get; set; }

    /// <summary>
    /// « J'y joue encore » (§4.6). <b>Une réponse, pas une absence</b> : le
    /// journal ne sait pas la distinguer d'un jeu simplement coché, puisque
    /// les deux ne produisent qu'un <c>StartedGame</c> que rien ne referme.
    /// </summary>
    public bool StillPlaying { get; set; }

    public string Provenance { get; set; } = "Unknown";
    /// <summary>
    /// <c>Unstated</c>, jamais <c>Indifferent</c> : la valeur par défaut d'une
    /// colonne ne doit affirmer aucune réponse. Celle-ci disait « sans plus »
    /// sur toute déclaration dont la question n'avait pas été posée.
    /// </summary>
    public string Affect { get; set; } = "Unstated";
}
