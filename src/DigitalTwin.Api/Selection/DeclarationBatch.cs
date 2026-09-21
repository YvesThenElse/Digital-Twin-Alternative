using DigitalTwin.Api.Persistence;
using DigitalTwin.Domain.Player;
using DigitalTwin.Domain.Temporal;

namespace DigitalTwin.Api.Selection;

/// <summary>Une ligne cochée : l'œuvre, et ce que la passe 2 y a ajouté.</summary>
/// <param name="Completion">finished · stillPlaying · abandoned · <c>null</c></param>
/// <param name="Provenance">owned · elsewhere · borrowed · <c>null</c></param>
/// <param name="WorkId">
/// L'œuvre curée. <c>null</c> quand le référentiel ne la contient pas — on
/// saisit alors <paramref name="Title"/>. Les deux ensemble sont ambigus :
/// on ne saurait pas si le testeur a trouvé son jeu.
/// </param>
/// <param name="Title">Titre libre, quand le jeu manque au référentiel (§3.5).</param>
public sealed record DeclarationEntry(
    string? WorkId = null,
    string? Completion = null,
    string? Provenance = null,
    bool NeverPlayed = false,
    string? Title = null);

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

/// <summary>
/// Ce qu'une ligne cochée demande de changer dans le jugement permanent.
///
/// <para>Une <b>intention</b>, pas une ligne toute faite : une déclaration
/// porte trois champs indépendants, et réécrire la ligne entière effacerait
/// ceux qu'on n'a pas touchés. « Mon préféré sur Super Nintendo »
/// disparaîtrait parce qu'on a dit « je l'avais ».</para>
/// </summary>
public sealed record DeclarationIntent(string WorkId, string PlatformId, string Kind, string? Value)
{
    public const string NeverPlayed = "neverPlayed";
    public const string Provenance = "provenance";
}

/// <summary>
/// Un titre libre à enregistrer comme revendication non résolue.
/// </summary>
public sealed record ClaimIntent(string Title, string PlatformId);

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
    /// <param name="cibleRevendication">
    /// Rend l'identifiant de la revendication pour un titre libre — en la
    /// créant si elle n'existe pas encore.
    /// </param>
    public static (IReadOnlyList<PlayerEvent>? Events,
                   IReadOnlyList<DeclarationIntent>? Declarations,
                   BatchRejection? Rejection) Translate(
        DeclarationBatch lot,
        Func<string, bool> plateformeConnue,
        Func<string, bool> oeuvreConnue,
        Func<string, string, bool> surLaPlateforme,
        Func<ClaimIntent, string> cibleRevendication,
        DateTime enregistreA)
    {
        if (lot.Entries.Count == 0)
        {
            // Rien à déclarer n'est pas une déclaration : un lot vide
            // produirait un épisode vide dans la timeline.
            return (null, null, new BatchRejection("Le lot ne contient aucune déclaration."));
        }
        if (!plateformeConnue(lot.PlatformId))
        {
            return (null, null, new BatchRejection($"Plateforme inconnue : « {lot.PlatformId} »."));
        }

        TemporalValue quand;
        try
        {
            quand = lot.Period.ToTemporalValue();
        }
        catch (ArgumentException e)
        {
            return (null, null, new BatchRejection(e.Message));
        }

        var evenements = new List<PlayerEvent>();
        var declarations = new List<DeclarationIntent>();
        foreach (var entree in lot.Entries)
        {
            // --- l'œuvre, curée ou libre --------------------------------
            var titre = entree.Title?.Trim();
            var aUnTitre = !string.IsNullOrEmpty(titre);

            if (entree.WorkId is not null && entree.Title is not null)
            {
                // Ambigu : on ne sait pas si le testeur a trouvé son jeu ou
                // non. Deviner ferait taire la question au mauvais moment.
                return (null, null, new BatchRejection(
                    $"L'entrée porte à la fois une œuvre « {entree.WorkId} » et un "
                    + $"titre libre « {entree.Title} » : les deux s'excluent."));
            }
            if (entree.WorkId is null && entree.Title is null)
            {
                return (null, null, new BatchRejection(
                    "Une entrée doit porter une œuvre ou un titre libre."));
            }
            if (entree.Title is not null && !aUnTitre)
            {
                // Un titre vide ne dit rien et ne se rattache à rien : il
                // polluerait le signal de priorisation sans jamais pouvoir
                // être résolu.
                return (null, null, new BatchRejection(
                    "Un titre libre ne peut pas être vide."));
            }

            EventTarget cible;
            if (aUnTitre)
            {
                cible = new EventTarget(
                    "unresolvedClaim",
                    cibleRevendication(new ClaimIntent(titre!, lot.PlatformId)));
            }
            else
            {
                if (!oeuvreConnue(entree.WorkId!))
                {
                    return (null, null, new BatchRejection(
                        $"Œuvre inconnue : « {entree.WorkId} »."));
                }
                if (!surLaPlateforme(entree.WorkId!, lot.PlatformId))
                {
                    // Cocher un jeu Game Boy sur l'écran Super Nintendo est une
                    // faute du client : l'accepter attribuerait un souvenir à une
                    // machine où le jeu n'existe pas.
                    return (null, null, new BatchRejection(
                        $"« {entree.WorkId} » ne paraît pas sur « {lot.PlatformId} »."));
                }
                cible = new EventTarget("work", entree.WorkId!);
            }

            if (entree.NeverPlayed)
            {
                // Invariant 8 : `NeverPlayed` exclut toute autre déclaration
                // sur la même œuvre. Les garder produirait « je n'y ai jamais
                // joué, et je l'ai fini ».
                if (entree.Completion is not null || entree.Provenance is not null)
                {
                    return (null, null, new BatchRejection(
                        $"« {cible.Id} » est déclaré « jamais joué » et porte "
                        + "aussi un achèvement ou une provenance : les deux "
                        + "s'excluent (invariant 8)."));
                }

                // AUCUN événement. « Jamais joué » n'a pas de date — c'est un
                // jugement, et lui en forcer une inventerait une précision.
                declarations.Add(new DeclarationIntent(
                    cible.Id, lot.PlatformId, DeclarationIntent.NeverPlayed, null));
                continue;
            }

            var types = TypesDe(entree, out var refus);
            if (refus is not null) return (null, null, refus);

            if (entree.Provenance is not null)
            {
                // La provenance est un attribut de déclaration (§4.5). Elle
                // double l'événement d'acquisition sans le remplacer : l'un
                // date, l'autre qualifie.
                declarations.Add(new DeclarationIntent(
                    cible.Id, lot.PlatformId, DeclarationIntent.Provenance,
                    ProvenanceDomaine(entree.Provenance)));
            }

            foreach (var type in types)
            {
                evenements.Add(new PlayerEvent(
                    Identifiant(lot.BatchId, evenements.Count),
                    lot.UserId, type,
                    cible,
                    quand, enregistreA)
                {
                    BatchId = lot.BatchId,
                });
            }
        }

        return (evenements, declarations, null);
    }

    private static string ProvenanceDomaine(string valeur) => valeur switch
    {
        Owned => nameof(DigitalTwin.Domain.Player.Provenance.Owned),
        Elsewhere => nameof(DigitalTwin.Domain.Player.Provenance.Elsewhere),
        Borrowed => nameof(DigitalTwin.Domain.Player.Provenance.Borrowed),
        _ => nameof(DigitalTwin.Domain.Player.Provenance.Unknown),
    };

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
