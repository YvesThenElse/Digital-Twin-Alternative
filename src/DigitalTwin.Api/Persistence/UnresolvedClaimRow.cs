namespace DigitalTwin.Api.Persistence;

/// <summary>
/// Un titre saisi librement parce que le référentiel ne le contient pas
/// (§3.5).
///
/// <para>Sur 221 titres, le cas est <b>permanent</b>. Sans issue, le testeur
/// est bloqué au premier titre manquant, et le test de Phase 2 mesure la
/// couverture du dataset au lieu de l'expérience.</para>
///
/// <para><b>Elle n'est jamais une œuvre.</b> Les événements la ciblent par
/// un identifiant préfixé <c>ucl_</c> : aucune fiche, aucune statistique
/// agrégée ne peut la confondre avec une entrée curée.</para>
/// </summary>
public sealed class UnresolvedClaimRow
{
    /// <summary>Préfixe de §10.2, distinct de <c>wrk_</c> par construction.</summary>
    public string Id { get; set; } = "";

    /// <summary>Invariant 11 : joignable par lui seul, condition de la purge.</summary>
    public string UserId { get; set; } = "";

    /// <summary>Le titre tel que l'utilisateur l'a écrit — jamais normalisé à l'écriture.</summary>
    public string Title { get; set; } = "";

    /// <summary>
    /// Forme comparable du titre, pour ne pas créer deux revendications d'un
    /// même jeu. <b>Stockée à côté du titre, jamais à sa place</b> : le
    /// signal de priorisation vaut par ce que l'utilisateur a réellement
    /// tapé.
    /// </summary>
    public string NormalizedTitle { get; set; } = "";

    public string PlatformId { get; set; } = "";

    /// <summary>
    /// L'œuvre à laquelle la revendication a été rattachée, quand elle l'a
    /// été.
    ///
    /// <para><b>La résolution se pose ici, jamais sur les événements.</b> Le
    /// journal est en ajout seul : réécrire la cible des événements
    /// perdrait l'historique que §3.5 demande justement de conserver. Les
    /// événements continuent de cibler la revendication, qui sait désormais
    /// où elle mène.</para>
    /// </summary>
    public string? ResolvedWorkId { get; set; }
}
