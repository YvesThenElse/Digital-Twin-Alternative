# Dataset POC

> Produit le **20 septembre 2026**. 222 œuvres, 706 sorties, 8 plateformes.
>
> Périmètre voulu par [PHASING.md](../PHASING.md) §3 : 100 à 300 jeux sur NES, SNES, Game Boy/GBA, N64, PS1, PS2 et Switch, curés à la main. **Ne pas l'étendre « tant qu'on y est ».**

## Licence et provenance

Toutes les données viennent de **Wikidata**, sous **CC0** — la seule source que [VERIFICATION-JURIDIQUE.md](../VERIFICATION-JURIDIQUE.md) autorise à alimenter le référentiel. Chaque œuvre et chaque sortie porte sa provenance : `source`, `external_id`, `imported_at`, `dataset_version`.

Aucune autre source n'a été interrogée par script, conformément à la règle de l'article 7(5).

## Ce que le dataset sait de sa propre qualité

Le référentiel porte son incertitude, comme les souvenirs portent la leur. Chaque œuvre expose un bloc `verification` :

| Champ | Ce qu'il dit | État |
|---|---|--:|
| `resolution` | comment l'identité a été établie | 97 % automatique, 3 % arbitrée |
| `region` | la région vient-elle de la source | **59 %** |
| `cover` | une jaquette existe-t-elle dans la source | **11 %** |
| `title_from` | le titre vient de la source ou de la curation | 11 % de la curation |
| `year_source_vs_curated` | l'année de la source concorde-t-elle | 5 % divergent |

**41 % des œuvres n'ont pas de région** et portent une sortie unique en `confidence: "low"`. C'est le poste de curation manuelle qui reste, et §3.4 en fait une exigence de Phase 1.

## Les écarts d'année ne sont pas des erreurs

Douze œuvres ont une année de source différente de l'année curée. **Onze sur douze s'expliquent par le modèle lui-même**, pas par un défaut :

| Œuvre | Source | Curé | Pourquoi |
|---|--:|--:|---|
| Street Fighter II | 1991 | 1992 | borne arcade / sortie Super Nintendo |
| Contra, Gradius | 1987, 1985 | 1988, 1986 | borne arcade / portage NES |
| Bubble Bobble | 1986 | 1991 | borne arcade / portage Game Boy |
| Tekken 3, Tekken 5 | 1996, 2004 | 1997, 2004 | borne arcade / PlayStation |
| Hollow Knight, Stardew Valley | 2017, 2016 | 2018, 2017 | sortie PC / portage Switch |
| Hades | 2018 | 2020 | accès anticipé / sortie |
| Pokémon Stadium | 1999 | 1998 | Japon / international |
| Tears of the Kingdom | 2022 | 2023 | annonce / sortie |

> **C'est la distinction `Work` / `Release` qui apparaît dans les données.** `first_release_year` est un attribut de l'**œuvre** — la première fois qu'elle existe, où que ce soit. L'année curée est celle de la **sortie sur la plateforme du joueur**. Les deux sont justes et ne sont pas la même chose, et c'est très exactement ce que §6 demande de ne pas confondre.
>
> Pour un produit dont la valeur est le souvenir daté, **c'est l'année de la sortie que le joueur a touchée qui compte**, jamais celle de l'œuvre. Un joueur qui a connu Street Fighter II sur Super Nintendo en 1992 ne se reconnaît pas dans « 1991 ».

**Un seul écart est un vrai défaut** : Harvest Moon GB porte 2012 comme unique date de publication — vraisemblablement une réédition en console virtuelle — pour un jeu de 1997. Sans le contrôle, il serait entré dans la timeline d'un joueur avec quinze ans d'écart.

## Notoriété

`notability` est un **rang par plateforme**, de 1 (le titre qu'on cite en premier) à N. Il n'a aucune source : c'est un jugement de domaine, produit à la main dans [calibration/curated.py](../calibration/curated.py), et c'est le seul moyen de répondre à l'exigence de §3.3 — « l'application montre les principaux jeux de la plateforme » n'a pas de sens sans un ordre.

Il sert deux fois : ordonner E02, et décider où dépenser le budget de vérification ([COUT-DE-CURATION.md](../COUT-DE-CURATION.md) §4.1).

## Les trous, déclarés

[calibration/gaps.json](../calibration/gaps.json) liste ce qui a été curé mais n'est **pas** au dataset, avec le motif :

- **Bomberman (NES)** — la source ne porte aucun item pour le Famicom de 1985. Cas nominal de §3.5.
- **Pokémon Or/Argent** — titre Game Boy **Color**, plateforme hors périmètre POC. Rétrocompatible ne veut pas dire même plateforme.
- **Game Boy Camera** — accessoire, pas une œuvre. Relève du concept `Accessory` (§4).

Un référentiel qui connaît ses trous vaut mieux qu'un référentiel qui les ignore.

## Identifiants

Conformes à [MODELE-DE-DOMAINE.md](../MODELE-DE-DOMAINE.md) §10.2 : préfixe de type sur trois lettres, puis un ULID en base32 Crockford.

```
wrk_01M24BB8G9YJY780Q7N4NKQXBK    œuvre
rel_01M24BB8GA56KD6FQBCW1WABN2    sortie
plt_01M24BB8G1CZ2415KQJPB6MK2A    plateforme
```

Frappés hors base, puisque le dataset existe avant toute base (§18.5), et ordonnés dans le temps — l'ordre de curation reste donc lisible dans les identifiants.

⚠️ **Ces identifiants sont définitifs dès maintenant** (invariant 9 : jamais réattribués). Régénérer le dataset en frappe de nouveaux : la régénération produit un **nouveau** référentiel, pas une mise à jour de celui-ci. Toute reprise devra passer par la table de redirection de §10.2.

## Régénérer

```
cd calibration
python3 resolve_dataset.py     # résout, vérifie plateforme + année + type
python3 disambiguate.py        # libellé exact, isole le résidu
python3 apply_arbitration.py   # applique l'arbitrage manuel
python3 emit_dataset.py        # écrit ../dataset/poc.json
```
