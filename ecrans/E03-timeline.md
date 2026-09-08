# E03 — Timeline

**Type** : page · **Phase** : 1 · **Route** : `/mon-histoire` (Phase 1) puis `/timeline` (Phase 3)

> **En Phase 1, E03 et E04 sont un seul écran.** Le profil (E04) est encore maigre — quelques chiffres seulement — et la navigation se réduirait à trois entrées dont un mode. `/mon-histoire` présente donc une **synthèse condensée en tête** (la phrase, deux ou trois chiffres) suivie de la timeline. Un écran fort plutôt que deux faibles, et une décision de navigation en moins pour l'utilisateur.
>
> La séparation intervient en Phase 3, quand le profil a de la matière (statistiques, collection, goûts). Les deux fiches restent distinctes ici parce qu'elles décrivent deux intentions de lecture différentes — mais elles se livrent ensemble.

## Objectif

Restituer le parcours **comme une histoire**, avec son incertitude assumée. C'est la contrepartie de l'effort de saisie : ce que l'utilisateur vient voir, et revient voir (KPI « % utilisateurs revenant voir leur timeline », §22.1).

## Contenu

```
┌──────────────────────────────────────────────────────────────┐
│  Ma timeline            [ 1990 ─────────────── 2026 ]  ⚙     │  A
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1991  ● Game Boy — première console            ✎           │
│        │                                                     │  B
│  1993  ●━━━━━━━━━━━━━━━━━━━━━━━━━●  1997                    │
│        │  Super Nintendo · 12 jeux, 4 terminés               │
│        │                                                     │
│  1995  ○ Découverte de la PlayStation      « vers 1995 »     │
│        │                                                     │
│  1998  ● Final Fantasy VII terminé                🗨         │  C
│        │   « Fini un dimanche de novembre, chez mon frère. » │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  ▸ 7 moments à une date inconnue                             │  D
└──────────────────────────────────────────────────────────────┘
```

**A — Échelle temporelle.** Zoom décennie / année. Au niveau décennie, les moments se regroupent en périodes ; au niveau année, ils se détaillent. Le regroupement est indispensable : un parcours de 30 ans compte des centaines de moments.

**B — L'axe.** Rendu strictement conforme au principe 2 : point plein pour une date exacte, point creux pour une année, **bande** pour une période, halo pour un « vers ». Une déclaration en masse depuis E02 apparaît comme **une bande agrégée**, pas comme 12 points identiques — sans quoi la timeline devient illisible dès la première session.

**B bis — Les préférés.** Un jeu marqué « mon préféré » (§4.7) porte un cœur plein sur sa vignette et son titre passe en serif italique. La typographie fait le travail, pas un badge : le préféré se remarque sans crier.

**C — Les souvenirs.** Une note attachée à un moment (§9) s'affiche en ligne, en typographie distincte. C'est le seul contenu de la timeline qui ne soit pas généré : il doit dominer visuellement les éléments automatiques.

**D — Les sans-date.** `Unknown` n'est jamais projeté sur l'axe. Ces moments vivent dans un tiroir en pied de page, avec une invitation à les dater — une tâche facile et gratifiante à proposer aux sessions de retour.

## Mobile et desktop

La timeline est **verticale dans les deux cas**. C'est le sens de lecture naturel, celui du défilement, et les timelines horizontales sont notoirement pénibles à parcourir sur une longue durée. Ce qui change est la navigation dans le temps :

| | Mobile | Desktop |
|---|---|---|
| Axe | vertical, une colonne, défilement continu | vertical, colonne centrale limitée à 720 px |
| Navigation temporelle | en-tête compact avec la décennie courante, qui se met à jour au défilement | **rail de décennies fixe à gauche**, coloré par époque, cliquable |
| Moments groupés | dépliage au tap | dépliage au clic, aperçu des jaquettes au survol |
| E07 | feuille remontante | panneau latéral, la timeline reste lisible à côté |

Le rail de décennies desktop est plus qu'un raccourci : coloré selon le système d'époques ([langage visuel](./00-langage-visuel.md) §2), il donne d'un coup d'œil la **forme de toute une vie de jeu** — les années denses, les trous, les retours. C'est un des endroits où le produit se montre le mieux.

## Actions

| Action | Résultat |
|---|---|
| Clic sur un moment | ouvre **E07** en panneau, sans quitter la timeline |
| `✎` sur un moment | E07 en mode édition (corriger la date, l'état) |
| `🗨` | ajouter ou éditer un souvenir (E07, onglet souvenir) |
| Clic sur une bande agrégée | déplie les jeux qu'elle contient |
| Clic sur un jeu | → E05 |
| Zone vide d'une période | → E02 préfiltré sur cette période, « compléter ces années » |
| Tiroir sans-date | dater en lot |

## États

- **Vide** : ne doit quasiment jamais survenir (E01 crée un premier moment). Si c'est le cas : un axe avec une seule invitation, « Racontez votre première console ».
- **Partiel** : état nominal — trous, périodes floues, moments sans date. La timeline doit rester **belle** avec trois moments, pas seulement avec trois cents.
- **Dense** : agrégation automatique, jamais de superposition illisible.

## Relations

- **Entrant** : navigation principale · E01 (premier résultat) · E02 (« voir ma timeline ») · E04 (timeline condensée → complète).
- **Sortant** : → E07 (panneau, sans navigation) · → E05 · → E02 (compléter une période) · → E04.

La relation **E03 ⇄ E07** est volontairement un panneau et non une page : dater ou annoter est un geste secondaire qui ne doit jamais faire perdre le fil de lecture.

## Décisions de conception

**La timeline est un écran de lecture, pas un tableau de bord.** Les chiffres appartiennent à E04 et E10. Ici, l'unité est le moment.

**L'agrégation est une décision de modèle autant que de rendu.** Douze jeux déclarés d'un coup pour 1993–1997 forment un épisode, pas douze événements indépendants — la timeline reflète l'intention de saisie, pas la granularité de stockage.

**Les trous sont des invitations.** Une décennie vide n'est pas un défaut d'affichage : c'est l'endroit exact où proposer E02. C'est le mécanisme de relance le plus naturel du produit, et il ne coûte aucune notification.

## Pièges

- Trier les `Range` par leur borne de début : deux périodes qui se chevauchent n'ont pas d'ordre strict (§7.5), le rendu doit assumer le chevauchement plutôt que l'aplatir.
- Afficher `Age` non résolu : sans année de naissance, il se comporte comme `Unknown` (§7.6).
- Transformer la timeline en flux d'activité (« vous avez ajouté 3 jeux ») : ce serait afficher `RecordedAt` au lieu de `OccurredAt` (§5.2) — l'histoire du logiciel, pas celle du joueur.
