using DigitalTwin.Domain.Player;
using DigitalTwin.Domain.Temporal;

namespace DigitalTwin.Api.Selection;

/// <summary>Une ligne cochée : l'œuvre, et ce que la passe 2 y a ajouté.</summary>
/// <param name="Completion">finished · stillPlaying · abandoned · <c>null</c></param>
/// <param name="Provenance">owned · elsewhere · borrowed · <c>null</c></param>
public sealed record DeclarationEntry(
    string WorkId, string? Completion = null, string? Provenance = null);

/// <summary>
/// Un lot de déclarations issu d'un passage sur l'écran de sélection massive.
/// </summary>
/// <param name="BatchId">
/// Fourni par le client. <b>Deux usages, et le second n'est pas un détour</b> :
/// rejouer un lot déjà enregistré ne duplique rien, et les événements d'un
/// même lot forment <b>un épisode</b> dans la timeline (§4.4).
/// </param>
public sealed record DeclarationBatch(
    string BatchId,
    string UserId,
    string PlatformId,
    PeriodInput Period,
    IReadOnlyList<DeclarationEntry> Entries);

/// <summary>Ce qui empêche un lot d'être enregistré, en nommant l'entrée.</summary>
public sealed record BatchRejection(string Message);

/// <summary>
/// Traduit un lot de déclarations en événements du journal.
///
/// <para><b>Tout ou rien.</b> Une seule entrée fautive refuse le lot entier :
/// accepter les vingt-neuf bonnes et refuser la trentième laisserait le
/// client incapable de savoir ce qui a été enregistré, et un nouvel envoi
/// dupliquerait les vingt-neuf.</para>
/// </summary>
public static class DeclarationTranslator
{
    private const string Finished = "finished";
    private const string StillPlaying = "stillPlaying";
    private const string Abandoned = "abandoned";

    private const string Owned = "owned";
    private const string Elsewhere = "elsewhere";
    private const string Borrowed = "borrowed";

    /// <summary>
    /// Rend les événements, ou le refus. <paramref name="surLaPlateforme"/>
    /// dit si une œuvre paraît bien sur la machine déclarée.
    /// </summary>
    public static (IReadOnlyList<PlayerEvent>? Events, BatchRejection? Rejection) Translate(
        DeclarationBatch lot,
        Func<string, bool> plateformeConnue,
        Func<string, bool> oeuvreConnue,
        Func<string, string, bool> surLaPlateforme,
        DateTime enregistreA)
    {
        if (lot.Entries.Count == 0)
        {
            // Rien à déclarer n'est pas une déclaration : un lot vide
            // produirait un épisode vide dans la timeline.
            return (null, new BatchRejection("Le lot ne contient aucune déclaration."));
        }
        if (!plateformeConnue(lot.PlatformId))
        {
            return (null, new BatchRejection($"Plateforme inconnue : « {lot.PlatformId} »."));
        }

        TemporalValue quand;
        try
        {
            quand = lot.Period.ToTemporalValue();
        }
        catch (ArgumentException e)
        {
            return (null, new BatchRejection(e.Message));
        }

        var evenements = new List<PlayerEvent>();
        foreach (var entree in lot.Entries)
        {
            if (!oeuvreConnue(entree.WorkId))
            {
                return (null, new BatchRejection($"Œuvre inconnue : « {entree.WorkId} »."));
            }
            if (!surLaPlateforme(entree.WorkId, lot.PlatformId))
            {
                // Cocher un jeu Game Boy sur l'écran Super Nintendo est une
                // faute du client : l'accepter attribuerait un souvenir à une
                // machine où le jeu n'existe pas.
                return (null, new BatchRejection(
                    $"« {entree.WorkId} » ne paraît pas sur « {lot.PlatformId} »."));
            }

            var types = TypesDe(entree, out var refus);
            if (refus is not null) return (null, refus);

            foreach (var type in types)
            {
                evenements.Add(new PlayerEvent(
                    Identifiant(lot.BatchId, evenements.Count),
                    lot.UserId, type,
                    new EventTarget("work", entree.WorkId),
                    quand, enregistreA)
                {
                    BatchId = lot.BatchId,
                });
            }
        }

        return (evenements, null);
    }

    /// <summary>
    /// Les types d'événements qu'une ligne produit.
    ///
    /// <para><b>« Terminé » implique « joué ».</b> Ce n'est pas un confort :
    /// déclarer « fini » sans « commencé » produirait un moment sans
    /// prédécesseur valide, ce que §5.4 appelle une incohérence. L'implication
    /// est ce qui rend la déclaration représentable.</para>
    ///
    /// <para><b>« Toujours en cours » n'ajoute rien</b> : c'est un
    /// <c>StartedGame</c> que ni <c>CompletedGame</c> ni <c>AbandonedGame</c>
    /// n'ont refermé. Lui donner un type ferait de la position un état à
    /// maintenir, donc à désynchroniser.</para>
    /// </summary>
    private static List<string> TypesDe(DeclarationEntry entree, out BatchRejection? refus)
    {
        refus = null;

        // La passe 1 dit « j'y ai joué » d'un seul geste : tout ce qui suit
        // le présuppose.
        var types = new List<string> { PlayerEventType.StartedGame };

        switch (entree.Completion)
        {
            case null or StillPlaying: break;
            case Finished: types.Add(PlayerEventType.CompletedGame); break;
            case Abandoned: types.Add(PlayerEventType.AbandonedGame); break;
            default:
                refus = new BatchRejection(
                    $"Achèvement inconnu : « {entree.Completion} ». Attendu : "
                    + $"{Finished}, {StillPlaying} ou {Abandoned}.");
                return types;
        }

        switch (entree.Provenance)
        {
            // Jouer sans posséder était la norme avant la dématérialisation.
            // Inventer une acquisition ferait apparaître dans la collection un
            // exemplaire que le joueur n'a jamais eu.
            case null or Elsewhere or Borrowed: break;
            case Owned: types.Add(PlayerEventType.AcquiredItem); break;
            default:
                refus = new BatchRejection(
                    $"Provenance inconnue : « {entree.Provenance} ». Attendu : "
                    + $"{Owned}, {Elsewhere} ou {Borrowed}.");
                return types;
        }

        return types;
    }

    /// <summary>
    /// Déterministe au sein d'un lot : rejouer le même lot produirait les
    /// mêmes identifiants. L'idempotence ne s'y appuie pas — elle reconnaît
    /// le lot — mais deux envois concurrents se heurteraient alors à la clé
    /// primaire plutôt que de créer des doublons.
    /// </summary>
    private static string Identifiant(string batchId, int rang)
        => $"evt_{batchId}_{rang:D4}";
}
