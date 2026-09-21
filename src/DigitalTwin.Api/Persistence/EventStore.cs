using DigitalTwin.Api.Selection;
using DigitalTwin.Domain.Player;
using Microsoft.EntityFrameworkCore;

namespace DigitalTwin.Api.Persistence;

/// <summary>
/// Le seul chemin d'écriture du journal. Quatre opérations, et aucune ne
/// réécrit l'histoire.
/// </summary>
public sealed class EventStore(PlayerEventDbContext db)
{
    public async Task AppendAsync(PlayerEvent evenement, CancellationToken ct = default)
    {
        db.PlayerEvents.Add(PlayerEventMapping.ToRow(evenement));
        await db.SaveChangesAsync(ct);
    }

    public async Task AppendAsync(IEnumerable<PlayerEvent> evenements, CancellationToken ct = default)
    {
        db.PlayerEvents.AddRange(evenements.Select(PlayerEventMapping.ToRow));
        await db.SaveChangesAsync(ct);
    }

    /// <summary>
    /// Ce lot a-t-il déjà été enregistré ?
    ///
    /// <para>L'idempotence porte sur le LOT, pas sur une unicité globale
    /// (utilisateur, œuvre, type). Une telle unicité refuserait la correction
    /// de §5.3, qui chaîne précisément un nouvel événement sur la même
    /// cible.</para>
    /// </summary>
    public Task<bool> BatchExistsAsync(
        string userId, string batchId, CancellationToken ct = default)
        => db.PlayerEvents.AnyAsync(e => e.UserId == userId && e.BatchId == batchId, ct);

    /// <summary>
    /// Tous les événements d'un utilisateur, dans l'ordre d'enregistrement.
    /// <b>Pas dans l'ordre vécu</b> : c'est <c>TimelineSorter</c> qui le
    /// détermine, et il a besoin de tout pour le faire.
    /// </summary>
    public async Task<IReadOnlyList<PlayerEvent>> ReadAsync(
        string userId, CancellationToken ct = default)
    {
        var lignes = await db.PlayerEvents.AsNoTracking()
            .Where(e => e.UserId == userId)
            .OrderBy(e => e.RecordedAt).ThenBy(e => e.Id)
            .ToListAsync(ct);
        return [.. lignes.Select(PlayerEventMapping.ToDomain)];
    }

    /// <summary>
    /// Pose le marqueur de remplacement. C'est la seule modification que la
    /// base accepte, et elle n'est acceptée qu'une fois : un événement déjà
    /// remplacé ne se re-pointe pas.
    /// </summary>
    public async Task MarkSupersededAsync(
        string userId, string eventId, string correctionEventId, CancellationToken ct = default)
    {
        var ligne = await db.PlayerEvents
            .SingleOrDefaultAsync(e => e.UserId == userId && e.Id == eventId, ct)
            ?? throw new InvalidOperationException(
                $"Événement introuvable : « {eventId} » pour « {userId} ».");

        ligne.SupersededByEventId = correctionEventId;
        await db.SaveChangesAsync(ct);
    }

    /// <summary>
    /// L'effacement de §10.1 : une opération, joignable par <c>UserId</c>
    /// seul. <b>C'est le seul chemin de suppression</b>, et il existe parce
    /// que le RGPD l'exige — « ajout seul » veut dire qu'on ne réécrit pas
    /// une histoire, pas qu'on ne peut pas effacer une personne.
    /// </summary>
    public async Task<int> PurgeUserAsync(string userId, CancellationToken ct = default)
    {
        // TOUTES les tables de USER DATA, pas seulement le journal. Une table
        // oubliée ici laisserait des données personnelles après un droit à
        // l'effacement — et rien ne le signalerait.
        var evenements = await db.PlayerEvents
            .Where(e => e.UserId == userId).ExecuteDeleteAsync(ct);
        var declarations = await db.PlayDeclarations
            .Where(d => d.UserId == userId).ExecuteDeleteAsync(ct);
        return evenements + declarations;
    }

    /// <summary>
    /// Écrit ou révise des déclarations permanentes.
    ///
    /// <para>Mise à jour en place, et c'est voulu : une déclaration n'a pas
    /// de date, elle est un jugement courant. Invariant 10 — une incohérence
    /// produit un avertissement, jamais un refus —, donc déclarer « jamais
    /// joué » après avoir déclaré « joué » est une <b>correction</b> que l'on
    /// accepte.</para>
    /// </summary>
    public async Task<int> ApplyDeclarationsAsync(
        string userId, IEnumerable<DeclarationIntent> intentions,
        CancellationToken ct = default)
    {
        var aAppliquer = intentions.ToList();
        if (aAppliquer.Count == 0) return 0;

        var existantes = await db.PlayDeclarations
            .Where(d => d.UserId == userId).ToListAsync(ct);

        foreach (var intention in aAppliquer)
        {
            var ligne = existantes.FirstOrDefault(
                d => d.WorkId == intention.WorkId && d.PlatformId == intention.PlatformId);
            if (ligne is null)
            {
                ligne = new PlayDeclarationRow
                {
                    UserId = userId,
                    WorkId = intention.WorkId,
                    PlatformId = intention.PlatformId,
                };
                db.PlayDeclarations.Add(ligne);
                existantes.Add(ligne);
            }

            // On passe par le TYPE DE DOMAINE : c'est lui qui sait que
            // `DeclareNeverPlayed` efface provenance et affect (invariant 8),
            // et que déclarer une provenance lève `NeverPlayed` (invariant
            // 10). Les réimplémenter ici les laisserait diverger.
            var jugement = PlayDeclarationMapping.ToDomain(ligne);
            jugement = intention.Kind switch
            {
                DeclarationIntent.NeverPlayed => jugement.DeclareNeverPlayed(),
                DeclarationIntent.Provenance =>
                    jugement.WithProvenance(Enum.Parse<Provenance>(intention.Value!)),
                _ => throw new NotSupportedException(
                    $"Intention de déclaration inconnue : « {intention.Kind} »."),
            };
            PlayDeclarationMapping.Apply(ligne, jugement);
        }

        await db.SaveChangesAsync(ct);
        return aAppliquer.Count;
    }

    public async Task<IReadOnlyList<PlayDeclarationRow>> ReadDeclarationsAsync(
        string userId, CancellationToken ct = default)
        => await db.PlayDeclarations.AsNoTracking()
            .Where(d => d.UserId == userId)
            .OrderBy(d => d.WorkId).ThenBy(d => d.PlatformId)
            .ToListAsync(ct);
}
