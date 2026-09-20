"""Applique l'arbitrage manuel au résidu, et refuse de le taire.

Une entrée du résidu qui n'a pas d'arbitrage reste dans flagged.json. Elle
n'entre pas dans le dataset et elle n'est pas oubliée : c'est la différence
entre un référentiel qui connaît ses trous et un qui les ignore.
"""
import json
from arbitration import ARBITRATION


def main():
    resolved = json.load(open("resolved.json"))
    residue = json.load(open("flagged.json"))

    # Calcule AVANT la boucle : celle-ci réécrit f["title"] pour les entrées
    # dont l'arbitrage corrige le titre canonique, et comparer après ferait
    # passer ces arbitrages-là pour inutilisés.
    used = {(f["platform"], f["title"]) for f in residue}

    accepted, retyped, absent, unhandled = [], [], [], []

    for f in residue:
        key = (f["platform"], f["title"])
        a = ARBITRATION.get(key)
        if not a:
            unhandled.append(f)
            continue

        if a["verdict"] == "ACCEPT":
            f["qid"] = a["qid"]
            f["year"] = a.get("year", f["year"])
            f["title"] = a.get("title", f["title"])
            f["verification"] = "arbitrated"
            f["arbitration"] = a["why"]
            accepted.append(f)
        elif a["verdict"] == "RETYPE":
            f["arbitration"] = a["why"]
            f["concept"] = a["concept"]
            f["qid"] = a.get("qid")
            retyped.append(f)
        else:
            f["arbitration"] = a["why"]
            absent.append(f)

    json.dump(resolved + accepted, open("resolved.json", "w"),
              indent=1, ensure_ascii=False)
    json.dump({"absent": absent, "retyped": retyped, "unhandled": unhandled},
              open("gaps.json", "w"), indent=1, ensure_ascii=False)

    # Un arbitrage devenu inutile doit se voir : soit l'outillage s'est
    # amélioré et l'entrée se résout seule, soit la source a changé. Dans les
    # deux cas la note doit être relue, pas laissée à traîner.
    stale = [k for k in ARBITRATION if k not in used]

    print("arbitrés et retenus : %d" % len(accepted))
    print("absents de la source : %d" % len(absent))
    print("reclassés (pas une œuvre) : %d" % len(retyped))
    print("NON TRAITÉS : %d" % len(unhandled))
    for f in unhandled:
        print("   ⚠ %-7s %s" % (f["platform"], f["title"]))
    if stale:
        print("\narbitrages devenus inutiles (à relire) : %d" % len(stale))
        for pf, title in stale:
            print("   · %-7s %s" % (pf, title))
    print("\ntotal retenu : %d œuvres" % (len(resolved) + len(accepted)))


if __name__ == "__main__":
    main()
