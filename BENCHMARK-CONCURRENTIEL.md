# Benchmark concurrentiel

> Livrable de la [Phase 0](./PHASING.md) §3, en réponse à [SPECIFICATION.md](./SPECIFICATION.md) §2 — dont le tableau des acteurs porte l'avertissement « cette liste doit être vérifiée et actualisée ; un benchmark réel est un livrable de la Phase 0 ».
>
> **Vérifié le 20 septembre 2026.** Il conclut à une révision de §2.3 : **quatre des cinq différenciateurs revendiqués sont déjà occupés pris isolément**, et le seul avantage réellement défendable n'y figure pas.

---

## 1. Méthode, et ce qu'elle ne couvre pas

Chaque produit a été confronté aux cinq différenciateurs de §2.3, à partir de la documentation publique, des notes de version des éditeurs et des discussions d'utilisateurs. **Aucun compte payant n'a été ouvert, aucune application installée.**

Trois limites à garder en tête avant de s'appuyer sur ce document :

- **La granularité fine des produits fermés est sous-documentée.** Collectorz Game Collector et GameEye sont des applications payantes dont le modèle de données exact ne se lit pas depuis l'extérieur. Ce qui est affirmé ici sur eux relève de la description commerciale, pas de l'observation.
- **Les périmètres bougent vite.** Backloggd a livré son journal en 1.3 et l'a élargi en 1.4 ; la version de ses champs de date observée ici peut avoir changé au moment de la lecture.
- **Plusieurs pages de conditions ont refusé l'accès automatisé** (HTTP 403). Elles sont signalées comme telles dans [VERIFICATION-JURIDIQUE.md](./VERIFICATION-JURIDIQUE.md) ; pour le benchmark, elles ne portaient que des informations secondaires.

---

## 2. Couverture des cinq différenciateurs

`●` traité · `◐` partiel · `○` absent

| Produit | 1. Reconstruction rétroactive | 2. Incertitude temporelle | 3. Granularité d'édition | 4. Possession ≠ expérience | 5. Restitution narrative |
|---|:--:|:--:|:--:|:--:|:--:|
| **Backloggd** | ● | ○ | ◐ | ◐ | ◐ |
| **Grouvee** | ● | ○ | ○ | ◐ | ○ |
| **Backloggery** | ● | ○ | ○ | ◐ | ○ |
| **HowLongToBeat** | ◐ | ○ | ◐ | ○ | ○ |
| **VGCollect** | ● | ○ | ● | ○ | ○ |
| **GameEye** | ● | ○ | ● | ○ | ○ |
| **Collectorz Game Collector** | ● | ○ | ● | ○ | ○ |
| **Playnite / LaunchBox** | ○ | ○ | ◐ | ○ | ○ |
| **Steam Replay** et rétrospectives | ○ | ○ | ○ | ○ | ◐ |
| **Letterboxd** (hors domaine) | ● | ○ | ◐ | ○ | ● |

**Une colonne est vide, et une seule : la deuxième.**

---

## 3. Ce que chaque acteur fait réellement

### Backloggd — le plus proche, et de loin

Journal à deux niveaux depuis la 1.3 : un **Log** (note, plateformes, statut courant) et des **Playthroughs**, où chaque journée jouée porte un statut, une note libre et une durée — le tout facultatif. La 1.4 a ajouté qu'**une partie peut être déclarée sans date de début**, et que n'importe quelle partie peut porter une date de fin.

La saisie rétroactive est explicitement prise en charge : ajouter aujourd'hui un jeu joué il y a des années met à jour le récapitulatif annuel.

> **Le point décisif.** « Avec ou sans date » est un **booléen**. Il n'existe rien entre les deux : pas d'année seule, pas de période, pas d'approximation. Un jeu joué « vers 1995 » s'enregistre soit à une date inventée, soit sans date du tout — exactement les deux issues que §7.4 refuse.

### Grouvee — étagères et dates de début/fin

Modèle d'étagères (`Playing`, `Backlog`, `Wish List`, `Played`, plus des étagères libres), avec date de début et date de fin éditables par partie. Le référentiel est alimenté par l'API Giant Bomb.

Deux observations :

