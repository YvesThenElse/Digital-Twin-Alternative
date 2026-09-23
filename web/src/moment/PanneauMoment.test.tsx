import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PanneauMoment } from "./PanneauMoment";
import type { ValeurTemporelle } from "../temporel/valeur";
import type { MomentTimeline } from "../timeline/types";

/**
 * E07 — l'éditeur de moment, <b>en panneau et jamais en page</b>.
 *
 * « Naviguer vers une page pour dater un souvenir puis revenir coûte deux
 * transitions et fait perdre la position dans la timeline. »
 *
 * <b>Le modèle a sept granularités, l'interface en montre trois.</b> Une
 * première version de la fiche exposait les sept variantes en boutons radio
 * plus trois niveaux de confiance : « dix contrôles pour dater un souvenir ».
 * L'année est au premier plan — « c'est la réponse la plus fréquente et la
 * plus honnête » —, la période et « je ne sais plus » sont offertes au même
 * niveau, et le repli de précision viendra avec S7.
 */
const moment = (quand: ValeurTemporelle): MomentTimeline => ({
  id: "m1",
  type: "CompletedGame",
  targetKind: "work",
  targetId: "wrk_ff7",
  targetLabel: "Final Fantasy VII",
  occurredAt: quand,
  platformId: "plt_ps1",
  memory: null,
});

function poser(quand: ValeurTemporelle = { kind: "Year", year: 1998 }) {
  const enregistrer = vi.fn();
  const fermer = vi.fn();
  render(
    <PanneauMoment
      moment={moment(quand)}
      anneeCourante={2026}
      enregistrer={enregistrer}
      fermer={fermer}
    />,
  );
  return { enregistrer, fermer };
}

const annee = () => screen.getByRole("spinbutton", { name: /^Année$/ });
const enregistrerLe = () => screen.getByRole("button", { name: /Enregistrer/ });

describe("PanneauMoment — trois choix visibles, l'année d'abord (E07)", () => {
  it("dit sur quel moment on travaille", () => {
    // Un panneau qui ne nomme pas sa cible fait corriger à l'aveugle, sur un
    // axe qui compte trente lignes.
    poser();

    expect(screen.getByTestId("panneau-moment")).toHaveTextContent("Final Fantasy VII");
  });

  it("ouvre sur l'année enregistrée", () => {
    poser({ kind: "Year", year: 1998 });

    expect(annee()).toHaveValue(1998);
  });

  it("ouvre DIRECTEMENT sur deux champs quand c'était une période", () => {
    // E07, état « Édition » : « la granularité affichée est celle qui a été
    // enregistrée (un Range ouvre directement sur deux champs) ». Rouvrir
    // sur une année seule ferait perdre la fin au premier enregistrement.
    poser({ kind: "YearRange", year: 1993, endYear: 1997 });

    expect(annee()).toHaveValue(1993);
    expect(screen.getByRole("spinbutton", { name: /Jusqu/ })).toHaveValue(1997);
  });

  it("ouvre sur « je ne sais plus » quand c'est ce qui est enregistré", () => {
    poser({ kind: "Unknown" });

    expect(screen.getByRole("radio", { name: /ne sais plus/i })).toBeChecked();
  });

  it("se replie sur l'année pour une granularité qu'il ne sait pas encore dire", () => {
    // Mois, date exacte, « vers », âge : le repli de précision est S7. En
    // attendant, le panneau ouvre sur l'année NOMINALE plutôt que sur un
    // champ vide — et aucun geste de la Phase 1 ne produit ces valeurs, donc
    // ce repli n'est pas atteignable par le produit livré.
    poser({ kind: "ApproximateYear", year: 1994, margin: 2 });

    expect(annee()).toHaveValue(1994);
  });

  // ------------------------------------------------------ les trois sorties

  it("corrige l'année", async () => {
    const utilisateur = userEvent.setup();
    const { enregistrer } = poser({ kind: "Year", year: 1998 });

    await utilisateur.clear(annee());
    await utilisateur.type(annee(), "2001");
    await utilisateur.click(enregistrerLe());

    expect(enregistrer).toHaveBeenCalledWith({ kind: "year", year: 2001 });
  });

  it("bascule en période, et garde les deux bornes", async () => {
    const utilisateur = userEvent.setup();
    const { enregistrer } = poser({ kind: "Year", year: 1993 });

    await utilisateur.click(screen.getByRole("radio", { name: /plutôt une période/i }));
    await utilisateur.clear(screen.getByRole("spinbutton", { name: /Jusqu/ }));
    await utilisateur.type(screen.getByRole("spinbutton", { name: /Jusqu/ }), "1997");
    await utilisateur.click(enregistrerLe());

    expect(enregistrer).toHaveBeenCalledWith({ kind: "range", from: 1993, to: 1997 });
  });

  it("enregistre « je ne sais plus » comme une réponse", async () => {
    // Principe 6 : `Unknown` est une réponse valide, offerte au MÊME niveau
    // que le reste. Un défaut sur « date précise » induirait une fausse
    // précision, exactement ce que §7.4 interdit.
    const utilisateur = userEvent.setup();
    const { enregistrer } = poser({ kind: "Year", year: 1998 });

    await utilisateur.click(screen.getByRole("radio", { name: /ne sais plus/i }));
    await utilisateur.click(enregistrerLe());

    expect(enregistrer).toHaveBeenCalledWith({ kind: "unknown" });
  });

  it("referme la section date sur « je ne sais plus »", () => {
    // E07 : « enregistre `Unknown` et referme la section ». Laisser un champ
    // d'année visible sous une réponse qui dit l'ignorer se lirait comme une
    // contradiction.
    poser({ kind: "Unknown" });

    expect(screen.queryByRole("spinbutton", { name: /^Année$/ })).toBeNull();
  });

  // --------------------------------------------------------- les deux règles

  it("ne demande AUCUNE confirmation : la correction est banale", async () => {
    // « Aucun avertissement ni confirmation pour modifier un moment : ce sont
    // des souvenirs, ils se corrigent. » Un geste, pas deux.
    const utilisateur = userEvent.setup();
    const { enregistrer } = poser();

    await utilisateur.click(enregistrerLe());

    expect(enregistrer).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog", { name: /confirm/i })).toBeNull();
  });

  it("se ferme sans rien enregistrer", async () => {
    const utilisateur = userEvent.setup();
    const { enregistrer, fermer } = poser();

    await utilisateur.click(screen.getByRole("button", { name: /Fermer/ }));

    expect(fermer).toHaveBeenCalledTimes(1);
    expect(enregistrer).not.toHaveBeenCalled();
  });

  it("n'offre pas de dater dans l'avenir", async () => {
    // Un souvenir ne se situe pas dans l'avenir : c'est le plafond de
    // l'horizon du domaine, et l'écran le dit au lieu de laisser saisir une
    // valeur que l'API refuserait plus loin.
    poser({ kind: "Year", year: 1998 });

    expect(annee()).toHaveAttribute("max", "2026");
  });
});
