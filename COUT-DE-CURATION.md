# Coût de curation du référentiel

> Livrable de la [Phase 0](./PHASING.md) §3, en réponse à [SPECIFICATION.md](./SPECIFICATION.md) §18.6 — « ce coût doit être évalué explicitement en Phase 0, car il conditionne à la fois le calendrier et le modèle économique ».
>
> Il s'appuie sur [VERIFICATION-JURIDIQUE.md](./VERIFICATION-JURIDIQUE.md), qui ferme la question des sources : **Wikidata (CC0) est la seule source réutilisable**, ce qui déplace tout le coût vers la vérification et l'enrichissement.

---

## 1. Le résultat en une ligne

> **Acquérir les données ne coûte presque rien. Les vérifier coûte des années-homme. Donc on ne vérifie pas tout — et le modèle sait déjà dire ce qu'il n'a pas vérifié.**

---

## 2. Décomposition du coût unitaire

Le dernier arbitrage de phasage l'a déjà énoncé : *« rédiger va vite, mais vérifier est le coût réel, et c'est précisément là que la génération automatique est peu fiable — dates de sortie, titres régionaux, disponibilité par région. »* Ce document le chiffre.

| Poste | Ce que c'est | Se comprime ? |
|---|---|---|
| **Acquisition** | Requête SPARQL sur Wikidata, projection vers `Work` / `Release` | ✅ **Quasi nul par entrée.** Coût fixe : quelques heures de requête et de mise en correspondance |
| **Vérification** | Titre canonique, studio, année, plateforme, **région**, titres régionaux | ❌ **Le poste réel.** Humain par construction : il s'agit de constater un désaccord entre sources |
| **Enrichissement** | `Notability` (absent de Wikidata), complétude `Region`, chaîne d'éditions | ❌ Jugement de domaine, pas de recopie |
| **Visuels** | Acquisition des jaquettes | ⛔ **Bloqué** — voir [VERIFICATION-JURIDIQUE.md](./VERIFICATION-JURIDIQUE.md) §3. Budget à part, et pas seulement en temps |

### 2.1 Hypothèses de temps

> ⚠️ **Ce sont des hypothèses, pas des mesures.** Elles servent à dimensionner, et §5 donne le protocole pour les remplacer par des chiffres réels en une demi-journée.

| Cas | Part estimée | Temps par entrée |
|---|---|---|
| **Simple** — un titre, une plateforme, une région, sources concordantes | 60–70 % | **2–4 min** |
| **Litigieux** — titres régionaux divergents, date PAL introuvable, portage ou compilation, remake à distinguer de l'original | 20–30 % | **15–30 min** |
| **Impasse** — sources contradictoires sans arbitre | 5–10 % | à **abandonner**, pas à résoudre : l'entrée passe en `Confidence` basse |

Moyenne pondérée : **de l'ordre de 6 à 8 minutes par entrée vérifiée.**

La part litigieuse est élevée **et c'est structurel** : les sept plateformes du POC sont exactement celles où le catalogue japonais, le catalogue PAL et le catalogue NTSC-U divergent le plus — c'est-à-dire précisément ce que §3.4 exige de modéliser.

---

## 3. Les deux échelles

### 3.1 Le POC — 100 à 300 titres

| Poste | Estimation |
|---|---|
| Mise en place de l'import Wikidata | 6–10 h, une fois |
| Vérification de 300 entrées à ~7 min | **≈ 35 h** |
| `Notability` — classement à la main, par plateforme | 4–6 h au total (un classement, pas 300 décisions) |
| Contrôle de cohérence final | 4 h |
| **Total hors visuels** | **≈ 50 à 55 h**, soit **1,5 à 2 semaines-personne** |

> C'est **réalisable et ça tient**, comme l'affirmait §18.6. Mais c'est aussi la raison pour laquelle la Phase 0 s'allonge : ce total est du même ordre que la durée annoncée pour la phase entière, et la phase contient sept autres livrables.

Les visuels ne figurent pas dans ce total parce que leur coût n'est pas d'abord un temps : c'est une décision de risque en attente de la question ouverte n°1.

### 3.2 Un référentiel crédible — l'ordre de grandeur qui décide

Sur **30 000 entrées**, valeur médiane de ce que §18.6 appelle « des dizaines de milliers » :

| Temps par entrée | Charge totale | En équivalent temps plein |
|---|---|---|
| 2 min (optimiste, entrées simples uniquement) | 1 000 h | **≈ 6 mois** |
| 7 min (moyenne du POC) | 3 500 h | **≈ 2 ans** |
| 12 min (si la part litigieuse domine, ce qui est probable hors gros titres) | 6 000 h | **≈ 3,5 ans** |

> **Aucune de ces trois lignes n'est finançable par le projet tel qu'il est décrit**, et la troisième est la plus vraisemblable — parce que la traîne d'un catalogue rétro est faite de titres obscurs, mal documentés, et à forte divergence régionale. Autrement dit : **plus le référentiel s'étend, plus le coût par entrée monte.**
>
> Et ce coût est **récurrent**, pas ponctuel : corrections, nouvelles sorties, fusions et scissions d'entrées. C'est exactement l'objet de la question ouverte n°3 — un modèle économique face à un coût de curation récurrent.

