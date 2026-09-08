# Modèle de domaine

> Premier livrable de la [Phase 0](./PHASING.md) §3. Il consolide des décisions prises au fil de [SPECIFICATION.md](./SPECIFICATION.md) et éprouvées par les [maquettes](./maquettes/) — jusqu'ici dispersées en prose sur §4 à §7.
>
> Ce document décrit **le modèle, pas le schéma**. Les noms de tables et les types SQL relèvent de l'implémentation ; ce qui est figé ici, ce sont les entités, ce qu'elles portent, et les règles qui doivent tenir.

---

## 1. Deux univers, deux régimes

| | REFERENCE DATA | USER DATA |
|---|---|---|
| Contenu | jeux, plateformes, studios, éditions | événements, expériences, exemplaires, profil |
| Volume | grand | petit par utilisateur |
| Écriture | rare, centralisée, versionnée | permanente, personnelle |
| Lecture | massive, identique pour tous | filtrée par utilisateur |
| Stockage | PostgreSQL en Phase 1 ; format compact décidé par mesure en Phase 7 | PostgreSQL |
| Effacement | sans objet | **partitionné par utilisateur** (§19.4) |

Aucune clé étrangère de REFERENCE vers USER. L'inverse est la règle, via un identifiant canonique stable (§5).

---

## 2. Événements, déclarations, projections

Le produit est bâti sur des événements (§5.1), mais **tout n'est pas un événement**, et le prétendre produirait un modèle dogmatique.

| Nature | Définition | Exemples |
|---|---|---|
| **Événement** | quelque chose qui s'est produit, situé dans le temps | découvert, commencé, terminé, abandonné, acquis, cédé |
| **Déclaration** | un jugement permanent, sans date, révisable | affect, provenance, « jamais joué » |
| **Projection** | calculé à la lecture depuis les deux précédents | collection actuelle, statut d'achèvement, taux de complétion |

La règle de partage est simple : **si la question « quand ? » a une réponse, c'est un événement ; sinon c'est une déclaration.** « J'ai adoré ce jeu » n'a pas de date ; forcer un horodatage inventerait une précision, ce que §7.4 interdit.

Aucun état n'est stocké comme tel. La collection actuelle, les jeux terminés, les périodes actives sont **toujours** recalculés.

> **Portée technique** (§5.5) : table en ajout seul dans PostgreSQL + projections calculées à la lecture, matérialisées seulement quand la mesure le justifie. Pas d'event store dédié, pas de framework CQRS.

---

## 3. Le type temporel

`TemporalValue` est un **type valeur**, jamais une entité. Toute date de la vie du joueur passe par lui ; aucun `DateTime` nu n'existe dans USER DATA.

### Sept variantes

| Variante | Porte | Exemple |
|---|---|---|
| `ExactDate` | jour, mois, année | 15 mars 1994 |
| `Month` | mois, année | mars 1994 |
| `Year` | année | 1994 |
| `Range` | deux années | 1993–1997 |
| `ApproximateYear` | année, marge | 1994 ± 2 |
| `Age` | **âge brut** | vers mes 12 ans |
| `Unknown` | rien | — |

### Normalisation

Toute valeur se normalise en **un intervalle fermé `[début, fin]` plus un point représentatif** — par convention le milieu de l'intervalle — utilisé pour le tri.

### Règles impératives

1. **L'ordre est partiel.** `Range(1993–1997)` et `Year(1995)` se chevauchent et ne sont pas comparables strictement. Toute comparaison passe par une algèbre d'intervalles explicite — avant, chevauche, contient, égal — jamais par un `<` sur des dates.
2. **`Unknown` n'a pas de place sur l'axe.** Ces moments sont regroupés à part, jamais projetés à une position arbitraire.
3. **`Age` se stocke brut.** Jamais converti à l'écriture : une correction de l'année de naissance doit recalculer tous les moments concernés. Sans année de naissance connue, `Age` se comporte comme `Unknown`.
4. **`Confidence` est dérivé, jamais demandé** : date exacte ou mois → haute, année → moyenne, période ou approximation → basse, inconnu → nulle.
5. **Les requêtes ont deux modes** (§7.7) : *strict* — l'intervalle est entièrement inclus ; *permissif* — il chevauche. Permissif pour la narration, strict pour les chiffres annoncés. Le mode retenu est visible dans l'interface.

