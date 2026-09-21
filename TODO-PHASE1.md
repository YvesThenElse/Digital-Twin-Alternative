# Phase 1 — POC fonctionnel

> Liste de travail de la boucle, au même format que [TODO-PHASE0.md](./TODO-PHASE0.md).
> Un item par itération, dans l'ordre. Les règles de travail sont dans
> [LOOP.md](./LOOP.md) ; les leçons accumulées dans
> [APPRENTISSAGES.md](./APPRENTISSAGES.md), à relire au début de chaque
> itération.

## La question à laquelle ce POC répond

> Est-ce qu'un utilisateur reconstruit rapidement une partie significative de
> son histoire vidéoludique, et trouve le résultat intéressant ?

Tout item qui ne sert pas cette question est hors périmètre, même s'il figure
dans la spécification.

## Décisions de cadrage — 21 septembre 2026

| Décision | Conséquence |
|---|---|
| **Tranche verticale E02 + E03**, de l'API à l'écran | Ni compte ni connexion : un utilisateur local en dur. E01, E04, E06 et les suivants attendent |
| **PostgreSQL en Docker dès le départ** | Le domaine est temporel, et les types de date diffèrent entre fournisseurs EF Core. Valider sur SQLite puis migrer ferait réapparaître la classe de bug la plus coûteuse de ce dépôt |
| **Tests de composant et d'API partout ; Playwright sur un seul parcours** | Celui du critère de sortie. Un test de bout en bout instable finit affaibli plutôt que réparé — un seul, et il doit rester vert |
| **Référentiel chargé en mémoire depuis le fichier** | 221 œuvres et 593 sorties tiennent en quelques centaines de kilo-octets. `DatasetLoader` vérifie les invariants **au démarrage** : un dataset corrompu se voit au lancement, pas à la première requête d'un testeur |

Pile verrouillée en [PHASING.md](./PHASING.md) §4 : .NET 10 LTS + EF Core 10,
React + TypeScript (Vite), TanStack Query, PostgreSQL 17+.

---

## Socle

- [x] **01 — Squelette de la solution.** Ajouter `DigitalTwin.Api` (API minimale .NET 10) et `DigitalTwin.Api.Tests` à `src/DigitalTwin.slnx`, un `docker-compose.yml` avec PostgreSQL 17, et `web/` (Vite + React + TypeScript). *Acceptation : `./test.sh` exécute les tests du domaine ET de l'API ; `./web.sh test` exécute ceux du front ; l'API répond sur un point de santé qui **inclut l'état de la base** — un point de santé vert alors que la base est tombée ne sert à rien.*

- [x] **02 — Le référentiel au démarrage.** Charger `dataset/poc.json` via `DatasetLoader` à l'amorçage, et **refuser de démarrer** si le dataset porte une violation, en nommant l'entrée fautive. Exposer `GET /platforms` et `GET /platforms/{id}/works`. *Acceptation : les œuvres reviennent ordonnées par `notability` **de cette plateforme** ; Bubble Bobble apparaît sur Game Boy et sur NES avec deux rangs différents ; un dataset corrompu empêche le démarrage avec un message nommant l'entrée.*

- [x] **03 — Les événements en base.** Modèle EF Core de `PlayerEvent` : table en ajout seul, deux axes temporels (`OccurredAt`, `RecordedAt`), `SupersededBy`, partitionnement par utilisateur prévu (§10.1). Migration PostgreSQL. *Acceptation : un aller-retour en base préserve **les sept variantes** de `TemporalValue` à l'identique, y compris `Age` non résolu et `Unknown` ; un événement déclaré en 2026 pour un fait de 1998 garde ses deux dates distinctes ; aucune mise à jour en place n'est possible.*

- [x] **03b — Une sortie ne peut pas précéder sa machine.** Porter `launch_year` sur `Platform` dans le dataset et dans le modèle, et en faire un invariant vérifié par `DatasetLoader`. *Acceptation : le dataset réel est refusé tant que Bubble Bobble sur Game Boy porte sa date Famicom du 30 octobre 1987 — la Game Boy est sortie en 1989 ; une fois la date corrigée, il passe. L'anomalie vient du repli « aucune tête de plateforme → tout le champ » de l'analyseur d'infobox, qui mord sur les titres multiplateformes : le corriger là aussi, avec son cas dans `test_wp_parser.py`.*

