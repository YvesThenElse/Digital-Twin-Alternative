/**
 * La valeur temporelle telle que l'API la rend — sept variantes, pas une de
 * plus (§7.3).
 *
 * `resolu` n'est pas une huitième variante : il dit si l'horizon a pu placer
 * un âge sur l'axe. La valeur, elle, reste l'âge déclaré.
 */
export type ValeurTemporelle =
  | { kind: "ExactDate"; date: string }
  | { kind: "Month"; year: number; month: number }
  | { kind: "Year"; year: number }
  | { kind: "YearRange"; year: number; endYear: number | null }
  | { kind: "ApproximateYear"; year: number; margin: number }
  | { kind: "Age"; age: number; resolu?: boolean }
  | { kind: "Unknown" };

/**
 * Forme à donner au moment sur l'axe
 * ([principes transverses](../../../ecrans/00-principes-transverses.md) §2).
 *
 * Le rendu est **normalisé une fois pour toutes** : laisser chaque écran
 * choisir ferait diverger la signification d'un point creux d'un écran à
 * l'autre, et l'utilisateur n'apprendrait jamais le vocabulaire.
 */
export type Forme =
  | "point-plein"
  | "point"
  | "point-creux"
  | "bande"
  | "point-creux-halo"
  | "italique"
  | "hors-axe";

export function forme(v: ValeurTemporelle): Forme {
  switch (v.kind) {
    case "ExactDate": return "point-plein";
    case "Month": return "point";
    case "Year": return "point-creux";
    case "YearRange": return "bande";
    case "ApproximateYear": return "point-creux-halo";
    case "Age": return "italique";
    case "Unknown": return "hors-axe";
  }
}

/**
 * Le moment a-t-il une place sur l'axe ?
 *
 * **Deux interdits tiennent dans cette fonction.** « Je ne sais plus » ne se
 * projette jamais à une position arbitraire — c'est une réponse, pas une
 * date. Et un âge sans année de naissance n'en a pas davantage : il reste
 * déclaré, affiché, mais hors de l'axe.
 */
export function surLAxe(v: ValeurTemporelle): boolean {
  if (v.kind === "Unknown") return false;
  if (v.kind === "Age") return v.resolu === true;
  return true;
}

const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

/**
 * Le libellé visible.
 *
 * **Jamais plus précis que la valeur.** Rendre `Year(1994)` par « 1er janvier
 * 1994 » affirmerait un jour que personne n'a déclaré — et le joueur
 * corrigerait une date qu'il n'a jamais donnée. C'est le premier des trois
 * interdits de §2, et le plus coûteux à violer.
 *
 * ⚠️ Les libellés sont rassemblés ici exprès : l'item 14 doit les sortir du
 * code sans avoir à parcourir les composants.
 */
export function libelle(v: ValeurTemporelle): string {
  switch (v.kind) {
    case "ExactDate": {
      const [a, m, j] = v.date.split("-").map(Number);
      return `${j} ${MOIS[m - 1]} ${a}`;
    }
    case "Month":
      return `${MOIS[v.month - 1]} ${v.year}`;
    case "Year":
      return `${v.year}`;
    case "YearRange":
      // Une période sans fin connue se lit « depuis » : la refermer sur son
      // début inventerait une fin que personne n'a déclarée.
      return v.endYear === null ? `depuis ${v.year}` : `${v.year}–${v.endYear}`;
    case "ApproximateYear":
      // La marge n'est PAS affichée : « vers 1994 » dit l'imprécision, « 1994
      // ± 2 » fait remonter le modèle dans l'écran (principe 9).
      return `vers ${v.year}`;
    case "Age":
      return `vers mes ${v.age} ans`;
    case "Unknown":
      return "à une date inconnue";
  }
}

/**
 * L'année sous laquelle situer la valeur, ou `null` si elle n'a pas sa place
 * sur un axe.
 *
 * <b>Ce n'est pas un affichage.</b> Le libellé garde la granularité ; cette
 * année sert à regrouper — la bande d'époque, les tranches. Les confondre
 * ferait afficher « 1994 » là où le joueur a dit « vers 1994 ».
 */
export function anneeDe(v: ValeurTemporelle): number | null {
  switch (v.kind) {
    case "ExactDate": return Number(v.date.slice(0, 4));
    case "Month":
    case "Year":
    case "ApproximateYear":
      return v.year;
    // Une période se situe à son DÉBUT : c'est le moment où l'histoire
    // commence, et c'est ce que l'axe montre.
    case "YearRange": return v.year;
    // Sans horizon, l'âge n'a pas d'année. Le résoudre ici dupliquerait la
    // logique du domaine, avec une chance de diverger.
    case "Age":
    case "Unknown":
      return null;
  }
}
