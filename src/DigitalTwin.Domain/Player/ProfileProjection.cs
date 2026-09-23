using DigitalTwin.Domain.Temporal;

namespace DigitalTwin.Domain.Player;

/// <summary>
/// Le début de l'histoire — le premier moment <b>joué</b> qui tienne sur
/// l'axe (E04, bloc A).
///
/// <para><b>Le même que celui que la timeline montre en premier</b>, parce
/// qu'il vient du même tri. Le recalculer autrement ferait dire « vers 1991 »
/// à l'en-tête au-dessus d'un axe qui commence en 1990, et rien ne
/// signalerait la contradiction.</para>
/// </summary>
/// <param name="OccurredAt">
/// La valeur déclarée, <b>brute</b> : c'est l'écran qui la met en mots, avec
/// sa granularité (« vers 1991 » n'est pas « 1991 »).
/// </param>
/// <param name="PlatformId">
/// La machine de ce premier moment. <c>null</c> quand la déclaration n'est
/// pas venue d'une sélection par machine — le domaine ne la devine pas.
/// </param>
/// <param name="Years">
/// Les années écoulées depuis l'année déclarée. <c>null</c> sous un an :
/// « depuis ≈ 0 ans » n'est pas une phrase, et l'absence de durée est une
/// réponse là où un zéro n'en est pas une.
///
/// <para>Elle est <b>toujours approchée</b>, et l'écran doit le dire. Pas
/// seulement parce que la date est floue : le premier moment DÉCLARÉ n'est
/// pas le premier moment vécu. L'approximation est dans la prémisse.</para>
/// </param>
public sealed record ProfileOpening(
    TemporalValue OccurredAt, string? PlatformId, int? Years);

/// <summary>
/// Une décennie de l'histoire, et ce qu'elle porte (E04, bloc ⒟).
/// </summary>
/// <param name="Decade">L'année de début : 1990, 2000…</param>
/// <param name="Moments">
/// Combien de moments s'y situent. <b>Zéro est une valeur</b>, pas une
/// absence : c'est le creux qui fait dire « c'est vrai, j'ai peu joué entre
/// 2005 et 2010 », et retirer les décennies vides supprimerait précisément
/// ce que la bande existe pour montrer.
/// </param>
public sealed record ActivitySlice(int Decade, int Moments);

/// <summary>
/// L'étendue de l'histoire — ses deux bornes, d'un seul regard (E04, bloc ⒞).
///
/// <para><b>Elle ne va pas jusqu'à aujourd'hui</b>, contrairement à la bande
/// de densité ⒟. Les deux blocs se partagent le temps : la bande montre le
/// SILENCE, jusqu'à aujourd'hui, parce qu'une histoire qui s'arrête en 2010
/// doit montrer quinze ans de creux ; la ligne montre l'ÉTENDUE DÉCLARÉE,
/// « 1991 → 2019 ». Les faire courir toutes deux jusqu'à aujourd'hui les
/// ferait dire la même chose, sur un écran dont la densité doit rester faille
/// (E04, principe 3) — et la ligne perdrait la place qu'elle doit gagner.</para>
///
/// <para><b>Les bornes sont un minimum et un maximum, pas la première et la
/// dernière entrée de l'axe.</b> L'axe trie par point représentatif — le
/// milieu, pour une période — tandis que l'année montrée est celle qui a été
/// DÉCLARÉE, soit le début. Une période 1985–2005 arrivant après un
/// <c>Year(1990)</c> rendrait « 1990 → 1985 » : une ligne à l'envers.</para>
/// </summary>
/// <param name="FirstYear">La plus ancienne année déclarée sur l'axe.</param>
/// <param name="LastYear">
/// La plus récente. <b>Égale à <paramref name="FirstYear"/></b> quand
/// l'histoire tient en une année : un point est une ligne dont les bornes
/// coïncident, et rendre <c>null</c> en ferait un cas particulier que chaque
/// écran devrait traiter.
/// </param>
public sealed record ProfileSpan(int FirstYear, int LastYear);

