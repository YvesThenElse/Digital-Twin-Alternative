import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  SelectionMassive,
  type LotDeclaration,
  type ReponseDeclaration,
} from "./SelectionMassive";
import type { Oeuvre } from "./types";

const oeuvres: Oeuvre[] = [
  { id: "w1", titre: "Super Mario World", rang: 1, sortie: { kind: "Year", year: 1990 }, couverture: null, regions: ["PAL"], statutRegional: {} },
  { id: "w2", titre: "A Link to the Past", rang: 2, sortie: { kind: "Year", year: 1991 }, couverture: null, regions: ["PAL"], statutRegional: {} },
  { id: "w3", titre: "Chrono Trigger", rang: 3, sortie: { kind: "Year", year: 1995 }, couverture: null, regions: ["NTSC-J"], statutRegional: { PAL: "notReleased" } },
];

function monter(surcharge: Partial<Parameters<typeof SelectionMassive>[0]> = {}) {
  // Le faux rend ce que l'API rend : les revendications qu'elle a frappées.
  // Un faux qui rendrait `undefined` laisserait passer un composant incapable
  // de lire la réponse — et c'est exactement le chemin que ce bloc vérifie.
  const envoyer = vi.fn(async (lot: LotDeclaration) => ({
    claims: lot.entries
      .filter((e): e is { title: string } => "title" in e)
      .map((e, i) => ({ title: e.title, id: `ucl_faux_${i}` })),
  }));
  const ecrireSouvenir = vi.fn().mockResolvedValue(undefined);
  const recharger = vi.fn();
  const rendu = render(
    <SelectionMassive
      oeuvres={oeuvres}
      region="PAL"
      disposition="liste"
      envoyer={envoyer}
      ecrireSouvenir={ecrireSouvenir}
      recharger={recharger}
      etatInitial={[]}
      {...surcharge}
    />,
  );
  return { envoyer, ecrireSouvenir, recharger, rendu };
}

const bande = () => screen.getByTestId("bande-epoque");
const lignes = () => screen.getAllByRole("button", { name: /déclarer|déclaré/i });

