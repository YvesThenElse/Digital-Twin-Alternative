import { t } from "../i18n/t";

/** Les deux bornes de l'histoire, telles que l'API les rend. */
export type EtendueDuProfil = { firstYear: number; lastYear: number };

/**
 * E04, bloc ⒞ — <b>la ligne du temps condensée</b>.
 *
 * <b>Elle doit gagner sa place.</b> En Phase 1, E03 et E04 sont un seul
 * écran : l'axe complet est juste en dessous, et un aperçu qui le redirait
 * ferait deux fois la même chose sur un écran dont la densité doit rester
 * faible (E04, principe 3). Ce qu'elle montre et que l'axe ne montre pas,
 * c'est l'<b>étendue</b> — « 1991 → 2019 » d'un seul regard, là où l'axe
 * déroule.
 *
 * <b>Elle ne mène nulle part</b>, et c'est la même raison. La fiche promet
 * « un aperçu non interactif, avec une entrée vers E03 » ; tant que la fusion
 * dure, cette entrée pointerait sur l'écran où l'on se trouve déjà. Le bloc
 * est muet, et il le reste jusqu'à la séparation de la Phase 3.
 *
 * <b>Ni titres ni moments</b> : les remettre ici recréerait l'axe en petit,
 * donc la duplication qu'on vient d'écarter.
 *
 * <b>Et elle a une hauteur.</b> Une ligne déclarée en attribut et invisible à
 * l'écran ne fait rien dire à personne — le défaut qu'ont déjà eu la bande
 * d'époque et la bande d'activité. La garde est dans le navigateur, et elle
 * mesure.
 */
export function LigneDuTemps({ etendue }: { etendue: EtendueDuProfil }) {
  return (
    <figure
      className="etendue"
      data-testid="etendue"
      data-debut={etendue.firstYear}
      data-fin={etendue.lastYear}
      aria-label={t("portrait.etendue", {
        debut: etendue.firstYear,
        fin: etendue.lastYear,
      })}
    >
      {/* `presentation` : la ligne et ses deux pastilles ne portent aucune
          information que les bornes ci-dessous ne disent déjà en toutes
          lettres. Les annoncer deux fois allongerait la lecture vocale d'un
          en-tête qui tient en trois phrases. */}
      <div role="presentation" className="etendue-ligne">
        <span className="etendue-borne" />
        <span className="etendue-borne" />
      </div>
      <figcaption className="etendue-bornes">
        <span>{etendue.firstYear}</span>
        {/* Une seule année quand l'histoire tient dedans : « 1998 → 1998 »
            se lirait comme une erreur d'affichage. */}
        {etendue.lastYear !== etendue.firstYear ? (
          <span>{etendue.lastYear}</span>
        ) : null}
      </figcaption>
    </figure>
  );
}
