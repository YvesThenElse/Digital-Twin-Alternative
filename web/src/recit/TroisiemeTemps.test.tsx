import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TroisiemeTemps } from "./TroisiemeTemps";
import type { PeriodeChoisie } from "../periode/periode";
import type { Oeuvre, Plateforme } from "../selection/types";

/**
 * E01, temps 3 — <b>« la récompense, immédiate »</b>.
 *
 * « Dès la validation du temps 2, sans transition ni chargement bloquant :
 * une phrase, une bande sur un axe, un aperçu visuel des jeux à venir, une
 * continuation. »
 *
 * C'est l'écran qui décide du sort du produit — le KPI *median time to first
 * meaningful profile* se joue ici — et la fiche donne le registre :
 * « le temps 3 n'est pas une confirmation, c'est un cadeau. Il ne dit pas
 * "enregistré", il montre le début d'une histoire. »
 */
const GAMEBOY: Plateforme = {
  id: "plt_gb", nom: "Game Boy", regionFree: false, launchYear: 1989, worksCount: 120,
};

const oeuvre = (n: number, avecJaquette = true): Oeuvre => ({
  id: `wrk_${n}`,
  titre: `Titre ${n}`,
  rang: n,
  sortie: { kind: "Year", year: 1991 },
  couverture: avecJaquette ? `/api/covers/wrk_${n}` : null,
  regions: ["PAL"],
  statutRegional: {},
});

const DOUZE = Array.from({ length: 12 }, (_, i) => oeuvre(i + 1));

const ANNEES_90: PeriodeChoisie = { kind: "range", from: 1990, to: 1994 };

function poser(sur: {
  periode?: PeriodeChoisie;
  oeuvres?: Oeuvre[];
  disposition?: "liste" | "grille";
  continuer?: () => void;
} = {}) {
  return render(
    <TroisiemeTemps
      machine={GAMEBOY}
      periode={sur.periode ?? ANNEES_90}
      oeuvres={sur.oeuvres ?? DOUZE}
      disposition={sur.disposition ?? "liste"}
      continuer={sur.continuer ?? (() => {})}
    />,
  );
}

const jaquettes = () => screen.getByTestId("temps3-apercu").querySelectorAll("img");

