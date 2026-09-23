import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  birthYear: null,
  favourites: [{ platformName: "Super Nintendo", title: "Chrono Trigger" }],
  activity: [
    { decade: 1990, moments: 12 },
    { decade: 2000, moments: 0 },
    { decade: 2010, moments: 5 },
  ],
  figures: { consoles: 4, gamesDeclared: 128, finished: 31, memoriesWritten: 7 },
  opening: {
    years: 35,
    platform: "Game Boy",
    occurredAt: { kind: "ApproximateYear", year: 1991, margin: 2 },
  },
};

function poser(synthese: SyntheseDuProfil | null, completer = () => {}) {
  return render(<SyntheseProfil synthese={synthese} completer={completer} />);
}

const phrase = () => screen.getByTestId("portrait-phrase");
const chiffres = () => screen.queryAllByTestId("portrait-nombre");

describe("SyntheseProfil — le portrait, jamais le tableau de bord", () => {
  it("raconte le début de l'histoire avec sa machine et sa durée", () => {
    poser(DEBUT);

    expect(phrase()).toHaveTextContent("35");
    expect(phrase()).toHaveTextContent("Game Boy");
  });

  it("porte l'incertitude au lieu de la masquer", () => {
    // E04 : « `≈ 35 ans` dérivé d'un premier moment flou est honnête ;
    // `35 ans` ne l'est pas. » Et « vers 1991 » n'est pas « 1991 » : la
    // granularité déclarée voyage jusqu'à la phrase.
    poser(DEBUT);

    expect(phrase().textContent).toContain("≈");
    expect(phrase().textContent).toContain("vers 1991");
  });

  it("ne dit pas « depuis 0 ans » quand la première fois est cette année", () => {
    poser({
      ...DEBUT,
      opening: { ...DEBUT.opening!, years: null },
    });

    expect(phrase().textContent).not.toMatch(/\b0\b/);
    // Le témoin (78) : la phrase EXISTE quand même, et elle dit le
    // commencement. « Rien » se satisferait d'un en-tête cassé.
    expect(phrase()).toHaveTextContent("Game Boy");
  });

  it("dit le commencement même sans machine connue", () => {
    // Une déclaration qui ne vient pas d'une sélection par machine n'en porte
    // pas. Taire la phrase entière pour autant perdrait la date déclarée.
    poser({
      ...DEBUT,
      opening: { ...DEBUT.opening!, platform: null },
    });

    // Sur la DATE, le strict nécessaire : la granularité est gardée par le
    // test voisin, et l'y redemander ferait échouer deux tests pour une seule
    // cause — le compte d'une mutation cesserait alors de renseigner.
    expect(phrase().textContent).toContain("1991");
    expect(phrase().textContent).not.toContain("Game Boy");
  });

  // ---------------------------------------------------- les quatre chiffres

  it("montre les quatre chiffres du domaine, et exactement quatre", () => {
    poser(DEBUT);

    expect(chiffres().map((n) => n.textContent)).toEqual(["4", "128", "31", "7"]);
  });

  it("accorde le libellé au singulier", () => {
    poser({
      ...DEBUT,
      figures: { consoles: 1, gamesDeclared: 1, finished: 1, memoriesWritten: 1 },
    });

    const libelles = screen.getAllByTestId("portrait-libelle").map((n) => n.textContent);
    expect(libelles.every((l) => !l!.endsWith("s"))).toBe(true);
  });

  it("n'affiche aucun taux : « à 100 % » est sorti du modèle (§4.6)", () => {
    // La fiche annonce « à 100 % » comme quatrième chiffre. §4.6 l'a
    // explicitement sorti de l'axe des positions — « 100 % de Tetris ou d'un
    // jeu de sport ne veut rien dire ». Un pourcentage ici serait un chiffre
    // que le modèle refuse de produire.
    const { container } = poser(DEBUT);

    expect(container.textContent).not.toContain("%");
  });

  it("n'affiche pas de chiffres quand le profil est trop maigre", () => {
    // E04 : « Des statistiques calculées sur cinq jeux détruisent la
    // crédibilité de l'écran — c'est le principal risque de cette page. »
    // L'API ne les envoie alors pas ; l'écran ne doit pas en inventer.
    poser({ ...DEBUT, figures: null });

    expect(chiffres()).toHaveLength(0);
    // Le témoin (78) : la phrase, elle, reste — c'est ce que la fiche demande
    // de garder. Sans lui, « aucun chiffre » se satisferait d'un en-tête vide.
    expect(phrase()).toHaveTextContent("Game Boy");
  });

  it("ne rend aucun zéro là où il n'y a rien à dire", () => {
    // Un profil sans rien n'a pas un taux de zéro : il n'en a pas. L'en-tête
    // disparaît plutôt que d'afficher une coquille.
    const { container } = poser(
      { moments: 0, birthYear: null, activity: null, favourites: [], figures: null, opening: null });

    expect(container.textContent).toBe("");
    expect(screen.queryByTestId("portrait")).toBeNull();
  });

  it("ne rend rien tant que la synthèse n'est pas arrivée", () => {
    // Un en-tête qui s'affiche vide puis se remplit ferait sauter l'écran au
    // moment précis où le joueur le découvre.
    const { container } = poser(null);

    expect(container.textContent).toBe("");
  });
});

