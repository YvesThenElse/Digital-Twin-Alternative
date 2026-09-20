"""Résout la liste curée contre Wikidata, avec vérification d'année.

La calibration a montré que le premier résultat de recherche pointe vers le
mauvais jeu une fois sur trois, toujours vers une suite du titre demandé.
La parade est ici : un candidat n'est retenu que s'il est sur la plateforme
attendue ET qu'une de ses dates de publication tombe à ±1 an de l'année
curée. Tout le reste est signalé, jamais retenu en silence.
"""
import json, time, urllib.parse, urllib.request
import wd
from curated import CURATED, PLATFORMS

TOLERANCE = 1          # années
SEARCH_LIMIT = 20      # 10 ne suffisait pas : la recherche apparie sur le
                       # préfixe, et « Contra » ramenait d'abord « contract
                       # bridge » et « contrast agent ».

# Types acceptés comme œuvre. La liste est explicite et doit le rester :
# l'élargir est une décision, pas un réglage.
#
#   Q7889        jeu vidéo
#   Q116774927   « Pokémon paired versions » — une sortie vendue en deux
#                références pour une même œuvre. Ce n'est pas une anomalie de
#                la source, c'est un concept qu'elle nomme, et le joueur dit
#                « j'ai eu Rouge », jamais « j'ai eu Rouge et Bleu ».
#   Q116774997   les remakes de ces paires, même raisonnement.
#
# Restent exclus : série (Q7058673), franchise, contenu téléchargeable.
WORK_TYPES = {"Q7889", "Q116774927", "Q116774997"}


_CACHE_PATH = "search_cache.json"
try:
    _CACHE = json.load(open(_CACHE_PATH))
except Exception:
    _CACHE = {}


def search(term):
    if term in _CACHE:
        return _CACHE[term]
    url = "https://www.wikidata.org/w/api.php?" + urllib.parse.urlencode(
        {"action": "wbsearchentities", "search": term, "language": "en",
         "type": "item", "limit": SEARCH_LIMIT, "format": "json"})
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": wd.UA})
            with urllib.request.urlopen(req, timeout=30) as r:
                hits = json.load(r).get("search", [])
            _CACHE[term] = hits
            json.dump(_CACHE, open(_CACHE_PATH, "w"))
            return hits
        except Exception:
            time.sleep(2 * (attempt + 1))
    return []


def chunks(seq, n):
    for i in range(0, len(seq), n):
        yield seq[i:i + n]


def verify(qids):
    """Pour chaque candidat : plateformes et années de publication."""
    info = {q: {"platforms": set(), "years": set(), "label": None,
                "is_game": False} for q in qids}
    for batch in chunks(sorted(qids), 180):
        vals = " ".join("wd:" + q for q in batch)
        rows = wd.sparql("""SELECT ?g ?p ?d ?l ?t WHERE { VALUES ?g { %s }
            OPTIONAL { ?g wdt:P400 ?p }
            OPTIONAL { ?g wdt:P577 ?d }
            OPTIONAL { ?g wdt:P31 ?t }
            OPTIONAL { ?g rdfs:label ?l FILTER(LANG(?l)="en") } }""" % vals)
        for b in rows:
            q = wd.qid(b)
            if "p" in b:
                info[q]["platforms"].add(wd.qid(b, "p"))
            if "d" in b:
                # Wikidata exprime « valeur inconnue » par un nœud, pas une date.
                v = b["d"]["value"].lstrip("+")
                if b["d"]["type"] == "literal" and v[:4].isdigit():
                    info[q]["years"].add(int(v[:4]))
            if "t" in b and wd.qid(b, "t") in WORK_TYPES:
                info[q]["is_game"] = True
            if "l" in b:
                info[q]["label"] = b["l"]["value"]
    return info


def main():
    # 1. rassembler les candidats
    wanted, cands = [], set()
    for pf, titles in CURATED.items():
        for rank, (title, year) in enumerate(titles, start=1):
            hits = search(title)
            ids = [h["id"] for h in hits]
            cands.update(ids)
            wanted.append({"platform": pf, "title": title, "year": year,
                           "notability": rank, "candidates": ids})
        print("%-7s %3d titres cherchés" % (pf, len(titles)), flush=True)

    print("%d candidats distincts à vérifier" % len(cands), flush=True)
    info = verify(cands)

    # 2. filtrer sur plateforme + année
    resolved, flagged = [], []
    for w in wanted:
        pq = PLATFORMS[w["platform"]][0]
        # Le filtre P31 n'est pas une commodité : Wikidata porte l'item SÉRIE
        # et l'item JEU sous le même libellé, et la série porte elle aussi les
        # plateformes. Sans ce filtre, huit entrées sur dix-huit étaient des
        # faux doublons — une série prise pour une œuvre.
        ok = [q for q in w["candidates"]
              if info[q]["is_game"]
              and pq in info[q]["platforms"]
              and any(abs(y - w["year"]) <= TOLERANCE for y in info[q]["years"])]
        w["matches"] = [{"qid": q, "label": info[q]["label"],
                         "years": sorted(info[q]["years"])} for q in ok]
        if len(ok) == 1:
            w["qid"] = ok[0]
            w["label"] = info[ok[0]]["label"]
            resolved.append(w)
        else:
            w["reason"] = "aucun candidat ne concorde" if not ok else "plusieurs candidats concordent"
            # ce que la recherche proposait, pour l'arbitrage humain
            w["near"] = [{"qid": q, "label": info[q]["label"],
                          "years": sorted(info[q]["years"]),
                          "on_platform": pq in info[q]["platforms"]}
                         for q in w["candidates"][:5]]
            flagged.append(w)

    json.dump(resolved, open("resolved.json", "w"), indent=1, ensure_ascii=False)
    json.dump(flagged, open("flagged.json", "w"), indent=1, ensure_ascii=False)
    n = len(resolved) + len(flagged)
    print("\nrésolus %d/%d (%.0f%%)  ·  à arbitrer %d" %
          (len(resolved), n, 100.0 * len(resolved) / n, len(flagged)))


if __name__ == "__main__":
    main()
