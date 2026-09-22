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

/** Ce qu'on écrit sur le titre saisi — le contenu que §9 rend irremplaçable. */
const SOUVENIR_LIBRE = "Jamais retrouvé le nom, mais le dragon était bleu.";

/**
 * La période saisie, et ce qu'elle doit donner à lire.
 *
 * Le tiret est un TIRET DEMI-CADRATIN, celui que rend `libelle` : écrire un
 * trait d'union ici ferait passer l'assertion pour une faute de rendu.
 */
// Volontairement DIFFÉRENTES des constantes que le bouchon envoyait
// (1993-1997) : avec celles-ci, une régression vers la valeur figée aurait
// satisfait l'assertion, et le test aurait gardé un défaut qu'il prétend
// surveiller.
const DEBUT = 1990;
const FIN = 1994;
const PERIODE_LUE = `${DEBUT}\u2013${FIN}`;

/**
 * Ce que la BANDE compte : des titres déclarés. Trente cochés, plus celui
 * qui manquait. Affiner une ligne n'en ajoute pas un — c'est le même jeu.
 */
const TITRES_DECLARES = TITRES_A_COCHER + 1;

/**
 * Ce que l'AXE compte : des moments.
 *
 * Trente titres cochés, plus celui qui manquait — et **deux de plus** pour
 * la passe 2 : « fini » produit un `CompletedGame`, « je l'avais » un
 * `AcquiredItem`. Ce ne sont pas des doublons d'affichage mais des
 * événements distincts du journal, et les compter à part est ce qui prouve
 * que la passe 2 a bien été enregistrée.
 */
