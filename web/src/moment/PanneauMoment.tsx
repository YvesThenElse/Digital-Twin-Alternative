import { useState } from "react";
import type { CleMessage } from "../i18n/messages";
import { t } from "../i18n/t";
import type { PeriodeChoisie } from "../periode/periode";
import {
  CHOIX_ACHEVEMENT,
  CHOIX_AFFECT,
  CHOIX_PROVENANCE,
  Question,
} from "../selection/Question";
import { anneeDe } from "../temporel/valeur";
import type { MomentTimeline } from "../timeline/types";

/** Les trois champs que la passe 2 règle (§4.5 à §4.7). */
export type ChampEtat = "completion" | "provenance" | "affect";

/** Ce que le joueur a déjà dit de ce jeu. `null` = pas prononcé. */
export type EtatDuJeu = Record<ChampEtat, string | null>;

/**
 * Les sept réponses — <b>trois au premier plan, quatre dans le repli</b>.
 *
 * « Réduire l'interface à trois choix ne réduit pas `TemporalValue` : les
 * sept variantes existent, restent enregistrables, et sont accessibles par
 * le repli. C'est l'exposition qui est hiérarchisée, pas le modèle qui est
 * amputé. »
 */
type Mode = "annee" | "periode" | "inconnu" | "mois" | "date" | "vers" | "age";

/**
 * Comment ouvrir le panneau sur ce qui a été enregistré.
 *
 * E07, état « Édition » : « la granularité affichée est celle qui a été
 * enregistrée (un `Range` ouvre directement sur deux champs) ». Rouvrir une
 * période sur une année seule ferait perdre sa fin au premier
 * enregistrement.
 *
 * <b>Les quatre autres variantes se replient sur l'année</b> — mois, date
 * exacte, « vers », âge. Leur repli de précision n'est pas encore construit,
 * et aucun geste de la Phase 1 ne les produit : ce chemin n'est donc pas
 * atteignable par le produit livré, et il vaut mieux qu'il ouvre sur l'année
 * nominale que sur un champ vide.
 */
function modeInitial(moment: MomentTimeline): Mode {
  switch (moment.occurredAt.kind) {
    case "Unknown": return "inconnu";
    case "YearRange": return "periode";
    case "Month": return "mois";
    case "ExactDate": return "date";
    case "ApproximateYear": return "vers";
    case "Age": return "age";
    case "Year": return "annee";
  }
}

/**
 * E07 — l'éditeur de moment, <b>en panneau et jamais en page</b>.
 *
 * « Naviguer vers une page pour dater un souvenir puis revenir coûte deux
 * transitions et fait perdre la position dans la timeline ou dans la
 * liste. »
 *
 * <b>Le modèle a sept granularités, l'interface en montre trois.</b> Une
 * première version de la fiche exposait les sept variantes en boutons radio,
 * plus trois niveaux de confiance : « dix contrôles pour dater un souvenir ».
 * L'année est au premier plan parce que c'est « la réponse la plus fréquente
 * et la plus honnête » ; la période et « je ne sais plus » sont offertes au
 * même niveau, jamais en dessous.
 *
 * <b>La confiance ne se demande pas</b> : elle se dérive de la granularité
 * choisie, côté domaine. La demander serait « de la métadonnée sur de la
 * métadonnée ».
 *
 * <b>La correction est banale</b> : aucun avertissement, aucune
 * confirmation. Ce sont des souvenirs, ils se corrigent.
 */
