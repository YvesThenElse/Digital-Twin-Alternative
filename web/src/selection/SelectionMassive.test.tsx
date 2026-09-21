import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SelectionMassive } from "./SelectionMassive";
import type { Oeuvre } from "./types";

const oeuvres: Oeuvre[] = [
  { id: "w1", titre: "Super Mario World", rang: 1, sortie: { kind: "Year", year: 1990 }, regions: ["PAL"], statutRegional: {} },
  { id: "w2", titre: "A Link to the Past", rang: 2, sortie: { kind: "Year", year: 1991 }, regions: ["PAL"], statutRegional: {} },
  { id: "w3", titre: "Chrono Trigger", rang: 3, sortie: { kind: "Year", year: 1995 }, regions: ["NTSC-J"], statutRegional: { PAL: "notReleased" } },
];

function monter(surcharge: Partial<Parameters<typeof SelectionMassive>[0]> = {}) {
  const envoyer = vi.fn().mockResolvedValue(undefined);
  const ecrireSouvenir = vi.fn().mockResolvedValue(undefined);
  const recharger = vi.fn();
  const rendu = render(
    <SelectionMassive
      oeuvres={oeuvres}
      region="PAL"
      envoyer={envoyer}
      ecrireSouvenir={ecrireSouvenir}
      recharger={recharger}
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
        { id: "x", titre: "Sans date", rang: 1, sortie: null, regions: [], statutRegional: {} },
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
        { id: "c", titre: "Troisième", rang: 3, sortie: { kind: "Year", year: 1995 }, regions: [], statutRegional: {} },
        { id: "a", titre: "Premier", rang: 1, sortie: { kind: "Year", year: 1990 }, regions: [], statutRegional: {} },
        { id: "b", titre: "Deuxième", rang: 2, sortie: { kind: "Year", year: 1992 }, regions: [], statutRegional: {} },
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
      oeuvres: [{ id: "x", titre: "Un jeu", rang: 1, sortie, regions: [], statutRegional: {} }],
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
          regions: [], statutRegional: {},
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
        { id: "j", titre: "Au jour", rang: 1, sortie: { kind: "ExactDate", date: "1994-03-15" }, regions: [], statutRegional: {} },
        { id: "a", titre: "À l'année", rang: 2, sortie: { kind: "Year", year: 1994 }, regions: [], statutRegional: {} },
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
      oeuvres: [{ id: "x", titre: "Un jeu", rang: 1, sortie: null, regions: [], statutRegional: {} }],
    });

    expect(screen.getByText("date inconnue")).toHaveAttribute("data-forme", "aucune");
  });

  // ------------------------------------------ la région, à l'écran (§3.4)

  const lignePour = (titre: string) =>
    lignes().find((l) => l.textContent?.includes(titre))!;

  it.each([
    { nom: "sorti", oeuvre: { regions: ["PAL"], statutRegional: {} }, statut: "sorti", texte: /Sorti en Europe/ },
    { nom: "jamais sorti", oeuvre: { regions: ["NTSC-J"], statutRegional: { PAL: "notReleased" as const } }, statut: "jamais-sorti", texte: /Jamais sorti en Europe/ },
    { nom: "inconnu", oeuvre: { regions: ["NTSC-U"], statutRegional: {} }, statut: "inconnu", texte: /inconnue/ },
    { nom: "mondiale", oeuvre: { regions: ["WORLDWIDE"], statutRegional: {} }, statut: "mondiale", texte: /mondiale/ },
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
        { id: "a", titre: "Sorti", rang: 1, sortie: null, regions: ["PAL"], statutRegional: {} },
        { id: "b", titre: "Jamais", rang: 2, sortie: null, regions: ["NTSC-J"], statutRegional: { PAL: "notReleased" } },
        { id: "c", titre: "Inconnu", rang: 3, sortie: null, regions: ["NTSC-U"], statutRegional: {} },
        { id: "d", titre: "Monde", rang: 4, sortie: null, regions: ["WORLDWIDE"], statutRegional: {} },
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
      regions: ["NTSC-J", "NTSC-U"],
      statutRegional: { PAL: "notReleased" as const },
    };

    const { rendu } = monter({ oeuvres: [oeuvre], region: "PAL" });
    expect(screen.getByText(/Jamais sorti en Europe/)).toBeInTheDocument();

    rendu.unmount();
    monter({ oeuvres: [oeuvre], region: "NTSC-J" });
    expect(screen.getByText(/Sorti en Japon/)).toBeInTheDocument();
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

    expect(ecrireSouvenir).toHaveBeenCalledWith("w1", "Noël 1992, chez ma grand-mère.");
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
    const envoyer = vi.fn(() => new Promise<void>((r) => { resoudre = r; }));
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
