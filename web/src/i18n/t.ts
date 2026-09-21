import { MESSAGES, type CleMessage } from "./messages";

/**
 * Rend le libellé d'une clé, paramètres substitués.
 *
 * <b>Une clé inconnue échoue, elle ne se replie pas sur elle-même.</b>
 * Afficher la clé brute — « region.sorti » — dans l'interface serait un
 * défaut visible mais muet : personne ne saurait s'il manque une traduction
 * ou si le code s'est trompé de clé. Le type l'interdit à la compilation ;
 * l'exception couvre le cas d'un appel dynamique.
 */
export function t(cle: CleMessage, params?: Record<string, string | number>): string {
  const modele = MESSAGES[cle];
  if (modele === undefined) {
    throw new Error(`Libellé inconnu : « ${cle} ».`);
  }
  if (params === undefined) return modele;

  return modele.replace(/\{(\w+)\}/g, (entier, nom: string) => {
    const valeur = params[nom];
    // Un paramètre manquant laisse le gabarit visible plutôt que « undefined » :
    // on voit alors QUOI manque.
    return valeur === undefined ? entier : String(valeur);
  });
}
