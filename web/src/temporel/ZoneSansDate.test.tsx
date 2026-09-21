import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ZoneSansDate } from "./ZoneSansDate";

describe("ZoneSansDate — le tiroir de l'axe", () => {
  it("ne s'affiche pas quand il est vide", () => {
    // Un tiroir vide n'apprend rien et occupe de la place sur l'écran le plus
    // dense du produit.
    render(<ZoneSansDate moments={[]} />);

    expect(screen.queryByTestId("zone-sans-date")).toBeNull();
  });

  it("rassemble les moments hors de l'axe sous un intitulé explicite", () => {
    render(
      <ZoneSansDate
        moments={[
          { id: "a", intitule: "Tetris", quand: { kind: "Unknown" } },
          { id: "b", intitule: "Zelda", quand: { kind: "Age", age: 12 } },
        ]}
      />,
    );

    expect(screen.getByTestId("zone-sans-date")).toHaveAttribute("data-compte", "2");
    expect(screen.getByRole("heading")).toHaveTextContent("À une date inconnue");
  });

  it("dit POURQUOI chaque moment est là, plutôt que de l'aplatir", () => {
    // « vers mes 12 ans » explique l'absence ; « date inconnue » pour tout le
    // monde effacerait la différence entre « je ne sais plus » et « je sais,
    // mais il manque mon année de naissance ».
    render(
      <ZoneSansDate
        moments={[
          { id: "a", intitule: "Tetris", quand: { kind: "Unknown" } },
          { id: "b", intitule: "Zelda", quand: { kind: "Age", age: 12 } },
        ]}
      />,
    );

    expect(screen.getByText("à une date inconnue")).toBeInTheDocument();
    expect(screen.getByText("vers mes 12 ans")).toBeInTheDocument();
  });
});