## E02 — la sélection massive

- [x] **04 — Passe 1 : plateforme et période.** `GET /platforms` alimente le choix de machine ; la période est une `TemporalValue` approximative (§24.3). *Acceptation : les huit plateformes reviennent dans l'ordre chronologique de génération ; une période « vers 1995 » produit un `ApproximateYear` de marge ≥ 1, pas une année exacte.*

- [x] **05 — Passe 2 : cocher joué / terminé / possédé.** `POST /declarations` accepte un **lot**. *Acceptation : trente déclarations en un appel produisent trente événements ; rejouer le même lot ne duplique rien ; une plateforme inconnue est refusée **en la nommant** ; « terminé » implique « joué » sans créer deux événements contradictoires.*

- [x] **06 — « Jamais joué » est une déclaration.** (§24.3) Pas une absence de réponse. *Acceptation : un titre déclaré « jamais joué » se distingue en base d'un titre non coché, et la distinction survit à un rechargement.*

- [x] **07 — Le jeu absent du référentiel.** (§3.5) Sur 221 titres, le cas est permanent. *Acceptation : un testeur peut saisir un titre absent sans être bloqué ; l'entrée est marquée comme non référencée et n'est jamais confondue avec une œuvre curée.*

## E03 — la timeline

- [x] **08 — Projection de timeline.** `GET /timeline` s'appuie sur `TimelineSorter`. *Acceptation : les huit cas de validation rejoués **à travers l'API** produisent le même ordre que les tests du domaine ; les moments sans date reviennent dans le tiroir, pas mélangés ; les incohérences causales reviennent comme avertissements et ne bloquent rien.*

- [x] **09 — Restitution immédiate.** (§24.4) La timeline se remplit **pendant** qu'on coche. *Acceptation : un test de composant prouve que cocher un titre modifie la timeline sans rechargement ni appel complet ; un POC qui ne montre le résultat qu'à la fin ne teste pas la bonne chose.*

## L'incertitude, visible

- [x] **10 — Afficher ce qu'on ne sait pas.** Dates approximatives, `Age` non résolu, zone sans date. *Acceptation : une date à l'année ne s'affiche jamais comme une date au jour ; les 31 sorties à l'année seule sont reconnaissables à l'écran ; un test de composant le vérifie sur les trois précisions.*

- [x] **11 — Région et non-sortie.** Les trois états de `region_status`. *Acceptation : « jamais sorti en Europe » (22 cas établis) s'affiche différemment de « région inconnue » (32 cas) et de « sorti » ; **aucune des trois ne se rend par l'absence d'indication**.*

- [x] **12 — Souvenir minimal.** (§9) Note libre sur un événement. *Acceptation : la note se saisit sans quitter la sélection, survit au rechargement, et est facultative — c'est elle qui produit « oui, ça me ressemble », le critère de sortie de la Phase 2.*

## Forme et sortie

- [x] **13 — Deux dispositions, pas une étirée.** (§21.2, [langage visuel](./ecrans/00-langage-visuel.md) §6) Liste dense sur mobile, grille visuelle sur desktop avec les 218 jaquettes. *Acceptation : un test de composant vérifie les deux dispositions aux points de rupture déclarés ; une œuvre sans jaquette rend une tuile générée et jamais un trou.*

- [x] **14 — Aucun libellé en dur.** (§20, décision « international dès le départ ») *Acceptation : un test échoue si une chaîne visible par l'utilisateur est écrite dans un composant ; le français est la seule langue livrée, et c'est un choix, pas une contrainte du code.*

- [x] **15 — Le parcours de bout en bout.** Playwright, **un seul test** : choisir une console, une période, cocher trente titres, voir la timeline se remplir, ajouter une note. *Acceptation : il passe sur la grille desktop et sur la liste mobile ; il mesure le nombre de gestes, qui est le KPI de §22.3.*

- [x] **16 — Bilan.** Mettre à jour [PHASING.md](./PHASING.md) §4 : ce qui est livré, ce qui ne l'est pas, et si le POC est en état d'être montré à un testeur. *Acceptation : le fichier dit la vérité, y compris si le POC n'est pas présentable.*

## Ce que le bilan a fait apparaître

