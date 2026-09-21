# -*- coding: utf-8 -*-
"""Produit wp_dates.json depuis les wikitextes mis en cache.

⚠️ La clé est **(QID, plateforme)**, pas le QID seul.

L'analyse dépend de la plateforme : c'est elle qui choisit la section de
l'infobox. Indexer sur le QID seul faisait qu'une œuvre curée sur deux
machines n'avait qu'une entrée — celle écrite en dernier — et les deux
plateformes recevaient les mêmes dates. Bubble Bobble sur Game Boy héritait
ainsi du 30 octobre 1987, date du Famicom Disk System, alors que la Game Boy
est sortie en 1989.

C'est la même faute que le registre d'identifiants a connue : une clé trop
grossière fusionne deux choses distinctes, sans rien signaler.
"""
import json
import wp_dates as W

cache = json.load(open("wp_wikitextes.json"))
resolved = json.load(open("resolved.json"))

sortie, sans_dates = {}, []
for e in resolved:
    q, pf = e["qid"], e["platform"]
    entree = cache.get(q)
    if not entree or not entree["wikitexte"]:
        continue
    trouve = W.parse_released(entree["wikitexte"], pf)
    if not trouve:
        sans_dates.append((entree["titre"], pf))
        continue
    sortie["%s|%s" % (q, pf)] = {
        "platform": pf,
        "title": entree["titre"],
        "article": entree["article"],
        "regions": {k: {"date": v[0], "precision": v[1]} for k, v in trouve.items()},
    }

json.dump(sortie, open("wp_dates.json", "w"), ensure_ascii=False, indent=1)
print("entrées (œuvre, plateforme) : %d" % len(sortie))
print("couples (entrée, région)    : %d" % sum(len(v["regions"]) for v in sortie.values()))
print("sans date exploitable       : %d" % len(sans_dates))
for t, pf in sans_dates:
    print("   %-40s [%s]" % (t[:40], pf))
