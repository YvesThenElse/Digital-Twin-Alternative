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

- [x] **01 — `TemporalValue`, les sept variantes.** Type valeur, jamais entité. `ExactDate`, `Month`, `Year`, `Range`, `ApproximateYear`, `Age`, `Unknown`. *Acceptation : chaque variante se construit, et une construction invalide (mois 13, année 0, `Range` inversé) est rejetée.*

- [x] **02 — Forme normale.** Intervalle fermé au jour + point représentatif, selon la table de [ORDONNANCEMENT-TEMPOREL.md](./ORDONNANCEMENT-TEMPOREL.md) §2.1. *Acceptation : la variante d'origine SURVIT à la normalisation — `Year(1994)` et `Range(1994,1994)` ont le même intervalle et restent distinguables. Le point représentatif n'est exposé par aucune API publique de rendu.*

- [x] **03 — Bornes ouvertes et horizon.** Plancher = année de naissance ou 1972, plafond = aujourd'hui, injecté et jamais lu d'une horloge globale. *Acceptation : un intervalle semi-ouvert se trie sur sa borne connue ; deux appels à des dates différentes donnent le même ordre (vecteur T7).*

- [x] **04 — Algèbre d'intervalles.** Les sept relations de §3, dont une seule est un ordre : `a ≺ b ⟺ a.fin < b.début`. *Acceptation : `Range(1993–1997)` et `Year(1995)` sont en relation **Contient**, jamais ordonnés. Aucun `<` sur des dates dans le code de comparaison.*

- [x] **05 — Cascade de départage.** Les six critères de §4.1, dans l'ordre. *Acceptation : vecteurs **T1, T2, T3** ; et **T11** — même entrée triée deux fois dans un ordre d'insertion différent donne des séquences identiques.*

- [x] **06 — Cohérence causale.** §4.3 : la séquence causale départage à intervalles non ordonnés ; un ordre strictement inversé s'affiche tel quel **avec un avertissement doux**, jamais corrigé. *Acceptation : vecteurs **T4** et **T5**. Invariant 10 : une incohérence n'est jamais un refus.*

- [x] **07 — `Age` et sa résolution.** Stocké brut, résolu à la lecture ; sans année de naissance il se comporte comme `Unknown`. *Acceptation : vecteur **T6** — renseigner l'année de naissance fait quitter le tiroir au moment et retrie l'ensemble. Aucune conversion à l'écriture.*

- [x] **08 — Agrégation en épisodes.** §4.4 : même intervalle et même lot de saisie ; l'union recalcule le point représentatif ; le regroupement ne franchit jamais la frontière du datable. *Acceptation : vecteur **T8**.*

- [x] **09 — Requêtes strict / permissif.** §7.1, et l'obligation d'exposer les exclusions de §7.2. *Acceptation : vecteur **T9** — un décompte strict rend aussi le nombre d'écartés et de non datés. Le total silencieux est impossible par construction (pas de surcharge qui le permette).*

- [x] **10 — Projections à trois valeurs.** §7.3 : certain / possible / non. *Acceptation : vecteur **T10** — acquisition `Range(1993–1997)`, cession `Year(1999)`, requête 1997 → **possible**.*

- [x] **11 — `PlayerEvent` et `PlayDeclaration`.** `OccurredAt` + `RecordedAt` sur tout événement, `Confidence` dérivé et jamais saisi, `SupersededBy` pour la correction. *Acceptation : invariants 1, 3, 4 de [MODELE-DE-DOMAINE.md](./MODELE-DE-DOMAINE.md) §7 testés ; `Confidence` n'a pas de setter public.*

- [x] **12 — Projections d'état.** Collection à une date, statut d'achèvement, « toujours en cours » comme **absence** et non comme événement. *Acceptation : un `StartedGame` sans `CompletedGame` ni `AbandonedGame` projette « en cours » ; les trois positions sont exclusives (invariant 7).*

