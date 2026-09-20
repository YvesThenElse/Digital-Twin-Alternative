"""Affiche les entrées à arbitrer — l'acte humain que l'automatisation ne clôt pas."""
import json, sys
flagged = json.load(open("flagged.json"))
for f in flagged:
    print("\n%-7s %-46s attendu %d  [%s]" % (f["platform"], f["title"], f["year"], f["reason"]))
    for c in f.get("matches") or []:
        print("      CONCORDE %-11s %-44s %s" % (c["qid"], (c["label"] or "?")[:44], c["years"]))
    for c in f.get("near", []):
        mark = "sur-plateforme" if c["on_platform"] else "hors-plateforme"
        print("      candidat %-11s %-44s %-16s %s" % (c["qid"], (c["label"] or "?")[:44], mark, c["years"][:6]))
print("\n%d entrées à arbitrer" % len(flagged))
