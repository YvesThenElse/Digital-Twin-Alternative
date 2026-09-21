using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DigitalTwin.Api.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AjouteDeclarations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "play_declarations",
                columns: table => new
                {
                    user_id = table.Column<string>(type: "text", nullable: false),
                    work_id = table.Column<string>(type: "text", nullable: false),
                    platform_id = table.Column<string>(type: "text", nullable: false),
                    never_played = table.Column<bool>(type: "boolean", nullable: false),
                    provenance = table.Column<string>(type: "text", nullable: false),
                    affect = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_play_declarations", x => new { x.user_id, x.work_id, x.platform_id });
                });

            migrationBuilder.CreateIndex(
                name: "IX_play_declarations_user_id",
                table: "play_declarations",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "play_declarations");
        }
    }
}
