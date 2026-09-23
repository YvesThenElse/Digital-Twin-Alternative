# Phasage du Projet : Plateforme Vidéoludique

> Plan d'implémentation de [SPECIFICATION.md](./SPECIFICATION.md), découpé en phases séquentielles avec critères de sortie explicites.
> Principe général : **valider le comportement utilisateur avant l'architecture.**
>
> **Version 2** — révision alignée sur SPECIFICATION.md v2 : renvois de sections mis à jour, hypothèse d'effectif explicitée (§2), livrables de cadrage complétés (§3), périmètre du POC élargi aux prérequis de la sélection massive (§4), menace sur la validité des tests utilisateurs (§5), migration des références entre versions de dataset (§6), et **révision du critère de sortie des imports** (§7), dont la formulation initiale reposait sur une capacité que les sources n'offrent pas.

## 1. Contexte et principes directeurs

Le cahier des charges positionne clairement le cœur du produit comme la **mémoire vidéoludique personnelle** du joueur (§1.3), avec le social et les recommandations relégués à des phases ultérieures (§1.4). Ce planning s'appuie sur ce positionnement : chaque phase sert d'abord la reconstruction et la valorisation de l'histoire personnelle avant d'étendre le périmètre.

Quatre principes guident le découpage :

1. **Le POC prouve un comportement, pas une architecture.** Il ne s'agit pas de démontrer que le système tient 10 millions de jeux, mais qu'un utilisateur reconstruit rapidement son histoire et trouve le résultat intéressant.
2. **Pas d'optimisation prématurée.** Formats binaires (MemoryPack…), cache distribué, CDN : tout cela n'a de sens qu'après validation produit. Le cahier des charges cite MemoryPack (§17.1), mais ce choix n'est pas verrouillé.
3. **Portes de sortie entre phases.** Une phase ne démarre que lorsque le critère de sortie de la précédente est atteint ; sinon on itère sur le produit, pas sur l'architecture.
4. **La réduction de friction est la priorité produit.** L'effort de reconstruction doit rester minimal (§24) : les imports (Phase 4) sont plus importants que le social (Phase 5).

## 2. Vue synthétique

| Phase | Objectif | Durée indicative |
|---|---|---|
| 0 | Modèle + cadrage | 1–2 sem. |
| 1 | POC fonctionnel | 3–5 sem. |
| 2 | Validation utilisateur | 2–4 sem. |
| 3 | MVP exploitable | 6–10 sem. |
| 4 | Imports et réduction de friction | 4–8 sem. |
| 5 | Social léger | 4–6 sem. |
| 6 | Intelligence et recommandation | 6–10 sem. |
| 7 | Industrialisation / scale | continue |

**Horizon Phase 0 → 6 : environ 26 à 45 semaines (6 à 11 mois)** en séquentiel, selon les résultats des validations. La Phase 7 est continue et démarre dès que la charge le justifie.

> ⚠️ **Ces durées supposaient une équipe humaine. Ce n'est pas le cas ici : l'implémentation et les tests sont automatisés.** Le tableau ci-dessus est donc conservé pour mémoire, mais il ne décrit plus la réalité — et surtout, il désigne le mauvais chemin critique.
>
> ### Ce que l'automatisation comprime, et ce qu'elle ne comprime pas
>
> | Nature du travail | Compressible | Pourquoi |
> |---|---|---|
> | Écrire le code, les tests, les migrations | **fortement** | c'est là que l'automatisation est la plus efficace |
> | Déboguer, refactorer, documenter | fortement | idem |
> | **Curation du dataset** | **non** | rédiger va vite ; *vérifier* est le coût réel, et c'est précisément là que la génération automatique est peu fiable — dates de sortie, titres régionaux, disponibilité par région |
> | **Acquisition des jaquettes** | **non** | travail juridique et contractuel |
> | **Vérification juridique des sources** | **non** | jugement humain, éventuellement conseil |
> | **Tests utilisateurs (Phase 2)** | **non** | dix à trente personnes à recruter, recevoir, observer. C'est du **temps calendaire**, pas de la charge |
> | **Décisions de porte** | **non** | « est-ce que ce profil me ressemble » n'est pas automatisable |
> | **Amorçage social (Phase 5), masse de données (Phase 6)** | **non** | conditionnés à des utilisateurs réels |
>
> ### Le chemin critique se déplace
>
> Dans le plan initial, le développement dominait. Il ne domine plus. Le chemin critique devient : **curation du dataset → jaquettes → recrutement et tests utilisateurs**, c'est-à-dire exactement les trois postes que personne n'a commencés.
>
> Conséquence directe et contre-intuitive : **la Phase 0 s'allonge au lieu de raccourcir.** Ses une à deux semaines supposaient que le cadrage était léger devant le développement. Le développement ayant fondu, la curation et le juridique deviennent le poste principal du projet, et ils étaient sous-estimés.
>
> ### Deux conséquences stratégiques
>
> **On peut se permettre d'échouer à la porte de Phase 2.** Quand construire coûte peu, un retour en Phase 1 cesse d'être un désastre calendaire. La porte devient réellement utilisable — on peut la manquer deux fois et itérer, ce qu'une équipe humaine ne pouvait pas se permettre. C'est un avantage stratégique, pas une excuse pour l'assouplir.
>
> **Il faut construire *moins* avant de tester, pas plus.** La tentation inverse est forte : puisque c'est rapide, autant tout bâtir. Ce serait produire vite un MVP que les tests condamneront. Les portes de phase deviennent la principale défense contre la construction en avance de phase, et non une formalité.
>
> ### Ce qu'il faut estimer désormais
>
> La question n'est plus « combien de développeurs » mais **quelle capacité humaine pour la curation, le juridique et les tests utilisateurs** — les seuls postes qui gouvernent encore le calendrier.
>
> Elles n'incluaient pas non plus la **constitution du référentiel** au-delà du dataset POC, qui reste un poste distinct et durable ([SPECIFICATION.md](./SPECIFICATION.md) §18.6) — et qui devient, dans ce contexte, le poste dominant.

## 3. Phase 0 — Cadrage technique et produit

**Durée : 1 à 2 semaines.**
**Objectif : verrouiller les concepts avant de coder.**

### Livrables

