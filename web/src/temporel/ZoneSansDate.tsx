import { libelle, type ValeurTemporelle } from "./valeur";

export type MomentSansDate = {
  id: string;
  intitule: string;
  quand: ValeurTemporelle;
};

/**
 * Le tiroir de l'axe — « à une date inconnue »
 * ([ORDONNANCEMENT-TEMPOREL](../../../ORDONNANCEMENT-TEMPOREL.md) §5).
 *
 * <b>Séparé, jamais masqué.</b> Ce qui n'a pas d'intervalle n'a pas de place
 * sur l'axe : l'y projeter à une position arbitraire affirmerait une date que
 * personne n'a donnée. Mais l'effacer ferait disparaître un souvenir que le
 * joueur a bel et bien déclaré — et c'est la réponse la plus fréquente des
 * trois que l'écran propose.
 *
 * La zone ne s'affiche pas quand elle est vide : un tiroir vide n'apprend
 * rien et occupe de la place sur l'écran le plus dense du produit.
 */
export function ZoneSansDate({ moments }: { moments: MomentSansDate[] }) {
  if (moments.length === 0) return null;

  return (
    <section data-testid="zone-sans-date" data-compte={moments.length}>
      <h2>À une date inconnue</h2>
      <ul>
        {moments.map((m) => (
          <li key={m.id}>
            <span>{m.intitule}</span>
            {/* Le libellé reste celui de la valeur : « vers mes 12 ans » dit
                pourquoi le moment est là, « date inconnue » ne dirait rien. */}
            <span data-forme="hors-axe">{libelle(m.quand)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
