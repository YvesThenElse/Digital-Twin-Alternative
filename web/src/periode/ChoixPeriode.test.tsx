import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChoixPeriode } from "./ChoixPeriode";
import type { Plateforme } from "../selection/types";

const snes: Plateforme = {
  id: "plt_snes", nom: "Super Nintendo", regionFree: false,
  launchYear: 1990, worksCount: 35,
};
const switch_: Plateforme = {
  id: "plt_switch", nom: "Switch", regionFree: true,
  launchYear: 2017, worksCount: 20,
};

function monter(machine: Plateforme = snes) {
  const choisir = vi.fn();
  render(<ChoixPeriode machine={machine} anneeCourante={2026} choisir={choisir} />);
  return { choisir };
}

const bouton = (motif: RegExp) => screen.getByRole("button", { name: motif });
const annee = () => screen.getByRole("spinbutton", { name: /^Année$/ });

describe("ChoixPeriode — la période est CHOISIE, pas supposée", () => {
  it("n'émet rien tant que rien n'est choisi", () => {
    const { choisir } = monter();

    expect(choisir).not.toHaveBeenCalled();
  });

  it("« je ne sais plus » part en un seul geste", async () => {
    // C'est la réponse la plus fréquente et la moins coûteuse à donner : lui
    // imposer une confirmation la ferait éviter, et l'utilisateur inventerait
    // une date plutôt que d'avouer qu'il ne l'a pas.
    const utilisateur = userEvent.setup();
    const { choisir } = monter();

    await utilisateur.click(bouton(/je ne sais plus/i));

    expect(choisir).toHaveBeenCalledWith({ kind: "unknown" });
  });

  it("envoie l'année RÉELLEMENT saisie, pas une valeur figée", async () => {
    // LE défaut signalé : l'écran envoyait 1995 quoi qu'on fasse, et tous les
    // jeux d'un profil portaient la même année, que personne n'avait choisie.
    const utilisateur = userEvent.setup();
    const { choisir } = monter();

    await utilisateur.click(bouton(/une année/i));
    await utilisateur.clear(annee());
    await utilisateur.type(annee(), "1994");
    await utilisateur.click(bouton(/voir les jeux/i));

    expect(choisir).toHaveBeenCalledWith({ kind: "year", year: 1994 });
  });

  it("propose une année plausible POUR CETTE MACHINE, pas la même partout", async () => {
    // Un défaut identique quelle que soit la console est exactement ce qui a
    // produit le défaut : une valeur que personne n'a choisie et que rien ne
    // rattache à ce que l'utilisateur est en train de faire.
    const utilisateur = userEvent.setup();

    const { choisir: surSnes } = monter(snes);
    await utilisateur.click(bouton(/une année/i));
    await utilisateur.click(bouton(/voir les jeux/i));

    expect(surSnes.mock.calls[0][0]).toMatchObject({ kind: "year" });
    const anneeSnes = (surSnes.mock.calls[0][0] as { year: number }).year;
    expect(anneeSnes).toBeGreaterThanOrEqual(snes.launchYear);
    expect(anneeSnes).toBeLessThan(snes.launchYear + 6);
  });

  it("propose une autre année pour une autre machine", async () => {
    const utilisateur = userEvent.setup();
    const { choisir } = monter(switch_);

    await utilisateur.click(bouton(/une année/i));
    await utilisateur.click(bouton(/voir les jeux/i));

    const an = (choisir.mock.calls[0][0] as { year: number }).year;
    expect(an).toBeGreaterThanOrEqual(switch_.launchYear);
    expect(an).toBeLessThanOrEqual(2026);
  });

  it("ajuste l'année sans clavier — le geste du téléphone", async () => {
    // Saisir quatre chiffres au pouce coûte plus qu'un appui. Le pas existe
    // pour ça, et il doit changer la valeur ENVOYÉE, pas seulement l'affichée.
    const utilisateur = userEvent.setup();
    const { choisir } = monter();

    await utilisateur.click(bouton(/une année/i));
    const depart = Number((annee() as HTMLInputElement).value);
    await utilisateur.click(bouton(/année précédente/i));
    await utilisateur.click(bouton(/voir les jeux/i));

    expect(choisir).toHaveBeenCalledWith({ kind: "year", year: depart - 1 });
  });

  it("une période part avec SES DEUX bornes", async () => {
    const utilisateur = userEvent.setup();
    const { choisir } = monter();

    await utilisateur.click(bouton(/plutôt une période/i));
    const debut = screen.getByRole("spinbutton", { name: /début/i });
    const fin = screen.getByRole("spinbutton", { name: /fin/i });
    await utilisateur.clear(debut);
    await utilisateur.type(debut, "1993");
    await utilisateur.clear(fin);
    await utilisateur.type(fin, "1997");
    await utilisateur.click(bouton(/voir les jeux/i));

    expect(choisir).toHaveBeenCalledWith({ kind: "range", from: 1993, to: 1997 });
  });

  // ------------------------------------------------- ce qui est refusé

  it("refuse une fin antérieure au début, et le dit", async () => {
    const utilisateur = userEvent.setup();
    const { choisir } = monter();

    await utilisateur.click(bouton(/plutôt une période/i));
    const debut = screen.getByRole("spinbutton", { name: /début/i });
    const fin = screen.getByRole("spinbutton", { name: /fin/i });
    await utilisateur.clear(debut);
    await utilisateur.type(debut, "1997");
    await utilisateur.clear(fin);
    await utilisateur.type(fin, "1993");
    await utilisateur.click(bouton(/voir les jeux/i));

    expect(choisir).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/fin/i);
  });

  it("refuse une année antérieure à la machine, en nommant sa sortie", async () => {
    // « J'y ai joué en 1985 sur Super Nintendo » est impossible : la console
    // est sortie en 1990. Le dire évite au joueur de chercher pourquoi son
    // jeu s'est rangé à un endroit absurde sur l'axe.
    const utilisateur = userEvent.setup();
    const { choisir } = monter();

    await utilisateur.click(bouton(/une année/i));
    await utilisateur.clear(annee());
    await utilisateur.type(annee(), "1985");
    await utilisateur.click(bouton(/voir les jeux/i));

    expect(choisir).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("1990");
  });

  it("refuse une année à venir", async () => {
    const utilisateur = userEvent.setup();
    const { choisir } = monter();

    await utilisateur.click(bouton(/une année/i));
    await utilisateur.clear(annee());
    await utilisateur.type(annee(), "2030");
    await utilisateur.click(bouton(/voir les jeux/i));

    expect(choisir).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("ne demande jamais la confiance", async () => {
    // Elle se DÉDUIT de la granularité choisie. La demander ajouterait une
    // décision par saisie pour une information que le choix donne déjà.
    const utilisateur = userEvent.setup();
    const { choisir } = monter();

    await utilisateur.click(bouton(/je ne sais plus/i));

    expect(Object.keys(choisir.mock.calls[0][0])).toEqual(["kind"]);
  });
});
