import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Le pendant, côté client, du contrat gardé par l'API.
 *
 * <b>`lire<T>` fait un `as T`</b> : rien ne vérifie que ce que le client
 * déclare correspond à ce que l'API rend (apprentissage 56). L'API compare
 * ses réponses à `CONTRAT-API.json` ; ce test-ci vérifie l'autre moitié —
 * que les champs annoncés comme <b>lus</b> le sont vraiment, et qu'aucun
 * champ annoncé comme <b>ignoré</b> ne se lit en douce.
 *
 * <b>Le garde est volontairement à SENS UNIQUE.</b> On a d'abord exigé le
 * contraire — qu'aucun champ ignoré ne soit nommé — et c'était insoutenable :
 * `batchId` et `targetId` sont aussi des champs de REQUÊTE, et une recherche
 * par nom ne distingue pas ce qu'on envoie de ce qu'on lit. Une garde qui ne
 * peut être satisfaite que par une liste d'exceptions ne garde plus rien. La
 * moitié qui compte — l'API ajoute, renomme ou retire un champ — est tenue
 * par `ContratApiTests`, qui compare des réponses RÉELLES.
 *
 * ⚠️ Il lit du TEXTE, pas des types : TypeScript efface les siens à la
 * compilation. C'est la limite assumée, et elle est compensée en amont —
 * l'API, elle, compare des réponses réelles.
 */

// `process.cwd()` vaut `web/` sous Vitest : le contrat vit un cran au-dessus.
const RACINE = join(process.cwd(), "..");

type Point = Record<string, { lit: string[]; ignore: Record<string, string> }>;

const CONTRAT: Record<string, Point> =
  JSON.parse(readFileSync(join(RACINE, "CONTRAT-API.json"), "utf8")).points;

/**
 * Le client, commentaires ÔTÉS.
 *
 * Le tableau des omissions y nomme les champs ignorés en toutes lettres : le
 * garde les y trouverait et se croirait satisfait, alors qu'un commentaire ne
 * lit rien. C'est exactement ce qui avait rendu inopérant le garde des
 * libellés morts.
 */
function sourcesDuFront(): string {
  const fichiers: string[] = [];
  const parcourir = (dossier: string) => {
    for (const entree of readdirSync(dossier)) {
      const chemin = join(dossier, entree);
      if (statSync(chemin).isDirectory()) { parcourir(chemin); continue; }
      if (!/\.tsx?$/.test(entree) || /\.test\.tsx?$/.test(entree)) continue;
      fichiers.push(chemin);
    }
  };
  parcourir(join(RACINE, "web", "src"));
  return fichiers
    .map((f) => readFileSync(f, "utf8"))
    .join("\n")
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m) => m.replace(/[^\n]/g, " "));
}

/** Le champ est-il NOMMÉ dans le code ? Un mot entier, jamais un fragment. */
export function estLu(champ: string, source: string): boolean {
  return new RegExp(`\\b${champ}\\b`).test(source);
}

const tousLesChamps = (choisir: (p: Point[string]) => string[]) =>
  Object.entries(CONTRAT).flatMap(([point, chemins]) =>
    Object.entries(chemins).flatMap(([chemin, forme]) =>
      choisir(forme).map((champ) => ({ point, chemin, champ })),
    ),
  );

describe("Le contrat API ↔ client — ce qui est déclaré lu doit l'être", () => {
  it("lit tous les champs que le contrat annonce comme lus", () => {
    const source = sourcesDuFront();

    const muets = tousLesChamps((f) => f.lit)
      .filter(({ champ }) => !estLu(champ, source))
      .map(({ point, chemin, champ }) => `${point} « ${chemin} » → ${champ}`);

    expect(muets).toEqual([]);
  });

  it("chaque champ ignoré porte SA raison, pas une case cochée", () => {
    // « Ignoré » sans raison redevient un silence. Le tableau de `client.ts`
    // existait pour cela, et rien ne le vérifiait.
    const sansRaison = Object.entries(CONTRAT).flatMap(([point, chemins]) =>
      Object.entries(chemins).flatMap(([chemin, forme]) =>
        Object.entries(forme.ignore)
          .filter(([, raison]) => raison.trim().length < 20)
          .map(([champ]) => `${point} « ${chemin} » → ${champ}`),
      ),
    );

    expect(sansRaison).toEqual([]);
  });

  // --------------------------------------------------------- les témoins

  it("ôte bien les commentaires avant de chercher", () => {
    // Sans cela le garde ne peut pas échouer : `client.ts` nomme chaque champ
    // du contrat dans son tableau d'omissions, commentaire compris.
    expect(sourcesDuFront()).not.toContain("updatedAt |");
  });

  it("ne confond pas un champ avec un fragment d'un autre", () => {
    expect(estLu("id", "const identifiant = 1;")).toBe(false);
    expect(estLu("id", "const x = o.id;")).toBe(true);
  });

  it("détecte bien un champ que personne ne lit", () => {
    expect(estLu("champInexistant", sourcesDuFront())).toBe(false);
  });
});
