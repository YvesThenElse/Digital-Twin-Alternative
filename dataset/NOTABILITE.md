# Classement de notoriété — à relire

> Les 222 œuvres du [dataset](./poc.json), dans l'ordre où **E02 les présentera**. Le rang 1 est le titre qu'un joueur de la plateforme cite en premier.

Ce classement n'a aucune source : c'est un jugement de domaine, produit à la main ([calibration/curated.py](../calibration/curated.py)). §3.3 en fait un attribut requis — « l'application montre les principaux jeux de la plateforme » n'a pas de sens sans un ordre.

**Ce qu'il faut regarder** : un titre trop haut fait perdre du temps à tout le monde ; un titre trop bas, ou absent, est un jeu que le testeur cherchera sans le trouver — et c'est l'échec qui casse la reconnaissance.

| Marque | Sens |
|---|---|
| `✓` | date rattachée à la plateforme — fiable |
| `~` | date non qualifiée : on ignore de quelle sortie elle parle |
| `∅` | aucune date exploitable |
| régions | celles attestées par la source ; `—` = aucune |
| `img` | une jaquette existe dans la source |
| `cur` | le titre vient de notre curation, la source n'en porte pas |


## Nintendo Entertainment System — 35 titres

| # | Titre | | Régions | |
|--:|---|:-:|---|---|
| 1 | Super Mario Bros. | ✓ | NTSC-J NTSC-U PAL | img |
| 2 | The Legend of Zelda | ✓ | NTSC-U PAL | img cur |
| 3 | Super Mario Bros. 3 | ✓ | NTSC-J NTSC-U PAL |  |
| 4 | Metroid | ✓ | NTSC-J NTSC-U PAL |  |
| 5 | Mega Man 2 | ✓ | NTSC-J NTSC-U PAL |  |
| 6 | Castlevania | ✓ | NTSC-J NTSC-U PAL | cur |
| 7 | Contra | ✓ | NTSC-U PAL | cur |
| 8 | Final Fantasy | ✓ | NTSC-J |  |
| 9 | Dragon Quest | ✓ | NTSC-J NTSC-U |  |
| 10 | Punch-Out!! | ✓ | NTSC-U PAL |  |
| 11 | Kirby's Adventure | ✓ | NTSC-J NTSC-U PAL |  |
| 12 | Ninja Gaiden | ✓ | NTSC-J NTSC-U PAL |  |
| 13 | Zelda II: The Adventure of Link | ✓ | NTSC-U PAL |  |
| 14 | Super Mario Bros. 2 | ✓ | NTSC-J NTSC-U PAL |  |
| 15 | Mega Man 3 | ✓ | NTSC-J NTSC-U PAL |  |
| 16 | Castlevania III: Dracula's Curse | ✓ | NTSC-J NTSC-U PAL | cur |
| 17 | Excitebike | ✓ | NTSC-J NTSC-U PAL |  |
| 18 | Ice Climber | ✓ | NTSC-J NTSC-U PAL | img |
| 19 | Kid Icarus | ✓ | NTSC-U PAL |  |
| 19 | Bubble Bobble | ~ | — | img |
| 20 | Gradius | ✓ | NTSC-J NTSC-U PAL |  |
| 21 | Double Dragon | ✓ | NTSC-J NTSC-U PAL |  |
| 22 | Bubble Bobble | ✓ | NTSC-U PAL | img |
| 23 | DuckTales | ✓ | NTSC-J NTSC-U PAL | img |
| 24 | Battletoads | ✓ | NTSC-J NTSC-U PAL |  |
| 25 | Blaster Master | ✓ | NTSC-J PAL | cur |
| 26 | River City Ransom | ✓ | NTSC-J NTSC-U PAL |  |
| 27 | Adventure Island | ✓ | NTSC-J NTSC-U PAL | cur |
| 28 | Faxanadu | ✓ | NTSC-J NTSC-U PAL |  |
| 29 | StarTropics | ✓ | NTSC-U PAL |  |
| 30 | Teenage Mutant Ninja Turtles | ✓ | NTSC-J NTSC-U PAL |  |
| 31 | Duck Hunt | ✓ | NTSC-J NTSC-U PAL | img cur |
| 32 | Balloon Fight | ✓ | NTSC-J NTSC-U PAL | img |
| 33 | Mega Man | ✓ | NTSC-J NTSC-U PAL |  |
| 34 | Ninja Gaiden II: The Dark Sword of Chaos | ✓ | NTSC-J NTSC-U PAL |  |

