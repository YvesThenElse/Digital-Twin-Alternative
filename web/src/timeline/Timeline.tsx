import { useState } from "react";
import { accentEpoque } from "../disposition/epoque";
import { t } from "../i18n/t";
import { ZoneSansDate } from "../temporel/ZoneSansDate";
import { decenniesVides, intercaler, type Trou } from "./trous";
import { Icone, type NomIcone } from "../icones/Icone";
import { forme, libelle } from "../temporel/valeur";
import type {
  AvertissementTimeline,
  EntreeTimeline,
  MomentTimeline,
  SouvenirTimeline,
} from "./types";

/**
 * E03 — la timeline.
 *
 * <b>Un écran de lecture, pas un tableau de bord.</b> Les chiffres
 * appartiennent à E04 et E10 ; ici l'unité est le moment.
 *
 * <b>L'ordre vient du domaine.</b> `TimelineSorter` le calcule, 387 tests du
 * domaine le valident, et cet écran le rend tel quel. Retrier ici, même
 * « pour stabiliser », ferait diverger l'affichage du modèle sans que rien
 * ne le signale — et la timeline bougerait d'une visite à l'autre, ce que
 * l'utilisateur ne distingue pas d'une perte de données.
 */
export function Timeline({
  entrees,
  sansDate,
  avertissements,
  ouvrirFiche,
  anneeCourante,
  completer,
}: {
  entrees: EntreeTimeline[];
  sansDate: MomentTimeline[];
  /**
   * « Clic sur un jeu → E05 » (E03, actions).
   *
   * C'est le TITRE qui porte ce geste, pas la ligne : la fiche parle du jeu,
   * tandis que le moment lui-même appartiendra à E07. Les confondre ferait
   * ouvrir une fiche de jeu quand on voulait corriger une date.
   */
  ouvrirFiche: (moment: MomentTimeline) => void;
  /**
   * L'année d'aujourd'hui, <b>reçue et jamais lue ici</b>. Un composant qui
   * interroge l'horloge a des tests qui dépendent du jour où on les lance,
   * et ceux-là finissent toujours par échouer un matin.
   */
  anneeCourante: number;
  /**
   * « Zone vide d'une période → E02 préfiltré sur cette période, compléter
   * ces années » (E03, actions). C'est « le mécanisme de relance le plus
   * naturel du produit, et il ne coûte aucune notification ».
   */
  completer: (trou: Trou) => void;
  /**
   * Les incohérences que le domaine a constatées (§5.4).
   *
   * Requis, sans valeur par défaut : l'API les calculait et les rendait
   * depuis la Phase 1, et le type du client ne déclarait pas le champ —
   * personne ne les a jamais vues. Un défaut vide referait exactement ce
   * silence.
   */
  avertissements: AvertissementTimeline[];
}) {
  // Par moment CONCERNÉ — celui dont la date contredit son propre
  // prédécesseur. C'est lui qu'on regarde en se demandant ce qui cloche.
  const parMoment = new Map<string, string>();
  const typeDe = new Map<string, string>();
  for (const entree of entrees) {
    for (const moment of entree.moments) typeDe.set(moment.id, moment.type);
  }
  for (const a of avertissements) {
    const avant = typeDe.get(a.expectedEarlierId);
    // Un identifiant qu'on ne trouve pas ne produit rien : inventer une
    // ligne pour lui ferait apparaître un avertissement sans sujet.
    if (avant === undefined || !typeDe.has(a.expectedLaterId)) continue;
    parMoment.set(a.expectedLaterId, libelleType(avant));
  }

  return (
    <section>
      <h2>{t("timeline.titre")}</h2>

      {/* Vide : une invitation, pas un blanc. Un axe vierge se lit comme une
          panne ; la phrase dit qu'il n'y a rien à cause de l'histoire, pas à
          cause de l'écran. */}
      {entrees.length === 0 && sansDate.length === 0 ? (
        <p>{t("timeline.invitation")}</p>
      ) : null}

      <ol data-testid="axe" data-entrees={entrees.length}>
        {intercaler(entrees, decenniesVides(entrees, anneeCourante)).map((element) =>
          element.kind === "entree" ? (
            <Entree
              key={element.entree.moments[0].id}
              entree={element.entree}
              avertissements={parMoment}
              ouvrirFiche={ouvrirFiche}
            />
          ) : (
            <li
              key={`trou-${element.trou.debut}`}
              className="trou"
              data-testid="trou"
              data-decennie={element.trou.debut}
            >
              {/* Une invitation, pas un vide. « Une décennie vide n'est pas
                  un défaut d'affichage : c'est l'endroit exact où proposer
                  E02. » Un seul geste, et il nomme les années qu'il
                  propose — « compléter » seul laisserait deviner
                  lesquelles. */}
              <button type="button" onClick={() => completer(element.trou)}>
                {t("timeline.completer", {
                  debut: element.trou.debut,
                  fin: element.trou.fin,
                })}
              </button>
            </li>
          ),
        )}
      </ol>

      <ZoneSansDate
        moments={sansDate.map((m) => ({
          id: m.id,
          intitule: m.targetLabel,
          quand: m.occurredAt,
        }))}
      />
    </section>
  );
}

/**
 * Ce qu'un type d'événement montre de lui-même.
 *
 * <b>Quatre types sur onze ont un producteur</b> ; les sept autres sont des
 * capacités en avance, inscrites comme telles dans le modèle. Le jour où
 * l'un arrivera, l'axe ne doit pas le peindre en « joué » : il dit qu'il ne
 * sait pas, ce qui est une information — contrairement à un faux.
 */
