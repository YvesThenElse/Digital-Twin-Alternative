# Apprentissages

> **Relu au début de chaque itération, complété à la fin.** Un journal qu'on
> n'ouvre jamais ne change aucun comportement ; celui-ci n'existe que parce
> qu'il est relu.

## Ce qui a sa place ici, et ce qui n'y en a pas

| Nature de ce qu'on apprend | Où ça va |
|---|---|
| Un piège d'outillage, une façon de se tromper, une méthode qui a marché | **Ici** |
| Un fait sur le **domaine** — une règle métier, une contrainte du modèle | Dans la **spécification**, pas ici. L'enterrer dans un journal le rendrait introuvable |
| Une **contradiction** dans la spécification | Nulle part : on **arrête la boucle** et on le signale |
| « L'item est fait, tout s'est bien passé » | **Nulle part.** Un journal rempli de non-événements détruit sa propre valeur |

**Écrire zéro ligne est une issue normale.** Une itération sans surprise n'apprend rien, et le dire quand même ne fait que diluer ce qui compte.

## Format

Une entrée par chose apprise, pas une par itération. Chacune dit **ce qui s'est passé**, puis **la règle que ça suggère** — sans la règle, c'est une anecdote.

> ⚠️ **La règle doit commencer par un verbe d'action.** « Compter les cas », « perturber plutôt que comparer », « inclure une mutation survivante ». Une règle qui dit ce qu'il faut *remarquer* — « ne pas oublier que… », « attention à… » — ne change aucun geste et n'a jamais protégé de rien ici. C'est vérifiable d'un coup d'œil, contrairement à « est-ce utile ? ».

---

## Acquis avant la boucle

Ces entrées viennent de la constitution du référentiel, le 20 septembre 2026. Elles sont ici parce qu'elles portent sur la manière de travailler, pas sur le domaine.

### Une donnée absente se lit comme un fait, et ne lève jamais d'erreur

Trois fois dans la même journée. Une table de correspondance à laquelle manquait « Amérique du Nord » a fait passer la couverture régionale pour quatre fois plus faible qu'elle n'était. Des identifiants tirés au hasard rendaient toute régénération destructrice. Des rééditions prises pour des sorties d'origine ont failli faire écrire que neuf titres majeurs n'étaient jamais sortis en Europe.

Aucune n'a produit de message d'erreur. Toutes ont produit des chiffres d'apparence normale.

> **Règle** — devant un résultat agrégé, lire des lignes avant de conclure. Les trois ont été attrapées en regardant des cas particuliers, jamais une moyenne.

### Une vérification mal cadrée confirme ce qu'on espère

J'ai annoncé les identifiants comme stables et je l'ai « vérifié » en comparant deux émissions — entre lesquelles le nombre de sorties n'avait pas bougé, c'est-à-dire dans le seul cas où le défaut était inoffensif.

> **Règle** — perturber plutôt que comparer. Un test utile casse une entrée et exige que rien d'autre ne bouge. Corollaire : un test qui passe du premier coup mérite qu'on vérifie qu'il échoue quand on casse volontairement ce qu'il couvre.

### Un outil qui fait bien son travail peut répondre à côté de la question

`prop=pageimages` renvoyait « pas d'image » pour 220 articles sur 222. L'extension exclut délibérément les fichiers non libres — c'est-à-dire exactement les jaquettes. Pris pour argent comptant, le résultat concluait que les jaquettes sont introuvables, et le chantier s'arrêtait sur un artefact d'API.

> **Règle** — un zéro massif et net est plus souvent une panne qu'une mesure. Vérifier l'instrument sur un cas dont on connaît la réponse avant d'en tirer une conclusion.

### Une source écartée sans être examinée reste un angle mort

La vérification juridique rejetait toutes les sources sauf une. Le motif était juste — l'interdiction de redistribuer — mais Wikipédia n'y tombait pas, et n'avait simplement jamais été évaluée. Elle a fait passer la couverture régionale de 56 % à 92 %.

> **Règle** — distinguer « écarté pour un motif vérifié » de « jamais regardé ». La seconde catégorie doit être énumérée explicitement, sinon elle disparaît.

### Le préalable coûte moins cher que la reprise

Le SDK .NET n'était pas installé, .NET 10 produit un `.slnx` et non un `.sln`, et Docker écrit en `root` sans `--user`. Trois obstacles triviaux qui auraient fait tourner une boucle à vide.

> **Règle** — avant toute exécution répétée, faire passer la chaîne complète une fois à la main.

---

## Itérations

### 01 — `TemporalValue`

Rien de nouveau sur le fond : la vérification par mutation a confirmé ce que l'entrée « une vérification mal cadrée » prévoyait, en produisant exactement le nombre d'échecs attendu. C'est une application, pas une découverte.

> **Utile quand même** — annoncer le nombre d'échecs attendu *avant* d'injecter les mutations. Trois mutations donnaient quatre échecs, parce que deux cas d'un `[Theory]` tombaient ensemble ; ne pas l'avoir prévu aurait laissé un doute sur la cause du quatrième.

### 02 — Un invariant attrape ce qu'un test ciblé laisse passer

Prévision annoncée avant d'injecter trois mutations : trois échecs, un par
mutation. Résultat : **quatre**. Le quatrième venait de
`Tout_intervalle_contient_son_point_representatif` sur `ExactDate` — un
intervalle d'un seul jour a une largeur nulle, et le décalage du milieu
poussait le point hors de son propre intervalle.

J'avais prédit ce test insensible à cette mutation. Je raisonnais sur les
valeurs « normales » et j'oubliais le cas dégénéré.

> **Règle** — écrire au moins un invariant par item, et y faire figurer le cas
> dégénéré : largeur nulle, collection vide, borne unique. Un test ciblé
> vérifie ce qu'on a pensé ; un invariant vérifie ce qu'on n'a pas pensé, et
> c'est là qu'on se trompe.

> **Règle** — la prévision garde sa valeur même fausse : sans elle, le
> quatrième échec aurait été compté comme une confirmation au lieu d'être
> cherché. C'est l'écart qui instruit, pas le compte.

### 04 — Des mutations simultanées donnent un compte ininterprétable

Trois mutations injectées ensemble dans la même chaîne de décision. Prévision
obtenue en calculant chaque effet séparément puis en additionnant : **13**.
Résultat : **4**. Rejouées une par une : 12, 2, et 1.

L'interaction va dans les deux sens, et c'est ce qui rend le compte groupé
inexploitable.

**Masquage** — rendre l'inclusion stricte faisait retomber les intervalles
identiques dans la branche `Égal`, ce qui **réparait** entièrement le
déplacement de `Égal` après les inclusions. Douze échecs attendus, zéro
observé.

**Amplification** — j'attribuais à « `Before` avec `<=` » quatre échecs sur
les intervalles de largeur nulle. Isolée, cette mutation n'en produit qu'un :
les intervalles identiques sont interceptés par `Égal`, qui passe en premier,
et n'atteignent jamais la branche `Before`. Ces quatre échecs n'existaient que
parce qu'une *autre* mutation avait déplacé `Égal`.

Les items 01 à 03 additionnaient juste — mais par accident de structure, leurs
mutations touchant des fichiers distincts. Le raisonnement était faux depuis
le début ; il n'avait simplement pas encore eu l'occasion de le montrer.

> **Règle** — une mutation à la fois, restaurée entre chaque. Un compte
> groupé ne correspond à aucun défaut réel. Si l'injection groupée est plus
> commode, elle ne vaut que pour répondre « au moins un test mord », jamais
> pour interpréter un nombre.

### 04 bis — Prédire qu'une mutation survit est un outil, pas un aveu

J'ai annoncé qu'une des trois ne casserait rien : rendre l'inclusion stricte,
faute d'une contenance partageant une borne dans les données de test. Elle a
survécu, et a révélé un trou réel — toutes mes contenances avaient de la marge
des deux côtés. Janvier 1994 commence le même jour que l'année 1994 ; ce cas
n'était nulle part.

> **Règle** — inclure délibérément une mutation qu'on pense survivante. Ne
> tester que des mutations qu'on sait mortelles vérifie que les tests
> existent, pas qu'ils couvrent.

### 04 ter — Un nom de test peut mentir, et c'est pire qu'un test absent

`Deux_periodes_qui_se_touchent_par_un_jour_se_chevauchent` portait sur
`Range(1993–1995)` et `Range(1995–1997)` : elles se recouvrent sur **toute
l'année 1995**, soit 365 jours. Le nom décrivait mon intention, pas la donnée.

Le coût n'est pas le test inutile — il était juste, seulement mal nommé. Le
coût est que **je croyais le cas couvert**, donc je ne l'ai pas écrit. Un test
absent laisse un vide qu'on peut voir ; un test mal nommé le remplit d'une
fausse assurance.

> **Règle** — relire le nom d'un test contre ses données, pas contre son
> intention. Si le nom énonce une valeur — « un seul jour », « vide », « une
> seule entrée » — vérifier que la donnée la porte vraiment.

### 05 — Une mutation qui doit rester silencieuse est une preuve

J'ai démontré que le critère 3 de la cascade est inatteignable : le point
représentatif vaut `début + largeur / 2`, donc à début et milieu égaux les
largeurs ne peuvent différer que de 1, ce qu'aucune des sept variantes ne
produit. Vérifié par énumération sur 88 000 paires.

Plutôt que de m'en tenir là, j'ai **retiré le critère du code** et exigé que
rien ne casse. Zéro échec attendu, zéro obtenu.

> **Règle** — la mutation ne sert pas qu'à éprouver les tests ; elle éprouve
> aussi les affirmations qu'on fait sur le code. « Cette branche ne sert
> jamais », « ce paramètre n'a pas d'effet ici » : retire-la et exige le
> silence. Une mutation qui doit rester muette prouve autant qu'une mutation
> qui doit tuer.

### 05 bis — La règle de l'item 04 ne m'a pas protégé, parce qu'elle arrivait trop tard

Un test nommé `Critere_3_a_debut_egal_le_plus_precis_vient_d_abord` ne testait
pas le critère 3 : les deux valeurs choisies ont des milieux différents, donc
le critère 1 tranche bien avant. Exactement la faute de l'item 04 — un nom qui
décrit l'intention et non la donnée — commise une itération plus tard, sans
que je la reconnaisse.

Relire le nom contre les données n'a pas suffi : le nom *et* les données
semblaient cohérents. Ce qui manquait, c'est que rien ne reliait le test au
critère qu'il prétend couvrir.

> **Règle** — un test qui prétend éprouver un mécanisme précis doit être
> validé par une mutation **de ce mécanisme-là**. Si muter le critère 3 ne
> tue pas le test nommé « critère 3 », le nom ment — et cette vérification
> est mécanique, là où la relecture dépend de l'attention.

### 06 — Un critère qui dépend du couple ne peut pas rejoindre une cascade de clés

Les critères 1 à 3 de la cascade sont des **clés** : la position d'un élément
n'y dépend jamais des autres. Le critère 4 — la cohérence causale — dépend du
**couple**. L'ajouter naïvement à une chaîne `ThenBy` produirait une relation
non transitive, que le tri de .NET rejette à l'exécution (« IComparer returns
inconsistent results ») ou, pire, applique en silence.

La forme qui a marché : appliquer les critères-clés d'abord, **repérer les
groupes qu'ils ne départagent pas**, et n'exécuter le critère par couple qu'à
l'intérieur de ces groupes — par tri topologique, en choisissant à chaque pas
le plus petit candidat au sens de l'ordre déjà établi.

Ce n'est pas seulement une commodité technique : c'est aussi ce que la
spécification décrit. §4.3 n'invoque la causalité que « à intervalles non
strictement ordonnés », ce qui est exactement la définition d'un groupe à
égalité de clés. La contrainte d'implémentation et la règle métier coïncident.

> **Règle** — devant un critère de tri qui dépend de deux éléments, ne pas
> l'insérer dans la chaîne de clés. Segmenter par les clés, puis l'appliquer
> dans chaque segment. Et vérifier le déterminisme en permutant l'entrée : un
> critère par couple est précisément ce qui rend un tri instable.

### 07 — Compter les cas de `[Theory]`, jamais les méthodes

Prévision de mutation : 6 échecs, obtenus en énumérant six **méthodes** de
test. Résultat : 8. L'une d'elles était un `[Theory]` à trois jeux de données,
et xUnit compte un échec **par cas**.

Erreur déjà commise à l'itération 01, et reproduite à l'identique six
itérations plus tard.

> **Règle** — énumérer les cas, pas les méthodes : un `[Theory]` à *n* jeux
> de données compte pour *n*.

### 07 bis — Une règle qui ne commande aucun geste ne protège de rien

L'entrée de l'itération 01 disait : « ne pas l'avoir prévu aurait laissé un
doute sur la cause du quatrième ». C'est un constat. Six itérations plus tard
j'ai refait la même erreur, en ayant relu ce texte à chaque ouverture.

C'est la **troisième** fois qu'une règle du journal échoue, et les trois ont
la même forme : elles décrivaient ce qu'il fallait *remarquer* au lieu de ce
qu'il fallait *faire*. L'item 04 avait produit une vraie règle — « une
mutation à la fois » — et celle-là a tenu.

> **Règle** — exiger qu'une entrée se termine par un verbe d'action, et la
> réécrire sinon. Le critère est mécanique, donc vérifiable : « remarquer
> que » n'en est pas un, « compter » en est un.

### 07 ter — Viser les cas que les utilitaires de test rendent inatteignables

Troisième trou révélé par une mutation annoncée survivante, et troisième fois
que c'est **le même genre** : un utilitaire de test qui renseigne toujours
deux champs ensemble — ici l'année ET la date de naissance — masque la
question de savoir lequel compte. Un profil ne portant que la date aurait
cessé de résoudre `Age`, sans qu'aucun test ne le dise.

> **Règle** — choisir la mutation survivante en regardant les **helpers de
> test**, pas le code de production : muter ce qu'un helper remplit toujours
> de la même façon. C'est un angle mort structurel, pas une inattention.

### 08 — Distinguer le code mort du code en attente

Troisième bout de code prouvé sans effet par mutation : après le critère 3 de
la cascade et la garde anti-cycle du tri topologique, voici l'union des
intervalles d'un épisode. La règle 1 impose que les membres portent le même
intervalle ; leur union leur est donc nécessairement égale.

Ce n'est pas un défaut de la spécification, et le motif est constant : **elle
énonce plus large que ce que ses propres contraintes autorisent**. Le critère
3 départage sur une largeur que rien ne peut rendre différente. La règle 2
unit ce que la règle 1 force à être identique. Les deux énoncés restent
justes, et redeviendraient opérants si la contrainte amont s'assouplissait.

Le risque est qu'un lecteur pressé supprime ce code comme mort. Il ne l'est
pas : il est **en attente**.

> **Règle** — accompagner tout code prouvé sans effet d'un test qui
> **constate** la contrainte amont le rendant inutile, et le dire dans le
> commentaire. Le test échouera le jour où la contrainte changera, ce qui est
> exactement le moment où ce code redeviendra nécessaire.

### 09 — Vérifier les champs destinés à un consommateur qui n'existe pas encore

Quatrième trou révélé par une mutation annoncée survivante, et le premier qui
ne vienne pas d'un utilitaire de test. `TemporalQueryResult` porte un champ
`Mode` : forcer sa valeur à `Strict` ne cassait aucun test.

Ce champ existe parce que §7.1 exige que le mode retenu soit **visible dans
l'interface**. L'interface n'est pas construite, donc rien ne lit ce champ,
donc rien ne remarque qu'il pourrait mentir. Le jour où E10 le branchera,
l'erreur s'afficherait comme un chiffre juste sous une étiquette fausse.

C'est un angle mort propre au travail en couches : tant que la couche
consommatrice manque, les données préparées pour elle ne sont vérifiées par
personne. Les trois trous précédents venaient des helpers ; celui-ci vient de
l'avance qu'on prend sur l'aval.

> **Règle** — tester tout champ ajouté pour un consommateur absent, au moment
> où on l'ajoute. Le repérer est mécanique : c'est un membre public que
> **aucun test n'assert** et **aucun code du domaine ne lit**.

### 10 — Ne jamais réutiliser le `null` d'une normalisation comme un `null` métier

`Normalize` rend `null` pour « pas d'intervalle ». Le paramètre `disposed`
vaut `null` pour « pas de cession ». J'ai testé le premier en croyant tester
le second, et les deux significations se sont fondues : un joueur déclarant
« je l'ai vendu, je ne sais plus quand » était affiché comme possédant
**certainement** encore le jeu.

Le compilateur ne pouvait rien voir — deux `null` du même type. C'est la
version typée de l'erreur qui hante ce dépôt : une absence qui se lit comme
un fait, sauf qu'ici l'absence était **fabriquée par ma propre
normalisation** plutôt que présente dans les données.

> **Règle** — nommer une variable booléenne pour chaque question métier avant
> de tester un `null` issu d'une conversion : `cessionDeclaree` à côté de
> `d is null`. Deux `null` de sens différents dans une même fonction doivent
> porter deux noms différents.

### 10 bis — Compter les tests, pas les assertions

Prévision de mutation : 3 échecs, obtenus en comptant trois **assertions**.
Résultat : 1 — elles vivaient dans la même méthode, et xUnit compte des
tests.

C'est le pendant exact de l'erreur de l'item 07, où je comptais des méthodes
là où il fallait compter des cas de `[Theory]`. Je me trompe deux fois sur la
même chose : l'unité que le rapporteur compte.

> **Règle** — compter les **cas exécutés** : un `[Fact]` vaut 1 quel que soit
> son nombre d'assertions, un `[Theory]` vaut son nombre de jeux de données.

### 10 ter — Un invariant ensembliste peut être satisfait par dégénérescence

« Les deux listes sont disjointes » passait alors qu'une mutation les
fusionnait — parce que la liste receveuse devenait vide, et qu'une
intersection avec le vide est vide. L'invariant était vrai, et sans valeur.

