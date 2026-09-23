import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SyntheseProfil, type SyntheseDuProfil } from "./SyntheseProfil";

/**
 * L'en-tête de `/mon-histoire` — la synthèse d'E04, blocs A et B.
 *
 * <b>Son objectif est la porte dure de la Phase 2</b> : « produire le moment
 * *oui, ça me ressemble* ». Il n'ajoute aucune donnée ; il donne un sens à
 * celles qui existent.
 *
 * Deux interdits le tiennent, et ce sont eux que ces tests gardent :
 *
 * - **ce n'est pas un tableau de bord.** §8.2 liste treize indicateurs, E04
 *   en garde quatre — « les afficher tous produirait un tableau de bord, pas
 *   un portrait » ;
 * - **il ne compte rien.** Les chiffres viennent du domaine. Recomptés ici,
 *   ils porteraient sur ce qui est chargé et non sur l'histoire.
 */
const DEBUT: SyntheseDuProfil = {
  moments: 52,
  figures: { consoles: 4, gamesDeclared: 128, finished: 31, memoriesWritten: 7 },
  opening: {
    years: 35,
    platform: "Game Boy",
    occurredAt: { kind: "ApproximateYear", year: 1991, margin: 2 },
  },
};

const phrase = () => screen.getByTestId("portrait-phrase");
const chiffres = () => screen.queryAllByTestId("portrait-nombre");

describe("SyntheseProfil — le portrait, jamais le tableau de bord", () => {
  it("raconte le début de l'histoire avec sa machine et sa durée", () => {
    render(<SyntheseProfil synthese={DEBUT} />);

    expect(phrase()).toHaveTextContent("35");
    expect(phrase()).toHaveTextContent("Game Boy");
  });

  it("porte l'incertitude au lieu de la masquer", () => {
    // E04 : « `≈ 35 ans` dérivé d'un premier moment flou est honnête ;
    // `35 ans` ne l'est pas. » Et « vers 1991 » n'est pas « 1991 » : la
    // granularité déclarée voyage jusqu'à la phrase.
    render(<SyntheseProfil synthese={DEBUT} />);

    expect(phrase().textContent).toContain("≈");
    expect(phrase().textContent).toContain("vers 1991");
  });

  it("ne dit pas « depuis 0 ans » quand la première fois est cette année", () => {
    render(<SyntheseProfil synthese={{
      ...DEBUT,
      opening: { ...DEBUT.opening!, years: null },
    }} />);

    expect(phrase().textContent).not.toMatch(/\b0\b/);
    // Le témoin (78) : la phrase EXISTE quand même, et elle dit le
    // commencement. « Rien » se satisferait d'un en-tête cassé.
    expect(phrase()).toHaveTextContent("Game Boy");
  });

  it("dit le commencement même sans machine connue", () => {
    // Une déclaration qui ne vient pas d'une sélection par machine n'en porte
    // pas. Taire la phrase entière pour autant perdrait la date déclarée.
    render(<SyntheseProfil synthese={{
      ...DEBUT,
      opening: { ...DEBUT.opening!, platform: null },
    }} />);

    // Sur la DATE, le strict nécessaire : la granularité est gardée par le
    // test voisin, et l'y redemander ferait échouer deux tests pour une seule
    // cause — le compte d'une mutation cesserait alors de renseigner.
    expect(phrase().textContent).toContain("1991");
    expect(phrase().textContent).not.toContain("Game Boy");
  });

  // ---------------------------------------------------- les quatre chiffres

  it("montre les quatre chiffres du domaine, et exactement quatre", () => {
    render(<SyntheseProfil synthese={DEBUT} />);

    expect(chiffres().map((n) => n.textContent)).toEqual(["4", "128", "31", "7"]);
  });

  it("accorde le libellé au singulier", () => {
    render(<SyntheseProfil synthese={{
      ...DEBUT,
      figures: { consoles: 1, gamesDeclared: 1, finished: 1, memoriesWritten: 1 },
    }} />);

    const libelles = screen.getAllByTestId("portrait-libelle").map((n) => n.textContent);
    expect(libelles.every((l) => !l!.endsWith("s"))).toBe(true);
  });

  it("n'affiche aucun taux : « à 100 % » est sorti du modèle (§4.6)", () => {
    // La fiche annonce « à 100 % » comme quatrième chiffre. §4.6 l'a
    // explicitement sorti de l'axe des positions — « 100 % de Tetris ou d'un
    // jeu de sport ne veut rien dire ». Un pourcentage ici serait un chiffre
    // que le modèle refuse de produire.
    const { container } = render(<SyntheseProfil synthese={DEBUT} />);

    expect(container.textContent).not.toContain("%");
  });

  it("n'affiche pas de chiffres quand le profil est trop maigre", () => {
    // E04 : « Des statistiques calculées sur cinq jeux détruisent la
    // crédibilité de l'écran — c'est le principal risque de cette page. »
    // L'API ne les envoie alors pas ; l'écran ne doit pas en inventer.
    render(<SyntheseProfil synthese={{ ...DEBUT, figures: null }} />);

    expect(chiffres()).toHaveLength(0);
    // Le témoin (78) : la phrase, elle, reste — c'est ce que la fiche demande
    // de garder. Sans lui, « aucun chiffre » se satisferait d'un en-tête vide.
    expect(phrase()).toHaveTextContent("Game Boy");
  });

  it("ne rend aucun zéro là où il n'y a rien à dire", () => {
    // Un profil sans rien n'a pas un taux de zéro : il n'en a pas. L'en-tête
    // disparaît plutôt que d'afficher une coquille.
    const { container } = render(
      <SyntheseProfil synthese={{ moments: 0, figures: null, opening: null }} />,
    );

    expect(container.textContent).toBe("");
    expect(screen.queryByTestId("portrait")).toBeNull();
  });

  it("ne rend rien tant que la synthèse n'est pas arrivée", () => {
    // Un en-tête qui s'affiche vide puis se remplit ferait sauter l'écran au
    // moment précis où le joueur le découvre.
    const { container } = render(<SyntheseProfil synthese={null} />);

    expect(container.textContent).toBe("");
  });
});