- [ ] **13 — Les sept cas de validation.** [MODELE-DE-DOMAINE.md](./MODELE-DE-DOMAINE.md) §12, un test par cas, **plus le huitième** (Pokémon Rouge, trois entités pour un souvenir). *Acceptation : les huit se rejouent et produisent l'état attendu. C'est la porte elle-même.*

- [ ] **14 — Chargement du dataset.** Lire `dataset/poc.json`, vérifier ses invariants : unicité des `CanonicalId`, préfixe conforme au type, aucune sortie sans plateforme, `precision` cohérente avec `confidence`. *Acceptation : le dataset réel passe, et un dataset volontairement corrompu échoue avec un message qui nomme l'entrée fautive.*

- [ ] **15 — Bilan.** Mettre à jour [PHASING.md](./PHASING.md) §3 : critère de sortie franchi ou non, avec ce qui reste. *Acceptation : le fichier dit la vérité, y compris si la porte n'est pas franchie.*

## Journal

> Une ligne par itération, ajoutée par la boucle. **Ce qui a été fait** — le factuel.
>
> Ce que l'itération a **appris** va dans [APPRENTISSAGES.md](./APPRENTISSAGES.md), qui est relu au début de chaque itération. Les deux ne se confondent pas : ici on consigne un travail, là-bas on change un comportement.