const MOMENTS_ATTENDUS = TITRES_A_COCHER + 1 + 2;

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

  // --- 0. le socle visuel est SERVI --------------------------------------
  //
  // Le produit n'avait aucune feuille de style, et rien ne le signalait :
  // la suite était verte parce qu'elle assérait des attributs `data-*`,
  // c'est-à-dire des intentions déclarées. Un test de composant ne peut pas
  // voir cela — il rend dans un document sans CSS. Seul le navigateur le
  // peut, et c'est donc ici que la garde a sa place.
  //
  // On vérifie la base CHAUDE de §2, pas une couleur quelconque : « un
  // blanc cassé légèrement papier », qui est précisément ce qui distingue
  // une archive d'un outil — et ce que le défaut par défaut du navigateur,
  // blanc pur, ne donne jamais.
  const fond = await page.evaluate(
    () => getComputedStyle(document.body).backgroundColor,
  );
  expect(fond, "le socle visuel n'est pas servi").toBe("rgb(250, 248, 245)");

  // Et la règle des 44 px, déclarée une fois dans le socle : la densité
  // vient du nombre d'éléments visibles, jamais de la compression des
  // cibles (§6).
  const hauteurBouton = await page
    .getByRole("button", { name: /^Super Nintendo Entertainment System/ })
    .evaluate((n) => n.getBoundingClientRect().height);
  expect(hauteurBouton, "une cible sous 44 px").toBeGreaterThanOrEqual(44);

  // --- 1. la machine -----------------------------------------------------
  await expect(page.getByRole("heading", { name: /console/i })).toBeVisible();
  await toucher(
    page.getByRole("button", { name: /^Super Nintendo Entertainment System/ }).click(),
  );

  // --- 2. la période -----------------------------------------------------
  //
  // Elle est CHOISIE, bornes comprises. L'écran a longtemps envoyé 1995 quoi
  // qu'on fasse : tous les jeux d'un profil portaient la même année, que
  // personne n'avait donnée. Le parcours saisit donc les deux bornes à la
  // main — le pire cas en gestes — et vérifie plus bas que ce sont bien
  // celles-là qui arrivent sur l'axe.
  await expect(page.getByRole("heading", { name: /quand/i })).toBeVisible();
  // Une carte de décennie, puis l'affinage FACULTATIF. Deux gestes là où le
  // champ numérique en coûtait quatre — et la granularité reste honnête :
  // ce qui part est un intervalle, jamais une année inventée.
  await toucher(page.getByRole("button", { name: /Années 90/ }).click());
  await toucher(page.getByRole("button", { name: `${DEBUT} – ${FIN}` }).click());

  // Le contexte de saisie (E02 repère A) annonce ce qui sera attaché.
  await expect(page.getByTestId("contexte")).toContainText(PERIODE_LUE);

  // --- 3. cocher ---------------------------------------------------------
  const lignes = page.getByRole("button", { name: /^Déclarer : / });
  await expect(lignes.first()).toBeVisible();

  // Deux STRATÉGIES de lecture, pas une disposition étirée (§21.2). Passer
  // sur les deux écrans ne prouve rien si les deux rendent la même chose :
  // une mutation forçant la liste partout laissait ce parcours vert.
  const attendue = infos.project.name === "desktop" ? "grille" : "liste";
  const liste = page.getByRole("list").last();
  await expect(liste).toHaveAttribute("data-disposition", attendue);

  // **L'attribut ne suffit pas.** Il a longtemps été toute la vérification,
  // et les deux dispositions rendaient exactement la même chose : le test
  // assérait une intention déclarée. On regarde donc ce que le navigateur
  // a vraiment calculé.
  const rendu = await liste.evaluate((n) => {
    const s = getComputedStyle(n);
    return { affichage: s.display, colonnes: s.gridTemplateColumns.split(" ").length };
  });
  if (attendue === "grille") {
    expect(rendu.affichage, "la grille ne se rend pas en grille").toBe("grid");
    expect(rendu.colonnes, "la grille n'a qu'une colonne").toBeGreaterThan(3);
  } else {
    expect(rendu.affichage, "la liste se rend en grille").toBe("flex");
  }

  // Et la règle des 56 px de la ligne mobile — la densité vient du nombre
  // d'éléments, jamais de la compression des cibles (§6).
  if (attendue === "liste") {
    const hauteur = await lignes.first().evaluate((n) => n.getBoundingClientRect().height);
    expect(hauteur, "la ligne de liste est sous 56 px").toBeGreaterThanOrEqual(56);
  }

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

  // **Et elle se VOIT.** « Ce n'est pas un compteur qui s'incrémente, c'est
  // une histoire qui pousse » — or ses barres portaient une hauteur en
  // pourcentage dans un conteneur qui n'en avait pas : la bande la plus
  // importante du produit était invisible, et trois attributs `data-*`
  // disaient le contraire.
  const barres = await bande.locator(".bande-tranche").evaluateAll((noeuds) =>
    noeuds.map((n) => n.getBoundingClientRect().height),
  );
  expect(barres.length, "la bande n'a aucune tranche").toBeGreaterThan(0);
  expect(Math.max(...barres), "la bande n'a pas de hauteur visible")
    .toBeGreaterThan(8);

  // --- 3 bis. se tromper, et se corriger ---------------------------------
  //
  // « Se tromper de ligne est le geste le plus fréquent de cet écran », et
  // il ne quittait pas le navigateur : on décochait, on rechargeait, la
  // ligne revenait. C'est le seul défaut de l'audit qui faisait perdre du
  // travail à un testeur.
  const aRetirer = page.getByRole("button", { name: /^Déclarer : / }).first();
  // Le nom ACCESSIBLE, pas le contenu : celui-ci concatène le titre, la
  // date et le statut régional.
  const titreRetire = (await aRetirer.getAttribute("aria-label"))!
    .replace("Déclarer : ", "");
  await toucher(aRetirer.click());
  await expect(bande).toHaveAttribute("data-total", String(TITRES_A_COCHER + 1));
  await toucher(
    page.getByRole("button", { name: `Déclaré : ${titreRetire}` }).click(),
  );
  await expect(bande).toHaveAttribute("data-total", String(TITRES_A_COCHER));

  // --- 3 bis. la passe 2, sur une ligne déclarée --------------------------
  //
  // Facultative par construction : les vingt-neuf autres lignes n'y touchent
  // pas et restent des déclarations valables.
  await toucher(page.getByRole("button", { name: "Fini" }).first().click());
  await toucher(page.getByRole("button", { name: "Je l'avais" }).first().click());

  // --- 4. le jeu qui manque ----------------------------------------------
  await toucher(
    page.getByRole("textbox", { name: "Titre absent de la liste" }).fill(TITRE_ABSENT),
  );
  await toucher(page.getByRole("button", { name: "Ajouter ce titre" }).click());

  // Compté dans la récompense, comme les autres : un geste qui ne ferait
  // rien bouger dirait à l'utilisateur qu'il n'a rien produit.
  await expect(bande).toHaveAttribute("data-total", String(TITRES_DECLARES));
  // Et marqué : une saisie libre n'est pas une entrée du référentiel.
  await expect(page.getByTestId("titre-libre")).toHaveAttribute("data-canonique", "false");

  // --- 5. deux souvenirs -------------------------------------------------
  const souvenir = page.getByRole("textbox", { name: /^Un souvenir sur/ }).first();
  await toucher(souvenir.fill("On l'a fini à deux avec mon frère, l'été 1995."));
  await toucher(page.getByRole("heading", { level: 1 }).click()); // perte de focus

  // Et un souvenir sur le titre SAISI — c'est là que §9 place le contenu le
  // plus personnel : un jeu absent du référentiel est souvent un jeu dont on
  // se souvient précisément parce qu'il est obscur.
  const souvenirLibre = page.getByRole("textbox", {
    name: `Un souvenir sur ${TITRE_ABSENT} ?`,
  });
  await toucher(souvenirLibre.fill(SOUVENIR_LIBRE));
  await toucher(page.getByRole("heading", { level: 1 }).click());

  // La FRONTIÈRE que seul ce parcours voit : l'identifiant de la
  // revendication est frappé par l'API et renvoyé par le front. Les deux
  // côtés ont chacun leur test ; personne ne possède la jointure, et c'est
  // exactement là que deux défauts se sont déjà logés. On relit donc la base
  // par l'API plutôt que l'écran, qui ne montre pas encore les souvenirs.
  const souvenirs = await (
    await page.request.get(`/api/memories/${profil}`)
  ).json();
  const surLeTitreSaisi = souvenirs.filter(
    (s: { targetKind: string }) => s.targetKind === "unresolvedClaim",
  );
  expect(surLeTitreSaisi, "le souvenir du titre saisi n'est pas arrivé en base")
    .toHaveLength(1);
  expect(surLeTitreSaisi[0].text).toBe(SOUVENIR_LIBRE);
  expect(surLeTitreSaisi[0].targetId).toMatch(/^ucl_/);

  // Et celui de la ligne cochée est bien sur l'ŒUVRE : une cible unique pour
  // les deux dirait que le genre n'a servi à rien.
  expect(souvenirs.filter((s: { targetKind: string }) => s.targetKind === "work"))
    .toHaveLength(1);

  // --- 5 bis. RECHARGER ---------------------------------------------------
  //
  // L'écran ne relisait rien : un rechargement montrait toutes les lignes
  // décochées alors que les déclarations étaient en base, et le testeur en
  // concluait qu'il avait perdu deux heures de saisie. C'est le seul endroit
  // où ce défaut se voit — aucun test de composant ne recharge une page.
  await page.goto(`/?profil=${profil}`);
  await page.getByRole("button", { name: /^Super Nintendo Entertainment System/ }).click();
  await page.getByRole("button", { name: /Années 90/ }).click();

  await expect(page.getByRole("button", { name: /^Déclaré : / }))
    .toHaveCount(TITRES_A_COCHER);
  // Et la correction a TENU : le titre décoché n'est pas revenu.
  await expect(page.getByRole("button", { name: `Déclaré : ${titreRetire}` }))
    .toHaveCount(0);
  // Et la passe 2 est remontrée, pas seulement conservée en base.
  await expect(page.getByRole("button", { name: "Fini" }).first())
    .toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Je l'avais" }).first())
    .toHaveAttribute("aria-pressed", "true");

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

  // **Le jeu affiné ne se lit plus en trois lignes identiques.** C'est le
  // symptôme signalé depuis un téléphone : `type` était rendu par l'API et
  // jeté par l'écran. Les trois moments du même titre portent désormais
  // trois marques distinctes, chacune NOMMÉE — une icône sans nom
  // accessible se déchiffre au lieu de se reconnaître (§10).
  await expect(page.getByRole("img", { name: "Fini" })).toHaveCount(1);
  await expect(page.getByRole("img", { name: "Je l'avais" })).toHaveCount(1);
  await expect(page.getByRole("img", { name: "Joué" })).toHaveCount(TITRES_A_COCHER + 1);

  // Et la date lue est CELLE QU'ON A SAISIE. C'est le défaut signalé depuis
  // un téléphone : la timeline montrait une année que l'utilisateur n'avait
  // jamais donnée. Une assertion sur « il y a une date » n'aurait rien vu.
  await expect(page.getByText(PERIODE_LUE).first()).toBeVisible();
  await expect(page.getByText(PERIODE_LUE)).toHaveCount(MOMENTS_ATTENDUS);

  // --- le KPI de §22.3 ---------------------------------------------------
  //
  // Un geste par titre, plus l'amorce (machine, période), les deux notes, le
  // passage à la timeline et le dépliage. Le titre absent en coûte DEUX —
  // saisir puis valider —, et c'est le prix à surveiller : sur 221 titres le
  // cas se répète, et un troisième geste par titre manquant sortirait du
  // budget « un tap par jeu ». Dépasser signifierait qu'un geste s'est
  // glissé quelque part, et c'est exactement ce que le test doit voir.
  // La carte de décennie et son affinage remplacent le mode, les deux
  // bornes et la validation : deux gestes de moins.
  // Les deux gestes de passe 2 s'ajoutent au budget. Les gestes du
  // rechargement, eux, ne sont PAS comptés : ce n'est pas le parcours d'un
  // testeur, c'est une vérification que seul ce test peut faire.
  // Les deux gestes de la correction — cocher par erreur, décocher — sont
  // comptés : c'est un geste réel, et le budget doit le voir.
  const budget = TITRES_A_COCHER + 15;
  expect(gestes, `${gestes} gestes pour ${MOMENTS_ATTENDUS} titres`).toBeLessThanOrEqual(budget);

  await infos.attach("gestes", { body: String(gestes), contentType: "text/plain" });
});
