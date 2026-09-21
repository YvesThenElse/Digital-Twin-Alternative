"""Le dataset POC, curé à la main.

L'ordre de chaque liste EST le classement de notoriété (§3.3) : la première
entrée est le titre qu'un joueur de la plateforme cite en premier. C'est le
jugement de domaine que Wikidata ne porte pas, et il n'a pas d'autre source.

L'année est celle de la PREMIÈRE sortie mondiale, généralement japonaise.
Elle ne sert pas à décrire le jeu — elle sert à **vérifier la résolution** :
c'est elle qui aurait écarté Yoshi's Island quand on demandait Super Mario
World. Une entrée dont l'année ne concorde pas est signalée, jamais retenue
en silence.
"""

# (QID, nom, année de lancement MONDIALE LA PLUS PRÉCOCE).
#
# L'année de lancement sert d'invariant : une sortie ne peut pas précéder la
# machine sur laquelle elle paraît. On retient donc la PREMIÈRE parution, au
# Japon le plus souvent — une borne plus tardive rejetterait de vraies
# sorties japonaises. La Famicom est comptée comme NES, et son lecteur de
# disquettes avec elle : le modèle ne les distingue pas.
PLATFORMS = {
    "nes":    ("Q172742",   "Nintendo Entertainment System",     1983),
    "snes":   ("Q183259",   "Super Nintendo Entertainment System", 1990),
    "gb":     ("Q186437",   "Game Boy",                          1989),
    "gba":    ("Q188642",   "Game Boy Advance",                  2001),
    "n64":    ("Q184839",   "Nintendo 64",                       1996),
    "ps1":    ("Q10677",    "PlayStation",                       1994),
    "ps2":    ("Q10680",    "PlayStation 2",                     2000),
    "switch": ("Q19610114", "Nintendo Switch",                   2017),
}

