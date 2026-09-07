# E14 — Passe temporelle assistée

**Type** : page plein écran (mode focalisé) · **Phase** : 4 · **Route** : `/import/:source/dates`

## Objectif

Transformer une bibliothèque importée en **histoire datée**. C'est l'écran qui rattrape la faiblesse structurelle des imports : les sources donnent le « quoi », rarement le « quand » ([PHASING.md](../PHASING.md) §7).

Sans cet écran, l'import produit une liste — pas ce que le produit promet.

## Contenu

Même grammaire d'interaction que E02, appliquée au temps plutôt qu'aux états : **traiter beaucoup, vite**.

```
┌──────────────────────────────────────────────────────────────┐
│  Quand y avez-vous joué ?                     124 restants   │
├──────────────────────────────────────────────────────────────┤
│   90s      2000-05    2006-10    2011-15    2016+   ? sais pas│
│  ┌─────┐  ┌───────┐  ┌───────┐  ┌───────┐  ┌─────┐  ┌───────┐│
│  │     │  │       │  │  ▣▣▣  │  │  ▣▣   │  │ ▣   │  │       ││
│  └─────┘  └───────┘  └───────┘  └───────┘  └─────┘  └───────┘│
├──────────────────────────────────────────────────────────────┤
│  À placer :                                                  │
│  [ Half-Life 2 ]  [ Portal ]  [ Braid ]  [ Limbo ]  …        │
│                                                              │
│  ⓘ 38 jeux ont été datés grâce à vos succès. À vérifier ?    │
└──────────────────────────────────────────────────────────────┘
```

- **Des bandes de périodes**, pas des dates. La granularité attendue est la tranche de quelques années.
- **Placement en lot** : sélection multiple puis dépôt sur une bande. Le coût par jeu doit rester proche de celui de E02.
- **« Je ne sais plus » est une bande comme les autres** : elle produit des moments `Unknown`, qui restent valides et affichables (principe 6).
- **Les dates déduites sont pré-placées et signalées.** Le premier succès débloqué sur un titre est un bon proxy de « quand j'y ai joué » (Steam, RetroAchievements) : il est enregistré en granularité mois ou année avec une `Confidence` réduite, jamais comme une date exacte. L'utilisateur confirme ou déplace.

## Actions

Placer un lot sur une bande · Déplacer un jeu déjà placé · Confirmer une déduction · Passer un jeu · **Interrompre et reprendre plus tard** — la liste peut être longue, et la sortie doit être sans perte.

## États

- **Restants** : compteur permanent, ordonné par notoriété pour que les titres marquants soient traités en premier.
- **Terminé** : bascule vers E03, où l'effet est immédiatement visible.
- **Abandonné en cours** : les jeux non placés restent sans date et rejoignent le tiroir « à une date inconnue » de la timeline. Rien n'est perdu, la tâche reste reprenable.

## Relations

**Entrant** : **E13, systématiquement** · E03 (tiroir des sans-date, « dater ces moments »). **Sortant** : E03.

Le couple **E13 → E14** est indissociable : c'est E14 qui produit la valeur, E13 n'étant que l'approvisionnement.

## Décisions de conception

**Reprendre la grammaire de E02.** L'utilisateur a déjà appris ce geste ; le réutiliser est un gain de conception et d'apprentissage.

**Les déductions sont proposées, jamais imposées.** Écrire des dates inférées sans validation contredirait §7.4 et introduirait une fausse précision dans un produit dont l'argument est l'honnêteté temporelle.

**L'abandon est un état normal.** Une bibliothèque Steam de 400 titres ne se date pas en une session. L'écran doit être conçu pour des passages courts et répétés.

## Pièges

- Demander une date exacte : hors sujet, et impossible pour la plupart des titres.
- Bloquer l'accès à la timeline tant que la passe n'est pas finie : la récompense doit rester accessible en permanence.
- Traiter les 400 titres dans un ordre arbitraire : la notoriété et le temps de jeu importé donnent un bien meilleur ordre.
