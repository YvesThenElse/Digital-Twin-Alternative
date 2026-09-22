import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { client as ClientReel } from "./api/client";

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
  titresLibres: vi.fn(),
  declarer: vi.fn(),
  souvenir: vi.fn(),
  // Manquait au faux depuis l'arrivée de la rétractation : le contrat
  // ci-dessous l'a nommé, et un test qui décoche une ligne aurait échoué
  // sur « n'est pas une fonction », loin de sa cause.
  retracter: vi.fn(),
  timeline: vi.fn(),
}));

vi.mock("./api/client", () => ({ client: faux }));

/**
 * Le faux doit porter <b>tout</b> ce que le vrai porte.
 *
 * Sans cette ligne, un point d'entrée ajouté au client manque au faux, l'appel
 * échoue à l'exécution, et `essayer` transforme la panne en alerte : trois
 * tests sans rapport se plaignent alors de ne pas trouver un bouton. On
 * cherche le défaut dans l'écran pendant que la cause est dans le décor.
 *
 * L'import est de TYPE seulement : il disparaît à la compilation, et
 * n'entre donc pas dans la fabrique du mock, qui ne peut rien voir de son
 * dehors.
 */
type ContratDuClient = Record<keyof typeof ClientReel, unknown>;
const _contrat: ContratDuClient = faux;
void _contrat;

const { App } = await import("./App");

const SNES = {
  id: "plt_snes", nom: "Super Nintendo", regionFree: false,
  launchYear: 1990, worksCount: 2,
};
/** Une console SORTIE APRÈS la période que le parcours choisit. */
const SWITCH = {
  id: "plt_switch", nom: "Nintendo Switch", regionFree: true,
  launchYear: 2017, worksCount: 2,
};
const OEUVRES = [
  { id: "w1", titre: "Super Mario World", rang: 1, sortie: { kind: "Year", year: 1990 },
    couverture: null, regions: ["PAL"], statutRegional: {} },
  { id: "w2", titre: "Chrono Trigger", rang: 2, sortie: { kind: "Year", year: 1995 },
    couverture: null, regions: ["PAL"], statutRegional: {} },
];

beforeEach(() => {
  faux.plateformes.mockResolvedValue([SNES, SWITCH]);
  faux.oeuvres.mockResolvedValue(OEUVRES);
  faux.etatSelection.mockResolvedValue([]);
  faux.souvenirs.mockResolvedValue({});
  faux.titresLibres.mockResolvedValue([]);
  faux.retracter.mockResolvedValue({ retracted: 1 });
  faux.declarer.mockResolvedValue({ created: 1, claims: [] });
  faux.timeline.mockResolvedValue({ entries: [], undated: [], warnings: [] });
});

afterEach(() => vi.clearAllMocks());

