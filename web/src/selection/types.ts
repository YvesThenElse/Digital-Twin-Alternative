import type { ValeurTemporelle } from "../temporel/valeur";

/** Une œuvre telle que l'écran de sélection massive la reçoit. */
export type Oeuvre = {
  id: string;
  titre: string;
  /** Rang de notoriété SUR CETTE PLATEFORME (§3.3). L'ordre d'affichage. */
  rang: number;
  /**
   * La sortie sur cette plateforme, **avec sa granularité**.
   *
   * Une année seule et une date au jour ne s'affichent pas pareil : 31
   * sorties du dataset ne sont datées qu'à l'année, et les rendre comme des
   * dates exactes affirmerait un jour que la source ne donne pas. `null`
   * quand aucune date n'est exploitable.
   */
  sortie: ValeurTemporelle | null;
  regions: string[];
  /** Les trois états de §3.4 : absent de la table = sortie attestée. */
  statutRegional: Record<string, "notReleased" | "unknown">;
};

export type Plateforme = {
  id: string;
  nom: string;
  regionFree: boolean;
  launchYear: number;
  worksCount: number;
};
