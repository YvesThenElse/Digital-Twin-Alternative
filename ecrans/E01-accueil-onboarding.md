# E01 — Accueil / Première session

**Type** : page · **Phase** : 1 · **Route** : `/` (redirige vers `/mon-histoire` si l'historique n'est pas vide)

## Objectif

Amener un inconnu à voir **sa propre histoire commencer** en moins de deux minutes, sans compte et sans formulaire.

C'est l'écran qui décide du sort du produit : le KPI *median time to first meaningful profile* (§22.1) se joue ici. Un onboarding raté ne se rattrape sur aucun autre écran.

## Contenu

Une séquence de trois temps, pas un formulaire. Chaque temps tient sur une hauteur d'écran, sur mobile comme sur desktop.

### Temps 1 — Une seule question

```
┌────────────────────────────────────────────┐
│                                            │
│   Quelle est la première console           │
│   à laquelle vous avez joué ?              │
│                                            │
│   ┌────────┐ ┌────────┐ ┌────────┐        │
│   │  ▨▨▨   │ │  ▨▨▨   │ │  ▨▨▨   │        │
│   │  NES   │ │  Game  │ │  Mega  │        │
│   │        │ │  Boy   │ │ Drive  │        │
│   └────────┘ └────────┘ └────────┘        │
│   ┌────────┐ ┌────────┐ ┌────────┐        │
│   │  SNES  │ │  PS1   │ │  N64   │        │
│   └────────┘ └────────┘ └────────┘        │
│                                            │
│   Une autre ▾        Je ne sais plus       │
└────────────────────────────────────────────┘
```

Grandes cibles visuelles, pas une liste déroulante. Le choix doit être **reconnu**, pas cherché. Chaque carte porte une vignette de la console (photo licenciée ou tuile générée selon la décision sur les visuels, cf. [langage visuel](./00-langage-visuel.md) §5) : sur cet écran plus qu'ailleurs, l'image fait la reconnaissance.

Six cartes maximum. En proposer quarante transformerait la reconnaissance en recherche, et l'écran perdrait sa fonction.

### Temps 2 — Situer dans le temps, par décennie

```
┌────────────────────────────────────────────┐
│   C'était vers quand ?                     │
│                                            │
│   ┌──────────────┐  ┌──────────────┐      │
│   │ Années 80    │  │ Années 90    │      │
│   └──────────────┘  └──────────────┘      │
│   ┌──────────────┐  ┌──────────────┐      │
│   │ Années 2000  │  │ Plus tard    │      │
│   └──────────────┘  └──────────────┘      │
│                                            │
│              Je ne sais plus               │
└────────────────────────────────────────────┘
```

**Des cartes de décennie, pas un curseur.** Un curseur couvrant vingt-cinq ans sur 343 px donne douze pixels par année : c'est le pire contrôle tactile possible, et il contredit la règle des 44 px. Les cartes sont plus larges, plus rapides, plus visuelles — et surtout à la **granularité honnête** : personne ne se souvient de l'année exacte de sa première console.

Chaque carte porte l'accent chromatique de son époque (langage visuel §2) : le système visuel du produit s'installe dès le deuxième écran.

Une fois la décennie choisie, un affinage **facultatif** apparaît — cinq années à sélectionner, ou « quelque part dans les années 90 ». L'utilisateur peut l'ignorer et continuer : la valeur enregistrée est alors un `Range` sur la décennie, ce qui est une réponse parfaitement valide.

### Temps 3 — La récompense, immédiate

Dès la validation du temps 2, sans transition ni chargement bloquant :

```
┌────────────────────────────────────────────┐
│                                            │
│   Votre histoire commence                  │
│   dans les années 90.                      │
│                                            │
│   ●━━━━━━━━━                               │
│   1990    1995                             │
│   Game Boy                                 │
│                                            │
│   Vous aviez peut-être ces jeux-là :       │
│                                            │
│   ┌────┐ ┌────┐ ┌────┐ ┌────┐             │
│   │▨▨▨▨│ │▨▨▨▨│ │▨▨▨▨│ │▨▨▨▨│             │
│   └────┘ └────┘ └────┘ └────┘             │
│                                            │
│   [ Voir les jeux Game Boy →  ]            │
└────────────────────────────────────────────┘
```

Une phrase, une bande sur un axe, un aperçu visuel des jeux à venir, une continuation. C'est le premier « retour visible » exigé par le principe 1 — et la première fois que l'utilisateur voit du contenu qui lui ressemble.

L'aperçu de quatre jaquettes n'est pas décoratif : il montre concrètement ce que la suite propose, ce qui augmente le passage vers E02.

## Mobile et desktop

| | Temps 1 | Temps 2 | Temps 3 |
|---|---|---|---|
| **Mobile** | grille 2 × 3, cartes carrées | grille 2 × 2 | empilé, aperçu sur une rangée de 4 |
| **Desktop** | rangée de 6, cartes plus larges | rangée de 4 | axe et aperçu côte à côte, 8 jaquettes |

La séquence reste identique : ce sont les mêmes trois temps, pas un parcours différent selon l'écran. Seule la disposition change.

## Actions

| Action | Destination |
|---|---|
| Choisir une console | temps 2 |
| Choisir une décennie | temps 3 (l'affinage est facultatif) |
| **Continuer** (action primaire) | **E02** préfiltré sur cette plateforme et cette période |
| « Je ne sais plus » | temps suivant, avec `Unknown` — jamais un blocage |
| « Une autre » | E06 recherche, filtrée sur les plateformes |

## États

- **Vide** : c'est l'état par défaut, et le seul de cet écran.
- **Retour d'un visiteur non authentifié** : si un historique local existe, proposer de le reprendre plutôt que de recommencer. Perdre une saisie faite sans compte est le meilleur moyen de perdre l'utilisateur.
- **Chargement** : aucun. Les données nécessaires (une poignée de plateformes et de vignettes) sont embarquées.
- **Hors ligne** : l'écran fonctionne intégralement.

## Relations

- **Entrant** : racine du site, campagne externe, **image partagée → E15 → E01** (chemin de conversion principal en Phase 5).
- **Sortant principal** : → **E02**. C'est la seule continuation qui compte.
- **Sortant secondaire** : → E06 (console absente de la grille).

## Décisions de conception

**Aucun compte demandé.** La création de compte (E12) intervient au moment où l'utilisateur a quelque chose à perdre — après E02, pas avant. Demander une inscription devant un écran vide, c'est demander un effort avant d'avoir rien donné.

**Une question à la fois.** Un formulaire « console + année + jeux » sur un seul écran paraît plus efficace en nombre d'écrans, et l'est beaucoup moins en taux d'achèvement.

**La décennie plutôt que l'année.** Voir temps 2. Le produit gagne à demander une réponse que les gens ont réellement, plutôt qu'une précision qu'ils inventeraient.

**Le temps 3 n'est pas une confirmation, c'est un cadeau.** Il ne dit pas « enregistré », il montre le début d'une histoire.

## Pièges

- Proposer une grille de quarante consoles : la reconnaissance devient une recherche.
- Rétablir un curseur d'année : c'est l'erreur que cette fiche corrige.
- Exiger une date exacte : contredit §7.4 et bloque le cas le plus fréquent.
- Enchaîner sur un tutoriel : la sélection massive doit être auto-explicite, sinon c'est elle qu'il faut corriger.
- Livrer les cartes sans vignettes : sur cet écran, l'image **est** la reconnaissance.
