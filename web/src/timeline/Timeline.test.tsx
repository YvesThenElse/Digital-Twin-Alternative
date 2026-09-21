import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { accentEpoque } from "../disposition/epoque";
import { Timeline } from "./Timeline";
import type { EntreeTimeline, MomentTimeline } from "./types";

const moment = (
  id: string,
  label: string,
  occurredAt: MomentTimeline["occurredAt"],
): MomentTimeline => ({
  id,
  type: "StartedGame",
  targetKind: "work",
  targetId: `wrk_${id}`,
  targetLabel: label,
  confidence: "Medium",
  occurredAt,
});

const entree = (
  moments: MomentTimeline[],
  start: string,
  end: string,
): EntreeTimeline => ({
  isEpisode: moments.length > 1,
  interval: { start, end },
  moments,
});

const axe = () => screen.getByTestId("axe");

describe("Timeline — un écran de lecture, pas un tableau de bord", () => {
  it("invite plutôt que de montrer un vide", () => {
    // Un axe vierge se lit comme une panne. « Racontez votre première
    // console » dit qu'il n'y a rien À CAUSE de l'histoire, pas à cause de
    // l'écran.
    render(<Timeline entrees={[]} sansDate={[]} />);

    expect(screen.getByText(/Racontez votre première console/)).toBeInTheDocument();
    expect(axe()).toHaveAttribute("data-entrees", "0");
  });

  it("rend les moments dans l'ordre reçu, sans retrier", () => {
    // L'ordre vient de `TimelineSorter`, que 387 tests du domaine valident.
    // Retrier ici, même « pour stabiliser », ferait diverger l'écran du
    // modèle sans que rien ne le signale.
    render(
      <Timeline
        entrees={[
          entree([moment("a", "Premier", { kind: "Year", year: 1990 })], "1990-01-01", "1990-12-31"),
          entree([moment("b", "Second", { kind: "Year", year: 1995 })], "1995-01-01", "1995-12-31"),
        ]}
        sansDate={[]}
      />,
    );

    const titres = within(axe()).getAllByTestId("moment-titre").map((n) => n.textContent);
    expect(titres).toEqual(["Premier", "Second"]);
  });

  it("montre chaque moment avec sa forme temporelle", () => {
    // L'unité de cet écran est le moment, et son incertitude en fait partie :
    // « vers 1994 » ne doit pas s'y lire « 1994 ».
    render(
      <Timeline
        entrees={[
          entree([moment("a", "Approximatif", { kind: "ApproximateYear", year: 1994, margin: 2 })],
                 "1992-01-01", "1996-12-31"),
        ]}
        sansDate={[]}
      />,
    );

    const date = screen.getByText("vers 1994");
    expect(date).toHaveAttribute("data-forme", "point-creux-halo");
  });

  it("colore chaque entrée selon son époque", () => {
    // « On sait où l'on est sur la timeline sans lire de date. » C'est le
    // premier des trois services que le système d'époques rend.
    render(
      <Timeline
        entrees={[
          entree([moment("a", "Huit bits", { kind: "Year", year: 1987 })], "1987-01-01", "1987-12-31"),
          entree([moment("b", "Moderne", { kind: "Year", year: 2020 })], "2020-01-01", "2020-12-31"),
        ]}
        sansDate={[]}
      />,
    );

    // Les entrées de l'AXE, pas les `<li>` imbriqués des moments :
    // `getAllByRole("listitem")` attrape les deux niveaux.
    const entrees = [...axe().querySelectorAll<HTMLElement>(":scope > li")];
    expect(entrees[0]).toHaveAttribute("data-epoque", "8 bits");
    expect(entrees[1]).toHaveAttribute("data-epoque", "Moderne");

    // Et l'accent est RÉELLEMENT posé. Nommer l'époque sans la peindre
    // laisse une bande grise au milieu d'un axe coloré : le joueur la lit
    // comme un défaut d'affichage, pas comme une décennie. Une mutation
    // retirant le style a survécu à la seule assertion `data-epoque`.
    // Ce que ce test garde, c'est que le composant APPLIQUE la palette ;
    // que la palette soit la bonne appartient à `epoque.test.ts`.
    expect(entrees[0].style.borderInlineStartColor).toBe(accentEpoque(1987).accent);
    expect(entrees[1].style.borderInlineStartColor).toBe(accentEpoque(2020).accent);
  });

  // ------------------------------------------------------ les épisodes

  it("rend un épisode comme UNE bande, pas comme une pile de moments", () => {
    // §4.4 : douze titres cochés d'un coup forment un épisode. Les empiler
    // ferait croire à douze moments distincts, et l'axe deviendrait
    // illisible dès le premier passage en sélection massive.
    render(
      <Timeline
        entrees={[
          entree(
            [
              moment("a", "Un", { kind: "Year", year: 1995 }),
              moment("b", "Deux", { kind: "Year", year: 1995 }),
              moment("c", "Trois", { kind: "Year", year: 1995 }),
            ],
            "1995-01-01",
            "1995-12-31",
          ),
        ]}
        sansDate={[]}
      />,
    );

    const bande = axe().querySelector<HTMLElement>(":scope > li")!;
    expect(bande).toHaveAttribute("data-episode", "true");
    expect(bande).toHaveAttribute("data-moments", "3");
    // Repliée : les trois titres ne sont pas tous à l'écran.
    expect(within(bande).queryAllByTestId("moment-titre")).toHaveLength(0);
  });

  it("déplie un épisode au clic", async () => {
    const utilisateur = userEvent.setup();
    render(
      <Timeline
        entrees={[
          entree(
            [
              moment("a", "Un", { kind: "Year", year: 1995 }),
              moment("b", "Deux", { kind: "Year", year: 1995 }),
            ],
            "1995-01-01",
            "1995-12-31",
          ),
        ]}
        sansDate={[]}
      />,
    );

    await utilisateur.click(screen.getByRole("button", { name: /Déplier/ }));

    expect(screen.getAllByTestId("moment-titre").map((n) => n.textContent))
      .toEqual(["Un", "Deux"]);
  });

  it("n'offre pas de dépliage pour un moment isolé", () => {
    // Un bouton qui ne fait rien apprend à ignorer les boutons.
    render(
      <Timeline
        entrees={[entree([moment("a", "Seul", { kind: "Year", year: 1995 })], "1995-01-01", "1995-12-31")]}
        sansDate={[]}
      />,
    );

    expect(screen.queryByRole("button", { name: /Déplier/ })).toBeNull();
    expect(screen.getByTestId("moment-titre")).toHaveTextContent("Seul");
  });

  // -------------------------------------------------------- le tiroir

  it("monte la zone sans date quand des moments y sont", () => {
    // Le composant existait, testé, et n'était monté nulle part — c'est ce
    // que le bilan de Phase 1 a relevé.
    render(
      <Timeline
        entrees={[]}
        sansDate={[moment("x", "Je ne sais plus", { kind: "Unknown" })]}
      />,
    );

    expect(screen.getByTestId("zone-sans-date")).toHaveAttribute("data-compte", "1");
    expect(screen.getByText("Je ne sais plus")).toBeInTheDocument();
  });

  it("n'affiche pas le tiroir quand il est vide", () => {
    render(
      <Timeline
        entrees={[entree([moment("a", "Daté", { kind: "Year", year: 1995 })], "1995-01-01", "1995-12-31")]}
        sansDate={[]}
      />,
    );

    expect(screen.queryByTestId("zone-sans-date")).toBeNull();
  });

  it("garde les moments sans date HORS de l'axe", () => {
    // Invariant 2 : ce qui n'a pas d'intervalle n'a pas de place sur l'axe.
    // Les y mêler les daterait à une position arbitraire.
    render(
      <Timeline
        entrees={[entree([moment("a", "Daté", { kind: "Year", year: 1995 })], "1995-01-01", "1995-12-31")]}
        sansDate={[moment("x", "Sans date", { kind: "Unknown" })]}
      />,
    );

    expect(axe()).toHaveAttribute("data-entrees", "1");
    expect(within(axe()).queryByText("Sans date")).toBeNull();
    expect(within(screen.getByTestId("zone-sans-date")).getByText("Sans date"))
      .toBeInTheDocument();
  });
});
