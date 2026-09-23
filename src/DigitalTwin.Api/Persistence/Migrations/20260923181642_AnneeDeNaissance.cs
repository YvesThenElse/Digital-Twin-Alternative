using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DigitalTwin.Api.Persistence.Migrations
{
    /// <summary>
    /// L'année de naissance — <b>demandée au moment où elle sert</b> (§7.6).
    ///
    /// <para>Sans elle, « vers mes 12 ans » n'a aucune place sur l'axe : le
    /// domaine le traite comme <c>Unknown</c> et le moment tombe dans le
    /// tiroir. C'est pourquoi le repli de précision d'E07 ne propose l'âge
    /// qu'une fois l'année connue, et propose d'abord de la renseigner en
    /// expliquant à quoi elle sert — « jamais un champ de plus sans
    /// justification ».</para>
    ///
    /// <para><b>Une table à part, et nullable.</b> Elle décrit la personne et
    /// non un moment : la ranger dans le journal la rendrait révisable par
    /// chaînage, alors qu'elle se corrige simplement — et corriger doit
    /// RECALCULER tous les moments datés par un âge, ce que l'horizon fait
    /// déjà à la lecture. <c>null</c> est l'état normal : une valeur par
    /// défaut affirmerait une date que personne n'a donnée.</para>
    ///
    /// <para>Elle porte <c>user_id</c>, donc elle entre dans la purge de
    /// §10.1 — <c>EventStoreTests.Aucune_table_d_utilisateur_n_echappe_a_la_purge</c>
    /// l'a exigé avant qu'une ligne de code ne la lise.</para>
    /// </summary>
    public partial class AnneeDeNaissance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "player_profiles",
                columns: table => new
                {
                    user_id = table.Column<string>(type: "text", nullable: false),
                    birth_year = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_player_profiles", x => x.user_id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "player_profiles");
        }
    }
}
