namespace DigitalTwin.Domain.Temporal;

/// <summary>
/// Projette une <see cref="TemporalValue"/> vers sa forme normale, selon la
/// table de ORDONNANCEMENT-TEMPOREL §2.1.
///
/// Trois valeurs n'ont <b>aucun</b> intervalle, et la fonction rend
/// <c>null</c> plutôt que d'en inventer un :
///
/// <list type="bullet">
/// <item><c>Unknown</c> — invariant 2 : jamais projeté sur un axe.</item>
/// <item><c>Age</c> non résolu — §7.6 : sans année de naissance, il se
/// comporte comme <c>Unknown</c>. Sa résolution appartient à l'item 07.</item>
/// <item>une période <b>ouverte</b> — §2.3 : la borne manquante se ferme sur
/// l'horizon de domaine, qui dépend de l'utilisateur et du jour. L'horizon
/// arrive à l'item 03.</item>
/// </list>
///
/// Rendre <c>null</c> est la réponse honnête : un intervalle fabriqué se
/// lirait comme une donnée normale et ne lèverait jamais d'erreur.
/// </summary>
public static class TemporalNormalizer
{
    public static TemporalInterval? Normalize(TemporalValue value) => value switch
    {
        ExactDate d => Interval(d, d.Date, d.Date),

        Month m => Interval(m,
            new DateOnly(m.Year, m.MonthOfYear, 1),
            new DateOnly(m.Year, m.MonthOfYear,
                         DateTime.DaysInMonth(m.Year, m.MonthOfYear))),

        Year y => Interval(y, FirstDayOf(y.Value), LastDayOf(y.Value)),

        YearRange { EndYear: { } fin } r =>
            Interval(r, FirstDayOf(r.StartYear), LastDayOf(fin)),

        ApproximateYear a =>
            Interval(a, FirstDayOf(a.Year - a.Margin), LastDayOf(a.Year + a.Margin)),

        // Période ouverte, Age non résolu, Unknown : pas d'intervalle ici.
        _ => null,
    };

    /// <summary>
    /// Normalise en fermant les bornes manquantes sur l'horizon (§2.3).
    ///
    /// Une période ouverte s'étend jusqu'au plafond, mais <b>se trie sur sa
    /// borne connue</b> : le plafond bouge chaque jour, et un élément qui
    /// change de place entre deux visites détruit la confiance dans un écran
    /// qu'on revient consulter.
    /// </summary>
    public static TemporalInterval? Normalize(TemporalValue value, TemporalHorizon horizon)
    {
        if (value is Age age)
        {
            return ResolveAge(age, horizon);
        }

        if (value is not YearRange { EndYear: null } ouverte)
        {
            // Rien d'ouvert : l'horizon ne doit RIEN changer. Il est un
            // artefact de tri, pas une donnée.
            return Normalize(value);
        }

        var debut = FirstDayOf(ouverte.StartYear);
        if (debut > horizon.Ceiling)
        {
            // « Un souvenir ne se situe pas dans l'avenir. » Fermer sur le
            // plafond donnerait un intervalle inversé.
            //
            // On ne refuse pas pour autant — invariant 10 : une incohérence
            // produit un avertissement, jamais un refus. La valeur reste
            // valide et rejoint les moments sans date, comme Unknown.
            return null;
        }

        return new TemporalInterval(ouverte, debut, horizon.Ceiling, sortKey: debut);
    }

    /// <summary>
    /// Résout « j'avais x ans » à la lecture (§8).
    ///
    /// <para>Avec la seule année de naissance, la fenêtre couvre <b>deux
    /// années civiles</b> : sans connaître le jour de l'anniversaire, on
    /// ignore dans laquelle des deux le souvenir tombe. Cette largeur n'est
    /// pas un défaut — c'est elle qui porte l'imprécision de « vers mes
    /// 12 ans », et c'est pourquoi le type refuse une marge en plus.</para>
    ///
    /// <para>La résolution se fait <b>ici et jamais à l'écriture</b> : c'est
    /// ce qui permet à une correction de l'année de naissance de recalculer
    /// tous les moments concernés plutôt que de les réconcilier.</para>
    /// </summary>
    private static TemporalInterval? ResolveAge(Age age, TemporalHorizon horizon)
    {
        if (horizon.EffectiveBirthYear is not { } naissance)
        {
            // §7.6 : sans année de naissance, Age se comporte comme Unknown.
            return null;
        }

        DateOnly debut, fin;
        if (horizon.BirthDate is { } jour)
        {
            debut = jour.AddYears(age.Years);
            fin = jour.AddYears(age.Years + 1).AddDays(-1);
        }
        else
        {
            debut = FirstDayOf(naissance + age.Years);
            fin = LastDayOf(naissance + age.Years + 1);
        }

        if (debut > horizon.Ceiling)
        {
            // « Un souvenir ne se situe pas dans l'avenir » (§2.3). Non
            // plaçable, mais jamais refusé (invariant 10) : le moment rejoint
            // le tiroir, comme un Unknown.
            return null;
        }

        // La fenêtre peut déborder sur l'avenir sans y commencer — on la
        // ferme sur le plafond plutôt que de laisser dépasser.
        if (fin > horizon.Ceiling)
        {
            fin = horizon.Ceiling;
        }

        return new TemporalInterval(age, debut, fin);
    }

    private static TemporalInterval Interval(TemporalValue source, DateOnly start, DateOnly end)
        => new(source, start, end);

    private static DateOnly FirstDayOf(int year) => new(year, 1, 1);

    private static DateOnly LastDayOf(int year) => new(year, 12, 31);
}
