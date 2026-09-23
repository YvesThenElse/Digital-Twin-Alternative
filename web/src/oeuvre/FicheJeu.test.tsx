import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FicheJeu, type CibleFiche, type FicheOeuvre } from "./FicheJeu";
import type { MomentTimeline } from "../timeline/types";

/**
 * E05, variante A — la fiche de jeu.
 *
 * <b>Deux couches superposées, la personnelle EN HAUT</b> : « cet ordre est
 * délibéré : le produit est une biographie, pas une encyclopédie. Une fiche
 * qui ouvre sur la fiche technique aurait inversé la proposition de valeur. »
 *
 * Ce que la Phase 1 en livre : ce que j'ai vécu, les éditions connues, et la
 * déclaration — qui passe par le MÊME chemin d'écriture que la sélection
 * massive, jamais par un second.
 */
const CIBLE: CibleFiche = {
  kind: "work",
  id: "wrk_ff7",
  label: "Final Fantasy VII",
  platformId: "plt_ps1",
};

const REFERENTIEL: FicheOeuvre = {
  id: "wrk_ff7",
  title: "Final Fantasy VII",
  coverUrl: "/api/covers/wrk_ff7",
  editions: [
    { platformId: "plt_ps1", platformName: "PlayStation", region: "NTSC-J",
      date: "1997-01-31", precision: "day" },
    { platformId: "plt_ps1", platformName: "PlayStation", region: "PAL",
      date: "1997-11-14", precision: "day" },
  ],
};

const moment = (id: string, type: string, annee: number): MomentTimeline => ({
  id,
  type,
  targetKind: "work",
  targetId: "wrk_ff7",
  targetLabel: "Final Fantasy VII",
  occurredAt: { kind: "Year", year: annee },
  memory: null,
  platformId: "plt_ps1",
});

function poser(sur: Partial<Parameters<typeof FicheJeu>[0]> = {}) {
  const declarer = vi.fn().mockResolvedValue(undefined);
  const retracter = vi.fn().mockResolvedValue(undefined);
  const fermer = vi.fn();
  const rendu = render(
    <FicheJeu
      cible={CIBLE}
      referentiel={REFERENTIEL}
      moments={[moment("m1", "StartedGame", 1997)]}
      souvenir={null}
      declarer={declarer}
      retracter={retracter}
      fermer={fermer}
      {...sur}
    />,
  );
  return { declarer, retracter, fermer, rendu };
}