### Modes de saisie dérivés

Deux questions produisent une `TemporalValue` sans que l'utilisateur manipule ces types :

- **la fenêtre commerciale d'une console** (§3.4) — « à sa sortie », « sur le tard », « bien après, d'occasion » ;
- **la position par rapport à la sortie d'un jeu** (§4.8) — « à sa sortie » → `Year(R)`, « peu après » → `Range(R+1, R+3)`, « bien plus tard » → `Range(R+4, …)`.

⚠️ **Ce sont des modes de saisie, pas des variantes.** N'ajoutez pas `RelativeToRelease` au type : la résolution se fait à l'écriture, seule son issue est conservée.

---

## 4. Données de référence

### La chaîne d'une œuvre

Quatre niveaux, et les confondre casse tout (§6.2, §6.3) :

```
Work ──────── l'œuvre abstraite            Final Fantasy VII
 └─ GameVersion ── une refonte             remaster, remake exclu (voir plus bas)
     └─ Release ── plateforme + région     PS1 · PAL · 1997
         └─ Edition ── objet commercial    Platinum
```

- **`Work`** — titre canonique, studio, éditeur, genres, année de première sortie, **`Notability`** (§3.3, requis : la sélection massive ordonne par lui), alias, série.
- **`GameVersion`** — distingue un remaster ou un portage significatif de l'œuvre d'origine. **Un remake n'est pas une `GameVersion` : c'est un `Work` distinct**, relié par une `WorkRelation`. Final Fantasy VII Remake est une autre œuvre.
- **`Release`** — une `GameVersion` sur une `Platform` dans une `Region`, avec sa date. **La région est requise dès la Phase 1** (§3.4) : elle change les titres autant que les dates.
- **`Edition`** — l'objet commercial précis : standard, Platinum, collector, numérique.

### `WorkRelation`

Type nommé, jamais implicite : `remake`, `remaster`, `prequel`, `sequel`, `spinoff`, `sameSeries`.

### Plateformes et matériel

- **`Platform`** — constructeur, génération, et **fenêtre commerciale `from`/`to`** par région. Cette fenêtre n'est pas décorative : elle encadre la datation et sert d'amorce de mémoire (§3.4).
- **`Generation`** — porte l'époque, donc l'accent chromatique du langage visuel.
- **`Manufacturer`**, **`Studio`**, **`Publisher`**, **`Genre`**, **`Accessory`**.

### Provenance, transverse à toute donnée de référence

`Source` · `ExternalId` · `CanonicalId` · `Alias` · `Locale` · `Confidence` · `DatasetVersion` (§18.4).

**Les identifiants canoniques sont stables et jamais réattribués.** Un journal des fusions et scissions permet de rediriger les références utilisateur lors d'un changement de version (§15.3) — sans lui, la première canonicalisation sérieuse casse des profils constitués.

### Ce que le référentiel ne contient pas

**Aucun synopsis** (§3.6). Il porte de quoi *identifier* — alias régionaux, titres non latins, un fait qui situe — et des `ExternalId` pour *renvoyer*. Décrire n'est pas son métier, recopier une base tierce est illicite, et la curation est déjà le poste le plus lourd du projet.

---

## 5. Données utilisateur

### `User`

Identité, et **année de naissance facultative** — elle ne sert qu'à résoudre `Age`, doit être justifiée à l'utilisateur, et n'est jamais publiée (§7.6, §12.3).

### `PlayerEvent` — le journal

En ajout seul, partitionné par utilisateur.

| Champ | Rôle |
|---|---|
| `UserId` | partition, et clé de la purge (§19.4) |
| `Type` | voir la liste ci-dessous |
| `Target` | `Work`, `Release`, `Edition`, `Platform` ou `UnresolvedGameClaim` |
| `OccurredAt` | **`TemporalValue`** — quand cela s'est produit dans la vie du joueur |
| `RecordedAt` | horodatage système exact — quand la déclaration a été enregistrée |
| `Confidence` | dérivé de `OccurredAt` |
| `Source` | saisie manuelle, import, déduction |
| `SupersededBy` | correction éventuelle |

