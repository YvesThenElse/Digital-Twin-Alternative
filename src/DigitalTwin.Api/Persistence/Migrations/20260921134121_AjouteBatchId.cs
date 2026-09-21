using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DigitalTwin.Api.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AjouteBatchId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "batch_id",
                table: "player_events",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_player_events_user_id_batch_id",
                table: "player_events",
                columns: new[] { "user_id", "batch_id" });

            // Le déclencheur d'ajout seul compare les colonnes UNE À UNE :
            // une colonne nouvelle qu'il ne nomme pas serait réécrivable en
            // silence. On redéfinit donc la fonction en l'incluant.
            //
            // C'est le coût de cette forme de déclencheur, et il est assumé :
            // un `NEW.* IS DISTINCT FROM OLD.*` global refuserait aussi la
            // pose du marqueur de remplacement, que §5.3 exige.
            migrationBuilder.Sql("""
                CREATE OR REPLACE FUNCTION player_events_ajout_seul()
                RETURNS trigger AS $$
                BEGIN
                    IF (NEW.id, NEW.user_id, NEW.type, NEW.target_kind, NEW.target_id,
                        NEW.occurred_kind, NEW.occurred_date, NEW.occurred_year,
                        NEW.occurred_month, NEW.occurred_end_year, NEW.occurred_margin,
                        NEW.occurred_age, NEW.recorded_at, NEW.batch_id)
                       IS DISTINCT FROM
                       (OLD.id, OLD.user_id, OLD.type, OLD.target_kind, OLD.target_id,
                        OLD.occurred_kind, OLD.occurred_date, OLD.occurred_year,
                        OLD.occurred_month, OLD.occurred_end_year, OLD.occurred_margin,
                        OLD.occurred_age, OLD.recorded_at, OLD.batch_id)
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
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_player_events_user_id_batch_id",
                table: "player_events");

            migrationBuilder.DropColumn(
                name: "batch_id",
                table: "player_events");
        }
    }
}
