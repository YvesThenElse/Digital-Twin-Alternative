# Prompt de boucle — la finition

> Ce texte est rejoué **à l'identique** à chaque itération. L'état vit dans
> [`TODO-FINITION.md`](./TODO-FINITION.md) et dans git.
>
> L'audit cherchait des mensonges. Celle-ci **construit** — mais elle
> construit ce qui est déjà écrit, et rien d'autre.

---

## À chaque itération

0. **Lis `APPRENTISSAGES.md`.** Soixante-neuf entrées y décrivent les façons
   de se tromper déjà rencontrées ici. Plusieurs décrivent exactement ce que
   cette boucle risque.
1. **Lis `TODO-FINITION.md`.** Prends le **premier item non coché**. Un seul.
2. **Lis la fiche d'écran et les sections de spécification qu'il cite —
   ENTIÈREMENT.** Compte leurs phrases impératives et classe-les :
   *algorithme* ou *intention*. Ce sont les intentions qui tombent, et elles
   tombent parce qu'elles n'ont pas de traduction évidente.
3. **Écris d'abord le test, puis le code.** L'acceptation de l'item dit ce
   qui doit être vrai.
4. **Contrôle par mutation, UNE À LA FOIS**, en annonçant le nombre d'échecs
   attendu avant chaque injection. **Vérifie que l'injection a pris** — une
   mutation qui ne compile pas, ou qu'un dispositif de test efface, n'a pas
   eu lieu. Si le compte diffère, cherche la cause avant de continuer :
   **moins** d'échecs veut dire qu'un garde ne garde pas, **plus** que la
   couverture dépasse ce que tu savais et qu'un doublon te guette.
5. **`./test.sh` ET `./web.sh test`** en entier. Si l'item touche un écran,
   **`./e2e.sh`** aussi.
6. **Écris ce que l'itération t'a appris** dans `APPRENTISSAGES.md`, selon
   ses propres règles. **N'écris rien si tu n'as rien appris** : une entrée
   creuse dilue les soixante-neuf autres.
7. **Commite** le code, les tests, la case cochée, la ligne de journal et
   l'entrée d'apprentissage s'il y en a une — dans le **même** commit.
8. **Ne pousse pas.**

## Ce que l'audit a appris, et qui s'applique ici

- **Un attribut `data-*` n'est pas un rendu.** `data-disposition="grille"` et
  `"liste"` ont rendu la même chose pendant des semaines, sous une suite
  verte. Quand la chose à vérifier est visuelle — une couleur, une hauteur,
  une disposition —, la garde est dans le navigateur, et elle mesure.
- **Une règle écrite dans le client n'existe pas.** Si une contrainte porte
  sur la validité d'une donnée, elle appartient à la couche qui écrit.
  L'écran peut la répéter plus tôt et mieux ; il ne peut pas en être le seul
  porteur.
- **Couvrir des cas n'est pas couvrir un ensemble.** Quand une opération
  doit porter sur *tout* un ensemble, demande-le à sa source d'autorité —
  `information_schema`, le modèle, l'énumération — et compare-le à une liste
  écrite. Une garde qui protège « tout sauf X » se retranche, elle ne
  s'énumère pas.
- **Mesure les artefacts** au lieu de lire ce qu'ils disent d'eux-mêmes. Le
  manifeste des jaquettes annonçait 512 px pour 218 fichiers qui en font 213
  à 960.
- **Une valeur par défaut est une affirmation**, et un rendu par défaut
  aussi. « Ne pas savoir » a besoin de son propre signe.
- **Méfie-toi d'un garde qui ne peut pas échouer.** Celui des libellés morts
  ne le pouvait pas, et personne ne s'en était aperçu parce qu'il était vert.

## Interdits

- **Ne construis que ce que l'item dit.** Un manque découvert en chemin
  s'inscrit en fin de fichier et attend son tour — ou une décision.
- **N'affaiblis jamais un test** pour faire passer un item. Si un attendu
  paraît faux, arrête la boucle et dis-le.
- **Ne coche pas un item dont l'acceptation n'est pas tenue**, même si le
  reste marche.
- **Un seul item par itération.**
- **Ne réécris pas le domaine** sans qu'un test ait montré qu'il ment.

## Conditions d'arrêt

Arrête la boucle, en expliquant pourquoi, dès que l'une est vraie :

- tous les items sont cochés ;
- l'item courant est de la section **« attend une décision »** ;
- un attendu de la spécification paraît faux ou contradictoire ;
- le même item a échoué deux itérations de suite.

**En t'arrêtant, pose tes questions en choix multiple** via
`AskUserQuestion` : 1 à 4 décisions réellement indépendantes, option
recommandée en premier, et la **conséquence** de chaque option — pas
seulement son intitulé.

## Ce que cette boucle doit produire

Un POC qu'on peut montrer à un testeur sans s'excuser, et un
`TODO-FINITION.md` qui dit, pour chaque item, ce qui a été fait et ce qui a
été laissé.
