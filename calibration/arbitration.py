"""Arbitrage manuel — ce que l'automatisation ne clôt pas.

Chaque entrée porte son motif. C'est le fichier qui doit rester lisible dans
deux ans, quand personne ne se souviendra pourquoi Fire Emblem pointe là où
il pointe. Il n'est pas généré : il se tient à la main, et il grossit à
mesure que le référentiel s'étend.

Trois issues, et aucune n'est « on verra » :
  ACCEPT  — un identifiant tranché, avec la raison
  ABSENT  — l'entrée ne sera pas au dataset ; cas nominal (§3.5), pas un échec
  RETYPE  — l'entrée n'est pas une œuvre et relevait d'un autre concept

Deux arbitrages ont été RETIRÉS d'ici après amélioration de l'outillage :
Contra (la recherche apparie sur le préfixe, il fallait élargir
SEARCH_LIMIT) et Aladdin (le filtre de type suffit à écarter la version
Virgin). Tous deux se résolvent désormais seuls, et vers l'identifiant que
l'arbitrage manuel avait désigné — ce qui est la seule vraie validation de
la règle automatique.
"""

ARBITRATION = {

 ("nes", "Bomberman"): {
    "verdict": "ABSENT",
    "why": "La source porte « Bomber Man » (1983), une série, et une douzaine "
           "de suites — mais aucun item propre au Bomberman Famicom de 1985. "
           "Rien à rattacher sans inventer. Cas nominal de §3.5 : l'entrée "
           "manquante se déclare, elle ne se fabrique pas.",
 },

 ("gb", "Pokémon Red and Blue"): {
    "verdict": "ACCEPT", "qid": "Q637137", "year": 1998,
    "why": "L'année curée (1996) était fausse : 1996 est Rouge/Vert au Japon, "
           "Rouge/Bleu à l'international est 1998. La vérification d'année a "
           "donc attrapé NOTRE erreur, pas celle de la source — c'est ce "
           "qu'on lui demande. Voir le cas de validation n°8 du modèle : "
           "trois entités pour un seul souvenir.",
 },

 ("gb", "Pokémon Gold and Silver"): {
    "verdict": "ABSENT",
    "why": "Erreur de curation : Or/Argent est un titre **Game Boy Color** "
           "(la source le dit, P400 = Game Boy Color), et la Game Boy Color "
           "n'est pas une plateforme du POC. Rétrocompatible ne veut pas dire "
           "même plateforme — c'est précisément la distinction que le cas de "
           "validation n°6 du modèle traite.",
 },

 ("gb", "Game Boy Camera"): {
    "verdict": "RETYPE", "concept": "Accessory", "qid": "Q1493056",
    "why": "Erreur de curation : ce n'est pas un jeu mais un accessoire, et "
           "le modèle a déjà le concept (§4, `Accessory`). L'entrée sort de "
           "la liste des œuvres au lieu d'y être forcée.",
 },

 ("gb", "Harvest Moon GB"): {
    "verdict": "ACCEPT", "qid": "Q2758069", "year": 1997,
    "why": "Identité certaine. ⚠️ Défaut de la SOURCE : la seule date de "
           "publication portée est 2012 — vraisemblablement une réédition en "
           "console virtuelle — alors que la description dit 1997. Toute "
           "année dérivée de P577 serait donc fausse de quinze ans. C'est "
           "l'année curée qui fait foi, et le dataset signale l'écart.",
 },

 ("gba", "Fire Emblem"): {
    "verdict": "ACCEPT", "qid": "Q150180",
    "title": "Fire Emblem: The Blazing Blade", "year": 2003,
    "why": "« Fire Emblem » tout court est le titre occidental ; le titre "
           "canonique est « The Blazing Blade ». ⚠️ Défaut de la SOURCE : "
           "P400 ne liste que Wii U — la plateforme de la réédition — pour un "
           "jeu que sa propre description qualifie de « 2003 tactical "
           "role-playing game for the Game Boy Advance ». La plateforme "
           "d'origine manque, ce qui rend l'entrée invisible à toute "
           "sélection par plateforme.",
 },

 ("ps1", "Medal of Honor"): {
    "verdict": "ACCEPT", "qid": "Q1069537", "year": 1999,
    "why": "Identité certaine par l'année et la description. ⚠️ Double défaut "
           "de la SOURCE : aucun libellé anglais et aucune plateforme. "
           "L'entrée existe, elle est juste inexploitable telle quelle — le "
           "titre vient de la curation, la plateforme aussi.",
 },
}
