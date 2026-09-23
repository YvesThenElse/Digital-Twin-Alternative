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
  // Un seul libellé : le bandeau ne paraît qu'à la panne. « Vérification… »
  // et « Service disponible » ont été retirés avec leurs branches — un
  // libellé que personne n'affiche fait croire que l'écran dit quelque chose
  // qu'il ne dit pas.
  "service.indisponible": "Service indisponible — base de données : {detail}",

  // --- la phrase de récit (E01 temps 3, §24.4) ---------------------------
  //
  // « Le temps 3 n'est pas une confirmation, c'est un cadeau. Il ne dit pas
  // "enregistré", il montre le début d'une histoire. » Elle parle donc du
  // joueur et de sa machine, jamais de ce que le produit vient de faire.
  //
  // L'année est celle de la MACHINE, pas celle du joueur : dire « votre
  // histoire commence en 1990 » affirmerait une date que personne n'a
  // donnée — c'est exactement le défaut que la période choisie a corrigé.
  "recit.premiereConsole": "Votre histoire commence avec {machine}, une machine de {annee}.",

  // --- E01, le visiteur qui revient --------------------------------------
  //
  // « Proposer de le reprendre plutôt que de recommencer. » L'offre dit ce
  // qu'il Y A — pas « vous avez une saisie en cours », qui ferait du retour
  // un incident là où la fiche en fait une continuité.
  "reprise.invite.un": "{n} moment déjà déclaré dans votre histoire.",
  "reprise.invite.plusieurs": "{n} moments déjà déclarés dans votre histoire.",
  "reprise.action": "Reprendre mon histoire",

  // --- E01, temps 3 : la récompense immédiate ----------------------------
  //
  // « Le temps 3 n'est pas une confirmation, c'est un cadeau. Il ne dit pas
  // "enregistré", il montre le début d'une histoire. » La phrase parle donc
  // du joueur, jamais de ce que le produit vient de faire.
  "temps3.decennie": "Votre histoire commence dans les années {d}.",
  // « Je ne sais plus » ne bloque jamais (E01) : la phrase se dit sans la
  // date, plutôt que d'en inventer une.
  "temps3.sansDate": "Votre histoire commence.",
  // « PEUT-ÊTRE » : l'aperçu propose, il ne constate pas. Rien de ce qu'il
  // montre n'a été déclaré par le joueur, et le produit tout entier repose
  // sur le fait de ne pas inventer ce qu'il n'a pas dit.
  "temps3.apercu": "Vous aviez peut-être ces jeux-là :",
  "temps3.continuer": "Voir les jeux {machine}",

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
  // §24.3 : « il n'y a pas joué » n'est pas « il ne s'est pas prononcé ».
  // Formulé au constat, jamais au renoncement : les principes §6 bis
  // interdisent de présenter ce choix comme un abandon ou un échec.
  "ligne.jamaisJoue": "Jamais joué : {titre}",
  "action.jamaisJoue": "Je n'y ai jamais joué à {titre}",
  "action.retirerJamaisJoue": "Retirer « jamais joué » de {titre}",
  "souvenir.invite": "Un souvenir sur {titre} ?",
  // Le repère de §9.2 — « un titre court, servant de repère sur la
  // timeline ». « Facultatif » est DIT : un champ muet à côté d'une zone de
  // texte se lit comme une étape à franchir avant d'écrire.
  "souvenir.repere": "Un repère court sur {titre} (facultatif)",
  "action.recharger": "Recharger la liste",

  // Les quatre états obligatoires de E02 (principes §5). L'état vide est le
  // plus important : c'est celui que voit un nouvel utilisateur.
  //
  // Le squelette est STRUCTUREL — « jamais un spinner centré » —, donc cette
  // phrase n'est là que pour qui ne voit pas l'écran.
  "selection.chargement": "Chargement de la liste des jeux…",
  // Ce qui a échoué, ce qui est conservé, quoi faire : les trois choses que
  // §5 exige d'un message d'erreur.
  "selection.echec":
    "La liste n'a pas pu être relue. Votre période est conservée ; réessayez.",
  // Jamais une page blanche, et jamais une issue qui n'existe pas : la
  // période ne filtre pas cette liste, et l'écran ne sait pas changer de
  // région. Ce qu'il sait faire, il le propose.
  "selection.vide":
    "Aucun jeu à afficher pour cette machine. Réessayez le chargement, "
    + "ou saisissez vos titres vous-même — c'est prévu.",

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
  // E02 : « changer de plateforme → E02 sur une autre plateforme, PÉRIODE
  // CONSERVÉE ». Se tromper de console est une erreur d'amorce, et seul un
  // rechargement en sortait.
  "contexte.changerMachine": "Changer de console",
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
  // Filtré, le compteur DIT sur quoi il porte : « 147 jeux » au-dessus d'une
  // liste qui en montre trois est un compte juste appliqué à autre chose. Le
  // total reste nommé — sans lui, on ne sait plus ce qu'on a écarté. Les
  // déclarés, eux, ne rétrécissent pas : c'est la récompense de §24.4, et la
  // voir tomber en tapant trois lettres se lirait comme une perte.
  "selection.compte.filtre.un": "{n} jeu sur {jeux} · {declares} déclarés",
  "selection.compte.filtre.plusieurs": "{n} jeux sur {jeux} · {declares} déclarés",
  // §4 du plan met « recherche d'un jeu ou d'une console » au périmètre :
  // c'est ce filtre, pas un écran. Il ne fait pas quitter la liste, ce qui
  // est la moitié de sa valeur sur le geste le plus répétitif du produit.
  "selection.filtre": "Chercher un jeu dans la liste",
  "selection.viderFiltre": "Vider la recherche",
  // Jamais une page blanche (§5). L'issue est juste en dessous : la saisie
  // libre de §3.5 est la réponse au titre qui n'est pas au référentiel.
  "selection.filtreSansResultat":
    "Aucun titre ne contient « {texte} ». S'il manque à cette liste, ajoutez-le ci-dessous.",
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
  // Un souvenir sans repère reste un souvenir : l'axe le marque quand même,
  // faute de quoi écrire une phrase sans la titrer la ferait disparaître.
  "timeline.souvenirSansRepere": "Un souvenir",
  // §5.4 : « en avertissement doux et JAMAIS en blocage ». La phrase informe
  // et n'accuse pas — elle dit d'emblée que rien n'a été changé, sans quoi
  // le joueur chercherait ce qu'il doit corriger.
  "timeline.avertissement":
    "« {avant} » vient d'ordinaire avant. La date déclarée le place après — c'est gardé tel quel.",

  // --- l'en-tête de /mon-histoire (E04, blocs A et B) --------------------
  //
  // « ≈ » est DIT, pas sous-entendu : E04 tranche — « `≈ 35 ans` dérivé d'un
  // premier moment flou est honnête ; `35 ans` ne l'est pas » (§11.4). Et
  // l'approximation n'est pas seulement celle de la date : le premier moment
  // DÉCLARÉ n'est pas le premier moment vécu.
  "portrait.depuis": "Vous jouez depuis ≈ {annees} ans.",
  // Le tiret cadratin évite la préposition : « en 1991 », « en vers 1991 » et
  // « en 12 mars 1991 » ne peuvent pas être la même phrase, et la
  // granularité, elle, doit rester celle qui a été déclarée.
  "portrait.debut.machine": "Tout a commencé avec {machine} — {quand}.",
  "portrait.debut": "Tout a commencé — {quand}.",

  // Quatre libellés, pas douze : §8.2 liste treize indicateurs et E04
  // tranche. Le quatrième de la fiche — « à 100 % » — est remplacé : §4.6 l'a
  // sorti du modèle, « 100 % de Tetris ou d'un jeu de sport ne veut rien
  // dire ».
  "portrait.consoles.un": "console",
  "portrait.consoles.plusieurs": "consoles",
  "portrait.jeux.un": "jeu déclaré",
  "portrait.jeux.plusieurs": "jeux déclarés",
  "portrait.termines.un": "terminé",
  "portrait.termines.plusieurs": "terminés",
  "portrait.souvenirs.un": "souvenir écrit",
  "portrait.souvenirs.plusieurs": "souvenirs écrits",

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
