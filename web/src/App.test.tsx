import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { client as ClientReel } from "./api/client";
import type { SyntheseDuProfil } from "./profil/SyntheseProfil";

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
  sante: vi.fn(),
  timeline: vi.fn(),
  // TYPÉ, contrairement à ses voisins, et c'est délibéré : le contrat
  // ci-dessous garde les NOMS du client, pas la FORME de ce qu'il rend. Un
  // champ ajouté à la synthèse ne manquait donc à aucun décor — il arrivait
  // `undefined` à l'écran, qui le testait contre `null` et le laissait
  // passer. Le type le fait rougir à la compilation, dans le fichier qu'il
  // faut corriger.
  synthese: vi.fn<() => Promise<SyntheseDuProfil>>(),
  ficheOeuvre: vi.fn(),
  corrigerDate: vi.fn(),
  anneeDeNaissance: vi.fn(),
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
  faux.sante.mockResolvedValue({
    status: "ok", database: { status: "ok", detail: "PostgreSQL 17.2" },
  });
  faux.declarer.mockResolvedValue({ created: 1, claims: [] });
  faux.timeline.mockResolvedValue({ entries: [], undated: [], warnings: [] });
  faux.synthese.mockResolvedValue({ activity: null, favourites: [], moments: 0, birthYear: null, figures: null, opening: null, span: null });
  faux.corrigerDate.mockResolvedValue(undefined);
  faux.anneeDeNaissance.mockResolvedValue(undefined);
  faux.ficheOeuvre.mockResolvedValue({
    id: "w1", title: "Super Mario World", coverUrl: null,
    editions: [{ platformId: "plt_snes", platformName: "Super Nintendo",
                 region: "PAL", date: "1990-01-01", precision: "year" }],
  });
});

afterEach(() => vi.clearAllMocks());

