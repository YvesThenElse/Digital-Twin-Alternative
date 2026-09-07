# E07 — Éditeur de moment (date · état · souvenir)

**Type** : **panneau superposé** — jamais une page · **Phase** : 1 · **Route** : aucune (paramètre d'état, ex. `?moment=`)

## Objectif

Dater, corriger ou raconter un moment **sans quitter l'écran d'où l'on vient**. C'est l'écran qui rend concrets deux choix de modèle : l'incertitude temporelle (§7) et le fait que les événements sont des souvenirs révisables (§5.3).

---

## Le modèle a sept granularités. L'interface en montre trois.

Une première version de cette fiche exposait les sept variantes de `TemporalValue` en boutons radio, plus trois niveaux de confiance : **dix contrôles pour dater un souvenir**. C'était l'énumération du modèle rendue telle quelle — l'inverse de la simplicité d'utilisation, et une violation du principe 9 (le vocabulaire technique ne remonte pas dans l'interface).

Deux corrections.

### Le contrôle de confiance est supprimé

Demander à quelqu'un de noter la fiabilité de son propre souvenir est de la métadonnée sur de la métadonnée : la plupart des gens ne s'y engageront pas sérieusement, et cela ajoute une décision à chaque saisie.

`Confidence` est **dérivé de la granularité choisie**, sans rien demander :

| Ce que l'utilisateur choisit | `Confidence` enregistré |
|---|---|
| une date exacte | haute |
| un mois | haute |
| une année | moyenne |
| une période, ou « vers … » | basse |
| « je ne sais plus » | nulle |

Aucune information n'est perdue, un contrôle disparaît.

### Trois choix visibles, le reste en repli

Mois et date exacte sont rarissimes pour un souvenir de trente ans : ils n'ont rien à faire au premier plan.

## Contenu

```
┌──────────────────────────────────────────────┐
│  Final Fantasy VII — terminé            ✕    │
├──────────────────────────────────────────────┤
│  QUAND ?                                     │  A
│                                              │
│      ┌──────────┐                            │
│      │   1998   │   ◀ ▶                      │
│      └──────────┘                            │
│                                              │
│   ○ c'était plutôt une période               │
│   ○ je ne sais plus                          │
│                                              │
│   ⌄ préciser                                 │  B
├──────────────────────────────────────────────┤
│  UN SOUVENIR ?                  (facultatif) │  C
│  ┌──────────────────────────────────────┐    │
│  │ Fini un dimanche de novembre, chez   │    │
│  │ mon frère.                           │    │
│  └──────────────────────────────────────┘    │
├──────────────────────────────────────────────┤
│  ⚠ Vous l'auriez terminé avant de l'avoir    │  D
│    découvert (1999). C'est possible.         │
├──────────────────────────────────────────────┤
│  Supprimer                    [ Enregistrer ]│
└──────────────────────────────────────────────┘
```

**A — L'année, en grand.** C'est la réponse la plus fréquente et la plus honnête ; elle occupe donc le premier plan, avec une cible large et des flèches d'incrément. Deux échappatoires en dessous :
- « c'était plutôt une période » déplie un second champ d'année (`Range`) ;
- « je ne sais plus » enregistre `Unknown` et referme la section.

**B — Le repli « préciser »** contient ce qui reste : un mois, une date exacte, une marge d'incertitude (`vers 1998 ± 2 ans`), et « vers mes … ans » lorsqu'une année de naissance est connue. Replié par défaut, il n'est jamais nécessaire.

L'option « vers mes … ans » n'apparaît **que** si l'année de naissance est renseignée. Sinon, le repli propose d'abord de la renseigner en expliquant à quoi elle sert (§7.6) — jamais un champ de plus sans justification.

**C — Le souvenir.** Facultatif, sans contrainte de longueur ni mise en forme, affiché en `body` italique (langage visuel §4). C'est le contenu qui fait la valeur du profil (§9) : le champ est invitant et visible sans défiler, pas relégué en bas.

**D — L'avertissement doux.** Signale l'incohérence, ne bloque pas, et dit explicitement que la situation reste possible (§5.4). Le bouton d'enregistrement reste actif.

## Mobile et desktop

| | Forme | Comportement |
|---|---|---|
| **Mobile** | feuille remontante, pleine largeur, ~70 % de la hauteur | le champ souvenir reste visible clavier ouvert ; fermeture par balayage vers le bas |
| **Desktop** | panneau latéral de 420 px | le contexte reste lisible à côté, ce qui aide à corriger une date en regardant la timeline |

Dans les deux cas, le panneau est **autonome** : aucune dépendance à l'écran appelant, aucun comportement variable selon la provenance.

## Actions

| Action | Résultat |
|---|---|
| Régler l'année | met à jour la valeur, `Confidence` dérivé automatiquement |
| « plutôt une période » | déplie un second champ, bascule en `Range` |
| « je ne sais plus » | `Unknown`, referme la section date |
| « préciser » | déplie mois, date exacte, marge, âge |
| Enregistrer | persiste et **ferme**, en revenant au contexte d'origine |
| Supprimer | rétracte le moment, avec annulation possible |
| Échap / balayage bas | ferme sans perdre la saisie en cours |

## États

- **Création** : ouvert depuis E02, E03, E05 ou E06 avec un contexte pré-rempli (jeu, état, période courante). Dans ce cas l'année est **déjà remplie** avec la période de saisie — l'utilisateur n'a souvent rien à faire d'autre qu'écrire un souvenir.
- **Édition** : ouvert sur un moment existant, la granularité affichée est celle qui a été enregistrée (un `Range` ouvre directement sur deux champs).
- **Conflit** : avertissement doux, jamais bloquant.
- **Non résolu** : pour une déclaration libre, un champ titre s'ajoute en tête, avec une invitation à rattacher à une entité connue.

## Relations

- **Entrant** : E02 (affiner une ligne) · **E03** (chemin principal) · E05 · E06 (déclaration libre).
- **Sortant** : retour au contexte appelant, systématiquement. E07 ne conduit nulle part ailleurs.

## Décisions de conception

**Panneau, jamais page.** Naviguer vers une page pour dater un souvenir puis revenir coûte deux transitions et fait perdre la position dans la timeline ou dans la liste.

**Le défaut est l'imprécision.** L'année est le premier plan, « je ne sais plus » est offert au même niveau que le reste. Un défaut sur « date précise » induirait une fausse précision, exactement ce que §7.4 interdit.

**La correction est banale.** Aucun avertissement ni confirmation pour modifier un moment : ce sont des souvenirs, ils se corrigent. La révision est conservée côté système sans être exposée (§5.3).

**Le modèle reste complet.** Réduire l'interface à trois choix ne réduit pas `TemporalValue` : les sept variantes existent, restent enregistrables, et sont accessibles par le repli. C'est l'exposition qui est hiérarchisée, pas le modèle qui est amputé.

## Pièges

- Rétablir les sept granularités au premier plan : c'est l'erreur que cette fiche corrige.
- Demander la confiance à l'utilisateur : elle se dérive.
- Rendre la date obligatoire : `Unknown` est une réponse valide (principe 6).
- Convertir `Age` en année à l'enregistrement : la valeur brute doit être conservée pour qu'une correction de l'année de naissance recalcule tous les moments concernés (§7.6).
- Bloquer sur une incohérence : « joué après avoir vendu » est parfaitement légitime.
