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