describe("SyntheseProfil — un profil trop maigre propose de compléter (E04)", () => {
  const MAIGRE: SyntheseDuProfil = { ...DEBUT, figures: null };

  it("invite à compléter sous le seuil du portrait", async () => {
    // « Trop maigre pour un portrait : afficher la phrase […], masquer les
    // chiffres, ET PROPOSER E02. » Les deux premières tenaient déjà.
    const utilisateur = userEvent.setup();
    const completer = vi.fn();
    poser(MAIGRE, completer);

    await utilisateur.click(screen.getByRole("button", { name: /Ajouter des jeux/ }));

    expect(completer).toHaveBeenCalledTimes(1);
  });

  it("ne dit pas ce qui MANQUE : ce n'est pas une jauge", () => {
    // Annoncer un seuil — « encore sept moments » — ferait du portrait une
    // complétion à remplir. Un profil se construit par envie.
    poser(MAIGRE);

    const invitation = screen.getByRole("button", { name: /Ajouter des jeux/ });
    expect(invitation.textContent).not.toMatch(/\d/);
  });

  it("disparaît dès que le portrait tient", () => {
    poser({ ...DEBUT });

    expect(screen.queryByRole("button", { name: /Ajouter des jeux/ })).toBeNull();
    // Le témoin (78) : la MÊME synthèse, sans chiffres, la propose bien.
    poser(MAIGRE);
    expect(screen.getAllByRole("button", { name: /Ajouter des jeux/ })).not.toHaveLength(0);
  });

  it("n'invite à rien sur un profil vide : l'axe le fait déjà", () => {
    // Deux invitations superposées n'en font pas une plus claire — l'axe
    // porte « Racontez votre première console », et l'en-tête se tait.
    const { container } = poser({ moments: 0, birthYear: null, activity: null, favourites: [], figures: null, opening: null });

    expect(container.textContent).toBe("");
  });
});

describe("SyntheseProfil — les périodes d'activité (E04, bloc ⒟)", () => {
  const tranches = () => screen.queryAllByTestId("activite")[0]
    ?.querySelectorAll(".activite-tranche");

  it("dessine une tranche par décennie, creux compris", () => {
    // « C'est la visualisation qui fait dire *j'ai peu joué entre 2005 et
    // 2010* » : retirer les décennies vides dessinerait une bande pleine, et
    // supprimerait précisément ce qu'elle existe pour montrer.
    poser(DEBUT);

    expect(tranches()).toHaveLength(3);
    expect([...tranches()!].map((n) => n.getAttribute("data-moments")))
      .toEqual(["12", "0", "5"]);
  });

  it("colore chaque décennie par son époque", () => {
    // Langage visuel §2. L'accent vient du MILIEU de la décennie : sa borne
    // basse tombe pile sur un changement d'époque.
    poser(DEBUT);

    const epoques = [...tranches()!].map((n) => n.getAttribute("data-epoque"));
    expect(new Set(epoques).size).toBeGreaterThan(1);
  });

  it("met les hauteurs en proportion du maximum", () => {
    // Une échelle absolue écraserait tout dès qu'une décennie domine — et
    // c'est justement le contraste qu'on vient lire.
    poser(DEBUT);

    const hauteurs = [...tranches()!].map((n) => (n as HTMLElement).style.height);
    expect(hauteurs).toEqual(["100%", "0%", `${(5 / 12) * 100}%`]);
  });

  it("ne dessine rien sous le seuil du portrait", () => {
    poser({ ...DEBUT, activity: null });

    expect(screen.queryByTestId("activite")).toBeNull();
    // Le témoin (78) : la MÊME synthèse, la densité rendue, la dessine.
    poser(DEBUT);
    expect(screen.getAllByTestId("activite")).not.toHaveLength(0);
  });
});

describe("SyntheseProfil — vos préférés (E04, bloc ⒠ bis)", () => {
  it("nomme un titre par plateforme", () => {
    // « La ligne la plus personnelle que le système sache produire sans que
    // l'utilisateur ait écrit une phrase. »
    poser(DEBUT);

    const preferes = screen.getAllByTestId("prefere").map((n) => n.textContent);
    expect(preferes).toEqual(["Super Nintendo : Chrono Trigger"]);
  });

  it("ne rend RIEN quand aucun préféré n'est déclaré", () => {
    // Une section vide se lirait comme une donnée manquante, alors qu'il n'y
    // a simplement rien eu à dire.
    poser({ ...DEBUT, favourites: [] });

    expect(screen.queryByTestId("preferes")).toBeNull();
    // Le témoin (78) : la MÊME synthèse, un préféré déclaré, le nomme.
    poser(DEBUT);
    expect(screen.getAllByTestId("preferes")).not.toHaveLength(0);
  });

  it("les montre même sans chiffres : un préféré est un FAIT, pas une statistique", () => {
    // Un taux calculé sur cinq jeux ment ; un préféré déclaré sur un profil
    // maigre reste vrai. Les deux ne suivent donc pas le même seuil.
    poser({ ...DEBUT, figures: null, activity: null });

    expect(screen.getAllByTestId("prefere")).toHaveLength(1);
  });
});
