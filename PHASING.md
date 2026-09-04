# Phasage du Projet : Plateforme Vidéoludique

> Plan d'implémentation de [SPECIFICATION.md](./SPECIFICATION.md), découpé en phases séquentielles avec critères de sortie explicites.
> Principe général : **valider le comportement utilisateur avant l'architecture.**

## 1. Contexte et principes directeurs

Le cahier des charges positionne clairement le cœur du produit comme la **mémoire vidéoludique personnelle** du joueur (§1.3), avec le social et les recommandations relégués à des phases ultérieures (§1.4). Ce planning s'appuie sur ce positionnement : chaque phase sert d'abord la reconstruction et la valorisation de l'histoire personnelle avant d'étendre le périmètre.

Quatre principes guident le découpage :

1. **Le POC prouve un comportement, pas une architecture.** Il ne s'agit pas de démontrer que le système tient 10 millions de jeux, mais qu'un utilisateur reconstruit rapidement son histoire et trouve le résultat intéressant.
2. **Pas d'optimisation prématurée.** Formats binaires (MemoryPack…), cache distribué, CDN : tout cela n'a de sens qu'après validation produit. Le cahier des charges cite MemoryPack (§15.1), mais ce choix n'est pas verrouillé.
3. **Portes de sortie entre phases.** Une phase ne démarre que lorsque le critère de sortie de la précédente est atteint ; sinon on itère sur le produit, pas sur l'architecture.
4. **La réduction de friction est la priorité produit.** L'effort de reconstruction doit rester minimal (§19) : les imports (Phase 4) sont plus importants que le social (Phase 5).

## 2. Vue synthétique

| Phase | Objectif | Durée indicative |
|---|---|---|
| 0 | Modèle + cadrage | 1–2 sem. |
| 1 | POC fonctionnel | 3–5 sem. |
| 2 | Validation utilisateur | 2–4 sem. |
| 3 | MVP exploitable | 6–10 sem. |
| 4 | Imports et réduction de friction | 4–8 sem. |
| 5 | Social léger | 4–6 sem. |
| 6 | Intelligence et recommandation | 6–10 sem. |
| 7 | Industrialisation / scale | continue |

**Horizon Phase 0 → 6 : environ 26 à 45 semaines (6 à 11 mois)** en séquentiel, selon les résultats des validations. La Phase 7 est continue et démarre dès que la charge le justifie.

## 3. Phase 0 — Cadrage technique et produit

**Durée : 1 à 2 semaines.**
**Objectif : verrouiller les concepts avant de coder.**

### Livrables

