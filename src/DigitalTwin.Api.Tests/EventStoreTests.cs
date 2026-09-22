using DigitalTwin.Api.Persistence;
using DigitalTwin.Domain.Player;
using DigitalTwin.Domain.Temporal;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace DigitalTwin.Api.Tests;

/// <summary>
/// La persistance du journal, contre une vraie base PostgreSQL.
///
/// <para>Trois exigences : conserver <b>toutes</b> les formes temporelles sans
/// en aplatir aucune, garder les deux axes distincts, et refuser la réécriture
/// — y compris depuis l'extérieur de l'application.</para>
/// </summary>
[Collection("postgres")]
public class EventStoreTests(PostgresFixture bdd)
{
    private static readonly DateTime Enregistre =
        new(2026, 9, 21, 10, 30, 0, DateTimeKind.Utc);

    private static PlayerEvent Evenement(
        string id, TemporalValue quand, string user = "usr_test",
        DateTime? enregistre = null)
        => new(id, user, PlayerEventType.StartedGame,
               new EventTarget("work", "wrk_mario"), quand, enregistre ?? Enregistre);

    private EventStore Magasin(out PlayerEventDbContext db)
    {
        db = bdd.CreerContexte();
        return new EventStore(db);
    }

    // ------------------------------------------------- les formes temporelles

    /// <summary>
    /// Sept variantes, <b>huit formes en base</b> : une période peut être
    /// ouverte. C'est la huitième qu'on oublie, et l'oublier transformerait
    /// « depuis 1994 » en « 1994 » sans rien signaler.
    /// </summary>
    public static TheoryData<string, TemporalValue> Formes() => new()
    {
        { "date exacte", new ExactDate(new DateOnly(2004, 3, 15)) },
        { "mois", new Month(1994, 3) },
        { "année", new Year(1998) },
        { "période fermée", new YearRange(1993, 1997) },
        { "période ouverte", new YearRange(1994, null) },
        { "année approchée", new ApproximateYear(1994, 2) },
        { "âge non résolu", new Age(12) },
        { "inconnu", Unknown.Instance },
    };

    [Theory]
    [MemberData(nameof(Formes))]
    public async Task Chaque_forme_temporelle_survit_a_un_aller_retour(
        string nom, TemporalValue attendu)
    {
        var id = $"evt_{nom.GetHashCode():x8}";
        var magasin = Magasin(out var db);
        await using (db)
        {
            await magasin.AppendAsync(Evenement(id, attendu));
        }

        var relu = await Relire(id);

        Assert.Equal(attendu, relu.OccurredAt);
        Assert.Equal(attendu.GetType(), relu.OccurredAt.GetType());
    }

    [Fact]
    public async Task Un_age_non_resolu_reste_un_age_et_ne_devient_pas_une_annee()
    {
        // Invariant 3 : `Age` se stocke brut. Le convertir à l'écriture
        // rendrait impossible de recalculer tous les moments le jour où
        // l'année de naissance est renseignée.
        var magasin = Magasin(out var db);
        await using (db) await magasin.AppendAsync(Evenement("evt_age_brut", new Age(12)));

        var relu = await Relire("evt_age_brut");

        var age = Assert.IsType<Age>(relu.OccurredAt);
        Assert.Equal(12, age.Years);
    }

    [Fact]
    public async Task Inconnu_se_distingue_d_une_absence_de_valeur()
    {
        // « je ne sais plus » est une réponse ; `null` n'en est pas une.
        // Les confondre ferait disparaître l'événement de la zone sans date.
        var magasin = Magasin(out var db);
        await using (db) await magasin.AppendAsync(Evenement("evt_inconnu", Unknown.Instance));

        var relu = await Relire("evt_inconnu");

        Assert.IsType<Unknown>(relu.OccurredAt);
        Assert.Equal(ConfidenceLevel.None, relu.Confidence);
    }

    [Fact]
    public async Task Une_variante_temporelle_inconnue_en_base_est_refusee_et_non_lue_comme_inconnue()
    {
        // Le cas d'une donnée écrite par une version plus récente du modèle.
        // La lire comme « je ne sais plus » perdrait un souvenir en silence,
        // et le joueur verrait son jeu glisser dans la zone sans date sans
        // que rien ne l'explique. On préfère échouer.
        var magasin = Magasin(out var db);
        await using (db) await magasin.AppendAsync(Evenement("evt_futur", new Year(1998)));

        await ExecuterSql(
            "UPDATE player_events SET superseded_by_event_id = NULL WHERE id = 'evt_futur'");
        await ExecuterSql(
            "INSERT INTO player_events (id, user_id, type, target_kind, target_id, "
            + "occurred_kind, recorded_at) VALUES ('evt_v2', 'usr_test', 'StartedGame', "
            + "'work', 'wrk_mario', 'SeasonOfYear', now())");

        var erreur = await Assert.ThrowsAsync<NotSupportedException>(() => Relire("evt_v2"));

        Assert.Contains("SeasonOfYear", erreur.Message, StringComparison.Ordinal);
    }

