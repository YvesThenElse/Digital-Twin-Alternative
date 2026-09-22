# Finition — rendre le POC montrable

> Suite de [`TODO-AUDIT.md`](./TODO-AUDIT.md), dont les items ouverts sont
> repris ici **dans l'ordre où ils comptent** : ce qui bloque un testeur
> d'abord, la perte de richesse ensuite, l'outillage en dernier.
>
> Le verdict du 22 septembre 2026 tenait à quatre blocages. **Ils sont tous
> levés** — l'apparence, la grille qui rend enfin une grille, le moment qui
> dit ce qu'il est, la correction qui tient, le souvenir qui arrive sur
> l'axe, et la région, assumée par écrit plutôt qu'en silence. Ce qui suit
> enrichit le profil sans conditionner la session.
>
> La méthode est dans [`BOUCLE-FINITION.md`](./BOUCLE-FINITION.md).

## Ce qui bloque encore un test utilisateur

- [x] **F1 — Le souvenir atteint la timeline.** (audit 39 · §9.1, §9.2) **Décidé** : un **titre court** sert de repère sur l'axe, le texte complet s'ouvre au clic. §9.1 fait de cette section le porteur direct du « oui, ça me ressemble » — c'est-à-dire du critère de la porte. *Acceptation : `MemoryRow` porte un titre facultatif, l'API l'accepte et le rend, l'écran de sélection le propose sans l'imposer, et le parcours de bout en bout lit ce repère sur l'axe.*

- [x] **F2 — La région est assumée, et écrite.** (audit 18 · §3.4) **Décidé** : on garde `PAL` pour les premiers testeurs, qui seront européens, et on l'inscrit comme **hypothèse explicite** dans `PROTOCOLE-DE-TEST.md` — avec le critère de recrutement qui en découle et ce qu'il faudra faire le jour où un testeur ne l'est pas. *Acceptation : l'hypothèse est écrite là où elle sera lue, et un test échoue si une région littérale apparaît ailleurs que dans `App.tsx`.*

## Ce qui appauvrit le profil sans l'empêcher

- [x] **F3 — « Jamais joué » est saisissable et relu.** (audit 23 · §24.3) L'API l'accepte depuis la Phase 1, l'état le rend, **aucun geste ne le pose et aucun rendu ne le montre**. E02 le décrit : balayage à gauche sur mobile, `X` au survol sur desktop, icône « cercle barré » — déjà dessinée. *Acceptation : le geste pose la déclaration, elle se relit distinctement d'un titre non coché, et elle n'est jamais présentée comme un abandon (§6 des principes).*

- [x] **F4 — Les titres saisis sont relus.** (audit 24 · §3.5) Une revendication ajoutée disparaît de la sélection au rechargement tout en restant sur la timeline. **Le moyen existe déjà et n'est jamais appelé** : `GET /unresolved/{user}`. *Acceptation : un titre saisi revient à l'écran après rechargement, marqué comme tel, avec son souvenir.*

- [ ] **F5 — Les avertissements causals atteignent quelqu'un.** (audit 27 · §5.4) L'API les calcule et les rend ; le type du client ne déclare pas le champ, donc personne ne les voit. Ce sont des avertissements **doux** : ils informent, ils ne bloquent rien. *Acceptation : une incohérence déclarée — « fini » avant « commencé » — est visible sur l'axe, et rien n'est refusé à cause d'elle.*

- [ ] **F6 — Une jaquette qui disparaît ne casse plus la tuile.** (audit 29 · §19.2) « Une jaquette reprise est un emprunt révocable : **rien dans le produit ne doit cesser de marcher le jour où elle disparaît** ». Le catalogue ne filtre qu'à l'amorçage ; retirée ensuite, l'image donne un glyphe cassé. *Acceptation : une source invalide se replie sur la tuile composée, et un test le prouve.*

- [ ] **F7 — La sélection a un état vide.** (audit 33 · E02) `oeuvres.length === 0` donnerait une **page blanche**, qu'E02 interdit — « proposer d'élargir la période ou de changer de région, jamais une page blanche ». Latent aujourd'hui. *Acceptation : l'état vide propose une issue qui existe, et le crible des quatre états passe sur E02 comme il passe sur E01.*

- [ ] **F8 — On peut changer de console.** (audit 34 · E02) Une fois la machine choisie, seul un rechargement ramène au choix. *E02 précise « période conservée » : à trancher en le faisant — revenir au choix de machine, ou changer de plateforme en gardant la période. Acceptation : un testeur qui se trompe de console s'en sort sans recharger.*

- [ ] **F9 — `EtatDuService` est monté.** (audit 28) Composant écrit et testé, affiché nulle part — le même défaut que `ZoneSansDate` avant l'item 18 de la Phase 1. *À trancher en le faisant : un bandeau permanent dirait « tout va bien » en continu, ce que §5 ne demande pas ; à l'échec seulement, il risque de ne jamais s'afficher en test.*

## L'outillage, et les promesses non tenues

- [ ] **F10 — Les contrôles hors ligne se lancent.** (audit 37) `CLAUDE.md` en présente trois comme lançables ; deux réclament des fichiers absents du dépôt, le troisième n'accepte qu'un répertoire courant précis. **Un garde documenté et non lançable fait croire le sujet couvert.** *Acceptation : chacun se lance depuis un dépôt neuf, ou la documentation dit ce qu'il lui faut.*

- [ ] **F11 — Le contrat entre l'API et le client est vérifié.** (audit 35) `lire<T>` fait un `as T` : un champ ajouté, renommé ou rendu facultatif disparaît côté front **sans qu'aucun outil ne puisse le dire**. L'inventaire des omissions est écrit dans `client.ts`, et rien ne le vérifie. *Acceptation : un champ que l'API rend et que le client ne déclare pas fait échouer un test.*

