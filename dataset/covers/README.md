# Jaquettes

> Acquises le **20 septembre 2026** sous la posture R&D de [VERIFICATION-JURIDIQUE.md](../../VERIFICATION-JURIDIQUE.md) §3.3. **217 œuvres sur 222 (98 %)**, toutes bornées à 512 px de large.

## ⛔ Les images ne sont pas dans le dépôt, et c'est délibéré

Le dépôt est **public**. Y pousser 24 Mo de jaquettes sous *fair use* serait de la publication et de la redistribution — les conditions **4** (diffusion bornée) et **5** (aucune redistribution) de la posture R&D l'interdisent l'une comme l'autre.

Seul [`MANIFEST.json`](./MANIFEST.json) est versionné. Il porte, pour chaque visuel, son URL source, son fichier d'origine, sa licence, son régime et l'article dont il provient — de quoi **tout régénérer** sans que rien ne soit redistribué :

```
cd calibration && python3 fetch_covers.py
```

C'est aussi ce qui rend une demande de retrait traitable : le manifeste dit exactement quel fichier vient d'où.

## Ce que la couverture révèle

| Régime | Sens | Nombre |
|---|---|--:|
| `non_free` | téléversé sur Wikipédia sous *fair use* américain | **216** |
| `free` | hébergé sur Commons, licence libre | **1** |

> **Le socle visuel du POC est révocable à 99,5 %.**
>
> Une seule jaquette sur 217 est réellement libre — *CC BY-SA 4.0*. Tout le reste est l'emprunt que la décision R&D assume : légitime dans son cadre, et sans aucune valeur d'acquis. Si le projet change de nature, **216 visuels disparaissent d'un coup**.
>
> Cela confirme sur pièces la décision §19.2 point 1 : les **tuiles générées restent le socle permanent**, et ne sont pas un pis-aller en attendant mieux. Il n'y a pas de « mieux » à attendre — la voie libre n'existe pas pour ce catalogue, elle représente ici 0,5 %.

## Cinq œuvres sans jaquette

Bubble Bobble · Mario Kart 8 Deluxe · Sim City · Pokémon Yellow · Super Mario Advance

Quatre n'ont pas de champ image exploitable dans l'infobox de leur article, une n'a pas d'article. Elles retombent sur la tuile générée, ce qui est exactement son rôle.

## Deux pièges rencontrés, consignés

**`prop=pageimages` ne convient pas.** L'extension PageImages **exclut par construction les fichiers non libres** — c'est-à-dire précisément les jaquettes. Elle renvoyait « pas d'image » pour 220 articles sur 222 alors que le fichier était nommé dans l'infobox. Pris pour argent comptant, ce résultat concluait que les jaquettes sont introuvables. L'API faisait son travail ; c'est la question qui était mauvaise.

**La vignette est produite par le serveur** (`iiurlwidth`), jamais redimensionnée après coup. La condition de basse résolution est ainsi tenue **au téléchargement** : l'original ne transite pas.

## Format

512 px de large, hauteur libre — les jaquettes rétro n'ont pas de ratio commun (Super Mario Bros. 512×739, Chrono Trigger 512×374, Tetris 512×515). Le cadre 3:4 constant du [langage visuel](../../ecrans/00-langage-visuel.md) §5 est donc affaire de **rendu**, pas de fichier : c'est au composant de cadrer, et il doit le faire sans déformer.

`.jpg` 159 · `.png` 53 · `.jpeg` 3 · `.webp` 2 · 24 Mo au total, soit ~104 Ko par visuel.