> **Règle** — exiger que les ensembles soient **non vides** avant de vérifier
> une propriété ensembliste. Sans cette garde, l'invariant se satisfait du cas
> dégénéré qu'il devrait justement interdire.

### 06 bis — Rejouer une faute commise vaut mieux qu'inventer une altération

Après correction d'une contradiction de spécification, j'ai muté le code pour
réintroduire **exactement l'erreur d'origine** : le maillon causal fautif, son
remplaçant retiré, les anciens noms de types.

Muter au hasard vérifie que des tests existent. Rejouer une faute qu'on a
effectivement commise vérifie qu'elle **ne peut pas revenir** — et celle-ci le
pourrait facilement : un lecteur de §4.3 dans six mois, sans le contexte,
jugerait l'ancien maillon plausible.

> **Règle** — après toute correction d'un défaut réel, muter le code pour
> réinjecter ce défaut précis et exiger qu'un test meure. Le correctif est
> alors gardé, pas seulement appliqué.

### 06 ter — Les vecteurs de la spécification dictent où va l'attention

La chaîne d'expérience (`StartedGame` → `CompletedGame`) était éprouvée de
bout en bout ; la chaîne de possession (`AcquiredItem` → `SoldItem`) n'avait
qu'un test de prédicat. Renommer ses types ne tuait donc qu'un seul test.

Les deux ont pourtant le même statut dans le modèle. La dissymétrie vient de
l'ordre du travail : les vecteurs T4 et T5 portent sur l'expérience, donc les
tests de bout en bout se sont construits autour d'elle. Ce que les vecteurs ne
mentionnent pas reçoit moins de soin, même à rang égal dans le modèle.

> **Règle** — après avoir traité les vecteurs d'un item, énumérer les règles
> **symétriques** du modèle qu'aucun vecteur ne couvre, et leur donner le même
> niveau de test. Les vecteurs sont un échantillon, pas la spécification.

### 11 — Un invariant d'exclusion doit être réversible

L'invariant 8 dit que `NeverPlayed` exclut toute autre déclaration. Lu
littéralement, déclarer « j'ai adoré » après « jamais joué » serait un refus
— ce que l'invariant 10 interdit formellement.

Les deux ne se contredisent pas : l'exclusion porte sur l'**état final**, pas
sur la **séquence des gestes**. Déclarer un affect lève donc `NeverPlayed`,
et c'est une correction, pas une faute. Même chose pour le préféré unique :
en désigner un second rétrograde le premier plutôt que de refuser le second.

> **Règle** — devant un invariant d'exclusion, écrire le test de la
> **correction** avant celui de l'exclusion : « A exclut B » doit se lire
> « déclarer B lève A », jamais « déclarer B est refusé ».

### 11 bis — Assertionner les ancrages de l'outillage de mutation

Deuxième fois qu'un motif de mutation ne s'ancre pas — une fois en double
occurrence, une fois par formatage divergent. Les deux fois le script a
**refusé de muter** et affiché le compte trouvé, ce qui a rendu le problème
visible aussitôt.

Sans cette garde, `replace()` aurait muté zéro fois, le test aurait affiché
« 0 échec », et j'en aurais conclu à un trou de couverture inexistant. Un faux
négatif dans l'outillage de vérification est indétectable par construction :
rien ne vérifie le vérificateur.

> **Règle** — asserter `count(ancrage) == 1` avant toute substitution dans un
> script de mutation, et afficher le compte quand elle échoue. L'outillage de
> contrôle mérite la discipline qu'il impose au code.

### 12 — Tester les croisements entre sections, que ni l'une ni l'autre ne réclame

Rien ne vérifiait que les événements de possession sont exclus du
dénominateur du taux de complétion. Un joueur possédant 200 jeux et en ayant
joué 20 aurait vu son taux calculé sur 200 — une mesure de sa bibliothèque,
pas de son parcours.

La cause n'est pas l'inattention. §6 décrit le taux sans rappeler
l'invariant 5 ; §7 pose l'invariant 5 sans parler du taux. **Le test qui les
relie n'est réclamé par aucune des deux sections**, et il ne se voit ni en
relisant l'une ni en relisant l'autre.

C'est la forme la plus durable des trous rencontrés jusqu'ici — voisine de la
dissymétrie de l'item 06 bis, mais plus difficile à repérer : là il manquait
un test là où un autre existait, ici il n'y a aucune trace du manque.

> **Règle** — après avoir implémenté une section, relire la **liste des
> invariants** et écrire un test pour chacun qui s'applique à ce qu'on vient
> d'écrire, même quand la section ne les mentionne pas.

### 12 bis — Écrire des tests qui interdisent une simplification future

« Toujours en cours » est une absence : aucun événement ne la déclare. Un
développeur pressé ajouterait un type `StillPlayingGame` — le code
deviendrait plus direct, et une propriété calculée se changerait en état à
maintenir, donc à désynchroniser.

Un test interdit désormais qu'un type porte ce nom. Il ne valide rien du
présent : il garde une décision d'architecture contre sa propre commodité.
C'est le troisième du genre, après la clé de tri invisible au rendu et le
critère 3 défensif.

> **Règle** — quand une décision d'architecture rend le code moins direct,
> écrire le test qui échouera si quelqu'un la défait « pour simplifier ».
> Le commentaire explique ; seul le test empêche.

### 13 — Un parcours réaliste trouve ce que douze items de tests unitaires ont laissé passer

Le cas de validation n°1 — « une console revendue puis rachetée » — a révélé
une erreur de lecture commise à l'item 06 et invisible depuis, malgré six
mutations toutes conformes sur cet item.

Je lisais §5.4 comme « une paire inversée est contradictoire ». Elle dit
qu'un moment **sans prédécesseur valide** l'est. La différence ne se voit pas
tant qu'un seul cycle de possession existe — et tous mes tests de l'item 06
n'en avaient qu'un. Avec deux cycles, comparer toutes les paires voit
« acquis 2018 après vendu 1994 » et alerte sur un parcours banal.

Aucun de mes tests unitaires n'était faux. Leur somme laissait passer une
erreur que seul un parcours de trente ans pouvait exposer.

> **Règle** — écrire au moins un scénario où le même sujet traverse
> **plusieurs cycles** de la même chaîne causale : acquis-vendu-racheté,
> commencé-fini-rejoué. Un cycle unique valide la règle et masque sa
> composition.

> **Règle** — ne pas conclure d'un contrôle par mutation réussi que la
> couverture est bonne. Il vérifie que les tests écrits mordent ; il ne dit
> rien de ce qu'on n'a pas pensé à tester. Les six mutations conformes de
> l'item 06 portaient toutes sur du code dont la logique était fausse.

### 14 — L'invariant que j'avais écrit dans le TODO était faux

L'item 14 demandait de vérifier que « `precision` est cohérente avec
`confidence` ». J'avais écrit cette ligne moi-même, en supposant une
correspondance stricte : jour ↔ haute, mois ↔ moyenne, année ↔ basse.

Le dataset réel porte **cinq couples**, pas trois :

| precision | confidence | sorties |
|---|---|---|
| day | high | 278 |
| day | medium | 204 |
| month | medium | 48 |
| year | medium | 3 |
| year | low | 130 |

Les 204 sorties `(jour, moyenne)` viennent de Wikipédia : la date y est
précise au jour, mais la source est secondaire. La précision et la confiance
mesurent deux choses différentes — la **finesse** de la date et la **solidité**
de son rattachement. Coder l'équivalence aurait déclaré 255 sorties fautives
et poussé à « corriger » des données justes.

L'invariant tenable est l'absence de sur-affirmation : `high ⟹ day`,
`low ⟹ year`, `medium` libre. Il est vrai sur les 663 sorties, et il dit
quelque chose — on ne revendique jamais une précision que la confiance ne
soutient pas.

> **Règle** — confronter tout invariant aux données réelles **avant** de
> l'écrire en test, en énumérant les combinaisons effectivement présentes.
> Un invariant inventé au bureau transforme des données justes en anomalies.

> **Règle** — écrire le test qui **autorise** explicitement les cas légitimes
> surprenants, pas seulement celui qui rejette les fautifs. Ici, les cinq
> couples valides sont un `[Theory]` : il interdit de revenir à la règle
> stricte lors d'un futur « nettoyage ».

