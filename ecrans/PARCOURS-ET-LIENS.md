# Parcours et liens entre écrans

Le [plan du site](./PLAN-DU-SITE.md) décrit l'arborescence. Ce document décrit le **graphe** : qui mène où, par quel chemin, et pourquoi.

---

## 1. Le cycle central

Tout le produit tient dans une boucle de trois écrans. Si elle est fluide, le reste suit.

```
                  ┌──────────────────────┐
                  │   E01 Onboarding     │   entrée unique
                  └──────────┬───────────┘
                             │ « voir les jeux de cette époque »
                             ▼
        ┌────────────────────────────────────────┐
        │        E02  SÉLECTION MASSIVE          │◀────────┐
        │        je déclare, vite                │         │
        └────────────────────┬───────────────────┘         │
                             │ « voir ma timeline »        │
                             ▼                             │
        ┌────────────────────────────────────────┐         │
        │        E03  TIMELINE                   │         │ « compléter
        │        je constate                     │─────────┘   ces années »
        └────────────────────┬───────────────────┘
                             │ quand l'histoire est assez dense
                             ▼
        ┌────────────────────────────────────────┐
        │        E04  PROFIL                     │
        │        « oui, ça me ressemble »        │
        └────────────────────────────────────────┘
```

**Déclarer → constater → déclarer plus.** Le retour E03 → E02 est aussi important que l'aller : il se déclenche sur les **trous** de la timeline, qui deviennent des invitations plutôt que des défauts d'affichage. C'est le mécanisme de relance principal du produit, et il ne coûte aucune notification.

> **En Phase 1, E03 et E04 sont un seul écran** — `/mon-histoire`, synthèse en tête et timeline dessous. Le cycle se réduit donc à **E02 ⇄ /mon-histoire**, ce qui le raccourcit encore : on constate et on se reconnaît au même endroit. La séparation en deux destinations intervient en Phase 3, quand le profil a assez de matière.

---

## 2. Graphe complet

```
                        ┌─────────────┐
                        │ E06 RECHERCHE│  surcouche, appelable de partout
                        └──────┬───────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
  ┌──────────┐          ┌───────────┐          ┌───────────┐
  │ E05 JEU  │◀────────▶│E05 PLATEF.│◀────────▶│E05 STUDIO │
  └────┬─────┘          └─────┬─────┘          └─────┬─────┘
       │                      │ « déclarer en masse »│
       │                      ▼                      │
       │              ┌───────────────┐              │
       └─────────────▶│ E02 SÉLECTION │◀─────────────┘
                      └───────┬───────┘
                              ▼
   ┌────────────┐      ┌─────────────┐      ┌────────────┐
   │E08 COLLECT.│◀────▶│ E03 TIMELINE│◀────▶│ E04 PROFIL │
   └────────────┘      └──────┬──────┘      └─────┬──────┘
                              │                   │
                              ▼                   ▼
                      ┌───────────────┐    ┌──────────────┐
                      │E07 ÉDITEUR ▣  │    │E10 STATISTIQS│
                      │ retour au     │    └──────────────┘
                      │ contexte      │
                      └───────────────┘
```

`E07` est un panneau : il retourne **toujours** à l'écran appelant et ne conduit nulle part ailleurs.

---

## 3. Table des liens

> **Ce que cette table est, et ce qu'elle n'est pas.** C'est un **résumé des
> liens dominants**, pas une matrice d'adjacence — sa dernière colonne le
> disait déjà à demi-mot, et ses deux colonnes du milieu sont tenues à la
> main, donc asymétriques en une vingtaine d'endroits. Décidé le
> 23 septembre 2026.
>
> Conséquence, et elle engage : **« Mène vers » fait foi.** C'est cette
> colonne que `GrapheDeNavigationTests` lit pour exiger que chaque
> destination soit située par [`PHASING.md`](../PHASING.md) §2. « Vient de »
> est **indicative** : elle aide à lire le graphe, elle n'est comparée à
> rien, et une entrée absente de « Mène vers » ne sera pas gardée.
>
> Un résumé ne peut pas omettre ce qu'il prétend résumer : le même test
> vérifie donc que **les six transitions de §6** — celles qui portent les
> KPI — figurent toutes dans la colonne qui fait foi.

| Écran | Vient de | Mène vers | Lien dominant |
|---|---|---|---|
| **E01** Onboarding | racine, lien partagé (E15) | **E02**, E06 | → E02 |
| **E02** Sélection massive | E01, nav, E05 plateforme, **E03** | **E03**, E05, E07, E02, E12 | → E03 |
| **E03** Timeline | nav, E01, **E02**, E04, E14 | **E07**, E05, **E02**, E04 | ⇄ E02 |
| **E04** Profil | nav, E03, E02 | E03, E10, E08, E05, E11 | → E03 |
| **E05** Fiches | E06, E02, E03, E04, E05 | E05, **E02**, E07, E03 | ⇄ E05 |
| **E06** Recherche | tout écran | E05, E07, E02 | → E05 |
| **E07** Éditeur ▣ | E02, **E03**, E05, E06 | *retour au contexte* | ← appelant |
| **E08** Collection | nav, E04 | E05, E07, E02 | → E05 |
| **E09** Backlog | menu, E05, E16 | E05, E07 | → E05 |
| **E10** Statistiques | E04, menu | E08, E05, E03 | → E08 |
| **E11** Paramètres | menu, E04 | **E15** (aperçu), E13 | → E15 |
| **E12** Auth | **E02** (déclencheur), E11, E15 | *retour au contexte* | ← appelant |
| **E13** Import | E11, E01/E02 | **E14** | → E14 |
| **E14** Passe temporelle | **E13**, E03 (tiroir sans-date) | **E03** | → E03 |
| **E15** Profil public | lien externe, E16, E17, E11 | **E01**, E16, E17 | → E01 |
| **E16** Comparaison | E15, E17 | E05, E09, E15 | → E05 |
| **E17** Découverte | menu, E15, E16 | E15, E16, E11 | → E15 |

