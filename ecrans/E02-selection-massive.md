# E02 — Sélection massive

**Type** : page plein écran (mode focalisé, sans navigation principale) · **Phase** : 1 · **Route** : `/ajouter`, `/ajouter/:plateforme`

## Objectif

Permettre de déclarer **des dizaines de jeux en quelques minutes**. C'est la fonctionnalité centrale du produit (§24.3) et la seule dont la performance conditionne tout le reste.

Cible : **un geste par jeu**, sans rechargement, sans confirmation, sans légende à apprendre.

> ### ⚠️ Refonte du geste — 24 septembre 2026
>
> Cette fiche disait « un **tap** par jeu », et le tap déclarait « joué ».
> Trois reproches, tous justes, ont fait changer cela :
>
> 1. **on ne voyait pas qu'on pouvait balayer** — le geste de §24.3 était
>    invisible et n'avait aucune contrepartie ;
> 2. **on ne savait pas ce qu'on avait déjà dit** en ouvrant la liste : le
>    silence se rendait exactement comme le refus, une ligne éteinte, alors
>    que §24.3 en fait deux informations différentes ;
> 3. **le dépli en ligne n'était pas centré** : chaque coche poussait la
>    liste vers le bas, et la réponse qu'on venait de donner se perdait au
>    milieu de trente autres lignes.
>
> D'où : **trois états visibles**, **le balayage déclare dans les deux sens**,
> **le tap ouvre une modale**. Le budget ne change pas — un geste par jeu,
> mesuré par le parcours sur les trente déclarations de la passe 1 —, mais ce
> n'est plus le tap qui le dépense.
>
> **Ce que cela coûte**, et qui est assumé : le tap ne déclare plus. Un
> utilisateur qui tape trente lignes ouvre trente modales sans rien déclarer.
> C'est le prix du troisième état : un tap ne peut pas dire dans quel SENS on
> se prononce, et deviner « joué » remettrait exactement le défaut n° 2.

---

## Le principe : deux passes, pas trois décisions simultanées

C'est la décision qui structure tout l'écran.

Une première version de cette fiche plaçait trois bascules indépendantes (`joué`, `terminé`, `possédé`) plus une exclusion sur chaque ligne. Le calcul mobile la condamne : quatre cibles de 44 px plus leurs écarts occupent **200 px**, ce qui laisse **143 px de titre** sur un écran de 375 px. « The Legend of Zelda: A Link to the Past » y devient « The Legend of Ze… », sur l'écran dont toute la mécanique repose sur la **reconnaissance**. S'y ajoutent des erreurs de saisie entre cibles voisines et une légende `J`/`T`/`P` à apprendre.

L'écran fonctionne donc en deux passes :

| Passe | Geste | Ce qu'on obtient |
|---|---|---|
| **1 — parcourir** | **balayage** sur la ligne : à droite « j'y ai joué », à gauche « jamais » | la timeline se remplit, un geste, aucune légende |
| **2 — affiner** *(optionnelle)* | **tap sur la ligne** → une modale centrée : achèvement, affect, provenance, souvenir, fiche | la richesse, sans la payer au premier passage |

« Joué » est la déclaration dominante et la seule qui construise la timeline. Exiger trois décisions par jeu dès le premier passage triple la charge cognitive pour une précision que la plupart des utilisateurs n'atteindront pas de toute façon. **Le budget d'un tap par jeu n'existe que dans ce modèle.**

La passe 2 n'est jamais imposée : un utilisateur qui ne fait que la passe 1 a déjà un profil valable.

---

## Ce que porte la seconde passe

Quatre questions, une ligne de chips chacune, toutes facultatives. Elles ne coûtent rien à qui les ignore et changent la nature du profil pour qui y répond.

| Ordre | Question | Réponses | Spec |
|---|---|---|---|
| 1 | **Quand y avez-vous joué ?** | à sa sortie · peu après · bien plus tard | §4.8 |
| 2 | **Vous l'avez fini ?** | fini · toujours en cours · abandonné | §4.6 |
| 3 | **Ça vous a marqué ?** | sans plus · j'ai adoré · mon préféré | §4.7 |
| 4 | **Comment y avez-vous joué ?** | je l'avais · chez quelqu'un · emprunté | §4.5 |

