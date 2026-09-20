"""Pull, for each sampled game, exactly the fields the domain model requires.

Work      : titre canonique, alias, studio, éditeur, genres, série
Release   : plateforme, region, date  <- P577 qualifié par P291
Visuel    : P18
"""
import json, wd

# region qualifier values we care about, mapped to the model's Region
REGION = {
    "Q30":    "NTSC-U",   # United States
    "Q17":    "NTSC-J",   # Japan
    "Q183":   "PAL",      # Germany
    "Q142":   "PAL",      # France
    "Q145":   "PAL",      # United Kingdom
    "Q46":    "PAL",      # Europe
    "Q408":   "PAL",      # Australia
    "Q258":   "PAL",      # South Africa
    "Q16":    "NTSC-U",   # Canada
}

QUERY = """
SELECT ?g ?prop ?val ?valLabel ?qual ?qualLabel WHERE {
  VALUES ?g { %s }
  {
    ?g p:P577 ?st .
    ?st ps:P577 ?val .
    BIND("date" AS ?prop)
    OPTIONAL { ?st pq:P291 ?qual }
  } UNION {
    VALUES (?p ?prop) { (wdt:P178 "developer") (wdt:P123 "publisher")
                        (wdt:P136 "genre") (wdt:P179 "series")
                        (wdt:P400 "platform") (wdt:P18 "image") }
    ?g ?p ?val .
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
}
"""

LABELS = """
SELECT ?g ?l ?a WHERE {
  VALUES ?g { %s }
  OPTIONAL { ?g rdfs:label ?l . FILTER(LANG(?l) IN ("en","fr","ja")) }
  OPTIONAL { ?g skos:altLabel ?a . FILTER(LANG(?a) IN ("en","fr","ja")) }
}
"""


def fetch(qids):
    vals = " ".join("wd:" + q for q in qids)
    games = {q: {"qid": q, "labels": {}, "aliases": [], "dates": [],
                 "developer": [], "publisher": [], "genre": [], "series": [],
                 "platform": [], "image": []} for q in qids}

    for b in wd.sparql(LABELS % vals):
        g = games[wd.qid(b)]
        if "l" in b:
            g["labels"][b["l"]["xml:lang"]] = b["l"]["value"]
        if "a" in b:
            a = (b["a"]["xml:lang"], b["a"]["value"])
            if a not in g["aliases"]:
                g["aliases"].append(a)

    for b in wd.sparql(QUERY % vals):
        g = games[wd.qid(b)]
        prop = b["prop"]["value"]
        if prop == "date":
            qual = b["qual"]["value"].rsplit("/", 1)[1] if "qual" in b else None
            rec = {"date": b["val"]["value"][:10].lstrip("+"),
                   "place_qid": qual,
                   "place": b.get("qualLabel", {}).get("value"),
                   "region": REGION.get(qual)}
            if rec not in g["dates"]:
                g["dates"].append(rec)
        else:
            v = b.get("valLabel", {}).get("value") or b["val"]["value"]
            if prop == "image":
                v = b["val"]["value"]
            if v not in g[prop]:
                g[prop].append(v)
    return games


if __name__ == "__main__":
    import sys
    qids = json.load(open(sys.argv[1]))
    out = fetch(qids)
    json.dump(out, open(sys.argv[2], "w"), indent=1, ensure_ascii=False)
    print("%d entrées -> %s" % (len(out), sys.argv[2]))
