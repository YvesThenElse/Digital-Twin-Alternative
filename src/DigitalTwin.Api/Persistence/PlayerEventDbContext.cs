using Microsoft.EntityFrameworkCore;

namespace DigitalTwin.Api.Persistence;

/// <summary>
/// Le journal des événements. <b>En ajout seul</b> (§5.3, MODELE §2).
///
/// <para>Deux garde-fous, à deux niveaux, et ce n'est pas une redondance : le
/// contexte protège le code de l'application, le déclencheur SQL protège la
/// base de tout le reste — un script, une console <c>psql</c>, une future
/// application. Le second est le seul qui tienne.</para>
/// </summary>
public sealed class PlayerEventDbContext(DbContextOptions<PlayerEventDbContext> options)
    : DbContext(options)
{
    public DbSet<PlayerEventRow> PlayerEvents => Set<PlayerEventRow>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        var e = b.Entity<PlayerEventRow>();
        e.ToTable("player_events");

        // La clé porte UserId EN TÊTE : un partitionnement par utilisateur
        // (§10.1) devient alors une migration, pas un changement de modèle.
        e.HasKey(x => new { x.UserId, x.Id });

        e.Property(x => x.Id).HasColumnName("id").IsRequired();
        e.Property(x => x.UserId).HasColumnName("user_id").IsRequired();
        e.Property(x => x.Type).HasColumnName("type").IsRequired();
        e.Property(x => x.TargetKind).HasColumnName("target_kind").IsRequired();
        e.Property(x => x.TargetId).HasColumnName("target_id").IsRequired();

        e.Property(x => x.OccurredKind).HasColumnName("occurred_kind").IsRequired();
        e.Property(x => x.OccurredDate).HasColumnName("occurred_date");
        e.Property(x => x.OccurredYear).HasColumnName("occurred_year");
        e.Property(x => x.OccurredMonth).HasColumnName("occurred_month");
        e.Property(x => x.OccurredEndYear).HasColumnName("occurred_end_year");
        e.Property(x => x.OccurredMargin).HasColumnName("occurred_margin");
        e.Property(x => x.OccurredAge).HasColumnName("occurred_age");

        e.Property(x => x.BatchId).HasColumnName("batch_id");
        e.Property(x => x.RecordedAt).HasColumnName("recorded_at")
            .HasColumnType("timestamp with time zone").IsRequired();
        e.Property(x => x.SupersededByEventId).HasColumnName("superseded_by_event_id");

        // Invariant 11 : joignable par UserId seul, donc purgeable.
        e.HasIndex(x => x.UserId);
        e.HasIndex(x => new { x.UserId, x.TargetId });
        // Reconnaître un lot déjà enregistré, et regrouper un épisode.
        e.HasIndex(x => new { x.UserId, x.BatchId });
    }

    /// <summary>
    /// Refuse toute modification ou suppression d'un événement déjà écrit,
    /// <b>sauf</b> la pose du marqueur de remplacement.
    ///
    /// <para>MODELE §5 dit que corriger « chaîne un nouvel événement et marque
    /// l'ancien comme remplacé ». Marquer EST une mise à jour : interdire tout
    /// <c>UPDATE</c> rendrait la correction impossible. On autorise donc cette
    /// seule colonne, et une seule fois.</para>
    /// </summary>
    public override int SaveChanges()
    {
        VerifierAjoutSeul();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        VerifierAjoutSeul();
        return base.SaveChangesAsync(ct);
    }

    private void VerifierAjoutSeul()
    {
        foreach (var entree in ChangeTracker.Entries<PlayerEventRow>())
        {
            if (entree.State == EntityState.Deleted)
            {
                throw new InvalidOperationException(
                    $"Suppression refusée : « {entree.Entity.Id} ». Le journal est en "
                    + "ajout seul. La purge d'un utilisateur passe par ExecuteDelete, "
                    + "seul chemin autorisé (§10.1).");
            }
            if (entree.State != EntityState.Modified) continue;

            var modifiees = entree.Properties
                .Where(p => p.IsModified)
                .Select(p => p.Metadata.Name)
                .ToList();

            if (modifiees.Count != 1 || modifiees[0] != nameof(PlayerEventRow.SupersededByEventId))
            {
                throw new InvalidOperationException(
                    $"Réécriture refusée sur « {entree.Entity.Id} » : "
                    + string.Join(", ", modifiees)
                    + ". Seul le marqueur de remplacement peut être posé (§5.3).");
            }
        }
    }
}
