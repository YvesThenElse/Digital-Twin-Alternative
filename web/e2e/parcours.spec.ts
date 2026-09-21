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

/**
 * Le jeu absent du référentiel — un cas NOMINAL sur 221 titres (§3.5), pas
 * un cas limite. Le parcours le traverse pour la même raison qu'il coche
 * trente lignes : un utilisateur bloqué au premier titre manquant invalide
 * le test utilisateur bien avant d'invalider le produit.
 */
const TITRE_ABSENT = "Le jeu de mon cousin, jamais retrouvé le nom";

/** Trente titres cochés, plus celui qui manquait. */
const MOMENTS_ATTENDUS = TITRES_A_COCHER + 1;

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

  // --- 4. le jeu qui manque ----------------------------------------------
  await toucher(
    page.getByRole("textbox", { name: "Titre absent de la liste" }).fill(TITRE_ABSENT),
  );
  await toucher(page.getByRole("button", { name: "Ajouter ce titre" }).click());

  // Compté dans la récompense, comme les autres : un geste qui ne ferait
  // rien bouger dirait à l'utilisateur qu'il n'a rien produit.
  await expect(bande).toHaveAttribute("data-total", String(MOMENTS_ATTENDUS));
  // Et marqué : une saisie libre n'est pas une entrée du référentiel.
  await expect(page.getByTestId("titre-libre")).toHaveAttribute("data-canonique", "false");

  // --- 5. un souvenir ----------------------------------------------------
  const souvenir = page.getByRole("textbox", { name: /^Un souvenir sur/ }).first();
  await toucher(souvenir.fill("On l'a fini à deux avec mon frère, l'été 1995."));
  await toucher(page.getByRole("heading", { level: 1 }).click()); // perte de focus

  // --- 6. la timeline ----------------------------------------------------
  await toucher(page.getByRole("button", { name: "Voir ma timeline" }).click());

  // Les trente titres ont été cochés d'un seul passage, sur une même
  // période : ils forment UN épisode (§4.4), pas trente moments empilés.
  // L'axe le montre replié — c'est précisément ce que l'agrégation sert.
  const axe = page.getByTestId("axe");
  await expect(axe).toHaveAttribute("data-entrees", "1");
  const entree = axe.locator("> li");
  await expect(entree).toHaveAttribute("data-moments", String(MOMENTS_ATTENDUS));

  // Déplié, le joueur retrouve ses titres. Le NOMBRE EXACT, et non « il y a
  // des moments » : un compte plus faible dirait que des déclarations se
  // sont perdues, un compte plus fort qu'on lit le profil de quelqu'un
  // d'autre.
  await toucher(page.getByRole("button", { name: /Déplier/ }).click());
  await expect(page.getByTestId("moment-titre")).toHaveCount(MOMENTS_ATTENDUS);

  // Le titre saisi est là, AVEC SON TITRE — et dans le même épisode que les
  // autres. C'est l'acceptation de §3.5 : la déclaration non résolue est
  // « visible dans son profil comme les autres ». Une timeline qui le
  // montrerait sous son identifiant, ou pas du tout, laisserait le joueur
  // croire que sa saisie n'a servi à rien.
  await expect(page.getByTestId("moment-titre").filter({ hasText: TITRE_ABSENT }))
    .toHaveCount(1);

  // --- le KPI de §22.3 ---------------------------------------------------
  //
  // Un geste par titre, plus l'amorce (machine, période), la note, le
  // passage à la timeline et le dépliage. Le titre absent en coûte DEUX —
  // saisir puis valider —, et c'est le prix à surveiller : sur 221 titres le
  // cas se répète, et un troisième geste par titre manquant sortirait du
  // budget « un tap par jeu ». Dépasser signifierait qu'un geste s'est
  // glissé quelque part, et c'est exactement ce que le test doit voir.
  const budget = TITRES_A_COCHER + 8;
  expect(gestes, `${gestes} gestes pour ${MOMENTS_ATTENDUS} titres`).toBeLessThanOrEqual(budget);

  await infos.attach("gestes", { body: String(gestes), contentType: "text/plain" });
});
