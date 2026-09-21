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

/**
 * Une entrée déclare **soit** une œuvre du référentiel, **soit** un titre
 * libre. Les deux ensemble seraient ambigus, et l'API les refuse en le
 * disant (§3.5).
 */
export type EntreeDeclaration = { workId: string } | { title: string };

export type LotDeclaration = {
  batchId: string;
  entries: EntreeDeclaration[];
};

/**
 * Ce que l'API rend d'un lot : les revendications qu'elle a **frappées**.
 *
 * Le front saisit un titre, l'API décide de l'identifiant. Sans ce retour,
 * plus rien ne peut s'y rattacher — et §9 place justement là le contenu le
 * plus personnel du produit.
 */
export type ReponseDeclaration = { claims: { title: string; id: string }[] };

/**
 * La cible d'un souvenir, **nommée par son genre**. Un identifiant nu
 * laisserait l'appelant deviner, et deviner « œuvre » sur une revendication
 * écrirait un souvenir sur une cible que la base ne connaît pas.
 */
export type CibleSouvenir = {
  kind: "work" | "unresolvedClaim";
  id: string;
};

/** Un titre saisi, et la revendication que l'API lui a donnée. */
type TitreLibre = Oeuvre & { claimId: string | null };

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
  envoyer: (lot: LotDeclaration) => Promise<ReponseDeclaration>;
  /**
   * Enregistre un souvenir. Requis, sans valeur par défaut : un rappel
   * facultatif absent rendrait le champ muet sans que rien ne le signale.
   */
  ecrireSouvenir: (cible: CibleSouvenir, texte: string) => Promise<void>;
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
/**
 * Le champ de souvenir, identique pour une œuvre et pour un titre saisi.
 *
 * <b>Défini au niveau du module, et c'est essentiel.</b> Déclaré dans le
 * corps de `SelectionMassive`, son type changeait à chaque rendu : React
 * démontait le `<textarea>` à la première frappe, le focus partait, et la
 * phrase s'arrêtait à une lettre. Le contenu le plus précieux du produit se
 * serait perdu sans qu'aucune erreur ne soit levée.
 */
