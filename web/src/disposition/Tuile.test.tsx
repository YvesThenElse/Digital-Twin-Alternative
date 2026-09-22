import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Tuile } from "./Tuile";

describe("Tuile — jamais un trou", () => {
  it("montre la jaquette quand elle existe", () => {
    render(<Tuile titre="Super Mario World" annee={1990} couverture="/c/w1.png" />);

    const image = screen.getByRole("img", { name: "Super Mario World" });
    expect(image).toHaveAttribute("src", "/c/w1.png");
    expect(image.parentElement).toHaveAttribute("data-tuile", "jaquette");
  });

  it("compose une tuile quand la jaquette manque, et jamais un vide", () => {
    // Trois œuvres sur 221 n'auront jamais de jaquette. Un trou dans la
    // grille se lirait comme un défaut de chargement.
    const { container } = render(
      <Tuile titre="Sim City" annee={1991} couverture={null} />,
    );

    const composee = container.querySelector('[data-tuile="generee"]')!;
    expect(composee).toBeInTheDocument();
    expect(composee.textContent).toContain("Sim City");
  });

  it("assume d'être une composition typographique, sans se déguiser", () => {
    // « Elle ne doit jamais ressembler à une vraie jaquette. » L'attribut le
    // dit à la machine ; le titre visible le dit à l'œil.
    const { container } = render(
      <Tuile titre="Sim City" annee={1991} couverture={null} />,
    );

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("Sim City")).toHaveAttribute("data-role", "titre-tuile");
  });

  it("garde le format 3:4 dans les deux cas", () => {
    // « Format constant quelle que soit l'origine, pour que la grille reste
    // régulière. » C'est ce qui empêche l'alternance de paraître rapiécée.
    const avec = render(<Tuile titre="A" annee={1990} couverture="/a.png" />);
    expect(avec.container.firstElementChild).toHaveAttribute("data-ratio", "3:4");
    avec.unmount();

    const sans = render(<Tuile titre="B" annee={1990} couverture={null} />);
    expect(sans.container.firstElementChild).toHaveAttribute("data-ratio", "3:4");
  });

  it("porte l'accent de son époque, y compris sans jaquette", () => {
    // « La grille de jeux cesse d'être grise même sans jaquettes. »
    const { container } = render(
      <Tuile titre="Chrono Trigger" annee={1995} couverture={null} />,
    );

    const composee = container.querySelector('[data-tuile="generee"]') as HTMLElement;
    expect(composee).toHaveAttribute("data-epoque", "32/64 bits");
    expect(composee.style.backgroundColor).not.toBe("");
  });

  it("donne des trames différentes à deux jeux voisins", () => {
    // « Pour que deux jeux voisins ne soient pas identiques. »
    const a = render(<Tuile titre="Super Mario World" annee={1990} couverture={null} />);
    const trameA = a.container.querySelector("[data-trame]")!.getAttribute("data-trame");
    a.unmount();

    const b = render(<Tuile titre="Secret of Mana" annee={1993} couverture={null} />);
    const trameB = b.container.querySelector("[data-trame]")!.getAttribute("data-trame");

    expect(trameA).not.toBe(trameB);
  });

  it("colore encore une tuile dont l'année est inconnue", () => {
    const { container } = render(<Tuile titre="Sans date" annee={null} couverture={null} />);

    const composee = container.querySelector('[data-tuile="generee"]') as HTMLElement;
    expect(composee.style.backgroundColor).not.toBe("");
  });
});

describe("Tuile — l'emprunt est révocable (§19.2)", () => {
  const jaquette = () => screen.getByRole("img", { name: "Super Mario World" });

  it("se replie sur la tuile composée quand la source ne répond plus", () => {
    // « Une jaquette reprise est un emprunt révocable : RIEN dans le produit
    // ne doit cesser de marcher le jour où elle disparaît »
    // (VERIFICATION-JURIDIQUE §3.3). Le catalogue ne filtre qu'à l'amorçage ;
    // retirée ensuite, l'image laissait un glyphe cassé dans la grille — sur
    // l'écran dont toute la mécanique repose sur la reconnaissance.
    const { container } = render(
      <Tuile titre="Super Mario World" annee={1990} couverture="/c/disparue.png" />,
    );

    fireEvent.error(jaquette());

    const composee = container.querySelector('[data-tuile="generee"]')!;
    expect(composee).toBeInTheDocument();
    expect(composee.textContent).toContain("Super Mario World");
    expect(container.querySelector("img")).toBeNull();
  });

  it("garde le format et l'accent en se repliant", () => {
    // Le repli ne doit pas rapiécer la grille : c'est le format constant qui
    // fait tenir l'alternance des deux origines.
    const { container } = render(
      <Tuile titre="Chrono Trigger" annee={1995} couverture="/c/disparue.png" />,
    );

    fireEvent.error(screen.getByRole("img", { name: "Chrono Trigger" }));

    const composee = container.querySelector('[data-tuile="generee"]') as HTMLElement;
    expect(composee).toHaveAttribute("data-ratio", "3:4");
    expect(composee).toHaveAttribute("data-epoque", "32/64 bits");
  });

  it("ne retient pas l'échec d'une AUTRE adresse", () => {
    // Une adresse qui a échoué ne dit rien de la suivante. Retenir « cette
    // tuile est cassée » plutôt que « cette adresse l'est » priverait le
    // joueur d'une jaquette valide dès que la liste change sous elle.
    const rendu = render(
      <Tuile titre="Super Mario World" annee={1990} couverture="/c/disparue.png" />,
    );

    fireEvent.error(jaquette());
    rendu.rerender(
      <Tuile titre="Super Mario World" annee={1990} couverture="/c/valide.png" />,
    );

    expect(jaquette()).toHaveAttribute("src", "/c/valide.png");
  });

  it("n'essaie pas indéfiniment la même adresse", () => {
    // Une image qui échoue, se remonte et échoue encore ferait une boucle de
    // requêtes sur 218 tuiles. C'est l'ADRESSE qui est retenue, pas l'échec.
    const rendu = render(
      <Tuile titre="Super Mario World" annee={1990} couverture="/c/disparue.png" />,
    );

    fireEvent.error(jaquette());
    rendu.rerender(
      <Tuile titre="Super Mario World" annee={1990} couverture="/c/disparue.png" />,
    );

    expect(rendu.container.querySelector("img")).toBeNull();
  });
});
