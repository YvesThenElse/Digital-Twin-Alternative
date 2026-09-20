# Vérification juridique des sources

> Livrable de la [Phase 0](./PHASING.md) §3, en réponse à [SPECIFICATION.md](./SPECIFICATION.md) §19.1 — « vérifier les CGU **avant** tout import, pas après ».
>
> **Vérifié le 20 septembre 2026.** Deux résultats commandent la suite : **une seule source de métadonnées est réutilisable sans accord** (Wikidata, CC0), et **la voie « sources ouvertes » retenue pour les jaquettes n'existe pas** — Wikimedia Commons n'héberge pas de jaquettes.

---

## 0. Ce que ce document est, et n'est pas

Il consigne ce que les conditions publiées disent, source par source, avec la date et le lien. **Ce n'est pas un avis juridique** et il ne remplace pas la revue d'un avocat, qui reste nécessaire avant tout usage commercial ou tout import automatisé (Phases 3 et 4).

Trois limites de méthode :

- **Deux pages de conditions ont refusé l'accès automatisé** (HTTP 403) : les CGU MobyGames et la documentation IGDB. Ce qui les concerne ici vient d'extraits publics et de pages secondaires, et doit être **relu à la main** avant toute décision d'engagement.
- Les conditions d'API changent sans préavis, souvent après rachat — IGDB en est l'exemple : gratuite pour tout usage en 2015, réservée aux partenariats commerciaux après l'acquisition par Twitch.
- **Une source sans licence publiée n'est pas une source permissive.** C'est le contraire : en l'absence d'autorisation, il n'y a pas d'autorisation.

---

## 1. Les trois régimes, et celui qui mord

§19.1 les distingue déjà. Le benchmark des sources confirme lequel est contraignant en pratique :

1. **Le droit d'auteur** ne protège pas les faits — un titre, une date, un éditeur. Ce régime ne bloque presque rien ici.
2. **Le droit sui generis** (directive 96/9/CE) protège l'**investissement** du producteur contre l'extraction ou la réutilisation d'une partie substantielle. Durée : **quinze ans, renouvelables à chaque nouvel investissement substantiel** — autrement dit, perpétuels pour une base vivante. L'article 7(5) vise aussi l'**extraction répétée et systématique de parties non substantielles**.
3. **Les conditions d'utilisation** s'imposent contractuellement, indépendamment des deux premiers. **C'est le régime qui bloque effectivement**, et il est le plus facile à vérifier.

> **La ligne opérationnelle qui en découle.** Consulter une source tierce pour **vérifier** une donnée curée à la main relève de l'usage normal. **Tout script qui parcourt une source pour en constituer une autre** franchit la ligne de l'article 7(5), même à petites doses, même sur des faits. La différence n'est pas le volume : c'est le caractère systématique.

---

## 2. Métadonnées — verdict par source

| Source | Licence / conditions | Redistribution | Verdict |
|---|---|---|---|
| **Wikidata** | **CC0** sur les données structurées (espaces principal, propriétés, lexèmes) | **Libre**, sans attribution obligatoire | ✅ **Utilisable.** Noyau du référentiel |
| **Wikipédia** | **CC BY-SA 4.0** | **Libre, avec attribution et partage à l'identique** | ✅ **Utilisable** — voir l'avertissement ci-dessous |
| **IGDB** (Twitch / Amazon) | Gratuit **non commercial** sous Twitch Developer Services Agreement ; commercial = partenariat à négocier | Non | ⚠️ Consultation seulement — et le statut bascule le jour où le projet devient commercial |
| **MobyGames** | Site en usage **personnel non commercial** ; API par paliers — *Hobbyist* 9,99 $/mois non commercial, *Bronze* 99,99 $/mois, *Silver* 499,99 $/mois | **Interdite** sauf autorisation écrite | ❌ Consultation manuelle uniquement. Interdit aussi pour l'entraînement de modèles |
| **Giant Bomb** | Gratuit non commercial ; commercial sur autorisation. Ni publicité, ni abonnement, ni affiliation sans accord. Attribution + mention de non-affiliation | Non | ⚠️ C'est la source de **Grouvee** — utile à savoir, inutilisable pour nous |
| **RAWG** | Gratuit **y compris commercial** sous 100 000 utilisateurs actifs mensuels / 500 000 pages par mois. Attribution et lien actif obligatoires | **Explicitement interdite** | ⚠️ Seuil confortable, mais « pas de redistribution » exclut d'en faire un référentiel |
| **TheGamesDB** | **Aucune licence ni CGU trouvée** sur le site public | Indéterminée | ❌ Le cas le plus risqué du panel : rien n'autorise |
| **OpenVGDB** | Jeu de données dérivé de TheGamesDB et d'autres | Hérite de l'amont | ❌ Une redistribution « ouverte » ne purge pas les droits en amont |
| **ScreenScraper** | Base communautaire, accès par compte, orientée scraping de ROMs | À vérifier | ❌ Contexte d'usage adjacent à des pratiques dont le projet doit rester éloigné |
| **Steam Web API** | Ne stocker que les données **demandées par l'utilisateur final** ; informer l'utilisateur du stockage et du pays ; diffusion à l'utilisateur pour son usage personnel ; 100 000 appels/jour | Non | ✅ **Compatible avec l'import par utilisateur** (Phase 4), incompatible avec la constitution d'un référentiel |
| **RetroAchievements** | API tierce publique, clé de compte, limitation de débit « raisonnable », CGU générales | Non traitée | ✅ Pour l'import par utilisateur. Expose bien les déblocages entre deux dates — le proxy daté prévu en Phase 4 |

