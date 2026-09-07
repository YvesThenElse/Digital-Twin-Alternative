# E08 — Collection

**Type** : page · **Phase** : 3 · **Route** : `/collection`

## Objectif

Répondre à « qu'est-ce que je possède ? » **et** à « qu'est-ce que je possédais en 1997 ? » — dans un seul écran.

## Décision structurante : un écran, pas deux

La spécification distingue collection actuelle et collection historique (§8.2). En faire **deux écrans** serait une erreur de conception : ce sont deux valeurs de la même requête, l'état n'étant qu'une projection du flux d'événements (§5.1).

L'écran porte donc un **curseur temporel**, positionné sur « aujourd'hui » par défaut. Le déplacer recompose la collection à la date choisie. C'est la démonstration la plus immédiate de la valeur de l'architecture événementielle — et un moment fort du produit, à ne pas enterrer dans un menu.

```
┌──────────────────────────────────────────────────────────────┐
│  Ma collection          1991 ────────────────●  aujourd'hui  │
├──────────────────────────────────────────────────────────────┤
│  Matériel · 18                          Jeux · 214    ⊞ ☰    │
├──────────────────────────────────────────────────────────────┤
│  ┌────┐ ┌────┐ ┌────┐   Super Nintendo    PAL   1993–2001   │
│  │SNES│ │ PS1│ │ N64│   Game Boy          PAL   1991–        │
│  └────┘ └────┘ └────┘   …                                    │
├──────────────────────────────────────────────────────────────┤
│  Filtres : plateforme · état · région · période d'acquisition│
└──────────────────────────────────────────────────────────────┘
```

## Contenu

- **Curseur temporel** en tête, toujours visible.
- **Matériel et jeux séparés** : consoles et accessoires sont des objets possédables de plein droit (§4.3), et « 18 consoles » est une fierté distincte de « 214 jeux ».
- **Deux vues** : grille (visuelle, pour parcourir) et liste (dense, pour gérer). La grille est le défaut sur mobile, la liste sur écran large.
- **Chaque élément est un exemplaire**, pas un titre : le même jeu possédé deux fois apparaît deux fois, avec son édition et sa période (§6.1).
- **Filtres** : plateforme, état, région, période d'acquisition.

## Actions

Clic sur un élément → E05 · Déplacer le curseur → recompose la vue · Déclarer une cession → E07 · Ajouter → E02 ou E06.

## États

- **Vide** : invitation vers E02, avec un exemple visuel de ce que deviendra l'écran.
- **Partiel** : nominal — les éléments sans date d'acquisition apparaissent quelle que soit la position du curseur, signalés comme tels.
- **Curseur dans le passé** : marquer visuellement que la vue n'est pas l'état actuel, sans quoi la confusion est garantie.

## Relations

**Entrant** : navigation principale · E04 (clic sur un chiffre). **Sortant** : E05 · E07 · E02.

Relation forte avec **E03** : la timeline est l'histoire, la collection en est la coupe transversale à un instant donné. Un lien réciproque explicite entre les deux écrans aide à comprendre le modèle sans l'expliquer.

## Pièges

- Traiter la position du curseur comme un filtre parmi d'autres : c'est la dimension principale de l'écran.
- Appliquer le mode strict aux requêtes temporelles : pour une collection, le mode **permissif** (chevauchement) est le bon défaut (§7.7), sinon les acquisitions floues disparaissent.
