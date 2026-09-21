using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DigitalTwin.Api.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "player_events",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    user_id = table.Column<string>(type: "text", nullable: false),
                    type = table.Column<string>(type: "text", nullable: false),
                    target_kind = table.Column<string>(type: "text", nullable: false),
                    target_id = table.Column<string>(type: "text", nullable: false),
                    occurred_kind = table.Column<string>(type: "text", nullable: false),
                    occurred_date = table.Column<DateOnly>(type: "date", nullable: true),
                    occurred_year = table.Column<int>(type: "integer", nullable: true),
                    occurred_month = table.Column<int>(type: "integer", nullable: true),
                    occurred_end_year = table.Column<int>(type: "integer", nullable: true),
                    occurred_margin = table.Column<int>(type: "integer", nullable: true),
                    occurred_age = table.Column<int>(type: "integer", nullable: true),
                    recorded_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    superseded_by_event_id = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_player_events", x => new { x.user_id, x.id });
                });

            migrationBuilder.CreateIndex(
                name: "IX_player_events_user_id",
                table: "player_events",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_player_events_user_id_target_id",
                table: "player_events",
                columns: new[] { "user_id", "target_id" });

            // L'ajout seul, tenu par la BASE et non seulement par le code.
            //
            // Le contexte EF refuse déjà les réécritures, mais il ne protège
            // que l'application. Un script, une console psql ou une future
            // application passeraient à côté. Le déclencheur, lui, tient pour
            // tout le monde.
            //
            // Ce qu'il autorise, et pourquoi :
            //   - poser `superseded_by_event_id`, UNE fois. MODELE §5 dit que
            //     corriger « marque l'ancien comme remplacé » : l'interdire
            //     rendrait la correction impossible. Le re-pointer, en
            //     revanche, réécrirait bien l'histoire.
            //   - la SUPPRESSION reste possible, parce que §10.1 exige une
            //     purge physique par utilisateur. « Ajout seul » veut dire
            //     qu'on ne réécrit pas une histoire, pas qu'on ne peut pas
            //     effacer une personne.
            migrationBuilder.Sql("""
                CREATE OR REPLACE FUNCTION player_events_ajout_seul()
                RETURNS trigger AS $$
                BEGIN
                    IF (NEW.id, NEW.user_id, NEW.type, NEW.target_kind, NEW.target_id,
                        NEW.occurred_kind, NEW.occurred_date, NEW.occurred_year,
                        NEW.occurred_month, NEW.occurred_end_year, NEW.occurred_margin,
                        NEW.occurred_age, NEW.recorded_at)
                       IS DISTINCT FROM
                       (OLD.id, OLD.user_id, OLD.type, OLD.target_kind, OLD.target_id,
                        OLD.occurred_kind, OLD.occurred_date, OLD.occurred_year,
                        OLD.occurred_month, OLD.occurred_end_year, OLD.occurred_margin,
                        OLD.occurred_age, OLD.recorded_at)
                    THEN
                        RAISE EXCEPTION
                            'journal en ajout seul : l''evenement % ne peut pas etre reecrit',
                            OLD.id USING ERRCODE = 'check_violation';
                    END IF;

                    IF OLD.superseded_by_event_id IS NOT NULL
                       AND OLD.superseded_by_event_id IS DISTINCT FROM NEW.superseded_by_event_id
                    THEN
                        RAISE EXCEPTION
                            'l''evenement % est deja remplace par % : un marqueur ne se re-pointe pas',
                            OLD.id, OLD.superseded_by_event_id USING ERRCODE = 'check_violation';
                    END IF;

                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;

                CREATE TRIGGER player_events_ajout_seul
                BEFORE UPDATE ON player_events
                FOR EACH ROW EXECUTE FUNCTION player_events_ajout_seul();
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "DROP TRIGGER IF EXISTS player_events_ajout_seul ON player_events;");
            migrationBuilder.Sql("DROP FUNCTION IF EXISTS player_events_ajout_seul();");
            migrationBuilder.DropTable(
                name: "player_events");
        }
    }
}
