import { useEffect, useState } from "react";
import { client } from "./api/client";
import { dispositionPour, type Disposition } from "./disposition/epoque";
import { t } from "./i18n/t";
import { SelectionMassive } from "./selection/SelectionMassive";
import type { Oeuvre, Plateforme } from "./selection/types";

/**
 * Le parcours de la Phase 1 : machine → période → sélection → timeline.
 *
 * <b>Un utilisateur local</b>, sans compte ni connexion : PHASING §4 les
 * place hors du périmètre, et les ajouter ferait payer un formulaire avant
 * le premier retour visible — ce que §24.4 interdit.
 *
 * <b>Le profil s'adresse par l'URL</b> (`?profil=…`), faute de connexion.
 * Ce n'est pas une facilité de test : sans compte, il faut bien un moyen de
 * désigner un profil, et c'est aussi ce qui permet au parcours de bout en
 * bout de partir d'un profil VIERGE. Sans cela, il comptait les moments
 * laissés par les exécutions précédentes — et passait même quand plus rien
 * n'était envoyé.
 */
function profil(): string {
  if (typeof window === "undefined") return "usr_local";
  return new URLSearchParams(window.location.search).get("profil") ?? "usr_local";
}

const UTILISATEUR = profil();

type Etape = "machine" | "periode" | "selection" | "timeline";

/**
 * La largeur observée, traduite en stratégie de lecture.
 *
 * Le composant de sélection reçoit une <i>disposition</i>, jamais une
 * largeur : il ne décide pas du point de rupture, et cette séparation rend
 * la règle testable sans navigateur.
 */
function useDisposition(): Disposition {
  const [largeur, setLargeur] = useState(() =>
    typeof window === "undefined" ? 1280 : window.innerWidth,
  );
  useEffect(() => {
    const surRedimensionnement = () => setLargeur(window.innerWidth);
    window.addEventListener("resize", surRedimensionnement);
    return () => window.removeEventListener("resize", surRedimensionnement);
  }, []);
  return dispositionPour(largeur);
}

export function App() {
  const [etape, setEtape] = useState<Etape>("machine");
  const [plateformes, setPlateformes] = useState<Plateforme[]>([]);
  const [machine, setMachine] = useState<Plateforme | null>(null);
  const [region, setRegion] = useState("PAL");
  const [periode, setPeriode] = useState<unknown>({ kind: "unknown" });
  const [oeuvres, setOeuvres] = useState<Oeuvre[]>([]);
  const [momentsSurAxe, setMomentsSurAxe] = useState(0);
  const disposition = useDisposition();

  useEffect(() => {
    client.plateformes().then(setPlateformes).catch(() => setPlateformes([]));
  }, []);

  async function chargerOeuvres(p: Plateforme) {
    setMachine(p);
    // Une machine sans zonage n'a pas de région : forcer « PAL » y
    // afficherait « sortie européenne inconnue » sur des titres mondiaux.
    setRegion(p.regionFree ? "WORLDWIDE" : "PAL");
    setOeuvres(await client.oeuvres(p.id));
    setEtape("periode");
  }

  async function ouvrirTimeline() {
    const rendu = await client.timeline(UTILISATEUR);
    setMomentsSurAxe(rendu.entries.reduce((n, e) => n + e.moments.length, 0));
    setEtape("timeline");
  }

  return (
    <main>
      <h1>{t("parcours.titre")}</h1>

      {etape === "machine" ? (
        <section>
          <h2>{t("parcours.choisirMachine")}</h2>
          {plateformes.length === 0 ? <p>{t("parcours.chargement")}</p> : null}
          <ul>
            {plateformes.map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => chargerOeuvres(p)}>
                  {p.nom}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {etape === "periode" && machine !== null ? (
        <section>
          <h2>{t("parcours.choisirPeriode")}</h2>
          {/* Trois choix, pas sept : exposer l'énumération complète de
              `TemporalValue` ferait remonter le modèle dans l'écran. */}
          <button type="button" onClick={() => { setPeriode({ kind: "year", year: 1995 }); setEtape("selection"); }}>
            {t("parcours.periodeAnnee")}
          </button>
          <button type="button" onClick={() => { setPeriode({ kind: "range", from: 1993, to: 1997 }); setEtape("selection"); }}>
            {t("parcours.periodePeriode")}
          </button>
          <button type="button" onClick={() => { setPeriode({ kind: "unknown" }); setEtape("selection"); }}>
            {t("parcours.periodeInconnue")}
          </button>
        </section>
      ) : null}

      {etape === "selection" && machine !== null ? (
        <section>
          <h2>{t("parcours.machine", { machine: machine.nom, region })}</h2>
          <SelectionMassive
            oeuvres={oeuvres}
            region={region}
            disposition={disposition}
            envoyer={(lot) =>
              client.declarer({
                batchId: lot.batchId,
                userId: UTILISATEUR,
                platformId: machine.id,
                period: periode,
                entries: lot.entries,
              }).then(() => undefined)
            }
            ecrireSouvenir={(workId, texte) =>
              client.souvenir(UTILISATEUR, workId, texte).then(() => undefined)
            }
            recharger={() => { void chargerOeuvres(machine); }}
          />
          <button type="button" onClick={() => void ouvrirTimeline()}>
            {t("parcours.voirTimeline")}
          </button>
        </section>
      ) : null}

      {etape === "timeline" ? (
        <section>
          <h2>{t("timeline.titre")}</h2>
          <p data-testid="timeline-compte">
            {momentsSurAxe === 0
              ? t("timeline.vide")
              : t("timeline.moments", { n: momentsSurAxe })}
          </p>
        </section>
      ) : null}
    </main>
  );
}
