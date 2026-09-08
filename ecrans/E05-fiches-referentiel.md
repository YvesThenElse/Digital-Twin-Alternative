# E05 — Fiches du référentiel (jeu · plateforme · studio)

**Type** : page, trois variantes d'une même structure · **Phase** : 1 · **Routes** : `/jeu/:slug`, `/plateforme/:slug`, `/studio/:slug`

## Objectif

Servir deux fonctions dans un seul écran : **consulter** le référentiel et **déclarer** son expérience en contexte. La navigation relationnelle exigée par §3.2 (console → jeux → studio → autres jeux) passe entièrement par ces fiches.

## Structure commune

Toute fiche se lit en deux couches superposées, dans cet ordre :

1. **Couche personnelle** — ce que *j'ai* vécu avec cette entité. En haut, toujours.
2. **Couche référentiel** — les faits. En dessous.

Cet ordre est délibéré : le produit est une biographie, pas une encyclopédie. Une fiche qui ouvre sur la fiche technique aurait inversé la proposition de valeur.

## Variante A — Fiche jeu

```
┌──────────────────────────────────────────────────────────────┐
│  Final Fantasy VII                                           │
│  Squaresoft · 1997 · PlayStation                             │
├──────────────────────────────────────────────────────────────┤
│  VOUS                                                        │  1
│  [ Joué ✓ ] [ Terminé ✓ ] [ Possédé ✓ ]                     │
│  1997  ● découvert                                           │
│  1998  ● terminé      🗨 « Fini un dimanche… »              │
│  2001  ● vendu                                               │
│  2025  ● racheté                                             │
│                                    [ + ajouter un moment ]   │
├──────────────────────────────────────────────────────────────┤
│  VOS EXEMPLAIRES                                             │  2
│  PlayStation PAL · Platinum      1997–2001                   │
│  PS3 numérique                   2012–                       │
├──────────────────────────────────────────────────────────────┤
│  ÉDITIONS CONNUES                                            │  3
│  PS1 JP · PS1 PAL · Platinum · PC 1998 · PS3 · PS4 · Switch  │
├──────────────────────────────────────────────────────────────┤
│  ŒUVRES LIÉES                                                │  4
│  Final Fantasy VII Remake (2020) · série Final Fantasy       │
└──────────────────────────────────────────────────────────────┘
```

**1 — Votre historique.** Les trois bascules de E02, plus la liste des moments datés. Déclarer se fait ici, sans changer d'écran.

**2 — Vos exemplaires.** La granularité de §6.1 : le même titre possédé plusieurs fois, sur plusieurs supports, à plusieurs époques. C'est ce que ne font pas les produits concurrents (§2.3) — la fiche doit le montrer clairement.

