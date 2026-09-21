# Dataset POC

> Produit les **20 et 21 septembre 2026**. 221 œuvres, 593 sorties, 8 plateformes. Licence **CC BY-SA 4.0**.
>
> **Couverture** : région sur 591 des 593 sorties (99 %) ; date au jour sur 95 % des œuvres ; **218 jaquettes sur 221**.
>
> Chaque plateforme porte son **année de lancement**, et `DatasetLoader` refuse une sortie antérieure à sa machine. Une plateforme sans année est elle aussi signalée : sans elle, le contrôle ne s'appliquerait à rien tout en rendant vert.
>
> Ses invariants sont vérifiés par du code — `DigitalTwin.Domain.Reference.DatasetLoader` — et non par relecture : unicité des identifiants, préfixe conforme au type, plateforme existante, précision jamais supérieure à ce que la confiance soutient, classement couvrant exactement les plateformes où l'œuvre sort, et table de redirection sans impasse ni boucle.

## Trois décisions du 21 septembre 2026

**`notability` est une carte plateforme → rang.** §3.3 demandait « un score par sortie » ; le modèle le portait sur l'œuvre. Invisible tant qu'aucun titre n'était curé sur deux machines — Bubble Bobble l'est, 19ᵉ sur Game Boy et 22ᵉ sur NES. L'ancien schéma forçait soit un rang faux, soit deux `Work` pour une seule œuvre.

**Une œuvre, un identifiant externe.** Les deux fiches Bubble Bobble sont fusionnées : 222 œuvres deviennent **221**, sans perdre une seule sortie. L'identifiant absorbé entre dans `redirects`, qui n'est jamais purgée (§10.2).

**`region_free` sur la plateforme.** La Switch n'a pas de zonage : une sortie sans région y est **mondiale**, pas incomplète. Ce n'est pas « toute sortie y est mondiale » — un titre peut rester exclusif au Japon et le déclarer. Sans cet attribut, 12 sorties correctes comptaient comme dette de curation au même titre qu'une NES sans région.
>
> Périmètre voulu par [PHASING.md](../PHASING.md) §3 : 100 à 300 jeux sur NES, SNES, Game Boy/GBA, N64, PS1, PS2 et Switch, curés à la main. **Ne pas l'étendre « tant qu'on y est ».**

## Licence et provenance

Deux sources, toutes deux sous licence explicitement réutilisable ([VERIFICATION-JURIDIQUE.md](../VERIFICATION-JURIDIQUE.md) §2) :

| Source | Licence | Usage |
|---|---|---|
| **Wikidata** | CC0 | identité, titres, alias, studio, éditeur, genres — le noyau |
| **Wikipédia** | CC BY-SA 4.0 | dates de sortie régionales absentes de Wikidata |

> ⚠️ **Le dataset est donc en CC BY-SA 4.0**, pas en CC0 : le partage à l'identique se propage dès qu'une seule donnée CC BY-SA est incorporée. Attribution requise, et toute réutilisation reste sous la même licence.

Chaque œuvre et chaque sortie porte sa provenance : `source`, `external_id`, `imported_at`, `dataset_version`.

Aucune autre source n'a été interrogée par script, conformément à la règle de l'article 7(5).

## ⚠️ Correction du 20 septembre 2026 — les dates étaient fausses

La première version de ce dataset prenait **toutes** les dates de publication d'une œuvre, sans regarder à quelle plateforme elles se rapportaient. Résultat : les rééditions se mélangeaient aux sorties d'origine sans que rien ne les distingue.

| Œuvre | Publié d'abord | Correct |
|---|--:|--:|
| Super Mario Bros. · PAL | 2011 *(console virtuelle 3DS)* | **1987** |
| Ocarina of Time · PAL | 2003 *(GameCube)* | **1998** |
| Donkey Kong Country · PAL | 2014 *(Wii U)* | **1994** |

La source portait pourtant l'information : **le qualificateur de plateforme est sur la déclaration de date**. L'émetteur ne retient désormais que les dates rattachées à la plateforme curée, et 706 « sorties » tombent à **408** — les 298 disparues étaient des rééditions sur d'autres machines.

Le complément Wikipédia a ensuite ramené le total à **663 sorties** réellement rattachées à leur plateforme.

### Puis 663 → 590, par correction de l'analyseur

Vingt-trois œuvres n'avaient aucune date Wikipédia. **Vingt-deux d'entre elles avaient un article qui la portait** : c'est l'analyseur d'infobox qui échouait, en silence, sur six défauts distincts —

