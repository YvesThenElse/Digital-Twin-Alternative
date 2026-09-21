import { anneeDe } from "../temporel/valeur";
import type { Oeuvre } from "./types";

export type Tranche = { annee: number; compte: number };

export type Bande = {
  /** Une tranche par année couverte. Vide tant que rien n'est déclaré. */
  tranches: Tranche[];
  /** `null` tant qu'aucune déclaration datée n'existe. */
  periode: { debut: number; fin: number } | null;
  /** Tout ce qui est déclaré, daté ou non. */
  total: number;
  /** Déclaré mais sans année : compté, jamais placé. */
  sansDate: number;
};

/**
 * La bande d'époque du pied d'écran (E02 repère D).
 *
 * **Ce n'est pas un compteur qui s'incrémente, c'est une histoire qui
 * pousse** ([langage visuel](../../../ecrans/00-langage-visuel.md) §7). Un
 * nombre qui monte ne récompense rien ; une forme qui s'étend montre à
 * l'utilisateur ce qu'il est en train de construire — et c'est la seule
 * réponse que §24.4 donne à « pourquoi passer deux heures à saisir ».
 *
 * Trois décisions y sont enfouies :
 *
 * - **Rien de déclaré, pas de bande.** Une bande plate à zéro affirmerait une
 *   histoire vide ; l'absence dit qu'elle n'a pas commencé.
 * - **La période suit les déclarations**, pas la plateforme. Déclarer un seul
 *   jeu de 1995 montre une tranche, pas une décennie plate autour.
 * - **Les jeux sans année sont comptés, jamais placés.** Les dater d'office
 *   inventerait une précision ; les ignorer les ferait disparaître d'un
 *   décompte où le joueur les a bien mis.
 */
export function construireBande(oeuvres: Oeuvre[], declarees: Set<string>): Bande {
  const parId = new Map(oeuvres.map((o) => [o.id, o]));
  const retenues = [...declarees]
    .map((id) => parId.get(id))
    .filter((o): o is Oeuvre => o !== undefined);

  const annees = retenues
    .map((o) => (o.sortie === null ? null : anneeDe(o.sortie)))
    .filter((a): a is number => a !== null);

  if (annees.length === 0) {
    return {
      tranches: [],
      periode: null,
      total: retenues.length,
      sansDate: retenues.length,
    };
  }

  const debut = Math.min(...annees);
  const fin = Math.max(...annees);
  const comptes = new Map<number, number>();
  for (const annee of annees) {
    comptes.set(annee, (comptes.get(annee) ?? 0) + 1);
  }

  const tranches: Tranche[] = [];
  for (let annee = debut; annee <= fin; annee += 1) {
    tranches.push({ annee, compte: comptes.get(annee) ?? 0 });
  }

  return {
    tranches,
    periode: { debut, fin },
    total: retenues.length,
    sansDate: retenues.length - annees.length,
  };
}