> **Livré le 23 septembre 2026 — trois des quatre.** L'écran posait « fini ? » et « comment ? » ; l'**affect** s'y ajoute, entre les deux, à sa place. Il n'était saisissable que depuis E07 alors que tout son intérêt est d'être « un tap qui capte ce qui a compté » **pendant** la saisie (§9.1).
>
> « Quand y avez-vous joué ? » reste absente : elle est relative à la sortie du jeu, ce qui demande une date par réponse et non trois chips fixes. La période de l'écran (repère A) tient ce rôle en attendant.
>
> Le composant de chips et les réponses sont **partagés avec E07** — « une divergence entre eux serait un défaut » —, et le budget d'un tap par jeu ne bouge pas : le parcours coche trente lignes sans répondre et compte les mêmes gestes qu'avant.

**L'ordre n'est pas arbitraire.** « Quand » vient en premier parce que situer un souvenir dans le temps amorce le rappel de tout le reste — c'est ainsi que la mémoire fonctionne. Viennent ensuite le factuel, puis l'émotionnel, et enfin la provenance, la plus accessoire : un utilisateur qui s'arrête après trois questions n'a rien perdu d'essentiel.

Deux points de conception y sont enfouis et méritent d'être explicités.

**« Comment » remplace une case « possédé ».** Poser « possédé ? » à côté d'un geste qui dit déjà « joué » est ambigu : l'utilisateur ne sait pas si on lui demande une confirmation ou une information neuve. Et jouer sans posséder était la norme avant la dématérialisation — chez un cousin, chez le copain qui avait l'autre console, en location. La question du *comment* couvre le cas fréquent, rend visible la séparation possession / expérience, et fournit un déclencheur de mémoire que « possédé » n'offrait pas.

**« Quand » est relatif à la sortie du jeu, jamais absolu.** Chaque réponse affiche les années réelles calculées depuis la date connue du référentiel. « J'y ai joué quand c'est sorti » se retrouve sans effort ; « 1993 » se reconstitue péniblement.

Les chips affichent leur marque (§3 du [langage visuel](./00-langage-visuel.md)), ce qui apprend le vocabulaire de formes sans légende.

## Mobile — la liste

```
┌────────────────────────────────────┐
│ ←  Super Nintendo · PAL       ⚙    │  A
│    1993 ──────────── 1997          │
├────────────────────────────────────┤
│ 147 jeux · 12 déclarés        🔍   │  B
├────────────────────────────────────┤
│ ┌──┐                               │
│ │▨ │ Super Mario World          ▸  │  C  déclaré : icône « joué »
│ └──┘ 1990                          │
│ ┌──┐                               │
│ │▨ │ Zelda: A Link to the Past  ⚑▣ │     fini + je l'avais
│ └──┘ 1991                          │
│ ┌──┐                               │
│ │▨ │ Street Fighter II             │     non déclaré : rien
│ └──┘ 1992                          │
│ ┌──┐                               │
│ │▨ │ Chrono Trigger                │
│ └──┘ 1995                          │
├────────────────────────────────────┤
│ ▁▂▅▇▅▃  1993–1997                  │  D
│ 12 jeux, 4 terminés                │
│         [ Voir ma timeline → ]     │
└────────────────────────────────────┘
```

**A — Contexte fixe.** Plateforme, région, et **période appliquée par défaut à toute nouvelle déclaration**. La modifier ne réécrit pas les déclarations déjà faites : elle change ce qui sera attribué aux suivantes. C'est la source d'erreur la plus probable de l'écran, la règle doit rester visible.

**B — Barre de contrôle.** Compteur, filtre de recherche dans la liste. Le tri par notoriété (§3.3) est le défaut et n'a pas besoin d'être exposé en Phase 1.

