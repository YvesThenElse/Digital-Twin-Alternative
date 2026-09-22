/**
 * Le catalogue des libellés — **le seul endroit du code où du texte visible
 * est écrit**.
 *
 * §20 : la décision « international dès le départ » ne demande pas de livrer
 * plusieurs langues. Le français est la seule livrée, et c'est un choix. Elle
 * demande que ce choix reste **réversible sans reprise du frontend**, parce
 * que le rattrapage tardif y est coûteux — il faut alors relire chaque
 * composant. `aucun-libelle-en-dur.test.ts` remplace cette relecture.
 *
 * Les paramètres s'écrivent `{nom}` et sont substitués par `t()`.
 */
export const MESSAGES = {
  // --- état du service ---------------------------------------------------
  "service.verification": "Vérification du service…",
  "service.disponible": "Service disponible.",
  "service.indisponible": "Service indisponible — base de données : {detail}",

  // --- la bande d'époque (E02 repère D) ----------------------------------
  "bande.intitule": "Votre histoire, en construction",
  "bande.declares.un": "{n} déclaré",
  "bande.declares.plusieurs": "{n} déclarés",
  "bande.sansDate": "dont {n} sans date",
  "bande.periode": "{debut} – {fin}",

  // --- la ligne de sélection ---------------------------------------------
  "ligne.declarer": "Déclarer : {titre}",
  "ligne.declare": "Déclaré : {titre}",
  "ligne.dateInconnue": "date inconnue",
  "souvenir.invite": "Un souvenir sur {titre} ?",
  "action.recharger": "Recharger la liste",

  // Le jeu absent est un CAS NOMINAL, pas une erreur (§3.5) : l'invitation
  // le dit comme une possibilité offerte, jamais comme un échec de recherche.
  "titreLibre.invite": "Un jeu manque à cette liste ?",
  "titreLibre.champ": "Titre absent de la liste",
  "titreLibre.ajouter": "Ajouter ce titre",
  "titreLibre.marque": "Titre saisi, hors du référentiel",

  // --- les échecs, dits sans effacer le travail --------------------------
  "erreur.declaration":
    "Une déclaration n'a pas pu être enregistrée. Elle reste affichée ; réessayez plus tard.",
  "erreur.retractation":
    "Le retrait n'a pas abouti. La ligne reste décochée à l'écran ; réessayez.",
  "erreur.souvenir":
    "Un souvenir n'a pas pu être enregistré. Il reste affiché ; réessayez plus tard.",

  // --- le tiroir de l'axe ------------------------------------------------
  "tiroir.intitule": "À une date inconnue",

  // --- les sept granularités (principes transverses §2) ------------------
  "temporel.dateExacte": "{jour} {mois} {annee}",
  "temporel.mois": "{mois} {annee}",
  "temporel.annee": "{annee}",
  "temporel.periode": "{debut}–{fin}",
  "temporel.depuis": "depuis {annee}",
  "temporel.vers": "vers {annee}",
  "temporel.age": "vers mes {age} ans",
  "temporel.inconnu": "à une date inconnue",

  "mois.1": "janvier",
  "mois.2": "février",
  "mois.3": "mars",
  "mois.4": "avril",
  "mois.5": "mai",
  "mois.6": "juin",
  "mois.7": "juillet",
  "mois.8": "août",
  "mois.9": "septembre",
  "mois.10": "octobre",
  "mois.11": "novembre",
  "mois.12": "décembre",

  // --- le parcours (E01 → E02 → E03) -------------------------------------
  "parcours.titre": "Reconstruire mon histoire",
  "parcours.choisirMachine": "Sur quelle console ?",
  "parcours.choisirPeriode": "Vers quand y avez-vous joué ?",
  "parcours.periodeInconnue": "Je ne sais plus",

  // Des cartes de décennie, pas un curseur (E01). La granularité est
  // HONNÊTE : personne ne se souvient de l'année exacte de sa première
  // console, et l'intervalle sur la décennie est une réponse pleine.
  "periode.decennie": "Années {d}",
  "periode.bornes": "{debut} – {fin}",
  "periode.affiner": "Plus précisément, si vous le savez :",
  "periode.quelquePart": "Quelque part dans les années {d}",

  // Le choix de période. Une année impossible est refusée EN LE DISANT, et
  // jamais corrigée en silence : une valeur qui change toute seule se lit
  // comme une panne, pas comme une règle.

  "contexte.changer": "Changer la période",
  "contexte.sApplique": "S'applique aux déclarations suivantes.",

  // La passe 2 (E02). L'ordre des questions n'est pas arbitraire : le
  // factuel avant la provenance, la plus accessoire.
  "passe2.acheve": "Vous l'avez fini ?",
  "passe2.fini": "Fini",
  "passe2.enCours": "Toujours en cours",
  "passe2.abandonne": "Abandonné",
  "passe2.comment": "Comment y avez-vous joué ?",
  "passe2.possede": "Je l'avais",
  "passe2.ailleurs": "Chez quelqu'un",
  "passe2.emprunte": "Emprunté",
  "parcours.voirTimeline": "Voir ma timeline",
  "parcours.chargement": "Chargement…",
  // Un échec n'est pas un chargement lent, et un catalogue vide n'est ni
  // l'un ni l'autre. Trois états, trois phrases.
  "parcours.echecCatalogue":
    "Le catalogue n'a pas pu être chargé. Vos déclarations sont conservées ; réessayez dans un instant.",
  "parcours.catalogueVide": "Aucune console dans le catalogue.",
  // §5 demande les trois : ce qui a échoué, ce qui est conservé, quoi faire.
  "parcours.echecAction":
    "L'action n'a pas abouti. Ce que vous avez déjà déclaré est conservé ; réessayez.",
  "parcours.machine": "{machine} · {region}",
  // Repère B d'E02, et le compte de jeux d'une console : deux nombres que
  // l'API calculait et que personne n'affichait.
  "selection.compte": "{jeux} jeux · {declares} déclarés",
  "machine.resume": "{annee} · {jeux} jeux",

  // Les noms accessibles des icônes (§3). Une icône seule n'informe pas :
  // « l'information n'est jamais portée par la seule couleur », ce qui vaut
  // aussi pour la forme.
  "icone.joue": "Joué",
  "icone.fini": "Fini",
  "icone.en-cours": "Toujours en cours",
  "icone.abandonne": "Abandonné",
  "icone.jamais-joue": "Jamais joué",
  "icone.possede": "Je l'avais",
  "icone.ailleurs": "Chez quelqu'un",
  "icone.emprunte": "Emprunté",
  "icone.sans-plus": "Sans plus",
  "icone.adore": "J'ai adoré",
  "icone.prefere": "Mon préféré",
  "timeline.titre": "Ma timeline",
  "timeline.invitation": "Racontez votre première console.",
  "timeline.deplier": "Déplier : {n} jeux déclarés ensemble",

  // --- les régions (§3.4) ------------------------------------------------
  // Le nom, jamais le code : « PAL » ne dit rien à un joueur.
  "region.PAL": "Europe",
  "region.NTSC-U": "Amérique du Nord",
  "region.NTSC-J": "Japon",

  "region.sorti": "Sorti en {region}",
  "region.jamaisSorti": "Jamais sorti en {region}",
  // Formulé sans négation : « pas sorti » et « on ne sait pas » se
  // ressemblent trop à la lecture rapide d'une liste de trente-cinq lignes.
  "region.inconnue": "Sortie inconnue en {region}",
  "region.mondiale": "Sortie mondiale",
} as const;

export type CleMessage = keyof typeof MESSAGES;
