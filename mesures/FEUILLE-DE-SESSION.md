# Feuille de session — un exemplaire par testeur

> À copier sous `mesures/sessions/<profil>.md`. Le **profil** est la seule
> clé qui relie ce qu'on a vu à ce que la base mesure : sans lui, la session
> est perdue.

## Identification

| | |
|---|---|
| Testeur | |
| **Profil** (rendu par `./session.sh`) | `usr_test_…` |
| Date, heure de début | |
| Disposition | téléphone / ordinateur |
| Enregistrement d'écran | oui / **non → les gestes ne seront pas mesurables** |

**Recrutement** (§2 du protocole) — plateformes du dataset que le testeur
nomme spontanément comme ayant compté :

- [ ] NES  [ ] SNES  [ ] Game Boy / GBA  [ ] N64  [ ] PS1  [ ] PS2  [ ] Switch

→ moins de deux cochées : **le testeur est reçu, mais marqué**, et ses
résultats sont rapportés à part. Ne pas le marquer imputerait au produit un
trou du dataset.

- [ ] **Marqué « couverture insuffisante »**

## Pendant — ce que l'animateur note, sans intervenir

| Horodatage | Ce qui se passe | Verbatim |
|---|---|---|
| | | |

Trois moments à guetter, parce qu'ils décident du reste :

- [ ] a-t-il **trouvé seul** qu'on peut cocher sans confirmer ?
- [ ] a-t-il **hésité sur la période** — et qu'a-t-il dit à ce moment ?
- [ ] a-t-il **cherché un jeu absent** ? lequel ?

**Abandon** — heure, et dernier écran atteint : ……………

> Un abandon est une donnée, pas une session ratée. Il compte au
> dénominateur (§22.3 C).

## Comptés à la main, sur l'enregistrement

Ces deux-là ne sont pas instrumentés ; sans ce comptage ils n'existent pas.

| | |
|---|---|
| Gestes de déclaration (taps sur une ligne, ajouts de titre libre) | |
| Jeux déclarés | |
| **Gestes par jeu déclaré** (cible ≤ 1,35) | |
| A-t-il atteint l'écran d'histoire ? (cible ≥ 85 %) | oui / non |

## La question, à la fin, écran ouvert sur l'histoire

> « Qu'est-ce que cet écran vous dit de vous ? »

Posée **une fois**, sans relance. Réponse mot à mot :

> ……………………………………………………………………………

**Codage** (§22.3 C) :

- [ ] **Oui franc** — il parle de **lui** : il raconte, corrige, complète, ou
      veut montrer l'écran à quelqu'un
- [ ] **Non** — tout le reste, y compris « c'est pas mal », « c'est bien
      fait », « ça marche bien »

> « C'est bien fait » est un compliment adressé à l'outil. C'est un **non**.

**Seconde question, hors porte :**

> « Auriez-vous préféré simplement cocher "joué", sans date du tout ? »

→ ……………………………………………………………………………

## Après — le relevé

```
./session.sh --mesures <profil>
```

Coller la sortie telle quelle :

```
```
