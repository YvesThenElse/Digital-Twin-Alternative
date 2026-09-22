namespace DigitalTwin.Api.Persistence;

/// <summary>
/// Un souvenir — <b>le seul contenu du produit qui ne soit pas généré</b>
/// (§9, MODELE §5).
///
/// <para>Une liste de jeux cochés ne ressemble à personne : elle est
/// statistiquement identique à celle de milliers de joueurs de la même
/// génération. Ce qui rend un profil personnel, c'est « on l'a fini à deux
/// avec mon frère pendant les vacances de 1997 » — et c'est exactement ce que
/// la porte de Phase 2 mesure.</para>
///
/// <para><b>Ce n'est pas un événement.</b> La règle de partage de MODELE §5 :
/// si la question « quand ? » a une réponse, c'est un événement ; sinon c'est
/// une déclaration. Un souvenir porte la date où il a été <i>écrit</i>, pas
/// celle du fait qu'il raconte — laquelle vit dans l'événement qu'il
/// accompagne. Il se révise donc en place.</para>
///
/// <para>⚠️ La <b>visibilité</b> de §12 n'est pas portée ici. Elle appartient
/// à la Phase 5, avec le profil public, et aucun écran de Phase 1 ne la
/// remplirait : une colonne inutilisée avec un défaut silencieux est pire
/// qu'une migration future.</para>
/// </summary>
public sealed class MemoryRow
{
    /// <summary>Invariant 11 : joignable par lui seul, condition de la purge.</summary>
    public string UserId { get; set; } = "";

    /// <summary><c>work</c> ou <c>unresolvedClaim</c>. Jamais autre chose.</summary>
    public string TargetKind { get; set; } = "";

    public string TargetId { get; set; } = "";

    /// <summary>Le texte, tel qu'il a été écrit. Seuls les bords sont rognés.</summary>
    public string Text { get; set; } = "";

    /// <summary>
    /// Le repère court de §9.2 — « optionnellement un titre court, servant de
    /// repère sur la timeline ».
    ///
    /// <para><b>Nul, jamais vide.</b> Une chaîne vide s'afficherait sur l'axe
    /// comme un repère muet : le lecteur verrait une marque annonçant une
    /// phrase, et ne trouverait rien. « Ne pas avoir de titre » a besoin de
    /// son propre signe, et c'est <c>null</c>.</para>
    ///
    /// <para>Il n'est pas un résumé calculé du texte : le produit
    /// n'inventerait pas la seule chose que l'utilisateur écrit lui-même.</para>
    /// </summary>
    public string? Title { get; set; }

    /// <summary>Quand il a été écrit ou révisé — jamais quand le fait a eu lieu.</summary>
    public DateTime UpdatedAt { get; set; }
}
