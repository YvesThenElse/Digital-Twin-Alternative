# Ce que la première liste a fait apparaître

> Suite de [`TODO-ECRANS.md`](./TODO-ECRANS.md), dont les dix items sont
> faits. La méthode reste dans [`BOUCLE-ECRANS.md`](./BOUCLE-ECRANS.md).

## D'où vient cette liste

Aucun de ces manques n'a été cherché : ils se sont montrés en construisant
autre chose. Quatre l'ont été par un test qui refusait de mentir — le
parcours qui constate un épisode replié, le garde de navigation qui lit la
table des liens, le compteur d'un mutation qui ne tombait pas juste.

C'est une liste **de seconde main**, et elle n'a pas le statut de la
première : celle-là tenait un périmètre écrit, celle-ci ramasse ce que le
chemin a laissé.

> ### ⚠️ Ce que cette liste coûte, et qu'il faut lire avant de la commencer
>
> Elle est construite **avant** la session de test, sur décision du
> 23 septembre 2026. `PHASING.md` §11 dit l'inverse : si la porte de Phase 2
> se ferme, la réponse est d'itérer sur la Phase 1, pas d'avancer. On
> construit donc plus loin sans savoir si ce qui est là produit « oui, ça me
> ressemble » — et **si les testeurs disent non, une partie de ce travail
> aura porté sur les mauvais écrans**. C'est assumé, pas oublié.

---

## Ce qui se construit sans rien trancher

- [x] **T1 — Revenir de la fiche ne replie plus l'épisode.** (E03, actions ·
  E05) E03 promet « clic sur un jeu → E05, **en conservant la position** ».
  E05 est une page : l'axe est démonté puis remonté, et l'état « déplié »
  part avec lui. Le parcours le **constate** aujourd'hui — une assertion
  écrite pour échouer le jour où ce sera corrigé — et paie un geste pour
  redéplier.

  La correction demande de sortir le repliage de l'entrée, là où il survivra
  au remontage : c'est l'apprentissage 73, « écrire dans le même geste ce qui
  remonte un composant et ce qui doit lui survivre ».

  *Acceptation : revenir d'une fiche retrouve l'épisode tel qu'on l'a laissé ;
  l'assertion qui constatait le défaut est retirée du parcours, et le geste
  qu'elle coûtait disparaît du budget.*

- [x] **T2 — E02 pose la question de l'affect.** (E02, passe 2 · §4.7) Sa
  fiche liste **quatre** questions ; l'écran en pose deux. L'affect n'est
  saisissable que depuis E07, alors que son intérêt est justement d'être
  « un tap qui capte ce qui a compté » pendant la saisie en masse.

  Le composant de chips et les réponses sont déjà partagés depuis S8 : c'est
  une ligne à ajouter, pas une fonctionnalité à concevoir.

  *Acceptation : la question paraît sur une ligne déclarée, comme les deux
  autres ; elle envoie exactement ce qu'envoie E07 ; et le budget d'un tap
  par jeu ne bouge pas pour qui l'ignore — le parcours le mesure.*

- [x] **T3 — Un profil trop maigre propose de compléter.** (E04, états) « Trop
  maigre pour un portrait : afficher la phrase et l'amorce de timeline,
  masquer les chiffres, **et proposer E02**. » Les deux premières sont
  tenues depuis S1, la troisième jamais — c'était une porte de navigation que
  la Phase 1 n'avait nulle part, et S5 l'a ouverte depuis.

  *Acceptation : sous le seuil du portrait, l'en-tête invite à compléter, et
  l'invitation mène à E02 par le chemin que S5 a construit — pas par un
  second. Au-dessus du seuil, elle disparaît.*

- [x] **T4 — E04 porte ses périodes d'activité.** (E04, bloc ⒟) Marqué
  Phase 1 dans la fiche, et absent. C'est « la visualisation qui fait dire
  *c'est vrai, j'ai peu joué entre 2005 et 2010* — et le bloc le plus
  immédiatement parlant de l'écran ».

  Attention au voisinage : la bande d'époque d'E02 montre déjà une densité
  pendant la saisie. Celle-ci porte **toute l'histoire**, pas le passage en
  cours, et elle vit sur l'écran de lecture.

  *Acceptation : une bande de densité colorée par époque, calculée par le
  domaine et jamais par un recompte de l'écran ; elle n'apparaît qu'« à
  partir d'assez de moments pour qu'une forme se dessine », et son absence
  n'est pas un blanc ; sa hauteur se mesure dans le navigateur.*

- [x] **T5 — E04 nomme vos préférés.** (E04, bloc ⒠ bis · §4.7) Marqué
  Phase 1, et il attendait que l'affect soit saisissable — ce que S8 a fait.
  « C'est la ligne la plus personnelle que le système sache produire sans que
  l'utilisateur ait écrit une phrase, et le meilleur retour sur l'affect
  déclaré pendant la saisie. **Sans cette restitution, l'affect ne serait que
  de la collecte.** »

  *Acceptation : un titre par plateforme, nommé ; rien du tout quand aucun
  préféré n'est déclaré — jamais une ligne vide ; et ce qu'il affiche vient
  du domaine, qui sait déjà qu'il n'y a qu'un préféré par plateforme.*

