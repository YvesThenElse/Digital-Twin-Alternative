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