> ### ⚠️ Wikipédia manquait à ce tableau, et c'était une erreur d'analyse
>
> La première version de ce document écartait toutes les sources sauf Wikidata. Le motif était juste — IGDB, MobyGames, Giant Bomb, RAWG et les autres **interdisent la redistribution** — mais il ne s'applique pas à Wikipédia, qui n'avait simplement pas été examinée. Son contenu est sous **CC BY-SA 4.0**, licence qui autorise explicitement la réutilisation et la redistribution : c'est exactement le critère que pose §19.1.
>
> **Le partage à l'identique se propage.** Un référentiel qui incorpore du contenu CC BY-SA ne peut plus être diffusé en CC0. Le dataset est donc passé en **CC BY-SA 4.0 avec attribution** le 20 septembre 2026. Ce n'est pas un détail de mention légale : cela contraint toute réutilisation future, y compris la nôtre si le projet change de nature.
>
> **Pourquoi l'infobox est meilleure que Wikidata sur ce champ précis.** Elle porte une consigne de contributeur — *« Do not list emulated releases in the infobox »* — qui exclut les rééditions à la main. C'est précisément la distinction que les déclarations Wikidata ne permettaient pas de faire, et elle a fait passer la couverture régionale de 56 % à 92 %.
>
> La confiance accordée à cette source a été **mesurée avant d'être accordée** : sur les 211 dates régionales que les deux sources donnaient, l'accord à l'année est de **96 %**, et les huit désaccords portent tous sur des sorties européennes à moins d'un an d'écart.

### 2.1 Ce que ça donne concrètement

> **Wikidata couvre largement le besoin du POC.** Sur les sept plateformes retenues : NES 1 209, SNES 1 431, Game Boy 543, GBA 1 072, N64 424, PlayStation 2 178, PlayStation 2 3 217, Switch 7 271 — soit de l'ordre de **17 000 entrées** là où le POC en demande 100 à 300. La contrainte n'est pas la couverture, c'est la **complétude par champ**.

Ce que Wikidata ne donne pas, et qu'il faudra produire :

| Champ requis | État dans Wikidata |
|---|---|
| **`Notability`** (§3.3) | **Absent.** Aucune notion équivalente. À produire entièrement à la main — ce qui reste réaliste sur 100 à 300 titres |
| **`Region`** (§3.4) | **Possible mais irrégulier.** Les dates régionales s'expriment par qualificateur `place of publication` (P291) sur `publication date` (P577). Le motif est reconnu par le WikiProject ; il n'est pas systématiquement renseigné |
| Granularité `Work` / `GameVersion` / `Release` / `Edition` | **Non uniforme.** La littérature sur l'usage de Wikidata comme autorité pour les jeux relève précisément la non-uniformité de granularité comme sa difficulté principale |
| Alias régionaux et titres non latins | Bien couverts — c'est le point fort du modèle Wikidata |

