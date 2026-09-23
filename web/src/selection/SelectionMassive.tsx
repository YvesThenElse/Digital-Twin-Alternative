import { useEffect, useMemo, useRef, useState } from "react";
import { BandeDEpoque } from "./BandeDEpoque";
import { Icone } from "../icones/Icone";
import { StatutRegional } from "../region/StatutRegional";
import { statutRegion } from "../region/statut";
import type { CleMessage } from "../i18n/messages";
import { t } from "../i18n/t";
import { Tuile } from "../disposition/Tuile";
import { ModaleDuJeu, type EtatDuJeu } from "./ModaleDuJeu";
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
      /**
       * indifferent · loved · favourite · `null` = pas prononcé (§4.7).
       *
       * Trois marches, pas une note : « une note jugerait l'œuvre, l'affect
       * enregistre une relation ».
       */
      affect?: string | null;
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
  /** indifferent · loved · favourite · `null` = pas prononcé (§4.7). */
  affect: string | null;
};

/** Les trois réponses de passe 2 que l'écran pose (§4.5 à §4.7). */
type Affinage = {
  completion: string | null;
  provenance: string | null;
  affect: string | null;
};

const SANS_REPONSE: Affinage = { completion: null, provenance: null, affect: null };

/**
 * La marque de chaque état, en fin de ligne.
 *
 * <b>Écrite comme un tableau exhaustif</b> et non comme deux ternaires :
 * un quatrième état ne compilerait pas, là où une cascade de conditions
 * l'aurait rangé en silence dans le cas par défaut — c'est-à-dire dans
 * « pas encore dit », qui est précisément celui qu'on ne veut pas voir
 * attribué par défaut.
 */
const MARQUE: Record<EtatDuJeu, "joue" | "jamais-joue" | "pas-dit"> = {
  joue: "joue",
  jamais: "jamais-joue",
  inconnu: "pas-dit",
};

/**
 * Le nom de chaque état, <b>écrit en toutes lettres</b>.
 *
 * Composer la clé — `ligne.etat.${etat}` — coûterait une exception au garde
 * des libellés morts, qui la cherche LITTÉRALEMENT dans les sources. Trois
 * clés écrites ici, c'est trois clés qu'il continue de surveiller : retirer
 * un état fait mourir son libellé, et la suite le dit.
 */
const NOM_ETAT: Record<EtatDuJeu, CleMessage> = {
  joue: "ligne.etat.joue",
  jamais: "ligne.etat.jamais",
  inconnu: "ligne.etat.inconnu",
};

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
   * Ouvre la fiche d'un jeu (E05) — <b>depuis le panneau d'affinage</b>.
   *
   * Les relations d'E02 promettent « → E05 (détail d'un jeu, en conservant
   * la position) » et aucun geste ne l'ouvrait. Il vit dans le panneau et
   * non sur la ligne : une seconde cible par ligne est exactement ce que la
   * refonte en deux passes interdit — quatre cibles de 44 px ne laissent que
   * 143 px de titre, sur l'écran dont toute la mécanique repose sur la
   * reconnaissance.
   *
   * Conséquence assumée : le panneau n'existe que sur une ligne DÉCLARÉE.
   * La fiche d'un jeu qu'on hésite à cocher attend un autre geste.
   */
  ouvrirFiche: (oeuvre: Oeuvre) => void;
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
  /**
   * Les quatre états obligatoires (principes §5), comme E01 les porte.
   *
   * <b>Requis, sans valeur par défaut</b>, pour la raison qui a valu à E01
   * de les séparer : trois états rendus par une seule phrase, c'est trois
   * fois la même information fausse.
   *
   * L'état <i>vide</i> n'est pas ici : il se déduit d'une liste vide une
   * fois prête. Le demander en plus permettrait de l'annoncer à côté d'une
   * liste pleine.
   */
  chargement: "en-cours" | "pret" | "echec";
  /**
   * L'identifiant du lot — <b>le passage sur l'écran, pas le geste</b>
   * (§4.4). Douze titres cochés d'un coup forment un épisode.
   *
   * <b>Il vient du parent, et c'est ce qui le rend juste.</b> Gardé dans une
   * ref, il repartait à chaque remontage du composant : un simple
   * rechargement de la liste détachait la suite de la saisie de l'épisode
   * commencé, et la timeline montrait deux bandes là où le joueur n'a fait
   * qu'un passage.
   */
  lot: string;
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

