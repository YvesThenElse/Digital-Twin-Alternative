# -*- coding: utf-8 -*-
"""Met en cache le wikitexte de l'infobox de chaque œuvre.

Rend le travail sur le parseur reproductible et hors ligne : sans cela,
chaque essai relance 221 requêtes, et le verdict change quand un
contributeur réécrit un article.
"""
import json, re
import covers

# Un lien Wikidata peut viser une page de REDIRECTION, dont la section 0 ne
# contient ni infobox, ni date, ni jaquette. Trois œuvres étaient dans ce cas
# et comptaient pour des donnees manquantes.
#
# Mais suivre la redirection n est juste que si elle vise l ARTICLE DE LA
# MEME ŒUVRE. « Mario Kart 8 Deluxe » redirige vers une SECTION de « Mario
# Kart 8 » : on y prendrait la jaquette du jeu Wii U. « Pokemon Yellow »
# redirige vers une section de « Pokemon Red, Blue, and Yellow » : on y
# prendrait les dates de Rouge/Bleu, fausses pour Jaune. Une redirection vers
# une section decrit un SUJET PLUS LARGE, et on la refuse.
_REDIRECT = re.compile(r"#\s*redirect\s*\[\[([^\]]+)\]\]", re.I)


def suivre(host, titre, texte):
    """(titre final, wikitexte) apres redirection, ou (titre, None) si refusee."""
    m = _REDIRECT.match((texte or "").strip())
    if not m:
        return titre, texte
    cible = m.group(1).strip()
    if "#" in cible:
        return titre, None            # redirection vers une section : refusee
    doc = covers.api(host, {"action": "parse", "page": cible, "prop": "wikitext",
                            "section": 0, "format": "json"})
    return cible, ((doc.get("parse") or {}).get("wikitext") or {}).get("*") or None


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
    texte = ((doc.get("parse") or {}).get("wikitext") or {}).get("*") or ""
    title, texte = suivre(host, title, texte)
    out[q] = {"titre": titres[q],
              "article": "https://%s/wiki/%s" % (host, title.replace(" ", "_")),
              "wikitexte": texte or ""}
    if n % 40 == 0:
        print("  %d/%d" % (n, len(qids)), flush=True)

json.dump(out, open("wp_wikitextes.json", "w"), ensure_ascii=False)
print("caché : %d, sans article : %d"
      % (len(out), sum(1 for v in out.values() if not v["article"])))
