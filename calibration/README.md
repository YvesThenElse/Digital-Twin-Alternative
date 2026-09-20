# Calibration de la curation — protocole exécuté

> Exécuté le **20 septembre 2026**, en application du protocole de [COUT-DE-CURATION.md](../COUT-DE-CURATION.md) §5.
>
> Objet : remplacer par des mesures les hypothèses de temps de curation. Résultat principal : **ce n'est pas le temps par entrée qui décide, c'est le fait que la résolution automatique se trompe une fois sur trois, silencieusement.**

## Ce qui a été mesuré

Trente entrées sur trois plateformes contrastées — Super Nintendo (1 424 jeux dans Wikidata), PlayStation (2 146), Game Boy (547).

**Échantillon stratifié**, et c'est une correction au protocole initial : un tirage purement aléatoire aurait mesuré le coût de la traîne, alors que le POC ne paie que celui de la tête.

| Strate | n | Constitution |
|---|---|---|
| **Tête** | 15 | Titres choisis à la main pour leur notoriété, 5 par plateforme |
| **Traîne** | 15 | Tirage reproductible — tri par `md5(qid + "calib2026")`, 5 par plateforme |

Deux entrées ont été retenues délibérément parce qu'elles exposent des risques nommés dans la spécification : **Pokémon Rouge** (canonicalisation, §23.1) et **Tetris** (une œuvre présente sur toutes les plateformes, §6).

## Résultat 1 — la résolution automatique se trompe une fois sur trois

Les quinze titres de la tête ont été résolus par l'heuristique la plus naïve possible : premier résultat de l'API de recherche, filtré sur la plateforme. **Cinq sur quinze pointent vers le mauvais jeu.**

| Demandé | Obtenu | |
|---|---|---|
| Super Mario World | Super Mario World 2: Yoshi's Island | ❌ |
| Chrono Trigger | **Chrono Trigger: Crimson Echoes** | ❌ |
| Donkey Kong Country | Donkey Kong Country 2: Diddy's Kong Quest | ❌ |
| Crash Bandicoot | Crash Bandicoot 2: Cortex Strikes Back | ❌ |
| Super Mario Land | Wario Land: Super Mario Land 3 | ❌ |
| Gran Turismo | `Q944320` — **aucun libellé en anglais** | ⚠️ |

> **Toutes les erreurs sont des suites ou des variantes du titre demandé.** C'est le pire cas de figure : même série, même plateforme, même éditeur, description plausible. Rien ne signale l'erreur à la relecture rapide — il faut connaître l'année de sortie pour la voir.
>
> Et *Chrono Trigger: Crimson Echoes* n'est pas un jeu : c'est un **ROM hack amateur annulé**, présent dans Wikidata comme jeu vidéo sur Super Nintendo. Le référentiel d'amorçage ne distingue pas l'œuvre officielle de la production de fans.

**Portée de la mesure** : elle qualifie l'**import non supervisé**, pas la curation humaine. Un curateur qui voit la liste des candidats ne choisit pas « Crimson Echoes ». Ce qu'elle établit est plus étroit et plus utile : *aucune entrée ne peut être close sans arbitrage humain*, à n'importe quelle échelle.

## Résultat 2 — complétude par champ

Part des entrées où le champ est renseigné :

| Champ du modèle | Tête | Traîne | Total |
|---|--:|--:|--:|
| Titre anglais | 93 % | 100 % | 97 % |
| Titre français | 73 % | 60 % | 67 % |
| Titre japonais | 93 % | 60 % | 77 % |
| Alias | 87 % | 47 % | 67 % |
| Une date, quelle qu'elle soit | 100 % | 100 % | **100 %** |
| **Date régionalisée** (`P577` qualifié par `P291`) | 47 % | 33 % | **40 %** |
| Les trois régions | 13 % | 0 % | 7 % |
| Studio | 93 % | 53 % | 73 % |
| Éditeur | 93 % | 60 % | 77 % |
| Genre | 100 % | 80 % | 90 % |
| Série | 93 % | 27 % | 60 % |
| **Image** (`P18`) | 7 % | 7 % | **7 %** |

