# Spécification du Projet : Plateforme Vidéoludique

## 1. Vision et Concept

### 1.1 Concept de Base
Le projet vise à créer une plateforme innovante qui transforme la manière dont les joueurs de jeux vidéo perçoivent leur identité numérique dans l'univers vidéoludique. Cette plateforme ne se contente pas d'être une base de données de jeux, mais devient un espace interactif où chaque joueur peut construire, conserver, explorer et partager son parcours vidéoludique.

### 1.2 Idée Centrale
La plateforme est conçue comme une "biographie interactive du joueur" qui représente non seulement les jeux et consoles qu'il possède actuellement, mais l'ensemble de son parcours dans le temps. Elle répond aux deux questions fondamentales :

- « Quelle est mon histoire avec le jeu vidéo ? »
- « Qu'est-ce que je peux en faire maintenant ? »

### 1.3 Focus Principal : Mémoire Vidéoludique Personnelle
Le projet se concentre sur la construction de la **mémoire vidéoludique personnelle d'un joueur**.

Toutes les autres fonctionnalités secondaires doivent être conçues pour enrichir cette mémoire centrale :
- Collection manager
- Journal personnel
- Backlog manager
- Système de statistiques
- Forum (si nécessaire)
- API développeurs (si nécessaire)

### 1.4 Phasage Stratégique
Le développement sera effectué en phases :
1. **Phase 1** : Base de données vidéoludique et mémoire personnelle
2. **Phase 2** : Social et interactions
3. **Phase 3** : Recommandations et challenges
4. **Phase 4** : Forum, compétitions, notes et API

## 2. Référentiel Vidéoludique

### 2.1 Structure du Référentiel
Le référentiel global est essentiellement statique et contient :
- Constructeurs (manufacturers)
- Consoles et plateformes
- Générations de consoles
- Jeux
- Studios et éditeurs
- Dates de sortie
- Genres
- Caractéristiques techniques
- Différentes versions d'un jeu
- Éditions physiques et numériques
- Remasters, remakes, ports et rééditions
- Accessoires et périphériques
- Relations entre ces différents objets

### 2.2 Navigation Relationnelle
Le référentiel doit permettre une navigation relationnelle fluide :
Console → jeux → studio → autres jeux → autres plateformes → différentes éditions, etc.

## 2. Référentiel Vidéoludique

### 2.1 Structure du Référentiel
Le référentiel global est essentiellement statique et contient :
- Constructeurs (manufacturers)
- Consoles et plateformes
- Générations de consoles
- Jeux
- Studios et éditeurs
- Dates de sortie
- Genres
- Caractéristiques techniques
- Différentes versions d'un jeu
- Éditions physiques et numériques
- Remasters, remakes, ports et rééditions
- Accessoires et périphériques
- Relations entre ces différents objets

### 2.2 Navigation Relationnelle
Le référentiel doit permettre une navigation relationnelle fluide :
Console → jeux → studio → autres jeux → autres plateformes → différentes éditions, etc.

## 3. Profil Vidéoludique Utilisateur

### 3.1 États des Jeux
Chaque utilisateur peut déclarer différents états pour chaque jeu :
- Possédé actuellement
- Possédé autrefois
- Vendu/donné/perdu
- Joué
- Commencé
- Abandonné
- Terminé
- Terminé à 100 %
- Jeu favori
- Souhaité / wishlist
- Éventuellement prêté ou échangé

### 3.2 Séparation Importante
La possession et l'expérience doivent être séparées :
- Un utilisateur peut avoir joué à un jeu sans l'avoir possédé
- Un utilisateur peut avoir possédé un jeu sans l'avoir réellement joué

### 3.3 Architecture Événementielle
Au lieu de stocker principalement des états, le système sera construit autour d'événements :

#### Exemples d'Événements
- 1994  DiscoveredGame
- 1994  StartedGame
- 1995  CompletedGame
- 1997  AcquiredGame
- 2001  SoldGame
- 2025  AcquiredGame
- 2026  ReplayedGame

#### Avantages de l'Approche Événementielle
- L'état actuel devient alors une projection de l'historique
- Cohérence avec la dimension temporelle majeure
- Débloque des fonctionnalités puissantes :
  - Timeline interactive
  - Statistiques historiques
  - Souvenirs personnalisés
  - Évolution des goûts
  - Périodes de gaming
  - Collection à une date donnée
  - Comparaison entre deux périodes
  - Génération automatique de storytelling

## 4. Gestion des Éditions

