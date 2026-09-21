namespace DigitalTwin.Domain.Player;

/// <summary>
/// Où en est la partie — <b>trois positions, pas quatre états</b>
/// (SPECIFICATION §4.6).
///
/// La v1 listait « commencé », « abandonné », « terminé » et « terminé à
/// 100 % » comme quatre états indépendants. Ce sont des positions sur un même
/// axe, et les traiter séparément multiplie les contrôles sans rien ajouter.
///
/// <para>« Terminé à 100 % » n'y figure pas : c'est une <i>profondeur de
/// complétion</i>, pas une position dans le déroulement — et la notion est
/// vide pour une grande part du catalogue.</para>
/// </summary>
public enum CompletionPosition
{
    /// <summary>Il y a joué, sans plus de précision. Une position, pas un manque.</summary>
    Unspecified,

    /// <summary>Mené à son terme.</summary>
    Finished,

    /// <summary>
    /// Commencé, jamais refermé — il pourrait y revenir. Fréquent et durable :
    /// le jeu posé depuis six mois n'est ni fini ni abandonné.
    /// </summary>
    StillPlaying,

    /// <summary>
    /// Commencé, laissé en route. <b>Pas un échec</b> : c'est une information
    /// de goût aussi utile que « fini », et l'interface ne doit jamais la
    /// présenter autrement.
    /// </summary>
    Abandoned,
}

/// <summary>
/// Un taux de complétion, <b>jamais un pourcentage nu</b>.
///
/// Même exigence qu'aux requêtes temporelles : « 33 % » seul ne dit pas sur
/// combien de titres, ni ce que « déclaré » recouvre.
/// </summary>
public sealed record CompletionRate(int Finished, int Declared)
{
    /// <summary>
    /// <c>null</c> quand rien n'est déclaré. Un profil vide n'a pas un taux
    /// de zéro : il n'en a pas. Afficher 0 % accuserait le joueur de n'avoir
    /// rien fini alors qu'il n'a rien dit.
    /// </summary>
    public double? Ratio => Declared == 0 ? null : (double)Finished / Declared;

    public string Summary => $"{Finished} finis sur {Declared} déclarés";
}

/// <summary>
/// Calcule les positions et les taux depuis le journal — <b>rien n'est
/// stocké comme état de vérité</b> (MODELE-DE-DOMAINE §6).
/// </summary>
public static class CompletionProjection
{
    /// <summary>
    /// <b>« Toujours en cours » est une absence, pas un événement.</b> C'est
    /// la projection la plus subtile du modèle : aucun type ne la déclare,
    /// elle se déduit d'un <c>StartedGame</c> que ni <c>CompletedGame</c> ni
    /// <c>AbandonedGame</c> n'ont refermé.
    ///
    /// <para>Si un type « StillPlaying » existait, la position cesserait
    /// d'être une absence pour devenir un état à maintenir — donc à
    /// désynchroniser.</para>
    /// </summary>
    public static CompletionPosition PositionOf(
        IEnumerable<PlayerEvent> events, string workId)
    {
        PlayerEvent? cloture = null;   // la dernière fermeture DÉCLARÉE
        var commence = false;
        DateTime? rejoueApres = null;

        foreach (var e in events)
        {
            if (e.Target.Id != workId)
            {
                continue;
            }

            switch (e.Type)
            {
                case PlayerEventType.StartedGame:
                    commence = true;
                    break;

                case PlayerEventType.CompletedGame:
                case PlayerEventType.AbandonedGame:
                    commence = true;
                    // Invariant 7 : les trois positions sont exclusives. Deux
                    // fermetures contradictoires ne sont pas refusées
                    // (invariant 10) ; la plus récemment DÉCLARÉE fait foi,
                    // car c'est le dernier état de connaissance de son auteur.
                    if (cloture is null || e.RecordedAt > cloture.RecordedAt)
                    {
                        cloture = e;
                    }
                    break;

                case PlayerEventType.ReplayedGame:
                    commence = true;
                    if (rejoueApres is null || e.RecordedAt > rejoueApres)
                    {
                        rejoueApres = e.RecordedAt;
                    }
                    break;
            }
        }

        if (!commence)
        {
            return CompletionPosition.Unspecified;
        }

        // Rejouer rouvre une partie refermée : « il pourrait y revenir », vu
        // après coup.
        if (cloture is null || (rejoueApres is { } r && r >= cloture.RecordedAt))
        {
            return CompletionPosition.StillPlaying;
        }

        return cloture.Type == PlayerEventType.CompletedGame
            ? CompletionPosition.Finished
            : CompletionPosition.Abandoned;
    }

    /// <summary>
    /// « Fini ÷ déclaré » (§6). Le dénominateur est ce que le joueur a
    /// déclaré avoir joué — <b>pas le catalogue</b>, qui produirait un taux
    /// dérisoire et décourageant.
    /// </summary>
    public static CompletionRate Rate(IEnumerable<PlayerEvent> events)
    {
        var parOeuvre = new Dictionary<string, List<PlayerEvent>>(StringComparer.Ordinal);

        foreach (var e in events)
        {
            if (!EstExperience(e.Type))
            {
                // Invariant 5 : posséder n'est pas jouer. Un jeu acheté et
                // jamais lancé n'entre pas au dénominateur.
                continue;
            }
            if (!parOeuvre.TryGetValue(e.Target.Id, out var liste))
            {
                parOeuvre[e.Target.Id] = liste = [];
            }
            liste.Add(e);
        }

        var finis = parOeuvre.Count(kv =>
            PositionOf(kv.Value, kv.Key) == CompletionPosition.Finished);

        return new CompletionRate(finis, parOeuvre.Count);
    }

    private static bool EstExperience(string type) => type is
        PlayerEventType.DiscoveredGame or PlayerEventType.StartedGame or
        PlayerEventType.CompletedGame or PlayerEventType.AbandonedGame or
        PlayerEventType.ReplayedGame;
}
