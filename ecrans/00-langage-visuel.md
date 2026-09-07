# Langage visuel

Ce document décrit **à quoi ressemble le produit**. Les [principes transverses](./00-principes-transverses.md) décrivent comment il se comporte ; les fiches E01–E17 décrivent ce que contient chaque écran. Les trois se lisent ensemble.

---

## 1. Intention

Le produit est une **archive personnelle**, pas un tableau de bord de joueur.

La référence visuelle n'est ni un site de jeux vidéo, ni une console, ni un lanceur : c'est un **album ordonné** — quelque chose qui a la sobriété d'un livre bien composé et qui met en valeur ce qu'on y a déposé. Le contenu de l'utilisateur (ses jeux, ses dates, ses souvenirs) doit dominer l'interface d'un rapport écrasant.

Trois qualités à tenir :

| Qualité | Ce que ça veut dire concrètement |
|---|---|
| **Calme** | peu de couleurs, peu de bordures, beaucoup de blanc. L'émotion vient du contenu, pas de la décoration |
| **Dense sans être encombré** | l'information est serrée là où l'on traite (E02), aérée là où l'on contemple (E04) |
| **Daté, au bon sens** | on sent l'époque de ce qu'on regarde, sans pastiche ni nostalgie appuyée |

### Ce qu'on ne fait pas

Cette liste vaut définition : elle écarte l'esthétique par défaut du domaine, qui irait à l'encontre du positionnement.

- Pas de néon, pas de dégradés RGB, pas de fond noir « gamer », pas de polices anguleuses ou pixellisées.
- Pas de badges, de niveaux, de succès maison, de barres de progression : le produit **enregistre une histoire, il ne note pas un joueur**. Une barre « collection complétée à 34 % » transformerait un loisir en devoir.
- Pas de confettis ni de célébration automatique. La récompense est de voir son histoire apparaître, pas d'être félicité.
- Pas de skeuomorphisme : pas de fausse cartouche, pas de faux boîtier, pas de faux écran cathodique.
- Pas de pastiche rétro généralisé. L'époque est signalée par la couleur (§3), pas en imitant les interfaces de 1994.

---

## 2. Couleur

### Neutres

La base est **chaude**, pas grise : un blanc cassé légèrement papier, un noir légèrement brun. C'est ce qui distingue une archive d'un outil.

| Rôle | Clair | Sombre |
|---|---|---|
| `surface` fond de page | `#FAF8F5` | `#16140F` |
| `surface-2` cartes, panneaux | `#FFFFFF` | `#1E1B16` |
| `line` filets, séparateurs | `#E5E0D8` | `#2E2A26` |
| `ink` texte principal | `#1A1815` | `#F2EFE9` |
| `ink-2` texte secondaire | `#57524B` | `#A8A199` |
| `ink-3` texte tertiaire, méta | `#8A8279` | `#6E6862` |

Les deux thèmes sont livrés. Le thème suit le système par défaut.

### L'époque comme système — le parti pris central

Le sujet du produit, ce sont les décennies. La couleur les encode, selon un **gradient de température** : le passé est chaud et terreux comme une photo vieillie, le présent est froid et net.

| Génération | Période | Accent | Nom d'usage |
|---|---|---|---|
| 8 bits | jusqu'à 1990 | `#A6572F` | terre cuite |
| 16 bits | 1990–1995 | `#B0842B` | ocre |
| 32/64 bits | 1995–2000 | `#6E7F4A` | olive |
| 128 bits | 2000–2006 | `#3F7A80` | bleu-vert |
| HD | 2006–2013 | `#4A6BA8` | bleu |
| Moderne | depuis 2013 | `#6B5EA8` | violet |

Ce système rend trois services d'un coup :

1. **On sait où on est sur la timeline sans lire de date.** La couleur porte le repérage temporel.
2. **Le produit acquiert une identité** qu'aucun concurrent du domaine n'a.
3. **La grille de jeux cesse d'être grise même sans jaquettes** (§5).

**Règles d'emploi.** Ces accents servent de **fonds, de filets et de pastilles** — jamais de couleur de texte sur fond clair (leur contraste ne le permet pas). Pour du texte ou une icône, utiliser la variante assombrie de 20 % en thème clair, éclaircie de 25 % en thème sombre. Un écran n'affiche jamais plus de deux accents simultanément, sauf la timeline et les statistiques, dont c'est justement l'objet.

### Sémantique

