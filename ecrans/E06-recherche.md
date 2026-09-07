# E06 — Recherche

**Type** : surcouche accessible depuis tout écran · **Phase** : 1 · **Route** : `/recherche?q=` (état profond ; la surcouche reste le mode normal)

## Objectif

Atteindre n'importe quelle entité du référentiel — jeu, plateforme, studio — en une frappe et une sélection, depuis n'importe où.

## Contenu

```
┌──────────────────────────────────────────────────────────────┐
│  🔍  zeld|                                              ✕    │
├──────────────────────────────────────────────────────────────┤
│  JEUX                                                        │
│  The Legend of Zelda: A Link to the Past   SNES · 1991  [J✓] │
│  The Legend of Zelda: Ocarina of Time      N64 · 1998        │
│  Zelda II: The Adventure of Link           NES · 1987        │
├──────────────────────────────────────────────────────────────┤
│  FRANCHISES                                                  │
│  The Legend of Zelda — 8 des 12 jeux déclarés                │
├──────────────────────────────────────────────────────────────┤
│  ✎  Déclarer « zeld » comme titre non répertorié             │
└──────────────────────────────────────────────────────────────┘
```

- **Résultats groupés par type**, jeux d'abord — c'est la recherche dominante.
- **L'état personnel est affiché sur chaque résultat** (`[J✓]`) : l'utilisateur voit immédiatement s'il a déjà déclaré ce jeu, ce qui évite les doublons et les allers-retours.
- **La dernière ligne est toujours l'issue de secours** : déclarer un titre libre (§3.5). Elle reste présente même quand il y a des résultats, car le bon jeu peut manquer au milieu de dix mauvais.

## Actions

| Action | Résultat |
|---|---|
| Frappe | résultats en direct, sans validation |
| Flèches et entrée | navigation clavier complète |
| Sélection d'un résultat | vers E05 |
| Bascule directe depuis un résultat | déclaration sans quitter la recherche |
| Dernière ligne | crée une déclaration non résolue, puis E07 |

## États

- **Vide (champ non rempli)** : afficher les entités récemment consultées et les plateformes de l'utilisateur — jamais un champ nu.
- **Aucun résultat** : l'issue de secours devient l'action principale, accompagnée d'une phrase expliquant le périmètre du référentiel.
- **Chargement** : les résultats précédents restent affichés en grisé, sans saut de mise en page.

## Relations

- **Entrant** : tout écran (raccourci permanent, touche dédiée au clavier).
- **Sortant** : vers E05 (majoritaire) · vers E07 (déclaration libre) · vers E02 (résultat de type plateforme, « déclarer en masse »).

La recherche est un **connecteur, pas une destination** : elle n'a pas de contenu propre et reconduit toujours vers une fiche ou une déclaration.

## Décisions de conception

**Surcouche plutôt que page.** Chercher est une interruption, pas une étape : quitter son écran pour chercher puis devoir y revenir coûte deux navigations inutiles.

**La déclaration est possible depuis les résultats.** Pour un utilisateur qui se souvient d'un titre précis, c'est le chemin le plus court de la mémoire à la donnée — plus court que E02, qui sert la reconnaissance et non le rappel.

**Tolérance orthographique obligatoire.** Le domaine est multilingue par nature (§20, §23.1) : `Pokemon`, `Pokémon`, `Pokémon Rouge` et `ポケモン` doivent converger. Sans cela, l'issue de secours se déclenche à tort et pollue le référentiel de doublons non résolus.

## Pièges

- Exiger une validation avant d'afficher des résultats : brise le budget d'une frappe.
- Masquer l'issue de secours dès qu'il y a des résultats.
- Classer par pertinence textuelle seule : il faut pondérer par notoriété (§3.3), sinon un titre obscur passe devant l'évidence.