**Conclusion pour la Phase 1** : partir de Wikidata pour l'identification et les alias, produire `Notability` et vérifier `Region` à la main. La licence CC0 autorise à conserver la donnée, à la modifier et à la publier — y compris en cas de commercialisation ultérieure.

---

## 3. Jaquettes — la voie ouverte n'existe pas

§19.2 énumérait quatre voies et désignait la première — « sources ouvertes (Wikidata / Wikimedia et équivalents) : licences propres, couverture partielle » — comme « le point de départ le plus sain ».

> ### ⚠️ Cette hypothèse est fausse
>
> **Wikimedia Commons n'accepte pas le *fair use*** : ni logo non libre, ni jaquette, ni capture. Commons n'héberge que du contenu librement licencié ou dans le domaine public. Les jaquettes de jeux qu'on voit sur Wikipédia sont hébergées par **Wikipédia en anglais**, sous sa politique de contenu non libre, via un modèle dédié aux jaquettes de jeux — au titre du *fair use* **de droit américain**.
>
> Cette exception s'attache à **l'usage encyclopédique**, pas au fichier. Elle ne se transmet pas, et elle n'a pas d'équivalent en droit français ou européen. §19.2 le pressentait — « les encyclopédies s'appuient sur des exceptions qui ne se transmettent pas » — mais listait tout de même Wikimedia comme point de départ. **Les deux énoncés sont incompatibles ; c'est le second qui tombe.**

### 3.1 Les autres dépôts de jaquettes

| Source | Ce que c'est | Verdict |
|---|---|---|
| **SteamGridDB** | Visuels téléversés par les utilisateurs, largement dérivés d'œuvres protégées. CGU non lisibles automatiquement | ❌ Risque non levé, et couvre surtout le PC moderne — pas le rétro console |
| **libretro-thumbnails** | Dépôts GitHub de jaquettes indexées sur les DAT No-Intro. Consignes de contribution précises (pas de jaquettes fan-made, ≤ 512 px) mais **aucune licence sur les images** | ❌ Même conclusion que TheGamesDB : des règles de contribution ne sont pas une licence |
| **Photographier ses propres exemplaires** | Reproduction de l'œuvre graphique | ❌ Posséder l'objet ne donne pas les droits sur l'illustration |
| **Ayants droit** (éditeurs) | Autorisation explicite | ✅ La seule voie propre. Praticable à 100–300 titres, impraticable à 30 000 — ce qui confirme la décision §19.2 point 1 |

### 3.2 Ce que font réellement les acteurs du domaine

Tous les produits du [benchmark](./BENCHMARK-CONCURRENTIEL.md) affichent des jaquettes. Le schéma constant est : **miniature en basse résolution, attribution, retrait sur notification** — RAWG l'écrit noir sur blanc (« ne revendique la propriété d'aucune image », « retire les contenus contrefaisants sur notification en bonne et due forme »).

> **C'est un arbitrage de risque, pas une conformité.** Le dire autrement serait se mentir. La pratique est généralisée, tolérée, et elle expose : elle repose sur le fait que les ayants droit n'attaquent pas une vignette de 200 px qui promeut leur catalogue. Ce raisonnement tient tant que le produit reste petit et cesse de tenir exactement au moment où il réussit.

### 3.3 La posture retenue

La posture de risque acceptable dépend entièrement de **la question ouverte n°1** (§25) : nature du projet — R&D, personnel, ou commercial.

| Si le projet est… | Posture praticable |
|---|---|
| **Personnel / R&D**, non diffusé | Vignettes en basse résolution avec attribution et retrait sur demande. Risque résiduel faible et assumé, **écrit** |
| **Commercial**, même modeste | Accord explicite des ayants droit sur les 100 à 300 titres, ou pas de jaquettes réelles — et alors la grille desktop est abandonnée, comme le prévoit déjà la décision §19.2 point 3 |

