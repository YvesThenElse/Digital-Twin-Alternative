import { accentEpoque } from "../disposition/epoque";
import { t } from "../i18n/t";
import type { Plateforme } from "../selection/types";

/**
 * La phrase de récit de §24.4 — <b>la récompense avant l'effort</b>.
 *
 * « Un utilisateur ne fournira l'effort de saisie que s'il en perçoit le
 * bénéfice PENDANT la saisie, pas à la fin […] la première console saisie
 * déclenche déjà une phrase de récit. » C'est la réponse au risque produit
 * numéro un, et elle arrive au premier geste : avant la période, avant la
 * liste, avant qu'on ait rien demandé.
 *
 * <b>Elle ne confirme rien</b> (E01, temps 3) : « ce n'est pas une
 * confirmation, c'est un cadeau. Il ne dit pas "enregistré", il montre le
 * début d'une histoire. »
 *
 * <b>Et elle ne compte rien.</b> Les premières statistiques de §24.4 sont
 * différées par écrit (`PHASING.md`) : un compteur ferait parler le produit
 * de lui-même au moment précis où on lui demande de parler du joueur. La
 * seule donnée chiffrée est un fait du référentiel — l'année de la machine —
 * et elle porte sur la machine, jamais sur le joueur : « votre histoire
 * commence en 1990 » affirmerait une date que personne n'a donnée.
 */
export function PhraseDeRecit({ machine }: { machine: Plateforme }) {
  const epoque = accentEpoque(machine.launchYear);
  return (
    <p
      className="recit"
      data-testid="recit"
      data-epoque={epoque.nom}
      // E01 : « le système visuel du produit s'installe dès le deuxième
      // écran ». Le nom seul ne suffit pas — une bande nommée mais non
      // peinte se lit comme un défaut d'affichage.
      style={{ borderInlineStartColor: epoque.accent }}
    >
      {t("recit.premiereConsole", {
        machine: machine.nom,
        annee: String(machine.launchYear),
      })}
    </p>
  );
}
