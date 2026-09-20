"""Récupère les dates régionales Wikipédia, les valide, puis les applique.

Étape 1 — validation : sur les œuvres dont Wikidata donne déjà une date
rattachée à la plateforme, on compare. C'est ce qui autorise (ou non) à faire
confiance à la source sur les autres.
"""
import json, collections
import covers, wp_dates

d = json.load(open("../dataset/poc.json"))
res = {e["qid"]: e for e in json.load(open("resolved.json"))}

qids = [w["provenance"]["external_id"] for w in d["works"]]
print("articles…", flush=True)
links = covers.sitelinks(qids)

out, stats = {}, collections.Counter()
for n, w in enumerate(d["works"], 1):
    q = w["provenance"]["external_id"]
    if q not in links:
        stats["sans_article"] += 1
        continue
    host, title = links[q]
    doc = covers.api(host, {"action": "parse", "page": title,
                            "prop": "wikitext", "section": 0, "format": "json"})
    text = ((doc.get("parse") or {}).get("wikitext") or {}).get("*") or ""
    pf = res[q]["platform"]
    parsed = wp_dates.parse_released(text, pf)
    if parsed:
        out[q] = {"platform": pf, "title": w["title"],
                  "article": "https://%s/wiki/%s" % (host, title.replace(" ", "_")),
                  "regions": {k: {"date": v[0], "precision": v[1]}
                              for k, v in parsed.items()}}
        stats["avec_dates"] += 1
    else:
        stats["sans_dates"] += 1
    if n % 40 == 0:
        print("  %d/%d" % (n, len(d["works"])), flush=True)

json.dump(out, open("wp_dates.json", "w"), indent=1, ensure_ascii=False)

# --- validation contre Wikidata -------------------------------------------
agree = disagree = only_wp = 0
deltas = []
for w in d["works"]:
    q = w["provenance"]["external_id"]
    if w["verification"]["date_basis"] != "platform_qualified" or q not in out:
        continue
    wd = {}
    for r in w["releases"]:
        if r["region"] and (r["region"] not in wd or r["date"] < wd[r["region"]]):
            wd[r["region"]] = r["date"]
    for reg, v in out[q]["regions"].items():
        if reg in wd:
            a, b = wd[reg][:4], v["date"][:4]
            if a == b:
                agree += 1
            else:
                disagree += 1
                deltas.append((w["title"], reg, wd[reg], v["date"]))
        else:
            only_wp += 1

print()
for k, v in stats.most_common():
    print("   %-16s %d" % (k, v))
print()
tot = agree + disagree
print("VALIDATION sur les régions présentes des deux côtés : %d" % tot)
print("   même année      %d (%.0f%%)" % (agree, 100.0 * agree / max(tot, 1)))
print("   désaccord       %d" % disagree)
print("   régions que SEUL Wikipédia donne : %d" % only_wp)
for t, r, a, b in deltas[:12]:
    print("      %-38s %-7s wikidata %s  wp %s" % (t[:38], r, a, b))
