import { Tuile } from "../disposition/Tuile";
import { t } from "../i18n/t";
import { nomRegion } from "../region/statut";
import { anneeDe, forme, libelle, valeurDeSortie } from "../temporel/valeur";
import type { MomentTimeline, SouvenirTimeline } from "../timeline/types";

/** Une édition connue de l'œuvre (E05 repère 3), telle que l'API la rend. */
export type EditionConnue = {
  platformId: string;
  platformName: string;
  /** `null` pour une sortie mondiale — jamais absent : §3.4. */
  region: string | null;
  date: string;
  precision: string;
};

/** La couche référentiel d'une fiche de jeu. */
export type FicheOeuvre = {
  id: string;
  title: string;
  coverUrl: string | null;
  editions: EditionConnue[];
};

/**
 * Ce que l'appelant sait déjà de la cible, et que la fiche ne redemande pas.
 */
export type CibleFiche = {
  /** `work` ou `unresolvedClaim` — deux espaces de noms distincts. */
  kind: string;
  id: string;
  label: string;
  /**
   * La machine sur laquelle la déclaration a été faite, <b>reçue et jamais
   * déduite</b> de l'œuvre. `null` quand on ne la connaît pas : la fiche ne
   * propose alors pas de déclarer, plutôt que de choisir une machine à la
   * place du joueur — sur une œuvre multi-plateforme, il découvrirait sa
   * déclaration ailleurs.
   */
  platformId: string | null;
};

/**
 * E05, variante A — <b>la fiche de jeu</b>.
 *
 * « Toute fiche se lit en deux couches superposées, dans cet ordre : la
 * couche personnelle — ce que *j'ai* vécu —, en haut, toujours ; la couche
 * référentiel — les faits — en dessous. Cet ordre est délibéré : le produit
 * est une biographie, pas une encyclopédie. »
 *
 * <b>Ce qu'elle apporte que l'axe ne peut pas.</b> Sur la timeline, les trois
 * moments d'un même jeu sont dispersés entre des entrées éloignées, et
 * parfois repliés dans un épisode. Ici ils sont ensemble, avec le souvenir —
 * c'est la seule vue du produit qui réponde à « ce jeu, et moi ».
 *
 * <b>Un seul chemin d'écriture.</b> Déclarer et rétracter passent par les
 * mêmes appels que la sélection massive. Un second chemin produirait des
 * événements de forme différente pour le même geste, et le journal cesserait
 * d'être comparable à lui-même.
 */
export function FicheJeu({
  cible,
  referentiel,
  moments,
  souvenir,
  declarer,
  retracter,
  fermer,
}: {
  cible: CibleFiche;
  /**
   * `null` pour une revendication de §3.5 — ou tant que la lecture n'a pas
   * abouti. Dans les deux cas la fiche ne montre aucun fait : en fabriquer
   * ferait passer pour du référentiel ce que le joueur a tapé.
   */
  referentiel: FicheOeuvre | null;
  moments: MomentTimeline[];
  souvenir: SouvenirTimeline | null;
  declarer: () => void;
  retracter: () => void;
  fermer: () => void;
}) {
  const declare = moments.length > 0;

  return (
    <section className="fiche" data-testid="fiche">
      <h2 className="fiche-titre">{cible.label}</h2>

      {/* §3.5 : une saisie libre n'est pas une œuvre curée, et la marque est
          DITE. Sans elle, une fiche sans éditions se lirait comme une œuvre
          du catalogue dont les sorties manqueraient. */}
      {cible.kind !== "work" ? (
        <p className="fiche-marque" data-testid="fiche-non-canonique">
          {t("fiche.nonCanonique")}
        </p>
      ) : null}

      {/* ---- couche 1 : VOUS, toujours en haut ---- */}
      <div className="fiche-vous" data-testid="fiche-vous">
        <h3 className="fiche-section">{t("fiche.vous")}</h3>

        {declare ? (
          <>
            <ul className="fiche-moments">
              {moments.map((m) => (
                <li key={m.id} className="fiche-moment" data-testid="fiche-moment">
                  <span className="fiche-moment-type">{t("fiche.moment")}</span>
                  {/* La granularité déclarée, pas une date reformatée : la
                      fiche rassemble les moments, elle ne les réécrit pas. */}
                  <span data-forme={forme(m.occurredAt)}>{libelle(m.occurredAt)}</span>
                </li>
              ))}
            </ul>

            {souvenir !== null ? (
              <div className="fiche-souvenir">
                {souvenir.title !== null ? (
                  <p className="fiche-souvenir-repere">{souvenir.title}</p>
                ) : null}
                <p className="souvenir-texte">{souvenir.text}</p>
              </div>
            ) : null}

            <button type="button" className="discret" onClick={retracter}>
              {t("fiche.retirer")}
            </button>
          </>
        ) : (
          <>
            {/* « La couche personnelle devient une invitation en une ligne —
                "Vous y avez joué ?". Jamais un bloc vide. » */}
            <p className="fiche-invite">{t("fiche.rienDeclare")}</p>
            {/* Une revendication de §3.5 ne se re-déclare pas : elle n'a pas
                d'identifiant de référentiel, et repartir de son titre
                frapperait une SECONDE revendication. Le joueur croirait
                corriger, et il dédoublerait. */}
            {cible.kind === "work" && cible.platformId !== null ? (
              <button type="button" className="primaire" onClick={declarer}>
                {t("fiche.declarer")}
              </button>
            ) : null}
          </>
        )}
      </div>

      {/* ---- couche 2 : les faits ---- */}
      {referentiel !== null ? (
        <div className="fiche-referentiel" data-testid="fiche-referentiel">
          <h3 className="fiche-section">{t("fiche.editions")}</h3>
          <ul className="fiche-editions">
            {referentiel.editions.map((e) => {
              const quand = valeurDeSortie(e.date, e.precision);
              return (
                <li
                  key={`${e.platformId}/${e.region ?? "monde"}/${e.date}`}
                  className="fiche-edition"
                  data-testid="fiche-edition"
                >
                  {t("fiche.edition", {
                    machine: e.platformName,
                    // §3.4 : deux sorties PAL et NTSC ne sont pas
                    // interchangeables. Le NOM, jamais le code.
                    region: e.region === null ? t("region.mondiale") : nomRegion(e.region),
                    quand: libelle(quand),
                  })}
                </li>
              );
            })}
          </ul>

          {referentiel.coverUrl !== null ? (
            <div className="fiche-jaquette">
              <Tuile
                titre={referentiel.title}
                annee={
                  referentiel.editions.length > 0
                    ? anneeDe(valeurDeSortie(
                        referentiel.editions[0].date,
                        referentiel.editions[0].precision))
                    : null
                }
                couverture={referentiel.coverUrl}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {/* « Faire de la fiche un cul-de-sac » est un piège nommé par E05 :
          elle doit toujours proposer une continuation. */}
      <button type="button" onClick={fermer}>{t("fiche.revenir")}</button>
    </section>
  );
}
