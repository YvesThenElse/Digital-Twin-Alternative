import { t } from "../i18n/t";

/**
 * Une question de la passe 2 — <b>une ligne de chips, jamais un formulaire</b>.
 *
 * « Quatre questions, une ligne de chips chacune, toutes facultatives. Elles
 * ne coûtent rien à qui les ignore et changent la nature du profil pour qui y
 * répond » (E02).
 *
 * <b>Partagée par E02 et E07, et ce n'est pas une économie.</b> E07 le dit :
 * « les deux écrans partagent le même composant — une divergence entre eux
 * serait un défaut ». Deux jeux de chips pour la même question finiraient par
 * proposer des réponses différentes au même joueur selon l'écran d'où il
 * vient.
 */
export function Question({ intitule, choix, valeur, repondre }: {
  intitule: string;
  choix: { valeur: string; libelle: string }[];
  valeur: string | null;
  repondre: (valeur: string) => void;
}) {
  return (
    <div role="group" aria-label={intitule}>
      <span>{intitule}</span>
      {choix.map((c) => (
        <button
          key={c.valeur}
          type="button"
          aria-pressed={valeur === c.valeur}
          onClick={() => repondre(c.valeur)}
        >
          {c.libelle}
        </button>
      ))}
    </div>
  );
}

/**
 * Les réponses, <b>définies une fois</b>.
 *
 * Elles voyagent jusqu'à l'API dans ce vocabulaire-là : les recopier à
 * l'écran suivant ferait diverger deux listes que le domaine croit égales.
 */
export const CHOIX_ACHEVEMENT = [
  { valeur: "finished", libelle: t("passe2.fini") },
  { valeur: "stillPlaying", libelle: t("passe2.enCours") },
  { valeur: "abandoned", libelle: t("passe2.abandonne") },
];

export const CHOIX_PROVENANCE = [
  { valeur: "owned", libelle: t("passe2.possede") },
  { valeur: "elsewhere", libelle: t("passe2.ailleurs") },
  { valeur: "borrowed", libelle: t("passe2.emprunte") },
];

/**
 * L'affect (§4.7) — <b>trois marches, pas une note sur dix</b>.
 *
 * « Une note jugerait l'œuvre, l'affect enregistre une relation — et une
 * échelle ferait dériver le produit vers la critique. »
 */
export const CHOIX_AFFECT = [
  { valeur: "indifferent", libelle: t("passe2.sansPlus") },
  { valeur: "loved", libelle: t("passe2.adore") },
  { valeur: "favourite", libelle: t("passe2.prefere") },
];