## Super Nintendo Entertainment System — 35 titres

| # | Titre | | Régions | |
|--:|---|:-:|---|---|
| 1 | Super Mario World | ✓ | NTSC-J NTSC-U PAL | cur |
| 2 | The Legend of Zelda: A Link to the Past | ✓ | NTSC-J NTSC-U PAL |  |
| 3 | Super Metroid | ✓ | NTSC-J NTSC-U PAL |  |
| 4 | Chrono Trigger | ✓ | NTSC-J NTSC-U |  |
| 5 | Donkey Kong Country | ✓ | NTSC-J NTSC-U PAL |  |
| 6 | Final Fantasy VI | ✓ | NTSC-J NTSC-U | img |
| 7 | Super Mario Kart | ✓ | NTSC-J NTSC-U PAL |  |
| 8 | Street Fighter II | ✓ | NTSC-J NTSC-U PAL | img |
| 9 | Secret of Mana | ✓ | NTSC-J NTSC-U PAL | img |
| 10 | Super Castlevania IV | ✓ | NTSC-J NTSC-U PAL | cur |
| 11 | Mega Man X | ✓ | NTSC-J NTSC-U PAL |  |
| 12 | Star Fox | ✓ | NTSC-J NTSC-U PAL |  |
| 13 | Earthbound | ✓ | NTSC-J NTSC-U | img cur |
| 14 | Super Mario World 2: Yoshi's Island | ✓ | NTSC-J NTSC-U PAL |  |
| 15 | F-Zero | ✓ | NTSC-J NTSC-U PAL |  |
| 16 | Super Punch-Out!! | ✓ | NTSC-J NTSC-U |  |
| 17 | Donkey Kong Country 2: Diddy's Kong Quest | ✓ | NTSC-J NTSC-U PAL |  |
| 18 | Contra III: The Alien Wars | ✓ | NTSC-J NTSC-U PAL |  |
| 19 | Terranigma | ✓ | NTSC-J PAL |  |
| 20 | Illusion of Gaia | ✓ | NTSC-J NTSC-U PAL |  |
| 21 | ActRaiser | ✓ | NTSC-J NTSC-U |  |
| 22 | Super Bomberman | ✓ | NTSC-J NTSC-U PAL |  |
| 23 | Kirby Super Star | ✓ | NTSC-J NTSC-U PAL |  |
| 24 | Final Fantasy IV | ✓ | NTSC-J NTSC-U |  |
| 25 | Super Ghouls 'n Ghosts | ✓ | NTSC-J NTSC-U PAL |  |
| 26 | Tetris Attack | ✓ | NTSC-J NTSC-U PAL |  |
| 27 | Zombies Ate My Neighbors | ✓ | NTSC-U PAL |  |
| 28 | Pilotwings | ✓ | NTSC-J NTSC-U PAL |  |
| 29 | Super Tennis | ✓ | NTSC-J NTSC-U PAL |  |
| 30 | The Lion King | ✓ | NTSC-U PAL | cur |
| 31 | Aladdin | ✓ | NTSC-J NTSC-U PAL | cur |
| 32 | Sim City | ✓ | NTSC-J |  |
| 33 | Harvest Moon | ✓ | NTSC-J NTSC-U PAL |  |
| 34 | Breath of Fire | ✓ | NTSC-J NTSC-U |  |
| 35 | Lufia & the Fortress of Doom | ✓ | NTSC-J NTSC-U |  |

## Game Boy — 22 titres

