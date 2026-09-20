"""Test de non-régression : un CanonicalId ne bouge pas (invariant 9).

Le modèle interdit de réattribuer ou de modifier un `CanonicalId`
([MODELE-DE-DOMAINE.md](../MODELE-DE-DOMAINE.md) §10.2, invariant 9). Pour le
dataset POC, cela veut dire qu'une correction du pipeline doit pouvoir être
réémise **sans déplacer les identifiants existants**. Sinon corriger devient
un acte destructeur, et on cesse de corriger.

Une première version dérivait l'horodatage d'un compteur global d'appels.
Les identifiants paraissaient stables tant que le nombre de sorties par œuvre
ne changeait pas — c'est-à-dire tant qu'on ne corrigeait rien d'intéressant.
Ce test perturbe précisément ce cas.
"""
import copy, json, sys
import emit_dataset as E
from curated import PLATFORMS


def build_all(resolved, raw):
    pids = {k: E.cid("plt", q, E._PLATFORM_BASE + i)
            for i, (k, (q, _)) in enumerate(PLATFORMS.items())}
    return {e["qid"]: E.build(e, raw[e["qid"]], pids,
                              PLATFORMS[e["platform"]][0], E._WORK_BASE + i)
            for i, e in enumerate(resolved) if e["qid"] in raw}


def main():
    resolved = json.load(open("resolved.json"))
    raw = json.load(open("raw_fields.json"))

    base = build_all(resolved, raw)

    # Perturbation : la PREMIÈRE œuvre perd une de ses dates. Avec un compteur
    # global, toutes les œuvres suivantes auraient glissé d'un cran.
    first = resolved[0]["qid"]
    shaken = copy.deepcopy(raw)
    if len(shaken[first]["dates"]) < 2:
        sys.exit("SKIP : la première œuvre n'a qu'une date, perturbation sans effet")
    shaken[first]["dates"] = shaken[first]["dates"][:-1]

    after = build_all(resolved, shaken)

    moved = [q for q in base
             if q != first and q in after
             and base[q]["canonical_id"] != after[q]["canonical_id"]]

    print("œuvres comparées      : %d" % len(base))
    print("perturbation          : %s perd une date" % first)
    print("identifiants déplacés : %d" % len(moved))

    if moved:
        for q in moved[:5]:
            print("   %s : %s -> %s" % (q, base[q]["canonical_id"],
                                        after[q]["canonical_id"]))
        sys.exit("ÉCHEC — un CanonicalId a bougé (invariant 9)")

    # Et le même dataset réémis deux fois doit être identique bit à bit.
    again = build_all(resolved, raw)
    if any(base[q]["canonical_id"] != again[q]["canonical_id"] for q in base):
        sys.exit("ÉCHEC — deux émissions successives divergent")

    print("OK — invariant 9 tenu sous perturbation et en réémission")


if __name__ == "__main__":
    main()
