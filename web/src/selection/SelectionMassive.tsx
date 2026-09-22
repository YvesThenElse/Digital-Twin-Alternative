import { useEffect, useMemo, useRef, useState } from "react";
import { BandeDEpoque } from "./BandeDEpoque";
import { Icone } from "../icones/Icone";
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
export type EntreeDeclaration =
  | {
      workId: string;
      /** finished · stillPlaying · abandoned · `null` = pas prononcé. */
      completion?: string | null;
      /** owned · elsewhere · borrowed · `null` = pas prononcé. */
      provenance?: string | null;
      /**
       * « Je n'y ai jamais joué » — une déclaration **positive** (§24.3),
       * pas une absence. Elle exclut tout le reste (invariant 8), et
       * l'omettre veut dire « rien de dit », jamais « faux ».
       */
      neverPlayed?: boolean;
    }
  | { title: string };

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

/**
 * Un souvenir tel qu'il se saisit : une phrase, et un <b>repère</b> court et
 * facultatif (§9.2).
 *
 * <b>Un seul objet, jamais deux champs parallèles.</b> Deux tableaux indexés
 * par la même clé finiraient par diverger — une ligne aurait un repère sans
 * phrase, et l'axe annoncerait un texte introuvable.
 *
 * Le repère absent est la chaîne VIDE ici, et `null` en base : l'écran tient
 * une saisie, la base tient un fait. Le client fait la traduction, une fois.
 */
export type SouvenirEcrit = { texte: string; titre: string };

const SANS_SOUVENIR: SouvenirEcrit = { texte: "", titre: "" };

/**
 * Ce dont l'utilisateur s'est déjà prononcé sur cette plateforme.
 *
 * <b>Relu à l'ouverture.</b> L'écran ne le lisait pas : un rechargement
 * montrait toutes les lignes décochées alors que les déclarations étaient en
 * base, et le testeur en concluait qu'il avait perdu son travail.
 */
export type EtatLigne = {
  workId: string;
  played: boolean;
  /** finished · abandoned · `null` = pas prononcé. */
  completion: string | null;
  /** owned · elsewhere · borrowed · `null` = pas prononcé. */
  provenance: string | null;
  neverPlayed: boolean;
};

/** Les deux réponses de passe 2 que le modèle sait porter aujourd'hui. */
type Affinage = { completion: string | null; provenance: string | null };

const SANS_REPONSE: Affinage = { completion: null, provenance: null };

/** Un titre saisi, et la revendication que l'API lui a donnée. */
type TitreLibre = Oeuvre & { claimId: string | null };

/**
 * Un titre saisi lors d'une visite précédente, tel que l'API le rend.
 *
 * Son identifiant est celui de la REVENDICATION : contrairement à un titre
 * qu'on vient de saisir, il est connu d'emblée, et le souvenir peut s'y
 * attacher dès l'affichage.
 */
