import type { Oeuvre, Plateforme } from "../selection/types";
import type {
  AvertissementTimeline,
  EntreeTimeline,
  MomentTimeline,
} from "../timeline/types";
import type {
  CibleSouvenir,
  EtatLigne,
  EntreeDeclaration,
  ReponseDeclaration,
  SouvenirEcrit,
} from "../selection/SelectionMassive";
import type { ValeurTemporelle } from "../temporel/valeur";
import type { EtatSante } from "../EtatDuService";

/**
 * Le client HTTP.
 *
 * <b>Il traduit, il ne décide pas.</b> Toute règle — ordre des plateformes,
 * rang de notoriété, statut régional — vient de l'API, qui la tient du
 * domaine. La réimplémenter ici la ferait diverger sans que rien ne le
 * signale.
 */

const BASE = "/api";

/**
 * Ce que l'API rend et que ce client **ne déclare pas**, sciemment.
 *
 * `lire<T>` fait un `as T` : un champ non déclaré disparaît sans qu'aucun
 * outil ne puisse le dire (apprentissage 56). L'inventaire ci-dessous
 * transforme ces omissions silencieuses en décisions écrites — c'est le
 * seul garde possible tant qu'aucun contrat n'est partagé entre les deux
 * côtés (audit, item 35).
 *
 * | Point d'entrée | Champ ignoré | Pourquoi |
 * |---|---|---|
 * | `/platforms/{id}/works` | `releases[].confidence` | dérivée de la granularité, déjà rendue |
 * | `/memories/{user}` | `updatedAt` | aucun écran ne montre la date d'une note |
 * | `/timeline/{user}` | `warnings[].message` | nomme les types du domaine ; le principe 9 l'interdit à l'écran, qui refait sa phrase |
 * | `/unresolved/{user}` | `resolved`, `resolvedWorkId` | une revendication rattachée est déjà dans la liste du référentiel |
 *
 * Et une dérive de TYPE, latente : `/platforms` déclare `LaunchYear` comme
 * facultative côté API, ce client la déclare `number`. Un `null` traversé
 * donnerait une année suggérée de **2** et désarmerait le refus « avant la
 * machine ». L'hypothèse est gardée côté données, par
 * `ReferentielTests.Chaque_plateforme_expose_son_annee_de_lancement`.
 */

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
function sortieDe(oeuvre: OeuvreApi, region: string): ValeurTemporelle | null {
  const parDate = [...oeuvre.releases].sort((a, b) => a.date.localeCompare(b.date));

  // **La sortie de SA région d'abord.** §3.4 : « un joueur PAL et un joueur
  // NTSC-J n'ont pas connu le même catalogue, ni les mêmes titres, ni les
  // mêmes dates ». Sur le dataset réel, 97 œuvres sur 221 portaient une
  // année différente de leur année PAL — jusqu'à six ans d'écart — et
  // l'écran dont toute la mécanique repose sur la reconnaissance montrait
  // au joueur une date qu'il n'a jamais vue.
  //
  // À défaut, la plus ancienne du monde : le statut régional dit alors
  // « jamais sorti » ou « inconnu », ce qui fait de cette date un repère et
  // non un mensonge. L'effacer priverait le joueur de son seul ancrage.
  const premiere = parDate.find((r) => r.region === region) ?? parDate[0];
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
  /**
   * L'état du service — <b>la seule requête dont un 503 est une réponse</b>.
   *
   * `/health` rend 503 quand la base ne répond pas, et c'est exactement ce
   * qu'on vient lire : passer par `lire` ferait lever sur le cas utile, et
   * l'écran ne saurait jamais dire pourquoi il est tombé.
   */
  sante: async (): Promise<EtatSante> => {
    const reponse = await fetch(`${BASE}/health`);
    return (await reponse.json()) as EtatSante;
  },

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

  oeuvres: (plateformeId: string, region: string) =>
    lire<OeuvreApi[]>(`/platforms/${plateformeId}/works`).then((liste): Oeuvre[] =>
      liste.map((o) => ({
        id: o.id,
        titre: o.title,
        rang: o.notability,
        sortie: sortieDe(o, region),
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

  souvenir: (userId: string, cible: CibleSouvenir, souvenir: SouvenirEcrit) =>
    ecrire<unknown>("/memories", {
      userId,
      // Le GENRE vient de l'appelant. Le figer à « work » ici écrirait tous
      // les souvenirs de titres saisis sur des œuvres inexistantes, et l'API
      // les refuserait en nommant un identifiant que l'écran n'affiche
      // jamais.
      targetKind: cible.kind,
      targetId: cible.id,
      text: souvenir.texte,
      // L'écran tient une SAISIE, où l'absence est la chaîne vide ; la base
      // tient un FAIT, où elle est nulle. La traduction se fait ici, une
      // fois : envoyer `""` écrirait un repère muet sur l'axe.
      title: souvenir.titre.length === 0 ? null : souvenir.titre,
    }),

  /**
   * Ce dont l'utilisateur s'est déjà prononcé sur cette plateforme.
   *
   * La source du « j'y ai joué » est le journal, pas la table des jugements :
   * cocher une ligne n'écrit aucune déclaration permanente.
   */
  etatSelection: (userId: string, platformId: string) =>
    lire<EtatLigne[]>(`/selection/${userId}/${platformId}`),

  /** Retire une déclaration : l'événement reste, marqué (§5.3). */
  retracter: (userId: string, platformId: string, workId: string) =>
    ecrire<{ retracted: number }>("/declarations/retract", {
      userId,
      platformId,
      workId,
    }),

  /**
   * Les titres saisis lors des visites précédentes, sur une plateforme.
   *
   * <b>Filtré ICI et non par l'API</b> : le point d'entrée rend le profil
   * entier, et c'est ce qu'il doit faire — la timeline les traverse toutes.
   * L'écran, lui, n'en montre qu'une : y faire apparaître un jeu Game Boy
   * attribuerait la déclaration à la mauvaise machine.
   *
   * Les revendications <b>déjà rattachées</b> sont écartées : elles sont dans
   * la liste du référentiel, et les montrer aussi en titre libre afficherait
   * le même jeu deux fois — une fois marqué « hors du référentiel » alors
   * qu'il y est entré.
   */
  titresLibres: (userId: string, platformId: string) =>
    lire<{ id: string; title: string; platformId: string; resolved: boolean }[]>(
      `/unresolved/${userId}`,
    ).then((liste) =>
      liste
        .filter((c) => c.platformId === platformId && !c.resolved)
        .map((c) => ({ id: c.id, titre: c.title })),
    ),

  /**
   * Les souvenirs déjà écrits, indexés par cible.
   *
   * <b>Les deux genres.</b> Les titres saisis étaient écartés tant que
   * l'écran ne les relisait pas ; depuis qu'ils reviennent (§3.5), les
   * écarter perdrait la phrase la plus personnelle du produit — §9 la place
   * justement sur les jeux qu'on ne retrouve pas.
   *
   * Les deux espaces d'identifiants ne se croisent pas : `wrk_` et `ucl_`.
   */
  souvenirs: (userId: string) =>
    lire<{ targetKind: string; targetId: string; text: string; title: string | null }[]>(
      `/memories/${userId}`,
    ).then((liste): Record<string, SouvenirEcrit> =>
      Object.fromEntries(
        liste.map((m) => [m.targetId, { texte: m.text, titre: m.title ?? "" }]),
      ),
    ),

  timeline: (userId: string) =>
    lire<{
      entries: EntreeTimeline[];
      undated: MomentTimeline[];
      warnings: AvertissementTimeline[];
    }>(`/timeline/${userId}`),
};
