# E13 — Import d'une source

**Type** : page à étapes · **Phase** : 4 · **Routes** : `/import`, `/import/:source`

## Objectif

Récupérer une bibliothèque existante (Steam, RetroAchievements, Playnite, LaunchBox, CSV) pour éviter la saisie manuelle du « quoi ».

**Cet écran ne produit pas d'historique.** Il produit un inventaire. L'historique se construit en **E14**, et les deux écrans forment une séquence indissociable — c'est la conséquence directe de la limite documentée en [PHASING.md](../PHASING.md) §7 : les sources exposent un inventaire présent, pas une histoire datée.

## Contenu

### Étape 1 — Choisir la source

Chaque source annonce **honnêtement ce qu'elle apporte**, y compris ses manques :

```
┌──────────────────────────────────────────────────────────────┐
│  Steam                                                       │
│  ✓ Vos jeux · ✓ Temps de jeu total · ✓ Succès datés         │
│  ✗ Dates d'achat non disponibles                             │
│  → Les dates seront estimées puis vérifiées avec vous        │
└──────────────────────────────────────────────────────────────┘
```

Annoncer la limite avant l'import évite la déception à l'arrivée, qui serait mise sur le compte du produit et non sur celui de la source.

### Étape 2 — Connexion

Selon la source : identifiant public, authentification déléguée, ou dépôt de fichier (CSV, export d'outil).

### Étape 3 — Correspondance

Aperçu du rattachement au référentiel canonique, avant écriture :

- **rattachés d'office** (confiance haute) — repliés, pas à vérifier ;
- **à confirmer** (plusieurs candidats ou confiance moyenne) — l'utilisateur tranche ;
- **non trouvés** — deviennent des déclarations non résolues (§3.5), jamais des pertes.

Seule la deuxième catégorie demande une action. Faire vérifier des centaines de correspondances évidentes ruinerait le gain de l'import.

### Étape 4 — Bilan et enchaînement

Ce qui a été ajouté, avec la part datée et la part sans date, puis l'enchaînement **obligatoire** vers E14.

## Actions

Choisir une source · Se connecter · Arbitrer les correspondances douteuses · **Continuer vers E14**.

## États

- **En cours** : import long, non bloquant — l'utilisateur peut quitter et être notifié.
- **Partiel** : une source qui échoue ne perd pas les autres.
- **Doublons** : un jeu déjà déclaré manuellement n'est jamais dupliqué ; l'import enrichit le moment existant.

## Relations

**Entrant** : E11 (sources connectées) · E01/E02 (proposition « vous jouez sur Steam ? »). **Sortant** : **E14, systématiquement**.

## Pièges

- Promettre « reconstruisez 20 ans en un clic » : la source ne le permet pas, et la promesse non tenue coûte plus cher que l'absence de promesse.
- Écrire dans le profil sans aperçu : un import mal rattaché est très pénible à défaire.
- Perdre la provenance : `Source`, `ExternalGameId`, `ImportedAt` et `Confidence` sont conservés pour chaque élément importé (§18.4).
