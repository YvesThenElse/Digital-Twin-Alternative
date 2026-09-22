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
du périmètre n'ont jamais été livrées. **S1 et S2 devraient précéder la
session** : ce sont la récompense (§24.4) et l'écran dont l'objectif *est* la
porte — « produire le moment "oui, ça me ressemble" ». Mesurer la porte sur
un écran à moitié construit mesurerait autre chose.

Le reste — E05, E06, E07 — peut attendre ce que la session dira.

---

## Ce que le périmètre de la Phase 1 promet et que personne n'a livré

- [ ] **S1 — `/mon-histoire` porte sa synthèse.** (E04 fusionné, blocs ⑴ ·
  `PHASING.md` §4 « page de profil simple », « quelques statistiques ») E04
  dit lui-même que sa synthèse « forme l'en-tête de `/mon-histoire`, au-dessus
  de la timeline » **dès la Phase 1**, et son objectif est la porte dure :
  « produire le moment *oui, ça me ressemble* ». Cinq blocs y sont marqués
  Phase 1 — la phrase, les chiffres, la timeline condensée, les périodes
  d'activité, les préférés. *Acceptation : l'en-tête porte la phrase en
  display serif et des chiffres qui ne mentent pas sur un profil vide ou
  maigre ; il ne devient pas un tableau de bord (densité faible, principe 3) ;
  et ce qu'il affiche vient du domaine, jamais d'un recompte de l'écran.*
  ⚠️ **Contredit le report écrit en F12** — voir la section de décision.

- [ ] **S2 — E01 a son troisième temps.** (E01 · §24.4) « Dès la validation
  du temps 2, sans transition ni chargement bloquant : une phrase, une bande
  sur un axe, un aperçu visuel des jeux à venir, une continuation. » Seule la
  phrase existe (F12). L'aperçu « n'est pas décoratif : il montre concrètement
  ce que la suite propose, ce qui augmente le passage vers E02 » — et c'est
  l'écran où se joue le KPI *median time to first meaningful profile*.
  *Acceptation : le temps 3 rend les quatre éléments, l'aperçu montre de
  vraies jaquettes de la plateforme choisie, et le parcours mesure qu'il
  n'attend aucun chargement.*

- [ ] **S3 — La recherche, ou son retrait écrit.** (`PHASING.md` §4, E06)
  « Recherche d'un jeu ou d'une console » est au périmètre et n'existe pas.
  La saisie libre de §3.5 en tient lieu pour un titre absent, mais pas pour
  retrouver un titre **présent** dans une liste de 221. *Acceptation : soit
  un filtre dans la liste (E02 repère B le prévoit déjà), soit une ligne dans
  `PHASING.md` disant pourquoi le périmètre se réduit — et un test qui
  échouerait si la promesse revenait sans son écran.*

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

## Ce qui attend une décision — la boucle s'arrête et demande

- [ ] **D1 — Les chiffres de S1 contre le report de F12.** Il y a une heure,
  « les premières statistiques apparaissent après quelques jeux » a été
  **différé par écrit** en Phase 3, au motif que la bande d'époque les devance
  pendant la saisie. Mais E04 place « quatre chiffres, pas douze » en Phase 1,
  et ce n'est pas la même promesse : l'une est une récompense **pendant** la
  saisie, l'autre un **portrait après**. Les deux lectures se défendent, et
  l'une des deux décisions doit être réécrite.

- [ ] **D2 — E07 avant ou après la session de test.** Le verdict de sortie
  autorise la Phase 2. E07 a été inscrit en Phase 3. Le construire maintenant
  débloque trois capacités mortes et rend la correction possible ; le
  reporter fait mesurer le produit tel qu'un testeur le recevrait vraiment —
  et PHASING §11 rappelle que si la porte se ferme, la réponse est d'itérer
  sur la Phase 1, pas d'avancer.

---

## Journal
