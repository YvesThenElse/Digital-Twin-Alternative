import { describe, expect, it } from "vitest";
import { construireBande } from "./bande";
import type { Oeuvre } from "./types";

const oeuvre = (id: string, annee: number | null): Oeuvre => ({
  id,
  titre: `Jeu ${id}`,
  rang: 1,
  annee,
  regions: [],
  statutRegional: {},
});

describe("construireBande", () => {
  it("ne montre rien tant que rien n'est déclaré", () => {
    // État vide : pas une bande plate à zéro, PAS DE BANDE. Une bande plate
    // affirmerait une histoire vide ; l'absence dit qu'elle n'a pas commencé.
    const bande = construireBande([oeuvre("a", 1993)], new Set());

    expect(bande.tranches).toHaveLength(0);
    expect(bande.periode).toBeNull();
  });

  it("couvre la période des jeux déclarés, bornes comprises", () => {
    const oeuvres = [oeuvre("a", 1993), oeuvre("b", 1995), oeuvre("c", 1997)];

    const bande = construireBande(oeuvres, new Set(["a", "b", "c"]));

    expect(bande.periode).toEqual({ debut: 1993, fin: 1997 });
    expect(bande.tranches.map((t) => t.annee)).toEqual([
      1993, 1994, 1995, 1996, 1997,
    ]);
  });

  it("est une répartition, pas un compteur", () => {
    // Le point de §24.4 : « ce n'est pas un compteur qui s'incrémente, c'est
    // une histoire qui pousse ». Trois jeux de 1995 et un de 1993 ne font pas
    // quatre barres égales.
    const oeuvres = [
      oeuvre("a", 1993),
      oeuvre("b", 1995),
      oeuvre("c", 1995),
      oeuvre("d", 1995),
    ];

    const bande = construireBande(oeuvres, new Set(["a", "b", "c", "d"]));

    const par = Object.fromEntries(bande.tranches.map((t) => [t.annee, t.compte]));
    expect(par[1993]).toBe(1);
    expect(par[1994]).toBe(0);
    expect(par[1995]).toBe(3);
  });

  it("grandit quand une déclaration s'ajoute", () => {
    const oeuvres = [oeuvre("a", 1993), oeuvre("b", 1999)];

    const avant = construireBande(oeuvres, new Set(["a"]));
    const apres = construireBande(oeuvres, new Set(["a", "b"]));

    expect(avant.tranches).toHaveLength(1);
    expect(apres.tranches).toHaveLength(7);
    expect(apres.total).toBe(2);
  });

  it("place les jeux sans année dans un compte à part, jamais à une date", () => {
    // Les mêler les daterait, ce qui est exactement ce que le tiroir de la
    // timeline existe pour éviter. Les ignorer les ferait disparaître du
    // décompte alors que le joueur les a bien déclarés.
    const oeuvres = [oeuvre("a", 1993), oeuvre("b", null)];

    const bande = construireBande(oeuvres, new Set(["a", "b"]));

    expect(bande.total).toBe(2);
    expect(bande.sansDate).toBe(1);
    expect(bande.tranches.reduce((s, t) => s + t.compte, 0)).toBe(1);
  });

  it("ne montre que des années, jamais une échelle vide", () => {
    // Un seul jeu déclaré : une tranche, pas une décennie plate autour.
    const bande = construireBande([oeuvre("a", 1995)], new Set(["a"]));

    expect(bande.tranches).toEqual([{ annee: 1995, compte: 1 }]);
    expect(bande.periode).toEqual({ debut: 1995, fin: 1995 });
  });

  it("ignore une déclaration qui ne correspond à aucune œuvre connue", () => {
    // Robustesse : un identifiant orphelin ne doit ni planter ni gonfler le
    // total, sinon la bande affirmerait une histoire que personne n'a saisie.
    const bande = construireBande([oeuvre("a", 1995)], new Set(["a", "fantome"]));

    expect(bande.total).toBe(1);
  });
});