---

## 4. Parcours types

### 4.1 Première session — la seule qui compte en Phase 2

```
/                                       racine
└── /bienvenue                          E01
    ├── choisir « Game Boy »               ◀── reconnaissance visuelle
    ├── choisir « Années 90 »              ◀── carte de décennie, pas de curseur
    ├── ► première bande visible           ◀── récompense, < 60 s
    │     + aperçu de 4 jaquettes
    └── /ajouter/game-boy?de=1990&a=1999    E02
        ├── tap sur ~20 lignes              ◀── 1 tap = « joué »
        │   └── la bande d'époque grandit   ◀── récompense continue
        ├── changer de plateforme → SNES    E02
        │   └── tap sur ~15 lignes
        └── /mon-histoire                   E03+E04 fusionnés
            ├── ► phrase + 35 moments + densité colorée
            └── déclencheur compte          E12
                └── « gardez vos 35 jeux »  ◀── on a quelque chose à perdre
```

**Budget : moins de deux minutes jusqu'à l'écran « mon histoire » lisible.** Aucun compte demandé avant la dernière étape, et aucune passe d'affinage exigée — un profil issu de la seule passe 1 est déjà valable.

### 4.2 Session de retour — approfondir

```
/timeline                               E03
├── trou visible sur 2000–2005
│   └── /ajouter?de=2000&a=2005         E02      ◀── le trou est l'invitation
├── clic sur « FFVII terminé »
│   └── panneau E07
│       ├── préciser : 1998 → mars 1998
│       └── ajouter un souvenir                  ◀── ce qui rend le profil unique
└── tiroir « 7 moments sans date »
    └── dater en lot
```

### 4.3 Navigation relationnelle — explorer

```
/recherche?q=zeld                       E06
└── /jeu/zelda-a-link-to-the-past       E05
    ├── déclarer joué + terminé                  ◀── sans changer d'écran
    ├── /studio/nintendo-ead             E05
    │   └── « 6 jeux sur 14 »
    │       └── /jeu/…                   E05
    └── /plateforme/super-nintendo       E05
        └── « déclarer en masse »
            └── /ajouter/super-nintendo  E02     ◀── retour au cycle central
```

L'exploration **reconduit toujours au geste central**. C'est la règle qui empêche le référentiel de devenir une encyclopédie sans usage.

### 4.4 Import — Phase 4

```
/import                                 E13
├── choisir Steam
│   └── ⓘ « dates d'achat non disponibles »     ◀── annoncé avant, pas après
├── correspondance : 312 ✓ · 18 à confirmer · 7 introuvables
└── /import/steam/dates                 E14     ◀── étape obligatoire
    ├── 38 jeux pré-datés par les succès
    ├── placer les autres sur des bandes
    └── /timeline                        E03
```

E13 seul produit une **liste** ; c'est E14 qui produit une **histoire**. Les enchaîner n'est pas un confort mais une nécessité.

### 4.5 Découverte par le partage — Phase 5

```
image partagée (messagerie, réseau)     générée depuis E04
└── /u/marc                             E15     ◀── consultable sans compte
    ├── lire la timeline
    ├── /u/marc/comparer                E16     (si le visiteur a un profil)
    └── « Reconstituez votre histoire »
        └── /bienvenue                  E01     ◀── boucle de conversion
```

---

## 5. Règles de liaison

**Aucun cul-de-sac.** Tout écran propose au minimum une continuation vers la déclaration (E02/E07) ou la restitution (E03/E04). Un écran dont la seule action possible est le retour arrière est en erreur.

**Retour au contexte, toujours.** E07 et E12 reviennent exactement d'où ils viennent — jamais vers un accueil générique, qui ferait perdre le fil.

**Les surcouches ne comptent pas dans la profondeur.** E06 et E07 se superposent au contexte plutôt que de le remplacer : chercher ou dater ne doit jamais coûter deux navigations.

**Le fil d'Ariane suit le chemin réel.** Les fiches E05 forment un graphe, pas une hiérarchie : le fil reflète le parcours effectivement suivi, pas une arborescence théorique.

**Un seul chemin d'entrée pour un nouvel utilisateur.** E01. Toutes les autres entrées (lien partagé, recherche externe) y reconduisent après consultation, jamais avant.

---

## 6. Chemins à surveiller

| Chemin | Risque | Mesure |
|---|---|---|
| **E01 → E02** | abandon avant la première déclaration | taux de passage, temps écoulé |
| **E02 → E03** | l'utilisateur ne voit jamais le résultat | taux de passage |
| **E03 → E02** | pas de deuxième session de saisie | taux de retour, moments par profil |
| **E02 → E12** | déclencheur de compte mal placé | taux de conversion |
| **E13 → E14** | l'import s'arrête à la liste | part des moments datés après import |
| **E15 → E01** | le partage ne convertit pas | taux de conversion des visiteurs |

Ces six transitions portent l'essentiel des KPI de §22.1. Elles doivent être instrumentées dès la Phase 1 — et non les écrans eux-mêmes, dont le temps passé ne dit rien d'utile ici.
