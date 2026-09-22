# Prompt de boucle — l'audit des surfaces

> Ce texte est rejoué **à l'identique** à chaque itération. L'état vit dans
> [`TODO-AUDIT.md`](./TODO-AUDIT.md) et dans git.
>
> Cette boucle ne construit rien de neuf. Elle **cherche des mensonges**.

---

## Pourquoi cette boucle existe

Trois défauts ont été trouvés en deux jours, tous par un usage réel ou par la
lecture de lignes en base, **aucun par les 709 tests** :

| Défaut | Forme |
|---|---|
| L'écran de période envoyait `1995` en dur | une valeur **envoyée sans être saisie** |
| La sélection ne relisait pas les déclarations | une valeur **rendue sans être lue** |
| `affect` valait « sans plus » par défaut | une valeur **écrite sans être dite** |

Les trois ont survécu à une clôture de phase, à un bilan écrit et à un
parcours de bout en bout vert. Le point commun : **ce qui manque ne lève pas
d'erreur — et parfois il affirme**.

Un testeur bloqué au premier de ces défauts invalide le test utilisateur bien
avant d'invalider le produit. Cette boucle passe donc chaque surface au
crible **avant** de recruter.

## Le crible — quatre questions, dans cet ordre

Pour la surface de l'item en cours, répondre aux quatre, **preuve à l'appui**.
La quatrième a été ajoutée par l'audit lui-même : un crible se corrige avec
ce qu'il trouve.
Une réponse sans fichier et sans numéro de ligne n'est pas une réponse.

### 1. Envoyé sans être saisi

Toute valeur que cette surface **transmet** — corps de requête, paramètre,
argument de composant — vient-elle d'un geste de l'utilisateur, d'une donnée
du référentiel, ou d'une **constante écrite dans le code** ?

> Une constante n'est pas fautive en soi. Elle l'est quand l'utilisateur
> croit l'avoir choisie, ou quand l'écran prétend la lui demander.

### 2. Rendu sans être lu

Toute valeur que cette surface **reçoit** — champ d'une réponse, propriété,
colonne — est-elle affichée, utilisée pour décider, ou **silencieusement
jetée** ?

> Un champ que personne ne lit est un manque invisible : il fait croire que
> l'écran dit quelque chose qu'il ne dit pas.

### 3. Écrit sans être dit

Toute valeur que cette surface **persiste** correspond-elle à une déclaration
de l'utilisateur ? Y a-t-il une **valeur par défaut** qui, relue, se lit
comme une réponse ?

> C'est le plus coûteux des trois. Une valeur par défaut est une affirmation
> (apprentissage 51).

### 4. Dit sans être écrit

Tout **geste** que cette surface accepte — un tap, une chip, une saisie —
laisse-t-il une trace ailleurs que dans l'état local ? Peut-on **nommer** la
table ou l'événement qui le conserve ?

> Ajoutée après coup : le crible a trouvé cette forme trois fois en deux
> surfaces alors qu'elle n'était dans aucune de ses trois questions
> (apprentissage 55). Elle est la plus coûteuse, parce que l'utilisateur a
> *fait* quelque chose — et qu'elle frappe surtout quand il corrige.

### Et la question de contrôle

**Quel test échouerait si ce défaut était réintroduit ?** S'il n'y en a
aucun, le défaut n'est pas corrigé tant que ce test n'existe pas
(apprentissage 45).

## À chaque itération

0. **Lis `APPRENTISSAGES.md`.** Cinquante-cinq entrées y décrivent les
   façons de se tromper déjà rencontrées ici. Plusieurs décrivent exactement
   ce que cette boucle cherche.
1. **Lis `TODO-AUDIT.md`.** Prends le **premier item non coché**. Un seul.
2. **Lis la fiche d'écran et les sections de spécification** que l'item cite.
   Le crible compare le code à ce qui était **écrit**, pas à ce qui paraît
   raisonnable.
3. **Applique les quatre questions.** Écris les réponses dans l'item, avec
   fichier et ligne. Une surface sans défaut se coche avec ses quatre réponses
   — c'est l'issue **normale** et elle a de la valeur : elle dit ce qui a été
   regardé.
4. **Pour chaque défaut trouvé** : écris d'abord le test qui échoue, puis
   corrige, puis contrôle par mutation en annonçant le nombre d'échecs
   attendu. Si le correctif dépasse ce que l'item couvre, **ne le construis
   pas** : inscris-le comme un item neuf, en fin de fichier, et dis-le.
5. **`./test.sh` ET `./web.sh test`** en entier. Si la surface est un écran,
   **`./e2e.sh`** aussi.
6. **Écris ce que l'itération t'a appris** dans `APPRENTISSAGES.md`, en
   suivant ses règles. **N'écris rien si tu n'as rien appris** — une entrée
   creuse dilue les autres.
7. **Commite** le code, les tests, la case cochée, les trois réponses et
   l'entrée d'apprentissage dans le **même** commit.
8. **Ne pousse pas.**

## Interdits

- **Ne construis pas de fonctionnalité.** Cette boucle corrige des mensonges,
  elle n'ajoute pas d'écran ni de champ. Un manque qui demande une
  construction s'inscrit au TODO et attend une décision.
- **N'affaiblis jamais un test** pour faire passer une surface.
- **Ne coche pas un item sans ses quatre réponses.** « Rien à signaler » sans
  preuve est exactement ce qui a laissé passer les trois défauts.
- **Un seul item par itération.**
- **Ne réécris pas le domaine** sans que le crible ait montré qu'il ment.

## Conditions d'arrêt

Arrête la boucle, en expliquant pourquoi, dès que l'une est vraie :

- tous les items sont cochés ;
- un défaut trouvé demande une décision produit que rien ne tranche ;
- le même item a échoué deux itérations de suite.

**En t'arrêtant, pose tes questions en choix multiple** via `AskUserQuestion`,
option recommandée en premier, conséquence de chaque option décrite.

## Ce que cette boucle doit produire

À la fin, `TODO-AUDIT.md` est un **inventaire opposable** : pour chaque
surface, ce qui a été regardé et ce qui a été trouvé. C'est ce document qui
autorise — ou non — à recevoir des testeurs.
