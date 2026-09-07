# E11 — Paramètres & visibilité

**Type** : page à sections · **Phase** : 3 · **Route** : `/parametres`

## Objectif

Donner un contrôle **granulaire** sur ce qui est exposé, et rendre visibles les obligations de conformité (§19.3).

## Contenu

### Visibilité — la section principale

Le binaire privé/public est insuffisant pour un objet aussi personnel (§12.1). Chaque bloc se règle séparément :

```
┌──────────────────────────────────────────────────────────────┐
│  Qui peut voir…                Personne  Avec le lien  Tous  │
│  Ma timeline                       ○          ●          ○   │
│  Ma collection actuelle            ○          ○          ●   │
│  Ma collection historique          ●          ○          ○   │
│  Mes statistiques                  ○          ○          ●   │
│  Mes souvenirs                     ●          ○          ○   │
│  Ma wishlist / mon backlog         ●          ○          ○   │
├──────────────────────────────────────────────────────────────┤
│  ⓘ Vos dates permettent de déduire votre année de naissance. │
│    [ Masquer les âges sur le profil public ]                 │
├──────────────────────────────────────────────────────────────┤
│         [ Prévisualiser mon profil public → ]                │
└──────────────────────────────────────────────────────────────┘
```

**L'avertissement d'inférence est obligatoire** (§12.3) : afficher « première console à 8 ans, en 1991 » revient à publier une date de naissance. L'utilisateur doit l'apprendre ici, pas après coup.

**La prévisualisation est l'action de sortie.** Voir exactement ce que verra un tiers (E15) est la seule façon de vérifier ses réglages.

### Autres sections

- **Compte** : identité, année de naissance (facultative, avec son usage expliqué — elle ne sert qu'à résoudre « vers mes 12 ans », §7.6).
- **Données** : export complet (portabilité), **suppression du compte** (droit à l'effacement, §19.4). Ces deux entrées sont des obligations, pas des options : elles doivent être trouvables, pas enfouies.
- **Sources connectées** : comptes tiers liés (Phase 4), avec déconnexion et suppression des données importées.
- **Affichage** : langue, thème.

## Actions

Régler un bloc → effet immédiat, sans validation globale · Prévisualiser → E15 · Exporter · Supprimer le compte (confirmation explicite, effet réel et non un simple marqueur).

## États

- **Par défaut** : **tout est privé**. L'ouverture est un geste délibéré, jamais un réglage initial.
- **Non authentifié** : l'écran n'existe pas ; les réglages apparaissent avec le compte (E12).

## Relations

**Entrant** : menu du compte · E04 (« partager »). **Sortant** : E15 (prévisualisation) · E13 (sources).

## Pièges

- Un interrupteur global unique : contredit §12.
- Enterrer l'export et la suppression : ce sont des droits, ils se trouvent.
- Indexer les pages publiques par défaut : l'URL doit être non devinable et non indexable tant que l'utilisateur ne l'a pas décidé (§12.3).