| # | Titre | | Régions | |
|--:|---|:-:|---|---|
| 1 | Tetris | ~ | NTSC-U | img |
| 2 | Pokémon Red and Blue | ~ | — |  |
| 3 | The Legend of Zelda: Link's Awakening | ✓ | NTSC-J NTSC-U PAL |  |
| 4 | Super Mario Land | ✓ | NTSC-U |  |
| 5 | Super Mario Land 2: 6 Golden Coins | ✓ | NTSC-J NTSC-U |  |
| 6 | Kirby's Dream Land | ~ | — |  |
| 7 | Metroid II: Return of Samus | ~ | NTSC-J |  |
| 8 | Wario Land: Super Mario Land 3 | ~ | — |  |
| 9 | Donkey Kong | ~ | — |  |
| 10 | Pokémon Yellow | ~ | — |  |
| 11 | Castlevania: The Adventure | ~ | — | cur |
| 12 | Final Fantasy Adventure | ~ | — |  |
| 13 | Mega Man: Dr. Wily's Revenge | ~ | — |  |
| 14 | Gargoyle's Quest | ~ | NTSC-U |  |
| 15 | Kid Icarus: Of Myths and Monsters | ~ | — | cur |
| 17 | Dr. Mario | ∅ | — | img |
| 18 | Tetris 2 | ∅ | — |  |
| 20 | Solar Striker | ~ | — |  |
| 21 | Balloon Kid | ~ | — |  |
| 22 | Kirby's Dream Land 2 | ~ | — |  |
| 24 | Mole Mania | ~ | — | img |
| 25 | Harvest Moon GB | ~ | — |  |

## Game Boy Advance — 25 titres

| # | Titre | | Régions | |
|--:|---|:-:|---|---|
| 1 | Pokémon Ruby and Sapphire | ~ | NTSC-U | img |
| 2 | The Legend of Zelda: The Minish Cap | ~ | — |  |
| 3 | Metroid Fusion | ~ | PAL |  |
| 4 | Advance Wars | ✓ | NTSC-U PAL |  |
| 5 | Golden Sun | ~ | — |  |
| 6 | Fire Emblem: The Blazing Blade | ✓ | NTSC-J NTSC-U PAL |  |
| 7 | Mario Kart: Super Circuit | ~ | — |  |
| 8 | Castlevania: Aria of Sorrow | ~ | — |  |
| 9 | Metroid: Zero Mission | ~ | — |  |
| 10 | Super Mario Advance | ~ | NTSC-J |  |
| 11 | Pokémon FireRed and LeafGreen | ~ | — | img |
| 12 | Mario & Luigi: Superstar Saga | ✓ | NTSC-J NTSC-U PAL |  |
| 13 | WarioWare, Inc.: Mega Microgames! | ✓ | NTSC-J NTSC-U PAL |  |
| 14 | Astro Boy: Omega Factor | ~ | — |  |
| 15 | Final Fantasy Tactics Advance | ~ | — |  |
| 16 | Pokémon Emerald | ~ | PAL |  |
| 17 | Kirby & the Amazing Mirror | ~ | — |  |
| 18 | Castlevania: Circle of the Moon | ~ | — |  |
| 19 | Advance Wars 2: Black Hole Rising | ✓ | NTSC-U PAL |  |
| 20 | Golden Sun: The Lost Age | ~ | — |  |
| 21 | Drill Dozer | ~ | — |  |
| 22 | Rhythm Tengoku | ✓ | — |  |
| 23 | Sonic Advance | ~ | — |  |
| 24 | Mother 3 | ✓ | NTSC-J |  |
| 25 | The Legend of Zelda: A Link to the Past and Four Swords | ~ | — |  |

## Nintendo 64 — 25 titres