const MARQUES: Record<string, NomIcone> = {
  StartedGame: "joue",
  CompletedGame: "fini",
  AbandonedGame: "abandonne",
  AcquiredItem: "possede",
};

/**
 * Le nom d'un type, dans les mots de l'écran.
 *
 * Un type sans marque rend son type brut : c'est la règle déjà tenue par la
 * marque elle-même — dire qu'on ne sait pas est une information, contrairement
 * à un faux.
 */
function libelleType(type: string): string {
  const icone = MARQUES[type];
  return icone === undefined ? type : t(`icone.${icone}`);
}

function Marque({ type }: { type: string }) {
  const icone = MARQUES[type];
  return (
    <span className="moment-marque" data-testid="moment-marque">
      {icone === undefined ? type : <Icone nom={icone} />}
    </span>
  );
}

/**
 * Le souvenir sur l'axe (§9.2, E03 repère C).
 *
 * <b>Un repère, puis le texte au clic.</b> §9.2 donne au titre court ce rôle
 * exact : « servant de repère sur la timeline ». Déplier trente phrases
 * d'office ferait de l'écran de LECTURE un mur de texte, et l'axe — ce qu'on
 * vient voir — disparaîtrait ; ne rien montrer du tout laisserait en base le
 * seul contenu qui ne soit pas généré.
 *
 * <b>Sans repère, la marque reste.</b> Le titre est facultatif : faire
 * disparaître de l'axe la phrase de qui ne l'a pas titrée punirait un champ
 * qu'on annonce facultatif.
 */
function SouvenirDuMoment({ souvenir }: { souvenir: SouvenirTimeline }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <div className="souvenir">
      <button
        type="button"
        className="souvenir-repere"
        data-testid="souvenir-repere"
        aria-expanded={ouvert}
        onClick={() => setOuvert((o) => !o)}
      >
        {souvenir.title ?? t("timeline.souvenirSansRepere")}
      </button>
      {ouvert ? <p className="souvenir-texte">{souvenir.text}</p> : null}
    </div>
  );
}

function Entree({ entree, avertissements, ouvrirFiche }: {
  entree: EntreeTimeline;
  avertissements: Map<string, string>;
  ouvrirFiche: (moment: MomentTimeline) => void;
}) {
  const [deplie, setDeplie] = useState(false);

  // Les cibles dont le souvenir a déjà été rendu dans cette entrée. Reconstruit
  // à chaque rendu, et parcouru dans l'ordre d'affichage : la première ligne
  // du jeu porte la phrase, les suivantes ne la répètent pas.
  const porteurs = new Set<string>();
  const premierPorteur = (moment: MomentTimeline) => {
    const cle = `${moment.targetKind}/${moment.targetId}`;
    if (porteurs.has(cle)) return false;
    porteurs.add(cle);
    return true;
  };

  const annee = Number(entree.interval.start.slice(0, 4));
  const epoque = accentEpoque(Number.isNaN(annee) ? null : annee);
  const visible = entree.isEpisode ? deplie : true;

  return (
    <li
      data-testid="entree"
      data-episode={entree.isEpisode}
      data-moments={entree.moments.length}
      data-epoque={epoque.nom}
      // L'accent porte le repérage temporel : on sait où l'on est sans lire
      // de date. Le nom seul ne suffit pas : une bande nommée mais non
      // peinte se lit comme un défaut d'affichage.
      style={{ borderInlineStartColor: epoque.accent }}
    >
      {entree.isEpisode ? (
        // Une bande, pas une pile. Empiler douze moments identiques ferait
        // croire à douze souvenirs distincts, et l'axe deviendrait illisible
        // dès le premier passage en sélection massive (§4.4).
        <button
          type="button"
          aria-expanded={deplie}
          onClick={() => setDeplie((d) => !d)}
        >
          {t("timeline.deplier", { n: entree.moments.length })}
        </button>
      ) : null}

      {visible ? (
        <ul>
          {entree.moments.map((moment) => (
            <li key={moment.id} className="moment">
              <Marque type={moment.type} />
              {/* Un titre saisi n'est pas une œuvre curée : E02 le marque,
                  l'axe le donnait pour une entrée du catalogue. */}
              <button
                type="button"
                className="moment-titre"
                data-testid="moment-titre"
                data-canonique={String(moment.targetKind === "work")}
                onClick={() => ouvrirFiche(moment)}
              >
                {moment.targetLabel}
              </button>
              <span data-forme={forme(moment.occurredAt)}>
                {libelle(moment.occurredAt)}
              </span>
              {/* UNE fois par cible, pas une fois par moment. Le souvenir est
                  attaché au JEU (MODELE §5) : un titre affiné en porte trois,
                  et l'API rend le même sur les trois. Les afficher tous ferait
                  croire à trois phrases distinctes — le défaut exact que
                  l'agrégation d'épisode existe pour éviter (§4.4). */}
              {moment.memory !== null && premierPorteur(moment) ? (
                <SouvenirDuMoment souvenir={moment.memory} />
              ) : null}

              {/* L'avertissement doux de §5.4 : il informe, il ne bloque
                  rien, et le moment reste affiché tel qu'il a été déclaré.
                  Réordonner ou masquer reviendrait à prétendre connaître le
                  souvenir mieux que son auteur. */}
              {avertissements.has(moment.id) ? (
                <p className="avertissement" data-testid="avertissement">
                  {t("timeline.avertissement", { avant: avertissements.get(moment.id)! })}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}