describe("SelectionMassive — la restitution immédiate (§24.4)", () => {
  it("n'affiche aucune bande tant que rien n'est déclaré", () => {
    monter();

    expect(bande()).toHaveAttribute("data-total", "0");
    expect(bande()).toHaveAttribute("data-tranches", "0");
  });

  it("fait grandir la bande dès le premier titre coché", async () => {
    // LE test de l'item. Un POC qui ne montre le résultat qu'à la fin ne
    // teste pas la bonne chose : c'est pendant la saisie que l'utilisateur
    // décide s'il continue.
    const utilisateur = userEvent.setup();
    monter();

    await utilisateur.click(lignes()[0]);

    expect(bande()).toHaveAttribute("data-total", "1");
    expect(bande()).toHaveAttribute("data-tranches", "1");
  });

  it("ne recharge jamais la liste quand on coche", async () => {
    // Recharger coûterait un aller-retour par clic, sur l'écran dont tout le
    // budget est « un tap par jeu ». L'état déclaré est LOCAL ; l'envoi ne
    // conditionne pas l'affichage.
    const utilisateur = userEvent.setup();
    const { recharger } = monter();

    await utilisateur.click(lignes()[0]);
    await utilisateur.click(lignes()[1]);

    expect(recharger).not.toHaveBeenCalled();
  });

  it("montre la bande s'étendre à mesure que la période s'élargit", async () => {
    const utilisateur = userEvent.setup();
    monter();

    await utilisateur.click(lignes()[0]); // 1990
    expect(bande()).toHaveAttribute("data-tranches", "1");

    await utilisateur.click(lignes()[2]); // 1995 → 1990..1995
    expect(bande()).toHaveAttribute("data-tranches", "6");
    expect(bande()).toHaveTextContent("1990");
    expect(bande()).toHaveTextContent("1995");
  });

  it("décocher rétrécit la bande — la déclaration est révisable", async () => {
    // Invariant 10 : jamais de refus. Se tromper de ligne est le geste le
    // plus fréquent d'un écran où l'on coche vite.
    const utilisateur = userEvent.setup();
    monter();

    await utilisateur.click(lignes()[0]);
    await utilisateur.click(lignes()[0]);

    expect(bande()).toHaveAttribute("data-total", "0");
  });

  it("la ligne entière est la cible, pas une case à cocher", async () => {
    // Quatre cibles de 44 px par ligne occupent 200 px et ne laissent que
    // 143 px de titre sur un écran de 375 px — sur l'écran dont toute la
    // mécanique repose sur la reconnaissance.
    const utilisateur = userEvent.setup();
    monter();

    const ligne = lignes()[0];
    expect(within(ligne).getByText("Super Mario World")).toBeInTheDocument();
    expect(within(ligne).getByText("1990")).toBeInTheDocument();

    await utilisateur.click(within(ligne).getByText("Super Mario World"));
    expect(bande()).toHaveAttribute("data-total", "1");
  });

  it("compte un titre sans année sans le placer sur la bande", async () => {
    const utilisateur = userEvent.setup();
    monter({
      oeuvres: [
        { id: "x", titre: "Sans date", rang: 1, sortie: null, couverture: null, regions: [], statutRegional: {} },
      ],
    });

    await utilisateur.click(lignes()[0]);

    expect(bande()).toHaveAttribute("data-total", "1");
    expect(bande()).toHaveAttribute("data-tranches", "0");
    expect(bande()).toHaveAttribute("data-sans-date", "1");
  });

  it("présente les titres par notoriété décroissante", async () => {
    // §3.3 : « l'application montre les principaux jeux de la plateforme »
    // n'a pas de sens sans un ordre, et c'est le rang qui le donne. Rendre
    // dans l'ordre d'arrivée ferait dépendre l'écran de l'API.
    monter({
      oeuvres: [
        { id: "c", titre: "Troisième", rang: 3, sortie: { kind: "Year", year: 1995 }, couverture: null, regions: [], statutRegional: {} },
        { id: "a", titre: "Premier", rang: 1, sortie: { kind: "Year", year: 1990 }, couverture: null, regions: [], statutRegional: {} },
        { id: "b", titre: "Deuxième", rang: 2, sortie: { kind: "Year", year: 1992 }, couverture: null, regions: [], statutRegional: {} },
      ],
    });

    // On assert l'ORDRE DES TITRES, pas le texte entier de la ligne :
    // comparer `textContent` couplait ce test à tout ce que la ligne affiche,
    // et l'ajout de l'indication régionale l'a cassé sans que rien n'ait
    // changé à l'ordre.
    const titres = lignes().map((l) => within(l).getAllByText(/^(Premier|Deuxième|Troisième)$/)[0].textContent);
    expect(titres).toEqual(["Premier", "Deuxième", "Troisième"]);
  });

  it("dit à la machine ce qui est déclaré, pas seulement à l'œil", async () => {
    // Le lecteur d'écran doit annoncer l'état, et l'icône de fin de ligne ne
    // le dit qu'aux voyants. `aria-pressed` porte l'état lisible.
    const utilisateur = userEvent.setup();
    monter();

    expect(lignes()[0]).toHaveAttribute("aria-pressed", "false");
    await utilisateur.click(lignes()[0]);
    expect(lignes()[0]).toHaveAttribute("aria-pressed", "true");
  });

  // ------------------------------------------ l'incertitude, à l'écran

  it.each([
    {
      nom: "au jour",
      sortie: { kind: "ExactDate" as const, date: "1994-03-15" },
      texte: "15 mars 1994",
      forme: "point-plein",
    },
    {
      nom: "au mois",
      sortie: { kind: "Month" as const, year: 1994, month: 3 },
      texte: "mars 1994",
      forme: "point",
    },
    {
      nom: "à l'année",
      sortie: { kind: "Year" as const, year: 1994 },
      texte: "1994",
      forme: "point-creux",
    },
  ])("affiche une sortie datée $nom avec sa propre précision", ({ sortie, texte, forme }) => {
    monter({
      oeuvres: [{ id: "x", titre: "Un jeu", rang: 1, sortie, couverture: null, regions: [], statutRegional: {} }],
    });

    const date = screen.getByText(texte);
    expect(date).toHaveAttribute("data-forme", forme);
  });

  it("n'affiche jamais une sortie datée à l'année comme une date au jour", () => {
    // LE point de l'item. 31 sorties du dataset ne sont datées qu'à l'année :
    // les rendre « 1er janvier 1994 » affirmerait un jour que la source ne
    // donne pas, et le joueur corrigerait une date que personne n'a écrite.
    monter({
      oeuvres: [
        {
          id: "x", titre: "Un jeu", rang: 1,
          sortie: { kind: "Year", year: 1994 },
          couverture: null, regions: [], statutRegional: {},
        },
      ],
    });

    const ligne = lignes()[0];
    expect(ligne).toHaveTextContent("1994");
    expect(ligne).not.toHaveTextContent(/janvier|1er/);
  });

  it("distingue à l'œil une sortie à l'année d'une sortie au jour", () => {
    // Même si les deux tombent sur 1994. Sans la forme, la liste laisserait
    // croire que toutes les dates se valent.
    monter({
      oeuvres: [
        { id: "j", titre: "Au jour", rang: 1, sortie: { kind: "ExactDate", date: "1994-03-15" }, couverture: null, regions: [], statutRegional: {} },
        { id: "a", titre: "À l'année", rang: 2, sortie: { kind: "Year", year: 1994 }, couverture: null, regions: [], statutRegional: {} },
      ],
    });

    expect(screen.getByText("15 mars 1994")).toHaveAttribute("data-forme", "point-plein");
    expect(screen.getByText("1994")).toHaveAttribute("data-forme", "point-creux");
  });

  it("dit qu'une sortie n'est pas datée, plutôt que de laisser un blanc", () => {
    // Un tiret ou une case vide se lit comme un défaut d'affichage. Le dire
    // en toutes lettres distingue « on ne sait pas » de « il manque quelque
    // chose ».
    monter({
      oeuvres: [{ id: "x", titre: "Un jeu", rang: 1, sortie: null, couverture: null, regions: [], statutRegional: {} }],
    });

    expect(screen.getByText("date inconnue")).toHaveAttribute("data-forme", "aucune");
  });

  // ------------------------------------------ la région, à l'écran (§3.4)

  const lignePour = (titre: string) =>
    lignes().find((l) => l.textContent?.includes(titre))!;

  type PartielRegion = Pick<Oeuvre, "couverture" | "regions" | "statutRegional">;

  it.each<{ nom: string; oeuvre: PartielRegion; statut: string; texte: RegExp }>([
    { nom: "sorti", oeuvre: { couverture: null, regions: ["PAL"], statutRegional: {} }, statut: "sorti", texte: /Sorti en Europe/ },
    { nom: "jamais sorti", oeuvre: { couverture: null, regions: ["NTSC-J"], statutRegional: { PAL: "notReleased" as const } }, statut: "jamais-sorti", texte: /Jamais sorti en Europe/ },
    { nom: "inconnu", oeuvre: { couverture: null, regions: ["NTSC-U"], statutRegional: {} }, statut: "inconnu", texte: /inconnue/ },
    { nom: "mondiale", oeuvre: { couverture: null, regions: ["WORLDWIDE"], statutRegional: {} }, statut: "mondiale", texte: /mondiale/ },
  ])("affiche « $nom » distinctement sur la ligne", ({ oeuvre: partiel, statut, texte }) => {
    monter({
      oeuvres: [{
        id: "x", titre: "Un jeu", rang: 1,
        sortie: { kind: "Year", year: 1994 },
        ...partiel,
      }],
    });

    const indication = screen.getByText(texte);
    expect(indication).toHaveAttribute("data-statut", statut);
    expect(indication).toHaveAttribute("data-region", "PAL");
  });

  it("aucun des quatre états ne se rend par l'absence d'indication", () => {
    // LE point de l'item. Un état muet serait indistinguable d'un défaut
    // d'affichage, et les trois autres perdraient le sens que leur donne le
    // contraste.
    monter({
      oeuvres: [
        { id: "a", titre: "Sorti", rang: 1, sortie: null, couverture: null, regions: ["PAL"], statutRegional: {} },
        { id: "b", titre: "Jamais", rang: 2, sortie: null, couverture: null, regions: ["NTSC-J"], statutRegional: { PAL: "notReleased" } },
        { id: "c", titre: "Inconnu", rang: 3, sortie: null, couverture: null, regions: ["NTSC-U"], statutRegional: {} },
        { id: "d", titre: "Monde", rang: 4, sortie: null, couverture: null, regions: ["WORLDWIDE"], statutRegional: {} },
      ],
    });

    // Sélection par l'ATTRIBUT et non par le texte : chercher /sorti/ dans la
    // ligne attrape aussi le titre « Sorti » et la date « date inconnue ».
    // C'est exactement ce pour quoi `data-statut` existe.
    const statuts = ["Sorti", "Jamais", "Inconnu", "Monde"].map((titre) => {
      const indication = lignePour(titre).querySelector("[data-statut]")!;
      return {
        etat: indication.getAttribute("data-statut"),
        texte: indication.textContent?.trim() ?? "",
      };
    });

    // Quatre états distincts, quatre textes distincts, aucun vide.
    expect(new Set(statuts.map((s) => s.etat)).size).toBe(4);
    expect(new Set(statuts.map((s) => s.texte)).size).toBe(4);
    for (const s of statuts) expect(s.texte.length).toBeGreaterThan(0);
  });

  it("suit la région de l'écran, pas une région par défaut", () => {
    // La décision « international dès le départ » interdit de traiter une
    // région comme le repli des autres. Le même jeu se lit différemment selon
    // l'écran depuis lequel on le regarde.
    const oeuvre = {
      id: "x", titre: "Chrono Trigger", rang: 1,
      sortie: { kind: "Year" as const, year: 1995 },
      couverture: null, regions: ["NTSC-J", "NTSC-U"],
      statutRegional: { PAL: "notReleased" as const },
    };

    const { rendu } = monter({ oeuvres: [oeuvre], region: "PAL" });
    expect(screen.getByText(/Jamais sorti en Europe/)).toBeInTheDocument();

    rendu.unmount();
    monter({ oeuvres: [oeuvre], region: "NTSC-J" });
    expect(screen.getByText(/Sorti en Japon/)).toBeInTheDocument();
  });

  // ---------------------------- deux dispositions, pas une étirée (§6)

  const liste = () => screen.getByRole("list");

  it("balaye du TEXTE en liste : pas de tuile sur mobile", () => {
    // « On balaye une liste sur téléphone, une grille sur écran large. »
    // Mettre des vignettes dans la liste dense volerait la place du titre,
    // qui est ce que l'œil cherche.
    const { rendu } = monter({ disposition: "liste" });

    expect(liste()).toHaveAttribute("data-disposition", "liste");
    expect(rendu.container.querySelector("[data-tuile]")).toBeNull();
  });

  it("tient la hauteur de ligne de 56 px en liste", () => {
    // La densité vient du nombre d'éléments visibles, jamais de la
    // compression des cibles : 56 px de ligne pour une cible ≥ 44 px.
    monter({ disposition: "liste" });

    const items = liste().querySelectorAll("li");
    expect(items).toHaveLength(3);
    for (const item of items) expect(item).toHaveAttribute("data-hauteur", "56");
  });

  it("balaye des IMAGES en grille : une tuile par jeu", () => {
    const { rendu } = monter({ disposition: "grille" });

    expect(liste()).toHaveAttribute("data-disposition", "grille");
    expect(rendu.container.querySelectorAll("[data-tuile]")).toHaveLength(3);
  });

  it("ne contraint pas la hauteur en grille", () => {
    // La grille n'est pas une liste étirée : imposer 56 px y écraserait la
    // tuile, dont le format 3:4 est ce qui rend la grille régulière.
    monter({ disposition: "grille" });

    for (const item of liste().querySelectorAll("li")) {
      expect(item).not.toHaveAttribute("data-hauteur");
    }
  });

  it("compose une tuile pour un jeu sans jaquette, jamais un trou", () => {
    // Trois œuvres sur 221 n'en auront jamais. Un vide dans la grille se
    // lirait comme un défaut de chargement.
    const { rendu } = monter({
      disposition: "grille",
      oeuvres: [
        { id: "a", titre: "Avec", rang: 1, sortie: { kind: "Year", year: 1990 }, couverture: "/a.png", regions: [], statutRegional: {} },
        { id: "b", titre: "Sans", rang: 2, sortie: { kind: "Year", year: 1990 }, couverture: null, regions: [], statutRegional: {} },
      ],
    });

    const tuiles = [...rendu.container.querySelectorAll("[data-tuile]")];
    expect(tuiles.map((t) => t.getAttribute("data-tuile"))).toEqual(["jaquette", "generee"]);
    // Les deux gardent le même format : la grille ne paraît pas rapiécée.
    expect(tuiles.every((t) => t.getAttribute("data-ratio") === "3:4")).toBe(true);

    // Et la composée MONTRE son titre. Un aplat de couleur sans texte serait
    // exactement le trou que cet item interdit — l'œil le lirait comme une
    // image qui n'a pas chargé.
    const composee = tuiles[1];
    expect(composee.querySelector('[data-role="titre-tuile"]')?.textContent).toBe("Sans");
    expect((composee as HTMLElement).style.backgroundColor).not.toBe("");
  });

  it("garde la cellule entière comme cible dans les deux dispositions", async () => {
    // Le budget d'un tap par jeu ne dépend pas de l'écran.
    const utilisateur = userEvent.setup();
    const { rendu } = monter({ disposition: "grille" });

    await utilisateur.click(lignes()[0]);

    expect(bande()).toHaveAttribute("data-total", "1");
    rendu.unmount();

    monter({ disposition: "liste" });
    await utilisateur.click(lignes()[0]);
    expect(bande()).toHaveAttribute("data-total", "1");
  });

  // ------------------------------------------------ le souvenir (§9)

  const souvenirDe = (titre: string) =>
    within(lignePour(titre).closest("li")!).queryByRole("textbox");

  it("ne propose pas d'écrire un souvenir sur une ligne non déclarée", async () => {
    // L'écran le plus dense du produit : une zone de texte par ligne non
    // cochée occuperait la place et suggérerait un travail à faire.
    monter();

    expect(souvenirDe("Super Mario World")).toBeNull();
  });

  it("propose d'écrire un souvenir dès qu'une ligne est déclarée", async () => {
    // « Sans quitter la sélection » : le champ apparaît sur place. Ouvrir un
    // écran pour une phrase casserait le rythme de la saisie.
    const utilisateur = userEvent.setup();
    monter();

    await utilisateur.click(lignes()[0]);

    expect(souvenirDe("Super Mario World")).toBeInTheDocument();
  });

  it("enregistre le souvenir saisi, sans quitter l'écran", async () => {
    const utilisateur = userEvent.setup();
    const { ecrireSouvenir } = monter();

    await utilisateur.click(lignes()[0]);
    const champ = souvenirDe("Super Mario World")!;
    await utilisateur.type(champ, "Noël 1992, chez ma grand-mère.");
    await utilisateur.tab();

    expect(ecrireSouvenir).toHaveBeenCalledWith(
      { kind: "work", id: "w1" }, "Noël 1992, chez ma grand-mère.");
  });

  it("n'enregistre rien quand le champ reste vide", async () => {
    // §9 est un complément, jamais un passage obligé : exiger une phrase par
    // jeu détruirait le budget d'un tap par ligne.
    const utilisateur = userEvent.setup();
    const { ecrireSouvenir } = monter();

    await utilisateur.click(lignes()[0]);
    await utilisateur.click(souvenirDe("Super Mario World")!);
    await utilisateur.tab();

    expect(ecrireSouvenir).not.toHaveBeenCalled();
  });

  it("garde le texte à l'écran après l'enregistrement", async () => {
    // Le voir disparaître ferait croire à une perte — sur le contenu le plus
    // précieux du produit, et le seul qui ne soit pas régénérable.
    const utilisateur = userEvent.setup();
    monter();

    await utilisateur.click(lignes()[0]);
    await utilisateur.type(souvenirDe("Super Mario World")!, "Une phrase.");
    await utilisateur.tab();

    expect(souvenirDe("Super Mario World")).toHaveValue("Une phrase.");
  });

  it("décocher une ligne ne détruit pas le souvenir déjà écrit", async () => {
    // Se tromper de ligne est le geste le plus fréquent de cet écran. Perdre
    // une phrase à cause d'un tap mal placé serait impardonnable.
    const utilisateur = userEvent.setup();
    monter();

    await utilisateur.click(lignes()[0]);
    await utilisateur.type(souvenirDe("Super Mario World")!, "Une phrase.");
    await utilisateur.tab();
    await utilisateur.click(lignes()[0]); // on décoche
    await utilisateur.click(lignes()[0]); // on recoche

    expect(souvenirDe("Super Mario World")).toHaveValue("Une phrase.");
  });

  // ---------------------------------------------------- l'envoi, en arrière-plan

  it("n'attend pas le serveur pour montrer le résultat", async () => {
    // L'envoi est déclenché, l'affichage ne l'attend pas. Sinon la
    // récompense arrive après la latence, et §24.4 n'est pas tenu.
    const utilisateur = userEvent.setup();
    let resoudre: (() => void) | undefined;
    const envoyer = vi.fn(
      () => new Promise<ReponseDeclaration>((r) => { resoudre = () => r({ claims: [] }); }),
    );
    monter({ envoyer });

    await utilisateur.click(lignes()[0]);

    expect(bande()).toHaveAttribute("data-total", "1");
    expect(resoudre).toBeDefined();
  });

  it("un échec d'envoi ne fait pas disparaître ce que l'utilisateur a coché", async () => {
    // Le pire scénario d'un affichage optimiste : voir son travail
    // s'effacer. On signale l'échec, on ne défait rien — c'est le joueur qui
    // décide de réessayer.
    const utilisateur = userEvent.setup();
    const envoyer = vi.fn().mockRejectedValue(new Error("réseau"));
    monter({ envoyer });

    await utilisateur.click(lignes()[0]);

    expect(bande()).toHaveAttribute("data-total", "1");
    expect(await screen.findByRole("alert")).toHaveTextContent(/enregistr/i);
  });

  it("n'envoie rien tant que rien n'est déclaré", async () => {
    const { envoyer } = monter();
    expect(envoyer).not.toHaveBeenCalled();
  });

  it("envoie la déclaration avec son identifiant de lot", async () => {
    // §4.4 : les titres cochés d'un coup forment UN épisode. Sans
    // identifiant de lot, la timeline montrerait une pile de points.
    const utilisateur = userEvent.setup();
    const { envoyer } = monter();

    await utilisateur.click(lignes()[0]);

    expect(envoyer).toHaveBeenCalledTimes(1);
    const lot = envoyer.mock.calls[0][0];
    expect(lot.batchId).toMatch(/^bat_/);
    expect(lot.entries).toEqual([{ workId: "w1" }]);
  });

  it("garde le même lot pour une salve de clics", async () => {
    // Un lot par clic ferait douze épisodes d'un même passage. Le lot est le
    // PASSAGE sur l'écran, pas le geste.
    const utilisateur = userEvent.setup();
    const { envoyer } = monter();

    await utilisateur.click(lignes()[0]);
    await utilisateur.click(lignes()[1]);

    const lots = envoyer.mock.calls.map((appel) => appel[0].batchId);
    expect(new Set(lots).size).toBe(1);
  });
});

