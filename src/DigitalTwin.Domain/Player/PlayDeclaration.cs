namespace DigitalTwin.Domain.Player;

/// <summary>Comment le joueur y a eu accès (MODELE-DE-DOMAINE §4.5).</summary>
public enum Provenance { Unknown, Owned, Elsewhere, Borrowed }

/// <summary>
/// Ce que le jeu a représenté (§4.7). <b>Pas une note</b> : une note juge
/// l'œuvre, l'affect enregistre une relation — et une échelle ferait dériver
/// le produit vers le site de critiques.
///
/// <para><b><c>Unstated</c> vaut zéro, et ce n'est pas un détail.</b> Les
/// trois réponses de l'écran — « sans plus », « j'ai adoré », « mon
/// préféré » — sont des déclarations POSITIVES. « Sans plus » dit « ça ne
/// m'a rien laissé » ; les principes transverses le rangent explicitement
/// parmi les distinctions que ce modèle existe pour tenir, contre « il n'a
/// rien dit ».</para>
///
/// <para>Sans quatrième valeur, l'absence de réponse tombait sur
/// <c>Indifferent</c> : un profil de test portait « sans plus » sur quatre
/// jeux dont la question n'avait jamais été posée. Sur une plateforme de
/// mémoire, c'est l'inverse de ce qu'on veut supposer — et §14.2 en fait une
/// entrée des recommandations.</para>
/// </summary>
public enum Affect { Unstated, Indifferent, Loved, Favourite }

/// <summary>
/// Un jugement permanent sur une œuvre — <b>sans date</b>
/// (MODELE-DE-DOMAINE §2 et §5).
///
/// La règle de partage avec <see cref="PlayerEvent"/> est simple : si la
/// question « quand ? » a une réponse, c'est un événement ; sinon c'est une
/// déclaration. « J'ai adoré ce jeu » n'a pas de date, et forcer un
/// horodatage inventerait une précision que §7.4 interdit.
/// </summary>
public sealed record PlayDeclaration
{
    public PlayDeclaration(string userId, string workId, string platformId)
    {
        // Invariant 11 : joignable par UserId seul, condition de la purge.
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new ArgumentException("UserId manquant.", nameof(userId));
        }
        UserId = userId;
        WorkId = workId;
        PlatformId = platformId;
    }

    public string UserId { get; init; }
    public string WorkId { get; init; }

    /// <summary>La plateforme sur laquelle porte l'affect — <c>Favourite</c> y est unique.</summary>
    public string PlatformId { get; init; }

    /// <summary>
    /// Déclaration <b>positive</b>, distincte du silence (§24.3). Ne rien
    /// dire et dire « je n'y ai jamais joué » sont deux informations
    /// différentes, et la seconde fait avancer la reconstruction.
    /// </summary>
    public bool NeverPlayed { get; private init; }

    public Provenance Provenance { get; init; }
    public Affect Affect { get; init; }

    /// <summary>
    /// Invariant 8 : <c>NeverPlayed</c> exclut toute autre déclaration sur la
    /// même œuvre. Les garder produirait « je n'y ai jamais joué, et je l'ai
    /// adoré ».
    /// </summary>
    public PlayDeclaration DeclareNeverPlayed() => this with
    {
        NeverPlayed = true,
        Provenance = Provenance.Unknown,
        // Effacé veut dire « pas prononcé ». « Je n'y ai jamais joué » ne dit
        // rien de ce que le jeu aurait laissé : y répondre « sans plus » à sa
        // place inventerait un avis.
        Affect = Affect.Unstated,
    };

    /// <summary>
    /// Déclarer un affect lève <c>NeverPlayed</c>. C'est une <b>correction</b>
    /// et non une erreur à refuser : invariant 10, jamais de refus.
    /// </summary>
    public PlayDeclaration WithAffect(Affect affect) =>
        this with { NeverPlayed = false, Affect = affect };

    public PlayDeclaration WithProvenance(Provenance provenance) =>
        this with { NeverPlayed = false, Provenance = provenance };

    /// <summary>
    /// Désigne un préféré sur une plateforme. <b>Invariant 6 : il y en a un
    /// seul.</b> En désigner un second rétrograde le précédent en
    /// <see cref="Affect.Loved"/> — le modèle ne refuse pas le nouveau choix,
    /// il ajuste l'ancien.
    ///
    /// L'opération <b>répare</b> une collection déjà fautive : si plusieurs
    /// préférés coexistent, tous sont rétrogradés sauf le désigné.
    /// </summary>
    public static IReadOnlyList<PlayDeclaration> DesignateFavourite(
        IEnumerable<PlayDeclaration> declarations, string workId, string platformId) =>
        declarations.Select(d =>
            d.WorkId == workId && d.PlatformId == platformId
                ? d.WithAffect(Affect.Favourite)
                : d.PlatformId == platformId && d.Affect == Affect.Favourite
                    ? d with { Affect = Affect.Loved }
                    : d)
        .ToArray();
}
