import type { ValeurTemporelle } from "../temporel/valeur";

/**
 * La période choisie à la passe 1 (§24.3).
 *
 * <b>Trois formes, pas sept.</b> Le modèle en compte sept ; exposer
 * l'énumération complète ferait remonter le modèle dans l'écran. Le repli
 * de précision — mois, date exacte, « vers », âge — vit dans E07.
 *
 * Le vocabulaire est celui que l'API attend en ENTRÉE (`year` · `range` ·
 * `unknown`), distinct de celui qu'elle rend en sortie (`Year` ·
 * `YearRange` · `Unknown`). Les deux ne se confondent pas, et
 * `versValeurTemporelle` est le seul pont entre eux.
 */
export type PeriodeChoisie =
  | { kind: "year"; year: number }
  | { kind: "range"; from: number; to: number }
  | { kind: "unknown" };

/**
 * Traduit la période vers la valeur du domaine, **pour l'affichage
 * seulement**.
 *
 * C'est ce qui permet au bandeau de contexte d'être rendu par la MÊME
 * fonction que la timeline. Deux rendus séparés finiraient par diverger, et
 * l'utilisateur verrait s'afficher une période différente de celle qui sera
 * attachée à ses déclarations — sans que rien ne le signale.
 */
export function versValeurTemporelle(periode: PeriodeChoisie): ValeurTemporelle {
  switch (periode.kind) {
    case "year":
      return { kind: "Year", year: periode.year };
    case "range":
      return { kind: "YearRange", year: periode.from, endYear: periode.to };
    case "unknown":
      return { kind: "Unknown" };
  }
}
