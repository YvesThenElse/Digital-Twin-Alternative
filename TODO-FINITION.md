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

- [x] **F5 — Les avertissements causals atteignent quelqu'un.** (audit 27 · §5.4) L'API les calcule et les rend ; le type du client ne déclare pas le champ, donc personne ne les voit. Ce sont des avertissements **doux** : ils informent, ils ne bloquent rien. *Acceptation : une incohérence déclarée — « fini » avant « commencé » — est visible sur l'axe, et rien n'est refusé à cause d'elle.*

- [x] **F6 — Une jaquette qui disparaît ne casse plus la tuile.** (audit 29 · §19.2) « Une jaquette reprise est un emprunt révocable : **rien dans le produit ne doit cesser de marcher le jour où elle disparaît** ». Le catalogue ne filtre qu'à l'amorçage ; retirée ensuite, l'image donne un glyphe cassé. *Acceptation : une source invalide se replie sur la tuile composée, et un test le prouve.*

- [x] **F7 — La sélection a un état vide.** (audit 33 · E02) `oeuvres.length === 0` donnerait une **page blanche**, qu'E02 interdit — « proposer d'élargir la période ou de changer de région, jamais une page blanche ». Latent aujourd'hui. *Acceptation : l'état vide propose une issue qui existe, et le crible des quatre états passe sur E02 comme il passe sur E01.*

- [x] **F8 — On peut changer de console.** (audit 34 · E02) Une fois la machine choisie, seul un rechargement ramène au choix. *E02 précise « période conservée » : à trancher en le faisant — revenir au choix de machine, ou changer de plateforme en gardant la période. Acceptation : un testeur qui se trompe de console s'en sort sans recharger.*

- [x] **F9 — `EtatDuService` est monté.** (audit 28) Composant écrit et testé, affiché nulle part — le même défaut que `ZoneSansDate` avant l'item 18 de la Phase 1. *À trancher en le faisant : un bandeau permanent dirait « tout va bien » en continu, ce que §5 ne demande pas ; à l'échec seulement, il risque de ne jamais s'afficher en test.*

## L'outillage, et les promesses non tenues

- [x] **F10 — Les contrôles hors ligne se lancent.** (audit 37) `CLAUDE.md` en présente trois comme lançables ; deux réclament des fichiers absents du dépôt, le troisième n'accepte qu'un répertoire courant précis. **Un garde documenté et non lançable fait croire le sujet couvert.** *Acceptation : chacun se lance depuis un dépôt neuf, ou la documentation dit ce qu'il lui faut.*

- [x] **F11 — Le contrat entre l'API et le client est vérifié.** (audit 35) `lire<T>` fait un `as T` : un champ ajouté, renommé ou rendu facultatif disparaît côté front **sans qu'aucun outil ne puisse le dire**. L'inventaire des omissions est écrit dans `client.ts`, et rien ne le vérifie. *Acceptation : un champ que l'API rend et que le client ne déclare pas fait échouer un test.*

## Tranché le 22 septembre 2026 — la boucle s'est arrêtée et a demandé

- [x] **F12 — La première console déclenche une phrase de récit.** (audit 30 · §24.4) **Décidé** : on construit **la phrase seule**. C'est la récompense la moins chère et la plus précoce — elle arrive dès la machine choisie, avant la liste —, et elle fait parler le produit de l'utilisateur au lieu de son propre compteur. Les **premières statistiques** sont **différées par écrit** : la bande d'époque les devance pendant la saisie, et E04/E10 les porteront mieux. *Acceptation : choisir une console produit une phrase qui parle de CETTE console et de rien d'autre, elle n'invente aucun chiffre, et le report des statistiques est écrit dans `PHASING.md` avec sa raison.*

- [x] **F13 — « Toujours en cours » est un jugement, pas un silence.** (audit 25 · §4.6) **Décidé** : on le **porte**. « J'y joue encore » est une vraie réponse, et elle sera fréquente sur les machines récentes ; la traiter comme une absence fait revenir la chip vierge et perdre ce que le testeur vient de dire. *Acceptation : `PlayDeclaration` porte l'achèvement déclaré, la migration existe, et la chip revient cochée après un rechargement — sans que « en cours » produise un événement, puisqu'il n'en est pas un.*