**Les deux axes temporels sont la différence structurante** avec un event sourcing classique (§5.2). Un utilisateur déclare en 2026 avoir terminé un jeu en 1998. Les confondre rend impossibles à la fois la timeline — qui lit `OccurredAt` — et l'audit ou l'annulation, qui lisent `RecordedAt`.

**Ce sont des souvenirs, pas des faits observés** (§5.3). Ils sont révisables par leur auteur, simplement ; la correction est une fonctionnalité de premier plan, pas une exception. La révision est conservée côté système sans être exposée.

#### Types d'événements

*Expérience* — `DiscoveredGame`, `StartedGame`, `CompletedGame`, `AbandonedGame`, `ReplayedGame`
*Possession* — `AcquiredItem`, `SoldItem`, `LostItem`, `LentItem`, `BorrowedItem`, `ReturnedItem`
*Matériel* — les mêmes, avec une `Platform` ou un `Accessory` pour cible (§4.3)

### `PlayDeclaration` — les déclarations permanentes

Un enregistrement par couple utilisateur / œuvre, sans date.

| Champ | Valeurs | Note |
|---|---|---|
| `NeverPlayed` | booléen | déclaration **positive**, distincte du silence (§24.3) |
| `Provenance` | `Owned` · `Elsewhere` · `Borrowed` · `Unknown` | §4.5 |
| `Affect` | `Indifferent` · `Loved` · `Favourite` | §4.7 |

**`Favourite` est unique par plateforme.** En désigner un second rétrograde le précédent en `Loved`.

`Provenance` a un **niveau de précision supérieur** : quand un `UserOwnedItem` existe, il fait foi et `Provenance` vaut `Owned`. L'attribut est la déclaration à un geste ; l'exemplaire est la déclaration riche. En cas de contradiction, l'exemplaire l'emporte.

### `UserOwnedItem`

Un exemplaire réellement possédé — jeu **ou matériel**. Porte l'`Edition`, la région, et se date par ses événements `AcquiredItem` / `SoldItem`. C'est ce qui permet à Final Fantasy VII d'être possédé quatre fois sur trois décennies (§6.1).

### `Memory` — le souvenir

Texte libre attaché à un événement, une œuvre ou une période. Visibilité propre. C'est le contenu le plus précieux du produit (§9) et le seul qui ne soit pas généré.

### `UnresolvedGameClaim`

Titre libre saisi quand le référentiel ne contient pas le jeu (§3.5). Enregistré normalement, marqué non canonique, **rattachable plus tard sans perte d'historique ni de dates**. Constitue le meilleur signal de priorisation pour l'extension du référentiel.

### `BacklogItem` et `WishlistItem`

Deux intentions distinctes (§10) : **jouer** contre **posséder**. Un jeu possédé et non joué est dans le backlog, pas dans la wishlist.

### `VisibilitySettings`

Un réglage **par bloc** — timeline, collection actuelle, collection historique, statistiques, journal, backlog et wishlist (§12). Tout est privé par défaut.

### Phase 5

`Follow`, `PublicProfile`, `ProfileComparison`. Hors périmètre jusqu'à validation de l'usage individuel.

---

## 6. Projections

Aucune n'est stockée comme état de vérité.

| Projection | Se calcule depuis |
|---|---|
| Collection **à une date** | événements de possession, filtrés par intervalle |
| Statut d'achèvement | `CompletedGame` → fini ; `AbandonedGame` → abandonné ; `StartedGame` sans les deux → **toujours en cours** |
| Timeline | tous les événements, ordonnés par l'algèbre d'intervalles |
| Périodes actives | densité d'événements par tranche |
| Goûts | genres, studios, franchises, pondérés par l'affect |
| Taux de complétion | fini ÷ déclaré, par plateforme et global |

**« Toujours en cours » est une absence, pas un événement** — c'est la projection la plus subtile du modèle, et elle comble un manque que §4.1 ne nommait pas.

---

## 7. Invariants

Ce qui doit tenir, quoi qu'il arrive.

