using DigitalTwin.Domain.Temporal;

namespace DigitalTwin.Api.Selection;

/// <summary>
/// La période choisie à la passe 1 de la sélection massive (§24.3).
///
/// <para><b>Le modèle a sept variantes, l'écran en montre trois</b> — une
/// année, « plutôt une période », « je ne sais plus » — et le repli de
/// précision en ajoute une quatrième, « vers ». Exposer l'énumération
/// complète ferait remonter le modèle dans l'interface
/// ([principes transverses](../../../ecrans/00-principes-transverses.md),
/// principe 9).</para>
///
/// <para>Cette période n'est pas une donnée de l'événement : c'est le
/// <b>défaut appliqué aux déclarations suivantes</b>. La modifier ne réécrit
/// pas celles déjà faites (E02, repère A).</para>
/// </summary>
/// <param name="Kind">year · range · approximate · unknown</param>
/// <param name="Year">Pour year et approximate.</param>
/// <param name="From">Début, pour range.</param>
/// <param name="To">Fin, pour range. <c>null</c> = période encore ouverte.</param>
/// <param name="Margin">Marge de « vers ». Jamais nulle — voir ci-dessous.</param>
public sealed record PeriodInput(
    string Kind,
    int? Year = null,
    int? From = null,
    int? To = null,
    int? Margin = null)
{
    /// <summary>
    /// La marge retenue quand l'écran dit « vers » sans la préciser.
    ///
    /// <para>Deux ans, comme l'exemple de MODELE-DE-DOMAINE §3 — « vers
    /// 1994 », soit 1994 ± 2. <b>Jamais zéro</b> : une marge nulle dirait
    /// exactement ce que dit une année, et deux façons d'exprimer la même
    /// chose finissent toujours par diverger.</para>
    /// </summary>
    public const int MargeParDefaut = 2;

    /// <summary>
    /// Traduit le choix de l'écran en valeur du domaine.
    ///
    /// <para><b>Un genre inconnu est refusé, pas replié sur « je ne sais
    /// plus ».</b> Les confondre transformerait une faute de l'appelant en
    /// souvenir sans date, et le joueur verrait son jeu glisser dans la zone
    /// sans date sans que rien ne l'explique.</para>
    /// </summary>
    public TemporalValue ToTemporalValue() => Kind switch
    {
        "year" => new Year(Exige(Year, "year")),

        // La fin reste facultative : « depuis 1994 » est une période sans fin
        // connue, et la refermer sur son début inventerait une information.
        "range" => new YearRange(Exige(From, "from"), To),

        // « vers » ne devient JAMAIS une année exacte, même si l'appelant
        // omet la marge : c'est précisément l'imprécision que l'utilisateur a
        // déclarée, et l'aplatir la ferait disparaître sans trace.
        "approximate" => new ApproximateYear(
            Exige(Year, "year"),
            Margin is { } m && m >= 1 ? m : MargeParDefaut),

        "unknown" => Unknown.Instance,

        _ => throw new ArgumentException(
            $"Genre de période inconnu : « {Kind} ». Attendu : year, range, "
            + "approximate ou unknown."),
    };

    private int Exige(int? valeur, string champ)
        => valeur ?? throw new ArgumentException(
            $"Le champ « {champ} » est requis pour une période de genre « {Kind} ».");
}
