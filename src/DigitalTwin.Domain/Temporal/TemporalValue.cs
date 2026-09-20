namespace DigitalTwin.Domain.Temporal;

/// <summary>
/// La valeur temporelle d'un souvenir — sept variantes, pas une de plus.
///
/// MODELE-DE-DOMAINE §3 : c'est un <b>type valeur, jamais une entité</b>.
/// Toute date de la vie du joueur passe par lui ; aucun <c>DateTime</c> nu
/// n'existe dans les données utilisateur.
///
/// La hiérarchie est <b>fermée</b> : le constructeur est privé au sous-type,
/// donc rien hors de ce fichier ne peut ajouter une huitième variante. Ce
/// n'est pas de la rigidité — le modèle a explicitement refusé d'ajouter
/// <c>RelativeToRelease</c>, au motif qu'un mode de saisie n'est pas une
/// variante. Fermer la hiérarchie rend ce refus tenable dans le temps.
///
/// L'intervalle et le point représentatif <b>ne sont pas ici</b> : ils sont
/// dérivés, jamais primaires (ORDONNANCEMENT-TEMPOREL §2.2). Les stocker dans
/// le type reviendrait à perdre ce que l'utilisateur a dit.
/// </summary>
public abstract record TemporalValue
{
    // Constructeur interne : ferme la hiérarchie aux seuls types de ce fichier.
    private protected TemporalValue() { }

    /// <summary>Bornes d'année admises, alignées sur <see cref="DateOnly"/>.</summary>
    internal const int MinYear = 1;
    internal const int MaxYear = 9999;

    internal static int CheckYear(int year, string paramName)
    {
        if (year is < MinYear or > MaxYear)
        {
            throw new ArgumentOutOfRangeException(
                paramName, year,
                $"Année hors bornes : {year}. Attendu entre {MinYear} et {MaxYear}.");
        }
        return year;
    }
}

/// <summary>Une date au jour près — « 15 mars 1994 ».</summary>
public sealed record ExactDate(DateOnly Date) : TemporalValue;

/// <summary>Un mois — « mars 1994 ».</summary>
public sealed record Month : TemporalValue
{
    public Month(int year, int month)
    {
        Year = CheckYear(year, nameof(year));
        if (month is < 1 or > 12)
        {
            throw new ArgumentOutOfRangeException(
                nameof(month), month,
                $"Mois hors bornes : {month}. Attendu entre 1 et 12.");
        }
        MonthOfYear = month;
    }

    public int Year { get; }
    public int MonthOfYear { get; }
}

/// <summary>Une année — « 1994 ». La granularité la plus fréquente.</summary>
public sealed record Year : TemporalValue
{
    public Year(int value) => Value = CheckYear(value, nameof(value));

    public int Value { get; }
}

/// <summary>
/// Une période — « 1993–1997 », ou « à partir de 2001 » quand la fin est
/// inconnue (ORDONNANCEMENT-TEMPOREL §2.3 : « bien plus tard »).
///
/// Nommé <c>YearRange</c> et non <c>Range</c> : <c>System.Range</c> existe
/// déjà en C# et la collision produirait des erreurs obscures à l'usage.
/// </summary>
public sealed record YearRange : TemporalValue
{
    public YearRange(int startYear, int? endYear)
    {
        StartYear = CheckYear(startYear, nameof(startYear));
        if (endYear is { } fin)
        {
            CheckYear(fin, nameof(endYear));
            if (fin < startYear)
            {
                throw new ArgumentException(
                    $"Période inversée : début {startYear}, fin {fin}. " +
                    "La fin ne peut pas précéder le début.",
                    nameof(endYear));
            }
        }
        EndYear = endYear;
    }

    public int StartYear { get; }

    /// <summary><c>null</c> quand la période n'a pas de fin connue.</summary>
    public int? EndYear { get; }

    public bool IsOpenEnded => EndYear is null;
}

/// <summary>
/// Une année approchée — « vers 1994 », soit 1994 ± 2.
///
/// La marge est strictement positive : une marge nulle dirait exactement ce
/// que dit <see cref="Year"/>, et deux façons d'exprimer la même chose
/// finissent toujours par diverger.
/// </summary>
public sealed record ApproximateYear : TemporalValue
{
    public ApproximateYear(int year, int margin)
    {
        Year = CheckYear(year, nameof(year));
        if (margin < 1)
        {
            throw new ArgumentOutOfRangeException(
                nameof(margin), margin,
                $"Marge invalide : {margin}. Une marge nulle équivaudrait à Year({year}).");
        }
        Margin = margin;
    }

    public int Year { get; }
    public int Margin { get; }
}

/// <summary>
/// Un âge — « vers mes 12 ans ».
///
/// MODELE-DE-DOMAINE §3, règle 3 : <b>stocké brut, jamais converti à
/// l'écriture</b>. Le type n'expose donc aucune année : corriger l'année de
/// naissance doit recalculer tous les moments concernés, ce qu'une conversion
/// anticipée rendrait impossible. La résolution appartient à l'item 07.
/// </summary>
public sealed record Age : TemporalValue
{
    /// <summary>Borne haute de vraisemblance ; au-delà, c'est une faute de saisie.</summary>
    internal const int MaxYears = 150;

    public Age(int years)
    {
        if (years is < 0 or > MaxYears)
        {
            throw new ArgumentOutOfRangeException(
                nameof(years), years,
                $"Âge invraisemblable : {years}. Attendu entre 0 et {MaxYears}.");
        }
        Years = years;
    }

    public int Years { get; }
}

/// <summary>
/// Aucune date — « je ne sais plus ».
///
/// C'est une réponse valide et fréquente, pas un échec de saisie. Elle n'a
/// pas d'état, donc une seule instance suffit.
/// </summary>
public sealed record Unknown : TemporalValue
{
    public static Unknown Instance { get; } = new();

    private Unknown() { }
}
