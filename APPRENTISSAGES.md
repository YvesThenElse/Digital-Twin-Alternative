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