function ChampSouvenir({ titre, valeur, surSaisie, surSortie }: {
  titre: string;
  valeur: string;
  surSaisie: (texte: string) => void;
  surSortie: () => void;
}) {
  return (
    <textarea
      aria-label={t("souvenir.invite", { titre })}
      value={valeur}
      onChange={(e) => surSaisie(e.target.value)}
      onBlur={surSortie}
    />
  );
}

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

  // Les titres saisis. Ils vivent à part des œuvres du référentiel : les
  // mélanger leur donnerait un rang, une notoriété et un statut régional
  // qu'ils n'ont pas — c'est-à-dire l'apparence d'une donnée vérifiée là où
  // il n'y a qu'un souvenir.
  const [titresLibres, setTitresLibres] = useState<TitreLibre[]>([]);
  const [saisie, setSaisie] = useState("");
  const compteurLibre = useRef(0);

  // Le lot est le PASSAGE sur l'écran, pas le geste : douze titres cochés
  // d'un coup forment un épisode (§4.4), pas douze points identiques.
  const lot = useRef(`bat_${Math.random().toString(36).slice(2, 12)}`);

  // La bande compte les titres saisis comme les autres. Un geste qui ne
  // ferait pas bouger la récompense dirait à l'utilisateur qu'il n'a rien
  // produit — et c'est le geste le plus fragile de l'écran (§24.4). Sans
  // date, ils sont comptés et jamais placés, comme un jeu non daté.
  const bande = useMemo(
    () => construireBande([...oeuvres, ...titresLibres], declarees),
    [oeuvres, titresLibres, declarees],
  );

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

  function ajouterTitreLibre() {
    const titre = saisie.trim();
    // Rien à garder : une revendication sans titre serait une ligne que plus
    // aucun écran ne saurait nommer.
    if (titre.length === 0) return;

    // Identifiant LOCAL : le vrai est frappé par l'API, qui seule peut
    // garantir son unicité. Celui-ci ne sert qu'à la clé de rendu et au
    // décompte, et ne quitte jamais le navigateur.
    compteurLibre.current += 1;
    const id = `libre_${compteurLibre.current}`;
    const ajoute: TitreLibre = {
      id,
      // Inconnue tant que l'API n'a pas répondu : c'est ELLE qui frappe
      // l'identifiant. Poser ici une valeur d'attente ferait écrire un
      // souvenir sur une cible que la base ne connaît pas.
      claimId: null,
      titre,
      // Inerte, et c'est voulu : un titre saisi n'a pas de notoriété, et il
      // se rend depuis son propre tableau, jamais par le tri du référentiel.
      // Le champ n'est là que pour satisfaire la forme d'`Oeuvre` attendue
      // par `construireBande`, qui l'ignore. Une mutation le confirme.
      rang: Number.MAX_SAFE_INTEGER,
      sortie: null,
      couverture: null,
      regions: [],
      statutRegional: {},
    };

    setTitresLibres((precedents) => [...precedents, ajoute]);
    setDeclarees((precedentes) => new Set(precedentes).add(id));
    setSaisie("");

    // Le MÊME lot que les titres cochés : le lot est le passage sur l'écran,
    // pas le geste. En ouvrir un second détacherait ce titre de l'épisode,
    // et la timeline le montrerait isolé alors qu'il vient du même passage.
    envoyer({ batchId: lot.current, entries: [{ title: titre }] })
      .then((reponse) => {
        const revendication = reponse.claims.find((c) => c.title === titre);
        // Un lot accepté qui ne rend pas la revendication est un succès
        // APPARENT : la ligne s'affiche, et le souvenir n'aurait nulle part
        // où aller. On le dit plutôt que de laisser l'absence parler.
        if (revendication === undefined) {
          setErreur(t("erreur.declaration"));
          return;
        }
        setTitresLibres((precedents) =>
          precedents.map((libre) =>
            libre.id === id ? { ...libre, claimId: revendication.id } : libre,
          ),
        );
      })
      .catch(() => {
        setErreur(t("erreur.declaration"));
      });
  }

  /**
   * `cle` indexe le texte à l'écran, `cible` dit à qui il appartient en
   * base. Les deux coïncident pour une œuvre et divergent pour un titre
   * saisi, dont l'identifiant local ne quitte jamais le navigateur.
   */
  function enregistrerSouvenir(cle: string, cible: CibleSouvenir) {
    const texte = (souvenirs[cle] ?? "").trim();
    // Rien à garder : un souvenir vide occuperait une place à l'écran et
    // ferait croire à une phrase écrite.
    if (texte.length === 0) return;

    ecrireSouvenir(cible, texte).catch(() => {
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
                <ChampSouvenir
                  titre={oeuvre.titre}
                  valeur={souvenirs[oeuvre.id] ?? ""}
                  surSaisie={(texte) =>
                    setSouvenirs((s) => ({ ...s, [oeuvre.id]: texte }))
                  }
                  surSortie={() => enregistrerSouvenir(oeuvre.id, { kind: "work", id: oeuvre.id })}
                />
              ) : null}
            </li>
          );
        })}
      </ul>

      {/* L'issue de secours, TOUJOURS présente — même quand la liste est
          pleine : le bon jeu peut manquer au milieu de dix mauvais (E06), et
          une issue qui n'apparaîtrait qu'une fois la liste vide ne servirait
          jamais, cette liste n'étant jamais vide. */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ajouterTitreLibre();
        }}
      >
        <p>{t("titreLibre.invite")}</p>
        <input
          type="text"
          aria-label={t("titreLibre.champ")}
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
        />
        <button type="submit">{t("titreLibre.ajouter")}</button>
      </form>

      {titresLibres.length > 0 ? (
        <ul>
          {titresLibres.map((libre) => {
            // Liée à une constante : dans une fermeture, TypeScript ne peut
            // plus garantir qu'une propriété n'a pas changé entre-temps.
            const revendication = libre.claimId;
            return (
            <li key={libre.id} data-testid="titre-libre" data-canonique="false">
              <span>{libre.titre}</span>
              {/* La marque est DITE, pas suggérée par une absence : sans
                  elle, une saisie libre se lirait comme une entrée du
                  référentiel dont la date manquerait. */}
              <span>{t("titreLibre.marque")}</span>

              {/* Le champ n'apparaît qu'une fois la revendication connue :
                  sans elle, un souvenir n'a nulle part où aller, et laisser
                  écrire la phrase la plus personnelle du produit dans le
                  vide serait pire que ne pas l'offrir. L'échec, lui, est DIT
                  par l'alerte — l'absence du champ ne l'explique pas. */}
              {revendication !== null ? (
                <ChampSouvenir
                  titre={libre.titre}
                  valeur={souvenirs[libre.id] ?? ""}
                  surSaisie={(texte) =>
                    setSouvenirs((s) => ({ ...s, [libre.id]: texte }))
                  }
                  surSortie={() =>
                    enregistrerSouvenir(libre.id, {
                      kind: "unresolvedClaim",
                      id: revendication,
                    })
                  }
                />
              ) : null}
            </li>
            );
          })}
        </ul>
      ) : null}

      {erreur ? <p role="alert">{erreur}</p> : null}

      <BandeDEpoque bande={bande} />

      <button type="button" onClick={recharger}>
        {t("action.recharger")}
      </button>
    </section>
  );
}