async function jusquALaSelection(utilisateur: ReturnType<typeof userEvent.setup>) {
  render(<App />);
  await utilisateur.click(await screen.findByRole("button", { name: /^Super Nintendo/ }));
  // Une carte de décennie OUVRE l'affinage sans naviguer ; « quelque part
  // dans les années 90 » est ce qui continue. E01 en fait une réponse
  // pleine — et c'est ce qui rend l'affinage atteignable, au lieu d'une
  // course que l'utilisateur perd sur une machine rapide.
  await utilisateur.click(screen.getByRole("button", { name: /Années 90/ }));
  await utilisateur.click(screen.getByRole("button", { name: /quelque part/i }));
  // E01, temps 3 : la récompense s'intercale entre la période et la liste.
  // C'est un geste de plus, et il est VOULU — §24.4 veut le bénéfice avant
  // l'effort, pas après.
  await utilisateur.click(await screen.findByRole("button", { name: /Voir les jeux/ }));
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
                      occurredAt: { kind: "Year", year: 1990 },
                      memory: null }] },
        { isEpisode: false, interval: { start: "1995-01-01", end: "1995-12-31" },
          moments: [{ id: "debut", type: "StartedGame", targetKind: "work",
                      targetId: "w1", targetLabel: "Super Mario World",
                      occurredAt: { kind: "Year", year: 1995 },
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

  it("porte la synthèse AU-DESSUS de l'axe, et elle vient de l'API", async () => {
    // E04 : « sa synthèse forme l'en-tête de `/mon-histoire`, AU-DESSUS de la
    // timeline E03 ». L'ordre n'est pas décoratif : le portrait est ce qui
    // doit produire « oui, ça me ressemble », et il le produit avant la
    // lecture détaillée, pas après.
    const utilisateur = userEvent.setup();
    faux.synthese.mockResolvedValue({
      activity: null, favourites: [], moments: 52,
      birthYear: null,
      figures: { consoles: 2, gamesDeclared: 40, finished: 9, memoriesWritten: 3 },
      opening: { years: 35, platform: "Game Boy",
                 occurredAt: { kind: "ApproximateYear", year: 1991, margin: 2 } },
      span: null,
    });

    await jusquALaSelection(utilisateur);
    await utilisateur.click(screen.getByRole("button", { name: "Voir ma timeline" }));

    const portrait = await screen.findByTestId("portrait");
    expect(portrait).toHaveTextContent("Game Boy");
    // AU-DESSUS : mesuré sur le document, pas supposé d'après l'ordre du
    // code. `compareDocumentPosition` dit FOLLOWING quand l'axe suit.
    const axe = screen.getByTestId("axe");
    expect(portrait.compareDocumentPosition(axe) & Node.DOCUMENT_POSITION_FOLLOWING)
      .toBeTruthy();
  });

  it("ne recompte pas les chiffres sur ce que l'écran a chargé", async () => {
    // Le défaut que cette architecture existe pour empêcher : l'écran n'a
    // qu'UNE plateforme en mémoire et quelques lignes ; un compte fait ici
    // dirait « 1 console » à qui en a saisi quatre, et il serait juste par
    // rapport à l'écran. Les chiffres affichés sont donc EXACTEMENT ceux que
    // l'API rend — y compris quand ils ne ressemblent pas à l'écran.
    const utilisateur = userEvent.setup();
    faux.synthese.mockResolvedValue({
      activity: null, favourites: [], moments: 160,
      birthYear: null,
      figures: { consoles: 4, gamesDeclared: 128, finished: 31, memoriesWritten: 7 },
      opening: null,
      span: null,
    });
    faux.timeline.mockResolvedValue({ entries: [], undated: [], warnings: [] });

    await jusquALaSelection(utilisateur);
    await utilisateur.click(screen.getByRole("button", { name: "Voir ma timeline" }));

    await screen.findByTestId("portrait");
    expect(screen.getAllByTestId("portrait-nombre").map((n) => n.textContent))
      .toEqual(["4", "128", "31", "7"]);
  });

  it("demande la synthèse pour le MÊME profil que l'axe", async () => {
    const utilisateur = userEvent.setup();
    await jusquALaSelection(utilisateur);
    await utilisateur.click(screen.getByRole("button", { name: "Voir ma timeline" }));

    // DEUX appels, et c'est la conception : la sonde de reprise au montage
    // (E01), puis la lecture fraîche à l'ouverture de l'axe. Ils portent sur
    // le même profil — le contraire ferait lire à quelqu'un l'histoire d'un
    // autre.
    await waitFor(() => expect(faux.synthese).toHaveBeenCalledTimes(2));
    expect(faux.synthese.mock.calls[1]).toEqual(faux.timeline.mock.calls[0]);
    expect(faux.synthese.mock.calls[0]).toEqual(faux.timeline.mock.calls[0]);
  });

  it("ne montre pas un portrait d'AVANT la saisie", async () => {
    // La tentation est de réutiliser la réponse de la sonde plutôt que de
    // relire : elle est déjà là. Elle date pourtant du montage — c'est-à-dire
    // d'avant tout ce que le joueur vient de déclarer —, et le portrait
    // montrerait des chiffres périmés au moment précis où il demande « est-ce
    // que ça me ressemble ? ».
    const utilisateur = userEvent.setup();
    faux.synthese
      .mockResolvedValueOnce({
        moments: 0, birthYear: null, activity: null, favourites: [],
        figures: null, opening: null, span: null })
      .mockResolvedValue({
        activity: null,
        favourites: [],
        moments: 33,
        birthYear: null,
        figures: { consoles: 1, gamesDeclared: 30, finished: 2, memoriesWritten: 1 },
        opening: null,
        span: null,
      });

    await jusquALaSelection(utilisateur);
    await utilisateur.click(screen.getByRole("button", { name: "Voir ma timeline" }));

    await screen.findByTestId("portrait");
    expect(screen.getAllByTestId("portrait-nombre").map((n) => n.textContent))
      .toEqual(["1", "30", "2", "1"]);
  });

  it("dit que rien n'a pu s'ouvrir quand la synthèse échoue", async () => {
    // Elle voyage avec l'axe : un en-tête qui manque en silence ferait croire
    // au joueur que son histoire s'est vidée, et c'est le pire endroit du
    // produit pour laisser ce doute.
    const utilisateur = userEvent.setup();
    faux.synthese.mockRejectedValue(new Error("réseau"));

    await jusquALaSelection(utilisateur);
    await utilisateur.click(screen.getByRole("button", { name: "Voir ma timeline" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByTestId("axe")).toBeNull();
  });
});

describe("App — E05, la fiche de jeu s'ouvre depuis l'axe", () => {
  const AXE = {
    entries: [
      { isEpisode: false, interval: { start: "1990-01-01", end: "1990-12-31" },
        moments: [
          { id: "m1", type: "StartedGame", targetKind: "work", targetId: "w1",
            targetLabel: "Super Mario World",
            occurredAt: { kind: "Year", year: 1990 }, platformId: "plt_snes",
            memory: { title: "L'été", text: "À deux." } },
          { id: "m2", type: "StartedGame", targetKind: "work", targetId: "w2",
            targetLabel: "Chrono Trigger",
            occurredAt: { kind: "Year", year: 1995 }, platformId: "plt_snes",
            memory: null },
        ] },
    ],
    undated: [],
    warnings: [],
  };

  async function jusquALAxe(utilisateur: ReturnType<typeof userEvent.setup>) {
    faux.timeline.mockResolvedValue(AXE);
    await jusquALaSelection(utilisateur);
    await utilisateur.click(screen.getByRole("button", { name: "Voir ma timeline" }));
    await screen.findByTestId("axe");
  }

  it("ouvre la fiche du jeu dont on clique le titre", async () => {
    // E03, actions : « Clic sur un jeu → E05 ». Le titre, pas la ligne : le
    // moment lui-même appartiendra à E07.
    const utilisateur = userEvent.setup();
    await jusquALAxe(utilisateur);

    await utilisateur.click(screen.getByRole("button", { name: "Chrono Trigger" }));

    expect(await screen.findByTestId("fiche")).toHaveTextContent("Chrono Trigger");
    expect(faux.ficheOeuvre).toHaveBeenCalledWith("w2");
  });

  it("n'y montre que les moments de CE jeu", async () => {
    // La fiche rassemble ce que l'axe disperse ; y laisser entrer les moments
    // d'un autre titre ferait exactement l'inverse.
    const utilisateur = userEvent.setup();
    await jusquALAxe(utilisateur);

    await utilisateur.click(screen.getByRole("button", { name: "Super Mario World" }));

    await screen.findByTestId("fiche");
    expect(screen.getAllByTestId("fiche-moment")).toHaveLength(1);
    expect(screen.getByTestId("fiche-vous")).toHaveTextContent("À deux.");
  });

  it("rétracte par le MÊME appel que la sélection massive", async () => {
    // « Pas un second chemin d'écriture » : le même point d'entrée, la même
    // forme. Un second produirait des événements différents pour le même
    // geste, et le journal cesserait d'être comparable à lui-même.
    const utilisateur = userEvent.setup();
    await jusquALAxe(utilisateur);
    await utilisateur.click(screen.getByRole("button", { name: "Chrono Trigger" }));
    await screen.findByTestId("fiche");

    await utilisateur.click(screen.getByRole("button", { name: /Retirer/i }));

    expect(faux.retracter).toHaveBeenCalledWith(expect.any(String), "plt_snes", "w2");
    // Et l'axe est relu : la fiche dérive ses moments de lui, donc elle se
    // met à jour sans copier quoi que ce soit.
    await waitFor(() => expect(faux.timeline).toHaveBeenCalledTimes(2));
  });

  it("déclare par le MÊME appel que la sélection massive", async () => {
    // L'état vide est atteignable : on se rétracte, puis on recoche. C'est
    // le « décoché par erreur » d'E02, vu depuis la fiche.
    const utilisateur = userEvent.setup();
    await jusquALAxe(utilisateur);
    await utilisateur.click(screen.getByRole("button", { name: "Chrono Trigger" }));
    await screen.findByTestId("fiche");

    // L'axe relu ne porte plus ce jeu : la fiche passe à l'état vide.
    faux.timeline.mockResolvedValue({ ...AXE, entries: [] });
    await utilisateur.click(screen.getByRole("button", { name: /Retirer/i }));

    await utilisateur.click(await screen.findByRole("button", { name: /Vous y avez joué/i }));

    expect(faux.declarer).toHaveBeenCalledWith(expect.objectContaining({
      platformId: "plt_snes",
      entries: [{ workId: "w2" }],
    }));
  });

  it("ne demande aucune fiche de référentiel pour un titre saisi", async () => {
    // §3.5 : l'API répond 404, et c'est juste. La demander quand même ferait
    // une panne attendue à chaque ouverture.
    const utilisateur = userEvent.setup();
    faux.timeline.mockResolvedValue({
      ...AXE,
      entries: [{ isEpisode: false, interval: { start: "1990-01-01", end: "1990-12-31" },
        moments: [{ id: "m9", type: "StartedGame", targetKind: "unresolvedClaim",
          targetId: "ucl_1", targetLabel: "Le jeu de mon cousin",
          occurredAt: { kind: "Year", year: 1990 }, platformId: "plt_snes",
          memory: null }] }],
    });
    await jusquALaSelection(utilisateur);
    await utilisateur.click(screen.getByRole("button", { name: "Voir ma timeline" }));
    await screen.findByTestId("axe");

    await utilisateur.click(screen.getByRole("button", { name: "Le jeu de mon cousin" }));

    expect(await screen.findByTestId("fiche-non-canonique")).toBeInTheDocument();
    expect(faux.ficheOeuvre).not.toHaveBeenCalled();
  });

  it("retrouve l'épisode DÉPLIÉ en revenant de la fiche", async () => {
    // E03 : « clic sur un jeu → E05, en CONSERVANT la position ». Le
    // repliage vivait dans l'entrée : ouvrir une fiche démonte l'axe, et
    // l'état partait avec lui. C'est l'apprentissage 73 — ce qui doit
    // survivre à un remontage s'écrit hors du composant.
    const utilisateur = userEvent.setup();
    faux.timeline.mockResolvedValue({
      entries: [{ isEpisode: true, interval: { start: "1990-01-01", end: "1990-12-31" },
        moments: AXE.entries[0].moments }],
      undated: [],
      warnings: [],
    });
    await jusquALaSelection(utilisateur);
    await utilisateur.click(screen.getByRole("button", { name: "Voir ma timeline" }));
    await screen.findByTestId("axe");

    await utilisateur.click(screen.getByRole("button", { name: /Déplier/ }));
    await utilisateur.click(screen.getByRole("button", { name: "Chrono Trigger" }));
    await screen.findByTestId("fiche");
    await utilisateur.click(screen.getByRole("button", { name: /Revenir/ }));

    // Les titres sont là : l'épisode n'a pas été refermé.
    expect(screen.getByRole("button", { name: "Chrono Trigger" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Super Mario World" })).toBeInTheDocument();
  });

  it("s'ouvre depuis E02 et y REVIENT, déclarations comprises", async () => {
    // E02 promet « → E05 en conservant la position ». E05 est une page :
    // l'état local de la sélection part avec le démontage, et tout ce qu'il
    // portait est en base depuis le geste qui l'a produit. Revenir RELIT,
    // sans quoi l'écran montrerait moins que ce que la base contient.
    const utilisateur = userEvent.setup();
    await jusquALaSelection(utilisateur);
    await utilisateur.click(screen.getByRole("button", { name: /^Déclarer : Super Mario World$/ }));

    // L'état relu porte la déclaration qu'on vient de faire.
    faux.etatSelection.mockResolvedValue([
      { workId: "w1", played: true, completion: null, provenance: null,
        neverPlayed: false, affect: null },
    ]);

    // L'axe porte la couche personnelle de la fiche. Venant de la
    // sélection, il n'a pas été lu — la fiche montrerait « rien de déclaré »
    // sur un jeu qu'on vient de cocher.
    faux.timeline.mockResolvedValue({
      entries: [{ isEpisode: false, interval: { start: "1990-01-01", end: "1990-12-31" },
        moments: [{ id: "m1", type: "StartedGame", targetKind: "work", targetId: "w1",
          targetLabel: "Super Mario World",
          occurredAt: { kind: "Year", year: 1990 }, platformId: "plt_snes",
          memory: null }] }],
      undated: [],
      warnings: [],
    });

    await utilisateur.click(
      screen.getByRole("button", { name: /Voir la fiche de Super Mario World/ }));
    expect(await screen.findByTestId("fiche")).toHaveTextContent("Super Mario World");
    expect(screen.getAllByTestId("fiche-moment")).toHaveLength(1);

    await utilisateur.click(screen.getByRole("button", { name: /Revenir/ }));

    // On est bien revenu DANS la liste, et la ligne est toujours déclarée.
    expect(await screen.findByRole("button", { name: /^Déclaré : Super Mario World$/ }))
      .toBeInTheDocument();
    expect(screen.queryByTestId("axe")).toBeNull();
  });

  it("revient à l'axe : la fiche n'est pas un cul-de-sac", async () => {
    const utilisateur = userEvent.setup();
    await jusquALAxe(utilisateur);
    await utilisateur.click(screen.getByRole("button", { name: "Chrono Trigger" }));
    await screen.findByTestId("fiche");

    await utilisateur.click(screen.getByRole("button", { name: /Revenir/i }));

    expect(screen.getByTestId("axe")).toBeInTheDocument();
    expect(screen.queryByTestId("fiche")).toBeNull();
  });
});

describe("App — E07, corriger une date sans quitter l'axe", () => {
  const AXE = {
    entries: [
      { isEpisode: false, interval: { start: "1995-01-01", end: "1995-12-31" },
        moments: [{ id: "m1", type: "CompletedGame", targetKind: "work", targetId: "w1",
          targetLabel: "Super Mario World",
          occurredAt: { kind: "Year", year: 1995 }, platformId: "plt_snes",
          memory: null }] },
    ],
    undated: [],
    warnings: [],
  };

  async function jusquAuPanneau(utilisateur: ReturnType<typeof userEvent.setup>) {
    faux.timeline.mockResolvedValue(AXE);
    await jusquALaSelection(utilisateur);
    await utilisateur.click(screen.getByRole("button", { name: "Voir ma timeline" }));
    await screen.findByTestId("axe");
    await utilisateur.click(screen.getByRole("button", { name: /Corriger ce moment/ }));
    await screen.findByTestId("panneau-moment");
  }

  it("ouvre un PANNEAU : l'axe reste à l'écran", async () => {
    // E07 : « panneau, jamais page ». Naviguer pour dater un souvenir puis
    // revenir coûte deux transitions et fait perdre la position dans la
    // timeline — et c'est justement en la relisant qu'on corrige.
    const utilisateur = userEvent.setup();
    await jusquAuPanneau(utilisateur);

    expect(screen.getByTestId("axe")).toBeInTheDocument();
    expect(screen.getByTestId("panneau-moment")).toHaveTextContent("Super Mario World");
  });

  it("corrige la date, puis referme et relit l'axe", async () => {
    const utilisateur = userEvent.setup();
    await jusquAuPanneau(utilisateur);

    const champ = screen.getByRole("spinbutton", { name: /^Année$/ });
    await utilisateur.clear(champ);
    await utilisateur.type(champ, "1998");
    await utilisateur.click(screen.getByRole("button", { name: /^Enregistrer$/ }));

    expect(faux.corrigerDate).toHaveBeenCalledWith(
      expect.any(String), "m1", { kind: "year", year: 1998 });
    // Relu, parce que le journal est en ajout seul : l'écran n'a rien à
    // réconcilier, et c'est la relecture qui fait apparaître l'avertissement
    // causal quand la correction en produit un.
    await waitFor(() => expect(faux.timeline).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByTestId("panneau-moment")).toBeNull());
  });

  it("relit ce qui a déjà été dit du jeu", async () => {
    // Rouvrir vierge ferait disparaître ce que le joueur vient de dire.
    const utilisateur = userEvent.setup();
    faux.etatSelection.mockResolvedValue([
      { workId: "w1", played: true, completion: "finished",
        provenance: "owned", neverPlayed: false, affect: "favourite" },
    ]);
    await jusquAuPanneau(utilisateur);

    expect(await screen.findByRole("button", { name: "Mon préféré" }))
      .toHaveAttribute("aria-pressed", "true");
  });

  it("règle l'affect par le MÊME point d'entrée, avec la date DU MOMENT", async () => {
    // « Pas un second chemin d'écriture. » Et la période est celle du
    // moment : lui donner celle du parcours daterait l'achèvement d'un
    // souvenir de 1995 à la date de sa correction.
    const utilisateur = userEvent.setup();
    faux.etatSelection.mockResolvedValue([]);
    await jusquAuPanneau(utilisateur);
    await screen.findByTestId("panneau-etat");

    await utilisateur.click(screen.getByRole("button", { name: "J'ai adoré" }));

    expect(faux.declarer).toHaveBeenCalledWith(expect.objectContaining({
      platformId: "plt_snes",
      period: { kind: "year", year: 1995 },
      entries: [{ workId: "w1", affect: "loved" }],
    }));
  });

  it("n'offre rien à régler pour un titre saisi", async () => {
    // Une revendication n'a pas d'identifiant d'œuvre : une déclaration ne
    // saurait pas sur quoi porter. Le témoin est dans le test ci-dessus.
    const utilisateur = userEvent.setup();
    faux.timeline.mockResolvedValue({
      entries: [{ isEpisode: false, interval: { start: "1995-01-01", end: "1995-12-31" },
        moments: [{ id: "m9", type: "StartedGame", targetKind: "unresolvedClaim",
          targetId: "ucl_1", targetLabel: "Le jeu de mon cousin",
          occurredAt: { kind: "Year", year: 1995 }, platformId: "plt_snes",
          memory: null }] }],
      undated: [],
      warnings: [],
    });
    await jusquALaSelection(utilisateur);
    await utilisateur.click(screen.getByRole("button", { name: "Voir ma timeline" }));
    await screen.findByTestId("axe");
    await utilisateur.click(screen.getByRole("button", { name: /Corriger ce moment/ }));

    await screen.findByTestId("panneau-moment");
    expect(screen.queryByTestId("panneau-etat")).toBeNull();
    expect(faux.etatSelection).toHaveBeenCalledTimes(1);
  });

  it("se ferme sans rien corriger", async () => {
    const utilisateur = userEvent.setup();
    await jusquAuPanneau(utilisateur);

    await utilisateur.click(screen.getByRole("button", { name: /Fermer sans corriger/ }));

    expect(screen.queryByTestId("panneau-moment")).toBeNull();
    expect(faux.corrigerDate).not.toHaveBeenCalled();
    expect(screen.getByTestId("axe")).toBeInTheDocument();
  });

  it("dit ce qui a échoué quand la correction ne passe pas", async () => {
    const utilisateur = userEvent.setup();
    faux.corrigerDate.mockRejectedValue(new Error("réseau"));
    await jusquAuPanneau(utilisateur);

    await utilisateur.click(screen.getByRole("button", { name: /^Enregistrer$/ }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});

describe("App — E03, les trous sont des invitations", () => {
  /** Un axe qui ne couvre QUE 1990 : tout ce qui suit est un trou. */
  const AXE_MAIGRE = {
    entries: [
      { isEpisode: false, interval: { start: "1990-01-01", end: "1990-12-31" },
        moments: [{ id: "m1", type: "StartedGame", targetKind: "work", targetId: "w1",
          targetLabel: "Super Mario World",
          occurredAt: { kind: "Year", year: 1990 }, platformId: "plt_snes",
          memory: null }] },
    ],
    undated: [],
    warnings: [],
  };

  it("ramène à la sélection avec CETTE période déjà posée", async () => {
    // E03 : « zone vide d'une période → E02 préfiltré sur cette période ».
    // On repasse par le choix de machine, parce que E02 est une liste PAR
    // PLATEFORME et qu'il n'y en a aucune de choisie quand on lit son axe.
    const utilisateur = userEvent.setup();
    faux.timeline.mockResolvedValue(AXE_MAIGRE);
    await jusquALaSelection(utilisateur);
    await utilisateur.click(screen.getByRole("button", { name: "Voir ma timeline" }));
    await screen.findByTestId("axe");

    const invitations = screen.getAllByRole("button", { name: /Compléter ces années/ });
    await utilisateur.click(invitations[0]);
    await utilisateur.click(await screen.findByRole("button", { name: /^Super Nintendo/ }));

    // La période du TROU, pas celle qu'on avait saisie à l'aller.
    expect(await screen.findByTestId("contexte")).toHaveTextContent("2000");
    expect(screen.getByTestId("contexte")).toHaveTextContent("2009");
  });

  it("ouvre un NOUVEAU passage, pas la suite de l'ancien", async () => {
    // §4.4 : le lot fait l'épisode. Reprendre celui d'avant collerait sur
    // l'axe une seule bande là où le joueur est revenu deux fois — et la
    // relance qu'on vient de lui proposer deviendrait invisible.
    const utilisateur = userEvent.setup();
    faux.timeline.mockResolvedValue(AXE_MAIGRE);
    await jusquALaSelection(utilisateur);
    await utilisateur.click(screen.getByRole("button", { name: /^Déclarer : Super Mario World$/ }));
    await waitFor(() => expect(faux.declarer).toHaveBeenCalled());
    const premierLot = faux.declarer.mock.calls[0][0].batchId;

    await utilisateur.click(screen.getByRole("button", { name: "Voir ma timeline" }));
    await screen.findByTestId("axe");
    await utilisateur.click(
      screen.getAllByRole("button", { name: /Compléter ces années/ })[0]);
    await utilisateur.click(await screen.findByRole("button", { name: /^Super Nintendo/ }));
    await utilisateur.click(
      await screen.findByRole("button", { name: /^Déclarer : Chrono Trigger$/ }));

    await waitFor(() => expect(faux.declarer).toHaveBeenCalledTimes(2));
    const secondLot = faux.declarer.mock.calls[1][0].batchId;
    expect(secondLot).not.toBe(premierLot);
  });

  it("un profil trop maigre invite à compléter, par le MÊME chemin", async () => {
    // E04, état « trop maigre » : « proposer E02 ». Elle passe par le choix
    // de machine, comme la relance des trous — E02 est une liste PAR
    // PLATEFORME, et aucune n'est choisie quand on lit son histoire.
    const utilisateur = userEvent.setup();
    faux.synthese.mockResolvedValue({
      activity: null, favourites: [], moments: 4, birthYear: null, figures: null,
      opening: { years: 31, platform: "Super Nintendo",
                 occurredAt: { kind: "Year", year: 1995 } },
      span: null,
    });
    faux.timeline.mockResolvedValue(AXE_MAIGRE);
    await jusquALaSelection(utilisateur);
    // La période telle que le joueur l'a donnée, AVANT le détour.
    const periodeDonnee = screen.getByTestId("contexte").textContent;

    await utilisateur.click(screen.getByRole("button", { name: "Voir ma timeline" }));
    await screen.findByTestId("portrait");

    await utilisateur.click(screen.getByRole("button", { name: /Ajouter des jeux/ }));

    expect(await screen.findByRole("heading", { name: /console/i })).toBeInTheDocument();

    // Et elle ne PRÉSUME aucune période : il n'y a pas de décennie creuse à
    // combler, il y a une histoire à commencer. Celle du joueur revient
    // INCHANGÉE — en inventer une remettrait le défaut que la Phase 1 a
    // corrigé, où tous les jeux portaient une année que personne n'avait
    // donnée. On compare donc à ce qu'on a lu, pas à une valeur écrite ici :
    // une constante recopiée aurait pu coïncider avec l'invention.
    await utilisateur.click(screen.getByRole("button", { name: /^Super Nintendo/ }));
    expect(await screen.findByTestId("contexte")).toHaveTextContent(periodeDonnee!);
  });

  it("ne propose rien à compléter quand l'axe est vide", async () => {
    // Le témoin est dans les deux tests ci-dessus : le MÊME écran, nourri,
    // propose bien. Ici l'axe porte déjà sa propre invitation.
    const utilisateur = userEvent.setup();
    faux.timeline.mockResolvedValue({ entries: [], undated: [], warnings: [] });
    await jusquALaSelection(utilisateur);
    await utilisateur.click(screen.getByRole("button", { name: "Voir ma timeline" }));

    await screen.findByTestId("axe");
    expect(screen.queryByRole("button", { name: /Compléter ces années/ })).toBeNull();
  });
});

describe("App — E01, le visiteur qui revient", () => {
  it("ne propose rien sur un profil vierge", async () => {
    // ⚠️ L'absence se constate SUR LE TEMPS 1. Une première écriture de ce
    // test cliquait d'abord une console : l'offre n'est rendue qu'à
    // l'accueil, donc il passait quoi qu'il arrive — une mutation l'a montré
    // en ne faisant tomber qu'un test sur les deux attendus.
    render(<App />);
    await screen.findByRole("button", { name: /^Super Nintendo/ });

    expect(screen.queryByTestId("reprise")).toBeNull();
    // Le témoin est dans le test suivant : le MÊME écran propose bien la
    // reprise dès qu'un moment existe.
  });

  it("propose de reprendre quand l'historique n'est pas vide", async () => {
    faux.synthese.mockResolvedValue({ activity: null, favourites: [], moments: 33, birthYear: null, figures: null, opening: null, span: null });
    render(<App />);

    expect(await screen.findByTestId("reprise")).toHaveTextContent("33");
  });

  it("n'attend PAS la sonde pour rendre l'accueil utilisable", async () => {
    // E01 : « Chargement : aucun », et le chronomètre du KPI démarre au
    // premier clic. Si le temps 1 dépendait de cette lecture, tout le monde
    // la paierait — y compris celui qui arrive pour la première fois et n'a
    // rien à reprendre.
    const utilisateur = userEvent.setup();
    faux.synthese.mockReturnValue(new Promise(() => {}));
    render(<App />);

    await utilisateur.click(await screen.findByRole("button", { name: /^Super Nintendo/ }));

    expect(screen.getByRole("heading", { name: /quand/i })).toBeInTheDocument();
  });

  it("reprend l'histoire en UN geste, sans repasser par les trois temps", async () => {
    const utilisateur = userEvent.setup();
    faux.synthese.mockResolvedValue({
      activity: null, favourites: [], moments: 33,
      birthYear: null,
      figures: { consoles: 1, gamesDeclared: 30, finished: 2, memoriesWritten: 1 },
      opening: { years: 31, platform: "Super Nintendo",
                 occurredAt: { kind: "Year", year: 1995 } },
      span: null,
    });
    render(<App />);

    await utilisateur.click(await screen.findByRole("button", { name: /Reprendre/ }));

    expect(await screen.findByTestId("portrait")).toBeInTheDocument();
    expect(screen.getByTestId("axe")).toBeInTheDocument();
    // Ni période ni sélection en chemin : c'est tout l'intérêt de l'offre.
    expect(faux.etatSelection).not.toHaveBeenCalled();
  });

  it("laisse l'accueil intact quand on ignore l'offre", async () => {
    const utilisateur = userEvent.setup();
    faux.synthese.mockResolvedValue({ activity: null, favourites: [], moments: 33, birthYear: null, figures: null, opening: null, span: null });
    render(<App />);
    await screen.findByTestId("reprise");

    await utilisateur.click(screen.getByRole("button", { name: /^Super Nintendo/ }));

    expect(screen.getByRole("heading", { name: /quand/i })).toBeInTheDocument();
  });

  it("reste muet quand la sonde échoue, sans alarmer", async () => {
    // L'offre est un bonus. Une alerte au premier écran pour une lecture
    // facultative coûterait plus qu'elle ne rapporte — mais l'échec ne doit
    // pas non plus ressembler à un profil vierge : c'est pourquoi il rend
    // `null` et non zéro.
    faux.synthese.mockRejectedValue(new Error("réseau"));
    render(<App />);

    expect(await screen.findByRole("button", { name: /^Super Nintendo/ })).toBeInTheDocument();
    expect(screen.queryByTestId("reprise")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("App — E01 temps 3, la récompense immédiate", () => {
  it("s'intercale entre la période et la liste", async () => {
    // « Dès la validation du temps 2 » : la liste ne vient plus tout de
    // suite. C'est le premier retour visible exigé par le principe 1, et
    // l'écran où se joue le KPI de première session.
    const utilisateur = userEvent.setup();
    render(<App />);
    await utilisateur.click(await screen.findByRole("button", { name: /^Super Nintendo/ }));
    await utilisateur.click(screen.getByRole("button", { name: /Années 90/ }));
    await utilisateur.click(screen.getByRole("button", { name: /quelque part/i }));

    expect(await screen.findByTestId("temps3")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Déclarer : / })).toBeNull();
  });

  it("n'attend AUCUN chargement pour s'afficher", async () => {
    // « Sans transition ni chargement bloquant. » Les trois lectures que la
    // sélection demande ne répondent JAMAIS ici : si la récompense en
    // dépendait d'une seule, elle ne s'afficherait pas — et le joueur
    // attendrait devant l'écran du temps 2.
    const utilisateur = userEvent.setup();
    faux.etatSelection.mockReturnValue(new Promise(() => {}));
    faux.souvenirs.mockReturnValue(new Promise(() => {}));
    faux.titresLibres.mockReturnValue(new Promise(() => {}));
    render(<App />);
    await utilisateur.click(await screen.findByRole("button", { name: /^Super Nintendo/ }));
    await utilisateur.click(screen.getByRole("button", { name: /Années 90/ }));
    await utilisateur.click(screen.getByRole("button", { name: /quelque part/i }));

    expect(await screen.findByTestId("temps3")).toBeInTheDocument();
  });

  it("montre de vraies jaquettes, celles de la machine choisie", async () => {
    // « L'aperçu de quatre jaquettes n'est pas décoratif : il montre
    // concrètement ce que la suite propose. » Elles viennent des œuvres déjà
    // lues au temps 1 — c'est ce qui rend l'absence de chargement vraie par
    // construction.
    const utilisateur = userEvent.setup();
    faux.oeuvres.mockResolvedValue(OEUVRES.map((o) => ({
      ...o, couverture: `/api/covers/${o.id}`,
    })));
    render(<App />);
    await utilisateur.click(await screen.findByRole("button", { name: /^Super Nintendo/ }));
    await utilisateur.click(screen.getByRole("button", { name: /Années 90/ }));
    await utilisateur.click(screen.getByRole("button", { name: /quelque part/i }));

    const apercu = await screen.findByTestId("temps3-apercu");
    expect([...apercu.querySelectorAll("img")].map((i) => i.getAttribute("alt")))
      .toEqual(["Super Mario World", "Chrono Trigger"]);
  });

  it("« je ne sais plus » y mène aussi : jamais un blocage", async () => {
    // E01 : « "Je ne sais plus" → temps suivant, avec Unknown — JAMAIS un
    // blocage. » La récompense arrive donc sans date, plutôt que pas du tout.
    const utilisateur = userEvent.setup();
    render(<App />);
    await utilisateur.click(await screen.findByRole("button", { name: /^Super Nintendo/ }));
    await utilisateur.click(screen.getByRole("button", { name: /ne sais plus/i }));

    expect(await screen.findByTestId("temps3")).toBeInTheDocument();
    expect(screen.queryByTestId("temps3-axe")).toBeNull();
  });

  it("ne se rejoue PAS quand on change la période depuis la liste", async () => {
    // Le temps 3 appartient à E01, pas à E02. Changer la période depuis le
    // contexte de saisie est une correction : rejouer « votre histoire
    // commence » y ferait payer un geste de plus pour un cadeau déjà reçu.
    const utilisateur = userEvent.setup();
    await jusquALaSelection(utilisateur);

    await utilisateur.click(screen.getByRole("button", { name: /changer la période/i }));
    await utilisateur.click(screen.getByRole("button", { name: /Années 90/ }));
    await utilisateur.click(screen.getByRole("button", { name: /quelque part/i }));

    expect(await screen.findByRole("button", { name: /^Déclarer : Super Mario World$/ }))
      .toBeInTheDocument();
    expect(screen.queryByTestId("temps3")).toBeNull();
  });

  it("la continuation ouvre la sélection, préfiltrée sur cette machine", async () => {
    const utilisateur = userEvent.setup();
    render(<App />);
    await utilisateur.click(await screen.findByRole("button", { name: /^Super Nintendo/ }));
    await utilisateur.click(screen.getByRole("button", { name: /Années 90/ }));
    await utilisateur.click(screen.getByRole("button", { name: /quelque part/i }));
    await utilisateur.click(await screen.findByRole("button", { name: /Voir les jeux/ }));

    expect(await screen.findByRole("button", { name: /^Déclarer : Super Mario World/ }))
      .toBeInTheDocument();
    expect(faux.etatSelection).toHaveBeenCalledWith(expect.any(String), "plt_snes");
  });
});

describe("App — la récompense arrive avant l'effort (§24.4)", () => {
  it("montre la phrase de récit dès la console choisie", async () => {
    // « La PREMIÈRE console saisie déclenche déjà une phrase de récit. »
    // Pas après la période, pas après la liste : au premier geste, avant
    // qu'on ait rien demandé de plus.
    const utilisateur = userEvent.setup();
    render(<App />);

    await utilisateur.click(await screen.findByRole("button", { name: /^Super Nintendo/ }));

    expect(await screen.findByTestId("recit")).toHaveTextContent("Super Nintendo");
  });

  it("la montre AVANT la liste, pas avec elle", async () => {
    // Si elle n'arrivait qu'avec la liste, elle ne récompenserait plus rien :
    // la liste est déjà la récompense. §24.4 la veut au premier geste.
    const utilisateur = userEvent.setup();
    render(<App />);

    await utilisateur.click(await screen.findByRole("button", { name: /^Super Nintendo/ }));

    expect(screen.getByTestId("recit")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Déclarer : / })).toBeNull();
  });

  it("ne la laisse pas traîner sur l'écran de sélection", async () => {
    // Elle ouvre une histoire ; répétée au-dessus de la liste, elle
    // deviendrait un bandeau qu'on cesse de lire — et le contexte de saisie
    // dit déjà la machine, mieux et à sa place (E02 repère A).
    const utilisateur = userEvent.setup();
    await jusquALaSelection(utilisateur);

    expect(screen.queryByTestId("recit")).toBeNull();
  });
});

describe("App — est-ce moi, ou est-ce le service ? (audit 28)", () => {
  const injoignable = {
    status: "degraded" as const,
    database: { status: "unreachable" as const, detail: "connexion refusée" },
  };

  it("ne dit rien du service tant que rien n'est tombé", async () => {
    // Un bandeau permanent dirait « tout va bien » en continu, et on
    // cesserait de le lire — y compris le jour où il devient rouge. Et il ne
    // coûte même pas une requête : la question ne se pose pas encore.
    const utilisateur = userEvent.setup();
    await jusquALaSelection(utilisateur);

    expect(screen.queryByText(/Service indisponible/)).toBeNull();
    expect(faux.sante).not.toHaveBeenCalled();
  });

  it("répond à la question quand un geste échoue", async () => {
    // L'alerte du geste dit « ça n'a pas marché ». Elle ne dit pas POURQUOI,
    // et c'est la seule chose que le testeur veut savoir avant de décider
    // s'il réessaie ou s'il s'arrête.
    const utilisateur = userEvent.setup();
    faux.sante.mockResolvedValue(injoignable);
    await jusquALaSelection(utilisateur);

    faux.timeline.mockRejectedValue(new Error("réseau"));
    await utilisateur.click(screen.getByRole("button", { name: "Voir ma timeline" }));

    expect(await screen.findByText(/connexion refusée/)).toBeInTheDocument();
  });

  it("se tait de nouveau dès que le geste suivant aboutit", async () => {
    // Un diagnostic de panne qui survit à la réparation ferait douter d'un
    // état sain — c'est la règle que l'alerte du geste suit déjà.
    const utilisateur = userEvent.setup();
    faux.sante.mockResolvedValue(injoignable);
    await jusquALaSelection(utilisateur);

    faux.timeline.mockRejectedValue(new Error("réseau"));
    await utilisateur.click(screen.getByRole("button", { name: "Voir ma timeline" }));
    expect(await screen.findByText(/connexion refusée/)).toBeInTheDocument();

    faux.timeline.mockResolvedValue({ entries: [], undated: [], warnings: [] });
    await utilisateur.click(screen.getByRole("button", { name: "Voir ma timeline" }));

    await waitFor(() => expect(screen.queryByText(/connexion refusée/)).toBeNull());
  });

  it("n'affirme rien quand le service ne répond même pas", async () => {
    // Injoignable au point de ne pas répondre du tout : on ne SAIT pas, et
    // « ni vert ni rouge » vaut mieux qu'un diagnostic inventé.
    const utilisateur = userEvent.setup();
    faux.sante.mockRejectedValue(new Error("injoignable"));
    await jusquALaSelection(utilisateur);

    faux.timeline.mockRejectedValue(new Error("réseau"));
    await utilisateur.click(screen.getByRole("button", { name: "Voir ma timeline" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText(/Service indisponible/)).toBeNull();
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
    await utilisateur.click(screen.getByRole("button", { name: /quelque part/i }));

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
