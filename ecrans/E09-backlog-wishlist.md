# E09 — Backlog & Wishlist

**Type** : page à deux onglets · **Phase** : 3 · **Route** : `/backlog`, `/backlog/wishlist`

## Objectif

Séparer deux intentions que la spécification v1 confondait (§10.1) :

| Onglet | Question | Exemple |
|---|---|---|
| **À jouer** (backlog) | qu'est-ce que je veux **jouer** ? | possédé depuis trois ans, jamais lancé |
| **À avoir** (wishlist) | qu'est-ce que je veux **posséder** ? | racheter une PlayStation d'origine |

La séparation possession / expérience (§4.2) impose de séparer aussi les intentions. Un jeu possédé et non joué appartient au backlog, pas à la wishlist ; un jeu convoité et jamais acquis, l'inverse.

## Contenu

- **Deux onglets**, jamais deux écrans : l'utilisateur passe constamment de l'un à l'autre, et le même jeu peut basculer du second au premier le jour où il l'acquiert.
- Par élément : titre, plateforme, **priorité ou envie**, origine de l'intention (recommandation, cadeau, franchise suivie, nostalgie), date d'entrée dans la liste.
- **Alimentation automatique du backlog** : les jeux déclarés « possédé » sans « joué » y entrent d'office, avec un rappel discret. C'est la principale source d'alimentation et elle ne coûte aucune saisie.
- Tri par priorité, ancienneté ou plateforme.

## Actions

Déclarer joué → l'élément quitte le backlog, un moment est créé (E07) · Déclarer acquis → passe de la wishlist au backlog · Réordonner · Retirer.

## États

- **Vide** : proposer l'alimentation automatique (« 23 jeux que vous possédez sans y avoir joué — les ajouter ? ») plutôt qu'une liste à construire à la main.
- **Trop longue** : au-delà d'une centaine d'entrées, la liste devient décourageante. Proposer un regroupement par plateforme ou une mise en avant de trois éléments.

## Relations

**Entrant** : navigation secondaire · E04 · E05 (ajouter depuis une fiche) · **E17** (recommandations de Phase 6).

**Sortant** : E05 · E07.

Cet écran est la **cible naturelle des recommandations de Phase 6** (§10.3) : suggérer un jeu déjà présent dans le backlog est le cas le plus facile à rendre pertinent, et il ne demande aucune inférence risquée.

## Pièges

- Fusionner les deux listes « pour simplifier » : c'est retomber exactement dans la confusion que §10.1 corrige.
- Transformer le backlog en tâches avec échéances : c'est un loisir, pas un projet. Aucune notion de retard, aucun rappel culpabilisant.
