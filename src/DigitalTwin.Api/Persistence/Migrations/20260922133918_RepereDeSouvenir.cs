using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DigitalTwin.Api.Persistence.Migrations
{
    /// <summary>
    /// Le repère court du souvenir (§9.2).
    ///
    /// <para><b>Nullable, et borné à 80 caractères.</b> Facultatif par
    /// spécification : une colonne non nulle avec un défaut vide ne saurait
    /// plus distinguer « pas de repère » de « repère effacé », et l'axe
    /// afficherait une marque annonçant une phrase introuvable. La borne est
    /// dans la COLONNE en plus du point d'entrée : une règle qui ne vit que
    /// dans la couche qui valide disparaît le jour où un autre chemin écrit.</para>
    ///
    /// <para>Les souvenirs déjà écrits restent intacts et sans repère — ce
    /// qu'ils sont réellement : personne ne le leur a demandé.</para>
    /// </summary>
    public partial class RepereDeSouvenir : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "title",
                table: "memories",
                type: "character varying(80)",
                maxLength: 80,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "title",
                table: "memories");
        }
    }
}