- [x] **F14 — Les capacités temporelles inatteignables sont inscrites.** (audit 21) **Décidé** : **différées**, pas offertes. La période ouverte et `Age` appartiennent à E07, qui est déjà différé ; les offrir au parcours d'amorce ajouterait une question que §24.4 déconseille. *Acceptation : `PHASING.md` dit lesquelles, où elles iront, et pourquoi elles ne sont pas dans le parcours — et un test le vérifie, ou le document est cité par celui qui les porte.*

- [x] **F15 — Le tiroir sans date entre dans une phase.** (audit 32) **Décidé** : **inscrit**, pas construit. Une session de Phase 2 est unique : la relance ne s'y joue pas, et un écran de plus à concevoir servirait un chemin qu'aucun testeur n'empruntera. *Acceptation : E14 — la passe temporelle — figure au TODO d'une phase avec sa raison, et `ecrans/E14` cesse d'être un écran que rien n'appelle.*

## Trouvé en chemin

- [ ] **F18 — L'affinage de période n'est atteignable que par une course.**
  Constaté en faisant F7 : le clic sur une carte de décennie **valide la
  période ET navigue**. Le panneau d'affinage n'apparaît donc que le temps
  des deux requêtes de relecture — sur une machine rapide, l'utilisateur
  perd la course. Le parcours de bout en bout ne le voit pas : Playwright
  clique plus vite qu'une main. *Acceptation : choisir une décennie montre
  l'affinage sans naviguer, et « quelque part dans les années 90 » —
  qui existe déjà — est ce qui continue.*

- [ ] **F17 — Aucun geste de Phase 1 ne produit d'incohérence causale.**
  Constaté en faisant F5 : le traducteur de lot fait de « terminé » un
  `StartedGame` **plus** un `CompletedGame`, à la même date — donc tout
  achèvement a toujours un début qui le précède ou l'accompagne. Les
  avertissements de §5.4 sont désormais rendus et testés, mais **rien dans
  le produit livré ne peut en déclencher un** : il faudra E07, qui corrige
  une date après coup. Ce n'est pas un défaut de F5 — c'est le même motif
  que les sept types d'événements sans producteur, et il vaut mieux l'écrire
  que de le laisser vert. *À trancher avec F12/F14 : offrir E07, ou inscrire
  ces capacités comme différées.*

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

- **F5** — le client déclare enfin `warnings`, et l'axe rend l'avertissement
  **sur le moment qu'il concerne** — celui dont la date contredit son propre
  prédécesseur. Le `message` de l'API reste ignoré, et c'est écrit au tableau
  des omissions : il nomme les types du domaine (« CompletedGame devrait
  précéder StartedGame »), ce que le principe 9 interdit à l'écran. L'écran
  refait donc sa phrase avec les mots qu'il emploie partout — « Joué »,
  « Fini » —, et elle dit d'emblée que rien n'a été changé. Ni rouge ni
  icône d'alerte : §5.4 veut un avertissement doux, et le joueur n'a rien
  fait de mal. Ce qui est laissé : **le parcours ne peut pas en produire un**
  — voir F17 —, donc la garde est au niveau du composant et de l'assemblage,
  pas dans le navigateur.

- **F6** — la tuile retient l'**adresse** qui a échoué, pas le fait d'avoir
  échoué : retenir « cette tuile est cassée » priverait le joueur d'une
  jaquette valide dès que la liste change sous elle, et ne rien retenir
  referait la requête à chaque rendu sur 218 tuiles. Le repli garde le
  format et l'accent — sans quoi la grille paraîtrait rapiécée là où elle
  devrait seulement changer d'origine. La garde est **dans le navigateur** :
  le parcours révoque une jaquette au niveau du réseau, ce qu'aucun test de
  composant ne peut faire — jsdom ne demande aucune image, et un navigateur
  n'échoue pas sur une image cassée, il dessine un glyphe et se tait.

