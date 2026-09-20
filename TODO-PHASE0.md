# Porte de sortie de Phase 0 — liste de travail

> C'est **l'état de la boucle**. Chaque itération lit ce fichier, prend le premier item non coché, le termine, et le coche dans le même commit que le code.
>
> Critère de sortie, mot pour mot ([PHASING.md](./PHASING.md) §3) : *« On sait modéliser proprement un parcours utilisateur complexe sans bricolage. »* Il est atteint quand **les sept cas de validation et les onze vecteurs d'ordonnancement se rejouent en produisant l'état attendu** — pas quand le diagramme paraît élégant.

## Règles de la boucle

1. **Les attendus sont des contrats figés.** Les onze vecteurs de [ORDONNANCEMENT-TEMPOREL.md](./ORDONNANCEMENT-TEMPOREL.md) §10 et les sept cas de [MODELE-DE-DOMAINE.md](./MODELE-DE-DOMAINE.md) §12 sont écrits avant le code. **Un test qui échoue se répare dans le code, jamais en affaiblissant le test.** Si l'attendu lui-même paraît faux, on s'arrête et on le signale — on ne le réécrit pas seul.
2. **Un item, un commit.** Relisible et révocable séparément.
3. **La suite complète passe avant chaque commit.** `./test.sh` — une seule commande, sans argument.
4. **Deux itérations d'échec sur le même item = arrêt.** On rend la main plutôt que de contourner.
5. **Rien au-delà de la Phase 0.** Pas d'API, pas de base, pas d'interface. Le domaine seul, en mémoire.
6. **Commit local uniquement.** Le `push` reste une décision humaine.
7. **Français pour les commentaires et la documentation, anglais pour les identifiants** — comme le reste du dépôt.

## Items

- [x] **00 — Échafaudage.** Solution .NET 10, `DigitalTwin.Domain`, `DigitalTwin.Domain.Tests` (xUnit), `./dotnet.sh` opérationnel. *Acceptation : `./test.sh` s'exécute et rapporte 0 échec.* ✅ 1 test, 0 échec.

- [ ] **01 — `TemporalValue`, les sept variantes.** Type valeur, jamais entité. `ExactDate`, `Month`, `Year`, `Range`, `ApproximateYear`, `Age`, `Unknown`. *Acceptation : chaque variante se construit, et une construction invalide (mois 13, année 0, `Range` inversé) est rejetée.*

- [ ] **02 — Forme normale.** Intervalle fermé au jour + point représentatif, selon la table de [ORDONNANCEMENT-TEMPOREL.md](./ORDONNANCEMENT-TEMPOREL.md) §2.1. *Acceptation : la variante d'origine SURVIT à la normalisation — `Year(1994)` et `Range(1994,1994)` ont le même intervalle et restent distinguables. Le point représentatif n'est exposé par aucune API publique de rendu.*

- [ ] **03 — Bornes ouvertes et horizon.** Plancher = année de naissance ou 1972, plafond = aujourd'hui, injecté et jamais lu d'une horloge globale. *Acceptation : un intervalle semi-ouvert se trie sur sa borne connue ; deux appels à des dates différentes donnent le même ordre (vecteur T7).*

- [ ] **04 — Algèbre d'intervalles.** Les sept relations de §3, dont une seule est un ordre : `a ≺ b ⟺ a.fin < b.début`. *Acceptation : `Range(1993–1997)` et `Year(1995)` sont en relation **Contient**, jamais ordonnés. Aucun `<` sur des dates dans le code de comparaison.*

- [ ] **05 — Cascade de départage.** Les six critères de §4.1, dans l'ordre. *Acceptation : vecteurs **T1, T2, T3** ; et **T11** — même entrée triée deux fois dans un ordre d'insertion différent donne des séquences identiques.*

- [ ] **06 — Cohérence causale.** §4.3 : la séquence causale départage à intervalles non ordonnés ; un ordre strictement inversé s'affiche tel quel **avec un avertissement doux**, jamais corrigé. *Acceptation : vecteurs **T4** et **T5**. Invariant 10 : une incohérence n'est jamais un refus.*

- [ ] **07 — `Age` et sa résolution.** Stocké brut, résolu à la lecture ; sans année de naissance il se comporte comme `Unknown`. *Acceptation : vecteur **T6** — renseigner l'année de naissance fait quitter le tiroir au moment et retrie l'ensemble. Aucune conversion à l'écriture.*

- [ ] **08 — Agrégation en épisodes.** §4.4 : même intervalle et même lot de saisie ; l'union recalcule le point représentatif ; le regroupement ne franchit jamais la frontière du datable. *Acceptation : vecteur **T8**.*

- [ ] **09 — Requêtes strict / permissif.** §7.1, et l'obligation d'exposer les exclusions de §7.2. *Acceptation : vecteur **T9** — un décompte strict rend aussi le nombre d'écartés et de non datés. Le total silencieux est impossible par construction (pas de surcharge qui le permette).*

- [ ] **10 — Projections à trois valeurs.** §7.3 : certain / possible / non. *Acceptation : vecteur **T10** — acquisition `Range(1993–1997)`, cession `Year(1999)`, requête 1997 → **possible**.*

- [ ] **11 — `PlayerEvent` et `PlayDeclaration`.** `OccurredAt` + `RecordedAt` sur tout événement, `Confidence` dérivé et jamais saisi, `SupersededBy` pour la correction. *Acceptation : invariants 1, 3, 4 de [MODELE-DE-DOMAINE.md](./MODELE-DE-DOMAINE.md) §7 testés ; `Confidence` n'a pas de setter public.*

- [ ] **12 — Projections d'état.** Collection à une date, statut d'achèvement, « toujours en cours » comme **absence** et non comme événement. *Acceptation : un `StartedGame` sans `CompletedGame` ni `AbandonedGame` projette « en cours » ; les trois positions sont exclusives (invariant 7).*

- [ ] **13 — Les sept cas de validation.** [MODELE-DE-DOMAINE.md](./MODELE-DE-DOMAINE.md) §12, un test par cas, **plus le huitième** (Pokémon Rouge, trois entités pour un souvenir). *Acceptation : les huit se rejouent et produisent l'état attendu. C'est la porte elle-même.*

- [ ] **14 — Chargement du dataset.** Lire `dataset/poc.json`, vérifier ses invariants : unicité des `CanonicalId`, préfixe conforme au type, aucune sortie sans plateforme, `precision` cohérente avec `confidence`. *Acceptation : le dataset réel passe, et un dataset volontairement corrompu échoue avec un message qui nomme l'entrée fautive.*

- [ ] **15 — Bilan.** Mettre à jour [PHASING.md](./PHASING.md) §3 : critère de sortie franchi ou non, avec ce qui reste. *Acceptation : le fichier dit la vérité, y compris si la porte n'est pas franchie.*

## Journal

> Une ligne par itération, ajoutée par la boucle. Ce qui a été fait, ce qui a résisté.

- **00** — Échafaudage hors boucle. SDK .NET 10 absent de la machine : exécuté en conteneur via `./dotnet.sh` (10.0.401), cohérent avec « Docker Compose pour le dev local ». Deux surprises : .NET 10 génère un `.slnx` et non un `.sln`, et le conteneur écrit en `root` sans `--user`, ce qui rendait l'arbre non modifiable.
