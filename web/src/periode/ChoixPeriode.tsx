import { useState } from "react";
import { t } from "../i18n/t";
import type { Plateforme } from "../selection/types";
import type { PeriodeChoisie } from "./periode";

/**
 * Le choix de période, entre la console et la liste de jeux (§24.3).
 *
 * <b>Trois choix, et chacun capture VRAIMENT une valeur.</b> Cet écran a
 * longtemps été un bouchon : trois boutons qui envoyaient des constantes —
 * 1995, ou 1993-1997 — sans jamais demander lesquelles. Tous les jeux d'un
 * profil portaient donc la même année, que personne n'avait choisie, et
 * l'incertitude temporelle, qui est la thèse du produit, ne venait pas de
 * l'utilisateur.
 *
 * <b>La confiance ne se demande pas, elle se déduit</b> de la granularité
 * choisie. Ajouter un curseur de fiabilité coûterait une décision par
 * saisie pour une information que ce choix donne déjà.
 */
export function ChoixPeriode({
  machine,
  anneeCourante,
  choisir,
}: {
  machine: Plateforme;
  /**
   * Requise, sans valeur par défaut. Lire l'horloge ici rendrait le
   * composant intestable dans le temps — et un test qui dépend du jour où
   * on le lance finit toujours par échouer un matin.
   */
  anneeCourante: number;
  choisir: (periode: PeriodeChoisie) => void;
}) {
  // Une année plausible POUR CETTE MACHINE. Un défaut identique partout est
  // exactement ce qui a produit le défaut : une valeur que rien ne rattache
  // à ce que l'utilisateur est en train de faire.
  const suggeree = Math.min(machine.launchYear + 2, anneeCourante);

  const [mode, setMode] = useState<"annee" | "periode" | null>(null);
  const [annee, setAnnee] = useState(suggeree);
  const [debut, setDebut] = useState(machine.launchYear);
  const [fin, setFin] = useState(Math.min(machine.launchYear + 5, anneeCourante));
  const [erreur, setErreur] = useState<string | null>(null);

  /** Une année impossible est refusée EN DISANT pourquoi, jamais corrigée en
   *  silence : une valeur qui change toute seule se lit comme une panne. */
  function refus(valeur: number): string | null {
    if (valeur < machine.launchYear) {
      return t("periode.avantLaMachine", {
        machine: machine.nom,
        annee: String(machine.launchYear),
      });
    }
    if (valeur > anneeCourante) {
      return t("periode.aVenir", { annee: String(anneeCourante) });
    }
    return null;
  }

  function valider() {
    if (mode === "annee") {
      const probleme = refus(annee);
      if (probleme !== null) return setErreur(probleme);
      return choisir({ kind: "year", year: annee });
    }

    const probleme = refus(debut) ?? refus(fin);
    if (probleme !== null) return setErreur(probleme);
    // Une fin antérieure au début n'est pas une période ouverte : c'est une
    // faute de saisie, et la refermer d'office inventerait une intention.
    if (fin < debut) return setErreur(t("periode.finAvantDebut"));
    return choisir({ kind: "range", from: debut, to: fin });
  }

  return (
    <section>
      <h2>{t("parcours.choisirPeriode")}</h2>

      <button type="button" aria-pressed={mode === "annee"}
              onClick={() => { setMode("annee"); setErreur(null); }}>
        {t("parcours.periodeAnnee")}
      </button>
      <button type="button" aria-pressed={mode === "periode"}
              onClick={() => { setMode("periode"); setErreur(null); }}>
        {t("parcours.periodePeriode")}
      </button>
      {/* En UN geste : c'est la réponse la plus fréquente, et la plus
          honnête. Lui imposer une confirmation la ferait éviter, et
          l'utilisateur inventerait une date plutôt que de l'avouer. */}
      <button type="button" onClick={() => choisir({ kind: "unknown" })}>
        {t("parcours.periodeInconnue")}
      </button>

      {mode === "annee" ? (
        <div>
          {/* Le pas existe pour le pouce : saisir quatre chiffres au clavier
              d'un téléphone coûte bien plus qu'un appui. */}
          <button type="button" aria-label={t("periode.precedente")}
                  onClick={() => setAnnee((a) => a - 1)}>−</button>
          <input
            type="number" inputMode="numeric"
            aria-label={t("periode.annee")}
            value={annee}
            onChange={(e) => setAnnee(Number(e.target.value))}
          />
          <button type="button" aria-label={t("periode.suivante")}
                  onClick={() => setAnnee((a) => a + 1)}>+</button>
        </div>
      ) : null}

      {mode === "periode" ? (
        <div>
          <input
            type="number" inputMode="numeric"
            aria-label={t("periode.debut")}
            value={debut}
            onChange={(e) => setDebut(Number(e.target.value))}
          />
          <input
            type="number" inputMode="numeric"
            aria-label={t("periode.fin")}
            value={fin}
            onChange={(e) => setFin(Number(e.target.value))}
          />
        </div>
      ) : null}

      {erreur !== null ? <p role="alert">{erreur}</p> : null}

      {mode !== null ? (
        <button type="button" onClick={valider}>{t("parcours.commencer")}</button>
      ) : null}
    </section>
  );
}
