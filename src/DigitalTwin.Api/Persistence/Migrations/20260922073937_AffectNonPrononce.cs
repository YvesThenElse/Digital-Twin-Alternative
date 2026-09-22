using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DigitalTwin.Api.Persistence.Migrations
{
    /// <summary>
    /// « Sans plus » n'est plus la valeur par défaut de l'affect.
    ///
    /// <para><b>Aucun changement de schéma</b> : la valeur par défaut vivait
    /// dans l'initialiseur C# de la ligne, pas dans la colonne. Ce qui reste
    /// à faire est une correction de DONNÉES.</para>
    ///
    /// <para><b>Pourquoi réécrire des lignes existantes</b>, alors que le
    /// journal est en ajout seul : ces lignes ne sont pas des événements mais
    /// des jugements, révisables par nature, et surtout <b>aucune de ces
    /// valeurs n'a été saisie</b>. Aucun écran n'a jamais posé la question
    /// « ça vous a marqué ? » — tout <c>Indifferent</c> en base est donc un
    /// défaut de colonne, jamais une réponse. Les laisser affirmerait que le
    /// joueur a déclaré que ces jeux ne lui avaient rien laissé.</para>
    /// </summary>
    public partial class AffectNonPrononce : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "UPDATE play_declarations SET affect = 'Unstated' WHERE affect = 'Indifferent';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Rien. Revenir en arrière consisterait à réaffirmer « sans plus »
            // sur des lignes où personne ne l'a dit — et, le jour où l'écran
            // posera la question, cela détruirait de vraies réponses sans
            // pouvoir les distinguer des défauts. Une correction qui supprime
            // une affirmation fausse n'a pas d'inverse à restaurer.
        }
    }
}
