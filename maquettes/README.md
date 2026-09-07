# Maquettes

Prototypes HTML interactifs des écrans décrits dans [ecrans/](../ecrans/). Chaque fichier est autonome — une page, sans dépendance ni construction — et applique le système défini dans [ecrans/00-langage-visuel.md](../ecrans/00-langage-visuel.md).

Ce sont des **maquettes de conception**, pas une base de code : données en dur, aucune persistance, aucune couche métier. Elles servent à trancher des questions de conception avant d'écrire quoi que ce soit.

## Inventaire

Point d'entrée : ouvrez [index.html](./index.html), qui les présente toutes avec la question que chacune sert à trancher. Cette page-là ne se publie pas comme les autres — ses liens relatifs n'auraient plus de cible.

| Fichier | Écran | Question qu'elle sert à trancher |
|---|---|---|
| [parcours-premiere-session.html](./parcours-premiere-session.html) | **E01 → E02 → E03** | Reconstruit-on une part significative de son histoire en moins de deux minutes ? Chronométré, gestes comptés, et la timeline finale est **construite depuis les déclarations réelles** |
| [E02-selection-massive.html](./E02-selection-massive.html) | E02 — liste et grille | Le geste de saisie tient-il en un tap ? La liste mobile et la grille desktop sont-elles bien deux stratégies de lecture ? |
| [E02b-mode-cartes.html](./E02b-mode-cartes.html) | E02, variante | Une jaquette à la fois et un glissement gauche/droite : accélérateur d'amorçage ou impasse sur un catalogue entier ? |
| [E03-mon-histoire.html](./E03-mon-histoire.html) | E03 + E04, première piste | Axe unique, épisodes par plateforme. **Écartée** au profit de la suivante |
| [E03b-fils-paralleles.html](./E03b-fils-paralleles.html) | E03 + E04, seconde piste | Fils parallèles : la simultanéité des plateformes, les reprises, et une même œuvre traversant plusieurs fils |
| [vignettes-generees.html](./vignettes-generees.html) | — | Le repli sans jaquette permet-il la reconnaissance ? Décision de Phase 0 (§19.2) |

## Ce que les maquettes ont déjà tranché

**La saisie en deux passes.** Trois bascules par ligne coûtaient ~200 px de cibles et tronquaient le titre sur un écran de 375 px — sur l'écran dont la reconnaissance du titre est toute la mécanique. Un tap sur la ligne entière déclare « joué », l'affinage est une seconde passe optionnelle.

**Trois choix temporels, pas sept.** L'éditeur de moment exposait les sept variantes de `TemporalValue` plus trois niveaux de confiance. Il en montre trois, et `Confidence` se déduit de la granularité choisie.

**Les fils parallèles plutôt que l'axe unique.** La première timeline était un inventaire de matériel : la console était l'unité du récit, les jeux étaient repliés, et une colonne unique imposait une linéarité fausse à une vie de jeu qui est simultanée. E03b remplace l'axe par des voies parallèles qui naissent, coexistent et reprennent.

**Quatre dimensions par titre, dans cet ordre.** Quand, fini, marqué, comment. Situer le souvenir dans le temps amorce le rappel du reste ; la provenance, la plus accessoire, ferme la marche. Le « quand » est **relatif à la sortie du jeu** et non absolu, et le « comment » remplace une case « possédé » qui était ambiguë à côté d'un geste disant déjà « joué ».

**Pas de note sur cinq ou dix.** Une note juge l'œuvre ; l'affect enregistre une relation. Trois réponses, dont « sans plus » qui est une déclaration positive.

**Un carrefour plutôt qu'un écran de récompense.** Avec une console et une date, il n'y a rien à célébrer : l'écran propose les deux suites, et met « ajouter une autre console » au même rang que « choisir mes jeux » — sans seconde console, aucun fil parallèle n'apparaît à l'arrivée.

**Les vignettes partout.** Une liste de pastilles de texte ne permet pas la reconnaissance. Grappes et jeux isolés portent leur vignette générée.

## Notes techniques

- Le `<meta viewport>` est requis dans chaque fichier : sans lui, un navigateur mobile rend la page dans un viewport virtuel de ~980 px et les media queries ne sont jamais évaluées à la bonne largeur.
- Les vignettes sont **générées** — teinte d'époque, décalage et trame dérivés du titre. Aucune jaquette sous licence n'est employée, conformément à §19.2.
- Thème clair et sombre, tous deux définis au niveau des jetons.
- Polices : Fraunces en display, IBM Plex Sans en interface.
