# Classement de notoriété

> Les 222 œuvres du [dataset](./poc.json), dans l'ordre où **E02 les présentera**. Le rang 1 est le titre qu'un joueur de la plateforme cite en premier.

> ⚙️ **Fichier généré** — `python3 calibration/emit_notabilite.py`. Ne pas l'éditer à la main : il se régénère depuis `poc.json`. Pour changer un rang, changer `notability` dans la liste curée et réémettre. Depuis le 21 septembre 2026, **réordonner ne déplace plus aucun `CanonicalId`** (voir `calibration/id_seq.json`).

Ce classement n'a aucune source : c'est un jugement de domaine. §3.3 en fait un attribut requis — « l'application montre les principaux jeux de la plateforme » n'a pas de sens sans un ordre.

**Ce qu'il faut regarder** : un titre trop haut fait perdre du temps à tout le monde ; un titre trop bas, ou absent, est un jeu que le testeur cherchera sans le trouver — et c'est l'échec qui casse la reconnaissance.

| Marque | Sens |
|---|---|
| `✓` | au moins une date au jour |
| `~` | au mieux au mois |
| `≈` | à l'année seulement |
| `∅` | aucune date |
| régions | celles attestées ; `—` = aucune |
| `img` | jaquette acquise |


## Nintendo Entertainment System — 34 titres

| # | Titre | | Régions | |
|--:|---|:-:|---|---|
| 1 | Super Mario Bros. | ✓ | NTSC-J NTSC-U PAL | img |
| 2 | The Legend of Zelda | ✓ | NTSC-J NTSC-U PAL | img |
| 3 | Super Mario Bros. 3 | ✓ | NTSC-J NTSC-U PAL | img |
| 4 | Metroid | ✓ | NTSC-J NTSC-U PAL | img |
| 5 | Mega Man 2 | ✓ | NTSC-J NTSC-U PAL | img |
| 6 | Castlevania | ✓ | NTSC-J NTSC-U PAL | img |
| 7 | Contra | ✓ | NTSC-J NTSC-U PAL | img |
| 8 | Final Fantasy | ✓ | NTSC-J NTSC-U | img |
| 9 | Dragon Quest | ✓ | NTSC-J NTSC-U | img |
| 10 | Punch-Out!! | ✓ | NTSC-U PAL | img |
| 11 | Kirby's Adventure | ✓ | NTSC-J NTSC-U PAL | img |
| 12 | Ninja Gaiden | ✓ | NTSC-J NTSC-U PAL | img |
| 13 | Zelda II: The Adventure of Link | ✓ | NTSC-J NTSC-U PAL | img |
| 14 | Super Mario Bros. 2 | ✓ | NTSC-J NTSC-U PAL | img |
| 15 | Mega Man 3 | ✓ | NTSC-J NTSC-U PAL | img |
| 16 | Castlevania III: Dracula's Curse | ✓ | NTSC-J NTSC-U PAL | img |
| 17 | Excitebike | ✓ | NTSC-J NTSC-U PAL | img |
| 18 | Ice Climber | ✓ | NTSC-J NTSC-U PAL | img |
| 19 | Kid Icarus | ✓ | NTSC-J NTSC-U PAL | img |
| 20 | Gradius | ✓ | NTSC-J NTSC-U PAL | img |
| 21 | Double Dragon | ✓ | NTSC-J NTSC-U PAL | img |
| 22 | Bubble Bobble | ✓ | NTSC-J NTSC-U PAL | img |
| 23 | DuckTales | ✓ | NTSC-J NTSC-U PAL | img |
| 24 | Battletoads | ✓ | NTSC-J NTSC-U PAL | img |
| 25 | Blaster Master | ✓ | NTSC-J NTSC-U PAL | img |
| 26 | River City Ransom | ✓ | NTSC-J NTSC-U PAL | img |
| 27 | Adventure Island | ✓ | NTSC-J NTSC-U PAL | img |
| 28 | Faxanadu | ✓ | NTSC-J NTSC-U PAL | img |
| 29 | StarTropics | ✓ | NTSC-U PAL | img |
| 30 | Teenage Mutant Ninja Turtles | ✓ | NTSC-J NTSC-U PAL | img |
| 31 | Duck Hunt | ✓ | NTSC-J NTSC-U PAL | img |
| 32 | Balloon Fight | ✓ | NTSC-J NTSC-U PAL | img |
| 33 | Mega Man | ✓ | NTSC-J NTSC-U PAL | img |
| 34 | Ninja Gaiden II: The Dark Sword of Chaos | ✓ | NTSC-J NTSC-U PAL | img |

