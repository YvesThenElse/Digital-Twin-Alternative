"""Émet le dataset POC à partir des entrées résolues.

Conforme à MODELE-DE-DOMAINE.md : chaîne Work / Release, CanonicalId opaque
préfixé + ULID, provenance sur chaque donnée, et Confidence qui porte ce qui
n'a pas été vérifié plutôt que de le taire.
"""
import hashlib, json, os, sys
import fields
from curated import PLATFORMS

CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
DATASET_VERSION = "poc-2026-09-20"
IMPORTED_AT = "2026-09-20"

# Un compteur monotone sert d'horloge : les identifiants se trient dans
# l'ordre de curation, ce que §10.2 demande explicitement.
_BASE_MS = 1789_000_000_000
_seq = [0]


def ulid(key):
    """ULID stable : l'horodatage vient du rang de curation, la partie basse
    est dérivée de `key`. Régénérer le dataset à partir de la même liste curée
    reproduit donc les MÊMES identifiants — ce qui est indispensable tant que
    l'invariant 9 interdit de les réattribuer. Une partie aléatoire rendrait
    toute correction du pipeline destructrice."""
    _seq[0] += 1
    ts = _BASE_MS + _seq[0]
    rand = int(hashlib.sha256(key.encode()).hexdigest(), 16) & ((1 << 80) - 1)
    n = (ts << 80) | rand
    out = []
    for _ in range(26):
        out.append(CROCKFORD[n & 31])
        n >>= 5
    return "".join(reversed(out))


def cid(prefix, key):
    return "%s_%s" % (prefix, ulid(prefix + ":" + key))


def first_year(dates):
    years = sorted(int(d["date"][:4]) for d in dates if d["date"][:4].isdigit())
    return years[0] if years else None


def build(entry, raw, platform_ids, platform_qid):
    """Un Work et ses Releases, tels que le modèle les définit."""
    work_id = cid("wrk", raw["qid"])

    # Ne retenir que les dates qui concernent LA plateforme curée. Une date
    # portant « Wii » ou « Nintendo 3DS » est une réédition : elle décrit une
    # autre Release, pas celle dont le joueur se souvient. Les confondre
    # produisait « Super Mario Bros. · Europe · 2011 » pour un jeu que
    # l'Europe a connu en 1987.
    on_platform = [d for d in raw["dates"] if d["platform_qid"] == platform_qid]
    unqualified = [d for d in raw["dates"] if d["platform_qid"] is None]

    source, basis = (on_platform, "platform_qualified") if on_platform else \
                    (unqualified[:1], "unqualified")

    releases = []
    seen = set()
    for d in source:
        key = (d["region"], d["date"])
        if key in seen:
            continue
        seen.add(key)
        releases.append({
            "canonical_id": cid("rel", "%s|%s|%s" % (raw["qid"], d["region"], d["date"])),
            "work": work_id,
            "platform": platform_ids[entry["platform"]],
            "region": d["region"],
            "date": d["date"],
            # Confiance haute seulement si la plateforme ET la région sont
            # attestées ; une date non qualifiée ne dit pas de quoi elle parle.
            "confidence": "high" if (basis == "platform_qualified" and d["region"])
                          else "low",
            "provenance": {"source": "wikidata", "external_id": raw["qid"],
                           "place_qid": d["place_qid"], "basis": basis},
        })

    regions = [r for r in releases if r["region"]]

    return {
        "canonical_id": work_id,
        "title": raw["labels"].get("en") or entry["title"],
        "titles": raw["labels"],
        "aliases": ["%s:%s" % (lang, v) for lang, v in raw["aliases"]],
        "studio": raw["developer"],
        "publisher": raw["publisher"],
        "genre": raw["genre"],
        "series": raw["series"][0] if raw["series"] else None,
        "first_release_year": first_year(raw["dates"]),
        "platform_release_year": first_year([{"date": r["date"]} for r in releases]),
        # §3.3 : rang manuel, décroissant en notoriété, propre à la plateforme.
        "notability": entry["notability"],
        "releases": releases,
        "provenance": {"source": "wikidata", "license": "CC0",
                       "external_id": raw["qid"],
                       "imported_at": IMPORTED_AT,
                       "dataset_version": DATASET_VERSION},
        # Ce que le référentiel sait de sa propre qualité (COUT-DE-CURATION §4.1).
        "verification": {
            "resolution": entry.get("verification", "platform_and_year"),
            "date_basis": basis,
            "curated_year": entry["year"],
            # Harvest Moon GB ne porte que 2012 en P577 — une réédition — pour
            # un jeu de 1997. Une année dérivée de la source peut donc être
            # fausse de quinze ans. On la compare à l'année curée et on
            # signale l'écart plutôt que de trancher en silence.
            "year_source_vs_curated": (
                "match" if first_year(raw["dates"]) == entry["year"]
                else "diverges"),
            "region": "from_source" if regions else "missing",
            "cover": "present" if raw["image"] else "missing",
            "title_from": "source" if raw["labels"].get("en") else "curation",
        },
    }


def main():
    resolved = json.load(open("resolved.json"))
    qids = [e["qid"] for e in resolved]
    print("récupération des champs pour %d œuvres..." % len(qids), flush=True)

    raw = {}
    for i in range(0, len(qids), 60):
        raw.update(fields.fetch(qids[i:i + 60]))
        print("  %d/%d" % (min(i + 60, len(qids)), len(qids)), flush=True)

    platform_ids = {k: cid("plt", q) for k, (q, _) in PLATFORMS.items()}
    platforms = [{"canonical_id": platform_ids[k], "key": k, "name": name,
                  "provenance": {"source": "wikidata", "external_id": q,
                                 "license": "CC0"}}
                 for k, (q, name) in PLATFORMS.items()]

    works = [build(e, raw[e["qid"]], platform_ids, PLATFORMS[e["platform"]][0])
             for e in resolved if e["qid"] in raw]

    dataset = {"dataset_version": DATASET_VERSION,
               "license": "CC0 (Wikidata) — voir VERIFICATION-JURIDIQUE.md",
               "platforms": platforms,
               "works": works}

    os.makedirs("../dataset", exist_ok=True)
    json.dump(dataset, open("../dataset/poc.json", "w"), indent=1, ensure_ascii=False)

    div = sum(1 for w in works if w["verification"]["year_source_vs_curated"] == "diverges")
    cur = sum(1 for w in works if w["verification"]["title_from"] == "curation")
    reg = sum(1 for w in works if w["verification"]["region"] == "from_source")
    cov = sum(1 for w in works if w["verification"]["cover"] == "present")
    rel = sum(len(w["releases"]) for w in works)
    n = len(works)
    print("\n%d œuvres · %d sorties" % (n, rel))
    print("  région depuis la source   %3d (%.0f%%)" % (reg, 100.0 * reg / n))
    print("  jaquette présente         %3d (%.0f%%)" % (cov, 100.0 * cov / n))
    print("  titre venu de la curation %3d (%.0f%%)" % (cur, 100.0 * cur / n))
    print("  année source ≠ curation   %3d (%.0f%%)" % (div, 100.0 * div / n))
    qual = sum(1 for w in works if w["verification"]["date_basis"] == "platform_qualified")
    print("  dates rattachées à la plateforme %3d (%.0f%%)" % (qual, 100.0 * qual / n))


if __name__ == "__main__":
    main()
