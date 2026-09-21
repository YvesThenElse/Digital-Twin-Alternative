"""Dates de sortie par région, lues dans l'infobox Wikipédia.

Pourquoi cette source, alors que la règle est « Wikidata seul »

[VERIFICATION-JURIDIQUE.md](../VERIFICATION-JURIDIQUE.md) §5 écarte IGDB,
MobyGames, Giant Bomb, RAWG, TheGamesDB, OpenVGDB et ScreenScraper — toutes
pour le même motif : leurs conditions interdisent la redistribution.
**Wikipédia n'avait pas été évaluée**, et elle ne tombe pas sous ce motif :
son contenu est sous **CC BY-SA 4.0**, licence qui autorise explicitement la
réutilisation et la redistribution. C'est exactement le critère de §19.1.

⚠️ Mais le partage à l'identique se propage : un référentiel qui incorpore du
contenu CC BY-SA ne peut plus être diffusé en CC0. Le dataset passe donc en
**CC BY-SA 4.0**, avec attribution. C'est une conséquence, pas un détail.

Pourquoi l'infobox plutôt que Wikidata pour ce champ précis

L'infobox porte une consigne de contributeur qui règle le problème rencontré
avec Wikidata : « Do not list emulated releases in the infobox ». Les
rééditions en sont exclues à la main — précisément la distinction que les
déclarations Wikidata ne permettaient pas de faire.
"""
import re

# Codes de région de {{vgrelease}} -> Region du modèle.
REGION = {
    "JP": "NTSC-J", "JPN": "NTSC-J", "JA": "NTSC-J",
    "NA": "NTSC-U", "US": "NTSC-U", "USA": "NTSC-U", "CA": "NTSC-U",
    "EU": "PAL", "UK": "PAL", "GB": "PAL", "PAL": "PAL", "AU": "PAL",
    "AUS": "PAL", "FR": "PAL", "DE": "PAL", "ES": "PAL", "IT": "PAL",
    "NZ": "PAL", "SCA": "PAL", "EUR": "PAL",
    "WW": "WORLDWIDE", "INT": "WORLDWIDE",
}

# Machines sans zonage : l'absence de région y signifie « mondiale ».
SANS_ZONAGE = {"switch"}

MONTHS = {m: i for i, m in enumerate(
    ["january", "february", "march", "april", "may", "june", "july",
     "august", "september", "october", "november", "december"], start=1)}

# Noms de plateforme tels que l'infobox les écrit. L'ordre compte :
# « PlayStation 2 » doit être reconnu avant « PlayStation ».
PLATFORM_NAMES = [
    ("ps2",    ["playstation 2", "ps2"]),
    ("gba",    ["game boy advance", "gba"]),
    ("switch", ["nintendo switch", "switch"]),
    ("snes",   ["super nes", "snes", "super nintendo", "super famicom"]),
    ("n64",    ["nintendo 64", "n64"]),
    ("ps1",    ["playstation", "ps1", "psx"]),
    ("gb",     ["game boy"]),
    ("nes",    ["nes", "famicom", "nintendo entertainment system"]),
]

# Les infobox anciennes disent « released », les récentes « release ».
_RELEASED = re.compile(
    r"\|\s*released?\s*=(.*?)(?=\n\s*\|\s*[\w ]+\s*=|\n\}\})",
    re.S | re.IGNORECASE)

# Les <ref> et les gabarits imbriqués contiennent des « | » qui cassaient le
# découpage des paramètres. On les retire AVANT toute analyse.
_NOISE = re.compile(
    # ⚠️ L'alternative auto-fermante passe EN PREMIER, et le motif d'ouverture
# exclut « / » : sinon « <ref name="x" /> » est vu comme une balise
# ouvrante et la suppression court jusqu'au « </ref> » suivant, avalant
# tout ce qui se trouve entre les deux. C'est ainsi que la sortie
# américaine de Kirby's Dream Land disparaissait.
    r"<ref[^>]*/>|<ref[^>/]*>.*?</ref>|<!--.*?-->|"
    r"\{\{\s*(?:cite[^{}]*|fact[^{}]*|efn[^{}]*|abbr\|[^{}]*|"
    r"sfn[^{}]*|r\|[^{}]*)\}\}|\[\[|\]\]",
    re.S | re.IGNORECASE)