### 4.1 Granularité Supérieure
La plateforme permet une granularité supérieure au simple couple "utilisateur + jeu". Un même titre peut avoir été possédé plusieurs fois :
- Final Fantasy VII → PlayStation PAL → Platinum → version numérique PS3 → remake PS5

### 4.2 Modèle de Données
Le modèle doit distinguer au minimum :
- Game : œuvre vidéoludique abstraite
- Release : sortie du jeu sur une plateforme donnée
- Edition : édition commerciale précise
- UserGameExperience : relation entre l'utilisateur et cette œuvre/sortie
- UserOwnedItem : exemplaire ou édition réellement possédé par l'utilisateur

## 4. Gestion des Éditions

### 4.1 Granularité Supérieure
La plateforme permet une granularité supérieure au simple couple "utilisateur + jeu". Un même titre peut avoir été possédé plusieurs fois :
- Final Fantasy VII → PlayStation PAL → Platinum → version numérique PS3 → remake PS5

### 4.2 Modèle de Données
Le modèle doit distinguer au minimum :
- Game : œuvre vidéoludique abstraite
- Release : sortie du jeu sur une plateforme donnée
- Edition : édition commerciale précise
- UserGameExperience : relation entre l'utilisateur et cette œuvre/sortie
- UserOwnedItem : exemplaire ou édition réellement possédé par l'utilisateur

## 5. Dimension Temporelle

### 5.1 Historique Temporel
Le temps constitue une dimension majeure du produit. Les informations utilisateur représentent une histoire dans le temps :
- 1991 — Première console : Game Boy
- 1992 — Premier jeu Zelda
- 1995 — Découverte de la PlayStation
- 1998 — Final Fantasy VII terminé
- 2002 — PlayStation vendue
- 2005 — Passage au PC
- 2018 — Retour au retrogaming
- 2026 — Rachat d'une PlayStation originale

### 5.2 Flexibilité Temporelle
Le modèle doit accepter :
- Date précise
- Mois/année
- Année
- Période approximative
- Âge approximatif
- Événement sans date

### 5.3 Type Temporel Spécifique
Pour garantir la précision et la flexibilité requises, une notion explicite de valeur temporelle doit être créée :

**TemporalValue** : Type spécifique pour gérer les différentes granularités temporelles

Types de TemporalValue :
- ExactDate : Date précise (ex: 15/03/1994)
- Month : Mois/année (ex: 03/1994)
- Year : Année seulement (ex: 1994)
- Range : Période approximative (ex: 1993-1997)
- ApproximateYear : Année approximative (ex: 1994±2)
- Age : Âge approximatif (ex: vers mes 12 ans)
- Unknown : Événement sans date précise

### 5.4 Importance de la Précision Historique
Il est crucial de préserver l'incertitude historique au lieu d'inventer une précision qui n'existe pas. Cette approche permet de :
- Respecter l'authenticité des souvenirs
- Maintenir la flexibilité nécessaire pour les données approximatives
- Créer une expérience utilisateur cohérente avec la nature subjective de la mémoire

## 6. « Digital Twin » du Joueur

### 6.1 Jumeau Numérique Vidéoludique
L'ensemble des informations constitue une sorte de jumeau numérique vidéoludique représentant :
- Ce que le joueur possède + ce qu'il a possédé + ce qu'il a joué + ce qu'il a terminé + ce qu'il aime + ce qu'il recherche + son évolution dans le temps

### 6.2 Représentation Synthétique
Le système peut produire automatiquement une représentation synthétique du joueur :
- Plateformes préférées
- Générations préférées
- Genres favoris
- Studios favoris
- Périodes les plus actives
- Nombre de jeux joués
- Nombre de jeux terminés
- Collection actuelle
- Collection historique
- Taux de complétion
- Franchises suivies
- Raretés éventuelles
- Évolution des goûts

### 6.3 Terminologie et Vocabulaire
#### Concept d'Architecture :
- **Player Digital Twin** : Terme technique pour l'ensemble des données représentant le joueur

#### Concepts Utilisateur (Vocabulaire Marketing) :
- Gaming Identity
- Player Story
- Gaming DNA
- Gaming History
- Gamer Passport

Le vocabulaire marketing pourra venir plus tard, mais le concept technique reste **Player Digital Twin**.

## 7. Valorisation du Profil

