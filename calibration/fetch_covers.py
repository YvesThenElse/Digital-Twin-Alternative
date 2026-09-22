"""Parcourt le dataset, récupère une jaquette par œuvre, journalise tout."""
import json, os, collections
import covers
import test_covers

d = json.load(open("../dataset/poc.json"))
works = d["works"]
qids = [w["provenance"]["external_id"] for w in works]
title_of = {w["provenance"]["external_id"]: w["title"] for w in works}
cid_of = {w["provenance"]["external_id"]: w["canonical_id"] for w in works}

os.makedirs(covers.OUT_DIR, exist_ok=True)
print("recherche des articles pour %d œuvres..." % len(qids), flush=True)
links = covers.sitelinks(qids)
print("articles trouvés : %d/%d" % (len(links), len(qids)), flush=True)

manifest, stats = {}, collections.Counter()
for n, q in enumerate(qids, 1):
    if q not in links:
        stats["sans_article"] += 1
        continue
    host, title = links[q]
    name = covers.infobox_image(host, title)
    if not name:
        stats["pas_de_champ_image"] += 1
        continue
    img = covers.thumbnail(host, name)
    if not img or not img.get("url"):
        stats["fichier_introuvable"] += 1
        continue
    lic = img
    ext = os.path.splitext(img["url"])[1].split("?")[0] or ".jpg"
    path = os.path.join(covers.OUT_DIR, cid_of[q] + ext)
    try:
        size = covers.download(img["url"], path)
    except Exception as e:
        stats["echec_telechargement"] += 1
        continue
    stats[lic["regime"]] += 1
    manifest[cid_of[q]] = {
        "work": cid_of[q], "title": title_of[q], "external_id": q,
        "file": os.path.basename(path), "bytes": size,
        # MESURÉES sur le fichier reçu, jamais reprises de `thumbwidth` :
        # le serveur arrondit et sert parfois l'original. Les 218 entrées du
        # manifeste portaient « 512 » pour des fichiers de 213 à 960 px.
        **dict(zip(("width", "height"),
                   test_covers.dimensions(open(path, "rb").read()) or (None, None))),
        "source_url": img["url"], "source_file": img.get("file"),
        "source_article": "https://%s/wiki/%s" % (host, title.replace(" ", "_")),
        "licence": lic.get("licence"), "regime": lic["regime"],
        "description_url": lic.get("description_url"),
    }
    if n % 25 == 0:
        print("  %d/%d" % (n, len(qids)), flush=True)

json.dump(manifest, open("../dataset/covers/MANIFEST.json", "w"),
          indent=1, ensure_ascii=False)
print()
print("couverture : %d/%d (%.0f%%)" % (len(manifest), len(works),
                                       100.0 * len(manifest) / len(works)))
for k, v in stats.most_common():
    print("   %-22s %d" % (k, v))
total = sum(m["bytes"] for m in manifest.values())
print("   poids total            %.1f Mo" % (total / 1e6))