describe("SelectionMassive — le jeu absent est un cas nominal (§3.5)", () => {
  const champ = () => screen.getByRole("textbox", { name: /titre absent/i });
  const ajouter = () => screen.getByRole("button", { name: /ajouter ce titre/i });

  it("offre l'issue de secours même quand la liste est pleine", () => {
    // « Elle reste présente même quand il y a des résultats, car le bon jeu
    // peut manquer au milieu de dix mauvais » (E06). Une issue qui
    // n'apparaîtrait qu'une fois la liste vide ne servirait jamais : la
    // liste n'est jamais vide sur cet écran.
    monter();

    expect(champ()).toBeInTheDocument();
    expect(ajouter()).toBeInTheDocument();
  });

  it("envoie le titre libre dans le MÊME lot que les titres cochés", async () => {
    // Le lot est le PASSAGE sur l'écran (§4.4). Ouvrir un second lot pour le
    // titre saisi le détacherait de l'épisode : sur la timeline il
    // apparaîtrait comme un moment isolé, alors que le joueur l'a déclaré
    // dans le même geste que les autres.
    const utilisateur = userEvent.setup();
    const { envoyer } = monter();

    await utilisateur.click(lignes()[0]);
    await utilisateur.type(champ(), "Le jeu de mon cousin");
    await utilisateur.click(ajouter());

    expect(envoyer).toHaveBeenCalledTimes(2);
    const [coche, libre] = envoyer.mock.calls.map((appel) => appel[0]);
    expect(libre.batchId).toBe(coche.batchId);
    expect(libre.entries).toEqual([{ title: "Le jeu de mon cousin" }]);
  });

  it("n'envoie ni un champ vide ni des espaces", async () => {
    // Rien à garder. Accepter produirait une revendication sans titre, que
    // plus aucun écran ne saurait nommer.
    const utilisateur = userEvent.setup();
    const { envoyer } = monter();

    await utilisateur.click(ajouter());
    await utilisateur.type(champ(), "   ");
    await utilisateur.click(ajouter());

    expect(envoyer).not.toHaveBeenCalled();
  });

  it("montre le titre ajouté sans le confondre avec une œuvre curée", async () => {
    // Il « apparaît comme les autres » — mais jamais AU MÊME TITRE : une
    // saisie libre n'a ni fiche, ni notoriété, ni statut régional, et la
    // présenter comme une entrée du référentiel ferait croire à une donnée
    // vérifiée là où il n'y a qu'un souvenir.
    const utilisateur = userEvent.setup();
    monter();

    await utilisateur.type(champ(), "Le jeu de mon cousin");
    await utilisateur.click(ajouter());

    const ajoute = screen.getByTestId("titre-libre");
    expect(ajoute).toHaveTextContent("Le jeu de mon cousin");
    expect(ajoute).toHaveAttribute("data-canonique", "false");

    // Et la marque est LUE, pas seulement posée pour la machine
    // (apprentissage 44) : `data-canonique` ne dit rien à un joueur, et
    // l'utilisateur qui relit sa liste doit voir pourquoi cette ligne n'a ni
    // date ni statut régional. Sans la phrase, elle se lirait comme une
    // entrée du référentiel dont les données manquent.
    expect(ajoute).toHaveTextContent(/hors du référentiel/i);

    // Les lignes du référentiel, elles, ne portent pas cette marque.
    expect(screen.getAllByTestId("titre-libre")).toHaveLength(1);
  });

  it("compte le titre ajouté dans la récompense, sans le placer sur la bande", async () => {
    // §24.4 : la récompense arrive PENDANT la saisie. Un titre saisi qui ne
    // ferait pas bouger la bande dirait à l'utilisateur que son geste n'a
    // rien produit — et c'est justement le geste le plus fragile de l'écran.
    // Sans date, il est compté et jamais placé, comme un jeu non daté.
    const utilisateur = userEvent.setup();
    monter();

    await utilisateur.type(champ(), "Le jeu de mon cousin");
    await utilisateur.click(ajouter());

    expect(bande()).toHaveAttribute("data-total", "1");
    expect(bande()).toHaveAttribute("data-tranches", "0");
  });

  it("vide le champ après l'ajout, pour que le suivant s'enchaîne", async () => {
    // Sur 221 titres, le cas se répète. Obliger à effacer sa propre saisie
    // ajouterait un geste par titre manquant, sur l'écran dont tout le
    // budget est « un tap par jeu ».
    const utilisateur = userEvent.setup();
    const { envoyer } = monter();

    await utilisateur.type(champ(), "Le jeu de mon cousin");
    await utilisateur.click(ajouter());
    expect(champ()).toHaveValue("");

    // Et un second clic ne renvoie pas le même titre : rien n'est saisi.
    await utilisateur.click(ajouter());
    expect(envoyer).toHaveBeenCalledTimes(1);
  });

  it("accepte deux titres libres sans les confondre", async () => {
    const utilisateur = userEvent.setup();
    monter();

    await utilisateur.type(champ(), "Le jeu de mon cousin");
    await utilisateur.click(ajouter());
    await utilisateur.type(champ(), "Celui avec le dragon bleu");
    await utilisateur.click(ajouter());

    expect(screen.getAllByTestId("titre-libre").map((n) => n.textContent))
      .toEqual(expect.arrayContaining([
        expect.stringContaining("Le jeu de mon cousin"),
        expect.stringContaining("Celui avec le dragon bleu"),
      ]));
    expect(bande()).toHaveAttribute("data-total", "2");
  });

  it("un échec d'envoi se dit sans effacer ce que l'utilisateur a saisi", async () => {
    // Même règle que pour les lignes cochées : voir son travail s'effacer
    // est le pire scénario d'un affichage optimiste.
    const utilisateur = userEvent.setup();
    monter({ envoyer: vi.fn().mockRejectedValue(new Error("réseau")) });

    await utilisateur.type(champ(), "Le jeu de mon cousin");
    await utilisateur.click(ajouter());

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByTestId("titre-libre")).toHaveTextContent("Le jeu de mon cousin");
  });

  it("rogne les bords de la saisie sans toucher au milieu", async () => {
    const utilisateur = userEvent.setup();
    const { envoyer } = monter();

    await utilisateur.type(champ(), "  Zelda  II : The Adventure of Link  ");
    await utilisateur.click(ajouter());

    expect(envoyer.mock.calls[0][0].entries)
      .toEqual([{ title: "Zelda  II : The Adventure of Link" }]);
  });
});