# Une tete de section est un passage en gras. Deux pieges :
#  - le gras-italique s ecrit avec CINQ apostrophes, et « Balloon Kid » en
#    gras-italique n etait alors pas vu comme une tete ;
#  - de l italique A L INTERIEUR du gras — « Arcade (VS. Duck Hunt) » —
#    coupait la tete en deux, si bien que le segment de la NES courait
#    jusqu a la fin du champ et ramassait la date de la borne d arcade.
# On normalise donc les marqueurs avant de decouper, et la tete accepte
# l apostrophe simple (« Mike Tyson s Punch-Out!! »).
def _normaliser_gras(field):
    field = re.sub(r"'{5,}", "'''", field)
    return re.sub(r"(?<!')''(?!')", "", field)


_SEGMENT = re.compile(r"'''(.+?)'''")

# Toute plateforme, pas seulement les huit que nous suivons. Un champ
# decoupe par supports EST decoupe, meme si aucun n est le notre : il faut
# alors conclure « pas de sortie sur notre machine » et non « prends tout ».
_AUTRES_PLATEFORMES = [
    "arcade", "vs. system", "wii u", "wii", "gamecube", "nintendo ds", "3ds",
    "game boy color", "virtual console", "nintendo switch 2",
    "xbox", "windows", "pc", "ms-dos", "dos", "macos", "mac os", "linux",
    "ios", "android", "steam", "mega drive", "genesis", "master system",
    "game gear", "saturn", "dreamcast", "playstation 3", "playstation 4",
    "playstation 5", "ps3", "ps4", "ps5", "psp", "vita", "amiga", "atari",
    "commodore", "msx", "pc-88", "pc-98", "x1", "mz-1500", "sharp",
]


def _clean(s):
    return _NOISE.sub("", s).strip()


def _parse_date(raw):
    """« April 27, 1992 » -> (1992-04-27, day). « August 1992 » -> (1992-08, month)."""
    s = _clean(raw).replace("&nbsp;", " ")
    s = re.sub(r"\{\{[^{}]*\}\}", " ", s)
    # Retirer les balises DE TETE avant de tronquer a la premiere balise.
    # La troncature sert a ne pas lire la date qui SUIT un saut de ligne ;
    # appliquee telle quelle a une date precedee d'un <br/>, elle ne gardait
    # rien du tout.
    s = re.sub(r"^(?:\s*<[^>]*>)+", "", s)
    s = s.split("<")[0].strip(" ,;|")
    if not s:
        return None

    # « 22 May 2000 » autant que « May 22, 2000 » : les deux conventions
    # cohabitent selon la variete d'anglais de l'article.
    m = re.search(r"\b(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})", s)
    if m and m.group(2).lower() in MONTHS:
        return ("%04d-%02d-%02d" % (int(m.group(3)), MONTHS[m.group(2).lower()],
                                    int(m.group(1))), "day")

    m = re.search(r"([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})", s)
    if m and m.group(1).lower() in MONTHS:
        return ("%04d-%02d-%02d" % (int(m.group(3)), MONTHS[m.group(1).lower()],
                                    int(m.group(2))), "day")
    m = re.search(r"([A-Za-z]+)\s+(\d{4})", s)
    if m and m.group(1).lower() in MONTHS:
        return ("%04d-%02d" % (int(m.group(2)), MONTHS[m.group(1).lower()]), "month")
    m = re.search(r"\b(19[7-9]\d|20[0-2]\d)\b", s)
    if m:
        return (m.group(1), "year")
    return None


