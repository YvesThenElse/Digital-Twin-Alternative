# Ordonnancement temporel

> Livrable de la [Phase 0](./PHASING.md) §3, en réponse à [SPECIFICATION.md](./SPECIFICATION.md) §7.5 — désigné comme « le point non résolu de la v1 » et comme le plus sous-spécifié du modèle.
>
> [MODELE-DE-DOMAINE.md](./MODELE-DE-DOMAINE.md) §3 pose les sept variantes et les cinq règles impératives ; **il reste normatif sur le type**. Ce document traite la seule opération que ces règles ne décrivent pas : **comparer, trier, regrouper et interroger** des valeurs temporelles dont l'ordre est partiel — ce que la timeline (E03), la passe temporelle (E14) et les statistiques (E10) font en permanence.

---

## 1. Ce qui est tranché ici

| Question | Réponse |
|---|---|
| Comment comparer deux moments flous ? | Algèbre d'intervalles réduite à sept relations (§3) |
| Comment produire une liste affichable alors que l'ordre est partiel ? | Cascade de départage déterministe (§4) |
| Que fait-on des bornes ouvertes (« bien plus tard ») ? | Horizon de domaine + tri sur la borne connue (§2.3) |
| Où vont les moments sans date ? | Hors axe, dans un tiroir ordonné par `RecordedAt` (§6) |
| Que répond « possédais-tu ce jeu en 1997 ? » | Trois valeurs — certain, possible, non (§7.3) |
| Quand `Age` rejoint-il l'axe ? | À la résolution de l'année de naissance, par recalcul (§8) |

---

## 2. Forme normale

### 2.1 L'intervalle

Toute `TemporalValue` se projette en un **intervalle fermé au jour**, plus un **point représentatif**.

| Variante | Intervalle `[début, fin]` | Point représentatif |
|---|---|---|
| `ExactDate(d)` | `[d, d]` | `d` |
| `Month(m, a)` | `[1er m a, dernier jour de m a]` | milieu |
| `Year(a)` | `[1 jan a, 31 déc a]` | milieu |
| `Range(a₁, a₂)` | `[1 jan a₁, 31 déc a₂]` | milieu |
| `ApproximateYear(a, ±n)` | `[1 jan (a−n), 31 déc (a+n)]` | milieu |
| `Age(x)` résolu | voir §8 | milieu |
| `Age(x)` non résolu | **aucun** | **aucun** |
| `Unknown` | **aucun** | **aucun** |

Le milieu se calcule en jours et s'arrondit vers le bas. Il n'a aucune signification sémantique.

### 2.2 Deux règles qui gouvernent tout le reste

> **⚠️ La normalisation ajoute, elle ne remplace pas.** La variante d'origine est conservée. `Year(1994)` et `Range(1994, 1994)` produisent le **même** intervalle et **ne s'affichent pas pareil** — point creux contre bande ([principes transverses](./ecrans/00-principes-transverses.md) §2). Un modèle qui ne stockerait que l'intervalle aurait perdu l'information que l'utilisateur a donnée. L'intervalle est **dérivé**, jamais primaire.

> **⚠️ Le point représentatif est une clé de tri, rien d'autre.** Il ne s'affiche jamais, ne s'exporte jamais, n'entre dans aucun calcul annoncé à l'utilisateur. Le milieu de `Year(1994)` est le 2 juillet 1994 : l'afficher fabriquerait exactement la précision que §7.4 interdit. Sa seule fonction est de donner un ordre stable à des éléments qui n'en ont pas.

### 2.3 Les bornes ouvertes

`Range(a, …)` existe : §4.8 produit « bien plus tard » → `Range(R+4, …)`. Une borne manquante se ferme sur l'**horizon de domaine** :

- **plancher** : l'année de naissance de l'utilisateur si elle est connue, **1972** sinon — antérieurement, il n'y a rien à déclarer ;
- **plafond** : **aujourd'hui** — un souvenir ne se situe pas dans l'avenir.

> **Un intervalle semi-ouvert se trie sur sa borne connue, pas sur son milieu.** Le plafond bouge chaque jour ; le milieu d'un intervalle qui s'appuie dessus dérive donc lentement, et un élément qui change de place entre deux visites détruit la confiance dans un écran qu'on revient consulter (E03). Un intervalle ouvert vers le futur se trie sur son début ; ouvert vers le passé, sur sa fin.

L'horizon est un artefact de rendu et de tri. **Il ne s'écrit jamais dans la donnée** : corriger une année de naissance doit recalculer, pas réconcilier.

