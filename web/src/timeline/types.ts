import type { ValeurTemporelle } from "../temporel/valeur";

export type MomentTimeline = {
  id: string;
  type: string;
  targetKind: string;
  targetId: string;
  /** Le titre lisible, résolu par l'API : l'écran n'a pas le référentiel. */
  targetLabel: string;
  confidence: string;
  occurredAt: ValeurTemporelle;
};

export type EntreeTimeline = {
  /** Plusieurs moments d'un même lot sur la même période (§4.4). */
  isEpisode: boolean;
  interval: { start: string; end: string };
  moments: MomentTimeline[];
};