    // ----------------------------------------------------- les deux axes

    [Fact]
    public async Task Une_declaration_de_2026_pour_un_fait_de_1998_garde_ses_deux_dates()
    {
        // La différence structurante avec un event sourcing classique. Les
        // confondre rend impossibles à la fois la timeline et l'audit.
        var magasin = Magasin(out var db);
        await using (db)
        {
            await magasin.AppendAsync(Evenement("evt_deux_axes", new Year(1998)));
        }

        var relu = await Relire("evt_deux_axes");

        Assert.Equal(new Year(1998), relu.OccurredAt);
        Assert.Equal(2026, relu.RecordedAt.Year);
        Assert.Equal(DateTimeKind.Utc, relu.RecordedAt.Kind);
    }

    [Fact]
    public async Task L_axe_exact_revient_en_UTC_a_la_microseconde()
    {
        // PostgreSQL stocke `timestamptz` à la MICROSECONDE ; .NET compte en
        // centaines de nanosecondes. Les 7 chiffres de ticks ne survivent donc
        // pas, et c'est une troncature silencieuse. On la constate ici plutôt
        // que de la découvrir sur un écart de tri.
        var precis = new DateTime(2026, 9, 21, 10, 30, 0, DateTimeKind.Utc)
            .AddTicks(1_234_567);
        var magasin = Magasin(out var db);
        await using (db)
        {
            await magasin.AppendAsync(Evenement("evt_precision", new Year(1998), enregistre: precis));
        }

        var relu = await Relire("evt_precision");

        var ecart = (relu.RecordedAt - precis).Duration();
        Assert.True(ecart < TimeSpan.FromMilliseconds(1), $"écart de {ecart.Ticks} ticks");
        Assert.Equal(precis.AddTicks(-(precis.Ticks % 10)), relu.RecordedAt);
    }

    // ------------------------------------------------------- l'ajout seul

    [Fact]
    public async Task Le_contexte_refuse_de_reecrire_un_evenement()
    {
        var magasin = Magasin(out var db);
        await using (db) await magasin.AppendAsync(Evenement("evt_fige", new Year(1998)));

        await using var autre = bdd.CreerContexte();
        var ligne = await autre.PlayerEvents.SingleAsync(e => e.Id == "evt_fige");
        ligne.Type = PlayerEventType.CompletedGame;

        var erreur = await Assert.ThrowsAsync<InvalidOperationException>(
            () => autre.SaveChangesAsync());
        Assert.Contains("evt_fige", erreur.Message, StringComparison.Ordinal);
    }

    [Fact]
    public async Task La_base_refuse_de_reecrire_un_evenement_meme_en_SQL_direct()
    {
        // Le garde-fou qui compte : le contexte ne protège que l'application.
        // Un script ou une console psql passeraient à côté.
        var magasin = Magasin(out var db);
        await using (db) await magasin.AppendAsync(Evenement("evt_sql", new Year(1998)));

        var erreur = await Assert.ThrowsAsync<PostgresException>(() => ExecuterSql(
            "UPDATE player_events SET type = 'CompletedGame' WHERE id = 'evt_sql'"));

        Assert.Contains("ajout seul", erreur.MessageText, StringComparison.Ordinal);
    }

    [Fact]
    public async Task Poser_le_marqueur_de_remplacement_est_permis()
    {
        // MODELE §5 : corriger chaîne un nouvel événement ET marque l'ancien.
        // Interdire tout UPDATE rendrait la correction impossible.
        var magasin = Magasin(out var db);
        await using (db)
        {
            await magasin.AppendAsync([
                Evenement("evt_ancien", new Year(1998)),
                Evenement("evt_correction", new Year(1999)),
            ]);
            await magasin.MarkSupersededAsync("usr_test", "evt_ancien", "evt_correction");
        }

        var relu = await Relire("evt_ancien");

        Assert.Equal("evt_correction", relu.SupersededByEventId);
    }

    [Fact]
    public async Task Re_pointer_un_marqueur_deja_pose_est_refuse_par_la_base()
    {
        // Poser le marqueur n'est pas réécrire ; le déplacer, si.
        var magasin = Magasin(out var db);
        await using (db)
        {
            await magasin.AppendAsync([
                Evenement("evt_marque", new Year(1998)),
                Evenement("evt_c1", new Year(1999)),
            ]);
            await magasin.MarkSupersededAsync("usr_test", "evt_marque", "evt_c1");
        }

        var erreur = await Assert.ThrowsAsync<PostgresException>(() => ExecuterSql(
            "UPDATE player_events SET superseded_by_event_id = 'evt_c2' WHERE id = 'evt_marque'"));

        Assert.Contains("deja remplace", erreur.MessageText, StringComparison.Ordinal);
    }

