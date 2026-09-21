# -*- coding: utf-8 -*-
"""Complète le manifeste des jaquettes, sans retélécharger l'existant.

`fetch_covers.py` reconstruit le manifeste entier. Le rejouer pour quatre
œuvres retéléchargerait 217 fichiers et écraserait les corrections apportées
à la main — notamment le report d'une entrée orpheline à travers la table de
redirection.

Ce script ne touche qu'aux œuvres SANS jaquette, et lit le nom du fichier
dans le wikitexte déjà mis en cache (redirections suivies).
"""
import json, os, re
import covers

d = json.load(open("../dataset/poc.json"))
cache = json.load(open("wp_wikitextes.json"))
chemin = "../dataset/covers/MANIFEST.json"
manifeste = json.load(open(chemin))

_IMAGE = re.compile(r"^\s*\|\s*(?:image|cover|image_?file|boxart)\s*=\s*(?:\[\[)?([^\n|\]]+)",
                    re.M | re.I)

manquantes = [w for w in d["works"] if w["canonical_id"] not in manifeste]
print("œuvres sans jaquette : %d" % len(manquantes))

for w in manquantes:
    q = w["provenance"]["external_id"]
    e = cache.get(q) or {}
    texte, article = e.get("wikitexte"), e.get("article")
    if not texte:
        # Un article rattaché mais pas de texte : la redirection visait une
        # SECTION d'un article plus large, et on l'a refusée — on y prendrait
        # la jaquette d'une autre œuvre.
        raison = ("redirection vers une section, refusée" if article
                  else "aucun article rattaché")
        print("  %-34s %s" % (w["title"][:34], raison))
        continue
    m = _IMAGE.search(texte)
    if not m:
        print("  %-34s infobox sans champ image" % w["title"][:34])
        continue
    fichier = m.group(1).strip()
    host = "en.wikipedia.org" if "/en." in (article or "") else "fr.wikipedia.org"
    v = covers.thumbnail(host, fichier)
    if not v or not v.get("url"):
        print("  %-34s vignette indisponible (%s)" % (w["title"][:34], fichier))
        continue
    ext = os.path.splitext(fichier)[1].lower() or ".png"
    dest = os.path.join(covers.OUT_DIR, w["canonical_id"] + ext)
    octets = covers.download(v["url"], dest)
    manifeste[w["canonical_id"]] = {
        "work": w["canonical_id"], "title": w["title"], "external_id": q,
        "file": os.path.basename(dest), "bytes": octets,
        "width": v["width"], "height": v["height"],
        "source_url": v["url"], "source_file": fichier, "source_article": article,
        "licence": v["licence"], "regime": v["regime"],
        "description_url": v["description_url"],
    }
    print("  %-34s OK  %s (%d o)" % (w["title"][:34], fichier[:40], octets))

json.dump(manifeste, open(chemin, "w"), ensure_ascii=False, indent=1)
print("\nmanifeste : %d jaquettes sur %d œuvres" % (len(manifeste), len(d["works"])))
