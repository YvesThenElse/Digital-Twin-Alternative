# Audit des surfaces — avant de recevoir des testeurs

> Le crible et la méthode sont dans [`BOUCLE-AUDIT.md`](./BOUCLE-AUDIT.md).
> Trois questions par surface : **envoyé sans être saisi**, **rendu sans être
> lu**, **écrit sans être dit** — plus la question de contrôle : *quel test
> échouerait si le défaut revenait ?*
>
> Un item se coche avec ses **trois réponses**, fichier et ligne à l'appui.
> « Rien à signaler » sans preuve est exactement ce qui a laissé passer la
> période figée, la relecture absente et l'affect fabriqué.

## Les écrans du parcours

Ils viennent en premier : un testeur les traverse dans cet ordre, et un
défaut sur l'un d'eux arrête tout ce qui suit.

- [ ] **01 — Le choix de la machine.** `App.tsx`, étape `machine`. Cite : `ecrans/E01-accueil-onboarding.md`, §3.3. *En particulier : la région est décidée ici (`regionFree ? WORLDWIDE : PAL`) — est-ce un choix de l'utilisateur, une donnée du référentiel, ou une constante qui décide en silence du marché d'un joueur ?*

- [ ] **02 — Le choix de la période.** `periode/ChoixPeriode.tsx`, `periode/periode.ts`. Cite : §24.3, §7.3, `ecrans/00-principes-transverses.md` §3. *Refait à l'item 21 — le crible doit le confirmer, et couvrir ce que la réparation n'a pas touché : les bornes proposées, le refus motivé, et l'absence de `ApproximateYear` alors que §24.3 parle d'une période **approximative**.*

- [ ] **03 — La sélection massive, passe 1.** `selection/SelectionMassive.tsx` (déclaration, bande, région). Cite : `ecrans/E02-selection-massive.md`, §24.3, §24.4, §3.4. *L'écran le plus dense du produit, et celui dont tout le budget d'interaction dépend.*

- [ ] **04 — La sélection massive, passe 2 et titres libres.** Même fichier : chips, saisie libre, souvenir. Cite : E02, §3.5, §9, §4.5 à §4.8. *Quatre questions sont spécifiées, deux sont montées — vérifier que les deux absentes ne laissent aucune trace qui prétende le contraire.*

- [ ] **05 — La timeline.** `timeline/Timeline.tsx`, `timeline/types.ts`. Cite : `ecrans/E03-timeline.md`, §7.5, `ORDONNANCEMENT-TEMPOREL.md`. *Défaut déjà connu à confirmer ou infirmer : un jeu affiné apparaît trois fois, le même titre à la même date.*

- [ ] **06 — L'assemblage du parcours.** `App.tsx` dans son ensemble : états, transitions, profil, disposition. Cite : `ecrans/PARCOURS-ET-LIENS.md`, `ecrans/PLAN-DU-SITE.md`. *C'est là que vivent les valeurs qui traversent les écrans sans appartenir à aucun.*

## Les composants de rendu

Ils ne transmettent rien, mais ils **affirment** — et un rendu qui invente
est aussi coûteux qu'un champ qui ment.

- [ ] **07 — La tuile et les époques.** `disposition/Tuile.tsx`, `disposition/epoque.ts`. Cite : `ecrans/00-langage-visuel.md` §3 et §7, §19.2. *Une jaquette absente doit se rendre par une tuile composée, jamais par un trou.*

- [ ] **08 — Le statut régional.** `region/StatutRegional.tsx`, `region/statut.ts`. Cite : §3.4, `dataset/README.md`. *Quatre états, dont 22 non-sorties arbitrées et 32 inconnues. Aucun ne doit se rendre par l'absence d'indication.*

- [ ] **09 — La bande d'époque.** `selection/BandeDEpoque.tsx`, `selection/bande.ts`. Cite : §24.4, langage visuel §7. *La récompense pendant la saisie. Ce qu'elle compte doit être ce que l'utilisateur croit avoir fait.*

- [ ] **10 — La zone sans date et le rendu temporel.** `temporel/ZoneSansDate.tsx`, `temporel/valeur.ts`. Cite : §7.3, `ORDONNANCEMENT-TEMPOREL.md` §6. *Les sept granularités, et les trois interdits.*

- [ ] **11 — Le contexte de saisie et l'état du service.** `periode/ContexteDeSaisie.tsx`, `EtatDuService.tsx`. Cite : E02 repère A, `ecrans/00-principes-transverses.md` §5. *Les quatre états obligatoires — vide, partiel, chargement, erreur — sont-ils rendus, ou seulement les deux faciles ?*

## Les frontières

Deux défauts sur trois se sont logés là où deux couches se rencontrent et où
chacune avait raison séparément.

- [ ] **12 — Le client HTTP.** `api/client.ts`. Cite : les points d'entrée de l'API. *Chaque champ rendu par l'API est-il traduit, ou jeté ? Chaque champ envoyé vient-il de l'écran ?*

- [ ] **13 — Le catalogue et les jaquettes.** `Reference/ReferenceEndpoints.cs`, `Reference/CoverEndpoints.cs`, `Reference/ReferenceCatalogSource.cs`. Cite : §3.3, §3.4, §19.2. *Le manifeste enregistre une acquisition, pas une présence.*

- [ ] **14 — Les déclarations et l'état relu.** `Selection/DeclarationEndpoints.cs`, `Selection/DeclarationBatch.cs`, `Selection/PeriodInput.cs`. Cite : §24.3, §3.5, `MODELE-DE-DOMAINE.md` §12. *Le vocabulaire diffère entre `/declarations/{userId}` (« Owned ») et `/selection` (« owned ») — écart déjà relevé, à trancher.*

- [ ] **15 — La persistance.** `Persistence/*Row.cs`, `*Mapping.cs`, `EventStore.cs`. Cite : `MODELE-DE-DOMAINE.md`, §5, §10.1. *Chaque **valeur par défaut** de colonne : que dit-elle une fois relue ? C'est là qu'était l'affect.*

- [ ] **16 — La timeline servie et les souvenirs.** `Timeline/TimelineEndpoints.cs`, `Memories/*.cs`. Cite : §7.5, §9. *Les avertissements causals reviennent-ils, et quelqu'un les lit-il ?*

## Le dernier item

- [ ] **17 — L'inventaire, et le verdict.** Relire les seize items remplis et répondre à une seule question : *le POC peut-il être montré à un testeur ?* Écrire le verdict dans `PHASING.md`, avec ce qui a été regardé et ce qui reste. *Un audit qui constate sans conclure n'est qu'une liste.*

---

## Journal