Trois manques **bloquent** le test de Phase 2. Ils ont été inscrits ici parce
qu'un bilan qui constate sans ouvrir de travail n'est qu'un constat.

- [ ] **17 — Servir les jaquettes.** L'API annonce `/covers/{id}` et personne ne les rend : la grille desktop afficherait 218 images cassées, alors que la reconnaissance est la mécanique centrale de E02. *Acceptation : un test vérifie qu'une URL annoncée **résout** — l'item 13 ne vérifiait que le cas `null` —, et le parcours de bout en bout échoue si une image de la grille ne charge pas.*

- [ ] **18 — L'écran de timeline (E03).** La timeline se résume à un compte de moments ; le testeur ne voit pas son histoire, qui est pourtant ce qui doit produire « ça me ressemble ». *Acceptation : l'axe montre les moments avec leur forme temporelle, la zone sans date est montée, et le parcours de bout en bout y lit ses trente titres.*

- [ ] **19 — Saisir un titre absent.** Sur 221 titres, le cas est permanent (§3.5) ; l'API l'accepte, aucun écran ne le propose. *Acceptation : le testeur ajoute un titre libre sans quitter la sélection, et il apparaît dans sa timeline comme les autres.*

---

## Journal

Une ligne par item terminé, ajoutée dans le commit qui le clôt.

- **01** — `DigitalTwin.Api` (API minimale) et `DigitalTwin.Api.Tests` ajoutés, `docker-compose.yml` (PostgreSQL 17, port hôte 5433), `web/` (Vite + React + TS + Vitest), `web.sh` sur le modèle de `dotnet.sh`. Point de santé qui interroge vraiment la base : 200, 503 avec la cause nommée quand elle tombe, 200 de nouveau à la reprise — vérifié contre une vraie base. **`dotnet test` sur la solution n'exécutait qu'un projet de test sur deux, en affichant `Passed!`** : `test.sh` boucle désormais sur chaque projet et refuse de rendre 0 si la découverte est vide. 387 tests .NET, 4 tests front, 7 mutations conformes dont la survivante voulue.

- **02** — Le référentiel est lu une fois au démarrage et gardé en mémoire ; un dataset **absent ou fautif empêche le démarrage**, en nommant l'entrée. `GET /platforms` et `GET /platforms/{id}/works`, les œuvres ordonnées par le rang **de cette plateforme**, leurs sorties et leur statut régional restreints à cette machine. Bubble Bobble y figure deux fois, rangs 19 et 22, sous un seul identifiant. **Piège d'hôte** : lire `builder.Configuration` avant `Build()` ignore les sources ajoutées par l'hôte de test — la configuration se lit dans la fabrique, et la résolution est forcée juste après la construction. **Anomalie trouvée** : une sortie Game Boy datée de 1987, inscrite à l'item 03b. 399 tests .NET, 4 tests front, 8 mutations conformes dont la survivante voulue.

- **03** — `PlayerEventDbContext` + migration PostgreSQL. Les **huit formes** de `TemporalValue` survivent à l'aller-retour — sept variantes, mais une période peut être ouverte. `Age` reste brut, `Unknown` se distingue de l'absence, et une variante écrite par une version plus récente **échoue** au lieu d'être lue comme « inconnue ». Les deux axes restent distincts ; la troncature de `timestamptz` à la microseconde est constatée par un test plutôt que découverte sur un départage de tri. L'ajout seul est tenu **à deux niveaux** : le contexte protège l'application, un déclencheur SQL protège la base de tout le reste. Il autorise la seule pose du marqueur de remplacement, une seule fois — MODELE §5 exige de « marquer l'ancien comme remplacé », ce qui est une mise à jour. La suppression reste possible pour la purge de §10.1. Clé primaire `(user_id, id)` : partitionner devient une migration, pas un changement de modèle. `test.sh` démarre PostgreSQL et **échoue** s'il ne vient pas — une suite qui saute les tests de persistance ressemble exactement à une suite qui les a passés. 418 tests .NET, 4 tests front, 9 mutations conformes dont la survivante voulue, comblée ensuite.

