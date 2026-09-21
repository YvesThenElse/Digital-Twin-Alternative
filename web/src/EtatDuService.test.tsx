import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EtatDuService } from "./EtatDuService";

describe("EtatDuService", () => {
  it("annonce le service disponible quand tout répond", () => {
    render(
      <EtatDuService
        etat={{ status: "ok", database: { status: "ok", detail: "PostgreSQL 17.2" } }}
      />,
    );
    expect(screen.getByRole("status")).toHaveAttribute("data-etat", "disponible");
    expect(screen.getByRole("status")).toHaveTextContent("Service disponible");
  });

  it("n'annonce jamais disponible quand la base est tombée", () => {
    // Le pendant côté écran du test de l'API : un bandeau vert alors que la
    // base ne répond pas est pire que pas de bandeau du tout.
    render(
      <EtatDuService
        etat={{
          status: "degraded",
          database: { status: "unreachable", detail: "connexion refusée" },
        }}
      />,
    );
    const zone = screen.getByRole("status");
    // ⚠️ Ne PAS écrire `not.toHaveTextContent(/disponible/i)` : « indisponible »
    // contient « disponible », et l'assertion échouerait sur le bon
    // comportement. On vérifie l'état lisible par la machine, puis la phrase
    // exacte qu'il ne faut pas voir.
    expect(zone).toHaveAttribute("data-etat", "indisponible");
    expect(zone).not.toHaveTextContent("Service disponible");
  });

  it("nomme ce qui est tombé", () => {
    render(
      <EtatDuService
        etat={{
          status: "degraded",
          database: { status: "unreachable", detail: "connexion refusée" },
        }}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(/connexion refusée/i);
  });

  it("dit qu'il ne sait pas tant que l'état n'est pas connu", () => {
    // Ni vert ni rouge : l'absence de réponse n'est pas une réponse. C'est la
    // même règle que les trois états de région du référentiel.
    render(<EtatDuService etat={undefined} />);
    const zone = screen.getByRole("status");
    expect(zone).toHaveAttribute("data-etat", "inconnu");
    expect(zone).toHaveTextContent(/vérification/i);
    expect(zone).not.toHaveTextContent("Service disponible");
  });
});
