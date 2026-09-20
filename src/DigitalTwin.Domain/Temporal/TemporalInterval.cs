namespace DigitalTwin.Domain.Temporal;

/// <summary>
/// La forme normale d'une <see cref="TemporalValue"/> : un intervalle fermé
/// au jour, plus une clé de tri.
///
/// ORDONNANCEMENT-TEMPOREL §2.2 pose deux règles, et le type les porte toutes
/// les deux plutôt que de les confier à la discipline de l'appelant.
///
/// <b>La normalisation ajoute, elle ne remplace pas.</b> <see cref="Source"/>
/// conserve la valeur d'origine. <c>Year(1994)</c> et <c>YearRange(1994,
/// 1994)</c> produisent le même intervalle et ne s'affichent pas pareil — un
/// point creux contre une bande. Ne garder que l'intervalle perdrait ce que
/// l'utilisateur a dit, sans que rien ne le signale.
///
/// <b>La clé de tri n'est pas une date.</b> <see cref="SortKey"/> est
/// <c>internal</c> : elle ne sort pas du domaine, donc aucune interface ne
/// peut l'afficher par inadvertance. Le milieu de <c>Year(1994)</c> est le
/// 2 juillet 1994 — une date que personne n'a jamais prononcée, et dont
/// l'affichage fabriquerait exactement la précision que §7.4 interdit.
/// </summary>
public sealed record TemporalInterval
{
    internal TemporalInterval(TemporalValue source, DateOnly start, DateOnly end)
    {
        if (end < start)
        {
            throw new ArgumentException(
                $"Intervalle inversé : {start} → {end} (issu de {source.GetType().Name}).",
                nameof(end));
        }

        Source = source;
        Start = start;
        End = end;
        // Milieu en jours, arrondi vers le bas (§2.1). Le calcul passe par le
        // nombre de jours et non par les ticks : c'est ce qui rend la valeur
        // indépendante du fuseau et de l'heure d'exécution.
        SortKey = start.AddDays((end.DayNumber - start.DayNumber) / 2);
    }

    /// <summary>La valeur d'origine, conservée telle quelle.</summary>
    public TemporalValue Source { get; }

    /// <summary>Première date possible, incluse.</summary>
    public DateOnly Start { get; }

    /// <summary>Dernière date possible, incluse.</summary>
    public DateOnly End { get; }

    /// <summary>
    /// Point représentatif, réservé au tri. <b>Ne jamais afficher, exporter,
    /// ni faire entrer dans un chiffre annoncé à l'utilisateur.</b>
    /// </summary>
    internal DateOnly SortKey { get; }

    /// <summary>Largeur en jours. Sert au départage (item 05), pas au rendu.</summary>
    internal int WidthInDays => End.DayNumber - Start.DayNumber;
}
