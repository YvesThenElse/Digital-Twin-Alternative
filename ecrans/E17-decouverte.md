# E17 — Découverte & joueurs suivis

**Type** : page · **Phase** : 5 · **Route** : `/decouvrir`

## Objectif

Donner accès aux profils suivis et à quelques suggestions de joueurs proches — **sans construire un réseau social**.

Le périmètre est volontairement petit ([PHASING.md](../PHASING.md) §8) : pas de forum, pas de fil d'actualité, pas de modération lourde. Le social doit enrichir la mémoire personnelle, pas la remplacer.

## Contenu

- **Joueurs suivis** : liste simple, avec ce qui rapproche (« 127 jeux en commun », « même première console »).
- **Suggestions** : quelques profils proches par époque, plateformes ou goûts. Une poignée, pas un annuaire.
- **Activité, en très petite dose** : « Marc a ajouté ses années Dreamcast ». Utile pour revenir, dangereux si cela devient un fil à consommer.

## Décision structurante : pas de fil d'actualité

Un fil transformerait le produit en réseau social et déplacerait la valeur de la mémoire personnelle vers la consommation d'activité — exactement le risque identifié en Phase 5 (« le social devient un second produit »).

L'activité est donc **une liste courte et bornée**, sans défilement infini, sans notifications d'engagement, sans compteurs de popularité.

## Cold start

À faible population, cet écran est vide et le restera un moment. Deux conséquences :

- il n'est **jamais** placé en navigation principale ;
- l'état vide propose du contenu utile plutôt qu'une attente : partager son propre profil (E15), ou explorer le référentiel (E05).

Aucune valeur individuelle du produit ne doit dépendre de cet écran.

## Actions

Voir un profil → E15 · Comparer → E16 · Suivre / ne plus suivre · Partager le mien → E11.

## États

- **Vide** : le cas nominal au lancement. Rediriger vers du contenu qui ne dépend pas des autres.
- **Peu de suivis** : privilégier la profondeur (ce qu'on a en commun) plutôt que le nombre.

## Relations

**Entrant** : navigation secondaire · E15 · E16. **Sortant** : E15 · E16 · E11.

## Pièges

- Défilement infini, notifications d'engagement, compteurs de popularité : tous font glisser le produit hors de son positionnement.
- Placer cet écran en navigation principale : il serait vide pour la quasi-totalité des utilisateurs pendant longtemps.
- Faire dépendre une fonctionnalité individuelle de la présence d'autres joueurs.
