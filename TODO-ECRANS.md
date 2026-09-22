# Finir la Phase 1 — les écrans qui manquent

> Suite de [`TODO-FINITION.md`](./TODO-FINITION.md), dont les dix-huit items
> sont faits. La méthode est dans [`BOUCLE-ECRANS.md`](./BOUCLE-ECRANS.md).

## Ce qui a été mesuré avant d'écrire cette liste

Trois relevés, obtenus en lisant les documents qui font foi — pas en se
souvenant :

1. **Le périmètre écrit de la Phase 1** (`PHASING.md` §4) contient trois
   lignes que personne n'a livrées : « recherche d'un jeu ou d'une console »,
   « quelques statistiques », « page de profil simple ».
2. **Quatre fiches d'écran se déclarent « Phase 1 » et n'existent pas** :
   E04 (en-tête fusionné), E05, E06, E07. La cinquième, E01, n'existe qu'aux
   deux premiers temps sur trois.
3. **Le graphe de navigation promet des destinations absentes.** Depuis les
   écrans livrés, E02 et E03 mènent vers E05, E07 et E04 — aucun des trois
   n'est là. Un lien qui ne mène nulle part est la version « navigation » du
   défaut que l'audit a trouvé partout : ce qui manque se lit comme un fait.

**Ce n'est donc pas construire devant la porte de Phase 2, c'est finir la
Phase 1** — à une exception près, E07, que la boucle précédente a déplacé en
Phase 3 et qui est donc le seul item à trancher (voir la fin du fichier).

## Ce que ça change pour la session de test

Le verdict de sortie du 22 septembre dit vrai — les quatre blocages de
l'audit sont levés — et il est **incomplet** : il ne dit pas que trois lignes
du périmètre n'ont jamais été livrées.

> ### 🚦 Tranché le 22 septembre 2026 : le lot avant la session est **S1 + S2**
>
> Ce sont l'écran dont l'objectif *est* la porte — « produire le moment *oui,
> ça me ressemble* » — et la récompense d'E01 où se joue le KPI de première
> session. Mesurer la porte sur un écran à moitié construit mesurerait autre
> chose.
>
> **La boucle s'arrête donc après S2**, et la session de test a lieu. Ce que
> les testeurs diront ordonne le reste : S3 à S9 attendent ce verdict —
> E07 compris, ce qui tranche D2. `PHASING.md` §11 le rappelle : si la porte
> se ferme, la réponse est d'itérer sur la Phase 1, pas d'avancer.

---

## Ce que le périmètre de la Phase 1 promet et que personne n'a livré

- [x] **S1 — `/mon-histoire` porte sa synthèse.** (E04 fusionné, blocs ⑴ ·
  `PHASING.md` §4 « page de profil simple », « quelques statistiques ») E04
  dit lui-même que sa synthèse « forme l'en-tête de `/mon-histoire`, au-dessus
  de la timeline » **dès la Phase 1**, et son objectif est la porte dure :
  « produire le moment *oui, ça me ressemble* ». Cinq blocs y sont marqués
  Phase 1 — la phrase, les chiffres, la timeline condensée, les périodes
  d'activité, les préférés.

  **Décidé — les quatre chiffres** : `consoles · jeux déclarés · terminés ·
  souvenirs écrits`. Le quatrième de la fiche, « à 100 % », est **impossible**
  et le restera : §4.6 l'a explicitement sorti de l'axe des positions — « 100 %
  de Tetris ou d'un jeu de sport ne veut rien dire ». Il est remplacé par le
  compte des **souvenirs**, seul contenu non générable du produit, et que
  §9.1 désigne comme le porteur direct du « oui, ça me ressemble ».

  **Décidé — le report de F12 tient.** Les « premières statistiques » de
  §24.4 récompensent **pendant** la saisie, sur E02, et la bande d'époque le
  fait déjà ; les quatre chiffres d'E04 dressent un portrait **après**, sur
  l'écran de lecture. Deux promesses distinctes, deux textes qui restent
  vrais.

  *Acceptation : l'en-tête porte la phrase en display serif et quatre
  chiffres qui ne mentent pas sur un profil vide ou maigre — un profil sans
  rien n'a pas un taux de zéro, il n'en a pas ; il ne devient pas un tableau
  de bord (densité faible, principe 3) ; ce qu'il affiche vient du domaine,
  jamais d'un recompte de l'écran ; et la fiche E04 cesse d'annoncer un
  chiffre que le modèle refuse.*

- [x] **S2 — E01 a son troisième temps.** (E01 · §24.4) « Dès la validation
  du temps 2, sans transition ni chargement bloquant : une phrase, une bande
  sur un axe, un aperçu visuel des jeux à venir, une continuation. » Seule la
  phrase existe (F12). L'aperçu « n'est pas décoratif : il montre concrètement
  ce que la suite propose, ce qui augmente le passage vers E02 » — et c'est
  l'écran où se joue le KPI *median time to first meaningful profile*.
  *Acceptation : le temps 3 rend les quatre éléments, l'aperçu montre de
  vraies jaquettes de la plateforme choisie, et le parcours mesure qu'il
  n'attend aucun chargement.*