Trois lectures :

1. **`Region` est le coût dominant.** Une date existe toujours ; savoir *à quelle région elle s'applique* manque dans 60 % des cas. Or §3.4 en fait une exigence de Phase 1 — « un joueur PAL à qui l'on propose la ludothèque NTSC-J ne se reconnaît pas ». C'est le champ à produire à la main, entrée par entrée.
2. **La traîne est nettement plus pauvre que la tête**, sur tous les champs sauf le titre anglais — série 27 % contre 93 %, studio 53 % contre 93 %. La stratification était nécessaire : une moyenne unique aurait masqué un facteur trois.
3. **7 % d'images** confirme chiffre en main ce que [VERIFICATION-JURIDIQUE.md](../VERIFICATION-JURIDIQUE.md) §3 établit en droit : Wikidata ne fournit pas les visuels. La question des jaquettes ne se règle pas par la source de métadonnées.

## Résultat 3 — Pokémon Rouge, le cas de canonicalisation, en vrai

Wikidata porte **trois entités** pour ce qui est un seul souvenir de joueur :

| Entité | Libellé | Année |
|---|---|---|
| `Q91030617` | Pokémon Red and Green | 1996 — Japon |
| `Q25536523` | Pokémon Red | 1996 |
| `Q637137` | Pokémon Red and Blue | 1998 — international |

Les trois sont légitimes et décrivent la même œuvre à des granularités et des régions différentes. Un import naïf produit trois doublons ; un joueur français de 1999 se rattache à `Q637137`, un joueur japonais à `Q91030617`, et **aucune comparaison entre les deux profils ne fonctionne** sans table d'alias.

C'est exactement le risque §23.1, et il se matérialise dès la trentième entrée — pas à la trente millième.

> À l'inverse, **Tetris sur Game Boy** est une entité distincte de Tetris (`Q3519191`, « 1989 Game Boy version of Tetris »). Wikidata modélise donc *parfois* la `Release` séparément de l'œuvre, et parfois non. C'est la « non-uniformité de granularité » que la littérature relève, vue de près.

## Résultat 4 — le point d'accès public ne tient pas la charge d'amorçage

La requête qui liste un catalogue complet avec ses libellés prend **47 secondes pour la Game Boy** (547 jeux) et **dépasse le délai de WDQS** pour la Super Nintendo et la PlayStation.

Conséquence pratique : l'amorçage se fait par lots, ou par un vidage de base, pas par une requête unique. Ce n'est pas un obstacle — c'est une ligne de travail à prévoir.

## Reproduire

```
python3 resolve_head.py          # résout la tête, écrit head.json
python3 fields.py qids.json sample.json
python3 analyze.py sample.json strata.json
```

`wd.py` porte le point d'accès, le tirage déterministe et les tentatives successives. Le tirage de la traîne est reproductible à l'identique via la graine `calib2026`.

> ⚠️ **Ces scripts ne sont pas du code produit.** Ce sont des outils de mesure jetables, en Python parce que c'était le plus court chemin vers le chiffre. Ils ne préjugent d'aucun choix technique — la pile reste .NET 10 et React ([PHASING.md](../PHASING.md) §4).
>
> Ils n'interrogent que **Wikidata**, seule source autorisée par [VERIFICATION-JURIDIQUE.md](../VERIFICATION-JURIDIQUE.md) §5, et sous licence CC0 — la règle « aucun script ne parcourt une source tierce » est respectée.

## Données

`sample.json` contient les trente entrées telles que récupérées — c'est la pièce, au sens où la planche de vignettes en était une. `strata.json` définit l'échantillon, `head.json` et `tail.json` sa constitution.
