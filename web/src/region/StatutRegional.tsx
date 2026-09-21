import { libelleStatut, type StatutRegion } from "./statut";

/**
 * L'indication régionale d'une ligne (§3.4).
 *
 * <b>Les quatre états se voient, aucun ne se devine.</b> Rendre l'un d'eux
 * par l'absence d'indication le rendrait indistinguable d'un défaut
 * d'affichage — et priverait les trois autres de leur sens, qui vient du
 * contraste.
 *
 * `data-statut` porte l'état lisible par la machine : le texte seul se prête
 * aux comparaisons trompeuses (leçon de l'item 01, « indisponible » contient
 * « disponible »).
 */
export function StatutRegional({
  statut,
  region,
}: {
  statut: StatutRegion;
  region: string;
}) {
  return (
    <span data-statut={statut} data-region={region}>
      {libelleStatut(statut, region)}
    </span>
  );
}
