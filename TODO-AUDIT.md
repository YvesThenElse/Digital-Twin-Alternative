# Audit des surfaces — avant de recevoir des testeurs

> Le crible et la méthode sont dans [`BOUCLE-AUDIT.md`](./BOUCLE-AUDIT.md).
> Trois questions par surface : **envoyé sans être saisi**, **rendu sans être
> lu**, **écrit sans être dit** — plus la question de contrôle : *quel test
> échouerait si le défaut revenait ?*
>
> Un item se coche avec ses **trois réponses**, fichier et ligne à l'appui.
> « Rien à signaler » sans preuve est exactement ce qui a laissé passer la
> période figée, la relecture absente et l'affect fabriqué.

## Les écrans du parcours

Ils viennent en premier : un testeur les traverse dans cet ordre, et un
défaut sur l'un d'eux arrête tout ce qui suit.

- [x] **01 — Le choix de la machine.** `App.tsx`, étape `machine`. Cite : `ecrans/E01-accueil-onboarding.md`, §3.3. *En particulier : la région est décidée ici (`regionFree ? WORLDWIDE : PAL`) — est-ce un choix de l'utilisateur, une donnée du référentiel, ou une constante qui décide en silence du marché d'un joueur ?*

  **1 · Envoyé sans être saisi — DÉFAUT.** `web/src/App.tsx:59` initialise `region` à `"PAL"`, et `:84` la recalcule en `p.regionFree ? "WORLDWIDE" : "PAL"`. **Aucun geste de l'utilisateur n'entre là.** §3.4 est pourtant explicite : « la sélection massive n'a de sens que si elle présente la bibliothèque qu'a réellement vue l'utilisateur — un joueur PAL et un joueur NTSC-J n'ont pas connu le même catalogue SNES ». Un testeur japonais ou américain se voit donc annoncer des statuts de sortie européens, sur l'écran dont toute la mécanique repose sur la reconnaissance. → **item 18**.

  **2 · Rendu sans être lu — DÉFAUT.** `/platforms` rend `worksCount` (`ReferenceEndpoints.cs:13`), le client le traduit (`api/client.ts:86`), le type le porte (`selection/types.ts:33`) — et **aucun composant ne l'affiche**. E02 repère B le spécifie pourtant : « 147 jeux · 12 déclarés ». Un champ calculé, transporté sur trois couches et jeté au bout. `launchYear`, lui, est bien lu (`ChoixPeriode.tsx:37`). → **item 19**.

  **3 · Écrit sans être dit — RIEN.** Cet écran ne persiste rien : `chargerOeuvres` (`App.tsx:76`) ne fait que des lectures, et `client.declarer` n'envoie jamais la région (`api/client.ts`, aucun champ `region` dans le corps). Conséquence à noter sans la corriger ici : **la région n'est nulle part enregistrée**, donc un profil ne peut pas dire de quel marché vient le joueur — ce sera à trancher quand le profil deviendra un livrable (Phase 3).

  **Contrôle — quel test échouerait ?** Aucun, pour les deux défauts. Le second est même protégé à l'envers : `ReferentielTests` vérifie que `worksCount` est juste, ce qui rend le champ *correct* et *invisible*. Les tests de garde viendront avec les items 18 et 19.

- [x] **02 — Le choix de la période.** `periode/ChoixPeriode.tsx`, `periode/periode.ts`. Cite : §24.3, §7.3, `ecrans/00-principes-transverses.md` §3. *Refait à l'item 21 — le crible doit le confirmer, et couvrir ce que la réparation n'a pas touché : les bornes proposées, le refus motivé, et l'absence de `ApproximateYear` alors que §24.3 parle d'une période **approximative**.*

  **1 · Envoyé sans être saisi — RIEN, mais deux constantes sans source.** Toute valeur transmise vient d'une saisie ou d'une suggestion **affichée et modifiable** : `ChoixPeriode.tsx:82` pour l'année, `:105` pour les bornes, `:88` pour « je ne sais plus ». Rien n'est envoyé à l'insu de l'utilisateur — c'est bien le défaut de l'item 21 qui est refermé. En revanche les décalages `+2` (`:37`) et `+5` (`:42`) ne viennent de nulle part : ce sont des chiffres que j'ai choisis, là où `MODELE-DE-DOMAINE.md:107` prescrit une **fenêtre commerciale `from`/`to` par région**. → **item 20**.

  **2 · Rendu sans être lu — RIEN dans le code, un manque dans les données.** `ChoixPeriode` reçoit `machine` et lit `nom` (`:50`) et `launchYear` (`:37`, `:41`, `:42`, `:48`, `:51`) ; il n'y a rien d'autre à lire, car `dataset/poc.json` ne porte que `launch_year` — pas de fin de commercialisation, pas de fenêtre par région. **La donnée que le modèle prescrit n'existe pas.** Par ailleurs `PeriodeChoisie` (`periode/periode.ts:16`) ne peut exprimer ni `ApproximateYear` — différé au repli d'E07, c'est écrit — ni une **période ouverte** (`To = null`), que `PeriodInput.cs:55` accepte et que `valeur.ts:95` rend « depuis 1994 ». → **item 21**.

  **3 · Écrit sans être dit — UN RISQUE, pas un mensonge.** La période est persistée sur chaque événement du lot. Accepter la suggestion sans la toucher écrit un `Year` **exact**, dont la confiance dérivée vaut « moyenne » — une précision que l'utilisateur n'a pas affirmée. E01 appelle cela une granularité malhonnête : « personne ne se souvient de l'année exacte de sa première console », et y répond par des **cartes de décennie**, dont un `Range` est « une réponse parfaitement valide ». `SPECIFICATION.md:311` nomme l'anti-motif : « le référentiel travaille pour l'utilisateur au lieu de lui poser une **question nue** ». L'écran pose une question nue. → **item 20**.

  **Contrôle — quel test échouerait ?** Pour le défaut refermé hier, oui : onze tests de composant et le parcours assèrent que les valeurs saisies arrivent sur l'axe, et trois mutations l'ont confirmé. Pour la divergence de §7.3, aucun — elle n'est encodée nulle part.

