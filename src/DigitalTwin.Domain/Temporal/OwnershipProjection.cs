namespace DigitalTwin.Domain.Temporal;

/// <summary>
/// Ce qu'on peut affirmer d'un état à une période donnée
/// (ORDONNANCEMENT-TEMPOREL §7.3).
///
/// Trois valeurs et non deux : « possédais-tu ce jeu en 1997 ? » n'admet pas
/// de réponse binaire quand l'acquisition est déclarée 1993–1997. Répondre
/// oui ou non fabriquerait une précision que sept variantes temporelles ont
/// été conçues pour refuser.
/// </summary>
public enum Certainty
{
    /// <summary>L'état vaut sur toute la période, sans doute possible.</summary>
    Certain,

    /// <summary>Les intervalles autorisent l'état sans le garantir.</summary>
    Possible,

    /// <summary>Aucun recouvrement possible.</summary>
    No,
}

/// <summary>Un exemplaire dont on veut savoir s'il était possédé.</summary>
public interface IOwnableItem
{
    string Id { get; }

    /// <summary>Quand il est entré dans la collection.</summary>
    TemporalValue AcquiredAt { get; }

    /// <summary>Quand il en est sorti. <c>null</c> : il y est toujours.</summary>
    TemporalValue? DisposedAt { get; }
}

/// <summary>
/// Une collection telle qu'à une période — <b>avec ses deux natures
/// séparées</b>.
///
/// §7.3 : « une collection telle qu'en 1997 dont la moitié est incertaine
/// doit le montrer ». Les deux listes existent donc toujours, quel que soit
/// le mode ; celui-ci décide seulement de ce qu'on <i>retient</i>, jamais de
/// ce qu'on <i>sait</i>.
/// </summary>
public sealed record CollectionAtPeriod<T>(
    QueryMode Mode,
    IReadOnlyList<T> Certain,
    IReadOnlyList<T> Possible) where T : IOwnableItem
{
    /// <summary>
    /// Ce que le mode retient : le certain seul en strict, le certain et le
    /// possible en permissif.
    /// </summary>
    public IReadOnlyList<T> Retained =>
        Mode == QueryMode.Strict ? Certain : [.. Certain, .. Possible];

    /// <summary>
    /// Les deux natures annoncées, <b>même à zéro</b> — une mention qui
    /// disparaîtrait quand elle vaut zéro empêcherait de distinguer « rien
    /// d'incertain » de « on ne vous le dit pas ».
    /// </summary>
    public string Summary => $"{Certain.Count} certains · {Possible.Count} possibles";
}

/// <summary>
/// Projette la possession sur une période (§7.3). Vaut pour toutes les
/// projections datées de MODELE-DE-DOMAINE §6 : collection à une date, taux
/// de complétion par période, périodes actives.
/// </summary>
public static class OwnershipProjection
{
    /// <summary>
    /// <b>Interprétation retenue, et elle a des conséquences aux bornes.</b>
    ///
    /// §7.3 écrit « l'acquisition se termine avant <c>D</c> » en traitant
    /// <c>D</c> comme un point, alors que les requêtes portent sur des
    /// périodes. On lit donc <c>Certain</c> comme « possédé <b>pendant toute
    /// la période</b> » : si l'acquisition peut tomber le premier jour de la
    /// période, la possession n'est pas garantie ce matin-là, et la réponse
    /// est <c>Possible</c>.
    ///
    /// L'autre lecture — « possédé à un moment quelconque de la période » —
    /// serait défendable, mais elle ferait répondre « certain » à des cas où
    /// l'utilisateur n'a rien affirmé de tel.
    /// </summary>
    public static Certainty OwnedDuring(
        TemporalValue acquired,
        TemporalValue? disposed,
        TemporalValue period,
        TemporalHorizon horizon)
    {
        var p = TemporalNormalizer.Normalize(period, horizon);
        var a = TemporalNormalizer.Normalize(acquired, horizon);
        var d = disposed is null ? null : TemporalNormalizer.Normalize(disposed, horizon);

        if (p is null)
        {
            // Aucune comparaison possible : on ne sait rien, ce qui n'est ni
            // un oui ni un non.
            return Certainty.Possible;
        }

        // Non : l'acquisition est certainement postérieure à la période, ou la
        // cession certainement antérieure.
        if (a is not null && a.Start > p.End)
        {
            return Certainty.No;
        }
        if (d is not null && d.End < p.Start)
        {
            return Certainty.No;
        }

        // Certain : l'acquisition est achevée avant le début de la période, et
        // aucune cession ne peut la précéder — ou il n'y a pas de cession.
        var acquisitionSure = a is not null && a.End < p.Start;

        // ⚠️ « Aucune cession déclarée » et « cession déclarée mais non datée »
        // sont deux choses différentes, et les confondre affirmait qu'un
        // joueur ayant dit « je l'ai vendu, je ne sais plus quand » possédait
        // CERTAINEMENT encore le jeu. Une cession sans date peut avoir
        // précédé la période.
        var cessionDeclaree = disposed is not null;
        var cessionSure = !cessionDeclaree || (d is not null && d.Start > p.End);

        return acquisitionSure && cessionSure ? Certainty.Certain : Certainty.Possible;
    }

    public static CollectionAtPeriod<T> At<T>(
        IEnumerable<T> items,
        TemporalValue period,
        QueryMode mode,
        TemporalHorizon horizon) where T : IOwnableItem
    {
        var certains = new List<T>();
        var possibles = new List<T>();

        foreach (var item in items)
        {
            switch (OwnedDuring(item.AcquiredAt, item.DisposedAt, period, horizon))
            {
                case Certainty.Certain:
                    certains.Add(item);
                    break;
                case Certainty.Possible:
                    possibles.Add(item);
                    break;
                // Certainty.No : n'apparaît dans aucune des deux listes.
            }
        }

        return new CollectionAtPeriod<T>(mode, certains, possibles);
    }
}
