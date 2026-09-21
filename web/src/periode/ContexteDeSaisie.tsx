import { t } from "../i18n/t";
import { libelle } from "../temporel/valeur";
import { versValeurTemporelle, type PeriodeChoisie } from "./periode";

/**
 * Le contexte fixe de la sélection massive — E02, repère A.
 *
 * <b>Plateforme, région, et période appliquée aux déclarations suivantes.</b>
 * Sans ce bandeau, l'utilisateur coche trente lignes sans savoir à quelle
 * date elles s'attachent, et ne le découvre qu'une fois sur la timeline.
 *
 * La période est rendue par `libelle`, la même fonction que la timeline :
 * deux rendus séparés divergeraient, et l'écran annoncerait une période
 * différente de celle qu'il attache.
 */
export function ContexteDeSaisie({
  machine,
  region,
  periode,
  changer,
}: {
  machine: string;
  region: string;
  periode: PeriodeChoisie;
  changer: () => void;
}) {
  return (
    <p data-testid="contexte">
      <span>{t("parcours.machine", { machine, region })}</span>
      <span>{libelle(versValeurTemporelle(periode))}</span>
      <button type="button" onClick={changer}>{t("contexte.changer")}</button>
      {/* La règle reste écrite : c'est la source d'erreur la plus probable
          de l'écran, et la supposer connue la rendrait invisible. */}
      <small>{t("contexte.sApplique")}</small>
    </p>
  );
}
