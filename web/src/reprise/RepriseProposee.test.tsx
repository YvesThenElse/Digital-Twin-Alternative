import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RepriseProposee } from "./RepriseProposee";

/**
 * E01, état « Retour d'un visiteur non authentifié » :
 *
 * > « Si un historique local existe, **proposer de le reprendre** plutôt que
 * > de recommencer. Perdre une saisie faite sans compte est le meilleur
 * > moyen de perdre l'utilisateur. »
 *
 * <b>Proposer, pas rediriger.</b> L'en-tête de la fiche annonce une
 * redirection ; l'écran de lecture n'a aujourd'hui aucun retour vers la
 * sélection, et une redirection dure y enfermerait le visiteur venu ajouter
 * une console.
 */
const offre = () => screen.queryByTestId("reprise");

describe("RepriseProposee — proposer, jamais recommencer", () => {
  it("ne propose rien tant que la sonde n'a pas répondu", () => {
    // L'accueil ne doit RIEN attendre (E01 : « Chargement : aucun »). Tant
    // qu'on ne sait pas, on ne dit pas — une offre qui clignote à l'arrivée
    // de la réponse vaudrait mieux qu'une offre fausse.
    render(<RepriseProposee moments={null} reprendre={() => {}} />);

    expect(offre()).toBeNull();
    // Le témoin (78) : la réponse arrivée, l'offre paraît. Sans lui, « rien »
    // se satisferait d'un composant qui ne rend jamais.
    render(<RepriseProposee moments={12} reprendre={() => {}} />);
    expect(offre()).toBeInTheDocument();
  });

  it("ne propose rien sur un profil vierge", () => {
    // Proposer de « reprendre » une histoire vide ferait douter le nouveau
    // venu de ce qu'il a déjà fait — au premier écran, avant tout geste.
    render(<RepriseProposee moments={0} reprendre={() => {}} />);

    expect(offre()).toBeNull();
    // Le témoin : un seul moment suffit à la faire paraître.
    render(<RepriseProposee moments={1} reprendre={() => {}} />);
    expect(offre()).toBeInTheDocument();
  });

  it("nomme ce qui est déjà là", () => {
    // « Perdre une saisie faite sans compte est le meilleur moyen de perdre
    // l'utilisateur » : l'offre dit CE QU'IL Y A, sans quoi elle demande de
    // faire confiance à un mot.
    render(<RepriseProposee moments={33} reprendre={() => {}} />);

    expect(offre()).toHaveTextContent("33");
  });

  it("accorde au singulier", () => {
    render(<RepriseProposee moments={1} reprendre={() => {}} />);

    expect(offre()!.textContent).not.toMatch(/moments/);
    expect(offre()).toHaveTextContent("moment");
  });

  it("n'alarme pas : c'est une offre, pas un avertissement", () => {
    // Le registre compte. « Attention, vous avez une saisie en cours » ferait
    // du retour un incident ; E01 en fait une continuité.
    render(<RepriseProposee moments={12} reprendre={() => {}} />);

    expect(offre()!.textContent).not.toMatch(/attention|perdu|erreur|non enregistr/i);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("reprend au clic, et n'a qu'une action", () => {
    const reprendre = vi.fn();
    render(<RepriseProposee moments={12} reprendre={reprendre} />);

    const boutons = screen.getAllByRole("button");
    expect(boutons).toHaveLength(1);
    boutons[0].click();

    expect(reprendre).toHaveBeenCalledTimes(1);
  });
});