### 2.4 Confiance

`Confidence` est dérivé de la variante, jamais saisi (invariant 4). La table de dérivation est celle des [principes transverses](./ecrans/00-principes-transverses.md) §2 ; elle n'est pas redéfinie ici. On note seulement que **la confiance ne participe pas au tri** : elle qualifie le rendu et filtre les statistiques, elle ne déplace pas un moment sur l'axe.

---

## 3. Comparer : sept relations

Les treize relations d'Allen sont complètes mais surdimensionnées pour ce produit. Le modèle en retient sept, dont **une seule** est un ordre.

| Relation | Condition | Usage |
|---|---|---|
| **Avant** | `a.fin < b.début` | seule relation d'ordre strict |
| **Après** | `b.fin < a.début` | symétrique |
| **Contient** | `a.début ≤ b.début` et `b.fin ≤ a.fin` | une période englobe un moment |
| **Contenu dans** | symétrique | un moment précis dans une période floue |
| **Chevauche** | intersection non vide, aucun ne contient l'autre | le cas fréquent |
| **Égal** | bornes identiques | rare, mais pas un chevauchement |
| **Incomparable** | l'un des deux n'a pas d'intervalle | `Unknown`, `Age` non résolu |

> **`a ≺ b` si et seulement si `a.fin < b.début`.** Tout le reste est un chevauchement, et un chevauchement n'est **pas** un ordre. C'est la traduction formelle de la règle impérative n°1 : aucune comparaison ne passe par un `<` sur des dates.

Conséquences directes :

- `Range(1993–1997)` et `Year(1995)` sont en relation **Contient**, pas en relation d'ordre. Les afficher l'un au-dessus de l'autre n'affirme rien.
- Deux moments **Égaux** ne sont pas simultanés : ils sont indiscernables à la granularité déclarée. Nuance qui compte pour §4.3.
- Une relation **Avant** entre deux moments qui se contredisent causalement est une **incohérence** (§4.3), pas une erreur de tri.

---

## 4. Ordonner : de l'ordre partiel à une séquence

La timeline est une liste verticale. Elle doit afficher **une** séquence, alors que l'ordre est partiel. Il faut donc un ordre total de présentation — qui n'est **pas** une affirmation chronologique.

### 4.1 La cascade de départage

Appliquée dans l'ordre, jusqu'au premier critère discriminant :

| # | Critère | Pourquoi |
|---|---|---|
| 1 | **Point représentatif** croissant (ou borne connue si semi-ouvert, §2.3) | approximation raisonnable de « quand », et c'est une **clé**, pas une comparaison — la position d'un élément ne dépend jamais des autres |
| 2 | **Borne de début** croissante | à milieu égal, la période la plus large commence plus tôt et doit s'ouvrir au-dessus du point qu'elle contient |
| 3 | **Largeur** croissante | départage résiduel ; à début égal, le plus précis d'abord |
| 4 | **Cohérence causale** sur la même œuvre (§4.3) | « terminé » ne s'affiche pas au-dessus de « commencé » |
| 5 | **`RecordedAt`** croissant | seul horodatage exact du modèle (§5.2) |
| 6 | **Identifiant de l'événement** | total et jamais réattribué (§10.2) — garantit le déterminisme |

> **Le déterminisme n'est pas un détail d'implémentation.** E03 est un écran où l'on revient (KPI §22.1). Un tri qui dépend de l'ordre d'insertion, du hasard ou du fuseau produit une timeline qui « bouge » d'une visite à l'autre — un utilisateur ne distingue pas cela d'une perte de données. Les critères 5 et 6 existent uniquement pour fermer ce cas.

### 4.2 Ce que l'ordre d'affichage ne dit pas

> **⚠️ Lire de haut en bas n'affirme pas « puis ».** Quand deux moments se chevauchent, le rendu doit montrer le chevauchement — bandes qui se recouvrent, indentation, regroupement — et non le masquer par un empilement qui suggérerait une succession. C'est le piège explicitement nommé par [E03](./ecrans/E03-timeline.md).

Corollaire : un moment ne doit jamais être déplacé pour « faire propre ». Une bande large qui traverse trois points précis est le rendu correct d'un souvenir flou.

### 4.3 La cohérence causale prime à intervalle non ordonné

Certains couples d'événements ont un ordre logique indépendant des dates déclarées :

`DiscoveredGame` → `StartedGame` → `CompletedGame` | `AbandonedGame` · `AcquiredGame` → `SoldGame` · `SoldGame` → `ReplayedGame`

