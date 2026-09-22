import { describe, expect, it } from "vitest";
import { accentEpoque, dispositionPour, EPOQUES, trameDuTitre } from "./epoque";

describe("accentEpoque — la couleur encode la décennie", () => {
  it.each([
    { annee: 1985, nom: "terre cuite", accent: "#A6572F" },
    { annee: 1990, nom: "ocre", accent: "#B0842B" },
    { annee: 1994, nom: "ocre", accent: "#B0842B" },
    { annee: 1995, nom: "olive", accent: "#6E7F4A" },
    { annee: 2000, nom: "bleu-vert", accent: "#3F7A80" },
    { annee: 2006, nom: "bleu", accent: "#4A6BA8" },
    { annee: 2013, nom: "violet", accent: "#6B5EA8" },
    { annee: 2022, nom: "violet", accent: "#6B5EA8" },
  ])("$annee → $nom", ({ annee, accent }) => {
    expect(accentEpoque(annee).accent).toBe(accent);
  });

  it("couvre les bornes sans trou ni chevauchement", () => {
    // Une année qui tomberait entre deux époques rendrait une tuile sans
    // couleur — donc grise, donc « manquante », exactement ce que le système
    // d'époques existe pour éviter.
    for (let annee = 1970; annee <= 2030; annee += 1) {
      expect(accentEpoque(annee).accent).toMatch(/^#[0-9A-F]{6}$/);
    }
  });

  it("ne peint PAS une date inconnue comme une décennie", () => {
    // Le repli rendait `EPOQUES[0]` : une œuvre non datée était donc peinte
    // en terre cuite et étiquetée « 8 bits ». Or le premier service du
    // système d'époques est « on sait où l'on est sans lire de date » — la
    // couleur *affirme* une décennie, et l'affirmer sur une donnée absente
    // est la même faute que la valeur par défaut de l'affect.
    //
    // Aucune œuvre du dataset actuel n'est sans date : le chemin est latent.
    // Il ne le restera pas — le référentiel est un chantier durable (§18.6),
    // et un titre sans date y est un cas normal.
    const sansDate = accentEpoque(null);

    expect(EPOQUES.map((e) => e.nom)).not.toContain(sansDate.nom);
    expect(EPOQUES.map((e) => e.accent)).not.toContain(sansDate.accent);
  });

  it("donne une couleur même sans année connue", () => {
    // 31 sorties du dataset ne sont datées qu'à l'année, et quelques-unes pas
    // du tout. Une tuile sans accent serait grise au milieu d'une grille
    // colorée : elle se lirait comme un défaut.
    expect(accentEpoque(null).accent).toMatch(/^#[0-9A-F]{6}$/);
  });

  it("expose six époques et pas une de plus", () => {
    // Le neutre n'en est pas une septième : il ne se range pas sur le
    // gradient de température, il dit qu'on ne sait pas.
    expect(EPOQUES).toHaveLength(6);
  });

  it("garde le neutre chaud, jamais gris", () => {
    // La raison d'être du repli tient toujours : une tuile grise au milieu
    // d'une grille colorée se lirait comme un défaut d'affichage. La base du
    // langage visuel est « chaude, pas grise » — on y prend son filet.
    expect(accentEpoque(null).accent).toBe("#E5E0D8");
  });
});

describe("trameDuTitre — deux jeux voisins ne sont pas identiques", () => {
  it("dérive la trame du titre, de façon stable", () => {
    // Stable : la grille ne doit pas changer d'aspect d'une visite à l'autre.
    // L'utilisateur ne distinguerait pas cela d'une perte de données.
    expect(trameDuTitre("Super Mario World")).toBe(trameDuTitre("Super Mario World"));
  });

  it("donne des trames différentes à des titres différents", () => {
    const trames = new Set(
      ["Super Mario World", "Chrono Trigger", "Secret of Mana", "Donkey Kong Country"]
        .map(trameDuTitre),
    );

    expect(trames.size).toBeGreaterThan(1);
  });
});

describe("dispositionPour — deux stratégies de lecture, pas une étirée", () => {
  it.each([
    { largeur: 375, attendue: "liste" },
    { largeur: 599, attendue: "liste" },
    { largeur: 600, attendue: "liste" },
    { largeur: 1023, attendue: "liste" },
    { largeur: 1024, attendue: "grille" },
    { largeur: 1440, attendue: "grille" },
  ])("$largeur px → $attendue", ({ largeur, attendue }) => {
    expect(dispositionPour(largeur)).toBe(attendue);
  });

  it("ne bascule qu'une fois, à 1024", () => {
    // « Mobile et desktop ne sont pas la même disposition étirée : ce sont
    // deux stratégies de lecture. » Un troisième mode intermédiaire en
    // inventerait une troisième, que le langage visuel refuse.
    const bascules = [];
    for (let l = 320; l <= 1600; l += 1) {
      if (dispositionPour(l) !== dispositionPour(l - 1)) bascules.push(l);
    }

    expect(bascules).toEqual([1024]);
  });
});