- [x] **03 — La sélection massive, passe 1.** `selection/SelectionMassive.tsx` (déclaration, bande, région). Cite : `ecrans/E02-selection-massive.md`, §24.3, §24.4, §3.4. *L'écran le plus dense du produit, et celui dont tout le budget d'interaction dépend.*

  **1 · Envoyé sans être saisi — RIEN.** Tout ce que l'écran transmet vient d'un geste : l'œuvre cochée (`SelectionMassive.tsx:284`), l'identifiant de lot (`:172`, frappé une fois par passage — un identifiant, pas une réponse), la période et la plateforme venant de l'appelant. Le tri par notoriété (`:305`) lit `rang`, donnée du référentiel, comme §3.3 l'exige.

  **2 · Rendu sans être lu — DÉFAUT.** `EtatLigne` porte `neverPlayed` (`:65`), l'API le rend, et **rien ne le lit** : la réhydratation ne consomme que `played` (`:180`), `completion` et `provenance` (`:186`). Un titre déclaré « jamais joué » revient donc à l'écran **indiscernable d'un titre non coché** — c'est-à-dire exactement la distinction que §24.3 existe pour tenir : « il ne l'a pas joué » contre « il ne s'est pas prononcé ». → **item 23**.

  **3 · Écrit sans être dit — L'INVERSE, et c'est le plus grave : DIT SANS ÊTRE ÉCRIT.** `basculer` (`:272`) envoie la déclaration quand on coche, et **retourne sans rien envoyer quand on décoche** (`:282`). E02 l'interdit en toutes lettres : « aucune sauvegarde explicite — **chaque bascule est persistée immédiatement** ». La correction reste dans le navigateur. Le dépôt note lui-même que « se tromper de ligne est le geste le plus fréquent de cet écran » : c'est donc le geste le plus courant qui ne survit pas. Et depuis que l'écran relit son état (item 22), le mensonge est **visible** — on décoche, on recharge, la ligne revient. → **item 22**.

  **Contrôle — quel test échouerait ?** Aucun, et pire : un test s'appelait « décocher rétrécit la bande — **la déclaration est révisable** » en n'assérant qu'un compteur local. Il **affirmait** la capacité manquante. Renommé, et l'absence d'envoi y est désormais épinglée avec le numéro d'item : le jour où la rétractation existera, ce test échouera.

- [ ] **04 — La sélection massive, passe 2 et titres libres.** Même fichier : chips, saisie libre, souvenir. Cite : E02, §3.5, §9, §4.5 à §4.8. *Quatre questions sont spécifiées, deux sont montées — vérifier que les deux absentes ne laissent aucune trace qui prétende le contraire.*

- [ ] **05 — La timeline.** `timeline/Timeline.tsx`, `timeline/types.ts`. Cite : `ecrans/E03-timeline.md`, §7.5, `ORDONNANCEMENT-TEMPOREL.md`. *Défaut déjà connu à confirmer ou infirmer : un jeu affiné apparaît trois fois, le même titre à la même date.*

- [ ] **06 — L'assemblage du parcours.** `App.tsx` dans son ensemble : états, transitions, profil, disposition. Cite : `ecrans/PARCOURS-ET-LIENS.md`, `ecrans/PLAN-DU-SITE.md`. *C'est là que vivent les valeurs qui traversent les écrans sans appartenir à aucun.*

## Les composants de rendu