export type TitreLibreRelu = { id: string; titre: string };

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
  ecrireSouvenir: (cible: CibleSouvenir, souvenir: SouvenirEcrit) => Promise<void>;
  /**
   * Recharger la liste. **Ne doit jamais être appelé en réponse à un clic** :
   * un aller-retour par ligne ruinerait le budget d'un tap par jeu.
   */
  recharger: () => void;
  /**
   * Retire une déclaration. Requis, sans valeur par défaut : décocher est
   * le geste le plus fréquent de l'écran, et il n'a longtemps pas quitté
   * le navigateur.
   */
  retracter: (workId: string) => Promise<void>;
  /**
   * L'état relu. Vide par défaut serait un piège : un appelant qui oublie de
   * le passer verrait un écran vierge sans qu'aucune erreur ne le dise —
   * exactement le défaut qu'on corrige. Il est donc REQUIS.
   */
  etatInitial: EtatLigne[];
  /**
   * Les souvenirs déjà écrits, par cible.
   *
   * §9 en fait **le contenu le plus précieux du produit, et le seul qui ne
   * soit pas régénérable**. Le champ revenait vide après un rechargement
   * alors que la phrase était en base : le testeur en conclut qu'il l'a
   * perdue — et c'est justement celle-là qu'il ne réécrira pas.
   *
   * Requis, sans valeur par défaut, pour la même raison que `etatInitial` :
   * un appelant qui l'oublie verrait un écran vide sans qu'aucune erreur ne
   * le dise.
   */
  souvenirsInitiaux: Record<string, SouvenirEcrit>;
  /**
   * Les titres saisis lors des visites précédentes, sur CETTE plateforme.
   *
   * §3.5 les veut « visibles dans son profil comme les autres ». Ils
   * disparaissaient de l'écran au rechargement tout en restant sur la
   * timeline : le joueur les resaisissait, et la base gardait deux formes du
   * même souvenir.
   *
   * Requis, sans valeur par défaut, pour la même raison qu'`etatInitial` :
   * un appelant qui l'oublie verrait un écran incomplet sans qu'aucune
   * erreur ne le dise.
   */
  titresLibresInitiaux: TitreLibreRelu[];
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
 * Une question de passe 2 : une ligne de chips, toutes facultatives.
 *
 * <b>Elle ne coûte rien à qui l'ignore</b> et change la nature du profil
 * pour qui y répond (E02). Elle n'apparaît que sur une ligne DÉCLARÉE :
 * poser la question sur 221 lignes non cochées occuperait l'écran le plus
 * dense du produit et suggérerait un travail à faire.
 */
function Question({ intitule, choix, valeur, repondre }: {
  intitule: string;
  choix: { valeur: string; libelle: string }[];
  valeur: string | null;
  repondre: (valeur: string) => void;
}) {
  return (
    <div role="group" aria-label={intitule}>
      <span>{intitule}</span>
      {choix.map((c) => (
        <button
          key={c.valeur}
          type="button"
          aria-pressed={valeur === c.valeur}
          onClick={() => repondre(c.valeur)}
        >
          {c.libelle}
        </button>
      ))}
    </div>
  );
}

/**
 * Ce qu'il faut parcourir horizontalement pour que ce soit un <b>balayage</b>
 * et non un tap.
 *
 * Plus bas, le moindre tremblement du pouce poserait une déclaration que
 * personne n'a faite, sur l'écran où le tap est le geste de base. Plus haut,
 * le geste devient un effort sur une ligne de 56 px.
 */
const SEUIL_BALAYAGE = 48;

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
  valeur: SouvenirEcrit;
  surSaisie: (souvenir: SouvenirEcrit) => void;
  surSortie: () => void;
}) {
  return (
    <div className="souvenir-saisie">
      <textarea
        aria-label={t("souvenir.invite", { titre })}
        value={valeur.texte}
        onChange={(e) => surSaisie({ ...valeur, texte: e.target.value })}
        onBlur={surSortie}
      />
      {/* APRÈS la phrase, et pas avant : placé en tête, le repère se lirait
          comme une première étape à franchir, et §9.2 le veut facultatif.
          La longueur MIROITE la borne de l'API — qui reste seule juge : une
          règle portée par l'écran seul n'existe pas. */}
      <input
        type="text"
        className="souvenir-repere-saisie"
        aria-label={t("souvenir.repere", { titre })}
        maxLength={80}
        value={valeur.titre}
        onChange={(e) => surSaisie({ ...valeur, titre: e.target.value })}
        onBlur={surSortie}
      />
    </div>
  );
}

