# Principes transverses

Règles applicables à tous les écrans. Elles priment sur les fiches individuelles : une fiche qui les contredirait est en erreur.

Le pendant visuel de ce document est le [langage visuel](./00-langage-visuel.md), qui décrit à quoi ressemble le produit — couleur, typographie, formes, mouvement. Les deux se lisent ensemble.

## 1. Récompenser avant de demander

L'utilisateur ne fournira l'effort de saisie que s'il en perçoit le bénéfice **pendant** la saisie, pas à la fin ([SPECIFICATION.md](../SPECIFICATION.md) §24.4).

Conséquences applicables partout :
- **jamais de formulaire long avant le premier retour visible** ;
- tout écran de saisie affiche en permanence l'effet de la saisie (compteur, timeline qui se remplit, phrase qui se construit) ;
- le premier résultat lisible arrive **avant** la création de compte (E12), pas après.

## 2. L'incertitude s'affiche, elle ne se masque pas

Sept granularités temporelles coexistent (§7.3). Leur rendu est normalisé une fois pour toutes :

| Valeur | Rendu | Libellé |
|---|---|---|
| `ExactDate` | point plein | `15 mars 1994` |
| `Month` | point | `mars 1994` |
| `Year` | point creux | `1994` |
| `Range` | bande | `1993–1997` |
| `ApproximateYear` | point creux + halo | `vers 1994` |
| `Age` | comme la valeur résolue, en italique | `vers mes 12 ans` |
| `Unknown` | **hors de l'axe** | regroupé dans « à une date inconnue » |

Trois interdits :
- ne jamais afficher un souvenir vague comme une date précise ;
- ne jamais projeter `Unknown` sur l'axe à une position arbitraire ;
- ne jamais afficher un chiffre exact dérivé d'une donnée floue sans le marquer (`≈ 32 ans de jeu`).

**La confiance ne se demande pas, elle se déduit.** `Confidence` est dérivé de la granularité choisie — date exacte ou mois → haute, année → moyenne, période ou « vers » → basse, inconnu → nulle. Demander à quelqu'un de noter la fiabilité de son propre souvenir ajoute une décision à chaque saisie pour une information que le choix de granularité donne déjà.

**Le modèle a sept variantes, l'interface en montre trois.** Exposer l'énumération complète de `TemporalValue` reviendrait à faire remonter le modèle dans l'écran (principe 9). L'année, « plutôt une période » et « je ne sais plus » couvrent la quasi-totalité des cas ; le reste vit dans un repli (cf. [E07](./E07-editeur-evenement.md)).

## 3. Une seule densité d'information par écran

Chaque écran a **un** niveau de lecture dominant :

| Écran | Densité | Ce qu'on y fait |
|---|---|---|
| E02 sélection massive | très dense | traiter beaucoup, vite |
| E03 timeline | moyenne | parcourir, se souvenir |
| E04 profil | faible | contempler |

Mélanger les densités est la faute la plus coûteuse : un profil aussi dense qu'une grille de saisie ne produit pas l'effet « ça me ressemble », et une grille de saisie aérée double le temps de reconstruction.

**La densité vient du nombre d'éléments visibles, jamais de la compression des cibles.** Ce point lève la tension avec le principe 8 : un écran « très dense » affiche beaucoup de lignes ou de tuiles, chacune restant une cible confortable. Il n'empile pas trois petits contrôles par ligne. Le tableau de densité par point de rupture ([langage visuel](./00-langage-visuel.md) §6) fait foi en cas de doute.

## 4. Budget d'interaction

Cibles mesurables, à vérifier en Phase 2 :

| Action | Budget |
|---|---|
| Déclarer un jeu en sélection massive | **1 clic / 1 tap** |
| Atteindre n'importe quel écran principal | ≤ 2 niveaux depuis l'accueil |
| Atteindre une fiche depuis la recherche | 1 frappe + 1 sélection |
| Ajouter un souvenir à un événement existant | ≤ 2 clics depuis la timeline |
| Première session jusqu'à une timeline lisible | **< 2 minutes** |

Ces budgets ne sont pas indicatifs : ce sont les seuils qui décident si la thèse du produit tient (§22.2).

## 5. États obligatoires

Tout écran spécifie ses quatre états. L'état vide est le plus important — c'est celui que voit un nouvel utilisateur, c'est-à-dire tout le monde à la Phase 2.

- **Vide** : jamais une page blanche. Toujours une amorce d'action et une explication en une phrase.
- **Partiel** : la donnée est incomplète ou floue — c'est l'état **normal** de ce produit, pas une dégradation.
- **Chargement** : squelette de la structure attendue, jamais un spinner centré.
- **Erreur** : ce qui a échoué, ce qui est conservé, quoi faire.

## 6. Rien n'est bloquant

Une saisie approximative acceptée vaut mieux qu'une saisie exacte abandonnée (§5.4).