Ils ne transmettent rien, mais ils **affirment** — et un rendu qui invente
est aussi coûteux qu'un champ qui ment.

- [ ] **07 — La tuile et les époques.** `disposition/Tuile.tsx`, `disposition/epoque.ts`. Cite : `ecrans/00-langage-visuel.md` §3 et §7, §19.2. *Une jaquette absente doit se rendre par une tuile composée, jamais par un trou.*

- [ ] **08 — Le statut régional.** `region/StatutRegional.tsx`, `region/statut.ts`. Cite : §3.4, `dataset/README.md`. *Quatre états, dont 22 non-sorties arbitrées et 32 inconnues. Aucun ne doit se rendre par l'absence d'indication.*

- [ ] **09 — La bande d'époque.** `selection/BandeDEpoque.tsx`, `selection/bande.ts`. Cite : §24.4, langage visuel §7. *La récompense pendant la saisie. Ce qu'elle compte doit être ce que l'utilisateur croit avoir fait.*

- [ ] **10 — La zone sans date et le rendu temporel.** `temporel/ZoneSansDate.tsx`, `temporel/valeur.ts`. Cite : §7.3, `ORDONNANCEMENT-TEMPOREL.md` §6. *Les sept granularités, et les trois interdits.*

- [ ] **11 — Le contexte de saisie et l'état du service.** `periode/ContexteDeSaisie.tsx`, `EtatDuService.tsx`. Cite : E02 repère A, `ecrans/00-principes-transverses.md` §5. *Les quatre états obligatoires — vide, partiel, chargement, erreur — sont-ils rendus, ou seulement les deux faciles ?*

## Les frontières

Deux défauts sur trois se sont logés là où deux couches se rencontrent et où
chacune avait raison séparément.

- [ ] **12 — Le client HTTP.** `api/client.ts`. Cite : les points d'entrée de l'API. *Chaque champ rendu par l'API est-il traduit, ou jeté ? Chaque champ envoyé vient-il de l'écran ?*

- [ ] **13 — Le catalogue et les jaquettes.** `Reference/ReferenceEndpoints.cs`, `Reference/CoverEndpoints.cs`, `Reference/ReferenceCatalogSource.cs`. Cite : §3.3, §3.4, §19.2. *Le manifeste enregistre une acquisition, pas une présence.*

- [ ] **14 — Les déclarations et l'état relu.** `Selection/DeclarationEndpoints.cs`, `Selection/DeclarationBatch.cs`, `Selection/PeriodInput.cs`. Cite : §24.3, §3.5, `MODELE-DE-DOMAINE.md` §12. *Le vocabulaire diffère entre `/declarations/{userId}` (« Owned ») et `/selection` (« owned ») — écart déjà relevé, à trancher.*

- [ ] **15 — La persistance.** `Persistence/*Row.cs`, `*Mapping.cs`, `EventStore.cs`. Cite : `MODELE-DE-DOMAINE.md`, §5, §10.1. *Chaque **valeur par défaut** de colonne : que dit-elle une fois relue ? C'est là qu'était l'affect.*

- [ ] **16 — La timeline servie et les souvenirs.** `Timeline/TimelineEndpoints.cs`, `Memories/*.cs`. Cite : §7.5, §9. *Les avertissements causals reviennent-ils, et quelqu'un les lit-il ?*

## Le dernier item

- [ ] **17 — L'inventaire, et le verdict.** Relire les seize items remplis et répondre à une seule question : *le POC peut-il être montré à un testeur ?* Écrire le verdict dans `PHASING.md`, avec ce qui a été regardé et ce qui reste. *Un audit qui constate sans conclure n'est qu'une liste.*

## Ouverts par le crible

Ils demandent une **décision produit**, pas une correction : la boucle les
inscrit et ne les construit pas.

- [ ] **18 — La région est décidée en silence.** (§3.4) L'application impose `PAL` — ou `WORLDWIDE` sur une machine sans zonage — sans jamais le demander. *Décision attendue : où poser la question (E01 ? un réglage ?), quelles régions offrir, et que faire d'un joueur qui n'en sait rien. Acceptation : la région vient d'un geste de l'utilisateur, et un test échoue si une région littérale réapparaît dans `App.tsx`.*

- [ ] **19 — Le compte de jeux n'est pas affiché.** (E02 repère B) `worksCount` traverse trois couches et n'apparaît jamais. *Acceptation : le compteur « N jeux · M déclarés » est à l'écran, et le second nombre vient de l'état relu.*

