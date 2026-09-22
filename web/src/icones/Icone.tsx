import type React from "react";
import { t } from "../i18n/t";

/**
 * Les icônes de déclaration — langage visuel §3.
 *
 * <b>Trois familles, aucune légende à apprendre.</b> La fiche note que la
 * première version reposait sur un système géométrique — rond, carré,
 * losange — « élégant sur le papier et illisible à l'écran », et surtout
 * qu'il <b>obligeait à apprendre une correspondance</b>. Les familles se
 * distinguent donc par leur <b>sujet</b> : on n'a pas à comparer des formes
 * pour savoir de quoi on parle.
 *
 * <b>Facture</b> : trait de 1.9, extrémités et jonctions arrondies, grille
 * de 24, aucune surface pleine sauf le cœur du préféré. Elles héritent de
 * `currentColor`, donc prennent l'accent d'époque là où le contexte en
 * porte un.
 *
 * <b>Et jamais l'icône seule</b> : « l'information n'est jamais portée par
 * la seule couleur » (§10), ce qui vaut aussi pour la forme. Chaque icône
 * porte son nom accessible, et les écrans denses l'accompagnent d'un
 * libellé lisible.
 */
export type NomIcone =
  // Ce qu'on a fait du jeu
  | "joue"
  | "fini"
  | "en-cours"
  | "abandonne"
  | "jamais-joue"
  // Où l'objet se trouvait
  | "possede"
  | "ailleurs"
  | "emprunte"
  // Ce qu'il a laissé
  | "sans-plus"
  | "adore"
  | "prefere";

/** Le tracé de chaque icône, sur la grille de 24. */
const TRACES: Record<NomIcone, React.ReactElement> = {
  // La manette : le geste même.
  joue: (
    <>
      <path d="M8 12h4M10 10v4" />
      <circle cx="16" cy="11" r="1" />
      <circle cx="18.5" cy="13.5" r="1" />
      <path d="M7.5 7h9a4.5 4.5 0 0 1 4.4 3.6l.8 4.2A3 3 0 0 1 18 18.4L16 16H8l-2 2.4A3 3 0 0 1 2.3 14.8l.8-4.2A4.5 4.5 0 0 1 7.5 7Z" />
    </>
  ),
  // Le drapeau : on a atteint l'arrivée.
  fini: (
    <>
      <path d="M6 21V4" />
      <path d="M6 5h11l-2.5 4L17 13H6" />
    </>
  ),
  // Le triangle de lecture : ça tourne encore.
  "en-cours": <path d="M8 5.5v13l11-6.5-11-6.5Z" />,
  // La flèche demi-tour : on a fait demi-tour, ce n'est pas un échec.
  abandonne: (
    <>
      <path d="M6 19v-7a5 5 0 0 1 10 0v4" />
      <path d="M12.5 12.5 16 16l3.5-3.5" />
    </>
  ),
  // Le cercle barré : une déclaration, pas une absence.
  "jamais-joue": (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M6.5 6.5 17.5 17.5" />
    </>
  ),
  // La boîte : l'objet vous appartenait.
  possede: (
    <>
      <path d="M4 8.5 12 4.5l8 4v7l-8 4-8-4v-7Z" />
      <path d="M4 8.5 12 12.5l8-4M12 12.5V19.5" />
    </>
  ),
  // La maison : le cas le plus fréquent de la période rétro.
  ailleurs: (
    <>
      <path d="M4 11 12 4.5 20 11" />
      <path d="M6 10v9h12v-9" />
    </>
  ),
  // Les flèches aller-retour : il est venu, il est reparti.
  emprunte: (
    <>
      <path d="M4 9h13l-3-3M20 15H7l3 3" />
    </>
  ),
  // Le trait horizontal : plat, neutre — et déclaré.
  "sans-plus": <path d="M5 12h14" />,
  // Le cœur au trait : l'attachement. JAMAIS une étoile, qui évoquerait
  // une note sur cinq — précisément ce que §1 écarte.
  adore: (
    <path d="M12 19.5s-7-4.4-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10.5c0 4.6-7 9-7 9Z" />
  ),
  // Le même attachement, à son maximum — la seule surface pleine.
  prefere: (
    <path
      d="M12 19.5s-7-4.4-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10.5c0 4.6-7 9-7 9Z"
      fill="currentColor"
    />
  ),
};

/**
 * @param muette
 * Retire l'icône de l'arbre d'accessibilité. À n'employer que dans un
 * élément qui porte DÉJÀ le nom — un bouton libellé, par exemple : l'icône y
 * répéterait « Jamais joué » après « Je n'y ai jamais joué à… », et un
 * lecteur d'écran lirait deux fois la même chose. Partout ailleurs, §10
 * l'interdit : « l'information n'est jamais portée par la seule icône ».
 */
export function Icone({ nom, taille = 15, muette = false }: {
  nom: NomIcone;
  taille?: number;
  muette?: boolean;
}) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={muette ? undefined : "img"}
      aria-hidden={muette ? true : undefined}
      aria-label={muette ? undefined : t(`icone.${nom}`)}
    >
      {TRACES[nom]}
    </svg>
  );
}
