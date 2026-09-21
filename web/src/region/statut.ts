import type { Oeuvre } from "../selection/types";

/**
 * Ce qu'on sait d'une sortie dans une région — **quatre réponses, jamais le
 * silence**.
 *
 * Les trois premières viennent de §3.4 ; la quatrième dit que la question ne
 * se pose pas, sur une machine sans zonage.
 *
 * <b>L'écart entre `jamais-sorti` et `inconnu` est le plus coûteux du
 * produit.</b> Les confondre retire au joueur un jeu qu'il a possédé, ou lui
 * en propose un qu'il n'a jamais pu voir — et les deux cassent la
 * reconnaissance, en sens inverse.
 */
export type StatutRegion = "sorti" | "jamais-sorti" | "inconnu" | "mondiale";

export function statutRegion(oeuvre: Oeuvre, region: string): StatutRegion {
  // Une sortie mondiale répond pour toutes les régions : c'est la Switch, où
  // le zonage n'existe pas. Répondre « inconnu » y inventerait une
  // incertitude.
  if (oeuvre.regions.includes("WORLDWIDE")) return "mondiale";

  // La sortie attestée PRIME sur un statut contradictoire. Une ligne
  // incohérente en base ne doit pas retirer un jeu au joueur : le chargeur
  // signale la contradiction, l'écran penche du côté qui ne fait rien
  // disparaître.
  if (oeuvre.regions.includes(region)) return "sorti";

  if (oeuvre.statutRegional[region] === "notReleased") return "jamais-sorti";

  // Tout le reste est inconnu — y compris l'absence totale de mention. Le
  // silence d'une source n'est pas une preuve d'absence.
  return "inconnu";
}

const REGIONS: Record<string, string> = {
  PAL: "Europe",
  "NTSC-U": "Amérique du Nord",
  "NTSC-J": "Japon",
};

/**
 * Le libellé visible. **Aucun des quatre états ne se rend par une chaîne
 * vide** : un état muet serait indistinguable d'un défaut d'affichage, et les
 * trois autres perdraient leur sens par contraste.
 *
 * Le code de région n'est jamais montré : « PAL » ne dit rien à un joueur.
 *
 * ⚠️ Libellés rassemblés ici pour l'item 14.
 */
export function libelleStatut(statut: StatutRegion, region: string): string {
  const nom = REGIONS[region] ?? region;
  switch (statut) {
    case "sorti":
      return `Sorti en ${nom}`;
    case "jamais-sorti":
      return `Jamais sorti en ${nom}`;
    case "inconnu":
      // Formulé SANS négation : « pas sorti » et « on ne sait pas » se
      // ressemblent trop à la lecture rapide d'une liste de 35 lignes.
      return `Sortie ${nom === "Japon" ? "japonaise" : nom === "Europe" ? "européenne" : "nord-américaine"} inconnue`;
    case "mondiale":
      return "Sortie mondiale";
  }
}
