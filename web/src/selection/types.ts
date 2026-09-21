/** Une œuvre telle que l'écran de sélection massive la reçoit. */
export type Oeuvre = {
  id: string;
  titre: string;
  /** Rang de notoriété SUR CETTE PLATEFORME (§3.3). L'ordre d'affichage. */
  rang: number;
  /**
   * L'année de sortie sur cette plateforme, ou `null` quand aucune date
   * exploitable n'existe. `null` n'est pas zéro : 31 sorties du dataset sont
   * dans ce cas, et les dater d'office inventerait une précision.
   */
  annee: number | null;
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