export function SelectionMassive({
  oeuvres, region, disposition, envoyer, ecrireSouvenir, recharger, retracter, etatInitial,
  souvenirsInitiaux, titresLibresInitiaux,
}: Props) {
  const [declarees, setDeclarees] = useState<Set<string>>(
    () => new Set([
      ...etatInitial.filter((l) => l.played).map((l) => l.workId),
      // Une revendication existe PARCE QU'ELLE A ÉTÉ DÉCLARÉE : l'API la
      // frappe en traduisant le lot. La compter ici est ce qui empêche la
      // bande de reculer d'une visite à l'autre — un recul se lit comme une
      // perte, sur l'écran dont §24.4 fait la récompense.
      ...titresLibresInitiaux.map((relu) => relu.id),
    ]),
  );

  // Les réponses de passe 2, par œuvre. Celles déjà en base sont remontrées :
  // ne pas le faire inviterait à répondre deux fois la même chose.
  const [affinages, setAffinages] = useState<Record<string, Affinage>>(() =>
    Object.fromEntries(etatInitial.map((l) => [
      l.workId, { completion: l.completion, provenance: l.provenance },
    ])),
  );

  // La réponse en cours de saisie, pas encore envoyée.
  //
  // Le journal est en AJOUT SEUL : deux achèvements contradictoires y
  // resteraient tous les deux, et la timeline montrerait « fini » et
  // « abandonné » sur le même jeu. On valide donc UNE fois par ligne, quand
  // l'utilisateur passe à une autre ou quitte l'écran. Changer d'avis plus
  // tard relève d'E07, que la spécification diffère explicitement.
  const enAttente = useRef<string | null>(null);
  const dernier = useRef<Record<string, Affinage>>({});
  const [erreur, setErreur] = useState<string | null>(null);

  /**
   * Les titres déclarés « jamais joué » (§24.3).
   *
   * <b>Hors de `declarees`, et c'est le point.</b> « Il n'y a pas joué » et
   * « il ne s'est pas prononcé » sont deux informations différentes ; les
   * mêler ferait grandir la bande d'une histoire que la timeline ne
   * confirmerait pas — aucun événement n'est produit.
   */
  const [jamaisJoues, setJamaisJoues] = useState<Set<string>>(
    () => new Set(etatInitial.filter((l) => l.neverPlayed).map((l) => l.workId)),
  );

  // Les souvenirs vivent HORS de l'ensemble des déclarations : décocher une
  // ligne ne doit pas détruire une phrase. Se tromper de ligne est le geste
  // le plus fréquent de cet écran, et perdre du texte à cause d'un tap mal
  // placé serait impardonnable sur le seul contenu non régénérable.
  const [souvenirs, setSouvenirs] =
    useState<Record<string, SouvenirEcrit>>(souvenirsInitiaux);

  // Les titres saisis. Ils vivent à part des œuvres du référentiel : les
  // mélanger leur donnerait un rang, une notoriété et un statut régional
  // qu'ils n'ont pas — c'est-à-dire l'apparence d'une donnée vérifiée là où
  // il n'y a qu'un souvenir.
  const [titresLibres, setTitresLibres] = useState<TitreLibre[]>(() =>
    titresLibresInitiaux.map((relu) => ({
      // L'identifiant d'écran EST celui de la revendication : le souvenir
      // s'indexe par cible, et un identifiant local l'empêcherait de se
      // retrouver.
      id: relu.id,
      claimId: relu.id,
      titre: relu.titre,
      // Inerte, comme pour un titre qu'on vient de saisir : une revendication
      // n'a ni notoriété, ni sortie, ni région. Lui en donner l'apparence
      // ferait passer un souvenir pour une donnée vérifiée.
      rang: Number.MAX_SAFE_INTEGER,
      sortie: null,
      couverture: null,
      regions: [],
      statutRegional: {},
    })),
  );
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

  function validerAffinage(sauf?: string) {
    const oeuvre = enAttente.current;
    if (oeuvre === null || oeuvre === sauf) return;
    enAttente.current = null;

    const reponse = dernier.current[oeuvre] ?? SANS_REPONSE;
    envoyer({
      // Le MÊME lot : un affinage n'est pas un second passage sur l'écran.
      // En ouvrir un autre ferait deux épisodes là où le joueur a fait un
      // seul geste.
      batchId: lot.current,
      entries: [{
        workId: oeuvre,
        completion: reponse.completion,
        provenance: reponse.provenance,
      }],
    }).catch(() => setErreur(t("erreur.declaration")));
  }

  // Quitter l'écran vaut validation. Sans cela, la dernière ligne affinée
  // perdrait sa réponse — et ce serait SYSTÉMATIQUEMENT la dernière, donc
  // invisible à un essai manuel rapide.
  const validerARelacher = useRef(validerAffinage);
  validerARelacher.current = validerAffinage;
  useEffect(() => () => validerARelacher.current(), []);

  function repondre(id: string, champ: keyof Affinage, valeur: string) {
    validerAffinage(id);
    setAffinages((precedents) => {
      const courant = precedents[id] ?? SANS_REPONSE;
      // Re-cliquer la réponse déjà donnée la retire : « pas prononcé » doit
      // rester atteignable, faute de quoi un geste par erreur serait
      // définitif.
      const suivant = {
        ...courant,
        [champ]: courant[champ] === valeur ? null : valeur,
      };
      dernier.current[id] = suivant;
      return { ...precedents, [id]: suivant };
    });
    enAttente.current = id;
  }

  function basculer(id: string) {
    validerAffinage(id);

    // Une ligne estompée revient d'abord au SILENCE. Y écrire « joué » sans
    // retirer la marque produirait « je n'y ai jamais joué, et j'y ai
    // joué » (invariant 8) — et « pas prononcé » doit rester atteignable,
    // faute de quoi un balayage par erreur serait définitif.
    if (jamaisJoues.has(id)) {
      retirerJamaisJoue(id);
      return;
    }

    const suivant = new Set(declarees);
    const etaitDeclare = suivant.delete(id);
    if (!etaitDeclare) suivant.add(id);

    // L'affichage change MAINTENANT, avant tout appel réseau.
    setDeclarees(suivant);

    if (etaitDeclare) {
      // Le journal est en ajout seul : on ne retire pas l'événement, on
      // demande qu'il soit marqué. §5.3 veut la révision « conservée côté
      // système sans être exposée ».
      retracter(id).catch(() => setErreur(t("erreur.retractation")));
      return;
    }

    envoyer({ batchId: lot.current, entries: [{ workId: id }] }).catch(() => {
      setErreur(t("erreur.declaration"));
    });
  }

  function retirerJamaisJoue(id: string) {
    setJamaisJoues((precedents) => {
      const suivant = new Set(precedents);
      suivant.delete(id);
      return suivant;
    });
    // La rétractation supprime le jugement : la ligne cesse d'exister dans
    // l'état relu, ce qui est bien « rien de dit » — et non « joué : faux »,
    // qui serait un second avis.
    retracter(id).catch(() => setErreur(t("erreur.retractation")));
  }

  /**
   * Le geste de §24.3, dans les deux sens.
   *
   * E02 le veut atteignable sans quatrième cible permanente : un balayage
   * vers la gauche sur mobile, un bouton révélé au survol et au focus sur
   * desktop. Les deux appellent ceci.
   */
  function basculerJamaisJoue(id: string) {
    validerAffinage(id);

    if (jamaisJoues.has(id)) {
      retirerJamaisJoue(id);
      return;
    }

    const etaitDeclare = declarees.has(id);
    if (etaitDeclare) {
      const restantes = new Set(declarees);
      restantes.delete(id);
      setDeclarees(restantes);
    }
    setJamaisJoues((precedents) => new Set(precedents).add(id));

    const marquer = () =>
      envoyer({
        batchId: lot.current,
        entries: [{ workId: id, neverPlayed: true }],
      });

    // L'ORDRE compte : marquer sans retirer laisserait l'événement « joué »
    // vivant sous le jugement « jamais joué », et l'écran relirait les deux.
    (etaitDeclare ? retracter(id).then(marquer) : marquer()).catch(() => {
      setErreur(t("erreur.declaration"));
    });
  }

  /**
   * Le balayage, reconstitué à partir des événements de pointeur.
   *
   * <b>Horizontal DOMINANT</b> : descendre la liste est le geste le plus
   * fréquent de l'écran, et un défilement qui déclarerait au passage la
   * rendrait impraticable au pouce.
   *
   * Le navigateur tire un clic du relâchement. `balaye` l'étouffe, sans
   * quoi le même geste dirait « j'y ai joué » et « je n'y ai jamais joué ».
   */
  const depart = useRef<{ x: number; y: number } | null>(null);
  const balaye = useRef(false);

  function finBalayage(id: string, x: number, y: number) {
    const debut = depart.current;
    depart.current = null;
    if (debut === null) return;

    const dx = debut.x - x;
    const dy = Math.abs(debut.y - y);
    // Écrit comme une condition d'ACCEPTATION, et niée. Sous la forme
    // « rejeter si dx < seuil », une coordonnée manquante donne `NaN`, toute
    // comparaison devient fausse, et le rejet ne rejette plus : le geste
    // passe. Ici, `NaN` ne satisfait rien, donc rien ne se déclare.
    if (!(dx >= SEUIL_BALAYAGE && dx > dy)) return;

    balaye.current = true;
    basculerJamaisJoue(id);
  }

  function ajouterTitreLibre() {
    validerAffinage();
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
    const brouillon = souvenirs[cle] ?? SANS_SOUVENIR;
    const texte = brouillon.texte.trim();
    // Rien à garder : un souvenir vide occuperait une place à l'écran et
    // ferait croire à une phrase écrite. Un repère SEUL ne fait pas un
    // souvenir non plus — il annoncerait sur l'axe un texte inexistant, et
    // l'API le refuserait. Il reste à l'écran, sous les yeux.
    if (texte.length === 0) return;

    ecrireSouvenir(cible, { texte, titre: brouillon.titre.trim() }).catch(() => {
      setErreur(t("erreur.souvenir"));
    });
  }

  const ordonnees = [...oeuvres].sort((a, b) => a.rang - b.rang);

  return (
    <section>
      {/* Repère B — « 147 jeux · 12 déclarés ». Le second nombre vient de
          l'état relu : sans lui, l'écran annoncerait zéro déclaré à un
          profil plein. */}
      <p className="compte">
        {t("selection.compte", {
          jeux: String(oeuvres.length),
          declares: String(declarees.size),
        })}
      </p>

      <ul data-disposition={disposition}>
        {ordonnees.map((oeuvre) => {
          const declare = declarees.has(oeuvre.id);
          const jamais = jamaisJoues.has(oeuvre.id);
          const enGrille = disposition === "grille";
          return (
            <li
              key={oeuvre.id}
              data-hauteur={enGrille ? undefined : 56}
              // Estompée, jamais retirée : E02 la veut corrigeable, et une
              // ligne qui disparaît fait perdre ses repères au joueur.
              data-jamais-joue={String(jamais)}
            >
              {/* La CELLULE ENTIÈRE est la cible, en liste comme en grille :
                  quatre cibles de 44 px occuperaient 200 px et ne laisseraient
                  que 143 px de titre sur un écran de 375 px — sur l'écran dont
                  toute la mécanique repose sur la reconnaissance. */}
              <button
                type="button"
                className="ligne"
                aria-pressed={declare}
                aria-label={t(
                  jamais ? "ligne.jamaisJoue" : declare ? "ligne.declare" : "ligne.declarer",
                  { titre: oeuvre.titre },
                )}
                onPointerDown={(e) => {
                  depart.current = { x: e.clientX, y: e.clientY };
                }}
                onPointerUp={(e) => finBalayage(oeuvre.id, e.clientX, e.clientY)}
                onClick={() => {
                  // Le clic que le navigateur tire d'un balayage : le geste a
                  // déjà dit ce qu'il voulait dire.
                  if (balaye.current) {
                    balaye.current = false;
                    return;
                  }
                  basculer(oeuvre.id);
                }}
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
                <span className="ligne-titre">{oeuvre.titre}</span>
                {/* La date porte SA granularité : une année seule ne s'affiche
                    pas comme une date au jour. 31 sorties du dataset ne sont
                    datées qu'à l'année, et les rendre exactes affirmerait un
                    jour que la source ne donne pas. */}
                <span data-forme={oeuvre.sortie ? forme(oeuvre.sortie) : "aucune"}>
                  {oeuvre.sortie ? libelle(oeuvre.sortie) : t("ligne.dateInconnue")}
                </span>
                <StatutRegional statut={statutRegion(oeuvre, region)} region={region} />
                {/* La marque est DITE, avec son nom : une icône sans nom
                    accessible se déchiffre au lieu de se reconnaître (§10).
                    Celle du cercle barré, jamais celle de l'abandon — les
                    principes §6 bis interdisent de rendre ce choix comme un
                    renoncement. */}
                {jamais ? <Icone nom="jamais-joue" /> : null}
              </button>

              {/* Le geste de desktop (E02), et le seul chemin au CLAVIER.
                  Frère de la ligne, pas enfant : un bouton dans un bouton
                  n'est pas du HTML valide, et le navigateur en perdrait un.
                  Présent en permanence dans le document, révélé au survol et
                  au focus par le socle — une quatrième cible permanente sur
                  chaque ligne coûterait les 200 px que E02 refuse. */}
              <button
                type="button"
                className="ligne-jamais-joue"
                aria-pressed={jamais}
                aria-label={t(
                  jamais ? "action.retirerJamaisJoue" : "action.jamaisJoue",
                  { titre: oeuvre.titre },
                )}
                onClick={() => basculerJamaisJoue(oeuvre.id)}
              >
                {/* Muette : le bouton porte déjà son nom, et l'icône y
                    ferait lire « Jamais joué » deux fois de suite. */}
                <Icone nom="jamais-joue" muette />
              </button>

              {/* Le champ n'apparaît qu'une fois la ligne déclarée : une zone
                  de texte par ligne non cochée occuperait la place de l'écran
                  le plus dense du produit et suggérerait un travail à faire.
                  §9 est un COMPLÉMENT, jamais un passage obligé. */}
              {/* La passe 2 : deux questions que le modèle sait porter
                  aujourd'hui. « Quand y avez-vous joué » (§4.8) et « ça vous
                  a marqué » (§4.7) attendent que l'API les accepte — les
                  monter maintenant ferait un écran qui recueille des
                  réponses que personne n'enregistre. */}
              {declare ? (
                <Question
                  intitule={t("passe2.acheve")}
                  valeur={(affinages[oeuvre.id] ?? SANS_REPONSE).completion}
                  repondre={(v) => repondre(oeuvre.id, "completion", v)}
                  choix={[
                    { valeur: "finished", libelle: t("passe2.fini") },
                    { valeur: "stillPlaying", libelle: t("passe2.enCours") },
                    { valeur: "abandoned", libelle: t("passe2.abandonne") },
                  ]}
                />
              ) : null}

              {/* « Comment » REMPLACE une case « possédé » : poser
                  « possédé ? » à côté d'un geste qui dit déjà « joué » est
                  ambigu, et jouer sans posséder était la norme avant la
                  dématérialisation. */}
              {declare ? (
                <Question
                  intitule={t("passe2.comment")}
                  valeur={(affinages[oeuvre.id] ?? SANS_REPONSE).provenance}
                  repondre={(v) => repondre(oeuvre.id, "provenance", v)}
                  choix={[
                    { valeur: "owned", libelle: t("passe2.possede") },
                    { valeur: "elsewhere", libelle: t("passe2.ailleurs") },
                    { valeur: "borrowed", libelle: t("passe2.emprunte") },
                  ]}
                />
              ) : null}

              {declare ? (
                <ChampSouvenir
                  titre={oeuvre.titre}
                  valeur={souvenirs[oeuvre.id] ?? SANS_SOUVENIR}
                  surSaisie={(souvenir) =>
                    setSouvenirs((s) => ({ ...s, [oeuvre.id]: souvenir }))
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
                  valeur={souvenirs[libre.id] ?? SANS_SOUVENIR}
                  surSaisie={(souvenir) =>
                    setSouvenirs((s) => ({ ...s, [libre.id]: souvenir }))
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
