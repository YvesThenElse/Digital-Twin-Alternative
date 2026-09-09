# Spécification du Projet : Plateforme Vidéoludique

> **Version 2** — révision structurelle. Les sections dupliquées de la v1 (§2 et §4 apparaissaient deux fois, deux §16 distincts) ont été fusionnées, la numérotation a été rendue continue (§8, §11 et §14 manquaient), et les points laissés ouverts ont été explicités. Les passages **ajoutés** en v2 sont signalés par 🆕.
> Plan d'implémentation associé : [PHASING.md](./PHASING.md).
> Modèle de domaine consolidé : [MODELE-DE-DOMAINE.md](./MODELE-DE-DOMAINE.md) — il fait foi sur les entités, leurs champs et les invariants.

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
- Collection manager (§4)
- Journal personnel (§9)
- Backlog manager (§10)
- Système de statistiques (§11)
- Forum (si nécessaire — §21)
- API développeurs (si nécessaire — §21)

> 🆕 En v1, le journal personnel et le backlog étaient annoncés ici puis jamais spécifiés. Ils font désormais l'objet des sections §9 et §10.

### 1.4 Phasage Stratégique
Le développement sera effectué en phases :
1. **Phase 1** : Base de données vidéoludique et mémoire personnelle
2. **Phase 2** : Social et interactions
3. **Phase 3** : Recommandations et challenges
4. **Phase 4** : Forum, compétitions, notes et API

Le découpage opérationnel réel, avec critères de sortie, est détaillé dans [PHASING.md](./PHASING.md) (phases 0 à 7).

## 2. 🆕 Positionnement et Concurrence

### 2.1 Pourquoi cette section
La v1 ne contenait aucune analyse concurrentielle. C'est le principal angle mort : le concept « journal de jeux + profil » est un marché déjà occupé, et la valeur du projet dépend entièrement de ce qui le distingue.

### 2.2 Catégories d'acteurs existants
| Catégorie | Exemples connus | Ce qu'ils couvrent |
|---|---|---|
| Journal de jeux / profil social | Backloggd, Grouvee, Backloggery | Ce que je joue et ce que j'en pense, aujourd'hui |
| Suivi de complétion | HowLongToBeat, Completionator | Durée et progression |
| Collection physique | VGCollect, Collectorz Game Collector, GameEye | Ce que je possède, avec éditions et parfois cote |
| Bibliothèque locale / lanceur | Playnite, LaunchBox | Ce qui est installé et lançable |
| Rétrospective automatique | Steam Replay, rétrospectives constructeurs | Une année, générée sans effort |
| Analogie hors domaine | Letterboxd (cinéma) | Le journal transformé en identité culturelle |

> ⚠️ Cette liste doit être vérifiée et actualisée : les périmètres fonctionnels de ces produits évoluent vite et ne sont pas garantis exacts ici. Un benchmark réel est un livrable de la Phase 0.

### 2.3 Différenciateur revendiqué
Aucun de ces produits ne traite correctement, à notre connaissance, la combinaison suivante — qui constitue le pari du projet :

1. **Reconstruction rétroactive sur plusieurs décennies**, y compris la période pré-numérique où aucune donnée n'existe ;
2. **Incertitude temporelle assumée** (§7) plutôt que des dates inventées ou absentes ;
3. **Granularité d'édition** : le même titre possédé plusieurs fois, sur plusieurs supports, à plusieurs époques (§6) ;
4. **Séparation possession / expérience** (§4.2) ;
5. **Restitution narrative** : la timeline, pas la liste.

### 2.4 Tension centrale à assumer
Le différenciateur du produit et sa principale difficulté sont **la même chose** : la période la plus intéressante à reconstruire (avant ~2010) est précisément celle pour laquelle aucun import automatique n'existe. Tout le travail de réduction de friction (§24) porte donc sur de la saisie assistée, pas sur de l'import. Voir aussi la limite documentée des imports en Phase 4 de [PHASING.md](./PHASING.md).

## 3. Référentiel Vidéoludique

### 3.1 Structure du Référentiel
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

### 3.2 Navigation Relationnelle
Le référentiel doit permettre une navigation relationnelle fluide :
Console → jeux → studio → autres jeux → autres plateformes → différentes éditions, etc.

### 3.3 🆕 Notoriété (attribut requis, non optionnel)
La sélection massive (§24.3) repose sur une phrase de la v1 restée non spécifiée : « l'application lui montre **les principaux** jeux de cette plateforme ». « Principaux » selon quel critère ?

Le référentiel doit donc porter un score de **notoriété** par sortie (`Notability`), servant à ordonner les listes de sélection massive. Sources possibles, à trancher en Phase 0 : ventes connues, présence dans les listes de référence, volume de couverture, curation manuelle. Sur un dataset POC de 100 à 300 jeux, un classement manuel est acceptable et probablement supérieur.

Sans cet attribut, la fonctionnalité produit la plus importante du projet ne peut pas fonctionner.

### 3.4 🆕 Région et localisation des sorties
La sélection massive n'a de sens que si elle présente **la bibliothèque qu'a réellement vue l'utilisateur** : un joueur PAL et un joueur NTSC-J n'ont pas connu le même catalogue SNES, ni les mêmes titres, ni les mêmes dates.