**3 — Éditions connues.** Non possédées : elles servent la navigation et la déclaration (« c'était celle-là »).

**4 — Œuvres liées.** Remake, remaster, suites, série. Un remake est une œuvre **liée, pas identique** (§6.3) — le lien doit être nommé, pas implicite.

### Ce que la fiche ne contient pas, et ce qu'elle contient à la place

**Aucun synopsis.** Décrire n'est pas le métier de la plateforme, recopier une base tierce est illicite (§19.1), et le coût de curation est déjà le poste le plus lourd du projet (§18.6). La fiche fait trois choses distinctes à la place (§3.6) :

**5 — Identifier**, juste sous l'en-tête. Noms régionaux, titres non latins, et **un fait qui situe** l'œuvre. La frontière est nette : « septième épisode, premier sur PlayStation » identifie, « Cloud, ancien SOLDAT… » décrit. Cette donnée n'est pas un ajout : la canonicalisation l'exige déjà (`Alias`, `Locale`, §18.4).

**6 — Renvoyer** *(Phase 3)*, en bas de fiche. Deux ou trois sources spécialisées, avec l'**identifiant stocké** et non une URL devinée. Position basse et aspect de référence : un lien sortant est un lecteur qui part. Et surtout : ces liens vivent **sur la fiche**, pas sur une page séparée — scinder l'entité casserait la navigation relationnelle de §3.2 et produirait une page que personne ne visiterait.

**7 — Ce que d'autres en ont fait** *(Phase 5)*. Combien de joueurs ont déclaré ce titre, combien en ont fait leur préféré, quelques souvenirs publics. C'est la seule matière descriptive que la plateforme puisse **posséder plutôt qu'emprunter**, et la seule qui rende la fiche utile à quelqu'un qui ne connaît pas le jeu.

> **Pourquoi ce besoin existe.** On objecte qu'un joueur qui déclare un titre sait de quoi il s'agit. C'est vrai de lui, au moment où il déclare. Mais un visiteur de profil partagé, le même joueur six mois plus tard, et surtout **le joueur qui suit une recommandation** arrivent sans connaître le jeu — et le dernier cas est décisif, puisqu'une recommandation existe par construction pour parler d'un titre inconnu.

## Variante B — Fiche plateforme

Structure identique, contenu adapté :

1. **Vous** : possédée de quand à quand, jeux déclarés sur cette plateforme, part de la ludothèque couverte.
2. **Ludothèque** : la liste triée par notoriété, avec l'état de chaque jeu → **entrée directe vers E02** (« déclarer en masse »).
3. **Référentiel** : constructeur, génération, dates de sortie par région, accessoires.

L'entrée vers E02 depuis cette fiche est un chemin majeur du produit : c'est la porte naturelle vers le geste central, pour un utilisateur déjà engagé.

## Variante C — Fiche studio

1. **Vous** : jeux de ce studio joués / terminés, période, « 6 jeux sur 14 ».
2. **Ludographie** : la liste, avec les états.
3. **Référentiel** : fondation, éditeur, franchises.

Cette variante alimente directement la recommandation de Phase 6 (« six jeux d'Arkane sans avoir joué à Prey », §14) — la surface d'affichage existe déjà, seule l'inférence est reportée.

## Actions

| Action | Résultat |
|---|---|
| Bascules J/T/P | déclaration immédiate, comme en E02 |
| `+ ajouter un moment` | → **E07** en panneau |
| Clic sur un moment | → E07 en édition |
| Clic sur une édition | précise l'exemplaire possédé |
| Clic sur une entité liée | → E05 (autre fiche) |
| « Déclarer en masse » (variante B) | → **E02** préfiltré |

## États

- **Vide** (aucune expérience déclarée) : la couche personnelle devient une invitation en une ligne — « Vous y avez joué ? » avec les trois bascules. Jamais un bloc vide.
- **Entité non canonique** (déclaration libre, §3.5) : fiche minimale, marquée « jeu non répertorié », avec la possibilité de la rattacher à une entité connue.
- **Partiel** : cas nominal.

## Relations

- **Entrant** : E06 recherche · E02 (détail d'une ligne) · E03 (clic sur un jeu) · E04 (genres, studios, franchises) · liens entre fiches.
- **Sortant** : → E05 (navigation relationnelle, sans profondeur limite) · → E02 (variante B) · → E07 · → E03.

Les fiches forment un **graphe, pas une hiérarchie** : on y entre par n'importe quel nœud et on en sort par n'importe quel lien. Le fil d'Ariane doit donc refléter le chemin réellement parcouru, pas une arborescence théorique.

## Décisions de conception

**Une structure, trois variantes.** Trois écrans distincts auraient triplé le coût de conception pour un bénéfice nul : les trois entités partagent la même question — « qu'est-ce que j'ai vécu avec ça, et qu'est-ce que c'est ».

**Le personnel avant le factuel.** Voir §Structure commune.

**Pas de bouton « ajouter à ma collection ».** Les bascules J/T/P sont l'ajout. Un bouton séparé introduirait un état intermédiaire inutile.

## Pièges

- Traiter le remake comme le jeu d'origine : casse la chaîne d'éditions de §6.1 et fausse les statistiques.
- Afficher les éditions sans région : deux `Release` PAL et NTSC ne sont pas interchangeables (§3.4).
- Faire de la fiche un cul-de-sac : elle doit toujours proposer une continuation (principe : aucun écran n'est un cul-de-sac).
