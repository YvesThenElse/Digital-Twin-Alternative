using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DigitalTwin.Api.Persistence.Migrations
{
    /// <summary>
    /// « J'y joue encore » cesse d'être un silence (§4.6).
    ///
    /// <para><b>Faux par défaut, et les lignes existantes le restent</b> —
    /// ce qui est juste : personne ne l'a déclaré, et une valeur par défaut
    /// ne doit affirmer aucune réponse. C'est la même leçon que la migration
    /// <c>AffectNonPrononce</c>, où le défaut de colonne faisait dire « sans
    /// plus » à quatre jeux dont la question n'avait jamais été posée.</para>
    ///
    /// <para>La position <c>StillPlaying</c> que <c>CompletionProjection</c>
    /// calcule depuis le journal n'est pas touchée : elle répond « où en est
    /// la partie ? », cette colonne répond « qu'a dit le joueur ? ». Le
    /// journal ne peut pas les distinguer — un jeu coché et un jeu déclaré
    /// « en cours » produisent les mêmes événements.</para>
    /// </summary>
    public partial class ToujoursEnCours : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "still_playing",
                table: "play_declarations",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "still_playing",
                table: "play_declarations");
        }
    }
}