| # | Titre | | Régions | |
|--:|---|:-:|---|---|
| 1 | Super Mario 64 | ✓ | NTSC-J NTSC-U PAL |  |
| 2 | The Legend of Zelda: Ocarina of Time | ✓ | NTSC-J NTSC-U PAL |  |
| 3 | GoldenEye 007 | ~ | NTSC-J | cur |
| 4 | Mario Kart 64 | ✓ | NTSC-J NTSC-U PAL |  |
| 5 | Super Smash Bros. | ~ | NTSC-J | img |
| 6 | The Legend of Zelda: Majora's Mask | ~ | — |  |
| 7 | Banjo-Kazooie | ~ | — |  |
| 8 | Perfect Dark | ~ | — |  |
| 9 | Star Fox 64 | ✓ | NTSC-J NTSC-U PAL |  |
| 10 | Donkey Kong 64 | ~ | — |  |
| 11 | Paper Mario | ✓ | NTSC-J NTSC-U PAL | img |
| 12 | Conker's Bad Fur Day | ~ | — |  |
| 13 | F-Zero X | ~ | NTSC-J | cur |
| 14 | Diddy Kong Racing | ~ | — |  |
| 15 | Wave Race 64 | ~ | NTSC-J |  |
| 16 | Pokémon Snap | ~ | — |  |
| 17 | Pokémon Stadium | ~ | NTSC-U |  |
| 18 | Mario Party | ~ | — |  |
| 19 | Banjo-Tooie | ✓ | NTSC-U PAL |  |
| 20 | Mario Tennis | ~ | — |  |
| 21 | 1080° Snowboarding | ✓ | NTSC-J NTSC-U PAL |  |
| 22 | Yoshi's Story | ~ | — | cur |
| 23 | Turok: Dinosaur Hunter | ~ | — |  |
| 24 | Sin and Punishment | ~ | — |  |
| 25 | Ogre Battle 64: Person of Lordly Caliber | ~ | — |  |

## PlayStation — 30 titres

| # | Titre | | Régions | |
|--:|---|:-:|---|---|
| 1 | Final Fantasy VII | ✓ | NTSC-J NTSC-U PAL |  |
| 2 | Metal Gear Solid | ~ | — |  |
| 3 | Resident Evil | ~ | — |  |
| 4 | Gran Turismo | ~ | — | cur |
| 5 | Crash Bandicoot | ~ | PAL |  |
| 6 | Tekken 3 | ✓ | NTSC-J | img |
| 7 | Final Fantasy VIII | ✓ | — |  |
| 8 | Silent Hill | ~ | NTSC-J |  |
| 9 | Castlevania: Symphony of the Night | ~ | — | cur |
| 10 | Resident Evil 2 | ~ | — |  |
| 11 | Spyro the Dragon | ~ | — |  |
| 12 | Tomb Raider | ~ | — |  |
| 13 | Final Fantasy IX | ~ | — | cur |
| 14 | Gran Turismo 2 | ~ | NTSC-J |  |
| 15 | Crash Bandicoot 2: Cortex Strikes Back | ~ | — |  |
| 16 | Chrono Cross | ~ | NTSC-J |  |
| 17 | Xenogears | ~ | — |  |
| 18 | Parasite Eve | ~ | — |  |
| 19 | Vagrant Story | ~ | — |  |
| 20 | Suikoden II | ~ | — |  |
| 21 | Tony Hawk's Pro Skater | ~ | — |  |
| 22 | Driver | ✓ | NTSC-U PAL |  |
| 23 | Wipeout | ~ | — | cur |
| 24 | Ridge Racer | ✓ | NTSC-J NTSC-U PAL |  |
| 25 | Tekken 2 | ~ | — |  |
| 26 | Medal of Honor | ~ | — | cur |
| 27 | Ape Escape | ~ | — |  |
| 28 | Um Jammer Lammy | ~ | NTSC-J |  |
| 29 | PaRappa the Rapper | ~ | — |  |
| 30 | Oddworld: Abe's Oddysee | ~ | — |  |

## PlayStation 2 — 25 titres