- Les incohérences (terminé avant découvert) produisent un **avertissement doux**, jamais un refus.
- Les combinaisons inhabituelles mais légitimes (joué après avoir vendu : emprunt, émulation, réachat) ne produisent **rien du tout**.
- Aucun champ de date n'est obligatoire. `Unknown` est une réponse valide partout.

## 6 bis. Le silence et le refus ne sont pas la même chose

Trois déclarations existent uniquement pour distinguer un avis d'une absence d'avis :

- **« jamais joué »** — il ne l'a pas joué, contre « il ne s'est pas prononcé » (§24.3) ;
- **« sans plus »** — ça ne lui a rien laissé, contre « il n'a rien dit » (§4.5) ;
- **`Unknown`** — il ne sait pas, contre « on ne lui a pas demandé » (§7.3).

Dans les trois cas, la déclaration négative est **positive dans le modèle** : elle vaut information, améliore la qualité du profil et conditionne la pertinence des recommandations (§14.2). L'interface ne doit donc jamais présenter ces choix comme un abandon ou un échec.

## 7. Le jeu absent est un cas nominal

Avec un référentiel de 100 à 300 titres en Phase 1, ne pas trouver un jeu est fréquent, pas exceptionnel (§3.5). Chaque écran de recherche ou de sélection propose donc une issue : saisir un titre libre, qui devient une déclaration non résolue, rattachable plus tard sans perte d'historique.

Un utilisateur bloqué au premier titre manquant invalide le test utilisateur bien avant d'invalider le produit.

## 8. Mobile et desktop sont deux stratégies de lecture

Cocher rapidement une longue liste est un geste tactile, et un profil partagé se consulte majoritairement depuis un téléphone (§21.2). Les écrans sont donc conçus **en mobile d'abord**.

Mais l'écran large n'est pas la version étirée du téléphone. Sur 1440 px, une colonne unique gaspille les deux tiers du viewport et impose un balayage vertical là où l'œil pourrait embrasser d'un coup. La règle est donc :

| | Mobile | Desktop |
|---|---|---|
| Forme | **liste** dense à une colonne | **grille** visuelle, ou deux panneaux |
| Cible | la ligne entière | la tuile, plus les affinages au survol |
| Densité | par le nombre de lignes | par le nombre de tuiles simultanées |

Ce qui ne change **jamais** entre les deux : le modèle de données, la séquence des écrans, et le geste primaire. Ce qui change : la disposition et la richesse des affordances secondaires, le survol et le clavier rendant sur desktop des contrôles qui coûteraient trop cher au doigt.

Zones tactiles ≥ 44 px en toutes circonstances, actions primaires dans la zone du pouce, **aucune fonction accessible uniquement au survol**.

## 8 bis. Le hors-ligne protège la mécanique centrale

Se remémorer ses jeux d'enfance se fait dans un canapé, un train, une salle d'attente — pas nécessairement bien connecté. Une saisie qui persiste à chaque geste et dépend du réseau casse exactement là où on l'utilise.

- Écriture **locale d'abord**, file de synchronisation en arrière-plan.
- Aucun indicateur de chargement par geste : la bascule est instantanée et optimiste.
- L'état de synchronisation se signale **une fois**, discrètement, jamais par élément.
- Les données de référence de l'écran courant sont mises en cache à son ouverture.

Ce n'est pas un raffinement d'industrialisation : c'est ce qui protège la fonctionnalité qui porte le produit.

## 9. Vocabulaire visible

Termes techniques à ne jamais afficher : `PlayerEvent`, `TemporalValue`, `UserOwnedItem`, `Digital Twin`, `canonicalisation`, `Confidence`.

| Concept | Mot affiché |
|---|---|
| PlayerEvent | un moment |
| TemporalValue floue | « vers 1994 », « entre 1993 et 1997 » |
| UserGameExperience | joué / terminé |
| UserOwnedItem | possédé / j'ai eu |
| Déclaration non résolue | « jeu non répertorié » |
| Affect `Loved` / `Favourite` | « j'ai adoré » / « mon préféré » |
| Affect `Indifferent` | « sans plus » |
| Moment relatif à la sortie | « à sa sortie », « peu après », « bien plus tard » |

## 10. Accessibilité et internationalisation

- Contraste AA minimum ; l'information n'est jamais portée par la seule couleur. Chaque déclaration porte une **icône dessinée**, réunie en trois familles — ce qu'on a fait du jeu, où l'objet se trouvait, ce qu'il a laissé ([langage visuel](./00-langage-visuel.md) §3). Les icônes se reconnaissent ; des formes géométriques abstraites obligeaient à apprendre une correspondance, ce que le principe « aucune légende » interdit.
- La sélection massive est intégralement pilotable au clavier — c'est le mode le plus rapide sur ordinateur, et le budget d'un clic par jeu en dépend.
- Aucun libellé codé en dur dès la Phase 1, même si une seule langue est livrée (§20).
- Recherche insensible aux diacritiques et tolérante à la translittération : `Pokemon`, `Pokémon` et `ポケモン` doivent converger.