### 7.1 Page Publique Configurable
Le profil peut comporter une page publique présentant :
- 32 ans de gaming
- 18 consoles possédées
- 487 jeux joués
- 214 terminés
- 37 jeux complétés à 100 %
- 6 420 heures enregistrées
- Première console : Mega Drive
- Franchise favorite : Zelda

### 7.2 Éléments Particuliers
Des éléments particuliers peuvent être mis en avant :
- Jeu préféré
- Console préférée
- Plus vieux jeu possédé
- Jeu le plus joué
- Collection favorite
- Accomplissements rares
- Séries entièrement terminées

## 9. Dimension Sociale

### 9.1 Suivi et Comparaison
Les utilisateurs peuvent :
- Suivre d'autres joueurs
- Comparer leurs parcours
- Consulter les collections
- Découvrir leurs points communs
- Partager des éléments de leur timeline
- Comparer leurs expériences sur une franchise
- Participer à des challenges

### 9.2 Exemples de Comparaison
- Yves et Marc ont joué à 127 jeux en commun
- Vous avez tous les deux possédé une Super Nintendo, mais seulement 34 % de vos bibliothèques étaient communes

### 9.3 Compatibilité Vidéoludique
Le système peut produire une compatibilité vidéoludique entre deux profils.

## 10. Recommandation Basée sur le Parcours

### 10.1 Recommandation Contextualisée
La recommandation exploite la biographie complète :
- « Tu as beaucoup joué aux JRPG entre 1997 et 2005 mais tu n'as jamais joué à Chrono Trigger. »
- « Tu as terminé six jeux développés par Arkane sans avoir joué à Prey. »

## 12. Séparation des Données

### 12.1 Univers de Données Distincts
- **REFERENCE DATA** : Données globales (jeux, consoles, studios, etc.) - Binaire / immutable
- **USER DATA** : Données personnelles - Base transactionnelle classique

### 12.2 Architecture
- Les données globales sont volumineuses, en lecture seule, rarement modifiées, communes à tous les utilisateurs
- Les données utilisateur sont transactionnelles, personnelles et continument modifiées

## 13. Principe Produit

### 13.1 Résumé du Concept
Une plateforme qui transforme 30 ans de jeux vidéo en une histoire personnelle, consultable, mesurable et partageable.

### 13.2 Valeur du Produit
- Le catalogue universel de jeux constitue la fondation technique
- La véritable valeur du produit vient de la couche située au-dessus : l'histoire personnelle du joueur, sa collection, ses accomplissements, ses souvenirs, ses statistiques et ses interactions avec les autres joueurs

## 15. Spécifications Techniques

