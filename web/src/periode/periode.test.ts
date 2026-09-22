import { describe, expect, it } from "vitest";
import { periodeTenable } from "./periode";

/**
 * La période survit-elle au changement de console (E02) ?
 *
 * <b>La règle appartient à l'API</b>, qui refuse un lot dont la période est
 * « entièrement antérieure » à la machine. L'écran la répète ici pour ne pas
 * conduire le joueur dans un cul-de-sac — il ne peut pas en être le seul
 * porteur, et il ne l'est pas : `DeclarationsTests` garde le refus.
 */
describe("periodeTenable — la période conservée doit rester possible", () => {
  it("garde une période postérieure à la sortie de la machine", () => {
    expect(periodeTenable({ kind: "range", from: 1990, to: 1994 }, 1990)).toBe(true);
  });

  it("garde une période qui CHEVAUCHE la sortie", () => {
    // « Ne refuser que l'impossible certain » : une période qui commence
    // avant la machine mais finit après reste tenable — le joueur y a bien
    // pu jouer.
    expect(periodeTenable({ kind: "range", from: 1986, to: 1994 }, 1990)).toBe(true);
  });

  it("refuse une période entièrement antérieure", () => {
    expect(periodeTenable({ kind: "range", from: 1983, to: 1987 }, 1990)).toBe(false);
  });

  it("juge une année seule sur elle-même", () => {
    expect(periodeTenable({ kind: "year", year: 1989 }, 1990)).toBe(false);
    expect(periodeTenable({ kind: "year", year: 1990 }, 1990)).toBe(true);
  });

  it("garde « je ne sais plus », qui n'oppose aucune borne", () => {
    // Sans borne haute, rien n'est impossible. La refuser ferait redemander
    // une date à quelqu'un qui vient de dire qu'il ne l'a pas.
    expect(periodeTenable({ kind: "unknown" }, 2017)).toBe(true);
  });
});
