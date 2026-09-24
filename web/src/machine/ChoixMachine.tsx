import { accentEpoque } from "../disposition/epoque";
import { t } from "../i18n/t";
import type { Plateforme } from "../selection/types";

/**
 * E01, temps 1 — le choix de la machine.
 *
 * <b>« Grandes cibles visuelles, pas une liste déroulante. Le choix doit
 * être RECONNU, pas cherché. »</b> Ce qui était livré — une liste à puces de
 * boutons bordés — transformait la reconnaissance en lecture, sur l'écran
 * où E01 dit que « l'image fait la reconnaissance ».
 *
 * <b>Faute de visuel de console</b>, la carte est la **tuile générée** que
 * la fiche prévoit comme repli : fond à l'accent de l'époque, nom en
 * display, année de sortie. La couleur fait la moitié du travail avant
 * qu'on ait lu le nom — le gradient de température se lit d'un coup d'œil,
 * et deux consoles de la même décennie se répondent.
 *
 * <b>Et l'écran a un FOND</b>, depuis le 24 septembre 2026 — une surface, pas
 * une image. Le langage visuel §1 écarte « les dégradés RGB » et « le fond
 * noir gamer », et §3 interdit plus de deux accents simultanés : or cette
 * grille en affiche déjà un par carte. Un fond coloré leur disputerait
 * exactement ce qui les rend reconnaissables. Le fond reste donc dans la
 * famille des neutres chauds et porte une <b>trame géométrique discrète</b> —
 * le vocabulaire que §5 a déjà posé pour les tuiles générées. Les cartes
 * cessent de flotter sur du papier blanc : elles sont posées sur une surface.
 */
export function ChoixMachine({
  plateformes,
  chargement,
  choisir,
}: {
  plateformes: Plateforme[];
  /**
   * Requis, sans valeur par défaut : trois états rendus par une seule
   * phrase, c'est trois fois la même information fausse. Un échec réseau
   * se rendait par « Chargement… », définitivement.
   */
  chargement: "en-cours" | "pret" | "echec";
  choisir: (machine: Plateforme) => void;
}) {
  return (
    // La trame est peinte par une couche dédiée du socle, jamais par un
    // fichier : une image de fond serait un fichier de plus à héberger, à
    // vérifier juridiquement (§19.2 — photos et logos de consoles sont
    // protégés séparément) et à charger avant le premier écran du produit.
    <section className="choix-machine" data-testid="choix-machine">
      <h2>{t("parcours.choisirMachine")}</h2>

      {chargement === "en-cours" ? <p>{t("parcours.chargement")}</p> : null}
      {chargement === "echec" ? (
        <p role="alert">{t("parcours.echecCatalogue")}</p>
      ) : null}
      {chargement === "pret" && plateformes.length === 0 ? (
        <p role="status">{t("parcours.catalogueVide")}</p>
      ) : null}

      <div className="grille-cartes">
        {plateformes.map((p) => {
          const epoque = accentEpoque(p.launchYear);
          return (
            <button
              key={p.id}
              type="button"
              className="carte"
              data-testid="carte-machine"
              // L'accent vient du socle via cet attribut : la carte ne
              // connaît pas la palette, et les deux listes restent alignées.
              data-epoque={epoque.nom}
              onClick={() => choisir(p)}
            >
              <span className="carte-nom">{p.nom}</span>
              <span className="carte-meta">
                {t("machine.resume", {
                  annee: String(p.launchYear),
                  jeux: String(p.worksCount),
                })}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