Il n'y a **pas de couleur de succès ni d'erreur** dans le vocabulaire courant : rien n'est un succès, rien n'est une faute (principe 6). Deux exceptions techniques : `#8A5A2B` pour l'avertissement doux, `#9B3D3D` pour l'échec réel (perte de données, panne réseau).

---

## 3. Formes : rond = vécu, carré = possédé

L'information n'est jamais portée par la seule couleur (principe 10). Les trois états ont donc chacun **une forme distincte**, et cette forme est signifiante :

| État | Forme | Logique |
|---|---|---|
| Joué | ● disque plein | une expérience : ronde, continue |
| Terminé | ◉ disque cerclé | la même expérience, close |
| Possédé | ■ carré | un **objet** : une boîte, une cartouche |
| Jamais joué | ○ cercle vide, ligne estompée | une déclaration, pas une absence |

Rond pour le vécu, carré pour l'objet : la distinction possession / expérience (§4.2 de la spec) devient visible sans légende après une seule exposition. C'est la traduction graphique de la décision de modèle la plus structurante du produit.

Rayons : `4px` pour les tuiles et les champs, `10px` pour les cartes et panneaux, plein pour les pastilles. Petits rayons — une archive, pas une application de messagerie.

---

## 4. Typographie

Deux familles, pas plus.

| Rôle | Famille | Repli |
|---|---|---|
| **Display** — phrase narrative, chiffres clés, années | une serif à caractère, contrastée | `Georgia, 'Times New Roman', serif` |
| **Texte et interface** | une sans-serif neutre et lisible en petit corps | `system-ui, 'Segoe UI', Roboto, sans-serif` |

La serif en display est ce qui empêche le produit de ressembler à un tableau de bord : elle installe le registre « récit » dès la première ligne. Elle ne sert **jamais** à l'interface courante ni aux libellés.

**Chiffres** : chasse tabulaire partout où des nombres s'alignent (statistiques, compteurs, années), pour que rien ne saute pendant l'incrémentation.

### Échelle

| Niveau | Mobile | Desktop | Usage |
|---|---|---|---|
| `display-1` | 32 / 40 | 44 / 52 | la phrase du profil, un chiffre isolé |
| `display-2` | 24 / 32 | 28 / 36 | titres d'écran, années sur la timeline |
| `title` | 18 / 24 | 18 / 26 | titres de jeux, en-têtes de section |
| `body` | 15 / 22 | 16 / 24 | texte courant, souvenirs |
| `meta` | 13 / 18 | 13 / 18 | plateforme, date, contexte |
| `micro` | 11 / 16 | 11 / 16 | capitales espacées, étiquettes de section |

Le **souvenir** de l'utilisateur (§9 de la spec) s'affiche en `body` italique, jamais en `meta` : c'est le contenu le plus précieux du produit, il ne se relègue pas en petits caractères.

---

## 5. La tuile de jeu — et le problème des jaquettes

La reconnaissance est la mécanique centrale de E02. Elle repose sur la jaquette, dont la disponibilité n'est pas acquise (spec §19.2). La tuile est donc conçue pour **fonctionner dans les deux cas, sans que la grille paraisse rapiécée**.

```
avec jaquette              sans jaquette (tuile générée)
┌───────────────┐          ┌───────────────┐
│               │          │▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚│  fond = accent de l'époque
│   [ image ]   │          │               │  + trame discrète
│               │          │  SUPER MARIO  │  titre en display, cadré
│               │          │     WORLD     │
└───────────────┘          └───────────────┘
  Super Mario World          SNES · 1990
  SNES · 1990
```

**Règles de la tuile générée :**
- fond = accent de l'époque de la sortie, avec une trame géométrique discrète dérivée du titre (pour que deux jeux voisins ne soient pas identiques) ;
- titre composé en display, centré, sur deux ou trois lignes, jamais tronqué en dessous de trois mots ;
- **elle ne doit jamais ressembler à une vraie jaquette** : pas de bordure de boîtier, pas de faux logo d'éditeur. Elle assume d'être une composition typographique.
- format constant `3:4` quelle que soit l'origine, pour que la grille reste régulière.

Bien exécutée, la tuile générée paraît **intentionnelle et signée**, pas manquante. C'est la réponse de conception à une contrainte juridique — et elle reste valable même si des jaquettes sous licence sont obtenues plus tard, puisque la couverture ne sera jamais complète.

---

## 6. Grille, espacement, points de rupture

**Espacement** : base 4. Échelle `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96`. Rien en dehors.

**Points de rupture** :

