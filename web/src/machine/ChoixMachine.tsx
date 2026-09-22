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
    <section>
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
