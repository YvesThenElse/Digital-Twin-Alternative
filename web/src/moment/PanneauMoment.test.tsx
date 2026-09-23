import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PanneauMoment, type EtatDuJeu } from "./PanneauMoment";
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

const SANS_ETAT: EtatDuJeu = { completion: null, provenance: null, affect: null };

function poser(
  quand: ValeurTemporelle = { kind: "Year", year: 1998 },
  anneeDeNaissance: number | null = 1980,
  etat: EtatDuJeu | null = SANS_ETAT,
) {
  const enregistrer = vi.fn();
  const enregistrerNaissance = vi.fn();
  const reglerEtat = vi.fn();
  const fermer = vi.fn();
  render(
    <PanneauMoment
      moment={moment(quand)}
      anneeCourante={2026}
      anneeDeNaissance={anneeDeNaissance}
      etat={etat}
      reglerEtat={reglerEtat}
      enregistrer={enregistrer}
      enregistrerNaissance={enregistrerNaissance}
      fermer={fermer}
    />,
  );
  return { enregistrer, enregistrerNaissance, reglerEtat, fermer };
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

  it("ouvre sur « vers » quand c'est ce qui est enregistré", () => {
    // La granularité affichée est celle qui a été enregistrée : rouvrir un
    // « vers 1994 ± 2 » sur une année nue effacerait l'imprécision déclarée
    // au premier enregistrement.
    poser({ kind: "ApproximateYear", year: 1994, margin: 2 });

    expect(annee()).toHaveValue(1994);
    expect(screen.getByRole("radio", { name: /à peu près/i })).toBeChecked();
    expect(screen.getByRole("spinbutton", { name: /années près/i })).toHaveValue(2);
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

describe("PanneauMoment — le repli de précision (E07 repère B)", () => {
  const repli = () => screen.getByTestId("panneau-repli");

  it("est REPLIÉ par défaut", () => {
    // « Replié par défaut, il n'est jamais nécessaire. » Mois et date exacte
    // sont rarissimes pour un souvenir de trente ans.
    poser();

    expect(repli()).not.toHaveAttribute("open");
  });

  it("enregistre un mois", async () => {
    const utilisateur = userEvent.setup();
    const { enregistrer } = poser({ kind: "Year", year: 1998 });

    await utilisateur.click(screen.getByRole("radio", { name: /Un mois précis/ }));
    await utilisateur.selectOptions(
      screen.getByRole("combobox", { name: /Mois/ }), "11");
    await utilisateur.click(screen.getByRole("button", { name: /Enregistrer$/ }));

    expect(enregistrer).toHaveBeenCalledWith({ kind: "month", year: 1998, month: 11 });
  });

  it("enregistre une date exacte", async () => {
    const utilisateur = userEvent.setup();
    const { enregistrer } = poser({ kind: "ExactDate", date: "1998-11-08" });

    await utilisateur.click(screen.getByRole("button", { name: /Enregistrer$/ }));

    expect(enregistrer).toHaveBeenCalledWith({ kind: "date", date: "1998-11-08" });
  });

  it("enregistre un « vers », et jamais une marge nulle", async () => {
    // Une marge nulle dirait exactement ce que dit une année, et deux façons
    // d'exprimer la même chose finissent toujours par diverger.
    const utilisateur = userEvent.setup();
    const { enregistrer } = poser({ kind: "Year", year: 1994 });

    await utilisateur.click(screen.getByRole("radio", { name: /à peu près/i }));
    const marge = screen.getByRole("spinbutton", { name: /années près/i });
    // `fireEvent.change` pose la valeur EXACTE : `type` l'ajouterait à ce qui
    // est déjà là, et « 0 » derrière « 2 » ferait 20 — on mesurerait la
    // frappe au lieu de la règle.
    fireEvent.change(marge, { target: { value: "0" } });
    expect(marge, "la marge nulle n'a pas été ramenée à un").toHaveValue(1);

    fireEvent.change(marge, { target: { value: "4" } });
    await utilisateur.click(screen.getByRole("button", { name: /Enregistrer$/ }));

    expect(enregistrer).toHaveBeenCalledWith(
      { kind: "approximate", year: 1994, margin: 4 });
  });

  it("pose une période OUVERTE", async () => {
    // « Depuis 1994 » : l'API l'accepte, l'axe la rend, et aucun écran ne la
    // posait. La refermer sur son début inventerait une fin.
    const utilisateur = userEvent.setup();
    const { enregistrer } = poser({ kind: "YearRange", year: 1994, endYear: 1997 });

    await utilisateur.click(screen.getByRole("checkbox", { name: /fin n'est pas connue/i }));
    await utilisateur.click(screen.getByRole("button", { name: /Enregistrer$/ }));

    expect(enregistrer).toHaveBeenCalledWith({ kind: "range", from: 1994, to: null });
  });

  // ------------------------------------------------- l'âge et sa condition

  it("n'offre PAS l'âge sans année de naissance", async () => {
    // §7.6 : sans elle, un âge se comporte comme « je ne sais plus » et le
    // moment tombe dans le tiroir. L'offrir quand même ferait disparaître le
    // moment de l'axe sans que rien ne l'explique.
    poser({ kind: "Year", year: 1998 }, null);

    expect(screen.queryByRole("radio", { name: /vers mes/i })).toBeNull();
    // Le témoin (78) : l'année connue, l'option est là.
    poser({ kind: "Year", year: 1998 }, 1980);
    expect(screen.getAllByRole("radio", { name: /vers mes/i })).not.toHaveLength(0);
  });

  it("propose de renseigner l'année de naissance, en DISANT à quoi elle sert", async () => {
    // « Jamais un champ de plus sans justification. » Un champ nu au milieu
    // d'un panneau de date se lit comme une demande arbitraire.
    const utilisateur = userEvent.setup();
    const { enregistrerNaissance } = poser({ kind: "Year", year: 1998 }, null);

    const invitation = screen.getByTestId("panneau-naissance");
    expect(invitation.textContent).toMatch(/jamais publiée/i);

    const champ = screen.getByRole("spinbutton", { name: /Année de naissance/ });
    await utilisateur.clear(champ);
    await utilisateur.type(champ, "1982");
    await utilisateur.click(
      screen.getByRole("button", { name: /Enregistrer mon année de naissance/ }));

    expect(enregistrerNaissance).toHaveBeenCalledWith(1982);
  });

  it("enregistre un âge, brut", async () => {
    // MODELE §3, règle 3 : stocké brut, jamais converti à l'écriture — c'est
    // ce qui permet à une correction de l'année de naissance de replacer
    // tous les moments concernés.
    const utilisateur = userEvent.setup();
    const { enregistrer } = poser({ kind: "Age", age: 12 }, 1980);

    await utilisateur.click(screen.getByRole("button", { name: /Enregistrer$/ }));

    expect(enregistrer).toHaveBeenCalledWith({ kind: "age", age: 12 });
  });

  it("ouvre sur l'âge quand c'est ce qui est enregistré", () => {
    poser({ kind: "Age", age: 12 }, 1980);

    expect(screen.getByRole("spinbutton", { name: /^Âge$/ })).toHaveValue(12);
  });
});

/**
 * E07 repère B bis — achèvement, provenance, affect.
 *
 * « C'est le second endroit où elles se règlent : E02 pendant la saisie en
 * masse, E07 plus tard, en relisant sa timeline. **Les deux écrans partagent
 * le même composant — une divergence entre eux serait un défaut.** »
 */
describe("PanneauMoment — corriger l'état (E07 repère B bis)", () => {
  it("porte les trois questions de la passe 2", () => {
    poser();

    expect(screen.getByRole("group", { name: /fini/i })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /marqué/i })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /Comment/i })).toBeInTheDocument();
  });

  it("montre ce qui a DÉJÀ été dit", () => {
    // Rouvrir vierge ferait disparaître ce que le joueur vient de dire :
    // c'est exactement ce que « toujours en cours » a déjà coûté.
    poser({ kind: "Year", year: 1998 }, 1980,
      { completion: "finished", provenance: "owned", affect: "favourite" });

    expect(screen.getByRole("button", { name: "Fini" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Je l'avais" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Mon préféré" })).toHaveAttribute("aria-pressed", "true");
  });

  it("règle l'affect — saisissable pour la première fois (§4.7)", async () => {
    // La colonne existait, la lecture la rendait, le domaine savait qu'elle
    // lève « jamais joué » — et AUCUN geste ne l'écrivait.
    const utilisateur = userEvent.setup();
    const { reglerEtat } = poser();

    await utilisateur.click(screen.getByRole("button", { name: "J'ai adoré" }));

    expect(reglerEtat).toHaveBeenCalledWith("affect", "loved");
  });

  it("règle l'achèvement et la provenance", async () => {
    const utilisateur = userEvent.setup();
    const { reglerEtat } = poser();

    await utilisateur.click(screen.getByRole("button", { name: "Abandonné" }));
    await utilisateur.click(screen.getByRole("button", { name: "Emprunté" }));

    expect(reglerEtat).toHaveBeenCalledWith("completion", "abandoned");
    expect(reglerEtat).toHaveBeenCalledWith("provenance", "borrowed");
  });

  it("persiste au clic, sans sauvegarde explicite", async () => {
    // E02 : « aucune sauvegarde explicite, chaque bascule est persistée
    // immédiatement ». Les deux écrans partagent le composant ; leur faire
    // des promesses différentes serait la divergence qu'E07 interdit.
    const utilisateur = userEvent.setup();
    const { reglerEtat, enregistrer } = poser();

    await utilisateur.click(screen.getByRole("button", { name: "Fini" }));

    expect(reglerEtat).toHaveBeenCalledTimes(1);
    expect(enregistrer).not.toHaveBeenCalled();
  });

  it("n'offre rien à régler quand le jeu n'est pas du référentiel", () => {
    // Un titre saisi n'a pas d'identifiant d'œuvre : une déclaration ne
    // saurait pas sur quoi porter. Le témoin est dans les tests ci-dessus.
    poser({ kind: "Year", year: 1998 }, 1980, null);

    expect(screen.queryByTestId("panneau-etat")).toBeNull();
  });
});