| # | Titre | | Régions | |
|--:|---|:-:|---|---|
| 1 | Grand Theft Auto: San Andreas | ✓ | — |  |
| 2 | Shadow of the Colossus | ~ | — |  |
| 3 | Ico | ~ | — |  |
| 4 | Final Fantasy X | ~ | — |  |
| 5 | Metal Gear Solid 3: Snake Eater | ~ | — |  |
| 6 | Grand Theft Auto III | ✓ | NTSC-U |  |
| 7 | Grand Theft Auto: Vice City | ~ | — |  |
| 8 | God of War | ~ | — |  |
| 9 | Kingdom Hearts | ~ | — |  |
| 10 | Gran Turismo 3: A-Spec | ~ | — |  |
| 11 | Metal Gear Solid 2: Sons of Liberty | ~ | — |  |
| 12 | Devil May Cry | ~ | — |  |
| 13 | Ōkami | ✓ | NTSC-J NTSC-U PAL |  |
| 14 | Persona 4 | ✓ | NTSC-J NTSC-U PAL |  |
| 15 | Persona 3 | ~ | NTSC-J |  |
| 16 | Resident Evil 4 | ✓ | — | img |
| 17 | Silent Hill 2 | ✓ | NTSC-J NTSC-U PAL |  |
| 18 | Jak and Daxter: The Precursor Legacy | ~ | — |  |
| 19 | Ratchet & Clank | ~ | — |  |
| 20 | Burnout 3: Takedown | ~ | — |  |
| 21 | Tekken 5 | ~ | — |  |
| 22 | Guitar Hero | ~ | NTSC-U |  |
| 23 | SSX Tricky | ~ | — |  |
| 24 | Katamari Damacy | ~ | — | img |
| 25 | Dragon Quest VIII | ~ | — |  |

## Nintendo Switch — 25 titres

| # | Titre | | Régions | |
|--:|---|:-:|---|---|
| 1 | The Legend of Zelda: Breath of the Wild | ~ | — |  |
| 2 | Super Mario Odyssey | ✓ | WORLDWIDE |  |
| 3 | Mario Kart 8 Deluxe | ~ | — |  |
| 4 | Animal Crossing: New Horizons | ✓ | WORLDWIDE |  |
| 5 | Super Smash Bros. Ultimate | ~ | — | img |
| 6 | The Legend of Zelda: Tears of the Kingdom | ~ | — |  |
| 7 | Splatoon 2 | ~ | NTSC-J |  |
| 8 | Super Mario Maker 2 | ✓ | WORLDWIDE |  |
| 9 | Pokémon Sword and Shield | ~ | — |  |
| 10 | Metroid Dread | ~ | WORLDWIDE |  |
| 11 | Fire Emblem: Three Houses | ~ | — |  |
| 12 | Xenoblade Chronicles 2 | ~ | WORLDWIDE |  |
| 13 | Hollow Knight | ✓ | WORLDWIDE | cur |
| 14 | Stardew Valley | ✓ | WORLDWIDE |  |
| 15 | Celeste | ✓ | — | img |
| 16 | Hades | ~ | — | cur |
| 17 | Luigi's Mansion 3 | ~ | — |  |
| 18 | Super Mario Party | ✓ | WORLDWIDE |  |
| 19 | Splatoon 3 | ~ | WORLDWIDE |  |
| 20 | Pokémon Legends: Arceus | ✓ | — |  |
| 21 | Ring Fit Adventure | ~ | — |  |
| 22 | Bayonetta 3 | ~ | WORLDWIDE |  |
| 23 | Astral Chain | ~ | WORLDWIDE |  |
| 24 | Kirby and the Forgotten Land | ~ | — |  |
| 25 | Pikmin 4 | ~ | WORLDWIDE |  |

## Curés mais absents du dataset

| Plateforme | Titre | Motif |
|---|---|---|
| Nintendo Entertainment System | Bomberman | La source porte « Bomber Man » (1983), une série, et une douzaine de suites — mais aucun item propre au Bomberman Famicom de 1985. |
| Game Boy | Pokémon Gold and Silver | Erreur de curation : Or/Argent est un titre **Game Boy Color** (la source le dit, P400 = Game Boy Color), et la Game Boy Color n'est pas une plateforme du POC. |
| Game Boy | Game Boy Camera | Erreur de curation : ce n'est pas un jeu mais un accessoire, et le modèle a déjà le concept (§4, `Accessory`). |