- **F7** — les quatre états de §5 sont sur E02 comme sur E01. Le **vide** ne
  propose que des issues qui existent : ni « élargir la période » (elle ne
  filtre pas cette liste) ni « changer de région » (c'est une hypothèse posée
  une fois, PROTOCOLE §2) — mais recharger, et saisir soi-même. Le
  **chargement** est un squelette de la structure attendue, jamais un
  spinner, et sa hauteur est mesurée **dans le navigateur** : huit lignes
  sans feuille de style font huit éléments de hauteur zéro qu'un test de
  composant compterait avec satisfaction. L'**échec** dit ce qui a échoué, ce
  qui est conservé et quoi faire, à la place de la liste — et un réessai s'y
  trouve. Le **partiel** ne signale rien : c'est l'état normal du produit.
  Deux corrections de cycle de vie sont venues avec : l'écran est remonté
  quand la relecture arrive, et le `batchId` a quitté le composant pour le
  parcours — sinon un rechargement ouvrait un second épisode. Ce qui est
  laissé : l'état de chargement à l'**entrée** dans l'écran n'existe pas ;
  l'attente s'y joue encore sur l'écran de période, faute de pouvoir ouvrir
  E02 plus tôt sans casser l'affinage (voir F18).

- **F8** — tranché en le faisant : le bandeau ramène au choix de machine, et
  **la période survit** (E02 : « période conservée ») — on ne redemande pas
  une réponse déjà donnée sur l'écran où chaque geste compte. Elle ne survit
  que si elle reste **possible** sur la nouvelle console : garder
  « 1990–1994 » sur une machine de 2017 conduirait au refus de l'API au
  premier lot, c'est-à-dire APRÈS avoir coché. La règle reste celle de la
  couche qui écrit ; `periodeTenable` la répète plus tôt, et compare la borne
  la plus tardive — une période qui chevauche la sortie reste tenable, et
  « je ne sais plus » n'oppose aucune borne. Le parcours se trompe désormais
  de console pour de bon, et s'en sort en deux gestes.

- **F9** — tranché en le faisant : le bandeau **ne paraît qu'à la panne**, en
  pied d'écran, et il répond à la seule question que l'alerte d'un geste ne
  tranche pas — est-ce moi, ou est-ce le service ? Un bandeau permanent
  dirait « tout va bien » en continu ; on cesse de lire ce qui ne dit jamais
  rien, y compris le jour où il devient rouge. **Deux de ses trois états ont
  donc été retirés**, pas gardés en réserve : « disponible » et « pas encore
  su » n'avaient aucun producteur, et c'est précisément ce que l'audit
  reprochait à ce composant. Leurs deux libellés sont partis avec — le garde
  des libellés morts l'aurait exigé. `/health` est demandé **après** un
  échec, jamais en continu, et le diagnostic s'efface dès que le geste
  suivant aboutit. La visibilité est mesurée dans le navigateur : « signalé
  discrètement » n'est pas « invisible ».

- **F10** — les quatre résolvent leurs chemins depuis leur propre fichier et
  se lancent de n'importe où ; `./controles.sh` les enchaîne. Vérifié depuis
  un **dépôt fraîchement cloné** et depuis `/tmp`, pas seulement relu. Deux
  constats en chemin : les deux fichiers de données que l'audit croyait
  absents **sont versionnés** — seul le répertoire courant bloquait —, et
  c'est le contrôle annoncé comme « lançable partout » qui ne l'était pas :
  les 218 jaquettes ne sont pas dans le dépôt, délibérément. Il rend
  désormais **2**, « je n'ai pas pu », distinct de **1**, « j'ai trouvé une
  faute » — avec `0`, la commande d'ensemble annonçait « les quatre
  contrôles passent » sans avoir lu un seul fichier. Vérifié en l'essayant.

