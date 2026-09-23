import { accentEpoque } from "../disposition/epoque";
import { t } from "../i18n/t";

/** Une décennie de l'histoire, telle que l'API la rend. */
export type TrancheActivite = { decade: number; moments: number };

/**
 * E04, bloc ⒟ — <b>les périodes d'activité</b>.
 *
 * « Densité de moments dans le temps, colorée par époque. C'est la
 * visualisation qui fait dire *c'est vrai, j'ai peu joué entre 2005 et
 * 2010* — et le bloc le plus immédiatement parlant de l'écran. »
 *
 * <b>Les creux sont le sujet.</b> Une bande qui ne montrerait que les
 * décennies peuplées serait pleine, et ne dirait plus rien : c'est
 * l'alternance qui parle. Les décennies vides viennent donc du domaine, à
 * zéro, et gardent leur place.
 *
 * <b>Elle ne compte rien.</b> Le domaine a compté ; l'écran met en forme. Un
 * recompte ici porterait sur ce qui est chargé, et l'axe ne charge pas tout.
 *
 * <b>Et elle a une HAUTEUR.</b> Une bande déclarée en attribut et invisible
 * à l'écran ne fait rien dire à personne — c'est le défaut qu'a déjà eu la
 * bande d'époque, dont les barres portaient un pourcentage dans un
 * conteneur qui n'en avait pas.
 */
export function BandeDActivite({ tranches }: { tranches: TrancheActivite[] }) {
  // Relative au maximum : une échelle absolue écraserait tout dès qu'une
  // décennie domine, et c'est justement le contraste qu'on vient lire.
  const maximum = Math.max(1, ...tranches.map((tr) => tr.moments));

  return (
    <figure
      className="activite"
      data-testid="activite"
      data-tranches={tranches.length}
      aria-label={t("portrait.activite")}
    >
      <div role="presentation" className="activite-bande">
        {tranches.map((tranche) => {
          // L'accent du MILIEU de la décennie : sa borne basse tombe pile
          // sur un changement d'époque, et prendre le début ferait porter
          // aux années 90 la couleur des 8 bits.
          const epoque = accentEpoque(tranche.decade + 5);
          return (
            <span
              key={tranche.decade}
              className="activite-tranche"
              data-decennie={tranche.decade}
              data-moments={tranche.moments}
              data-epoque={epoque.nom}
              style={{
                height: `${(tranche.moments / maximum) * 100}%`,
                backgroundColor: epoque.accent,
              }}
              title={t("portrait.activiteTranche", {
                decennie: tranche.decade,
                n: tranche.moments,
              })}
            />
          );
        })}
      </div>
      <figcaption className="activite-bornes">
        <span>{tranches[0]?.decade}</span>
        <span>{tranches[tranches.length - 1]?.decade}</span>
      </figcaption>
    </figure>
  );
}
