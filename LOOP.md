# Prompt de boucle

> Ce texte est rejoué **à l'identique** à chaque itération. Il ne contient
> aucun état : l'état vit dans `TODO-PHASE0.md` et dans le dépôt git.
>
> Si tu modifies ce fichier, tu changes le comportement de toutes les
> itérations suivantes.

---

Tu poursuis la porte de sortie de Phase 0 du projet Digital-Twin-Alternative.

## À chaque itération

1. **Lis `TODO-PHASE0.md`.** Prends le **premier item non coché**. Un seul.
2. **Lis les sections de spécification qu'il cite** avant d'écrire une ligne.
   Les attendus sont déjà écrits ; ton travail est de les faire tenir, pas de
   les deviner.
3. **Écris d'abord le test, puis le code.** L'acceptation de l'item dit
   exactement ce qui doit être vrai.
4. **`./test.sh`** — la suite complète doit passer, pas seulement le nouveau
   test. Le SDK n'est pas installé sur la machine : il tourne en conteneur,
   `./dotnet.sh` l'enveloppe, et .NET 10 utilise le format `.slnx`.
5. **Commite** le code, les tests, et la case cochée dans `TODO-PHASE0.md`,
   dans le **même** commit. Ajoute une ligne au journal en fin de fichier :
   ce qui a été fait, et ce qui a résisté.
6. **Ne pousse pas.** `git push` est une décision humaine.

## Interdits

- **Ne jamais affaiblir un test pour le faire passer.** Les onze vecteurs de
  `ORDONNANCEMENT-TEMPOREL.md` §10 et les huit cas de `MODELE-DE-DOMAINE.md`
  §12 sont des contrats écrits avant le code. Si un attendu te paraît faux,
  **arrête la boucle et dis-le** — ne le réécris pas seul.
- **Ne rien construire au-delà de la Phase 0.** Pas d'API, pas de base de
  données, pas d'interface, pas d'import. Le domaine seul, en mémoire.
  `PHASING.md` §3 fixe la frontière.
- **Ne pas traiter plus d'un item par itération**, même si le suivant paraît
  trivial.
- **Ne pas contourner un échec.** Deux itérations infructueuses sur le même
  item : tu arrêtes la boucle et tu rends la main.

## Conditions d'arrêt

Arrête la boucle, en expliquant pourquoi, dès que l'une est vraie :

- tous les items de `TODO-PHASE0.md` sont cochés ;
- un attendu de la spécification paraît faux ou contradictoire ;
- le même item a échoué deux itérations de suite ;
- une décision te manque et aucune interprétation raisonnable ne la remplace.

## Ce que l'expérience de ce dépôt a montré

Les erreurs qui ont coûté le plus cher ici **n'ont jamais levé d'exception**.
Une table de correspondance incomplète, des identifiants instables, des
rééditions prises pour des sorties d'origine : toutes ont produit des
résultats d'apparence normale, et toutes ont été trouvées en **regardant des
cas particuliers**, jamais des agrégats.

En conséquence, quand tu écris un test :

- **perturbe plutôt que compare.** Le test de stabilité des identifiants ne
  compare pas deux émissions — il casse une entrée et exige que rien d'autre
  ne bouge. C'est ce qui l'a rendu utile.
- **un test qui passe du premier coup mérite un doute.** Vérifie qu'il échoue
  si tu casses volontairement le code qu'il couvre.
- **nomme l'entrée fautive** dans les messages d'échec. « L'assertion a
  échoué » ne sert à personne à la trentième entrée.
