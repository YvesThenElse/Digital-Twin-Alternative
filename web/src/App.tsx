import { useEffect, useState } from "react";
import { client } from "./api/client";
import { dispositionPour, type Disposition } from "./disposition/epoque";
import { t } from "./i18n/t";
import { ChoixPeriode } from "./periode/ChoixPeriode";
import { ContexteDeSaisie } from "./periode/ContexteDeSaisie";
import type { PeriodeChoisie } from "./periode/periode";
import { SelectionMassive, type EtatLigne } from "./selection/SelectionMassive";
import { Timeline } from "./timeline/Timeline";
import type { EntreeTimeline, MomentTimeline } from "./timeline/types";
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
  // La période est CHOISIE par l'utilisateur. Elle valait 1995 quoi qu'il
  // fasse, et tous ses jeux portaient donc la même année, que personne
  // n'avait donnée.
  const [periode, setPeriode] = useState<PeriodeChoisie>({ kind: "unknown" });
  const [oeuvres, setOeuvres] = useState<Oeuvre[]>([]);
  const [etatInitial, setEtatInitial] = useState<EtatLigne[]>([]);
  const [souvenirsInitiaux, setSouvenirsInitiaux] = useState<Record<string, string>>({});
  const [timeline, setTimeline] = useState<{
    entries: EntreeTimeline[];
    undated: MomentTimeline[];
  }>({ entries: [], undated: [] });
  const disposition = useDisposition();

  useEffect(() => {
    client.plateformes().then(setPlateformes).catch(() => setPlateformes([]));
  }, []);

  async function chargerOeuvres(p: Plateforme) {
    setMachine(p);
    // Relu AVANT d'afficher : montrer les lignes vierges puis les cocher
    // ferait clignoter l'écran, et un chargement lent laisserait le joueur
    // recocher ce qui l'était déjà.
    // Les deux relectures ensemble : montrer les lignes avant les souvenirs
    // ferait clignoter les champs, et un chargement lent laisserait croire
    // la phrase perdue le temps qu'elle arrive.
    const [etat, notes] = await Promise.all([
      client.etatSelection(UTILISATEUR, p.id),
      client.souvenirs(UTILISATEUR),
    ]);
    setEtatInitial(etat);
    setSouvenirsInitiaux(notes);
    // Une machine sans zonage n'a pas de région : forcer « PAL » y
    // afficherait « sortie européenne inconnue » sur des titres mondiaux.
    setRegion(p.regionFree ? "WORLDWIDE" : "PAL");
    setOeuvres(await client.oeuvres(p.id));
    setEtape("periode");
  }

  async function ouvrirTimeline() {
    setTimeline(await client.timeline(UTILISATEUR));
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
        <ChoixPeriode
          machine={machine}
          // L'horloge est lue ICI, une fois : le composant ne la lit pas
          // lui-même, sans quoi ses tests dépendraient du jour.
          anneeCourante={new Date().getFullYear()}
          choisir={(choisie) => { setPeriode(choisie); setEtape("selection"); }}
        />
      ) : null}

      {etape === "selection" && machine !== null ? (
        <section>
          <ContexteDeSaisie
            machine={machine.nom}
            region={region}
            periode={periode}
            changer={() => setEtape("periode")}
          />
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
              })
            }
            ecrireSouvenir={(cible, texte) =>
              client.souvenir(UTILISATEUR, cible, texte).then(() => undefined)
            }
            recharger={() => { void chargerOeuvres(machine); }}
            etatInitial={etatInitial}
            souvenirsInitiaux={souvenirsInitiaux}
          />
          <button type="button" onClick={() => void ouvrirTimeline()}>
            {t("parcours.voirTimeline")}
          </button>
        </section>
      ) : null}

      {etape === "timeline" ? (
        <Timeline entrees={timeline.entries} sansDate={timeline.undated} />
      ) : null}
    </main>
  );
}