- **03b** — `launch_year` porté par chaque plateforme, et `DatasetLoader` refuse une sortie antérieure à sa machine — **ainsi qu'une plateforme sans année**, sans quoi le contrôle ne s'appliquerait à rien tout en rendant vert. L'anomalie venait de **deux** défauts, aucun de ceux que j'avais supposés : `wp_dates.json` était indexé par QID seul alors que l'analyse dépend de la plateforme, et le découpage de l'infobox ne retenait qu'**une** section par famille de machines. Les réunir a rendu 15 dates américaines et européennes à Zelda, Metroid, Castlevania et les autres, dont la première parution japonaise était sur Famicom Disk System. 593 sorties, 0 anachronisme. 423 tests .NET, 4 tests front, 13 cas de parseur, 7 mutations dont 2 prédictions fausses corrigées et la survivante voulue.

- **04** — `GET /platforms` rend les huit machines **triées sur leur année de lancement**, qu'il expose : l'ordre du dataset paraissait chronologique sans l'être — la Super Nintendo (1990) y précédait la Game Boy (1989). `PeriodInput` traduit les quatre formes de l'écran — année, période, « vers », « je ne sais plus » — en `TemporalValue`. **« Vers » ne devient jamais une année exacte**, même sans marge fournie : la marge tombe à 2 (MODELE §3, « 1994 ± 2 »), jamais à 0. Une période d'une seule année reste une période, une période sans fin reste ouverte, et un genre inconnu est refusé plutôt que replié sur « je ne sais plus ». 439 tests .NET, 4 tests front, 7 mutations conformes dont la survivante voulue.

- **05** — `POST /declarations` accepte un lot. Trente déclarations en un appel produisent trente événements ; **rejouer le lot n'en crée aucun**, l'idempotence portant sur le `batchId` et non sur une unicité (utilisateur, œuvre, type) qui interdirait la correction de §5.3. « Terminé » implique « joué » — sans quoi le moment n'aurait pas de prédécesseur valide — et la cohérence causale du couple est vérifiée par `TimelineSorter`. « Toujours en cours » n'ajoute rien : c'est une absence. Jouer chez quelqu'un ne produit aucune acquisition. Tout ou rien : une entrée fautive refuse le lot entier, en la nommant. **`BatchId` est enfin posé** — le modèle le prévoyait depuis la Phase 0 pour l'agrégation en épisodes (§4.4), et aucun producteur ne le remplissait. **La faute de configuration de l'item 02 était restée sur la chaîne de connexion** : l'API parlait à la base de développement, sans schéma. 455 tests .NET, 4 tests front, 9 mutations conformes dont la survivante voulue.

- **06** — « Jamais joué » écrit une `PlayDeclaration` et **aucun événement** : le jugement n'a pas de date, et lui en forger une inventerait un moment qui n'a pas eu lieu. Trois réponses distinctes survivent au rechargement — déclaré joué, déclaré jamais joué, rien dit. Invariant 8 tenu : « jamais joué » combiné à un achèvement ou une provenance est refusé en nommant l'œuvre. Invariant 10 tenu : déclarer une provenance après « jamais joué » est une correction, pas un refus. La purge de §10.1 efface **les deux tables**. **Défaut trouvé en relecture** : réécrire la ligne entière effaçait l'affect ; le magasin passe désormais par le type de domaine, qui porte les invariants. **Trou trouvé par mutation** : `NeverPlayed` était relu sans qu'aucun chemin ne le préserve — comblé par un test de la traduction elle-même. MODELE §5 disait « par couple utilisateur / œuvre », incompatible avec l'invariant 6 : légende corrigée. 469 tests .NET, 4 tests front, 7 mutations, 2 prédictions fausses dont une rejouée après correction.

- **07** — Un titre libre s'ajoute au milieu d'un lot, sans bloquer. L'événement cible une `UnresolvedGameClaim` préfixée `ucl_` : rien ne peut la confondre avec une œuvre curée, ni fiche ni statistique. Le titre est conservé **tel que saisi** — c'est le signal de priorisation du référentiel — avec une forme normalisée à côté pour ne pas créer deux revendications du même jeu. Titre vide, titre + œuvre, ni l'un ni l'autre : refusés en disant lequel. **Le rattachement ne réécrit pas les événements** : la revendication porte la résolution, et l'historique comme les dates sont conservés (§3.5). Troisième table couverte par la purge de §10.1. **Deux tests passaient pour la mauvaise raison** — une entrée vide était refusée comme « œuvre inconnue » — révélés par deux mutations survivantes et corrigés en assertant le motif. 482 tests .NET, 4 tests front, 10 mutations.

