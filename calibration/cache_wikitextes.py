# -*- coding: utf-8 -*-
"""Met en cache le wikitexte de l'infobox de chaque œuvre.

Rend le travail sur le parseur reproductible et hors ligne : sans cela,
chaque essai relance 221 requêtes, et le verdict change quand un
contributeur réécrit un article.
"""
import json, covers

d = json.load(open("../dataset/poc.json"))
qids = [w["provenance"]["external_id"] for w in d["works"]]
titres = {w["provenance"]["external_id"]: w["title"] for w in d["works"]}
links = covers.sitelinks(qids)

out = {}
for n, q in enumerate(qids, 1):
    if q not in links:
        out[q] = {"titre": titres[q], "article": None, "wikitexte": None}
        continue
    host, title = links[q]
    doc = covers.api(host, {"action": "parse", "page": title,
                            "prop": "wikitext", "section": 0, "format": "json"})
    out[q] = {"titre": titres[q],
              "article": "https://%s/wiki/%s" % (host, title.replace(" ", "_")),
              "wikitexte": ((doc.get("parse") or {}).get("wikitext") or {}).get("*") or ""}
    if n % 40 == 0:
        print("  %d/%d" % (n, len(qids)), flush=True)

json.dump(out, open("wp_wikitextes.json", "w"), ensure_ascii=False)
print("caché : %d, sans article : %d"
      % (len(out), sum(1 for v in out.values() if not v["article"])))