- [ ] **S3 — Un filtre dans la liste.** (`PHASING.md` §4, E02 repère B)
  « Recherche d'un jeu ou d'une console » est au périmètre et n'existe pas.
  La saisie libre de §3.5 couvre le titre **absent**, pas le titre présent
  qu'on ne retrouve pas dans 221 lignes — « je sais que j'y ai joué, où
  est-il ? ».

  **Décidé** : un **filtre dans la liste**, pas un écran de recherche. E02
  repère B le prévoit déjà — « compteur, filtre de recherche dans la liste » —
  et il ne fait pas quitter l'écran, ce qui est la moitié de sa valeur sur le
  geste le plus répétitif du produit. E06 reste hors périmètre, et
  `PHASING.md` doit le dire.

  *Acceptation : filtrer ne perd aucune déclaration faite depuis l'ouverture,
  le compteur de l'écran dit sur quoi il porte, et vider le filtre rend la
  liste entière — jamais un état intermédiaire. Et `PHASING.md` inscrit que
  la recherche transverse d'E06 n'est pas en Phase 1, avec sa raison.*

## Les liens promis qui ne mènent nulle part

- [ ] **S4 — E05, la fiche de jeu.** (E05 · §3.2) Promise par E02 et par E03 :
  cliquer un jeu ne fait rien aujourd'hui. La fiche se lit en **deux couches,
  la personnelle d'abord** — « le produit est une biographie, pas une
  encyclopédie ». *Acceptation : depuis l'axe ou la liste, un jeu ouvre sa
  fiche ; elle montre ce que j'ai vécu avant ce que le référentiel sait ; et
  déclarer depuis la fiche produit les mêmes événements que la sélection
  massive — pas un second chemin d'écriture.*

- [ ] **S5 — Les trous sont des invitations.** (E03 · « Zone vide d'une
  période → E02 préfiltré sur cette période ») « C'est le mécanisme de
  relance le plus naturel du produit, et il ne coûte aucune notification. »
  Le lien E03 → E02 n'existe que dans un sens. *Acceptation : depuis une
  période de l'axe, on revient à la sélection avec CETTE période déjà posée,
  et le lot ouvert est un nouveau passage, pas la suite de l'ancien.*

## L'écran qui débloque ce qui est mort

> Trois capacités sont construites, testées, et **mesurément** sans
> producteur : corriger une date, le repli de précision (quatre granularités
> sur sept), et les avertissements causals de §5.4. E07 est la porte des
> trois. Il est découpé en trois items parce qu'il se livre par morceaux.

- [ ] **S6 — E07 ouvre en panneau et corrige la date.** (E07 · §5.3) « Panneau,
  jamais page : naviguer pour dater un souvenir puis revenir coûte deux
  transitions et fait perdre la position. » Et « la correction est banale :
  aucun avertissement ni confirmation ». *Acceptation : depuis l'axe, un
  moment s'ouvre sans quitter l'écran ; corriger sa date chaîne un nouvel
  événement et marque l'ancien (§5.3, journal en ajout seul) ; et une
  incohérence ainsi créée fait apparaître l'avertissement que F5 rend déjà —
  ce qui donne enfin un producteur à §5.4.*

- [ ] **S7 — E07 porte le repli de précision.** (E07 · `PHASING.md` §6)
  Referme ce que F14 a inscrit : mois, date exacte, « vers », âge et période
  ouverte. « Dix contrôles pour dater un souvenir » est l'anti-motif que la
  fiche corrige : trois choix visibles, le reste derrière « préciser ».
  *Acceptation : les sept granularités deviennent atteignables, le tableau de
  `PHASING.md` est mis à jour, et `CapacitesTemporellesTests` le vérifie ;
  l'âge ne s'offre qu'avec l'année de naissance, sans quoi il tombe dans le
  tiroir (§7.6).*

- [ ] **S8 — E07 corrige l'état.** (E07 · E02) « Changer d'avis plus tard
  relève d'E07 » : la sélection massive valide une fois par ligne, et rien ne
  permet de revenir. *Acceptation : achèvement, provenance et affect se
  corrigent depuis le panneau ; l'affect y devient saisissable pour la
  première fois (§4.7) ; et la correction passe par le domaine, qui sait déjà
  qu'un affect lève « jamais joué ».*

## Le garde qui empêche la liste de se reformer

- [ ] **S9 — Aucun lien promis ne mène nulle part.** Le défaut qui a produit
  cette liste est structurel : le graphe promet des écrans, et rien ne compare
  la promesse au livré. *Acceptation : un test lit la table des liens de
  `ecrans/PARCOURS-ET-LIENS.md` — sa source d'autorité — et exige que chaque
  destination soit **construite ou inscrite** dans `PHASING.md` avec sa phase.
  Comme pour les sept granularités : un écran ajouté demain fait échouer la
  suite jusqu'à ce que quelqu'un dise où il va.*

---

## Les décisions déjà prises, et où elles vivent

