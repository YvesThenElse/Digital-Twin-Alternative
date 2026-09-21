# -*- coding: utf-8 -*-
"""Arbitrage manuel des régions — ce que les sources autorisées ne disent pas.

Wikidata et Wikipédia n'attestent aucune sortie pour 57 couples
(œuvre, plateforme, région). **Le silence n'y est pas une preuve d'absence**,
et le biais est mesuré : l'infobox anglophone sous-déclare systématiquement
les sorties japonaises des jeux occidentaux. Banjo-Kazooie, Crash Bandicoot
et Grand Theft Auto III y sont NA/EU seulement, alors que les trois sont
sortis au Japon.

Deux verdicts, et aucun n'est « on verra » :

  ABSENT   — le titre n'est PAS sorti dans cette région sur cette plateforme.
             C'est une affirmation positive, elle porte sa raison.
  INCONNU  — non établi. C'est le défaut, et ce n'est pas un échec : le POC
             affiche l'incertitude plutôt que de trancher au hasard.

⚠️ **Les verdicts ABSENT ci-dessous sont des jugements de domaine, pas des
citations.** Aucune source autorisée ne les porte. Ils sont réunis ici
précisément pour être relus un par un, et chacun nomme ce qui le fonde. Un
`ABSENT` qu'on ne saurait pas justifier doit redevenir `INCONNU`.

Clé : (clé de plateforme, titre, région).
"""

A = "ABSENT"
I = "INCONNU"

REGION_ARBITRATION = {

    # --- Jeux japonais jamais localisés ---------------------------------
    ("gba", "Mother 3", "NTSC-U"): (A, "Jamais localisé hors du Japon ; l'absence est le fait notable de ce titre."),
    ("gba", "Mother 3", "PAL"): (A, "Idem."),
    ("gba", "Rhythm Tengoku", "NTSC-U"): (A, "Exclusivité japonaise sur Game Boy Advance ; la série n'est sortie en Occident qu'à partir de la version DS."),
    ("gba", "Rhythm Tengoku", "PAL"): (A, "Idem."),
    ("n64", "Sin and Punishment", "NTSC-U"): (A, "Exclusivité japonaise sur Nintendo 64 ; n'a atteint l'Occident que par la console virtuelle, qui est une autre sortie."),
    ("n64", "Sin and Punishment", "PAL"): (A, "Idem."),

    # --- JRPG jamais sortis en Europe à l'époque -------------------------
    ("snes", "Chrono Trigger", "PAL"): (A, "Aucune sortie européenne sur Super Nintendo ; l'Europe ne l'a connu qu'avec la version DS de 2009."),
    ("snes", "Final Fantasy VI", "PAL"): (A, "Aucune sortie européenne sur Super Nintendo."),
    ("snes", "Final Fantasy IV", "PAL"): (A, "Aucune sortie européenne sur Super Nintendo."),
    ("snes", "Earthbound", "PAL"): (A, "Aucune sortie européenne sur Super Nintendo ; l'Europe ne l'a eu qu'en console virtuelle."),
    ("nes", "Final Fantasy", "PAL"): (A, "Aucune sortie européenne sur NES."),
    ("nes", "Dragon Quest", "PAL"): (A, "Aucune sortie européenne sur NES."),
    ("ps1", "Xenogears", "PAL"): (A, "Jamais sorti en Europe ; non-sortie très commentée à l'époque."),
    ("ps1", "Chrono Cross", "PAL"): (A, "Jamais sorti en Europe sur PlayStation."),
    ("ps1", "Parasite Eve", "PAL"): (A, "Jamais sorti en Europe."),
    ("n64", "Ogre Battle 64: Person of Lordly Caliber", "PAL"): (A, "Sorti au Japon puis en Amérique du Nord, jamais en Europe."),
    ("ps2", "Katamari Damacy", "PAL"): (A, "Le premier épisode saute l'Europe ; seule la suite y paraît."),

    # --- Jeux occidentaux jamais sortis au Japon ------------------------
    ("nes", "StarTropics", "NTSC-J"): (A, "Conçu pour le marché occidental, jamais sorti au Japon."),
    ("gb", "Kid Icarus: Of Myths and Monsters", "NTSC-J"): (A, "Sorti en Amérique du Nord et en Europe seulement."),
    ("n64", "Conker's Bad Fur Day", "NTSC-J"): (A, "Jamais sorti au Japon."),
    ("snes", "Zombies Ate My Neighbors", "NTSC-J"): (A, "Jamais sorti au Japon."),

    # --- Sorti au Japon et en Europe, pas en Amérique -------------------
    ("snes", "Terranigma", "NTSC-U"): (A, "Sorti au Japon puis en Europe ; la localisation américaine a été abandonnée."),
}

# Tout ce qui n'est pas listé ci-dessus reste INCONNU. Les cas suivants sont
# des manques d'EXTRACTION plutôt que des absences, et le noter ici évite
# qu'on les prenne un jour pour des non-sorties :
NOTES = {
    ("gb", "Pokémon Yellow"): "L'article anglophone n'a pas de champ « released » ; le titre est évidemment sorti dans les trois régions.",
    ("gba", "Super Mario Advance"): "Sortie mondiale ; seule la date japonaise a été captée.",
    ("snes", "Sim City"): "Aucun article anglophone rattaché ; sorti dans les trois régions.",
    ("n64", "Banjo-Kazooie"): "Sorti au Japon en décembre 1998. L'infobox anglophone ne liste que NA/EU/AU.",
    ("n64", "Perfect Dark"): "Sorti au Japon en octobre 2000, absent de l'infobox anglophone.",
    ("n64", "Turok: Dinosaur Hunter"): "Sortie japonaise attestée ailleurs, absente de l'infobox.",
    ("ps1", "Crash Bandicoot"): "Sorti au Japon en décembre 1996 ; l'infobox anglophone ne liste que NA/EU.",
    ("ps2", "Grand Theft Auto III"): "Sorti au Japon en 2003 ; absent de l'infobox anglophone.",
}