## Super Nintendo Entertainment System — 35 titres

| # | Titre | | Régions | |
|--:|---|:-:|---|---|
| 1 | Super Mario World | ✓ | NTSC-J NTSC-U PAL | img |
| 2 | The Legend of Zelda: A Link to the Past | ✓ | NTSC-J NTSC-U PAL | img |
| 3 | Super Metroid | ✓ | NTSC-J NTSC-U PAL | img |
| 4 | Chrono Trigger | ✓ | NTSC-J NTSC-U | img |
| 5 | Donkey Kong Country | ✓ | NTSC-J NTSC-U PAL | img |
| 6 | Final Fantasy VI | ✓ | NTSC-J NTSC-U | img |
| 7 | Super Mario Kart | ✓ | NTSC-J NTSC-U PAL | img |
| 8 | Street Fighter II | ✓ | NTSC-J NTSC-U PAL | img |
| 9 | Secret of Mana | ✓ | NTSC-J NTSC-U PAL | img |
| 10 | Super Castlevania IV | ✓ | NTSC-J NTSC-U PAL | img |
| 11 | Mega Man X | ✓ | NTSC-J NTSC-U PAL | img |
| 12 | Star Fox | ✓ | NTSC-J NTSC-U PAL | img |
| 13 | Earthbound | ✓ | NTSC-J NTSC-U | img |
| 14 | Super Mario World 2: Yoshi's Island | ✓ | NTSC-J NTSC-U PAL | img |
| 15 | F-Zero | ✓ | NTSC-J NTSC-U PAL | img |
| 16 | Super Punch-Out!! | ✓ | NTSC-J NTSC-U PAL | img |
| 17 | Donkey Kong Country 2: Diddy's Kong Quest | ✓ | NTSC-J NTSC-U PAL | img |
| 18 | Contra III: The Alien Wars | ✓ | NTSC-J NTSC-U PAL | img |
| 19 | Terranigma | ✓ | NTSC-J PAL | img |
| 20 | Illusion of Gaia | ✓ | NTSC-J NTSC-U PAL | img |
| 21 | ActRaiser | ✓ | NTSC-J NTSC-U PAL | img |
| 22 | Super Bomberman | ✓ | NTSC-J NTSC-U PAL | img |
| 23 | Kirby Super Star | ✓ | NTSC-J NTSC-U PAL | img |
| 24 | Final Fantasy IV | ✓ | NTSC-J NTSC-U | img |
| 25 | Super Ghouls 'n Ghosts | ✓ | NTSC-J NTSC-U PAL | img |
| 26 | Tetris Attack | ✓ | NTSC-J NTSC-U PAL | img |
| 27 | Zombies Ate My Neighbors | ✓ | NTSC-U PAL | img |
| 28 | Pilotwings | ✓ | NTSC-J NTSC-U PAL | img |
| 29 | Super Tennis | ✓ | NTSC-J NTSC-U PAL | img |
| 30 | The Lion King | ✓ | NTSC-U PAL | img |
| 31 | Aladdin | ✓ | NTSC-J NTSC-U PAL | img |
| 32 | Sim City | ✓ | NTSC-J |  |
| 33 | Harvest Moon | ✓ | NTSC-J NTSC-U PAL | img |
| 34 | Breath of Fire | ✓ | NTSC-J NTSC-U | img |
| 35 | Lufia & the Fortress of Doom | ✓ | NTSC-J NTSC-U | img |

## Game Boy — 23 titres