## Ce qui attend une décision — la boucle s'arrête et demande

- [ ] **F12 — Les deux autres récompenses de §24.4.** (audit 30) « Les premières statistiques apparaissent après quelques jeux » et « la première console saisie déclenche déjà une phrase de récit » ne sont ni construites ni différées par écrit. §24.4 est la réponse au risque produit numéro un.

- [ ] **F13 — « Toujours en cours ».** (audit 25 · §4.6) L'écran l'offre, le traducteur le traite comme une absence de réponse : la chip revient vierge au rechargement. Le porter comme jugement permanent — `PlayDeclaration` n'a pas de champ d'achèvement — ou cesser de l'offrir.

- [ ] **F14 — Les capacités temporelles inatteignables.** (audit 21) La période **ouverte** — rendue « depuis 1994 », acceptée par l'API, qu'aucun geste ne produit — et **`Age` tout entier**, sa résolution et le paramètre `birthYear`. Les offrir, ou les inscrire comme différées.

- [ ] **F15 — Le tiroir sans date est une tâche, pas une poubelle.** (audit 32) « Dimensionné pour être vidé — la relance de session la moins coûteuse du produit » : il n'accepte aucun geste. C'est E14, la passe temporelle, et elle n'est inscrite dans aucun TODO de phase.

## Trouvé en chemin

- [ ] **F16 — Une construction du front qui échoue s'arrête en silence.**
  `services_front` fait `./web.sh build >/dev/null` : une erreur de
  typage fait sortir `e2e.sh` avec le code 1 **sans une ligne d'explication**,
  après avoir affiché « ── front ». Trouvé en F3, en croyant à une panne du
  parcours. C'est la famille de F10 : un outillage qui échoue sans le dire
  fait chercher le défaut ailleurs. *Acceptation : une construction qui
  échoue nomme ce qui a échoué.*

---

## Journal

- **F1** — `MemoryRow.Title`, nullable et borné à 80 caractères par la
  colonne autant que par le point d'entrée ; `POST /memories` accepte le
  couple entier, `GET /memories/{user}` le rend, et `/timeline/{user}` joint
  le souvenir de chaque cible sur ses moments — par le couple **genre +
  identifiant**, jamais l'identifiant seul. L'écran de sélection propose le
  repère **sous** la phrase et ne l'impose pas : une phrase seule part comme
  avant, un repère seul ne part pas. L'axe le rend **une fois par cible** —
  un jeu affiné porte trois moments et une seule phrase — et ouvre le texte
  complet au clic. Ce qui est laissé : le souvenir n'est pas éditable depuis
  la timeline (c'est E07, différé), et le tiroir sans date le transporte
  côté API sans le montrer (F15).

- **F2** — l'hypothèse est écrite dans `PROTOCOLE-DE-TEST.md` §2, au
  recrutement : ce qu'elle engage, la question à poser avant la session, ce
  qu'on fait d'un testeur non européen, et le symptôme qui l'imputerait au
  produit — « je ne reconnais pas ces jeux », c'est-à-dire le verdict même
  de la porte. `region/region-assumee.test.ts` garde la moitié que la prose
  ne peut pas garder : un code de région écrit ailleurs que dans `App.tsx`
  fait échouer la suite, et le garde a ses témoins — dont un qui exige que
  la décision soit **toujours** dans `App.tsx`, faute de quoi l'exemption ne
  protégerait plus rien. `WORLDWIDE` n'est pas policé : c'est l'absence de
  zonage, un fait du dataset. Ce qui est laissé : aucun écran ne demande sa
  région au joueur, et le profil ne l'enregistre pas (Phase 3).

- **F3** — deux gestes, un par disposition, parce que E02 les sépare et
  qu'ils ne sont pas interchangeables : **balayage vers la gauche** au pouce
  (seuil de 48 px, horizontal dominant, et le clic que le navigateur en tire
  est étouffé), **bouton révélé au survol et au focus** à la souris et au
  clavier. La ligne s'estompe sans disparaître, porte le cercle barré — et
  jamais la marque de l'abandon —, ne compte pas dans la bande, et se relit
  à l'ouverture. Elle se retire du même geste, ou d'un tap, qui ramène au
  **silence** plutôt qu'à « joué » : l'invariant 8 interdit les deux
  ensemble, et « pas prononcé » doit rester atteignable. Marquer une ligne
  déjà cochée retire d'abord la déclaration. `touch-action: pan-y` sur la
  ligne : sans lui, le navigateur annule le pointeur au premier mouvement
  latéral et le geste n'atteint jamais l'application — le parcours mobile le
  prouve, par un vrai toucher. Ce qui est laissé : corriger « jamais joué »
  en « joué » demande deux gestes, et c'est voulu.

- **F4** — `GET /unresolved/{user}` est enfin appelé. Le filtrage par
  plateforme est **dans le client** : le point d'entrée rend le profil
  entier, et c'est ce qu'il doit faire — la timeline les traverse toutes.
  Les revendications déjà rattachées sont écartées, sans quoi le même jeu
  s'afficherait deux fois, dont une marquée « hors du référentiel ». Le
  titre relu porte l'identifiant de sa revendication, ce qui lui rend son
  souvenir d'emblée, et il compte dans la bande — un recul d'une visite à
  l'autre se lit comme une perte. `client.souvenirs` ne filtre plus les
  cibles : les titres saisis ont désormais une ligne où les afficher. Ce qui
  est laissé : l'état de passe 2 d'un titre saisi n'est pas relu — l'API ne
  le rend que pour les œuvres.
