import { t } from "./i18n/t";

export type EtatSante = {
  status: "ok" | "degraded";
  database: { status: "ok" | "unreachable"; detail: string };
};

/**
 * Le bandeau d'état du service.
 *
 * Trois états et non deux : disponible, indisponible, **pas encore su**.
 * L'absence de réponse n'est pas une réponse — la même règle que les trois
 * états de région du référentiel. Un bandeau vert par défaut affirmerait
 * précisément ce qu'on ignore.
 *
 * `data-etat` porte l'état lisible par la machine. Ce n'est pas du confort de
 * test : « indisponible » contient « disponible », et une assertion sur le
 * texte seul passe pour la mauvaise raison ou échoue pour la bonne.
 */
export function EtatDuService({ etat }: { etat?: EtatSante }) {
  if (!etat) {
    return (
      <p role="status" data-etat="inconnu">
        {t("service.verification")}
      </p>
    );
  }
  if (etat.status === "ok") {
    return (
      <p role="status" data-etat="disponible">
        {t("service.disponible")}
      </p>
    );
  }
  return (
    <p role="status" data-etat="indisponible">
      {t("service.indisponible", { detail: etat.database.detail })}
    </p>
  );
}
