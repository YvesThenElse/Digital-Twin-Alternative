# Audit des surfaces — avant de recevoir des testeurs

> Le crible et la méthode sont dans [`BOUCLE-AUDIT.md`](./BOUCLE-AUDIT.md).
> Quatre questions par surface : **envoyé sans être saisi**, **rendu sans
> être lu**, **écrit sans être dit**, **dit sans être écrit** — plus la
> question de contrôle : *quel test échouerait si le défaut revenait ?*
>
> La quatrième a été ajoutée à l'item 04, par ce que l'audit avait déjà
> trouvé trois fois sans avoir de case où le ranger.
>
> Un item se coche avec ses réponses, fichier et ligne à l'appui.
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

- [x] **04 — La sélection massive, passe 2 et titres libres.** Même fichier : chips, saisie libre, souvenir. Cite : E02, §3.5, §9, §4.5 à §4.8. *Quatre questions sont spécifiées, deux sont montées — vérifier que les deux absentes ne laissent aucune trace qui prétende le contraire.*

  **1 · Envoyé sans être saisi — RIEN.** Les chips ne transmettent que ce qui a été cliqué (`SelectionMassive.tsx:297`), le titre libre que ce qui a été tapé (`:290`), le souvenir que ce qui a été écrit. L'œuvre fabriquée pour un titre saisi (`:310`) porte des valeurs inertes — `rang`, `sortie`, `regions` — mais aucune ne sort du navigateur : elle ne sert qu'au décompte et au rendu, et le code le dit.

  **2 · Rendu sans être lu — DÉFAUT, corrigé.** `souvenirs` partait de `{}` : **le champ revenait vide après un rechargement alors que la phrase était en base**. §9 en fait « le contenu le plus précieux du produit, et le seul qui ne soit pas régénérable » — le testeur en conclut qu'il l'a perdue, et c'est justement celle-là qu'il ne réécrira pas. Corrigé : `client.souvenirs` relit `/memories/{user}`, `App` le charge avec l'état, le composant en part. Trois tests de composant, trois de client, deux mutations annoncées et vérifiées.

  **3 · Écrit sans être dit — L'INVERSE, deux fois.** (a) **« Toujours en cours » n'écrit rien** : `DeclarationBatch.cs:253` traite `stillPlaying` comme `null`, aucun événement, aucun jugement. L'écran l'offre comme une troisième réponse et l'oublie — au rechargement la chip est vierge, indiscernable de « pas prononcé ». → **item 25**. (b) **Les titres saisis ne sont pas relus** : `EventStore.SelectionStateAsync` filtre `TargetKind == "work"`, donc une revendication ajoutée disparaît de l'écran au rechargement, tout en restant sur la timeline. → **item 24**.

  **Contrôle — quel test échouerait ?** Pour le souvenir relu, oui, six tests neufs et deux mutations. Pour (a) et (b), aucun. À noter : la première mutation **n'a pas compilé** — retirer l'usage de la prop rend le paramètre inutilisé et le typage le refuse. Le compilateur est ici une garde, faible mais réelle.

- [x] **05 — La timeline.** `timeline/Timeline.tsx`, `timeline/types.ts`. Cite : `ecrans/E03-timeline.md`, §7.5, `ORDONNANCEMENT-TEMPOREL.md`. *Défaut déjà connu à confirmer ou infirmer : un jeu affiné apparaît trois fois, le même titre à la même date.*

  **1 · Envoyé sans être saisi — RIEN.** L'écran est en lecture seule : il ne transmet aucune valeur. Son seul état, `deplie` (`Timeline.tsx:56`), est un repli d'affichage.

  **2 · Rendu sans être lu — TROIS CHAMPS JETÉS.** (a) **`type`** (`types.ts:5`) n'est lu nulle part : `Timeline.tsx:88-90` ne rend que `targetLabel` et `occurredAt`. `StartedGame`, `CompletedGame` et `AcquiredItem` sont donc **indiscernables** — c'est la cause exacte du symptôme signalé, « le même titre trois fois à la même date ». Vérifié en base : une œuvre du profil porte trois moments, trois autres en portent deux. (b) **`targetKind`** est jeté : un titre saisi se rend comme une œuvre curée, alors qu'E02 le marque « hors du référentiel ». (c) **`Warnings`** — `TimelineEndpoints.cs:45` les rend, et `client.ts:154` déclare un type à **deux champs** ; les avertissements causals de §5.4 n'atteignent donc personne. → **items 26 et 27**. En revanche `confidence` n'est pas un manque : elle se **déduit** de la granularité, déjà rendue par `data-forme` et `libelle` ; l'afficher à part la dupliquerait.

  **3 · Écrit sans être dit — RIEN.** Aucune persistance.

  **4 · Dit sans être écrit — RIEN.** Le seul geste est « Déplier », et un repli d'affichage n'est pas une donnée.

  **Contrôle — quel test échouerait ?** Aucun pour les trois champs jetés, et le troisième est structurellement invisible : `lire<T>` **caste** le JSON, donc le compilateur ne peut pas signaler un champ non déclaré.

- [x] **06 — L'assemblage du parcours.** `App.tsx` dans son ensemble : états, transitions, profil, disposition. Cite : `ecrans/PARCOURS-ET-LIENS.md`, `ecrans/PLAN-DU-SITE.md`. *C'est là que vivent les valeurs qui traversent les écrans sans appartenir à aucun.*

  **1 · Envoyé sans être saisi — UN, déjà inscrit.** La région (item 18). Le reste vient de l'utilisateur ou d'un fait : `UTILISATEUR` de `?profil=` avec `usr_local` par défaut (`App.tsx:25`, mécanisme assumé faute de compte), `anneeCourante` de l'horloge, `periode` du choix.

  **2 · Rendu sans être lu — DEUX, corrigés.** (a) **L'état relu était périmé** : il n'était chargé qu'au choix de la machine, alors que changer la période **démonte** le composant de sélection et emporte son état local. On revenait donc en voyant **moins** que ce que la base contenait. Relu à chaque entrée désormais. (b) `worksCount` et les avertissements — items 19 et 27.

  **3 · Écrit sans être dit — RIEN.** `App` ne persiste rien directement.

  **4 · Dit sans être écrit — UN, corrigé, et il n'était pas là où je le cherchais.** **« Recharger la liste » quittait l'écran** : le bouton appelait `chargerOeuvres`, qui se termine par `setEtape("periode")`. Le geste faisait autre chose que ce qu'il annonçait, et emportait au passage les lignes cochées. Scindé en `choisirMachine` et `rechargerListe`.

  **En prime — un mensonge d'état.** `catch(() => setPlateformes([]))` puis `length === 0 ? "Chargement…"` : **un échec réseau se rendait par un chargement éternel**, et un catalogue vide aussi. Trois états rendus par une phrase, alors que les principes §5 en font quatre obligatoires. Séparés : chargement, erreur (`role="alert"`, ce qui a échoué et ce qui est conservé), vide (`role="status"`).

  **Contrôle — quel test échouerait ?** `App.tsx` **n'avait aucun test**, et c'est pourquoi quatre défauts y ont survécu à cinq surfaces auditées. Cinq tests neufs, deux mutations annoncées et vérifiées.

  **Observations sans défaut.** Revenir à l'écran de période le **réinitialise** : il faut rechoisir le mode, la période courante n'étant pas remontrée. Friction, pas mensonge — le contexte de saisie, lui, l'affiche toujours. Et `EtatDuService` est écrit, testé, **monté nulle part** → **item 28**.

## Les composants de rendu

Ils ne transmettent rien, mais ils **affirment** — et un rendu qui invente
est aussi coûteux qu'un champ qui ment.

