"""Deuxième passe : désambiguïser par libellé exact, isoler le résidu.

La première passe retient un candidat s'il est sur la bonne plateforme et
qu'une de ses dates tombe à ±1 an. Cela laisse passer les suites (sorties
l'année suivante) et les doublons de la source.

Cette passe applique deux règles, dans l'ordre :

  1. le libellé anglais est EXACTEMENT le titre curé ;
  2. parmi ceux-là, la plus ancienne année de publication est l'année curée.

Ce qui survit aux deux règles sans être unique est un **vrai doublon** de la
source, et relève du jugement humain — pas d'une règle supplémentaire qu'on
ajouterait jusqu'à ce que le résultat plaise.
"""
import json, re, unicodedata


def norm(s):
    if not s:
        return ""
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", "", s.lower())


def main():
    flagged = json.load(open("flagged.json"))
    resolved = json.load(open("resolved.json"))

    still, gained = [], []
    for f in flagged:
        target = norm(f["title"])
        exact = [m for m in f.get("matches", []) if norm(m["label"]) == target]

        if len(exact) > 1:
            by_year = [m for m in exact if m["years"] and min(m["years"]) == f["year"]]
            if len(by_year) == 1:
                exact = by_year

        if len(exact) == 1:
            f["qid"] = exact[0]["qid"]
            f["label"] = exact[0]["label"]
            f["verification"] = "exact_label"
            gained.append(f)
        else:
            f["residue"] = ("doublon dans la source" if len(exact) > 1
                            else ("introuvable" if not f.get("matches")
                                  else "aucun libellé exact"))
            f["exact"] = exact
            still.append(f)

    json.dump(resolved + gained, open("resolved.json", "w"), indent=1, ensure_ascii=False)
    json.dump(still, open("flagged.json", "w"), indent=1, ensure_ascii=False)

    total = len(resolved) + len(gained) + len(still)
    print("passe 1 : %d résolus" % len(resolved))
    print("passe 2 : %d de plus par libellé exact" % len(gained))
    print("résidu  : %d (%.0f%%) — jugement humain requis\n" % (
        len(still), 100.0 * len(still) / total))

    from collections import Counter
    for reason, n in Counter(f["residue"] for f in still).most_common():
        print("  %-26s %d" % (reason, n))
    print()
    for f in still:
        cands = f.get("exact") or f.get("matches") or []
        print("  %-7s %-42s %-24s %s" % (
            f["platform"], f["title"][:42], f["residue"],
            " ".join("%s(%s)" % (c["qid"], min(c["years"]) if c["years"] else "?")
                     for c in cands[:4])))


if __name__ == "__main__":
    main()
