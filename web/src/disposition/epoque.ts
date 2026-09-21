/**
 * Le système d'époques
 * ([langage visuel](../../../ecrans/00-langage-visuel.md) §2) — **le parti
 * pris central du produit**.
 *
 * Le sujet, ce sont les décennies. La couleur les encode selon un gradient de
 * température : le passé est chaud et terreux comme une photo vieillie, le
 * présent est froid et net.
 *
 * Elle rend trois services d'un coup : on sait où l'on est sur la timeline
 * sans lire de date, le produit acquiert une identité qu'aucun concurrent
 * n'a, et **la grille cesse d'être grise même sans jaquettes**.
 */
export type Epoque = {
  nom: string;
  /** Première année incluse. */
  depuis: number;
  accent: string;
};

export const EPOQUES: Epoque[] = [
  { nom: "8 bits", depuis: 0, accent: "#A6572F" },
  { nom: "16 bits", depuis: 1990, accent: "#B0842B" },
  { nom: "32/64 bits", depuis: 1995, accent: "#6E7F4A" },
  { nom: "128 bits", depuis: 2000, accent: "#3F7A80" },
  { nom: "HD", depuis: 2006, accent: "#4A6BA8" },
  { nom: "Moderne", depuis: 2013, accent: "#6B5EA8" },
];

/**
 * L'accent d'une année.
 *
 * <b>Toujours une couleur, même sans année.</b> Une tuile grise au milieu
 * d'une grille colorée se lirait comme un défaut d'affichage ; or une sortie
 * non datée est une donnée, pas une panne. On retient alors la plus ancienne
 * époque : c'est là que se trouvent les titres dont la date manque le plus
 * souvent.
 */
export function accentEpoque(annee: number | null): Epoque {
  if (annee === null) return EPOQUES[0];
  // Parcours à rebours : la première borne franchie gagne, donc les bornes
  // se touchent sans trou ni chevauchement.
  for (let i = EPOQUES.length - 1; i >= 0; i -= 1) {
    if (annee >= EPOQUES[i].depuis) return EPOQUES[i];
  }
  return EPOQUES[0];
}

/**
 * Une trame géométrique dérivée du titre, pour que deux jeux voisins ne
 * soient pas identiques (§5).
 *
 * <b>Stable</b> : la grille ne doit pas changer d'aspect d'une visite à
 * l'autre — l'utilisateur ne distinguerait pas cela d'une perte de données.
 * D'où un calcul déterministe, jamais un tirage.
 */
export function trameDuTitre(titre: string): number {
  let h = 0;
  for (const c of titre) {
    h = (h * 31 + c.codePointAt(0)!) % 1000;
  }
  return h;
}

export type Disposition = "liste" | "grille";

/**
 * <b>Deux stratégies de lecture, pas une disposition étirée</b> (§6).
 *
 * On balaye une liste sur téléphone, une grille sur écran large. Le tableau
 * de densité ne donne que ces deux colonnes pour E02 : la tablette suit la
 * liste, parce qu'un troisième mode intermédiaire inventerait une troisième
 * stratégie que le langage visuel refuse — et parce que la grille ne se
 * justifie qu'avec la place de quatre à six tuiles par rangée.
 */
export function dispositionPour(largeurPx: number): Disposition {
  return largeurPx >= 1024 ? "grille" : "liste";
}