/// <summary>
/// Ce que l'en-tête de <c>/mon-histoire</c> a le droit de dire du joueur.
/// </summary>
/// <param name="Moments">Tout le journal — ce qui décide du seuil, rien de plus.</param>
public sealed record ProfileSummary(
    int Moments,
    int Consoles,
    int GamesDeclared,
    int Finished,
    int MemoriesWritten,
    ProfileOpening? Opening,
    IReadOnlyList<ActivitySlice> Activity,
    ProfileSpan? Span)
{
    /// <summary>
    /// Le seuil de E04 : « Trop maigre pour un portrait (moins de ~10
    /// moments) : afficher la phrase et l'amorce de timeline, <b>masquer les
    /// chiffres</b> […]. Des statistiques calculées sur cinq jeux détruisent
    /// la crédibilité de l'écran — c'est le principal risque de cette page. »
    /// </summary>
    public const int PortraitThreshold = 10;

    /// <summary>
    /// Y a-t-il assez de matière pour un portrait ?
    ///
    /// <para>C'est une question de DOMAINE et non de mise en page : le
    /// nombre à partir duquel un chiffre cesse de mentir ne se décide pas
    /// dans une feuille de style.</para>
    /// </summary>
    public bool MakesAPortrait => Moments >= PortraitThreshold;
}

/// <summary>
/// La synthèse du profil (E04, blocs A et B) — <b>calculée ici, jamais
/// recomptée par l'écran</b>.
///
/// <para>Un chiffre recompté par le front porterait sur ce qui est chargé —
/// une plateforme, trente lignes visibles — et non sur ce que le joueur a
/// déclaré. Il serait juste par rapport à l'écran, faux par rapport à
/// l'histoire, et rien ne le dirait.</para>
///
/// <para>Quatre chiffres, pas treize : §8.2 en liste treize, et E04 tranche —
/// « les afficher tous produirait un tableau de bord, pas un portrait ».</para>
/// </summary>
public static class ProfileProjection
{
    public static ProfileSummary Summarize(
        IReadOnlyCollection<PlayerEvent> events,
        IEnumerable<EventTarget> memoryTargets,
        TemporalHorizon horizon)
    {
        // « jeux déclarés » et « terminés » sont le dénominateur et le
        // numérateur du taux de §6. Les recompter ici en ferait une seconde
        // définition de « déclaré », qui divergerait de la première.
        var taux = CompletionProjection.Rate(events);

        var consoles = events
            .Select(e => e.PlatformId)
            .Where(p => !string.IsNullOrEmpty(p))
            .Distinct(StringComparer.Ordinal)
            .Count();

        // Par le COUPLE genre + identifiant : deux espaces de noms distincts
        // — `wrk_` et `ucl_` — que rien n'empêche de se croiser un jour.
        var souvenirs = memoryTargets
            .Select(c => (c.Kind, c.Id))
            .Distinct()
            .Count();

        // Le MÊME axe pour la phrase et pour la ligne : deux tris séparés
        // finiraient par diverger, et l'en-tête dirait « vers 1991 » au-dessus
        // d'une ligne partant de 1990 sans que rien ne le signale.
        var axe = TimelineSorter
            .Sort(events.Where(e => CompletionProjection.IsExperience(e.Type)), horizon)
            .OnAxis;

        return new ProfileSummary(
            events.Count, consoles, taux.Declared, taux.Finished, souvenirs,
            Debut(axe, horizon),
            Densite(events, horizon),
            Etendue(axe, horizon));
    }

    /// <summary>
    /// Le premier moment JOUÉ de l'axe.
    ///
    /// <para><b>Joué, pas possédé</b> (invariant 5) : la phrase dit « vous
    /// jouez depuis… », et une console achetée d'occasion antidaterait toute
    /// l'histoire d'un joueur qui n'y avait pas encore touché.</para>
    /// </summary>
    private static ProfileOpening? Debut(
        IReadOnlyList<PlayerEvent> axe, TemporalHorizon horizon)
    {
        // `OnAxis` a déjà écarté ce qui n'a pas d'intervalle — « je ne sais
        // plus », un âge sans année de naissance (invariant 2) —, et il n'y a
        // alors pas de première fois à raconter.
        var premier = axe.FirstOrDefault();
        if (premier is null)
        {
            return null;
        }

        var annee = AnneeDeclaree(premier.OccurredAt, horizon);
        var ecoulees = annee is { } a ? horizon.Ceiling.Year - a : (int?)null;

        return new ProfileOpening(
            premier.OccurredAt,
            premier.PlatformId,
            ecoulees >= 1 ? ecoulees : null);
    }

