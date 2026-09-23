# E07 — Éditeur de moment (date · état · souvenir)

**Type** : **panneau superposé** — jamais une page · **Phase** : 3, **sauf la correction de date, livrée le 23 septembre 2026** · **Route** : aucune (paramètre d'état, ex. `?moment=`)

> ⚠️ **Cette fiche s'est longtemps dite « Phase 1 », et la Phase 1 s'est
> close sans elle.** [`PHASING.md`](../PHASING.md) §6 la situait en Phase 3 et
> disait pourquoi : corriger après coup suppose un profil qui dure.
>
> **Le premier tiers est avancé**, sur décision du 23 septembre, parce qu'une
> des trois capacités qui l'attendaient ne pouvait pas attendre : les
> **avertissements causals** de §5.4 étaient calculés, rendus, affichés — et
> aucun geste du produit ne pouvait en déclencher un seul. Une garde verte
> sans producteur est exactement le défaut que l'audit a trouvé partout.
>
> | Ce que la fiche décrit | État |
> |---|---|
> | Le panneau, ouvert depuis l'axe sans le quitter | **livré** |
> | **A** — l'année, « plutôt une période », « je ne sais plus » | **livré** |
> | **B** — le repli de précision (mois, date exacte, « vers », âge), et la période **ouverte** | **livré** |
> | **B bis** — achèvement, provenance, affect | à venir |
> | **C** — le souvenir | à venir ; il se saisit aujourd'hui depuis E02 |
> | **D** — l'avertissement doux, *dans* le panneau | l'axe le montre ; le panneau, pas encore |
> | « Supprimer » | à venir ; la rétractation se fait depuis E02 et E05 |

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

> **Livré le 23 septembre 2026.** Les sept granularités du modèle ont désormais un producteur, et `PHASING.md` §6 le dit. Trois choses méritent d'être notées :
>
> - **la période ouverte** — « la fin n'est pas connue » — est dans ce repli : une fin absente dit « depuis 1994 », et la refermer sur son début inventerait une information ;
> - **la marge n'est jamais nulle.** Une marge de zéro dirait exactement ce que dit une année, et deux façons d'exprimer la même chose finissent toujours par diverger ;
> - **une date illisible est refusée**, jamais repliée sur son année : replier ferait dire au joueur autre chose que ce qu'il a saisi, sans trace.
>
> **L'année de naissance est stockée** — une table à part, jamais dans le journal, jamais publiée (§12.3), et effacée avec le profil (§10.1). L'âge, lui, reste **brut** : corriger l'année ne réécrit aucun événement, elle les **replace** tous à la lecture. C'est ce repli qui est son unique producteur : la demander à l'amorce serait le formulaire que §24.4 interdit avant le premier retour visible.

**B bis — Achèvement, provenance, affect.** Quand le panneau s'ouvre sur un moment lié à un jeu, il porte aussi les trois lignes de chips de E02 (§4.5 à §4.7). C'est le second endroit où elles se règlent : E02 pendant la saisie en masse, E07 plus tard, en relisant sa timeline. Les deux écrans partagent le même composant — une divergence entre eux serait un défaut.

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