- **La possession est une étagère, pas un axe.** On peut créer une étagère « possédé », mais elle qualifie la même ligne que « joué ». Posséder deux exemplaires de FFVII à vingt ans d'intervalle n'a pas de représentation.
- **Le formulaire de dates refuse d'être vidé** — « au moins un champ doit être renseigné ». Le produit demande une date et n'accepte pas l'ignorance comme réponse.

### Backloggery — le minimum volontaire

Nom, système, région, statut de complétion (`Now Playing`, `Unfinished`, `Beaten`, `Completed`). **La région est présente**, ce qui est rare, et c'est le seul point de rapprochement avec §3.4. Aucune dimension temporelle.

### HowLongToBeat — un autre métier

Agrège des durées de complétion par type de parcours et par plateforme. C'est une base de durées alimentée par les joueurs, pas un journal personnel. Hors sujet pour le différenciateur temporel, mais **c'est la référence sur la donnée que le produit a décidé de ne pas collecter** (§11.3).

### VGCollect, GameEye, Collectorz — la granularité d'édition est leur métier

VGCollect « crée une fiche pour chaque variante connue ». GameEye annonce 100+ plateformes, 150 000+ jeux, le support régional complet, et le suivi de l'état et du coût de chaque exemplaire.

> **Le différenciateur n°3 n'est pas vacant — il est occupé par des produits meilleurs que nous sur ce point précis.** Ce qui leur manque est l'autre moitié : ils cataloguent des objets, pas un vécu. Aucun n'a d'axe temporel personnel ni de notion de « joué sans posséder ».

### Playnite, LaunchBox — bibliothèque, pas mémoire

Lanceurs de bibliothèques locales et émulées. Ils répondent à « qu'est-ce que je peux lancer maintenant », jamais à « qu'est-ce que j'ai joué en 1995 ». Ils restent pertinents comme **sources d'import en Phase 4**, pas comme concurrents.

### Steam Replay et rétrospectives constructeurs

Restitution narrative réelle, sans effort de saisie — et bornée à **une** année, celle où la télémétrie existe. Elles fixent surtout l'attente esthétique du public.

### Letterboxd — l'analogie, et sa réponse au problème

Letterboxd distingue **« vu »** (sans date) du **journal** (avec date exacte). C'est la même réponse binaire que Backloggd, dans le produit qui a le mieux réussi la transformation d'un journal en identité culturelle.

> **C'est la comparaison la plus utile du benchmark.** La solution de référence au problème « je ne me rappelle plus quand » est : *ne rien demander*. Elle est bon marché, elle fonctionne, et des millions de personnes s'en contentent. Notre pari — que la **bande d'incertitude vaut mieux que l'absence de date** — s'évalue contre celle-là, pas contre l'absence de solution.

---

## 4. Ce que le benchmark change

### 4.1 §2.3 était à réécrire

> ✅ **Fait le 21 septembre 2026.** [SPECIFICATION.md](./SPECIFICATION.md) §2.3 porte désormais la sélection massive en tête (§2.3.0), le tableau de verdicts ci-dessous (§2.3.1), la jointure réellement vacante (§2.3.2), le caractère copiable du type (§2.3.3) et la réserve sur la demande (§2.3.4). Ce qui suit est le constat d'origine, conservé.

La formulation de la v1 — « aucun de ces produits ne traite correctement la combinaison suivante » — est **défendable sur la combinaison et fausse item par item**. Elle donne une fausse assurance :

| # | Revendication | Verdict |
|---|---|---|
| 1 | Reconstruction rétroactive | **Occupé.** Backloggd et les catalogueurs le font. Ce qui manque partout, c'est de le faire **vite** |
| 2 | Incertitude temporelle | **Vacant.** Seul différenciateur qu'aucun acteur n'aborde |
| 3 | Granularité d'édition | **Occupé, et mieux.** VGCollect et GameEye sont des produits dédiés |
| 4 | Possession ≠ expérience | **Partiellement occupé.** Existe comme étiquette, jamais comme deux axes indépendants |
| 5 | Restitution narrative | **Occupé sur un an** (Steam Replay, stats annuelles Backloggd). Vacant sur trente |

Le pari tient donc sur la **jointure** : les catalogueurs ont l'objet sans le vécu, les journaux ont le vécu sans l'objet, et **personne n'a le temps long**. C'est plus étroit que ce qu'annonce §2.3, et c'est vérifié.

### 4.2 Le vrai avantage ne figure pas dans la liste