    /// <summary>
    /// La densité de moments par décennie (E04, bloc ⒟).
    ///
    /// <para><b>Les décennies vides sont dedans.</b> C'est le creux qui fait
    /// dire « j'ai peu joué entre 2005 et 2010 » : une liste qui ne
    /// contiendrait que les décennies peuplées dessinerait une bande pleine
    /// et ne dirait plus rien.</para>
    ///
    /// <para><b>Ce qui n'est pas sur l'axe n'y est pas</b> (invariant 2) :
    /// un moment sans date n'a pas de décennie, et lui en attribuer une
    /// inventerait la position que le joueur a refusé de donner. Ils sont
    /// comptés ailleurs — le tiroir les montre.</para>
    ///
    /// <para>La borne haute est <b>aujourd'hui</b>, jamais la dernière
    /// déclaration : une histoire qui s'arrête en 2010 doit montrer quinze
    /// ans de silence, et c'est l'information la plus utile de la bande.</para>
    /// </summary>
    private static IReadOnlyList<ActivitySlice> Densite(
        IReadOnlyCollection<PlayerEvent> events, TemporalHorizon horizon)
    {
        var annees = events
            .Select(e => AnneeDeclaree(e.OccurredAt, horizon))
            .Where(a => a is not null)
            .Select(a => a!.Value)
            .ToList();

        if (annees.Count == 0)
        {
            return [];
        }

        var premiere = Math.Floor(annees.Min() / 10d) * 10;
        var derniere = Math.Floor(horizon.Ceiling.Year / 10d) * 10;

        var tranches = new List<ActivitySlice>();
        for (var d = (int)premiere; d <= (int)derniere; d += 10)
        {
            tranches.Add(new ActivitySlice(d, annees.Count(a => a >= d && a <= d + 9)));
        }
        return tranches;
    }

    /// <summary>
    /// Les deux bornes de l'histoire (E04, bloc ⒞).
    ///
    /// <para><b>Le même axe que la phrase</b>, donc les mêmes exclusions :
    /// joué et non possédé (invariant 5) — une console achetée d'occasion en
    /// 1985 antidaterait l'histoire de quelqu'un qui n'y avait pas encore
    /// touché —, et rien de ce qui n'a pas de place sur l'axe.</para>
    ///
    /// <para><b>Minimum et maximum, jamais première et dernière entrée</b> :
    /// voir <see cref="ProfileSpan"/>. Le point représentatif est une clé de
    /// tri, et ORDONNANCEMENT-TEMPOREL interdit de l'afficher ; l'année
    /// montrée est l'année déclarée, et les deux ordres ne coïncident
    /// pas.</para>
    /// </summary>
    private static ProfileSpan? Etendue(
        IReadOnlyList<PlayerEvent> axe, TemporalHorizon horizon)
    {
        var annees = axe
            .Select(e => AnneeDeclaree(e.OccurredAt, horizon))
            .Where(a => a is not null)
            .Select(a => a!.Value)
            .ToList();

        return annees.Count == 0 ? null : new ProfileSpan(annees.Min(), annees.Max());
    }

    /// <summary>
    /// L'année telle qu'elle a été DÉCLARÉE, pas la borne de son intervalle.
    ///
    /// <para>« vers 1991 » s'étend de 1989 à 1993 sur l'axe ; compter depuis
    /// 1989 afficherait « ≈ 37 ans » sous une phrase qui dit 1991, et l'écran
    /// se contredirait tout seul.</para>
    ///
    /// <para>Exhaustive par construction : la hiérarchie est fermée, donc une
    /// huitième variante lève ici plutôt que de se placer en silence.</para>
    /// </summary>
    private static int? AnneeDeclaree(TemporalValue v, TemporalHorizon horizon) => v switch
    {
        ExactDate x => x.Date.Year,
        Month m => m.Year,
        Year y => y.Value,
        // Une période commence à son début : c'est le moment où l'histoire
        // commence, et c'est ce que l'axe montre.
        YearRange r => r.StartYear,
        ApproximateYear a => a.Year,
        // L'âge n'a d'année que par l'horizon — et sans année de naissance il
        // n'est pas sur l'axe, donc on n'arrive pas ici.
        Age g => horizon.EffectiveBirthYear is { } naissance ? naissance + g.Years : null,
        Unknown => null,
        _ => throw new NotSupportedException(
            $"Variante temporelle non située : {v.GetType().Name}."),
    };
}
