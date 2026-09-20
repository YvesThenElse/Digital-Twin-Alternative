"""Pull, for each sampled game, exactly the fields the domain model requires.

Work      : titre canonique, alias, studio, éditeur, genres, série
Release   : plateforme, region, date  <- P577 qualifié par P291
Visuel    : P18
"""
import json, wd

# Qualificateurs de lieu -> Region du modele (PAL / NTSC-U / NTSC-J).
#
# La premiere version de cette table omettait Q49 (Amerique du Nord), qui est
# le qualificateur LE PLUS frequent, et Q2729044 (zone PAL). Elle sous-estimait
# donc la couverture regionale de la source. Toute omission ici se lit comme
# une absence de donnee, ce qui est le pire mode de defaillance : la table doit
# etre revue quand un qualificateur inconnu apparait, pas ignoree.
REGION = {
    # NTSC-J
    "Q17":      "NTSC-J",    # Japon
    # NTSC-U
    "Q49":      "NTSC-U",    # Amerique du Nord
    "Q30":      "NTSC-U",    # Etats-Unis
    "Q16":      "NTSC-U",    # Canada
    "Q96":      "NTSC-U",    # Mexique
    # PAL
    "Q2729044": "PAL",       # zone PAL
    "Q46":      "PAL",       # Europe
    "Q458":     "PAL",       # Union europeenne
    "Q142":     "PAL",       # France
    "Q183":     "PAL",       # Allemagne
    "Q145":     "PAL",       # Royaume-Uni
    "Q38":      "PAL",       # Italie
    "Q29":      "PAL",       # Espagne
    "Q55":      "PAL",       # Pays-Bas
    "Q34":      "PAL",       # Suede
    "Q20":      "PAL",       # Norvege
    "Q35":      "PAL",       # Danemark
    "Q33":      "PAL",       # Finlande
    "Q31":      "PAL",       # Belgique
    "Q39":      "PAL",       # Suisse
    "Q40":      "PAL",       # Autriche
    "Q45":      "PAL",       # Portugal
    "Q27":      "PAL",       # Irlande
    "Q408":     "PAL",       # Australie
    "Q664":     "PAL",       # Nouvelle-Zelande
    "Q258":     "PAL",       # Afrique du Sud
}

# Sorties mondiales simultanees : les trois regions a la fois.
WORLDWIDE = {"Q13780930"}

# Volontairement absents : la Coree du Sud (Q884) et les autres marches qui
# ne se rangent dans aucune des trois regions du modele. Les forcer
# inventerait une donnee ; les laisser vides la signale.

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
                   "region": "WORLDWIDE" if qual in WORLDWIDE else REGION.get(qual)}
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
