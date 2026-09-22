import type { ValeurTemporelle } from "../temporel/valeur";

/**
 * Le souvenir attaché à la cible d'un moment (§9.2).
 *
 * <b>Le repère est nul quand il n'y en a pas</b>, jamais une chaîne vide :
 * l'axe afficherait une marque annonçant une phrase introuvable.
 */
export type SouvenirTimeline = { title: string | null; text: string };

export type MomentTimeline = {
  id: string;
  type: string;
  targetKind: string;
  targetId: string;
  /** Le titre lisible, résolu par l'API : l'écran n'a pas le référentiel. */
  targetLabel: string;
  occurredAt: ValeurTemporelle;
  /**
   * Le souvenir de la CIBLE, que l'API rend sur chacun de ses moments.
   *
   * Requis, et nul quand il n'y en a pas : facultatif, un appelant qui
   * l'oublie ferait disparaître de l'axe le seul contenu non régénérable du
   * produit, sans qu'aucune erreur ne le dise.
   */
  memory: SouvenirTimeline | null;
};

/**
 * Une incohérence constatée entre deux moments du même jeu (§5.4).
 *
 * <b>Le message de l'API n'est pas repris.</b> Il nomme les types du
 * domaine — « CompletedGame devrait précéder StartedGame » —, et le
 * principe 9 interdit de faire remonter ce vocabulaire à l'écran. Les deux
 * identifiants suffisent : l'écran retrouve les moments et fait sa propre
 * phrase, avec les mots qu'il emploie partout ailleurs.
 */
export type AvertissementTimeline = {
  expectedEarlierId: string;
  expectedLaterId: string;
};

export type EntreeTimeline = {
  /** Plusieurs moments d'un même lot sur la même période (§4.4). */
  isEpisode: boolean;
  interval: { start: string; end: string };
  moments: MomentTimeline[];
};
