import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChoixPeriode } from "./ChoixPeriode";
import type { Plateforme } from "../selection/types";

const snes: Plateforme = {
  id: "plt_snes", nom: "Super Nintendo", regionFree: false,
  launchYear: 1990, worksCount: 35,
};
const nes: Plateforme = {
  id: "plt_nes", nom: "NES", regionFree: false, launchYear: 1983, worksCount: 30,
};

function monter(machine: Plateforme = snes) {
  const choisir = vi.fn();
  render(<ChoixPeriode machine={machine} anneeCourante={2026} choisir={choisir} />);
  return { choisir };
}

const carte = (motif: RegExp) => screen.getByRole("button", { name: motif });

describe("ChoixPeriode — des cartes de décennie, pas un curseur (E01)", () => {
  it("n'émet rien tant que rien n'est choisi", () => {
    const { choisir } = monter();

    expect(choisir).not.toHaveBeenCalled();
  });

  it("propose des décennies, jamais un champ où taper une année", () => {
    // « Personne ne se souvient de l'année exacte de sa première console. »
    // Le champ numérique avec −/+ était la « question nue » que
    // SPECIFICATION.md:311 nomme comme l'anti-motif : le référentiel doit
    // travailler pour l'utilisateur au lieu de l'interroger à vide.
    monter();

    expect(screen.queryByRole("spinbutton")).toBeNull();
    expect(screen.getAllByTestId("carte-decennie").length).toBeGreaterThan(1);
  });

  it("ne propose que les décennies où la machine a existé", () => {
    // Proposer « années 80 » sur une console de 1990 ferait perdre du temps
    // à tout le monde, et c'est exactement ce que le refus motivé disait.
    monter(snes);

    expect(screen.queryByRole("button", { name: /Années 80/ })).toBeNull();
    expect(carte(/Années 90/)).toBeInTheDocument();
  });

  it("commence à la décennie de la machine, pas à la même partout", () => {
    monter(nes);

    expect(carte(/Années 80/)).toBeInTheDocument();
  });

  it("ne décide RIEN au clic sur une décennie", async () => {
    // Le clic validait la période ET faisait naviguer. L'affinage
    // n'apparaissait donc que le temps des deux requêtes de relecture : sur
    // une machine rapide, l'utilisateur perdait la course, et E01 promet
    // pourtant un affinage « facultatif » — pas inatteignable.
    //
    // Le parcours de bout en bout ne pouvait pas le voir : Playwright clique
    // plus vite qu'une main.
    const utilisateur = userEvent.setup();
    const { choisir } = monter();

    await utilisateur.click(carte(/Années 90/));

    expect(choisir).not.toHaveBeenCalled();
    expect(screen.getByTestId("affinage")).toBeInTheDocument();
  });

  it("envoie une PÉRIODE sur la décennie, pas une année inventée", async () => {
    // « La valeur enregistrée est alors un Range sur la décennie, ce qui est
    // une réponse parfaitement valide » (E01). Une année exacte
    // affirmerait une précision que personne n'a donnée.
    //
    // C'est « quelque part dans les années 90 » qui continue — le bouton
    // existait déjà, et il devient le chemin de qui ne veut pas affiner.
    const utilisateur = userEvent.setup();
    const { choisir } = monter();

    await utilisateur.click(carte(/Années 90/));
    await utilisateur.click(screen.getByRole("button", { name: /quelque part/i }));

    expect(choisir).toHaveBeenCalledWith({ kind: "range", from: 1990, to: 1999 });
  });

  it("borne la première décennie à la sortie de la machine", async () => {
    // Les années 80 de la NES commencent en 1983, pas en 1980 : la console
    // n'existait pas avant.
    const utilisateur = userEvent.setup();
    const { choisir } = monter(nes);

    await utilisateur.click(carte(/Années 80/));
    await utilisateur.click(screen.getByRole("button", { name: /quelque part/i }));

    expect(choisir).toHaveBeenCalledWith({ kind: "range", from: 1983, to: 1989 });
  });

  it("borne la dernière décennie à aujourd'hui", async () => {
    const utilisateur = userEvent.setup();
    const { choisir } = monter();

    await utilisateur.click(carte(/Années 2020/));
    await utilisateur.click(screen.getByRole("button", { name: /quelque part/i }));

    expect(choisir).toHaveBeenCalledWith({ kind: "range", from: 2020, to: 2026 });
  });

  it("peint chaque décennie à SON accent, par son milieu", async () => {
    // Une décennie ENJAMBE souvent deux générations : les années 90 portent
    // le 16 bits puis le 32/64. La règle retenue est le **milieu** de la
    // décennie, qui tranche sans arbitraire et donne la génération
    // dominante — 2015 pour les années 2010, donc « Moderne » et non le HD
    // de ses trois premières années.
    //
    // Pour les années 90, le milieu tombe **pile sur la frontière** de 1995
    // et retient donc la génération qui commence. C'est un choix assumé :
    // l'accent situe, il n'affirme pas une appartenance.
    monter();

    expect(carte(/Années 90/)).toHaveAttribute("data-epoque", "32/64 bits");
    expect(carte(/Années 2010/)).toHaveAttribute("data-epoque", "Moderne");
    expect(carte(/Années 2020/)).toHaveAttribute("data-epoque", "Moderne");
  });

  it("« je ne sais plus » part en un seul geste", async () => {
    // La réponse la plus fréquente et la moins coûteuse à donner. Lui
    // imposer une confirmation la ferait éviter, et l'utilisateur
    // inventerait une date plutôt que de l'avouer.
    const utilisateur = userEvent.setup();
    const { choisir } = monter();

    await utilisateur.click(screen.getByRole("button", { name: /je ne sais plus/i }));

    expect(choisir).toHaveBeenCalledWith({ kind: "unknown" });
  });

  // ------------------------------------------------ l'affinage facultatif

  it("propose d'affiner APRÈS la décennie, et seulement alors", async () => {
    // « Un affinage facultatif apparaît — cinq années à sélectionner, ou
    // quelque part dans les années 90. L'utilisateur peut l'ignorer et
    // continuer. » Il ne doit donc pas encombrer le premier choix.
    const utilisateur = userEvent.setup();
    monter();

    expect(screen.queryByTestId("affinage")).toBeNull();
    await utilisateur.click(carte(/Années 90/));
    expect(screen.getByTestId("affinage")).toBeInTheDocument();
  });

  it("l'affinage resserre la période, sans jamais la rendre exacte", async () => {
    const utilisateur = userEvent.setup();
    const { choisir } = monter();

    await utilisateur.click(carte(/Années 90/));
    await utilisateur.click(screen.getByRole("button", { name: "1990 – 1994" }));

    expect(choisir).toHaveBeenLastCalledWith({ kind: "range", from: 1990, to: 1994 });
  });

  it("garde « quelque part dans la décennie » comme réponse pleine", async () => {
    const utilisateur = userEvent.setup();
    const { choisir } = monter();

    await utilisateur.click(carte(/Années 90/));
    await utilisateur.click(screen.getByRole("button", { name: /quelque part/i }));

    expect(choisir).toHaveBeenCalledWith({ kind: "range", from: 1990, to: 1999 });
  });

  it("ne demande jamais la confiance", async () => {
    const utilisateur = userEvent.setup();
    const { choisir } = monter();

    await utilisateur.click(carte(/Années 90/));
    await utilisateur.click(screen.getByRole("button", { name: /quelque part/i }));

    expect(Object.keys(choisir.mock.calls[0][0]).sort()).toEqual(["from", "kind", "to"]);
  });
});
