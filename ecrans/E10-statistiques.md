# E10 — Statistiques

**Type** : page · **Phase** : 3 · **Route** : `/statistiques`

## Objectif

Accueillir l'analyse détaillée, pour que **E04 reste un portrait**. C'est la soupape qui protège le profil de la surcharge : chaque indicateur de §8.2 réclamé par un contributeur atterrit ici, pas sur le profil.

## Contenu

Densité élevée assumée (principe 3). Sections repliables :

- **Volumes** : joués, terminés, à 100 %, abandonnés, possédés, cédés.
- **Répartitions** : par plateforme, génération, genre, studio, éditeur, région.
- **Temporel** : activité par année, périodes les plus denses, âge d'or déclaré, écart entre sortie d'un jeu et découverte.
- **Complétion** : taux global, par plateforme, franchises entièrement terminées.
- **Collection** : évolution du nombre d'objets possédés dans le temps, durées de détention, raretés.

## Règles d'affichage

**Tout indicateur porte sa fiabilité.** Un chiffre calculé sur des dates floues s'affiche avec sa marque d'approximation (§11.4). Un chiffre calculé sur moins d'un seuil de données ne s'affiche pas du tout.

**Mode strict par défaut ici.** Contrairement à E08, les statistiques annoncées comme des chiffres utilisent le mode **strict** des requêtes temporelles (§7.7) — inclusion seulement si l'intervalle est entièrement contenu dans la période. Le mode est indiqué et commutable.

**Le temps de jeu n'est pas agrégé.** S'il est affiché, il l'est **par origine** — importé, déclaré, estimé — et jamais additionné en un total unique (§11.3). Pour la majorité des parcours rétro, la bonne décision est de ne pas afficher d'heures.

## Actions

Clic sur un segment → E08 ou E05 filtrés · Changer de mode temporel · Exporter (Phase 3, sert aussi la portabilité RGPD, §19.3).

## États

- **Insuffisant** : sous le seuil, afficher ce qui manque pour que l'écran devienne intéressant, et un lien vers E02. Ne jamais afficher des graphiques à une barre.
- **Partiel** : nominal.

## Relations

**Entrant** : E04 (clic sur un chiffre) · navigation secondaire. **Sortant** : E08 · E05 · E03.

E10 est le **déversoir** de E04 : la règle de conception est que tout ajout d'indicateur au profil doit d'abord être tenté ici.

## Pièges

- Laisser E10 coloniser E04. Le profil se contemple, les statistiques s'explorent.
- Produire des classements comparatifs entre utilisateurs : cela relève du social (Phase 5) et change la nature de l'écran.