**Contrôle par mutation** : 5 prédictions, 5 exactes, dont une survivante
voulue (`Ordinal` → `OrdinalIgnoreCase` sur la table des identifiants —
rien ne protège d'un effondrement par la casse ; sans conséquence tant que
les identifiants restent en minuscules, mais ce n'est garanti nulle part).

### 15 — Un document qui énonce des chiffres devient faux en silence

L'item 15 demandait que PHASING.md §3 « dise la vérité ». Il ne la disait
plus, sur cinq points, tous introduits par mon propre travail des items
précédents :

| §3 affirmait | Réalité au 21 septembre |
|---|---|
| 706 sorties | 663 — 43 rééditions retirées |
| provenance CC0 | CC BY-SA 4.0, Wikipédia ayant été ajoutée |
| « aucune autre source dans le référentiel » | deux sources |
| « une seule est réutilisable » | deux |
| 44 % d'œuvres sans région | 8 % |

Aucune de ces phrases n'était fausse quand je l'ai écrite. Chacune l'est
devenue parce qu'un item ultérieur a changé ce qu'elle décrivait, sans que
rien ne le signale. Un test qui devient faux échoue ; une phrase qui devient
fausse se relit sans broncher.

> **Règle** — quand un item change un chiffre ou une décision, chercher dans
> le même commit les autres documents qui l'énoncent, par `grep` sur le
> chiffre lui-même. Le document source n'est jamais le seul à le porter.

> **Règle** — préférer, dans un document, le chiffre **dérivable** au chiffre
> recopié : « ses invariants sont vérifiés par `DatasetLoader` » ne périme
> pas, « 706 sorties » périme. Quand le chiffre est nécessaire, le dater.

Un second piège, plus discret, s'est glissé dans le bilan lui-même : j'y
avais écrit « 18 œuvres sans région, 104 sorties », en accolant deux chiffres
justes séparément. Les 18 œuvres ne portent que **18 sorties** ; les 86
autres sorties sans région appartiennent à des œuvres qui en ont une
ailleurs. Vérifier avant de publier l'a rattrapé.

> **Règle** — deux chiffres vrais placés côte à côte forment une affirmation
> qui, elle, peut être fausse. Recalculer la phrase, pas les chiffres.

### 16 — Trois arbitrages, et le cas unique qui révèle la règle générale

Bubble Bobble était le **seul** titre curé sur deux machines, sur 222. Un cas
sur 222 a mis au jour trois défauts, dont aucun ne lui était propre :

1. **`notability` était un entier sur l'œuvre**, alors que §3.3 demandait
   « un score par sortie ». `MODELE-DE-DOMAINE.md` avait glissé l'attribut sur
   `Work` sans que la divergence se voie — elle ne devient visible qu'avec un
   titre multiplateforme. Elle sera la norme dès la PS1.
2. **Deux `Work` portaient le même identifiant externe**, ce que le cas de
   validation n°8 interdit explicitement et qu'aucun test ne vérifiait sur le
   dataset.
3. **La partie basse du ULID ne dérivant que du QID**, les deux fiches ne
   différaient que par leur rang. Découpler l'identifiant du rang — la
   correction que je faisais par ailleurs — leur aurait donné des identifiants
   **identiques**. Le défaut que je corrigeais masquait celui que j'allais
   créer.

> **Règle** — un cas unique dans un jeu de données n'est pas une exception à
> traiter à part : c'est le seul endroit où une règle générale est encore
> observable. Chercher ce qu'il révèle avant de chercher comment le ranger.

> **Règle** — avant de retirer un mécanisme jugé inutile, chercher ce qu'il
> garantit **par accident**. Le couplage identifiant/rang était faux, et il
> était la seule chose qui séparait deux identifiants.

**Ce que la spécification disait déjà.** §3.3 portait « par sortie » depuis
le début. L'erreur n'était pas dans la décision produit mais dans sa
transcription vers le modèle, un document plus loin. Personne n'avait relu
les deux côte à côte.

> **Règle** — quand le modèle et la spécification divergent, vérifier lequel
> a raison avant de corriger. Ici la spécification avait raison, et corriger
> le modèle n'a coûté qu'une migration ; l'inverse aurait figé l'erreur.

**Un test a trouvé un défaut que six mutations conformes n'avaient pas vu.**
La validation des redirections dépendait de **l'ordre des clés JSON** : une
chaîne A → B → C déclarait B inexistant si A était contrôlé en premier. Les
six mutations portaient sur des règles justes ; aucune n'interrogeait l'ordre
d'évaluation. C'est le test de la chaîne — écrit parce qu'une mutation avait
**survécu** — qui l'a révélé.

> **Règle** — une mutation qui survit est une question, pas un satisfecit.
> Écrire le test qu'elle réclame, même quand la suite est verte.

### 17 — « La source ne l'a pas » était faux pour la cinquième fois

Le chantier de curation s'ouvrait sur 92 sorties sans région et 76 arbitrages
à rendre à la main. Avant de curer, j'ai vérifié d'où venait le manque.

**Vingt-deux articles sur vingt-trois portaient l'information.** L'analyseur
d'infobox échouait, en silence, sur six défauts distincts :

| Défaut | Ce qu'il coûtait |
|---|---|
| `{{vgr}}`, `{{vgrelease new}}` non reconnus | supprimés comme parasites, avec leurs dates |
| conteneurs `{{ubl}}`, `{{collapsible list}}` supprimés **avec leur contenu** | toutes les sorties Switch |
| code de région combiné « NA/PAL » absent de la table | Oddworld sorti nulle part |
| têtes en gras qui ne sont pas des plateformes — « Final Mix », « International » | champ entièrement rejeté |
| `<br/>` en tête : la troncature censée couper ce qui **suit** coupait tout | date nue non lue |
| « 22 May 2000 » | lu comme un mois |

Résultat : couverture régionale de 84 % à **99 %** des sorties, date au jour
de 82 % à **95 %** des œuvres, arbitrages de 76 à **57**. Le chiffre de
« ≈ 400 arbitrages » qui figurait dans la spécification depuis la décision
« international dès le départ » était faux d'un ordre de grandeur.

C'est la **cinquième** fois dans ce projet : la table des régions incomplète,
les identifiants instables, les rééditions prises pour des sorties, l'API des
jaquettes qui exclut le non-libre, et maintenant l'analyseur d'infobox. À
chaque fois, une extraction défaillante s'est lue comme une absence de
donnée, et à chaque fois j'ai failli en tirer une conclusion sur le monde.

> **Règle** — avant d'ouvrir un chantier de saisie manuelle, mesurer combien
> des cas manquants sont **présents dans la source**. Curer à la main ce que
> l'extraction laisse tomber coûte cher et masque le défaut.

> **Règle** — une absence n'est jamais une donnée tant qu'elle n'a pas été
> distinguée d'un échec. Aucun des six défauts ci-dessus ne levait
> d'exception ; tous rendaient un dictionnaire vide.

**Ce que la correction a rendu visible.** Une fois les dates régionales
obtenues, 91 des 92 sorties sans région se sont révélées être des **doublons
dégradés** : la date non qualifiée servait de repli quand rien d'autre
n'existait, et décrivait désormais la même sortie avec moins d'information.
Un testeur aurait vu « Gradius · ? · 1986 » à côté de « Gradius · Japon ·
25 avril 1986 ».

> **Règle** — un repli doit être retiré quand ce qu'il remplaçait arrive.
> Il ne devient pas faux, il devient du bruit — et le bruit ne lève pas
> d'erreur non plus.

**Le garde-fou qui a fonctionné.** Corriger l'analyseur a d'abord fait
régresser Duck Hunt et Balloon Fight, qui récupéraient des dates de borne
d'arcade — exactement le défaut que le découpage par plateforme existait pour
empêcher. Ce n'est pas un test qui l'a vu : c'est la **comparaison
systématique** de la nouvelle sortie avec l'ancienne, article par article,
avant de remplacer quoi que ce soit.

> **Règle** — quand on corrige un extracteur, comparer l'ancienne et la
> nouvelle sortie sur l'intégralité du corpus, et justifier chaque
> différence. Les onze cas réparés se voient ; les deux cassés ne se voient
> que là.

### 18 — Le silence d'une source a une direction

Après correction de l'analyseur, 57 couples (œuvre, plateforme, région)
restaient sans sortie attestée. La tentation était de les lire comme des
non-sorties : la liste ressemblait à ce qu'on attend — Chrono Trigger sans
PAL, Mother 3 sans localisation.

Trois vérifications l'ont démentie. L'infobox anglophone liste

| Titre | Ce qu'elle dit | La réalité |
|---|---|---|
| Banjo-Kazooie | NA, EU, AU | sorti au Japon en décembre 1998 |
| Crash Bandicoot | NA, EU | sorti au Japon en décembre 1996 |
| Grand Theft Auto III | NA, PAL | sorti au Japon en 2003 |

**Le biais n'est pas aléatoire, il a une direction** : une source anglophone
sous-déclare les sorties japonaises des jeux occidentaux. Sur 57 arbitrages,
27 portaient précisément sur NTSC-J. Les trancher en bloc aurait retiré à un
testeur japonais des jeux qu'il a possédés — et l'erreur aurait été invisible
tant qu'aucun testeur japonais n'aurait été reçu.

> **Règle** — avant de conclure d'un silence, vérifier si ce silence est
> réparti au hasard. Un manque corrélé à la langue, à la région ou à l'époque
> de la source est un biais, pas un échantillon.

> **Règle** — quand une liste de manques « ressemble à ce qu'on attendait »,
> s'en méfier davantage, pas moins. La plausibilité d'un résultat est ce qui
> empêche de le vérifier.

**La réponse n'est pas de deviner mieux, c'est d'avoir trois états.** Le
dataset porte désormais, par (œuvre, plateforme, région) : sortie attestée,
non-sortie **établie et motivée**, ou rien d'établi. 22 arbitrées, 35
laissées inconnues. Le défaut est `inconnu` et ne glisse jamais vers
`absent`.

> **Règle** — quand deux erreurs opposées coûtent cher, ne pas choisir la
> moins chère : ajouter l'état qui permet de ne pas choisir. Un booléen qui
> doit répondre à une question à trois réponses ment la moitié du temps.

**Et ce qui rend l'arbitrage relisible** : chaque non-sortie porte sa raison,
et l'émetteur **échoue** si un arbitrage n'est appliqué à rien. Une clé mal
orthographiée ne ferait rien, en silence — exactement la classe de défaut qui
a coûté le plus cher à ce projet. Vérifié en injectant « Chrono Triger ».

### 19 — `dotnet test` sur une solution n'exécute qu'un projet de test

Après avoir ajouté `DigitalTwin.Api.Tests`, `./test.sh` a affiché :

```
Passed!  - Failed: 0, Passed: 5, Total: 5 - DigitalTwin.Api.Tests.dll
```

Cinq tests. Les **382 du domaine n'ont pas été exécutés**, et rien ne l'a
signalé — la ligne discrète « A total of 1 test files matched the specified
pattern » est le seul indice, au milieu de la sortie de compilation. Les deux
projets avaient pourtant été construits.

Sans la curiosité d'avoir compté, la boucle aurait continué des itérations
durant avec une commande de vérification qui ne vérifiait plus qu'un huitième
de la suite, en rendant `0` à chaque fois.

> **Règle** — après tout changement de l'outillage de test, **compter les
> tests exécutés** et comparer au total attendu. Un `Passed!` ne dit rien du
> périmètre couvert ; il ne parle que de ce qui a tourné.

> **Règle** — préférer une boucle explicite sur les projets à une commande
> qui « découvre » : la découverte silencieuse est la découverte qui échoue
> en silence. `test.sh` refuse désormais de rendre 0 si elle ne trouve aucun
> projet de test.

**Le même motif, encore.** C'est la sixième fois dans ce dépôt qu'un manque
se présente comme un succès : table de régions incomplète, identifiants
instables, rééditions prises pour des sorties, API des jaquettes qui exclut
le non-libre, analyseur d'infobox muet — et maintenant l'exécuteur de tests.
Aucune n'a levé d'exception.

**Un test qui mentait, aussi.** Côté front, `not.toHaveTextContent(/disponible/i)`
échouait sur « Service **indisponible** » : le mot interdit est contenu dans
le mot attendu. L'assertion était fausse, pas le code. Le composant porte
désormais un `data-etat` lisible par la machine, et le test vérifie l'état
puis la phrase exacte.

> **Règle** — ne jamais asserter l'absence d'un mot qui est le préfixe ou le
> radical d'un autre mot légitime. Asserter sur un attribut d'état, ou sur la
> phrase entière.

**Ce que la mutation a révélé en survivant.** Remplacer `SELECT version()`
par `SELECT 1` dans la sonde réelle ne casse aucun test : `PostgresProbe`
n'est couvert que par son interface. Vérifié à la main contre une vraie base
— 200, puis 503 avec « 57P01: terminating connection due to administrator
command » une fois la base éteinte, puis 200 de nouveau sans redémarrer
l'API. **À automatiser à l'item 03**, qui ouvre une vraie connexion.

### 20 — Lire la configuration trop tôt ignore ce que l'hôte de test y met

`Program.cs` lisait `builder.Configuration["Dataset:Path"]` **avant**
`builder.Build()`. Les sources de configuration ajoutées par
`WebApplicationFactory` ne sont versées qu'au moment du `Build()` : le test
qui pointait un dataset volontairement fautif voyait donc le vrai dataset, et
l'API démarrait tranquillement.

Le test a échoué, donc la faute s'est vue. Mais elle ne se serait pas vue
avec un test plus mou — « l'API répond toujours » aurait été vert, pour la
mauvaise raison.

> **Règle** — dans l'hôte générique .NET, lire la configuration **dans une
> fabrique de service**, jamais à la ligne de l'enregistrement. Et si une
> vérification doit avoir lieu au démarrage, forcer la résolution juste après
> `Build()` plutôt que de la faire au moment de l'enregistrement : on obtient
> la bonne configuration **et** l'échec au démarrage.

**Un test qui aurait passé sans rien prouver.** `Un_dataset_introuvable…`
n'exigeait d'abord que la présence du chemin dans le message. Or
`FileNotFoundException` le contient déjà : retirer entièrement mon message
explicatif laissait le test vert. Il exige désormais aussi la phrase qui dit
**pourquoi** l'API s'arrête.

> **Règle** — quand on teste un message d'erreur, vérifier qu'il n'aurait pas
> été satisfait par le message que le runtime produit tout seul. Asserter sur
> ce qu'on a ajouté, pas sur ce qui était déjà là.

**Une anomalie de données trouvée en écrivant un test.** En vérifiant que les
sortie rendues sont bien celles de la plateforme demandée, Bubble Bobble sur
Game Boy s'est révélé daté du **30 octobre 1987** — la Game Boy est sortie en
1989. C'est la date Famicom, ramenée par le repli « aucune tête de plateforme
dans l'infobox → prendre tout le champ », qui mord sur les titres
multiplateformes. Une seule sortie sur 592, et elle n'aurait jamais levé
d'erreur.

> **Règle** — un repli qui élargit la recherche doit être borné par une
> contrainte que la donnée elle-même permet de vérifier. Ici : **une sortie ne
> peut pas précéder la machine sur laquelle elle paraît.** Inscrit à l'item
> 03b.

### 21 — « Ajout seul » et « marquer l'ancien comme remplacé » se contredisent, en apparence

MODELE §5 dit deux choses : le journal est **en ajout seul**, et corriger
« chaîne un nouvel événement **et marque l'ancien comme remplacé** ».
Marquer *est* une mise à jour. Un déclencheur qui refuse tout `UPDATE`
rendrait donc la correction impossible — la fonctionnalité que §5.3 met au
premier plan.

La lecture qui tient les deux : **on ne réécrit pas une histoire, on pose un
marqueur**. Le déclencheur autorise la seule colonne
`superseded_by_event_id`, et **une seule fois** : la poser n'est pas
réécrire, la déplacer si.

Deuxième tension du même genre : §10.1 exige une **purge physique** par
utilisateur. « Ajout seul » ne peut donc pas vouloir dire « rien ne
s'efface » — cela veut dire qu'on ne réécrit pas une histoire, pas qu'on ne
peut pas effacer une personne. La suppression reste possible ; elle ne passe
que par le chemin de purge.

> **Règle** — quand deux exigences d'une spécification semblent
> s'exclure, chercher la formulation plus étroite qui les satisfait toutes
> deux avant de conclure à la contradiction. Ici, « ajout seul » portait sur
> le **contenu**, pas sur l'absence totale d'écriture.

**Deux garde-fous, à deux niveaux, et ce n'est pas une redondance.** Le
contexte EF protège le code de l'application ; le déclencheur SQL protège la
base de tout le reste — un script, une console `psql`, une future
application. Seul le second tient pour de bon, et la mutation qui le retire
n'est attrapée que par le test qui passe par SQL direct.

### 22 — Sept variantes, huit formes en base

`TemporalValue` a sept variantes. Le tableau de correspondance en a **huit** :
`YearRange` porte une fin **nullable**, et « depuis 1994 » est une période
sans fin connue. Le premier jet écrivait `l.OccurredEndYear!.Value` et aurait
levé une exception sur la première période ouverte — ou, avec un `?? StartYear`
bien intentionné, l'aurait silencieusement refermée sur elle-même.

> **Règle** — compter les formes de **stockage**, pas les types. Un type
> dont un champ est optionnel en vaut deux, et c'est le second qu'aucun
> exemple ne montre.

**Une troncature mesurée plutôt que découverte.** PostgreSQL stocke
`timestamptz` à la **microseconde** ; `DateTime` compte en centaines de
nanosecondes. Les ticks ne survivent donc pas à l'aller-retour. Sans test, on
l'aurait trouvé sur un départage de tri inexplicable — le critère 2 de la
cascade de départage lit précisément `RecordedAt`. Un test l'énonce
désormais.

> **Règle** — pour toute donnée qui traverse une frontière de stockage,
> écrire un test qui **constate la perte de précision** plutôt qu'un test qui
> vérifie l'égalité sur une valeur ronde. Une valeur ronde traverse tout.

### 23 — Une clé trop grossière fusionne deux choses, pour la deuxième fois

`wp_dates.json` était indexé par **QID seul**, alors que l'analyse de
l'infobox dépend de la **plateforme** — c'est elle qui choisit la section à
lire. Bubble Bobble, curé sur Game Boy et sur NES, n'avait donc qu'une entrée
— celle écrite en dernier — et la Game Boy héritait de l'analyse NES : une
date du 30 octobre 1987 pour une machine sortie en 1989.

C'est **exactement** la faute que le registre d'identifiants avait déjà
connue à l'item 16, et elle s'est reproduite dans un autre fichier du même
pipeline.

> **Règle** — quand un traitement prend deux paramètres, son cache prend deux
> paramètres. Indexer sur le premier seul ne perd rien tant qu'aucune entrée
> ne partage sa valeur — et tout le jour où l'une le fait.

**Deux sections d'une même famille doivent être réunies, pas départagées.**
L'infobox de Bubble Bobble liste « Famicom Disk System » *et* « NES » : deux
sections de la même famille de machines. Le découpage n'en retenait qu'une —
la première trouvée — et perdait l'autre. Réunir les deux a rendu **15 dates
américaines et européennes** à Zelda, Metroid, Castlevania, Zelda II,
Super Mario Bros. 2 et Kid Icarus, dont la première parution japonaise était
sur disquette.

> **Règle** — quand un découpage choisit *une* portion, se demander ce qui se
> passe s'il y en a plusieurs. « La première qui correspond » est un choix,
> et il est rarement le bon.

**Une correction plausible, et fausse.** Mon premier réflexe a été d'exclure
le Famicom Disk System de la famille NES, puisque son nom contient
« famicom ». La comparaison sur l'ensemble du corpus a montré que cela
**retirait de vraies sorties japonaises** — Zelda passait de 1986 à la date
de la réédition cartouche de 1994, qui n'est le souvenir de personne. Le
lecteur de disquettes est un périphérique de la Famicom, pas une autre
machine, et notre plateforme « NES » couvre déjà la Famicom.

> **Règle** — comparer l'ancienne et la nouvelle sortie sur **tout** le
> corpus avant d'adopter une correction d'extraction, même évidente. Ce qui
> se voit alors, ce n'est pas ce qu'on a réparé, c'est ce qu'on a cassé.

**Deux prédictions de mutation fausses, pour deux raisons différentes.**

- Rendre la borne d'anachronisme exclusive : prévu 1, obtenu **17**. J'avais
  raisonné sur le test unitaire et oublié que le dataset réel devient alors
  invalide — l'API refuse de démarrer, et dix tests tombent avec.
- Rétablir la clé grossière : prévu 1, obtenu **0**. Ma sonde comptait les
  entrées du fichier *produit*, alors que la mutation portait sur son
  *consommateur*. Rejouée avec la bonne sonde : 1, conforme — et c'est
  précisément l'anachronisme de Bubble Bobble qui réapparaît.

> **Règle** — avant d'annoncer un nombre d'échecs, se demander quels tests
> lisent le **dataset réel** : ils transforment une violation locale en
> échec de démarrage, donc en échec de tous les tests d'API.

> **Règle** — vérifier que la sonde d'une mutation observe bien l'artefact
> que la mutation modifie. Une sonde qui regarde ailleurs rend « survivante »
> une mutation tuée.

### 24 — Un ordre qui paraît naturel n'est pas l'ordre demandé

L'item demandait les plateformes « dans l'ordre chronologique de
génération ». Elles sortaient déjà dans un ordre qui *paraît* juste — NES,
Super Nintendo, Game Boy, Game Boy Advance, Nintendo 64, PlayStation… — parce
que c'est celui du dataset, qui suit les **familles**.

Ce n'est pas l'ordre chronologique : la Super Nintendo (1990) y précède la
Game Boy (1989), et la Game Boy Advance (2001) la Nintendo 64 (1996). Un
joueur qui remonte le temps attend ses machines dans l'ordre où il les a
connues.

Rien ne l'aurait signalé : la liste est plausible, et le seul moyen de voir
la faute était de comparer aux années — qui n'existaient dans le dataset que
depuis l'item précédent.

> **Règle** — quand une exigence porte sur un **ordre**, l'exprimer comme un
> tri sur une donnée, jamais comme « l'ordre dans lequel les choses
> arrivent ». Un ordre implicite est juste par accident, et le jour où il
> cesse de l'être, il reste plausible.

**Un test qui s'appuie sur la constante ne pinne pas la valeur.**
`Assert.Equal(PeriodInput.MargeParDefaut, valeur.Margin)` passe quelle que
soit la marge par défaut — y compris 1, qui n'est plus « vers ». Le test
assure désormais **aussi** la valeur, 2, celle de l'exemple « 1994 ± 2 » de
MODELE §3. La mutation le confirme : 0 échec avant, 3 après.

> **Règle** — asserter contre une constante du code vérifie la cohérence, pas
> la décision. Quand la valeur est un choix de produit, l'écrire en clair
> dans le test, avec la raison.

### 25 — La même faute, deux items plus tard, dans le même fichier

L'item 02 avait établi que lire `builder.Configuration` **avant** `Build()`
ignore les sources ajoutées par l'hôte de test. Le correctif n'avait porté
que sur le chemin du dataset. La chaîne de connexion, trois lignes plus haut,
était restée lue à la ligne d'enregistrement.

Résultat : l'API des déclarations parlait à la base de **développement**, où
aucune migration n'avait été appliquée. Dix tests sur seize rendaient 500.

La règle que j'avais écrite — « lire la configuration dans une fabrique de
service » — était juste et **trop étroite** : je l'avais appliquée au cas qui
m'avait mordu, pas à la classe de cas. Le fichier contenait deux lectures
anticipées ; je n'en avais corrigé qu'une.

> **Règle** — quand une faute est corrigée, chercher ses **frères dans le
> même fichier** avant de passer à autre chose. `grep` sur la forme fautive,
> pas sur le symptôme.

> **Règle** — préférer une règle qui interdit la forme à une règle qui
> corrige l'occurrence : « aucune lecture de `builder.Configuration` avant
> `Build()` » se vérifie ; « lire le chemin du dataset dans une fabrique » ne
> protège que le chemin du dataset.

**Ce qui l'a attrapée.** Les tests parlent à une vraie base. Un test qui
aurait simulé le magasin d'événements serait passé — la chaîne de connexion
n'aurait servi à rien — et la faute serait apparue au premier lancement
réel.

### 26 — Un champ que le modèle prévoit mais que personne ne remplit

`ISortableMoment.BatchId` existait depuis l'item 05 de la Phase 0, avec son
usage documenté : « douze titres cochés d'un coup forment **un épisode**, pas
douze points identiques » (§4.4). `TimelineSorter` le lit. **Aucun producteur
ne le posait** — il valait toujours `null`, et l'agrégation en épisodes ne
s'était donc jamais déclenchée sur de vraies données.

La sélection massive est ce producteur, et le même identifiant sert
l'idempotence : rejouer un lot ne duplique rien.

> **Règle** — un champ facultatif qu'aucun producteur ne remplit est du code
> mort qui a l'air vivant. Quand on en écrit un « pour plus tard », noter
> **qui** le remplira ; si la réponse est « on verra », il n'a pas sa place.

**L'idempotence porte sur le lot, pas sur une unicité globale.** Interdire
deux événements (utilisateur, œuvre, type) aurait paru plus simple et aurait
refusé la correction de §5.3, qui chaîne précisément un nouvel événement sur
la même cible.

> **Règle** — avant de poser une contrainte d'unicité, vérifier qu'elle
> n'interdit pas une opération que la spécification exige.

### 27 — Un champ que rien ne préserve est un champ que rien ne teste

Une mutation a retiré la relecture de `NeverPlayed` dans la traduction
ligne → domaine. **Aucun test n'a bronché.** La raison est subtile : les deux
intentions existantes — « jamais joué » et « provenance » — réécrivent toutes
deux ce champ. Aucun chemin ne le **préserve**, donc sa relecture n'était
observable nulle part.

Le jour où une troisième intention arrive — l'affect —, la faute effacerait
« je n'y ai jamais joué » au premier « j'ai adoré », et personne ne
comprendrait pourquoi.

> **Règle** — une mutation qui survit sur une ligne qu'on croyait utile
> signale souvent que **le chemin qui l'utiliserait n'existe pas encore**.
> Tester alors l'unité elle-même, sans attendre le chemin : c'est moins cher
> maintenant que le jour où il arrive.

**Un défaut trouvé sans mutation, en relisant ce que je venais d'écrire.**
Mon premier upsert réécrivait la ligne entière : `NeverPlayed`, `Provenance`
et `Affect` à chaque geste. Or ces trois champs sont indépendants — déclarer
« je l'avais » aurait effacé « mon préféré sur Super Nintendo ». Aucun écran
n'écrit encore l'affect, donc rien ne l'aurait montré avant longtemps.

Le correctif n'est pas de recopier champ par champ, mais de **passer par le
type de domaine** : `DeclareNeverPlayed` efface ce que l'invariant 8 exclut,
`WithProvenance` lève `NeverPlayed` comme l'invariant 10 l'exige. Les
réimplémenter dans le magasin les aurait laissés diverger.

> **Règle** — quand le magasin doit décider ce qu'une écriture conserve,
> c'est que la décision appartient au domaine. Charger, appliquer la méthode
> du type, réécrire — plutôt que d'assigner les colonnes.

**Une divergence documentaire, tranchée dans le bon sens.**
`MODELE-DE-DOMAINE.md` annonçait « un enregistrement par couple utilisateur /
œuvre », tout en posant l'invariant 6 : `Favourite` est unique **par
plateforme**. Les deux ne tiennent ensemble que si la clé porte la machine —
ce que le code faisait déjà. C'est la légende qui était imprécise ; elle est
corrigée.

> **Règle** — rappel de l'item 03b : quand le modèle et sa description
> divergent, établir **lequel a raison** avant de corriger. Ici encore, le
> code avait raison.

**Et une prédiction de mutation fausse, par sous-comptage.** « Aucune
déclaration écrite » : prévu 5, obtenu 6 — j'avais oublié un test qui lit les
jugements. Sans conséquence, mais c'est la troisième fois que le nombre
annoncé vient d'une énumération de mémoire plutôt que d'un `grep`.

### 28 — Deux tests qui passaient pour la mauvaise raison

Deux mutations ont survécu là où j'attendais des morts : retirer le contrôle
« titre vide » et le contrôle « ni œuvre ni titre » ne cassait rien.

La raison est la même pour les deux. Sans le contrôle, l'entrée tombait dans
la branche « œuvre curée » avec un identifiant nul ou vide, et se faisait
refuser comme **œuvre inconnue** — donc un 400, donc un test vert. Mes deux
tests n'assertaient que le code HTTP.

Ils passaient, le comportement était acceptable, et pourtant le message rendu
au client était faux : « Œuvre inconnue : «  » » n'aide personne à comprendre
qu'il a laissé un champ vide.

> **Règle** — pour un test de refus, asserter le **motif** et pas seulement le
> code. Deux causes différentes produisent le même 400, et c'est exactement
> ce qui fait qu'un contrôle peut disparaître sans que rien ne bronche.

C'est la deuxième fois dans cette phase qu'une mutation survivante révèle une
assertion trop lâche plutôt qu'un code trop faible. Le contrôle par mutation
teste les **tests** au moins autant que le code.

### 29 — Rattacher sans réécrire

§3.5 demande que les titres libres soient « rattachables ultérieurement à une
entité canonique, **sans perte de l'historique ni des dates** ». La tentation
est de réécrire la cible des événements le jour du rattachement.

Le journal est en ajout seul : ce serait à la fois interdit par le
déclencheur et contraire à l'exigence. La revendication porte donc la
résolution, et les événements continuent de la cibler — **c'est elle qui
apprend où elle mène, pas l'histoire qu'on réécrit**.

> **Règle** — quand une donnée doit « pointer ailleurs plus tard », poser le
> renvoi sur l'entité intermédiaire plutôt que sur ce qui la référence. La
> table de redirection de §10.2 procède du même principe.

**Un piège évité de justesse.** Ma première version créait les revendications
depuis un rappel synchrone appelé par le traducteur —
`EnsureClaimAsync(...).GetAwaiter().GetResult()`, de l'asynchrone bloqué au
milieu d'une requête. Les tests passaient. Elles sont désormais créées
**avant** la traduction, qui ne fait plus qu'une lecture de table.

> **Règle** — un rappel qui doit attendre de l'asynchrone est le signe que
> l'ordre des étapes est faux, pas qu'il faut bloquer. Faire d'abord ce qui
> attend, passer le résultat ensuite.

### 30 — Le test miroir : comparer la sortie de l'API à celle du domaine

L'endpoint de timeline ne doit rien ordonner : tout vit dans
`TimelineSorter`, que 387 tests du domaine valident. Le risque n'est pas
qu'il trie mal, c'est qu'il trie **un peu** — un `OrderBy` ajouté pour
« stabiliser » l'affichage, et la divergence s'installe sans que rien ne la
signale.

Le test qui l'interdit ne réécrit pas l'ordre attendu : il appelle
`TimelineSorter.Sort` sur les mêmes événements et compare. Il vaut pour
n'importe quel jeu de données, et il échoue le jour où l'API se met à décider
quelque chose.

> **Règle** — quand une couche doit se contenter de rendre ce qu'une autre
> calcule, l'écrire comme un test : *sortie de la couche = sortie de la
> source*, sur des données non triviales. Réécrire l'attendu à la main
> testerait le résultat, pas l'absence de logique.

**Une valeur résolue pour être placée doit rester rendue telle qu'elle a été
déclarée.** Une mutation a montré qu'aucun test ne rendait un moment daté par
l'âge : l'écran aurait pu afficher « 1994 » au lieu de « vers mes 12 ans »
sans que rien ne bronche. L'horizon **résout** l'âge pour le situer sur
l'axe ; il ne le **remplace** pas. Et si l'année de naissance était corrigée,
l'année affichée changerait — ce que personne n'a déclaré.

> **Règle** — quand une donnée est transformée pour un calcul, vérifier qu'un
> test la rend encore sous sa forme d'origine. Les deux usages se ressemblent
> assez pour que l'un remplace l'autre par inadvertance.

**Une acceptation que j'avais écrite trop large.** L'item annonçait « les
huit cas de validation rejoués à travers l'API ». Deux seulement portent sur
l'ordre — le parcours de trente ans (§7.1) et le recalcul par l'année de
naissance. Les six autres testent la possession, la redirection d'identifiant
ou la déduplication, et les faire passer par `/timeline` n'aurait rien
prouvé.

> **Règle** — quand une acceptation écrite d'avance se révèle plus large que
> ce qu'elle mesure, la corriger dans le journal plutôt que de forcer des
> tests qui ne prouvent rien. Un test artificiel coûte deux fois : il ne
> protège pas, et il fait croire qu'il protège.

### 31 — Ce qu'un test de composant ne voit pas

L'écran de sélection massive est couvert par quinze tests de composant. Ils
prouvent que cocher une ligne fait grandir la bande d'époque sans
rechargement, que décocher la rétrécit, que l'ordre suit le rang de
notoriété, que l'état déclaré est lisible par une machine.

**Ils ne voient rien de ce qui a motivé le dessin de cet écran.** Pas la
densité de la liste, pas la taille de la cible, pas le fait qu'un titre tienne
sur 375 px, pas le mouvement de la bande. Or c'est ce calcul-là — quatre
cibles de 44 px occupent 200 px et ne laissent que 143 px de titre — qui a
fait rejeter la première version de la fiche.

> **Règle** — à la fin d'un item d'interface, écrire explicitement ce que les
> tests ne couvrent pas. Un « tout est vert » sur un écran laisse croire à
> une garantie que le test de composant ne donne pas, et c'est à l'œil
> humain que revient le reste.

**Un affichage optimiste ne défait jamais le travail de l'utilisateur.** Si
l'envoi échoue, on le signale et on garde ce qui est coché. Voir son travail
s'effacer est le pire scénario possible sur un écran dont toute la promesse
est « ça vaut le coup de saisir ». C'est le joueur qui décide de réessayer.

> **Règle** — quand l'affichage précède la confirmation du serveur, décider
> **à l'avance** ce que fait l'échec. « On verra » signifie en pratique « on
> annule », c'est-à-dire le pire choix.

**Une prédiction de mutation fausse, par oubli d'un chemin.** J'avais prévu
deux échecs pour une mutation du calcul de la bande ; il y en a eu un. La
fonction a un **retour anticipé** — aucune déclaration datée — que ma
mutation ne touchait pas, et le test concerné passait par là. Les deux
chemins sont bien couverts, vérifié en mutant le second séparément.

> **Règle** — avant d'annoncer un nombre d'échecs, repérer les **sorties
> multiples** de la fonction mutée et se demander par laquelle chaque test
> passe. Un retour anticipé est une deuxième implémentation qui ne se voit
> pas.

### 32 — Mes prédictions de mutation se trompent toujours de la même façon

Quatre écarts sur neuf mutations, et **aucun ne dénonçait le code**. Deux
causes, toutes deux des miennes :

| Mutation | Prévu | Obtenu | Pourquoi |
|---|---|---|---|
| année rendue au jour | 4 | 7 | j'avais oublié deux tests d'écran qui comparent le texte d'une ligne, lequel **contient** l'année |
| toutes les formes pleines | 8 | 10 | même cause |
| période ouverte refermée | 2 | 1 | j'ai compté deux **assertions** d'un même test |
| « vers 1994 » → « 1994 » | 2 | 1 | idem, et une assertion ne mordait pas |

La deuxième cause a déjà sa règle, écrite à la Phase 0 : *compter les cas
exécutés, un test vaut 1 quel que soit son nombre d'assertions*. Je l'ai
violée à nouveau. La première est nouvelle et plus insidieuse : un test qui
n'a rien à voir avec la valeur mutée échoue quand même, parce qu'il compare
un texte **dans lequel** elle apparaît.

> **Règle** — avant d'annoncer un nombre d'échecs, `grep` la valeur mutée
> dans **tous** les fichiers de test, y compris ceux d'une autre couche. Une
> énumération de mémoire trouve les tests qui portent sur le sujet, jamais
> ceux qui le contiennent par accident.

**Une assertion qui n'interdisait pas ce qu'elle prétendait interdire.** Le
test des trois interdits vérifiait que « vers 1994 » ne contenait pas de nom
de mois — ce qui reste vrai si on le rend « 1994 ». L'interdit ne porte pas
sur le mois : il porte sur la **perte du « vers »**. Corrigé, la mutation
passe de 1 à 2 échecs.

> **Règle** — écrire l'assertion négative à partir de la faute qu'on craint,
> pas à partir de la forme qu'on connaît. « Pas de mois » et « toujours
> approximatif » se ressemblent et ne protègent pas la même chose.

**Et un remplacement global qui a abîmé un test.** Migrer `annee: 1995` vers
une valeur temporelle a aussi réécrit `{ annee: 1995, compte: 1 }`, qui
décrit une **tranche** de bande et non une œuvre. Le test a échoué
immédiatement, donc sans dégât — mais c'est la troisième fois qu'un `replace`
non ancré touche autre chose que sa cible.

> **Règle** — un remplacement par expression régulière sur plusieurs fichiers
> doit être précédé du décompte de ses occurrences **et** de la lecture de
> celles qu'on n'attendait pas.

### 33 — « Ils diffèrent » n'est pas une assertion

Le test censé garantir que « jamais sorti en Europe » ne se confond pas avec
« sortie européenne inconnue » vérifiait que les deux libellés **ne sont pas
égaux**. Une mutation rendant le premier par « Sortie Europe inconnue » y
passait sans broncher : un mot d'écart suffit à satisfaire l'inégalité.

Le test voisin — « quatre textes distincts » — passait pour la même raison.
Deux formulations quasi identiques sont distinctes au sens de `Set`, et
indiscernables à la lecture rapide d'une liste de trente-cinq lignes, qui est
précisément l'usage.

> **Règle** — asserter la **marque** de chaque état, pas leur différence.
> « Le libellé de la non-sortie contient *jamais*, celui de l'inconnu ne le
> contient pas » tient ; « les deux diffèrent » ne tient rien.

Corrigé, la mutation passe de 3 à 4 échecs.

### 34 — Deux tests couplés à ce qu'ils ne testent pas

Ajouter l'indication régionale sur la ligne a cassé un test **d'ordre**, qui
comparait le `textContent` entier de chaque ligne. L'ordre n'avait pas bougé ;
le contenu, oui.

Et le nouveau test cherchait son indication par le texte — `/sorti|inconnue/`
— ce qui attrapait aussi le titre « Sorti » et la date « date inconnue » de
la même ligne.

Les deux fautes sont la même : **viser large quand on peut viser juste**. Le
premier se corrige en n'assertant que les titres, le second en sélectionnant
par `data-statut` — l'attribut qui existe exactement pour ça.

> **Règle** — ne jamais asserter le `textContent` d'un conteneur : il change
> dès qu'on ajoute quoi que ce soit à l'intérieur, et le test échoue pour une
> raison sans rapport avec ce qu'il protège.

> **Règle** — chercher un élément par son rôle ou son attribut d'état, pas
> par un motif de texte qui peut apparaître ailleurs dans le même bloc.

**Et le comptage, encore.** Quatre prédictions fausses sur huit, toutes d'une
unité, toutes de la même famille : assertions comptées pour des tests, ou
tests oubliés parce qu'ils touchent le sujet de biais. La règle existe depuis
la Phase 0 ; ce n'est pas la règle qui manque.

### 35 — Une mutation peut être vide sans qu'on le voie

Pour vérifier que décocher une ligne ne détruit pas le souvenir déjà écrit,
j'ai muté la valeur du champ en `declare ? souvenir : ""`. Zéro échec — et ce
n'était pas un trou de couverture : le champ **ne se rend que si `declare`
est vrai**. La condition était toujours vérifiée, la mutation ne changeait
rien.

Une mutation qui ne modifie aucun comportement observable ressemble
exactement à une mutation que les tests laissent passer. J'aurais pu en
conclure à une faiblesse et ajouter un test inutile.

> **Règle** — avant de conclure d'une mutation survivante, vérifier qu'elle
> est **atteignable dans un état où elle diffère**. Une substitution à
> l'intérieur d'une branche dont la condition est déjà garantie ne teste
> rien.

Rejouée à l'endroit qui compte — effacer le souvenir au décochage —, elle tue
bien un test.

**Ce qui a guidé la conception ici.** Les souvenirs vivent **hors** de
l'ensemble des déclarations. Se tromper de ligne est le geste le plus
fréquent de cet écran, et perdre une phrase à cause d'un tap mal placé serait
impardonnable sur le seul contenu du produit qui ne soit pas régénérable.

> **Règle** — quand deux états sont liés à l'écran mais que l'un est
> irremplaçable, les stocker séparément. Le couplage qui paraît naturel dans
> le modèle mental — « la note appartient à la déclaration » — détruit la
> donnée coûteuse quand la donnée bon marché change.

### 36 — L'unité couvrait ce que l'écran ne vérifiait pas

Retirer le titre de la tuile composée cassait deux tests **du composant
Tuile**, et aucun de l'écran. Or c'est à l'écran que la faute compte : une
grille d'aplats colorés sans texte se lit comme une série d'images qui n'ont
pas chargé — exactement le « trou » que l'item interdit.

Le test d'intégration vérifiait le type de tuile et son format, pas son
contenu. Il passait donc sur une tuile vide, qui a le bon type et le bon
format.

> **Règle** — quand un test unitaire couvre une propriété *visible*, se
> demander si l'écran qui l'assemble la vérifie aussi. L'unité prouve que le
> composant sait la produire ; seule l'intégration prouve qu'il est utilisé de
> façon à la montrer.

**Une décision de conception, prise sur la foi d'une mesure déjà faite.** La
grille desktop n'est justifiée que là où de vraies jaquettes existent : « une
tuile générée est du texte sur un fond coloré, donc on la lit au lieu de la
reconnaître ». Avec 218 jaquettes sur 221, la condition est remplie — et la
tuile composée reste le socle permanent, pas un repli d'erreur.

C'est pourquoi un manifeste de jaquettes absent donne **silencieusement** un
catalogue tout en tuiles composées, là où un dataset absent empêche le
démarrage. Le premier est un état valide du produit, le second non.

> **Règle** — avant de faire échouer fort sur une donnée manquante, se
> demander si son absence décrit un **état valide du produit**. Échouer sur
> un défaut prévu par la conception est aussi faux que passer sous silence
> une donnée corrompue.

### 37 — Une exclusion qui n'excluait rien

Le détecteur de libellés en dur portait une liste de fichiers autorisés,
contenant le catalogue lui-même. Une mutation l'a vidée : **zéro échec**.

La raison est simple et je ne l'avais pas vue : le détecteur ne regarde que
le texte JSX et les attributs visibles. Le catalogue est un `.ts` sans JSX et
sans attributs — il ne pouvait pas être signalé, avec ou sans exclusion. La
ligne protégeait d'un danger qui n'existait pas, tout en donnant l'impression
d'avoir été pensée.

> **Règle** — une exclusion, une exception, un cas particulier : vérifier
> qu'il change quelque chose. Une mutation qui le supprime sans rien casser
> dit qu'il n'a jamais servi — et qu'il masquera peut-être un vrai cas le
> jour où le contexte change.

**Écrire un détecteur textuel est plus dur qu'il n'y paraît.** Trois
itérations ont été nécessaires pour ne plus confondre du JSX avec du
TypeScript :

| Confusion | Exemple | Correctif |
|---|---|---|
| générique | `Promise<void>` | le texte doit tenir sur une seule ligne |
| flèche | `(lot) => Promise<T>` | le `>` doit clore une balise |
| comparaison | `total > 1 ? "a" : "b"` | idem : `>` collé à un caractère de fin de balise |

Chacune produisait un faux positif **crédible**, qui aurait pu me faire
affaiblir la règle plutôt que le détecteur.

> **Règle** — devant un faux positif, corriger le détecteur avant d'envisager
> une exception. Une exception se propage ; un détecteur affiné protège
> davantage.

**Et un effet secondaire heureux.** Le passage au catalogue a reformulé
« Sortie européenne inconnue » en « Sortie inconnue en Europe ». **Aucun test
n'a bougé** : ils assertent la marque de l'état — le mot « inconnue »,
l'absence de « jamais », la présence de « Europe » — et non la phrase. C'est
la correction faite à l'item 11 qui a payé ici.

### 38 — Le parcours de bout en bout a trouvé ce qu'aucun test d'API ne pouvait voir

Le front envoie **chaque ligne dès qu'elle est cochée**, sous le même
identifiant de lot, pour que la timeline les regroupe en un épisode (§4.4).
L'API, elle, traitait un lot connu comme « déjà enregistré ». Résultat :
**une seule des trente déclarations était conservée.**

Aucun test d'API ne pouvait le voir. Tous envoyaient le lot complet en un
appel — parce que c'est ainsi qu'on écrit un test d'API, et que le découpage
réel des envois est une décision du client. L'idempotence porte désormais sur
le couple **(lot, cible)** : un lot se remplit au fil des gestes, et seul un
renvoi de la même ligne ne crée rien.

> **Règle** — un test d'intégration qui construit lui-même la requête teste
> le contrat, jamais l'usage. Quand deux couches se partagent une décision —
> ici « qu'est-ce qu'un lot » —, seul un parcours réel montre qu'elles ne
> l'ont pas comprise pareil.

### 39 — Le parcours passait sur les restes des exécutions précédentes

Première version du test : « la timeline contient des moments ». Une mutation
qui supprimait complètement l'envoi des déclarations **ne cassait rien** — la
base contenait encore les événements des essais antérieurs, sous le même
utilisateur en dur.

Deux corrections, et les deux comptent : un **profil vierge par exécution**,
et l'assertion du **nombre exact** — trente titres cochés font trente
moments. « Il y a des moments » ne dit rien ; « il y en a trente » dit que
rien ne s'est perdu en chemin et qu'on ne lit pas le profil d'un autre.

> **Règle** — un test de bout en bout doit partir d'un état qu'il a lui-même
> créé. Un état partagé le fait passer pour des raisons qui n'ont rien à voir
> avec ce qu'il vérifie, et c'est invisible tant que tout va bien.

> **Règle** — asserter un **compte exact** plutôt qu'une présence. « Il y a
> quelque chose » est vrai de presque tous les états faux.

### 40 — Le typage n'était jamais vérifié

`./web.sh test` lançait Vitest, qui **transpile sans contrôler les types**.
Sept erreurs réelles dormaient dans une suite à 120 tests verts : un module
Node introuvable, des paramètres implicitement `any`, un champ obligatoire
absent de trois fabriques de test. Seule la construction, exigée par le
parcours de bout en bout, les a vues.

Le typage fait désormais partie de la vérification du front.

> **Règle** — une suite verte ne dit rien de ce que le lanceur de tests ne
> regarde pas. Vérifier explicitement ce qui n'est vérifié qu'à la
> construction : types, assemblage, dépendances.

**Deux dérives de version, du même genre.** `@playwright/test` en `^1.49.0`
avait glissé en 1.63 pendant que l'image Docker restait en 1.49 — Playwright
refuse alors de démarrer. Le script lit maintenant la version dans
`package.json` plutôt que de l'écrire deux fois. Et Vitest 2 avec Vite 6
faisait installer une **copie imbriquée** de Vite : deux jeux de types
incompatibles pour un même paquet, et des greffons soudain invalides.

> **Règle** — quand une version est écrite à deux endroits, l'un des deux
> doit la LIRE dans l'autre. Deux sources finissent toujours par diverger, et
> la panne qui en résulte ne ressemble jamais à sa cause.

### 41 — Deux manques trouvés en faisant l'inventaire, pas par les tests

Le bilan de Phase 1 a demandé de lister ce qui est livré. L'exercice a
trouvé deux choses qu'aucune des 629 assertions ne voyait :

**Une URL annoncée qui ne résout pas.** L'API rend `coverUrl = /covers/{id}`
pour 218 œuvres ; aucun point d'entrée ne sert ce chemin. La grille desktop
afficherait 218 images cassées — et la reconnaissance est la mécanique
centrale de l'écran.

Le test de l'item 13 vérifiait que `coverUrl` vaut `null` **quand il n'y a
pas de jaquette**. Il ne vérifiait jamais qu'elle résout quand il y en a
une. Et le parcours de bout en bout ne pouvait pas le voir : un navigateur
n'échoue pas sur une image cassée.

> **Règle** — quand une API rend une **adresse**, tester qu'elle résout, pas
> seulement qu'elle est bien formée ou absente au bon moment. Une URL est une
> promesse ; le test doit la tenir.

**Un composant écrit, testé, monté nulle part.** `ZoneSansDate` a trois tests
et aucun écran ne l'utilise. Il est correct et sans effet — la même famille
que le champ `BatchId` qu'aucun producteur ne remplissait, et que
l'exclusion qui n'excluait rien.

> **Règle** — faire périodiquement l'inventaire de ce qui est **atteignable
> depuis la racine** : points d'entrée servis, composants montés, champs
> écrits. Une suite verte ne dit rien de ce qui n'est relié à rien.

**Et un bilan n'est un bilan que s'il ouvre du travail.** Les trois manques
bloquants sont devenus des items. Constater sans inscrire aurait produit un
document juste et sans effet — ce qui est la forme la plus discrète de
l'inutilité.

### 42 — Le parcours a trouvé la frontière que les deux côtés ignoraient

L'API sert `/covers/{id}` et ses tests le prouvent. Le navigateur, lui, parle
au **mandataire** de Vite, qui ne relaie que `/api`. Il demandait donc
`/covers/…` au serveur du front, recevait la page HTML, et affichait une
image cassée.

Les deux côtés avaient raison séparément. Personne ne possédait la frontière.

> **Règle** — une adresse rendue par une API est relative à **l'API**. Le
> client, qui seul sait par où il passe, doit la préfixer. Tester les deux
> côtés ne suffit pas : c'est le chemin complet qu'il faut parcourir.

C'est la deuxième fois dans cette phase qu'un parcours réel trouve un défaut
qu'aucun test de couche ne pouvait voir — après l'identifiant de lot compris
différemment par le front et par l'API.

### 43 — Un test vrai des deux côtés d'une mutation ne teste rien

Pour garantir que le catalogue n'annonce que les jaquettes **présentes sur le
disque**, j'avais écrit : « pour chaque jaquette annoncée, le fichier
existe ». Une mutation retirant le filtre n'a rien cassé — les 218 fichiers
étant là, l'assertion reste vraie **avec ou sans** filtre.

Le cas que le filtre protège — un clone neuf, où le manifeste survit et les
images non — n'était produit par aucun test. Il fallait le **fabriquer** :
un dossier temporaire, un manifeste annonçant un fichier absent.

> **Règle** — un test qui décrit l'état actuel ne protège pas la règle qui
> l'a produit. Si la mutation qui supprime la règle laisse le test vert, le
> test décrit, il ne vérifie pas. Fabriquer l'état où la règle mord.

Et son pendant, écrit dans la foulée : sans un test qui exige qu'une jaquette
présente **soit** annoncée, « ne rien annoncer jamais » passerait le premier.

### 44 — Nommer une chose n'est pas la rendre

La timeline pose sur chaque entrée `data-epoque="8 bits"` et la couleur de
cette décennie. Les tests assèraient l'attribut. Retirer la couleur a donc
**survécu** : l'attribut disait toujours « 8 bits », et rien ne regardait la
peinture.

Une entrée sans accent se rend **grise** au milieu d'un axe coloré. Le
joueur ne la lit pas comme une décennie manquante : il la lit comme un
défaut d'affichage — c'est-à-dire, une fois de plus, une donnée absente qui
passe pour un fait et n'appelle aucune erreur.

Le piège est propre aux crochets de test. Un `data-*` est **posé pour être
lu par une assertion** ; il décrit l'intention du composant, il ne prouve
pas que l'intention a produit quelque chose. Tant que les deux sortent de la
même ligne de code, l'assertion sur l'attribut ressemble à une vérification
et n'en est pas une.

**La règle** : quand un attribut lisible par la machine accompagne l'effet
visible qu'il décrit, asserter l'attribut **et** l'effet — sinon l'effet
peut disparaître sans un seul test rouge.

Et le partage de responsabilité qui rend l'assertion supportable : le
composant est tenu d'**appliquer** la palette, `epoque.test.ts` est tenu de
la **valider**. Réécrire les hexadécimaux dans le test de l'écran ne
vérifierait rien de plus et casserait deux fichiers à chaque retouche de
couleur.

Voisin de [[43]] — un test vrai des deux côtés d'une mutation — mais la
cause diffère : là, l'assertion portait sur un état que la mutation ne
changeait pas ; ici, elle porte sur un **substitut** de ce qu'elle prétend
vérifier.

### 45 — Un chemin dont le parcours est le seul garde n'est pas gardé

La timeline résout le libellé d'un titre saisi en interrogeant les
revendications de l'utilisateur. Retirer cette recherche — tous les titres
saisis rendus sous le même libellé générique — n'a cassé **aucun** des 518
tests .NET. Seul le parcours de bout en bout le voyait.

C'est une couverture trompeuse, pour trois raisons :

- il y a **un** parcours, et la boucle interdit de l'affaiblir tout en
  l'autorisant à évoluer : le jour où une assertion en sort parce qu'elle
  ralentit, le chemin devient nu sans qu'aucun test ne rougisse ;
- il ne tourne pas dans `./test.sh` ni dans `./web.sh test` — les deux
  commandes qu'on lance en boucle ;
- quand il échoue, il ne nomme pas la couche fautive. Un test d'API dit
  « l'API ne résout pas » ; le parcours dit « le titre n'est pas à l'écran »,
  et il reste à chercher lequel des trois étages l'a perdu.

**La règle** : après avoir écrit un chemin que le parcours traverse, demande
**quel test unitaire le tue**. S'il n'y en a aucun, le parcours porte une
charge pour laquelle il n'est pas fait — écris le test de la couche, et
garde le parcours pour ce que lui seul voit : les **frontières** ([[42]],
[[17]]).

La vérification est mécanique, et c'est ce qui la rend fiable : la mutation
tournée contre `./test.sh` seul répond en trente secondes, là où relire le
code en se demandant « est-ce testé ? » dépend de l'attention.

Au passage, [[44]] a resservi dans la même itération : la marque « hors du
référentiel » n'était gardée que par le détecteur de libellés morts — un
garde du **catalogue**, pas de l'écran, qui se tait dès qu'on retire la clé
en même temps que la ligne. Une règle qui trouve un second cas le jour où on
l'écrit décrit un motif, pas un incident.

### 46 — Un composant défini dans le corps d'un autre perd son état à chaque frappe

Le champ de souvenir servait deux cas — une œuvre, un titre saisi. Je l'ai
extrait en composant… **à l'intérieur** de `SelectionMassive` :

```tsx
export function SelectionMassive(...) {
  function ChampSouvenir({ ... }) { return <textarea ... />; }   // ✗
```

Chaque rendu en crée une fonction **neuve**. React compare les types par
identité : un type différent n'est pas un rerendu, c'est un **remplacement**.
Le `<textarea>` est démonté et remonté à la première lettre, le focus part
avec lui, et la saisie s'arrête là.

Rien n'est levé. L'écran a l'air de fonctionner, le champ reste visible, et
la phrase est simplement plus courte que ce qui a été tapé — sur le seul
contenu du produit qui ne se régénère pas.

**La règle** : un composant se déclare **au niveau du module**. Ce dont il a
besoin passe en props. Un composant imbriqué qui a besoin de l'état du parent
signale une prop manquante, pas une raison de l'imbriquer.

Ce qui l'a attrapé n'est pas un test neuf mais **trois tests existants** —
« garde le texte à l'écran après l'enregistrement », « décocher ne détruit
pas le souvenir déjà écrit ». Ils vérifiaient une valeur **après plusieurs
frappes**, et c'est ce qui les a rendus sensibles à un défaut que personne ne
cherchait. Un test qui n'aurait tapé qu'un caractère serait resté vert.
Voisin de [[12]] : ce qu'un test rend visible dépend moins de ce qu'il
affirme que de la **longueur du chemin** qu'il fait parcourir.

### 47 — Exécuter un document, plutôt que le relire

Le protocole de test contient cinq requêtes SQL. Je les ai **exécutées
contre le schéma réel** avant de publier le document, plutôt que de les
relire.

La deuxième rendait `0` sur la colonne « plateformes ». Le lot portait la
machine, l'API la validait, et l'événement ne la gardait pas : la table des
jugements n'est écrite que pour la passe 2, et un tap « joué » n'y laisse
rien. Relue, la requête était **impeccable** — elle joignait les bonnes
tables sur les bonnes clés. Elle ne pouvait simplement rien trouver.

Ce qui rend ce cas coûteux n'est pas le trou lui-même mais **où** il était :
dans l'instrument de mesure d'une porte de décision. Un indicateur engagé à
75 % aurait été rapporté à 0 %, et le verdict aurait porté sur le produit.

**La règle** : tout document qui contient des commandes — requêtes,
procédures, scripts de vérification — se **lance** avant d'être publié.
Écrire une requête est un raisonnement sur un schéma qu'on croit connaître ;
l'exécuter est la seule façon d'interroger le schéma qui existe.

Le corollaire vaut pour la suite : une fois le test commencé, **ces
requêtes ne doivent plus changer**. Une requête corrigée en cours de route
redéfinit l'indicateur après avoir vu le résultat — exactement ce que §22.2
interdit pour les seuils.

Prolonge [[45]] d'un cran : là, un chemin de code n'était gardé que par le
parcours ; ici, une mesure n'était gardée par **rien du tout**, parce
qu'un document n'a pas de suite de tests. L'exécuter est ce qui s'en
rapproche le plus.

### 48 — Une sonde qui accepte n'importe quel serveur ne vérifie rien

En répétant le protocole de test à blanc, la session s'est déclarée prête et
a servi une application **vieille de deux heures**.

Deux défauts s'étaient composés :

1. `e2e.sh` finissait par `exec docker run … playwright`. `exec` **remplace
   le shell**, donc le `trap … EXIT` ne s'exécutait jamais : les conteneurs
   survivaient à chaque exécution **réussie**. Seule l'exécution suivante les
   nettoyait, à son démarrage — ce qui masquait le problème exactement le
   temps qu'il faut pour ne jamais le voir.
2. La sonde de démarrage interrogeait `GET /health` et acceptait `200`. Le
   conteneur oublié répondait. Le conteneur qu'on venait de lancer mourait
   sur « address already in use », et l'orchestration concluait que tout
   allait bien.

Chacun seul est bénin. Ensemble, ils donnaient une session de test
utilisateur conduite sur une autre construction que celle du dépôt — un
testeur aurait mesuré un produit qui n'existe plus, et **le relevé aurait eu
l'air normal**.

**La règle** : une sonde de disponibilité vérifie que **notre** service
répond, pas qu'un service répond. Concrètement, deux gardes qui ne coûtent
rien : refuser de démarrer si le port répond **avant** qu'on ait lancé quoi
que ce soit, et, pendant l'attente, vérifier que notre conteneur **est encore
en vie** — un conteneur mort à la seconde n'est pas un conteneur lent.

Et le corollaire sur `exec` : il est légitime pour passer la main, jamais
dans un script qui a posé un piège de nettoyage.

Rien de tout cela n'a été trouvé en relisant. **Ça a été trouvé en jouant le
protocole**, comme [[47]] l'a été en exécutant ses requêtes. Le dénominateur
commun tient en une phrase : un mode opératoire non répété est un mode
opératoire non testé.

### 49 — Un test dont les valeurs sont celles du défaut ne surveille rien

L'écran de période envoyait `{from: 1993, to: 1997}` en dur. En le
remplaçant par une vraie saisie, j'ai fait saisir **1993-1997** au parcours
de bout en bout et vérifié que la timeline les affichait.

Il est passé du premier coup. Il serait passé **aussi avec le bouchon** :
les valeurs que je faisais saisir étaient exactement celles que le défaut
produisait. Le test avait l'air de surveiller le défaut et l'aurait laissé
revenir intact.

C'est [[43]] vu d'un autre angle — un test vrai des deux côtés d'une
mutation —, mais la cause est ici plus insidieuse : elle vient du **choix
des données du test**, pas de son assertion. L'assertion était bonne. Le jeu
d'essai la neutralisait.

**La règle** : quand un test remplace une valeur figée, ses données doivent
être **différentes de la valeur figée**. Sinon on ne teste pas le
remplacement, on teste une coïncidence.

Plus général : les données d'un test se choisissent contre le défaut qu'il
surveille. Une valeur « naturelle » est souvent celle que le code fautif
produisait — c'est pour cela qu'elle paraissait naturelle en l'écrivant.

Corollaire de méthode : la vérification est mécanique et ne coûte rien —
**réinjecter le défaut et exiger le rouge**. Je ne l'ai pas fait par
scrupule mais parce que le vert immédiat est suspect ([[socle]] : « un test
qui passe du premier coup mérite un doute »). C'est exactement ce que cette
règle sert à attraper.

### 50 — Deux tests qui partagent une base partagent aussi leurs identifiants

Les tests d'API tournent tous contre la même base PostgreSQL, et s'isolent
par l'identifiant d'utilisateur. En écrivant un nouveau fichier j'ai repris
`usr_partiel` — déjà utilisé ailleurs.

Le test existant affirmait que le journal de `usr_partiel` était **vide**.
Le mien y écrivait un événement. Celui qui a échoué n'est pas le mien : le
défaut s'est manifesté **dans un fichier que je n'avais pas touché**, ce qui
est la façon la plus coûteuse de perdre du temps.

Deux autres identifiants — `usr_fini`, `usr_abandon` — étaient également
partagés et **passaient par chance** : les assertions ne se contredisaient
pas. Ils auraient échoué le jour où quelqu'un aurait ajouté une assertion de
comptage.

**La règle** : dans une suite qui partage un magasin, l'identifiant
d'isolation se préfixe par le **sujet du fichier**, pas seulement par le cas
— `usr_etat_fini` et non `usr_fini`. Et la vérification est mécanique :
chercher chaque identifiant d'un fichier neuf dans le reste de la suite
prend une commande, là où le diagnostic prend un quart d'heure.

Même famille que [[45]] : ce n'est pas le code qui manquait de garde, c'est
la **convention** qui n'était vérifiée par rien.

### 51 — Une valeur par défaut est une affirmation

`PlayDeclarationRow.Affect` valait `"Indifferent"` par défaut. L'enum n'avait
pas de valeur pour « pas prononcé », alors la colonne en a choisi une.

Or `Indifferent` n'est pas neutre : c'est « **sans plus** », « ça ne m'a rien
laissé ». Le dépôt le dit lui-même — trois déclarations existent
*uniquement* pour distinguer un avis d'une absence d'avis. Le défaut de
colonne en a écrasé une des trois.

Ce qui rend le cas instructif, c'est que **rien ne pouvait le voir** :

- aucun écran ne posait la question, donc aucun test d'interface ;
- aucun test d'API ne lisait ce champ, puisque aucun code ne l'écrivait ;
- le domaine était cohérent : `Indifferent` est une valeur légitime de
  l'enum, et 389 tests passaient.

Il a fallu **regarder les lignes d'une session réelle** pour le trouver.
C'est le même geste que celui qui a trouvé les identifiants instables et les
rééditions prises pour des sorties : lire des lignes, jamais des agrégats.

**La règle** : un champ énuméré doit porter une valeur « **non renseigné** »,
et elle doit valoir **zéro**. Sans elle, la première valeur déclarée de
l'enum devient le défaut silencieux — et une valeur qui a un sens pour
l'utilisateur se met à décrire des lignes où il n'a rien dit.

Le test qui vérifie cela ne coûte rien : `Assert.Equal(X.Unstated,
default(X))`. Il y en a un par énumération qui traverse la persistance.

Et le corollaire de méthode, valable au-delà de ce champ : **un champ que
personne ne remplit n'est pas un champ neutre**. [[41]] notait déjà qu'un
champ sans producteur est un manque invisible ; celui-ci montre le degré
au-dessus — sans producteur, il ne reste pas vide, il ment.

### 52 — Une garde posée sur un composant ne protège pas son appelant

`SelectionMassive` exige une région, et le dit :

> « Requise, sans valeur par défaut : un défaut choisirait en silence le
> marché d'un joueur, et la décision "international dès le départ" rend ce
> choix visible. »

La garde est bonne. Elle est aussi **inutile** : `App.tsx` la satisfait avec
`useState("PAL")`. Le défaut que la prop interdisait s'est simplement
installé un niveau plus haut.

Ce qui rend le cas coûteux, c'est que la garde **fait croire au problème
traité**. En relisant le composant, on lit un commentaire qui nomme
exactement le risque et affirme l'écarter. Personne ne remonte d'un cran.

**La règle** : une prop requise déplace la question, elle ne la résout pas.
Quand une valeur ne doit pas être choisie par défaut, la garde utile est
celle qui interdit la **constante littérale** là où elle serait écrite —
dans l'appelant. C'est ce que fait le détecteur de libellés en dur ([[14]])
et c'est reproductible : un test qui lit la source et échoue sur un
`"PAL"` littéral dans `App.tsx`.

Corollaire pour l'audit : **le crible se pose au point d'origine de la
valeur**, jamais à l'endroit qui la reçoit. Suivre la valeur en remontant
est le seul parcours qui trouve où elle a été inventée.

### 53 — Un test peut maintenir en vie du code que rien n'atteint

`valeur.ts` rend une période sans fin par « depuis 1994 ». `PeriodInput`
l'accepte. `valeur.test.ts` la couvre, sous un titre explicite — « une
période ouverte ». Tout est vert.

**Aucun geste de l'interface ne peut la produire.** `PeriodeChoisie` n'a pas
de forme pour elle : le choix « plutôt une période » exige ses deux bornes.
Le chemin est correct, testé, maintenu — et mort.

C'est l'inverse exact du défaut le plus fréquent ici. [[41]] décrit un champ
que personne ne remplit ; celui-ci est un **rendu que personne n'alimente**.
Et il est plus difficile à voir, parce que le test lui donne l'apparence de
la vie : en relisant le fichier, on voit une branche couverte, donc utile.

**La règle** : la couverture prouve qu'un chemin est **correct**, jamais
qu'il est **atteint**. Pour savoir s'il l'est, la question n'est pas « y
a-t-il un test ? » mais « **quel geste de l'utilisateur produit cette
valeur ?** » — et il faut pouvoir le nommer.

Ce n'est pas une raison de supprimer : une capacité en avance sur son
interface est parfois un choix. Mais elle doit être **inscrite comme
telle**, sinon elle se lit comme une fonctionnalité livrée. Ici, ni la
spécification ni le TODO ne mentionnaient la période ouverte — elle
existait, sans que personne l'ait décidée.

### 54 — Réparer un mensonge en rend un autre visible

Décocher une ligne n'a jamais rien envoyé au serveur. Le code est ainsi
depuis le premier jour, et personne ne l'avait vu — moi compris, en écrivant
l'écran, en l'auditant, et en y ajoutant la passe 2.

La raison est mécanique : **tant que rien n'était relu, le mensonge n'avait
pas de témoin.** L'écran affichait l'état local, et l'état local était
cohérent avec lui-même. Décocher, recharger, retrouver la ligne cochée —
personne ne pouvait le constater, puisque recharger montrait de toute façon
une liste vierge.

En rendant la relecture correcte (item 22), j'ai donné un témoin à un défaut
plus ancien. **Le second défaut n'a pas été introduit ; il a été révélé.**

**La règle** : après avoir réparé une couche qui mentait, reprendre les
comportements qui s'appuyaient sur ce mensonge. Ils n'étaient pas justes —
ils étaient **invérifiables**, ce qui n'est pas la même chose et se lit
pareil.

Le corollaire pour l'audit : une surface déjà corrigée mérite d'être
recriblée **après** la correction de ses voisines. L'ordre dans lequel on
répare change ce que l'on peut voir.

Et un signe à reconnaître : le test qui couvrait le geste s'appelait
« décocher rétrécit la bande — **la déclaration est révisable** » et
n'assérait qu'un compteur local. Un nom de test est une affirmation ; quand
il promet plus que ses assertions, il **empêche** de chercher. Voisin de
[[44]] — nommer n'est pas rendre — appliqué cette fois aux tests eux-mêmes.

### 55 — Le crible a trouvé une quatrième forme, absente de ses trois questions

L'audit cherche trois choses : envoyé sans être saisi, rendu sans être lu,
écrit sans être dit. En deux surfaces, il a trouvé **trois fois** une forme
qui n'est dans aucune des trois — son inverse : **dit sans être écrit**.

- décocher une ligne ne quitte pas le navigateur ;
- « toujours en cours » est offert, puis traité comme une absence de
  réponse ;
- un titre saisi n'est pas relu, donc disparaît de l'écran qui l'a accepté.

Les trois partagent une mécanique : **l'interface accepte un geste, l'affiche
comme pris en compte, et rien ne le conserve.** C'est plus grave que les
trois formes prévues, parce que l'utilisateur a **fait** quelque chose. Un
champ jamais rempli ne coûte qu'une occasion manquée ; un geste perdu coûte
la confiance, et il coûte précisément au moment où l'utilisateur corrige —
c'est-à-dire quand il s'applique.

**La règle ajoutée au crible** : pour chaque geste que la surface accepte,
demander *où il est écrit*, et pouvoir nommer la table ou l'événement. Un
geste dont la réponse est « dans l'état local » n'est pas enregistré.

La leçon de méthode est au-dessus de la règle : **un crible se corrige avec
ce qu'il trouve.** Les trois questions venaient de trois défauts réels ; la
quatrième vient de trois autres, et elle n'aurait pas été devinée en amont.
Un inventaire figé aurait classé ces cas en « rien à signaler ».

### 56 — Un cast à la frontière rend invisible tout ce qu'on jette

`client.ts` lit la timeline ainsi :

```ts
lire<{ entries: EntreeTimeline[]; undated: MomentTimeline[] }>(`/timeline/${userId}`)
```

L'API en rend **trois** : `entries`, `undated` et `warnings`. Le troisième
n'existe pour personne dans le front — et **aucun outil ne peut le dire**,
parce que `lire<T>` fait `as T` sur du JSON analysé. Un cast n'est pas une
vérification : c'est une affirmation que le compilateur croit sur parole.

C'est l'endroit exact où le typage aurait pu attraper un « rendu sans être
lu », et c'est l'endroit où le code y renonce. Le reste du front est
typé de bout en bout ; la seule couche où la donnée vient du dehors est la
seule où le type est une déclaration d'intention.

**La règle** : à chaque frontière où l'on caste une réponse externe, la
question « ai-je déclaré tout ce que l'autre côté envoie ? » ne se pose pas
toute seule. Elle doit être posée **à la main**, en lisant le contrat de
l'API à côté du type — ou automatisée par un test qui compare les deux.

Le corollaire vaut pour l'audit : les trois frontières de ce dépôt
(`client.ts`, les vues d'API, les lignes de persistance) méritent le crible
**en priorité**, parce que ce sont les seules où un champ peut disparaître
sans qu'aucune machine ne s'en aperçoive. [[42]] et [[17]] le disaient déjà
des défauts ; celui-ci dit pourquoi : la frontière est là où les garanties
s'arrêtent.

### 57 — Le fichier qui assemble est celui qu'on ne teste pas

`App.tsx` portait quatre défauts. Tous les composants qu'il assemble ont des
tests — la sélection en a plus de quarante, la période onze, la timeline
dix. Lui n'en avait **aucun**.

La raison est prosaïque : un fichier d'assemblage ne « fait » rien
d'identifiable. Il n'a pas de règle à éprouver, il branche. Et brancher
paraît trop trivial pour mériter un test — jusqu'à ce qu'on regarde ce qui
y vit réellement :

- l'**état du chargement**, qui n'appartient à aucun écran ;
- la **fraîcheur** de ce qui est relu, qui dépend de quand on relit ;
- ce que **fait** un bouton dont le libellé vit ailleurs.

Les trois sont invisibles depuis un test de composant, parce qu'un composant
reçoit ses données déjà chargées, déjà fraîches, et ne sait pas ce que son
rappel déclenchera.

**La règle** : le fichier qui assemble mérite ses propres tests, et ils
portent sur des questions que seul lui peut poser — *que voit-on pendant le
chargement, après un échec, en revenant sur ses pas, et que fait ce bouton
vraiment ?* Un client simulé suffit.

Corollaire de mutation, constaté trois fois dans cette boucle : dans un
projet typé strictement, **une mutation par suppression ne compile pas** —
retirer un usage rend une prop ou une fonction inutilisée et le compilateur
refuse. Les mutations doivent donc être des **substitutions**. Ce n'est pas
un obstacle : c'est la mesure d'une garde que le compilateur offre
gratuitement, et qu'il faut compter comme telle plutôt que la contourner
sans le dire.

### 58 — Un rendu aussi peut affirmer ce qu'on ignore

Les défauts de cette famille étaient jusqu'ici des **données** : un champ par
défaut, une constante envoyée, un geste perdu. Celui-ci est une **couleur**.

`accentEpoque(null)` rendait la première époque. Une œuvre sans date était
donc peinte en terre cuite et étiquetée « 8 bits » — dans un système dont le
premier service déclaré est *« on sait où l'on est sur la timeline sans lire
de date »*. La couleur **est** l'affirmation. La rendre par défaut affirme
une décennie que la donnée ne porte pas, exactement comme `affect =
Indifferent` affirmait un avis ([[51]]).

Le repli avait pourtant une bonne raison, écrite dans le code : une tuile
grise au milieu d'une grille colorée se lit comme un défaut d'affichage. La
faute n'était pas de vouloir une couleur — c'était de **prendre celle d'une
autre réponse** faute d'en avoir une propre. Le langage visuel en offrait
une : la base est « chaude, pas grise ».

**La règle** : quand un rendu encode une information — couleur, forme,
position —, « ne pas savoir » a besoin de son **propre** signe. Réutiliser
celui d'une valeur connue transforme une absence en réponse, et le rendu
ment plus discrètement qu'un champ, parce que personne ne lit une couleur
comme une donnée.

Deux observations d'accompagnement :

- **Le chemin était latent.** Aucune des 221 œuvres n'est sans date. Le
  défaut n'aurait mordu qu'en grandissant — et le référentiel est un
  chantier durable. Auditer ne se limite donc pas à ce qui casse aujourd'hui.
- **Le test du repli passait avec le défaut.** Il exigeait « une couleur »,
  c'est-à-dire un hexadécimal valide — ce que la mauvaise réponse était
  aussi. Une assertion de **forme** ne vaut jamais une assertion de **sens**
  ([[43]]).

### 59 — Une règle citée à moitié est une règle à moitié appliquée

§3.4 tient en deux phrases. La première — « un joueur PAL et un joueur
NTSC-J n'ont pas connu le même catalogue » — a été implémentée avec soin :
quatre états régionaux, vingt-deux non-sorties arbitrées à la main, des
tests qui exigent la marque de chacun.

La seconde, dans le même paragraphe, dit : « elle conditionne **aussi les
dates de sortie affichées**, qui diffèrent parfois de plusieurs années entre
régions ». Celle-là n'a jamais été lue. L'écran prenait la sortie la plus
ancienne du monde, et 97 œuvres sur 221 portaient une année que le joueur
n'avait jamais vue.

Le mécanisme est ordinaire et c'est ce qui le rend dangereux : **une section
paraît traitée dès qu'on en a traité l'idée principale.** La citation qu'on
garde en tête devient le résumé, et le reste du paragraphe cesse d'exister.
Il n'y a pas d'erreur de raisonnement — seulement une lecture qui s'est
arrêtée quand elle a cru comprendre.

**La règle** : quand une section de spécification est citée dans un item, la
**relire entière au moment de cocher**, pas au moment de commencer. Et
compter ses exigences : §3.4 en porte deux, et une seule était faite.

Le corollaire est la méthode qui l'a trouvée : **mesurer sur les données
réelles** plutôt que raisonner sur le principe. « L'écran montre peut-être
la mauvaise date » est une inquiétude ; « 97 œuvres sur 221, jusqu'à six ans
d'écart, *Adventure Island* annoncé 1986 pour 1992 » est un fait, et il se
lit en cinq lignes de script. C'est le même geste que [[41]] et que l'affect
fabriqué : lire des lignes, jamais des agrégats.

### 60 — Une suite verte bâtie sur des attributs ne prouve rien de visible

Le produit n'a **aucune feuille de style**. Pas un fichier CSS, pas un lien
dans `index.html`, pas un import dans `main.tsx` — trois styles en ligne
dans tout le front. Les six sections du langage visuel ne sont pas
implémentées.

Rien ne le signalait. Au contraire, tout affirmait le contraire :

- la bande d'époque est testée sur `data-total`, `data-tranches`,
  `data-sans-date`, et le parcours de bout en bout assère ces attributs ;
- `dispositionPour` est couvert par huit cas, et l'e2e vérifie
  `data-disposition="grille"` d'un côté, `"liste"` de l'autre — **alors que
  les deux rendent exactement la même chose** ;
- la tuile porte `data-ratio="3:4"`, qui ne contraint aucun ratio.

Les attributs ont été introduits pour une bonne raison ([[01]] :
« indisponible » contient « disponible »). Mais **ils ont cessé d'être une
sonde pour devenir le sujet**. Un attribut est une intention déclarée ; la
tester vérifie qu'on a bien déclaré son intention.

**La règle** : un attribut de machine ne vaut que comme *complément* d'une
assertion sur l'effet. Là où il n'y a pas d'effet observable à asserter —
une couleur, une hauteur, une disposition —, la question à se poser n'est
pas « le test passe-t-il ? » mais « **qu'est-ce qui, dans ce dépôt, rend
cette chose ?** ». Si la réponse est « rien », le test mesure un vœu.

C'est [[44]] — nommer n'est pas rendre — à l'échelle du produit entier, et
la raison pour laquelle [[44]] a été trouvé par une mutation et pas par une
relecture : on ne doute pas de ce qui est vert.

Corollaire pour l'audit : **chercher ce qui n'existe pas est plus difficile
que chercher ce qui est faux.** Les huit premières surfaces ont été criblées
fichier par fichier ; celle-ci s'est trouvée en posant une question qu'aucun
fichier ne pose — *où est le CSS ?*

### 61 — L'exigence qui nomme un algorithme est faite ; celle qui nomme une intention est oubliée

§6 de `ORDONNANCEMENT-TEMPOREL.md` porte trois phrases :

1. « Ordre dans le tiroir : `RecordedAt` **décroissant** » — **faite**, avec
   deux tests du domaine et un test miroir à l'API ;
2. « Le tiroir est une **tâche**, pas une poubelle. Il est dimensionné pour
   être vidé » — **pas faite** : il n'accepte aucun geste ;
3. « Un moment sans date **compte dans les totaux** du profil » — pas faite.

Le même contraste apparaît dans §24.4 : « la timeline se remplit à mesure
qu'on coche » est faite, « une phrase de récit à la première console » ne
l'est pas. Et dans §3.4 : le statut régional est fait, les **dates**
régionales ne l'étaient pas.

Le motif n'est pas la négligence, c'est la **prise**. Une phrase qui nomme
un tri, un champ, un format se traduit directement en code, donc en test,
donc en case cochée. Une phrase qui nomme une intention — « c'est une
tâche », « ça doit récompenser », « ça doit se reconnaître » — n'a pas de
traduction évidente : elle attend qu'on lui en invente une, et personne ne
remarque qu'on ne l'a pas fait.

**La règle** : en lisant une section, **compter ses phrases impératives et
les classer** — algorithme ou intention. Celles qui nomment une intention
sont celles qui seront oubliées ; ce sont donc elles qu'il faut inscrire
explicitement, avec une acceptation, même si l'inscription dit « différé ».

C'est la mécanique derrière [[59]] : une règle citée à moitié est une règle
à moitié appliquée — et la moitié qui tombe est toujours la même.

### 62 — Une prédiction de mutation fausse vaut mieux qu'une mutation réussie

J'annonçais quatre échecs : trois tests neufs, **et** le garde des libellés
morts, puisque la mutation retirait le dernier usage d'une clé. Il y en a eu
trois.

L'écart aurait pu se classer « tant mieux, l'essentiel est mort ». C'est
l'écart qui instruit, pas le compte — et celui-ci disait que **le garde des
libellés morts ne pouvait pas échouer**. Vérifié en une minute : une clé
fabriquée, que personne n'utilisait, passait.

La cause est une conclusion **indûment étendue**. Le fichier porte ce
commentaire :

> « Pas d'exception pour `messages.ts` : une mutation a montré que l'exclure
> ne changeait rien. »

C'était vrai du **détecteur de texte en dur** — il ne lit que le JSX et les
attributs visibles, et le catalogue n'en a pas. Ce n'était pas vrai du
**second contrôle**, qui lit la même chaîne de sources et y cherche l'usage
des clés : chaque clé est définie dans le catalogue sous la forme
`"cle": "valeur"`, donc toujours trouvée.

Deux règles, et la seconde est la plus utile :

1. **Deux contrôles dans un même fichier ne partagent pas leurs
   conclusions.** Une exception justifiée pour l'un doit être re-justifiée
   pour l'autre, séparément.
2. **Le témoin est par contrôle, pas par fichier.** Celui-ci en avait un —
   « détecte bien ce qu'il prétend détecter » — et sa présence a fait croire
   les deux couverts. [[14]] avait posé la règle ; elle n'a été appliquée
   qu'à moitié, et c'est la moitié sans témoin qui est morte.

Le garde réparé a trouvé un vrai mort dans la minute : un libellé
« Changer de console » dont l'action n'existe pas. Un garde qui ne peut pas
échouer ne protège pas — il **cache**.

### 63 — Le SENS de l'écart de mutation dit lequel des deux problèmes on a

Deux mispréductions en deux itérations, et elles ne disaient pas la même
chose.

**Moins d'échecs qu'annoncé** (item 11 : trois au lieu de quatre) : un garde
que je croyais actif ne l'était pas. `messages.ts` figurait dans les sources
où l'on cherche un usage, et le contrôle des libellés morts ne pouvait pas
échouer. **Mauvaise nouvelle, et la plus utile** — c'est un trou.

**Plus d'échecs qu'annoncé** (item 12 : trois au lieu d'un) : une garde
existait que j'ignorais. `GetInt32()` lève sur un `null`, donc l'hypothèse
du front était déjà tenue. **Bonne nouvelle**, et elle m'a évité d'écrire un
test redondant — que j'avais d'ailleurs déjà écrit, et qu'il a fallu
retirer.

D'où une lecture immédiate de l'écart, avant même d'en chercher la cause :

| Écart | Ce que ça veut dire | Ce qu'on fait |
|---|---|---|
| moins d'échecs | un garde ne garde pas | le réparer, lui donner un témoin |
| plus d'échecs | la couverture dépasse ce qu'on savait | **chercher le doublon qu'on s'apprêtait à écrire** |

La seconde ligne est celle qu'on oublie : un test de plus paraît toujours
gratuit. Il ne l'est pas — il dilue, il double la maintenance, et surtout il
fait croire qu'un sujet est couvert par *le nouveau* alors qu'il l'était
déjà, mieux, ailleurs.

**La règle** : avant d'écrire une garde, chercher celle qui existe. Et quand
une mutation fait tomber plus de tests que prévu, **lire leurs noms** : ils
disent où le sujet était déjà traité.

### 64 — Dans un même enregistrement, certains champs sont mesurés et d'autres souhaités

Le manifeste des jaquettes porte, par visuel : `source_url`, `licence`,
`bytes`, `width`, `height`. Il inscrivait `width: 512` pour **les 218**.

Les fichiers mesurent de 213 à 960 px, médiane 300. Le `512` n'était pas une
mesure : c'était la taille **demandée** à la source, écrite au moment de la
requête. Et `bytes` était juste **au bit près** — celui-là avait été mesuré
après coup.

Deux champs voisins, dans la même ligne, écrits par le même script : l'un
décrit ce qu'on a obtenu, l'autre ce qu'on avait demandé. **Rien ne les
distinguait**, et le second se lisait comme le premier.

Ce que cela coûte dépend de l'enregistrement. Ici, c'est la pièce sur
laquelle s'appuierait une demande de retrait, et elle prétendait une
conformité — « 512 px au plus » — que deux fichiers ne respectent pas.

**La règle** : un enregistrement qui documente un fait doit être écrit
**après** l'action, à partir de ce qu'elle a produit — jamais à partir de ce
qu'on lui avait demandé. Quand les deux doivent coexister, ils portent des
noms différents : `largeur_demandee` et `largeur`.

Et le contrôle qui l'attrape est trivial une fois qu'on y pense : **relire le
fichier et comparer**. Il n'existait pas. Sa parenté avec [[47]] est
directe — exécuter un document plutôt que le relire — appliquée cette fois à
un enregistrement : **mesurer un artefact plutôt que lire ce qu'il dit de
lui-même**.

### 65 — Une règle qui n'existe que dans le client n'existe pas

`ChoixPeriode` refuse « 1985 sur Super Nintendo » et **nomme** l'année de
sortie de la console dans son message. La règle est donc écrite, expliquée,
testée — et elle ne vivait **que dans le navigateur**. L'API acceptait le
même lot sans broncher ; vérifié en le postant.

La couche qui fait foi était la plus permissive. C'est l'inverse de ce qu'on
veut : un client plus strict que le serveur est un confort, un serveur plus
permissif que le client est un trou.

Le piège tient à la façon dont la règle naît. Elle est apparue en écrivant
l'écran, parce que c'est là qu'on voit le problème — un joueur qui tape une
date absurde. On l'implémente où on la voit, et le message qu'on rédige
donne l'impression d'un travail fini.

**La règle** : une contrainte de **validité de la donnée** appartient à la
couche qui écrit. L'écran peut la répéter pour l'expliquer plus tôt et mieux
— c'est même souhaitable —, mais il ne peut pas en être le seul porteur.
Le critère est simple : *si quelqu'un poste directement, que se passe-t-il ?*

Et une nuance qui a compté ici : les deux couches n'ont pas à être
**identiques**. L'écran refuse chaque borne antérieure à la machine ; l'API
ne refuse que l'**impossible certain** — l'année la plus tardive de la
période. Un serveur qui rejetterait une imprécision légitime coûterait plus
qu'il ne protège, sur un produit dont la thèse est justement que
l'incertitude est une donnée.

### 66 — Un test par cas ne fait pas une garantie d'exhaustivité

Quatre tables portent les données d'un utilisateur. `PurgeUserAsync` les
efface toutes les quatre, et **quatre tests l'éprouvent — un par table**. La
couverture paraît complète : chaque table a son test, chaque test passe.

Elle ne l'est pas. Une **cinquième** table serait oubliée sans que rien ne
rougisse, parce que les quatre tests parlent des quatre tables qu'on
connaît. Ils vérifient que ce qu'on a fait marche ; aucun ne vérifie qu'on
n'a rien oublié.

La distinction est celle entre **couvrir des cas** et **couvrir un
ensemble**. Elle n'a de conséquence que là où l'ensemble peut grandir — et
c'est précisément là qu'elle fait le plus mal : un effacement RGPD incomplet
est le manquement le plus grave d'une archive personnelle.

**La règle** : quand une opération doit porter sur *tout* un ensemble,
demander l'ensemble à sa **source d'autorité** — ici `information_schema`,
ailleurs le modèle EF, le dossier, l'énumération — et le comparer à une
liste écrite. Ce n'est pas un test de plus à côté des quatre : c'est le seul
qui dise quelque chose sur ce qui n'existe pas encore.

Et une note de méthode payée comptant : la mutation de cette garde a
**échoué à s'injecter**. Créer une table à la main ne changeait rien, la
suite recréant sa base à chaque exécution. Moins d'échecs qu'annoncé veut
dire qu'un garde ne garde pas ([[63]]) — mais aussi, parfois, que la
mutation n'a pas eu lieu. Vérifier que l'injection a bien pris fait partie
de l'injection.

### 67 — Compter les membres d'une énumération, et compter leurs producteurs

Deux nombres, obtenus en deux commandes :

- `PlayerEventType` déclare **onze** types d'événements ;
- `src/DigitalTwin.Api/` en produit **quatre**.

Sept n'ont aucun chemin de création. Le tri les ordonne, la cohérence
causale raisonne dessus, des tests les couvrent — et rien, dans le produit,
ne peut en fabriquer un. Ce sont `SoldItem`, `LostItem`, `LentItem`,
`ReturnedItem`, `DiscoveredGame`, `ReplayedGame`, `BorrowedItem` :
exactement ceux qui portent l'histoire d'une collection sur trente ans.

Aucune relecture ne le voit. Un type d'événement est cité partout — dans le
domaine, dans les tests, dans la documentation — et sa présence y est
indiscernable d'un usage réel. Le seul signal fiable est **le rapport entre
les deux comptes**.

**La règle** : pour toute énumération qui traverse le produit, compter ses
membres, puis compter ceux qu'un chemin réel produit. L'écart se mesure en
deux `grep`, et il dit ce qu'aucune lecture ne dit — la même question que
[[53]] posait d'un rendu (« quel geste produit cette valeur ? »), mais posée
d'un coup à tout un ensemble.

Le corollaire vaut pour l'inscription : un membre sans producteur n'est pas
forcément une faute — il peut être une capacité en avance. Mais alors il
doit être **écrit comme telle**, sinon son existence se lit comme une
fonctionnalité livrée. Sept sur onze, aucun inscrit nulle part.

### 68 — Le socle visuel a besoin d'une garde que seul le navigateur peut tenir

Le produit n'avait aucune feuille de style, et **rien ne le signalait** —
198 tests front verts, un parcours de bout en bout vert. En écrivant le
socle, la question devient : qu'est-ce qui empêchera que cela recommence ?

Trois niveaux de garde, et ils ne se remplacent pas :

1. **Le test miroir**, en unité : les six accents de `socle.css` doivent
   dire la même chose que `EPOQUES`, chacun doit être appliqué par un
   sélecteur, et il ne doit pas y en avoir un septième. Il attrape la
   divergence entre deux copies d'une même vérité.
2. **Le parcours**, dans un vrai navigateur : le fond de page doit être le
   blanc cassé chaud de §2, et un bouton doit mesurer au moins 44 px.
   Retirer l'import du socle le fait échouer **en le nommant**.
3. Rien d'autre. Un test de composant **ne peut pas** voir cela : il rend
   dans un document sans CSS, et c'est exactement pourquoi les 198 tests
   étaient verts.

La leçon dépasse le CSS. À chaque fois qu'une couche entière peut être
absente sans qu'un test ne bouge, il faut chercher **quel niveau de test la
verrait** — et si la réponse est « aucun de ceux qu'on a », c'est le niveau
qui manque, pas le test.

Et le choix de l'assertion compte autant que son existence : vérifier « le
fond n'est pas blanc » aurait laissé passer n'importe quelle couleur.
Vérifier `rgb(250, 248, 245)` — « un blanc cassé légèrement papier », ce qui
distingue une archive d'un outil — vérifie que **ce socle-là** est servi.

### 69 — Un déclencheur qui énumère ses colonnes se périme à la migration suivante

Le journal est en ajout seul, garanti par un déclencheur PostgreSQL qui
comparait `NEW` et `OLD` **colonne par colonne**, la liste écrite à la main.

`platform_id`, ajoutée après lui, n'y figurait pas. Elle pouvait donc être
réécrite sans qu'aucune exception ne se lève — vérifié en la réécrivant.
La garantie centrale du modèle avait un trou, ouvert par ma propre
migration, et aucun test ne l'a vu parce que les tests éprouvaient les
colonnes **qu'on connaissait**.

C'est [[66]] transposée au SQL : couvrir des colonnes n'est pas couvrir un
ensemble. Et c'est la même correction — demander l'ensemble à sa source
plutôt que le recopier :

```sql
to_jsonb(NEW) - 'superseded_by_event_id'
IS DISTINCT FROM
to_jsonb(OLD) - 'superseded_by_event_id'
```

**La règle** : une garde qui protège « tout sauf X » s'écrit en retranchant
X du tout, jamais en énumérant ce qui reste. La première forme reste vraie
quand le tout grandit ; la seconde se périme en silence, et son silence
ressemble à une garantie.

Le test qui l'accompagne se pose la même question : il ne vérifie pas que
telle colonne est protégée, il vérifie qu'**une colonne ajoutée après le
déclencheur** l'est.

### 70 — Un compte trop élevé nomme ce qu'on avait oublié de construire

Le parcours devait lire **une** marque de souvenir sur l'axe — celle du jeu
affiné, dont les trois moments ne doivent en produire qu'une. Il en a trouvé
deux, et ma première réaction a été de corriger le nombre.

La seconde venait du **titre saisi**, à qui le parcours écrit une phrase sans
jamais lui donner de repère. Cette marque-là prouvait, de bout en bout, que
le repère est réellement facultatif — la moitié de l'acceptation que je
croyais couverte par un seul test de composant.

C'est la règle des mutations appliquée à un rendu : un écart de compte a un
**sens**, et le sens dépend du signe. Moins, c'est un chemin qui ne passe
pas ; plus, c'est un chemin qu'on ne savait pas avoir.

**La règle** : devant un compte plus élevé qu'annoncé, nommer chaque élément
supplémentaire avant de toucher au nombre — puis remplacer le nombre par des
assertions qui les nomment. `toHaveCount(2)` seul serait redevenu faux au
premier souvenir ajouté au parcours, sans rien dire de ce qui a changé.

### 71 — `NaN` ne déclenche pas un garde écrit au rejet, il le traverse

Le balayage de §24.3 se reconnaît à deux conditions : assez loin, et plus
horizontal que vertical. Écrites au rejet —

```ts
if (dx < SEUIL || dx <= dy) return;   // « rejeter si… »
```

— elles ont laissé passer **tous** les gestes, défilement vertical compris.
La cause n'était pas la logique mais l'absence de coordonnées : jsdom n'a pas
de `PointerEvent`, l'assistant de test fabriquait un événement nu, `dx` et
`dy` valaient `NaN` — et **toute comparaison avec `NaN` est fausse**. Le
rejet ne rejetait donc rien.

Un garde formulé au rejet dit ce qu'il refuse et laisse passer **tout le
reste**, y compris l'inconnu. Formulé à l'acceptation, il dit ce qu'il
accepte et refuse tout le reste — ce qui est le bon défaut pour un geste qui
écrit en base :

```ts
if (!(dx >= SEUIL && dx > dy)) return;   // « n'accepter que… »
```

C'est [[66]] au niveau d'une expression : se retrancher du tout plutôt
qu'énumérer les cas. Et c'est la même famille que « une donnée absente se lit
comme un fait » — ici l'absence se lisait comme un geste.

**La règle** : écrire une condition d'admission à l'acceptation et la nier,
jamais en énumérant les rejets — et, dans un test qui fabrique un événement
d'entrée, vérifier que l'événement porte réellement ce qu'on croit lui
donner, en mesurant au moins une de ses valeurs.

### 72 — Un faux écrit à la main n'a aucun contrat avec ce qu'il remplace

Ajouter un point d'entrée au client a fait échouer **trois tests
d'assemblage sans rapport**, qui se plaignaient tous de ne pas trouver un
bouton. La cause : le faux du module, un objet écrit à la main, ne portait
pas la nouvelle méthode ; l'appel levait, et l'enveloppe qui transforme un
échec en alerte a fait le reste. On cherche le défaut dans l'écran pendant
que la cause est dans le décor.

Une ligne suffit à rendre l'omission visible à la compilation :

```ts
import type { client as ClientReel } from "./api/client";
const _contrat: Record<keyof typeof ClientReel, unknown> = faux;
```

L'import de type disparaît à la compilation, donc il n'entre pas dans la
fabrique du mock — qui ne peut rien voir de son dehors. **Et il a trouvé une
omission dès sa première exécution** : `retracter` manquait au faux depuis
l'arrivée de la rétractation.

C'est [[56]] retournée : là, un champ que l'API rend et que le client ne
déclare pas disparaît en silence ; ici, une méthode que le vrai porte et que
le faux ignore explose loin de sa cause. Dans les deux cas, le défaut est
l'absence de contrat entre deux descriptions du même objet.

**La règle** : relier tout double — faux, bouchon, décor — à son original par
une contrainte de type, et l'écrire au moment où l'on crée le double, pas au
premier accident.

### 73 — Un état initial dérivé des props se fige au montage, pas à l'arrivée des données

`SelectionMassive` construit ses ensembles initiaux — lignes cochées,
souvenirs, titres saisis — dans des initialiseurs `useState`. Ils ne
s'exécutent **qu'une fois**, au montage. Tant que le parent n'ouvrait l'écran
qu'après avoir tout relu, c'était invisible ; j'ai voulu l'ouvrir plus tôt
pour rendre l'attente visible, et il a capturé des props **vides**. L'écran
serait revenu en montrant moins que ce que la base contient — le défaut exact
que la relecture avait corrigé.

Le même piège dormait déjà dans « Recharger la liste » : les props changeaient,
l'état local ne bougeait pas.

Deux corrections, et la seconde n'est pas facultative :

1. Une **clé** qui change quand les données arrivent, pour remonter le
   composant avec elles.
2. Sortir du composant **ce qui ne doit pas repartir** avec lui. Le `batchId`
   vivait dans une `ref` : un remontage en ouvrait un second, et la timeline
   aurait montré deux bandes là où le joueur n'a fait qu'un passage. Il
   appartient au parcours, pas à l'instance React.

**La règle** : quand un composant dérive son état initial de ses props,
écrire dans le même geste **ce qui le remonte** et **ce qui doit lui
survivre**. Une dérivation au montage est un contrat avec le cycle de vie —
implicite, il se rompt à la première optimisation du parent.

### 74 — Un contrôle qui ne peut pas s'exécuter doit le dire, pas rendre vert

Les quatre contrôles hors ligne du référentiel ne se lançaient que depuis
`calibration/` : ils ouvraient `"resolved.json"` et `"../dataset/poc.json"`,
c'est-à-dire des chemins relatifs au **répertoire courant**. Documentés comme
lançables, ils ne l'étaient pas — et un garde documenté qui ne se lance pas
fait croire le sujet couvert.

Résoudre depuis `__file__` a réglé cela en trois lignes. Le cas intéressant
est le quatrième : celui des jaquettes **ne peut pas** tourner sur un dépôt
neuf, parce que les images ne sont délibérément pas versionnées — le dépôt
est public, et deux des cinq conditions juridiques l'interdisent. La
documentation le donnait pourtant pour « lançable partout ».

Trois issues possibles, et une seule est honnête :

| Rendre | Ce que ça dit | Ce que c'est |
|---|---|---|
| `0` | « les conditions tiennent » | **un mensonge** — rien n'a été lu |
| `1` | « le manifeste ment » | une accusation fausse |
| `2` | « je n'ai pas pu, voici ce qu'il me faut » | le fait |

Vérifié en le faisant : avec `0`, la commande d'ensemble annonce « les quatre
contrôles passent » sur un dépôt où aucune jaquette n'existe.

**La règle** : donner à tout contrôle un code distinct pour « je n'ai pas
pu », et le faire nommer ce qui lui manque. Un binaire réussite/échec force
le contrôle indisponible à mentir dans un sens ou dans l'autre — et le sens
qui arrange est toujours le vert.

### 75 — Un contrat que l'on n'écrit qu'en commentaire n'a pas de sens de lecture

L'inventaire des champs ignorés vivait dans l'en-tête de `client.ts`. Il était
juste, motivé, et **vérifié par rien**. Mis à l'épreuve d'un contrat exécutable,
il s'est révélé incomplet de **quatre champs** : `POST /declarations` rend
`alreadyRecorded`, `batchId`, `declarationsRecorded` et `eventIds`, qu'aucun
écran ne lit et qu'aucune ligne n'avait inscrits. Le front les jetait en
silence depuis la Phase 1.

Ce qui a fait la différence n'est pas d'avoir écrit le contrat, mais de l'avoir
rendu **lisible des deux côtés** : un fichier à la racine, comparé aux réponses
RÉELLES côté API, et aux sources côté front.

La seconde moitié a failli être fausse. J'ai d'abord exigé qu'aucun champ
ignoré ne soit nommé dans le front — et `batchId` et `targetId` sont aussi des
champs de **requête** : la recherche par nom ne distingue pas ce qu'on envoie
de ce qu'on lit. Une garde qui ne se satisfait que par une liste d'exceptions
ne garde plus rien ; elle a été retirée plutôt qu'aménagée, et la moitié qui
compte — l'API bouge, le front l'ignore — reste entière côté serveur.

**La règle** : un contrat entre deux côtés se place **entre les deux**, jamais
dans l'un d'eux, et chaque côté le confronte à ce qu'il a réellement sous la
main — des réponses pour celui qui répond, des sources pour celui qui lit. Et
quand une des deux moitiés ne peut être tenue qu'à coups d'exceptions, la
retirer vaut mieux que la maquiller.

### 76 — Deux réponses qui produisent les mêmes événements ne se distinguent pas dans le journal

« Toujours en cours » était traité comme une absence, et le domaine avait une
bonne raison : `CompletionProjection` la DÉDUIT du journal — un `StartedGame`
que rien n'a refermé — et un commentaire interdit explicitement un type
d'événement pour elle, « sinon la position cesserait d'être une absence pour
devenir un état à maintenir ».

Le raisonnement est juste, et il ne répond pas à la question posée. Un jeu
simplement coché et un jeu déclaré « j'y joue encore » produisent **exactement
les mêmes événements**. La projection ne peut donc pas les séparer : elle
répond « où en est la partie ? », pas « qu'a dit le joueur ? ». La chip
revenait vierge, et le testeur voyait disparaître ce qu'il venait de dire.

La sortie n'était ni un type d'événement — l'interdit tient — ni le silence,
mais la troisième porte que le modèle offrait déjà : un **jugement sans
date**, ce que `PlayDeclaration` existe pour porter (MODELE §5).

Et il a fallu **exposer** ce jugement pour pouvoir l'éprouver : l'état relu
laisse l'événement daté masquer le jugement quoi qu'il contienne, si bien
qu'un « en cours » resté en base après un « fini » était invisible. Une
fermeture manquée ne se serait vue qu'en Phase 3.

**La règle** : devant un champ qu'on croit dérivable, chercher **deux
saisies différentes qui produisent la même trace**. Si elles existent, la
dérivation ne répond pas à la question — et il faut stocker la réponse, pas
la recalculer. Puis vérifier qu'un point d'entrée la montre : ce qu'aucune
lecture ne rend ne peut pas être éprouvé.

### 77 — Une décision de ne pas faire se garde comme le reste

Quatre items de cette boucle se réglaient par une phrase : différer. Écrite
dans un document, cette phrase se périme exactement comme du code — sauf que
rien ne le signale, et qu'au bout d'un moment « différé » ne se distingue
plus d'« oublié ». C'est ce qui était arrivé à la passe temporelle, décrite
dans une fiche d'écran et inscrite dans aucune phase.

Deux gardes de documentation ont été écrits sur le même patron, et il se
transpose :

1. **Prendre l'ensemble à sa source d'autorité** — la hiérarchie scellée par
   réflexion, la ligne « Entrant » d'une fiche — jamais à une liste recopiée.
2. **Le comparer au document**, dans les deux sens : ce que le document tait,
   et ce qu'il nomme de trop.
3. **Ancrer la lecture sur une section**, pas sur le fichier entier. Le
   premier essai ramassait onze lignes d'un tableau sans rapport, et se
   serait cru satisfait par n'importe quel document assez long.
4. **Un témoin qui éprouve la logique**, pas l'arbre : un document amputé,
   une fiche fabriquée. Sans lui, un ensemble vide passe pour une garantie.

**La règle** : quand une décision est de ne rien construire, écrire le garde
qui vérifie que la décision reste écrite. Il coûte dix lignes et il survit à
la mémoire de celui qui a décidé.

### 78 — Un test qui attend « rien » porte son témoin, ou il ne prouve rien

« Aucun geste du produit ne peut produire une incohérence causale » se vérifie
en envoyant les seize combinaisons que l'écran accepte et en exigeant zéro
avertissement. Cette assertion-là se satisfait de **tout ce qui va mal** : un
détecteur en panne, un champ renommé, un profil vide, une requête qui échoue
en silence. Elle passerait pour la pire des raisons, et personne ne le saurait.

Le même test force donc, ensuite, une contradiction dans le **même journal** —
un achèvement entièrement antérieur à tout commencement — et exige qu'elle
soit vue. Le zéro cesse d'être un silence : il devient une mesure.

C'est la contrepartie de [[14]]. Là, un garde ne pouvait pas échouer ; ici,
une assertion ne peut pas distinguer « il n'y en a pas » de « je ne sais pas
regarder ».

**La règle** : tout test dont l'attendu est une absence — zéro résultat, liste
vide, rien d'affiché — enchaîne immédiatement sur un cas où la chose DOIT
apparaître, dans le même montage. Sans cela, son vert ne dit rien de plus que
« le test s'est exécuté ».

### 79 — Un parcours automatisé ne perd jamais une course que l'humain perd

L'affinage de période était **inatteignable en pratique** : le clic sur une
carte de décennie validait la période ET faisait naviguer, si bien que le
panneau n'existait que le temps de deux requêtes. Sur une machine rapide,
personne n'avait le temps de cliquer dedans.

Le parcours de bout en bout, lui, passait — et il passait pour une raison qui
n'a rien à voir avec le produit : **Playwright clique plus vite qu'une main**.
Il gagnait la course à chaque exécution, et il l'a gagnée pendant des
semaines.

Le défaut n'a pas été trouvé en lisant le code ni en jouant le parcours, mais
en essayant de déplacer l'ouverture d'un écran — c'est-à-dire en changeant le
*temps*. Une fois la garde écrite, elle ne pouvait pas être « la page a
navigué » : `toBeVisible` passe au premier instant, donc pendant la course.
Il a fallu attendre que **le réseau se taise**, et alors seulement demander si
l'écran est toujours là.

**La règle** : quand une assertion porte sur le fait qu'un écran RESTE, la
poser une fois tout calme — jamais au premier instant, où elle est vraie même
dans le cas qu'on veut interdire. Et se méfier d'un parcours vert sur un geste
enchaîné : l'automate ne vit pas au rythme d'une main.

### 80 — Un test écrit en fonction de sa constante n'en garde que la forme

Le seuil du portrait — « moins de ~10 moments », au-delà duquel les chiffres
d'un profil cessent de mentir — était gardé par ce qui paraît le bon test :

```csharp
Assert.False(Synthese(Nourri(PortraitThreshold - 1)).MakesAPortrait);
Assert.True (Synthese(Nourri(PortraitThreshold)).MakesAPortrait);
```

Il est juste, il éprouve la borne — « moins de » et non « au plus » —, et il
est **aveugle à la valeur**. Mis à dix, à cinq ou à trois, il reste vert : il
mesure la constante avec la constante.

Je ne l'ai pas vu en le relisant. Je l'ai vu en **annonçant un nombre
d'échecs avant la mutation** : le seuil passé de 10 à 5 devait faire tomber
ce test, et j'ai dû admettre en écrivant la prédiction qu'il ne pouvait pas
tomber. La discipline du compte annoncé a servi là où elle sert le plus —
avant l'exécution, pas après.

Le nombre est écrit **deux fois** : dans la fiche d'écran et dans le code. Un
second test le lit donc là où il fait foi :

```csharp
var ecrit = Regex.Match(fiche, @"moins de ~(\d+) moments");
Assert.Equal(int.Parse(ecrit.Groups[1].Value), ProfileSummary.PortraitThreshold);
```

C'est [[77]] appliqué à un seuil plutôt qu'à une décision : prendre la valeur
à sa source d'autorité, jamais à une copie. Et c'est la même famille que
[[14]] — un garde qui ne peut pas échouer.

**La règle** : quand un test porte sur une constante, écrire **deux** tests
et pas un. L'un éprouve la logique autour d'elle, et il a le droit de la
nommer ; l'autre compare sa valeur au document qui la décide, et il ne doit
jamais la nommer deux fois. Devant un test paramétré par ce qu'il garde, la
question n'est pas « est-il juste ? » mais « que faudrait-il casser pour
qu'il rougisse ? ».

### 81 — Une absence d'attente se mesure à ce qui n'est PAS parti

E01 exige du temps 3 qu'il arrive « sans transition ni chargement bloquant ».
La première façon d'en faire une garde vient toute seule, et elle est
mauvaise :

```ts
const debut = Date.now();
await expect(page.getByTestId("temps3")).toBeVisible();
expect(Date.now() - debut).toBeLessThan(200);   // ← une machine, pas une règle
```

Un seuil de durée passe partout où la machine est rapide — c'est
littéralement [[79]] : l'automate gagne une course que la main perd, et le
jour où la lecture devient lente, le test ne dit pas « l'écran attend », il
dit « la CI était chargée ». On mesure alors l'hébergeur.

Ce qu'il fallait mesurer n'est pas un temps mais un **fait** : combien de
requêtes de données partent entre le geste et l'écran.

```ts
page.on("request", espion);           // xhr et fetch seulement — les images
await toucher(bouton.click());        // ne bloquent rien
await expect(page.getByTestId("temps3")).toBeVisible();
page.off("request", espion);
expect(requetesDeDonnees).toEqual([]);
```

Zéro requête, et la propriété devient indépendante de la vitesse de tout le
monde. Le pendant côté composant est du même ordre : faire en sorte que les
trois lectures de l'écran suivant **ne répondent jamais** (`new Promise(() =>
{})`), puis exiger que la récompense s'affiche quand même. Si elle dépendait
d'une seule d'entre elles, elle ne viendrait pas.

Les deux gardes disent la même chose de deux endroits : l'écran ne demande
rien, parce que tout ce qu'il montre était déjà là.

**La règle** : une propriété de rapidité s'écrit comme une propriété de
dépendance. « Assez vite » dépend de la machine ; « ne demande rien » n'en
dépend pas — et c'est presque toujours ce qu'on voulait dire. Quand
l'attendu est une absence, la garde compte ce qui n'a pas eu lieu (voir
[[78]] pour son témoin obligatoire).

### 82 — Une absence ne se constate pas là où la chose ne pourrait pas être

Le test devait dire qu'un profil vierge ne se voit proposer aucune reprise.
Il était écrit ainsi :

```tsx
render(<App />);
await utilisateur.click(await screen.findByRole("button", { name: /^Super Nintendo/ }));
expect(screen.queryByTestId("reprise")).toBeNull();   // ✅ toujours
```

Le clic fait passer au temps 2. Or l'offre n'est rendue qu'à l'accueil : à
l'endroit où le test regarde, **elle ne pourrait pas être là de toute
façon**. L'assertion était donc vraie avant même que la règle existe.

Il est tombé sur une mutation qui supprimait le cas « profil vierge » : deux
tests devaient rougir, un seul l'a fait. Le compte annoncé a encore servi de
détecteur — comme pour [[80]], c'est l'écart, pas la lecture, qui a montré le
trou.

C'est [[78]] resserré d'un cran. Le témoin existait bien, mais dans le test
**suivant**, sur un autre montage : il prouvait que le composant sait
s'afficher, et rien sur le montage qui nous occupe. Un témoin ne protège que
la mise en scène dans laquelle il joue.

**La règle** : pour asserter une absence, se placer exactement où la chose
apparaîtrait si la règle tombait — même écran, même état, même instant — et
vérifier dans le MÊME montage qu'elle y apparaît quand elle doit. Deux
questions à se poser avant d'écrire `queryBy…).toBeNull()` : *est-ce que
j'ai navigué depuis ?* et *qu'est-ce qui, ici, la ferait paraître ?* Si la
seconde n'a pas de réponse, le test ne garde rien.

### 83 — Dans une conjonction, chaque moitié demande son propre cas

Le message « aucun titre ne correspond » est gardé par deux conditions :

```tsx
{filtreActif && filtrees.length === 0 ? <p>…</p> : null}
```

Une mutation a retiré la première — `{filtrees.length === 0 ? …}` — et
**aucun test n'a échoué**. Zéro. Pas « moins qu'annoncé » : rien du tout.

La cause est mécanique. Tous les tests du filtre tapent quelque chose :
`filtreActif` y vaut **toujours vrai**, et seule l'autre moitié varie.
Retirer une condition qui ne change jamais ne change rien — la moitié
supprimée n'était gardée par personne, alors que le fichier compte onze
tests sur ce filtre.

Ce qu'elle garde pourtant est réel : monté avec **zéro œuvre** et sans
recherche — l'état vide de §5, celui que voit un nouvel utilisateur —,
l'écran annonçait « aucun titre ne contient "" », c'est-à-dire la réponse à
une question que personne n'a posée, par-dessus l'état le plus important de
l'écran.

C'est le versant « zéro » de la règle des comptes : **moins d'échecs
qu'annoncé veut dire qu'un garde ne garde pas**, et zéro échec le dit plus
fort que tout. C'est aussi [[82]] vu depuis le code plutôt que depuis le
test : là, l'absence était constatée là où la chose ne pouvait pas être ;
ici, une condition est éprouvée là où elle ne peut pas être fausse.

**La règle** : devant `A && B`, exiger un cas où **A est faux pendant que B
est vrai**, et l'inverse. Sans ces deux-là, l'une des deux conditions est
une décoration que rien ne distingue d'une ligne morte. Et le détecteur est
gratuit : muter chaque moitié séparément, et se méfier d'une mutation qui ne
casse rien plus encore que d'une qui casse moins que prévu.

### 84 — Ce qu'un faux doit contrefaire dit où passe la frontière

`valeurDeSortie` — traduire `date` + `precision` en valeur temporelle — vivait
dans `client.ts`. Elle y était née parce que son premier appelant y était, et
elle y est restée parce que rien ne s'y opposait.

Le jour où la fiche de jeu en a eu besoin, les tests d'assemblage se sont
effondrés d'un coup :

```
Error: [vitest] No "valeurDeSortie" export is defined on the "./api/client" mock.
```

`App.test.tsx` remplace tout le module client par un faux — c'est bien le
réseau qu'il veut supprimer. En supprimant le réseau, il supprimait aussi une
**règle de lecture pure** qui n'avait rien à faire là. Le réflexe est
d'ajouter la fonction au faux ; c'est le mauvais : on contrefait alors
quelque chose qu'aucune raison ne justifie de contrefaire, et le faux
s'éloigne encore de l'original ([[72]]).

Le message d'erreur disait en réalité : **cette fonction est dans le mauvais
module**. Déplacée dans `temporel/valeur.ts`, à côté de `libelle` et
`anneeDe`, tout s'est remis en place sans une ligne de décor — et la règle
est désormais là où ses voisines vivent.

**La règle** : quand un double doit contrefaire quelque chose qui n'a rien à
voir avec ce qu'il remplace, ne pas l'ajouter au double — déplacer la chose.
Un test qui remplace « le réseau » ne doit avoir à simuler que du réseau ;
ce qu'il est forcé de simuler en plus mesure exactement ce qui s'est glissé
dans la mauvaise couche. C'est une frontière de conception **rendue
observable** par un outil de test, et c'est rare assez pour qu'on l'écoute.

### 85 — « Les enfants de ce conteneur » est une hypothèse d'homogénéité

L'axe ne contenait que des entrées. Trois assertions l'écrivaient ainsi, dans
trois fichiers différents :

```ts
axe().querySelectorAll(":scope > li")        // le test de composant
axe.locator("> li")                          // le parcours
[...axe().children]                          // un troisième
```

Le jour où les décennies vides s'y sont glissées — des `li` de même niveau,
et c'est bien leur place —, les trois ont cassé d'un coup. Aucune ne disait
ce qu'elle voulait : elles disaient *où regarder*, en supposant qu'il n'y
avait là qu'une seule espèce.

Le réflexe est de déplacer la nouveauté ailleurs pour que les tests se
taisent. C'est l'inverse : les tests avaient raison de casser, et ils
demandaient une chose précise — **que les deux espèces soient
distinguables**. Un `data-testid="entree"` sur l'entrée, et chaque assertion
redit ce qu'elle veut vraiment : « les entrées », pas « les enfants ».

Le compte `data-entrees`, lui, n'a pas bougé : il portait déjà un nom.

C'est la même famille que [[70]] — un compte qui change nomme ce qu'on vient
d'ajouter — mais prise à l'endroit où le compte n'est même pas écrit : un
sélecteur de position en fabrique un implicitement, et il grandit en
silence.

**La règle** : sélectionner par ce que la chose EST, jamais par l'endroit où
elle se trouve. `> li`, `children[0]`, `nth(2)` encodent une hypothèse — « ce
conteneur n'aura jamais qu'une sorte d'enfant » — que rien n'écrit et que
personne ne relit. Quand elle tombe, elle tombe partout à la fois.
