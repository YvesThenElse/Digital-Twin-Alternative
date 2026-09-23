import { describe, expect, it } from "vitest";
import { decenniesVides, intercaler } from "./trous";
import type { EntreeTimeline, MomentTimeline } from "./types";

/**
 * « **Les trous sont des invitations.** Une décennie vide n'est pas un défaut
 * d'affichage : c'est l'endroit exact où proposer E02. C'est le mécanisme de
 * relance le plus naturel du produit, et il ne coûte aucune notification. »
 * (E03, décisions de conception)
 */
const moment = (id: string): MomentTimeline => ({
  id,
  type: "StartedGame",
  targetKind: "work",
  targetId: `wrk_${id}`,
  targetLabel: `Titre ${id}`,
  occurredAt: { kind: "Year", year: 1995 },
  platformId: "plt_snes",
  memory: null,
});

const entree = (debut: string, fin: string, id = debut): EntreeTimeline => ({
  isEpisode: false,
  interval: { start: debut, end: fin },
  moments: [moment(id)],
});

describe("decenniesVides — où proposer de compléter", () => {
  it("n'en trouve aucune sur un axe vide", () => {
    // Un profil sans moment n'a pas de trou : il n'a pas encore d'histoire.
    // L'axe a déjà son invitation à lui, et deux invitations superposées
    // n'en font pas une plus claire.
    expect(decenniesVides([], 2026)).toEqual([]);
  });

  it("ne compte pas une décennie que des moments couvrent", () => {
    const trous = decenniesVides(
      [entree("1995-01-01", "1995-12-31"), entree("2003-01-01", "2003-12-31")],
      2009,
    );

    expect(trous).toEqual([]);
  });

  it("trouve la décennie creuse entre deux décennies pleines", () => {
    const trous = decenniesVides(
      [entree("1995-01-01", "1995-12-31"), entree("2012-01-01", "2012-12-31")],
      2019,
    );

    expect(trous).toEqual([{ debut: 2000, fin: 2009 }]);
  });

  it("compte les décennies APRÈS la dernière déclaration, jusqu'à aujourd'hui", () => {
    // C'est le cas le plus fréquent d'une première session : on saisit sa
    // console d'enfance et rien d'autre. Ces années-là sont exactement ce
    // que le produit demande ensuite.
    const trous = decenniesVides([entree("1995-01-01", "1995-12-31")], 2026);

    expect(trous).toEqual([
      { debut: 2000, fin: 2009 },
      { debut: 2010, fin: 2019 },
      { debut: 2020, fin: 2026 },
    ]);
  });

  it("n'invente rien AVANT la première déclaration", () => {
    // Ce n'est pas un trou, c'est la préhistoire. Proposer de compléter
    // 1972–1989 à quelqu'un qui a commencé en 1995 lui demanderait des
    // années qu'il n'a pas vécues comme joueur.
    const trous = decenniesVides([entree("1995-01-01", "1995-12-31")], 1999);

    expect(trous).toEqual([]);
  });

  it("arrête la décennie courante à l'année courante", () => {
    // « 2020–2029 » proposerait de déclarer des années à venir. La borne
    // haute est aujourd'hui : un souvenir ne se situe pas dans l'avenir.
    const trous = decenniesVides([entree("2005-01-01", "2005-12-31")], 2023);

    expect(trous).toEqual([
      { debut: 2010, fin: 2019 },
      { debut: 2020, fin: 2023 },
    ]);
  });

  it("tient une bande qui chevauche deux décennies", () => {
    // Une période 1998–2003 remplit les deux : l'axe ne dit pas dans laquelle
    // le moment est tombé, et en réclamer une serait affirmer ce que le
    // joueur n'a pas dit (§7.5).
    const trous = decenniesVides([entree("1998-01-01", "2003-12-31")], 2009);

    expect(trous).toEqual([]);
  });
});

describe("intercaler — les trous se posent entre les entrées", () => {
  const a = entree("1995-01-01", "1995-12-31", "a");
  const b = entree("2012-01-01", "2012-12-31", "b");

  it("place un trou avant la première entrée qui lui succède", () => {
    const rendu = intercaler([a, b], [{ debut: 2000, fin: 2009 }]);

    expect(rendu.map((e) => (e.kind === "entree" ? e.entree.moments[0].id : e.trou.debut)))
      .toEqual(["a", 2000, "b"]);
  });

  it("met à la fin les trous qui suivent tout", () => {
    const rendu = intercaler([a], [{ debut: 2000, fin: 2009 }, { debut: 2010, fin: 2019 }]);

    expect(rendu.map((e) => (e.kind === "entree" ? e.entree.moments[0].id : e.trou.debut)))
      .toEqual(["a", 2000, 2010]);
  });

  it("ne touche JAMAIS à l'ordre des entrées", () => {
    // L'ordre vient du domaine, et 387 tests le valident. Le retrier ici,
    // même « pour insérer proprement », le ferait diverger sans que rien ne
    // le signale — et l'axe bougerait d'une visite à l'autre.
    const rendu = intercaler([b, a], [{ debut: 2000, fin: 2009 }]);

    const entrees = rendu
      .filter((e) => e.kind === "entree")
      .map((e) => (e.kind === "entree" ? e.entree.moments[0].id : null));
    expect(entrees).toEqual(["b", "a"]);
  });
});
