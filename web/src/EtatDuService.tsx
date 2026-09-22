import { t } from "./i18n/t";

export type EtatSante = {
  status: "ok" | "degraded";
  database: { status: "ok" | "unreachable"; detail: string };
};

/**
 * Le bandeau d'état du service — <b>il ne parle que quand il a quelque chose
 * à dire</b>.
 *
 * Il répond à une seule question, et elle ne se pose qu'après une panne :
 * <i>est-ce moi, ou est-ce le service ?</i> Un bandeau permanent y
 * répondrait « tout va bien » en continu, ce que §5 ne demande pas et que
 * E02 écarte pour la synchronisation — « signalé une seule fois,
 * discrètement, en pied d'écran, jamais par ligne ». On cesse de lire un
 * bandeau qui ne dit jamais rien, y compris le jour où il devient rouge.
 *
 * <b>Deux états ont donc été retirés</b>, pas mis en réserve : « disponible »
 * et « pas encore su » n'avaient aucun producteur qui les affiche, et une
 * branche que personne n'atteint est exactement ce que l'audit reprochait à
 * ce composant.
 *
 * `data-etat` porte l'état lisible par la machine. Ce n'est pas du confort de
 * test : « indisponible » contient « disponible », et une assertion sur le
 * texte seul passe pour la mauvaise raison ou échoue pour la bonne.
 */
export function EtatDuService({ etat }: { etat?: EtatSante }) {
  if (etat === undefined || etat.status === "ok") return null;

  return (
    <p role="status" data-etat="indisponible" className="etat-service">
      {t("service.indisponible", { detail: etat.database.detail })}
    </p>
  );
}
