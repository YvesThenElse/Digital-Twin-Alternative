using DigitalTwin.Domain.Temporal;

namespace DigitalTwin.Domain.Player;

/// <summary>
/// La fiabilité d'un souvenir, <b>dérivée de sa granularité</b>
/// (MODELE-DE-DOMAINE §7, invariant 4).
///
/// Elle ne se demande jamais : faire noter à quelqu'un la fiabilité de son
/// propre souvenir ajoute une décision à chaque saisie pour une information
/// que le choix de granularité donne déjà.
/// </summary>
public enum ConfidenceLevel
{
    /// <summary>Aucune date — rien à qualifier.</summary>
    None,

    /// <summary>Une période, un « vers », un âge.</summary>
    Low,

    /// <summary>Une année.</summary>
    Medium,

    /// <summary>Une date exacte ou un mois.</summary>
    High,
}

/// <summary>Les types d'événements de MODELE-DE-DOMAINE §5. Liste fermée.</summary>
public static class PlayerEventType
{
    // Expérience
    public const string DiscoveredGame = nameof(DiscoveredGame);
    public const string StartedGame = nameof(StartedGame);
    public const string CompletedGame = nameof(CompletedGame);
    public const string AbandonedGame = nameof(AbandonedGame);
    public const string ReplayedGame = nameof(ReplayedGame);

    // Possession — vaut aussi pour le matériel (§4.3)
    public const string AcquiredItem = nameof(AcquiredItem);
    public const string SoldItem = nameof(SoldItem);
    public const string LostItem = nameof(LostItem);
    public const string LentItem = nameof(LentItem);
    public const string BorrowedItem = nameof(BorrowedItem);
    public const string ReturnedItem = nameof(ReturnedItem);

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.Ordinal)
    {
        DiscoveredGame, StartedGame, CompletedGame, AbandonedGame, ReplayedGame,
        AcquiredItem, SoldItem, LostItem, LentItem, BorrowedItem, ReturnedItem,
    };
}

/// <summary>Ce sur quoi porte un événement : œuvre, sortie, édition, plateforme…</summary>
public sealed record EventTarget(string Kind, string Id);

/// <summary>
/// Un moment déclaré du parcours — <b>un souvenir, pas un fait observé</b>
/// (MODELE-DE-DOMAINE §5).
///
/// <para><b>Deux axes temporels, et c'est la différence structurante</b> avec
/// un event sourcing classique. <see cref="OccurredAt"/> dit quand cela s'est
/// produit dans la vie du joueur — incertain. <see cref="RecordedAt"/> dit
/// quand la déclaration a été enregistrée — exact. Les confondre rend
/// impossibles à la fois la timeline et l'audit.</para>
///
/// <para>Le journal est <b>en ajout seul</b> : corriger ne réécrit pas, cela
/// chaîne un nouvel événement et marque l'ancien comme remplacé (§5.3).</para>
/// </summary>
public sealed record PlayerEvent : ISortableMoment
{
    public PlayerEvent(
        string id,
        string userId,
        string type,
        EventTarget target,
        TemporalValue occurredAt,
        DateTime recordedAt)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            throw new ArgumentException("Identifiant d'événement manquant.", nameof(id));
        }
        // Invariant 11 : tout enregistrement de USER DATA est joignable par
        // UserId seul — c'est la condition de la purge (§10.1).
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new ArgumentException(
                "UserId manquant : la purge par utilisateur deviendrait impossible.",
                nameof(userId));
        }
        if (!PlayerEventType.All.Contains(type))
        {
            throw new ArgumentException(
                $"Type d'événement inconnu : « {type} ». La liste de §5 est fermée.",
                nameof(type));
        }
        // Invariant 1. `Unknown` est une réponse valide, `null` n'en est pas
        // une : le premier dit « je ne sais plus », le second ne dit rien.
        ArgumentNullException.ThrowIfNull(occurredAt);
        if (recordedAt == default)
        {
            throw new ArgumentException(
                "RecordedAt manquant : sans lui, ni audit ni annulation.",
                nameof(recordedAt));
        }

        Id = id;
        UserId = userId;
        Type = type;
        Target = target;
        OccurredAt = occurredAt;
        RecordedAt = recordedAt;
    }

    public string Id { get; init; }
    public string UserId { get; init; }
    public string Type { get; init; }
    public EventTarget Target { get; init; }

    /// <summary>Quand cela s'est produit dans la vie du joueur — incertain.</summary>
    public TemporalValue OccurredAt { get; init; }

    /// <summary>Quand la déclaration a été enregistrée — exact.</summary>
    public DateTime RecordedAt { get; init; }

    /// <summary>
    /// <b>Dérivée, jamais saisie</b> (invariant 4). Sans accesseur en
    /// écriture ni paramètre de construction : si elle pouvait être assignée,
    /// une interface finirait par la demander.
    /// </summary>
    public ConfidenceLevel Confidence => DeriveConfidence(OccurredAt);

    /// <summary>
    /// L'événement qui corrige celui-ci, s'il existe. Le journal étant en
    /// ajout seul, la révision se chaîne — elle est « conservée côté système
    /// sans être exposée » à l'utilisateur (§5.3).
    /// </summary>
    public string? SupersededByEventId { get; private init; }

    public PlayerEvent SupersededBy(string correctionEventId) =>
        this with { SupersededByEventId = correctionEventId };

    // --- contrat de tri (item 05) ---------------------------------------
    string? ISortableMoment.SubjectId => Target.Id;
    string? ISortableMoment.Kind => Type;

    /// <summary>Exposé pour la lecture ; le tri passe par l'interface.</summary>
    public string SubjectId => Target.Id;

    public string Kind => Type;

    private static ConfidenceLevel DeriveConfidence(TemporalValue value) => value switch
    {
        ExactDate or Month => ConfidenceLevel.High,
        Year => ConfidenceLevel.Medium,
        // `Age` est une approximation par nature — la fenêtre de deux années
        // civiles porte son imprécision. La confiance ne dépend PAS de savoir
        // si on peut la résoudre : l'année de naissance manquante est notre
        // lacune, pas celle du souvenir.
        YearRange or ApproximateYear or Age => ConfidenceLevel.Low,
        _ => ConfidenceLevel.None,
    };
}
