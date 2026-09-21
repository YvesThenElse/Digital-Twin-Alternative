# Protocole du test utilisateur — Phase 2

> **Version 1 — 21 septembre 2026**, écrite **avant** le premier testeur.
>
> Les cibles chiffrées ne sont pas ici : elles sont engagées dans
> [`SPECIFICATION.md`](./SPECIFICATION.md) §22.3 depuis le 8 septembre 2026,
> et ce document ne les rediscute pas. Il dit **comment obtenir les nombres
> qu'elles jugent**, ce qui est un problème distinct et, en l'état du POC,
> le plus coûteux des deux.
>
> Règle de révision : ce protocole peut être corrigé tant qu'aucun testeur
> n'a été reçu. Après, toute modification est consignée avec sa date et son
> motif — §22.3 applique la même règle aux seuils, pour la même raison.

---

## 1. Ce que ce test mesure, et ce qu'il ne mesure pas

Une seule question porte la porte dure :

> **« Est-ce que ce profil me ressemble ? »**

Tout le reste — temps, volumes, gestes — sert à savoir **pourquoi** la
réponse est ce qu'elle est. Trois mesures sont donc rapportées séparément,
et les mélanger ferait perdre la Phase 2 pour une raison qui n'a rien à voir
avec le produit :

| Ce qu'on mesure | Ce que ça juge |
|---|---|
| Reconnaissance (§22.3 C) | **le produit** — la porte |
| Temps, volumes, gestes (§22.3 A, B) | **la saisie** — ce qu'on corrige si la porte tombe |
| Couverture du référentiel (§22.3 E) | **le dataset** — jamais imputable au produit |

La menace la plus sérieuse est la troisième : le dataset POC ne couvre que
NES, SNES, Game Boy/GBA, N64, PS1, PS2 et Switch. Un testeur venu du PC, de
l'Amiga, de l'arcade ou du mobile mesurerait la couverture du référentiel et
rien d'autre.

---

## 2. Recrutement

**10 à 30 joueurs**, profils délibérément différents (PHASING.md §5) :
joueur rétro, joueur Steam, collectionneur, joueur occasionnel, joueur ayant
plus de vingt ans d'historique.

**Critère de recrutement opposable** — à vérifier avant la session, pas
après :

> Le testeur nomme **au moins deux** des sept plateformes du dataset comme
> ayant compté dans son histoire.

Un testeur qui n'en nomme qu'une est reçu quand même, mais **marqué**, et
ses résultats sont rapportés à part. Ne pas le marquer reviendrait à imputer
au produit un trou du dataset.

**Le dénominateur, fixé à l'avance.** Toutes les cibles de §22.3 portent sur
les testeurs **recrutés**, pas sur ceux qui finissent. On inscrit donc la
liste des recrutés **avant** la première session, et on n'en retire personne
— pas même un abandon, qui est précisément une donnée.

---

## 3. Préparation d'une session

1. **Un profil vierge par testeur.** L'URL porte `?profil=usr_test_<nom>`.
   Un profil réutilisé ferait lire à quelqu'un l'histoire d'un autre — le
   parcours de bout en bout a déjà passé au vert sur des restes une fois
   (journal, item 15).
2. **Noter l'identifiant de profil** dans la feuille de session : c'est la
   seule clé qui relie l'observation aux mesures en base.
3. Vérifier que l'application répond : `GET /api/health` doit rendre 200.
   Un test conduit sur une base injoignable mesurerait la patience.
4. **Enregistrer l'écran.** Les gestes ne sont pas instrumentés (§5) ; sans
   enregistrement, le KPI « gestes par jeu déclaré » n'existe pas.

---

## 4. Déroulé, et ce qui ne se dit pas

La consigne d'ouverture, **lue telle quelle** :

