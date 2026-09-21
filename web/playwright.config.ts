import { defineConfig, devices } from "@playwright/test";

/**
 * Le parcours de bout en bout — **un seul test**.
 *
 * TODO-PHASE1 le dit : un test instable finit affaibli plutôt que réparé. Un
 * seul, sur le parcours du critère de sortie, qui doit rester vert.
 *
 * Deux projets, parce que §21.2 exige deux dispositions et non une étirée :
 * le même parcours doit tenir sur la liste dense et sur la grille.
 */
export default defineConfig({
  testDir: "./e2e",
  // Pas de reprise : une reprise masquerait justement l'instabilité qu'on
  // veut voir.
  retries: 0,
  timeout: 60_000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "mobile",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
});
