import type { Oeuvre, Plateforme } from "../selection/types";
import type { EntreeTimeline, MomentTimeline } from "../timeline/types";
import type {
  CibleSouvenir,
  EtatLigne,
  EntreeDeclaration,
  ReponseDeclaration,
} from "../selection/SelectionMassive";
import type { ValeurTemporelle } from "../temporel/valeur";

/**
 * Le client HTTP.
 *
 * <b>Il traduit, il ne décide pas.</b> Toute règle — ordre des plateformes,
 * rang de notoriété, statut régional — vient de l'API, qui la tient du
 * domaine. La réimplémenter ici la ferait diverger sans que rien ne le
 * signale.
 */

const BASE = "/api";

async function lire<T>(chemin: string): Promise<T> {
  const reponse = await fetch(`${BASE}${chemin}`);
  if (!reponse.ok) {
    // Échouer en nommant la requête : « Failed to fetch » n'aide personne à
    // savoir quel appel a lâché.
    throw new Error(`GET ${chemin} → ${reponse.status}`);
  }
  return (await reponse.json()) as T;
}

async function ecrire<T>(chemin: string, corps: unknown): Promise<T> {
  const reponse = await fetch(`${BASE}${chemin}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corps),
  });
  if (!reponse.ok) {
    throw new Error(`POST ${chemin} → ${reponse.status}`);
  }
  return (await reponse.json()) as T;
}

type OeuvreApi = {
  id: string;
  title: string;
  notability: number;
  releases: { region: string | null; date: string; precision: string }[];
  regionStatus: Record<string, "notReleased" | "unknown">;
  coverUrl: string | null;
};

/**
 * Traduit une sortie en valeur temporelle, <b>en gardant sa granularité</b>.
 *
 * Une date au jour rendue comme une année perdrait ce que la source donne ;
 * une année rendue comme un jour affirmerait ce qu'elle ne donne pas.
 */
function sortieDe(oeuvre: OeuvreApi): ValeurTemporelle | null {
  // La plus ancienne : c'est la première parution sur cette machine, celle
  // dont le joueur se souvient.
  const premiere = [...oeuvre.releases].sort((a, b) => a.date.localeCompare(b.date))[0];
  if (premiere === undefined) return null;

  const annee = Number(premiere.date.slice(0, 4));
  switch (premiere.precision) {
    case "day":
      return { kind: "ExactDate", date: premiere.date };
    case "month":
      return { kind: "Month", year: annee, month: Number(premiere.date.slice(5, 7)) };
    default:
      return { kind: "Year", year: annee };
  }
}

export const client = {
  plateformes: () =>
    lire<{ id: string; name: string; regionFree: boolean; launchYear: number; worksCount: number }[]>(
      "/platforms",
    ).then((liste): Plateforme[] =>
      liste.map((p) => ({
        id: p.id,
        nom: p.name,
        regionFree: p.regionFree,
        launchYear: p.launchYear,
        worksCount: p.worksCount,
      })),
    ),

  oeuvres: (plateformeId: string) =>
    lire<OeuvreApi[]>(`/platforms/${plateformeId}/works`).then((liste): Oeuvre[] =>
      liste.map((o) => ({
        id: o.id,
        titre: o.title,
        rang: o.notability,
        sortie: sortieDe(o),
        // L'adresse rendue par l'API est relative À L'API (« /covers/… »).
        // Le navigateur, lui, parle au mandataire : sans préfixe, il
        // demandait la page du front et recevait du HTML à la place d'une
        // image. L'API n'a pas à connaître le mandataire ; c'est le client
        // qui sait par où il passe.
        couverture: o.coverUrl === null ? null : `${BASE}${o.coverUrl}`,
        regions: [...new Set(o.releases.map((r) => r.region).filter((r): r is string => r !== null))],
        statutRegional: o.regionStatus,
      })),
    ),

  declarer: (lot: {
    batchId: string;
    userId: string;
    platformId: string;
    period: unknown;
    entries: EntreeDeclaration[];
  }) => ecrire<{ created: number } & ReponseDeclaration>("/declarations", lot),

  souvenir: (userId: string, cible: CibleSouvenir, texte: string) =>
    ecrire<unknown>("/memories", {
      userId,
      // Le GENRE vient de l'appelant. Le figer à « work » ici écrirait tous
      // les souvenirs de titres saisis sur des œuvres inexistantes, et l'API
      // les refuserait en nommant un identifiant que l'écran n'affiche
      // jamais.
      targetKind: cible.kind,
      targetId: cible.id,
      text: texte,
    }),

  /**
   * Ce dont l'utilisateur s'est déjà prononcé sur cette plateforme.
   *
   * La source du « j'y ai joué » est le journal, pas la table des jugements :
   * cocher une ligne n'écrit aucune déclaration permanente.
   */
  etatSelection: (userId: string, platformId: string) =>
    lire<EtatLigne[]>(`/selection/${userId}/${platformId}`),

  timeline: (userId: string) =>
    lire<{ entries: EntreeTimeline[]; undated: MomentTimeline[] }>(
      `/timeline/${userId}`,
    ),
};
