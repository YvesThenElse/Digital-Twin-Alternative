import { t } from "../i18n/t";
import type { Bande } from "./bande";

/**
 * La récompense permanente du pied d'écran (E02 repère D).
 *
 * **Ce n'est pas un compteur, c'est une forme qui s'étend.** Un nombre qui
 * monte ne récompense rien ; une bande qui grandit montre ce que
 * l'utilisateur est en train de construire — la seule réponse que §24.4
 * donne à « pourquoi passer deux heures à saisir ».
 *
 * Les attributs `data-*` ne sont pas du confort de test : ils portent l'état
 * lisible par la machine, là où le texte seul serait ambigu (leçon de
 * l'item 01 — « indisponible » contient « disponible »).
 */
export function BandeDEpoque({ bande }: { bande: Bande }) {
  const maximum = Math.max(1, ...bande.tranches.map((t) => t.compte));

  return (
    <figure
      data-testid="bande-epoque"
      data-total={bande.total}
      data-tranches={bande.tranches.length}
      data-sans-date={bande.sansDate}
      aria-label={t("bande.intitule")}
    >
      <div role="presentation" className="bande">
        {bande.tranches.map((tranche) => (
          <span
            key={tranche.annee}
            className="bande-tranche"
            // La hauteur relative au maximum : une répartition, pas une échelle
            // absolue qui écraserait tout dès qu'une année domine.
            style={{ height: `${(tranche.compte / maximum) * 100}%` }}
            title={`${tranche.annee} : ${tranche.compte}`}
          />
        ))}
      </div>
      <figcaption>
        {bande.periode ? (
          <span>
            {t("bande.periode", {
              debut: bande.periode.debut,
              fin: bande.periode.fin,
            })}
          </span>
        ) : null}
        <span>
          {t(bande.total > 1 ? "bande.declares.plusieurs" : "bande.declares.un", {
            n: bande.total,
          })}
        </span>
        {bande.sansDate > 0 ? (
          // Comptés, jamais placés. Le dire évite que l'écart entre le total
          // et la bande passe pour une erreur.
          <span>{t("bande.sansDate", { n: bande.sansDate })}</span>
        ) : null}
      </figcaption>
    </figure>
  );
}
