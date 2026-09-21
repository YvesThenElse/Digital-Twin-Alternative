import { MESSAGES, type CleMessage } from "../i18n/messages";
import { t } from "../i18n/t";
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

/**
 * Le libellé visible. **Aucun des quatre états ne se rend par une chaîne
 * vide** : un état muet serait indistinguable d'un défaut d'affichage, et les
 * trois autres perdraient leur sens par contraste.
 *
 * Le code de région n'est jamais montré : « PAL » ne dit rien à un joueur.
 */
export function libelleStatut(statut: StatutRegion, region: string): string {
  // Le NOM de la région, jamais son code : « PAL » ne dit rien à un joueur.
  // Une région hors catalogue retombe sur son code plutôt que de rendre vide.
  const cleRegion = `region.${region}` as CleMessage;
  const nom = cleRegion in MESSAGES ? t(cleRegion) : region;

  switch (statut) {
    case "sorti":
      return t("region.sorti", { region: nom });
    case "jamais-sorti":
      return t("region.jamaisSorti", { region: nom });
    case "inconnu":
      return t("region.inconnue", { region: nom });
    case "mondiale":
      return t("region.mondiale");
  }
}