- [x] **07 — La tuile et les époques.** `disposition/Tuile.tsx`, `disposition/epoque.ts`. Cite : `ecrans/00-langage-visuel.md` §3 et §7, §19.2. *Une jaquette absente doit se rendre par une tuile composée, jamais par un trou.*

  **1 · Envoyé sans être saisi — RIEN.** Composant de rendu pur : il ne transmet rien. `trameDuTitre` (`epoque.ts:57`) dérive du titre et non d'un tirage, ce que son test exige — une grille qui change d'aspect d'une visite à l'autre se lirait comme une perte de données.

  **2 · Rendu sans être lu — RIEN.** Les trois propriétés servent : `titre` en `alt` et dans la tuile composée (`Tuile.tsx:41`, `:57`), `annee` pour l'accent (`:30`), `couverture` pour choisir la branche (`:32`).

  **3 · Écrit sans être dit — UN, corrigé, et c'est une affirmation VISUELLE.** `accentEpoque(null)` rendait `EPOQUES[0]` : une œuvre non datée était peinte en terre cuite et étiquetée **« 8 bits »**. Or le premier service du système d'époques est « on sait où l'on est **sans lire de date** » — la couleur *affirme* une décennie, et l'affirmer sur une donnée absente est la faute de l'apprentissage 51, transposée au rendu. Corrigé par `SANS_EPOQUE`, le filet chaud du langage visuel §2 : ni gris — la raison d'être du repli tient toujours — ni l'une des six. **Aucune œuvre du dataset actuel n'est sans date** : le chemin était latent, et il ne le serait pas resté, le référentiel étant un chantier durable (§18.6).

  **4 · Dit sans être écrit — RIEN.** Aucun geste.

  **Contrôle — quel test échouerait ?** Deux tests neufs, une mutation annoncée et vérifiée. À noter : le test existant « donne une couleur même sans année connue » **passait** avec le défaut — il n'exigeait qu'un hexadécimal valide, ce que `EPOQUES[0]` est.

  **Observation — un manque de §19.2.** `Tuile` n'a pas de repli si l'image **échoue à charger** : une jaquette empruntée est révocable, et §19.2 exige que « rien ne cesse de fonctionner quand l'une disparaît ». Le catalogue filtre à l'amorçage, donc un fichier retiré ensuite donne un glyphe cassé et non la tuile composée. → **item 29**.

- [x] **08 — Le statut régional.** `region/StatutRegional.tsx`, `region/statut.ts`. Cite : §3.4, `dataset/README.md`. *Quatre états, dont 22 non-sorties arbitrées et 32 inconnues. Aucun ne doit se rendre par l'absence d'indication.*

  **1 · Envoyé sans être saisi — UN, déjà inscrit.** La `region` vient de `App.tsx` et non du joueur (item 18). Tout le reste de cette surface en dépend : le statut **et**, désormais, la date.

  **2 · Rendu sans être lu — UN, corrigé, et il était quantifiable.** `sortieDe` (`client.ts:59`) prenait **la sortie la plus ancienne du monde**, ignorant `releases[].region`. Or §3.4 ne parle pas que du statut : « elle conditionne aussi **les dates de sortie affichées**, qui diffèrent parfois de plusieurs années entre régions ». Mesuré sur le dataset réel : **97 œuvres sur 221** affichaient une année différente de leur année PAL, écart moyen 1,5 an, **maximum 6** — *Adventure Island*, affiché 1986, paru en PAL en 1992. Sur l'écran dont toute la mécanique repose sur la reconnaissance, le joueur voyait une date qu'il n'a jamais vue. La sortie de sa région passe désormais devant ; à défaut, la plus ancienne, le statut régional disant alors « jamais sorti » ou « inconnu » — ce qui fait de cette date un repère et non un mensonge.

  **3 · Écrit sans être dit — RIEN.** Aucune persistance.

  **4 · Dit sans être écrit — RIEN.** Aucun geste.

  **Contrôle — quel test échouerait ?** Quatre tests de client neufs, une mutation annoncée et vérifiée. Les quatre états, eux, étaient déjà gardés — `statut.test.ts` exige la **marque** de chacun et qu'aucun ne se rende par une chaîne vide.

  **Observation pour l'item 12.** L'API peut émettre `"released"` dans `regionStatus` (`ReferenceEndpoints.cs:105`) ; le type du client n'en déclare que deux (`client.ts:49`). Latent — le dataset ne porte que `absent` et `inconnu` — mais c'est la famille de l'apprentissage 56, et l'item 12 est sa place.

- [x] **09 — La bande d'époque.** `selection/BandeDEpoque.tsx`, `selection/bande.ts`. Cite : §24.4, langage visuel §7. *La récompense pendant la saisie. Ce qu'elle compte doit être ce que l'utilisateur croit avoir fait.*

  **1 · Envoyé sans être saisi — RIEN.** Composant de rendu pur.

  **2 · Rendu sans être lu — RIEN dans le composant.** Les quatre champs de `Bande` servent : `tranches` en barres (`BandeDEpoque.tsx:28`), `periode` et `total` en légende (`:40`, `:48`), `sansDate` quand il y en a (`:53`) — « comptés, jamais placés », et le dire évite que l'écart passe pour une erreur.

  **3 · Écrit sans être dit — RIEN.** Aucune persistance.

  **4 · Dit sans être écrit — RIEN.** Aucun geste.

  **Mais §24.4 porte TROIS promesses, et une seule est tenue.** « La timeline se remplit à mesure que l'on coche » ✓ ; « **les premières statistiques apparaissent après quelques jeux** » ✗ ; « **la première console saisie déclenche déjà une phrase de récit** » ✗. Les deux absentes ne sont inscrites nulle part — ni au TODO de Phase 1, ni au bilan de clôture. → **item 30**.

  **Et surtout : LA BANDE EST INVISIBLE.** `BandeDEpoque` pose `className="bande"` et `"bande-tranche"` (`:27`, `:31`) — **ces classes n'existent pas**. Il n'y a **aucune feuille de style dans le projet** : `find` n'en trouve aucune, `index.html` n'en lie aucune, `main.tsx` n'en importe aucune, et le front entier compte **trois** styles en ligne. Les barres sont donc des `<span>` avec une hauteur en pourcentage dans un conteneur sans hauteur : elles ne s'affichent pas. Or le langage visuel §7 appelle ce mouvement « **le mouvement le plus important du produit** », et §24.4 en fait la seule réponse à « pourquoi passer deux heures à saisir ». → **item 31**.

  **Contrôle — quel test échouerait ?** Aucun, et c'est le cœur du problème : la bande est **testée** — `data-total`, `data-tranches`, `data-sans-date` — et le parcours de bout en bout assère ses attributs. Tout dit « la récompense fonctionne » pendant que rien n'est visible.

- [x] **10 — La zone sans date et le rendu temporel.** `temporel/ZoneSansDate.tsx`, `temporel/valeur.ts`. Cite : §7.3, `ORDONNANCEMENT-TEMPOREL.md` §6. *Les sept granularités, et les trois interdits.*

  **1 · Envoyé sans être saisi — RIEN.** Rendu pur.

  **2 · Rendu sans être lu — RIEN ici.** `MomentSansDate` porte trois champs et les trois servent (`ZoneSansDate.tsx:32`, `:35`). Ce que la `Timeline` jette en construisant le tiroir — `type`, `targetKind` — est déjà l'item 26.

  **3 · Écrit sans être dit — RIEN.**

  **4 · Dit sans être écrit — RIEN, faute de geste : et c'est justement l'exigence manquante.**

  **§6 porte trois exigences ; la première est tenue, les deux autres non.** ✓ **« Ordre dans le tiroir : `RecordedAt` décroissant »** — implémenté (`TimelineSorter.cs:129`), gardé par deux tests du domaine dont un né d'une mutation survivante, et par un **test miroir** à l'API (`TimelineTests.cs:113`) qui compare le tiroir rendu à celui du domaine. ✗ **« Le tiroir est une tâche, pas une poubelle. Il est dimensionné pour être vidé — c'est la relance de session la moins coûteuse du produit »** : il n'accepte **aucun geste**, on ne peut pas y dater un moment. ✗ **« Il compte dans les totaux du profil »** : il n'y a pas de profil. → **item 32**.

  **Ce qui manque et qu'aucun fichier ne réclame — `Age` est un sous-système complet et inatteignable.** La variante, sa résolution par `TemporalHorizon`, et le paramètre `birthYear` de `/timeline` existent et sont testés ; **le front n'envoie jamais `birthYear`** (aucune occurrence dans `web/src`), et aucun écran ne produit un `Age`. Des sept granularités de §7.3, un événement de joueur ne peut en porter que **trois** — `Year`, `YearRange` fermée, `Unknown` (`periode.ts:16`). `ExactDate` et `Month` restent atteignables par les dates de sortie du référentiel ; `ApproximateYear` est différée au repli d'E07, ce qui est écrit ; `Age` et la période ouverte ne le sont nulle part. → **item 21 étendu**.

  **Contrôle — quel test échouerait ?** Pour l'ordre du tiroir, trois — dont le miroir d'API. Pour les deux exigences manquantes, aucun : elles ne sont encodées nulle part.

