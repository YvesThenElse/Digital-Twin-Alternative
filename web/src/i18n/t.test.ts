import { describe, expect, it } from "vitest";
import { MESSAGES } from "./messages";
import { t } from "./t";

describe("t — le catalogue rendu", () => {
  it("rend un libellé sans paramètre", () => {
    expect(t("tiroir.intitule")).toBe("À une date inconnue");
  });

  it("substitue les paramètres", () => {
    expect(t("region.jamaisSorti", { region: "Europe" })).toBe("Jamais sorti en Europe");
  });

  it("laisse le gabarit visible quand un paramètre manque", () => {
    // « Jamais sorti en undefined » ne dit pas ce qui manque ; « {region} »
    // si. Le défaut doit se diagnostiquer à l'œil.
    expect(t("region.jamaisSorti", {})).toContain("{region}");
  });

  it("refuse une clé inconnue au lieu de l'afficher", () => {
    // Afficher « region.sorti » dans l'interface serait un défaut visible
    // mais muet : on ne saurait pas s'il manque une traduction ou si le code
    // s'est trompé de clé.
    expect(() => t("inexistante" as never)).toThrow(/inexistante/);
  });

  it("n'a aucun libellé vide", () => {
    // Un libellé vide se rend par l'absence d'indication — la faute que
    // l'item 11 a passé une itération entière à interdire.
    for (const [cle, valeur] of Object.entries(MESSAGES)) {
      expect(valeur.trim().length, `« ${cle} » est vide`).toBeGreaterThan(0);
    }
  });
});