---

## 4. La sortie : le référentiel a le droit d'être incertain

Le raisonnement ci-dessus n'a d'issue que si l'on cesse de vouloir un référentiel entièrement vérifié. **Le modèle le permet déjà** : `Source`, `Confidence` et `DatasetVersion` sont des champs transverses de toute donnée de référence ([MODELE-DE-DOMAINE.md](./MODELE-DE-DOMAINE.md) §4).

> **Le produit demande à l'utilisateur d'assumer l'incertitude de ses souvenirs. Il serait incohérent que le référentiel prétende, lui, à une exactitude qu'il n'a pas payée.** La `Confidence` qui porte « vers 1995 » porte aussi bien « date PAL non confirmée ».

### 4.1 Trois niveaux de vérification

| Niveau | Contenu | Coût | Rendu |
|---|---|---|---|
| **Noyau vérifié** | Les titres à forte `Notability` — ceux que les gens vont réellement cocher | Vérification complète, ~7 min | Normal |
| **Traîne importée** | Le reste de Wikidata, tel quel | ≈ 0 | `Confidence` basse, **marqué comme non vérifié** dans la fiche (E05) |
| **File de demande** | Ce que les utilisateurs réclament | À la demande | Promu au noyau quand il est traité |

`Notability` n'est donc pas seulement l'ordre d'affichage de la sélection massive (§3.3) : **c'est l'ordre dans lequel on dépense le budget de vérification.** Un même attribut sert les deux, ce qui est un bon signe pour le modèle.

### 4.2 `UnresolvedGameClaim` est un instrument de curation

Prévu comme un filet — « le jeu absent du référentiel est un cas nominal » (§3.5) — il produit en réalité le **signal de demande** : ce que les utilisateurs saisissent en texte libre est, littéralement, la liste des entrées manquantes classées par nombre de personnes qui les veulent.

> **On curate ce qui est réclamé, pas ce qu'un catalogue énumère.** C'est l'écart entre 30 000 entrées à produire et quelques centaines à traiter par ordre de demande. Le mécanisme existe déjà dans le modèle ; il suffit de l'exploiter comme une file de travail, ce qui ne demande qu'un tri par fréquence.

---

## 5. Protocole de calibration — à exécuter avant de s'engager

Ce document vaut ce que valent ses hypothèses de §2.1, et elles sont remplaçables par des mesures en une demi-journée.

> **Curer 30 entrées, chronométrées, réparties sur trois plateformes contrastées** — SNES (bien documentée), PlayStation (volumineuse), Game Boy (divergences régionales fortes).
>
> Relever pour chaque entrée : le temps réel, le caractère simple / litigieux / impasse, et **le champ qui a coûté le plus cher**.
>
> Sortie : le temps unitaire réel, la part litigieuse réelle, et le champ le plus coûteux — qui dira s'il faut le simplifier dans le modèle plutôt que de le payer trente mille fois.

C'est le même principe que les décisions déjà prises sur pièces dans ce projet : les vignettes ont été tranchées en regardant une planche, pas en discutant. **Le coût de curation se tranche en curant trente entrées.**

---

## 6. Les trois voies de §18.6, réévaluées

| Voie | Verdict |
|---|---|
| **Import d'une source ouverte compatible** | ✅ **Retenue.** Wikidata, CC0. Seule source légalement confortable, et elle couvre ~17 000 entrées sur les plateformes du POC. Fournit l'identification, pas la vérification |
| **Contribution communautaire modérée** | ⚠️ **Séduisante et prématurée.** Elle ouvre une surface sociale avant la Phase 5, exige de la modération, et introduit un risque de provenance que §19.1 impose de tracer. À reconsidérer après la porte de Phase 2 — et d'abord sous la forme étroite de **propositions de correction sur des entrées existantes**, pas de création libre |
| **Curation interne restreinte** | ✅ **Retenue pour le POC**, avec un périmètre assumé. Elle ne passe pas à l'échelle, et elle n'a pas à le faire avant que la Phase 2 ait validé qu'il y a quelque chose à mettre à l'échelle |

---

## 7. Ce que ça change pour le phasage

1. **La curation du POC est un poste de ~1,5 à 2 semaines-personne** qui s'ajoute aux autres livrables de Phase 0. La phase ne tient pas en « 1 à 2 semaines ».
2. **L'exhaustivité du référentiel n'est pas un objectif atteignable** et ne doit apparaître dans aucun engagement. §18.6 le disait déjà — « restreindre le périmètre plutôt que promettre l'exhaustivité » —, ce document donne le chiffre qui le justifie.
3. **Les trois niveaux de vérification (§4.1) sont une décision de Phase 0**, parce qu'ils exigent que `Confidence` soit affichée sur les fiches du référentiel dès la Phase 1 — une conséquence sur [E05](./ecrans/E05-fiches-referentiel.md), pas seulement sur le modèle.
4. **Le protocole de calibration (§5) est à faire avant la Phase 1**, pas après : s'il révèle un temps unitaire double de l'hypothèse, c'est le périmètre du dataset POC qui se réduit, pas le calendrier qui s'étire.
