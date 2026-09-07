# Plan du site

Arborescence et routes. Le graphe de navigation (qui mène où) est décrit séparément dans [PARCOURS-ET-LIENS.md](./PARCOURS-ET-LIENS.md).

## Arborescence

```
/                                        Racine — redirection selon l'état
│                                        · historique vide  → /bienvenue
│                                        · sinon            → /mon-histoire
│
├── /bienvenue ······················· E01  Première session          [P1]
│
├── ═══ DESTINATIONS PRINCIPALES ═══
│
├── /mon-histoire ···················· E04+E03 fusionnés             [P1]
│   │                                 synthèse en tête + timeline
│   └── ?moment=:id ················· E07  Éditeur de moment ▣       [P1]
│
│   ↓ la fusion se sépare en Phase 3 :
│
├── /timeline ························ E03  Timeline                  [P3]
│   └── ?moment=:id ················· E07  Éditeur de moment ▣
│
├── /collection ······················ E08  Collection                [P3]
│   ├── ?a=:date ···················· curseur temporel
│   ├── ?type=materiel|jeux
│   └── ?plateforme= &etat= &region=
│
├── /ajouter ························· E02  Sélection massive ◼       [P1]
│   └── /ajouter/:plateforme ········ préfiltré par plateforme
│       └── ?de=:annee&a=:annee ····· période appliquée
│
├── /profil ·························· E04  Profil                    [P3]
│
├── ═══ RÉFÉRENTIEL (accessible partout) ═══
│
├── /recherche ······················· E06  Recherche ▣               [P1]
│   └── ?q=:terme
│
├── /jeu/:slug ······················· E05  Fiche jeu                 [P1]
│   └── ?edition=:id ················ édition mise en avant
├── /plateforme/:slug ················ E05  Fiche plateforme          [P1]
├── /studio/:slug ···················· E05  Fiche studio              [P1]
│
├── ═══ SECONDAIRE ═══
│
├── /backlog ························· E09  À jouer                   [P3]
│   └── /backlog/wishlist ··········· E09  À avoir (onglet)          [P3]
├── /statistiques ···················· E10  Statistiques              [P3]
│
├── ═══ COMPTE ═══
│
├── /connexion ······················· E12  Connexion                 [P3]
├── /inscription ····················· E12  Inscription               [P3]
├── /parametres ······················ E11  Paramètres                [P3]
│   ├── #visibilite ················· section principale
│   ├── #compte
│   ├── #donnees ···················· export · suppression (RGPD)
│   └── #sources ···················· comptes tiers connectés   [P4]
│
├── ═══ IMPORT ═══                                                   [P4]
│
├── /import ·························· E13  Choix de la source
│   └── /import/:source ············· connexion et correspondance
│       └── /import/:source/dates ··· E14  Passe temporelle ◼
│
└── ═══ PUBLIC & SOCIAL ═══                                          [P5]
    │
    ├── /u/:handle ··················· E15  Profil public
    │   └── /u/:handle/comparer ······ E16  Comparaison
    └── /decouvrir ··················· E17  Découverte & suivis
```

**Légende** — `▣` surcouche ou panneau (pas de page propre) · `◼` mode plein écran, sans navigation principale · `[P1]`…`[P5]` phase d'apparition.

## Profondeur

Aucun écran principal n'est à plus de **deux niveaux** de la racine. Les seules routes à trois segments sont les étapes d'import, qui forment une séquence linéaire et non une hiérarchie à explorer.

## Navigation persistante

**« Ajouter » n'est pas une destination, c'est une action.** Le traiter comme un onglet de navigation mélange deux registres. Il prend donc la forme d'un **bouton d'action distinct** — flottant sur mobile, dans l'en-tête sur desktop — visuellement séparé des destinations. Il reste permanent parce que c'est le geste qui crée toute la valeur.

### Phase 1 — deux destinations et une action

```
┌────────────────────────────────┐
│  Mon histoire      🔍      ⊕   │   desktop : en-tête
└────────────────────────────────┘

        mobile : ⊕ flottant, bas-droite
```

`/mon-histoire` fusionne la synthèse de profil et la timeline (cf. [E03](./E03-timeline.md), [E04](./E04-profil.md)) ; la recherche est permanente ; l'ajout est le bouton d'action. **Aucune barre d'onglets** : deux destinations n'en justifient pas une, et l'écran gagne la place.

### Phase 3 et au-delà

| Emplacement | Contenu |
|---|---|
| **Principale** (3 destinations) | Timeline · Collection · Profil |
| **Action** | **Ajouter** (⊕), permanent, distinct des destinations |
| **Permanente** | Recherche (E06), accessible de partout |
| **Menu compte** | Paramètres, Backlog, Statistiques, Import, Découvrir, Déconnexion |

`Découvrir` (E17) reste dans le menu et n'accède jamais à la navigation principale : il serait vide pour la quasi-totalité des utilisateurs pendant longtemps.

## Ce que le plan ne contient pas

Volontairement absents, et il faut qu'ils le restent :

| Écran absent | Pourquoi |
|---|---|
| « Ajouter un jeu » (unitaire) | La déclaration se fait en masse (E02) ou en contexte (E05, E06). Un formulaire unitaire serait le chemin le plus lent vers l'objectif du produit |
| « Ma collection historique » | Ce n'est pas un écran mais une position du curseur temporel de E08 |
| « Profil » en Phase 1 | Fusionné avec la timeline dans `/mon-histoire` : le profil est encore trop maigre pour être une destination |
| « Recommandations » | Phase 6, sous forme de surfaces dans E03, E04 et E09 — jamais une page dédiée, qui serait consultée une fois puis oubliée |
| « Tableau de bord » | E04 est un portrait, E10 l'analyse. Un troisième écran de synthèse n'aurait pas d'objet |
| Forum | Hors périmètre jusqu'à nouvel ordre ([PHASING.md](../PHASING.md) §8) |