> ⚠️ **Question ouverte, signalée le 21 septembre 2026 — non tranchée ici.** Le dernier maillon, `SoldGame → ReplayedGame`, contredit [SPECIFICATION.md](./SPECIFICATION.md) §5.4, qui range « joué après avoir vendu » parmi les cas **inhabituels**. Si rejouer après vente est inhabituel, alors l'ordre causal normal est l'inverse — et la règle telle qu'écrite fait lever un avertissement sur un parcours banal : acquis 1997, rejoué 1999, vendu 2002. Voir [TODO-PHASE0.md](./TODO-PHASE0.md) pour les trois issues possibles.

> ⚠️ **Noms à aligner.** Cette ligne écrit `AcquiredGame` / `SoldGame` ; [MODELE-DE-DOMAINE.md](./MODELE-DE-DOMAINE.md) §5, autoritaire sur le modèle, écrit `AcquiredItem` / `SoldItem`.

Deux cas, et un seul est un problème :

| Situation | Traitement |
|---|---|
| Les intervalles **ne sont pas** strictement ordonnés (égaux, chevauchants, contenus) | La séquence causale départage — critère 4. Silencieux : l'utilisateur n'a rien déclaré de contradictoire |
| Les intervalles **sont** strictement ordonnés **à l'envers** (terminé Avant commencé) | Afficher **tel que déclaré**, et lever un **avertissement doux** (§5.4, invariant 10). Jamais de refus, jamais de correction automatique |

Réordonner silencieusement serait pire que l'incohérence : le produit prétendrait connaître le souvenir mieux que son auteur, ce que §5.3 interdit — les événements sont des déclarations révisables **par leur auteur**.

### 4.4 Agrégation

Un lot déclaré en E02 forme **un épisode**, pas douze moments indépendants. La règle de regroupement :

1. même intervalle normalisé **et** même lot de saisie → un épisode ;
2. l'intervalle de l'épisode est l'**union** des intervalles ; son point représentatif se recalcule sur cette union ;
3. l'épisode se trie comme un moment unique, par la même cascade ;
4. **le regroupement ne franchit jamais la frontière du datable** : un épisode ne contient pas de `Unknown`, et un `Unknown` n'est jamais absorbé par une bande voisine.

Au niveau de zoom « décennie », l'agrégation est plus large et purement visuelle : elle regroupe par tranche, sans créer d'entité. Déplier restitue la séquence exacte donnée par §4.1 — **le zoom ne change jamais l'ordre, seulement le grain**.

---

## 5. Rendu

Le rendu est fixé par les [principes transverses](./ecrans/00-principes-transverses.md) §2 et n'est pas redéfini ici. Deux points de liaison seulement :

- **le rendu se dérive de la variante, pas de la largeur de l'intervalle** — c'est l'autre moitié de la règle §2.2 ;
- **la largeur pilote la place occupée**, pas la forme : une bande de vingt ans et une bande de deux ans sont deux bandes, à l'échelle de l'axe.

---

## 6. La zone sans date

`Unknown` et `Age` non résolu sortent de l'axe (invariant 2) et vivent dans le tiroir de pied de page (E03, repère D).

- **Ordre dans le tiroir** : `RecordedAt` **décroissant** — le plus récemment déclaré d'abord. Il n'y a pas d'autre axe disponible, et c'est celui qui sert : ce qu'on vient de saisir est ce qu'on se rappelle le mieux dater.
- **Le tiroir est une tâche, pas une poubelle.** Il est dimensionné pour être vidé — c'est la relance de session la moins coûteuse du produit.
- **Un moment sans date reste un moment valide** ([E14](./ecrans/E14-passe-temporelle.md), principe 6). Il compte dans les totaux du profil ; il est seulement absent de l'axe.

---

## 7. Interroger

### 7.1 Les deux modes

Pour une période de requête `P` et un moment d'intervalle `I` :

| Mode | Prédicat | Défaut sur |
|---|---|---|
| **Strict** | `I ⊆ P` | E10 — tout chiffre annoncé |
| **Permissif** | `I ∩ P ≠ ∅` | E03, E08 — toute restitution narrative |

Le mode retenu est **visible et commutable** dans l'interface (§7.7). Les deux prédicats sont exacts ; ils ne répondent simplement pas à la même question.

### 7.2 L'obligation d'afficher l'exclusion