- **Modèle de domaine initial** → [MODELE-DE-DOMAINE.md](./MODELE-DE-DOMAINE.md) ✔ ;
- **Distinction Work / GameVersion / Release / Edition** (affinement du modèle Game / Release / Edition de §6.2) ;
- **Modèle PlayerEvent / Experience / OwnedItem** (§5 architecture événementielle, §6.2 UserGameExperience / UserOwnedItem) ;
- **TemporalValue et gestion de l'incertitude temporelle** (§7.3 : ExactDate, Month, Year, Range, ApproximateYear, Age, Unknown) ;
- **Format des identifiants canoniques** — **✔ tranché** ([MODELE-DE-DOMAINE.md](./MODELE-DE-DOMAINE.md) §10.2) : `CanonicalId` opaque, typé et ordonné dans le temps ; slug mutable séparé pour les URL ; index compact interne réservé à la Phase 7 ;
- **Stratégie minimale de sourcing des données** (§18.5) — **✔ tranchée** ([VERIFICATION-JURIDIQUE.md](./VERIFICATION-JURIDIQUE.md) §5) : **deux sources réutilisables et elles seulement** — Wikidata (CC0) en amorçage, **Wikipédia (CC BY-SA 4.0) en complément**, avec attribution et partage à l'identique ; consultation manuelle seulement pour vérifier une entrée curée, et aucun script sur une source tierce. ⚠️ La formulation initiale (« aucune autre source ») excluait Wikipédia sur un motif — l'absence de droit de rediffusion — qui ne lui est pas applicable ; l'ajouter a fait passer la couverture régionale de 56 % à 92 % des œuvres ;
- **Définition des KPI du POC** — **✔ engagé** le 8 septembre 2026 (§22.3) : cinq familles, chacune avec sa définition opérationnelle et la décision associée si elle est manquée. Révisables tant qu'aucun testeur n'a été reçu, plus après ;
- **Ordonnancement des `TemporalValue`** (§7.5) — **✔ tranché** ([ORDONNANCEMENT-TEMPOREL.md](./ORDONNANCEMENT-TEMPOREL.md)) : forme normale en intervalle fermé, point représentatif réduit à une clé de tri, algèbre à sept relations, cascade de départage déterministe, zone sans date, requêtes strict/permissif et projections à trois valeurs. Onze vecteurs de test accompagnent la décision. C'était le point le plus sous-spécifié du modèle et il conditionne toute la timeline ;
- **Décision « modèle événementiel » vs « infrastructure d'event sourcing »** (§5.5) — **✔ tranchée** ([MODELE-DE-DOMAINE.md](./MODELE-DE-DOMAINE.md) §5) : table en ajout seul dans PostgreSQL + projections calculées à la lecture, matérialisées seulement quand la mesure le justifie. Pas d'event store dédié, pas de framework CQRS. La différence structurante avec un event sourcing classique est le **double axe temporel** `OccurredAt` / `RecordedAt` — déclarer en 2026 avoir terminé un jeu en 1998 — implémenté et testé ;
- **Stratégie de correction et de rétraction des événements** (§5.3) — **✔ tranchée** ([MODELE-DE-DOMAINE.md](./MODELE-DE-DOMAINE.md) §5) : `SupersededBy` sur `PlayerEvent`, révision conservée côté système sans être exposée. Les invariants réversibles de `PlayDeclaration` (6 et 8) et la désignation de favori — qui rétrograde le précédent et répare les collections fautives — sont couverts par des tests ;
- **Stratégie d'effacement** — **✔ tranchée** ([MODELE-DE-DOMAINE.md](./MODELE-DE-DOMAINE.md) §10.1) : purge physique partitionnée par utilisateur. Le crypto-shredding sert quand on ne *peut pas* supprimer ; ce n'est pas notre cas, et il faudrait y revenir avant d'adopter un magasin qui l'imposerait ;
- **Benchmark concurrentiel** (§2) — **✔ fait** ([BENCHMARK-CONCURRENTIEL.md](./BENCHMARK-CONCURRENTIEL.md), 20 septembre 2026) : dix produits confrontés aux cinq différenciateurs. Le différenciateur temporel tient — c'est **le seul** —, mais quatre des cinq revendications de §2.3 sont occupées pris isolément, et le vrai avantage (la saisie massive) n'y figurait pas. **§2.3 a été réécrit en conséquence** le 21 septembre 2026 : la sélection massive y devient le différenciateur de tête, les cinq revendications passent d'arguments à exigences, et la réserve sur la *demande* en matière d'incertitude temporelle est inscrite comme question de Phase 2 ;
- **Vérification juridique des sources envisagées** (§19.1) — **✔ faite** ([VERIFICATION-JURIDIQUE.md](./VERIFICATION-JURIDIQUE.md), 20 septembre 2026) : onze sources examinées, **deux réutilisables** : Wikidata (CC0) et Wikipédia (CC BY-SA 4.0). La première version du document n'en retenait qu'une, ayant écarté Wikipédia sans l'évaluer. ⚠️ **La voie « sources ouvertes » pour les jaquettes n'existe pas** — Wikimedia Commons n'héberge pas de jaquettes. La question ouverte n°1 a été tranchée dans la foulée (**R&D**), ce qui fixe la posture sur les visuels et débloque la grille desktop ;
- **Estimation du coût de curation du référentiel** au-delà du POC (§18.6) — **✔ estimée** ([COUT-DE-CURATION.md](./COUT-DE-CURATION.md)) : **≈ 50 à 55 h pour le POC**, et **6 mois à 3,5 ans-personne** pour un référentiel de 30 000 entrées — donc pas de vérification exhaustive, mais trois niveaux indexés sur `Notability`. Un protocole de calibration sur 30 entrées remplace les hypothèses par des mesures ;
- **Décision sur les visuels** (§19.2) — **✔ tranchée** : tuiles générées retenues comme socle permanent ; **vraies jaquettes requises pour les 100 à 300 titres du POC**, faute de quoi le test de Phase 2 mesurerait une vitesse de lecture au lieu d'une vitesse de reconnaissance ; grille desktop conditionnée à leur obtention — **condition levée** : la voie d'acquisition est tranchée ([VERIFICATION-JURIDIQUE.md](./VERIFICATION-JURIDIQUE.md) §3.3), reprise sur le web pour la démonstration sous cinq conditions écrites, le projet étant un exercice de R&D. Reste à faire : **l'acquisition elle-même**, avec la `Source` de chaque visuel conservée dès l'acquisition — la rattraper après coup est impossible ;
- **Langage visuel** ([ecrans/00-langage-visuel.md](./ecrans/00-langage-visuel.md)) : palette, système d'époques, typographie, formes d'état, densité par point de rupture. Livrable de cadrage au même titre que le modèle de domaine, parce qu'il détermine ce qui est constructible en Phase 1 sans reprise.

### Périmètre volontairement restreint

