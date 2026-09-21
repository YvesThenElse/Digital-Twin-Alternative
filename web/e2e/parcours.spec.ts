import { expect, test } from "@playwright/test";

/**
 * Le parcours du critère de sortie de la Phase 1 :
 *
 * > Est-ce qu'un utilisateur reconstruit rapidement une partie significative
 * > de son histoire vidéoludique, et trouve le résultat intéressant ?
 *
 * Un seul test, joué sur les deux dispositions. Il compte les **gestes** —
 * le KPI de §22.3 : ce qui décide si quelqu'un ira au bout n'est pas la
 * justesse du modèle mais le nombre de fois qu'il doit toucher l'écran.
 */

/** Ce que le budget « un tap par jeu » autorise, plus l'amorce et la note. */
const TITRES_A_COCHER = 30;

test("reconstruire trente titres et voir la timeline se remplir", async ({ page }, infos) => {
  let gestes = 0;
  const toucher = async (action: Promise<unknown>) => {
    gestes += 1;
    await action;
  };

  // Un profil VIERGE, propre à cette exécution et à ce navigateur. Sans
  // cela, la timeline comptait les moments des exécutions précédentes : le
  // parcours passait même lorsque plus aucune déclaration n'était envoyée —
  // une mutation l'a montré.
  const profil = `usr_e2e_${infos.project.name}_${Date.now()}`;
  await page.goto(`/?profil=${profil}`);

  // --- 1. la machine -----------------------------------------------------
  await expect(page.getByRole("heading", { name: /console/i })).toBeVisible();
  await toucher(
    page.getByRole("button", { name: "Super Nintendo Entertainment System" }).click(),
  );

  // --- 2. la période -----------------------------------------------------
  await expect(page.getByRole("heading", { name: /quand/i })).toBeVisible();
  await toucher(page.getByRole("button", { name: "Plutôt une période" }).click());

  // --- 3. cocher ---------------------------------------------------------
  const lignes = page.getByRole("button", { name: /^Déclarer : / });
  await expect(lignes.first()).toBeVisible();

  // Deux STRATÉGIES de lecture, pas une disposition étirée (§21.2). Passer
  // sur les deux écrans ne prouve rien si les deux rendent la même chose :
  // une mutation forçant la liste partout laissait ce parcours vert.
  const attendue = infos.project.name === "desktop" ? "grille" : "liste";
  await expect(page.getByRole("list").last()).toHaveAttribute("data-disposition", attendue);

  if (attendue === "grille") {
    // Les jaquettes doivent CHARGER, pas seulement être annoncées. Un
    // navigateur n'échoue pas sur une image cassée : sans cette vérification,
    // la grille pouvait afficher 218 cadres vides et le parcours rester vert.
    //
    // `naturalWidth` vaut 0 tant qu'une image n'a pas été décodée — c'est le
    // seul signal qu'un `<img>` donne d'un échec.
    const images = page.locator('[data-tuile="jaquette"] img');
    const combien = await images.count();
    expect(combien, "aucune jaquette dans la grille : le test ne prouverait rien")
      .toBeGreaterThan(0);

    for (let i = 0; i < combien; i += 1) {
      await expect(images.nth(i)).toHaveJSProperty("complete", true);
      const largeur = await images.nth(i).evaluate(
        (img) => (img as HTMLImageElement).naturalWidth,
      );
      const source = await images.nth(i).getAttribute("src");
      expect(largeur, `image non chargée : ${source}`).toBeGreaterThan(0);
    }
  }

  for (let i = 0; i < TITRES_A_COCHER; i += 1) {
    // Toujours la PREMIÈRE ligne encore non déclarée : c'est le geste réel —
    // on descend la liste sans chercher.
    await toucher(lignes.first().click());
  }

  // La récompense est arrivée PENDANT la saisie, pas à la fin (§24.4).
  const bande = page.getByTestId("bande-epoque");
  await expect(bande).toHaveAttribute("data-total", String(TITRES_A_COCHER));

  // --- 4. un souvenir ----------------------------------------------------
  const souvenir = page.getByRole("textbox").first();
  await toucher(souvenir.fill("On l'a fini à deux avec mon frère, l'été 1995."));
  await toucher(page.getByRole("heading", { level: 1 }).click()); // perte de focus

  // --- 5. la timeline ----------------------------------------------------
  await toucher(page.getByRole("button", { name: "Voir ma timeline" }).click());

  // Le NOMBRE EXACT, et non « il y a des moments ». Trente titres cochés
  // produisent trente `StartedGame` : un compte plus faible dirait que des
  // déclarations se sont perdues en chemin, un compte plus fort qu'on lit le
  // profil de quelqu'un d'autre.
  await expect(page.getByTestId("timeline-compte"))
    .toContainText(`${TITRES_A_COCHER} moment`);

  // --- le KPI de §22.3 ---------------------------------------------------
  //
  // Un geste par titre, plus l'amorce (machine, période), la note et le
  // passage à la timeline. Dépasser ce budget signifierait qu'un geste s'est
  // glissé quelque part — et c'est exactement ce que le test doit voir.
  const budget = TITRES_A_COCHER + 5;
  expect(gestes, `${gestes} gestes pour ${TITRES_A_COCHER} titres`).toBeLessThanOrEqual(budget);

  await infos.attach("gestes", { body: String(gestes), contentType: "text/plain" });
});