La région (PAL / NTSC-U / NTSC-J, et le pays lorsqu'il est pertinent) est donc requise **dès la Phase 1** au niveau de la `Release`, et non repoussée avec le reste de la canonicalisation. Elle conditionne aussi les dates de sortie affichées, qui diffèrent parfois de plusieurs années entre régions.

### 3.5 🆕 Jeu absent du référentiel
Avec un dataset POC volontairement réduit (100 à 300 jeux), l'utilisateur rencontrera constamment des titres absents. La v1 ne prévoyait rien.

Le système doit accepter une **déclaration non résolue** (`UnresolvedGameClaim`) : l'utilisateur saisit un titre libre, éventuellement une plateforme et une période, et l'événement est enregistré normalement. Ces déclarations sont :
- visibles dans son profil comme les autres ;
- marquées comme non canoniques (pas de fiche, pas de statistiques agrégées) ;
- rattachables ultérieurement à une entité canonique, sans perte de l'historique ni des dates.

Elles constituent en outre le meilleur signal de priorisation pour l'extension du référentiel : ce que les utilisateurs cherchent et ne trouvent pas.

### 3.6 🆕 Identifier n'est pas décrire

La plateforme **n'écrit pas de synopsis**. Trois raisons, dans cet ordre d'importance :

1. **Décrire n'est pas son métier.** Le catalogue est la fondation, la valeur est la couche personnelle (§16.2). Des synopsis feraient dériver le produit vers la base de données de jeux — précisément la partie banalisée du marché (§2.2).
2. **Recopier une base tierce est illicite.** Le droit sui generis protège l'investissement du producteur, indépendamment du droit d'auteur sur chaque phrase (§19.1).
3. **Le coût de curation est déjà le poste le plus lourd du projet** (§18.6). Des dizaines de milliers de descriptions, multilingues, à maintenir, l'aggraveraient sans rien apporter au différenciateur.

Il faut cependant distinguer trois besoins que l'on confond aisément.

#### Identifier — requis, quasi gratuit, dès la Phase 1

Une fiche doit permettre de savoir **de quel jeu on parle**. Ce n'est pas une description : c'est de la désambiguïsation, et c'est de la donnée que la canonicalisation exige déjà (`Alias`, `Locale`, §18.4).

- les **noms régionaux** : un joueur PAL devant « Super Probotector » ou « Star Wing » a besoin de savoir qu'il s'agit de Contra III et de Star Fox ;
- les **titres non latins**, qui sont le cœur du risque de §23.1 ;
- **un fait qui situe** l'œuvre — série, rang dans la série, absence de sortie dans une région. Positionnel, jamais narratif.

⚠️ La frontière est nette et doit le rester : *« septième épisode, premier sur PlayStation »* identifie ; *« Cloud, ancien SOLDAT, rejoint un groupe d'éco-terroristes… »* décrit. La seconde forme n'a pas sa place.

#### Renvoyer — Phase 3

L'ouverture vers l'extérieur se fait **sur la fiche elle-même**, en position secondaire, et non sur une page séparée : scinder l'entité en deux casserait la navigation relationnelle (§3.2) et produirait une page que personne ne visiterait.

Trois précautions :

- **stocker l'identifiant, pas l'URL.** `ExternalId` par `Source` existe déjà (§18.4) ; une URL devinée finit par casser ;
- **lier est licite, recopier ne l'est pas** — ce qui conforte le choix de ne pas décrire ;
- **un lien sortant est un lecteur qui part.** Position basse, nouvelle fenêtre, aspect de référence et non de navigation.

#### Ce que d'autres en ont fait — Phase 5

C'est la seule matière descriptive que la plateforme puisse **posséder plutôt qu'emprunter** : combien de joueurs ont déclaré ce titre, combien en ont fait leur préféré (§4.7), et quelques souvenirs publics (§9).

*« 47 joueurs l'ont marqué comme leur préféré »* sert mieux le propos de ce produit qu'un résumé d'intrigue. Aucune encyclopédie ne l'a, cela ne coûte aucune curation, et cela rend la fiche utile à quelqu'un qui **ne connaît pas** le jeu.

#### Pourquoi ce besoin existe malgré tout

On objecte volontiers qu'un joueur qui déclare un titre sait de quoi il s'agit. C'est vrai — pour le propriétaire du profil, au moment où il déclare. Mais la fiche se rejoint par au moins quatre chemins, et trois d'entre eux amènent quelqu'un qui **ne connaît pas** le jeu :

| Qui arrive sur la fiche | Connaît le jeu |
|---|---|
| Le joueur qui déclare | oui |
| Un visiteur d'un profil partagé (§13) | non |
| Le même joueur des mois plus tard | souvent non |
| Le joueur suivant une recommandation (§14) | **non par construction** |

Le dernier cas est décisif : une recommandation existe précisément pour parler d'un jeu qu'on ne connaît pas. La faire aboutir sur une fiche muette la rendrait inutile.

## 4. Profil Vidéoludique Utilisateur

### 4.1 États des Jeux
Chaque utilisateur peut déclarer différents états pour chaque jeu :
- Possédé actuellement
- Possédé autrefois
- Vendu/donné/perdu
- Joué
- Commencé / Abandonné / Terminé / Terminé à 100 % *(quatre positions d'une même échelle, §4.6)*
- Jeu favori *(devient une valeur d'affect, §4.7)*
- Souhaité / wishlist
- Éventuellement prêté ou échangé

> 🆕 **« Terminé à 100 % » doit être défini.** Selon les jeux et les époques, cela peut signifier : tous les succès, toutes les collectibles, toutes les fins, ou le sentiment subjectif de l'avoir épuisé. Le choix retenu est **la déclaration subjective de l'utilisateur**, sans vérification ; l'interface doit le formuler ainsi (« je l'ai fait à fond ») pour éviter une fausse promesse de rigueur. Une complétion vérifiée par succès importés reste possible plus tard, et devra alors être distinguée visuellement de la complétion déclarée.

### 4.2 Séparation Importante
La possession et l'expérience doivent être séparées :
- Un utilisateur peut avoir joué à un jeu sans l'avoir possédé
- Un utilisateur peut avoir possédé un jeu sans l'avoir réellement joué

### 4.3 🆕 Matériel possédé
La v1 modélise la possession uniquement autour des jeux (§6.2), alors que le profil public promet « 18 consoles possédées » (§11.1) et que la timeline de référence commence par une console (« 1991 — Première console : Game Boy », §7.1).

Le matériel est donc un objet possédable de plein droit :
- consoles et plateformes ;
- accessoires et périphériques ;
- éventuellement variantes matérielles (modèle, révision, coloris, édition limitée).

`UserOwnedItem` couvre indifféremment un exemplaire de jeu ou un exemplaire de matériel, et les mêmes événements d'acquisition et de cession s'y appliquent.

### 4.4 🆕 Prêt et échange
Les états « prêté » et « emprunté » de §4.1 sont modélisés comme des événements de possession temporaire (`LentItem`, `BorrowedItem`, avec retour éventuel). Le tiers concerné est du texte libre par défaut ; le rattachement à un autre compte de la plateforme relève de la phase sociale et n'est pas requis avant.

### 4.5 🆕 Provenance : comment il y a joué

**Poser « possédé ? » en case à cocher, à côté d'un geste qui dit déjà « joué », est ambigu.** L'utilisateur ne sait pas si on lui demande une confirmation ou une information nouvelle. La bonne question n'est pas *si* mais **comment**.

| Réponse | Ce que le modèle enregistre |
|---|---|
| « je l'avais » | `UserGameExperience` **et** `UserOwnedItem` |
| « chez quelqu'un » | `UserGameExperience` seule |
| « emprunté ou loué » | `UserGameExperience` seule, possession temporaire (§4.4) |

Trois raisons de préférer cette formulation :

1. **Elle rend visible la séparation possession / expérience** (§4.2) au lieu de la laisser à l'état de concept. L'utilisateur ne lit pas une règle de modèle : il répond à une question naturelle, et le modèle en découle.
2. **Elle couvre le cas le plus fréquent de la période rétro.** Jouer sans posséder était la norme avant la dématérialisation : chez un cousin, chez le copain qui avait l'autre console, en location, sur la console d'un aîné.
3. **« Chez quelqu'un » est un déclencheur de mémoire**, pas seulement une donnée. C'est exactement le genre de détail qui rend un profil reconnaissable, et qui appelle naturellement un souvenir écrit (§9).

Le défaut reste « je l'avais » : c'est le cas majoritaire, et l'utilisateur qui ne répond pas n'est pas pénalisé.

> Extensions possibles, non retenues en Phase 1 : émulation, abonnement, démo ou borne d'essai. Elles se justifieront quand le périmètre s'étendra au-delà des consoles (question ouverte n°5, §25).

### 4.6 🆕 Où en est la partie : trois positions, pas quatre états

La v1 listait « Commencé », « Abandonné », « Terminé » et « Terminé à 100 % » comme quatre états indépendants (§4.1). Ce sont en réalité des positions sur un même axe — **où en est la partie** — et les traiter séparément multiplie les contrôles sans rien ajouter.

| Position | Sens |
|---|---|
| *(rien)* | il y a joué, sans plus de précision |
| « fini » | mené à son terme |
| « toujours en cours » | commencé, jamais refermé — il pourrait y revenir |
| « abandonné » | commencé, laissé en route |

**« Toujours en cours » comble un manque de la v1.** « Commencé » y figurait sans jamais dire si la partie était encore vivante. Or c'est un état fréquent et durable : le jeu posé depuis six mois auquel on compte revenir n'est ni fini ni abandonné. Il alimente directement le backlog (§10).

**« Abandonné » n'est pas un échec** et l'interface ne doit jamais le présenter comme tel : c'est une information de goût aussi utile que « fini ».

> ⚠️ **« Terminé à 100 % » quitte cet axe.** C'est une *profondeur de complétion*, pas une position dans le déroulement — et la notion est vide pour une grande partie du catalogue : 100 % de Tetris, de F-Zero ou d'un jeu de sport ne veut rien dire. Elle réapparaîtra le cas échéant comme raffinement de « fini », sur les seuls titres où elle a un sens, et jamais comme un quatrième choix imposé à chaque jeu.

### 4.7 🆕 Affect : ce que le jeu a représenté

La v1 réduisait cette dimension à un état « Jeu favori » parmi douze autres. C'est trop pauvre pour ce que le produit prétend faire.

**Le problème.** Une liste de jeux joués est factuellement exacte et émotionnellement muette : elle est statistiquement presque identique à celle de milliers de joueurs de la même génération. Or le critère de sortie de la Phase 2 est « oui, ça me ressemble ». Le journal personnel (§9) répond à ce besoin mais coûte de la frappe ; **l'affect en est la version à un geste**.

Trois valeurs, exclusives entre elles, toutes facultatives :

| Valeur | Ce que dit l'utilisateur |
|---|---|
| `Indifferent` | « sans plus » — j'y ai joué, ça ne m'a rien laissé |
| `Loved` | « j'ai adoré » — ça a compté |
| `Favourite` | « mon préféré » — le titre marquant de cette plateforme |

**Ce n'est pas une note, et cela ne doit jamais en devenir une.** Une note juge l'œuvre ; l'affect enregistre une **relation**. Un jeu médiocre fini à deux un dimanche peut être un souvenir précieux ; un chef-d'œuvre joué seul peut n'avoir rien laissé. Introduire une échelle sur cinq ou dix ferait glisser le produit vers le site de critiques — un autre produit, envisagé au mieux en §21.1 — et contredirait le parti pris visuel, qui exclut badges et scores.

**« Sans plus » est une déclaration positive**, au même titre que « jamais joué » (§24.3) : elle distingue l'indifférence constatée de l'absence d'avis, ce qui conditionne directement la qualité des recommandations (§14.2).

**`Favourite` est unique par plateforme.** En désigner un second rétrograde le précédent en `Loved`. Sans cette contrainte, la distinction se dilue en quelques minutes ; avec elle, le choix devient signifiant et alimente la valorisation du profil (§11.2 : « jeu préféré », « console préférée »).

### 4.8 🆕 Le moment de jeu, relatif à la sortie

Demander une date par jeu multiplierait le coût de saisie — c'est pourquoi la période reste un contexte de lot (§24.3). Mais il existe une question bien moins coûteuse et bien mieux mémorisée : **la position par rapport à la sortie du jeu**.

| Réponse | Valeur enregistrée |
|---|---|
| « à sa sortie » | `Year(R)` |
| « peu après » | `Range(R+1, R+3)` |
| « bien plus tard » | `Range(R+4, …)` |
| non renseigné | la période de la plateforme s'applique |

où `R` est l'année de sortie que le référentiel connaît pour la sortie concernée.

Trois raisons de préférer le relatif à l'absolu :

1. **C'est un meilleur souvenir.** « J'y ai joué quand c'est sorti » se retrouve sans effort ; « 1993 » se reconstitue péniblement.
2. **Le référentiel travaille pour l'utilisateur** au lieu de lui poser une question nue — même principe que la fenêtre commerciale de la console (§3.4, §7.5).
3. **La distinction est signifiante.** Avoir joué à Ocarina of Time en 1998 ou en 2012 par émulation ne raconte pas la même histoire — exactement le genre de nuance que la dimension temporelle existe pour porter.

⚠️ **Le relatif est un mode de saisie, pas un huitième type temporel.** La valeur enregistrée reste une `TemporalValue` ordinaire de §7.3. N'ajoutez pas de variante `RelativeToRelease` au modèle : la résolution se fait à la saisie, et seule son issue est conservée.

## 5. Architecture Événementielle

### 5.1 Principe
Au lieu de stocker principalement des états, le système est construit autour d'événements.

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

### 5.2 🆕 Deux axes temporels distincts
C'est la différence structurante avec un event sourcing classique, et elle n'était pas explicitée en v1.

Dans un système événementiel habituel, l'événement est enregistré au moment où il se produit. Ici, un utilisateur déclare **en 2026** qu'il a terminé Final Fantasy VII **en 1998**. Chaque événement porte donc deux temps :

| Champ | Nature | Précision |
|---|---|---|
| `OccurredAt` | quand cela s'est produit dans la vie du joueur | `TemporalValue` (§7), potentiellement incertain ou inconnu |
| `RecordedAt` | quand la déclaration a été enregistrée | horodatage système, exact |

Confondre les deux rend impossibles à la fois la timeline (qui utilise `OccurredAt`) et l'audit, l'annulation ou la mesure d'usage (qui utilisent `RecordedAt`).

### 5.3 🆕 Les événements sont des souvenirs, pas des faits
Un log d'événements classique est immuable parce qu'il enregistre des faits observés. Ici il enregistre des **déclarations de mémoire**, qui sont faillibles : l'utilisateur se trompera d'année, confondra deux versions, ou voudra corriger.

Conséquences :

1. **La correction est une fonctionnalité, pas une exception.** Un événement doit pouvoir être modifié ou rétracté par son auteur, simplement, sans que l'interface n'expose une mécanique de « correction d'événement ».
2. **La révision est conservée côté système** (versionnement de l'événement ou événement de correction), pour la traçabilité et l'annulation, sans être imposée à l'utilisateur.
3. **`Confidence` s'applique aussi aux événements utilisateur**, pas seulement aux données de référence : « je crois que c'était vers 1995 » n'a pas le même statut que « c'était mon anniversaire, donc mars 1994 ».

### 5.4 🆕 Cohérence des parcours
Certaines combinaisons sont contradictoires (terminé avant d'avoir découvert), d'autres seulement inhabituelles et parfaitement légitimes (joué après avoir vendu : emprunt, émulation, réachat).

Le système signale les incohérences **en avertissement doux et jamais en blocage**. Une saisie approximative acceptée vaut mieux qu'une saisie exacte abandonnée : c'est une conséquence directe du principe de friction minimale (§24).

### 5.5 🆕 Portée technique : modèle événementiel ≠ infrastructure d'event sourcing
Le projet impose par ailleurs de ne pas sur-ingénierer ([PHASING.md](./PHASING.md) §1). Il faut donc lever une ambiguïté de la v1 : adopter un **modèle de domaine événementiel** n'oblige pas à adopter une **infrastructure CQRS/Event Sourcing complète** (event store dédié, reconstruction de projections, sagas, snapshots).

Position retenue, à valider en Phase 0 :
- les événements sont des lignes d'une table PostgreSQL en ajout seul ;
- les états (collection actuelle, jeux terminés…) sont des projections calculées à la lecture, puis matérialisées uniquement lorsque la mesure le justifie ;
- aucun produit d'event store spécialisé avant preuve d'un besoin réel.

### 5.6 🆕 Effacement et immuabilité
Un log en ajout seul entre en tension directe avec le droit à l'effacement. Le traitement est décrit en §19.4 ; la contrainte doit être prise en compte **dès la conception du stockage**, pas après.

## 6. Gestion des Éditions

### 6.1 Granularité Supérieure
La plateforme permet une granularité supérieure au simple couple "utilisateur + jeu". Un même titre peut avoir été possédé plusieurs fois :
- Final Fantasy VII → PlayStation PAL → Platinum → version numérique PS3 → remake PS5

### 6.2 Modèle de Données
Le modèle doit distinguer au minimum :
- **Game** (ou *Work*) : œuvre vidéoludique abstraite
- **Release** : sortie du jeu sur une plateforme et une région données
- **Edition** : édition commerciale précise
- **UserGameExperience** : relation entre l'utilisateur et cette œuvre/sortie
- **UserOwnedItem** : exemplaire ou édition réellement possédé par l'utilisateur (jeu ou matériel, §4.3)

[PHASING.md](./PHASING.md) §3 affine ce modèle en une chaîne à quatre niveaux **Work / GameVersion / Release / Edition**, la distinction supplémentaire servant à séparer l'œuvre de ses refontes (remake, remaster) sans les confondre avec de simples portages.

### 6.3 🆕 Cas limites à trancher en Phase 0
Le modèle doit être validé contre les cas suivants, qui cassent les modélisations naïves :
- un **remake** est-il la même œuvre (FFVII 1997 / FFVII Remake 2020) ? Réponse attendue : œuvres liées, pas identiques ;
- une **compilation** contenant plusieurs jeux (posséder la compilation implique-t-il posséder les jeux ?) ;
- un **jeu-service** en évolution continue, sans version stable ;
- un jeu **retiré de la vente** ou dont les serveurs sont fermés ;
- une **rétrocompatibilité** ou une console virtuelle : jouer un jeu Mega Drive sur Switch relève de quelle sortie ?

## 7. Dimension Temporelle

### 7.1 Historique Temporel
Le temps constitue une dimension majeure du produit. Les informations utilisateur représentent une histoire dans le temps :
- 1991 — Première console : Game Boy
- 1992 — Premier jeu Zelda
- 1995 — Découverte de la PlayStation
- 1998 — Final Fantasy VII terminé
- 2002 — PlayStation vendue
- 2005 — Passage au PC
- 2018 — Retour au retrogaming
- 2026 — Rachat d'une PlayStation originale

### 7.2 Flexibilité Temporelle
Le modèle doit accepter :
- Date précise
- Mois/année
- Année
- Période approximative
- Âge approximatif
- Événement sans date

### 7.3 Type Temporel Spécifique
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

> 🆕 **Modes de saisie dérivés.** Deux questions produisent une `TemporalValue` sans que l'utilisateur manipule ces types : la fenêtre commerciale d'une console (§3.4) et la position par rapport à la sortie d'un jeu (§4.8). Dans les deux cas le référentiel fournit le repère et l'utilisateur répond en langage courant. Ces modes n'ajoutent aucune variante au type — ils l'alimentent.

### 7.4 Importance de la Précision Historique
Il est crucial de préserver l'incertitude historique au lieu d'inventer une précision qui n'existe pas. Cette approche permet de :
- Respecter l'authenticité des souvenirs
- Maintenir la flexibilité nécessaire pour les données approximatives
- Créer une expérience utilisateur cohérente avec la nature subjective de la mémoire

### 7.5 🆕 Ordonnancement : le point non résolu de la v1
Déclarer sept variantes de `TemporalValue` est simple ; **les trier ne l'est pas**, et c'est pourtant l'opération que la timeline effectue en permanence. Comment ordonner `Year(1994)`, `Range(1993–1997)`, `Age(~12 ans)` et `Unknown` sur un même axe ?

Règles à figer en Phase 0 :

1. **Toute `TemporalValue` se normalise en un intervalle** `[début, fin]` fermé, plus un **point représentatif** utilisé pour le tri (par convention, le milieu de l'intervalle).
2. **L'ordre est partiel, pas total** : `Range(1993–1997)` et `Year(1995)` se chevauchent et ne sont pas comparables strictement. Les opérations de comparaison doivent utiliser une algèbre d'intervalles explicite (relations d'Allen : avant, chevauche, contient, égal…) et non un `<` naïf sur des dates.
3. **`Unknown` n'a pas de place sur l'axe** : ces événements sont regroupés dans une zone dédiée (« à une date inconnue »), jamais projetés arbitrairement.
4. **L'affichage doit rendre l'incertitude visible** : une bande pour un intervalle, un point pour une date exacte. Afficher un souvenir vague comme une date précise trahit le principe §7.4.

### 7.6 🆕 Dépendance de `Age` à l'année de naissance
`Age` est le seul type non résolvable de manière autonome : « vers mes 12 ans » n'est convertible qu'avec l'année de naissance de l'utilisateur. Cela implique :
- une **dépendance fonctionnelle** : le profil doit porter une année de naissance, au moins approximative, sinon `Age` reste non résolu et se comporte comme `Unknown` ;
- une **conséquence RGPD** : l'année de naissance est une donnée personnelle supplémentaire, qui doit être facultative, justifiée à l'utilisateur (« pour situer vos souvenirs ») et non publiée par défaut (§12.3) ;
- un **stockage sous forme brute** : conserver « 12 ans », et non la conversion en 1994, pour que la correction de l'année de naissance recalcule automatiquement tous les souvenirs concernés.

### 7.7 🆕 Requêtes temporelles : strict ou permissif
« Quels jeux possédais-tu en 1997 ? » n'a pas de réponse unique lorsque les intervalles sont flous. Deux modes doivent être définis et le mode retenu doit être visible dans l'interface :
- **strict** : seuls les éléments dont l'intervalle est entièrement inclus dans la période ;
- **permissif** : tous les éléments dont l'intervalle chevauche la période.

Le mode permissif est le défaut recommandé pour la restitution narrative ; le mode strict pour les statistiques annoncées comme des chiffres.

## 8. « Digital Twin » du Joueur

### 8.1 Jumeau Numérique Vidéoludique
L'ensemble des informations constitue une sorte de jumeau numérique vidéoludique représentant :
- Ce que le joueur possède + ce qu'il a possédé + ce qu'il a joué + ce qu'il a terminé + ce qu'il aime + ce qu'il recherche + son évolution dans le temps

### 8.2 Représentation Synthétique
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

### 8.3 Terminologie et Vocabulaire
#### Concept d'Architecture :
- **Player Digital Twin** : Terme technique pour l'ensemble des données représentant le joueur

#### Concepts Utilisateur (Vocabulaire Marketing) :
- Gaming Identity
- Player Story
- Gaming DNA
- Gaming History
- Gamer Passport

Le vocabulaire marketing pourra venir plus tard, mais le concept technique reste **Player Digital Twin**.

> 🆕 Réserve de terminologie : « digital twin » désigne habituellement une réplique **synchronisée et simulable** d'un système physique. Ici il s'agit d'une biographie reconstruite, sans synchronisation ni simulation. Le terme est acceptable en interne s'il est compris ainsi, mais `PlayerHistory` ou `PlayerProfile` décrivent plus honnêtement l'objet et éviteront des attentes erronées dans le code.

## 9. 🆕 Journal Personnel et Souvenirs

### 9.1 Pourquoi cette section est ajoutée
Le journal personnel est annoncé en §1.3 de la v1 puis jamais spécifié, alors qu'il porte directement le critère de validation du projet : faire dire à l'utilisateur « **oui, ça me ressemble** » ([PHASING.md](./PHASING.md) §5).

Or une liste de jeux cochés, aussi complète soit-elle, ne ressemble à personne : elle est statistiquement identique à celle de milliers d'autres joueurs de la même génération. Ce qui rend un profil personnel, c'est la phrase « on l'a fini à deux avec mon frère pendant les vacances de 1997 ».

> 🆕 **L'affect (§4.7) en est le complément à un geste.** Le journal produit l'irremplaçable mais coûte de la frappe ; l'affect coûte un tap et capte déjà ce qui a compté. Les deux se cumulent : un préféré assorti d'une phrase est le contenu le plus fort du produit.

### 9.2 Périmètre minimal
- Une **note libre** attachée à un événement, à un jeu, ou à une période de la timeline ;
- Optionnellement un **titre** court, servant de repère sur la timeline ;
- Visibilité contrôlée indépendamment du reste du profil (§12).

### 9.3 Recommandation de phasage
Cette fonctionnalité est **peu coûteuse à construire et directement alignée sur le critère de sortie de la Phase 2**. Une version minimale (note libre sur un événement) est recommandée dès la Phase 1, contre son report initial en phase ultérieure.

### 9.4 Extensions ultérieures
Photos personnelles (coût de stockage et de modération), enregistrements audio, import de souvenirs depuis d'autres sources. Non prioritaires.

## 10. 🆕 Backlog et Wishlist

### 10.1 Deux notions distinctes
La v1 mentionne le « backlog manager » (§1.3) et la « wishlist » (§4.1) sans jamais les distinguer. Ce sont deux intentions différentes :

| Notion | Question posée | Exemple |
|---|---|---|
| **Wishlist** | Qu'est-ce que je veux **posséder** ? | Racheter une PlayStation d'origine |
| **Backlog** | Qu'est-ce que je veux **jouer** ? | Un jeu possédé depuis trois ans, jamais lancé |

Un jeu possédé et non joué appartient au backlog mais pas à la wishlist ; un jeu convoité et jamais acquis, l'inverse. La séparation possession / expérience (§4.2) impose donc de les séparer aussi côté intentions.

### 10.2 Attributs
- Priorité ou envie ;
- Origine de l'intention (recommandation, cadeau, franchise suivie, nostalgie) ;
- Date d'entrée dans la liste — ce qui en fait, comme le reste, des événements (§5).

### 10.3 Lien avec la recommandation
Le backlog est la cible naturelle des suggestions de la Phase 6 (§14) : recommander un jeu déjà dans le backlog de l'utilisateur est le cas le plus facile à rendre pertinent.

## 11. Valorisation du Profil

### 11.1 Page Publique Configurable
Le profil peut comporter une page publique présentant :
- 32 ans de gaming
- 18 consoles possédées
- 487 jeux joués
- 214 terminés
- 37 jeux complétés à 100 %
- 6 420 heures enregistrées
- Première console : Mega Drive
- Franchise favorite : Zelda

### 11.2 Éléments Particuliers
Des éléments particuliers peuvent être mis en avant :
- Jeu préféré
- Console préférée
- Plus vieux jeu possédé
- Jeu le plus joué
- Collection favorite
- Accomplissements rares
- Séries entièrement terminées

### 11.3 🆕 Le temps de jeu n'est pas une donnée disponible
« 6 420 heures enregistrées » figure dans l'exemple ci-dessus, mais **aucun élément du modèle ne produit cette valeur**. C'est la seule statistique annoncée que les données ne savent pas alimenter.

Le temps de jeu n'existe que dans trois cas, de fiabilité très inégale :

| Origine | Fiabilité | Couverture |
|---|---|---|
| Importé (Steam et équivalents) | mesurée, mais compte le temps application ouverte | PC moderne uniquement |
| Saisi manuellement | déclaratif | quelques jeux marquants au mieux |
| Estimé (durée moyenne connue du jeu × complétion) | approximatif | large, mais ce n'est pas *son* temps |

Règles retenues :
1. Le temps de jeu est un attribut **facultatif et typé par origine**, jamais un champ unique ;
2. Aucun total agrégé ne mélange les trois origines sans le dire explicitement ;
3. Pour l'essentiel du parcours rétro, la bonne réponse est **de ne pas afficher d'heures** plutôt que d'en inventer — cohérent avec §7.4.

### 11.4 🆕 Statistiques et incertitude
Les compteurs affichés doivent rester cohérents avec §7.7 : « 32 ans de gaming » dérivé d'un premier événement daté `Range(1990–1993)` doit s'afficher comme un ordre de grandeur, pas comme un chiffre exact.

## 12. 🆕 Visibilité et Partage

### 12.1 Le binaire privé/public est insuffisant
La v1 et le plan ne prévoient qu'une visibilité « privée / publique » globale. C'est trop grossier pour un objet aussi personnel : un utilisateur peut vouloir exposer sa collection sans exposer son journal, ou ses statistiques sans ses dates.

### 12.2 Granularité requise
Visibilité indépendante, au minimum, pour : la timeline, la collection actuelle, la collection historique, les statistiques agrégées, le journal (§9), la wishlist et le backlog (§10).

### 12.3 Risque d'inférence
Un profil qui affiche « première console à 8 ans, en 1991 » publie de fait une date de naissance. Le croisement des dates et des âges (§7.6) permet de reconstituer des informations que l'utilisateur n'a pas eu l'intention de publier. Deux mesures :
- l'âge n'est jamais publié, seules les années le sont, et le profil signale ce croisement lors de l'activation du partage ;
- les pages publiques ne sont pas indexables par défaut (URL non devinable, `noindex`), l'indexation étant un choix explicite.

## 13. Dimension Sociale

### 13.1 Suivi et Comparaison
Les utilisateurs peuvent :
- Suivre d'autres joueurs
- Comparer leurs parcours
- Consulter les collections
- Découvrir leurs points communs
- Partager des éléments de leur timeline
- Comparer leurs expériences sur une franchise
- Participer à des challenges

### 13.2 Exemples de Comparaison
- Yves et Marc ont joué à 127 jeux en commun
- Vous avez tous les deux possédé une Super Nintendo, mais seulement 34 % de vos bibliothèques étaient communes

### 13.3 Compatibilité Vidéoludique
Le système peut produire une compatibilité vidéoludique entre deux profils.

> 🆕 La métrique doit être définie avant d'être affichée. Une similarité brute (jeux communs / jeux totaux) donnera des scores dominés par les grands succès que tout le monde a joués, donc peu informatifs. Une pondération par rareté (les titres peu partagés valent davantage) et par époque produit un résultat nettement plus parlant. À trancher en Phase 5, mais à ne pas exposer comme un pourcentage tant que la formule n'est pas assumée.

## 14. Recommandation Basée sur le Parcours

### 14.1 Recommandation Contextualisée
La recommandation exploite la biographie complète :
- « Tu as beaucoup joué aux JRPG entre 1997 et 2005 mais tu n'as jamais joué à Chrono Trigger. »
- « Tu as terminé six jeux développés par Arkane sans avoir joué à Prey. »

### 14.2 🆕 Absence de preuve ≠ preuve d'absence
Ces formulations reposent sur une inférence dangereuse : « tu n'as jamais joué à X » signifie en réalité « tu n'as pas déclaré avoir joué à X ». Sur un profil reconstruit de mémoire, l'écart est énorme.

L'affect (§4.7) réduit ce risque : un jeu marqué « sans plus » est écarté des suggestions en connaissance de cause, et les jeux marqués « j'ai adoré » ou « mon préféré » constituent le meilleur signal de goût dont dispose le système — bien meilleur qu'un simple comptage de titres joués.

Les recommandations doivent donc être formulées de manière non assertive (« tu ne l'as pas encore ajouté ») et exclure les jeux que l'utilisateur a explicitement marqués comme non joués (§24.3), sous peine de produire l'effet inverse de celui recherché : au lieu de « cette plateforme me connaît », « cette plateforme se trompe sur moi ».

## 15. Séparation des Données

### 15.1 Univers de Données Distincts
- **REFERENCE DATA** : Données globales (jeux, consoles, studios, etc.) — volumineuses, en lecture seule, communes à tous les utilisateurs
- **USER DATA** : Données personnelles — base transactionnelle classique

### 15.2 Architecture
- Les données globales sont volumineuses, en lecture seule, rarement modifiées, communes à tous les utilisateurs
- Les données utilisateur sont transactionnelles, personnelles et continûment modifiées

> 🆕 **Correction de la v1** : celle-ci qualifiait les données de référence de « binaire / immutable » comme s'il s'agissait d'un principe d'architecture. Le format de stockage (binaire, MemoryPack ou autre) est une **décision d'optimisation reportée en Phase 7 et tranchée par benchmark** ([PHASING.md](./PHASING.md) §10). Ce qui relève du principe, c'est la séparation des deux univers et le caractère lecture seule du référentiel — pas son encodage.

### 15.3 🆕 Versionnement et migration des références
Le référentiel évolue : deux fiches sont fusionnées, une fiche est scindée en deux éditions distinctes, un identifiant est corrigé. Or les événements utilisateur pointent vers ces entités.

Il faut donc, dès l'introduction de `DatasetVersion` (Phase 3) :
- des identifiants canoniques **stables**, jamais réattribués ;
- un **journal des fusions et scissions**, permettant de réécrire ou rediriger les références utilisateur lors d'un changement de version ;
- une règle explicite pour les scissions, où la redirection est ambiguë (rattachement au plus probable, avec `Confidence`, ou demande à l'utilisateur).

Sans ce mécanisme, la première canonicalisation sérieuse casse silencieusement des profils existants.

## 16. Principe Produit

### 16.1 Résumé du Concept
Une plateforme qui transforme 30 ans de jeux vidéo en une histoire personnelle, consultable, mesurable et partageable.

### 16.2 Valeur du Produit
- Le catalogue universel de jeux constitue la fondation technique
- La véritable valeur du produit vient de la couche située au-dessus : l'histoire personnelle du joueur, sa collection, ses accomplissements, ses souvenirs, ses statistiques et ses interactions avec les autres joueurs

## 17. Spécifications Techniques

### 17.1 Technologies
Décisions verrouillées dans [PHASING.md](./PHASING.md) §4 :
- **Backend** : .NET 10 LTS + EF Core 10 *(la mention « .NET 6+ » de la v1 est obsolète)*
- **Frontend** : React + TypeScript (Vite), TanStack Query pour l'état serveur
- **Base de données utilisateur** : PostgreSQL 17+
- **Dataset de référence (POC)** : SQLite ou fichier précompilé simple
- **Format binaire / MemoryPack** : **non verrouillé**, décision par benchmark en Phase 7

### 17.2 Architecture de l'Application
- API RESTful pour les interactions
- Services de gestion des données utilisateur
- Services de génération de timeline
- Services de recommandation
- Services de gestion des relations sociales

### 17.3 Sécurité et Confidentialité
- Gestion des données personnelles (détaillée en §19)
- Protection des informations sensibles
- Contrôles d'accès
- Politique de confidentialité claire

### 17.4 🆕 Stratégie de test
La mention « tests automatisés rigoureux » (§23.2) est trop générique pour orienter l'effort. Deux zones concentrent le risque réel et méritent un traitement spécifique :

1. **L'algèbre de `TemporalValue`** (§7.5) : normalisation, comparaison, chevauchement, tri. Le domaine est purement fonctionnel et combinatoire — c'est le cas d'école du **test basé sur les propriétés** (invariants du type « le tri est stable quel que soit l'ordre d'insertion », « normaliser deux fois équivaut à normaliser une fois »).
2. **Les projections d'événements** (§5.1) : rejouer un flux d'événements doit produire un état déterministe. Des jeux d'événements de référence (les parcours de §7.1 et §6.1) servent de tests de non-régression permanents et de validation du modèle en Phase 0.

## 18. Gestion des Données et Source

### 18.1 Provenance des Données
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

### 18.2 Licences et Fiabilité
- Toutes les données doivent être accompagnées de leurs licences respectives
- Priorité à la fiabilité et à la véracité des données
- Mécanismes de validation et de vérification des sources

### 18.3 Fusion des Sources
- Mécanismes de fusion et de canonicalisation des données provenant de différentes sources
- Gestion des conflits de données entre sources
- Système de priorité des sources selon la fiabilité

### 18.4 Traçabilité
- Système de traçabilité des données à leur source originale
- Historique des modifications
- Capacité à retrouver la provenance de chaque donnée

Champs de provenance : `Source`, `ExternalId`, `CanonicalId`, `Alias`, `Locale`, `Confidence`, `DatasetVersion`, et pour les imports utilisateur `ExternalUserId`, `ExternalGameId`, `ImportedAt`.

### 18.5 Approche de Développement
L'approche initiale se base sur les connaissances internes et expertise existante, avant de se tourner vers les sources externes. Cette approche permet :
- De commencer avec une base de données fiable et vérifiée
- De valider l'architecture avant d'intégrer des données externes
- De garantir la qualité des données dès les premières versions

### 18.6 🆕 Coût réel de la curation
Un dataset POC de 100 à 300 jeux est curable manuellement. Un référentiel crédible en Phase 3 se compte en dizaines de milliers d'entrées, et c'est le poste de charge le plus lourd et le plus durable du projet — bien avant le développement.

Ce coût doit être évalué explicitement en Phase 0, car il conditionne à la fois le calendrier et le modèle économique (§25). Trois voies, non exclusives : import d'une source ouverte compatible, contribution communautaire modérée, curation interne restreinte à un périmètre assumé.

## 19. 🆕 Cadre Juridique et Conformité

Cette section n'existait pas en v1, qui se limitait à « toutes les données doivent être accompagnées de leurs licences » (§18.2) et à quatre puces génériques sur la confidentialité (§17.3). Pour un projet qui agrège des données tierces **et** constitue par nature une archive de données personnelles, c'est insuffisant.

### 19.1 Droits sur les données de référence
Trois régimes distincts, souvent confondus :

1. **Les faits ne sont pas protégeables** en tant que tels (un titre, une date de sortie, un éditeur).
2. **Le droit sui generis des bases de données** (directive 96/9/CE, applicable dans l'UE) protège en revanche l'**investissement** du producteur d'une base : l'extraction substantielle d'une base tierce peut être illicite même quand chaque donnée prise isolément est un simple fait. C'est le risque principal, et il est spécifique au contexte européen — il ne disparaît pas parce que « ce ne sont que des métadonnées ».
3. **Les conditions d'utilisation** des API et des sites priment de toute façon contractuellement, indépendamment du droit d'auteur.

**Conséquence pratique** : privilégier les sources dont la licence autorise explicitement la réutilisation et la redistribution (les jeux de données sous CC0 ou licences ouvertes équivalentes sont les seuls confortables), et vérifier les CGU **avant** tout import, pas après. La licence de chaque source doit être un champ du référentiel, pas une note.

### 19.2 Visuels
Jaquettes, captures, logos et marques sont protégés et ne relèvent pas du régime des données factuelles. Le référentiel doit pouvoir fonctionner **sans visuels sous licence**, l'ajout d'illustrations étant une décision distincte et documentée (source licenciée, contribution utilisateur avec garantie, ou absence assumée).

> 🆕 **Ce n'est pas seulement une question juridique : c'est une dépendance de la fonctionnalité centrale.**
>
> La sélection massive (§24.3) fonctionne par **reconnaissance** — l'utilisateur balaye une liste et retrouve ses jeux. Reconnaître un titre à sa jaquette est incomparablement plus rapide que de le lire dans une ligne de texte. Une grille sans visuels dégrade donc directement la performance du geste qui porte le produit, et pas seulement son esthétique.
>
> La décision sur les visuels appartient par conséquent à la **Phase 0**, au même titre que le modèle de données. Quatre voies, non exclusives :
>
> 1. **Sources ouvertes** (Wikidata / Wikimedia et équivalents) : licences propres, couverture partielle. Point de départ le plus sain.
> 2. **Source licenciée** : à vérifier contractuellement avant tout usage.
> 3. **Contribution utilisateur avec garantie** : déplace le risque, exige de la modération.
> 4. **Identité visuelle générée** : à défaut de jaquette, produire une **tuile systématique** à partir du titre, de la plateforme et de l'époque (typographie + palette de la génération). Bien exécutée, elle paraît intentionnelle et signée, pas manquante — et elle ne doit jamais imiter une vraie jaquette.
>
> La voie 4 reste nécessaire même si la 1 ou la 2 aboutit, puisqu'aucune source n'offrira une couverture complète : jaquette réelle quand elle existe, tuile générée sinon, dans un format constant pour que la grille ne paraisse jamais rapiécée. Spécification détaillée dans [ecrans/00-langage-visuel.md](./ecrans/00-langage-visuel.md) §5.

> ## ✅ Décision de Phase 0 — tranchée
>
> **Observation.** La [planche de vignettes](./maquettes/vignettes-generees.html) a été examinée aux échelles réelles, sur soixante titres et six générations.
>
> Ce qui fonctionne : à 148 px les titres sont **parfaitement lisibles** et la composition paraît intentionnelle, pas manquante. Les trames différencient réellement — arcs concentriques, grille, pointillés, rayons se distinguent au premier coup d'œil. La variation de teinte à l'intérieur d'une génération se voit. Et le **gradient d'époque fonctionne** : du terre cuite au violet, la progression se lit sans consulter les libellés.
>
> Ce qui ne fonctionne pas, et c'est décisif : **une tuile générée est du texte sur un fond coloré.** La reconnaître exige de la *lire*. Or la grille desktop n'existait que pour permettre la reconnaissance **sans lecture** ([ecrans/00-principes-transverses.md](./ecrans/00-principes-transverses.md) §8). Une tuile de 148 px qui affiche un titre coûte environ cinq fois la surface d'une ligne de liste pour transmettre exactement la même chose.
>
> **Trois décisions en découlent.**
>
> **1. Les tuiles générées sont retenues définitivement — comme socle, pas comme cible.** Aucune source ne couvrira jamais l'intégralité du référentiel ; la traîne en aura toujours besoin. Elles tiennent visuellement, portent le système d'époques, et évitent la mosaïque grise. Le repli est validé.
>
> **2. Pour les 100 à 300 titres du dataset POC, il faut de vraies jaquettes.** Sans elles, le test de Phase 2 mesurerait une **vitesse de lecture** là où il prétend mesurer une **vitesse de reconnaissance** — et validerait ou invaliderait la mauvaise chose. À cette échelle l'acquisition est traitable ; à trente mille titres elle ne le serait pas, ce qui confirme le point 1.
>
> ⚠️ La difficulté est réelle et ne doit pas être minorée : **une jaquette est une œuvre protégée**, rarement disponible sous licence libre. Les encyclopédies s'appuient sur des exceptions qui ne se transmettent pas. Les voies praticables sont donc : une source sous licence explicite dont les conditions ont été vérifiées, la contribution utilisateur avec garantie, ou une analyse juridique documentée. C'est un travail de Phase 0 à part entière, pas une formalité.
>
> **3. La grille desktop est conditionnée au point 2.** Sans jaquettes réelles, elle est **abandonnée** au profit de la liste dense à tous les points de rupture : une grille de tuiles textuelles est strictement moins bonne qu'une liste de lignes textuelles, pour cinq fois la surface.


### 19.3 RGPD — le produit est une archive personnelle
Le produit collecte, par conception : un historique de vie sur plusieurs décennies, des goûts, des habitudes, éventuellement une année de naissance (§7.6) et des identifiants de comptes tiers (§18.4). Ce n'est pas un cas marginal de conformité, c'est le cœur du produit.

À traiter au plus tard en Phase 3 (authentification), et à anticiper dès la Phase 0 :
- **base légale** du traitement et information de l'utilisateur ;
- **minimisation** : ne pas collecter l'année de naissance si `Age` n'est pas utilisé ;
- **durée de conservation** et sort des comptes inactifs ;
- **portabilité** : l'export (déjà prévu en Phase 3) sert aussi cet objectif ;
- **droit d'effacement** (voir §19.4) ;
- **sous-traitants et localisation de l'hébergement**.

### 19.4 Effacement contre journal en ajout seul
C'est la contrainte architecturale la plus concrète de cette section, et elle est incompatible avec une lecture naïve de §5 : un log d'événements immuable ne peut pas satisfaire une demande d'effacement par un simple marqueur de suppression.

Deux stratégies acceptables, à trancher en Phase 0 car elles engagent le stockage :
- **suppression physique par utilisateur** : le partitionnement des événements par utilisateur rend la purge triviale — c'est l'option la plus simple et elle suffit ici ;
- **crypto-shredding** : les données personnelles sont chiffrées avec une clé par utilisateur, détruite à la demande d'effacement — pertinent seulement si des projections ou des sauvegardes rendent la purge physique difficile.

Choisir après coup coûte une migration de stockage. Choisir maintenant coûte une décision.

> ✅ **Tranché** ([MODELE-DE-DOMAINE.md](./MODELE-DE-DOMAINE.md) §10.1) : **purge physique partitionnée par utilisateur**. Le crypto-shredding répond au cas où l'on ne *peut pas* supprimer — journal immuable, index tiers, entrepôt hors de portée. Rien de tel ici : PostgreSQL supprime, aucune projection n'est stockée comme vérité, et tout enregistrement personnel est joignable par `UserId` seul. La limite connue reste les sauvegardes, qui se traitent par la politique de rétention et non par l'architecture.

### 19.5 Contenu utilisateur public
Le journal (§9) et les profils publics (§12) introduisent du contenu librement rédigé et visible par des tiers : un mécanisme minimal de signalement et de retrait est nécessaire dès l'ouverture du partage (Phase 5), sans construire pour autant une chaîne de modération lourde.

## 20. 🆕 Internationalisation

Le sujet est intrinsèquement multilingue : la spécification cite elle-même « Pokémon Red = Pokémon Rouge = ポケットモンスター 赤 » comme risque majeur (§23.1). Deux niveaux à ne pas confondre :

1. **Les données** : titres localisés, alias, région — déjà traités par `Alias` et `Locale` (§18.4) et par §3.4. Cette partie est requise tôt.
2. **L'interface** : la langue du produit. Non traitée en v1. La décision (français d'abord, anglais d'abord, ou bilingue) a des conséquences sur le marché visé (§25) et sur la structure du frontend, où le rattrapage tardif est coûteux. La recommandation minimale est de ne pas coder les libellés en dur dès la Phase 1, même si une seule langue est livrée.

Le jeu de caractères doit gérer sans réserve les écritures non latines, y compris dans la recherche (translittération, recherche insensible aux diacritiques).

## 21. Évolution Future

### 21.1 Fonctionnalités à Ajouter
- Système de forum communautaire
- Événements et compétitions
- Système de critiques et de notes
- Intégration avec les plateformes de jeux
- API pour les développeurs

### 21.2 Améliorations de l'Expérience Utilisateur
- Interface responsive
- Système de thèmes
- Personnalisation avancée
- Notifications intelligentes
- Expérience mobile optimisée

> 🆕 **Réserve sur le mobile.** Il est listé ici comme une amélioration ultérieure, alors que la saisie massive (§24.3) — le geste central du produit — est une interaction de type « cocher rapidement une longue liste », particulièrement adaptée au tactile, et que la consultation d'un profil partagé arrivera majoritairement depuis un mobile. Le responsive doit être une contrainte de conception dès la Phase 1, pas une amélioration de Phase 7.
>
> 🆕 **Et « responsive » est un mot trop faible.** Mobile et desktop ne sont pas la même disposition étirée mais **deux stratégies de lecture** : on balaye une liste dense à une colonne sur téléphone, une grille visuelle sur écran large. Ce qui ne varie jamais : le modèle, la séquence des écrans, le geste primaire. Ce qui varie : la disposition et la richesse des affordances secondaires, le survol et le clavier rendant sur desktop des contrôles qui coûteraient trop cher au doigt. Détail dans [ecrans/00-langage-visuel.md](./ecrans/00-langage-visuel.md) §6.
>
> 🆕 **Le hors-ligne n'est pas listé du tout, et il devrait l'être.** Se remémorer ses jeux d'enfance se fait dans un canapé ou un train. Une saisie qui persiste à chaque geste et dépend du réseau casse exactement là où on l'utilise : écriture locale d'abord et file de synchronisation sont des exigences de Phase 1, pas des raffinements d'industrialisation.
>
> 🆕 **Manque également une identité visuelle.** Aucune section de ce cahier des charges ne dit à quoi le produit ressemble. Le parti pris retenu — **l'époque comme système visuel**, chaque génération de consoles portant son accent chromatique — sert simultanément le repérage temporel, la distinction concurrentielle et la lisibilité des listes sans jaquettes. Il est spécifié dans [ecrans/00-langage-visuel.md](./ecrans/00-langage-visuel.md).

## 22. Critères de Succès

### 22.1 Indicateurs Clés de Performance
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

### 22.2 🆕 Des indicateurs sans cible ne sont pas des critères
Aucun seuil n'est associé à ces KPI, et le critère de sortie de la Phase 2 se contente de « la majorité des testeurs ». Un indicateur sans valeur cible fixée **à l'avance** ne peut pas servir de porte de décision : il sera interprété favorablement une fois les résultats connus.

Chaque KPI retenu pour le POC doit donc porter, dès la Phase 0 :
- une **valeur cible chiffrée**, engagée avant le test ;
- une **définition opérationnelle** (à partir de quand un profil est-il « renseigné » ? le temps de reconstruction se mesure-t-il en temps écoulé ou en temps actif ?) ;
- la **décision associée** en cas d'échec : itérer, pivoter, ou arrêter.

Pour un produit dont la thèse est « ce profil me ressemble », une majorité à 51 % est un signal faible ; le seuil devrait être nettement plus exigeant, et assumé comme tel.

### 22.3 🆕 Jeu de KPI chiffrés du POC — **engagé**

> ✅ **Cibles validées et engagées le 8 septembre 2026**, avant tout test utilisateur. C'est cet engagement préalable, et lui seul, qui les rend opposables : une cible fixée après coup se plie toujours au résultat obtenu (§22.2).
>
> **Règle de révision.** Ces seuils peuvent être ajustés **tant qu'aucun testeur n'a été reçu**. Après le premier test, toute modification doit être consignée avec sa date et son motif, et rend la porte **non franchie par défaut** : on ne descend pas une barre parce qu'on est passé dessous.

#### A. La mécanique fonctionne — mesuré, objectif

| Indicateur | Définition opérationnelle | Cible | Si manqué |
|---|---|---|---|
| **T1 · première histoire lisible** | du premier clic à un écran d'histoire portant ≥ 10 jeux déclarés | **médiane ≤ 3 min** | retour Phase 1 sur l'accueil et l'enchaînement |
| **T2 · reconstruction significative** | du premier clic à ≥ 25 jeux **et** ≥ 2 plateformes | **médiane ≤ 12 min**, **90ᵉ centile ≤ 20 min** | retour Phase 1 sur la saisie |
| **Gestes par jeu déclaré** | gestes de déclaration ÷ jeux déclarés | **≤ 1,35** en moyenne | la feuille de précisions est lue comme un formulaire : la replier derrière « préciser » |
| **Achèvement du parcours** | testeurs atteignant l'écran d'histoire ÷ testeurs recrutés | **≥ 85 %** | identifier le point de sortie avant toute autre analyse |

Le chronomètre démarre **au premier clic**, pas au chargement : le temps de lecture de l'accueil n'est pas imputé à la saisie.

> **Deux mesures distinctes, deux usages.** Le budget de conception reste **2 minutes** ([ecrans/00-principes-transverses.md](./ecrans/00-principes-transverses.md) §4) : c'est la cible contre laquelle on construit. La **porte** est à 3 minutes, parce qu'un budget de conception mesuré sur une ludothèque de démonstration ne survit pas tel quel à 147 titres réels et à l'hésitation. Confondre les deux ferait échouer le test pour des raisons étrangères au produit.

#### B. Le volume déclaré

| Indicateur | Cible | Si manqué |
|---|---|---|
| Testeurs ayant déclaré **≥ 25 jeux** | **≥ 80 %** | la sélection massive ne tient pas sa promesse |
| Testeurs ayant déclaré sur **≥ 2 plateformes** | **≥ 75 %** | sans seconde console, les fils parallèles ne se voient jamais : revoir la place du carrefour |
| Testeurs ayant déclaré sur **≥ 3 plateformes** | **≥ 50 %** | indicateur de diagnostic, pas une porte |
| Moments datés par profil | **≥ 15** en médiane | la datation est esquivée : simplifier la fourche |

Deux seuils sur les plateformes plutôt qu'un seul : atteindre trois consoles suppose de repasser deux fois par le carrefour, ce qui teste le **parcours** autant que l'envie. Le seuil à deux teste le concept, celui à trois teste la fluidité.

#### C. La porte dure — « oui, ça me ressemble »

| Indicateur | Cible | Si manqué |
|---|---|---|
| **Oui francs** à la question qualitative | **≥ 75 %** des testeurs **recrutés** | **retour Phase 1**, jamais passage en Phase 3 |

Trois exigences de méthode, sans lesquelles le chiffre ne vaut rien :

1. **La question est posée en aveugle.** Pas « est-ce que ça te ressemble ? », qui appelle l'acquiescement, mais « qu'est-ce que cet écran vous dit de vous ? », dont la réponse est ensuite codée.
2. **Seul un oui franc compte.** Un « oui, c'est pas mal » est un non.
3. **Le dénominateur est l'ensemble des recrutés**, pas les seuls finisseurs. Mesurer la reconnaissance sur les survivants flatterait le résultat d'un biais de sélection.

Pourquoi 75 % et non « la majorité » : ce produit repose entièrement sur une reconnaissance émotionnelle. À 60 %, quatre utilisateurs sur dix ne reçoivent rien de ce que le produit promet — ce n'est pas un produit viable, c'est un produit qui fonctionne pour certains.

#### D. Le retour — mesuré, mais **pas une porte**

| Indicateur | Cible indicative |
|---|---|
| Testeurs revenus consulter leur histoire sous 7 jours | ≥ 40 % |

Une fenêtre de test de deux à quatre semaines ne mesure pas la rétention de façon fiable. Cet indicateur est suivi et rapporté, mais **la Phase 3 ne s'y adosse pas** : la porte reste qualitative et mécanique. Le prétendre mesurable ici serait se mentir.

#### E. Variable de contrôle — la couverture du référentiel

| Indicateur | Seuil | Conséquence |
|---|---|---|
| Tentatives de déclaration sans résultat trouvé | **≤ 15 %** | au-delà, le test mesure la **couverture du dataset** et non l'UX |

Ce chiffre est rapporté **séparément** des indicateurs d'expérience. Sans lui, un échec de couverture se lirait comme un échec produit, ou l'inverse ([PHASING.md](./PHASING.md) §5).

#### Réserve statistique, à énoncer maintenant

Avec 10 à 30 testeurs, une cible à 75 % porte un intervalle de confiance d'une quinzaine de points. **Ces seuils sont des règles de décision, pas des affirmations statistiques.**

Si un résultat tombe à quelques points d'un seuil, la réponse honnête est **d'élargir l'échantillon**, jamais de déclarer la porte franchie. C'est exactement la dérive que §22.2 cherche à empêcher, et elle survient précisément dans ces cas limites.

### 22.4 Objectifs de Développement
- Version de base avec fonctionnalités essentielles
- Améliorations continues basées sur les retours utilisateurs
- Évolution vers une communauté active
- Expansion de la base de données de référence

## 23. Risques et Solutions

### 23.1 Risques Techniques
- **Entity resolution / canonicalisation du référentiel** : La gestion des identités canoniques est un défi majeur. Exemples :
  - Pokémon Red, Pokemon Red, Pokémon Rouge, ポケットモンスター 赤, Pokémon Version Rouge = même jeu
  - PC, Windows, Windows PC, Steam, Steam Deck = mêmes plateformes
- **Complexité de la gestion des données relationnelles** : Gestion des relations entre jeux, éditions, plateformes et versions localisées
- **Performance avec de grandes quantités de données** : Optimisation pour gérer des millions d'entités
- **Intégration de nouvelles fonctionnalités sans casser l'architecture existante**

### 23.2 🆕 Risques non techniques (ajoutés)
Ils sont plus susceptibles de tuer le projet que les risques techniques ci-dessus :

| Risque | Nature | Atténuation |
|---|---|---|
| **Coût de constitution du référentiel** | charge durable, sous-estimée (§18.6) | périmètre restreint et assumé ; source ouverte compatible |
| **Concurrence établie** (§2) | le créneau « journal de jeux » est occupé | tenir le différenciateur temporel, ne pas dériver vers un clone |
| **Friction de saisie** | la valeur exige un effort que peu consentiront | §24, mesuré dès la Phase 2 |
| **Effet de cold start social** | comparaisons et compatibilité sans valeur à faible population | ne pas conditionner la valeur individuelle au social |
| **Droit sui generis et CGU des sources** (§19.1) | juridique | vérification préalable, licence obligatoire par source |
| **Absence de modèle économique** (§25) | pérennité | à trancher, le coût de curation étant récurrent |

### 23.3 Solutions
- Architecture modulaire et évolutive
- Tests automatisés rigoureux (§17.4)
- Documentation complète du modèle de données
- Méthodologie de développement agile

## 24. Principes d'UX Critiques

### 24.1 Effort Minimal pour la Reconstruction de l'Historique
Le vrai problème produit n'est pas « que peut-on stocker ? », mais :

**Pourquoi quelqu'un passerait-il deux heures à encoder 20 ou 30 ans de jeux vidéo ?**

C'était le trou principal de la v1 des spécifications, et il reste la question centrale du projet.

### 24.2 Exigence UX : Minimalisme de l'Effort
L'effort demandé à l'utilisateur pour reconstruire son historique doit être minimal.

### 24.3 Mécanismes de Rapidité de Saisie
Pour éviter la corvée de saisie, l'application devrait permettre :

#### Sélection Massive de Jeux
**Console → sélection massive de jeux → année/période approximative → terminé ou non**

L'utilisateur sélectionne :
- Super Nintendo
- 1993–1997

L'application lui montre les principaux jeux de cette plateforme (ordonnés par notoriété, §3.3, et filtrés par région, §3.4).

L'utilisateur coche rapidement :
- ✓ joué
- ✓ joué
- ✓ terminé
- ✓ joué
- jamais joué
- ✓ possédé

> 🆕 **« Jamais joué » est une information, pas une absence.** Cocher explicitement « jamais joué » doit être enregistré comme une déclaration positive : cela distingue « il ne l'a pas joué » de « il ne s'est pas prononcé », améliore la qualité du profil, et conditionne la pertinence des recommandations (§14.2).

### 24.4 🆕 Récompenser avant de demander
Un utilisateur ne fournira l'effort de saisie que s'il en perçoit le bénéfice **pendant** la saisie, pas à la fin. La restitution doit donc être immédiate et progressive : la timeline se remplit à mesure que l'on coche, les premières statistiques apparaissent après quelques jeux, la première console saisie déclenche déjà une phrase de récit.

Corollaire : ne jamais imposer un formulaire long avant le premier retour visible, et ne jamais exiger de date précise pour enregistrer un souvenir.

### 24.5 Caractéristique Majeure du Produit
Cette fonctionnalité de saisie rapide pourrait devenir une caractéristique majeure du produit, en rendant l'utilisation de la plateforme attrayante même pour les joueurs ayant des collections importantes.

## 25. 🆕 Questions Ouvertes

Ces points ne peuvent pas être tranchés depuis les documents existants et appellent une décision explicite. Ils sont classés par impact.

| # | Question | Pourquoi elle bloque |
|---|---|---|
| 1 | **Quelle est la nature du projet ?** exercice de R&D, projet personnel, produit commercial ? | Détermine si le modèle économique, la conformité et le coût de curation sont des sujets réels ou hors périmètre |
| 2 | **Quelle capacité humaine pour la curation, le juridique et les tests utilisateurs ?** *(reformulée)* | L'implémentation et les tests étant **automatisés**, le développement ne gouverne plus le calendrier. Le chemin critique devient la curation du dataset, l'acquisition des jaquettes et le recrutement des testeurs — trois postes que l'automatisation ne comprime pas ([PHASING.md](./PHASING.md) §2) |
| 3 | **Modèle économique** | Le référentiel est un coût récurrent (§18.6) ; l'hébergement et la conformité aussi |
| 4 | **Marché visé : francophone ou international ?** | Conditionne l'i18n (§20), le référentiel régional (§3.4) et le benchmark concurrentiel (§2) |
| 5 | **Périmètre des plateformes** : consoles uniquement, ou PC, arcade, mobile ? | Le PC et le mobile font exploser le volume du référentiel et affaiblissent la notion d'édition |
| 6 | **Position sur le temps de jeu** (§11.3) | Affiché, facultatif, ou absent — impacte le modèle et la page publique |
| 7 | **Hébergement et localisation des données** | Découle de §19.3 |

> 🆕 **La question des visuels a quitté cette liste** pour devenir un livrable de Phase 0 (§19.2). Elle n'est pas au même rang que les autres : elle conditionne la performance de la sélection massive, donc la validité même du test utilisateur de Phase 2. Ce qui reste à trancher, c'est la voie retenue — sources ouvertes, licence, contribution, tuiles générées — pas l'opportunité d'y répondre.
