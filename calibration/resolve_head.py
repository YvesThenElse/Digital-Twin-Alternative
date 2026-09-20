import json, urllib.parse, urllib.request, wd

HEAD = {
 'snes': ['Super Mario World', 'The Legend of Zelda: A Link to the Past',
          'Super Metroid', 'Chrono Trigger', 'Donkey Kong Country'],
 'ps1' : ['Final Fantasy VII', 'Metal Gear Solid', 'Resident Evil',
          'Gran Turismo', 'Crash Bandicoot'],
 'gb'  : ['Tetris', 'Super Mario Land', "Kirby's Dream Land",
          "The Legend of Zelda: Link's Awakening", 'Pokemon Red and Blue'],
}

def search(term, limit=8):
    url = ("https://www.wikidata.org/w/api.php?" + urllib.parse.urlencode(
        {"action": "wbsearchentities", "search": term, "language": "en",
         "type": "item", "limit": limit, "format": "json"}))
    req = urllib.request.Request(url, headers={"User-Agent": wd.UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r).get("search", [])

# candidates from search, then confirm platform membership in ONE small query
cands, meta = set(), {}
for pf, titles in HEAD.items():
    for t in titles:
        for hit in search(t):
            cands.add(hit["id"])
            meta.setdefault(hit["id"], (pf, t, hit.get("label"), hit.get("description", "")))

vals = " ".join("wd:" + q for q in sorted(cands))
rows = wd.sparql("""SELECT ?g ?p WHERE { VALUES ?g { %s }
                    ?g wdt:P31 wd:Q7889 ; wdt:P400 ?p }""" % vals)
onplat = {}
for b in rows:
    onplat.setdefault(wd.qid(b), set()).add(wd.qid(b, "p"))

PFQ = {k: v[0] for k, v in wd.PLATFORMS.items()}
head = {}
for pf, titles in HEAD.items():
    for t in titles:
        pick = [q for q in sorted(cands)
                if meta[q][0] == pf and meta[q][1] == t
                and PFQ[pf] in onplat.get(q, set())]
        head.setdefault(pf, {})[t] = pick[0] if pick else None
        print("%-5s %-40s %s   %s" % (pf, t, pick[0] if pick else "*** NON RESOLU ***",
                                      meta[pick[0]][3][:40] if pick else ""))
json.dump(head, open("head.json", "w"), indent=1, ensure_ascii=False)
