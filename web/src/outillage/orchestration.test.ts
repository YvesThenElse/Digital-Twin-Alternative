import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * L'orchestration ne doit pas <b>taire</b> ce qui échoue.
 *
 * <c>services_front</c> faisait <c>./web.sh build &gt;/dev/null</c> : les
 * erreurs de typage partaient dans le vide, et `set -e` faisait sortir
 * `e2e.sh` avec un code 1 <b>sans un mot</b>, juste après avoir affiché
 * « ── front ». On cherche alors le défaut dans le produit alors qu'il est
 * dans l'outillage — c'est la famille de F10 : un garde qui échoue sans le
 * dire fait chercher ailleurs.
 *
 * <b>Pourquoi ce test vit ici.</b> Il éprouve un script de la racine depuis
 * la suite du front, comme `contrat.test.ts` éprouve `CONTRAT-API.json` :
 * la commande en cause est `./web.sh build`, et c'est un développeur du
 * front qui la cassera.
 */

// `process.cwd()` vaut `web/` sous Vitest : les scripts vivent un cran
// au-dessus.
const RACINE = join(process.cwd(), "..");

/** Les étapes dont l'échec arrête tout, et dont la sortie est la seule trace. */
const ETAPES_LOURDES = [/web\.sh"? build\b/, /dotnet-ef database update\b/];

/**
 * Les lignes de commande, <b>continuations recollées</b>. Sans cela, une
 * commande écrite sur trois lignes échappe à toute inspection — et c'est
 * précisément ainsi que les scripts lisibles s'écrivent.
 */
export function lignesDeCommande(source: string): string[] {
  return source.replace(/\\\n\s*/g, " ").split("\n");
}

/** Une étape lourde qui ne passe pas par le rapporteur, ou qui jette sa sortie. */
export function etapesMuettes(source: string): string[] {
  return lignesDeCommande(source)
    .filter((l) => !l.trimStart().startsWith("#"))
    .filter((l) => ETAPES_LOURDES.some((e) => e.test(l)))
    .filter((l) => !l.includes("services_etape") || />\s*\/dev\/null/.test(l))
    .map((l) => l.trim());
}

const services = () => readFileSync(join(RACINE, "services.sh"), "utf8");

describe("L'orchestration nomme ce qui échoue", () => {
  it("ne tait aucune étape lourde de services.sh", () => {
    expect(etapesMuettes(services())).toEqual([]);
  });

  it("recolle les continuations avant d'inspecter", () => {
    // Une commande sur trois lignes est la forme NORMALE d'un script
    // lisible : l'inspecter ligne à ligne ne verrait qu'un fragment, et le
    // contrôle passerait sur tout ce qui est bien écrit.
    const coupee = 'services_etape "X" \\\n  ./web.sh build\n';

    expect(lignesDeCommande(coupee)[0]).toContain("services_etape");
    expect(etapesMuettes(coupee)).toEqual([]);
  });

  it("détecte une construction dont la sortie part dans le vide", () => {
    // Le témoin qui éprouve la LOGIQUE : c'est la ligne exacte qui a fait
    // sortir `e2e.sh` sans un mot.
    expect(etapesMuettes('(cd "$R" && ./web.sh build >/dev/null)\n'))
      .toEqual(['(cd "$R" && ./web.sh build >/dev/null)']);
  });

  it("détecte une migration silencieuse", () => {
    expect(etapesMuettes("./dotnet.sh dotnet-ef database update >/dev/null\n"))
      .toHaveLength(1);
  });

  it("ne se plaint pas d'un commentaire qui cite le piège", () => {
    // Les commentaires de `services.sh` décrivent la ligne fautive pour
    // expliquer pourquoi elle a disparu. Les dénoncer rendrait le contrôle
    // inapplicable — donc désactivé.
    expect(etapesMuettes("# `./web.sh build >/dev/null` envoyait tout dans le vide\n"))
      .toEqual([]);
  });
});
