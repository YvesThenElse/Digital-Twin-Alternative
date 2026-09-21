import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SelectionMassive } from "./SelectionMassive";
import type { Oeuvre } from "./types";

const oeuvres: Oeuvre[] = [
  { id: "w1", titre: "Super Mario World", rang: 1, annee: 1990, regions: ["PAL"], statutRegional: {} },
  { id: "w2", titre: "A Link to the Past", rang: 2, annee: 1991, regions: ["PAL"], statutRegional: {} },
  { id: "w3", titre: "Chrono Trigger", rang: 3, annee: 1995, regions: ["NTSC-J"], statutRegional: { PAL: "notReleased" } },
];

function monter(surcharge: Partial<Parameters<typeof SelectionMassive>[0]> = {}) {
  const envoyer = vi.fn().mockResolvedValue(undefined);
  const recharger = vi.fn();
  const rendu = render(
    <SelectionMassive
      oeuvres={oeuvres}
      envoyer={envoyer}
      recharger={recharger}
      {...surcharge}
    />,
  );
  return { envoyer, recharger, rendu };
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
        { id: "x", titre: "Sans date", rang: 1, annee: null, regions: [], statutRegional: {} },
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
        { id: "c", titre: "Troisième", rang: 3, annee: 1995, regions: [], statutRegional: {} },
        { id: "a", titre: "Premier", rang: 1, annee: 1990, regions: [], statutRegional: {} },
        { id: "b", titre: "Deuxième", rang: 2, annee: 1992, regions: [], statutRegional: {} },
      ],
    });

    expect(lignes().map((l) => l.textContent)).toEqual([
      "Premier1990",
      "Deuxième1992",
      "Troisième1995",
    ]);
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
