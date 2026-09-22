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

/**
 * La période reste-t-elle possible sur cette machine ?
 *
 * <b>La règle est celle de l'API</b>, qui refuse un lot dont la période est
 * « entièrement antérieure » à la sortie de la machine. L'écran la répète
 * ici pour ne pas conduire le joueur dans un cul-de-sac en changeant de
 * console — mais il n'en est pas le porteur : c'est la couche qui écrit qui
 * refuse, et elle continue de le faire.
 *
 * On compare la borne la plus TARDIVE, et c'est ce qui rend le verdict sûr :
 * une période qui chevauche la sortie reste tenable, et « je ne sais plus »
 * n'oppose aucune borne.
 */
export function periodeTenable(periode: PeriodeChoisie, anneeDeLancement: number): boolean {
  switch (periode.kind) {
    case "year":
      return periode.year >= anneeDeLancement;
    case "range":
      return periode.to >= anneeDeLancement;
    case "unknown":
      return true;
  }
}

/**
 * La décennie d'une période, ou `null` quand il n'y en a pas.
 *
 * <b>Celle du DÉBUT.</b> Une période choisie à E01 tient toujours dans une
 * décennie — les cartes du temps 2 ne les traversent pas —, et c'est le
 * moment où l'histoire commence que la phrase raconte.
 *
 * « Je ne sais plus » n'en a aucune, et ce n'est pas un manque : invariant 2,
 * ce qui n'a pas d'intervalle n'a pas de place sur un axe. Lui en inventer
 * une affirmerait une date que personne n'a donnée.
 */
export function decennieDe(periode: PeriodeChoisie): number | null {
  switch (periode.kind) {
    case "year":
      return Math.floor(periode.year / 10) * 10;
    case "range":
      return Math.floor(periode.from / 10) * 10;
    case "unknown":
      return null;
  }
}

/**
 * « 90 », « 2000 » — <b>la forme qu'on dit à voix haute</b>.
 *
 * « Années 1990 » n'est pas du français parlé, et ce qui se lit autrement
 * qu'on ne le pense se lit plus lentement. Elle vit ici et non dans l'écran
 * du temps 2, parce que le temps 3 la redit : deux écritures de la même
 * forme finiraient par diverger, et le joueur verrait la décennie changer de
 * nom entre deux écrans.
 */
export function nomDecennie(d: number): string {
  return d < 2000 ? String(d % 100) : String(d);
}
