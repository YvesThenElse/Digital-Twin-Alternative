import { accentEpoque, type Disposition } from "../disposition/epoque";
import { Tuile } from "../disposition/Tuile";
import { t } from "../i18n/t";
import {
  decennieDe,
  nomDecennie,
  versValeurTemporelle,
  type PeriodeChoisie,
} from "../periode/periode";
import type { Oeuvre, Plateforme } from "../selection/types";
import { anneeDe, libelle, surLAxe } from "../temporel/valeur";

/**
 * Combien de jaquettes l'aperçu montre, par disposition.
 *
 * E01 : « empilé, aperçu sur une rangée de 4 » contre « axe et aperçu côte à
 * côte, 8 jaquettes ». Deux dispositions à livrer, pas une étirée (§21.2).
 */
const APERCU: Record<Disposition, number> = { liste: 4, grille: 8 };

/**
 * E01, temps 3 — <b>« la récompense, immédiate »</b>.
 *
 * « Dès la validation du temps 2, <b>sans transition ni chargement
 * bloquant</b> : une phrase, une bande sur un axe, un aperçu visuel des jeux
 * à venir, une continuation. C'est le premier "retour visible" exigé par le
 * principe 1 — et la première fois que l'utilisateur voit du contenu qui lui
 * ressemble. »
 *
 * <b>Il ne demande rien.</b> Tout ce qu'il affiche est déjà là : les œuvres
 * de la plateforme ont été lues au temps 1, la période vient d'être choisie
 * au temps 2. C'est ce qui rend « sans chargement bloquant » vrai par
 * construction plutôt que par chance — et c'est ce que le parcours mesure,
 * en exigeant qu'aucune requête ne parte entre le clic et cet écran.
 *
 * <b>Et il ne confirme rien</b> : « le temps 3 n'est pas une confirmation,
 * c'est un cadeau. Il ne dit pas "enregistré", il montre le début d'une
 * histoire. »
 */
export function TroisiemeTemps({
  machine,
  periode,
  oeuvres,
  disposition,
  continuer,
}: {
  machine: Plateforme;
  periode: PeriodeChoisie;
  /** Déjà chargées au temps 1 : cet écran n'en redemande aucune. */
  oeuvres: Oeuvre[];
  disposition: Disposition;
  continuer: () => void;
}) {
  const quand = versValeurTemporelle(periode);
  const decennie = decennieDe(periode);

  return (
    <section className="temps3" data-testid="temps3">
      <p className="temps3-phrase" data-testid="temps3-phrase">
        {decennie === null
          // « Je ne sais plus » ne bloque jamais (E01) : la phrase se dit
          // quand même, sans la date que personne n'a donnée.
          ? t("temps3.sansDate")
          : t("temps3.decennie", { d: nomDecennie(decennie) })}
      </p>

      {/* La bande n'existe que si la période a une place sur l'axe —
          invariant 2, et c'est la MÊME règle qui décide partout ailleurs.
          En dessiner une pour « je ne sais plus » inventerait une position. */}
      {surLAxe(quand) ? <Axe quand={quand} machine={machine.nom} /> : null}

      <div className="temps3-apercu" data-testid="temps3-apercu">
        {/* « Vous aviez PEUT-ÊTRE ces jeux-là. » L'aperçu propose, il ne
            constate pas : rien ici n'a été déclaré par le joueur. */}
        <p className="temps3-invite">{t("temps3.apercu")}</p>
        <ul className="temps3-jaquettes">
          {aApercevoir(oeuvres, APERCU[disposition]).map((o) => (
            <li key={o.id}>
              <Tuile
                titre={o.titre}
                annee={o.sortie ? anneeDe(o.sortie) : null}
                couverture={o.couverture}
              />
            </li>
          ))}
        </ul>
      </div>

      {/* « Sortant principal : → E02. C'est la seule continuation qui
          compte. » Une seule action, donc : un second bouton partagerait
          l'attention au moment où le produit demande un pas de plus. */}
      <button type="button" className="primaire" onClick={continuer}>
        {t("temps3.continuer", { machine: machine.nom })}
      </button>
    </section>
  );
}

/**
 * Les œuvres de l'aperçu — <b>celles qu'on peut reconnaître d'abord</b>.
 *
 * Le piège nommé par la fiche : « Livrer les cartes sans vignettes : sur cet
 * écran, l'image EST la reconnaissance. » Les trois œuvres du référentiel
 * sans jaquette produiraient un aperçu de texte à l'endroit précis où l'on
 * joue le passage vers E02.
 *
 * <b>L'ordre, lui, n'est pas touché</b> : il vient de l'API, qui le tient du
 * score de notoriété (§3.3). Retrier ici ferait diverger l'aperçu de la
 * liste qui suit, et le joueur ne retrouverait pas les jeux qu'on vient de
 * lui montrer.
 *
 * Et quand aucune n'a de jaquette, l'aperçu montre des tuiles plutôt que
 * rien : « la tuile générée est la réponse, pas un trou » — un aperçu vide
 * se lirait comme une panne.
 */
function aApercevoir(oeuvres: Oeuvre[], combien: number): Oeuvre[] {
  const illustrees = oeuvres.filter((o) => o.couverture !== null);
  return (illustrees.length >= combien ? illustrees : oeuvres).slice(0, combien);
}

/**
 * La bande sur l'axe — la période, et la machine qui la porte.
 *
 * Le libellé garde sa granularité : « 1990–1994 » n'est pas « 1990 ». Il
 * passe par la même fonction que la timeline, sans quoi le joueur verrait la
 * période changer de forme d'un écran à l'autre.
 */
function Axe({ quand, machine }: { quand: ReturnType<typeof versValeurTemporelle>; machine: string }) {
  const annee = anneeDe(quand);
  const epoque = accentEpoque(annee);
  return (
    <div className="temps3-axe" data-testid="temps3-axe" data-epoque={epoque.nom}>
      {/* Peinte, pas seulement nommée : « le système visuel du produit
          s'installe dès le deuxième écran » (E01). */}
      <span className="temps3-bande" style={{ backgroundColor: epoque.accent }} />
      <span className="temps3-bornes">{libelle(quand)}</span>
      <span className="temps3-machine">{machine}</span>
    </div>
  );
}
