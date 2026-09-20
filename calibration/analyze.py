"""Completeness report over the calibration sample, field by field.

What matters is not "does Wikidata have the game" (it does) but "does it have
the fields the model requires" — and above all a *region-qualified* release date.
"""
import json, sys

data = json.load(open(sys.argv[1]))
strata = json.load(open(sys.argv[2]))   # {"head": [...qids], "tail": [...qids]}


def has_region(g):
    return any(d["region"] for d in g["dates"])


def region_set(g):
    return sorted({d["region"] for d in g["dates"] if d["region"]})


CHECKS = [
    ("titre en",        lambda g: "en" in g["labels"]),
    ("titre fr",        lambda g: "fr" in g["labels"]),
    ("titre ja",        lambda g: "ja" in g["labels"]),
    ("alias",           lambda g: bool(g["aliases"])),
    ("une date",        lambda g: bool(g["dates"])),
    ("date régionale",  has_region),
    ("3 régions",       lambda g: len(region_set(g)) >= 3),
    ("studio",          lambda g: bool(g["developer"])),
    ("éditeur",         lambda g: bool(g["publisher"])),
    ("genre",           lambda g: bool(g["genre"])),
    ("série",           lambda g: bool(g["series"])),
    ("image",           lambda g: bool(g["image"])),
]

print("%-16s %14s %14s %14s" % ("champ", "tête (n=%d)" % len(strata["head"]),
                                "traîne (n=%d)" % len(strata["tail"]), "total"))
print("-" * 62)
rows = []
for name, fn in CHECKS:
    h = sum(1 for q in strata["head"] if q in data and fn(data[q]))
    t = sum(1 for q in strata["tail"] if q in data and fn(data[q]))
    n = len(strata["head"]) + len(strata["tail"])
    rows.append((name, h, t))
    print("%-16s %8d %4.0f%% %8d %4.0f%% %8d %4.0f%%" % (
        name, h, 100.0 * h / len(strata["head"]),
        t, 100.0 * t / len(strata["tail"]),
        h + t, 100.0 * (h + t) / n))

print("\n--- détail par entrée ---")
for stratum in ("head", "tail"):
    for q in strata[stratum]:
        g = data.get(q)
        if not g:
            print("%-5s %-10s MANQUANT" % (stratum, q))
            continue
        title = g["labels"].get("en") or g["labels"].get("fr") or "?"
        regions = region_set(g) or ["—"]
        print("%-6s %-11s %-44s dates=%-2d régions=%-18s img=%s ja=%s" % (
            stratum, q, title[:44], len(g["dates"]), ",".join(regions),
            "o" if g["image"] else "n",
            "o" if "ja" in g["labels"] else "n"))
