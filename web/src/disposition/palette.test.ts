import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { EPOQUES, SANS_EPOQUE } from "./epoque";

/**
 * Le test MIROIR de la palette.
 *
 * Le parti pris central du produit — la couleur encode les décennies — vit
 * désormais à deux endroits : `epoque.ts`, qui le calcule, et `socle.css`,
 * qui le peint. Deux copies d'une même vérité finissent toujours par
 * diverger, et celle-ci divergerait en silence : un accent faux reste un
 * accent, et rien ne le distingue du bon.
 *
 * Ce test ne vérifie pas que la palette est belle — il vérifie que les deux
 * listes disent la même chose, et qu'aucune époque n'est peinte nulle part.
 */

const SOCLE = readFileSync(
  join(process.cwd(), "src", "styles", "socle.css"),
  "utf8",
);

/** « 32/64 bits » → « 32-64-bits ». La règle qui relie les deux fichiers. */
function jeton(nom: string): string {
  return `--epoque-${nom.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function valeurDe(nomDeJeton: string): string | null {
  const trouve = SOCLE.match(
    new RegExp(`${nomDeJeton}\\s*:\\s*(#[0-9a-fA-F]{6})\\s*;`),
  );
  return trouve === null ? null : trouve[1].toUpperCase();
}

describe("la palette d'époques dit la même chose des deux côtés", () => {
  it.each(EPOQUES)("$nom porte le même accent dans le socle", (epoque) => {
    expect(valeurDe(jeton(epoque.nom))).toBe(epoque.accent.toUpperCase());
  });

  it.each(EPOQUES)("$nom est réellement appliquée par un sélecteur", (epoque) => {
    // Déclarer le jeton ne suffit pas : encore faut-il qu'un élément portant
    // `data-epoque` le reçoive. C'est l'apprentissage 44 — nommer n'est pas
    // rendre — appliqué à la feuille de style elle-même.
    expect(SOCLE).toContain(`[data-epoque="${epoque.nom}"]`);
    expect(SOCLE).toMatch(
      new RegExp(
        `\\[data-epoque="${epoque.nom.replace("/", "\\/")}"\\]\\s*\\{\\s*--accent:\\s*var\\(${jeton(epoque.nom)}\\)`,
      ),
    );
  });

  it("peint aussi ce qu'on ne sait pas, et d'une couleur qui n'est aucune des six", () => {
    expect(valeurDe("--epoque-sans-date")).toBe(SANS_EPOQUE.accent.toUpperCase());
    expect(EPOQUES.map((e) => e.accent.toUpperCase()))
      .not.toContain(SANS_EPOQUE.accent.toUpperCase());
  });

  it("ne déclare pas une SEPTIÈME époque dans le socle", () => {
    // Une couleur d'époque ajoutée au CSS sans l'être au modèle serait
    // invisible : aucun composant ne la demanderait, et elle donnerait
    // l'impression d'un système à sept degrés là où il y en a six.
    const declarees = [...SOCLE.matchAll(/--epoque-([a-z0-9-]+)\s*:/g)]
      .map((m) => m[1])
      .filter((nom) => nom !== "sans-date");

    expect(declarees.sort()).toEqual(
      EPOQUES.map((e) => jeton(e.nom).replace("--epoque-", "")).sort(),
    );
  });
});