> **⚠️ Tout décompte en mode strict affiche ce qu'il a écarté.** « 12 jeux en 1995 » calculé sur des intervalles dont 7 sont trop larges pour être inclus et 4 sont `Unknown` est un chiffre faux présenté comme vrai — et il viole le troisième interdit du principe 2 (« ne jamais afficher un chiffre exact dérivé d'une donnée floue sans le marquer »).
>
> Forme attendue : `12 jeux en 1995 · 7 moments trop imprécis · 4 sans date`.

C'est la seule règle de ce document qui porte sur l'interface, et elle y est parce qu'aucune autre couche ne peut la garantir.

### 7.3 Les projections d'état sont à trois valeurs

« Possédais-tu ce jeu en 1997 ? » n'admet pas de réponse binaire quand l'acquisition est déclarée `Range(1993–1997)` et la cession `Year(1999)`.

| Réponse | Condition |
|---|---|
| **Certain** | l'acquisition se termine avant `D` **et** aucune cession ne peut précéder `D` |
| **Possible** | les intervalles autorisent l'état sans le garantir |
| **Non** | aucun recouvrement possible |

Le mode strict ne retient que **certain**. Le mode permissif retient **certain + possible**, et **distingue les deux à l'affichage** — une collection « telle qu'en 1997 » dont la moitié est incertaine doit le montrer, sans quoi le produit fabrique une précision qu'il a passé sept variantes à refuser.

Cela vaut pour toutes les projections datées de [MODELE-DE-DOMAINE.md](./MODELE-DE-DOMAINE.md) §6 : collection à une date, taux de complétion par période, périodes actives.

---

## 8. Résoudre `Age`

`Age` est stocké brut (règle impérative 3) et résolu **à la lecture**.

Avec la seule **année de naissance** `b`, « j'avais `x` ans » couvre deux années civiles : la personne a `x` ans depuis son anniversaire de l'année `b+x` jusqu'à celui de l'année `b+x+1`.

| Donnée connue | Intervalle de `Age(x)` |
|---|---|
| Année de naissance `b` | `[1 jan (b+x), 31 déc (b+x+1)]` |
| Date de naissance complète | `[anniversaire (b+x), veille de l'anniversaire (b+x+1)]` |
| Rien | **aucun intervalle** — comportement `Unknown` (§7.6) |

> **Pas de huitième variante, et pas de marge sur `Age`.** « Vers mes 12 ans » est déjà approximatif : la fenêtre de deux années civiles porte cette imprécision. Ajouter un `±n` donnerait deux manières de dire la même chose — et l'utilisateur qui veut être plus vague dispose déjà de `Range`. Cohérent avec le refus d'une variante `RelativeToRelease` ([MODELE-DE-DOMAINE.md](./MODELE-DE-DOMAINE.md) §3).

**La résolution est globale et rétroactive.** Renseigner ou corriger l'année de naissance recalcule *tous* les moments en `Age` : ils quittent le tiroir, se placent sur l'axe, se retrient. C'est exactement le cas de validation n°4, et c'est la raison d'être du stockage brut.

---

## 9. Ce qui est écarté

| Option | Pourquoi non |
|---|---|
| **Dates probabilistes** (distribution sur l'axe plutôt qu'intervalle) | Modélise mieux la mémoire et coûte un ordre de grandeur de plus partout — calcul, rendu, explicabilité. Un intervalle se dessine et se comprend ; une gaussienne ne se lit pas. Écarté par rapport qualité/coût, pas par principe |
| **Ordre total sur la borne de début seule** | Simple, et faux : `Range(1990–2010)` passerait avant tout moment des années 1990–2000. Le piège nommé par [E03](./ecrans/E03-timeline.md) |
| **Ordre total sur le point représentatif seul** | Non déterministe à égalité — et l'égalité est fréquente : `Range(1993–1997)` et `Year(1995)` ont le **même** milieu |
| **Projeter `Unknown` en fin d'axe** | Invariant 2. « À la fin » se lit « récemment », ce qui est une affirmation |
| **Convertir `Age` à l'écriture** | Rend la correction de l'année de naissance impossible sans migration |
| **Réordonner les incohérences causales** | §5.3 : les événements appartiennent à leur auteur. Avertir, jamais corriger |
| **`Confidence` comme critère de tri** | Trierait par qualité de souvenir au lieu de chronologie. La confiance qualifie, elle ne situe pas |

---

## 10. Jeu de tests d'ordonnancement

À écrire comme tests permanents (§17.4), au même titre que les sept cas de validation de [MODELE-DE-DOMAINE.md](./MODELE-DE-DOMAINE.md) §12 — dont ils sont le socle : aucun de ces cas ne se rejoue correctement si l'ordre n'est pas défini.

