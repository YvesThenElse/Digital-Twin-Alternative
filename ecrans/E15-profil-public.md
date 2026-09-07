# E15 — Profil public

**Type** : page, accessible sans compte · **Phase** : 5 · **Route** : `/u/:handle`

## Objectif

Montrer à un tiers ce qu'un joueur accepte de montrer — et donner envie de faire pareil.

## Décision structurante : c'est E04, filtré

E15 n'est pas un écran distinct mais **la projection de E04 à travers les réglages de visibilité de E11**. Les maintenir comme deux rendus d'un même composant garantit que le propriétaire voit exactement ce que voient les autres, et évite qu'ils divergent au fil des évolutions.

Différences avec E04, limitées et explicites :

| | E04 (privé) | E15 (public) |
|---|---|---|
| Blocs affichés | tous | ceux autorisés en E11 |
| Édition | non (déjà) | non |
| Âges | affichés | masqués si l'option est active (§12.3) |
| Pied de page | navigation | **invitation à créer son propre profil** |
| Indexation | sans objet | `noindex` par défaut, URL non devinable |

## Contenu

- L'en-tête narratif, les chiffres clés, la timeline condensée, les goûts — selon les autorisations.
- Les souvenirs (§9) **seulement s'ils sont explicitement publics** : c'est le contenu le plus personnel du produit, son défaut est privé.
- Un bloc de conversion en pied de page : « Reconstituez votre histoire » → E01.

## Actions

Consulter · Dérouler la timeline · **Comparer avec la mienne** → E16 (si le visiteur a un profil) · Suivre → E17 · Créer son profil → E01.

## États

- **Profil restreint** : afficher ce qui est autorisé, sans jamais signaler nommément ce qui est masqué — annoncer « la collection historique est privée » informe déjà sur son existence.
- **Profil vide ou introuvable** : page neutre avec une invitation, jamais une erreur technique.
- **Visiteur sans compte** : tout est consultable ; l'invitation apparaît en fin de lecture, pas en interruption.

## Relations

**Entrant** : lien partagé (canal externe) · E16 · E17 · E11 (prévisualisation par le propriétaire).
**Sortant** : E01 (conversion, chemin le plus important) · E16 · E17.

E15 est la **porte d'entrée principale des nouveaux utilisateurs** en Phase 5 : un profil partagé est la meilleure démonstration du produit. Le chemin E15 → E01 doit donc être aussi soigné que E01 lui-même.

## Pièges

- Exiger un compte pour consulter : détruit la valeur de démonstration.
- Interrompre la lecture par une invitation à s'inscrire.
- Exposer un souvenir par défaut : violation de l'attente de confidentialité, et perte de confiance difficile à rattraper.
- Indexer sans consentement (§12.3).