> ## ✅ Décision — 20 septembre 2026
>
> **Le projet est un exercice de R&D** (question ouverte n°1, tranchée ce jour). La première ligne du tableau s'applique : **les jaquettes sont reprises sur le web pour la démonstration**, sous une posture de risque assumée.
>
> **Ce n'est pas une autorisation, c'est un arbitrage** — la distinction de §3.2 vaut pour nous comme pour les autres. Il tient parce qu'il est borné, et il n'est borné que s'il est écrit. Cinq conditions :
>
> 1. **Basse résolution** — 512 px de large au plus, dans le cadre 3:4 constant du [langage visuel](./ecrans/00-langage-visuel.md) §5. C'est aussi la convention des dépôts existants ;
> 2. **Origine conservée par visuel** — le champ `Source` du référentiel existe déjà (§4 du modèle) ; sans lui, une demande de retrait est ingérable ;
> 3. **Retrait immédiat sur demande** d'un ayant droit, sans discussion. La tuile générée reprend la place — c'est exactement son rôle de socle ;
> 4. **Diffusion bornée** — démonstration et testeurs de la Phase 2. Pas d'indexation publique, pas de profils publics (Phase 5) avec jaquettes ;
> 5. **Aucune redistribution** — les visuels ne sortent ni par l'export utilisateur, ni par une API publique. Servir une image dans sa propre page et la redistribuer sont deux actes différents.
>
> **Quatre déclencheurs de réexamen**, à traiter avant l'acte et non après : passage à un usage commercial, ouverture publique, activation de la Phase 5, ajout des visuels à l'export.
>
> **Ce que la décision ne change pas.** Les tuiles générées restent le socle permanent — la traîne du référentiel n'aura jamais de jaquette, et le référentiel doit continuer à fonctionner sans visuels (§19.2). Une jaquette reprise est un **emprunt révocable** : rien dans le produit ne doit cesser de marcher le jour où elle disparaît.
>
> **Ce que la décision débloque.** La grille desktop cesse d'être conditionnelle pour le POC, et le test de Phase 2 mesure bien une vitesse de **reconnaissance** et non de lecture — ce qui était l'enjeu réel.

---

## 4. RGPD — ce qui est déjà tranché et ce qui ne l'est pas

Sans objet pour les sources : le RGPD porte sur les données utilisateur, pas sur le référentiel.

> ⚠️ **Le statut R&D ne dispense pas du RGPD.** Il retire la pression des licences commerciales, pas les obligations envers les personnes : dès que des testeurs réels confient un historique de vie de trente ans (Phase 2), le traitement est un traitement de données personnelles. Ce qui suit reste dû.

| Point | État |
|---|---|
| Effacement | ✅ Tranché — purge physique partitionnée par utilisateur ([MODELE-DE-DOMAINE.md](./MODELE-DE-DOMAINE.md) §10.1) |
| Année de naissance | ✅ Cadré — facultative, justifiée, non publiée (§7.6, §12.3) |
| Base légale, information, durée de conservation, sous-traitants | ⬜ Phase 3, avec l'authentification (§19.3) |
| Identifiants de comptes tiers (`ExternalUserId`) | ⬜ Phase 4. Les CGU Steam imposent en plus d'**informer l'utilisateur du pays de stockage** — à traiter avec la politique de confidentialité, pas après |

---

## 5. Décisions proposées

1. **Wikidata est la source d'amorçage du référentiel.** CC0, couverture suffisante, seule licence qui survit à une commercialisation. La licence devient un champ obligatoire du référentiel, comme l'exige §19.1.
2. **Wikipédia complète Wikidata, et rien d'autre n'alimente le référentiel.** Les deux sont sous licence explicitement réutilisable ; Wikidata reste prioritaire là où elle existe, pour que le noyau CC0 demeure identifiable. IGDB, MobyGames, Giant Bomb, RAWG, TheGamesDB, OpenVGDB, ScreenScraper restent utilisables **en consultation manuelle** pour vérifier une entrée curée, jamais en extraction.
3. **Aucun script ne parcourt une source tierce** — article 7(5). La curation du POC est manuelle par construction, ce qui rend la règle sans coût aujourd'hui et explicite pour plus tard.
4. **Steam et RetroAchievements sont réservés à l'import par utilisateur** (Phase 4), ce qui correspond à leurs conditions. Conserver `Source` et `ImportedAt` sur chaque donnée importée sert aussi de preuve de conformité.
5. **Les jaquettes du POC sont reprises sur le web**, sous les cinq conditions et les quatre déclencheurs de réexamen de §3.3 — le projet étant un exercice de R&D. La décision §19.2 devient applicable et la grille desktop est débloquée.