def _regions_de(code):
    """« NA/PAL » désigne DEUX régions.

    Les éditeurs écrivent ainsi quand un même disque sort des deux côtés.
    Le code combiné n'était dans aucune table, donc la sortie d'Oddworld
    n'existait ni en Amérique ni en Europe.
    """
    out = []
    for part in re.split(r"[/&+]", code):
        r = REGION.get(part.strip().upper())
        if r and r not in out:
            out.append(r)
    return out


# Conteneurs de mise en forme : ils PORTENT le contenu, ils ne sont pas du
# bruit. Les supprimer avec leur contenu effaçait la date de sortie de tous
# les titres Switch, dont l'infobox les emploie systématiquement.
_CONTENEURS = ("ubl", "unbulleted list", "collapsible list", "plainlist",
               "flatlist", "hlist", "nobold", "small", "nowrap", "center",
               "startflatlist", "endflatlist")


def _deplier(text):
    """Remplace « {{ubl|A|B}} » par « A|B », en respectant l'imbrication.

    Une expression régulière ne suffit pas : un conteneur peut envelopper un
    modèle de sortie, dont les accolades cassent tout découpage naïf. On
    balaie donc en comptant les accolades.
    """
    for _ in range(8):
        i, change = 0, False
        while i < len(text) - 1:
            if text[i:i + 2] != "{{":
                i += 1
                continue
            nom = re.match(r"\{\{\s*([A-Za-z][\w ]*)\s*[|}]", text[i:])
            if not nom or nom.group(1).strip().lower() not in _CONTENEURS:
                i += 2
                continue
            # Trouver la fermeture correspondante.
            prof, j = 0, i
            while j < len(text) - 1:
                if text[j:j + 2] == "{{":
                    prof += 1; j += 2
                elif text[j:j + 2] == "}}":
                    prof -= 1; j += 2
                    if prof == 0:
                        break
                else:
                    j += 1
            if prof:
                i += 2
                continue
            interieur = text[i + nom.end() - 1:j - 2]
            text = text[:i] + "|" + interieur + "|" + text[j:]
            change = True
        if not change:
            return text
    return text


def _est_plateforme(label):
    """Le libelle nomme-t-il UNE plateforme, la notre ou une autre ?"""
    bas = label.lower()
    return (any(n in bas for _, noms in PLATFORM_NAMES for n in noms)
            or any(n in bas for n in _AUTRES_PLATEFORMES))


def _segment_for(field, platform_key):
    """Isole la portion du champ qui concerne NOTRE plateforme.

    L'infobox liste les sorties support par support. Sans ce découpage, Super
    Mario Bros. récupérait la date européenne de la borne d'arcade (janvier
    1986) au lieu de celle de la NES (mai 1987), et Chrono Trigger la date PAL
    de la version DS (2009) au lieu de constater qu'il n'en a aucune sur Super
    Nintendo — ce qui est le fait intéressant.
    """
    field = _normaliser_gras(field)
    heads = list(_SEGMENT.finditer(field))
    if not heads:
        return field                      # un seul support : tout le champ

    wanted = dict(PLATFORM_NAMES)[platform_key]
    for i, h in enumerate(heads):
        label = h.group(1).strip().lower()
        mine = max((len(w) for w in wanted if w in label), default=0)
        if not mine:
            continue
        # …sauf si un autre support colle MIEUX, c'est-à-dire sur un libellé
        # plus long. Une comparaison booléenne ne suffisait pas : « nes » est
        # contenu dans « super nes », et la NES évinçait donc la Super NES de
        # son propre segment.
        rival = max((len(n) for k, names in PLATFORM_NAMES if k != platform_key
                     for n in names if n in label), default=0)
        if rival > mine:
            continue
        # Des plateformes enumerees cote a cote partagent la date qui suit la
        # DERNIERE d'entre elles : macOS, Switch, Windows puis « September 17,
        # 2020 ». S'arreter a la tete suivante rendait une virgule seule.
        j = i
        while (j + 1 < len(heads)
               and not re.search(r"\d", field[heads[j].end():heads[j + 1].start()])):
            j += 1
        end = heads[j + 1].start() if j + 1 < len(heads) else len(field)
        return field[heads[j].end():end]

    # Aucune tête ne désigne notre plateforme. Deux situations opposées, que
    # l'ancien code confondait en rendant None dans les deux cas :
    if any(_est_plateforme(h.group(1)) for h in heads):
        # …d'autres plateformes sont listées, pas la nôtre. C'est le fait
        # intéressant : Chrono Trigger n'a pas de sortie PAL sur Super NES.
        return None
    # …aucune tête n'est une plateforme. Ce sont des noms d'éditions ou le
    # titre du jeu — « Final Mix », « International », « Balloon Kid » en
    # gras-italique. Le champ entier nous concerne.
    return field