- **F11** — `CONTRAT-API.json` est à la racine, parce qu'il doit se lire des
  **deux** côtés : `ContratApiTests` confronte les champs réellement rendus
  par les dix points d'entrée, `contrat.test.ts` exige que chaque champ
  annoncé comme lu soit nommé dans le front et que chaque omission porte sa
  raison. Le contrat a trouvé **quatre champs** que `POST /declarations` rend
  et que personne n'avait inscrits — le front les jetait en silence depuis la
  Phase 1 — et un champ déclaré côté front que personne ne lit
  (`confidence` sur un moment), retiré. Ce qui est laissé : le contrat porte
  sur des **noms**, pas sur des types ; une chaîne qui deviendrait un nombre
  lui échapperait, et la dérive de type connue (`launchYear`) reste gardée
  ailleurs. Et la moitié « aucun champ ignoré n'est lu » a été **retirée**
  plutôt qu'aménagée : `batchId` et `targetId` sont aussi des champs de
  requête, et une garde qui ne tient qu'à coups d'exceptions ne garde rien.

- **F12** — la phrase arrive **dès la console choisie**, avant la période et
  avant la liste : plus tard, elle ne récompenserait plus rien, la liste
  étant déjà la récompense. Elle nomme CETTE console, et le seul chiffre
  qu'elle porte est un fait du référentiel — l'année de la machine, jamais
  une date du joueur : « votre histoire commence en 1990 » affirmerait ce
  que personne n'a donné. Elle ne confirme rien (E01 : « ce n'est pas une
  confirmation, c'est un cadeau ») et disparaît en entrant dans la liste,
  où le contexte de saisie dit la machine mieux et à sa place. Son registre
  est **mesuré dans le navigateur** : la serif du langage visuel §4, réservée
  au récit et interdite à l'interface courante, et le filet d'époque peint.
  Les premières statistiques sont reportées en Phase 3 dans `PHASING.md`,
  avec leur raison — ce n'est pas le coût, c'est que la bande d'époque les
  devance pendant la saisie.

- **F13** — porté comme **jugement sans date**, ce que `PlayDeclaration`
  existe pour ça. Ni un type d'événement — le domaine l'interdit, et il a
  raison : la position cesserait d'être une absence pour devenir un état à
  maintenir — ni le silence. La distinction qui tranche : **un jeu coché et
  un jeu déclaré « en cours » produisent exactement les mêmes événements**,
  donc aucune projection ne peut les séparer. Il lève « jamais joué »
  (invariant 10), il est effacé par « jamais joué » (invariant 8), et une
  **fermeture datée le referme** — sans quoi « fini » laisserait « en cours »
  derrière lui. Le jugement est désormais **rendu** par
  `GET /declarations/{user}` : l'état relu laisse l'événement daté le
  masquer, donc une fermeture manquée y serait restée invisible jusqu'en
  Phase 3. Le parcours le pose sur une ligne, recharge, et vérifie qu'il
  revient — pendant qu'une ligne voisine, qui n'a rien dit, reste vierge.

- **F14** — `PHASING.md` porte un tableau des **sept** granularités : ce qui
  les produit, ou le fait qu'aucun geste ne les produise, et où elles iront
  (E07). L'item n'en nommait que deux ; le tableau en trouve **trois** sans
  producteur — `ApproximateYear`, `Month`, `ExactDate` — plus `Age` et la
  période ouverte à l'intérieur de `YearRange`. Et il ne s'agit pas d'un
  paragraphe de plus : `CapacitesTemporellesTests` demande l'ensemble à sa
  **source d'autorité** — la hiérarchie scellée, par réflexion — et le
  compare au tableau. Une huitième variante ajoutée demain fera échouer la
  suite jusqu'à ce que quelqu'un dise où elle va. Deux témoins gardent le
  garde : sept variantes trouvées, et un tableau réellement lu — sans eux, un
  ensemble vide passerait pour une garantie.

- **F15** — E14 a **deux entrants**, et ils n'arrivent pas dans la même
  phase : l'import (E13) était déjà décrit en Phase 4, le **tiroir** (E03) ne
  l'était nulle part. Il est inscrit en Phase 3, avec sa raison — une session
  de test de Phase 2 est unique, la relance ne s'y joue pas, et le tiroir
  prend son sens quand un profil dure. `PasseTemporelleTests` lit les portes
  dans la fiche elle-même et exige que le plan les situe : une porte
  qu'aucune phase ne prévoit est une porte qui n'existera jamais. Trois
  témoins, dont un qui vérifie qu'une **sortie** n'est pas prise pour une
  entrée.