- [x] **11 — Le contexte de saisie et l'état du service.** `periode/ContexteDeSaisie.tsx`, `EtatDuService.tsx`. Cite : E02 repère A, `ecrans/00-principes-transverses.md` §5. *Les quatre états obligatoires — vide, partiel, chargement, erreur — sont-ils rendus, ou seulement les deux faciles ?*

  **§5 fait des quatre états une obligation. Deux manquaient, dont un corrigé.**

  **Erreur — DÉFAUT, corrigé.** Quatre chemins asynchrones de `App.tsx` n'avaient **aucun `catch`** : `choisirMachine`, `ouvrirSelection`, `rechargerListe`, `ouvrirTimeline`. Un échec laissait l'écran figé sur l'étape courante, sans message : le testeur appuie sur une console ou sur « Voir ma timeline », **rien ne se passe**, il appuie encore. §5 demande trois choses — ce qui a échoué, ce qui est conservé, quoi faire — dont aucune n'était dite. Corrigé par `essayer`, qui enveloppe les quatre et efface l'alerte dès que le geste suivant aboutit. Trois tests, une mutation annoncée.

  **Vide — latent.** `SelectionMassive` ne traite pas `oeuvres.length === 0` : ce serait une **page blanche**, qu'E02 interdit — « proposer d'élargir la période ou de changer de région ». Inatteignable aujourd'hui (aucune plateforme n'est vide, aucun filtre ne s'applique), et l'une des deux issues qu'E02 propose n'existe pas : la région n'est pas choisissable (item 18). → **item 33**.

  **Chargement et partiel — présents.** Le squelette de liste d'E02 n'existe pas, mais l'attente est celle d'un seul appel ; le partiel est l'état nominal et il est rendu partout.

  **Ce que le crible a trouvé en chemin, et qui vaut plus que l'item.** La mutation du `catch` devait faire échouer **quatre** tests : les trois neufs, **et** le garde des libellés morts, la clé n'étant plus référencée. Il n'en a fait échouer que trois. Vérifié : **le garde des libellés morts ne pouvait pas échouer**. `messages.ts` figurait parmi les sources où l'on cherche un usage, et chaque clé y est définie sous la forme `"cle": "valeur"` — donc toujours trouvée. Une clé fabriquée que personne n'utilisait passait. Le contrôle voisin avait son témoin ; celui-ci n'en avait pas. Réparé, avec **deux** témoins : un qui éprouve la logique, un qui éprouve l'exclusion du catalogue.

  **Et le garde réparé a trouvé un vrai mort : `parcours.retour` — « Changer de console ».** Le libellé existait, **l'action non** : une fois une console choisie, on ne peut plus en changer sans recharger la page, alors qu'E02 l'inscrit à ses actions. Libellé retiré — le catalogue n'est pas une liste de tâches — et le manque inscrit. → **item 34**.

## Les frontières

Deux défauts sur trois se sont logés là où deux couches se rencontrent et où
chacune avait raison séparément.

- [x] **12 — Le client HTTP.** `api/client.ts`. Cite : les points d'entrée de l'API. *Chaque champ rendu par l'API est-il traduit, ou jeté ? Chaque champ envoyé vient-il de l'écran ?*

  **Comparaison champ par champ des deux côtés — quatre omissions, une dérive de type, un point d'entrée orphelin.**

  | Point d'entrée | Rendu par l'API | Déclaré par le client | Verdict |
  |---|---|---|---|
  | `/platforms` | `LaunchYear` **`int?`** | `number` | **dérive de type**, latente |
  | `/platforms/{id}/works` | `releases[].confidence` | absent | légitime — dérivée, déjà rendue |
  | `/memories/{user}` | `updatedAt` | absent | légitime — aucun écran ne l'affiche |
  | `/timeline/{user}` | `warnings` | absent | **défaut** (item 27) |
  | `/unresolved/{user}` | point d'entrée entier | **jamais appelé** | c'est le moyen de l'item 24 |

  **1 · Envoyé sans être saisi — RIEN.** Tout ce que le client poste vient d'un appelant ; `souvenir` a été corrigé à l'item 20 de la Phase 1 pour que le genre de cible vienne de l'écran et non d'une constante.

  **2 · Rendu sans être lu — QUATRE, dont deux légitimes.** Inscrits dans `client.ts` sous forme de tableau : l'omission silencieuse devient une décision écrite, seul garde possible tant qu'aucun contrat n'est partagé. → **item 35**.

  **3 · Écrit sans être dit — RIEN.** **4 · Dit sans être écrit — RIEN.** Le client ne décide ni ne persiste.

  **La dérive de type mérite son détail.** `ReferenceModel.cs:59` déclare l'année de lancement **facultative**, et `DatasetLoader.cs:385` **saute l'invariant 03b** quand elle manque : une plateforme sans année serait chargée sans contrôle. Le client la déclare `number` — un `null` traversé donnerait, en JavaScript, `null + 2 === 2`, donc une année suggérée de **2**, et `1994 < null` étant faux, **plus rien ne refuserait** une date antérieure à la machine.

  **Contrôle — quel test échouerait ?** `ReferentielTests.Chaque_plateforme_expose_son_annee_de_lancement` : il appelle `GetInt32()`, qui **lève** sur un `null`. La garde existait déjà — je l'ai découvert en mispréduisant une mutation (1 annoncé, 3 obtenus) et en cherchant l'écart. J'avais écrit un test redondant ; il est retiré, et la raison qui l'avait fait écrire est désormais inscrite dans la garde existante.

