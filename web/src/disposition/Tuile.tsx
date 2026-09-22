import { useState } from "react";
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
 *
 * <b>Et elle est le filet.</b> « Une jaquette reprise est un emprunt
 * révocable : rien dans le produit ne doit cesser de marcher le jour où elle
 * disparaît » (VERIFICATION-JURIDIQUE §3.3). Le catalogue ne filtre qu'à
 * l'amorçage ; une source retirée ensuite laissait un glyphe cassé dans la
 * grille — sur l'écran dont toute la mécanique repose sur la reconnaissance.
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

  /**
   * L'ADRESSE qui a échoué, pas le fait d'avoir échoué.
   *
   * Retenir « cette tuile est cassée » priverait le joueur d'une jaquette
   * valide dès que la liste change sous elle ; ne rien retenir referait la
   * requête à chaque rendu, sur 218 tuiles.
   */
  const [adresseEchouee, setAdresseEchouee] = useState<string | null>(null);

  if (couverture !== null && couverture !== adresseEchouee) {
    return (
      <span
        data-tuile="jaquette"
        // Format constant quelle que soit l'origine, pour que la grille reste
        // régulière — c'est ce qui empêche l'alternance de paraître rapiécée.
        data-ratio="3:4"
        data-epoque={epoque.nom}
      >
        {/* Un navigateur n'échoue PAS sur une image cassée : il dessine un
            glyphe et se tait. `onError` est le seul signal qu'il donne, et
            sans lui le repli n'aurait jamais lieu. */}
        <img src={couverture} alt={titre} onError={() => setAdresseEchouee(couverture)} />
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
