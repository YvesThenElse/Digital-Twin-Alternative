import type { CleMessage } from "../i18n/messages";
import { t } from "../i18n/t";
import { libelle, type ValeurTemporelle } from "../temporel/valeur";

/**
 * Les quatre chiffres, tels que l'API les rend.
 *
 * <b>Ils ne sont pas facultatifs un par un.</b> C'est le BLOC qui disparaît
 * sous le seuil du portrait — E04 : « les blocs sans données suffisantes
 * s'effacent au lieu d'afficher zéro ». Rendre chaque chiffre nullable ferait
 * sauter la rangée de trois à quatre d'une visite à l'autre, et la fiche en
 * promet quatre.
 */
export type ChiffresDuProfil = {
  consoles: number;
  gamesDeclared: number;
  finished: number;
  memoriesWritten: number;
};

/** Le début de l'histoire (E04, bloc A). */
export type DebutDuProfil = {
  /** `null` sous un an : « depuis 0 ans » n'est pas une phrase. */
  years: number | null;
  /** Le NOM de la machine, résolu par l'API. `null` s'il n'y en a pas. */
  platform: string | null;
  occurredAt: ValeurTemporelle;
};

export type SyntheseDuProfil = {
  /**
   * Tout le journal — <b>pas un chiffre du portrait</b>.
   *
   * Il ne s'affiche nulle part : il répond à « cet historique est-il
   * vide ? », question que l'accueil pose avant de proposer une reprise
   * (E01). Le fonder sur `figures`, qui disparaît sous le seuil, ferait
   * proposer de tout recommencer à qui a déjà trois déclarations.
   */
  moments: number;
  /** `null` quand le profil est trop maigre pour qu'un chiffre veuille dire
   * quelque chose. L'API ne les envoie pas ; l'écran n'en invente pas. */
  figures: ChiffresDuProfil | null;
  opening: DebutDuProfil | null;
};

/**
 * L'en-tête de `/mon-histoire` — <b>la synthèse d'E04, en Phase 1</b>.
 *
 * « En Phase 1, E04 n'est pas un écran séparé : sa synthèse […] forme
 * l'en-tête de `/mon-histoire`, au-dessus de la timeline E03. » Son objectif
 * est la porte dure de la Phase 2 — « produire le moment *oui, ça me
 * ressemble* » —, et il n'ajoute aucune donnée : il donne un sens à celles
 * qui existent.
 *
 * <b>Deux interdits le gouvernent.</b> Densité faible (principe 3) : §8.2
 * liste treize indicateurs, E04 en garde quatre, « les afficher tous
 * produirait un tableau de bord, pas un portrait ». Et rien n'est recompté
 * ici : un chiffre calculé à l'écran porterait sur ce qui est chargé — une
 * plateforme, les lignes visibles — et non sur l'histoire. Il serait juste
 * par rapport à l'écran, faux par rapport au joueur, et personne ne le
 * verrait.
 *
 * <b>La phrase est en display serif</b> (langage visuel §4) : « c'est elle
 * qui installe le registre récit plutôt que tableau de bord ». Aucun test de
 * composant ne peut le voir — il rend dans un document sans feuille de
 * style —, la garde est donc dans le navigateur, et elle mesure.
 */
export function SyntheseProfil({ synthese }: { synthese: SyntheseDuProfil | null }) {
  // Rien tant que la lecture n'a pas abouti, et rien non plus quand il n'y a
  // rien à dire : un en-tête qui s'affiche vide puis se remplit ferait sauter
  // l'écran au moment précis où le joueur le découvre.
  if (synthese === null) return null;
  const { figures, opening } = synthese;
  if (figures === null && opening === null) return null;

  return (
    <header className="portrait" data-testid="portrait">
      {opening !== null ? (
        <p className="portrait-phrase" data-testid="portrait-phrase">
          {Phrase(opening)}
        </p>
      ) : null}

      {figures !== null ? (
        <ul className="portrait-chiffres" data-testid="portrait-chiffres">
          <Chiffre valeur={figures.consoles} quoi="consoles" />
          <Chiffre valeur={figures.gamesDeclared} quoi="jeux" />
          <Chiffre valeur={figures.finished} quoi="termines" />
          {/* Le quatrième de la fiche est « à 100 % », et le modèle le
              refuse : §4.6 l'a sorti de l'axe des positions — « 100 % de
              Tetris ou d'un jeu de sport ne veut rien dire ». Les souvenirs
              le remplacent, et ce n'est pas un pis-aller : c'est le seul
              contenu non générable du produit, celui dont §9.1 fait le
              porteur direct du « oui, ça me ressemble ». */}
          <Chiffre valeur={figures.memoriesWritten} quoi="souvenirs" />
        </ul>
      ) : null}
    </header>
  );
}

type Quoi = "consoles" | "jeux" | "termines" | "souvenirs";

/**
 * Les libellés, <b>nommés en toutes lettres</b> — singulier, pluriel.
 *
 * Les composer à la volée (`portrait.${quoi}.un`) coûterait une exception au
 * garde des libellés morts, qui cherche la clé littéralement. Huit clés
 * écrites ici, c'est huit clés qu'il continue de surveiller : retirer un
 * chiffre fait mourir ses deux libellés, et la suite le dit.
 */
const LIBELLES: Record<Quoi, readonly [CleMessage, CleMessage]> = {
  consoles: ["portrait.consoles.un", "portrait.consoles.plusieurs"],
  jeux: ["portrait.jeux.un", "portrait.jeux.plusieurs"],
  termines: ["portrait.termines.un", "portrait.termines.plusieurs"],
  souvenirs: ["portrait.souvenirs.un", "portrait.souvenirs.plusieurs"],
};

/**
 * Un chiffre et son libellé — <b>deux éléments, pas une phrase</b>.
 *
 * Le nombre est en display et en chasse tabulaire (langage visuel §4), le
 * libellé en micro : c'est la hiérarchie qui fait lire un portrait plutôt
 * qu'une ligne de statistiques.
 */
function Chiffre({ valeur, quoi }: { valeur: number; quoi: Quoi }) {
  return (
    <li className="portrait-chiffre">
      <span className="portrait-nombre" data-testid="portrait-nombre">{valeur}</span>
      <span className="portrait-libelle" data-testid="portrait-libelle">
        {/* Le français accorde au pluriel À PARTIR de deux : « 0 console »
            et « 1 console ». Un « 1 consoles » dans un en-tête qui se veut
            un portrait le ferait lire comme un rapport automatique. */}
        {t(LIBELLES[quoi][valeur > 1 ? 1 : 0])}
      </span>
    </li>
  );
}

/**
 * La phrase du bloc A.
 *
 * <b>La durée est toujours approchée</b>, et pas seulement parce que la date
 * est floue : le premier moment DÉCLARÉ n'est pas le premier moment vécu.
 * L'approximation est dans la prémisse, donc elle est dite quoi qu'il arrive.
 */
function Phrase(debut: DebutDuProfil): string {
  // `libelle` garde la granularité : « vers 1991 » n'est pas « 1991 ». La
  // refaire ici la ferait diverger de l'axe, juste en dessous.
  const quand = libelle(debut.occurredAt);
  const commencement = debut.platform === null
    ? t("portrait.debut", { quand })
    : t("portrait.debut.machine", { machine: debut.platform, quand });

  return debut.years === null
    ? commencement
    : `${t("portrait.depuis", { annees: debut.years })} ${commencement}`;
}