| # | Entrée | Attendu |
|---|---|---|
| **T1** | `Year(1991)`, `Year(1993)` | Relation **Avant**. Ordre strict, sans départage |
| **T2** | `Range(1993–1997)`, `Year(1995)` | **Contient**. Milieux identiques (2 juillet 1995) → critère 2 : la bande d'abord. Le rendu montre le point **dans** la bande |
| **T3** | `ApproximateYear(1994±2)`, `Year(1994)` | Milieux identiques → critère 2 : l'approximation d'abord. Deux rendus distincts (halo / point creux) malgré des intervalles imbriqués |
| **T4** | `StartedGame Year(1997)`, `CompletedGame Year(1997)` saisi **en premier** | Intervalles égaux → critère 4 : « commencé » au-dessus. `RecordedAt` ne doit pas l'emporter |
| **T5** | `CompletedGame Year(1995)`, `StartedGame Year(1998)` | Strictement **Avant** à l'envers → affiché tel quel **+ avertissement doux**. Aucun réordonnancement |
| **T6** | `Age(12)`, année de naissance absente puis renseignée (1982) | Tiroir → axe sur `[1994-01-01, 1995-12-31]`, retri complet. Cas de validation n°4 |
| **T7** | `Range(2001, …)`, sortie 1997 | Plafonné à aujourd'hui, **trié sur 2001** (§2.3). L'ordre ne change pas d'un jour à l'autre |
| **T8** | 12 titres déclarés en lot sur `Range(1993–1997)` | **Un** épisode, une bande, un point représentatif recalculé sur l'union (E03 repère B) |
| **T9** | Décompte strict sur 1995 : 12 inclus, 7 trop larges, 4 `Unknown` | Les trois nombres sont affichés (§7.2) |
| **T10** | Possession : acquisition `Range(1993–1997)`, cession `Year(1999)`, requête `D = 1997` | **Possible**, pas certain. Strict l'exclut, permissif l'inclut marqué (§7.3) |
| **T11** | Même jeu d'entrée trié deux fois, ordre d'insertion différent | **Séquences identiques** — le déterminisme est testé, pas supposé |

---

## 11. Notes d'implémentation

Hors périmètre du modèle, consignées pour ne pas être redécouvertes.

- **Matérialiser `[début, fin]` et la clé de tri** à côté de la variante. C'est une dénormalisation assumée : le calcul est pur et déterministe, mais le refaire à chaque tri interdit tout index.
- **PostgreSQL offre `daterange` et un index GiST** — adapté aux prédicats de §7.1. En Phase 1, deux colonnes `date` plus une clé de tri suffisent et se lisent mieux ; le passage au type intervalle est une optimisation de §7 déclenchée par mesure, jamais par anticipation.
- **`Age` interdit la matérialisation** : son intervalle dépend d'une donnée du profil, modifiable. Soit il se résout à la lecture, soit sa clé se recalcule à chaque changement d'année de naissance. Le volume par utilisateur rend les deux acceptables — **le choix ne doit simplement pas être implicite**.
- **L'horizon dépend de « aujourd'hui »** : toute fonction de normalisation le reçoit en paramètre. Sans quoi les tests T7 et T11 deviennent non reproductibles.
- **Le critère 3 de la cascade n'est pas atteignable** avec les sept variantes, et c'est démontrable : le point représentatif vaut `début + largeur / 2`, donc à début **et** milieu égaux les largeurs ne peuvent différer que de 1 — or toute valeur commençant un 1er janvier finit un 31 décembre. Vérifié sur 88 000 paires : aucune n'atteint ce critère. Il reste **défensif** et doit le rester ; le supprimer rendrait la cascade dépendante de l'ordre d'insertion le jour où une variante le rendrait atteignable.
- **L'ouverture vers le passé n'a aucun producteur.** §2.3 énonce la règle dans les deux sens, mais seul §4.8 fabrique des bornes ouvertes, et toujours vers le futur (« bien plus tard »). Le type `Range` n'exprime donc qu'une fin absente, jamais un début absent. La moitié « ouvert vers le passé, sur sa fin » reste vraie et **inemployée** — elle n'est pas un oubli d'implémentation, et le jour où un mode de saisie produirait un début ouvert, c'est le type qu'il faudrait étendre d'abord.
- **Une période ouverte commençant après le plafond n'est pas plaçable.** Elle n'est pas refusée pour autant (invariant 10) : elle rejoint les moments sans date, comme `Unknown`.