- [x] **13 — Le catalogue et les jaquettes.** `Reference/ReferenceEndpoints.cs`, `Reference/CoverEndpoints.cs`, `Reference/ReferenceCatalogSource.cs`. Cite : §3.3, §3.4, §19.2. *Le manifeste enregistre une acquisition, pas une présence.*

  **§19.2 / VERIFICATION-JURIDIQUE §3.3 portent CINQ conditions écrites. Une était fausse, une est violée, trois tiennent.**

  | Condition | État |
  |---|---|
  | 1 · **512 px de large au plus** | ❌ **deux visuels la violent** — *Celeste* à **960 px**, un `.webp` à 546 px |
  | 2 · **Origine conservée par visuel** | ✅ le manifeste porte `source_url`, `source_article`, `licence`, `regime`, `external_id` |
  | 3 · **Retrait immédiat, la tuile reprend la place** | ⚠️ vrai après redémarrage — le catalogue filtre sur l'existence à l'amorçage — mais l'`<img>` casse en séance (item 29) |
  | 4 · **Diffusion bornée** | ✅ tailnet privé, lié à l'adresse Tailscale, LAN fermé |
  | 5 · **Aucune redistribution** | ✅ pas d'export ; `/covers` sert la page du produit, ce que la condition distingue explicitement |

  **Et le manifeste mentait sur les 218 visuels.** Il inscrivait `width: 512` **partout** — ce n'était pas une mesure mais la taille *demandée* à la source. Les fichiers réels vont de **213 à 960 px, médiane 300**. Le champ `bytes`, lui, était juste **au bit près** : dans un même enregistrement, certains champs sont des observations et d'autres des intentions, et rien ne les distinguait. Or c'est la pièce sur laquelle s'appuierait une demande de retrait. **Corrigé** : les 218 entrées portent désormais la mesure.

  **1 · Envoyé sans être saisi — RIEN.** `CoverEndpoints` prend le chemin **du manifeste, jamais de la requête** (item 17 de la Phase 1), avec une liste fermée de types.

  **2 · Rendu sans être lu — déjà inscrit.** `worksCount` (item 19), `releases[].confidence` (item 12).

  **3 · Écrit sans être dit — le manifeste, corrigé ci-dessus.** **4 · Dit sans être écrit — RIEN.**

  **Contrôle — quel test échouerait ?** Aucun n'existait : **`calibration/test_covers.py`** est écrit pour cela — concordance manifeste/fichiers, présence de l'origine, nombre d'octets, et la règle des 512 px. Il ne lit que des fichiers versionnés, donc il tourne depuis un dépôt neuf.

  **Ce qui manque et qu'aucun fichier ne réclame : les trois contrôles hors ligne documentés ne tournent pas.** `CLAUDE.md` les présente comme « à lancer après avoir touché au pipeline ». Vérifié : `test_id_stability.py` réclame `resolved.json` (absent du dépôt), `test_wp_parser.py` réclame `wp_wikitextes.json` (absent), `emit_notabilite.py` ne marche **que** depuis `calibration/`. → **item 36**.

- [x] **14 — Les déclarations et l'état relu.** `Selection/DeclarationEndpoints.cs`, `Selection/DeclarationBatch.cs`, `Selection/PeriodInput.cs`. Cite : §24.3, §3.5, `MODELE-DE-DOMAINE.md` §12. *Le vocabulaire diffère entre `/declarations/{userId}` (« Owned ») et `/selection` (« owned ») — écart déjà relevé, à trancher.*

  **1 · Envoyé sans être saisi — RIEN.** Chaque champ de `DeclarationEntry` est consommé par `Translate` ; aucune valeur n'est inventée en chemin. `PeriodInput.MargeParDefaut` est la seule constante, et elle est documentée : une marge nulle dirait exactement ce que dit une année.

  **2 · Rendu sans être lu — une dérive de vocabulaire.** `/declarations/{userId}` rend les noms du **domaine** (`Owned`), `/selection/{u}/{p}` ceux de l'**écran** (`owned`). Deux vocabulaires pour un même fait. Sans conséquence aujourd'hui — le front ne lit que le second (item 12) — mais c'est un piège posé pour le prochain appelant.

  **3 · Écrit sans être dit — RIEN, depuis l'item 24 de la Phase 1.** `ApplyDeclarationsAsync` n'écrit plus de valeur par défaut porteuse de sens : `affect` vaut `Unstated`, `neverPlayed` est faux, la provenance est absente tant qu'elle n'est pas donnée.

  **4 · Dit sans être écrit — déjà inscrit.** « Toujours en cours » (item 25).

  **Et la garde qui n'existait que dans le navigateur — corrigée.** `ChoixPeriode` refuse « 1985 sur Super Nintendo » et **nomme** l'année de sortie ; l'API, elle, **acceptait**. Mesuré, pas supposé : un lot daté 1985 sur SNES passait. La règle vivait donc dans la couche la moins autoritaire. Corrigé — mais en ne refusant que **l'impossible certain** : on compare l'année la plus **tardive** que la période autorise, de sorte qu'une imprécision qui chevauche l'impossible reste acceptée. « Vers 1991 » sur une console de 1990 peut vouloir dire 1992, et refuser exigerait une précision que §7.3 interdit de demander. Le rétrogaming — cas de validation n°1 — reste évidemment accepté, et un test le fixe.

  **Les huit cas de §12.** Tous ont des traces dans les suites — du retrogaming à Pokémon Rouge. Le n°4, « vers mes 12 ans, année de naissance renseignée plus tard », est couvert **dans le domaine** et inatteignable depuis l'écran (item 21).

  **Contrôle — quel test échouerait ?** Deux tests neufs — le refus et sa contrepartie rétrogaming — et une mutation annoncée et vérifiée.

- [x] **15 — La persistance.** `Persistence/*Row.cs`, `*Mapping.cs`, `EventStore.cs`. Cite : `MODELE-DE-DOMAINE.md`, §5, §10.1. *Chaque **valeur par défaut** de colonne : que dit-elle une fois relue ? C'est là qu'était l'affect.*

  **Les valeurs par défaut, énumérées — c'est ce que l'item demandait.** Vingt colonnes en portent une. Dix-huit valent `""` : un idiome C# pour satisfaire le non-nullable, jamais persisté puisque chaque écriture les renseigne. Restent les deux porteuses de sens, et toutes deux sont désormais justes : `Affect = "Unstated"` (corrigé à l'item 24 de la Phase 1 — c'était le défaut) et `Provenance = "Unknown"`, que `EventStore.ProvenanceEcran` traduit en `null` vers l'écran, « on ne sait pas » n'étant pas une réponse que l'utilisateur a donnée.

  **1 · Envoyé sans être saisi — RIEN.** **3 · Écrit sans être dit — RIEN**, depuis la correction de l'affect. **4 · Dit sans être écrit — RIEN** à cette couche.

  **2 · Rendu sans être lu — RIEN** : les correspondances sont complètes dans les deux sens, et leur aller-retour est testé.

  **Ce qui manquait, trouvé en mesurant le schéma réel.** Quatre tables portent un `user_id` — vérifié par `information_schema`, pas par lecture — et `PurgeUserAsync` en efface quatre. Quatre tests l'éprouvent, **un par table**. Mais **aucun ne garantissait l'exhaustivité** : une cinquième table serait oubliée en silence, sur un produit que §19.4 décrit comme une archive personnelle de plusieurs décennies, et dont l'effacement est une contrainte de **conception**. Garde écrite : le test interroge le schéma et le compare à une liste écrite, de sorte qu'ajouter une table le fasse échouer.

  **Contrôle — quel test échouerait ?** Le nouveau, et la mutation l'a confirmé. Elle a d'abord **échoué à s'injecter** : créer une cinquième table à la main ne change rien, la suite **recrée sa base** à chaque exécution. C'est l'écart qui l'a dit — la garde était bonne, la mutation invalide. Un témoin de schéma doit passer par une migration, pas par une commande.

