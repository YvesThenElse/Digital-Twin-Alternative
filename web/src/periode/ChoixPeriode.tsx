import { useState } from "react";
import { accentEpoque } from "../disposition/epoque";
import { t } from "../i18n/t";
import type { Plateforme } from "../selection/types";
import { nomDecennie, type PeriodeChoisie } from "./periode";

/**
 * E01, temps 2 — situer dans le temps, par décennie.
 *
 * <b>« Des cartes de décennie, pas un curseur. »</b> La fiche donne la
 * raison et elle est mesurée : un curseur couvrant vingt-cinq ans sur
 * 343 px donne douze pixels par année, « le pire contrôle tactile
 * possible ». Un champ numérique n'est pas meilleur — c'est la
 * <b>question nue</b> que §311 de la spécification nomme comme
 * l'anti-motif : le référentiel doit travailler pour l'utilisateur au lieu
 * de l'interroger à vide.
 *
 * Et surtout la granularité est <b>honnête</b> : « personne ne se souvient
 * de l'année exacte de sa première console ». La valeur enregistrée est un
 * intervalle sur la décennie, « une réponse parfaitement valide ».
 *
 * L'affinage n'apparaît qu'ensuite, et reste <b>facultatif</b> : on peut
 * l'ignorer et continuer.
 */
export function ChoixPeriode({
  machine,
  anneeCourante,
  choisir,
}: {
  machine: Plateforme;
  /**
   * Requise, sans valeur par défaut. Lire l'horloge ici rendrait le
   * composant intestable dans le temps — un test qui dépend du jour où on
   * le lance finit toujours par échouer un matin.
   */
  anneeCourante: number;
  choisir: (periode: PeriodeChoisie) => void;
}) {
  const [decennie, setDecennie] = useState<number | null>(null);

  /**
   * Les décennies où la machine a existé, bornées des deux côtés.
   *
   * Proposer « années 80 » sur une console de 1990 ferait perdre du temps à
   * tout le monde — et les années 80 d'une NES commencent en 1983, pas en
   * 1980 : la console n'existait pas avant.
   */
  const decennies: number[] = [];
  for (
    let d = Math.floor(machine.launchYear / 10) * 10;
    d <= anneeCourante;
    d += 10
  ) {
    decennies.push(d);
  }

  const debutDe = (d: number) => Math.max(d, machine.launchYear);
  const finDe = (d: number) => Math.min(d + 9, anneeCourante);

  return (
    <section>
      <h2>{t("parcours.choisirPeriode")}</h2>

      <div className="grille-cartes">
        {decennies.map((d) => {
          // L'accent d'une décennie est celui de son milieu : la borne
          // basse d'une décennie tombe pile sur un changement d'époque, et
          // prendre le début ferait porter aux années 90 la couleur des
          // 8 bits.
          const epoque = accentEpoque(d + 5);
          return (
            <button
              key={d}
              type="button"
              className="carte"
              data-testid="carte-decennie"
              data-epoque={epoque.nom}
              aria-pressed={decennie === d}
              // ⚠️ Le clic NE DÉCIDE RIEN : il ouvre l'affinage, il ne
              // navigue pas. Décider ici faisait valider la période ET
              // quitter l'écran, si bien que le panneau d'affinage
              // n'apparaissait que le temps des deux requêtes de relecture —
              // sur une machine rapide, l'utilisateur perdait la course, et
              // l'affinage « facultatif » d'E01 devenait inatteignable.
              //
              // C'est « quelque part dans les années 90 » qui continue, et
              // il existait déjà : E01 le décrit comme la réponse de qui
              // veut ignorer l'affinage.
              onClick={() => setDecennie(d)}
            >
              <span className="carte-nom">{t("periode.decennie", { d: nomDecennie(d) })}</span>
              <span className="carte-meta">
                {t("periode.bornes", { debut: String(debutDe(d)), fin: String(finDe(d)) })}
              </span>
            </button>
          );
        })}
      </div>

      {/* En UN geste : c'est la réponse la plus fréquente, et la plus
          honnête. Lui imposer une confirmation la ferait éviter, et
          l'utilisateur inventerait une date plutôt que de l'avouer. */}
      <button type="button" className="discret" onClick={() => choisir({ kind: "unknown" })}>
        {t("parcours.periodeInconnue")}
      </button>

      {decennie !== null ? (
        <div data-testid="affinage">
          <p>{t("periode.affiner")}</p>
          {/* Deux moitiés, et le refus d'affiner. Jamais une année exacte :
              resserrer ne doit pas devenir affirmer. */}
          {[0, 5].map((offset) => {
            const debut = Math.max(decennie + offset, machine.launchYear);
            const fin = Math.min(decennie + offset + 4, anneeCourante);
            if (debut > fin) return null;
            return (
              <button
                key={offset}
                type="button"
                onClick={() => choisir({ kind: "range", from: debut, to: fin })}
              >
                {t("periode.bornes", { debut: String(debut), fin: String(fin) })}
              </button>
            );
          })}
          <button
            type="button"
            className="discret"
            onClick={() =>
              choisir({ kind: "range", from: debutDe(decennie), to: finDe(decennie) })
            }
          >
            {t("periode.quelquePart", { d: nomDecennie(decennie) })}
          </button>
        </div>
      ) : null}
    </section>
  );
}
