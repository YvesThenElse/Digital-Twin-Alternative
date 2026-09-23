import { t } from "../i18n/t";

/**
 * L'offre de reprise, au-dessus du temps 1 (E01).
 *
 * > « Retour d'un visiteur non authentifié : si un historique local existe,
 * > **proposer de le reprendre** plutôt que de recommencer. Perdre une
 * > saisie faite sans compte est le meilleur moyen de perdre
 * > l'utilisateur. »
 *
 * <b>Proposer, et non rediriger.</b> L'en-tête de la fiche annonce que `/`
 * « redirige vers `/mon-histoire` si l'historique n'est pas vide ». Les deux
 * phrases ne disent pas la même chose, et c'est la seconde qui tient tant
 * que l'écran de lecture n'a aucun retour vers la sélection : une
 * redirection dure y enfermerait le visiteur revenu ajouter une console.
 *
 * <b>Elle n'attend rien.</b> Le compte arrive quand il arrive ; jusque-là
 * l'accueil est entier et utilisable — « Chargement : aucun », et le
 * chronomètre du KPI démarre au premier clic, pas au chargement.
 */
export function RepriseProposee({
  moments,
  reprendre,
}: {
  /**
   * Ce que le profil contient, ou `null` tant qu'on ne sait pas.
   *
   * <b>Trois valeurs, pas deux.</b> « Je ne sais pas encore » et « il n'y a
   * rien » mènent au même rendu — aucune offre — mais pour des raisons
   * opposées, et les confondre ferait disparaître l'offre le jour où la
   * sonde tombe sans que rien ne le distingue d'un profil neuf.
   */
  moments: number | null;
  reprendre: () => void;
}) {
  if (moments === null || moments === 0) return null;

  return (
    <div className="reprise" data-testid="reprise">
      <p className="reprise-invite">
        {t(moments > 1 ? "reprise.invite.plusieurs" : "reprise.invite.un", { n: moments })}
      </p>
      {/* Une seule action. « Recommencer » n'a pas de bouton : c'est
          exactement ce que l'écran fait déjà si l'on ignore l'offre, et lui
          en donner un ferait de la continuité une décision. */}
      <button type="button" className="primaire" onClick={reprendre}>
        {t("reprise.action")}
      </button>
    </div>
  );
}
