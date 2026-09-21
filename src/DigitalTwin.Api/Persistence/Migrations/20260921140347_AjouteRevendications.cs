using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DigitalTwin.Api.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AjouteRevendications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "unresolved_claims",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    user_id = table.Column<string>(type: "text", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    normalized_title = table.Column<string>(type: "text", nullable: false),
                    platform_id = table.Column<string>(type: "text", nullable: false),
                    resolved_work_id = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_unresolved_claims", x => new { x.user_id, x.id });
                });

            migrationBuilder.CreateIndex(
                name: "IX_unresolved_claims_user_id_normalized_title_platform_id",
                table: "unresolved_claims",
                columns: new[] { "user_id", "normalized_title", "platform_id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "unresolved_claims");
        }
    }
}
