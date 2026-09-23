# Prompt de boucle — les écrans qui manquent

> Rejoué **à l'identique** à chaque itération. L'état vit dans
> [`TODO-ECRANS.md`](./TODO-ECRANS.md) et dans git.
>
> La boucle d'audit cherchait des mensonges ; celle de finition construisait
> ce qui était déjà écrit. **Celle-ci livre des écrans entiers** — et c'est
> la première où l'on peut se tromper de produit, pas seulement de code.

---

## À chaque itération

0. **Lis `APPRENTISSAGES.md`.** Quatre-vingts entrées. Les dix dernières
   (70–79) viennent de la boucle précédente et décrivent exactement ce que
   celle-ci risque.
1. **Lis `TODO-ECRANS.md`.** Prends le **premier item non coché**. Un seul.
2. **Lis la fiche d'écran ENTIÈREMENT**, et les sections qu'elle cite.
   Compte ses phrases impératives et classe-les : *algorithme* ou
   *intention*. Ce sont les intentions qui tombent — et sur un écran neuf,
   elles sont la moitié du texte.
3. **Écris d'abord le test, puis le code.**
4. **Contrôle par mutation, UNE À LA FOIS**, en annonçant le nombre d'échecs
   attendu. **Vérifie que l'injection a pris.** Si le compte diffère, cherche
   la cause : **moins** veut dire qu'un garde ne garde pas, **plus** que la
   couverture dépasse ce que tu savais — ou qu'un contrat que tout le monde
   emprunte vient de changer.
5. **`./test.sh`, `./web.sh test`, et `./e2e.sh`** si l'item touche un écran.
6. **Écris ce que l'itération t'a appris**, ou n'écris rien.
7. **Commite** code, tests, case cochée, journal et apprentissage ensemble.
8. **Ne pousse pas.**

## Ce que les deux boucles précédentes ont appris, et qui s'applique ici

- **Un attribut `data-*` n'est pas un rendu.** Quand la chose à vérifier est
  visuelle — une couleur, une hauteur, une police, une disposition —, la
  garde est dans le navigateur, et elle **mesure**.
- **Un test dont l'attendu est une absence porte son témoin** (79). « Rien
  ne s'affiche » se satisfait d'un écran cassé.
- **Un état initial dérivé des props se fige au montage** (73). Sur un écran
  neuf, écris dans le même geste ce qui le remonte et ce qui doit lui
  survivre.
- **Deux saisies qui produisent la même trace ne se distinguent pas** (76).
  Avant de dériver une valeur, cherche deux gestes différents qui donnent le
  même journal.
- **Un automate ne perd jamais une course que la main perd** (79). Un geste
  enchaîné vert dans le parcours peut être inatteignable en vrai.
- **Un contrat entre deux côtés se place entre les deux** (75), et **une
  décision de ne pas faire se garde comme le reste** (77).

## Interdits

- **Ne construis que ce que l'item dit.** Un manque découvert s'inscrit en
  fin de fichier et attend son tour.
- **N'affaiblis jamais un test** pour faire passer un item.
- **Ne coche pas un item dont l'acceptation n'est pas tenue.**
- **Un seul item par itération.**
- **Ne réécris pas le domaine** sans qu'un test ait montré qu'il ment.
- ⚠️ **Ne fabrique aucun chiffre.** Cette boucle livre des écrans qui
  *résument*. Un total faux est pire qu'un total absent : il se lit comme un
  fait, et le produit tout entier repose sur le fait de ne pas inventer ce
  que l'utilisateur n'a pas dit.

## Conditions d'arrêt

- ~~**S1, S2 et S2 bis sont cochés**~~ — condition **levée le 23 septembre**.
  Le lot d'avant-session est livré, et la décision a été prise de poursuivre
  sur S3 **sans attendre** la session de test. Reprends donc la liste dans
  l'ordre.

  > ⚠️ Ce que cela change, et qu'il faut garder en tête : S3 à S9 devaient
  > être **ordonnés par le verdict des testeurs**, et `PHASING.md` §11 dit
  > que si la porte se ferme la réponse est d'itérer sur la Phase 1, pas
  > d'avancer. On construit donc plus loin sans savoir si ce qui est déjà
  > là produit « oui, ça me ressemble ». C'est assumé — pas oublié.
- tous les items sont cochés ;
- l'item courant est de la section **« attend une décision »** ;
- un attendu de la spécification paraît faux ou contradictoire ;
- le même item a échoué deux itérations de suite.

**En t'arrêtant, pose tes questions en choix multiple** via
`AskUserQuestion` : 1 à 4 décisions indépendantes, option recommandée en
premier, et la **conséquence** de chaque option.

## Ce que cette boucle doit produire

Une Phase 1 dont le périmètre écrit est tenu, un graphe de navigation sans
promesse creuse, et — si D2 le décide — l'écran qui rend le produit
corrigeable.