describe("SelectionMassive — un souvenir sur un titre saisi (§9)", () => {
  const champ = () => screen.getByRole("textbox", { name: /titre absent/i });
  const ajouter = () => screen.getByRole("button", { name: /ajouter ce titre/i });
  const souvenirLibre = () =>
    screen.queryByRole("textbox", { name: /Un souvenir sur Le jeu de mon cousin/ });

  async function ajouterUnTitre(utilisateur: ReturnType<typeof userEvent.setup>) {
    await utilisateur.type(champ(), "Le jeu de mon cousin");
    await utilisateur.click(ajouter());
  }

  it("propose d'écrire un souvenir sur un titre saisi", async () => {
    // C'est là que vit le contenu le plus personnel du produit : un jeu
    // absent du référentiel est souvent un jeu dont on se souvient
    // précisément parce qu'il est obscur. L'offrir sur les seules lignes
    // curées réserverait le souvenir aux titres dont on se souvient le moins.
    const utilisateur = userEvent.setup();
    monter();

    await ajouterUnTitre(utilisateur);

    expect(souvenirLibre()).toBeInTheDocument();
  });

  it("attache le souvenir à la REVENDICATION, jamais à une œuvre", async () => {
    // L'identifiant est frappé par l'API et rendu dans la réponse ; celui que
    // le composant s'est donné ne quitte pas le navigateur. Envoyer ce
    // dernier écrirait un souvenir sur une cible que la base ne connaît pas.
    const utilisateur = userEvent.setup();
    const { ecrireSouvenir } = monter();

    await ajouterUnTitre(utilisateur);
    await utilisateur.type(souvenirLibre()!, "Le dragon était bleu.");
    await utilisateur.tab();

    expect(ecrireSouvenir).toHaveBeenCalledWith(
      { kind: "unresolvedClaim", id: "ucl_faux_0" }, "Le dragon était bleu.");
  });

  it("n'offre pas le champ quand la déclaration a échoué, et le dit", async () => {
    // Sans revendication, un souvenir n'a nulle part où aller. Offrir le
    // champ quand même laisserait l'utilisateur écrire la phrase la plus
    // personnelle du produit dans le vide. L'absence du champ ne suffit pas
    // à l'expliquer : l'alerte le dit.
    const utilisateur = userEvent.setup();
    monter({ envoyer: vi.fn().mockRejectedValue(new Error("réseau")) });

    await ajouterUnTitre(utilisateur);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(souvenirLibre()).toBeNull();
  });

  it("garde chaque souvenir sur son propre titre saisi", async () => {
    const utilisateur = userEvent.setup();
    const { ecrireSouvenir } = monter();

    await ajouterUnTitre(utilisateur);
    await utilisateur.type(champ(), "Celui avec le dragon bleu");
    await utilisateur.click(ajouter());

    await utilisateur.type(souvenirLibre()!, "Chez mon cousin.");
    await utilisateur.tab();

    expect(ecrireSouvenir).toHaveBeenCalledTimes(1);
    expect(ecrireSouvenir).toHaveBeenCalledWith(
      { kind: "unresolvedClaim", id: "ucl_faux_0" }, "Chez mon cousin.");
  });
});