---

## 6. Ce qui reste à faire

| Tâche | Pourquoi | Qui |
|---|---|---|
| Relire à la main les CGU **MobyGames** et la documentation **IGDB** | Inaccessibles à la vérification automatisée (403) | — |
| ~~Trancher la question ouverte n°1~~ | ✅ **Tranchée le 20 septembre 2026 : R&D** (§3.3) | fait |
| ~~Acquérir les jaquettes des 100 à 300 titres~~ | ✅ **Fait le 20 septembre 2026** — 217/222, origine conservée par visuel ([dataset/covers/](./dataset/covers/)). **216 sur 217 sont sous *fair use*** : le socle visuel est révocable à 99,5 %, ce qui confirme que les tuiles générées ne sont pas un pis-aller | fait |
| Sonder deux ou trois éditeurs sur un accord de vignettes | Seule voie propre ; à 100–300 titres, c'est mesurable. **Devient nécessaire** si un déclencheur de réexamen survient | si commercialisation |
| Revue par un avocat | Avant tout usage commercial ou tout import automatisé | Phase 3 |
| Mesurer la complétude Wikidata sur `Region` et sur la chaîne d'éditions | Conditionne le coût de curation | Voir [COUT-DE-CURATION.md](./COUT-DE-CURATION.md) |

---

## Sources

Consultées le 20 septembre 2026.

- [Wikidata : licences](https://www.wikidata.org/wiki/Wikidata:Licensing) — CC0 sur les données structurées
- [Wikidata : WikiProject Video games — statistiques par plateforme](https://www.wikidata.org/wiki/Wikidata:WikiProject_Video_games/Statistics/Platform)
- [Wikidata : propriété P577 (date de publication)](https://www.wikidata.org/wiki/Property_talk:P577) et [P291 (lieu de publication)](https://www.wikidata.org/wiki/Property_talk:P291)
- [Using Wikidata as Work Authority for Video Games](https://dcpapers.dublincore.org/article/952141771) — non-uniformité de granularité
- [IGDB — documentation API](https://api-docs.igdb.com/) *(403 à la vérification automatisée)* et [usage commercial de l'API IGDB, forum développeurs Twitch](https://discuss.dev.twitch.com/t/commercial-use-of-igdb-api/23567)
- [MobyGames — conditions d'utilisation](https://www.mobygames.com/info/terms/) *(403)*, [API](https://www.mobygames.com/info/api/), [abonnements](https://www.mobygames.com/api/subscribe/)
- [Giant Bomb — conditions d'utilisation de l'API](https://www.giantbomb.com/forums/api-developers-3017/api-terms-of-use-1457482/) et [legal, usage, pricing](https://www.giantbomb.com/forums/api-developers-3017/legal-usage-pricing-1468795/)
- [RAWG — conditions d'utilisation de l'API](https://rawg.io/tos_api)
- [TheGamesDB](https://thegamesdb.net/) — aucune licence publiée trouvée
- [Steam Web API — conditions d'utilisation](https://steamcommunity.com/dev/apiterms)
- [RetroAchievements — mentions légales](https://retroachievements.org/terms) et [documentation API](https://api-docs.retroachievements.org/)
- [Commons : licences](https://commons.wikimedia.org/wiki/Commons:Licensing) et [Commons : fair use](https://commons.wikimedia.org/wiki/Commons:Fair_use) — Commons n'accepte pas le fair use
- [Wikipédia : modèle de jaquette de jeu non libre](https://en.wikipedia.org/wiki/Template:Non-free_game_cover)
- [libretro-thumbnails — consignes de contribution](https://github.com/libretro-thumbnails/libretro-thumbnails)
- [SteamGridDB — conditions d'utilisation](https://www.steamgriddb.com/terms) *(contenu non lisible automatiquement)*
- [Directive 96/9/CE — texte consolidé, EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:01996L0009-20190606) et [synthèse EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=LEGISSUM%3Al26028)
- [Étude d'évaluation de la directive Bases de données (Technopolis)](https://technopolis-group.com/wp-content/uploads/2020/02/Study-in-Support-of-the-Evaluation-of-the-Database-Directive.pdf)