describe("TroisiemeTemps — les quatre éléments de la récompense", () => {
  it("rend les quatre : la phrase, l'axe, l'aperçu, la continuation", () => {
    poser();

    expect(screen.getByTestId("temps3-phrase")).toBeInTheDocument();
    expect(screen.getByTestId("temps3-axe")).toBeInTheDocument();
    expect(screen.getByTestId("temps3-apercu")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Game Boy/ })).toBeInTheDocument();
  });

  it("dit la décennie choisie, et pas la même pour une autre", () => {
    const { unmount } = poser();
    expect(screen.getByTestId("temps3-phrase")).toHaveTextContent("90");
    const quatreVingtDix = screen.getByTestId("temps3-phrase").textContent;
    unmount();

    poser({ periode: { kind: "range", from: 2000, to: 2004 } });

    expect(screen.getByTestId("temps3-phrase").textContent).not.toBe(quatreVingtDix);
    expect(screen.getByTestId("temps3-phrase")).toHaveTextContent("2000");
  });

  it("ne dit pas « enregistré » : c'est un cadeau, pas une confirmation", () => {
    const { container } = poser();

    expect(container.textContent).not.toMatch(/enregistr|sauvegard|validé|merci/i);
  });

  // ------------------------------------------------------------- l'axe

  it("porte la période sur l'axe, avec sa machine", () => {
    poser();

    const axe = screen.getByTestId("temps3-axe");
    expect(axe).toHaveTextContent("1990");
    expect(axe).toHaveTextContent("1994");
    expect(axe).toHaveTextContent("Game Boy");
  });

  it("ne met aucune bande sur l'axe quand la période est inconnue", () => {
    // Invariant 2 : « je ne sais plus » ne se projette à aucune position.
    // Dessiner une bande au milieu inventerait une date que personne n'a
    // donnée — et E01 exige que ce choix ne bloque jamais la suite.
    poser({ periode: { kind: "unknown" } });

    expect(screen.queryByTestId("temps3-axe")).toBeNull();
    // Et la phrase n'invente aucune décennie : pas un chiffre. « Les années
    // 0 » serait pire que le silence — une date que personne n'a donnée,
    // affichée comme un fait.
    expect(screen.getByTestId("temps3-phrase").textContent).not.toMatch(/\d/);
    // Le témoin (78) : les trois autres éléments sont là, et la suite
    // continue. Sans lui, « pas de bande » se satisferait d'un écran mort.
    expect(screen.getByTestId("temps3-phrase")).toBeInTheDocument();
    expect(screen.getByTestId("temps3-apercu")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Game Boy/ })).toBeInTheDocument();
  });

  // --------------------------------------------------------- l'aperçu

  it("montre quatre jaquettes sur mobile, huit sur écran large", () => {
    // E01, tableau des dispositions : « empilé, aperçu sur une rangée de 4 »
    // contre « axe et aperçu côte à côte, 8 jaquettes ». Deux dispositions,
    // pas une étirée.
    const { unmount } = poser({ disposition: "liste" });
    expect(jaquettes()).toHaveLength(4);
    unmount();

    poser({ disposition: "grille" });
    expect(jaquettes()).toHaveLength(8);
  });

  it("préfère les œuvres qui ONT une jaquette", () => {
    // Le piège nommé par la fiche : « Livrer les cartes sans vignettes : sur
    // cet écran, l'image EST la reconnaissance. » Les trois premières du
    // référentiel n'en ont pas ; les montrer ferait un aperçu de texte.
    const melange = [
      oeuvre(1, false), oeuvre(2, false), oeuvre(3, false),
      ...Array.from({ length: 6 }, (_, i) => oeuvre(i + 4)),
    ];

    poser({ oeuvres: melange, disposition: "liste" });

    expect(jaquettes()).toHaveLength(4);
    expect([...jaquettes()].map((i) => i.getAttribute("alt")))
      .toEqual(["Titre 4", "Titre 5", "Titre 6", "Titre 7"]);
  });

  it("montre quand même un aperçu quand aucune jaquette n'existe", () => {
    // Le témoin de la règle précédente : « la tuile générée est la réponse,
    // pas un trou » (§5). Un aperçu vide serait pire que des tuiles — l'œil
    // le lit comme une panne.
    poser({ oeuvres: Array.from({ length: 6 }, (_, i) => oeuvre(i + 1, false)) });

    expect(jaquettes()).toHaveLength(0);
    expect(screen.getByTestId("temps3-apercu").querySelectorAll("[data-tuile]"))
      .toHaveLength(4);
  });

  it("garde l'ordre de notoriété que l'API a décidé", () => {
    // « Il traduit, il ne décide pas » : le rang de notoriété vient de l'API.
    // Retrier ici ferait diverger l'aperçu de la liste qui suit, et le joueur
    // ne retrouverait pas les jeux qu'on vient de lui montrer.
    poser();

    expect([...jaquettes()].map((i) => i.getAttribute("alt")))
      .toEqual(["Titre 1", "Titre 2", "Titre 3", "Titre 4"]);
  });

  it("n'affirme pas que le joueur a eu ces jeux", () => {
    // « Vous aviez PEUT-ÊTRE ces jeux-là. » Le produit tout entier repose sur
    // le fait de ne pas inventer ce que l'utilisateur n'a pas dit : l'aperçu
    // propose, il ne constate pas.
    poser();

    expect(screen.getByTestId("temps3-apercu")).toHaveTextContent("peut-être");
  });

  // ---------------------------------------------------- la continuation

  it("continue vers la sélection, en nommant la machine", () => {
    const aller = vi.fn();
    poser({ continuer: aller });

    screen.getByRole("button", { name: /Game Boy/ }).click();

    expect(aller).toHaveBeenCalledTimes(1);
  });

  it("n'offre qu'UNE action : la continuation est la seule qui compte", async () => {
    // E01 : « Sortant principal : → E02. C'est la seule continuation qui
    // compte. » Un second bouton partagerait l'attention au moment précis où
    // le produit demande un pas de plus.
    const utilisateur = userEvent.setup();
    poser();

    expect(screen.getAllByRole("button")).toHaveLength(1);
    await utilisateur.click(screen.getByRole("button"));
  });
});