| | Largeur | Colonnes | Marge |
|---|---|---|---|
| Mobile | < 600 | 4 | 16 |
| Tablette | 600–1023 | 8 | 24 |
| Desktop | ≥ 1024 | 12 | 32, contenu limité à 1200 |

### Densité par point de rupture

Ce tableau résout la tension entre le principe 3 (« E02 très dense ») et le principe 8 (« cibles ≥ 44 px ») : **la densité vient du nombre d'éléments visibles, jamais de la compression des cibles.**

| Écran | Mobile | Desktop |
|---|---|---|
| **E02** sélection | liste 1 colonne, ligne 56 px, **une cible pleine largeur** | grille 4 à 6 tuiles par rangée, bascules au survol |
| **E03** timeline | défilement vertical, une colonne | vertical + rail de décennies fixe à gauche |
| **E04** profil | empilé, un bloc par écran | deux colonnes, la synthèse tenant sans défilement |
| **E05** fiche | vue empilée poussée | deux panneaux : la liste reste, le détail s'ouvre à côté |
| **E07** éditeur | feuille remontante, pleine largeur | panneau latéral 420 px |

Mobile et desktop ne sont pas la même disposition étirée : ce sont **deux stratégies de lecture**. On balaye une liste sur téléphone, on balaye une grille sur écran large.

---

## 7. Mouvement

Le mouvement sert à trois choses seulement : confirmer une action, situer une transition, montrer une progression. Tout le reste est décoratif et se supprime.

| Usage | Durée | Courbe |
|---|---|---|
| Bascule d'état, pastille | 120 ms | `ease-out` |
| Ouverture de panneau, feuille | 220 ms | `cubic-bezier(.2,.8,.2,1)` |
| Transition d'écran | 280 ms | idem |
| Apparition d'un moment sur la timeline | 400 ms | `ease-out`, décalé de 30 ms par élément |

**Le mouvement le plus important du produit** est celui de la récompense pendant la saisie (principe 1) : quand une ligne est déclarée en E02, la bande d'époque en pied d'écran **grandit visiblement**. Ce n'est pas un compteur qui s'incrémente, c'est une histoire qui pousse.

`prefers-reduced-motion` supprime les déplacements et conserve uniquement les changements d'opacité.

---

## 8. États vides

Jamais d'illustration générique. L'état vide se dessine avec **le vocabulaire du produit lui-même** :

- une timeline vide est **un axe avec un seul point** et une invitation ;
- une collection vide est **une grille de tuiles fantômes** à l'emplacement exact des futures ;
- une recherche sans résultat propose la déclaration libre en action principale.

L'état vide montre la forme de ce qui va venir. C'est plus efficace qu'un dessin, et cela évite le registre mascotte.

---

## 9. L'image partageable

Une page web publique (E15) n'est pas ce qu'on partage sur une messagerie ou un réseau. Une **image générée** l'est.

Le produit sait donc produire une carte, à partir du profil :

```
┌─────────────────────────────────┐
│                                 │
│   35 ans de jeu                 │   display-1
│                                 │
│   487 joués · 214 terminés      │   chiffres tabulaires
│   18 consoles                   │
│                                 │
│   ▁▂▅▇▅▃▂▄▇▆▃▁                  │   densité par décennie,
│   1991 ──────────────── 2026    │   colorée par époque
│                                 │
│   Première console : Game Boy   │
│                                 │
└─────────────────────────────────┘
```

- Formats : carré (1:1) et vertical (9:16), les deux ratios réellement partagés.
- **Aucune donnée que la visibilité (E11) n'autorise pas.** L'image se génère depuis les mêmes règles que E15.
- Elle porte l'identité du produit discrètement, jamais un filigrane agressif.

C'est simultanément la réponse « très visuel » et le moteur de conversion de la Phase 5 — le chemin `image partagée → E15 → E01` étant la principale source d'utilisateurs nouveaux une fois le social ouvert.

---

## 10. Accessibilité

- Contraste AA sur tout texte ; AAA visé sur le texte courant.
- L'état n'est jamais porté par la seule couleur : les formes de §3 sont la source primaire.
- Cibles ≥ 44 px, y compris quand la densité est maximale — c'est la contrainte qui gouverne la disposition, pas l'inverse.
- Focus visible, distinct du survol, sur tous les éléments actionnables.
- Le gradient d'époque reste distinguable en vision déutéranope : la variation de **clarté** entre accents voisins est d'au moins 12 %, ce qui maintient la lecture même sans discrimination de teinte.
