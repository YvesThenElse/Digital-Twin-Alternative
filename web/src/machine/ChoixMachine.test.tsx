import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChoixMachine } from "./ChoixMachine";
import { accentEpoque } from "../disposition/epoque";
import type { Plateforme } from "../selection/types";

const PLATEFORMES: Plateforme[] = [
  { id: "p_nes", nom: "Nintendo Entertainment System", regionFree: false, launchYear: 1983, worksCount: 30 },
  { id: "p_snes", nom: "Super Nintendo", regionFree: false, launchYear: 1990, worksCount: 35 },
  { id: "p_switch", nom: "Switch", regionFree: true, launchYear: 2017, worksCount: 24 },
];

function monter(surcharge: Partial<Parameters<typeof ChoixMachine>[0]> = {}) {
  const choisir = vi.fn();
  render(
    <ChoixMachine
      plateformes={PLATEFORMES}
      chargement="pret"
      choisir={choisir}
      {...surcharge}
    />,
  );
  return { choisir };
}

const carteDe = (nom: string) => screen.getByRole("button", { name: new RegExp(nom) });

describe("ChoixMachine — le choix doit être RECONNU, pas cherché (E01)", () => {
  it("montre une carte par console, jamais une liste de libellés", async () => {
    // « Grandes cibles visuelles, pas une liste déroulante. » Ce qui était
    // livré — une liste à puces de boutons bordés — transformait la
    // reconnaissance en lecture.
    monter();

    const cartes = screen.getAllByTestId("carte-machine");
    expect(cartes).toHaveLength(3);
  });

  it("peint chaque carte à l'accent de SON époque", async () => {
    // La couleur fait la moitié de la reconnaissance avant qu'on ait lu le
    // nom : le gradient de température se lit d'un coup d'œil, et deux
    // consoles de la même décennie se répondent.
    monter();

    const nes = carteDe("Nintendo Entertainment System");
    const switch_ = carteDe("Switch");

    expect(nes).toHaveAttribute("data-epoque", accentEpoque(1983).nom);
    expect(switch_).toHaveAttribute("data-epoque", accentEpoque(2017).nom);
    expect(nes.getAttribute("data-epoque")).not.toBe(switch_.getAttribute("data-epoque"));
  });

  it("porte l'année de sortie ET le nombre de jeux", async () => {
    // `worksCount` traversait l'API, le client et le type sans que rien ne
    // l'affiche (audit, item 19). C'est ici qu'il sert : il dit ce qu'il y
    // a derrière la carte avant qu'on l'ouvre.
    monter();

    expect(within(carteDe("Super Nintendo")).getByText(/1990/)).toBeInTheDocument();
    expect(within(carteDe("Super Nintendo")).getByText(/35 jeux/)).toBeInTheDocument();
  });

  it("rend la console choisie, pas son libellé", async () => {
    const utilisateur = userEvent.setup();
    const { choisir } = monter();

    await utilisateur.click(carteDe("Super Nintendo"));

    expect(choisir).toHaveBeenCalledWith(PLATEFORMES[1]);
  });

  it("garde toute la carte comme cible", async () => {
    // Une carte dont seul le titre serait cliquable ferait rater le geste
    // une fois sur trois sur un téléphone.
    const utilisateur = userEvent.setup();
    const { choisir } = monter();

    await utilisateur.click(within(carteDe("Switch")).getByText(/2017/));

    expect(choisir).toHaveBeenCalledWith(PLATEFORMES[2]);
  });

  // ------------------------------------------------ les quatre états (§5)

  it("annonce le chargement tant qu'il dure", () => {
    monter({ plateformes: [], chargement: "en-cours" });

    expect(screen.getByText(/Chargement/)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("dit l'échec au lieu de charger éternellement", () => {
    monter({ plateformes: [], chargement: "echec" });

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText(/Chargement/)).toBeNull();
  });

  it("ne confond pas un catalogue vide avec un chargement", () => {
    monter({ plateformes: [], chargement: "pret" });

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText(/Chargement/)).toBeNull();
  });
});
