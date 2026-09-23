import type { EntreeTimeline } from "./types";

/** Une décennie que rien ne couvre, bornée à aujourd'hui. */
export type Trou = { debut: number; fin: number };

/**
 * Les décennies vides de l'axe — <b>les endroits où proposer E02</b>.
 *
 * E03 : « Les trous sont des invitations. Une décennie vide n'est pas un
 * défaut d'affichage : c'est l'endroit exact où proposer E02. C'est le
 * mécanisme de relance le plus naturel du produit, et il ne coûte aucune
 * notification. »
 *
 * <b>Trois bornes, et chacune évite une phrase fausse.</b> Rien avant la
 * première déclaration : ce n'est pas un trou, c'est la préhistoire, et
 * proposer 1972–1989 à qui a commencé en 1995 lui demanderait des années
 * qu'il n'a pas vécues comme joueur. Rien après aujourd'hui : un souvenir ne
 * se situe pas dans l'avenir. Et rien sur un axe vide : il porte déjà sa
 * propre invitation, et deux superposées n'en font pas une plus claire.
 */
export function decenniesVides(
  entrees: EntreeTimeline[],
  anneeCourante: number,
): Trou[] {
  // ⚠️ Ce retour anticipé ne change AUCUN comportement : sans lui,
  // `Math.min()` d'une liste vide vaut `Infinity`, la boucle ne tourne pas, et
  // le résultat est déjà vide. Une mutation qui le retire ne fait donc échouer
  // personne — vérifié —, et il reste parce que le cas vide doit être une
  // décision lisible et non la conséquence d'une règle d'IEEE 754. Il est
  // nommé comme tel pour qu'on ne le prenne pas pour une branche gardée
  // (apprentissage 83).
  if (entrees.length === 0) return [];

  const bornes = entrees.map(
    (e) => [Number(e.interval.start.slice(0, 4)), Number(e.interval.end.slice(0, 4))] as const,
  );
  const premiere = Math.min(...bornes.map(([debut]) => debut));

  const trous: Trou[] = [];
  for (
    let d = Math.floor(premiere / 10) * 10;
    d <= Math.floor(anneeCourante / 10) * 10;
    d += 10
  ) {
    // Un CHEVAUCHEMENT suffit à remplir la décennie. Une bande 1998–2003 les
    // remplit toutes les deux : l'axe ne dit pas dans laquelle le moment est
    // tombé, et en réclamer une serait affirmer ce que le joueur n'a pas dit
    // (§7.5).
    const couverte = bornes.some(([debut, fin]) => debut <= d + 9 && fin >= d);
    if (couverte) continue;

    trous.push({ debut: d, fin: Math.min(d + 9, anneeCourante) });
  }
  return trous;
}

export type ElementAxe =
  | { kind: "entree"; entree: EntreeTimeline }
  | { kind: "trou"; trou: Trou };

/**
 * Pose les trous entre les entrées, <b>sans jamais retrier celles-ci</b>.
 *
 * L'ordre des entrées vient du domaine, que 387 tests valident. Fusionner
 * les deux listes par un tri commun le referait ici, avec une chance de
 * diverger — et l'axe bougerait d'une visite à l'autre, ce que l'utilisateur
 * ne distingue pas d'une perte de données. On parcourt donc les entrées dans
 * leur ordre, en glissant chaque trou devant la première qui lui succède.
 */
export function intercaler(entrees: EntreeTimeline[], trous: Trou[]): ElementAxe[] {
  const restants = [...trous];
  const sortie: ElementAxe[] = [];

  for (const entree of entrees) {
    const annee = Number(entree.interval.start.slice(0, 4));
    while (restants.length > 0 && restants[0].debut < annee) {
      sortie.push({ kind: "trou", trou: restants.shift()! });
    }
    sortie.push({ kind: "entree", entree });
  }

  // Ce qui suit tout : le cas le plus fréquent d'une première session, où
  // l'on a saisi sa console d'enfance et rien d'autre.
  for (const trou of restants) sortie.push({ kind: "trou", trou });

  return sortie;
}
