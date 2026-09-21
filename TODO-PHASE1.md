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
| **Référentiel chargé en mémoire depuis le fichier** | 221 œuvres et 592 sorties tiennent en quelques centaines de kilo-octets. `DatasetLoader` vérifie les invariants **au démarrage** : un dataset corrompu se voit au lancement, pas à la première requête d'un testeur |

Pile verrouillée en [PHASING.md](./PHASING.md) §4 : .NET 10 LTS + EF Core 10,
React + TypeScript (Vite), TanStack Query, PostgreSQL 17+.

---

## Socle

- [x] **01 — Squelette de la solution.** Ajouter `DigitalTwin.Api` (API minimale .NET 10) et `DigitalTwin.Api.Tests` à `src/DigitalTwin.slnx`, un `docker-compose.yml` avec PostgreSQL 17, et `web/` (Vite + React + TypeScript). *Acceptation : `./test.sh` exécute les tests du domaine ET de l'API ; `./web.sh test` exécute ceux du front ; l'API répond sur un point de santé qui **inclut l'état de la base** — un point de santé vert alors que la base est tombée ne sert à rien.*

- [x] **02 — Le référentiel au démarrage.** Charger `dataset/poc.json` via `DatasetLoader` à l'amorçage, et **refuser de démarrer** si le dataset porte une violation, en nommant l'entrée fautive. Exposer `GET /platforms` et `GET /platforms/{id}/works`. *Acceptation : les œuvres reviennent ordonnées par `notability` **de cette plateforme** ; Bubble Bobble apparaît sur Game Boy et sur NES avec deux rangs différents ; un dataset corrompu empêche le démarrage avec un message nommant l'entrée.*

- [x] **03 — Les événements en base.** Modèle EF Core de `PlayerEvent` : table en ajout seul, deux axes temporels (`OccurredAt`, `RecordedAt`), `SupersededBy`, partitionnement par utilisateur prévu (§10.1). Migration PostgreSQL. *Acceptation : un aller-retour en base préserve **les sept variantes** de `TemporalValue` à l'identique, y compris `Age` non résolu et `Unknown` ; un événement déclaré en 2026 pour un fait de 1998 garde ses deux dates distinctes ; aucune mise à jour en place n'est possible.*

- [ ] **03b — Une sortie ne peut pas précéder sa machine.** Porter `launch_year` sur `Platform` dans le dataset et dans le modèle, et en faire un invariant vérifié par `DatasetLoader`. *Acceptation : le dataset réel est refusé tant que Bubble Bobble sur Game Boy porte sa date Famicom du 30 octobre 1987 — la Game Boy est sortie en 1989 ; une fois la date corrigée, il passe. L'anomalie vient du repli « aucune tête de plateforme → tout le champ » de l'analyseur d'infobox, qui mord sur les titres multiplateformes : le corriger là aussi, avec son cas dans `test_wp_parser.py`.*

## E02 — la sélection massive

- [ ] **04 — Passe 1 : plateforme et période.** `GET /platforms` alimente le choix de machine ; la période est une `TemporalValue` approximative (§24.3). *Acceptation : les huit plateformes reviennent dans l'ordre chronologique de génération ; une période « vers 1995 » produit un `ApproximateYear` de marge ≥ 1, pas une année exacte.*

- [ ] **05 — Passe 2 : cocher joué / terminé / possédé.** `POST /declarations` accepte un **lot**. *Acceptation : trente déclarations en un appel produisent trente événements ; rejouer le même lot ne duplique rien ; une plateforme inconnue est refusée **en la nommant** ; « terminé » implique « joué » sans créer deux événements contradictoires.*

- [ ] **06 — « Jamais joué » est une déclaration.** (§24.3) Pas une absence de réponse. *Acceptation : un titre déclaré « jamais joué » se distingue en base d'un titre non coché, et la distinction survit à un rechargement.*

- [ ] **07 — Le jeu absent du référentiel.** (§3.5) Sur 221 titres, le cas est permanent. *Acceptation : un testeur peut saisir un titre absent sans être bloqué ; l'entrée est marquée comme non référencée et n'est jamais confondue avec une œuvre curée.*

## E03 — la timeline

- [ ] **08 — Projection de timeline.** `GET /timeline` s'appuie sur `TimelineSorter`. *Acceptation : les huit cas de validation rejoués **à travers l'API** produisent le même ordre que les tests du domaine ; les moments sans date reviennent dans le tiroir, pas mélangés ; les incohérences causales reviennent comme avertissements et ne bloquent rien.*

- [ ] **09 — Restitution immédiate.** (§24.4) La timeline se remplit **pendant** qu'on coche. *Acceptation : un test de composant prouve que cocher un titre modifie la timeline sans rechargement ni appel complet ; un POC qui ne montre le résultat qu'à la fin ne teste pas la bonne chose.*

## L'incertitude, visible