| # | Titre | | Régions | |
|--:|---|:-:|---|---|
| 1 | Tetris | ✓ | NTSC-J NTSC-U PAL | img |
| 2 | Pokémon Red and Blue | ≈ | — | img |
| 3 | The Legend of Zelda: Link's Awakening | ✓ | NTSC-J NTSC-U PAL | img |
| 4 | Super Mario Land | ✓ | NTSC-J NTSC-U PAL | img |
| 5 | Super Mario Land 2: 6 Golden Coins | ✓ | NTSC-J NTSC-U PAL | img |
| 6 | Kirby's Dream Land | ✓ | NTSC-J NTSC-U PAL | img |
| 7 | Metroid II: Return of Samus | ✓ | NTSC-J NTSC-U PAL | img |
| 8 | Wario Land: Super Mario Land 3 | ✓ | NTSC-J NTSC-U PAL | img |
| 9 | Donkey Kong | ✓ | NTSC-J NTSC-U PAL | img |
| 10 | Pokémon Yellow | ≈ | — |  |
| 11 | Castlevania: The Adventure | ✓ | NTSC-J NTSC-U PAL | img |
| 12 | Final Fantasy Adventure | ✓ | NTSC-J NTSC-U PAL | img |
| 13 | Mega Man: Dr. Wily's Revenge | ✓ | NTSC-J NTSC-U PAL | img |
| 14 | Gargoyle's Quest | ✓ | NTSC-J NTSC-U PAL | img |
| 15 | Kid Icarus: Of Myths and Monsters | ✓ | NTSC-U PAL | img |
| 17 | Dr. Mario | ✓ | NTSC-J NTSC-U PAL | img |
| 18 | Tetris 2 | ✓ | NTSC-J NTSC-U PAL | img |
| 19 | Bubble Bobble | ✓ | NTSC-J |  |
| 20 | Solar Striker | ✓ | NTSC-J NTSC-U PAL | img |
| 21 | Balloon Kid | ≈ | — | img |
| 22 | Kirby's Dream Land 2 | ✓ | NTSC-J NTSC-U PAL | img |
| 24 | Mole Mania | ✓ | NTSC-J NTSC-U PAL | img |
| 25 | Harvest Moon GB | ✓ | NTSC-J NTSC-U | img |

## Game Boy Advance — 25 titres

| # | Titre | | Régions | |
|--:|---|:-:|---|---|
| 1 | Pokémon Ruby and Sapphire | ✓ | NTSC-J NTSC-U PAL | img |
| 2 | The Legend of Zelda: The Minish Cap | ✓ | NTSC-J NTSC-U PAL | img |
| 3 | Metroid Fusion | ✓ | NTSC-J NTSC-U PAL | img |
| 4 | Advance Wars | ✓ | NTSC-J NTSC-U PAL | img |
| 5 | Golden Sun | ✓ | NTSC-J NTSC-U PAL | img |
| 6 | Fire Emblem: The Blazing Blade | ✓ | NTSC-J NTSC-U PAL | img |
| 7 | Mario Kart: Super Circuit | ✓ | NTSC-J NTSC-U PAL | img |
| 8 | Castlevania: Aria of Sorrow | ✓ | NTSC-J NTSC-U PAL | img |
| 9 | Metroid: Zero Mission | ✓ | NTSC-J NTSC-U PAL | img |
| 10 | Super Mario Advance | ≈ | NTSC-J |  |
| 11 | Pokémon FireRed and LeafGreen | ~ | NTSC-J NTSC-U PAL | img |
| 12 | Mario & Luigi: Superstar Saga | ✓ | NTSC-J NTSC-U PAL | img |
| 13 | WarioWare, Inc.: Mega Microgames! | ✓ | NTSC-J NTSC-U PAL | img |
| 14 | Astro Boy: Omega Factor | ✓ | NTSC-J NTSC-U PAL | img |
| 15 | Final Fantasy Tactics Advance | ✓ | NTSC-J NTSC-U PAL | img |
| 16 | Pokémon Emerald | ~ | NTSC-J NTSC-U PAL | img |
| 17 | Kirby & the Amazing Mirror | ✓ | NTSC-J NTSC-U PAL | img |
| 18 | Castlevania: Circle of the Moon | ✓ | NTSC-J NTSC-U PAL | img |
| 19 | Advance Wars 2: Black Hole Rising | ✓ | NTSC-J NTSC-U PAL | img |
| 20 | Golden Sun: The Lost Age | ✓ | NTSC-J NTSC-U PAL | img |
| 21 | Drill Dozer | ✓ | NTSC-J NTSC-U | img |
| 22 | Rhythm Tengoku | ✓ | NTSC-J | img |
| 23 | Sonic Advance | ✓ | NTSC-J NTSC-U PAL | img |
| 24 | Mother 3 | ✓ | NTSC-J | img |
| 25 | The Legend of Zelda: A Link to the Past and Four Swords | ✓ | NTSC-J NTSC-U PAL WORLDWIDE | img |

## Nintendo 64 — 25 titres