- **08** — `GET /timeline/{userId}` rend ce que `TimelineSorter` calcule, **sans rien ordonner lui-même** : un test miroir compare sa sortie à celle du domaine sur six formes temporelles, plutôt que de réécrire l'ordre attendu. Le tiroir reste séparé de l'axe ; les incohérences causales reviennent en avertissements et ne bloquent rien (invariant 10) ; une timeline vide rend 200, pas 404. L'horizon se construit **à la lecture** avec l'année de naissance du moment — c'est ce qui permet de la renseigner plus tard et de replacer tous les moments, sans réécrire un événement. Les épisodes de §4.4 traversent l'API. ⚠️ **L'acceptation était trop large** : sur les huit cas de validation, **deux** portent sur l'ordre (§7.1 et le recalcul par l'âge) ; les six autres testent la possession, la redirection ou la déduplication, et les forcer par `/timeline` n'aurait rien prouvé. Les deux sont rejoués. 493 tests .NET, 4 tests front, 8 mutations dont la survivante voulue, comblée ensuite.

- **09** — La bande d'époque grandit **dès le premier titre coché**, sans rechargement ni appel complet : l'état déclaré est local, l'envoi part en arrière-plan, et un échec ne défait rien — il se signale. Ce n'est pas un compteur mais une répartition par année, qui s'étend à mesure que la période s'élargit ; rien de déclaré, pas de bande, parce qu'une bande plate à zéro affirmerait une histoire vide. Les titres sans date sont comptés, jamais placés. La ligne entière est la cible, et `aria-pressed` dit l'état à la machine. **Ce que ces tests ne couvrent pas** : la densité, la taille de cible, le fait qu'un titre tienne sur 375 px, le mouvement — c'est-à-dire précisément ce qui a motivé le dessin de l'écran. L'écran n'est pas encore branché sur l'API : l'acceptation portait sur le test de composant. 493 tests .NET, **25 tests front**, 9 mutations dont une prédiction fausse par oubli d'un retour anticipé.

- **10** — Le rendu des sept granularités est normalisé en un seul module — libellé et forme —, et les **trois interdits** de §2 y sont chacun sous test : jamais un souvenir vague rendu comme une date précise, jamais `Unknown` projeté sur l'axe, jamais un âge non résolu placé. Une sortie datée à l'année s'affiche « 1994 » et porte une forme distincte d'une date au jour : les deux se distinguent à l'œil même quand l'année coïncide. Une sortie sans date le **dit**, plutôt que de laisser un blanc qui se lirait comme un défaut d'affichage. La zone sans date rassemble les moments hors axe en disant **pourquoi** chacun y est — « vers mes 12 ans » n'est pas « je ne sais plus ». L'œuvre porte désormais une valeur temporelle et non une année nue : une seule source de vérité pour l'affichage et pour la bande. 493 tests .NET, **53 tests front**, 9 mutations dont 4 prédictions fausses, toutes de comptage, et une assertion trop lâche corrigée.

- **11** — **Quatre** réponses à l'écran, pas trois : sorti, jamais sorti (22 cas établis), inconnu (32 cas), et mondiale — sur une machine sans zonage, la question ne se pose pas, et répondre « inconnu » y inventerait une incertitude. **Aucune ne se rend par l'absence d'indication** : un état muet serait indistinguable d'un défaut d'affichage. Le code de région n'est jamais montré — « PAL » ne dit rien à un joueur, « Europe » si. Une sortie attestée prime sur un statut contradictoire : l'écran penche du côté qui ne fait rien disparaître. La région suit l'écran et non un défaut, comme l'exige « international dès le départ ». **Assertion trop faible corrigée** : « les deux libellés diffèrent » était satisfait par un mot d'écart ; on exige désormais la marque de chaque état. 493 tests .NET, **72 tests front**, 8 mutations dont 4 prédictions fausses, toutes de comptage.

- **12** — Le souvenir se saisit **sur la ligne**, sans quitter la sélection, et seulement une fois la ligne déclarée : une zone de texte sur chaque ligne non cochée occuperait l'écran le plus dense du produit et suggérerait un travail à faire. Il est **facultatif** — §9 est un complément, jamais un passage obligé — et le texte est conservé **tel qu'il a été écrit** : retours à la ligne, ponctuation et emoji SONT le souvenir. Un souvenir par cible, révisable ; une cible inconnue est refusée en la nommant, sans quoi le contenu le plus précieux du produit disparaîtrait sans erreur. **Décocher une ligne ne détruit pas la phrase** : les souvenirs vivent hors de l'ensemble des déclarations. Quatrième table couverte par la purge de §10.1, et la plus sensible. 505 tests .NET, **78 tests front**, 9 mutations dont une **vide**, rejouée à l'endroit qui compte.

- **13** — Deux **stratégies de lecture** et non une disposition étirée : liste dense à 56 px sous 1024, grille de tuiles au-delà. Une seule bascule, vérifiée sur 1280 largeurs — un mode intermédiaire inventerait une troisième stratégie que le langage visuel refuse ; la tablette suit la liste. La tuile garde le format 3:4 dans les deux cas, ce qui empêche la grille de paraître rapiécée. **Une œuvre sans jaquette rend une tuile composée, jamais un trou** : accent de son époque, trame dérivée du titre et stable d'une visite à l'autre, titre visible — un aplat sans texte se lirait comme une image qui n'a pas chargé. Elle ne se déguise jamais en vraie jaquette. L'API expose `coverUrl`, `null` plutôt qu'une adresse morte qui produirait une image cassée. 507 tests .NET, **111 tests front**, 9 mutations dont une a révélé que l'écran ne vérifiait pas ce que l'unité couvrait.

- **14** — Un test **lit les sources** et échoue en nommant fichier, ligne et texte dès qu'une chaîne visible est écrite dans un composant. Il détecte le texte JSX et les attributs lus par un humain ou un lecteur d'écran, et il se prouve lui-même sur un composant témoin fautif — un garde-fou qui ne trouve jamais rien passerait pour vert le jour venu. Tous les libellés vivent dans un catalogue unique ; une clé inconnue **échoue** au lieu de s'afficher, un paramètre manquant laisse le gabarit visible, et un libellé mort est signalé. Le français reste la seule langue livrée, et c'est désormais un **choix** et non une contrainte du code. **Trois faux positifs crédibles** — générique, flèche, comparaison — ont été corrigés dans le détecteur plutôt que contournés par des exceptions ; et une mutation a montré que l'exclusion du catalogue lui-même **ne servait à rien** : retirée. 507 tests .NET, **120 tests front**, 8 mutations.

- **15** — L'application est **assemblée** — machine, période, sélection, timeline — et un **seul** test Playwright joue le parcours du critère de sortie sur les deux dispositions, en 2,5 s chacune. Il part d'un **profil vierge**, compte les gestes (35 pour 30 titres, le KPI de §22.3) et assert le **nombre exact** de moments. **Il a trouvé un défaut qu'aucun test d'API ne pouvait voir** : le front envoie chaque ligne sous le même identifiant de lot pour former un épisode (§4.4), et l'API traitait un lot connu comme « déjà enregistré » — une seule des trente déclarations survivait. L'idempotence porte désormais sur le couple (lot, cible). Deux autres trous comblés en chemin : le parcours passait d'abord **sur les restes** des exécutions précédentes, et `./web.sh test` ne vérifiait **jamais les types** — sept erreurs réelles dormaient dans une suite verte. 509 tests .NET, 120 tests front, **1 parcours × 2 dispositions**, 4 mutations dont 2 survivantes comblées.

- **16** — Bilan écrit dans PHASING.md §4. **Le geste central fonctionne de bout en bout ; le POC n'est pas en état d'être montré à un testeur** — et les deux propositions tiennent ensemble. Trois manques bloquent : les jaquettes annoncées mais non servies (218 images cassées sur la grille), l'écran de timeline inexistant, et la saisie d'un titre absent. **Deux de ces manques n'ont été trouvés qu'en faisant l'inventaire** : le test de l'item 13 vérifiait que l'URL de jaquette vaut `null` quand il n'y a pas de jaquette, jamais qu'elle résout quand il y en a une — et Playwright n'échoue pas sur une image cassée. Inscrits aux items 17 à 19 : un bilan qui constate sans ouvrir de travail n'est qu'un constat.