async function jusquALaSelection(utilisateur: ReturnType<typeof userEvent.setup>) {
  render(<App />);
  await utilisateur.click(await screen.findByRole("button", { name: /^Super Nintendo/ }));
  // Une carte de décennie suffit : E01 en fait une réponse pleine, et
  // l'affinage qui suit est facultatif.
  await utilisateur.click(screen.getByRole("button", { name: /Années 90/ }));
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

describe("App — la timeline s'ouvre", () => {
  it("passe les avertissements du domaine à l'axe (§5.4)", async () => {
    // L'API les calcule et les rend depuis la Phase 1 ; le type du client ne
    // déclarait pas le champ. Personne ne les a jamais vus — et rien ne
    // pouvait le dire, puisque le calcul, lui, était juste.
    const utilisateur = userEvent.setup();
    faux.timeline.mockResolvedValue({
      entries: [
        { isEpisode: false, interval: { start: "1990-01-01", end: "1990-12-31" },
          moments: [{ id: "fin", type: "CompletedGame", targetKind: "work",
                      targetId: "w1", targetLabel: "Super Mario World",
                      confidence: "Medium", occurredAt: { kind: "Year", year: 1990 },
                      memory: null }] },
        { isEpisode: false, interval: { start: "1995-01-01", end: "1995-12-31" },
          moments: [{ id: "debut", type: "StartedGame", targetKind: "work",
                      targetId: "w1", targetLabel: "Super Mario World",
                      confidence: "Medium", occurredAt: { kind: "Year", year: 1995 },
                      memory: null }] },
      ],
      undated: [],
      warnings: [{ expectedEarlierId: "debut", expectedLaterId: "fin",
                   message: "diagnostic du domaine, jamais affiché" }],
    });

    await jusquALaSelection(utilisateur);
    await utilisateur.click(screen.getByRole("button", { name: "Voir ma timeline" }));

    // Que la phrase soit dans le vocabulaire de l'écran est l'affaire du
    // composant, qui le vérifie. Ce qu'on vérifie ICI est ce que lui seul
    // voit : l'avertissement traverse le client — et le `message` de l'API,
    // qui nomme les types du domaine, ne traverse PAS.
    expect(await screen.findByTestId("avertissement")).toBeInTheDocument();
    expect(screen.queryByText(/diagnostic du domaine/)).toBeNull();
  });
});

describe("App — se tromper de console (E02)", () => {
  const changerDeConsole = async (utilisateur: ReturnType<typeof userEvent.setup>) =>
    utilisateur.click(screen.getByRole("button", { name: "Changer de console" }));

  it("ramène au choix de machine sans recharger la page", async () => {
    // Une fois la machine choisie, SEUL un rechargement y ramenait. Un
    // testeur qui se trompe de console perdait son amorce — et, sur un
    // téléphone, ne savait pas forcément comment recharger.
    const utilisateur = userEvent.setup();
    await jusquALaSelection(utilisateur);

    await changerDeConsole(utilisateur);

    expect(screen.getByRole("heading", { name: /console/i })).toBeInTheDocument();
  });

  it("garde la période et retourne DIRECTEMENT à la sélection", async () => {
    // E02 : « changer de plateforme → E02 sur une autre plateforme, période
    // conservée ». La redemander ferait payer deux fois une réponse déjà
    // donnée, sur l'écran dont §24.4 dit que chaque geste compte.
    const utilisateur = userEvent.setup();
    await jusquALaSelection(utilisateur);

    await changerDeConsole(utilisateur);
    await utilisateur.click(screen.getByRole("button", { name: /^Super Nintendo/ }));

    const contexte = await screen.findByTestId("contexte");
    expect(contexte).toHaveTextContent("1990");
    // Et non l'écran de période : c'est ce qui prouve qu'elle est conservée.
    expect(screen.queryByRole("button", { name: /Années 90/ })).toBeNull();
  });

  it("redemande la période quand la nouvelle console est sortie après", async () => {
    // Garder « 1990–1994 » sur une console de 2017 conduirait au refus de
    // l'API au premier lot — c'est-à-dire APRÈS avoir coché. La règle est
    // celle de la couche qui écrit ; l'écran la répète plus tôt, et mieux.
    const utilisateur = userEvent.setup();
    await jusquALaSelection(utilisateur);

    await changerDeConsole(utilisateur);
    await utilisateur.click(screen.getByRole("button", { name: /^Nintendo Switch/ }));

    expect(await screen.findByRole("heading", { name: /quand/i })).toBeInTheDocument();
  });

  it("charge la ludothèque de la NOUVELLE console", async () => {
    // Garder la période ne doit pas garder la liste : le joueur verrait les
    // jeux de la console qu'il vient de quitter, et les déclarerait sur
    // l'autre.
    const utilisateur = userEvent.setup();
    await jusquALaSelection(utilisateur);
    faux.oeuvres.mockClear();

    await changerDeConsole(utilisateur);
    await utilisateur.click(screen.getByRole("button", { name: /^Super Nintendo/ }));

    expect(faux.oeuvres).toHaveBeenCalledWith("plt_snes", "PAL");
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
    // Le choix repart de zéro : l'écran ne remontre pas la décennie
    // courante. Friction notée à l'audit, ce n'est pas un mensonge — le
    // contexte de saisie, lui, l'affiche toujours.
    await utilisateur.click(screen.getByRole("button", { name: /Années 90/ }));

    await waitFor(() => expect(faux.etatSelection).toHaveBeenCalled());
  });

  it("annonce le chargement DANS l'écran pendant un rechargement", async () => {
    // Le rechargement est un geste de CET écran : l'attente lui appartient,
    // et « squelette de la structure attendue » (§5) vaut mieux qu'une liste
    // figée dont on ne sait pas si elle a bougé.
    const utilisateur = userEvent.setup();
    await jusquALaSelection(utilisateur);

    let repondre: (liste: unknown[]) => void = () => {};
    faux.oeuvres.mockReturnValue(new Promise((r) => { repondre = r; }));
    await utilisateur.click(screen.getByRole("button", { name: "Recharger la liste" }));

    expect(screen.getByTestId("squelette")).toBeInTheDocument();
    repondre(OEUVRES);
    await waitFor(() => expect(screen.queryByTestId("squelette")).toBeNull());
  });

  it("dit l'échec d'un rechargement DANS l'écran, et garde la période", async () => {
    // « Ce qui a échoué, ce qui est conservé, quoi faire » perd son sens
    // au-dessus d'une étape qu'on ne sait pas nommer.
    const utilisateur = userEvent.setup();
    await jusquALaSelection(utilisateur);

    faux.oeuvres.mockRejectedValue(new Error("réseau"));
    await utilisateur.click(screen.getByRole("button", { name: "Recharger la liste" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/n'a pas pu être relue/);
    // La période est toujours à l'écran, au-dessus : c'est ce qui est conservé.
    expect(screen.getByTestId("contexte")).toBeInTheDocument();
  });

  it("garde le même lot à travers un rechargement", async () => {
    // Le lot est le PASSAGE sur l'écran (§4.4). Gardé dans le composant, il
    // repartait à chaque remontage : recharger la liste détachait la suite
    // de la saisie de l'épisode commencé, et la timeline montrait deux
    // bandes là où le joueur n'a fait qu'un passage.
    const utilisateur = userEvent.setup();
    await jusquALaSelection(utilisateur);

    await utilisateur.click(screen.getByRole("button", { name: /^Déclarer : Super Mario World$/ }));
    const avant = faux.declarer.mock.calls[0][0].batchId;

    await utilisateur.click(screen.getByRole("button", { name: "Recharger la liste" }));
    await waitFor(() => expect(screen.queryByTestId("squelette")).toBeNull());
    await utilisateur.click(screen.getByRole("button", { name: /^Déclarer : Chrono Trigger$/ }));

    expect(faux.declarer.mock.calls.at(-1)![0].batchId).toBe(avant);
  });

  it("remonte l'écran avec ce qui vient d'être relu", async () => {
    // `SelectionMassive` dérive ses états initiaux de ses props. Sans
    // remontage, un rechargement laisserait à l'écran les lignes de l'état
    // PRÉCÉDENT : le joueur verrait sa correction défaite sans un mot.
    const utilisateur = userEvent.setup();
    await jusquALaSelection(utilisateur);
    expect(screen.queryByRole("button", { name: /^Déclaré : Super Mario World$/ })).toBeNull();

    faux.etatSelection.mockResolvedValue([
      { workId: "w1", played: true, completion: null, provenance: null, neverPlayed: false },
    ]);
    await utilisateur.click(screen.getByRole("button", { name: "Recharger la liste" }));

    expect(await screen.findByRole("button", { name: /^Déclaré : Super Mario World$/ }))
      .toBeInTheDocument();
  });

  it("relit les titres saisis, sur la plateforme affichée", async () => {
    // Le point d'entrée existait et n'était appelé par PERSONNE : une
    // revendication ajoutée disparaissait de l'écran au rechargement tout en
    // restant sur la timeline. Un moyen écrit et jamais employé ressemble
    // exactement à un moyen qui manque — sauf qu'il est vert.
    const utilisateur = userEvent.setup();
    faux.titresLibres.mockResolvedValue([{ id: "ucl_1", titre: "Le jeu de mon cousin" }]);

    await jusquALaSelection(utilisateur);

    expect(faux.titresLibres).toHaveBeenCalledWith(expect.any(String), "plt_snes");
    expect(await screen.findByTestId("titre-libre")).toHaveTextContent("Le jeu de mon cousin");
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