> « Vous allez essayer un outil qui sert à retrouver les jeux vidéo de votre
> vie. Faites comme vous l'entendez, il n'y a pas de bonne façon. Pensez à
> voix haute si vous le pouvez. Je ne réponds pas pendant, je note. »

**Le chronomètre démarre au premier clic**, pas au chargement : §22.3 exclut
explicitement le temps de lecture de l'accueil.

Ce que l'animateur **ne fait jamais** :

- ne pas nommer la fonction avant que le testeur ne la cherche — « vous
  pouvez cocher plusieurs jeux d'un coup » transformerait la mesure de
  découvrabilité en mesure d'obéissance ;
- ne pas prononcer « timeline », « histoire », « profil », « ça vous
  ressemble » avant la question finale ;
- ne pas corriger une fausse manœuvre. Une fausse manœuvre est un résultat.

**Point d'arrêt.** La session s'arrête quand le testeur le dit, ou à
**25 minutes** — au-delà, T2 est de toute façon manqué (cible : 90ᵉ centile
≤ 20 min) et le chiffre est acquis.

---

## 5. Ce qui se mesure tout seul, et ce qui ne se mesure pas

**Le POC n'a aucune instrumentation produit.** Ni analytique, ni journal
d'interactions, ni chronométrage. C'est un choix de périmètre de la Phase 1
et il a une conséquence directe, qu'il vaut mieux connaître avant la
première session que pendant :

| Indicateur §22.3 | Source | Disponible ? |
|---|---|---|
| **B** · volumes déclarés, plateformes, moments datés | base | ✅ requête |
| **E** · couverture du référentiel | base | ✅ requête |
| **A · T1, T2** | base, via `recorded_at` | ⚠️ **à 2 gestes près** — voir ci-dessous |
| **A · gestes par jeu déclaré** | enregistrement d'écran | ❌ **comptage manuel** |
| **A · achèvement du parcours** | observation | ❌ **manuel** |
| **C · oui francs** | entretien | ❌ manuel, **et c'est voulu** |

> ⚠️ **La plateforme a failli manquer.** En éprouvant ces requêtes contre le
> schéma réel, celle de §22.3 B rendait `0` : le lot portait la machine,
> l'API la validait, et l'événement ne la gardait pas. Un zéro se lit
> « aucune plateforme », jamais « la donnée n'existe pas » — la porte serait
> tombée sur un indicateur inexistant. Corrigé le 21 septembre 2026
> (`player_events.platform_id`). C'est la raison pour laquelle **ces
> requêtes ont été exécutées avant d'être publiées**, et non relues.

**Sur T1 et T2.** `player_events.recorded_at` est un horodatage système exact
(§5, les deux axes du temps). L'écart entre le premier et le n-ième
événement d'un profil donne donc le temps de saisie **à l'exclusion des deux
gestes d'amorce** — choisir la console, choisir la période — qui précèdent
la première déclaration. Le biais est **connu, constant et favorable au
produit** : on le note, on ne le corrige pas en le devinant. Si une cible
tombe à quelques secondes du seuil, la réserve statistique de §22.3
s'applique — on élargit l'échantillon, on ne déclare pas la porte franchie.

**Sur les gestes.** Le seul compteur de gestes du dépôt vit dans le parcours
Playwright, qui mesure **40 gestes pour 31 titres** — dont 32 gestes de
déclaration, soit **1,03 par jeu déclaré** contre une cible à 1,35. C'est un
plancher théorique obtenu sans hésitation, sans retour en arrière et sans
lecture : il dit que le chemin optimal tient dans le budget, **pas** que les
testeurs l'y tiendront. Le chiffre de la Phase 2 se compte à la main sur les
enregistrements.

### Les requêtes

À exécuter par profil, une fois la session close.