- [x] **16 — La timeline servie et les souvenirs.** `Timeline/TimelineEndpoints.cs`, `Memories/*.cs`. Cite : §7.5, §9. *Les avertissements causals reviennent-ils, et quelqu'un les lit-il ?*

  **1 · Envoyé sans être saisi — RIEN.** Les deux libellés de repli — « Titre saisi, introuvable », « Œuvre inconnue du référentiel » — sont des **mots**, pas des données, et ils existent pour ne pas faire remonter un identifiant à l'écran. `Confidence` est **dérivée** (`PlayerEvent.cs:131`), jamais stockée : elle ne peut pas diverger de la granularité qu'elle résume.

  **2 · Rendu sans être lu — RIEN côté serveur.** L'endpoint rend tout ce que le tri produit, avertissements compris ; c'est le client qui les jette (item 27). `MemoryRow.UpdatedAt` est rendu et ignoré, sciemment (item 12).

  **3 · Écrit sans être dit — RIEN.** La timeline n'écrit pas ; `UpsertMemoryAsync` n'inscrit que ce qui est donné, plus l'horodatage, qui est un fait.

  **4 · Dit sans être écrit — RIEN** à cette couche.

  **Deux contrôles d'ENSEMBLE, et les deux échouent.**

  **(a) Onze types d'événements déclarés, QUATRE atteignables.** `DiscoveredGame`, `ReplayedGame`, `SoldItem`, `LostItem`, `LentItem`, `BorrowedItem`, `ReturnedItem` n'ont **aucun producteur** : `/declarations` n'en fabrique que quatre. Le tri les ordonne, `CausalSequence` raisonne dessus, rien ne peut les créer. Or ce sont précisément ceux qui portent l'histoire d'une collection sur trente ans — vendu, perdu, prêté, rendu — c'est-à-dire le cas de validation n°1 du modèle. → **item 38**.

  **(b) §9.2 porte TROIS exigences ; une est partielle, deux sont absentes.** « Une note libre attachée à un événement, à un jeu, **ou à une période de la timeline** » : seuls l'œuvre et le titre saisi sont des cibles possibles. « Optionnellement un **titre court, servant de repère sur la timeline** » : `MemoryRow` n'a pas de titre. « Visibilité contrôlée indépendamment » : rien. Et le plus lourd — **aucun souvenir n'apparaît sur la timeline** : zéro occurrence dans `TimelineEndpoints`. §9.1 dit pourtant que cette section existe parce qu'elle « porte directement le critère de validation du projet : faire dire à l'utilisateur *oui, ça me ressemble* ». → **item 39**.

  **Contrôle — quel test échouerait ?** Aucun pour (a) et (b) : ce sont des absences, et rien ne compte les ensembles.

## Le dernier item

- [x] **17 — L'inventaire, et le verdict.** Relire les seize items remplis et répondre à une seule question : *le POC peut-il être montré à un testeur ?* Écrire le verdict dans `PHASING.md`, avec ce qui a été regardé et ce qui reste. *Un audit qui constate sans conclure n'est qu'une liste.*

  **Verdict écrit dans `PHASING.md` : NON — et pour une raison qui n'était dans aucun bilan précédent.** Le POC **n'a pas d'apparence** : aucune feuille de style, donc aucune des six sections du langage visuel. Trois autres blocages, tous corrigeables en heures : décocher ne se persiste pas, le moment ne dit pas ce qu'il est, le souvenir n'atteint jamais la timeline. Huit défauts corrigés en chemin, deux artefacts remis d'aplomb, vingt-trois items ouverts.

## Ouverts par le crible

Ils demandent une **décision produit**, pas une correction : la boucle les
inscrit et ne les construit pas.

- [ ] **18 — La région est décidée en silence.** (§3.4) L'application impose `PAL` — ou `WORLDWIDE` sur une machine sans zonage — sans jamais le demander. *Décision attendue : où poser la question (E01 ? un réglage ?), quelles régions offrir, et que faire d'un joueur qui n'en sait rien. Acceptation : la région vient d'un geste de l'utilisateur, et un test échoue si une région littérale réapparaît dans `App.tsx`.*

- [x] **19 — Le compte de jeux n'est pas affiché.** (E02 repère B) `worksCount` traverse trois couches et n'apparaît jamais. *Acceptation : le compteur « N jeux · M déclarés » est à l'écran, et le second nombre vient de l'état relu.*

  **Fait le 22 septembre 2026.** `worksCount` s'affiche sur la carte de console — « 1990 · 35 jeux », ce qu'il y a derrière la carte avant qu'on l'ouvre — et le repère B d'E02 porte « N jeux · M déclarés », le second nombre venant de l'état relu.

- [x] **20 — La période se demande par une question nue.** (§7.3 🆕, E01, `MODELE-DE-DOMAINE.md:74` et `:107`) Trois documents prescrivent un **mode de saisie dérivé** — le référentiel fournit le repère, l'utilisateur répond en langage courant : « à sa sortie », « sur le tard », « bien après, d'occasion ». L'écran demande un nombre. *Prérequis de données : `Platform` doit porter une fenêtre commerciale `from`/`to` par région ; `dataset/poc.json` ne porte que `launch_year`. Décision attendue : curer cette fenêtre pour les huit plateformes, ou s'en tenir à l'année de sortie et assumer l'écart.*

  **Tranché le 22 septembre 2026 : des cartes de décennie**, ce qu'E01 prescrit. Le champ numérique avec −/+ a disparu, et avec lui les trois libellés qui le servaient — le garde des libellés morts les a signalés dès leur orphelinat. Chaque décennie est bornée par la sortie de la machine et par aujourd'hui, peinte à l'accent de son milieu, et l'affinage à cinq ans n'apparaît **qu'ensuite** et reste facultatif. Ce qui part est un **intervalle**, jamais une année inventée. Le parcours y gagne deux gestes. *L'autre mode prescrit — les repères relatifs à la console de §7.3 — reste non construit : il demande une fenêtre commerciale par région que le dataset ne porte pas.*

- [ ] **21 — Des capacités temporelles complètes et inatteignables.** (étendu à l'item 10) La **période ouverte** — `PeriodInput` l'accepte, `libelle` la rend « depuis 1994 », un test la couvre, aucun geste ne la produit. Et **`Age` tout entier** : la variante, sa résolution par `TemporalHorizon`, le paramètre `birthYear` de `/timeline` — le front ne l'envoie jamais, aucun écran ne produit un âge. *Décision attendue : les offrir (« j'y joue encore », « vers mes 12 ans » avec une année de naissance), ou les retirer. Les laisser entretient des chemins que rien n'atteint — et `Age` est cité dans la spécification comme un argument du produit.* `PeriodInput` l'accepte, `libelle` la rend « depuis 1994 », un test la couvre — et aucun geste ne peut la produire. *Décision attendue : l'offrir (« j'y joue encore »), ou retirer la capacité. La laisser ainsi entretient un chemin que rien n'atteint.*

- [ ] **22 — Décocher ne se persiste pas.** (E02 : « chaque bascule est persistée immédiatement ») Le geste le plus fréquent de l'écran ne quitte pas le navigateur, et depuis la relecture d'état il se défait sous les yeux de l'utilisateur au premier rechargement. *Décision attendue : que signifie une rétractation dans un journal en ajout seul ? Remplacer l'événement par une correction (`MarkSupersededAsync` existe, aucun point d'entrée ne l'expose), ou enregistrer une déclaration négative distincte ? Acceptation : décocher survit à un rechargement, et le parcours de bout en bout le vérifie.*

- [ ] **23 — « Jamais joué » n'est ni saisissable ni relu.** (§24.3) L'API l'accepte et le rend ; aucun geste ne le pose, aucun rendu ne le montre. *Acceptation : le geste d'E02 — balayage à gauche sur mobile, `X` au survol sur desktop — pose la déclaration, et elle se relit distinctement d'un titre non coché.*

- [ ] **24 — Les titres saisis ne sont pas relus.** (§3.5) `SelectionStateAsync` ne rend que les cibles `work` ; une revendication ajoutée disparaît de la sélection au rechargement, tout en restant sur la timeline. *Acceptation : un titre saisi revient à l'écran après rechargement, marqué comme tel, avec son souvenir.*

- [ ] **25 — « Toujours en cours » n'est enregistré nulle part.** (§4.6) L'écran l'offre, le traducteur le traite comme une absence de réponse. *Décision attendue : le porter comme jugement permanent — `PlayDeclaration` n'a pas de champ d'achèvement — ou cesser de l'offrir, puisqu'il décrit l'état par défaut d'un jeu commencé. Le laisser ainsi fait disparaître une réponse donnée.*