describe("SelectionMassive — relire ce qui est déjà déclaré", () => {
  it("montre comme déclaré ce qui l'est en base", async () => {
    // Un rechargement montrait TOUTES les lignes décochées alors que les
    // déclarations étaient en base. Le testeur en concluait qu'il avait perdu
    // son travail — le pire mensonge qu'un écran puisse faire sur une saisie
    // de deux heures.
    monter({
      etatInitial: [
        { workId: "w1", played: true, completion: null, provenance: null, neverPlayed: false },
      ],
    });

    expect(screen.getByRole("button", { name: /^Déclaré : Super Mario World$/ }))
      .toBeInTheDocument();
    expect(bande()).toHaveAttribute("data-total", "1");
  });

  it("n'invente aucune déclaration pour un titre absent de l'état", () => {
    monter({
      etatInitial: [
        { workId: "w1", played: true, completion: null, provenance: null, neverPlayed: false },
      ],
    });

    expect(screen.getByRole("button", { name: /^Déclarer : Chrono Trigger$/ }))
      .toBeInTheDocument();
  });

  it("remontre l'achèvement et la provenance déjà enregistrés", () => {
    monter({
      etatInitial: [
        { workId: "w1", played: true, completion: "finished", provenance: "borrowed", neverPlayed: false },
      ],
    });

    expect(screen.getByRole("button", { name: "Fini" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Emprunté" })).toHaveAttribute("aria-pressed", "true");
  });
});

describe("SelectionMassive — la passe 2 (E02)", () => {
  const chip = (nom: string) => screen.getByRole("button", { name: nom });

  it("ne propose d'affiner qu'une ligne DÉCLARÉE", async () => {
    // « La passe 2 n'est jamais imposée » : des chips sur 221 lignes non
    // cochées occuperaient l'écran le plus dense du produit et suggéreraient
    // un travail à faire.
    const utilisateur = userEvent.setup();
    monter();

    expect(screen.queryByRole("button", { name: "Fini" })).toBeNull();
    await utilisateur.click(lignes()[0]);
    expect(chip("Fini")).toBeInTheDocument();
  });

  it("n'envoie rien tant qu'on affine la MÊME ligne", async () => {
    // Changer d'avis sur la ligne en cours ne doit pas atteindre le serveur :
    // le journal est en ajout seul, et deux achèvements contradictoires y
    // resteraient tous les deux.
    const utilisateur = userEvent.setup();
    const { envoyer } = monter();

    await utilisateur.click(lignes()[0]);
    envoyer.mockClear();
    await utilisateur.click(chip("Fini"));
    await utilisateur.click(chip("Abandonné"));

    expect(envoyer).not.toHaveBeenCalled();
  });

  it("envoie l'affinage quand on passe à une autre ligne", async () => {
    const utilisateur = userEvent.setup();
    const { envoyer } = monter();

    await utilisateur.click(lignes()[0]);
    await utilisateur.click(chip("Fini"));
    envoyer.mockClear();
    await utilisateur.click(lignes()[1]);

    expect(envoyer).toHaveBeenCalledWith(expect.objectContaining({
      entries: [{ workId: "w1", completion: "finished", provenance: null }],
    }));
  });

  it("envoie l'affinage en quittant l'écran", async () => {
    // Sans cela, le dernier jeu affiné perdrait sa réponse — et ce serait
    // systématiquement le dernier, donc invisible en test manuel rapide.
    const utilisateur = userEvent.setup();
    const { envoyer, rendu } = monter();

    await utilisateur.click(lignes()[0]);
    await utilisateur.click(chip("Je l'avais"));
    envoyer.mockClear();
    rendu.unmount();

    expect(envoyer).toHaveBeenCalledWith(expect.objectContaining({
      entries: [{ workId: "w1", completion: null, provenance: "owned" }],
    }));
  });

  it("l'affinage part dans le MÊME lot que la ligne cochée", async () => {
    // Sinon il formerait un second épisode, et la timeline montrerait deux
    // moments là où le joueur a fait un seul geste.
    const utilisateur = userEvent.setup();
    const { envoyer } = monter();

    await utilisateur.click(lignes()[0]);
    const lot = envoyer.mock.calls[0][0].batchId;
    await utilisateur.click(chip("Fini"));
    await utilisateur.click(lignes()[1]);

    expect(envoyer.mock.calls.at(-1)![0].batchId).toBe(lot);
  });

  it("porte les deux réponses ensemble", async () => {
    const utilisateur = userEvent.setup();
    const { envoyer } = monter();

    await utilisateur.click(lignes()[0]);
    await utilisateur.click(chip("Abandonné"));
    await utilisateur.click(chip("Chez quelqu'un"));
    await utilisateur.click(lignes()[1]);

    expect(envoyer).toHaveBeenCalledWith(expect.objectContaining({
      entries: [{ workId: "w1", completion: "abandoned", provenance: "elsewhere" }],
    }));
  });

  it("déselectionner une chip la rend à « pas prononcé »", async () => {
    // `null` n'est pas « toujours en cours » : l'un dit qu'on n'a pas
    // répondu, l'autre qu'on y joue encore.
    const utilisateur = userEvent.setup();
    const { envoyer } = monter();

    await utilisateur.click(lignes()[0]);
    await utilisateur.click(chip("Fini"));
    await utilisateur.click(chip("Fini"));
    envoyer.mockClear();
    await utilisateur.click(lignes()[1]);

    expect(envoyer).not.toHaveBeenCalledWith(expect.objectContaining({
      entries: [{ workId: "w1", completion: "finished", provenance: null }],
    }));
  });

  it("ne demande pas la provenance comme une case « possédé »", () => {
    // E02 : poser « possédé ? » à côté d'un geste qui dit déjà « joué » est
    // ambigu. La question du COMMENT couvre le cas fréquent — jouer sans
    // posséder — et rend visible la séparation possession / expérience.
    monter({
      etatInitial: [
        { workId: "w1", played: true, completion: null, provenance: null, neverPlayed: false },
      ],
    });

    expect(screen.queryByRole("button", { name: /^Possédé$/ })).toBeNull();
    expect(screen.getByRole("button", { name: "Chez quelqu'un" })).toBeInTheDocument();
  });
});
