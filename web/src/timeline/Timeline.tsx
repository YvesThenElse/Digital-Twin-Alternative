import { useState } from "react";
import { accentEpoque } from "../disposition/epoque";
import { t } from "../i18n/t";
import { ZoneSansDate } from "../temporel/ZoneSansDate";
import { Icone, type NomIcone } from "../icones/Icone";
import { forme, libelle } from "../temporel/valeur";
import type { EntreeTimeline, MomentTimeline } from "./types";

/**
 * E03 — la timeline.
 *
 * <b>Un écran de lecture, pas un tableau de bord.</b> Les chiffres
 * appartiennent à E04 et E10 ; ici l'unité est le moment.
 *
 * <b>L'ordre vient du domaine.</b> `TimelineSorter` le calcule, 387 tests du
 * domaine le valident, et cet écran le rend tel quel. Retrier ici, même
 * « pour stabiliser », ferait diverger l'affichage du modèle sans que rien
 * ne le signale — et la timeline bougerait d'une visite à l'autre, ce que
 * l'utilisateur ne distingue pas d'une perte de données.
 */
export function Timeline({
  entrees,
  sansDate,
}: {
  entrees: EntreeTimeline[];
  sansDate: MomentTimeline[];
}) {
  return (
    <section>
      <h2>{t("timeline.titre")}</h2>

      {/* Vide : une invitation, pas un blanc. Un axe vierge se lit comme une
          panne ; la phrase dit qu'il n'y a rien à cause de l'histoire, pas à
          cause de l'écran. */}
      {entrees.length === 0 && sansDate.length === 0 ? (
        <p>{t("timeline.invitation")}</p>
      ) : null}

      <ol data-testid="axe" data-entrees={entrees.length}>
        {entrees.map((entree) => (
          <Entree key={entree.moments[0].id} entree={entree} />
        ))}
      </ol>

      <ZoneSansDate
        moments={sansDate.map((m) => ({
          id: m.id,
          intitule: m.targetLabel,
          quand: m.occurredAt,
        }))}
      />
    </section>
  );
}

/**
 * Ce qu'un type d'événement montre de lui-même.
 *
 * <b>Quatre types sur onze ont un producteur</b> ; les sept autres sont des
 * capacités en avance, inscrites comme telles dans le modèle. Le jour où
 * l'un arrivera, l'axe ne doit pas le peindre en « joué » : il dit qu'il ne
 * sait pas, ce qui est une information — contrairement à un faux.
 */
const MARQUES: Record<string, NomIcone> = {
  StartedGame: "joue",
  CompletedGame: "fini",
  AbandonedGame: "abandonne",
  AcquiredItem: "possede",
};

function Marque({ type }: { type: string }) {
  const icone = MARQUES[type];
  return (
    <span className="moment-marque" data-testid="moment-marque">
      {icone === undefined ? type : <Icone nom={icone} />}
    </span>
  );
}

function Entree({ entree }: { entree: EntreeTimeline }) {
  const [deplie, setDeplie] = useState(false);
  const annee = Number(entree.interval.start.slice(0, 4));
  const epoque = accentEpoque(Number.isNaN(annee) ? null : annee);
  const visible = entree.isEpisode ? deplie : true;

  return (
    <li
      data-episode={entree.isEpisode}
      data-moments={entree.moments.length}
      data-epoque={epoque.nom}
      // L'accent porte le repérage temporel : on sait où l'on est sans lire
      // de date. Le nom seul ne suffit pas : une bande nommée mais non
      // peinte se lit comme un défaut d'affichage.
      style={{ borderInlineStartColor: epoque.accent }}
    >
      {entree.isEpisode ? (
        // Une bande, pas une pile. Empiler douze moments identiques ferait
        // croire à douze souvenirs distincts, et l'axe deviendrait illisible
        // dès le premier passage en sélection massive (§4.4).
        <button
          type="button"
          aria-expanded={deplie}
          onClick={() => setDeplie((d) => !d)}
        >
          {t("timeline.deplier", { n: entree.moments.length })}
        </button>
      ) : null}

      {visible ? (
        <ul>
          {entree.moments.map((moment) => (
            <li key={moment.id} className="moment">
              <Marque type={moment.type} />
              {/* Un titre saisi n'est pas une œuvre curée : E02 le marque,
                  l'axe le donnait pour une entrée du catalogue. */}
              <span
                data-testid="moment-titre"
                data-canonique={String(moment.targetKind === "work")}
              >
                {moment.targetLabel}
              </span>
              <span data-forme={forme(moment.occurredAt)}>
                {libelle(moment.occurredAt)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}