| # | Titre | | Régions | |
|--:|---|:-:|---|---|
| 1 | Super Mario 64 | ✓ | NTSC-J NTSC-U PAL | img |
| 2 | The Legend of Zelda: Ocarina of Time | ✓ | NTSC-J NTSC-U PAL | img |
| 3 | GoldenEye 007 | ~ | NTSC-J NTSC-U PAL | img |
| 4 | Mario Kart 64 | ✓ | NTSC-J NTSC-U PAL | img |
| 5 | Super Smash Bros. | ✓ | NTSC-J NTSC-U PAL | img |
| 6 | The Legend of Zelda: Majora's Mask | ✓ | NTSC-J NTSC-U PAL | img |
| 7 | Banjo-Kazooie | ~ | NTSC-U PAL | img |
| 8 | Perfect Dark | ≈ | — | img |
| 9 | Star Fox 64 | ✓ | NTSC-J NTSC-U PAL | img |
| 10 | Donkey Kong 64 | ✓ | NTSC-J NTSC-U PAL | img |
| 11 | Paper Mario | ✓ | NTSC-J NTSC-U PAL | img |
| 12 | Conker's Bad Fur Day | ~ | NTSC-U PAL | img |
| 13 | F-Zero X | ✓ | NTSC-J NTSC-U PAL | img |
| 14 | Diddy Kong Racing | ~ | NTSC-J NTSC-U PAL | img |
| 15 | Wave Race 64 | ✓ | NTSC-J NTSC-U PAL | img |
| 16 | Pokémon Snap | ✓ | NTSC-J NTSC-U PAL | img |
| 17 | Pokémon Stadium | ✓ | NTSC-J NTSC-U PAL | img |
| 18 | Mario Party | ✓ | NTSC-J NTSC-U PAL | img |
| 19 | Banjo-Tooie | ✓ | NTSC-J NTSC-U PAL | img |
| 20 | Mario Tennis | ✓ | NTSC-J NTSC-U PAL | img |
| 21 | 1080° Snowboarding | ✓ | NTSC-J NTSC-U PAL | img |
| 22 | Yoshi's Story | ✓ | NTSC-J NTSC-U PAL | img |
| 23 | Turok: Dinosaur Hunter | ✓ | PAL | img |
| 24 | Sin and Punishment | ~ | NTSC-J | img |
| 25 | Ogre Battle 64: Person of Lordly Caliber | ✓ | NTSC-J NTSC-U | img |

## PlayStation — 30 titres

| # | Titre | | Régions | |
|--:|---|:-:|---|---|
| 1 | Final Fantasy VII | ✓ | NTSC-J NTSC-U PAL | img |
| 2 | Metal Gear Solid | ✓ | NTSC-J NTSC-U PAL | img |
| 3 | Resident Evil | ✓ | NTSC-J NTSC-U PAL | img |
| 4 | Gran Turismo | ✓ | NTSC-J NTSC-U PAL | img |
| 5 | Crash Bandicoot | ✓ | NTSC-U PAL | img |
| 6 | Tekken 3 | ✓ | NTSC-J NTSC-U PAL | img |
| 7 | Final Fantasy VIII | ✓ | NTSC-J NTSC-U PAL | img |
| 8 | Silent Hill | ✓ | NTSC-J NTSC-U PAL | img |
| 9 | Castlevania: Symphony of the Night | ✓ | NTSC-J NTSC-U PAL | img |
| 10 | Resident Evil 2 | ✓ | NTSC-J NTSC-U PAL | img |
| 11 | Spyro the Dragon | ✓ | NTSC-U PAL | img |
| 12 | Tomb Raider | ~ | NTSC-U PAL | img |
| 13 | Final Fantasy IX | ✓ | NTSC-J NTSC-U PAL | img |
| 14 | Gran Turismo 2 | ✓ | NTSC-J NTSC-U PAL | img |
| 15 | Crash Bandicoot 2: Cortex Strikes Back | ✓ | NTSC-U PAL | img |
| 16 | Chrono Cross | ✓ | NTSC-J NTSC-U | img |
| 17 | Xenogears | ✓ | NTSC-J NTSC-U | img |
| 18 | Parasite Eve | ✓ | NTSC-J NTSC-U | img |
| 19 | Vagrant Story | ✓ | NTSC-J NTSC-U PAL | img |
| 20 | Suikoden II | ✓ | NTSC-J NTSC-U PAL | img |
| 21 | Tony Hawk's Pro Skater | ✓ | NTSC-U PAL | img |
| 22 | Driver | ✓ | NTSC-U PAL | img |
| 23 | Wipeout | ~ | NTSC-U PAL | img |
| 24 | Ridge Racer | ✓ | NTSC-J NTSC-U PAL | img |
| 25 | Tekken 2 | ✓ | NTSC-J NTSC-U PAL | img |
| 26 | Medal of Honor | ✓ | NTSC-U PAL | img |
| 27 | Ape Escape | ✓ | NTSC-J WORLDWIDE | img |
| 28 | Um Jammer Lammy | ✓ | NTSC-J NTSC-U PAL | img |
| 29 | PaRappa the Rapper | ~ | NTSC-J NTSC-U PAL | img |
| 30 | Oddworld: Abe's Oddysee | ≈ | — | img |

