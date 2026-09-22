"""Reprend les jaquettes qui violent la condition 1 de §3.3 (512 px au plus).

Pourquoi ce script existe : `fetch_covers.py` inscrivait au manifeste la
largeur **annoncée par l'API** (`thumbwidth`), jamais celle du fichier reçu.
Les 218 visuels portaient donc `width: 512` alors qu'ils mesurent 213 à
960 px. Ici on fait l'inverse — on télécharge, **puis on mesure**, et on
refuse ce qui dépasse.

    python3 calibration/reprendre_covers.py            # liste sans rien changer
    python3 calibration/reprendre_covers.py --ecrire   # reprend et met à jour
"""
import json
import os
import sys
import urllib.parse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import covers
from test_covers import COVERS, LARGEUR_MAX, MANIFESTE, dimensions


def hote_de(article: str) -> str:
    """« https://en.wikipedia.org/wiki/X » → « en.wikipedia.org »."""
    return urllib.parse.urlparse(article).netloc


def reprendre(ecrire: bool) -> int:
    manifeste = json.loads(MANIFESTE.read_text())
    fautifs = {
        cle: e for cle, e in manifeste.items()
        if (d := dimensions((COVERS / e["file"]).read_bytes())) and d[0] > LARGEUR_MAX
    }
    if not fautifs:
        print("Aucun visuel ne dépasse %d px." % LARGEUR_MAX)
        return 0

    print("%d visuel(s) à reprendre :" % len(fautifs))
    for cle, e in fautifs.items():
        print("  %s — %s (%d px)" % (e["title"], e["file"], e["width"]))
    if not ecrire:
        print("\n(relancer avec --ecrire pour reprendre)")
        return 1

    repris = 0
    for cle, e in fautifs.items():
        hote = hote_de(e.get("source_article") or "")
        nom = e.get("source_file")
        if not hote or not nom:
            print("  ✗ %s : origine incomplète, reprise impossible" % cle)
            continue

        img = covers.thumbnail(hote, nom)
        if not img or not img.get("url"):
            print("  ✗ %s : vignette introuvable" % cle)
            continue

        # On écrit d'abord à côté : un fichier de remplacement plus large que
        # l'original ne doit pas écraser ce qu'il devait corriger.
        provisoire = COVERS / (e["file"] + ".nouveau")
        taille = covers.download(img["url"], str(provisoire))
        mesure = dimensions(provisoire.read_bytes())

        if mesure is None or mesure[0] > LARGEUR_MAX:
            provisoire.unlink(missing_ok=True)
            print("  ✗ %s : la vignette obtenue fait %s — refusée"
                  % (cle, "illisible" if mesure is None else "%d px" % mesure[0]))
            continue

        provisoire.replace(COVERS / e["file"])
        # MESURÉ, jamais annoncé. C'est toute la différence.
        e["width"], e["height"] = mesure
        e["bytes"] = taille
        e["source_url"] = img["url"]
        repris += 1
        print("  ✓ %s : %d×%d, %d octets" % (cle, mesure[0], mesure[1], taille))

    if repris:
        MANIFESTE.write_text(json.dumps(manifeste, ensure_ascii=False, indent=2) + "\n")
    print("\n%d repris sur %d." % (repris, len(fautifs)))
    return 0 if repris == len(fautifs) else 1


if __name__ == "__main__":
    sys.exit(reprendre("--ecrire" in sys.argv))
