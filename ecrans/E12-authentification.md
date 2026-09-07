# E12 — Authentification

**Type** : page ou panneau · **Phase** : 3 · **Routes** : `/connexion`, `/inscription`

## Objectif

Créer un compte **le plus tard possible**, au moment où l'utilisateur a quelque chose à perdre.

## Décision structurante : le déclencheur, pas l'écran

L'important n'est pas la forme de cet écran — un formulaire d'inscription est un problème résolu — mais **le moment où il apparaît**.

Il ne s'affiche jamais en ouverture. Il se déclenche quand la valeur existe déjà :

| Déclencheur | Message |
|---|---|
| Fin d'une session de saisie nourrie (E02) | « Vous avez reconstitué 34 jeux. Créez un compte pour les garder. » |
| Tentative de partage (E11 / E15) | « Un compte est nécessaire pour publier votre profil. » |
| Retour sur un autre appareil | « Retrouvez votre historique. » |

Le premier déclencheur est le bon : l'utilisateur vient de produire quelque chose, la proposition est de le **conserver**, pas d'obtenir un droit d'entrée.

## Contenu

- Inscription : e-mail et mot de passe, ou fournisseur tiers. Rien d'autre — pas de pseudo, pas d'année de naissance, pas de préférences. Tout le reste se règle plus tard (E11).
- Connexion, réinitialisation de mot de passe.
- Mention explicite de ce qu'il advient de la saisie en cours : **elle est rattachée au compte**, jamais perdue.

## États

- **Saisie anonyme en attente** : l'écran doit dire combien de moments seront conservés. C'est l'argument, il doit être chiffré.
- **Échec** : ne jamais perdre la saisie locale, quelle que soit l'erreur.

## Relations

**Entrant** : E02 (déclencheur principal) · E11 · E15. **Sortant** : retour exact au contexte d'origine — jamais vers un écran d'accueil générique, qui ferait perdre le fil.

## Pièges

- Placer l'inscription avant E01 : demander un effort avant d'avoir rien donné, contraire au principe 1.
- Perdre la saisie anonyme à l'inscription : la faute la plus grave possible dans ce produit.
- Collecter à l'inscription des données qui peuvent attendre.
