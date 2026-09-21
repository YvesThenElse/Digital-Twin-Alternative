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
    await client.souvenir("usr_1", { kind: "work", id: "wrk_42" }, "Noël 1994.");

    expect(appels[0].corps).toEqual({
      userId: "usr_1",
      targetKind: "work",
      targetId: "wrk_42",
      text: "Noël 1994.",
    });
  });

  it("écrit un souvenir de titre saisi sur la REVENDICATION", async () => {
    // Figer le genre à « work » ici écrirait tous les souvenirs de titres
    // saisis sur des œuvres inexistantes. L'API les refuserait en nommant un
    // identifiant que l'écran n'affiche jamais — et le contenu le plus
    // personnel du produit se perdrait derrière un message incompréhensible.
    await client.souvenir(
      "usr_1", { kind: "unresolvedClaim", id: "ucl_ABC" }, "Le dragon était bleu.");

    expect(appels[0].corps).toMatchObject({
      targetKind: "unresolvedClaim",
      targetId: "ucl_ABC",
    });
  });

  it("n'invente pas de genre de cible", async () => {
    // Les deux tests ci-dessus passeraient encore si le client envoyait le
    // genre reçu ET un second champ figé. On exige donc que les deux
    // requêtes DIFFÈRENT sur ce champ.
    await client.souvenir("usr_1", { kind: "work", id: "wrk_42" }, "A");
    await client.souvenir("usr_1", { kind: "unresolvedClaim", id: "ucl_ABC" }, "B");

    const genres = appels.map((a) => (a.corps as { targetKind: string }).targetKind);
    expect(new Set(genres).size).toBe(2);
  });
});

describe("client — les adresses et les verbes", () => {
  it("préfixe toutes les requêtes par /api", async () => {
    // Le mandataire de Vite ne relaie que ce préfixe. Une adresse sans lui
    // recevrait le HTML du front en guise de JSON — c'est le défaut que le
    // parcours a trouvé sur les jaquettes.
    await client.souvenir("usr_1", { kind: "work", id: "w" }, "x");
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
