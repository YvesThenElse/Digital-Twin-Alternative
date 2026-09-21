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
    public Task<int> PurgeUserAsync(string userId, CancellationToken ct = default)
        => db.PlayerEvents.Where(e => e.UserId == userId).ExecuteDeleteAsync(ct);
}