# Tout gabarit qui n'est PAS un vgrelease, et qui ne contient plus lui-même
# de gabarit. Appliqué en boucle, il dénoue l'imbrication de l'intérieur.
# Les alias du modèle de sortie. « vgr » et « vgrelease new » manquaient :
# ils étaient donc supprimés comme parasites, avec les dates qu'ils portaient.
_TPL_NOMS = r"vg ?releases?(?: +new)?|vgr|video game releases?"

_INNER_TPL = re.compile(
    r"\{\{(?!\s*(?:" + _TPL_NOMS + r")\s*\|)[^{}]*\}\}",
    re.IGNORECASE)


def _unnest(text):
    """Retire les gabarits parasites, y compris imbriqués.

    Sans cela, « {{vgrelease|JP|…|EU|May 15, 1987{{efn|…{{section link||…}}}}}} »
    se faisait couper à la PREMIÈRE accolade fermante, et la date européenne
    de Super Mario Bros. disparaissait — donnant à croire qu'il n'était pas
    sorti en Europe.
    """
    for _ in range(8):
        new = _INNER_TPL.sub("", text)
        if new == text:
            return text
        text = new
    return text


def parse_released(wikitext, platform_key=None):
    """-> {region: (date, precision)}, la plus ancienne gagnant par région."""
    wikitext = _NOISE.sub("", wikitext)
    m = _RELEASED.search(wikitext)
    if not m:
        return {}
    # Le dénouement s'applique AU CHAMP SEUL. Lancé sur le wikitexte entier,
    # il finissait par retirer l'infobox elle-même une fois ses gabarits
    # internes consommés — et le champ disparaissait avec elle.
    # Déplier AVANT de dénouer : les conteneurs portent le contenu, et
    # _unnest les supprimerait avec lui.
    field = _unnest(_deplier(m.group(1)))

    if platform_key:
        field = _segment_for(field, platform_key)
        if field is None:
            return {}

    out = {}
    for tpl in re.finditer(
            r"\{\{\s*(?:" + _TPL_NOMS + r")\s*\|(.+?)\}\}",
            field, re.S | re.IGNORECASE):
        parts = re.split(r"\|", tpl.group(1))
        i = 0
        while i < len(parts) - 1:
            regs = _regions_de(_clean(parts[i]))
            if regs:
                d = _parse_date(parts[i + 1])
                for reg in regs:
                    if d and (reg not in out or d[0] < out[reg][0]):
                        out[reg] = d
                i += 2
            else:
                i += 1

    if not out:                       # infobox sans gabarit : une date nue
        d = _parse_date(field)
        if d:
            # Sur une machine SANS ZONAGE, une date sans région n'est pas une
            # date de région inconnue : c'est la date mondiale. Les confondre
            # faisait perdre la sortie de tous les titres Switch, dont
            # l'infobox n'indique jamais de région parce qu'il n'y en a pas.
            out["WORLDWIDE" if platform_key in SANS_ZONAGE else "UNKNOWN"] = d
    return out
