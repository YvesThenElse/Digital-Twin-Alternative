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