- **00** — Échafaudage hors boucle. SDK .NET 10 absent de la machine : exécuté en conteneur via `./dotnet.sh` (10.0.401), cohérent avec « Docker Compose pour le dev local ». Deux surprises : .NET 10 génère un `.slnx` et non un `.sln`, et le conteneur écrit en `root` sans `--user`, ce qui rendait l'arbre non modifiable.
- **01** — Sept variantes en `record` scellés, hiérarchie fermée par constructeur `private protected` : une huitième variante est impossible depuis l'extérieur, ce qui rend tenable dans le temps le refus de `RelativeToRelease`. Trois écarts assumés et commentés dans le code : `Range` devient `YearRange` (collision avec `System.Range`), une marge nulle est refusée sur `ApproximateYear` (elle dirait ce que dit `Year`), et `Age` n'expose aucune propriété d'année — vérifié par réflexion, sans quoi la règle « stocké brut » serait violable en silence. 22 tests. **Vérifiés par mutation** : trois altérations du code de validation produisent exactement quatre échecs.
- **02** — `TemporalInterval` porte l'intervalle, la valeur d'origine et la clé de tri. La clé est `internal` et le projet ouvre `InternalsVisibleTo` aux seuls tests du domaine : la frontière est au bord du domaine, pas de la solution. `Normalize` rend `null` pour les trois cas sans intervalle plutôt que d'en fabriquer un. 54 tests. **Vérification préalable de la spec** : ses deux affirmations chiffrées — milieu de `Year(1994)` au 2 juillet, milieux identiques pour `Range(1993–1997)` et `Year(1995)` — tombent juste avec l'arrondi vers le bas.
- **03** — `TemporalHorizon` reçoit le jour, ne le lit jamais d'une horloge. Une période ouverte s'étend jusqu'au plafond mais se trie sur sa borne connue : deux horizons distants de six mois produisent la même clé. Celle dont le début suit le plafond devient non plaçable, sans être refusée (invariant 10). 74 tests, prévision de mutation exacte (5 pour 5). **Aucun apprentissage consigné** — l'itération a appliqué ce que l'item 02 avait établi, sans rien découvrir. L'ouverture vers le passé, sans producteur, est notée en §11 de la spec plutôt qu'ici.
- **04** — Sept relations, `Égal` évalué avant les inclusions (des bornes identiques satisfont aussi les deux). `Precedes` est la seule sortie ordonnante. Invariants sur produit croisé : miroir, réflexivité, exclusion Avant/Après. 149 tests. **A résisté** : la prévision groupée (13) était fausse — 4 obtenus — parce que les mutations interagissaient. Rejouées une par une : 12/12, 2/2, 5→1. Deux correctifs de tests au passage, dont un nom mensonger.
- **05** — `TimelineSorter` sépare l'axe du tiroir puis applique la cascade ; le critère 4 n'est pas implémenté mais sa place est réservée et commentée à la position exacte que §4.1 lui donne. Contrat `ISortableMoment` minimal, que `PlayerEvent` implémentera à l'item 11. 166 tests. Deux trous révélés par mutation, dont un prédit. **Constat de domaine** : le critère 3 est inatteignable avec les sept variantes — démontré, vérifié sur 88 000 paires, et consigné en §11 de la spec.
- **06** — `CausalSequence` porte les deux chaînes de §4.3 et rien d'autre : les chaînes restent indépendantes, `Completed`/`Abandoned` ne sont pas ordonnés, un type inconnu n'ordonne rien. Le critère 4 s'applique dans les groupes à intervalle identique, par tri topologique — il ne peut pas être une clé. Avertissement doux sur inversion stricte seulement ; jamais de réordonnancement silencieux. 188 tests, six mutations, six prévisions exactes.
- **07** — `Age` résolu à la lecture : deux années civiles avec la seule année de naissance, douze mois avec la date complète, rien sans. T6 vérifié dans les deux sens — renseigner fait quitter le tiroir, corriger retrie l'ensemble. Deux cas dégénérés dans l'avenir. 205 tests. Un trou comblé puis **vérifié par mutation** : le repli `BirthDate` tue désormais 1 test là où il en tuait 0.
- **08** — `TimelineEntry` expose la vue groupée ; `OnAxis` reste la séquence plate, les membres d'un épisode y étant adjacents. Le regroupement exige **un lot ET un intervalle identiques** — la règle 4 est tenue par construction, les moments sans intervalle ayant été écartés avant. 219 tests, cinq prévisions de mutation exactes. **Union prouvée sans effet** : la règle 1 garantit des intervalles identiques.
- **09** — `TemporalQueryResult` porte les trois catégories ensemble ; aucune méthode de l'API ne rend un entier, vérifié par réflexion. Deux distinctions que la spec n'énonce pas : hors-période n'est pas « écarté pour imprécision », et interroger sur `Unknown` rend une requête muette plutôt que des moments fautifs. Le résumé nomme les trois catégories même à zéro. 238 tests, cinq prévisions exactes, un trou comblé puis vérifié.
- **10** — `OwnedDuring` rend certain / possible / non ; les deux listes restent séparées quel que soit le mode, qui filtre ce qu'on retient sans changer ce qu'on sait. **Interprétation fixée et documentée** : `Certain` = possédé pendant TOUTE la période, la spec traitant `D` comme un point là où les requêtes portent sur des périodes. 260 tests. Un vrai bug attrapé par un test avant mutation, une assertion fausse corrigée, un invariant faible durci.
- **06 bis** — Contradiction de spec tranchée par Yves : « il faut être cohérent temporellement ». `SoldItem → ReplayedGame` retiré — rejouer ne suppose aucune vente — et remplacé par `StartedGame → ReplayedGame`, qui l'est authentiquement. Noms alignés sur le modèle, autoritaire. 265 tests. Les trois mutations rejouent des fautes **réellement commises**, pas des altérations inventées.
- **11** — `PlayerEvent` implémente `ISortableMoment` **sans que `TimelineSorter` change** : le contrat posé à l'item 05 a tenu. `Confidence` est dérivée, sans accesseur ni paramètre de construction, et vérifiée aussi par le comportement — corriger la date la change. Liste de types fermée et validée. `PlayDeclaration` porte les invariants 6 et 8, tous deux **réversibles** pour respecter l'invariant 10. 308 tests, cinq prévisions exactes.
- **12** — « Toujours en cours » est calculé comme une **absence** : aucun type d'événement ne la déclare, et un test interdit qu'un tel type apparaisse. Deux fermetures contradictoires se tranchent par la plus récemment déclarée (invariants 7 et 10 conciliés) ; rejouer rouvre la partie. Un taux sans déclaration vaut `null`, pas zéro. 331 tests. Un trou comblé : rien ne vérifiait que la possession est exclue du dénominateur.