```sql
-- B · volume déclaré, et plateformes touchées
SELECT
  count(DISTINCT target_id)                          AS jeux_declares,
  count(DISTINCT platform_id)                        AS plateformes,
  count(*) FILTER (WHERE occurred_kind <> 'Unknown') AS moments_dates
FROM player_events
WHERE user_id = :profil
  AND superseded_by_event_id IS NULL;

-- A · T1 et T2, à deux gestes d'amorce près
SELECT
  min(recorded_at)                                        AS depart,
  (SELECT recorded_at FROM player_events WHERE user_id = :profil
    ORDER BY recorded_at OFFSET 9 LIMIT 1)                AS dixieme,
  (SELECT recorded_at FROM player_events WHERE user_id = :profil
    ORDER BY recorded_at OFFSET 24 LIMIT 1)               AS vingt_cinquieme
FROM player_events WHERE user_id = :profil;

-- E · couverture du référentiel, rapportée SÉPARÉMENT
SELECT
  count(*) FILTER (WHERE target_kind = 'unresolvedClaim') AS titres_saisis,
  count(*)                                                AS total,
  round(100.0 * count(*) FILTER (WHERE target_kind = 'unresolvedClaim')
        / nullif(count(*), 0), 1)                         AS pourcentage
FROM player_events WHERE user_id = :profil;

-- Ce que le référentiel devrait apprendre du test (§3.5)
SELECT title, platform_id, count(*) OVER () AS total
FROM unresolved_claims WHERE user_id = :profil ORDER BY title;

-- §9 · les souvenirs, et leur genre de cible
SELECT target_kind, count(*), avg(length(text))::int AS longueur_moyenne
FROM memories WHERE user_id = :profil GROUP BY target_kind;
```

La dernière requête n'a pas de cible engagée, et c'est délibéré : le
souvenir est le contenu que §9 rend irremplaçable, mais §22.3 n'en fait pas
une porte. On le rapporte comme un signal — **un profil sans une seule
phrase écrite est un indice fort sur la reconnaissance**, à confronter à la
réponse qualitative plutôt qu'à un seuil.

---

## 6. La question qualitative

Elle se pose **une fois**, à la fin, écran ouvert sur l'histoire, et elle est
**aveugle** (§22.3 C) :

> « Qu'est-ce que cet écran vous dit de vous ? »

Ce qui suit est écouté sans relance, puis **codé** :

| Code | Ce qui le déclenche |
|---|---|
| **Oui franc** | le testeur parle de **lui**, pas de l'outil ; il raconte, corrige, complète, ou veut montrer l'écran à quelqu'un |
| **Non** | tout le reste — y compris « c'est pas mal », « c'est bien fait », « ça marche bien » |

« C'est bien fait » est un compliment adressé à l'outil : c'est un **non**.
La confusion est facile à faire, et elle ferait franchir la porte à un
produit qui n'a rien produit de ce qu'il promet.

**Deuxième question, hors porte**, pour situer le produit face à la réponse
du marché (`BENCHMARK-CONCURRENTIEL.md`) :

> « Auriez-vous préféré simplement cocher "joué", sans date du tout ? »

C'est la proposition de Letterboxd, et c'est la seule qui rende le pari
temporel attaquable. Un oui majoritaire ici ne fait pas tomber la porte,
mais il déplace le sujet de l'itération de Phase 1.

---

## 7. Restitution

Une page par testeur, une page de synthèse. La synthèse porte, dans cet
ordre :

1. le **taux de oui francs** sur les recrutés — la porte ;
2. les indicateurs A et B, avec leur cible et leur verdict ;
3. l'indicateur E **isolé**, avec les titres saisis, qui est ce que le test
   apprend au référentiel ;
4. les testeurs marqués « moins de deux plateformes couvertes », comptés à
   part ;
5. la décision, **prise selon §22.3 et non après discussion** : porte
   franchie, ou retour Phase 1.

> Si un résultat tombe à quelques points d'un seuil, la réponse est
> d'élargir l'échantillon. Jamais de déclarer la porte franchie. C'est
> précisément dans ces cas limites que §22.2 se fait contourner.
