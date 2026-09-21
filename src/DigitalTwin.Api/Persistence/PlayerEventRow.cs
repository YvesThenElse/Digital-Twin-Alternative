namespace DigitalTwin.Api.Persistence;

/// <summary>
/// La ligne telle qu'elle est stockée. <b>Volontairement distincte du type de
/// domaine.</b>
///
/// <para><see cref="DigitalTwin.Domain.Player.PlayerEvent"/> est une
/// hiérarchie fermée d'enregistrements immuables, avec une confiance dérivée
/// et des invariants vérifiés au constructeur. La plier aux exigences d'un
/// ORM — constructeur sans paramètre, propriétés assignables — reviendrait à
/// défaire ce qui le rend sûr. La traduction se fait donc explicitement, dans
/// <see cref="PlayerEventMapping"/>.</para>
///
/// <para>Les sept variantes de <c>TemporalValue</c> sont **aplaties en
/// colonnes** plutôt que sérialisées en JSON : une base qu'on peut lire en
/// SQL pendant une session de test vaut mieux qu'un document opaque, et la
/// forme normale en intervalle reste dérivée, jamais stockée
/// (ORDONNANCEMENT-TEMPOREL §2.2).</para>
/// </summary>
public sealed class PlayerEventRow
{
    public string Id { get; set; } = "";

    /// <summary>
    /// Invariant 11 : tout enregistrement personnel est joignable par lui
    /// seul. Il fait partie de la clé primaire pour qu'un partitionnement par
    /// utilisateur (§10.1) reste une migration, pas un changement de modèle.
    /// </summary>
    public string UserId { get; set; } = "";

    public string Type { get; set; } = "";
    public string TargetKind { get; set; } = "";
    public string TargetId { get; set; } = "";

    // --- les sept variantes, aplaties -----------------------------------
    public string OccurredKind { get; set; } = "";
    public DateOnly? OccurredDate { get; set; }
    public int? OccurredYear { get; set; }
    public int? OccurredMonth { get; set; }
    public int? OccurredEndYear { get; set; }
    public int? OccurredMargin { get; set; }
    public int? OccurredAge { get; set; }

    /// <summary>
    /// Le lot de saisie. Indexé avec <c>UserId</c> : c'est par lui qu'on
    /// reconnaît un lot déjà enregistré, et par lui que la timeline regroupe
    /// un épisode.
    /// </summary>
    public string? BatchId { get; set; }

    /// <summary>L'axe exact. <c>timestamptz</c> : jamais de date locale ici.</summary>
    public DateTime RecordedAt { get; set; }

    /// <summary>
    /// L'événement qui corrige celui-ci. C'est la <b>seule</b> colonne que la
    /// base autorise à modifier, et une seule fois — voir le déclencheur de
    /// la migration initiale.
    /// </summary>
    public string? SupersededByEventId { get; set; }
}
