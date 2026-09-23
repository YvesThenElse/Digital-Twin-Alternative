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

  // **On reste sur l'écran de période**, et c'est tout l'item F18 : le clic
  // sur une décennie validait ET naviguait, si bien que l'affinage
  // n'apparaissait que le temps des deux requêtes de relecture. Ce parcours
  // ne pouvait pas le voir — Playwright clique plus vite qu'une main —, donc
  // on l'affirme désormais explicitement.
  // Une fois le réseau calme : si l'écran devait partir de lui-même, il
  // serait parti. `toBeVisible` seul passerait au premier tick, avant la
  // navigation — c'est-à-dire exactement pendant la course que cet item
  // supprime.
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: /quand/i })).toBeVisible();
  await expect(page.getByTestId("affinage")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Déclarer : / })).toHaveCount(0);

  // --- 2 ter. le temps 3, la récompense immédiate (E01) ------------------
  //
  // « Dès la validation du temps 2, SANS TRANSITION NI CHARGEMENT BLOQUANT :
  // une phrase, une bande sur un axe, un aperçu visuel des jeux à venir, une
  // continuation. » C'est l'écran où se joue le KPI de première session, et
  // « un onboarding raté ne se rattrape sur aucun autre écran ».
  //
  // On MESURE l'absence de chargement : aucune requête de données ne doit
  // partir entre le clic et l'apparition de l'écran. Un test de composant ne
  // peut pas le voir — il ne sait rien du réseau —, et une assertion de
  // visibilité seule passerait même si l'écran avait attendu trois lectures.
  const requetesDeDonnees: string[] = [];
  const espion = (requete: { resourceType(): string; url(): string }) => {
    if (requete.resourceType() === "xhr" || requete.resourceType() === "fetch") {
      requetesDeDonnees.push(requete.url());
    }
  };
  page.on("request", espion);
  await toucher(page.getByRole("button", { name: `${DEBUT} – ${FIN}` }).click());
  await expect(page.getByTestId("temps3")).toBeVisible();
  page.off("request", espion);
  expect(requetesDeDonnees, "la récompense a attendu une lecture").toEqual([]);

  // Les quatre éléments. La phrase dit la décennie, l'axe porte la période
  // DÉCLARÉE — pas une autre —, l'aperçu montre des jeux, et la
  // continuation est la seule action.
  await expect(page.getByTestId("temps3-phrase")).toContainText("90");
  await expect(page.getByTestId("temps3-axe")).toContainText(PERIODE_LUE);

  // **De VRAIES jaquettes.** « L'aperçu de quatre jaquettes n'est pas
  // décoratif : il montre concrètement ce que la suite propose. » Un
  // navigateur n'échoue pas sur une image cassée — il dessine un glyphe et
  // se tait —, donc on mesure la largeur réellement décodée.
  const apercu = page.getByTestId("temps3-apercu").locator("img");
  const attendues = infos.project.name === "mobile" ? 4 : 8;
  await expect(apercu, "l'aperçu n'a pas le nombre de jaquettes de sa disposition")
    .toHaveCount(attendues);
  for (let i = 0; i < attendues; i += 1) {
    await expect(apercu.nth(i)).toHaveJSProperty("complete", true);
    const largeur = await apercu.nth(i).evaluate(
      (img) => (img as HTMLImageElement).naturalWidth,
    );
    expect(largeur, `jaquette d'aperçu non chargée : ${await apercu.nth(i).getAttribute("src")}`)
      .toBeGreaterThan(0);
  }

  // Le registre, mesuré : la serif du récit, et la bande PEINTE. Une bande
  // nommée mais sans hauteur ni couleur se lit comme un défaut d'affichage —
  // c'est déjà arrivé à la bande d'époque.
  const cadeau = await page.getByTestId("temps3").evaluate((n) => {
    const p = n.querySelector('[data-testid="temps3-phrase"]')!;
    const bande = n.querySelector(".temps3-bande")!;
    return {
      famille: getComputedStyle(p).fontFamily,
      taille: parseFloat(getComputedStyle(p).fontSize),
      corps: parseFloat(getComputedStyle(document.body).fontSize),
      fond: getComputedStyle(bande).backgroundColor,
      hauteur: bande.getBoundingClientRect().height,
      largeur: bande.getBoundingClientRect().width,
    };
  });
  expect(cadeau.famille, "la phrase du temps 3 n'est pas en serif").toMatch(/Georgia|serif/i);
  expect(cadeau.taille, "la phrase du temps 3 ne domine pas l'interface")
    .toBeGreaterThan(cadeau.corps);
  expect(cadeau.fond, "la bande d'axe n'est pas peinte").not.toBe("rgba(0, 0, 0, 0)");
  expect(cadeau.hauteur, "la bande d'axe n'a aucune hauteur").toBeGreaterThan(2);
  expect(cadeau.largeur, "la bande d'axe n'a aucune largeur").toBeGreaterThan(40);

  // « Sortant principal : → E02. C'est la seule continuation qui compte. »
  await toucher(page.getByRole("button", { name: /^Voir les jeux/ }).click());

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

  // --- 3 bis bis. le filtre de la liste (E02 repère B) --------------------
  //
  // `PHASING.md` §4 met « recherche d'un jeu ou d'une console » au périmètre,
  // et rien ne le tenait. La saisie libre de §3.5 couvre le titre ABSENT ;
  // elle ne répond pas à « je sais que j'y ai joué, où est-il ? » dans une
  // liste de cette taille. Sur le dataset réel, et pas sur trois lignes de
  // fixture : c'est la seule échelle où le filtre a un sens.
  //
  // **Lecture seule.** Le filtre ne déclare rien ici ; ce qu'on vérifie est
  // qu'il ne PERD rien — les trente déclarations faites depuis l'ouverture
  // doivent traverser le filtre et sa levée.
  const toutesLesLignes = page.getByRole("button", { name: /^(Déclarer|Déclaré) : / });
  const avantFiltre = await toutesLesLignes.count();
  const premierDeclare = (await page.getByRole("button", { name: /^Déclaré : / })
    .first().getAttribute("aria-label"))!.replace("Déclaré : ", "");
  const mot = premierDeclare.split(" ").find((m) => m.length >= 4)!;

  const chercher = page.getByRole("textbox", { name: /Chercher un jeu/ });
  await toucher(chercher.fill(mot));

  const apresFiltre = await toutesLesLignes.count();
  expect(apresFiltre, `« ${mot} » n'a rien retenu`).toBeGreaterThan(0);
  expect(apresFiltre, `« ${mot} » n'a rien écarté : le filtre ne filtre pas`)
    .toBeLessThan(avantFiltre);

  // Le compteur DIT sur quoi il porte : « 4 jeux sur 147 ». Un total affiché
  // au-dessus d'une liste réduite est un compte juste appliqué à autre chose.
  await expect(page.getByTestId("compte")).toContainText(
    new RegExp(`${apresFiltre} jeux? sur ${avantFiltre}`));

  // Et la ligne trouvée est TOUJOURS déclarée : E02 interdit de masquer les
  // jeux déjà cochés — « l'utilisateur perd ses repères et ne peut plus
  // corriger ».
  // `exact` n'est pas un détail : le nom accessible se cherche par SOUS-CHAÎNE
  // par défaut, et « Super Mario World » est le préfixe de « Super Mario
  // World 2 ». Sans lui, l'assertion trouvait deux lignes et échouait pour
  // une raison qui n'a rien à voir avec le filtre.
  await expect(page.getByRole("button", {
    name: `Déclaré : ${premierDeclare}`, exact: true,
  })).toBeVisible();

  await toucher(page.getByRole("button", { name: "Vider la recherche" }).click());

  // La liste ENTIÈRE revient, et les trente déclarations avec elle.
  await expect(toutesLesLignes).toHaveCount(avantFiltre);
  await expect(page.getByRole("button", { name: /^Déclaré : / }))
    .toHaveCount(TITRES_A_COCHER);
  await expect(page.getByTestId("compte")).not.toContainText(" sur ");

  // --- 3 bis. la passe 2, sur une ligne déclarée --------------------------
  //
  // Facultative par construction : les vingt-neuf autres lignes n'y touchent
  // pas et restent des déclarations valables.
  // **Les TROIS questions sont là.** E02 en liste quatre et n'en posait que
  // deux : l'affect n'était saisissable que depuis E07, alors que son
  // intérêt est d'être « un tap qui capte ce qui a compté » PENDANT la
  // saisie. L'ordre est une décision de conception — le factuel, puis
  // l'émotionnel, puis la provenance —, et on le mesure sur la page.
  const questions = page.getByRole("group");
  // TROIS par ligne déclarée, pas deux : le compte le dit mieux qu'une
  // présence, et il tomberait à soixante si la question disparaissait.
  await expect(questions).toHaveCount(TITRES_A_COCHER * 3);
  await expect(questions.nth(0)).toHaveAttribute("aria-label", "Vous l'avez fini ?");
  await expect(questions.nth(1)).toHaveAttribute("aria-label", "Ça vous a marqué ?");
  await expect(questions.nth(2)).toHaveAttribute("aria-label", "Comment y avez-vous joué ?");

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
  // **La sonde de reprise ne retarde PAS l'accueil.** E01 : « Chargement :
  // aucun », et le chronomètre du KPI démarre au premier clic. On tient donc
  // la réponse en otage et on exige que le temps 1 soit déjà utilisable —
  // une assertion de durée aurait mesuré la machine, pas la règle.
  let libererLaSonde: () => void = () => {};
  const sondeTenue = new Promise<void>((r) => { libererLaSonde = r; });
  await page.route("**/api/profile/**", async (route) => {
    await sondeTenue;
    await route.continue();
  });

  await page.goto(`/?profil=${profil}`);

  await expect(page.getByRole("button", { name: /^Super Nintendo Entertainment System/ }))
    .toBeEnabled();
  await expect(page.getByTestId("reprise"),
    "l'offre paraît avant que la sonde ait répondu").toHaveCount(0);

  libererLaSonde();
  await page.unroute("**/api/profile/**");

  // Et l'offre arrive ensuite, en nommant ce qui est déjà là.
  const reprise = page.getByTestId("reprise");
  await expect(reprise).toBeVisible();
  await expect(reprise).toContainText(String(MOMENTS_ATTENDUS));

  // **UN geste au lieu de quatre.** C'est toute la valeur de l'offre : le
  // visiteur qui revient retrouve son histoire sans redonner une console,
  // une décennie, un affinage et une continuation qu'il a déjà donnés.
  await reprise.getByRole("button", { name: /Reprendre/ }).click();
  await expect(page.getByTestId("portrait")).toBeVisible();
  await expect(page.getByTestId("axe")).toBeVisible();

  // --- 5 ter. et l'accueil reste entier si on l'ignore -------------------
  //
  // C'est l'autre moitié de « proposer » : les trois temps sont toujours là
  // pour qui revient ajouter une console. On les rejoue, et la liste doit
  // montrer ce qui est en base.
  await page.goto(`/?profil=${profil}`);
  await expect(page.getByTestId("reprise")).toBeVisible();
  await page.getByRole("button", { name: /^Super Nintendo Entertainment System/ }).click();
  // Les deux mêmes gestes qu'à l'aller : la décennie ouvre l'affinage, et
  // c'est l'affinage qui continue. Ces gestes-ci ne comptent pas au budget —
  // ce n'est pas le parcours d'un testeur, c'est une vérification que seul
  // ce test peut faire.
  await page.getByRole("button", { name: /Années 90/ }).click();
  await page.getByRole("button", { name: `${DEBUT} – ${FIN}` }).click();
  // Et le temps 3 REVIENT. C'est ce que la Phase 1 fait aujourd'hui, et ce
  // test le dit plutôt que de le masquer : E01 promet autre chose au
  // visiteur qui revient — « si un historique local existe, proposer de le
  // reprendre plutôt que de recommencer » —, et cette reprise n'existe pas.
  // Le manque est inscrit dans TODO-ECRANS.md ; il n'est pas de cet item.
  await page.getByRole("button", { name: /^Voir les jeux/ }).click();

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

  // --- 6 ter. le portrait, au-dessus de l'axe (E04) ----------------------
  //
  // « En Phase 1, E04 n'est pas un écran séparé : sa synthèse forme l'en-tête
  // de /mon-histoire, AU-DESSUS de la timeline. » Son objectif est la porte
  // dure de la Phase 2 — « produire le moment *oui, ça me ressemble* ».
  const portrait = page.getByTestId("portrait");
  await expect(portrait).toBeVisible();

  // **Les chiffres disent le parcours qu'on vient de jouer.** C'est ce qu'un
  // test de composant ne peut pas voir : il les reçoit en props. Ici ils ont
  // traversé le domaine, la base et l'API — et l'écran, lui, n'a qu'UNE
  // plateforme en mémoire. Un compte fait à l'écran dirait autre chose.
  const nombres = portrait.getByTestId("portrait-nombre");
  await expect(nombres).toHaveText([
    // une console : celle sur laquelle on a déclaré, pas celle qu'on a
    // ouverte par erreur ;
    "1",
    // les trente titres cochés plus celui qui manquait — la ligne décochée
    // n'y est PAS : §5.3 veut la révision « conservée sans être exposée » ;
    String(TITRES_DECLARES),
    // un seul terminé : la passe 2 n'a été jouée qu'une fois ;
    "1",
    // deux souvenirs écrits — le quatrième chiffre remplace « à 100 % », que
    // §4.6 a sorti du modèle.
    "2",
  ]);

  // **Les périodes d'activité ont une HAUTEUR.** E04 en fait « le bloc le
  // plus immédiatement parlant de l'écran » — et il ne parle que s'il se
  // voit. Des barres en pourcentage dans un conteneur qui n'en a pas
  // mesurent zéro : c'est le défaut qu'a déjà eu la bande d'époque, et aucun
  // test d'attribut ne l'aurait vu.
  const activite = page.getByTestId("activite");
  await expect(activite).toBeVisible();
  const decennies = await activite.locator(".activite-tranche").evaluateAll((noeuds) =>
    noeuds.map((n) => n.getBoundingClientRect().height),
  );
  expect(decennies.length, "la bande d'activité n'a aucune tranche").toBeGreaterThan(1);
  expect(Math.max(...decennies), "la bande d'activité n'a pas de hauteur visible")
    .toBeGreaterThan(16);
  // Et le creux se voit AUSSI : une décennie à zéro garde un trait, sinon
  // son absence se lit comme un défaut d'affichage plutôt qu'un silence.
  expect(Math.min(...decennies), "une décennie vide a disparu de la bande")
    .toBeGreaterThan(0);

  // Et AUCUNE invitation à compléter : le portrait tient, donc l'état
  // « trop maigre » d'E04 n'a pas lieu d'être. Le témoin de cette absence
  // est côté composant, sur une synthèse sans chiffres.
  await expect(page.getByRole("button", { name: /Ajouter des jeux/ })).toHaveCount(0);

  // Quatre, jamais treize. §8.2 liste treize indicateurs ; E04 tranche —
  // « les afficher tous produirait un tableau de bord, pas un portrait ».
  await expect(nombres).toHaveCount(4);

  // Le REGISTRE, mesuré. Le langage visuel §4 réserve la serif au récit et
  // l'interdit à l'interface courante ; et les chiffres sont en chasse
  // tabulaire, « pour que rien ne saute pendant l'incrémentation ». Aucun
  // test de composant ne voit cela — il rend sans feuille de style.
  const mise = await portrait.evaluate((n) => {
    const p = n.querySelector('[data-testid="portrait-phrase"]')!;
    const nombre = n.querySelector('[data-testid="portrait-nombre"]')!;
    const etiquette = n.querySelector('[data-testid="portrait-libelle"]')!;
    return {
      famille: getComputedStyle(p).fontFamily,
      taillePhrase: parseFloat(getComputedStyle(p).fontSize),
      chasse: getComputedStyle(nombre).fontVariantNumeric,
      tailleNombre: parseFloat(getComputedStyle(nombre).fontSize),
      tailleEtiquette: parseFloat(getComputedStyle(etiquette).fontSize),
      corps: parseFloat(getComputedStyle(document.body).fontSize),
    };
  });
  expect(mise.famille, "la phrase du portrait n'est pas en serif")
    .toMatch(/Georgia|serif/i);
  expect(mise.taillePhrase, "la phrase ne domine pas l'interface")
    .toBeGreaterThan(mise.corps);
  expect(mise.chasse, "les chiffres ne sont pas en chasse tabulaire")
    .toContain("tabular-nums");
  expect(mise.tailleNombre, "le libellé prend le pas sur le chiffre")
    .toBeGreaterThan(mise.tailleEtiquette);

  // La phrase dit ce que le joueur a DÉCLARÉ : sa machine, sa période, et
  // l'approximation assumée. « ≈ » est dit, pas sous-entendu (§11.4).
  await expect(portrait).toContainText("Super Nintendo Entertainment System");
  await expect(portrait).toContainText(PERIODE_LUE);
  await expect(portrait).toContainText("≈");

  // Et il est bien AU-DESSUS de l'axe, mesuré sur la page — pas déduit de
  // l'ordre du code, qu'une règle de disposition peut inverser.
  const axe = page.getByTestId("axe");
  const boitePortrait = (await portrait.boundingBox())!;
  const boiteAxe = (await axe.boundingBox())!;
  expect(boitePortrait.y + boitePortrait.height, "le portrait passe sous l'axe")
    .toBeLessThanOrEqual(boiteAxe.y + 1);

  // « Saisi d'un seul regard » (E04) : le portrait tient dans le premier
  // écran, sur les deux dispositions. Un en-tête qu'il faut faire défiler ne
  // produit pas le moment qu'on lui demande de produire.
  const hauteurVue = page.viewportSize()!.height;
  expect(boitePortrait.y + boitePortrait.height, "le portrait déborde du premier écran")
    .toBeLessThanOrEqual(hauteurVue);

  // Les trente titres ont été cochés d'un seul passage, sur une même
  // période : ils forment UN épisode (§4.4), pas trente moments empilés.
  // L'axe le montre replié — c'est précisément ce que l'agrégation sert.
  await expect(axe).toHaveAttribute("data-entrees", "1");
  // L'ENTRÉE, pas tous les enfants : l'axe porte aussi les invitations à
  // compléter une décennie vide, qui sont des `li` de même niveau.
  const entree = axe.locator('> [data-testid="entree"]');
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
  //
  // **Compté DANS l'axe**, et c'est une correction que l'en-tête a provoquée :
  // le portrait dit lui aussi la période déclarée, et le compte global est
  // passé à 34. Un écart plus élevé nomme ce qu'on vient d'ajouter
  // (apprentissage 70) ; le remettre à 34 aurait fait porter l'assertion sur
  // un total au lieu des moments, et elle serait redevenue fausse au premier
  // élément suivant qui affiche une date.
  await expect(axe.getByText(PERIODE_LUE).first()).toBeVisible();
  await expect(axe.getByText(PERIODE_LUE)).toHaveCount(MOMENTS_ATTENDUS);

  // --- 7. la fiche du jeu (E05) ------------------------------------------
  //
  // E03, actions : « clic sur un jeu → E05 ». Cliquer un jeu ne faisait rien,
  // et le lien promis par deux fiches ne menait nulle part.
  //
  // On prend le titre AFFINÉ : c'est celui dont l'axe disperse trois moments,
  // et c'est exactement ce que la fiche existe pour rassembler.
  const titreAffine = await page.getByRole("img", { name: "Fini" })
    .locator("xpath=ancestor::li[1]")
    .getByTestId("moment-titre").textContent();

  await toucher(page.getByRole("button", { name: titreAffine!, exact: true })
    .first().click());

  const fiche = page.getByTestId("fiche");
  await expect(fiche).toBeVisible();
  await expect(fiche).toContainText(titreAffine!);

  // **Les trois moments sont ENSEMBLE.** Sur l'axe ils sont dans le même
  // épisode, noyés parmi trente autres lignes ; ici ils sont la fiche.
  await expect(fiche.getByTestId("fiche-moment")).toHaveCount(3);

  // Et le personnel est AU-DESSUS du factuel — mesuré sur la page, parce que
  // c'est la décision de conception centrale d'E05 et qu'une règle de
  // disposition peut inverser l'ordre du code.
  const boiteVous = (await page.getByTestId("fiche-vous").boundingBox())!;
  const boiteFaits = (await page.getByTestId("fiche-referentiel").boundingBox())!;
  expect(boiteVous.y + boiteVous.height,
    "la fiche technique passe avant ce que le joueur a vécu")
    .toBeLessThanOrEqual(boiteFaits.y + 1);

  // Les éditions connues viennent du référentiel RÉEL, et chacune porte sa
  // machine et sa région (§3.4).
  const editions = fiche.getByTestId("fiche-edition");
  await expect(editions.first()).toBeVisible();
  await expect(editions.first()).toContainText("Super Nintendo");

  // Le souvenir écrit sur ce jeu y est aussi : c'est la seule vue du produit
  // qui réponde à « ce jeu, et moi ».
  await expect(page.getByTestId("fiche-vous")).toContainText(REPERE);

  // Et ce n'est pas un cul-de-sac.
  await toucher(page.getByRole("button", { name: /Revenir/ }).click());
  await expect(page.getByTestId("axe")).toBeVisible();

  // **L'épisode est resté déplié.** E03 promet « → E05 en CONSERVANT la
  // position », et l'axe est pourtant démonté par la fiche : c'est le parent
  // qui tient le repliage, précisément pour qu'il survive au remontage.
  //
  // Ce bloc CONSTATAIT le défaut inverse jusqu'au 23 septembre, avec une
  // assertion écrite pour échouer le jour de la correction. Elle a échoué.
  await expect(page.getByTestId("moment-titre")).toHaveCount(MOMENTS_ATTENDUS);

  // --- 7 bis. corriger une date, et voir naître l'avertissement (E07) ----
  //
  // ⚠️ **Le producteur qui manquait.** §5.4 était calculé par le domaine,
  // rendu par l'API, affiché par l'axe — et aucun geste du produit ne pouvait
  // en déclencher un seul : la sélection massive émet toujours le
  // commencement avec l'achèvement, à la même date.
  //
  // Le jeu affiné porte un « Fini ». On le date AVANT son propre
  // commencement : c'est possible, et ce doit être signalé.
  await expect(page.getByTestId("avertissement"),
    "un avertissement existe AVANT toute correction : le test ne prouverait rien")
    .toHaveCount(0);

  const ligneFinie = page.getByRole("img", { name: "Fini" }).locator("xpath=ancestor::li[1]");
  await toucher(ligneFinie.getByTestId("moment-corriger").click());

  // **L'axe RESTE à l'écran** : « panneau, jamais page ». Naviguer pour dater
  // un souvenir puis revenir coûte deux transitions et fait perdre la
  // position — et c'est en relisant sa timeline qu'on corrige.
  const panneau = page.getByTestId("panneau-moment");
  await expect(panneau).toBeVisible();
  await expect(page.getByTestId("axe")).toBeVisible();

  // Il s'ouvre sur la granularité enregistrée : la période déclarée est un
  // intervalle, donc DEUX champs.
  await expect(panneau.getByRole("spinbutton", { name: /^Année$/ })).toHaveValue(String(DEBUT));
  await expect(panneau.getByRole("spinbutton", { name: /Jusqu/ })).toHaveValue(String(FIN));

  // Une année antérieure au commencement du même jeu.
  await toucher(panneau.getByRole("radio", { name: /ne sais plus/i }).click());
  await toucher(panneau.getByRole("radio", { name: /plutôt une période/i }).click());
  const champAnnee = panneau.getByRole("spinbutton", { name: /^Année$/ });
  await champAnnee.fill(String(DEBUT - 5));
  await panneau.getByRole("spinbutton", { name: /Jusqu/ }).fill(String(DEBUT - 5));
  await toucher(panneau.getByRole("button", { name: /Enregistrer/ }).click());

  await expect(panneau).toHaveCount(0);

  // **L'avertissement doux de §5.4 apparaît.** Il informe, il ne bloque
  // rien, et le moment reste affiché tel qu'il a été déclaré.
  await expect(page.getByTestId("avertissement").first()).toBeVisible();

  // Et la date corrigée est bien celle qu'on a donnée : la correction chaîne
  // un nouvel événement, elle ne réécrit pas l'ancien.
  await expect(page.getByText(`${DEBUT - 5}`).first()).toBeVisible();

  // --- 7 ter. le repli de précision (E07 repère B) -----------------------
  //
  // Quatre granularités du modèle étaient construites, testées, rendues par
  // l'axe — et AUCUN écran ne les envoyait. Le repli les rend atteignables
  // sans les imposer : « mois et date exacte sont rarissimes pour un
  // souvenir de trente ans ».
  await toucher(ligneFinie.getByTestId("moment-corriger").click());
  const repli = page.getByTestId("panneau-repli");
  await expect(repli).toBeVisible();
  // REPLIÉ : il n'est jamais nécessaire.
  await expect(repli).not.toHaveAttribute("open", "");

  await toucher(repli.locator("summary").click());
  await toucher(page.getByRole("radio", { name: /Un mois précis/ }).click());
  await page.getByRole("combobox", { name: /Mois/ }).selectOption("11");
  await toucher(page.getByRole("button", { name: /^Enregistrer$/ }).click());

  await expect(page.getByTestId("panneau-moment")).toHaveCount(0);
  // Le mois est SUR L'AXE, dans les mots de l'écran — pas « 1990-11 ».
  await expect(page.getByText(/novembre/).first()).toBeVisible();

  // --- 7 quater. l'affect, saisissable pour la première fois (§4.7) ------
  //
  // La colonne existait, la lecture la rendait, le domaine savait qu'elle
  // lève « jamais joué » et qu'un seul préféré vit par plateforme — et
  // AUCUN geste ne l'écrivait. C'est la troisième capacité morte.
  await toucher(ligneFinie.getByTestId("moment-corriger").click());
  const etat = page.getByTestId("panneau-etat");
  await expect(etat).toBeVisible();

  // Ce qui a déjà été dit est LÀ : la passe 2 a répondu « fini » et
  // « je l'avais » sur cette ligne, et le panneau le remontre.
  await expect(etat.getByRole("button", { name: "Fini" }))
    .toHaveAttribute("aria-pressed", "true");
  await expect(etat.getByRole("button", { name: "Je l'avais" }))
    .toHaveAttribute("aria-pressed", "true");

  await toucher(etat.getByRole("button", { name: "Mon préféré" }).click());
  await expect(etat.getByRole("button", { name: "Mon préféré" }))
    .toHaveAttribute("aria-pressed", "true");

  await toucher(page.getByRole("button", { name: /Fermer sans corriger/ }).click());

  // Et il SURVIT au rechargement du panneau : relu, pas gardé en mémoire.
  await toucher(ligneFinie.getByTestId("moment-corriger").click());
  await expect(page.getByTestId("panneau-etat")
    .getByRole("button", { name: "Mon préféré" }))
    .toHaveAttribute("aria-pressed", "true");
  await toucher(page.getByRole("button", { name: /Fermer sans corriger/ }).click());

  // --- 8. les trous sont des invitations (E03) ---------------------------
  //
  // « Une décennie vide n'est pas un défaut d'affichage : c'est l'endroit
  // exact où proposer E02. C'est le mécanisme de relance le plus naturel du
  // produit, et il ne coûte aucune notification. » Le lien E03 → E02
  // n'existait que dans un sens.
  //
  // Le profil ne couvre que 1990–1994 : tout ce qui suit est un trou.
  const invitations = page.getByTestId("trou");
  await expect(invitations.first()).toBeVisible();

  // **Il a une hauteur.** Un trou déclaré en attribut et invisible à l'écran
  // ne relance personne — c'est le défaut qu'avait déjà la bande d'époque.
  const hauteurTrou = await invitations.first()
    .evaluate((n) => n.getBoundingClientRect().height);
  expect(hauteurTrou, "l'invitation à compléter n'a aucune hauteur")
    .toBeGreaterThan(24);

  // Il NOMME ses années. La décennie 1990 est COUVERTE — la période déclarée
  // est 1990–1994, et un chevauchement suffit à remplir une décennie —, donc
  // la première invitation porte sur les années 2000. Attendre « 1995 » ici
  // était ma propre erreur de lecture, et le parcours l'a dite.
  await expect(invitations.first()).toContainText("2000");
  await expect(invitations.first()).toContainText("2009");

  await toucher(invitations.first().getByRole("button").click());

  // On revient au choix de machine — E02 est une liste PAR PLATEFORME, et il
  // n'y en a aucune de choisie quand on lit son axe.
  await expect(page.getByRole("heading", { name: /console/i })).toBeVisible();
  await toucher(
    page.getByRole("button", { name: /^Super Nintendo Entertainment System/ }).click(),
  );

  // Et la période du TROU est posée, pas celle de l'aller.
  await expect(page.getByTestId("contexte")).toContainText("2000\u20132009");
  await expect(page.getByTestId("contexte")).not.toContainText(PERIODE_LUE);

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
  // Un geste de plus : la continuation du temps 3. Il est VOULU et il se
  // paie — §24.4 veut le bénéfice PENDANT la saisie, pas à la fin, et E01
  // fait de cet écran celui où se joue le KPI de première session. Le nier
  // au budget reviendrait à cacher ce que la décision coûte.
  // Deux gestes de plus : chercher, puis vider. Le filtre est FACULTATIF —
  // aucune des trente lignes ne le paie — mais le parcours le paie, et ce
  // qu'il coûte doit se voir : c'est la seule façon de savoir s'il reste
  // dans le budget « un tap par jeu » le jour où il servira vraiment.
  // Deux gestes de plus : ouvrir la fiche d'un jeu, et en revenir. C'est de
  // la LECTURE — le budget de §22.3 mesure l'effort de saisie —, mais un
  // geste reste un geste, et le compter est ce qui empêche la lecture de
  // grignoter le budget de la saisie sans qu'on s'en aperçoive.
  // Deux gestes de plus : accepter l'invitation d'un trou, et rechoisir la
  // console. C'est la RELANCE d'E03 — le mécanisme le moins cher du produit
  // —, et elle coûte deux gestes qu'il vaut mieux voir dans le budget que
  // découvrir en session.
  // Cinq gestes de plus : ouvrir le panneau de correction, ses deux
  // échappatoires — « je ne sais plus » puis « plutôt une période », pour
  // éprouver que la section se referme et se rouvre —, et enregistrer. C'est
  // de la CORRECTION, pas de la saisie ; le budget de §22.3 mesure l'effort
  // de reconstruction, mais un geste reste un geste.
  // Quatre gestes de plus : rouvrir le panneau, déplier « préciser »,
  // choisir « un mois précis », enregistrer. Le repli est FACULTATIF — rien
  // dans le parcours nominal ne l'ouvre —, mais ce qu'il coûte doit se voir.
  // Cinq gestes de plus : rouvrir le panneau, désigner « mon préféré », le
  // fermer, le rouvrir pour vérifier que l'affect a SURVÉCU, refermer. Le
  // quatre derniers sont une vérification que seul ce test peut faire ; ils
  // sont comptés quand même, parce qu'un budget qui choisit ce qu'il compte
  // ne mesure plus rien.
  const budget = TITRES_A_COCHER + 43;
  expect(gestes, `${gestes} gestes pour ${MOMENTS_ATTENDUS} titres`).toBeLessThanOrEqual(budget);

  await infos.attach("gestes", { body: String(gestes), contentType: "text/plain" });
});