> **Livré le 23 septembre 2026 — et c'est ce filtre qui tient la ligne « recherche d'un jeu ou d'une console » du périmètre** ([PHASING.md](../PHASING.md) §4), pas un écran. La saisie libre de §3.5 couvre le titre *absent* ; elle ne répond pas à « je sais que j'y ai joué, où est-il ? » dans 221 lignes. E06, la recherche transverse, sort de la Phase 1 avec sa raison.
>
> Trois règles le tiennent :
>
> - **il cherche un titre, il ne trie pas par état.** Une ligne déjà déclarée qui correspond reste affichée — le piège ci-dessous l'exige, « l'utilisateur perd ses repères et ne peut plus corriger » ;
> - **le compteur dit sur quoi il porte** — « 4 jeux sur 147 » —, et le compte des *déclarés* ne rétrécit pas avec le filtre : c'est la récompense permanente du repère D, pas un sous-total, et la voir tomber en tapant trois lettres se lirait comme une perte ;
> - **il ne perd rien.** Filtrer est une lecture : ce qui a été déclaré depuis l'ouverture traverse le filtre et sa levée, et vider rend la liste entière sans état intermédiaire (aucune temporisation — sur une liste déjà en mémoire, elle ne ferait que montrer la liste d'avant pendant deux frappes).
>
> Sans accent ni casse : le dataset porte « Pokémon » et « Astérix », et exiger l'accent ferait échouer la recherche sur les titres qu'on tape le plus vite. Quand rien ne correspond, l'écran le dit en nommant ce qui est cherché et renvoie à la saisie libre, juste en dessous — jamais une page blanche.

**C — La ligne.** Hauteur 56 px, **la ligne entière est la cible**. Elle contient une vignette (jaquette ou tuile générée, cf. [langage visuel](./00-langage-visuel.md) §5), le titre non tronqué, l'année, et l'état sous forme d'**icônes** en fin de ligne — manette, drapeau, boîte, cœur selon ce qui est déclaré (§3). Ces icônes affichent, elles ne commandent pas : elles n'ont pas à être des cibles.

**D — La récompense permanente.** Pas un compteur qui s'incrémente : une **bande d'époque qui grandit** à chaque déclaration, colorée selon la génération. L'utilisateur voit son histoire pousser pendant qu'il coche (principe 1, et langage visuel §7).

### Passe 2 sur mobile

Un **tap** sur la ligne — déclarée ou non — ouvre la modale du jeu : son nom, sa jaquette, puis ce qu'on veut bien en dire. Un clic à côté, `Échap` ou le bouton de fermeture la referment, et rien n'est perdu : chaque réponse part au geste qui la produit.

> **La modale enseigne le balayage.** E02 interdit « une légende à apprendre » *sur la liste* ; la modale n'est pas la liste, et c'est le seul endroit où l'on a le temps de lire une phrase. Elle existe pour se rendre inutile.

*La maquette ci-dessous décrit le dépli d'origine ; elle est conservée pour ce qu'elle dit des cibles.*

```
│ ┌──┐                               │
│ │▨ │ Super Mario World          ▸  │
│ └──┘ 1990                          │
│      ┌──────────┐ ┌──────────┐    │
│      │ terminé  │ │ possédé  │    │   deux cibles pleines,
│      └──────────┘ └──────────┘    │   48 px de haut
```

Deux cibles larges qui n'existent que sur la ligne active : la densité de la liste est préservée, les cibles restent conformes.

---

## Desktop — la grille

Au-delà de 1024 px, la liste en colonne unique gaspillerait 60 % du viewport et imposerait un balayage vertical sur 147 titres. La grille en affiche **40 à 50 d'un coup** — c'est la disposition qui rend la reconnaissance rapide.