    [Fact]
    public async Task Le_contexte_refuse_la_suppression_d_un_evenement_isole()
    {
        var magasin = Magasin(out var db);
        await using (db) await magasin.AppendAsync(Evenement("evt_indelebile", new Year(1998)));

        await using var autre = bdd.CreerContexte();
        var ligne = await autre.PlayerEvents.SingleAsync(e => e.Id == "evt_indelebile");
        autre.PlayerEvents.Remove(ligne);

        var erreur = await Assert.ThrowsAsync<InvalidOperationException>(
            () => autre.SaveChangesAsync());
        Assert.Contains("ajout seul", erreur.Message, StringComparison.Ordinal);
    }

    // ---------------------------------------------------------- la purge

    [Fact]
    public async Task La_purge_efface_tout_d_un_utilisateur_et_de_lui_seul()
    {
        // §10.1 : purge physique, joignable par UserId seul. « Ajout seul »
        // veut dire qu'on ne réécrit pas une histoire, pas qu'on ne peut pas
        // effacer une personne.
        var magasin = Magasin(out var db);
        await using (db)
        {
            await magasin.AppendAsync([
                Evenement("evt_a1", new Year(1998), user: "usr_a"),
                Evenement("evt_a2", new Year(1999), user: "usr_a"),
                Evenement("evt_b1", new Year(2000), user: "usr_b"),
            ]);
        }

        var magasin2 = Magasin(out var db2);
        await using (db2)
        {
            var efface = await magasin2.PurgeUserAsync("usr_a");
            Assert.Equal(2, efface);
        }

        var magasin3 = Magasin(out var db3);
        await using (db3)
        {
            Assert.Empty(await magasin3.ReadAsync("usr_a"));
            Assert.Single(await magasin3.ReadAsync("usr_b"));
        }
    }

    // ----------------------------------------------------------- outillage

    private async Task<PlayerEvent> Relire(string id)
    {
        await using var db = bdd.CreerContexte();
        var ligne = await db.PlayerEvents.AsNoTracking().SingleAsync(e => e.Id == id);
        return PlayerEventMapping.ToDomain(ligne);
    }

    [Fact]
    public async Task Aucune_colonne_n_echappe_au_journal_en_ajout_seul()
    {
        // Le déclencheur ÉNUMÉRAIT ses colonnes, et `platform_id` — ajoutée
        // après lui — n'y figurait pas : elle pouvait être réécrite sans
        // que rien ne bronche. C'est la faute de l'apprentissage 66,
        // transposée au SQL : couvrir des colonnes n'est pas couvrir un
        // ensemble.
        //
        // Il compare désormais la ligne ENTIÈRE, marqueur de remplacement
        // excepté, et aucune colonne future ne peut lui échapper.
        var magasin = Magasin(out var db);
        await using (db) await magasin.AppendAsync(Evenement("evt_pf", new Year(1998)));

        var erreur = await Assert.ThrowsAsync<PostgresException>(() => ExecuterSql(
            "UPDATE player_events SET platform_id = 'plt_autre' WHERE id = 'evt_pf'"));

        Assert.Contains("ajout seul", erreur.MessageText, StringComparison.Ordinal);
    }

    [Fact]
    public async Task Aucune_table_d_utilisateur_n_echappe_a_la_purge()
    {
        // §19.4 fait de l'effacement une contrainte de CONCEPTION, pas une
        // fonctionnalité tardive : « l'effacement ne peut pas être une
        // pierre tombale ». Quatre tests éprouvent la purge, un par table —
        // mais **aucun ne garantissait l'exhaustivité**. Une cinquième table
        // portant un `user_id` serait oubliée en silence, et le produit est
        // une archive personnelle sur plusieurs décennies.
        //
        // On interroge donc le schéma RÉEL, et on le compare à une liste
        // écrite. Ajouter une table ici fait échouer ce test : c'est le
        // rappel qu'il faut étendre `PurgeUserAsync` en même temps.
        var tables = new List<string>();
        await using (var c = new NpgsqlConnection(bdd.ConnectionString))
        {
            await c.OpenAsync();
            await using var cmd = new NpgsqlCommand(
                """
                SELECT table_name FROM information_schema.columns
                WHERE table_schema = 'public' AND column_name = 'user_id'
                ORDER BY table_name
                """, c);
            await using var lecteur = await cmd.ExecuteReaderAsync();
            while (await lecteur.ReadAsync()) tables.Add(lecteur.GetString(0));
        }

        Assert.Equal(
            ["memories", "play_declarations", "player_events", "unresolved_claims"],
            tables);
    }

    private async Task ExecuterSql(string sql)
    {
        await using var c = new NpgsqlConnection(bdd.ConnectionString);
        await c.OpenAsync();
        await using var cmd = new NpgsqlCommand(sql, c);
        await cmd.ExecuteNonQueryAsync();
    }
}
