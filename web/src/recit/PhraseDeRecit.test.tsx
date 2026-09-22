import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PhraseDeRecit } from "./PhraseDeRecit";
import { accentEpoque } from "../disposition/epoque";
import type { Plateforme } from "../selection/types";

const machine = (nom: string, launchYear: number): Plateforme => ({
  id: "plt_x", nom, regionFree: false, launchYear, worksCount: 147,
});

const phrase = () => screen.getByTestId("recit");

/**
 * §24.4 : « la première console saisie déclenche déjà une phrase de récit ».
 *
 * C'est la réponse au risque produit numéro un — pourquoi quelqu'un
 * passerait-il deux heures à saisir trente ans ? — et E01 en donne le ton :
 * « le temps 3 n'est pas une confirmation, c'est un cadeau. Il ne dit pas
 * "enregistré", il montre le début d'une histoire. »
 */
describe("PhraseDeRecit — la récompense arrive avant l'effort", () => {
  it("nomme la console choisie", () => {
    render(<PhraseDeRecit machine={machine("Super Nintendo Entertainment System", 1990)} />);

    expect(phrase()).toHaveTextContent("Super Nintendo Entertainment System");
  });

  it("parle de CETTE console, et pas d'une autre", () => {
    // Une phrase fixe serait un décor : elle dirait la même chose à tout le
    // monde, ce qui est exactement ce qu'une liste de jeux cochés fait déjà.
    const premier = render(<PhraseDeRecit machine={machine("Game Boy", 1989)} />);
    const texteA = phrase().textContent;
    premier.unmount();

    render(<PhraseDeRecit machine={machine("Nintendo 64", 1996)} />);

    expect(phrase().textContent).not.toBe(texteA);
    expect(phrase()).toHaveTextContent("Nintendo 64");
    expect(phrase()).not.toHaveTextContent("Game Boy");
  });

  it("n'invente aucun chiffre : le seul est celui du référentiel", () => {
    // « Les premières statistiques » sont DIFFÉRÉES (F12) : un compteur ici
    // ferait parler le produit de lui-même, alors que §24.4 lui demande de
    // parler du joueur. La seule donnée chiffrée est un fait du
    // référentiel — l'année de la machine —, et elle porte sur la machine,
    // jamais sur le joueur.
    render(<PhraseDeRecit machine={machine("Super Nintendo Entertainment System", 1990)} />);

    const chiffres = phrase().textContent!.match(/\d+/g) ?? [];
    expect(chiffres).toEqual(["1990"]);
  });

  it("ne dit pas « enregistré » : c'est un cadeau, pas une confirmation", () => {
    render(<PhraseDeRecit machine={machine("Game Boy", 1989)} />);

    expect(phrase().textContent).not.toMatch(/enregistr|sauvegard|validé/i);
  });

  it("porte l'accent de son époque", () => {
    // E01 : « le système visuel du produit s'installe dès le deuxième
    // écran ». Le nom seul ne suffit pas — une bande nommée mais non peinte
    // se lit comme un défaut d'affichage.
    render(<PhraseDeRecit machine={machine("Nintendo 64", 1996)} />);

    const epoque = accentEpoque(1996);
    expect(phrase()).toHaveAttribute("data-epoque", epoque.nom);
    expect((phrase() as HTMLElement).style.borderInlineStartColor).toBe(epoque.accent);
  });
});