1. Tout `PlayerEvent` porte `OccurredAt` **et** `RecordedAt`.
2. `Unknown` n'est jamais projeté sur un axe temporel.
3. `Age` est stocké brut et résolu à la lecture.
4. `Confidence` est dérivé, jamais saisi.
5. Possession et expérience sont indépendantes : on peut jouer sans posséder, posséder sans jouer.
6. `Favourite` est unique par plateforme.
7. Les trois positions d'achèvement sont exclusives.
8. `NeverPlayed` exclut toute autre déclaration sur la même œuvre.
9. Un `CanonicalId` n'est jamais réattribué.
10. Une incohérence produit un avertissement, **jamais un refus** (§5.4).
11. Tout `PlayerEvent` est joignable par `UserId` seul — condition de la purge.

---

## 8. Ce qui n'est délibérément pas modélisé

| Absent | Pourquoi |
|---|---|
| **Temps de jeu agrégé** | La donnée n'existe pas pour l'essentiel du parcours rétro. S'il est stocké, il l'est **typé par origine** — importé, déclaré, estimé — et jamais additionné en un total unique (§11.3) |
| **Note sur cinq ou dix** | Une note juge l'œuvre ; l'affect enregistre une relation. Une échelle ferait dériver le produit vers le site de critiques |
| **Synopsis, captures** | §3.6 |
| **Huitième variante temporelle** | Le relatif est un mode de saisie |
| **« Terminé à 100 % »** | Profondeur de complétion, pas position dans le déroulement — et vide pour une grande part du catalogue (§4.6). Reviendra comme raffinement de « fini », sur les seuls titres où la notion a un sens |
| **Fil d'actualité** | Ferait du social un second produit ([PHASING.md](./PHASING.md) §8) |

---

## 9. Périmètre par phase

| Phase 1 — POC | Phase 3 — MVP | Phase 4+ |
|---|---|---|
| `Work`, `Release`, `Platform`, `Generation`, `Studio`, `Genre` | `Edition`, `GameVersion`, `WorkRelation` | `Follow`, `PublicProfile` (5) |
| `Notability`, `Region`, `Alias` | `DatasetVersion`, `Source`, `ExternalId`, `CanonicalId` | Import : `ExternalUserId`, `ImportedAt` (4) |
| `PlayerEvent`, `PlayDeclaration`, `Memory` | `UserOwnedItem` détaillé, `BacklogItem`, `WishlistItem` | |
| `UnresolvedGameClaim`, `TemporalValue` | `User` authentifié, `VisibilitySettings` | |

La Phase 1 tourne **sans compte** : les déclarations vivent localement jusqu'à l'inscription, qui les rattache (§E12).

---

## 10. Ce qu'il reste à trancher

| Point | Pourquoi c'est bloquant |
|---|---|
| **Stratégie d'effacement** — purge physique par utilisateur ou crypto-shredding | Engage le schéma ; différer coûte une migration (§19.4) |
| **Format des identifiants canoniques** | Conditionne les fusions et scissions (§15.3) |
| ~~Décision sur les visuels~~ | **Tranchée** (§19.2) : tuiles générées en socle, vraies jaquettes pour les 100–300 titres du POC. La curation collecte donc des références d'images. Reste l'acquisition |
| **Cibles chiffrées des KPI** | Sans elles, la porte de Phase 2 sera interprétée après coup (§22.2) |

---

## 11. Cas de validation

Le modèle est validé quand ces parcours se rejouent en produisant l'état attendu. Ils servent de tests de non-régression permanents (§17.4).

1. **Game Boy 1991 → retrogaming 2018** (§7.1) — trente ans, une console revendue puis rachetée.
2. **Final Fantasy VII** (§6.1) — PS PAL Platinum, version numérique PC, et le remake **hors** de la chaîne.
3. **Joué sans posséder** — Street Fighter II chez un cousin, aucun `UserOwnedItem`, `Provenance = Elsewhere`.
4. **Le souvenir flou** — « vers mes 12 ans », année de naissance renseignée plus tard, tous les moments concernés se recalculent.
5. **La compilation** (§6.3) — posséder la compilation implique-t-il posséder les jeux ? Réponse attendue : non, mais l'expérience des jeux est déclarable.
6. **La rétrocompatibilité** — jouer un jeu Mega Drive sur Switch relève de quelle `Release` ?
7. **La scission** — une fiche du référentiel se scinde en deux ; les événements utilisateur pointant vers elle se redirigent sans perte.