Aucun produit examiné ne propose de **sélection massive par plateforme et par période** — console → période approximative → cocher joué / terminé / possédé (§24.3). Tous saisissent titre par titre, par recherche.

> C'est l'écart le plus large constaté, il porte sur le geste plutôt que sur le modèle, et il n'est pas dans les cinq différenciateurs revendiqués. **Il doit y entrer, en premier.** Le cahier des charges le sait déjà — §24 en fait « la caractéristique majeure du produit » — mais §2 et §24 ne se parlent pas, et c'est §2 qui sert à décider.

### 4.3 Le type temporel ne protège rien à lui seul

`TemporalValue` est une bonne idée et **une idée copiable en une itération**. Ajouter « année approximative » à Backloggd est un travail de quelques semaines pour qui a déjà le journal, les utilisateurs et le référentiel.

Ce qui ne se copie pas en une itération : le flux de saisie complet, le référentiel curé avec notoriété et région, et les parcours reconstitués que les utilisateurs auront produits. **La défense est l'accumulation, pas le type.** Conséquence directe sur la discipline de phases : accélérer vers la Phase 2 a plus de valeur que perfectionner le modèle.

### 4.4 Un risque que le benchmark révèle

La réponse binaire « date exacte ou rien » est **bon marché et suffisante pour beaucoup de gens**. Il est donc possible que l'incertitude temporelle soit un vrai vide du marché parce que **la demande est faible**, et non parce que personne n'y a pensé.

C'est testable, et ça doit l'être en Phase 2 plutôt que supposé. La question à poser au testeur n'est pas « aimez-vous les bandes d'incertitude » mais :

> **« Auriez-vous préféré simplement cocher "joué", sans date ? »**

Si la réponse majoritaire est oui, le différenciateur n°2 est un coût, pas un avantage — et la conséquence est de simplifier la saisie, pas de mieux expliquer le modèle. Cela rejoint exactement la porte dure de la Phase 2.

---

## 5. Ce qui reste à vérifier

| Point | Pourquoi ça compte | Comment |
|---|---|---|
| Modèle de dates réel de GameEye et Collectorz | Ce sont les seuls produits payants et fermés du panel ; un champ « année d'acquisition approximative » y changerait la colonne 2 | Essai gratuit, une heure |
| Date de première possession dans VGCollect | Si elle existe, le différenciateur n°1 se réduit encore | Compte gratuit |
| Volumétrie réelle des référentiels concurrents | Situe le coût de curation (voir [COUT-DE-CURATION.md](./COUT-DE-CURATION.md)) | Pages publiques |
| Backloggd, à chaque version | Le concurrent le plus proche et le plus rapide ; une variante temporelle floue chez lui invaliderait la colonne 2 | Notes de version, à relire avant la Phase 2 |

---

## Sources

Consultées le 20 septembre 2026.

- [Backloggd — 1.3 Release (journal, playthroughs)](https://backloggd.medium.com/1-3-release-49e801ad7665)
- [Backloggd — 1.4 Release (date de début facultative)](https://backloggd.medium.com/1-4-release-a646a0161af1)
- [Backloggd — Looking Back at 2025 (saisie rétroactive, stats annuelles)](https://backloggd.medium.com/looking-back-at-2025-5428076d3f80)
- [Backloggd](https://backloggd.com/)
- [Grouvee](https://www.grouvee.com/)
- [Grouvee — forum, édition des dates depuis l'étagère](https://discuss.grouvee.com/t/help-with-played-shelf-organization/14613)
- [Comparatif Backloggery / Grouvee](https://www.saashub.com/compare-backloggery-vs-grouvee)
- [MakeUseOf — panorama des trackers de jeux](https://www.makeuseof.com/tag/like-goodreads-but-for-video-games-manage-your-game-collection-better/)
- [VGCollect — à propos](https://vgcollect.com/about)
- [Collectorz Game Collector](https://alternativeto.net/software/game-collector/about/)
- [Letterboxd — FAQ (« vu » contre journal daté)](https://letterboxd.com/about/faq/)
- [Letterboxd — marquer vu sans journaliser](https://letterboxd.zendesk.com/hc/en-us/articles/15178773269263-I-ve-been-marking-films-watched-instead-of-logging-them-to-my-Diary-How-can-I-fix-this)
