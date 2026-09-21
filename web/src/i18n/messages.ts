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

  // --- les échecs, dits sans effacer le travail --------------------------
  "erreur.declaration":
    "Une déclaration n'a pas pu être enregistrée. Elle reste affichée ; réessayez plus tard.",
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
  "parcours.periodeAnnee": "Une année",
  "parcours.periodePeriode": "Plutôt une période",
  "parcours.periodeInconnue": "Je ne sais plus",
  "parcours.commencer": "Voir les jeux",
  "parcours.retour": "Changer de console",
  "parcours.voirTimeline": "Voir ma timeline",
  "parcours.chargement": "Chargement…",
  "parcours.machine": "{machine} · {region}",
  "timeline.titre": "Ma timeline",
  "timeline.vide": "Rien de déclaré pour l'instant.",
  "timeline.moments": "{n} moment(s) sur l'axe",

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
