# E04 — Profil

**Type** : page · **Phase** : 1 (fusionné) puis 3 (autonome) · **Route** : `/mon-histoire` puis `/profil`

> **En Phase 1, E04 n'est pas un écran séparé** : sa synthèse (la phrase, deux ou trois chiffres, la timeline condensée) forme l'en-tête de `/mon-histoire`, au-dessus de la timeline E03. Le profil de Phase 1 est trop maigre pour justifier une destination de navigation, et le séparer produirait deux écrans faibles au lieu d'un fort.
>
> Cette fiche décrit la **cible de Phase 3**, quand le profil a de la matière. Les blocs marqués ⑴ sont ceux qui existent dès la Phase 1, dans l'en-tête fusionné.

## Objectif

Produire le moment **« oui, ça me ressemble »** — la porte dure de la Phase 2 ([PHASING.md](../PHASING.md) §5). Cet écran n'ajoute aucune donnée : il donne un sens à celles qui existent.

## Contenu

Densité **faible** (principe 3). Un profil aussi chargé qu'une grille de saisie rate son effet.

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   Vous jouez depuis ≈ 35 ans.                                │  A
│   Tout a commencé avec une Game Boy, vers 1991.              │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│    18         487        214          37                     │  B
│  consoles   jeux joués  terminés   à 100 %                   │
├──────────────────────────────────────────────────────────────┤
│  ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━●               │  C
│  1991                                        2026            │
│                              [ Voir la timeline → ]          │
├──────────────────────────────────────────────────────────────┤
│  Vos périodes                                                │
│  ▓▓▓▓▓▒▒▒░░░░░▒▒▒▓▓▓▓▓▓▒▒░░                                  │  D
│  90s : Super Nintendo · 2000s : PlayStation 2 · …            │
├──────────────────────────────────────────────────────────────┤
│  Genres            Studios           Franchises              │  E
│  JRPG · Action     Squaresoft ·      Zelda (8/12)            │
│  · Plateforme      Nintendo EAD      Final Fantasy (6/15)    │
├──────────────────────────────────────────────────────────────┤
│  « Fini un dimanche de novembre, chez mon frère. »           │  F
│  Final Fantasy VII · 1998                                    │
└──────────────────────────────────────────────────────────────┘
```

**A ⑴ — La phrase.** Générée, en tête, composée en display serif (langage visuel §4) — c'est elle qui installe le registre « récit » plutôt que « tableau de bord ». Elle porte l'incertitude (`≈ 35 ans`, `vers 1991`) plutôt que de la masquer.

La phrase seule ne suffit pas à produire l'effet recherché, et une prose générée sonne vite faux. Elle travaille **avec** la bande de densité ⑷ et la timeline condensée ⑶ : c'est l'ensemble qui fait « ça me ressemble », et la partie visuelle y contribue davantage que la partie rédigée.

**B ⑴ — Quatre chiffres, pas douze.** La représentation synthétique de §8.2 liste treize indicateurs : les afficher tous produirait un tableau de bord, pas un portrait. Les autres vivent dans E10. Chiffres en chasse tabulaire, en display.

**C ⑴ — Timeline condensée.** Aperçu non interactif, avec une entrée vers E03.

**D ⑴ — Périodes d'activité.** Densité de moments dans le temps, **colorée par époque** (langage visuel §2). C'est la visualisation qui fait dire « c'est vrai, j'ai peu joué entre 2005 et 2010 » — et le bloc le plus immédiatement parlant de l'écran. En Phase 1 elle apparaît dès qu'il y a assez de moments pour qu'une forme se dessine.

**E — Goûts.** Genres, studios, franchises suivies avec taux de complétion.

**F — Un souvenir mis en avant.** Rotation à chaque visite. Le contenu écrit par l'utilisateur est ce qui différencie son profil de celui de n'importe quel joueur de sa génération.

## Mobile et desktop

| | Mobile | Desktop |
|---|---|---|
| Disposition | empilé, **un bloc par écran** — on fait défiler un portrait | deux colonnes : phrase, chiffres et bande de densité tiennent **sans défiler** |
| Timeline condensée | bande horizontale compacte | pleine largeur de la colonne principale |
| Goûts | listes | trois colonnes alignées |

Sur desktop, l'objectif est que le portrait soit **saisi d'un seul regard**, sans défilement : c'est ce qui produit l'effet « ça me ressemble ». Sur mobile, le défilement bloc par bloc joue le même rôle en séquence.

## L'image partageable

Une page web n'est pas ce qu'on partage sur une messagerie ou un réseau. Le profil sait donc produire une **image** — carrée et verticale — reprenant la phrase, les chiffres clés et la bande de densité colorée par époque (langage visuel §9).

C'est simultanément la réponse « très visuel » et le moteur de conversion de la Phase 5 : le chemin `image partagée → E15 → E01` est la principale source d'utilisateurs nouveaux une fois le partage ouvert. L'image ne contient **que** ce que les réglages de visibilité (E11) autorisent.

En Phase 1, l'image peut déjà être générée pour un usage privé (« garder une trace ») même sans profil public : elle ne dépend d'aucune fonctionnalité sociale.

## Actions

| Action | Destination |
|---|---|
| Voir la timeline | → E03 |
| Générer l'image | téléchargement ou partage système |
| Clic sur un chiffre | → E10 (statistiques détaillées) ou E08 (collection) |
| Clic sur un genre / studio / franchise | → E05 variante correspondante |
| Clic sur le souvenir | → E03 positionné sur ce moment |
| Partager | → E11 (visibilité) puis E15 |

## États

- **Vide** : n'existe pas dans le parcours normal — E01 garantit au moins un moment.
- **Trop maigre pour un portrait** (moins de ~10 moments) : afficher la phrase et l'amorce de timeline, **masquer les chiffres et les goûts**, et proposer E02. Des statistiques calculées sur cinq jeux détruisent la crédibilité de l'écran — c'est le principal risque de cette page.
- **Partiel** : cas nominal, les blocs sans données suffisantes s'effacent au lieu d'afficher zéro.

## Relations

- **Entrant** : navigation principale · E03 · E02 (après une session de saisie nourrie).
- **Sortant** : → E03 · → E10 · → E08 · → E05 · → E15.

**E04 est le miroir privé de E15 (profil public).** Les deux écrans partagent leur structure ; E15 en est la projection filtrée par les réglages de visibilité (E11). Les maintenir comme deux rendus d'un même composant évite qu'ils divergent — et permet à l'utilisateur de savoir exactement ce que les autres verront.

## Décisions de conception

**Le profil n'est pas un tableau de bord.** Sa réussite se mesure à une réaction émotionnelle, pas à une quantité d'information. Chaque bloc ajouté doit être payé par un bloc retiré.

**Aucune donnée n'y est saisie.** Les corrections passent par E03/E07. Mélanger contemplation et édition affaiblit les deux.

**Les chiffres portent leur incertitude.** `≈ 35 ans` dérivé d'un premier moment flou est honnête ; `35 ans` ne l'est pas (§11.4).

## Pièges

- Afficher un temps de jeu total : la donnée n'existe pas pour l'essentiel du parcours (§11.3). Ne rien afficher vaut mieux qu'agréger de l'importé, du déclaré et de l'estimé.
- Générer une phrase qui sonne faux : mieux vaut une formulation neutre qu'un enthousiasme automatique. « Vous jouez depuis 35 ans » est bon ; « Quel parcours incroyable ! » ne l'est pas.
- Calculer des goûts sur un échantillon insuffisant.
