import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * L'assemblage du parcours.
 *
 * <b>`App.tsx` n'avait aucun test</b>, et c'est là que vivent les valeurs qui
 * traversent les écrans sans appartenir à aucun — l'état de chargement, la
 * fraîcheur de ce qui est relu, le profil. Deux mensonges y ont survécu à
 * cinq surfaces auditées.
 */

const faux = vi.hoisted(() => ({
  plateformes: vi.fn(),
  oeuvres: vi.fn(),
  etatSelection: vi.fn(),
  souvenirs: vi.fn(),
  declarer: vi.fn(),
  souvenir: vi.fn(),
  timeline: vi.fn(),
}));

vi.mock("./api/client", () => ({ client: faux }));

const { App } = await import("./App");

const SNES = {
  id: "plt_snes", nom: "Super Nintendo", regionFree: false,
  launchYear: 1990, worksCount: 2,
};
const OEUVRES = [
  { id: "w1", titre: "Super Mario World", rang: 1, sortie: { kind: "Year", year: 1990 },
    couverture: null, regions: ["PAL"], statutRegional: {} },
  { id: "w2", titre: "Chrono Trigger", rang: 2, sortie: { kind: "Year", year: 1995 },
    couverture: null, regions: ["PAL"], statutRegional: {} },
];

beforeEach(() => {
  faux.plateformes.mockResolvedValue([SNES]);
  faux.oeuvres.mockResolvedValue(OEUVRES);
  faux.etatSelection.mockResolvedValue([]);
  faux.souvenirs.mockResolvedValue({});
  faux.declarer.mockResolvedValue({ created: 1, claims: [] });
  faux.timeline.mockResolvedValue({ entries: [], undated: [] });
});

afterEach(() => vi.clearAllMocks());

async function jusquALaSelection(utilisateur: ReturnType<typeof userEvent.setup>) {
  render(<App />);
  await utilisateur.click(await screen.findByRole("button", { name: /^Super Nintendo/ }));
  await utilisateur.click(screen.getByRole("button", { name: "Plutôt une période" }));
  await utilisateur.click(screen.getByRole("button", { name: "Voir les jeux" }));
}

describe("App — l'état du chargement (principes §5)", () => {
  it("dit que le chargement a ÉCHOUÉ, au lieu de charger éternellement", async () => {
    // « Erreur : ce qui a échoué, ce qui est conservé, quoi faire. » L'écran
    // rendait un échec réseau par « Chargement… » — définitivement. Un
    // testeur en conclut que l'application est lente, attend, puis part.
    faux.plateformes.mockRejectedValue(new Error("réseau"));
    render(<App />);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText(/Chargement/)).toBeNull();
  });

  it("annonce le chargement tant qu'il dure vraiment", async () => {
    faux.plateformes.mockReturnValue(new Promise(() => {}));
    render(<App />);

    expect(screen.getByText(/Chargement/)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("ne confond pas un catalogue vide avec un chargement", async () => {
    // Trois états distincts rendus par une seule phrase, c'est trois fois la
    // même information fausse.
    faux.plateformes.mockResolvedValue([]);
    render(<App />);

    await waitFor(() => expect(screen.queryByText(/Chargement/)).toBeNull());
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});

describe("App — un geste qui échoue le dit (principes §5)", () => {
  it("dit qu'une console n'a pas pu s'ouvrir, au lieu de ne rien faire", async () => {
    // Quatre chemins asynchrones n'avaient aucun `catch` : un échec laissait
    // l'écran figé sur l'étape courante, sans message. Le testeur appuie,
    // rien ne se passe, il appuie encore. « Erreur : ce qui a échoué, ce qui
    // est conservé, quoi faire » — aucun des trois n'était dit.
    const utilisateur = userEvent.setup();
    faux.oeuvres.mockRejectedValue(new Error("réseau"));
    render(<App />);

    await utilisateur.click(await screen.findByRole("button", { name: /^Super Nintendo/ }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });

  it("dit que la timeline n'a pas pu s'ouvrir, et garde la sélection", async () => {
    // Ce qui est CONSERVÉ fait partie du message : les déclarations sont en
    // base, et l'écran doit rester là où l'utilisateur travaillait.
    const utilisateur = userEvent.setup();
    await jusquALaSelection(utilisateur);
    faux.timeline.mockRejectedValue(new Error("réseau"));

    await utilisateur.click(screen.getByRole("button", { name: "Voir ma timeline" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Déclarer : Super Mario World$/ }))
      .toBeInTheDocument();
  });

  it("efface l'alerte dès que le geste suivant aboutit", async () => {
    // Une alerte qui reste après la réparation ferait douter d'un état sain.
    const utilisateur = userEvent.setup();
    faux.oeuvres.mockRejectedValueOnce(new Error("réseau"));
    render(<App />);

    const console = await screen.findByRole("button", { name: /^Super Nintendo/ });
    await utilisateur.click(console);
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    await utilisateur.click(console);

    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  });
});

describe("App — la fraîcheur de ce qui est relu", () => {
  it("relit l'état en revenant à la sélection après un changement de période", async () => {
    // La période se change depuis le contexte de saisie (E02 repère A). Le
    // composant de sélection est alors démonté : son état local — les lignes
    // cochées depuis le chargement — disparaît. Sans relecture, l'écran
    // revient en montrant MOINS que ce que la base contient.
    const utilisateur = userEvent.setup();
    await jusquALaSelection(utilisateur);

    await utilisateur.click(screen.getByRole("button", { name: /^Déclarer : Super Mario World$/ }));
    faux.etatSelection.mockClear();

    await utilisateur.click(screen.getByRole("button", { name: /changer la période/i }));
    // Le choix repart de zéro : l'écran de période ne remontre pas la
    // période courante, il faut rechoisir le mode. Friction notée à l'item,
    // ce n'est pas un mensonge — le contexte, lui, l'affiche toujours.
    await utilisateur.click(screen.getByRole("button", { name: "Plutôt une période" }));
    await utilisateur.click(screen.getByRole("button", { name: "Voir les jeux" }));

    await waitFor(() => expect(faux.etatSelection).toHaveBeenCalled());
  });

  it("recharger la liste ne QUITTE PAS l'écran de sélection", async () => {
    // Le bouton appelait le choix de machine, qui se termine par un retour à
    // l'écran de période : le geste faisait autre chose que ce qu'il
    // annonçait, et emportait l'état local de la sélection.
    const utilisateur = userEvent.setup();
    await jusquALaSelection(utilisateur);

    await utilisateur.click(screen.getByRole("button", { name: "Recharger la liste" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^Déclarer : Super Mario World$/ }))
        .toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "Plutôt une période" })).toBeNull();
  });
});