- [ ] **20 — La période se demande par une question nue.** (§7.3 🆕, E01, `MODELE-DE-DOMAINE.md:74` et `:107`) Trois documents prescrivent un **mode de saisie dérivé** — le référentiel fournit le repère, l'utilisateur répond en langage courant : « à sa sortie », « sur le tard », « bien après, d'occasion ». L'écran demande un nombre. *Prérequis de données : `Platform` doit porter une fenêtre commerciale `from`/`to` par région ; `dataset/poc.json` ne porte que `launch_year`. Décision attendue : curer cette fenêtre pour les huit plateformes, ou s'en tenir à l'année de sortie et assumer l'écart.*

- [ ] **21 — La période ouverte n'est offerte nulle part.** `PeriodInput` l'accepte, `libelle` la rend « depuis 1994 », un test la couvre — et aucun geste ne peut la produire. *Décision attendue : l'offrir (« j'y joue encore »), ou retirer la capacité. La laisser ainsi entretient un chemin que rien n'atteint.*

- [ ] **22 — Décocher ne se persiste pas.** (E02 : « chaque bascule est persistée immédiatement ») Le geste le plus fréquent de l'écran ne quitte pas le navigateur, et depuis la relecture d'état il se défait sous les yeux de l'utilisateur au premier rechargement. *Décision attendue : que signifie une rétractation dans un journal en ajout seul ? Remplacer l'événement par une correction (`MarkSupersededAsync` existe, aucun point d'entrée ne l'expose), ou enregistrer une déclaration négative distincte ? Acceptation : décocher survit à un rechargement, et le parcours de bout en bout le vérifie.*

- [ ] **23 — « Jamais joué » n'est ni saisissable ni relu.** (§24.3) L'API l'accepte et le rend ; aucun geste ne le pose, aucun rendu ne le montre. *Acceptation : le geste d'E02 — balayage à gauche sur mobile, `X` au survol sur desktop — pose la déclaration, et elle se relit distinctement d'un titre non coché.*

---

## Journal

- **01 — le choix de la machine.** Deux défauts, aucun corrigé : les deux demandent une construction, et la boucle ne construit pas. **La région est décidée en silence** (`App.tsx:59` et `:84`) alors que §3.4 en fait la condition de sens de la sélection massive. Le détail qui instruit : le composant `SelectionMassive` **se protège** — sa prop `region` est documentée « requise, sans valeur par défaut : un défaut choisirait en silence le marché d'un joueur » — et l'appelant fait exactement cela, un niveau plus haut. La garde était écrite, elle regardait dans la mauvaise direction. Second défaut : **`worksCount` traverse trois couches et n'est jamais affiché**, alors qu'E02 repère B le spécifie ; il est même *testé pour être juste*, ce qui le rend correct et invisible. Rien n'est persisté par cet écran — et la région n'est enregistrée nulle part, ce qu'il faudra trancher quand le profil deviendra un livrable.

- **02 — le choix de la période.** **Aucun mensonge** : la réparation d'hier tient, toute valeur transmise vient d'une saisie ou d'une suggestion affichée et modifiable, et onze tests plus le parcours le gardent. Mais le crible a trouvé autre chose, que la relecture de la spécification seule pouvait donner : **trois documents prescrivent un mode de saisie dérivé** — §7.3 🆕, E01 et `MODELE-DE-DOMAINE.md:74` — où le référentiel fournit le repère et l'utilisateur répond en langage courant (« à sa sortie », « sur le tard »). L'écran, lui, demande un nombre ; `SPECIFICATION.md:311` nomme exactement cet anti-motif, la « question nue ». Le prérequis manque d'ailleurs dans les données : le modèle veut une **fenêtre commerciale `from`/`to` par région**, le dataset ne porte que `launch_year`. Second constat : la **période ouverte** est acceptée par l'API, rendue par `libelle`, couverte par un test — et **aucun geste ne peut la produire**. Deux items ouverts, aucun code modifié.

- **03 — la sélection massive, passe 1.** Rien n'est envoyé à l'insu de l'utilisateur, et le tri suit bien la notoriété. Mais deux défauts, dont **le plus grave de l'audit jusqu'ici, et il est de la forme inverse du crible : dit sans être écrit**. `basculer` persiste quand on coche et **retourne sans rien envoyer quand on décoche**, alors qu'E02 écrit « chaque bascule est persistée immédiatement ». C'est le geste le plus fréquent de l'écran — le dépôt le dit lui-même — et il ne survit pas. Tant que rien n'était relu, cela ne se voyait pas ; **depuis l'item 22, le mensonge est visible** : on décoche, on recharge, la ligne revient. Second défaut : `neverPlayed` est rendu par l'API et **lu par personne**, si bien qu'un titre déclaré « jamais joué » revient indiscernable d'un titre non coché — la distinction même que §24.3 existe pour tenir. Un test s'appelait « la déclaration est révisable » en n'assérant qu'un compteur local : renommé, avec l'absence d'envoi désormais épinglée et rattachée à son item.