| Défaut | Effet |
|---|---|
| `{{vgr}}` et `{{vgrelease new}}` non reconnus comme modèles de sortie | supprimés comme parasites, avec leurs dates |
| `{{ubl}}`, `{{Unbulleted list}}`, `{{collapsible list}}` supprimés **avec leur contenu** | toutes les sorties Switch perdues |
| code de région combiné « NA/PAL » absent de la table | Oddworld n'existait ni en Amérique ni en Europe |
| têtes en gras qui ne sont pas des plateformes — « Final Mix », « International », le titre du jeu en gras-italique | champ entièrement rejeté |
| `<br/>` en tête d'une date : la troncature censée couper ce qui **suit** coupait tout | date nue non lue |
| « 22 May 2000 » (jour d'abord) | lu comme un mois |

Les corriger a ajouté **29 sorties régionales** et fait passer la couverture régionale de 84 % à **99 %** des sorties. Elles sont figées par `calibration/test_wp_parser.py`, qui rejoue les onze cas réels sur des wikitextes mis en cache — le test ne dépend pas du réseau et ne change pas de verdict quand un contributeur réécrit un article.

**Et 91 sorties ont été retirées.** Une date sans région n'est désormais conservée que si aucune autre n'en porte. Elle servait de repli quand rien d'autre n'existait ; depuis que les dates régionales sont là, elle décrit la même sortie avec moins d'information — « Gradius · ? · 1986 » à côté de « Gradius · Japon · 25 avril 1986 ». Il en reste **une** : Pokémon Yellow, dont l'article n'a pas de champ `released`.

## Ce que le dataset sait dire, et ce qu'il refuse de dire

Restaient 57 couples (œuvre, plateforme, région) qu'aucune source autorisée n'atteste. **Le silence n'y est pas une preuve d'absence**, et le biais est mesuré :

> L'infobox anglophone liste Banjo-Kazooie, Crash Bandicoot et Grand Theft Auto III en NA/EU seulement. **Les trois sont sortis au Japon.** Conclure « pas de sortie japonaise » de leur silence aurait retiré ces jeux à un testeur japonais.

Le champ `region_status` porte donc **trois états** et non deux, par (œuvre, plateforme, région) :

| Valeur | Sens | Comment on l'obtient |
|---|---|---|
| *(absent du champ)* | une sortie est attestée | la sortie elle-même |
| `absent` | **non-sortie établie** | arbitrage manuel motivé, [`calibration/region_arbitration.py`](../calibration/region_arbitration.py) |
| `inconnu` | rien d'établi | le défaut — et il ne glisse jamais vers `absent` |

**22 non-sorties établies, 32 régions laissées inconnues.** Les 22 sont des jugements de domaine et non des citations : Chrono Trigger et Final Fantasy VI jamais parus en Europe sur Super Nintendo, Mother 3 et Rhythm Tengoku jamais localisés, Terranigma sorti au Japon et en Europe mais pas en Amérique. Chacun porte sa raison dans le fichier d'arbitrage, pour être relu un par un. **Un `absent` qu'on ne saurait pas justifier doit redevenir `inconnu`.**

L'émetteur échoue si un arbitrage n'est appliqué à rien : une clé mal orthographiée ne ferait rien, en silence — la classe de défaut qui a coûté le plus cher à ce projet.

## ⚠️ Ce que ce dataset ne peut PAS dire

**Il ne distingue pas « pas de sortie PAL » de « sortie PAL non renseignée ».**

Seize œuvres n'ont aucune sortie PAL sur leur plateforme. Certaines sont de vraies absences — Mother 3, Final Fantasy sur NES, Chrono Trigger et Earthbound n'ont jamais eu de sortie européenne à l'époque. D'autres sont des lacunes de la source : **Tekken 3, Grand Theft Auto III et Super Mario Land sont évidemment sortis en Europe.**

> Rien dans les données ne sépare les deux, et l'écart est produit :
>
> - dire « pas de sortie PAL » quand la donnée manque **retire de sa ludothèque** un jeu que le testeur a possédé ;
> - dire l'inverse **lui propose** un jeu qu'il n'a jamais pu voir.
>
> Les deux cassent la reconnaissance, qui est la mécanique du produit (§24.3). Trancher demande une seconde source ou de la curation — et [VERIFICATION-JURIDIQUE.md](../VERIFICATION-JURIDIQUE.md) interdit de scripter une source tierce.

### Le motif, qui vaut plus que les trois cas

Trois fois dans la même journée, la même défaillance : **une donnée absente ou incomplète s'est lue comme un fait, sans jamais lever d'erreur.**

1. Une table de correspondance incomplète — « Amérique du Nord » manquant — a fait passer la couverture régionale pour quatre fois plus faible qu'elle n'est.
2. Des identifiants tirés au hasard rendaient toute régénération destructrice, sans que rien ne le signale.
3. Des rééditions prises pour des sorties d'origine ont failli faire écrire que neuf titres majeurs n'étaient jamais sortis en Europe.

Aucune des trois n'a produit de message d'erreur. Toutes trois ont produit des chiffres d'apparence normale. **Pour un référentiel, c'est le mode de défaillance qui coûte le plus cher**, parce qu'il se propage dans les décisions avant d'être vu. La parade n'est pas une règle de plus : c'est de regarder les lignes, pas seulement les agrégats — les trois ont été attrapées en lisant une liste, jamais en lisant une moyenne.

## Ce que le dataset sait de sa propre qualité

Le référentiel porte son incertitude, comme les souvenirs portent la leur. Chaque œuvre expose un bloc `verification` :

| Champ | Ce qu'il dit | État |
|---|---|--:|
| `resolution` | comment l'identité a été établie | 97 % automatique, 3 % arbitrée |
| `date_basis` | les dates sont-elles rattachées à la plateforme | **47 %** |
| `region` | au moins une région attestée | **92 %** |
| `cover` | une jaquette existe-t-elle **dans Wikidata** | 11 % |
| jaquette acquise | voir [covers/](./covers/) | **98 %** |
| `title_from` | le titre vient de la source ou de la curation | 11 % de la curation |
| `year_source_vs_curated` | l'année de la source concorde-t-elle | 5 % divergent |

**53 % des œuvres n'ont aucune date rattachée à leur plateforme** et portent une date non qualifiée en `confidence: "low"` — une date dont on ne sait pas de quelle sortie elle parle. C'est le chiffre le plus important du tableau, et le plus mauvais.

### La précision suit ce qui est attesté

Une sortie porte `precision`, et ce n'est pas cosmétique. « Kirby's Dream Land, 27 avril 1992 » donne le jour — mais on ignore si c'est la sortie japonaise, américaine ou européenne, **or c'est la sienne que le joueur cherche**. Le jour est donc une précision qui porte sur un autre objet que celui qu'on croit, et le garder affirmerait quelque chose de faux.

| `precision` | Quand | Sorties |
|---|---|--:|
| `day` | plateforme **et** région attestées | **278** |
| `year` | tout le reste — le jour est abandonné | 130 |

La valeur brute reste dans `provenance.raw_date` : on abaisse la précision affichée, on ne perd jamais la donnée.

**44 % des œuvres n'ont pas de région.** C'est le poste de curation manuelle qui reste, et §3.4 en fait une exigence de Phase 1.

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

Les identifiants sont **stables** : l'horodatage vient du rang de curation, la partie basse est dérivée de l'identifiant source. Un identifiant ne dépend donc que de *(position dans la liste curée, identifiant source)* — jamais de l'historique des appels ni du nombre de sorties.

C'est vérifié, pas supposé : [calibration/test_id_stability.py](../calibration/test_id_stability.py) fait perdre une date à la première œuvre et exige que **rien** ne bouge derrière.

> ⚠️ **Il a fallu deux corrections pour y arriver, et la première ne suffisait pas.** La version initiale tirait la partie basse au hasard : toute régénération frappait de nouveaux identifiants, et comme l'invariant 9 interdit de les réattribuer, **corriger le pipeline devenait un acte destructeur**.
>
> La dérivation par hachage a réglé ce cas — mais l'horodatage venait encore d'un compteur global d'appels. Les identifiants paraissaient stables tant que le nombre de sorties par œuvre ne changeait pas, c'est-à-dire **tant qu'on ne corrigeait rien d'intéressant**. Une comparaison avant/après l'avait d'ailleurs validée à tort, parce qu'elle portait sur le cas favorable.
>
> C'est pourquoi le test perturbe au lieu de comparer. Une stabilité qui tient jusqu'au jour où elle compte n'est pas une stabilité.
>
> Changer l'ordre de la liste curée déplace toujours les identifiants : c'est l'ordre de curation qui les ordonne (§10.2).

## Régénérer

```
cd calibration
python3 resolve_dataset.py     # résout, vérifie plateforme + année + type
python3 disambiguate.py        # libellé exact, isole le résidu
python3 apply_arbitration.py   # applique l'arbitrage manuel
python3 emit_dataset.py        # écrit ../dataset/poc.json
```
