namespace DigitalTwin.Api.Persistence;

/// <summary>
/// Ce que le joueur a donné de lui-même — <b>une ligne, un champ</b>.
///
/// <para>L'année de naissance ne sert qu'à <b>situer</b> les souvenirs datés
/// par l'âge (§7.6) : sans elle, « vers mes 12 ans » n'a pas de place sur
/// l'axe et tombe dans le tiroir. Elle n'est <b>jamais publiée</b> (§12.3),
/// et elle n'est demandée qu'au moment où elle sert — jamais à l'amorce, où
/// §24.4 interdit le formulaire.</para>
///
/// <para>Une table plutôt qu'une colonne sur les événements : elle décrit la
/// personne, pas un moment, et la ranger dans le journal la rendrait
/// révisable par chaînage — alors qu'elle se corrige, simplement, et que
/// corriger doit <b>recalculer</b> tous les moments concernés plutôt que de
/// les réconcilier.</para>
/// </summary>
public sealed class PlayerProfileRow
{
    public required string UserId { get; set; }

    /// <summary>
    /// <c>null</c> tant qu'elle n'a pas été donnée — et c'est le cas normal.
    /// Zéro ou une année par défaut affirmeraient ce que personne n'a dit.
    /// </summary>
    public int? BirthYear { get; set; }
}
