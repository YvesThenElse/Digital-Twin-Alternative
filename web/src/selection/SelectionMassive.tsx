import { useMemo, useRef, useState } from "react";
import { BandeDEpoque } from "./BandeDEpoque";
import { construireBande } from "./bande";
import type { Oeuvre } from "./types";

export type LotDeclaration = {
  batchId: string;
  entries: { workId: string }[];
};

type Props = {
  oeuvres: Oeuvre[];
  envoyer: (lot: LotDeclaration) => Promise<void>;
  /**
   * Recharger la liste. **Ne doit jamais être appelé en réponse à un clic** :
   * un aller-retour par ligne ruinerait le budget d'un tap par jeu.
   */
  recharger: () => void;
};

/**
 * La passe 1 de la sélection massive.
 *
 * <b>L'état déclaré est local, et l'affichage ne dépend pas du serveur.</b>
 * C'est ce que §24.4 exige : la récompense arrive pendant la saisie, pas
 * après la latence. L'envoi part en arrière-plan ; s'il échoue, on le dit et
 * on ne défait rien — voir son travail s'effacer est le pire scénario d'un
 * affichage optimiste.
 */
export function SelectionMassive({ oeuvres, envoyer, recharger }: Props) {
  const [declarees, setDeclarees] = useState<Set<string>>(new Set());
  const [erreur, setErreur] = useState<string | null>(null);

  // Le lot est le PASSAGE sur l'écran, pas le geste : douze titres cochés
  // d'un coup forment un épisode (§4.4), pas douze points identiques.
  const lot = useRef(`bat_${Math.random().toString(36).slice(2, 12)}`);

  const bande = useMemo(() => construireBande(oeuvres, declarees), [oeuvres, declarees]);

  function basculer(id: string) {
    const suivant = new Set(declarees);
    const etaitDeclare = suivant.delete(id);
    if (!etaitDeclare) suivant.add(id);

    // L'affichage change MAINTENANT, avant tout appel réseau.
    setDeclarees(suivant);

    if (etaitDeclare) return;

    envoyer({ batchId: lot.current, entries: [{ workId: id }] }).catch(() => {
      setErreur("Une déclaration n'a pas pu être enregistrée. Elle reste affichée ; réessayez plus tard.");
    });
  }

  const ordonnees = [...oeuvres].sort((a, b) => a.rang - b.rang);

  return (
    <section>
      <ul>
        {ordonnees.map((oeuvre) => {
          const declare = declarees.has(oeuvre.id);
          return (
            <li key={oeuvre.id}>
              {/* La LIGNE ENTIÈRE est la cible : quatre cibles de 44 px
                  occuperaient 200 px et ne laisseraient que 143 px de titre
                  sur un écran de 375 px — sur l'écran dont toute la mécanique
                  repose sur la reconnaissance. */}
              <button
                type="button"
                aria-pressed={declare}
                aria-label={declare ? `Déclaré : ${oeuvre.titre}` : `Déclarer : ${oeuvre.titre}`}
                onClick={() => basculer(oeuvre.id)}
              >
                <span>{oeuvre.titre}</span>
                <span>{oeuvre.annee ?? "—"}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {erreur ? <p role="alert">{erreur}</p> : null}

      <BandeDEpoque bande={bande} />

      <button type="button" onClick={recharger}>
        Recharger la liste
      </button>
    </section>
  );
}