- [ ] **26 — Le moment ne dit pas ce qu'il est.** (E03, langage visuel §3) `type` et `targetKind` sont rendus par l'API et jetés par l'écran : trois moments d'un même jeu s'affichent en trois lignes identiques, et un titre saisi se donne pour une œuvre curée. *Le langage visuel prescrit une **icône dessinée** par famille — ce qu'on a fait du jeu, où l'objet se trouvait, ce qu'il a laissé — et « aucune légende ». Décision attendue : dessiner ces icônes, ou regrouper les moments d'un même jeu (E03 repère A parle de regroupement au niveau décennie).*

- [ ] **27 — Les avertissements causals n'atteignent personne.** (§5.4) L'API les calcule et les rend ; le type du client n'a pas le champ. *Acceptation : une incohérence déclarée — « fini » avant « commencé » — est visible à l'écran comme un avertissement doux, et ne bloque rien.*

- [ ] **28 — `EtatDuService` n'est monté nulle part.** Composant écrit et testé, jamais affiché — le même défaut que `ZoneSansDate` avant l'item 18. *Décision attendue : où montrer la santé du service, et à quelles conditions. Un bandeau permanent dirait « tout va bien » en continu, ce que les principes §5 ne demandent pas ; un bandeau à l'échec seulement risque de ne jamais s'afficher en test.*

- [ ] **29 — Une jaquette qui disparaît casse la tuile.** (§19.2) Le catalogue ne filtre sur l'existence du fichier qu'à l'amorçage ; retiré ensuite, l'`<img>` échoue et le navigateur rend un glyphe cassé. *Acceptation : une image qui n'arrive pas se replie sur la tuile composée, et un test le prouve avec une source invalide.*

- [ ] **30 — §24.4 promet trois récompenses, une seule existe.** Les premières statistiques après quelques jeux, et la phrase de récit à la première console, ne sont ni construites ni inscrites. *Décision attendue : les porter en Phase 1 — §24.4 est la réponse au risque produit numéro un — ou les différer explicitement, ce qui n'a jamais été fait.*

- [x] **31 — Le produit n'a AUCUNE feuille de style.** 🔴 Aucun fichier CSS, aucun lien dans `index.html`, aucun import dans `main.tsx`, trois styles en ligne au total — et `BandeDEpoque` référence des classes qui n'existent pas. Les six sections du langage visuel ne sont donc pas implémentées : ni la palette d'époques comme design, ni les neutres chauds, ni le cadre 3:4, ni les cibles de 56 px, ni le tableau de densité par point de rupture, ni le mouvement. **`data-disposition="grille"` et `"liste"` rendent la même chose** : le parcours de bout en bout vérifie un attribut, pas une disposition. *C'est le blocage le plus probable d'un test utilisateur, et il ne se voit dans aucune suite.*

  **Levé le 22 septembre 2026.** Le socle existe, et E01 comme E02 sont mis en page. **La grille desktop rend enfin une grille** : le parcours ne vérifie plus l'attribut mais ce que le navigateur a calculé — `display`, nombre de colonnes, hauteur de la ligne mobile —, et la mutation le confirme. La **bande d'époque a une hauteur** : le parcours mesure ses barres, et la mutation qui retire les 48 px le fait échouer sur les deux dispositions. *Restent E03 et les écrans non construits.*

- [ ] **32 — Le tiroir est une poubelle, pas une tâche.** (`ORDONNANCEMENT-TEMPOREL.md` §6) « Dimensionné pour être vidé — la relance de session la moins coûteuse du produit » : il n'accepte aucun geste, on ne peut pas y dater un moment. *C'est E14, la passe temporelle, et elle n'est inscrite dans aucun TODO. Décision attendue : Phase 1 — le tiroir est le seul endroit où un profil se complète sans repasser par la sélection — ou différé explicitement.*

- [ ] **33 — La sélection n'a pas d'état vide.** (E02) `oeuvres.length === 0` donnerait une page blanche. Latent — aucune plateforme n'est vide et aucun filtre ne s'applique — et l'une des deux issues qu'E02 propose, changer de région, n'existe pas. *À traiter avec l'item 18.*

- [ ] **34 — On ne peut pas changer de console.** (E02, actions) Une fois la machine choisie, aucun chemin ne ramène au choix ; seul un rechargement le permet. Le libellé existait et ne servait à rien. *E02 précise « période conservée », ce qui demande de décider si l'on revient au choix de machine ou si l'on change de plateforme en gardant la période. Acceptation : un testeur qui se trompe de console s'en sort sans recharger.*

- [ ] **35 — Aucun contrat partagé entre l'API et le client.** `lire<T>` fait un `as T` : un champ que l'API ajoute, renomme ou rend facultatif disparaît côté front **sans qu'aucun outil ne puisse le dire**. Quatre omissions et une dérive de type l'ont montré. *Décision attendue : engendrer les types du client depuis l'API (OpenAPI, ou un schéma émis au build), ou tenir à la main l'inventaire des champs sciemment ignorés — il est écrit dans `client.ts`, mais rien ne le vérifie.*

- [x] **36 — Deux visuels violent la règle des 512 px.** (§3.3 condition 1) *Celeste* à 960×1539 et un `.webp` à 546 px. *Décision attendue : re-télécharger à la bonne taille depuis `source_url`, ou retirer les fichiers — la tuile générée reprend la place, c'est son rôle de socle. `calibration/test_covers.py` le signale tant que ce n'est pas fait.*

  **Repris à 500 px, et la cause corrigée.** Wikimedia ne sert qu'une **liste fixe** de tailles de vignette, et **512 n'en fait pas partie** : la demande était arrondie en silence — à **960** pour *Celeste*, près du double du plafond écrit — et le `.webp` revenait `thumbnail_unscaled`, c'est-à-dire l'original. `covers.MAX_WIDTH` vaut désormais **500**, la taille autorisée immédiatement sous le plafond, et `fetch_covers.py` **mesure** le fichier reçu au lieu de recopier `thumbwidth`. `calibration/test_covers.py` passe : les cinq conditions tiennent.

- [ ] **37 — Les trois contrôles hors ligne documentés ne tournent pas.** `CLAUDE.md` les présente comme lançables ; deux réclament des fichiers intermédiaires absents du dépôt (`resolved.json`, `wp_wikitextes.json`) et le troisième n'accepte qu'un répertoire courant précis. *Un garde documenté et non lançable est pire qu'aucun : il fait croire le sujet couvert.*

- [x] **38 — Sept types d'événements sur onze n'ont aucun producteur.** `DiscoveredGame`, `ReplayedGame`, `SoldItem`, `LostItem`, `LentItem`, `BorrowedItem`, `ReturnedItem`. Le tri et la cohérence causale les traitent ; rien ne peut les créer. *Ce sont ceux qui portent l'histoire d'une collection sur trente ans — le cas de validation n°1. Décision attendue : les rendre atteignables, ou écrire qu'ils attendent leur phase.*

  **Tranché le 22 septembre 2026 : ils attendent leur phase, et c'est désormais écrit** dans `MODELE-DE-DOMAINE.md`, à l'endroit même où les onze types sont déclarés. Les brancher relève de la Phase 3 ; les retirer coûterait un travail de conception déjà validé.

- [ ] **39 — Le souvenir n'atteint jamais la timeline.** (§9.1, §9.2) Zéro occurrence dans `TimelineEndpoints`. §9.2 prévoyait un **titre court servant de repère sur la timeline** — `MemoryRow` n'a pas de titre — et une note attachable **à une période**, ce que le modèle de cible ne permet pas. *§9.1 fait de cette section le porteur direct du « oui, ça me ressemble » : c'est le critère même de la porte de Phase 2.*

---

## Journal