```
┌──────────────────────────────────────────────────────────────────────┐
│ ←  Super Nintendo · PAL        1993 ●────────● 1997        147 · 12  │
├──────────────────────────────────────────────────────────────────────┤
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐  │
│  │        │ │        │ │▨▨▨▨▨▨▨▨│ │        │ │        │ │        │  │
│  │ [img]  │ │ [img]  │ │ STREET │ │ [img]  │ │ [img]  │ │ [img]  │  │
│  │        │ │        │ │FIGHTER2│ │        │ │        │ │        │  │
│  │      ▸ │ │    ⚑ ▣ │ │        │ │        │ │      ▸ │ │        │  │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘  │
│  Mario World Zelda ALTTP Street F.  Donkey K. Chrono T. Secret of…   │
│  1990        1991       1992        1994      1995       1993        │
│                                                                      │
│  ┌────────┐ ┌────────┐ …                                            │
├──────────────────────────────────────────────────────────────────────┤
│  ▁▂▅▇▅▃▂  1993–1997 · 12 jeux, 4 terminés    [ Voir ma timeline → ]  │
└──────────────────────────────────────────────────────────────────────┘
```

- **Clic sur la tuile** = joué, exactement comme le tap mobile.
- **Au survol**, trois bascules apparaissent en surimpression basse : `joué · terminé · possédé`. Le survol et le clavier rendent les trois décisions gratuites sur desktop — c'est la **bonne divergence** entre les deux plateformes : même modèle, affordances adaptées au dispositif de pointage.
- **Clavier** : flèches pour se déplacer dans la grille, `Espace` = joué, `T` = terminé, `P` = possédé. C'est le mode le plus rapide qui existe, et le budget d'un geste par jeu en dépend.

Une bascule liste ↔ grille reste offerte sur desktop pour qui préfère lire des titres, mais la grille est le défaut.

---

## « Jamais joué »

La déclaration explicite « jamais joué » a une vraie valeur : elle distingue « il n'y a pas joué » de « il ne s'est pas prononcé », ce qui conditionne la pertinence des recommandations (§14.2).

Elle ne mérite pas pour autant une quatrième cible permanente sur chaque ligne. Elle est donc :
- **mobile** : un balayage vers la gauche sur la ligne ;
- **desktop** : une des options du survol, et la touche `X` ;
- **jamais requise** — un utilisateur qui l'ignore complètement n'est pas pénalisé.

Une ligne marquée « jamais joué » s'estompe sans disparaître (cercle vide, opacité réduite), pour rester corrigeable.

---

## Actions

| Action | Résultat |
|---|---|
| **Balayage à droite** (mobile) / cible ✓ au survol (desktop) | déclare **joué**, immédiat, sans confirmation ni rechargement |
| **Balayage à gauche** (mobile) / cible ✗ au survol (desktop) | **jamais joué** (§24.3) |
| **Le même geste répété** | ramène à **« pas encore dit »** |
| **Tap / clic sur la ligne ou la tuile** | ouvre la **modale** du jeu — elle ne déclare rien |
| Changer la période (A) | s'applique aux déclarations **suivantes** |
| Changer de plateforme | → E02 sur une autre plateforme, période conservée |
| « Voir ma timeline » | → E03 |
| Titre absent | saisie libre → déclaration non résolue (§3.5) |
| **Voir la fiche** (dans la modale) | → **E05**, en conservant la position |

## États

- **Vide** : n'existe pas — la liste est déjà pleine de jeux. C'est la force de cet écran face à un formulaire d'ajout.
- **Partiel** : cas nominal.
- **Aucun jeu pour ce filtre** : proposer d'élargir la période ou de changer de région, jamais une page blanche.
- **Chargement** : squelette de lignes ou de tuiles, la liste reste manipulable dès les premiers éléments.
- **Hors ligne** : **l'écran fonctionne normalement.** Voir ci-dessous.

## Hors ligne

Se remémorer ses jeux d'enfance se fait dans un canapé ou un train, pas nécessairement bien connecté. Un écran qui persiste à chaque tap et dépend du réseau casse exactement là où on l'utilise.

- Écriture **locale d'abord**, file de synchronisation en arrière-plan.
- Aucun indicateur de chargement par tap : la bascule est instantanée et optimiste.
- L'état de synchronisation est signalé une seule fois, discrètement, en pied d'écran — jamais par ligne.
- Le jeu de données de la plateforme consultée est mis en cache dès l'ouverture de l'écran.

Ce n'est pas un raffinement de Phase 7 : c'est ce qui protège la mécanique centrale.

## Relations

