import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * La région du joueur est une <b>hypothèse</b>, et elle n'est posée qu'à un
 * seul endroit.
 *
 * <b>Le produit ne demande jamais sa région au joueur</b> (audit, item 18) :
 * `App.tsx` en pose une — `PAL`, ou `WORLDWIDE` pour une machine sans
 * zonage — et toute la sélection en dépend. §3.4 dit pourquoi cela compte :
 * « un joueur PAL et un joueur NTSC-J n'ont pas connu le même catalogue
 * SNES, ni les mêmes titres, ni les mêmes dates ».
 *
 * La décision est de <b>garder PAL</b> pour les premiers testeurs, et de
 * l'écrire comme hypothèse dans
 * [`PROTOCOLE-DE-TEST.md`](../../../PROTOCOLE-DE-TEST.md) §2 — avec le
 * critère de recrutement qui en découle. Ce test garde la moitié que la
 * prose ne peut pas garder : que l'hypothèse reste à <b>un seul endroit</b>.
 * Éparpillée, le jour où un testeur n'est pas européen coûterait une
 * relecture du frontend au lieu d'une ligne.
 *
 * <b>`WORLDWIDE` n'en fait pas partie</b> : ce n'est pas une région mais
 * l'absence de zonage, un fait porté par le dataset et lu tel quel par
 * `statut.ts`. Le policer ferait de ce garde une gêne sans objet.
 */

// `process.cwd()` et non `import.meta.url` : Vitest résout ce dernier
// relativement à la racine Vite, ce qui donne « /src » et non le chemin réel.
const RACINE = join(process.cwd(), "src");

/** Les trois régions de §3.4. Le code, tel qu'il voyage dans les requêtes. */
const REGIONS = ["PAL", "NTSC-U", "NTSC-J"];

/**
 * Le seul fichier autorisé à en décider.
 *
 * C'est l'écran qui orchestre le parcours ; la décision y est visible en
 * entier, à côté de l'état qu'elle initialise.
 */
const DECIDEUR = "App.tsx";

type Faute = { fichier: string; ligne: number; code: string };

function fichiersSources(dossier: string): string[] {
  const trouves: string[] = [];
  for (const entree of readdirSync(dossier)) {
    const chemin = join(dossier, entree);
    if (statSync(chemin).isDirectory()) {
      trouves.push(...fichiersSources(chemin));
      continue;
    }
    if (!/\.tsx?$/.test(entree)) continue;
    if (/\.test\.tsx?$/.test(entree)) continue;
    trouves.push(chemin);
  }
  return trouves;
}

/**
 * Une chaîne <b>exactement</b> égale à un code de région.
 *
 * `"region.PAL"` — la clé de libellé — n'en est pas une : le guillemet
 * ouvrant doit toucher le code. Sans cette exigence, le garde dénoncerait le
 * catalogue de messages, qui ne décide de rien.
 */
const LITTERAL = new RegExp(`(["'\`])(${REGIONS.join("|")})\\1`, "g");

/**
 * Les régions écrites en dur, dans un contenu donné.
 *
 * Prend le contenu plutôt qu'un chemin : un garde qui ne sait lire que
 * l'arbre réel ne peut pas être mis à l'épreuve, et c'est ainsi que celui
 * des libellés morts est resté inopérant sans que personne le voie.
 */
export function regionsEnDur(fichier: string, contenu: string): Faute[] {
  // Les commentaires nomment les régions en permanence — c'est même le seul
  // endroit où l'on explique POURQUOI l'hypothèse existe. Les policer
  // punirait l'explication.
  const sansCommentaires = contenu
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m) => m.replace(/[^\n]/g, " "));

  return [...sansCommentaires.matchAll(LITTERAL)].map((m) => ({
    fichier,
    ligne: sansCommentaires.slice(0, m.index).split("\n").length,
    code: m[2],
  }));
}

const horsDecideur = () =>
  fichiersSources(RACINE)
    .filter((f) => !f.endsWith(DECIDEUR))
    .flatMap((f) => regionsEnDur(relative(RACINE, f), readFileSync(f, "utf8")));

describe("§3.4 — la région assumée n'est posée qu'à un seul endroit", () => {
  it("ne laisse aucun autre fichier décider d'une région", () => {
    const rapport = horsDecideur()
      .map((f) => `${f.fichier}:${f.ligne} → « ${f.code} »`)
      .join("\n");

    expect(rapport).toBe("");
  });

  it("trouve bien la décision là où elle est assumée", () => {
    // Un garde dont l'exemption ne protège plus rien est un garde qui ne
    // garde rien : si la décision quittait `App.tsx`, le contrôle ci-dessus
    // resterait vert sur un frontend qui n'en poserait aucune — ou qui en
    // poserait une ailleurs sous un autre nom.
    const decideur = readFileSync(join(RACINE, DECIDEUR), "utf8");

    expect(regionsEnDur(DECIDEUR, decideur).map((f) => f.code)).toContain("PAL");
  });

  it("détecte bien une région écrite ailleurs", () => {
    // Le témoin éprouve la LOGIQUE, pas l'arbre : c'est ce qui manquait au
    // garde des libellés morts, resté vert alors qu'il ne pouvait pas
    // échouer (apprentissage 14).
    const faute = regionsEnDur("un/composant.tsx", 'const zone = "NTSC-J";\n');

    expect(faute).toEqual([{ fichier: "un/composant.tsx", ligne: 1, code: "NTSC-J" }]);
  });

  it("ne dénonce pas la clé de libellé qui NOMME une région", () => {
    // « PAL » ne dit rien à un joueur : le catalogue traduit les trois codes
    // en noms de marchés. Il ne décide de rien, et le dénoncer rendrait le
    // garde inapplicable — donc désactivé.
    expect(regionsEnDur("i18n/messages.ts", '"region.PAL": "Europe",\n')).toEqual([]);
  });

  it("ne dénonce pas un commentaire qui explique l'hypothèse", () => {
    expect(regionsEnDur("un/composant.tsx", '// forcer "PAL" ici mentirait\n'))
      .toEqual([]);
  });

  it("ne police pas l'absence de zonage", () => {
    // `WORLDWIDE` est un fait du dataset — la Switch —, pas une hypothèse sur
    // le joueur. `statut.ts` le lit, et c'est sa place.
    expect(regionsEnDur("region/statut.ts", 'includes("WORLDWIDE")\n')).toEqual([]);
  });
});
