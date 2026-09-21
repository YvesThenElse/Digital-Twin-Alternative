import { useMemo, useRef, useState } from "react";
import { BandeDEpoque } from "./BandeDEpoque";
import { StatutRegional } from "../region/StatutRegional";
import { statutRegion } from "../region/statut";
import { t } from "../i18n/t";
import { Tuile } from "../disposition/Tuile";
import type { Disposition } from "../disposition/epoque";
import { anneeDe, forme, libelle } from "../temporel/valeur";
import { construireBande } from "./bande";
import type { Oeuvre } from "./types";

export type LotDeclaration = {
  batchId: string;
  entries: { workId: string }[];
};

type Props = {
  oeuvres: Oeuvre[];
  /**
   * La région de l'écran (E02 repère A : « Super Nintendo · PAL »).
   *
   * Requise, sans valeur par défaut : un défaut choisirait en silence le
   * marché d'un joueur, et la décision « international dès le départ » rend
   * ce choix visible.
   */
  region: string;
  /**
   * La stratégie de lecture. **Pas une largeur** : le composant ne décide pas
   * du point de rupture, `dispositionPour` le fait, et le parent l'observe.
   * Deux stratégies, jamais une disposition étirée (§6).
   */
  disposition: Disposition;
  envoyer: (lot: LotDeclaration) => Promise<void>;
  /**
   * Enregistre un souvenir. Requis, sans valeur par défaut : un rappel
   * facultatif absent rendrait le champ muet sans que rien ne le signale.
   */
  ecrireSouvenir: (workId: string, texte: string) => Promise<void>;
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
export function SelectionMassive({
  oeuvres, region, disposition, envoyer, ecrireSouvenir, recharger,
}: Props) {
  const [declarees, setDeclarees] = useState<Set<string>>(new Set());
  const [erreur, setErreur] = useState<string | null>(null);

  // Les souvenirs vivent HORS de l'ensemble des déclarations : décocher une
  // ligne ne doit pas détruire une phrase. Se tromper de ligne est le geste
  // le plus fréquent de cet écran, et perdre du texte à cause d'un tap mal
  // placé serait impardonnable sur le seul contenu non régénérable.
  const [souvenirs, setSouvenirs] = useState<Record<string, string>>({});

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
      setErreur(t("erreur.declaration"));
    });
  }

  function enregistrerSouvenir(id: string) {
    const texte = (souvenirs[id] ?? "").trim();
    // Rien à garder : un souvenir vide occuperait une place à l'écran et
    // ferait croire à une phrase écrite.
    if (texte.length === 0) return;

    ecrireSouvenir(id, texte).catch(() => {
      setErreur(t("erreur.souvenir"));
    });
  }

  const ordonnees = [...oeuvres].sort((a, b) => a.rang - b.rang);

  return (
    <section>
      <ul data-disposition={disposition}>
        {ordonnees.map((oeuvre) => {
          const declare = declarees.has(oeuvre.id);
          const enGrille = disposition === "grille";
          return (
            <li key={oeuvre.id} data-hauteur={enGrille ? undefined : 56}>
              {/* La CELLULE ENTIÈRE est la cible, en liste comme en grille :
                  quatre cibles de 44 px occuperaient 200 px et ne laisseraient
                  que 143 px de titre sur un écran de 375 px — sur l'écran dont
                  toute la mécanique repose sur la reconnaissance. */}
              <button
                type="button"
                aria-pressed={declare}
                aria-label={t(declare ? "ligne.declare" : "ligne.declarer", { titre: oeuvre.titre })}
                onClick={() => basculer(oeuvre.id)}
              >
                {/* La grille balaye des IMAGES, la liste balaye du TEXTE :
                    deux stratégies de lecture, pas une disposition étirée. */}
                {enGrille ? (
                  <Tuile
                    titre={oeuvre.titre}
                    annee={oeuvre.sortie ? anneeDe(oeuvre.sortie) : null}
                    couverture={oeuvre.couverture}
                  />
                ) : null}
                <span>{oeuvre.titre}</span>
                {/* La date porte SA granularité : une année seule ne s'affiche
                    pas comme une date au jour. 31 sorties du dataset ne sont
                    datées qu'à l'année, et les rendre exactes affirmerait un
                    jour que la source ne donne pas. */}
                <span data-forme={oeuvre.sortie ? forme(oeuvre.sortie) : "aucune"}>
                  {oeuvre.sortie ? libelle(oeuvre.sortie) : t("ligne.dateInconnue")}
                </span>
                <StatutRegional statut={statutRegion(oeuvre, region)} region={region} />
              </button>

              {/* Le champ n'apparaît qu'une fois la ligne déclarée : une zone
                  de texte par ligne non cochée occuperait la place de l'écran
                  le plus dense du produit et suggérerait un travail à faire.
                  §9 est un COMPLÉMENT, jamais un passage obligé. */}
              {declare ? (
                <textarea
                  aria-label={t("souvenir.invite", { titre: oeuvre.titre })}
                  value={souvenirs[oeuvre.id] ?? ""}
                  onChange={(e) =>
                    setSouvenirs((s) => ({ ...s, [oeuvre.id]: e.target.value }))
                  }
                  onBlur={() => enregistrerSouvenir(oeuvre.id)}
                />
              ) : null}
            </li>
          );
        })}
      </ul>

      {erreur ? <p role="alert">{erreur}</p> : null}

      <BandeDEpoque bande={bande} />

      <button type="button" onClick={recharger}>
        {t("action.recharger")}
      </button>
    </section>
  );
}
