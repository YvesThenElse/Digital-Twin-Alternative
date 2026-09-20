namespace DigitalTwin.Domain.Temporal;

/// <summary>
/// L'horizon de domaine : ce qui ferme une borne manquante
/// (ORDONNANCEMENT-TEMPOREL §2.3).
///
/// <para><b>Le jour est reçu, jamais lu d'une horloge.</b> La note
/// d'implémentation de §10 l'exige : sans cela, les vecteurs T7 et T11
/// deviennent non reproductibles, et une suite de tests qui dépend du jour
/// où on l'exécute ne protège plus rien.</para>
///
/// <para><b>L'horizon ne s'écrit jamais dans la donnée.</b> C'est un artefact
/// de rendu et de tri. Corriger une année de naissance doit recalculer, pas
/// réconcilier — ce qui suppose que rien n'ait été figé à l'écriture.</para>
/// </summary>
/// <param name="Ceiling">Aujourd'hui. Un souvenir ne se situe pas dans l'avenir.</param>
/// <param name="BirthYear">
/// Année de naissance si elle est connue. Facultative : elle n'est demandée
/// que pour situer les souvenirs, et n'est jamais publiée (§7.6, §12.3).
/// </param>
public readonly record struct TemporalHorizon(DateOnly Ceiling, int? BirthYear)
{
    /// <summary>
    /// Avant l'apparition du jeu vidéo domestique, il n'y a rien à déclarer.
    /// </summary>
    public const int DefaultFloorYear = 1972;

    /// <summary>
    /// Plancher : l'année de naissance si elle est connue, 1972 sinon.
    /// </summary>
    public int FloorYear => BirthYear ?? DefaultFloorYear;
}