describe("FicheJeu — le personnel avant le factuel (E05)", () => {
  it("place la couche personnelle AU-DESSUS de la couche référentiel", () => {
    // Mesuré sur le document, pas déduit de l'ordre du code : c'est la
    // décision de conception centrale de la fiche.
    poser();

    const vous = screen.getByTestId("fiche-vous");
    const faits = screen.getByTestId("fiche-referentiel");
    expect(vous.compareDocumentPosition(faits) & Node.DOCUMENT_POSITION_FOLLOWING)
      .toBeTruthy();
  });

  it("montre ce que j'ai vécu, avec la granularité déclarée", () => {
    poser({
      moments: [
        moment("m1", "StartedGame", 1997),
        { ...moment("m2", "CompletedGame", 1998),
          occurredAt: { kind: "ApproximateYear", year: 1998, margin: 2 } },
      ],
    });

    const vous = screen.getByTestId("fiche-vous");
    expect(vous).toHaveTextContent("1997");
    // « vers 1998 » n'est pas « 1998 » : la fiche rassemble les moments, elle
    // ne les reformate pas.
    expect(vous).toHaveTextContent("vers 1998");
  });

  it("rassemble les moments que l'axe disperse", () => {
    // C'est ce que la fiche APPORTE : sur l'axe, les trois moments d'un même
    // jeu sont répartis entre des entrées éloignées, et parfois repliés dans
    // un épisode.
    poser({
      moments: [
        moment("m1", "StartedGame", 1997),
        moment("m2", "CompletedGame", 1998),
        moment("m3", "AcquiredItem", 1997),
      ],
    });

    expect(screen.getAllByTestId("fiche-moment")).toHaveLength(3);
  });

  it("porte le souvenir écrit sur ce jeu", () => {
    // §9.1 en fait le porteur du « oui, ça me ressemble » ; une fiche qui
    // l'omettrait montrerait tout SAUF ce qui appartient au joueur.
    poser({ souvenir: { title: "L'été chez mon frère", text: "On l'a fini à deux." } });

    const vous = screen.getByTestId("fiche-vous");
    expect(vous).toHaveTextContent("L'été chez mon frère");
    expect(vous).toHaveTextContent("On l'a fini à deux.");
  });

  // ------------------------------------------------ la couche référentiel

  it("nomme chaque édition avec sa machine et sa région", () => {
    // E05, pièges : « Afficher les éditions sans région : deux Release PAL et
    // NTSC ne sont pas interchangeables (§3.4). »
    poser();

    const editions = screen.getAllByTestId("fiche-edition").map((e) => e.textContent);
    expect(editions).toHaveLength(2);
    expect(editions[0]).toContain("PlayStation");
    expect(editions[0]).toContain("Japon");
    expect(editions[1]).toContain("Europe");
  });

  it("garde la granularité des sorties", () => {
    poser({
      referentiel: {
        ...REFERENTIEL,
        editions: [{ platformId: "plt_snes", platformName: "Super Nintendo",
                     region: "PAL", date: "1992-01-01", precision: "year" }],
      },
    });

    const edition = screen.getByTestId("fiche-edition");
    expect(edition).toHaveTextContent("1992");
    // Une année déclarée ne se rend pas comme un 1er janvier : ce serait
    // affirmer un jour que la source ne donne pas.
    expect(edition.textContent).not.toMatch(/janvier/);
  });

  // ------------------------------------------------------- les deux gestes

  it("rétracte par le MÊME chemin que la sélection massive", async () => {
    const utilisateur = userEvent.setup();
    const { retracter, declarer } = poser();

    await utilisateur.click(screen.getByRole("button", { name: /Retirer/i }));

    expect(retracter).toHaveBeenCalledTimes(1);
    expect(declarer).not.toHaveBeenCalled();
  });

  it("invite à déclarer quand plus rien n'est vécu, jamais un bloc vide", async () => {
    // E05, état vide : « la couche personnelle devient une invitation en une
    // ligne — "Vous y avez joué ?" ». C'est l'état qu'on atteint en se
    // rétractant depuis la fiche elle-même : décoché par erreur, on recoche.
    const utilisateur = userEvent.setup();
    const { declarer } = poser({ moments: [] });

    expect(screen.queryByTestId("fiche-moment")).toBeNull();
    const invite = screen.getByTestId("fiche-vous");
    expect(invite.textContent!.trim().length).toBeGreaterThan(0);

    await utilisateur.click(screen.getByRole("button", { name: /Vous y avez joué/i }));

    expect(declarer).toHaveBeenCalledTimes(1);
  });

  it("ne propose pas de déclarer quand la machine est inconnue", () => {
    // La plateforme est une donnée REÇUE, jamais déduite de l'œuvre. Sans
    // elle, déclarer choisirait une machine à la place du joueur — et sur une
    // œuvre multi-plateforme, il découvrirait sa déclaration ailleurs.
    poser({ moments: [], cible: { ...CIBLE, platformId: null } });

    expect(screen.queryByRole("button", { name: /Vous y avez joué/i })).toBeNull();
    // Le témoin (78) : la MÊME fiche, la machine connue, propose bien.
    poser({ moments: [], cible: CIBLE });
    expect(screen.getByRole("button", { name: /Vous y avez joué/i })).toBeInTheDocument();
  });

  // ------------------------------------------------- les cas particuliers

  it("marque un titre saisi hors du référentiel, sans faits inventés", () => {
    // §3.5 et E05, état « entité non canonique » : fiche minimale, marquée.
    // Lui fabriquer des éditions ferait passer pour un fait ce que le joueur
    // a tapé.
    poser({
      referentiel: null,
      cible: { kind: "unresolvedClaim", id: "ucl_x", label: "Le jeu de mon cousin",
               platformId: "plt_snes" },
    });

    expect(screen.getByTestId("fiche-non-canonique")).toBeInTheDocument();
    expect(screen.queryByTestId("fiche-referentiel")).toBeNull();
    // Le témoin (78) : une œuvre du référentiel, elle, porte bien ses faits.
    poser();
    expect(screen.getByTestId("fiche-referentiel")).toBeInTheDocument();
  });

  it("ne propose pas de re-déclarer un titre saisi", () => {
    // Une revendication n'a pas d'identifiant de référentiel : repartir de
    // son titre frapperait une SECONDE revendication, et le joueur croirait
    // corriger alors qu'il dédouble.
    poser({
      moments: [],
      referentiel: null,
      cible: { kind: "unresolvedClaim", id: "ucl_x", label: "Le jeu de mon cousin",
               platformId: "plt_snes" },
    });

    expect(screen.queryByRole("button", { name: /Vous y avez joué/i })).toBeNull();
    // Le témoin (78) : la même fiche sur une œuvre du référentiel propose.
    poser({ moments: [] });
    expect(screen.getByRole("button", { name: /Vous y avez joué/i })).toBeInTheDocument();
  });

  it("n'est jamais un cul-de-sac", async () => {
    // Principe transverse : aucun écran n'est un cul-de-sac, et E05 le
    // rappelle dans ses pièges.
    const utilisateur = userEvent.setup();
    const { fermer } = poser();

    await utilisateur.click(screen.getByRole("button", { name: /Revenir/i }));

    expect(fermer).toHaveBeenCalledTimes(1);
  });
});
