import { useState } from "react";
import { t } from "../i18n/t";
import type { PeriodeChoisie } from "../periode/periode";
import { anneeDe } from "../temporel/valeur";
import type { MomentTimeline } from "../timeline/types";

/** Les trois réponses que l'écran montre — le modèle en garde sept. */
type Mode = "annee" | "periode" | "inconnu";

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
  if (moment.occurredAt.kind === "Unknown") return "inconnu";
  if (moment.occurredAt.kind === "YearRange") return "periode";
  return "annee";
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
  enregistrer,
  fermer,
}: {
  moment: MomentTimeline;
  /**
   * Reçue, jamais lue ici : un composant qui interroge l'horloge a des tests
   * qui dépendent du jour où on les lance.
   */
  anneeCourante: number;
  enregistrer: (periode: PeriodeChoisie) => void;
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

  function valider() {
    switch (mode) {
      case "annee":
        return enregistrer({ kind: "year", year: debut });
      case "periode":
        return enregistrer({ kind: "range", from: debut, to: fin });
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
        {mode !== "inconnu" ? (
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

            {mode === "periode" ? (
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
          </div>
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
      </fieldset>

      {/* Un seul geste. « Aucun avertissement ni confirmation pour modifier
          un moment : ce sont des souvenirs, ils se corrigent. » */}
      <button type="button" className="primaire" onClick={valider}>
        {t("moment.enregistrer")}
      </button>
    </section>
  );
}
