import { readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { MESSAGES } from "./messages";

/**
 * Le garde-fou de §20 : **aucune chaîne visible par l'utilisateur n'est
 * écrite dans un composant**.
 *
 * La décision « international dès le départ » ne demande pas de livrer
 * plusieurs langues — le français est la seule livrée, et c'est un choix.
 * Elle demande que ce choix reste **réversible sans reprise du frontend** :
 * §20 note que le rattrapage tardif y est coûteux, parce qu'il faut alors
 * relire chaque composant.
 *
 * Ce test remplace cette relecture. Il échoue en nommant le fichier, la
 * ligne et le texte fautif.
 */

// `process.cwd()` et non `import.meta.url` : Vitest résout ce dernier
// relativement à la racine Vite, ce qui donne « /src » et non le chemin réel.
const RACINE = join(process.cwd(), "src");

// Pour le DÉTECTEUR de texte en dur, pas d'exception pour `messages.ts` :
// une mutation a montré que l'exclure ne changeait rien — il ne regarde que
// le texte JSX et les attributs visibles, et le catalogue n'a ni l'un ni
// l'autre.
//
// **Cette conclusion a été indûment étendue au second contrôle**, celui des
// libellés morts, qui lit la même chaîne de sources. Comme chaque clé est
// définie dans `messages.ts` sous la forme `"cle": "valeur"`, elle s'y
// trouvait toujours : le contrôle **ne pouvait pas échouer**. Vérifié — une
// clé que personne n'utilisait passait. Le catalogue est donc exclu des
// sources où l'on cherche un USAGE, et lui seul.
const CATALOGUE = join(RACINE, "i18n", "messages.ts");

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

/** Du texte destiné à être lu : au moins deux lettres à la suite. */
const DU_TEXTE = /\p{L}{2,}/u;

/**
 * Attributs dont la valeur est lue par un humain ou un lecteur d'écran.
 * `data-*`, `role`, `type` et les autres ne le sont pas.
 */
const ATTRIBUTS_VISIBLES = /\b(aria-label|alt|title|placeholder)\s*=\s*(["'])(.*?)\2/g;

/**
 * Texte JSX : ce qui suit un `>` et précède une balise ou une expression,
 * **sur la même ligne**.
 *
 * La contrainte de ligne unique n'est pas une facilité : sans elle, les
 * génériques TypeScript passent pour du texte — `Promise<void>;` suivi de
 * n'importe quoi jusqu'au prochain `<`. Le prix est qu'un libellé écrit sur
 * plusieurs lignes échappe au contrôle ; c'est un compromis assumé, et le
 * cas est rare parce que le formatage garde les libellés courts sur une
 * ligne.
 */
// Le `>` doit CLORE UNE BALISE : collé à une lettre, un chiffre, un
// guillemet, une accolade fermante ou une barre oblique. C'est ce qui
// distingue `<p>` d'une comparaison `total > 1` ou d'une flèche `=>`, que le
// détecteur lisait comme du texte.
const TEXTE_JSX = /(?<=[\w"'}\/\]])>\s*([^<>{}\n][^<>{}\n]*?)\s*[<{]/g;

type Faute = { fichier: string; ligne: number; texte: string };

/** Les sources où l'on cherche un USAGE — le catalogue exclu. */
function sourcesHorsCatalogue(): string {
  return fichiersSources(RACINE)
    .filter((f) => f !== CATALOGUE)
    .map((f) => readFileSync(f, "utf8"))
    .join("\n");
}

/**
 * Les clés que personne n'affiche. Extraite pour être **éprouvable** : la
 * version en ligne ne pouvait pas échouer, et rien ne le disait.
 */
function mortes(cles: string[], sources: string): string[] {
  return cles.filter((cle) => {
    // Les clés de mois sont construites dynamiquement : `mois.${n}`.
    if (/^mois\.\d+$/.test(cle)) return !sources.includes("`mois.${");
    if (/^region\.(PAL|NTSC-)/.test(cle)) return !sources.includes("`region.${");
    // Les noms d'icônes aussi : `t(\`icone.${nom}\`)`. La clé est le nom de
    // l'icône, et le composant les parcourt par son type.
    if (/^icone\./.test(cle)) return !sources.includes("`icone.${");
    return !sources.includes(`"${cle}"`);
  });
}

function libellesEnDur(chemin: string): Faute[] {
  const source = readFileSync(chemin, "utf8");
  const fautes: Faute[] = [];

  const ligneDe = (index: number) => source.slice(0, index).split("\n").length;

  // Les commentaires sont du texte pour les humains, mais pas de l'interface.
  const sansCommentaires = source
    .replace(/\/\*[\s\S]*?\*\//g, (m: string) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m: string) => m.replace(/[^\n]/g, " "));

  for (const m of sansCommentaires.matchAll(ATTRIBUTS_VISIBLES)) {
    if (DU_TEXTE.test(m[3])) {
      fautes.push({ fichier: chemin, ligne: ligneDe(m.index!), texte: m[3] });
    }
  }

  if (chemin.endsWith(".tsx")) {
    for (const m of sansCommentaires.matchAll(TEXTE_JSX)) {
      if (DU_TEXTE.test(m[1])) {
        fautes.push({ fichier: chemin, ligne: ligneDe(m.index!), texte: m[1] });
      }
    }
  }

  return fautes;
}

describe("§20 — aucun libellé en dur", () => {
  it("ne trouve aucune chaîne visible écrite dans un composant", () => {
    const fautes = fichiersSources(RACINE).flatMap(libellesEnDur);

    const rapport = fautes
      .map((f) => `${relative(RACINE, f.fichier)}:${f.ligne} → « ${f.texte} »`)
      .join("\n");

    expect(rapport).toBe("");
  });

  it("n'a aucun libellé mort dans le catalogue", () => {
    // Un libellé que personne n'affiche est du texte à traduire pour rien —
    // et il fait croire que l'écran dit quelque chose qu'il ne dit pas.
    // C'est la même règle que pour un champ de modèle qu'aucun producteur ne
    // remplit.
    expect(mortes(Object.keys(MESSAGES), sourcesHorsCatalogue())).toEqual([]);
  });

  it("détecte bien un libellé mort", () => {
    // Le contrôle voisin avait son témoin ; celui-ci n'en avait pas, et il
    // était inopérant — vérifié : une clé que personne n'utilisait passait.
    // C'est la règle de l'apprentissage 14 appliquée à un garde sur deux.
    //
    // Le témoin éprouve la LOGIQUE, pas une chaîne : on lui donne une clé
    // fabriquée, et on exige qu'il la nomme.
    expect(mortes(["cette.cle.n.existe.nulle.part"], sourcesHorsCatalogue()))
      .toEqual(["cette.cle.n.existe.nulle.part"]);
  });

  it("exclut le CATALOGUE des sources où l on cherche un usage", () => {
    // Sans cette exclusion, le contrôle ne peut pas échouer : chaque clé est
    // définie dans le catalogue sous la forme `"cle": "valeur"`, et s y
    // trouve donc toujours. C est ce qui le rendait inopérant.
    expect(sourcesHorsCatalogue()).not.toContain('"parcours.titre": ');
  });

  it("ne dénonce pas une clé réellement employée", () => {
    expect(mortes(["parcours.titre"], sourcesHorsCatalogue())).toEqual([]);
  });

  it("détecte bien ce qu'il prétend détecter", () => {
    // Un garde-fou qui ne trouverait jamais rien passerait pour vert le jour
    // où quelqu'un écrit un libellé en dur. On lui donne donc un cas fautif.
    const temoin = join(RACINE, "i18n", "__temoin__.tsx");
    writeFileSync(
      temoin,
      'export const X = () => <p aria-label="Bonjour">Au revoir</p>;\n',
    );
    try {
      const fautes = libellesEnDur(temoin);
      expect(fautes.map((f) => f.texte).sort()).toEqual(["Au revoir", "Bonjour"]);
    } finally {
      rmSync(temoin);
    }
  });

  it("ne se plaint pas d'un composant qui passe par le catalogue", () => {
    const temoin = join(RACINE, "i18n", "__temoin2__.tsx");
    writeFileSync(
      temoin,
      'export const X = () => <p aria-label={t("a")}>{t("b")}</p>;\n',
    );
    try {
      expect(libellesEnDur(temoin)).toEqual([]);
    } finally {
      rmSync(temoin);
    }
  });
});
