namespace DigitalTwin.Api.Persistence;

/// <summary>
/// Ce dont l'utilisateur s'est prononcé sur une œuvre, relu.
///
/// <para><c>null</c> n'est pas une valeur par défaut : il dit qu'<b>aucune
/// réponse n'a été donnée</b>. Le confondre avec « toujours en cours » ou
/// « on ne sait pas » afficherait une réponse que personne n'a fournie.</para>
/// </summary>
/// <param name="Completion">finished · abandoned · <c>null</c></param>
/// <param name="Provenance">owned · elsewhere · borrowed · <c>null</c></param>
public sealed record EtatDeLigne(
    string WorkId,
    bool Played,
    string? Completion,
    string? Provenance,
    bool NeverPlayed);