- **Modèle de domaine initial** ;
- **Distinction Work / GameVersion / Release / Edition** (affinement du modèle Game / Release / Edition de §4.2) ;
- **Modèle PlayerEvent / Experience / OwnedItem** (§3.3 architecture événementielle, §4.2 UserGameExperience / UserOwnedItem) ;
- **TemporalValue et gestion de l'incertitude temporelle** (§5.3 : ExactDate, Month, Year, Range, ApproximateYear, Age, Unknown) ;
- **Format des identifiants canoniques** (préparation du risque de canonicalisation, §18.1) ;
- **Stratégie minimale de sourcing des données** (§16.5 : connaissances internes d'abord) ;
- **Définition des KPI du POC** (sous-ensemble opérationnel de §17.1).

### Périmètre volontairement restreint

On ne cherche pas encore à avoir une base exhaustive. Pour le POC, un dataset de référence de **100 à 300 jeux** répartis sur un cœur de plateformes — **NES, SNES, Game Boy/GBA, N64, PS1, PS2 + Switch** — suffit largement ; on l'étend ensuite si la validation passe. À cette taille, une curation manuelle est réaliste (voir décision du cadrage).

### Critère de sortie

> On sait modéliser proprement un parcours utilisateur complexe sans bricolage — par exemple l'historique temporel de §5.1 (Game Boy 1991 → retrogaming 2018) ou la chaîne d'éditions de §4.1 (FFVII : PS PAL Platinum → version numérique PS3 → remake PS5).

## 4. Phase 1 — POC fonctionnel

**Durée : 3 à 5 semaines.**

Le POC doit répondre à **une seule question** :

> Est-ce qu'un utilisateur peut reconstruire rapidement une partie significative de son histoire vidéoludique et trouver le résultat intéressant ?

C'est cohérent avec le point UX central du cahier des charges (§19) : réduire au maximum l'effort de reconstruction.

### Périmètre (limité volontairement)

- Recherche d'un jeu ou d'une console ;
- **Sélection en masse de jeux par plateforme** (mécanisme clé §19.3 : console → période approximative → cocher joué / terminé / possédé) ;
- Statuts simples : **joué / terminé / possédé** ;
- Dates ou périodes approximatives (TemporalValue) ;
- Événements utilisateur (PlayerEvent) ;
- Timeline ;
- Quelques statistiques ;
- Page de profil simple ;
- Données de référence locales.

### Architecture du POC

| Brique | Choix | Justification |
|---|---|---|
| Backend | **.NET 10 LTS + EF Core 10** (verrouillé) | la spec dit « .NET 6+ » mais c'est obsolète ; .NET 8 arrive en EOL en nov. 2026, .NET 10 est supporté jusqu'en nov. 2028 |
| Données utilisateur | **PostgreSQL 17+** | transactionnel, personnel, continuellement modifié (§12) |
| Dataset de référence | SQLite ou fichier précompilé simple (JSON) | pas d'optimisation prématurée ; le format binaire arrive en Phase 7 |
| Frontend | **React + TypeScript (Vite)** (verrouillé) | timeline et sélection en masse = UI interactives, SPA justifiée ; TanStack Query pour l'état serveur |
| Dev local | Docker Compose (Postgres seul) | le POC tourne en local ou sur une instance unique |
| Microservices | ❌ pas encore | mono-app jusqu'à preuve du contraire |
| Moteur de recommandation | ❌ pas encore | Phase 6 |
| Social complet | ❌ pas encore | Phase 5 |

**Note sur MemoryPack** : le cahier des charges le cite actuellement (§15.1), mais il n'est pas verrouillé. Le benchmark se fera en Phase 7, avec une charge réelle.

### Critère de sortie

> Au moins un utilisateur test reconstruit une partie significative de son histoire avec un effort faible et déclare trouver le résultat intéressant (premières mesures des KPI définis en Phase 0).

## 5. Phase 2 — Validation utilisateur

**Durée : 2 à 4 semaines.**

Avant d'étendre techniquement, tester le produit auprès de **10 à 30 joueurs** avec des profils très différents :

- Joueur rétro ;
- Joueur Steam ;
- Collectionneur ;
- Joueur occasionnel ;
- Joueur ayant 20+ ans d'historique.

### Métriques prioritaires (définies dans §17.1)

- % utilisateurs ayant renseigné ≥ 25 jeux ;
- % utilisateurs ayant renseigné ≥ 3 consoles ;
- Temps nécessaire pour reconstruire plusieurs années d'historique ;
- **Median time to first meaningful profile** : temps médian avant qu'un utilisateur ne regarde son profil et pense « oui, ça me ressemble ».

### Mesure qualitative complémentaire

> « Est-ce que ce profil te ressemble réellement ? »

Si la réponse est **non**, il ne sert à rien de construire le social : on itère d'abord sur la saisie et la restitution du parcours.

### Critère de sortie (porte dure)

> La majorité des testeurs répond oui à la question qualitative, et les métriques montrent que la reconstruction est jugée rapide par rapport à l'effort perçu. Sinon → retour Phase 1 (simplification), pas Phase 3.

## 6. Phase 3 — MVP exploitable

**Durée : 6 à 10 semaines.**

Une fois le concept validé, on industrialise.

### Objectifs

- Authentification ;
- Gestion complète du profil ;
- Timeline persistante ;
- Collection actuelle / historique ;
- Wishlist ;
- Favoris ;
- Statistiques plus riches ;
- Import / export ;
- Visibilité privée / publique ;
- Meilleure recherche ;
- Dataset de référence versionné ;
- Premiers mécanismes de canonicalisation.

### Extensions du modèle de données

À ce stade, le modèle intègre :

| Champ | Rôle |
|---|---|
| `DatasetVersion` | version du dataset de référence |
| `Source` | provenance d'une donnée (interne / externe) |
| `ExternalId` | identifiant dans la source d'origine |
| `CanonicalId` | identifiant canonique interne |
| `Alias` | variantes connues (noms localisés, fautes, etc.) |
| `Locale` | langue / région de l'alias ou du contenu |
| `Confidence` | niveau de confiance de la donnée ou du lien |

Le risque de canonicalisation est déjà correctement identifié dans la spécification (§18.1 : « Pokémon Red = Pokémon Rouge = ポケットモンスター 赤 »). Il est traité **légèrement** ici : alias manuels + confidence, pas encore de déduplication automatique (Phase 7).

### Critère de sortie

> Un utilisateur nouveau peut créer un compte, reconstruire son parcours de bout en bout et y revenir plusieurs fois sans friction. Le produit est utilisable en conditions réelles.

## 7. Phase 4 — Imports et réduction de friction

**Durée : 4 à 8 semaines.**

Cette phase est **plus importante que le social**.

### Objectif

> Permettre à un utilisateur de reconstruire 10 ou 20 ans de gaming **sans saisie manuelle massive**.

### Priorité des imports (selon faisabilité)

1. Steam ;
2. RetroAchievements ;
3. Playnite ;
4. LaunchBox ;
5. CSV (filet universel) ;
6. Éventuellement Xbox / PlayStation, selon l'accessibilité réelle des API.

### Provenance des données importées

Le modèle conserve systématiquement la provenance :

| Champ | Rôle |
|---|---|
| `Source` | plateforme d'origine (Steam, Playnite, CSV…) |
| `ExternalUserId` | identifiant utilisateur chez la source |
| `ExternalGameId` | identifiant du jeu chez la source |
| `ImportedAt` | date de l'import |
| `Confidence` | fiabilité du mapping source → canonique |

### Critère de sortie

> Un joueur Steam ou rétro reconstruit 10+ ans d'historique en quelques minutes via import, avec un taux de mapping acceptable. Ce KPI alimente directement « % profils ayant importé une source externe » (§17.1).

## 8. Phase 5 — Social léger

**Durée : 4 à 6 semaines.**

**Seulement après validation de l'usage individuel** (porte Phase 2 atteinte, adoption MVP confirmée).

### Périmètre volontairement petit

- Profil public ;
- Partage de timeline ;
- Comparaison de deux profils ;
- Jeux en commun ;
- Consoles en commun ;
- Compatibilité simple (§9.3) ;
- Suivi d'autres joueurs.

**Pas de forum à ce stade.** Le social prévu dans le cahier des charges (§9, §16.1) est introduit progressivement, au lieu de devenir une seconde application à construire.

### Critère de sortie

> Les profils publics sont réellement consultés par d'autres utilisateurs (retours sur timeline, suivis, partages). Le social enrichit la mémoire personnelle — il ne la remplace pas.

## 9. Phase 6 — Intelligence et recommandation

**Durée : 6 à 10 semaines.**

Une fois que **suffisamment de données utilisateur** existent (volume + qualité des parcours) :

- Recommandations contextuelles (§10 : « Tu as beaucoup joué aux JRPG entre 1997 et 2005 mais tu n'as jamais joué à Chrono Trigger ») ;
- Détection de franchises incomplètes ;
- Redécouverte nostalgique ;
- Anniversaires gaming ;
- « Il y a 20 ans… » (réactivation des événements historiques — valeur directe de l'architecture événementielle, §3.3) ;
- Évolution des goûts (§6.2) ;
- Suggestions de backlog ;
- Comparaison de périodes.

La recommandation basée sur le parcours prévue dans la spécification ne devient réellement intéressante qu'à ce moment-là : elle a besoin d'une masse critique de parcours enrichis (phases 3 et 4).

### Critère de sortie

> Les recommandations sont perçues comme pertinentes et personnelles (taux d'action, retours qualitatifs) — pas seulement comme un algorithme générique.

## 10. Phase 7 — Industrialisation avancée

**Durée : continue.**

À ce stade **seulement**, on pousse les optimisations techniques :

- Dataset binaire ;
- MemoryPack / FlatBuffers / format custom (décision par benchmark, §15.1) ;
- MemoryMappedFile ;
- Index pré-calculés ;
- Cache distribué ;
- CDN ;
- Versioning avancé du dataset ;
- Ingestion multi-source ;
- Déduplication automatique ;
- Pipeline CI/CD de données.

Le besoin de performance sur plusieurs millions d'entités existe bien (§18.1). Mais ce travail doit arriver **après** la validation produit, et être déclenché par des mesures réelles de charge — pas par anticipation.

## 11. Le jalon de validation du projet

> **Un utilisateur peut reconstruire plusieurs années de son parcours en moins de 15–20 minutes et considère le résultat suffisamment personnel pour vouloir y revenir ou le partager.**

C'est le vrai jalon : il est mesuré dès la Phase 2 (tests utilisateurs), consolidé en Phase 3 (MVP) et en Phase 4 (imports). S'il n'est pas atteint, on itère sur le produit — simplification de la saisie, restitution du parcours — avant toute extension technique ou sociale.

## 12. Risques et portes de décision par phase

| Phase | Risque principal | Décision à la porte |
|---|---|---|
| 0 | Modèle trop rigide ou trop compliqué | Valider sur des cas concrets (FFVII, Game Boy 1991…) avant de coder |
| 1 | Scope creep du POC | Gel strict de la liste de fonctionnalités ; tout le reste attend la Phase 3+ |
| 2 | « Ce profil ne me ressemble pas » | Retour Phase 1 (simplification) — pas d'avance en Phase 3 |
| 3 | Canonicalisation sur-ingéniérée | Alias manuels + confidence seulement ; l'automatisation attend la Phase 7 |
| 4 | API sources inaccessibles (Xbox/PS) | Repli CSV / saisie assistée ; ne pas bloquer la phase sur une source |
| 5 | Le social devient un second produit | Périmètre strict : pas de forum, pas de feed, pas de modération lourde |
| 6 | Cold start — données insuffisantes | Activation conditionnée au volume réel de parcours enrichis |
| 7 | Optimisation prématurée | Déclenchement par mesure de charge, jamais par anticipation |

## 13. Correspondance avec SPECIFICATION.md

| Phase | Sections du cahier des charges couvertes |
|---|---|
| 0 | §3.3 (événements), §4.2 (modèle), §5 (temps), §16 (sourcing minimal), §17 (KPI) |
| 1 | §3 (états), §4 (éditions), §5 (TemporalValue), §7 (profil simple), §19 (saisie massive) |
| 2 | §17 (KPI de valeur) |
| 3 | §3, §7 (valorisation), §12 (séparation des données), §16.3–16.4 (fusion / traçabilité), §18.1 (canonicalisation) |
| 4 | §16 (sources et provenance) |
| 5 | §9 (dimension sociale) |
| 6 | §6.2 (représentation synthétique), §10 (recommandation) |
| 7 | §12.1 (données binaires), §15.1 (formats), §18.1 (performance) |