## PlayStation 2 — 25 titres

| # | Titre | | Régions | |
|--:|---|:-:|---|---|
| 1 | Grand Theft Auto: San Andreas | ~ | NTSC-U PAL | img |
| 2 | Shadow of the Colossus | ✓ | NTSC-J NTSC-U PAL | img |
| 3 | Ico | ✓ | NTSC-J NTSC-U PAL | img |
| 4 | Final Fantasy X | ≈ | — | img |
| 5 | Metal Gear Solid 3: Snake Eater | ✓ | NTSC-J NTSC-U PAL | img |
| 6 | Grand Theft Auto III | ✓ | NTSC-U PAL | img |
| 7 | Grand Theft Auto: Vice City | ~ | NTSC-U PAL | img |
| 8 | God of War | ✓ | NTSC-U PAL | img |
| 9 | Kingdom Hearts | ≈ | — | img |
| 10 | Gran Turismo 3: A-Spec | ✓ | NTSC-J NTSC-U PAL | img |
| 11 | Metal Gear Solid 2: Sons of Liberty | ✓ | NTSC-J NTSC-U PAL | img |
| 12 | Devil May Cry | ✓ | NTSC-J NTSC-U PAL | img |
| 13 | Ōkami | ✓ | NTSC-J NTSC-U PAL | img |
| 14 | Persona 4 | ✓ | NTSC-J NTSC-U PAL | img |
| 15 | Persona 3 | ✓ | NTSC-J NTSC-U PAL | img |
| 16 | Resident Evil 4 | ✓ | NTSC-J NTSC-U PAL | img |
| 17 | Silent Hill 2 | ✓ | NTSC-J NTSC-U PAL | img |
| 18 | Jak and Daxter: The Precursor Legacy | ✓ | NTSC-U PAL | img |
| 19 | Ratchet & Clank | ✓ | PAL | img |
| 20 | Burnout 3: Takedown | ~ | NTSC-U PAL | img |
| 21 | Tekken 5 | ✓ | NTSC-J NTSC-U PAL | img |
| 22 | Guitar Hero | ✓ | NTSC-U PAL | img |
| 23 | SSX Tricky | ~ | NTSC-U PAL | img |
| 24 | Katamari Damacy | ✓ | NTSC-J NTSC-U | img |
| 25 | Dragon Quest VIII | ✓ | NTSC-J NTSC-U PAL | img |

## Nintendo Switch — 25 titres

> Machine **sans zonage** : une sortie mondiale n'a pas de région, et `—` n'y signale donc aucune lacune.

| # | Titre | | Régions | |
|--:|---|:-:|---|---|
| 1 | The Legend of Zelda: Breath of the Wild | ≈ | — | img |
| 2 | Super Mario Odyssey | ✓ | WORLDWIDE | img |
| 3 | Mario Kart 8 Deluxe | ≈ | — |  |
| 4 | Animal Crossing: New Horizons | ✓ | WORLDWIDE | img |
| 5 | Super Smash Bros. Ultimate | ≈ | — | img |
| 6 | The Legend of Zelda: Tears of the Kingdom | ≈ | — | img |
| 7 | Splatoon 2 | ≈ | NTSC-J | img |
| 8 | Super Mario Maker 2 | ✓ | WORLDWIDE | img |
| 9 | Pokémon Sword and Shield | ≈ | — | img |
| 10 | Metroid Dread | ≈ | WORLDWIDE | img |
| 11 | Fire Emblem: Three Houses | ≈ | — | img |
| 12 | Xenoblade Chronicles 2 | ≈ | WORLDWIDE | img |
| 13 | Hollow Knight | ✓ | WORLDWIDE | img |
| 14 | Stardew Valley | ✓ | WORLDWIDE | img |
| 15 | Celeste | ✓ | WORLDWIDE | img |
| 16 | Hades | ≈ | — | img |
| 17 | Luigi's Mansion 3 | ≈ | — | img |
| 18 | Super Mario Party | ✓ | WORLDWIDE | img |
| 19 | Splatoon 3 | ≈ | WORLDWIDE | img |
| 20 | Pokémon Legends: Arceus | ≈ | — | img |
| 21 | Ring Fit Adventure | ≈ | — | img |
| 22 | Bayonetta 3 | ≈ | WORLDWIDE | img |
| 23 | Astral Chain | ≈ | WORLDWIDE | img |
| 24 | Kirby and the Forgotten Land | ≈ | — | img |
| 25 | Pikmin 4 | ≈ | WORLDWIDE | img |
