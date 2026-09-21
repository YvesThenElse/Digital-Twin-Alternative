import { describe, expect, it } from "vitest";
import { libelleStatut, statutRegion, type StatutRegion } from "./statut";
import type { Oeuvre } from "../selection/types";

const oeuvre = (
  regions: string[],
  statutRegional: Oeuvre["statutRegional"] = {},
): Oeuvre => ({
  id: "w",
  titre: "Un jeu",
  rang: 1,
  sortie: { kind: "Year", year: 1994 },
  couverture: null,
  regions,
  statutRegional,
});

describe("statutRegion — quatre réponses, jamais le silence", () => {
  it("dit « sorti » quand une sortie est attestée dans la région", () => {
    expect(statutRegion(oeuvre(["PAL", "NTSC-U"]), "PAL")).toBe("sorti");
  });

  it("dit « jamais sorti » quand la non-sortie est établie", () => {
    // 22 cas arbitrés à la main, chacun motivé. C'est une AFFIRMATION, pas
    // une lacune : Chrono Trigger n'est jamais paru en Europe sur Super
    // Nintendo, et le dire fait gagner du temps au testeur.
    expect(statutRegion(oeuvre(["NTSC-J", "NTSC-U"], { PAL: "notReleased" }), "PAL"))
      .toBe("jamais-sorti");
  });

  it("dit « inconnu » quand rien n'est établi", () => {
    // 32 cas. Le silence d'une source n'est pas une preuve d'absence :
    // l'infobox anglophone omet les sorties japonaises de Crash Bandicoot et
    // de Banjo-Kazooie, qui ont pourtant eu lieu.
    expect(statutRegion(oeuvre(["NTSC-U"], { PAL: "unknown" }), "PAL")).toBe("inconnu");
  });

  it("dit « inconnu » quand la région n'est mentionnée nulle part", () => {
    // L'absence d'information est « inconnu », JAMAIS « jamais sorti ».
    // Glisser de l'un à l'autre retirerait au joueur un jeu qu'il a possédé.
    expect(statutRegion(oeuvre(["NTSC-U"]), "PAL")).toBe("inconnu");
  });

  it("dit « mondiale » quand la machine ne connaît pas les régions", () => {
    // Sur Switch, la question ne se pose pas. Répondre « région inconnue »
    // inventerait une incertitude qui n'existe pas.
    expect(statutRegion(oeuvre(["WORLDWIDE"]), "PAL")).toBe("mondiale");
  });

  it("fait primer une sortie attestée sur un statut contradictoire", () => {
    // Une ligne incohérente en base ne doit pas retirer un jeu au joueur.
    // Le chargeur signale la contradiction ; l'écran, lui, penche du côté qui
    // ne fait rien disparaître.
    expect(statutRegion(oeuvre(["PAL"], { PAL: "notReleased" }), "PAL")).toBe("sorti");
  });
});

describe("libelleStatut — les quatre réponses sont dites, pas suggérées", () => {
  const attendus: [StatutRegion, RegExp][] = [
    ["sorti", /sorti en Europe/i],
    ["jamais-sorti", /jamais sorti en Europe/i],
    ["inconnu", /inconnue/i],
    ["mondiale", /mondiale/i],
  ];

  it.each(attendus)("%s a un libellé non vide", (statut, motif) => {
    const texte = libelleStatut(statut, "PAL");
    expect(texte).not.toBe("");
    expect(texte).toMatch(motif);
  });

  it("ne rend AUCUN des quatre états par une chaîne vide", () => {
    // Le cœur de l'item : si l'un des états se rendait par l'absence
    // d'indication, l'utilisateur ne pourrait pas le distinguer d'un défaut
    // d'affichage — et les trois autres perdraient leur sens par contraste.
    const tous: StatutRegion[] = ["sorti", "jamais-sorti", "inconnu", "mondiale"];

    for (const statut of tous) {
      expect(libelleStatut(statut, "PAL").trim().length).toBeGreaterThan(0);
    }
  });

  it("distingue « jamais sorti » de « inconnu » autrement que par la négation", () => {
    // « pas sorti » et « on ne sait pas » se ressemblent trop à la lecture
    // rapide d'une liste de 35 lignes.
    const jamais = libelleStatut("jamais-sorti", "PAL");
    const inconnu = libelleStatut("inconnu", "PAL");

    // « Ils diffèrent » est une assertion trop faible : un mot d'écart la
    // satisfait, et une mutation qui rendait « jamais sorti » par « Sortie
    // Europe inconnue » y passait. On exige donc la MARQUE de chaque état.
    expect(jamais).toMatch(/jamais/i);
    expect(inconnu).not.toMatch(/jamais/i);
    expect(inconnu).toMatch(/inconnue/i);
  });

  it("nomme la région dans la langue de l'utilisateur, pas son code", () => {
    // « PAL » ne dit rien à un joueur. « Europe » si.
    expect(libelleStatut("jamais-sorti", "PAL")).toContain("Europe");
    expect(libelleStatut("jamais-sorti", "NTSC-U")).toContain("Amérique du Nord");
    expect(libelleStatut("jamais-sorti", "NTSC-J")).toContain("Japon");
  });
});