CURATED = {
"nes": [
    ("Super Mario Bros.", 1985), ("The Legend of Zelda", 1986),
    ("Super Mario Bros. 3", 1988), ("Metroid", 1986),
    ("Mega Man 2", 1988), ("Castlevania", 1986),
    ("Contra", 1988), ("Final Fantasy", 1987),
    ("Dragon Quest", 1986), ("Punch-Out!!", 1987),
    ("Kirby's Adventure", 1993), ("Ninja Gaiden", 1988),
    ("Zelda II: The Adventure of Link", 1987), ("Super Mario Bros. 2", 1988),
    ("Mega Man 3", 1990), ("Castlevania III: Dracula's Curse", 1989),
    ("Excitebike", 1984), ("Ice Climber", 1985),
    ("Kid Icarus", 1986), ("Gradius", 1986),
    ("Double Dragon", 1987), ("Bubble Bobble", 1986),
    ("DuckTales", 1989), ("Battletoads", 1991),
    ("Blaster Master", 1988), ("River City Ransom", 1989),
    ("Adventure Island", 1986), ("Faxanadu", 1987),
    ("StarTropics", 1990), ("Teenage Mutant Ninja Turtles", 1989),
    ("Duck Hunt", 1984), ("Balloon Fight", 1984),
    ("Mega Man", 1987), ("Ninja Gaiden II: The Dark Sword of Chaos", 1990),
    ("Bomberman", 1985),
],
"snes": [
    ("Super Mario World", 1990), ("The Legend of Zelda: A Link to the Past", 1991),
    ("Super Metroid", 1994), ("Chrono Trigger", 1995),
    ("Donkey Kong Country", 1994), ("Final Fantasy VI", 1994),
    ("Super Mario Kart", 1992), ("Street Fighter II", 1992),
    ("Secret of Mana", 1993), ("Super Castlevania IV", 1991),
    ("Mega Man X", 1993), ("Star Fox", 1993),
    ("Earthbound", 1994), ("Super Mario World 2: Yoshi's Island", 1995),
    ("F-Zero", 1990), ("Super Punch-Out!!", 1994),
    ("Donkey Kong Country 2: Diddy's Kong Quest", 1995),
    ("Contra III: The Alien Wars", 1992), ("Terranigma", 1995),
    ("Illusion of Gaia", 1993), ("ActRaiser", 1990),
    ("Super Bomberman", 1993), ("Kirby Super Star", 1996),
    ("Final Fantasy IV", 1991), ("Super Ghouls 'n Ghosts", 1991),
    ("Tetris Attack", 1995), ("Zombies Ate My Neighbors", 1993),
    ("Pilotwings", 1990), ("Super Tennis", 1991),
    ("The Lion King", 1994), ("Aladdin", 1993),
    ("Sim City", 1991), ("Harvest Moon", 1996),
    ("Breath of Fire", 1993), ("Lufia & the Fortress of Doom", 1993),
],
"gb": [
    ("Tetris", 1989), ("Pokémon Red and Blue", 1996),
    ("The Legend of Zelda: Link's Awakening", 1993),
    ("Super Mario Land", 1989), ("Super Mario Land 2: 6 Golden Coins", 1992),
    ("Kirby's Dream Land", 1992), ("Metroid II: Return of Samus", 1991),
    ("Wario Land: Super Mario Land 3", 1994),
    ("Donkey Kong", 1994), ("Pokémon Yellow", 1998),
    ("Castlevania: The Adventure", 1989), ("Final Fantasy Adventure", 1991),
    ("Mega Man: Dr. Wily's Revenge", 1991), ("Gargoyle's Quest", 1990),
    ("Kid Icarus: Of Myths and Monsters", 1991),
    ("Pokémon Gold and Silver", 1999), ("Dr. Mario", 1990),
    ("Tetris 2", 1993), ("Bubble Bobble", 1991),
    ("Solar Striker", 1990), ("Balloon Kid", 1990),
    ("Kirby's Dream Land 2", 1995), ("Game Boy Camera", 1998),
    ("Mole Mania", 1996), ("Harvest Moon GB", 1997),
],
"gba": [
    ("Pokémon Ruby and Sapphire", 2002),
    ("The Legend of Zelda: The Minish Cap", 2004),
    ("Metroid Fusion", 2002), ("Advance Wars", 2001),
    ("Golden Sun", 2001), ("Fire Emblem", 2003),
    ("Mario Kart: Super Circuit", 2001),
    ("Castlevania: Aria of Sorrow", 2003),
    ("Metroid: Zero Mission", 2004),
    ("Super Mario Advance", 2001),
    ("Pokémon FireRed and LeafGreen", 2004),
    ("Mario & Luigi: Superstar Saga", 2003),
    ("WarioWare, Inc.: Mega Microgames!", 2003),
    ("Astro Boy: Omega Factor", 2003),
    ("Final Fantasy Tactics Advance", 2003),
    ("Pokémon Emerald", 2004), ("Kirby & the Amazing Mirror", 2004),
    ("Castlevania: Circle of the Moon", 2001),
    ("Advance Wars 2: Black Hole Rising", 2003),
    ("Golden Sun: The Lost Age", 2002),
    ("Drill Dozer", 2005), ("Rhythm Tengoku", 2006),
    ("Sonic Advance", 2001), ("Mother 3", 2006),
    ("The Legend of Zelda: A Link to the Past & Four Swords", 2002),
],
"n64": [
    ("Super Mario 64", 1996), ("The Legend of Zelda: Ocarina of Time", 1998),
    ("GoldenEye 007", 1997), ("Mario Kart 64", 1996),
    ("Super Smash Bros.", 1999),
    ("The Legend of Zelda: Majora's Mask", 2000),
    ("Banjo-Kazooie", 1998), ("Perfect Dark", 2000),
    ("Star Fox 64", 1997), ("Donkey Kong 64", 1999),
    ("Paper Mario", 2000), ("Conker's Bad Fur Day", 2001),
    ("F-Zero X", 1998), ("Diddy Kong Racing", 1997),
    ("Wave Race 64", 1996), ("Pokémon Snap", 1999),
    ("Pokémon Stadium", 1998), ("Mario Party", 1998),
    ("Banjo-Tooie", 2000), ("Mario Tennis", 2000),
    ("1080° Snowboarding", 1998), ("Yoshi's Story", 1997),
    ("Turok: Dinosaur Hunter", 1997), ("Sin and Punishment", 2000),
    ("Ogre Battle 64", 1999),
],
"ps1": [
    ("Final Fantasy VII", 1997), ("Metal Gear Solid", 1998),
    ("Resident Evil", 1996), ("Gran Turismo", 1997),
    ("Crash Bandicoot", 1996), ("Tekken 3", 1997),
    ("Final Fantasy VIII", 1999), ("Silent Hill", 1999),
    ("Castlevania: Symphony of the Night", 1997),
    ("Resident Evil 2", 1998), ("Spyro the Dragon", 1998),
    ("Tomb Raider", 1996), ("Final Fantasy IX", 2000),
    ("Gran Turismo 2", 1999), ("Crash Bandicoot 2: Cortex Strikes Back", 1997),
    ("Chrono Cross", 1999), ("Xenogears", 1998),
    ("Parasite Eve", 1998), ("Vagrant Story", 2000),
    ("Suikoden II", 1998), ("Tony Hawk's Pro Skater", 1999),
    ("Driver", 1999), ("Wipeout", 1995),
    ("Ridge Racer", 1993), ("Tekken 2", 1995),
    ("Medal of Honor", 1999), ("Ape Escape", 1999),
    ("Um Jammer Lammy", 1999), ("PaRappa the Rapper", 1996),
    ("Abe's Oddysee", 1997),
],
"ps2": [
    ("Grand Theft Auto: San Andreas", 2004),
    ("Shadow of the Colossus", 2005), ("Ico", 2001),
    ("Final Fantasy X", 2001), ("Metal Gear Solid 3: Snake Eater", 2004),
    ("Grand Theft Auto III", 2001), ("Grand Theft Auto: Vice City", 2002),
    ("God of War", 2005), ("Kingdom Hearts", 2002),
    ("Gran Turismo 3: A-Spec", 2001),
    ("Metal Gear Solid 2: Sons of Liberty", 2001),
    ("Devil May Cry", 2001), ("Okami", 2006),
    ("Persona 4", 2008), ("Persona 3", 2006),
    ("Resident Evil 4", 2005), ("Silent Hill 2", 2001),
    ("Jak and Daxter: The Precursor Legacy", 2001),
    ("Ratchet & Clank", 2002), ("Burnout 3: Takedown", 2004),
    ("Tekken 5", 2004), ("Guitar Hero", 2005),
    ("SSX Tricky", 2001), ("Katamari Damacy", 2004),
    ("Dragon Quest VIII", 2004),
],
"switch": [
    ("The Legend of Zelda: Breath of the Wild", 2017),
    ("Super Mario Odyssey", 2017), ("Mario Kart 8 Deluxe", 2017),
    ("Animal Crossing: New Horizons", 2020),
    ("Super Smash Bros. Ultimate", 2018),
    ("The Legend of Zelda: Tears of the Kingdom", 2023),
    ("Splatoon 2", 2017), ("Super Mario Maker 2", 2019),
    ("Pokémon Sword and Shield", 2019),
    ("Metroid Dread", 2021), ("Fire Emblem: Three Houses", 2019),
    ("Xenoblade Chronicles 2", 2017), ("Hollow Knight", 2018),
    ("Stardew Valley", 2017), ("Celeste", 2018),
    ("Hades", 2020), ("Luigi's Mansion 3", 2019),
    ("Super Mario Party", 2018), ("Splatoon 3", 2022),
    ("Pokémon Legends: Arceus", 2022),
    ("Ring Fit Adventure", 2019), ("Bayonetta 3", 2022),
    ("Astral Chain", 2019), ("Kirby and the Forgotten Land", 2022),
    ("Pikmin 4", 2023),
],
}

if __name__ == "__main__":
    total = sum(len(v) for v in CURATED.values())
    for k, v in CURATED.items():
        print("%-7s %3d titres" % (k, len(v)))
    print("total %d titres curés" % total)
