import { accentEpoque, trameDuTitre } from "./epoque";

/**
 * La tuile de jeu (§5).
 *
 * <b>Conçue pour fonctionner dans les deux cas, sans que la grille paraisse
 * rapiécée.</b> La reconnaissance est la mécanique centrale de E02 et repose
 * sur la jaquette, dont la disponibilité n'est pas acquise : 218 œuvres sur
 * 221 en ont une, trois n'en auront jamais.
 *
 * <b>La tuile générée ne ressemble jamais à une vraie jaquette</b> — pas de
 * bordure de boîtier, pas de faux logo d'éditeur. Elle assume d'être une
 * composition typographique, et c'est ce qui la rend intentionnelle plutôt
 * que manquante.
 *
 * <b>Elle n'est pas un substitut.</b> Une tuile générée est du texte sur un
 * fond coloré : on la lit au lieu de la reconnaître. C'est un point
 * d'ancrage, et c'est pourquoi la grille desktop ne se justifie que là où de
 * vraies jaquettes existent.
 */
export function Tuile({
  titre,
  annee,
  couverture,
}: {
  titre: string;
  annee: number | null;
  couverture: string | null;
}) {
  const epoque = accentEpoque(annee);

  if (couverture !== null) {
    return (
      <span
        data-tuile="jaquette"
        // Format constant quelle que soit l'origine, pour que la grille reste
        // régulière — c'est ce qui empêche l'alternance de paraître rapiécée.
        data-ratio="3:4"
        data-epoque={epoque.nom}
      >
        <img src={couverture} alt={titre} />
      </span>
    );
  }

  return (
    <span
      data-tuile="generee"
      data-ratio="3:4"
      data-epoque={epoque.nom}
      data-trame={trameDuTitre(titre)}
      style={{ backgroundColor: epoque.accent }}
    >
      {/* Le titre EST la tuile : une composition typographique assumée, et
          non un placeholder. Le masquer laisserait un aplat de couleur, que
          l'œil lirait comme une image qui n'a pas chargé. */}
      <span data-role="titre-tuile">{titre}</span>
    </span>
  );
}