- [ ] **10 — Afficher ce qu'on ne sait pas.** Dates approximatives, `Age` non résolu, zone sans date. *Acceptation : une date à l'année ne s'affiche jamais comme une date au jour ; les 31 sorties à l'année seule sont reconnaissables à l'écran ; un test de composant le vérifie sur les trois précisions.*

- [ ] **11 — Région et non-sortie.** Les trois états de `region_status`. *Acceptation : « jamais sorti en Europe » (22 cas établis) s'affiche différemment de « région inconnue » (33 cas) et de « sorti » ; **aucune des trois ne se rend par l'absence d'indication**.*

- [ ] **12 — Souvenir minimal.** (§9) Note libre sur un événement. *Acceptation : la note se saisit sans quitter la sélection, survit au rechargement, et est facultative — c'est elle qui produit « oui, ça me ressemble », le critère de sortie de la Phase 2.*

## Forme et sortie

- [ ] **13 — Deux dispositions, pas une étirée.** (§21.2, [langage visuel](./ecrans/00-langage-visuel.md) §6) Liste dense sur mobile, grille visuelle sur desktop avec les 218 jaquettes. *Acceptation : un test de composant vérifie les deux dispositions aux points de rupture déclarés ; une œuvre sans jaquette rend une tuile générée et jamais un trou.*

- [ ] **14 — Aucun libellé en dur.** (§20, décision « international dès le départ ») *Acceptation : un test échoue si une chaîne visible par l'utilisateur est écrite dans un composant ; le français est la seule langue livrée, et c'est un choix, pas une contrainte du code.*

- [ ] **15 — Le parcours de bout en bout.** Playwright, **un seul test** : choisir une console, une période, cocher trente titres, voir la timeline se remplir, ajouter une note. *Acceptation : il passe sur la grille desktop et sur la liste mobile ; il mesure le nombre de gestes, qui est le KPI de §22.3.*

- [ ] **16 — Bilan.** Mettre à jour [PHASING.md](./PHASING.md) §4 : ce qui est livré, ce qui ne l'est pas, et si le POC est en état d'être montré à un testeur. *Acceptation : le fichier dit la vérité, y compris si le POC n'est pas présentable.*

---

## Journal

Une ligne par item terminé, ajoutée dans le commit qui le clôt.

- **01** — `DigitalTwin.Api` (API minimale) et `DigitalTwin.Api.Tests` ajoutés, `docker-compose.yml` (PostgreSQL 17, port hôte 5433), `web/` (Vite + React + TS + Vitest), `web.sh` sur le modèle de `dotnet.sh`. Point de santé qui interroge vraiment la base : 200, 503 avec la cause nommée quand elle tombe, 200 de nouveau à la reprise — vérifié contre une vraie base. **`dotnet test` sur la solution n'exécutait qu'un projet de test sur deux, en affichant `Passed!`** : `test.sh` boucle désormais sur chaque projet et refuse de rendre 0 si la découverte est vide. 387 tests .NET, 4 tests front, 7 mutations conformes dont la survivante voulue.

- **02** — Le référentiel est lu une fois au démarrage et gardé en mémoire ; un dataset **absent ou fautif empêche le démarrage**, en nommant l'entrée. `GET /platforms` et `GET /platforms/{id}/works`, les œuvres ordonnées par le rang **de cette plateforme**, leurs sorties et leur statut régional restreints à cette machine. Bubble Bobble y figure deux fois, rangs 19 et 22, sous un seul identifiant. **Piège d'hôte** : lire `builder.Configuration` avant `Build()` ignore les sources ajoutées par l'hôte de test — la configuration se lit dans la fabrique, et la résolution est forcée juste après la construction. **Anomalie trouvée** : une sortie Game Boy datée de 1987, inscrite à l'item 03b. 399 tests .NET, 4 tests front, 8 mutations conformes dont la survivante voulue.

- **03** — `PlayerEventDbContext` + migration PostgreSQL. Les **huit formes** de `TemporalValue` survivent à l'aller-retour — sept variantes, mais une période peut être ouverte. `Age` reste brut, `Unknown` se distingue de l'absence, et une variante écrite par une version plus récente **échoue** au lieu d'être lue comme « inconnue ». Les deux axes restent distincts ; la troncature de `timestamptz` à la microseconde est constatée par un test plutôt que découverte sur un départage de tri. L'ajout seul est tenu **à deux niveaux** : le contexte protège l'application, un déclencheur SQL protège la base de tout le reste. Il autorise la seule pose du marqueur de remplacement, une seule fois — MODELE §5 exige de « marquer l'ancien comme remplacé », ce qui est une mise à jour. La suppression reste possible pour la purge de §10.1. Clé primaire `(user_id, id)` : partitionner devient une migration, pas un changement de modèle. `test.sh` démarre PostgreSQL et **échoue** s'il ne vient pas — une suite qui saute les tests de persistance ressemble exactement à une suite qui les a passés. 418 tests .NET, 4 tests front, 9 mutations conformes dont la survivante voulue, comblée ensuite.
