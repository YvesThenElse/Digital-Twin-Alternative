import { describe, expect, it } from "vitest";
import { forme, libelle, surLAxe, type ValeurTemporelle } from "./valeur";

const cas: { nom: string; valeur: ValeurTemporelle; libelle: string; forme: string }[] = [
  {
    nom: "date exacte",
    valeur: { kind: "ExactDate", date: "1994-03-15" },
    libelle: "15 mars 1994",
    forme: "point-plein",
  },
  {
    nom: "mois",
    valeur: { kind: "Month", year: 1994, month: 3 },
    libelle: "mars 1994",
    forme: "point",
  },
  {
    nom: "année",
    valeur: { kind: "Year", year: 1994 },
    libelle: "1994",
    forme: "point-creux",
  },
  {
    nom: "période",
    valeur: { kind: "YearRange", year: 1993, endYear: 1997 },
    libelle: "1993–1997",
    forme: "bande",
  },
  {
    nom: "année approchée",
    valeur: { kind: "ApproximateYear", year: 1994, margin: 2 },
    libelle: "vers 1994",
    forme: "point-creux-halo",
  },
  {
    nom: "âge",
    valeur: { kind: "Age", age: 12 },
    libelle: "vers mes 12 ans",
    forme: "italique",
  },
  {
    nom: "inconnu",
    valeur: { kind: "Unknown" },
    libelle: "à une date inconnue",
    forme: "hors-axe",
  },
];

describe("le rendu normalisé des sept granularités", () => {
  it.each(cas)("$nom → « $libelle »", ({ valeur, libelle: attendu }) => {
    expect(libelle(valeur)).toBe(attendu);
  });

  it.each(cas)("$nom → forme « $forme »", ({ valeur, forme: attendue }) => {
    expect(forme(valeur)).toBe(attendue);
  });
});

describe("les trois interdits", () => {
  it("n'affiche jamais un souvenir vague comme une date précise", () => {
    // L'interdit le plus coûteux à violer : une année rendue « 1er janvier
    // 1994 » affirmerait un jour que personne n'a déclaré, et le joueur
    // corrigerait une date qu'il n'a jamais donnée.
    expect(libelle({ kind: "Year", year: 1994 })).toBe("1994");
    expect(libelle({ kind: "Year", year: 1994 })).not.toMatch(/janvier|1er|01/);

    // Pour « vers 1994 », l'interdit ne porte pas sur le mois — il porte sur
    // la PERTE du « vers ». Rendre « 1994 » serait exactement afficher un
    // souvenir vague comme une date, et une assertion qui n'interdit que les
    // noms de mois laisse passer la faute. Une mutation l'a montré.
    const approche = libelle({ kind: "ApproximateYear", year: 1994, margin: 2 });
    expect(approche).toMatch(/^vers /);
    expect(approche).not.toBe("1994");

    // Une période reste une période : « 1993 » seul perdrait la durée.
    const periode = libelle({ kind: "YearRange", year: 1993, endYear: 1997 });
    expect(periode).toContain("1997");
    expect(periode).not.toMatch(/janvier/);
  });

  it("ne projette jamais « je ne sais plus » sur l'axe", () => {
    expect(surLAxe({ kind: "Unknown" })).toBe(false);
    expect(surLAxe({ kind: "Year", year: 1994 })).toBe(true);
  });

  it("garde un âge non résolu hors de l'axe, mais pas hors de l'écran", () => {
    // Sans année de naissance, l'âge n'a pas de place sur l'axe. Il reste
    // néanmoins déclaré : le faire disparaître effacerait un souvenir.
    expect(surLAxe({ kind: "Age", age: 12 })).toBe(false);
    expect(libelle({ kind: "Age", age: 12 })).toBe("vers mes 12 ans");
  });

  it("place un âge résolu sur l'axe sans changer son libellé", () => {
    // L'horizon RÉSOUT l'âge pour le situer ; il ne le remplace pas. Afficher
    // « 1994 » dirait une précision jamais déclarée — et l'année changerait
    // si l'année de naissance était corrigée.
    const resolu: ValeurTemporelle = { kind: "Age", age: 12, resolu: true };

    expect(surLAxe(resolu)).toBe(true);
    expect(libelle(resolu)).toBe("vers mes 12 ans");
  });
});

describe("une période ouverte", () => {
  it("se lit « depuis » et non comme une année seule", () => {
    // « depuis 1994 » n'est pas « 1994 » : la refermer inventerait une fin.
    expect(libelle({ kind: "YearRange", year: 1994, endYear: null })).toBe("depuis 1994");
    expect(forme({ kind: "YearRange", year: 1994, endYear: null })).toBe("bande");
  });
});
