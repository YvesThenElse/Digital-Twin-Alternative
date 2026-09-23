# E04 — Profil

**Type** : page · **Phase** : 1 (fusionné) puis 3 (autonome) · **Route** : `/mon-histoire` puis `/profil`

> **En Phase 1, E04 n'est pas un écran séparé** : sa synthèse (la phrase, les quatre chiffres, la timeline condensée) forme l'en-tête de `/mon-histoire`, au-dessus de la timeline E03. Le profil de Phase 1 est trop maigre pour justifier une destination de navigation, et le séparer produirait deux écrans faibles au lieu d'un fort.
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
│  consoles  jeux déclarés terminés  souvenirs écrits          │
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

> ⚠️ **Le quatrième n'est pas « à 100 % », et ne peut pas l'être.** La v1 de cette fiche l'annonçait ; [SPECIFICATION](../SPECIFICATION.md) §4.6 l'a explicitement sorti du modèle — c'est une *profondeur de complétion*, pas une position sur l'axe, et « 100 % de Tetris ou d'un jeu de sport ne veut rien dire ». Un écran ne peut pas afficher un chiffre que le domaine refuse de produire.
>
> Il est remplacé par le compte des **souvenirs écrits**. Ce n'est pas un pis-aller : c'est le seul contenu du produit qui ne soit pas générable, et §9.1 en fait le porteur direct du « oui, ça me ressemble » — soit l'objectif même de cet écran.
>
> Les trois autres viennent de la même projection que le taux de §6 : « jeux déclarés » est son dénominateur, « terminés » son numérateur. Les recompter ailleurs produirait une seconde définition de « déclaré », qui divergerait sans que rien ne le signale.

**Ce que l'en-tête compte, et ce qu'il ne compte pas.** Les chiffres sont calculés par le domaine, jamais par l'écran : `/mon-histoire` n'a en mémoire qu'une plateforme et les lignes qu'on lui a chargées. Un compte fait là serait juste par rapport à l'écran et faux par rapport à l'histoire — « 1 console » à quelqu'un qui en a saisi quatre —, et personne ne le verrait.

**C ⑴ — Timeline condensée.** Aperçu non interactif, avec une entrée vers E03.

**D ⑴ — Périodes d'activité.** Densité de moments dans le temps, **colorée par époque** (langage visuel §2). C'est la visualisation qui fait dire « c'est vrai, j'ai peu joué entre 2005 et 2010 » — et le bloc le plus immédiatement parlant de l'écran. En Phase 1 elle apparaît dès qu'il y a assez de moments pour qu'une forme se dessine.

> **Livré le 23 septembre 2026.** Une tranche par décennie, **creux compris** : une bande qui ne montrerait que les décennies peuplées serait pleine et ne dirait plus rien — c'est l'alternance qui parle. Elle va jusqu'à **aujourd'hui** et non jusqu'à la dernière déclaration : une histoire qui s'arrête en 2010 doit montrer quinze ans de silence.
>
> « Assez de moments » est le **seuil du portrait**, le même que les chiffres : une densité dessinée sur cinq moments dit aussi peu qu'un taux calculé sur cinq jeux, et deux seuils distincts seraient deux règles à tenir.
>
> Ce qui n'est pas sur l'axe n'y est pas (invariant 2) : un moment sans date n'a pas de décennie, et le tiroir le montre ailleurs. Les hauteurs sont **relatives au maximum** — une échelle absolue écraserait tout dès qu'une décennie domine —, et le parcours les **mesure dans le navigateur** : une bande déclarée en attribut et invisible ne fait rien dire à personne.
>
> Reste dehors : la ligne de légende de la maquette — « 90s : Super Nintendo · 2000s : PlayStation 2 » —, qui demande de nommer la plateforme dominante de chaque décennie.

**E — Goûts.** Genres, studios, franchises suivies avec taux de complétion.

**E bis ⑴ — Vos préférés.** Un titre par plateforme, nommé (§4.7). C'est la ligne la plus personnelle que le système sache produire sans que l'utilisateur ait écrit une phrase — et le meilleur retour sur l'affect déclaré pendant la saisie. Sans cette restitution, l'affect ne serait que de la collecte.

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

- **Vide** : n'existe pas dans le parcours normal — E01 garantit au moins un moment. L'URL d'un profil restant adressable, l'en-tête ne rend alors **rien** : ni chiffres à zéro, ni coquille. Un profil sans rien n'a pas un taux de zéro, il n'en a pas.
- **Trop maigre pour un portrait** (moins de ~10 moments) : afficher la phrase et l'amorce de timeline, **masquer les chiffres et les goûts**, et proposer E02. Des statistiques calculées sur cinq jeux détruisent la crédibilité de l'écran — c'est le principal risque de cette page.

  > **Les trois sont tenues depuis le 23 septembre 2026.** L'invitation passe par le chemin de la relance des trous — E02 est une liste par plateforme, et aucune n'est choisie quand on lit son histoire — et elle **ne présume aucune période** : il n'y a pas de décennie creuse à combler, il y a une histoire à commencer. Elle dit ce qu'elle fait, jamais ce qui manque : annoncer un seuil ferait du portrait une jauge à remplir.
- **Partiel** : cas nominal, les blocs sans données suffisantes s'effacent au lieu d'afficher zéro.

## Ce qui en est livré — 23 septembre 2026

| Bloc | Phase 1 | État |
|---|---|---|
| A — la phrase | ⑴ | **livré** : durée approchée et commencement, avec leur granularité |
| B — les quatre chiffres | ⑴ | **livré** : `consoles · jeux déclarés · terminés · souvenirs écrits` |
| C — la timeline condensée | ⑴ | absent — la timeline E03, elle, est juste en dessous |
| D — les périodes d'activité | ⑴ | **livré** : une tranche par décennie, creux compris |
| E bis — vos préférés | ⑴ | absent : l'affect n'est pas encore saisissable (E07) |
| E — goûts · F — souvenir mis en avant | — | Phase 3 |

Les trois blocs ⑴ absents sont inscrits dans [TODO-ECRANS.md](../TODO-ECRANS.md) : ils attendent le verdict de la session de test, qui dit s'il faut approfondir le portrait ou passer à la suite.

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
