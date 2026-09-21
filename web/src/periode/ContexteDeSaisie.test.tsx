import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ContexteDeSaisie } from "./ContexteDeSaisie";
import { versValeurTemporelle, type PeriodeChoisie } from "./periode";
import { libelle } from "../temporel/valeur";

function monter(periode: PeriodeChoisie) {
  const changer = vi.fn();
  render(
    <ContexteDeSaisie
      machine="Super Nintendo" region="PAL" periode={periode} changer={changer} />,
  );
  return { changer };
}

describe("ContexteDeSaisie — E02 repère A", () => {
  it("montre la machine, la région ET la période appliquée", () => {
    // Sans elle, l'utilisateur coche trente jeux sans savoir à quelle date
    // ils s'attachent — et ne s'en aperçoit qu'une fois sur la timeline.
    monter({ kind: "range", from: 1993, to: 1997 });

    const bandeau = screen.getByTestId("contexte");
    expect(bandeau).toHaveTextContent("Super Nintendo");
    expect(bandeau).toHaveTextContent("PAL");
    expect(bandeau).toHaveTextContent("1993–1997");
  });

  it("rend la période avec la MÊME fonction que la timeline", () => {
    // Deux rendus séparés finiraient par diverger, et l'écran annoncerait
    // une période différente de celle que la timeline montrera.
    const cas: PeriodeChoisie[] = [
      { kind: "year", year: 1994 },
      { kind: "range", from: 1993, to: 1997 },
      { kind: "unknown" },
    ];

    for (const periode of cas) {
      const { unmount } = render(
        <ContexteDeSaisie machine="M" region="PAL" periode={periode} changer={() => {}} />,
      );
      expect(screen.getByTestId("contexte"))
        .toHaveTextContent(libelle(versValeurTemporelle(periode)));
      unmount();
    }
  });

  it("offre de changer la période", async () => {
    const utilisateur = userEvent.setup();
    const { changer } = monter({ kind: "year", year: 1994 });

    await utilisateur.click(screen.getByRole("button", { name: /changer la période/i }));

    expect(changer).toHaveBeenCalled();
  });

  it("dit que le changement ne vaut que pour la SUITE", () => {
    // « La modifier ne réécrit pas les déclarations déjà faites » (E02 A).
    // C'est la source d'erreur la plus probable de l'écran, donc la règle
    // reste écrite à l'écran plutôt que supposée connue.
    monter({ kind: "year", year: 1994 });

    expect(screen.getByTestId("contexte")).toHaveTextContent(/suivantes/i);
  });
});