export function PanneauMoment({
  moment,
  anneeCourante,
  anneeDeNaissance,
  etat,
  reglerEtat,
  enregistrer,
  enregistrerNaissance,
  fermer,
}: {
  moment: MomentTimeline;
  /**
   * Reçue, jamais lue ici : un composant qui interroge l'horloge a des tests
   * qui dépendent du jour où on les lance.
   */
  anneeCourante: number;
  /**
   * L'année de naissance connue, ou `null`.
   *
   * <b>Elle décide de ce que le repli propose</b> : sans elle, « vers mes …
   * ans » n'a pas de place sur l'axe (§7.6), et l'offrir ferait tomber le
   * moment dans le tiroir sans que rien ne l'explique. Le repli propose
   * alors de la renseigner, en disant à quoi elle sert.
   */
  anneeDeNaissance: number | null;
  /**
   * Ce que le joueur a déjà dit de ce jeu, ou `null` — pas de jeu curé, pas
   * de machine, ou lecture non aboutie.
   *
   * <b>Relu, jamais supposé.</b> Un panneau qui rouvrirait vierge ferait
   * disparaître ce que le joueur vient de dire : c'est exactement ce que
   * « toujours en cours » a déjà coûté (apprentissage 76).
   */
  etat: EtatDuJeu | null;
  /**
   * Règle un des trois champs. <b>Persisté immédiatement</b>, comme en E02 :
   * « aucune sauvegarde explicite, chaque bascule est persistée ». Les deux
   * écrans partagent le composant ; leur faire des promesses différentes
   * serait la divergence qu'E07 interdit.
   */
  reglerEtat: (champ: ChampEtat, valeur: string) => void;
  enregistrer: (periode: PeriodeChoisie) => void;
  enregistrerNaissance: (annee: number) => void;
  fermer: () => void;
}) {
  const [mode, setMode] = useState<Mode>(() => modeInitial(moment));
  const [debut, setDebut] = useState(
    () => anneeDe(moment.occurredAt) ?? anneeCourante,
  );
  const [fin, setFin] = useState(() =>
    moment.occurredAt.kind === "YearRange" && moment.occurredAt.endYear !== null
      ? moment.occurredAt.endYear
      : (anneeDe(moment.occurredAt) ?? anneeCourante),
  );
  /** « Depuis 1994 » : une fin absente, jamais une fin égale au début. */
  const [finInconnue, setFinInconnue] = useState(
    () => moment.occurredAt.kind === "YearRange" && moment.occurredAt.endYear === null,
  );
  const [mois, setMois] = useState(
    () => (moment.occurredAt.kind === "Month" ? moment.occurredAt.month : 1),
  );
  const [date, setDate] = useState(() =>
    moment.occurredAt.kind === "ExactDate"
      ? moment.occurredAt.date
      : `${anneeDe(moment.occurredAt) ?? anneeCourante}-01-01`,
  );
  const [marge, setMarge] = useState(() =>
    moment.occurredAt.kind === "ApproximateYear" ? moment.occurredAt.margin : 2,
  );
  const [age, setAge] = useState(
    () => (moment.occurredAt.kind === "Age" ? moment.occurredAt.age : 12),
  );
  const [naissance, setNaissance] = useState(anneeDeNaissance ?? 1980);

  function valider() {
    switch (mode) {
      case "annee":
        return enregistrer({ kind: "year", year: debut });
      case "periode":
        return enregistrer({ kind: "range", from: debut, to: finInconnue ? null : fin });
      case "mois":
        return enregistrer({ kind: "month", year: debut, month: mois });
      case "date":
        return enregistrer({ kind: "date", date });
      case "vers":
        return enregistrer({ kind: "approximate", year: debut, margin: marge });
      case "age":
        return enregistrer({ kind: "age", age });
      case "inconnu":
        return enregistrer({ kind: "unknown" });
    }
  }

  return (
    <section className="panneau" data-testid="panneau-moment" aria-label={t("moment.titre", {
      titre: moment.targetLabel,
    })}>
      <header className="panneau-tete">
        <h3 className="panneau-titre">{t("moment.titre", { titre: moment.targetLabel })}</h3>
        <button type="button" className="discret" onClick={fermer}>
          {t("moment.fermer")}
        </button>
      </header>

      <fieldset className="panneau-quand">
        <legend>{t("moment.quand")}</legend>

        {/* « Je ne sais plus » REFERME la section : laisser un champ d'année
            visible sous une réponse qui dit l'ignorer se lirait comme une
            contradiction. */}
        {mode !== "inconnu" && mode !== "date" && mode !== "age" ? (
          <div className="panneau-annees">
            <label className="panneau-champ">
              <span>{t("moment.annee")}</span>
              <input
                type="number"
                value={debut}
                // Un souvenir ne se situe pas dans l'avenir : c'est le
                // plafond de l'horizon du domaine, et l'écran le dit plutôt
                // que de laisser saisir ce que l'API refuserait plus loin.
                max={anneeCourante}
                onChange={(e) => setDebut(Number(e.target.value))}
              />
            </label>

            {mode === "periode" && !finInconnue ? (
              <label className="panneau-champ">
                <span>{t("moment.finPeriode")}</span>
                <input
                  type="number"
                  value={fin}
                  max={anneeCourante}
                  onChange={(e) => setFin(Number(e.target.value))}
                />
              </label>
            ) : null}

            {mode === "mois" ? (
              <label className="panneau-champ">
                <span>{t("moment.moisChamp")}</span>
                <select value={mois} onChange={(e) => setMois(Number(e.target.value))}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                    <option key={m} value={m}>{t(`mois.${m}` as CleMessage)}</option>
                  ))}
                </select>
              </label>
            ) : null}

            {mode === "vers" ? (
              <label className="panneau-champ">
                <span>{t("moment.marge")}</span>
                <input
                  type="number"
                  value={marge}
                  // Jamais zéro : une marge nulle dirait exactement ce que
                  // dit une année, et deux façons d'exprimer la même chose
                  // finissent toujours par diverger.
                  min={1}
                  onChange={(e) => setMarge(Math.max(1, Number(e.target.value)))}
                />
              </label>
            ) : null}
          </div>
        ) : null}

        {/* « Depuis 1994 » : la fin est FACULTATIVE, et la refermer sur son
            début inventerait une information. */}
        {mode === "periode" ? (
          <label className="panneau-echappatoire">
            <input
              type="checkbox"
              checked={finInconnue}
              onChange={(e) => setFinInconnue(e.target.checked)}
            />
            <span>{t("moment.finInconnue")}</span>
          </label>
        ) : null}

        {mode === "date" ? (
          <label className="panneau-champ">
            <span>{t("moment.dateChamp")}</span>
            <input
              type="date"
              value={date}
              max={`${anneeCourante}-12-31`}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
        ) : null}

        {mode === "age" ? (
          <label className="panneau-champ">
            <span>{t("moment.ageChamp")}</span>
            <input
              type="number"
              value={age}
              min={0}
              onChange={(e) => setAge(Number(e.target.value))}
            />
          </label>
        ) : null}

        {/* Les deux échappatoires, au MÊME niveau que l'année. Les reléguer
            induirait une fausse précision — exactement ce que §7.4
            interdit. */}
        <label className="panneau-echappatoire">
          <input
            type="radio"
            name="granularite"
            checked={mode === "periode"}
            onChange={() => setMode("periode")}
          />
          <span>{t("moment.plutotPeriode")}</span>
        </label>

        <label className="panneau-echappatoire">
          <input
            type="radio"
            name="granularite"
            checked={mode === "inconnu"}
            onChange={() => setMode("inconnu")}
          />
          <span>{t("moment.inconnu")}</span>
        </label>

        {/* Le REPLI. « Mois et date exacte sont rarissimes pour un souvenir
            de trente ans : ils n'ont rien à faire au premier plan. » Replié
            par défaut, il n'est jamais nécessaire. */}
        <details className="panneau-repli" data-testid="panneau-repli">
          <summary>{t("moment.preciser")}</summary>

          <label className="panneau-echappatoire">
            <input
              type="radio"
              name="granularite"
              checked={mode === "mois"}
              onChange={() => setMode("mois")}
            />
            <span>{t("moment.mois")}</span>
          </label>

          <label className="panneau-echappatoire">
            <input
              type="radio"
              name="granularite"
              checked={mode === "date"}
              onChange={() => setMode("date")}
            />
            <span>{t("moment.dateExacte")}</span>
          </label>

          <label className="panneau-echappatoire">
            <input
              type="radio"
              name="granularite"
              checked={mode === "vers"}
              onChange={() => setMode("vers")}
            />
            <span>{t("moment.vers")}</span>
          </label>

          {/* §7.6 : l'âge ne s'offre QU'AVEC l'année de naissance. Sans elle
              il se comporte comme « je ne sais plus », et le moment
              tomberait dans le tiroir sans que rien ne l'explique. Le repli
              propose alors de la renseigner, en disant à quoi elle sert —
              « jamais un champ de plus sans justification ». */}
          {anneeDeNaissance !== null ? (
            <label className="panneau-echappatoire">
              <input
                type="radio"
                name="granularite"
                checked={mode === "age"}
                onChange={() => setMode("age")}
              />
              <span>{t("moment.age")}</span>
            </label>
          ) : (
            <div className="panneau-naissance" data-testid="panneau-naissance">
              <p>{t("moment.naissanceInvite")}</p>
              <label className="panneau-champ">
                <span>{t("moment.naissanceChamp")}</span>
                <input
                  type="number"
                  value={naissance}
                  max={anneeCourante}
                  onChange={(e) => setNaissance(Number(e.target.value))}
                />
              </label>
              <button
                type="button"
                className="discret"
                onClick={() => enregistrerNaissance(naissance)}
              >
                {t("moment.naissanceEnregistrer")}
              </button>
            </div>
          )}
        </details>
      </fieldset>

      {/* B bis — achèvement, provenance, affect. « C'est le second endroit
          où elles se règlent : E02 pendant la saisie en masse, E07 plus
          tard, en relisant sa timeline. Les deux écrans partagent le même
          composant — une divergence entre eux serait un défaut. »

          L'AFFECT y devient saisissable pour la première fois : la colonne
          existait, la lecture la rendait, le domaine savait qu'elle lève
          « jamais joué » — et aucun geste ne l'écrivait. */}
      {etat !== null ? (
        <div className="panneau-etat" data-testid="panneau-etat">
          <Question
            intitule={t("passe2.acheve")}
            choix={CHOIX_ACHEVEMENT}
            valeur={etat.completion}
            repondre={(v) => reglerEtat("completion", v)}
          />
          <Question
            intitule={t("passe2.affect")}
            choix={CHOIX_AFFECT}
            valeur={etat.affect}
            repondre={(v) => reglerEtat("affect", v)}
          />
          <Question
            intitule={t("passe2.comment")}
            choix={CHOIX_PROVENANCE}
            valeur={etat.provenance}
            repondre={(v) => reglerEtat("provenance", v)}
          />
        </div>
      ) : null}

      {/* Un seul geste. « Aucun avertissement ni confirmation pour modifier
          un moment : ce sont des souvenirs, ils se corrigent. » */}
      <button type="button" className="primaire" onClick={valider}>
        {t("moment.enregistrer")}
      </button>
    </section>
  );
}
