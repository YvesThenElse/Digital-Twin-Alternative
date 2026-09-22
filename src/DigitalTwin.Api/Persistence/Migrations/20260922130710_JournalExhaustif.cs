using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DigitalTwin.Api.Persistence.Migrations
{
    /// <inheritdoc />
    /// <summary>
    /// Le journal en ajout seul, garanti sur la ligne ENTIÈRE.
    ///
    /// <para>Le déclencheur <b>énumérait ses colonnes</b>. `platform_id`,
    /// ajoutée après lui, n'y figurait pas : elle pouvait être réécrite sans
    /// qu'aucune exception ne se lève — vérifié. C'est la faute de
    /// l'apprentissage 66 transposée au SQL : couvrir des colonnes n'est pas
    /// couvrir un ensemble, et une liste tenue à la main se périme dès la
    /// migration suivante.</para>
    ///
    /// <para>Il compare désormais la ligne entière en JSON, le marqueur de
    /// remplacement excepté. <b>Aucune colonne future ne peut lui
    /// échapper</b>, et il n'y a plus de liste à tenir.</para>
    /// </summary>
    public partial class JournalExhaustif : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                CREATE OR REPLACE FUNCTION player_events_ajout_seul()
                RETURNS trigger AS $$
                BEGIN
                    IF to_jsonb(NEW) - 'superseded_by_event_id'
                       IS DISTINCT FROM
                       to_jsonb(OLD) - 'superseded_by_event_id'
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
            // Rien. Revenir en arrière rouvrirait le trou sur `platform_id`
            // et sur toute colonne ajoutée depuis.
        }
    }
}