/**
 * La comparaison du filtre — <b>sans casse ni accent</b>.
 *
 * `NFD` sépare la lettre de son signe, la classe `\p{Diacritic}` retire le
 * second : « Pokémon » se trouve en tapant « pokemon ». Faire l'inverse —
 * exiger l'accent — ferait échouer la recherche sur les titres qu'on tape
 * le plus vite.
 */
export function contient(titre: string, recherche: string): boolean {
  const nu = (s: string) =>
    s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("fr");
  return nu(titre).includes(nu(recherche.trim()));
}

export function SelectionMassive({
  oeuvres, region, disposition, envoyer, ouvrirFiche, ecrireSouvenir, recharger,
  retracter, etatInitial, souvenirsInitiaux, titresLibresInitiaux, chargement, lot,
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
      l.workId,
      { completion: l.completion, provenance: l.provenance, affect: l.affect },
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

  /**
   * Le jeu dont la modale est ouverte, ou `null`.
   *
   * <b>Un identifiant, pas l'œuvre.</b> La liste se filtre et se recharge
   * sous la modale ; garder l'objet ferait vivre une copie périmée, et la
   * modale afficherait un titre que la liste ne contient plus.
   */
  const [ouvert, setOuvert] = useState<string | null>(null);

  /**
   * Ce que le balayage EN COURS va produire, s'il est relâché maintenant.
   *
   * C'est la réponse au reproche le plus juste qu'on ait fait à cet écran :
   * « on ne voit pas qu'on peut balayer ». Une légende l'aurait dit une fois
   * et aurait encombré la liste pour toujours ; le geste, lui, s'annonce
   * pendant qu'on le fait — et n'encombre rien quand on ne le fait pas.
   */
  const [intention, setIntention] =
    useState<{ id: string; sens: "joue" | "jamais" } | null>(null);

  /**
   * La recherche de la barre de contrôle (E02 repère B).
   *
   * <b>Elle ne touche à RIEN d'autre.</b> Les lignes cochées, les affinages,
   * les souvenirs et les titres saisis vivent dans leur propre état : filtrer
   * est une lecture, et une lecture qui remettrait à zéro ce qui a été
   * déclaré depuis l'ouverture perdrait la saisie au moment précis où l'on
   * cherche quelque chose (apprentissage 73).
   *
   * <b>Sans temporisation</b> : sur 221 lignes déjà en mémoire, filtrer coûte
   * une comparaison de chaînes. Une attente ferait voir la liste d'avant
   * pendant deux frappes — « jamais un état intermédiaire ».
   */
  const [recherche, setRecherche] = useState("");
  const compteurLibre = useRef(0);

  // La bande compte les titres saisis comme les autres. Un geste qui ne
  // ferait pas bouger la récompense dirait à l'utilisateur qu'il n'a rien
  // produit — et c'est le geste le plus fragile de l'écran (§24.4). Sans
  // date, ils sont comptés et jamais placés, comme un jeu non daté.
  const bande = useMemo(
    () => construireBande([...oeuvres, ...titresLibres], declarees),
    [oeuvres, titresLibres, declarees],
  );

  /**
   * L'état d'une ligne — <b>trois valeurs, pas deux</b>.
   *
   * « Quand on ouvre la liste, on ne sait pas si on y a joué. » L'écran
   * rendait le silence exactement comme le refus : une ligne éteinte. §24.3
   * en fait pourtant deux informations différentes, et la seconde fait
   * avancer la reconstruction — la première dit seulement qu'on n'a pas
   * encore regardé.
   *
   * Les deux ensembles portent déjà la distinction ; ce qui manquait, c'est
   * qu'elle se VOIE.
   */
  function etatDe(id: string): EtatDuJeu {
    if (jamaisJoues.has(id)) return "jamais";
    if (declarees.has(id)) return "joue";
    return "inconnu";
  }

  function validerAffinage(sauf?: string) {
    const oeuvre = enAttente.current;
    if (oeuvre === null || oeuvre === sauf) return;
    enAttente.current = null;

    const reponse = dernier.current[oeuvre] ?? SANS_REPONSE;
    envoyer({
      // Le MÊME lot : un affinage n'est pas un second passage sur l'écran.
      // En ouvrir un autre ferait deux épisodes là où le joueur a fait un
      // seul geste.
      batchId: lot,
      entries: [{
        workId: oeuvre,
        completion: reponse.completion,
        provenance: reponse.provenance,
        affect: reponse.affect,
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

  /**
   * Poser l'un des trois états — <b>le seul chemin d'écriture de l'écran</b>.
   *
   * <para>Re-dire ce qui est déjà dit RETIRE : « pas encore dit » doit rester
   * atteignable, faute de quoi un geste par erreur serait définitif. C'est
   * la même règle que les chips de la passe 2, et elle vaut ici davantage :
   * se tromper de ligne est le geste le plus fréquent de cet écran.</para>
   *
   * <para><b>L'ORDRE compte quand on change de camp.</b> Marquer « jamais
   * joué » sans retirer d'abord laisserait l'événement « joué » vivant sous
   * le jugement, et l'écran relirait les deux — « je n'y ai jamais joué, et
   * j'y ai joué » (invariant 8).</para>
   */
  function reglerEtat(id: string, vise: "joue" | "jamais") {
    validerAffinage(id);
    const actuel = etatDe(id);

    const sansRien = () => {
      setDeclarees((p) => { const s = new Set(p); s.delete(id); return s; });
      setJamaisJoues((p) => { const s = new Set(p); s.delete(id); return s; });
    };

    if (actuel === vise) {
      sansRien();
      // Le journal est en ajout seul : on ne retire pas l'événement, on
      // demande qu'il soit marqué. §5.3 veut la révision « conservée côté
      // système sans être exposée ».
      retracter(id).catch(() => setErreur(t("erreur.retractation")));
      return;
    }

    // L'affichage change MAINTENANT, avant tout appel réseau (§24.4).
    sansRien();
    if (vise === "joue") {
      setDeclarees((p) => new Set(p).add(id));
    } else {
      setJamaisJoues((p) => new Set(p).add(id));
    }

    const marquer = () =>
      envoyer({
        batchId: lot,
        entries: [vise === "joue" ? { workId: id } : { workId: id, neverPlayed: true }],
      });

    (actuel === "inconnu" ? marquer() : retracter(id).then(marquer)).catch(() => {
      setErreur(t("erreur.declaration"));
    });
  }

  /**
   * Le balayage, reconstitué à partir des événements de pointeur —
   * <b>et il déclare désormais dans les DEUX sens</b>.
   *
   * <b>À droite « j'y ai joué », à gauche « jamais »</b>, dans le sens de
   * lecture : ce qu'on avance va vers soi, ce qu'on écarte s'en va. Un seul
   * sens laissait le geste de loin le plus fréquent — déclarer — au tap,
   * qui sert maintenant à ouvrir.
   *
   * <b>Horizontal DOMINANT</b> : descendre la liste est le geste le plus
   * fréquent de l'écran, et un défilement qui déclarerait au passage la
   * rendrait impraticable au pouce.
   *
   * Le navigateur tire un clic du relâchement. `balaye` l'étouffe, sans
   * quoi le même geste déclarerait ET ouvrirait la modale.
   */
  const depart = useRef<{ x: number; y: number } | null>(null);
  const balaye = useRef(false);

  /**
   * Ce qu'un déplacement vaut — <b>la règle, écrite une fois</b>.
   *
   * Elle sert à l'annonce pendant le geste et à sa conclusion. Deux copies
   * finiraient par diverger, et l'écran annoncerait « joué » pour produire
   * « jamais » : le pire défaut possible sur un geste qui écrit.
   */
  function sensDu(dx: number, dy: number): "joue" | "jamais" | null {
    // Écrit comme une condition d'ACCEPTATION, et niée. Sous la forme
    // « rejeter si dx < seuil », une coordonnée manquante donne `NaN`, toute
    // comparaison devient fausse, et le rejet ne rejette plus : le geste
    // passe. Ici, `NaN` ne satisfait rien, donc rien ne se déclare.
    if (!(Math.abs(dx) >= SEUIL_BALAYAGE && Math.abs(dx) > dy)) return null;
    // `dx` compte vers la GAUCHE : c'est `debut - courant`.
    return dx > 0 ? "jamais" : "joue";
  }

  /**
   * L'annonce, pendant le geste.
   *
   * Elle ne change rien à l'état déclaré : elle dit seulement ce que le
   * relâchement produirait. Revenir en arrière avant de lâcher l'efface —
   * un geste commencé par erreur ne coûte rien.
   */
  function pendantBalayage(id: string, x: number, y: number) {
    const debut = depart.current;
    if (debut === null) return;

    const sens = sensDu(debut.x - x, Math.abs(debut.y - y));
    // Comparé avant d'écrire : `pointermove` tire des dizaines d'événements
    // par geste, et rendre à chacun ferait ramer la liste la plus dense du
    // produit.
    if (intention?.id === id && intention.sens === sens) return;
    setIntention(sens === null ? null : { id, sens });
  }

  function finBalayage(id: string, x: number, y: number) {
    const debut = depart.current;
    depart.current = null;
    setIntention(null);
    if (debut === null) return;

    const sens = sensDu(debut.x - x, Math.abs(debut.y - y));
    if (sens === null) return;

    balaye.current = true;
    reglerEtat(id, sens);
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
    envoyer({ batchId: lot, entries: [{ title: titre }] })
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

  /**
   * Ce que la recherche retient — <b>le titre, et rien d'autre</b>.
   *
   * Sans accent ni casse : le dataset porte « Pokémon », « Astérix »,
   * « Légende ». Exiger l'accent ferait échouer la recherche sur les titres
   * qu'on tape le plus vite, et le joueur en conclurait que le jeu n'y est
   * pas — l'inverse exact de ce que ce filtre sert.
   */
  const filtrees = ordonnees.filter((o) => contient(o.titre, recherche));

  /**
   * L'œuvre ouverte, relue dans la liste à chaque rendu.
   *
   * <b>Pas une copie gardée à l'ouverture</b> : la liste se recharge, et une
   * copie périmée ferait afficher une jaquette ou un titre que la liste ne
   * contient plus.
   */
  const oeuvreOuverte = oeuvres.find((o) => o.id === ouvert);
  const filtreActif = recherche.trim().length > 0;

  /**
   * Le squelette : la STRUCTURE attendue, pas un spinner.
   *
   * Un spinner centré ne dit pas ce qui arrive ; le squelette annonce une
   * liste, et l'œil sait déjà où regarder quand elle arrive. Huit lignes
   * remplissent un écran de téléphone sans prétendre annoncer un nombre.
   */
  if (chargement === "en-cours") {
    return (
      <section>
        <p role="status">{t("selection.chargement")}</p>
        <ul data-testid="squelette" aria-hidden="true">
          {Array.from({ length: 8 }, (_, i) => (
            <li key={i} className="ligne-squelette" data-hauteur={56} />
          ))}
        </ul>
      </section>
    );
  }

  if (chargement === "echec") {
    return (
      <section>
        {/* Ce qui a échoué, ce qui est conservé, quoi faire (§5). La période
            reste à l'écran au-dessus : la dire conservée évite que le
            testeur recommence tout par précaution. */}
        <p role="alert">{t("selection.echec")}</p>
        <button type="button" onClick={recharger}>{t("action.recharger")}</button>
      </section>
    );
  }

  return (
    <section>
      {/* Repère B — « 147 jeux · 12 déclarés ». Le second nombre vient de
          l'état relu : sans lui, l'écran annoncerait zéro déclaré à un
          profil plein. */}
      <div className="barre-controle">
        <p className="compte" data-testid="compte">
          {filtreActif
            ? t(
                filtrees.length > 1
                  ? "selection.compte.filtre.plusieurs"
                  : "selection.compte.filtre.un",
                {
                  n: String(filtrees.length),
                  jeux: String(oeuvres.length),
                  // Les DÉCLARÉS ne suivent pas le filtre : c'est la
                  // récompense permanente du repère D, pas un sous-total.
                  declares: String(declarees.size),
                },
              )
            : t("selection.compte", {
                jeux: String(oeuvres.length),
                declares: String(declarees.size),
              })}
        </p>

        <div className="filtre">
          <input
            type="text"
            className="champ-filtre"
            aria-label={t("selection.filtre")}
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
          {/* Il n'existe que s'il y a quelque chose à vider. Sur un
              téléphone, effacer un champ à la main coûte plus que le geste
              qu'on vient d'économiser. */}
          {filtreActif ? (
            <button type="button" className="discret" onClick={() => setRecherche("")}>
              {t("selection.viderFiltre")}
            </button>
          ) : null}
        </div>
      </div>

      {/* L'état VIDE — le plus important de §5, parce que c'est celui que
          voit un nouvel utilisateur. Il ne propose que des issues qui
          EXISTENT : la période ne filtre pas cette liste, et la région est
          une hypothèse posée une fois pour toutes (PROTOCOLE §2). Proposer
          de les changer ferait tourner en rond. */}
      {oeuvres.length === 0 ? <p role="status">{t("selection.vide")}</p> : null}

      {/* Jamais une page blanche (§5), et l'issue est juste en dessous : la
          saisie libre de §3.5 est la réponse au titre qui n'est pas au
          référentiel. Filtrer jusqu'au vide est exactement le moment où l'on
          s'en aperçoit. */}
      {filtreActif && filtrees.length === 0 ? (
        <p role="status" data-testid="filtre-sans-resultat">
          {t("selection.filtreSansResultat", { texte: recherche })}
        </p>
      ) : null}

      <ul data-disposition={disposition}>
        {filtrees.map((oeuvre) => {
          const etat = etatDe(oeuvre.id);
          const declare = etat === "joue";
          const jamais = etat === "jamais";
          const enGrille = disposition === "grille";
          return (
            <li
              key={oeuvre.id}
              data-hauteur={enGrille ? undefined : 56}
              // Estompée, jamais retirée : E02 la veut corrigeable, et une
              // ligne qui disparaît fait perdre ses repères au joueur.
              data-jamais-joue={String(jamais)}
              // LES TROIS ÉTATS, portés par la ligne elle-même. Ce qui
              // manquait n'était pas la donnée — les deux ensembles la
              // tenaient déjà — mais le fait qu'elle se voie.
              data-etat={etat}
              // Ce que le balayage en cours produirait s'il était relâché
              // maintenant. Absent le reste du temps : la liste ne porte
              // aucune légende, et le geste s'annonce pendant qu'on le fait.
              data-balayage={intention?.id === oeuvre.id ? intention.sens : undefined}
            >
              {/* La CELLULE ENTIÈRE est la cible, en liste comme en grille :
                  quatre cibles de 44 px occuperaient 200 px et ne laisseraient
                  que 143 px de titre sur un écran de 375 px — sur l'écran dont
                  toute la mécanique repose sur la reconnaissance. */}
              <button
                type="button"
                className="ligne"
                // L'état est DANS le nom, pas seulement dans la couleur
                // (§10) : sans lui, un lecteur d'écran parcourt 147 lignes
                // sans savoir laquelle est déjà déclarée.
                aria-label={t("ligne.ouvrir", {
                  titre: oeuvre.titre,
                  etat: t(NOM_ETAT[etat]),
                })}
                onPointerDown={(e) => {
                  depart.current = { x: e.clientX, y: e.clientY };
                  // REMIS À PLAT à chaque nouveau geste. Le drapeau n'est
                  // effacé que par le clic qu'il étouffe — et tous les
                  // navigateurs n'en tirent pas un de chaque balayage. Resté
                  // armé, il mangeait le TAP SUIVANT, sur une autre ligne :
                  // on touchait, rien ne s'ouvrait, et le geste d'après
                  // fonctionnait. Le défaut ne coûtait rien tant que le tap
                  // déclarait — on le refaisait — ; il coûte une ouverture
                  // perdue depuis qu'il ouvre.
                  balaye.current = false;
                }}
                onPointerMove={(e) => pendantBalayage(oeuvre.id, e.clientX, e.clientY)}
                onPointerUp={(e) => finBalayage(oeuvre.id, e.clientX, e.clientY)}
                onPointerCancel={() => {
                  depart.current = null;
                  setIntention(null);
                }}
                onClick={() => {
                  // Le clic que le navigateur tire d'un balayage : le geste a
                  // déjà dit ce qu'il voulait dire.
                  if (balaye.current) {
                    balaye.current = false;
                    return;
                  }
                  // LE TAP OUVRE, il ne déclare plus. Déclarer est un geste
                  // dirigé — balayage, ou l'une des deux cibles ci-dessous —
                  // parce qu'un tap ne peut pas dire DANS QUEL SENS on se
                  // prononce, et que « pas encore dit » est un état à part
                  // entière depuis qu'il se voit.
                  setOuvert(oeuvre.id);
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
                {/* La marque des TROIS états, toujours présente. Elle
                    affiche, elle ne commande pas — E02 : « ces icônes n'ont
                    pas à être des cibles ». Et elle porte son nom : §10
                    interdit qu'une information tienne à la seule forme. */}
                <Icone nom={MARQUE[etat]} />
              </button>

              {/* LES DEUX GESTES DIRIGÉS — et sur desktop, le seul chemin
                  rapide : un écran sans doigt n'a pas de balayage. Au
                  clavier aussi, où aucun geste de pointeur n'existe.

                  Frères de la ligne, pas enfants : un bouton dans un bouton
                  n'est pas du HTML valide, et le navigateur en perdrait un.
                  Présents en permanence dans le document, révélés au survol
                  et au focus par le socle — deux cibles permanentes sur
                  chaque ligne coûteraient les 200 px que E02 refuse. */}
              <div className="ligne-gestes">
                <button
                  type="button"
                  className="ligne-geste"
                  data-sens="joue"
                  aria-pressed={declare}
                  aria-label={t(
                    declare ? "action.retirerJoue" : "action.joue",
                    { titre: oeuvre.titre },
                  )}
                  onClick={() => reglerEtat(oeuvre.id, "joue")}
                >
                  {/* Muette : le bouton porte déjà son nom, et l'icône y
                      ferait lire « Joué » deux fois de suite. */}
                  <Icone nom="joue" muette />
                </button>
                <button
                  type="button"
                  className="ligne-geste"
                  data-sens="jamais"
                  aria-pressed={jamais}
                  aria-label={t(
                    jamais ? "action.retirerJamaisJoue" : "action.jamaisJoue",
                    { titre: oeuvre.titre },
                  )}
                  onClick={() => reglerEtat(oeuvre.id, "jamais")}
                >
                  <Icone nom="jamais-joue" muette />
                </button>
              </div>

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

      {/* LA MODALE, à la place du dépli en ligne. Elle est montée hors de
          la liste : dans le `<li>`, elle héritait du contexte d'une ligne
          de 56 px, et une boîte centrée qui vit dans une ligne de liste est
          une contradiction que la moindre règle de débordement révèle.

          Montée seulement quand elle s'ouvre : garder 147 boîtes cachées
          coûterait 147 fois son contenu sur l'écran le plus dense. */}
      {oeuvreOuverte !== undefined ? (
        <ModaleDuJeu
          oeuvre={oeuvreOuverte}
          etat={etatDe(oeuvreOuverte.id)}
          regler={(vise) => reglerEtat(oeuvreOuverte.id, vise)}
          affinage={affinages[oeuvreOuverte.id] ?? SANS_REPONSE}
          repondre={(champ, valeur) => repondre(oeuvreOuverte.id, champ, valeur)}
          ouvrirFiche={() => ouvrirFiche(oeuvreOuverte)}
          // Fermer VAUT passage à une autre ligne : sans cela, la dernière
          // réponse donnée dans la modale partirait avec elle, et ce serait
          // systématiquement la dernière — donc invisible à un essai rapide.
          fermer={() => {
            validerAffinage();
            setOuvert(null);
          }}
          enfants={
            <ChampSouvenir
              titre={oeuvreOuverte.titre}
              valeur={souvenirs[oeuvreOuverte.id] ?? SANS_SOUVENIR}
              surSaisie={(souvenir) =>
                setSouvenirs((s) => ({ ...s, [oeuvreOuverte.id]: souvenir }))
              }
              surSortie={() =>
                enregistrerSouvenir(oeuvreOuverte.id, {
                  kind: "work",
                  id: oeuvreOuverte.id,
                })
              }
            />
          }
        />
      ) : null}

      <BandeDEpoque bande={bande} />

      <button type="button" onClick={recharger}>
        {t("action.recharger")}
      </button>
    </section>
  );
}
