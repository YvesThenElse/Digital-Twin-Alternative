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
 * La phrase écrite sur la ligne cochée, et son <b>repère</b> (§9.2).
 *
 * C'est le seul contenu du produit qui ne soit pas généré, et §9.1 en fait
 * le porteur direct du « oui, ça me ressemble » — le critère de la porte de
 * Phase 2. Le parcours vérifie donc qu'il TRAVERSE : saisi sur E02, relu sur
 * l'axe de E03.
 */
const SOUVENIR_OEUVRE = "On l'a fini à deux avec mon frère, l'été 1995.";
const REPERE = "L'été chez mon frère";

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

  // --- 1. la machine, et on se trompe ------------------------------------
  //
  // Se tromper de console est une erreur d'AMORCE, et seul un rechargement en
  // sortait — sur un téléphone, un testeur ne sait pas forcément comment
  // recharger. Le parcours la commet donc pour de bon.
  await expect(page.getByRole("heading", { name: /console/i })).toBeVisible();
  await toucher(
    page.getByRole("button", { name: /^Nintendo Entertainment System/ }).click(),
  );

  // --- 1 bis. la récompense, avant tout effort ---------------------------
  //
  // §24.4 : « la première console saisie déclenche DÉJÀ une phrase de récit ».
  // C'est la réponse au risque produit numéro un — pourquoi passer deux
  // heures à saisir trente ans ? — et elle arrive au premier geste.
  //
  // On MESURE son registre : le langage visuel §4 réserve la serif au récit
  // et l'interdit à l'interface courante. Une phrase rendue dans la même
  // police que les boutons ne raconterait rien, et aucun test de composant
  // ne peut le voir.
  const recit = page.getByTestId("recit");
  await expect(recit).toContainText("Nintendo Entertainment System");
  const registre = await recit.evaluate((n) => {
    const s = getComputedStyle(n);
    return {
      famille: s.fontFamily,
      taille: parseFloat(s.fontSize),
      corps: parseFloat(getComputedStyle(document.body).fontSize),
      filet: s.borderInlineStartColor,
    };
  });
  expect(registre.famille, "la phrase de récit n'est pas en serif")
    .toMatch(/Georgia|serif/i);
  expect(registre.taille, "la phrase de récit ne domine pas l'interface")
    .toBeGreaterThan(registre.corps);
  // Peinte, pas seulement nommée : E01 veut que le système de couleur
  // s'installe dès le deuxième écran.
  expect(registre.filet, "le filet d'époque n'est pas peint")
    .not.toBe("rgba(0, 0, 0, 0)");

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

  // --- 2 bis. se corriger de console, la période en poche ----------------
  //
  // E02 : « changer de plateforme → E02 sur une autre plateforme, PÉRIODE
  // CONSERVÉE ». On revient au choix, on prend la bonne console, et on doit
  // retomber DIRECTEMENT sur la liste — sans redonner une réponse déjà
  // donnée.
  //
  // La révocation de jaquette s'arme ICI : les premières demandées seront
  // celles de la bonne console, et non celles de la console qu'on quitte.
  let revoquee: string | null = null;
  await page.route("**/covers/**", async (route, requete) => {
    revoquee ??= requete.url();
    if (requete.url() === revoquee) return route.abort();
    return route.continue();
  });

  await toucher(page.getByRole("button", { name: "Changer de console" }).click());
  await toucher(
    page.getByRole("button", { name: /^Super Nintendo Entertainment System/ }).click(),
  );

  // Pas l'écran de période : c'est ce qui prouve qu'elle est conservée.
  await expect(page.getByRole("heading", { name: /quand/i })).toHaveCount(0);
  const contexte = page.getByTestId("contexte");
  await expect(contexte).toContainText(PERIODE_LUE);
  await expect(contexte).toContainText("Super Nintendo");

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
    // **Une jaquette, et une seule, a été révoquée** — refusée par le
    // réseau, comme le jour où l'emprunt de §19.2 prend fin. « Rien dans le
    // produit ne doit cesser de marcher le jour où elle disparaît »
    // (VERIFICATION-JURIDIQUE §3.3), et un navigateur n'échoue PAS sur une
    // image cassée : il dessine un glyphe et se tait. Seul un vrai refus
    // réseau le prouve — jsdom ne demande aucune image.
    //
    // Elle n'est plus annoncée comme une jaquette : elle s'est repliée sur
    // la tuile composée, qui est le socle permanent.
    expect(revoquee, "aucune jaquette n'a été révoquée : le test ne prouve rien")
      .not.toBeNull();
    const repliee = page.locator(`[data-tuile="jaquette"] img[src="${
      new URL(revoquee!).pathname}"]`);
    await expect(repliee, "la jaquette révoquée est restée à l'écran").toHaveCount(0);
    await expect(page.locator('[data-tuile="generee"]').first()).toBeVisible();

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

  // Et « toujours en cours » sur une AUTRE ligne (§4.6) : « commencé, jamais
  // refermé — il pourrait y revenir ». Le journal ne sait pas la distinguer
  // d'un jeu simplement coché — les deux ne produisent qu'un `StartedGame`
  // que rien ne referme —, donc elle s'écrit comme jugement. La chip
  // revenait vierge au rechargement, et le testeur voyait disparaître ce
  // qu'il venait de dire.
  await toucher(page.getByRole("button", { name: "Toujours en cours" }).nth(1).click());

  // --- 3 ter. « jamais joué » --------------------------------------------
  //
  // §24.3 : « il n'y a pas joué » n'est pas « il ne s'est pas prononcé ».
  // L'API l'acceptait depuis la Phase 1, l'état le rendait, et AUCUN geste
  // ne la posait : la distinction était inatteignable.
  //
  // Deux gestes, un par disposition — c'est E02 qui les sépare, et ils ne
  // sont pas interchangeables : le balayage n'existe pas à la souris, le
  // survol n'existe pas au pouce.
  const aEcarter = page.getByRole("button", { name: /^Déclarer : / }).first();
  const titreEcarte = (await aEcarter.getAttribute("aria-label"))!
    .replace("Déclarer : ", "");

  if (attendue === "liste") {
    // Le balayage vers la gauche, en vrai TOUCHER. `page.mouse` ne convient
    // pas ici : le projet mobile émule un écran tactile, et la souris n'y
    // produit pas les événements de pointeur qu'un pouce produit. On passe
    // donc par le protocole du navigateur, qui les synthétise lui-même —
    // pointeur, puis le clic qu'il en tire, c'est-à-dire exactement le piège
    // que l'écran doit étouffer.
    // Les coordonnées du protocole sont celles de la FENÊTRE : une ligne
    // restée sous le pli recevrait le balayage à côté.
    await aEcarter.scrollIntoViewIfNeeded();
    const boite = (await aEcarter.boundingBox())!;
    const y = boite.y + boite.height / 2;
    const depart = boite.x + boite.width - 10;
    const cdp = await page.context().newCDPSession(page);
    const toucherEcran = (
      type: "touchStart" | "touchMove" | "touchEnd",
      x: number,
    ) =>
      cdp.send("Input.dispatchTouchEvent", {
        type,
        touchPoints: type === "touchEnd" ? [] : [{ x, y }],
      });
    await toucherEcran("touchStart", depart);
    await toucherEcran("touchMove", depart - 60);
    await toucherEcran("touchMove", depart - 120);
    await toucherEcran("touchEnd", depart - 120);
    await toucher(Promise.resolve());
  } else {
    // Le bouton du survol. Il est dans le document en permanence et ne se
    // révèle qu'au survol : Playwright survole avant de cliquer, comme une
    // main.
    await toucher(
      page.getByRole("button", { name: `Je n'y ai jamais joué à ${titreEcarte}` }).click(),
    );
  }

  // La ligne le DIT — elle ne le suggère pas par une nuance de gris. On la
  // retrouve par son NOUVEAU nom : un localisateur est paresseux, et celui
  // du départ désigne désormais la ligne suivante.
  const ecartee = page.getByRole("button", { name: `Jamais joué : ${titreEcarte}` });
  await expect(ecartee).toHaveCount(1);
  const ligneEcartee = ecartee.locator("xpath=..");

  // **Et elle s'estompe SANS disparaître.** E02 la veut corrigeable ; une
  // ligne retirée ferait perdre ses repères au joueur, qui la recocherait.
  // Aucun test de composant ne peut le voir : il rend dans un document sans
  // CSS.
  const estompee = await ligneEcartee.evaluate((n) => {
    const ligne = n.querySelector(".ligne")!;
    return {
      opacite: Number(getComputedStyle(ligne).opacity),
      hauteur: n.getBoundingClientRect().height,
    };
  });
  expect(estompee.opacite, "la ligne écartée n'est pas estompée").toBeLessThan(1);
  expect(estompee.opacite, "la ligne écartée est invisible").toBeGreaterThan(0.2);
  expect(estompee.hauteur, "la ligne écartée a disparu").toBeGreaterThan(0);

  // Et elle ne compte pas dans la récompense : aucun événement n'est produit,
  // donc l'axe ne la confirmera pas.
  await expect(bande).toHaveAttribute("data-total", String(TITRES_A_COCHER));

  // --- 3 quater. recharger, et voir le squelette -------------------------
  //
  // Les quatre états de §5 valent pour E02 comme pour E01. Le squelette est
  // le seul qui ne puisse pas se vérifier hors du navigateur : huit lignes
  // vides sans feuille de style font huit éléments de hauteur ZÉRO, et un
  // test de composant les compterait avec satisfaction.
  await page.route("**/api/platforms/*/works*", async (route) => {
    await new Promise((r) => setTimeout(r, 500));
    await route.continue();
  });
  await toucher(page.getByRole("button", { name: "Recharger la liste" }).click());

  const squelette = page.getByTestId("squelette");
  const hauteurSquelette = await squelette.locator("li").first()
    .evaluate((n) => n.getBoundingClientRect().height);
  expect(hauteurSquelette, "le squelette n'a aucune hauteur").toBeGreaterThan(40);

  await page.unroute("**/api/platforms/*/works*");
  await expect(squelette).toHaveCount(0);

  // Et le travail est revenu tel qu'il était : le rechargement relit l'état
  // au lieu de le perdre.
  await expect(bande).toHaveAttribute("data-total", String(TITRES_A_COCHER));

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
  await toucher(souvenir.fill(SOUVENIR_OEUVRE));
  // Le repère : un titre court, FACULTATIF, qui servira de marque sur l'axe.
  // Les vingt-neuf autres lignes n'y touchent pas et restent des
  // déclarations valables.
  await toucher(
    page.getByRole("textbox", { name: /^Un repère court sur/ }).first().fill(REPERE),
  );
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
  const surLOeuvre = souvenirs.filter(
    (s: { targetKind: string }) => s.targetKind === "work",
  );
  expect(surLOeuvre).toHaveLength(1);
  // Le repère est parti AVEC la phrase, en une seule écriture — et le titre
  // saisi, qui n'en a pas reçu, n'en a pas inventé.
  expect(surLOeuvre[0].title).toBe(REPERE);
  expect(surLeTitreSaisi[0].title).toBeNull();

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
  // Et « jamais joué » aussi : c'est une déclaration, elle se relit comme
  // les autres. Relue comme un titre vierge, le joueur la reposerait à
  // chaque visite — ou pire, la cocherait.
  await expect(page.getByRole("button", { name: `Jamais joué : ${titreEcarte}` }))
    .toHaveCount(1);

  // **Et le titre SAISI est revenu**, marqué comme tel et avec sa phrase.
  // Il disparaissait de l'écran au rechargement tout en restant sur la
  // timeline : le joueur le resaisissait, et la base gardait deux formes du
  // même souvenir. §3.5 les veut « visibles dans son profil comme les
  // autres ». Le moyen — `GET /unresolved/{user}` — existait et n'était
  // appelé par personne.
  const libreRelu = page.getByTestId("titre-libre");
  await expect(libreRelu).toHaveCount(1);
  await expect(libreRelu).toContainText(TITRE_ABSENT);
  await expect(libreRelu).toHaveAttribute("data-canonique", "false");
  await expect(page.getByRole("textbox", { name: `Un souvenir sur ${TITRE_ABSENT} ?` }))
    .toHaveValue(SOUVENIR_LIBRE);

  // La bande retrouve son compte : le titre saisi y est compté comme les
  // autres. Un recul d'une visite à l'autre se lit comme une perte.
  await expect(bande).toHaveAttribute("data-total", String(TITRES_DECLARES));
  // Et la passe 2 est remontrée, pas seulement conservée en base.
  await expect(page.getByRole("button", { name: "Fini" }).first())
    .toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Je l'avais" }).first())
    .toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Toujours en cours" }).nth(1))
    .toHaveAttribute("aria-pressed", "true");
  // Et la ligne qui n'a RIEN dit reste vierge : c'est la distinction que
  // l'item porte — « il n'a rien dit » n'est pas « il y joue encore ».
  await expect(page.getByRole("button", { name: "Toujours en cours" }).nth(2))
    .toHaveAttribute("aria-pressed", "false");

  // --- 5 ter. est-ce moi, ou est-ce le service ? -------------------------
  //
  // Le bandeau d'état était écrit, testé, et affiché NULLE PART. Il répond à
  // la seule question que l'alerte d'un geste ne tranche pas — et un testeur
  // qui ne peut pas y répondre s'arrête. On coupe donc pour de vrai, et on
  // MESURE qu'il se voit : « discrètement » n'est pas « invisible », et un
  // test de composant rend dans un document sans feuille de style.
  await page.route("**/api/health", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        status: "degraded",
        database: { status: "unreachable", detail: "connexion refusée" },
      }),
    }));
  await page.route("**/api/timeline/**", (route) => route.abort());
  await toucher(page.getByRole("button", { name: "Voir ma timeline" }).click());

  const bandeau = page.getByText(/Service indisponible/);
  await expect(bandeau).toBeVisible();
  await expect(bandeau).toContainText("connexion refusée");
  const hauteurBandeau = await bandeau.evaluate((n) => n.getBoundingClientRect().height);
  expect(hauteurBandeau, "le bandeau d'état n'a aucune hauteur").toBeGreaterThan(16);

  await page.unroute("**/api/timeline/**");
  await page.unroute("**/api/health");

  // --- 6. la timeline ----------------------------------------------------
  await toucher(page.getByRole("button", { name: "Voir ma timeline" }).click());

  // Et le diagnostic s'efface : il ne survit pas à la réparation.
  await expect(page.getByText(/Service indisponible/)).toHaveCount(0);

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

  // --- 6 bis. le souvenir atteint l'axe (§9.2) ----------------------------
  //
  // Il était écrit en base et rendu NULLE PART : le seul contenu non généré
  // du produit — celui dont §9.1 fait le porteur du « oui, ça me ressemble »
  // — n'arrivait jamais sous les yeux de celui qui l'avait écrit.
  // DEUX souvenirs ont été écrits, donc deux marques — et pas une de plus.
  // Le jeu affiné porte trois moments, et le souvenir est attaché au JEU :
  // trois marques feraient croire à trois phrases distinctes.
  const reperes = page.getByTestId("souvenir-repere");
  await expect(reperes).toHaveCount(2);

  const repere = reperes.filter({ hasText: REPERE });
  await expect(repere).toHaveCount(1);

  // Et celui du titre saisi, à qui personne n'a donné de repère, est marqué
  // quand même : le titre est facultatif, et écrire sans titrer ne doit pas
  // faire disparaître la phrase de l'axe.
  await expect(reperes.filter({ hasText: "Un souvenir" })).toHaveCount(1);

  // **Et il DOMINE les éléments automatiques**, ce qu'aucun test de composant
  // ne peut voir — il rend dans un document sans CSS. E03 repère C : « le
  // seul contenu de la timeline qui ne soit pas généré : il doit dominer
  // visuellement les éléments automatiques », et le langage visuel §4 le lui
  // interdit en `meta`. On mesure donc, au lieu de lire une classe.
  const rendus = await repere.evaluate((n) => {
    const auto = n.closest("li")!.querySelector("[data-forme]")!;
    return {
      style: getComputedStyle(n).fontStyle,
      taille: parseFloat(getComputedStyle(n).fontSize),
      tailleAuto: parseFloat(getComputedStyle(auto).fontSize),
    };
  });
  expect(rendus.style, "le souvenir n'est pas en italique").toBe("italic");
  expect(rendus.taille, "le souvenir se relègue en petits caractères")
    .toBeGreaterThan(rendus.tailleAuto);

  // Le texte complet s'ouvre AU CLIC : déplier trente phrases d'office ferait
  // de l'écran de lecture un mur de texte.
  await expect(page.getByText(SOUVENIR_OEUVRE)).toHaveCount(0);
  await toucher(repere.click());
  await expect(page.getByText(SOUVENIR_OEUVRE)).toBeVisible();

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
  // Deux gestes de plus que le budget d'origine : poser le repère, et ouvrir
  // le souvenir sur l'axe. Le premier est FACULTATIF — aucune des vingt-neuf
  // autres lignes ne le paie — et le second est une lecture, pas une saisie.
  // Un geste de plus : « jamais joué ». Il est FACULTATIF — « un utilisateur
  // qui l'ignore complètement n'est pas pénalisé » (E02) — mais le parcours
  // le paie, et le budget doit le voir.
  // Deux gestes de plus : se tromper de console, et se corriger. C'est une
  // erreur d'amorce réelle, et le budget doit la voir — c'est même tout
  // l'intérêt de la compter, puisque la période conservée est ce qui
  // l'empêche d'en coûter deux de plus.
  // Un geste de plus : le passage à la timeline qui échoue, avant celui qui
  // aboutit. C'est un geste réel — un testeur qui tombe sur une panne le
  // paie aussi.
  // Un geste de plus : « toujours en cours ». La passe 2 reste facultative —
  // vingt-huit lignes n'y touchent pas — mais le parcours la paie.
  const budget = TITRES_A_COCHER + 23;
  expect(gestes, `${gestes} gestes pour ${MOMENTS_ATTENDUS} titres`).toBeLessThanOrEqual(budget);

  await infos.attach("gestes", { body: String(gestes), contentType: "text/plain" });
});
