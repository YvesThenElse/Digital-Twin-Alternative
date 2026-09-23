import type React from "react";
import { useEffect, useRef } from "react";
import { t } from "../i18n/t";
import { Tuile } from "../disposition/Tuile";
import { anneeDe } from "../temporel/valeur";
import {
  CHOIX_ACHEVEMENT,
  CHOIX_AFFECT,
  CHOIX_PROVENANCE,
  Question,
} from "./Question";
import type { Oeuvre } from "./types";

/**
 * Les trois états d'une ligne d'E02.
 *
 * <b>Le troisième n'est pas une absence de valeur, c'est une valeur.</b>
 * §24.3 : « il n'y a pas joué » et « il ne s'est pas prononcé » sont deux
 * informations différentes. L'écran les rendait pourtant pareil — une ligne
 * éteinte —, si bien qu'ouvrir la liste ne disait pas ce qu'on avait déjà
 * répondu.
 */
export type EtatDuJeu = "joue" | "jamais" | "inconnu";

/**
 * La modale d'un jeu (E02) — <b>le centre, à la place du dépli</b>.
 *
 * Le dépli en ligne poussait la liste vers le bas à chaque coche : la
 * réponse qu'on venait de donner se perdait au milieu de trente autres
 * lignes, et rien ne disait qu'on avait sélectionné quelque chose. La modale
 * ne montre qu'un jeu, avec son nom et sa jaquette.
 *
 * <b>Elle ne retient personne.</b> Un clic à côté, `Échap`, le bouton de
 * fermeture : trois sorties, et aucune ne perd ce qui a été dit — chaque
 * réponse est envoyée au geste qui la produit. C'est la condition pour
 * qu'une modale ne devienne pas le « piège » qu'E02 nomme : une confirmation
 * par jeu détruirait le budget d'un geste par jeu.
 *
 * <b>Elle enseigne le geste qui la rend inutile</b> : le balayage est écrit
 * dedans. C'est le seul endroit où l'on a le temps de le lire — sur la ligne
 * il faudrait une légende, et E02 les interdit.
 */
export function ModaleDuJeu({
  oeuvre, etat, regler, affinage, repondre, ouvrirFiche, fermer, enfants,
}: {
  oeuvre: Oeuvre;
  etat: EtatDuJeu;
  /** Dit l'état, ou le RETIRE si c'est celui qui est déjà là. */
  regler: (etat: "joue" | "jamais") => void;
  affinage: { completion: string | null; provenance: string | null; affect: string | null };
  repondre: (champ: "completion" | "provenance" | "affect", valeur: string) => void;
  ouvrirFiche: () => void;
  fermer: () => void;
  /** Le champ souvenir, monté par l'appelant qui tient son brouillon. */
  enfants: React.ReactNode;
}) {
  const boite = useRef<HTMLDivElement>(null);

  // Le focus ENTRE, puis REVIENT. Sans le premier, le clavier reste sur la
  // liste derrière et `Échap` n'atteint pas la modale ; sans le second, on
  // repart en haut de la page après avoir fermé, donc on a perdu sa place
  // dans une liste de 147 lignes.
  useEffect(() => {
    const venait = document.activeElement as HTMLElement | null;
    boite.current?.focus();
    return () => venait?.focus?.();
  }, []);

  useEffect(() => {
    const auClavier = (e: KeyboardEvent) => {
      if (e.key === "Escape") fermer();
    };
    document.addEventListener("keydown", auClavier);
    return () => document.removeEventListener("keydown", auClavier);
  }, [fermer]);

  const declare = etat === "joue";

  return (
    // Le fond EST la sortie : « si on clique à côté, on a juste fermé ».
    // Il ne porte pas de rôle de bouton — ce serait une cible annoncée aux
    // lecteurs d'écran qui double le bouton de fermeture, juste en dessous.
    <div
      className="modale-fond"
      data-testid="modale-fond"
      onClick={(e) => {
        if (e.target === e.currentTarget) fermer();
      }}
    >
      <div
        className="modale"
        data-testid="modale-jeu"
        data-etat={etat}
        role="dialog"
        aria-modal="true"
        aria-label={oeuvre.titre}
        tabIndex={-1}
        ref={boite}
      >
        <header className="modale-tete">
          {/* La jaquette, parce que tout l'écran repose sur la
              reconnaissance : « on voit la modale qui reprend juste le nom,
              peut-être l'image ». `Tuile` retombe sur la tuile générée quand
              il n'y a pas de jaquette, donc aucune modale n'est bancale. */}
          <Tuile
            titre={oeuvre.titre}
            annee={oeuvre.sortie ? anneeDe(oeuvre.sortie) : null}
            couverture={oeuvre.couverture}
          />
          <h2 className="modale-titre">{oeuvre.titre}</h2>
          <button type="button" className="discret" onClick={fermer}>
            {t("modale.fermer")}
          </button>
        </header>

        {/* La PREMIÈRE question, et la seule qui construise la timeline.
            Re-cliquer la réponse donnée la retire : le troisième état doit
            rester atteignable, sinon un geste par erreur serait définitif. */}
        <Question
          intitule={t("modale.joue")}
          valeur={etat === "inconnu" ? null : etat}
          repondre={(v) => regler(v as "joue" | "jamais")}
          choix={[
            { valeur: "joue", libelle: t("modale.oui") },
            { valeur: "jamais", libelle: t("modale.jamais") },
          ]}
        />

        {/* Ce qui suit n'a de sens que sur un jeu auquel on a joué : poser
            « vous l'avez fini ? » sous « jamais joué » produirait l'exact
            « je n'y ai jamais joué, et je l'ai fini » que l'invariant 8
            interdit. Rien n'est grisé : ce qui n'a pas lieu d'être n'est pas
            là. */}
        {declare ? (
          <>
            <Question
              intitule={t("passe2.acheve")}
              valeur={affinage.completion}
              repondre={(v) => repondre("completion", v)}
              choix={CHOIX_ACHEVEMENT}
            />
            {/* L'ORDRE d'E02 : « le factuel, puis l'émotionnel, et enfin la
                provenance, la plus accessoire ». Qui s'arrête après deux
                questions n'a rien perdu d'essentiel. */}
            <Question
              intitule={t("passe2.affect")}
              valeur={affinage.affect}
              repondre={(v) => repondre("affect", v)}
              choix={CHOIX_AFFECT}
            />
            <Question
              intitule={t("passe2.comment")}
              valeur={affinage.provenance}
              repondre={(v) => repondre("provenance", v)}
              choix={CHOIX_PROVENANCE}
            />
            {enfants}
          </>
        ) : (
          <p className="modale-rien">{t("modale.inconnu")}</p>
        )}

        {/* → E05. Sur une ligne, cette cible coûterait 44 px à chacune des
            147 ; ici elle ne coûte rien, et elle vaut pour un jeu dont on se
            demande « c'est quoi, ce jeu ? » — ce que le panneau d'affinage,
            réservé aux lignes déclarées, ne permettait pas. */}
        <button type="button" className="discret" onClick={ouvrirFiche}>
          {t("action.voirLaFiche", { titre: oeuvre.titre })}
        </button>

        {/* Le balayage, écrit là où on a le temps de le lire. E02 interdit
            « une légende à apprendre » SUR la liste ; la modale n'est pas la
            liste, et cette phrase existe pour se rendre inutile. */}
        <p className="modale-astuce">{t("modale.balayage")}</p>
      </div>
    </div>
  );
}
