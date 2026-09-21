using DigitalTwin.Domain.Player;
using DigitalTwin.Domain.Temporal;

namespace DigitalTwin.Api.Persistence;

/// <summary>
/// La traduction entre le domaine et la ligne, dans les deux sens.
///
/// <para><b>Elle est exhaustive par construction.</b> La hiérarchie de
/// <c>TemporalValue</c> est fermée : une huitième variante ne peut pas
/// apparaître sans modifier son fichier, et l'expression <c>switch</c>
/// ci-dessous échoue alors à la compilation plutôt que de perdre la valeur en
/// silence.</para>
/// </summary>
public static class PlayerEventMapping
{
    private const string KindExactDate = "ExactDate";
    private const string KindMonth = "Month";
    private const string KindYear = "Year";
    private const string KindYearRange = "YearRange";
    private const string KindApproximateYear = "ApproximateYear";
    private const string KindAge = "Age";
    private const string KindUnknown = "Unknown";

    public static PlayerEventRow ToRow(PlayerEvent e)
    {
        var ligne = new PlayerEventRow
        {
            Id = e.Id,
            UserId = e.UserId,
            Type = e.Type,
            TargetKind = e.Target.Kind,
            TargetId = e.Target.Id,
            RecordedAt = e.RecordedAt,
            BatchId = e.BatchId,
            PlatformId = e.PlatformId,
            SupersededByEventId = e.SupersededByEventId,
        };
        Ecrire(e.OccurredAt, ligne);
        return ligne;
    }

    private static void Ecrire(TemporalValue valeur, PlayerEventRow l)
    {
        switch (valeur)
        {
            case ExactDate v:
                l.OccurredKind = KindExactDate; l.OccurredDate = v.Date; break;
            case Month v:
                l.OccurredKind = KindMonth; l.OccurredYear = v.Year;
                l.OccurredMonth = v.MonthOfYear; break;
            case Year v:
                l.OccurredKind = KindYear; l.OccurredYear = v.Value; break;
            case YearRange v:
                // La fin est NULLABLE : « depuis 1994 » est une période sans
                // fin connue. Sept variantes, mais huit formes en base — et
                // la huitième est celle qu'on oublie.
                l.OccurredKind = KindYearRange; l.OccurredYear = v.StartYear;
                l.OccurredEndYear = v.EndYear; break;
            case ApproximateYear v:
                l.OccurredKind = KindApproximateYear; l.OccurredYear = v.Year;
                l.OccurredMargin = v.Margin; break;
            case Age v:
                // Stocké BRUT (invariant 3) : convertir à l'écriture rendrait
                // impossible de recalculer tous les moments quand l'année de
                // naissance est renseignée plus tard.
                l.OccurredKind = KindAge; l.OccurredAge = v.Years; break;
            case Unknown:
                l.OccurredKind = KindUnknown; break;
            default:
                throw new NotSupportedException(
                    $"Variante temporelle non traduite : {valeur.GetType().Name}. "
                    + "La hiérarchie est fermée — ajouter ici ET dans Lire().");
        }
    }

    public static PlayerEvent ToDomain(PlayerEventRow l)
    {
        var evenement = new PlayerEvent(
            l.Id, l.UserId, l.Type,
            new EventTarget(l.TargetKind, l.TargetId),
            Lire(l),
            // Npgsql rend un DateTime en Utc pour timestamptz ; on l'exige
            // plutôt que de le supposer.
            DateTime.SpecifyKind(l.RecordedAt, DateTimeKind.Utc))
        {
            BatchId = l.BatchId,
            PlatformId = l.PlatformId,
        };

        return l.SupersededByEventId is null
            ? evenement
            : evenement.SupersededBy(l.SupersededByEventId);
    }

    private static TemporalValue Lire(PlayerEventRow l) => l.OccurredKind switch
    {
        KindExactDate => new ExactDate(l.OccurredDate!.Value),
        KindMonth => new Month(l.OccurredYear!.Value, l.OccurredMonth!.Value),
        KindYear => new Year(l.OccurredYear!.Value),
        // `OccurredEndYear` reste `null` pour une période ouverte : le
        // déréférencer forcerait une fin qui n'a jamais été déclarée.
        KindYearRange => new YearRange(l.OccurredYear!.Value, l.OccurredEndYear),
        KindApproximateYear => new ApproximateYear(l.OccurredYear!.Value, l.OccurredMargin!.Value),
        KindAge => new Age(l.OccurredAge!.Value),
        KindUnknown => Unknown.Instance,
        _ => throw new NotSupportedException(
            $"Variante temporelle inconnue en base : « {l.OccurredKind} ». "
            + "Une donnée écrite par une version plus récente ne doit pas être "
            + "lue comme « inconnue » : ce serait perdre un souvenir en silence."),
    };
}