---

## Les décisions prises le 23 septembre 2026

| Question | Tranché | Où ça vit |
|---|---|---|
| Le geste E02 → E05 | **le panneau d'affinage** | T6 |
| La nature de la table des liens | **un résumé des liens dominants** | T7 |
| La timeline condensée d'E04 | **construite** | T8 |

- [x] **T6 — E02 ouvre la fiche depuis le panneau d'affinage.** (E02,
  relations · E05) Ses relations promettent « → E05 (détail d'un jeu, **en
  conservant la position**) », et aucun geste ne l'ouvrait. **Décidé** : le
  panneau d'affinage, qui n'ajoute **aucune cible à la ligne** — la refonte
  en deux passes tient, et le budget d'un tap par jeu ne bouge pas.

  Ce que cela laisse dehors, et qu'il faut savoir : le panneau n'existe que
  sur une ligne **déclarée**. On ne pourra pas ouvrir la fiche d'un jeu qu'on
  hésite à cocher — le cas « c'est quoi, ce jeu ? » attend un autre geste.

  ⚠️ **Le piège est le retour.** E05 est une page : l'axe l'a déjà appris
  (T1), et la sélection a bien plus à perdre — les lignes cochées depuis
  l'ouverture, les affinages, les souvenirs en cours de frappe vivent dans
  son état local.

  *Acceptation : depuis une ligne déclarée, un geste du panneau ouvre sa
  fiche ; aucune cible n'est ajoutée à la ligne et le parcours le mesure au
  budget ; et revenir retrouve la liste telle qu'on l'a laissée — les
  déclarations faites depuis l'ouverture comprises.*

- [ ] **T7 — La table des liens dit ce qu'elle est.** (`PARCOURS-ET-LIENS.md`
  §3 · S9) Elle est asymétrique en vingt-quatre endroits parce que ses deux
  colonnes sont deux listes tenues à la main. **Décidé** : c'est un **résumé
  des liens dominants**, pas une matrice d'adjacence — sa quatrième colonne
  le disait déjà à demi-mot.

  Ce que cela change : « mène vers » fait foi, « vient de » devient
  indicative, et le garde de S9 cesse de laisser croire qu'il couvre tout le
  graphe.

  *Acceptation : le document dit ce que chaque colonne engage ; le garde de
  navigation le dit aussi, dans son propre texte ; et il vérifie que les
  transitions de §6 — les six qui portent les KPI — sont toutes dans la
  colonne qui fait foi, faute de quoi le résumé omet ce qu'il prétend
  résumer.*

- [ ] **T8 — E04 porte sa timeline condensée.** (E04, bloc ⒞) **Décidé** :
  construite, malgré la fusion E03 + E04 de la Phase 1.

  ⚠️ **Ce que la fusion lui coûte**, et qu'il faut regarder en face : son
  entrée « voir la timeline → E03 » pointerait sur l'écran où l'on se trouve
  déjà, et un aperçu non interactif posé juste au-dessus de l'axe dirait deux
  fois la même chose sur un écran dont la densité doit rester **faible**
  (principe 3). Le bloc doit donc gagner sa place : montrer ce que l'axe ne
  montre pas — l'**étendue** d'un seul regard, 1991 → 2026, là où l'axe
  déroule.

  *Acceptation : une ligne temporelle non interactive portant les deux bornes
  de l'histoire, calculées par le domaine ; elle ne duplique pas l'axe — pas
  de titres, pas de moments détaillés ; elle ne mène nulle part tant qu'E03
  et E04 sont le même écran, et la fiche dit pourquoi ; sa hauteur et ses
  bornes se mesurent dans le navigateur.*

---

## Journal

- **T6** — le geste vers E05 vit dans le **panneau d'affinage**. Il suit
  exactement le sort des trois questions : il paraît avec elles, il part avec
  elles — donc aucune cible n'est ajoutée à la ligne, et le budget d'un tap
  par jeu ne bouge pas.

  **Le retour relit.** E05 est une page, l'état local de la sélection part
  avec le démontage, et tout ce qu'il portait est en base depuis le geste qui
  l'a produit. Le parcours le mesure sur les trente déclarations : elles sont
  toutes là au retour. C'est T1 à une autre échelle — là, un repliage ; ici,
  deux heures de saisie.

  **Et l'axe est relu à l'ALLER**, ce qui est moins évident : la fiche tire
  sa couche personnelle de la timeline, qui n'a pas été lue quand on vient de
  la sélection. Sans cela, la fiche aurait dit « rien de déclaré » sur un jeu
  qu'on venait de cocher.

  Ce qui est laissé, et que la décision assumait : le panneau n'existe que
  sur une ligne **déclarée**. Le cas « c'est quoi, ce jeu ? » attend un autre
  geste.

