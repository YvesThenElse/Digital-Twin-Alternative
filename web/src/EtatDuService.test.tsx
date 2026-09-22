import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EtatDuService } from "./EtatDuService";

/**
 * Le bandeau d'état — <b>et la décision de ne le montrer qu'au moment où il
 * dit quelque chose</b>.
 *
 * Écrit et testé depuis la Phase 1, il n'était affiché NULLE PART : trois
 * états rendus par personne. En le montant, il a fallu trancher entre un
 * bandeau permanent, qui dirait « tout va bien » en continu — ce que §5 ne
 * demande pas, et ce que E02 interdit explicitement pour la
 * synchronisation : « signalé une seule fois, discrètement, en pied d'écran »
 * — et un bandeau qui ne paraît qu'à la panne.
 *
 * C'est le second. Les deux autres états ont donc été RETIRÉS plutôt que
 * gardés en réserve : une branche que nul producteur n'atteint est
 * exactement ce que l'audit reprochait à ce composant.
 */
describe("EtatDuService — il ne parle que quand il a quelque chose à dire", () => {
  const degrade = {
    status: "degraded" as const,
    database: { status: "unreachable" as const, detail: "connexion refusée" },
  };

  it("nomme ce qui est tombé", () => {
    render(<EtatDuService etat={degrade} />);

    expect(screen.getByRole("status")).toHaveTextContent(/connexion refusée/i);
  });

  it("n'annonce jamais disponible quand la base est tombée", () => {
    // ⚠️ Ne PAS écrire `not.toHaveTextContent(/disponible/i)` : « indisponible »
    // contient « disponible », et l'assertion échouerait sur le bon
    // comportement. On vérifie l'état lisible par la machine, puis la phrase
    // exacte qu'il ne faut pas voir.
    render(<EtatDuService etat={degrade} />);

    const zone = screen.getByRole("status");
    expect(zone).toHaveAttribute("data-etat", "indisponible");
    expect(zone).not.toHaveTextContent("Service disponible");
  });

  it("se tait quand tout répond", () => {
    // Un bandeau vert permanent est du bruit : il occupe une place sur
    // chaque écran pour ne rien apprendre, et on cesse de le lire — y
    // compris le jour où il devient rouge.
    const { container } = render(
      <EtatDuService
        etat={{ status: "ok", database: { status: "ok", detail: "PostgreSQL 17.2" } }}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("se tait tant qu'on ne sait pas", () => {
    // Ni vert ni rouge : l'absence de réponse n'est pas une réponse. Mais
    // l'afficher inquiéterait sur un écran qui, lui, fonctionne — le doute
    // sur le service ne se pose qu'une fois quelque chose tombé.
    const { container } = render(<EtatDuService etat={undefined} />);

    expect(container).toBeEmptyDOMElement();
  });
});
