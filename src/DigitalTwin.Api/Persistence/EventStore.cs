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
    /// Les cibles déjà enregistrées dans ce lot.
    ///
    /// <para><b>L'idempotence porte sur le couple (lot, cible)</b>, et non
    /// sur le lot seul. Un lot est un <i>épisode</i> au sens de §4.4 — douze
    /// titres cochés d'un coup —, et il se remplit au fil des gestes : le
    /// front envoie chaque ligne dès qu'elle est cochée, sous le même
    /// identifiant, pour que la timeline les regroupe.</para>
    ///
    /// <para>Traiter un lot connu comme « déjà enregistré » ne gardait donc
    /// que la PREMIÈRE déclaration des trente. Le parcours de bout en bout
    /// l'a trouvé ; aucun test d'API ne pouvait le voir, parce qu'ils
    /// envoyaient toujours le lot complet en un appel.</para>
    ///
    /// <para>Ce n'est pas une unicité globale (utilisateur, œuvre, type) :
    /// celle-là refuserait la correction de §5.3, qui chaîne un nouvel
    /// événement sur la même cible — dans un AUTRE lot.</para>
    /// </summary>
    /// <para><b>Sur l'IDENTIFIANT, pas sur la cible.</b> L'identifiant encode
    /// déjà (lot, cible, type) : dédupliquer sur la cible rendait le lot
    /// aveugle à tout affinage ultérieur. Cocher une ligne puis répondre
    /// « fini » dans le même passage jetait SILENCIEUSEMENT l'achèvement, et
    /// l'utilisateur voyait son geste ne rien produire.</para>
    public async Task<IReadOnlySet<string>> BatchEventIdsAsync(
        string userId, string batchId, CancellationToken ct = default)
        => (await db.PlayerEvents.AsNoTracking()
                .Where(e => e.UserId == userId && e.BatchId == batchId)
                .Select(e => e.Id)
                .ToListAsync(ct))
            .ToHashSet(StringComparer.Ordinal);

    /// <summary>
    /// Ce dont l'utilisateur s'est prononcé sur une plateforme.
    ///
    /// <para><b>La source du « j'y ai joué » est le JOURNAL</b>, pas la table
    /// des jugements : cocher une ligne n'écrit aucune déclaration
    /// permanente. Chercher là ferait rendre « rien de déclaré » à un profil
    /// plein — c'est exactement l'erreur qui faisait rendre zéro à la mesure
    /// des plateformes.</para>
    ///
    /// <para>Seuls les titres sur lesquels l'utilisateur s'est prononcé sont
    /// rendus. Rendre 221 lignes dont 220 vides ferait payer la relecture à
    /// chaque chargement pour ne rien dire.</para>
    /// </summary>
    public async Task<IReadOnlyList<EtatDeLigne>> SelectionStateAsync(
        string userId, string platformId, CancellationToken ct = default)
    {
        var evenements = await db.PlayerEvents.AsNoTracking()
            .Where(e => e.UserId == userId
                        && e.PlatformId == platformId
                        && e.TargetKind == "work"
                        && e.SupersededByEventId == null)
            .Select(e => new { e.TargetId, e.Type })
            .ToListAsync(ct);

        var jugements = await db.PlayDeclarations.AsNoTracking()
            .Where(d => d.UserId == userId && d.PlatformId == platformId)
            .ToListAsync(ct);

        var oeuvres = evenements.Select(e => e.TargetId)
            .Concat(jugements.Select(d => d.WorkId))
            .Distinct(StringComparer.Ordinal)
            .ToList();

        return [.. oeuvres.Select(oeuvre =>
        {
            var siens = evenements.Where(e => e.TargetId == oeuvre).Select(e => e.Type).ToList();
            var jugement = jugements.FirstOrDefault(d => d.WorkId == oeuvre);

            return new EtatDeLigne(
                oeuvre,
                Played: siens.Contains(PlayerEventType.StartedGame),
                // « Toujours en cours » ne produit aucun événement — c'est un
                // StartedGame que rien n'a refermé — et se relit donc comme
                // « pas prononcé ». C'est le modèle qui le veut : lui donner
                // un type ferait de la position un état à maintenir.
                Completion:
                    siens.Contains(PlayerEventType.CompletedGame) ? "finished"
                    : siens.Contains(PlayerEventType.AbandonedGame) ? "abandoned"
                    : null,
                Provenance: ProvenanceEcran(jugement?.Provenance),
                NeverPlayed: jugement?.NeverPlayed ?? false);
        })];
    }

    /// <summary>
    /// Le vocabulaire du domaine vers celui de l'écran. <c>Unknown</c> devient
    /// <c>null</c> : « on ne sait pas » n'est pas une réponse que
    /// l'utilisateur a donnée, et l'afficher comme telle en inventerait une.
    /// </summary>
    private static string? ProvenanceEcran(string? domaine) => domaine switch
    {
        nameof(DigitalTwin.Domain.Player.Provenance.Owned) => "owned",
        nameof(DigitalTwin.Domain.Player.Provenance.Elsewhere) => "elsewhere",
        nameof(DigitalTwin.Domain.Player.Provenance.Borrowed) => "borrowed",
        _ => null,
    };

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
        var revendications = await db.UnresolvedClaims
            .Where(c => c.UserId == userId).ExecuteDeleteAsync(ct);
        // La table la plus sensible : un souvenir est la donnée la plus
        // personnelle du produit. L'oublier ici serait le manquement le plus
        // grave au droit à l'effacement.
        var souvenirs = await db.Memories
            .Where(m => m.UserId == userId).ExecuteDeleteAsync(ct);
        return evenements + declarations + revendications + souvenirs;
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

    /// <summary>
    /// Écrit ou révise le souvenir attaché à une cible.
    ///
    /// <para>Un souvenir par cible (§9.2) : en empiler deux ferait un fil de
    /// discussion avec soi-même, et l'écran ne saurait lequel montrer. La
    /// révision est donc une écriture en place — c'est une déclaration, pas
    /// un événement.</para>
    /// </summary>
    public async Task UpsertMemoryAsync(
        string userId, string targetKind, string targetId, string texte,
        CancellationToken ct = default)
    {
        var ligne = await db.Memories.FirstOrDefaultAsync(
            m => m.UserId == userId && m.TargetKind == targetKind
                 && m.TargetId == targetId, ct);

        if (ligne is null)
        {
            ligne = new MemoryRow
            {
                UserId = userId, TargetKind = targetKind, TargetId = targetId,
            };
            db.Memories.Add(ligne);
        }

        ligne.Text = texte;
        // La date d'ÉCRITURE, jamais celle du fait raconté : celle-là vit
        // dans l'événement que le souvenir accompagne.
        ligne.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<MemoryRow>> ReadMemoriesAsync(
        string userId, CancellationToken ct = default)
        => await db.Memories.AsNoTracking()
            .Where(m => m.UserId == userId)
            .OrderBy(m => m.TargetId).ToListAsync(ct);

    /// <summary>
    /// L'identifiant de la revendication portant ce titre, en la créant si
    /// elle n'existe pas.
    ///
    /// <para>La comparaison passe par une forme normalisée — casse et
    /// espaces de bord ignorés — mais <b>le titre saisi est conservé tel
    /// quel</b> : c'est lui qui constitue le signal de priorisation du
    /// référentiel.</para>
    /// </summary>
    public async Task<string> EnsureClaimAsync(
        string userId, string titre, string platformId, CancellationToken ct = default)
    {
        var normalise = NormaliserTitre(titre);
        var existante = await db.UnresolvedClaims.FirstOrDefaultAsync(
            c => c.UserId == userId && c.NormalizedTitle == normalise
                 && c.PlatformId == platformId, ct);
        if (existante is not null) return existante.Id;

        var ligne = new UnresolvedClaimRow
        {
            // Préfixe distinct de `wrk_` : rien ne peut la confondre avec une
            // œuvre curée, pas même une lecture distraite d'un journal.
            Id = "ucl_" + Guid.NewGuid().ToString("N")[..20].ToUpperInvariant(),
            UserId = userId,
            Title = titre,
            NormalizedTitle = normalise,
            PlatformId = platformId,
        };
        db.UnresolvedClaims.Add(ligne);
        await db.SaveChangesAsync(ct);
        return ligne.Id;
    }

    private static string NormaliserTitre(string titre)
        => titre.Trim().ToLowerInvariant();

    public async Task<IReadOnlyList<UnresolvedClaimRow>> ReadClaimsAsync(
        string userId, CancellationToken ct = default)
        => await db.UnresolvedClaims.AsNoTracking()
            .Where(c => c.UserId == userId)
            .OrderBy(c => c.Title).ToListAsync(ct);

    /// <summary>
    /// Rattache une revendication à une œuvre curée.
    ///
    /// <para><b>Les événements ne sont pas touchés.</b> Le journal est en
    /// ajout seul, et §3.5 demande le rattachement « sans perte de
    /// l'historique ni des dates » : c'est la revendication qui apprend où
    /// elle mène, pas l'histoire qu'on réécrit.</para>
    /// </summary>
    public async Task<bool> ResolveClaimAsync(
        string userId, string claimId, string workId, CancellationToken ct = default)
    {
        var ligne = await db.UnresolvedClaims.FirstOrDefaultAsync(
            c => c.UserId == userId && c.Id == claimId, ct);
        if (ligne is null) return false;

        ligne.ResolvedWorkId = workId;
        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<IReadOnlyList<PlayDeclarationRow>> ReadDeclarationsAsync(
        string userId, CancellationToken ct = default)
        => await db.PlayDeclarations.AsNoTracking()
            .Where(d => d.UserId == userId)
            .OrderBy(d => d.WorkId).ThenBy(d => d.PlatformId)
            .ToListAsync(ct);
}
