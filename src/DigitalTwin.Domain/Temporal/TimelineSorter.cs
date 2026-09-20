namespace DigitalTwin.Domain.Temporal;

/// <summary>
/// Ce dont le tri a besoin pour placer un moment, et rien de plus.
///
/// Le contrat est minimal à dessein : <c>PlayerEvent</c> l'implémentera
/// (item 11) sans que le tri ait à connaître les événements.
/// </summary>
public interface ISortableMoment
{
    /// <summary>Quand cela s'est produit dans la vie du joueur — incertain.</summary>
    TemporalValue OccurredAt { get; }

    /// <summary>Quand la déclaration a été enregistrée — exact (§5.2).</summary>
    DateTime RecordedAt { get; }

    /// <summary>Identifiant total, jamais réattribué (§10.2).</summary>
    string Id { get; }

    /// <summary>
    /// Ce sur quoi porte le moment — une œuvre, en général. La cohérence
    /// causale ne s'applique qu'entre moments de MÊME sujet : imposer un ordre
    /// entre deux jeux différents inventerait une succession que personne n'a
    /// déclarée.
    /// </summary>
    string? SubjectId => null;

    /// <summary>
    /// Type du moment, tel que <see cref="CausalSequence"/> le connaît.
    /// <c>null</c> ou inconnu : aucune contrainte causale.
    /// </summary>
    string? Kind => null;
}

/// <summary>
/// Le résultat d'un tri : ce qui tient sur l'axe, ce qui n'y a pas sa place,
/// et les incohérences constatées sans avoir été corrigées.
/// </summary>
public sealed record TimelineOrder<T>(
    IReadOnlyList<T> OnAxis,
    IReadOnlyList<T> Undated,
    IReadOnlyList<CoherenceWarning> Warnings);

/// <summary>
/// Produit une séquence affichable à partir d'un ordre qui n'est que partiel
/// (ORDONNANCEMENT-TEMPOREL §4.1).
///
/// <para><b>L'ordre d'affichage n'affirme pas « puis ».</b> Deux moments qui
/// se chevauchent sont rendus dans un ordre déterminé par cette cascade, mais
/// leur succession ne veut rien dire — c'est au rendu de montrer le
/// chevauchement (§4.2).</para>
///
/// <para><b>Le déterminisme n'est pas un détail.</b> E03 est un écran où l'on
/// revient. Un tri qui dépend de l'ordre d'insertion produit une timeline qui
/// bouge d'une visite à l'autre, et l'utilisateur ne distingue pas cela d'une
/// perte de données.</para>
/// </summary>
public static class TimelineSorter
{
    public static TimelineOrder<T> Sort<T>(IEnumerable<T> moments, TemporalHorizon horizon)
        where T : ISortableMoment
    {
        var surAxe = new List<(T Moment, TemporalInterval Interval)>();
        var sansDate = new List<T>();

        foreach (var moment in moments)
        {
            var intervalle = TemporalNormalizer.Normalize(moment.OccurredAt, horizon);
            if (intervalle is null)
            {
                // Invariant 2 : ce qui n'a pas d'intervalle ne va pas sur l'axe.
                sansDate.Add(moment);
            }
            else
            {
                surAxe.Add((moment, intervalle));
            }
        }

        // Critères 1 à 3 : des CLÉS, pas des comparaisons. La position d'un
        // élément n'y dépend jamais des autres, ce qui est la condition pour
        // qu'ajouter un moment ne déplace pas les voisins.
        var classe = surAxe
            .OrderBy(x => x.Interval.SortKey)                 // 1
            .ThenBy(x => x.Interval.Start)                    // 2
            .ThenBy(x => x.Interval.WidthInDays)              // 3 — défensif (§11)
            .ThenBy(x => x.Moment.RecordedAt)                 // 5
            .ThenBy(x => x.Moment.Id, StringComparer.Ordinal) // 6
            .ToList();

        // Critère 4 — la cohérence causale. Elle ne peut pas être une clé :
        // elle dépend du COUPLE. On l'applique donc là où elle a un sens, et
        // nulle part ailleurs : à l'intérieur des groupes où les critères 1 à
        // 3 sont à égalité, c'est-à-dire là où les intervalles ne sont pas
        // strictement ordonnés.
        var ordonne = ReordonnerParCausalite(classe);

        var avertissements = DetecterIncoherences(classe);

        // §6 : dans le tiroir, le plus récemment déclaré d'abord — il n'y a
        // pas d'autre axe disponible, et c'est celui qui sert.
        var tiroir = sansDate
            .OrderByDescending(m => m.RecordedAt)
            .ThenBy(m => m.Id, StringComparer.Ordinal)
            .ToArray();

        return new TimelineOrder<T>(ordonne, tiroir, avertissements);
    }

