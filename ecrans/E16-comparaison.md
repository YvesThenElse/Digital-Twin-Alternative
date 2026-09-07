# E16 — Comparaison de deux profils

**Type** : page · **Phase** : 5 · **Route** : `/u/:handle/comparer`

## Objectif

Répondre à « qu'avons-nous en commun ? » sur les exemples de §13.2 : *« Yves et Marc ont joué à 127 jeux en commun »*, *« vous avez tous les deux possédé une Super Nintendo, mais seulement 34 % de vos bibliothèques étaient communes »*.

## Contenu

```
┌──────────────────────────────────────────────────────────────┐
│   Vous          ⟷          Marc                              │
├──────────────────────────────────────────────────────────────┤
│   127 jeux en commun · 6 plateformes partagées               │
├──────────────────────────────────────────────────────────────┤
│   VOS ÉPOQUES COMMUNES                                       │
│   ▓▓▓▓▓░░░░▓▓▓▓▓▓▓░░░  1993–1999 · 2008–2012                │
├──────────────────────────────────────────────────────────────┤
│   EN COMMUN          VOUS SEUL         LUI SEUL              │
│   Zelda ALTTP        Chrono Trigger    Deus Ex               │
│   Final Fantasy VII  Suikoden          Thief                 │
├──────────────────────────────────────────────────────────────┤
│   Il a terminé Prey, que vous n'avez pas encore ajouté.      │
└──────────────────────────────────────────────────────────────┘
```

- **Trois colonnes** : commun, moi seul, lui seul. Les divergences sont aussi intéressantes que les recoupements — c'est là que naît la découverte.
- **Époques communes** : la dimension temporelle est le différenciateur du produit (§2.3) ; deux joueurs ayant fait les mêmes jeux à dix ans d'écart n'ont pas la même histoire, et la comparaison doit le montrer.
- **Une amorce de découverte** en pied de page, formulée sans assertion (§14.2).

## Compatibilité : à afficher seulement si la formule est assumée

§13.3 prévoit un score de compatibilité. Une similarité brute (jeux communs / jeux totaux) serait dominée par les grands succès que tout le monde a joués, donc peu informative. La pondération par **rareté** (les titres peu partagés valent davantage) et par **époque** donne un résultat nettement plus parlant.

Tant que la formule n'est pas tranchée, afficher les faits (127 jeux, 6 plateformes) et **pas de pourcentage**. Un score mal fondé décrédibilise l'ensemble de l'écran.

## Actions

Voir un jeu → E05 · Ajouter à mon backlog → E09 · Déclarer que j'y ai joué → E07 · Voir son profil → E15.

## États

- **Peu de recoupement** : c'est un résultat, pas un échec — le présenter comme une divergence intéressante plutôt que comme un vide.
- **Profil partiellement privé** : comparer uniquement sur les blocs autorisés des deux côtés, et le dire.
- **Visiteur sans profil** : proposer E01, la comparaison n'ayant pas de sens à sens unique.

## Relations

**Entrant** : E15 · E17. **Sortant** : E05 · E09 · E15.

## Pièges

- Transformer la comparaison en classement (« vous avez joué à plus de jeux que lui ») : le produit est une biographie, pas une compétition. C'est le glissement le plus probable de cet écran, et le plus dommageable.
- Comparer sans tenir compte des époques : perdre précisément ce qui distingue le produit.
- Afficher un pourcentage de compatibilité sans formule assumée.