- **01 — le choix de la machine.** Deux défauts, aucun corrigé : les deux demandent une construction, et la boucle ne construit pas. **La région est décidée en silence** (`App.tsx:59` et `:84`) alors que §3.4 en fait la condition de sens de la sélection massive. Le détail qui instruit : le composant `SelectionMassive` **se protège** — sa prop `region` est documentée « requise, sans valeur par défaut : un défaut choisirait en silence le marché d'un joueur » — et l'appelant fait exactement cela, un niveau plus haut. La garde était écrite, elle regardait dans la mauvaise direction. Second défaut : **`worksCount` traverse trois couches et n'est jamais affiché**, alors qu'E02 repère B le spécifie ; il est même *testé pour être juste*, ce qui le rend correct et invisible. Rien n'est persisté par cet écran — et la région n'est enregistrée nulle part, ce qu'il faudra trancher quand le profil deviendra un livrable.

- **02 — le choix de la période.** **Aucun mensonge** : la réparation d'hier tient, toute valeur transmise vient d'une saisie ou d'une suggestion affichée et modifiable, et onze tests plus le parcours le gardent. Mais le crible a trouvé autre chose, que la relecture de la spécification seule pouvait donner : **trois documents prescrivent un mode de saisie dérivé** — §7.3 🆕, E01 et `MODELE-DE-DOMAINE.md:74` — où le référentiel fournit le repère et l'utilisateur répond en langage courant (« à sa sortie », « sur le tard »). L'écran, lui, demande un nombre ; `SPECIFICATION.md:311` nomme exactement cet anti-motif, la « question nue ». Le prérequis manque d'ailleurs dans les données : le modèle veut une **fenêtre commerciale `from`/`to` par région**, le dataset ne porte que `launch_year`. Second constat : la **période ouverte** est acceptée par l'API, rendue par `libelle`, couverte par un test — et **aucun geste ne peut la produire**. Deux items ouverts, aucun code modifié.

- **03 — la sélection massive, passe 1.** Rien n'est envoyé à l'insu de l'utilisateur, et le tri suit bien la notoriété. Mais deux défauts, dont **le plus grave de l'audit jusqu'ici, et il est de la forme inverse du crible : dit sans être écrit**. `basculer` persiste quand on coche et **retourne sans rien envoyer quand on décoche**, alors qu'E02 écrit « chaque bascule est persistée immédiatement ». C'est le geste le plus fréquent de l'écran — le dépôt le dit lui-même — et il ne survit pas. Tant que rien n'était relu, cela ne se voyait pas ; **depuis l'item 22, le mensonge est visible** : on décoche, on recharge, la ligne revient. Second défaut : `neverPlayed` est rendu par l'API et **lu par personne**, si bien qu'un titre déclaré « jamais joué » revient indiscernable d'un titre non coché — la distinction même que §24.3 existe pour tenir. Un test s'appelait « la déclaration est révisable » en n'assérant qu'un compteur local : renommé, avec l'absence d'envoi désormais épinglée et rattachée à son item.

- **04 — la passe 2 et les titres libres.** Rien n'est envoyé à l'insu de l'utilisateur. Un défaut **corrigé** : les souvenirs n'étaient jamais relus, et le champ revenait vide alors que la phrase était en base — sur le contenu que §9 dit « le seul qui ne soit pas régénérable ». Six tests neufs, deux mutations annoncées et vérifiées ; l'une d'elles **n'a pas compilé**, le typage refusant une prop devenue inutilisée, ce qui fait du compilateur une garde faible mais réelle. Deux défauts inscrits, tous deux de la forme **dit sans être écrit**, comme celui de l'item 03 : « toujours en cours » est offert puis traité comme une absence de réponse, et les **titres saisis ne sont pas relus** — ils disparaissent de la sélection au rechargement tout en restant sur la timeline. Le crible aura donc trouvé cette forme trois fois en deux surfaces, alors qu'elle ne figurait pas dans ses trois questions.

- **05 — la timeline.** Écran en lecture seule : rien d'envoyé, rien de persisté, aucun geste perdu. Mais **trois champs sont rendus par l'API et jetés par l'écran**. `type` d'abord, et c'est la cause exacte du symptôme signalé depuis un téléphone — vérifié en base, une œuvre du profil porte trois moments, `AcquiredItem`, `CompletedGame`, `StartedGame`, que l'écran affiche en trois lignes identiques. `targetKind` ensuite : un titre saisi se donne pour une œuvre curée. Et les **avertissements causals** de §5.4, que l'API calcule et que le type du client ne déclare pas. Ce dernier est structurellement invisible : `lire<T>` **caste** le JSON, donc aucun compilateur ne peut signaler un champ manquant à l'appel. `confidence`, en revanche, n'est pas un manque : elle se déduit de la granularité, déjà rendue.

- **06 — l'assemblage du parcours.** **Quatre défauts, tous corrigés**, et une raison unique à leur survie : **`App.tsx` n'avait aucun test**. C'est pourtant là que vivent les valeurs qui traversent les écrans sans appartenir à aucun. L'état relu était **périmé** — chargé au seul choix de la machine, alors que changer la période démonte la sélection et emporte son état local, si bien qu'on revenait en voyant moins que ce que la base contenait. **« Recharger la liste » quittait l'écran**, le bouton appelant le choix de machine qui se termine par un retour à la période : un geste qui faisait autre chose que ce qu'il annonçait. Et surtout, **un échec réseau se rendait par un chargement éternel** — comme un catalogue vide : trois états pour une seule phrase, là où les principes §5 en exigent quatre distincts. Cinq tests neufs, deux mutations annoncées et vérifiées. Une observation sans défaut : `EtatDuService` est écrit, testé, et monté nulle part — le même défaut que `ZoneSansDate` avant l'item 18.

- **07 — la tuile et les époques.** Un défaut, et c'est une affirmation **visuelle** : `accentEpoque(null)` rendait la première époque, si bien qu'une œuvre non datée était peinte en terre cuite et étiquetée « 8 bits ». Le premier service du système d'époques étant « on sait où l'on est **sans lire de date** », la couleur affirme une décennie — l'affirmer sur une donnée absente est l'apprentissage 51 transposé au rendu. Corrigé par un neutre **chaud** tiré du langage visuel, ni gris ni l'une des six. Deux détails valent d'être notés. D'abord le chemin était **latent** : aucune des 221 œuvres n'est sans date aujourd'hui, et il ne le serait pas resté. Ensuite le test qui couvrait ce repli **passait avec le défaut** — il n'exigeait qu'un hexadécimal valide, ce que la mauvaise réponse était aussi. Une observation inscrite : `Tuile` n'a pas de repli si l'image échoue à charger, alors que §19.2 exige que rien ne cesse de fonctionner quand une jaquette empruntée disparaît.

- **08 — le statut régional.** Les quatre états étaient déjà solides : leurs tests exigent la marque de chacun et qu'aucun ne se rende par une absence. Mais §3.4 ne parle pas que du statut — « elle conditionne **aussi les dates de sortie affichées** » — et l'écran prenait **la sortie la plus ancienne du monde**. Mesuré plutôt que supposé : **97 œuvres sur 221** affichaient une année différente de leur année PAL, jusqu'à **six ans d'écart**, *Adventure Island* étant annoncé 1986 pour une parution européenne de 1992. Sur l'écran dont toute la mécanique repose sur la reconnaissance, le joueur voyait une date qu'il n'avait jamais vue. La sortie de sa région passe devant ; à défaut, la plus ancienne, que le statut régional qualifie alors. Quatre tests de client, une mutation annoncée et vérifiée.

- **09 — la bande d'époque.** Le composant est juste : ses quatre champs sont rendus, et il dit même ce qu'il ne place pas. Deux constats, et le second est le plus lourd de l'audit. D'abord **§24.4 porte trois promesses et une seule est tenue** — les premières statistiques et la phrase de récit ne sont ni construites ni inscrites, alors que cette section est la réponse au risque produit numéro un. Ensuite : **il n'y a aucune feuille de style dans le projet**. Aucun fichier CSS, aucun lien, aucun import, trois styles en ligne au total — et la bande référence des classes qui n'existent pas, si bien que ses barres sont des `<span>` de hauteur relative dans un conteneur sans hauteur. Le langage visuel appelle pourtant ce mouvement « le mouvement le plus important du produit ». Et rien ne le signale : la bande est testée par ses attributs, le parcours les assère, tout dit que la récompense fonctionne pendant que rien n'est visible.