    /// <summary>
    /// Dans chaque groupe à intervalle identique, remet les moments d'une même
    /// œuvre dans leur ordre logique — « commencé » avant « terminé », même si
    /// « terminé » a été saisi en premier.
    ///
    /// Tri topologique de Kahn, en choisissant à chaque pas le plus petit
    /// candidat au sens de l'ordre déjà établi. Le résultat est donc
    /// déterministe, et il reste stable pour les moments qu'aucune relation
    /// causale ne concerne.
    /// </summary>
    private static IReadOnlyList<T> ReordonnerParCausalite<T>(
        List<(T Moment, TemporalInterval Interval)> classe) where T : ISortableMoment
    {
        var resultat = new List<T>(classe.Count);
        var i = 0;

        while (i < classe.Count)
        {
            // Le groupe : tout ce que les critères 1 à 3 ne départagent pas.
            var j = i + 1;
            while (j < classe.Count && MemeRang(classe[i].Interval, classe[j].Interval))
            {
                j++;
            }

            if (j - i == 1)
            {
                resultat.Add(classe[i].Moment);
            }
            else
            {
                resultat.AddRange(TrierGroupe(classe.GetRange(i, j - i).Select(x => x.Moment)));
            }

            i = j;
        }

        return resultat;
    }

    private static bool MemeRang(TemporalInterval a, TemporalInterval b) =>
        a.SortKey == b.SortKey && a.Start == b.Start && a.WidthInDays == b.WidthInDays;

    private static List<T> TrierGroupe<T>(IEnumerable<T> groupe) where T : ISortableMoment
    {
        // Entrée déjà ordonnée par RecordedAt puis Id : c'est cet ordre qui
        // sert de départage quand la causalité ne dit rien.
        var restants = groupe.ToList();
        var sortie = new List<T>(restants.Count);

        while (restants.Count > 0)
        {
            // Le premier candidat qu'aucun autre restant ne doit précéder.
            var choisi = restants.FindIndex(candidat =>
                !restants.Any(autre =>
                    !ReferenceEquals(autre, candidat)
                    && DoitPreceder(autre, candidat)));

            // Aucun candidat libre : la seule cause possible serait un cycle
            // dans la séquence causale, qui n'en contient pas. On prend le
            // premier plutôt que de boucler — un tri qui ne rend pas la main
            // serait pire que l'ordre imparfait qu'il évite.
            if (choisi < 0)
            {
                choisi = 0;
            }

            sortie.Add(restants[choisi]);
            restants.RemoveAt(choisi);
        }

        return sortie;
    }

    private static bool DoitPreceder(ISortableMoment a, ISortableMoment b) =>
        a.SubjectId is not null
        && a.SubjectId == b.SubjectId
        && CausalSequence.Precedes(a.Kind, b.Kind);

    /// <summary>
    /// Repère les couples dont l'ordre déclaré contredit la séquence causale
    /// de façon <b>stricte</b> — « terminé » entièrement avant « commencé ».
    ///
    /// Un chevauchement n'est pas une contradiction : l'utilisateur n'a rien
    /// déclaré d'impossible, et c'est le critère 4 qui s'en occupe.
    /// </summary>
    private static IReadOnlyList<CoherenceWarning> DetecterIncoherences<T>(
        List<(T Moment, TemporalInterval Interval)> classe) where T : ISortableMoment
    {
        var avertissements = new List<CoherenceWarning>();

        // Quadratique, et assumé : un parcours utilisateur se compte en
        // centaines de moments. Si la mesure le dit un jour, on groupera par
        // sujet — pas avant.
        for (var a = 0; a < classe.Count; a++)
        {
            for (var b = 0; b < classe.Count; b++)
            {
                if (a == b || !DoitPreceder(classe[a].Moment, classe[b].Moment))
                {
                    continue;
                }

                // `a` devrait précéder `b`. Y a-t-il contradiction stricte ?
                if (IntervalAlgebra.Precedes(classe[b].Interval, classe[a].Interval))
                {
                    avertissements.Add(new CoherenceWarning(
                        classe[a].Moment.Id,
                        classe[b].Moment.Id,
                        $"« {classe[a].Moment.Kind} » devrait précéder " +
                        $"« {classe[b].Moment.Kind} », mais la date déclarée le place après. " +
                        "Le moment est affiché tel que déclaré."));
                }
            }
        }

        return avertissements;
    }
}