> ✅ **Le dataset POC existe** — [dataset/](./dataset/), produit les 20 et 21 septembre 2026 : **221 œuvres, 593 sorties** sur les huit plateformes visées, `Notability` classée à la main, provenance portée sur chaque donnée, licence **CC BY-SA 4.0** (Wikidata CC0 + Wikipédia CC BY-SA). 97 % des identités résolues automatiquement, 3 % arbitrées à la main et documentées. Ses invariants sont vérifiés par du code (`DatasetLoader`), pas par relecture.
>
> **706 → 663** : les 43 sorties retirées étaient des **rééditions prises pour des sorties d'origine**. Le dataset annonçait Super Mario Bros. en PAL 2011 et Ocarina of Time en PAL 2003. Les déclarations de date sont désormais filtrées sur la plateforme qu'elles qualifient.
>
> **Couverture au 21 septembre** : région sur **99 % des sorties** (591 / 593) ; date au jour sur **96 % des œuvres** (544 sorties au jour, 18 au mois, 31 à l'année seule) ; **218 jaquettes sur 221**, chacune avec son URL source, son article et son régime de licence conservés.
>
> Chaque plateforme porte son **année de lancement**, et aucune sortie ne la précède. L'invariant a été posé après qu'une date Famicom de 1987 se soit retrouvée attribuée à la Game Boy, sortie en 1989 — une sortie sur 592, qui n'aurait jamais levé d'erreur.
>
> **Les trois manquantes sont des refus assumés.** Le lien Wikidata de « Mario Kart 8 Deluxe » et de « Pokémon Yellow » vise une **section** d'un article plus large : suivre la redirection aurait donné la jaquette de Mario Kart 8 sur Wii U et celle de Pokémon Rouge/Bleu. « Sim City » désigne l'entité « version Super Nintendo de 1991 », qui n'a pas d'article ; l'article parent porte la boîte PC de 1989. Les trois auront une tuile générée (§19.2).
>
> **663 → 590, et c'est un gain.** L'analyseur d'infobox ne reconnaissait ni `{{vgr}}`, ni `{{vgrelease new}}`, ni les conteneurs `{{ubl}}` — qu'il supprimait avec leur contenu —, ni les codes de région combinés « NA/PAL », ni les dates écrites « 22 May 2000 ». Vingt-deux articles sur vingt-trois portaient l'information ; c'est l'extraction qui échouait, en silence. Les corriger a ajouté 29 sorties régionales et permis d'en retirer 91 : la date non qualifiée servait de repli quand rien d'autre n'existait, et produisait depuis un **doublon dégradé** — « Gradius · ? · 1986 » à côté de « Gradius · Japon · 25 avril 1986 », pour une seule et même sortie.

> ✅ **Ce point est clos structurellement** (21 septembre 2026). Le dataset distinguait mal « pas de sortie PAL » de « sortie PAL non renseignée » — deux réponses qui cassent la reconnaissance en sens inverse. Le champ `region_status` porte désormais **trois états** : sortie attestée, non-sortie **établie** et motivée, ou rien d'établi. 22 non-sorties sont arbitrées, 35 régions restent explicitement inconnues.
>
> ⚠️ Et la mesure qui justifie cette prudence : l'infobox anglophone liste Banjo-Kazooie, Crash Bandicoot et Grand Theft Auto III en NA/EU seulement, alors que **les trois sont sortis au Japon**. Le silence d'une source n'est pas une preuve d'absence, et le biais a une direction.

On ne cherche pas encore à avoir une base exhaustive. Pour le POC, un dataset de référence de **100 à 300 jeux** répartis sur un cœur de plateformes — **NES, SNES, Game Boy/GBA, N64, PS1, PS2 + Switch** — suffit largement ; on l'étend ensuite si la validation passe. À cette taille, une curation manuelle est réaliste (voir décision du cadrage).

### Critère de sortie

> On sait modéliser proprement un parcours utilisateur complexe sans bricolage — par exemple l'historique temporel de §7.1 (Game Boy 1991 → retrogaming 2018) ou la chaîne d'éditions de §6.1 (FFVII : PS PAL Platinum → version numérique PS3 → remake PS5).

Ces deux parcours, plus les cas limites de §6.3 (remake, compilation, rétrocompatibilité), sont écrits sous forme de **jeux d'événements de référence** et conservés comme tests permanents (§17.4). Le modèle est validé quand ils se rejouent en produisant l'état attendu — pas quand le diagramme paraît élégant.

### Verdict — 21 septembre 2026

> **Le critère de sortie est franchi. La Phase 0 ne l'est pas entièrement.**

Ces deux choses ne sont pas la même, et les confondre serait la première
entorse au principe des portes.

**Ce que le critère demandait est atteint.** Les huit cas de validation
existent comme tests permanents et se rejouent en produisant l'état attendu :

| Cas | Parcours | Origine |
|---|---|---|
| 1 | trente ans avec une console revendue puis rachetée | §7.1 |
| 2 | le remake est une autre œuvre, reliée mais distincte ; la même œuvre possédée à deux époques | §6.1, §6.3 |
| 3 | joué chez un cousin, sans jamais posséder d'exemplaire | §5.1 |
| 4 | renseigner l'année de naissance recalcule tous les moments | §7.3 |
| 5 | posséder la compilation ne fait pas posséder les jeux | §6.3 |
| 6 | jouer un jeu Mega Drive sur Switch change la sortie, pas l'œuvre | §6.3 |
| 7 | une fiche scindée redirige les événements sans perte, même en chaîne | §10.2 |
| 8 | trois fiches de la source désignent une seule œuvre, sans doublon au profil | §3.2 |

Un neuvième test interdit qu'un cas disparaisse de la liste sans qu'on s'en
aperçoive. **365 tests au total, tous verts**, contrôlés par mutation item
par item. Le modèle temporel — forme normale, algèbre à sept relations,
cascade de départage, cohérence causale — tient sur un parcours de trente ans
sans bricolage.

**Ce qui reste ouvert**, et qui n'appartient pas au critère de sortie mais à
la Phase 0 :

| Reste | Nature | Bloquant pour |
|---|---|---|
| **32 régions non établies**, dont 27 NTSC-J — sur les 57 qu'aucune source n'attestait, 22 ont été arbitrées en non-sorties motivées | curation | **décidé le 21 septembre : on les laisse `inconnu` pour le POC.** La Wikipédia japonaise les porterait, mais son infobox a un autre format : un second analyseur serait une seconde source d'échecs silencieux, pour une valeur qui n'apparaîtra qu'à l'internationalisation réelle |
| **1 sortie sans aucune région** : Pokémon Yellow sur Game Boy, dont l'article n'a pas de champ `released` | curation | marginal |
| **40 œuvres sans date au jour** | curation | rien : l'incertitude est affichée, c'est la décision prise |
| **`NOTABILITE.md` en attente d'annotation** | décision humaine | le réordonnancement déplace les `CanonicalId` — rien ne doit toucher à l'ordre avant |
| **5 œuvres sans jaquette** | acquisition | marginal ; tuile générée en repli |

**Ce que la distinction « pas de sortie PAL » / « sortie PAL non renseignée »
coûte** reste entier : la source ne les distingue pas, et les deux réponses
cassent la reconnaissance en sens inverse. Le dataset porte l'incertitude
plutôt que de la trancher au hasard — ce qui est la bonne posture, mais
reporte l'arbitrage sur la curation.

**Décision.** La Phase 1 peut démarrer sur le modèle, qui est validé. Elle ne
doit pas démarrer sur l'hypothèse que le référentiel est complet : il ne
l'est pas, il le dit, et le POC doit afficher cette incertitude plutôt que la
masquer.

## 4. Phase 1 — POC fonctionnel

**Durée : 3 à 5 semaines.**

Le POC doit répondre à **une seule question** :

> Est-ce qu'un utilisateur peut reconstruire rapidement une partie significative de son histoire vidéoludique et trouver le résultat intéressant ?

C'est cohérent avec le point UX central du cahier des charges (§24) : réduire au maximum l'effort de reconstruction.

### Périmètre (limité volontairement)

- Recherche d'un jeu ou d'une console ;
- **Sélection en masse de jeux par plateforme** (mécanisme clé §24.3 : console → période approximative → cocher joué / terminé / possédé) ;
- Statuts simples : **joué / terminé / possédé**, et **« jamais joué » comme déclaration explicite** (§24.3) ;
- Dates ou périodes approximatives (TemporalValue) ;
- Événements utilisateur (PlayerEvent) ;
- Timeline ;
- Quelques statistiques ;
- Page de profil simple ;
- Données de référence locales.

#### « Recherche d'un jeu ou d'une console » — ce que la ligne recouvre

Le périmètre ci-dessus porte cette ligne depuis la v1, et elle a longtemps
été lue comme un écran. Elle est tenue, **le 23 septembre 2026**, par un
**filtre dans la liste** de [E02](./ecrans/E02-selection-massive.md) — son
repère B le prévoit déjà : « compteur, filtre de recherche dans la liste ».

| Ce qui répond à quoi | Où | Phase |
|---|---|---|
| « je sais que j'y ai joué, où est-il dans ces 221 lignes ? » | **filtre E02, repère B** | **Phase 1**, livré |
| « ce titre n'est pas au référentiel » | **saisie libre** (§3.5) | Phase 1, livré |
| « je cherche un jeu, une console, une personne, n'importe où » | [**E06**](./ecrans/E06-recherche.md), recherche transverse | **Phase 3**, pas avant |

**Pourquoi E06 n'est pas en Phase 1.** Une recherche transverse suppose qu'il
y ait plusieurs espaces à traverser — un profil qui dure, une collection, des
personnes — et la Phase 1 n'en a qu'un : le catalogue d'une plateforme, déjà
sous les yeux. Y ajouter un écran de recherche ferait **quitter la liste**
pour revenir au même endroit, sur le geste le plus répétitif du produit ;
c'est exactement ce que le filtre évite, et c'est la moitié de sa valeur.

**Ce que cela laisse dehors, sciemment** : chercher une console (la grille
d'E01 en montre six, et le choix est une reconnaissance, pas une recherche),
et chercher un titre hors de la plateforme ouverte. Les deux attendent que
le produit ait plus d'un espace à parcourir.

### Ajouts au périmètre (issus de la révision v2)

Quatre éléments sont remontés en Phase 1 parce que la fonctionnalité centrale — la sélection massive — ou le critère de sortie de la Phase 2 en dépendent directement :

| Ajout | Pourquoi il ne peut pas attendre |
|---|---|
| **Score de notoriété** sur les sorties (§3.3) | « L'application montre les principaux jeux de la plateforme » n'a pas de sens sans un ordre. Sur 100 à 300 jeux, un classement manuel suffit |
| **Région de sortie** PAL / NTSC-U / NTSC-J (§3.4) | Un joueur PAL à qui l'on propose la ludothèque NTSC-J ne se reconnaît pas. La région conditionne aussi les dates affichées |
| **Jeu absent du référentiel** (§3.5) | Avec 100 à 300 jeux, le cas est permanent. Sans issue, le testeur est bloqué au premier titre manquant et le test ne mesure plus l'UX |
| **Souvenir minimal** : note libre sur un événement (§9) | C'est ce qui produit « oui, ça me ressemble » — exactement le critère de sortie de la Phase 2. Coût très faible, effet direct sur la porte suivante |

Le **responsive** est une contrainte de conception dès cette phase, pas une amélioration ultérieure (§21.2) : cocher rapidement une longue liste est un geste tactile, et un profil partagé se consulte majoritairement sur mobile. Plus précisément, deux dispositions sont à livrer et non une seule étirée — **liste dense sur mobile, grille visuelle sur desktop** ([ecrans/00-langage-visuel.md](./ecrans/00-langage-visuel.md) §6).

La **restitution doit être immédiate** pendant la saisie (§24.4) : la timeline se remplit à mesure que l'on coche. Un POC qui ne montre le résultat qu'à la fin ne teste pas la bonne chose.

Trois exigences complémentaires issues de la révision de conception :

| Exigence | Pourquoi en Phase 1 |
|---|---|
| **Saisie en deux passes** ([E02](./ecrans/E02-selection-massive.md)) : un tap = « joué », affinage terminé / possédé optionnel | Trois bascules par ligne ne tiennent pas sur un écran de téléphone sans tronquer le titre — or la reconnaissance du titre est la mécanique même de l'écran |
| **Écriture locale et file de synchronisation** | On reconstitue ses souvenirs dans un canapé ou un train ; une saisie qui dépend du réseau casse là où elle sert |
| **Vignettes** (jaquette ou tuile générée) | Sans elles, la grille desktop devient une mosaïque grise moins lisible qu'une liste, et l'écran perd son avantage |

### Architecture du POC

| Brique | Choix | Justification |
|---|---|---|
| Backend | **.NET 10 LTS + EF Core 10** (verrouillé) | la spec dit « .NET 6+ » mais c'est obsolète ; .NET 8 arrive en EOL en nov. 2026, .NET 10 est supporté jusqu'en nov. 2028 |
| Données utilisateur | **PostgreSQL 17+** | transactionnel, personnel, continuellement modifié (§15) |
| Dataset de référence | SQLite ou fichier précompilé simple (JSON) | pas d'optimisation prématurée ; le format binaire arrive en Phase 7 |
| Frontend | **React + TypeScript (Vite)** (verrouillé) | timeline et sélection en masse = UI interactives, SPA justifiée ; TanStack Query pour l'état serveur |
| Dev local | Docker Compose (Postgres seul) | le POC tourne en local ou sur une instance unique |
| Microservices | ❌ pas encore | mono-app jusqu'à preuve du contraire |
| Moteur de recommandation | ❌ pas encore | Phase 6 |
| Social complet | ❌ pas encore | Phase 5 |

**Note sur MemoryPack** : le cahier des charges le cite actuellement (§17.1), mais il n'est pas verrouillé. Le benchmark se fera en Phase 7, avec une charge réelle.

### Critère de sortie

> Au moins un utilisateur test reconstruit une partie significative de son histoire avec un effort faible et déclare trouver le résultat intéressant (premières mesures des KPI définis en Phase 0).

### Bilan — 21 septembre 2026

> **Le geste central fonctionne de bout en bout. Le POC n'est pas en état d'être montré à un testeur.**

Les deux propositions tiennent ensemble, et les confondre ferait perdre la
Phase 2 pour une raison qui n'a rien à voir avec le produit.

#### Ce qui fonctionne, et qui est vérifié

Un parcours réel — console, période, trente titres cochés, un souvenir, la
timeline — est joué par **un test Playwright sur les deux dispositions**, en
2,5 secondes. Il part d'un profil vierge, compte les gestes (**35 pour 30
titres**, le KPI de §22.3) et vérifie le nombre exact de moments.

| Livré | État |
|---|---|
| Sélection massive par plateforme et période (§24.3) | écran + API |
| Restitution immédiate pendant la saisie (§24.4) | la bande d'époque grandit à chaque tap, sans rechargement |
| Score de notoriété par plateforme (§3.3) | API, ordonne l'écran |
| Région et non-sortie, **quatre** états (§3.4) | écran + API |
| Incertitude temporelle affichée (§7.3) | les sept granularités, rendu normalisé |
| Souvenir minimal (§9) | écran + API |
| Deux dispositions, pas une étirée (§21.2) | liste sous 1024, grille au-delà |
| Journal en ajout seul, deux axes (§5) | PostgreSQL, déclencheur SQL |
| Aucun libellé en dur (§20) | un test lit les sources et échoue |

**509 tests .NET, 120 tests front, 1 parcours × 2 dispositions.**

#### Ce qui manque, et pourquoi le POC n'est pas montrable

| Manque | Conséquence pour un test de Phase 2 |
|---|---|
| **Les jaquettes ne sont pas servies.** L'API annonce `/covers/{id}` ; aucun point d'entrée ne les rend | La grille desktop afficherait **218 images cassées** — or la reconnaissance est la mécanique centrale de E02 (§19.2). **Bloquant** |
| **E03 n'existe pas.** La timeline se résume à un compte de moments | Le testeur ne voit pas son histoire ; c'est pourtant ce qui doit produire « ça me ressemble ». **Bloquant** |
| **La passe 2 n'est pas à l'écran.** L'API accepte achèvement et provenance, aucun écran ne les propose | Le profil reste binaire : joué ou rien. Perte de richesse, pas de blocage |
| **« Jamais joué » n'est pas à l'écran** (§24.3) | L'information positive la plus simple à donner est inaccessible |
| **Le jeu absent du référentiel n'est pas saisissable** (§3.5) | Sur 221 titres, le cas est permanent : le testeur s'arrêtera au premier titre manquant. **Bloquant** |
| Recherche, statistiques, page de profil (§4) | Hors du périmètre livré ; leur absence se voit |
| `ZoneSansDate` est écrit et testé, **monté nulle part** | Symptôme du manque d'E03, pas un défaut en soi |

#### Ce que le loupe de l'itération dit de la méthode

Deux de ces manques n'ont été trouvés qu'en **faisant l'inventaire**, pas par
les tests :

- l'URL de jaquette est annoncée et ne résout pas. Le test de l'item 13
  vérifiait qu'elle vaut `null` quand il n'y a pas de jaquette ; **jamais
  qu'elle résout quand il y en a une**. Playwright, lui, n'échoue pas sur une
  image cassée ;
- un composant écrit, testé, et monté nulle part.

> Les deux appartiennent à la même famille que les défauts recensés tout au
> long de ce dépôt : **ce qui manque ne lève pas d'erreur**.

#### Décision

La Phase 2 ne peut pas s'ouvrir. Trois manques sont bloquants — les
jaquettes, l'écran de timeline, la saisie d'un titre absent — et chacun
ferait mesurer autre chose que ce que la porte veut mesurer. Un testeur
devant 218 images cassées ne juge pas la reconstruction de son histoire, il
juge une application en panne.

Le reste — passe 2, « jamais joué », recherche, statistiques, profil — est
une perte de richesse, pas un obstacle.

### Clôture de la Phase 1 — 21 septembre 2026

> **Les trois manques bloquants sont levés. Le POC est montrable ; la Phase 1
> n'est pas pour autant « réussie ».**

La distinction est celle du critère de sortie lui-même : il parle d'un
**utilisateur test**, pas d'un dépôt. Ce qui est acquis, c'est le droit
d'ouvrir la Phase 2 — la porte, elle, se franchit avec des testeurs.

#### Ce qui a levé les blocages

| Blocage du bilan précédent | Levée |
|---|---|
| Les jaquettes annoncées et non servies | `/covers/{id}` sert depuis le manifeste ; le catalogue n'annonce que les fichiers **présents sur le disque**, et le parcours échoue si une image de la grille ne **charge** pas |
| E03 inexistante | L'axe rend chaque moment avec sa forme temporelle et l'accent de son époque ; un lot coché d'un passage s'y montre comme **une bande repliée** ; la zone sans date est montée |
| Le jeu absent non saisissable | Saisie libre **sans quitter la sélection**, dans le **même lot**, comptée dans la récompense, relue sur la timeline sous son titre et **marquée** hors référentiel |

S'y ajoutent deux compléments décidés après la clôture : le **souvenir sur
un titre saisi** — §9 y place le contenu le plus personnel, l'API l'acceptait
déjà, aucun écran ne le proposait — et la **plateforme portée par
l'événement**, sans laquelle un indicateur engagé de §22.3 n'existait pas
(voir plus bas).

**523 tests .NET, 149 tests front, 1 parcours × 2 dispositions.**

Le parcours mesure **40 gestes pour 31 titres**, dont 32 gestes de
déclaration — soit **1,03 geste par jeu déclaré** contre une cible à 1,35
(§22.3 A). C'est un **plancher** obtenu sans hésitation ni retour en
arrière : il prouve que le chemin optimal tient dans le budget, pas que les
testeurs l'y tiendront.

#### Ce qui manque encore, et ce que ça coûte

| Manque | Conséquence pour la Phase 2 |
|---|---|
| **La passe 2 n'est pas à l'écran** — achèvement, provenance, affect | Le profil reste binaire : joué ou rien. Perte de richesse, **pas de blocage** |
| **« Jamais joué » n'est pas à l'écran** (§24.3) | L'information positive la plus simple à donner reste inaccessible. **Pas de blocage** |
| **Aucune instrumentation produit** | Deux indicateurs de §22.3 A — gestes par jeu, achèvement du parcours — se comptent **à la main** sur enregistrement d'écran. Contrainte de protocole, pas de produit |
| Recherche, statistiques, page de profil (§4) | Hors périmètre livré ; leur absence se voit |

#### Ce que la préparation du test a fait apparaître

En éprouvant les requêtes de mesure **contre le schéma réel** plutôt qu'en
les relisant, celle de §22.3 B — « testeurs ayant déclaré sur ≥ 2
plateformes », cible engagée à 75 % — rendait `0`.

Le lot portait la machine, l'API la validait, et l'événement ne la gardait
pas. La table `play_declarations` n'est écrite que pour les jugements de
passe 2 : un tap « joué » n'y laisse rien. **Un zéro se lit « aucune
plateforme », jamais « la donnée n'existe pas »** — la porte serait tombée
sur un indicateur qui n'existait pas.

La déduire de l'œuvre aurait fonctionné : **une seule des 221 œuvres du
dataset est multi-plateforme**. C'est exactement ce qui rend la déduction
dangereuse — elle aurait été juste aujourd'hui et fausse dès que le
référentiel grandit, sans rien pour le signaler. La plateforme est donc
**enregistrée**, parce que c'est une donnée que le joueur a fournie et que le
système jetait.

> Même famille que tous les défauts de ce dépôt : **ce qui manque ne lève
> pas d'erreur**. Cette fois, le manque était dans l'instrument de mesure —
> l'endroit où il aurait coûté le plus cher, parce qu'il aurait condamné le
> produit au lieu de se signaler.

#### Décision

**La Phase 2 peut s'ouvrir.** Le protocole opérationnel est écrit avant le
premier testeur, dans [`PROTOCOLE-DE-TEST.md`](./PROTOCOLE-DE-TEST.md) :
recrutement et critère opposable, déroulé et ce que l'animateur ne dit
jamais, requêtes de mesure **exécutées et vérifiées**, codage de la question
aveugle, restitution.

La passe 2 et « jamais joué » ne sont **pas** construits avant le test. Les
ajouter maintenant supposerait de savoir ce qui manque au profil pour qu'il
ressemble à quelqu'un — ce que seul le test dira.

### Audit des surfaces — 22 septembre 2026

> **Non. Le POC ne peut pas être montré à un testeur — pour une raison qui
> n'était dans aucun bilan précédent : il n'a pas d'apparence.**

Seize surfaces criblées, une par itération, chacune avec ses réponses,
fichier et ligne à l'appui, dans [`TODO-AUDIT.md`](./TODO-AUDIT.md). Le
crible venait de trois défauts que l'usage réel avait trouvés et que 709
tests n'avaient pas vus ; il en a trouvé vingt-trois de plus, et a gagné une
quatrième question en chemin.

#### Ce qui bloque

| | Pourquoi c'est bloquant |
|---|---|
| **Aucune feuille de style** (31) | Pas un fichier CSS, trois styles en ligne, des classes référencées qui n'existent pas. Les six sections du langage visuel ne sont pas implémentées : ni la palette d'époques, ni le cadre 3:4, ni les cibles de 56 px, ni la densité par point de rupture, ni le mouvement. **`data-disposition="grille"` et `"liste"` rendent la même chose** — le parcours de bout en bout vérifie un attribut, pas une disposition. La bande d'époque, que §24.4 désigne comme la seule réponse à « pourquoi passer deux heures à saisir », est **invisible** : ses barres n'ont pas de conteneur. |
| **Décocher ne se persiste pas** (22) | Le geste le plus fréquent de l'écran — le dépôt le dit lui-même — ne quitte pas le navigateur. Depuis que l'état est relu, la correction se défait sous les yeux du testeur au premier rechargement. |
| **Le moment ne dit pas ce qu'il est** (26) | Un jeu affiné apparaît en trois lignes identiques : `type` et `targetKind` sont rendus par l'API et jetés par l'écran. Le testeur lit une duplication, pas une histoire. |
| **Le souvenir n'atteint jamais la timeline** (39) | §9.1 fait de cette section le porteur direct du « oui, ça me ressemble » — c'est-à-dire du critère même de la porte. Zéro occurrence dans la vue. |

Les trois derniers se corrigent en heures. Le premier est un chantier, et
c'est lui qui décide du calendrier.

#### Ce qui a été corrigé pendant l'audit

Huit défauts, chacun avec son test et son contrôle par mutation :
les souvenirs jamais relus ; l'état de sélection périmé au changement de
période ; « Recharger la liste » qui quittait l'écran ; l'échec réseau rendu
par un chargement éternel ; quatre chemins asynchrones sans `catch` ; la
date de sortie qui ignorait la région — **97 œuvres sur 221**, jusqu'à six
ans d'écart ; l'accent d'époque qui peignait « 8 bits » une date inconnue ;
la période antérieure à la machine, refusée par l'écran et acceptée par
l'API.

Et deux artefacts remis d'aplomb : **le manifeste des jaquettes**, qui
inscrivait `width: 512` pour les 218 visuels quand ils mesurent 213 à 960 px
— la taille *demandée*, pas obtenue —, et le **garde des libellés morts**,
qui ne pouvait pas échouer.

#### Ce qui est une perte de richesse, pas un obstacle

La passe 2 incomplète (25, 30), « jamais joué » absent (23), les titres
saisis non relus (24), le compteur de jeux (19), le changement de console
(34), l'état du service non monté (28), le tiroir qui ne se vide pas (32).

#### Ce que l'audit dit du dépôt, au-delà des défauts

Trois chiffres, obtenus en mesurant plutôt qu'en lisant :

- **7 types d'événements sur 11** n'ont aucun producteur — vendu, perdu,
  prêté, rendu : exactement ceux qui portent une collection sur trente ans ;
- **3 granularités temporelles sur 7** sont atteignables pour un événement
  de joueur ; `Age`, son horizon et le paramètre `birthYear` forment un
  sous-système complet que rien n'appelle ;
- **les 3 contrôles hors ligne documentés** dans `CLAUDE.md` ne tournent pas.

Le motif est constant et vaut d'être nommé : **ce dépôt construit plus de
capacité qu'il n'en branche**, et rien ne le signale parce qu'une capacité
non branchée est testée, documentée, et verte.

#### Décision

L'audit a fait ce qu'on lui demandait : il a protégé les créneaux de
testeurs. Recruter avant lui aurait mesuré une application sans apparence.
**La feuille de style est le prochain chantier**, et le seul dont la durée
ne se devine pas — les trois autres blocages sont des correctifs.

### Sortie de la boucle de finition — 22 septembre 2026

Dix-huit items, dix-neuf commits. Le verdict de l'audit est **levé** : la
Phase 2 peut recruter.

#### Les quatre blocages, et ce qui les a levés

| Blocage | Levé par |
|---|---|
| Aucune feuille de style | `socle.css` — et deux gardes qui **mesurent dans le navigateur** au lieu de lire un attribut |
| La grille rendait une liste | la disposition est mesurée, pas déclarée |
| Un moment ne disait pas ce qu'il était | quatre marques nommées ; un type inconnu rend son type plutôt qu'un faux |
| Le souvenir n'atteignait pas l'axe | F1 — un repère court sur l'axe, le texte au clic |

#### Ce qui a été réparé au-delà, et qui se voyait à l'usage

« Jamais joué » est **saisissable** au balayage et au clavier (F3) · les
titres saisis **reviennent** avec leur souvenir (F4) · les avertissements de
§5.4 **atteignent l'écran** (F5) · une jaquette révoquée **ne casse plus la
tuile** (F6) · la sélection a ses **quatre états** (F7) · on **change de
console** sans recharger, période conservée (F8) · le bandeau d'état répond
enfin à « est-ce moi, ou est-ce le service ? » (F9) · la **première console
déclenche une phrase de récit** (F12) · « toujours en cours » **revient**
après un rechargement (F13).

#### Ce qui reste assumé, et qu'un testeur ne doit pas se voir reprocher

- **E07 n'existe pas.** Corriger une date après coup est impossible : la
  passe 2 valide **une fois par ligne**. Un testeur qui change d'avis sur un
  achèvement ne peut pas revenir dessus — c'est une friction connue, pas un
  bug à lui imputer. Les **avertissements causals** attendent le même écran :
  ils sont rendus, et aucun geste ne peut en déclencher un (mesuré).
- **Le tiroir sans date n'accepte aucun geste.** Il affiche et compte ; le
  vider est E14, en Phase 3.
- **Quatre granularités sur sept** ne sont pas atteignables, dont l'âge et
  la période ouverte. Voir le tableau du §6.
- **La région est une hypothèse** : `PAL`. Le critère de recrutement qui en
  découle est écrit dans `PROTOCOLE-DE-TEST.md` §2, et il se vérifie
  **avant** la session — un testeur NTSC-J dirait « je ne reconnais pas ces
  jeux », c'est-à-dire le verdict même de la porte.
- **Les premières statistiques de §24.4** sont différées : la bande d'époque
  les devance pendant la saisie.

#### Ce que ce verdict ne dit pas, et qu'il faut lire avec lui

Les quatre blocages de l'audit sont levés. **Le périmètre écrit de la
Phase 1 (§4), lui, contient trois lignes jamais livrées** — « recherche d'un
jeu ou d'une console », « quelques statistiques », « page de profil
simple » — et quatre fiches d'écran se déclarent « Phase 1 » sans exister :
E04 (en-tête fusionné), E05, E06, E07. Mesuré le 22 septembre 2026, après la
boucle de finition, et inscrit dans [`TODO-ECRANS.md`](./TODO-ECRANS.md).

Deux d'entre elles portent directement la porte : l'en-tête de
`/mon-histoire`, dont E04 dit que l'objectif est « produire le moment *oui,
ça me ressemble* », et le **troisième temps d'E01**, où se joue le KPI
*median time to first meaningful profile*. Les mesurer sur un écran à moitié
construit mesurerait autre chose.

#### Ce que la boucle a appris sur la façon de vérifier

Les trois défauts les plus coûteux n'ont pas été trouvés en relisant du code,
mais en **changeant le temps ou le lieu** : ouvrir un écran plus tôt lui
faisait capturer des props vides ; une construction qui échoue sortait sans un
mot ; un affinage n'était atteignable que par une course que seul un automate
gagne. Et deux contrats écrits pendant la boucle — celui de l'API et celui du
faux client — ont trouvé, **dès leur première exécution**, des champs perdus
en silence depuis la Phase 1.

## 5. Phase 2 — Validation utilisateur

**Durée : 2 à 4 semaines.**

Avant d'étendre techniquement, tester le produit auprès de **10 à 30 joueurs** avec des profils très différents :

- Joueur rétro ;
- Joueur Steam ;
- Collectionneur ;
- Joueur occasionnel ;
- Joueur ayant 20+ ans d'historique.

### Métriques prioritaires (définies dans §22.1)

- % utilisateurs ayant renseigné ≥ 25 jeux ;
- % utilisateurs ayant renseigné ≥ 3 consoles ;
- Temps nécessaire pour reconstruire plusieurs années d'historique ;
- **Median time to first meaningful profile** : temps médian avant qu'un utilisateur ne regarde son profil et pense « oui, ça me ressemble ».

### Mesure qualitative complémentaire

> « Est-ce que ce profil te ressemble réellement ? »

Si la réponse est **non**, il ne sert à rien de construire le social : on itère d'abord sur la saisie et la restitution du parcours.

### Menace sur la validité du test

Le dataset POC ne couvre que NES, SNES, Game Boy/GBA, N64, PS1, PS2 et Switch. Un testeur venu du PC, de l'Amiga, de l'arcade ou du mobile ne trouvera pas ses jeux — et le test mesurera alors **la couverture du référentiel**, pas la qualité de l'expérience de saisie.

Deux précautions :
- **recruter des testeurs dont le parcours est majoritairement couvert** par le dataset, et le dire explicitement dans le protocole ;
- **instrumenter les recherches infructueuses et les déclarations non résolues** (§3.5) : c'est la mesure directe du taux de couverture, et elle doit être rapportée séparément de la mesure d'UX pour ne pas contaminer la porte.

Si les deux signaux sont mélangés, un échec de couverture sera lu comme un échec produit, ou l'inverse.

### Critère de sortie (porte dure)

> La majorité des testeurs répond oui à la question qualitative, et les métriques montrent que la reconstruction est jugée rapide par rapport à l'effort perçu. Sinon → retour Phase 1 (simplification), pas Phase 3.

> ⚠️ **« La majorité » est remplacé par le jeu chiffré de §22.3**, engagé : **≥ 75 % de oui francs sur l'ensemble des testeurs recrutés** — pas sur les seuls finisseurs, sans quoi le biais de sélection flatterait le résultat. La question se pose en aveugle, et un « oui, c'est pas mal » compte comme un non. Décision si manqué : **retour Phase 1**, jamais passage en Phase 3.

## 6. Phase 3 — MVP exploitable

**Durée : 6 à 10 semaines.**

Une fois le concept validé, on industrialise.

### Objectifs

- Authentification ;
- Gestion complète du profil ;
- Timeline persistante ;
- Collection actuelle / historique ;
- Wishlist ;
- Favoris ;
- Statistiques plus riches — **dont les « premières statistiques après quelques jeux » de §24.4, différées depuis la Phase 1** (voir ci-dessous) ;
- Import / export ;
- Visibilité privée / publique ;
- Meilleure recherche ;
- Dataset de référence versionné ;
- Premiers mécanismes de canonicalisation.

### Ce qui arrive ici parce que la Phase 1 l'a écarté par écrit

Ce que le modèle ou l'API portent depuis la Phase 1 **sans aucun producteur**
s'inscrit ici plutôt que de rester vert et inatteignable — c'est le défaut
que l'audit du 22 septembre 2026 a le plus souvent trouvé.

#### Les sept granularités temporelles — où chacune en est

`TemporalValue` en porte sept. **Quatre seulement sont produites par un geste
de Phase 1** ; les trois autres sont construites, testées, et n'ont aucun
producteur. Elles sont inscrites ici plutôt que laissées vertes, et
`CapacitesTemporellesTests` échoue si ce tableau cesse de les nommer — ou si
une huitième variante apparaît sans qu'on dise où elle va.

| Variante | Produite par | Où |
|---|---|---|
| `Year` | l'affinage de période (E01 temps 2) | **Phase 1** |
| `YearRange` | une carte de décennie, ou son affinage | **Phase 1** |
| `Unknown` | « je ne sais plus », en un geste | **Phase 1** |
| `ApproximateYear` | *rien* — l'API l'accepte (`approximate`), aucun écran ne l'envoie | **E07**, avec le repli de précision |
| `Month` | *rien* — le domaine et l'axe la rendent | **E07** |
| `ExactDate` | *rien* pour un événement de joueur ; le référentiel, lui, en produit | **E07** |
| `Age` | *rien*, et `birthYear` avec elle | **E07**, après l'année de naissance |

**La période OUVERTE est dans le même cas**, à l'intérieur de `YearRange` :
une fin absente dit « depuis 1994 », l'API l'accepte, l'axe la rend — et le
choix de période ne propose que des intervalles fermés. Elle appartient à
E07 comme les trois autres.

**Pourquoi elles ne sont pas dans le parcours d'amorce.** Les principes
transverses (§2) montrent trois choix temporels et non sept : « exposer
l'énumération complète ferait remonter le modèle dans l'interface ». Et
`Age` demanderait l'**année de naissance** — sans elle, il se comporte comme
`Unknown` (§7.6) et tous les moments tomberaient dans le tiroir. La demander
à l'amorce est exactement le formulaire que §24.4 interdit : « ne jamais
imposer un formulaire long avant le premier retour visible ».

- **Les premières statistiques de §24.4.** « Les premières statistiques
  apparaissent après quelques jeux » : différé en Phase 1 au profit de la
  seule **phrase de récit**, qui arrive plus tôt — dès la console choisie —
  et pour moins cher. La raison n'est pas le coût : pendant la saisie, la
  **bande d'époque** montre déjà l'histoire qui pousse, et un compteur ferait
  parler le produit de lui-même au moment précis où §24.4 lui demande de
  parler du joueur. E04 et E10 sont leur place, avec de quoi les nourrir.

#### E07, et les avertissements causals qui l'attendent

**E07 — l'éditeur de moment — se déclare « Phase 1 » dans sa fiche et n'a
jamais été construit.** Ce plan le situe ici, et c'est ce plan qui fait foi
(§1). La Phase 1 est close sans lui, sciemment : son rôle est de **corriger
après coup** — une date, un état, un souvenir — et corriger suppose un
profil qui dure.

> **Amendement du 23 septembre 2026 : le premier tiers est avancé.** Le
> panneau s'ouvre depuis l'axe et **corrige une date** — l'année, la période,
> « je ne sais plus ». La raison de ne pas attendre est la première puce
> ci-dessous : les avertissements causals n'avaient **aucun producteur**, et
> une garde verte sans producteur est le défaut que ce dépôt trouve partout.
> Elle en a un désormais, et le parcours de bout en bout le joue.
>
> Le repli de précision et la correction d'état restent ici, en Phase 3 : ils
> servent un profil qui dure, et rien ne les rend urgents.

Trois choses l'attendaient, et aucune n'est un défaut de la Phase 1 :

- **Les avertissements causals de §5.4.** Le domaine les calcule, l'API les
  rend, l'axe les affiche — et **aucun geste du produit livré ne peut en
  déclencher un**. La raison est dans le traducteur de lots : « terminé »
  produit un `StartedGame` **en plus** du `CompletedGame`, à la même date,
  si bien que tout achèvement emporte son commencement.
  `DeclarationsTests.Aucun_lot_de_selection_massive_ne_peut_produire_une_incoherence`
  le mesure sur les seize combinaisons que l'écran accepte, et porte son
  propre témoin : une contradiction forcée dans le même journal est bien
  détectée. Il fallait E07 pour qu'une incohérence devienne seulement
  possible. **C'est fait le 23 septembre 2026** : corriger la date d'un
  achèvement pour la placer avant son commencement produit l'avertissement,
  et `CorrectionDeDateTests` comme le parcours de bout en bout le jouent.
  §5.4 a enfin un producteur.
- **Le repli de précision** — mois, date exacte, « vers », âge, période
  ouverte : voir le tableau des sept granularités ci-dessus.
- **Changer d'avis après coup.** La sélection massive valide **une fois par
  ligne**, parce que le journal est en ajout seul et que deux achèvements
  contradictoires y resteraient tous les deux. E02 le dit déjà : « changer
  d'avis plus tard relève d'E07 ».

#### La passe temporelle par le tiroir — E14 depuis E03

`ORDONNANCEMENT-TEMPOREL.md` §6 fait une promesse que la Phase 1 ne tient
pas : « le tiroir est une **tâche, pas une poubelle**. Il est dimensionné
pour être vidé — c'est la relance de session la moins coûteuse du produit. »
Il n'accepte aujourd'hui **aucun geste** : on y voit les moments sans date,
on ne peut pas les dater.

L'écran qui le ferait existe — c'est **E14**, la passe temporelle — et sa
fiche lui donne **deux entrants**, que ce plan doit situer séparément :

| Entrant vers E14 | Ce qui l'amène | Phase |
|---|---|---|
| **E13** | l'import, qui donne le « quoi » et rarement le « quand » | **Phase 4**, §7 — le couple E13 → E14 y est déjà décrit |
| **E03** | le tiroir des sans-date, « dater ces moments » | **Phase 3**, ici |

**Pourquoi Phase 3 et pas Phase 1.** Une session de test de Phase 2 est
**unique** : le testeur vient une fois, et la relance ne s'y joue pas. Un
écran de plus à concevoir et à garder servirait un chemin qu'aucun testeur
n'empruntera. Le tiroir prend son sens quand un profil **dure** — c'est-à-dire
quand le compte et la timeline persistante existent, donc ici.

**Ce que la Phase 1 laisse en l'état, sciemment** : le tiroir affiche, compte
et n'efface rien. Un moment sans date reste un moment valide (§6) ; il est
seulement absent de l'axe.

### Extensions du modèle de données

À ce stade, le modèle intègre :

| Champ | Rôle |
|---|---|
| `DatasetVersion` | version du dataset de référence |
| `Source` | provenance d'une donnée (interne / externe) |
| `ExternalId` | identifiant dans la source d'origine |
| `CanonicalId` | identifiant canonique interne |
| `Alias` | variantes connues (noms localisés, fautes, etc.) |
| `Locale` | langue / région de l'alias ou du contenu |
| `Confidence` | niveau de confiance de la donnée ou du lien |

Le risque de canonicalisation est déjà correctement identifié dans la spécification (§23.1 : « Pokémon Red = Pokémon Rouge = ポケットモンスター 赤 »). Il est traité **légèrement** ici : alias manuels + confidence, pas encore de déduplication automatique (Phase 7).

### Migration des références utilisateur entre versions du dataset

Introduire `DatasetVersion` sans traiter la migration est un piège : dès la première fusion ou scission de fiches, les événements utilisateur pointent vers des entités qui n'existent plus. Il faut donc, dans cette phase et non plus tard (§15.3) :

- des **identifiants canoniques stables**, jamais réattribués ;
- un **journal des fusions et scissions** permettant de rediriger les références existantes ;
- une **règle explicite pour les scissions**, où la redirection est ambiguë (rattachement au plus probable avec `Confidence`, ou arbitrage par l'utilisateur).

Sans ce mécanisme, la première canonicalisation sérieuse casse silencieusement des profils déjà constitués — c'est-à-dire précisément le capital que le produit demande à l'utilisateur de construire.

### Conformité

L'authentification amène les comptes, donc les obligations : base légale, information, conservation, portabilité et effacement (§19.3). La stratégie d'effacement décidée en Phase 0 (§19.4) est implémentée ici. La visibilité doit être **granulaire par bloc** (timeline, collection, statistiques, journal), et non un simple interrupteur privé/public (§12).

### Critère de sortie

> Un utilisateur nouveau peut créer un compte, reconstruire son parcours de bout en bout et y revenir plusieurs fois sans friction. Le produit est utilisable en conditions réelles.

## 7. Phase 4 — Imports et réduction de friction

**Durée : 4 à 8 semaines.**

Cette phase est **plus importante que le social**.

### Objectif

> Permettre à un utilisateur de reconstruire 10 ou 20 ans de gaming **sans saisie manuelle massive**.

### Priorité des imports (selon faisabilité)

1. Steam ;
2. RetroAchievements ;
3. Playnite ;
4. LaunchBox ;
5. CSV (filet universel) ;
6. Éventuellement Xbox / PlayStation, selon l'accessibilité réelle des API.

### Provenance des données importées

Le modèle conserve systématiquement la provenance :

| Champ | Rôle |
|---|---|
| `Source` | plateforme d'origine (Steam, Playnite, CSV…) |
| `ExternalUserId` | identifiant utilisateur chez la source |
| `ExternalGameId` | identifiant du jeu chez la source |
| `ImportedAt` | date de l'import |
| `Confidence` | fiabilité du mapping source → canonique |

### ⚠️ Limite structurelle : les imports donnent le « quoi », rarement le « quand »

C'est la principale faiblesse du plan initial, parce qu'elle porte sur le **critère de sortie de la phase la plus importante après le POC**.

L'objectif énoncé ci-dessus — « reconstruire 10 ou 20 ans de gaming sans saisie manuelle » — suppose que les sources exposent une **histoire datée**. Or elles exposent surtout un **inventaire présent** :

| Source | Ce qu'elle donne | Signal temporel réellement disponible |
|---|---|---|
| Steam | jeux possédés, temps de jeu cumulé, dernière session | **pas de date d'acquisition** exposée par l'API publique ; le temps cumulé est un total sans historique |
| RetroAchievements | jeux joués, succès datés | horodatages réels, mais **de la session sur RA** (années 2010+), pas de la partie d'origine en 1995 |
| Playnite / LaunchBox | bibliothèque locale, métadonnées | dates d'ajout à l'outil, pas dates de vie |
| CSV | ce que l'utilisateur y a mis | tout ou rien |

Deux conséquences :

1. **Pour la période pré-2010 — le cœur du différenciateur du produit (§2.4) — aucun import ne donne de dates.** L'import ne remplace donc pas la saisie sur la partie qui compte le plus.
2. **Même sur Steam, l'import produit une collection, pas une timeline.** Le rattacher à une année exige une inférence ou une intervention de l'utilisateur.

### Correctifs proposés

- **Exploiter les horodatages de succès comme proxy de date de jeu.** Le premier succès débloqué sur un titre est une bonne approximation de « quand j'y ai joué », disponible sur Steam et sur RetroAchievements. À enregistrer avec une `Confidence` réduite et une `TemporalValue` de granularité mois ou année — jamais comme une date exacte.
- **Prévoir une « passe temporelle assistée » après l'import** : l'utilisateur voit les titres importés sans date et les répartit en masse sur des bandes de périodes, dans le même geste que la sélection massive de la Phase 1. C'est cette passe, et non l'import brut, qui produit réellement l'historique.
- **Vérifier la disponibilité effective de chaque API au moment de l'implémentation** : les capacités et les conditions d'utilisation évoluent, et le tableau ci-dessus doit être reconfirmé avant de s'engager sur un critère de sortie.

### Critère de sortie (révisé)

Le critère initial confondait deux résultats de nature différente. Il est scindé :

> **a) Couverture** — un joueur Steam importe sa bibliothèque en quelques minutes, avec un taux de mapping vers le référentiel canonique jugé acceptable (seuil chiffré fixé à l'avance).
>
> **b) Historicisation** — après import, la part des titres portant une date ou une période exploitable atteint le seuil fixé, grâce aux proxys de datation et à la passe temporelle assistée.

Seul (b) alimente réellement la promesse « reconstruire 10 ou 20 ans » ; (a) seul produit une liste, pas une histoire. Le KPI « % profils ayant importé une source externe » (§22.1) mesure l'adoption, pas la valeur : il doit être suivi conjointement au nombre moyen d'événements **datés** par profil.

## 8. Phase 5 — Social léger

**Durée : 4 à 6 semaines.**

**Seulement après validation de l'usage individuel** (porte Phase 2 atteinte, adoption MVP confirmée).

### Périmètre volontairement petit

- Profil public ;
- Partage de timeline ;
- Comparaison de deux profils ;
- Jeux en commun ;
- Consoles en commun ;
- Compatibilité simple (§13.3) ;
- Suivi d'autres joueurs.

**Pas de forum à ce stade.** Le social prévu dans le cahier des charges (§13, §21.1) est introduit progressivement, au lieu de devenir une seconde application à construire.

### Critère de sortie

> Les profils publics sont réellement consultés par d'autres utilisateurs (retours sur timeline, suivis, partages). Le social enrichit la mémoire personnelle — il ne la remplace pas.

## 9. Phase 6 — Intelligence et recommandation

**Durée : 6 à 10 semaines.**

Une fois que **suffisamment de données utilisateur** existent (volume + qualité des parcours) :

- Recommandations contextuelles (§14 : « Tu as beaucoup joué aux JRPG entre 1997 et 2005 mais tu n'as jamais joué à Chrono Trigger ») ;
- Détection de franchises incomplètes ;
- Redécouverte nostalgique ;
- Anniversaires gaming ;
- « Il y a 20 ans… » (réactivation des événements historiques — valeur directe de l'architecture événementielle, §5) ;
- Évolution des goûts (§8.2) ;
- Suggestions de backlog ;
- Comparaison de périodes.

La recommandation basée sur le parcours prévue dans la spécification ne devient réellement intéressante qu'à ce moment-là : elle a besoin d'une masse critique de parcours enrichis (phases 3 et 4).

### Critère de sortie

> Les recommandations sont perçues comme pertinentes et personnelles (taux d'action, retours qualitatifs) — pas seulement comme un algorithme générique.

## 10. Phase 7 — Industrialisation avancée

**Durée : continue.**

À ce stade **seulement**, on pousse les optimisations techniques :

- Dataset binaire ;
- MemoryPack / FlatBuffers / format custom (décision par benchmark, §17.1) ;
- MemoryMappedFile ;
- Index pré-calculés ;
- Cache distribué ;
- CDN ;
- Versioning avancé du dataset ;
- Ingestion multi-source ;
- Déduplication automatique ;
- Pipeline CI/CD de données.

Le besoin de performance sur plusieurs millions d'entités existe bien (§23.1). Mais ce travail doit arriver **après** la validation produit, et être déclenché par des mesures réelles de charge — pas par anticipation.

## 11. Le jalon de validation du projet

> **Un utilisateur peut reconstruire plusieurs années de son parcours en moins de 15–20 minutes et considère le résultat suffisamment personnel pour vouloir y revenir ou le partager.**

C'est le vrai jalon : il est mesuré dès la Phase 2 (tests utilisateurs), consolidé en Phase 3 (MVP) et en Phase 4 (imports). S'il n'est pas atteint, on itère sur le produit — simplification de la saisie, restitution du parcours — avant toute extension technique ou sociale.

## 12. Risques et portes de décision par phase

| Phase | Risque principal | Décision à la porte |
|---|---|---|
| 0 | Modèle trop rigide ou trop compliqué | Valider sur des cas concrets (FFVII, Game Boy 1991…) avant de coder |
| 1 | Scope creep du POC | Gel strict de la liste de fonctionnalités ; tout le reste attend la Phase 3+ |
| 2 | « Ce profil ne me ressemble pas » | Retour Phase 1 (simplification) — pas d'avance en Phase 3 |
| 3 | Canonicalisation sur-ingéniérée | Alias manuels + confidence seulement ; l'automatisation attend la Phase 7 |
| 4 | API sources inaccessibles (Xbox/PS) | Repli CSV / saisie assistée ; ne pas bloquer la phase sur une source |
| 5 | Le social devient un second produit | Périmètre strict : pas de forum, pas de feed, pas de modération lourde |
| 6 | Cold start — données insuffisantes | Activation conditionnée au volume réel de parcours enrichis |
| 7 | Optimisation prématurée | Déclenchement par mesure de charge, jamais par anticipation |

### Risques transverses (ajoutés en v2)

Ils ne sont portés par aucune phase en particulier, ce qui est précisément la raison pour laquelle ils sont oubliés.

| Risque | Où il se matérialise | Décision |
|---|---|---|
| **Effectif non défini** | toutes les durées de ce document | Fixer l'hypothèse de charge (§2) avant d'utiliser le planning |
| **Coût de curation du référentiel** | dès la sortie du POC | Estimer en Phase 0 ; restreindre le périmètre plutôt que promettre l'exhaustivité |
| **Licences et droit sui generis des sources** | Phases 0, 3 et 4 | Vérifier avant import ; licence obligatoire par source ([SPECIFICATION.md](./SPECIFICATION.md) §19.1) |
| **RGPD contre journal en ajout seul** | conception du stockage, Phase 0 | Purge par utilisateur ou crypto-shredding — décidé avant d'écrire le schéma (§19.4) |
| **Concurrence établie** | positionnement, continu | Tenir le différenciateur temporel ; ne pas dériver vers un journal de jeux de plus (§2) |
| **Modèle économique absent** | pérennité | Question ouverte n°3 (§25) |

## 13. Correspondance avec SPECIFICATION.md

> Numérotation de SPECIFICATION.md **v2** (la v1 comportait des sections dupliquées et des numéros manquants ; tous les renvois de ce document ont été mis à jour).

| Phase | Sections du cahier des charges couvertes |
|---|---|
| 0 | §2 (positionnement), §5 (événements), §6.2 (modèle), §7 (temps), §17.4 (tests), §18.5 (sourcing minimal), §19 (cadre juridique), §22 (KPI et cibles) |
| 1 | §3.3–3.5 (notoriété, région, jeu manquant), §4 (états), §6 (éditions), §7 (TemporalValue), §9 (souvenir minimal), §11 (profil simple), §24 (saisie massive) |
| 2 | §22 (KPI de valeur et cibles chiffrées) |
| 3 | §4, §10 (backlog / wishlist), §11 (valorisation), §12 (visibilité), §15 (séparation et versionnement), §18.3–18.4 (fusion / traçabilité), §19.3 (RGPD), §23.1 (canonicalisation) |
| 4 | §18 (sources et provenance) |
| 5 | §12 (visibilité), §13 (dimension sociale), §19.5 (contenu public) |
| 6 | §8.2 (représentation synthétique), §10.3 (backlog), §14 (recommandation) |
| 7 | §15 (données binaires), §17.1 (formats), §23.1 (performance) |
