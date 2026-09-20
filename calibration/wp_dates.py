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

_SEGMENT = re.compile(r"'''([^']+)'''")


def _clean(s):
    return _NOISE.sub("", s).strip()


def _parse_date(raw):
    """« April 27, 1992 » -> (1992-04-27, day). « August 1992 » -> (1992-08, month)."""
    s = _clean(raw).replace("&nbsp;", " ")
    s = re.sub(r"\{\{[^{}]*\}\}", " ", s)
    s = s.split("<")[0].strip(" ,;|")
    if not s:
        return None

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


def _segment_for(field, platform_key):
    """Isole la portion du champ qui concerne NOTRE plateforme.

    L'infobox liste les sorties support par support. Sans ce découpage, Super
    Mario Bros. récupérait la date européenne de la borne d'arcade (janvier
    1986) au lieu de celle de la NES (mai 1987), et Chrono Trigger la date PAL
    de la version DS (2009) au lieu de constater qu'il n'en a aucune sur Super
    Nintendo — ce qui est le fait intéressant.
    """
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
        end = heads[i + 1].start() if i + 1 < len(heads) else len(field)
        return field[h.end():end]
    return None                           # la plateforme n'est pas listée


# Tout gabarit qui n'est PAS un vgrelease, et qui ne contient plus lui-même
# de gabarit. Appliqué en boucle, il dénoue l'imbrication de l'intérieur.
_INNER_TPL = re.compile(
    r"\{\{(?!\s*(?:vg ?release|video game release)\b)[^{}]*\}\}",
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
    field = _unnest(m.group(1))

    if platform_key:
        field = _segment_for(field, platform_key)
        if field is None:
            return {}

    out = {}
    for tpl in re.finditer(
            r"\{\{\s*(?:vg ?release|video game release)\s*\|(.+?)\}\}",
            field, re.S | re.IGNORECASE):
        parts = re.split(r"\|", tpl.group(1))
        i = 0
        while i < len(parts) - 1:
            reg = REGION.get(_clean(parts[i]).upper().strip())
            if reg:
                d = _parse_date(parts[i + 1])
                if d and (reg not in out or d[0] < out[reg][0]):
                    out[reg] = d
                i += 2
            else:
                i += 1

    if not out:                       # infobox sans gabarit : une date nue
        d = _parse_date(field)
        if d:
            out["UNKNOWN"] = d
    return out
