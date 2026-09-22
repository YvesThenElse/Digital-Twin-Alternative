import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { client } from "./client";

/**
 * La couche qui traduit les intentions de l'écran en requêtes.
 *
 * <b>Elle n'avait aucun test</b>, et le parcours de bout en bout en était le
 * seul garde : une mutation figeant le genre de cible à « work » a survécu à
 * 143 tests front. C'est l'apprentissage 45 — un chemin dont le parcours est
 * le seul garde n'est pas gardé.
 *
 * Ces tests ne vérifient pas que l'API répond : ils vérifient ce que le
 * client LUI DEMANDE, qui est la seule chose dont il soit responsable.
 */

type Appel = { url: string; corps: unknown };

let appels: Appel[];
let reponse: unknown;

beforeEach(() => {
  appels = [];
  reponse = {};
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    appels.push({
      url,
      corps: init?.body === undefined ? undefined : JSON.parse(String(init.body)),
    });
    return { ok: true, status: 200, json: async () => reponse } as Response;
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("client.souvenir — la cible porte son genre", () => {
  it("écrit un souvenir d'œuvre sur une œuvre", async () => {
    await client.souvenir(
      "usr_1", { kind: "work", id: "wrk_42" }, { texte: "Noël 1994.", titre: "" });

    expect(appels[0].corps).toEqual({
      userId: "usr_1",
      targetKind: "work",
      targetId: "wrk_42",
      text: "Noël 1994.",
      // NUL, jamais `""` : l'écran tient une saisie, la base tient un fait.
      // Un repère vide s'afficherait sur l'axe comme une marque annonçant
      // une phrase introuvable.
      title: null,
    });
  });

  it("écrit un souvenir de titre saisi sur la REVENDICATION", async () => {
    // Figer le genre à « work » ici écrirait tous les souvenirs de titres
    // saisis sur des œuvres inexistantes. L'API les refuserait en nommant un
    // identifiant que l'écran n'affiche jamais — et le contenu le plus
    // personnel du produit se perdrait derrière un message incompréhensible.
    await client.souvenir(
      "usr_1", { kind: "unresolvedClaim", id: "ucl_ABC" },
      { texte: "Le dragon était bleu.", titre: "" });

    expect(appels[0].corps).toMatchObject({
      targetKind: "unresolvedClaim",
      targetId: "ucl_ABC",
    });
  });

  it("n'invente pas de genre de cible", async () => {
    // Les deux tests ci-dessus passeraient encore si le client envoyait le
    // genre reçu ET un second champ figé. On exige donc que les deux
    // requêtes DIFFÈRENT sur ce champ.
    await client.souvenir(
      "usr_1", { kind: "work", id: "wrk_42" }, { texte: "A", titre: "" });
    await client.souvenir(
      "usr_1", { kind: "unresolvedClaim", id: "ucl_ABC" }, { texte: "B", titre: "" });

    const genres = appels.map((a) => (a.corps as { targetKind: string }).targetKind);
    expect(new Set(genres).size).toBe(2);
  });
});

describe("client.souvenirs — relire ce qui a été écrit", () => {
  it("indexe les souvenirs par cible", async () => {
    reponse = [
      { targetKind: "work", targetId: "wrk_1", text: "Noël 1992.", title: "Le premier Noël" },
      { targetKind: "work", targetId: "wrk_2", text: "Chez mon cousin.", title: null },
    ];

    expect(await client.souvenirs("usr_1")).toEqual({
      wrk_1: { texte: "Noël 1992.", titre: "Le premier Noël" },
      // Le repère absent devient une SAISIE vide : le champ doit s'ouvrir
      // vide, pas afficher « null ».
      wrk_2: { texte: "Chez mon cousin.", titre: "" },
    });
  });

  it("ne retient que les œuvres — les titres saisis n'ont pas de ligne à l'écran", async () => {
    // L'état de la sélection ne rend pas encore les revendications : leur
    // souvenir n'aurait nulle part où s'afficher, et l'indexer ferait croire
    // à une ligne qui n'existe pas.
    reponse = [
      { targetKind: "work", targetId: "wrk_1", text: "Gardé.", title: null },
      { targetKind: "unresolvedClaim", targetId: "ucl_1", text: "Écarté.", title: null },
    ];

    expect(await client.souvenirs("usr_1"))
      .toEqual({ wrk_1: { texte: "Gardé.", titre: "" } });
  });

  it("rend un objet vide, jamais une erreur, pour un profil vierge", async () => {
    reponse = [];

    expect(await client.souvenirs("usr_vierge")).toEqual({});
  });
});

describe("client.oeuvres — la date affichée suit la RÉGION du joueur (§3.4)", () => {
  const oeuvre = (releases: { region: string | null; date: string; precision: string }[]) => ({
    id: "wrk_1", title: "Un jeu", notability: 1,
    releases: releases.map((r) => ({ ...r, confidence: "High" })),
    regionStatus: {}, coverUrl: null,
  });

  it("montre la sortie de la région, pas la plus ancienne du monde", async () => {
    // « Un joueur PAL et un joueur NTSC-J n'ont pas connu le même catalogue,
    // ni les mêmes titres, ni les mêmes dates » (§3.4). Sur le dataset réel,
    // 97 œuvres sur 221 portaient une année différente de leur année PAL —
    // jusqu'à six ans d'écart. L'écran dont toute la mécanique repose sur la
    // reconnaissance montrait au joueur une date qu'il n'a jamais vue.
    reponse = [oeuvre([
      { region: "NTSC-J", date: "1986-09-12", precision: "day" },
      { region: "PAL", date: "1992-04-15", precision: "day" },
    ])];

    const [lu] = await client.oeuvres("plt_1", "PAL");

    expect(lu.sortie).toEqual({ kind: "ExactDate", date: "1992-04-15" });
  });

  it("retombe sur la plus ancienne quand la région n'a pas de sortie", async () => {
    // Le statut régional dit alors « jamais sorti » ou « inconnu » : la date
    // étrangère devient un repère, pas un mensonge. L'effacer priverait le
    // joueur du seul point d'ancrage dont il dispose.
    reponse = [oeuvre([{ region: "NTSC-J", date: "1994-03-15", precision: "day" }])];

    const [lu] = await client.oeuvres("plt_1", "PAL");

    expect(lu.sortie).toEqual({ kind: "ExactDate", date: "1994-03-15" });
  });

  it("garde la granularité de la sortie régionale", async () => {
    // Une sortie régionale datée à l'année ne doit pas emprunter la
    // précision au jour d'une autre région.
    reponse = [oeuvre([
      { region: "NTSC-J", date: "1990-11-21", precision: "day" },
      { region: "PAL", date: "1992-01-01", precision: "year" },
    ])];

    const [lu] = await client.oeuvres("plt_1", "PAL");

    expect(lu.sortie).toEqual({ kind: "Year", year: 1992 });
  });

  it("prend la plus ancienne DE LA RÉGION quand il y en a plusieurs", async () => {
    reponse = [oeuvre([
      { region: "PAL", date: "1993-06-01", precision: "day" },
      { region: "PAL", date: "1992-04-15", precision: "day" },
    ])];

    const [lu] = await client.oeuvres("plt_1", "PAL");

    expect(lu.sortie).toEqual({ kind: "ExactDate", date: "1992-04-15" });
  });
});

describe("client — les adresses et les verbes", () => {
  it("préfixe toutes les requêtes par /api", async () => {
    // Le mandataire de Vite ne relaie que ce préfixe. Une adresse sans lui
    // recevrait le HTML du front en guise de JSON — c'est le défaut que le
    // parcours a trouvé sur les jaquettes.
    await client.souvenir("usr_1", { kind: "work", id: "w" }, { texte: "x", titre: "" });
    reponse = { entries: [], undated: [] };
    await client.timeline("usr_1");

    expect(appels.map((a) => a.url)).toEqual([
      "/api/memories",
      "/api/timeline/usr_1",
    ]);
  });

  it("transmet les entrées d'un lot telles quelles, titres libres compris", async () => {
    // Le lot est traduit, jamais réécrit : filtrer ou normaliser ici ferait
    // diverger ce que l'écran croit avoir envoyé de ce qui part.
    reponse = { created: 2, claims: [] };
    await client.declarer({
      batchId: "bat_1",
      userId: "usr_1",
      platformId: "plt_1",
      period: { kind: "year", year: 1995 },
      entries: [{ workId: "wrk_1" }, { title: "Le jeu de mon cousin" }],
    });

    expect((appels[0].corps as { entries: unknown }).entries)
      .toEqual([{ workId: "wrk_1" }, { title: "Le jeu de mon cousin" }]);
  });

  it("échoue en NOMMANT la requête fautive", async () => {
    // « Failed to fetch » n'aide personne à savoir quel appel a lâché.
    vi.stubGlobal("fetch", async () => ({ ok: false, status: 503 }) as Response);

    await expect(client.timeline("usr_1")).rejects.toThrow(/timeline\/usr_1.*503/);
  });
});