| Question | Tranché | Où c'est écrit |
|---|---|---|
| Le lot avant la session | **S1 + S2**, puis on teste | préambule, et la condition d'arrêt de la boucle |
| Les chiffres d'E04 contre le report de §24.4 | **deux promesses distinctes** : le report de F12 tient | S1 |
| Le quatrième chiffre, « à 100 % » étant impossible | **souvenirs écrits** | S1 |
| La recherche du périmètre | **un filtre dans la liste**, pas E06 | S3 |
| E07 avant ou après la session *(ex-D2)* | **après** — il attend le verdict des testeurs | préambule |

Rien n'attend donc de décision au moment d'écrire ces lignes. Un manque
découvert en chemin s'inscrit ci-dessous et attend son tour — ou une
question.

---

## Ce que le chemin a fait apparaître

Inscrit, pas construit — la boucle ne livre que ce que l'item dit.

- **Trois blocs ⑴ d'E04 restent absents** : la timeline condensée ⒞, les
  périodes d'activité ⒟ et « vos préférés » ⒠ bis sont marqués Phase 1 dans
  la fiche et n'existent pas. ⒞ est presque sans objet ici — la vraie
  timeline est juste en dessous —, ⒟ est « le bloc le plus immédiatement
  parlant de l'écran », et ⒠ bis attend que l'affect soit saisissable, ce
  qui est S8. La fiche porte désormais le tableau de ce qui en est livré.
- **« Proposer E02 » depuis un profil trop maigre n'existe pas.** L'état
  « trop maigre » d'E04 demande trois choses : la phrase, l'amorce de
  timeline, et une invitation à revenir saisir. Les deux premières sont
  tenues ; la troisième est une porte de navigation que la Phase 1 n'a nulle
  part — `/mon-histoire` est un cul-de-sac. C'est le même manque que S5, vu
  depuis l'autre écran.

- **Le visiteur qui revient rejoue l'accueil.** E01 annonce deux choses
  qu'aucune n'existe : la route `/` « redirige vers `/mon-histoire` si
  l'historique n'est pas vide », et l'état « retour d'un visiteur non
  authentifié » demande de « proposer de le reprendre plutôt que de
  recommencer ». Aujourd'hui, recharger la page remet tout le monde au
  temps 1. Ce n'est pas une perte de données — la base garde tout, et le
  parcours le vérifie —, c'est un détour imposé à chaque retour. Trouvé en
  rechargeant, pas en lisant.

---

## Journal

- **S1** — l'en-tête de `/mon-histoire` porte la phrase et les quatre
  chiffres. `ProfileProjection` (domaine) les calcule depuis le journal :
  « jeux déclarés » et « terminés » sont le dénominateur et le numérateur du
  taux de §6, réutilisés plutôt que recomptés ; « consoles » compte la
  plateforme **reçue** avec la déclaration ; « souvenirs écrits » remplace
  « à 100 % », que §4.6 a sorti du modèle — la fiche E04 le dit désormais.
  `GET /profile/{user}` n'envoie **pas** les chiffres sous le seuil du
  portrait plutôt que de compter sur l'écran pour les cacher : un défaut
  d'affichage ne peut alors pas faire fuiter un chiffre qui ment. Le seuil
  est celui de la fiche, et un test le compare à ce qu'elle écrit. La durée
  est **toujours** approchée — « ≈ » est dit —, parce que le premier moment
  *déclaré* n'est pas le premier moment *vécu* : l'approximation est dans la
  prémisse, pas seulement dans la granularité. La garde du registre est dans
  le navigateur et elle mesure : serif, chasse tabulaire, hiérarchie des
  corps, position au-dessus de l'axe, et « saisi d'un seul regard » sur les
  deux dispositions. Ce qui est laissé : les trois blocs ⑴ absents et le
  retour vers E02, inscrits ci-dessus.

- **S2** — le temps 3 d'E01 s'intercale entre la période et la liste, avec
  ses quatre éléments : la phrase qui nomme la décennie, la bande peinte à
  l'accent de son époque, l'aperçu de **vraies** jaquettes — quatre sur
  mobile, huit sur écran large — et la seule continuation qui compte.
  **Il ne demande rien** : les œuvres ont été lues au temps 1, la période
  vient d'être donnée, et le parcours l'exige en comptant les requêtes
  parties entre le clic et l'écran — zéro. L'aperçu **préfère** les œuvres
  qui ont une jaquette, sans retrier : l'ordre reste celui que l'API tient du
  score de notoriété, sans quoi le joueur ne retrouverait pas dans la liste
  les jeux qu'on vient de lui montrer. « Je ne sais plus » y mène aussi, sans
  bande : trois éléments plutôt qu'une date inventée. Et la récompense
  appartient à E01 : changer la période depuis la liste ne la rejoue pas.
  Le budget de gestes passe à `TITRES_A_COCHER + 24` — la continuation est un
  geste réel, et le cacher reviendrait à cacher ce que la décision coûte.
  Ce qui est laissé : la reprise du visiteur qui revient, inscrite ci-dessus.