- **10 — la zone sans date et le rendu temporel.** Le contraste de cette surface est instructif. §6 porte trois exigences : celle qui **nomme un algorithme** — « ordre du tiroir : `RecordedAt` décroissant » — est implémentée, gardée par deux tests du domaine dont un né d'une mutation survivante, **et par un test miroir à l'API**. Les deux qui **nomment une intention** — « le tiroir est une tâche, pas une poubelle, dimensionné pour être vidé » et « il compte dans les totaux du profil » — n'existent pas : le tiroir n'accepte aucun geste. Et en cherchant ce qu'aucun fichier ne réclame : **`Age` est un sous-système complet et inatteignable** — la variante, sa résolution par l'horizon, le paramètre `birthYear` de `/timeline` — que le front n'envoie jamais. Des sept granularités de §7.3, un événement de joueur ne peut en porter que trois.

- **11 — le contexte de saisie et l'état du service.** Un défaut corrigé : **quatre chemins asynchrones sans `catch`**, si bien qu'un échec laissait l'écran figé et muet — le testeur appuie, rien ne se passe, il appuie encore. Mais l'itération vaut surtout par ce qu'une **prédiction fausse** a révélé. J'attendais quatre échecs de la mutation ; il y en a eu trois. Le quatrième devait venir du garde des libellés morts — qui, vérification faite, **ne pouvait pas échouer** : `messages.ts` figurait parmi les sources où l'on cherche un usage, et chaque clé s'y trouve par définition. Une clé fabriquée que personne n'utilisait passait. Le contrôle voisin avait son témoin ; celui-ci n'en avait pas. Réparé avec deux témoins — la logique, et l'exclusion du catalogue —, il a immédiatement trouvé un vrai mort : **`parcours.retour`, « Changer de console »**, dont le libellé existait sans que l'action existe. On ne peut pas changer de console sans recharger la page.

- **12 — le client HTTP.** Comparaison champ par champ : **quatre omissions** — dont deux légitimes —, **une dérive de type** et **un point d'entrée orphelin**. `/unresolved/{user}` n'est jamais appelé alors que c'est précisément le moyen de relire les titres saisis (item 24). La dérive mérite son détail : l'année de lancement est **facultative** côté modèle, le chargeur **saute l'invariant 03b** quand elle manque, et le client la déclare `number` — un `null` traversé donnerait `null + 2 === 2`, donc une année suggérée de **2**, et plus rien ne refuserait une date antérieure à la machine. L'itération s'est réglée sur une **misprédiction** : j'annonçais un échec, il y en a eu trois, et l'écart a montré que **la garde existait déjà** — `GetInt32()` lève sur un `null`. Mon test était un doublon ; retiré, sa raison inscrite dans la garde existante. Les omissions sont désormais un tableau dans `client.ts` : faute de contrat partagé, une décision écrite vaut mieux qu'un silence.

- **13 — le catalogue et les jaquettes.** Les cinq conditions écrites de §3.3 sont vérifiables, et je les ai **mesurées**. Trois tiennent, une est partielle, et **le manifeste mentait sur les 218 visuels** : il inscrivait `width: 512` partout — non pas une mesure, mais la taille *demandée* à la source. Les fichiers vont de **213 à 960 px, médiane 300**. Le champ `bytes` était juste **au bit près** : dans un même enregistrement, certains champs sont des observations et d'autres des intentions, et rien ne les distinguait — sur la pièce même qui documenterait une demande de retrait. Corrigé, les 218 entrées portent la mesure. Le contrôle qui manquait est écrit — `calibration/test_covers.py`, qui ne lit que des fichiers versionnés —, et il signale la vraie infraction : **deux visuels dépassent 512 px**, *Celeste* à 960. En le lançant, j'ai découvert que **les trois contrôles hors ligne documentés dans `CLAUDE.md` ne tournent pas** : deux réclament des intermédiaires absents du dépôt, le troisième n'accepte qu'un répertoire courant précis.

- **14 — les déclarations et l'état relu.** Rien n'est inventé en chemin, et les valeurs par défaut porteuses de sens ont disparu avec l'item 24 de la Phase 1. Deux constats. Une **dérive de vocabulaire** : `/declarations/{userId}` rend les noms du domaine, `/selection` ceux de l'écran — sans conséquence aujourd'hui, mais c'est un piège pour le prochain appelant. Et surtout, **une garde qui n'existait que dans le navigateur** : l'écran refuse « 1985 sur Super Nintendo » et nomme l'année de sortie, l'API acceptait. Mesuré plutôt que supposé. Corrigé en ne refusant que **l'impossible certain** — on compare l'année la plus tardive que la période autorise —, de sorte qu'une imprécision qui chevauche l'impossible reste acceptée : « vers 1991 » sur une console de 1990 peut vouloir dire 1992, et refuser exigerait la précision que §7.3 interdit de demander.

- **15 — la persistance.** Les vingt valeurs par défaut sont énumérées : dix-huit sont l'idiome C# `""`, jamais persisté ; les deux porteuses de sens sont justes depuis la correction de l'affect. Le manque était ailleurs, et il s'est trouvé en **mesurant le schéma** plutôt qu'en lisant le code : quatre tables portent un `user_id`, la purge en efface quatre, quatre tests l'éprouvent — **un par table** — et **aucun ne garantissait l'exhaustivité**. Une cinquième table serait oubliée en silence, sur un produit dont §19.4 fait de l'effacement une contrainte de conception. La garde interroge désormais `information_schema` et le compare à une liste écrite. Sa mutation a d'abord **échoué à s'injecter** — créer une table à la main ne change rien, la suite recrée sa base à chaque exécution : la garde était bonne, la mutation invalide, et seul l'écart l'a dit.

- **16 — la timeline servie et les souvenirs.** La surface elle-même est saine : rien d'inventé, rien de jeté côté serveur, et la confiance est **dérivée** plutôt que stockée, donc incapable de diverger de ce qu'elle résume. Mais les deux contrôles d'**ensemble** échouent tous les deux. **Onze types d'événements sont déclarés, quatre sont atteignables** : vendu, perdu, prêté, rendu, redécouvert, rejoué n'ont aucun producteur, alors que ce sont eux qui portent l'histoire d'une collection sur trente ans. Et **§9.2 porte trois exigences dont deux sont absentes** — le titre court « servant de repère sur la timeline », et la note attachable à une période. Le plus lourd tient en un chiffre : **zéro occurrence de souvenir dans `TimelineEndpoints`**. La section qui, d'après §9.1, « porte directement le critère de validation du projet » n'atteint jamais l'écran censé produire ce jugement.

- **17 — le verdict.** **Non, le POC ne peut pas être montré à un testeur**, et la raison n'était dans aucun bilan précédent : **il n'a pas d'apparence**. Le bilan de clôture de Phase 1 listait ce qui manquait en fonctionnalités et concluait « montrable » ; il n'avait pas posé la question qu'aucun fichier ne pose — *où est le CSS ?* Trois autres blocages se corrigent en heures ; celui-là est un chantier. L'audit aura trouvé vingt-trois items, corrigé huit défauts avec leurs tests et leurs mutations, remis d'aplomb deux artefacts — le manifeste des jaquettes et un garde qui ne pouvait pas échouer —, et gagné une quatrième question en chemin. Son apport le plus durable tient peut-être en une phrase : **ce dépôt construit plus de capacité qu'il n'en branche**, et rien ne le signale, parce qu'une capacité non branchée est testée, documentée, et verte.
