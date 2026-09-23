import type { ValeurTemporelle } from "../temporel/valeur";

/**
 * Une période, telle que l'écran l'envoie (§24.3).
 *
 * <b>Sept formes, et trois seulement au premier plan.</b> La sélection
 * massive n'en produit que trois — une année, une période, « je ne sais
 * plus » — parce qu'exposer l'énumération complète ferait remonter le modèle
 * dans l'écran (principe 9). Les quatre autres vivent derrière le repli
 * « préciser » d'E07 : « c'est l'exposition qui est hiérarchisée, pas le
 * modèle qui est amputé ».
 *
 * Le vocabulaire est celui que l'API attend en ENTRÉE (`year` · `range` · …),
 * distinct de celui qu'elle rend en sortie (`Year` · `YearRange` · …). Les
 * deux ne se confondent pas, et `versValeurTemporelle` est le seul pont
 * entre eux.
 */
export type PeriodeChoisie =
  | { kind: "year"; year: number }
  /** `to: null` — « depuis 1994 » : une fin absente n'est pas une fin égale au début. */
  | { kind: "range"; from: number; to: number | null }
  | { kind: "approximate"; year: number; margin: number }
  | { kind: "month"; year: number; month: number }
  | { kind: "date"; date: string }
  /** L'âge, <b>brut</b> : la résolution appartient à l'horizon (§7.6). */
  | { kind: "age"; age: number }
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
    case "approximate":
      return { kind: "ApproximateYear", year: periode.year, margin: periode.margin };
    case "month":
      return { kind: "Month", year: periode.year, month: periode.month };
    case "date":
      return { kind: "ExactDate", date: periode.date };
    // Brut, jamais résolu ici : l'horizon du domaine sait seul si une année
    // de naissance permet de le placer, et le résoudre à l'écran
    // dupliquerait cette règle avec une chance de diverger.
    case "age":
      return { kind: "Age", age: periode.age };
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
    case "month":
      return periode.year >= anneeDeLancement;
    case "date":
      return Number(periode.date.slice(0, 4)) >= anneeDeLancement;
    // Une fin absente ne s'oppose à rien : « depuis 1994 » court jusqu'à
    // aujourd'hui, donc au-delà de n'importe quelle sortie de machine.
    case "range":
      return periode.to === null || periode.to >= anneeDeLancement;
    // « Vers 1991 » sur une console de 1990 peut vouloir dire 1992 : on ne
    // refuse que l'impossible CERTAIN, comme l'API.
    case "approximate":
      return periode.year + periode.margin >= anneeDeLancement;
    // Sans année de naissance, un âge ne se situe pas : rien ne permet de le
    // déclarer impossible, et refuser serait affirmer plus que ce qu'on sait.
    case "age":
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
    case "month":
    case "approximate":
      return Math.floor(periode.year / 10) * 10;
    case "range":
      return Math.floor(periode.from / 10) * 10;
    case "date":
      return Math.floor(Number(periode.date.slice(0, 4)) / 10) * 10;
    // Un âge n'a de décennie que par l'horizon, que cet écran n'a pas.
    case "age":
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