### 15.1 Technologies Suggérées
- Backend : .NET 6+ (C#)
- Frontend : React
- Base de données : PostgreSQL pour les données utilisateur, format binaire pour les données de référence
- Format de données : MemoryPack pour les données de référence

### 15.2 Architecture de l'Application
- API RESTful pour les interactions
- Services de gestion des données utilisateur
- Services de génération de timeline
- Services de recommandation
- Services de gestion des relations sociales

### 15.3 Sécurité et Confidentialité
- Gestion des données personnelles
- Protection des informations sensibles
- Contrôles d'accès
- Politique de confidentialité claire

## 16. Gestion des Données et Source

### 16.1 Provenance des Données
La gestion des données est un aspect critique du projet. Le référentiel vidéoludique doit être alimenté à partir de plusieurs sources :

#### Sources Internes
- Connaissances personnelles et expertise du domaine
- Base de données existante (si disponible)
- Données historiques de l'équipe de développement

#### Sources Externes (à définir)
- API de jeux et plateformes (si disponibles)
- Base de données open source
- Fichiers de données publiés
- Contributions communautaires

### 16.2 Licences et Fiabilité
- Toutes les données doivent être accompagnées de leurs licences respectives
- Priorité à la fiabilité et à la véracité des données
- Mécanismes de validation et de vérification des sources

### 16.3 Fusion des Sources
- Mécanismes de fusion et de canonicalisation des données provenant de différentes sources
- Gestion des conflits de données entre sources
- Système de priorité des sources selon la fiabilité

### 16.4 Traçabilité
- Système de traçabilité des données à leur source originale
- Historique des modifications
- Capacité à retrouver la provenance de chaque donnée

### 16.5 Approche de Développement
L'approche initiale se base sur les connaissances internes et expertise existante, avant de se tourner vers les sources externes. Cette approche permet :
- De commencer avec une base de données fiable et vérifiée
- De valider l'architecture avant d'intégrer des données externes
- De garantir la qualité des données dès les premières versions

## 16. Évolution Future

### 16.1 Fonctionnalités à Ajouter
- Système de forum communautaire
- Événements et compétitions
- Système de critiques et de notes
- Intégration avec les plateformes de jeux
- API pour les développeurs

### 16.2 Améliorations de l'Expérience Utilisateur
- Interface responsive
- Système de thèmes
- Personnalisation avancée
- Notifications intelligentes
- Expérience mobile optimisée

## 17. Critères de Succès

### 17.1 Indicateurs Clés de Performance
Les KPI doivent mesurer l'efficacité de la proposition de valeur :

#### Indicateurs de Réussite de la Proposition de Valeur
- % utilisateurs ayant renseigné ≥ 25 jeux
- % utilisateurs ayant renseigné ≥ 3 consoles
- temps nécessaire pour reconstruire 10 ans d'historique
- % utilisateurs revenant voir leur timeline
- nombre moyen d'événements historiques par profil
- % profils ayant importé une source externe
- % utilisateurs partageant leur profil
- **Median time to first meaningful profile** : Temps médian pour qu'un utilisateur regarde son profil et pense « Oui, ça me ressemble »

#### Indicateurs Génériques (Secondaires)
- Nombre d'utilisateurs actifs
- Temps passé sur la plateforme
- Taux de fidélisation
- Nombre de jeux ajoutés
- Engagement social (suivi, partage, commentaires)
- Satisfaction utilisateur

### 17.2 Objectifs de Développement
- Version de base avec fonctionnalités essentielles
- Améliorations continues basées sur les retours utilisateurs
- Évolution vers une communauté active
- Expansion de la base de données de référence

## 18. Risques et Solutions

### 18.1 Risques Techniques
- **Entity resolution / canonicalisation du référentiel** : La gestion des identités canoniques est un défi majeur. Exemples :
  - Pokémon Red, Pokemon Red, Pokémon Rouge, ポケットモンスター 赤, Pokémon Version Rouge = même jeu
  - PC, Windows, Windows PC, Steam, Steam Deck = mêmes plateformes
- **Complexité de la gestion des données relationnelles** : Gestion des relations entre jeux, éditions, plateformes et versions localisées
- **Performance avec de grandes quantités de données** : Optimisation pour gérer des millions d'entités
- **Intégration de nouvelles fonctionnalités sans casser l'architecture existante**

### 18.2 Solutions
- Architecture modulaire et évolutive
- Tests automatisés rigoureux
- Documentation complète du modèle de données
- Méthodologie de développement agile

## 19. Principes d'UX Critiques

### 19.1 Effort Minimal pour la Reconstruction de l'Historique
Le vrai problème produit n’est pas « que peut-on stocker ? », mais :

**Pourquoi quelqu'un passerait-il deux heures à encoder 20 ou 30 ans de jeux vidéo ?**

C’est actuellement le trou principal des spécifications.

### 19.2 Exigence UX : Minimalisme de l'Effort
L'effort demandé à l'utilisateur pour reconstruire son historique doit être minimal.

### 19.3 Mécanismes de Rapidité de Saisie
Pour éviter la corvée de saisie, l'application devrait permettre :

#### Sélection Massive de Jeux
**Console → sélection massive de jeux → année/période approximative → terminé ou non**

L'utilisateur sélectionne :
- Super Nintendo
- 1993–1997

L'application lui montre les principaux jeux de cette plateforme.

L'utilisateur coche rapidement :
- ✓ joué
- ✓ joué
- ✓ terminé
- ✓ joué
- jamais joué
- ✓ possédé

### 19.4 Caractéristique Majeure du Produit
Cette fonctionnalité de saisie rapide pourrait devenir une caractéristique majeure du produit, en rendant l'utilisation de la plateforme attrayante même pour les joueurs ayant des collections importantes.

## 2. Référentiel Vidéoludique

### 2.1 Structure du Référentiel
Le référentiel global est essentiellement statique et contient :
- Constructeurs (manufacturers)
- Consoles et plateformes
- Générations de consoles
- Jeux
- Studios et éditeurs
- Dates de sortie
- Genres
- Caractéristiques techniques
- Différentes versions d'un jeu
- Éditions physiques et numériques
- Remasters, remakes, ports et rééditions
- Accessoires et périphériques
- Relations entre ces différents objets

### 2.2 Navigation Relationnelle
Le référentiel doit permettre une navigation relationnelle fluide :
Console → jeux → studio → autres jeux → autres plateformes → différentes éditions, etc.