- **T5** — les préférés sont nommés, un par plateforme, et c'est le
  **domaine** qui le dit : l'invariant 6 est tenu à l'écriture, et la lecture
  n'en rend qu'un même sur une collection fautive — de façon déterministe,
  sans quoi le profil bougerait d'une visite à l'autre. Elle ne **répare**
  pas : réparer est une écriture, et une lecture qui écrit surprend là où on
  ne l'attend pas.

  **Ils ne suivent pas le seuil du portrait**, contrairement aux chiffres et
  à la bande. C'est la décision de fond de l'item : un taux calculé sur cinq
  jeux ment, un préféré déclaré sur un profil maigre reste vrai. Deux
  natures, deux règles — et c'est justement la ligne qu'on veut montrer en
  premier à qui vient de commencer.

  Le parcours suit désormais un affect **de bout en bout** : désigné dans le
  panneau d'E07, relu en haut de `/mon-histoire` avec sa machine. C'est la
  boucle « déclarer → restituer » que la fiche demande, et elle n'existait
  dans aucun sens il y a trois itérations.

- **T4** — la bande de densité est là, **creux compris** : une tranche par
  décennie, zéro inclus, jusqu'à **aujourd'hui** et non jusqu'à la dernière
  déclaration — une histoire qui s'arrête en 2010 doit montrer quinze ans de
  silence, et c'est son information la plus utile.

  Le domaine compte, l'écran met en forme. « Assez de moments » est le
  **seuil du portrait**, le même que les chiffres : deux seuils distincts
  seraient deux règles à tenir pour une même raison.

  La garde est dans le navigateur et elle **mesure** : hauteur maximale
  au-dessus de seize pixels, et hauteur minimale **strictement positive** —
  un creux qui disparaîtrait se lirait comme un défaut d'affichage plutôt
  que comme un silence. Une mutation qui retire la hauteur explicite du
  conteneur la fait rougir ; aucun test d'attribut ne l'aurait vue.

  Reste dehors : la ligne de légende de la maquette — « 90s : Super
  Nintendo · 2000s : PlayStation 2 » —, qui demande de nommer la plateforme
  dominante de chaque décennie. Inscrit ci-dessous.

- **T3** — l'en-tête invite à compléter sous le seuil du portrait, et
  disparaît dès qu'il tient. Elle passe par le **même** chemin que la
  relance des trous — `completerLaPeriode`, avec un argument de moins : un
  second ferait deux façons d'arriver au même écran.

  **Elle ne présume aucune période.** Il n'y a pas de décennie creuse à
  combler, il y a une histoire à commencer : celle du joueur revient
  inchangée. Et l'invitation ne dit pas ce qui manque — annoncer un seuil
  ferait du portrait une jauge à remplir, alors qu'un profil se construit
  par envie.

  Sur un profil **vide**, elle se tait : l'axe porte déjà « racontez votre
  première console », et deux invitations superposées n'en font pas une plus
  claire.

  Une mutation n'a rien cassé, pour une raison instructive : la période
  qu'elle inventait **coïncidait** avec celle du scénario. La propriété
  n'était pas « la période vaut 1990–1999 » mais « la période n'a pas
  changé » — c'est l'apprentissage 88.

- **T2** — l'affect s'ajoute à la passe 2 d'E02, **entre** l'achèvement et la
  provenance : « le factuel, puis l'émotionnel, et enfin la provenance, la
  plus accessoire ». L'ordre est mesuré sur le document, pas supposé.

  Le composant et les réponses étaient déjà partagés avec E07 depuis S8 :
  l'écran envoie donc exactement ce qu'envoie le panneau, et un second clic
  retire la réponse — « pas prononcé » doit rester atteignable, faute de
  quoi un geste par erreur serait définitif.

  **Le budget n'a pas bougé** : `TITRES_A_COCHER + 43`. Le parcours coche
  trente lignes sans répondre et compte les mêmes gestes ; il vérifie en
  revanche qu'il y a bien **trois** questions par ligne déclarée — quatre-vingt-dix
  groupes, et le compte tomberait à soixante si la question disparaissait.

  Ce qui est laissé : la quatrième question, « quand y avez-vous joué ? ».
  Elle est **relative à la sortie du jeu** — « à sa sortie · peu après · bien
  plus tard », avec les années réelles calculées par titre —, donc trois
  chips fixes n'y suffisent pas. La fiche E02 le dit désormais.

- **T1** — le repliage a quitté l'entrée. Il vit chez le parent, parce qu'il
  doit **survivre** au démontage de l'axe : ouvrir la fiche d'un jeu remonte
  la timeline, et un état local repartait avec elle. C'est la seconde moitié
  de l'apprentissage 73 — « écrire dans le même geste ce qui remonte un
  composant et ce qui doit lui survivre » —, appliquée cette fois à une vue
  de lecture plutôt qu'à une saisie.

  L'assertion que le parcours portait depuis S6, écrite pour **échouer le
  jour de la correction**, a échoué. Elle est retirée, et le geste qu'elle
  coûtait quitte le budget : `TITRES_A_COCHER + 43`.

  Les tests d'axe qui déplient jouent désormais un petit parent qui tient
  l'état — sans lui, ils auraient mesuré un composant à qui l'on a retiré sa
  mémoire sans la lui rendre.
