import { useEffect, useState } from "react";
import { client } from "./api/client";
import { dispositionPour, type Disposition } from "./disposition/epoque";
import { t } from "./i18n/t";
import { ChoixMachine } from "./machine/ChoixMachine";
import { ChoixPeriode } from "./periode/ChoixPeriode";
import { ContexteDeSaisie } from "./periode/ContexteDeSaisie";
import type { PeriodeChoisie } from "./periode/periode";
import {
  SelectionMassive,
  type EtatLigne,
  type SouvenirEcrit,
  type TitreLibreRelu,
} from "./selection/SelectionMassive";
import { Timeline } from "./timeline/Timeline";
import type {
  AvertissementTimeline,
  EntreeTimeline,
  MomentTimeline,
} from "./timeline/types";
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
  /**
   * La région du joueur — **une hypothèse, pas une réponse**.
   *
   * Aucun geste de l'utilisateur n'entre ici (audit, item 18). §3.4 dit ce
   * que cela coûte : « un joueur PAL et un joueur NTSC-J n'ont pas connu le
   * même catalogue SNES, ni les mêmes titres, ni les mêmes dates ». On
   * assume donc l'Europe pour les premiers testeurs, et l'hypothèse est
   * écrite là où elle sera lue avant une session — `PROTOCOLE-DE-TEST.md`
   * §2, avec le critère de recrutement qui en découle.
   *
   * **Elle ne se pose qu'ICI** : `region/region-assumee.test.ts` échoue si
   * un autre fichier du front décide d'une région. Éparpillée, le jour où
   * un testeur n'est pas européen coûterait une relecture du frontend au
   * lieu d'une ligne.
   */
  const [region, setRegion] = useState("PAL");
  // La période est CHOISIE par l'utilisateur. Elle valait 1995 quoi qu'il
  // fasse, et tous ses jeux portaient donc la même année, que personne
  // n'avait donnée.
  const [periode, setPeriode] = useState<PeriodeChoisie>({ kind: "unknown" });
  const [oeuvres, setOeuvres] = useState<Oeuvre[]>([]);
  const [etatInitial, setEtatInitial] = useState<EtatLigne[]>([]);
  const [souvenirsInitiaux, setSouvenirsInitiaux] =
    useState<Record<string, SouvenirEcrit>>({});
  const [titresLibresInitiaux, setTitresLibresInitiaux] = useState<TitreLibreRelu[]>([]);

  /**
   * Le lot courant — <b>le passage sur l'écran</b> (§4.4).
   *
   * Il vit ICI et non dans le composant : gardé dans une ref, il repartait à
   * chaque remontage, et un simple rechargement de la liste détachait la
   * suite de la saisie de l'épisode commencé. Un nouveau passage commence
   * quand on entre dans la sélection, pas quand React refait un rendu.
   */
  const [lot, setLot] = useState(() => `bat_${Math.random().toString(36).slice(2, 12)}`);
  const [timeline, setTimeline] = useState<{
    entries: EntreeTimeline[];
    undated: MomentTimeline[];
    warnings: AvertissementTimeline[];
  }>({ entries: [], undated: [], warnings: [] });
  const disposition = useDisposition();

  /**
   * Trois états distincts, jamais une seule phrase pour les trois.
   *
   * Un échec réseau se rendait par « Chargement… » — définitivement. Le
   * testeur en conclut que l'application est lente, attend, puis part. Les
   * principes transverses §5 font des quatre états une obligation : l'erreur
   * dit ce qui a échoué, pas que quelque chose est en cours.
   */
  const [chargement, setChargement] = useState<"en-cours" | "pret" | "echec">("en-cours");

  /**
   * Le même triptyque pour E02, et il lui appartient.
   *
   * <b>« Pret » à l'entrée</b> : on n'ouvre l'écran qu'une fois tout relu,
   * parce que montrer les lignes avant l'état relu les afficherait toutes
   * décochées sur un profil plein. L'attente se joue donc sur l'écran de
   * période.
   *
   * Les deux autres états se voient au RECHARGEMENT, qui est un geste de cet
   * écran-ci : la liste se vide, le squelette la remplace, et un échec se dit
   * sur place avec ce qui est conservé — au lieu d'une alerte générale
   * au-dessus d'une étape qu'on n'a pas quittée.
   */
  const [chargementSelection, setChargementSelection] =
    useState<"en-cours" | "pret" | "echec">("pret");

  /**
   * Ce qui a échoué au dernier geste.
   *
   * Quatre chemins asynchrones n'avaient aucun `catch` : un échec laissait
   * l'écran figé sur l'étape courante, **sans message**. Le testeur appuie,
   * rien ne se passe, il appuie encore. Les principes §5 demandent les trois
   * choses qu'aucune n'était dite : ce qui a échoué, ce qui est conservé,
   * quoi faire.
   */
  const [panne, setPanne] = useState<string | null>(null);

  /**
   * Enveloppe un geste. L'alerte s'efface dès que le suivant aboutit : une
   * alerte qui survit à la réparation ferait douter d'un état sain.
   */
  async function essayer(action: () => Promise<void>) {
    setPanne(null);
    try {
      await action();
    } catch {
      setPanne(t("parcours.echecAction"));
    }
  }

  useEffect(() => {
    client.plateformes()
      .then((liste) => { setPlateformes(liste); setChargement("pret"); })
      .catch(() => setChargement("echec"));
  }, []);

  /**
   * Relit ce que la base sait de cette plateforme.
   *
   * Appelé à **chaque entrée** dans la sélection, et non une fois au choix
   * de la machine : changer la période démonte le composant de sélection, et
   * son état local — les lignes cochées depuis — part avec lui. Sans
   * relecture, l'écran revient en montrant moins que ce que la base contient.
   *
   * Les deux lectures ensemble : montrer les lignes avant les souvenirs
   * ferait clignoter les champs, et un chargement lent laisserait croire la
   * phrase perdue le temps qu'elle arrive.
   */
  async function relireEtat(p: Plateforme) {
    const [etat, notes, libres] = await Promise.all([
      client.etatSelection(UTILISATEUR, p.id),
      client.souvenirs(UTILISATEUR),
      // §3.5 : « visibles dans son profil comme les autres ». Sans cette
      // lecture, une revendication ajoutée disparaissait de l'écran au
      // rechargement tout en restant sur la timeline.
      client.titresLibres(UTILISATEUR, p.id),
    ]);
    setEtatInitial(etat);
    setSouvenirsInitiaux(notes);
    setTitresLibresInitiaux(libres);
  }

  async function choisirMachine(p: Plateforme) {
    setMachine(p);
    // Une machine sans zonage n'a pas de région : forcer « PAL » y
    // afficherait « sortie européenne inconnue » sur des titres mondiaux.
    const zone = p.regionFree ? "WORLDWIDE" : "PAL";
    setRegion(zone);
    // La région conditionne AUSSI les dates affichées (§3.4), pas seulement
    // le statut de sortie : elle voyage donc avec la requête.
    setOeuvres(await client.oeuvres(p.id, zone));
    setEtape("periode");
  }

  async function ouvrirSelection(choisie: PeriodeChoisie, p: Plateforme) {
    setPeriode(choisie);
    // Un nouveau passage : la période change ce qui sera attaché, donc les
    // déclarations qui suivent ne font plus partie du même épisode.
    setLot(`bat_${Math.random().toString(36).slice(2, 12)}`);
    await relireEtat(p);
    setChargementSelection("pret");
    setEtape("selection");
  }

  /**
   * Recharger la liste **sans quitter l'écran**. Le bouton appelait le choix
   * de machine, qui se termine par un retour à l'écran de période : le geste
   * faisait donc autre chose que ce qu'il annonçait, et emportait au passage
   * l'état local de la sélection.
   */
  async function rechargerListe(p: Plateforme) {
    setChargementSelection("en-cours");
    try {
      setOeuvres(await client.oeuvres(p.id, region));
      await relireEtat(p);
      setChargementSelection("pret");
    } catch {
      setChargementSelection("echec");
    }
  }

  async function ouvrirTimeline() {
    setTimeline(await client.timeline(UTILISATEUR));
    setEtape("timeline");
  }

  return (
    <main>
      <h1>{t("parcours.titre")}</h1>

      {/* Au-dessus de l'étape courante, qui reste en place : ce qui est
          conservé fait partie du message. */}
      {panne !== null ? <p role="alert">{panne}</p> : null}

      {etape === "machine" ? (
        <ChoixMachine
          plateformes={plateformes}
          chargement={chargement}
          choisir={(p) => { void essayer(() => choisirMachine(p)); }}
        />
      ) : null}

      {etape === "periode" && machine !== null ? (
        <ChoixPeriode
          machine={machine}
          // L'horloge est lue ICI, une fois : le composant ne la lit pas
          // lui-même, sans quoi ses tests dépendraient du jour.
          anneeCourante={new Date().getFullYear()}
          choisir={(choisie) => { void essayer(() => ouvrirSelection(choisie, machine)); }}
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
            // ⚠️ La CLÉ, et elle est load-bearing. `SelectionMassive` dérive
            // ses états initiaux de ses props — lignes cochées, souvenirs,
            // titres saisis. Monté pendant le chargement, il les aurait
            // capturés VIDES, et l'écran serait revenu en montrant moins que
            // ce que la base contient : le défaut même que la relecture a
            // corrigé. Changer de clé le remonte avec les props arrivées.
            key={chargementSelection}
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
            ecrireSouvenir={(cible, souvenir) =>
              client.souvenir(UTILISATEUR, cible, souvenir).then(() => undefined)
            }
            // Pas d'`essayer` : l'échec se dit DANS l'écran, avec ce qui est
            // conservé. Une alerte générale au-dessus dirait deux fois la
            // même chose, et moins bien.
            recharger={() => { void rechargerListe(machine); }}
            retracter={(workId) =>
              client.retracter(UTILISATEUR, machine.id, workId).then(() => undefined)
            }
            etatInitial={etatInitial}
            souvenirsInitiaux={souvenirsInitiaux}
            titresLibresInitiaux={titresLibresInitiaux}
            chargement={chargementSelection}
            lot={lot}
          />
          <button type="button" onClick={() => void essayer(ouvrirTimeline)}>
            {t("parcours.voirTimeline")}
          </button>
        </section>
      ) : null}

      {etape === "timeline" ? (
        <Timeline
          entrees={timeline.entries}
          sansDate={timeline.undated}
          avertissements={timeline.warnings}
        />
      ) : null}
    </main>
  );
}