- **Entrant** : E01 (fin d'onboarding, préfiltré) · navigation principale (« Ajouter ») · E05 fiche plateforme (« voir tous les jeux ») · E03 timeline (« compléter cette période »).
- **Sortant** : → E03 (voir le résultat) · → E05 (détail d'un jeu, en conservant la position) · → E02 (autre plateforme).

> **Le geste vers E05 est livré le 23 septembre 2026, et il vit dans le PANNEAU d'affinage.** Une seconde cible sur la ligne est exactement ce que la refonte en deux passes interdit — quatre cibles de 44 px ne laissent que 143 px de titre. Le budget d'un tap par jeu ne bouge donc pas : aucune des trente lignes ne le paie.
>
> **Conséquence assumée** : le panneau n'existe que sur une ligne **déclarée**. Ouvrir la fiche d'un jeu qu'on hésite à cocher — le cas « c'est quoi, ce jeu ? » — attend un autre geste, et il est inscrit dans [TODO-ECRANS-2.md](../TODO-ECRANS-2.md).
>
> **« En conservant la position » a un coût réel.** E05 est une page : l'état local de cet écran — lignes cochées depuis l'ouverture, affinages, souvenirs — part avec le démontage. Revenir **relit** donc la base, où tout a été écrit au geste qui l'a produit. Sans cela, l'écran reviendrait en montrant moins que ce qu'elle contient.

Cette boucle **E02 → E03 → E02** est le cycle central du produit : déclarer, constater, revenir en déclarer plus. Elle doit être sans friction dans les deux sens.

## Décisions de conception

**Mode plein écran, sans navigation principale.** L'écran demande de la concentration sur un geste répétitif ; toute chrome périphérique dégrade le rythme.

**Aucune sauvegarde explicite.** Chaque bascule est persistée immédiatement. Un bouton « Enregistrer » transformerait 40 déclarations en une transaction risquée.

**La période est un contexte, pas un champ par ligne.** Demander une date par jeu multiplierait le coût par cinq. L'affinage se fait plus tard et à la demande, depuis E03/E07.

**Les trois états se voient, et chacun porte son nom** (§10) : manette pour « joué », cercle barré pour « jamais », **cercle en pointillés pour « pas encore dit »** — vide, et non barré : barrer serait déjà répondre.

**Les pastilles d'état affichent, elles ne commandent pas.** Séparer l'affichage de l'état et la cible d'action est ce qui permet une ligne dense **et** une cible de 56 px.

## Pièges

- Rétablir trois bascules permanentes par ligne sur mobile : c'est l'erreur que cette fiche corrige.
- Une modale de **confirmation** par clic : détruit le budget d'un geste par jeu. ⚠️ À ne pas confondre avec la modale d'**affinage** livrée le 24 septembre 2026 : celle-ci ne confirme rien, ne bloque rien, et le geste qui déclare ne la traverse pas. Le jour où fermer devient obligatoire pour déclarer, ce piège est retombé.
- **Rendre le silence comme un refus.** Une ligne éteinte disait à la fois « je n'y ai pas joué » et « je n'ai rien dit ». §24.3 en fait deux informations, et la seconde est celle qu'on voit en ouvrant la liste.
- **Un geste caché sans contrepartie visible.** Le balayage existait dans un seul sens, sans rien qui l'annonce : personne ne le trouvait.
- Trier alphabétiquement par défaut : l'utilisateur ne reconnaît plus rien, la notoriété est le seul tri utile ici.
- Ignorer la région : proposer la ludothèque NTSC-J à un joueur PAL (§3.4) casse l'effet de reconnaissance.
- Masquer les jeux déjà déclarés : l'utilisateur perd ses repères et ne peut plus corriger.
- Livrer la grille desktop **sans jaquettes réelles**. Décision de Phase 0 (§19.2) : une tuile générée est du texte sur un fond coloré, donc on la lit au lieu de la reconnaître — et la grille n'existe que pour permettre la reconnaissance sans lecture. Une tuile de 148 px qui affiche un titre coûte cinq fois la surface d'une ligne de liste pour la même information. **Sans jaquettes, la grille est abandonnée** au profit de la liste dense à tous les points de rupture.
