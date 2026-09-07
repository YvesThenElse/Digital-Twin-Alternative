# Écrans — inventaire et conception

Spécification des écrans de la plateforme, dérivée de [SPECIFICATION.md](../SPECIFICATION.md) et cadencée par [PHASING.md](../PHASING.md).

## Comment lire ce répertoire

| Fichier | Rôle |
|---|---|
| [00-principes-transverses.md](./00-principes-transverses.md) | Règles de **comportement** valables sur tous les écrans. À lire avant les fiches |
| [00-langage-visuel.md](./00-langage-visuel.md) | **À quoi ressemble le produit** : couleur, typographie, formes, grille, mouvement |
| [PLAN-DU-SITE.md](./PLAN-DU-SITE.md) | Arborescence et routes |
| [PARCOURS-ET-LIENS.md](./PARCOURS-ET-LIENS.md) | Graphe de navigation, chemins entrants et sortants, parcours types |
| `E01`…`E17` | Une fiche par écran : contenu, actions, états, relations, décisions de conception |

Chaque fiche suit la même structure : **Objectif → Contenu → Actions → États → Relations → Décisions de conception → Pièges**.

## Inventaire

| # | Écran | Type | Phase | Raison d'être |
|---|---|---|---|---|
| [E01](./E01-accueil-onboarding.md) | Accueil / Première session | Page | 1 | Produire un premier résultat en moins de deux minutes |
| [E02](./E02-selection-massive.md) | **Sélection massive** | Page plein écran | 1 | Le geste central du produit |
| [E03](./E03-timeline.md) | Timeline | Page | 1 | La restitution : l'histoire, pas la liste |
| [E04](./E04-profil.md) | Profil | Page | 1 fusionné, 3 autonome | Le moment « oui, ça me ressemble » |
| [E05](./E05-fiches-referentiel.md) | Fiches référentiel (jeu / plateforme / studio) | Page, 3 variantes | 1 | Navigation relationnelle et déclaration en contexte |
| [E06](./E06-recherche.md) | Recherche | Surcouche | 1 | Atteindre n'importe quelle entité en une frappe |
| [E07](./E07-editeur-evenement.md) | Éditeur d'événement / souvenir | Panneau | 1 | Dater, corriger, raconter sans quitter le contexte |
| [E08](./E08-collection.md) | Collection | Page | 3 | Ce que je possède — et ce que je possédais |
| [E09](./E09-backlog-wishlist.md) | Backlog & Wishlist | Page | 3 | Intentions : jouer d'un côté, posséder de l'autre |
| [E10](./E10-statistiques.md) | Statistiques | Page | 3 | L'analyse, séparée de la narration |
| [E11](./E11-parametres-visibilite.md) | Paramètres & visibilité | Page | 3 | Contrôle granulaire de ce qui est exposé |
| [E12](./E12-authentification.md) | Authentification | Page | 3 | Le plus tard possible dans le parcours |
| [E13](./E13-import.md) | Import d'une source | Page | 4 | Récupérer la bibliothèque |
| [E14](./E14-passe-temporelle.md) | Passe temporelle assistée | Page plein écran | 4 | Transformer une bibliothèque importée en histoire datée |
| [E15](./E15-profil-public.md) | Profil public | Page | 5 | Ce que voient les autres |
| [E16](./E16-comparaison.md) | Comparaison de profils | Page | 5 | Points communs et divergences |
| [E17](./E17-decouverte.md) | Découverte & joueurs suivis | Page | 5 | Le social, en périphérie |

**Phase 1 : 7 écrans.** C'est délibéré — le POC doit répondre à une seule question ([PHASING.md](../PHASING.md) §4), et chaque écran supplémentaire est une occasion de diluer la réponse.

La Phase 6 (recommandation) n'ajoute **aucun écran** : elle s'installe comme surfaces à l'intérieur de E03, E04 et E09. Une page « Recommandations » isolée serait consultée une fois puis oubliée ; une suggestion posée au bon endroit du parcours est agie.

## Cinq décisions structurantes

**1. « Ajouter » est une action, pas une destination.**
La navigation tient en trois destinations (`Timeline · Collection · Profil`) plus un **bouton d'action distinct** pour la saisie, et la recherche toujours accessible. En Phase 1, c'est encore plus resserré : une seule destination (`/mon-histoire`) et l'action. Deux destinations ne justifient pas une barre d'onglets.

**2. En Phase 1, la timeline et le profil sont un seul écran.**
Le profil de Phase 1 est trop maigre pour être une destination : le séparer donnerait deux écrans faibles au lieu d'un fort. `/mon-histoire` porte la synthèse en tête et la timeline dessous. La séparation arrive en Phase 3.

**3. Aucun écran n'est un cul-de-sac.**
Tout écran propose au minimum une continuation vers la déclaration (E02/E07) ou vers la restitution (E03/E04). Un utilisateur ne doit jamais arriver à un endroit où la seule action possible est le retour arrière.

**4. La déclaration est partout, jamais dans un écran dédié.**
Il n'existe pas d'écran « ajouter un jeu ». Déclarer se fait en masse (E02), en contexte (E05), ou depuis la timeline (E07). Un formulaire d'ajout unitaire serait le chemin le plus lent vers l'objectif central du produit.

**5. Mobile et desktop sont deux stratégies de lecture, pas une disposition étirée.**
Liste dense à une colonne sur téléphone, grille visuelle ou deux panneaux sur écran large. Même modèle, même séquence, même geste primaire — affordances adaptées au dispositif de pointage. Détail dans le [langage visuel](./00-langage-visuel.md) §6.
