"""Test de non-régression : un CanonicalId ne bouge pas (invariant 9).

Le modèle interdit de réattribuer ou de modifier un `CanonicalId`
([MODELE-DE-DOMAINE.md](../MODELE-DE-DOMAINE.md) §10.2, invariant 9). Pour le
dataset POC, cela veut dire qu'une correction du pipeline doit pouvoir être
réémise **sans déplacer les identifiants existants**. Sinon corriger devient
un acte destructeur, et on cesse de corriger.

Trois perturbations, chacune ayant déjà cassé quelque chose :

1. **Une œuvre perd une date.** Une première version dérivait l'horodatage
   d'un compteur global d'appels : les identifiants paraissaient stables tant
   que le nombre de sorties par œuvre ne changeait pas, c'est-à-dire tant
   qu'on ne corrigeait rien d'intéressant.

2. **Le classement de notoriété est rebattu.** La version suivante dérivait
   l'horodatage du RANG DE CURATION. Intervertir deux titres échangeait leurs
   identifiants — une réattribution, précisément ce que l'invariant 9
   interdit. Or ce classement est un jugement destiné à être révisé : le
   coupler à l'identité rendait toute révision destructrice.

3. **Deux entrées curées partagent un QID.** Bubble Bobble est curé sur Game
   Boy et sur NES. La partie basse du ULID ne dérivant que du QID, deux
   entrées de même `seq` recevraient des identifiants IDENTIQUES. Le couplage
   au rang les séparait par accident ; en le retirant, il a fallu clé le
   registre sur (QID, plateforme).
"""
import copy, json, sys
import emit_dataset as E
from curated import PLATFORMS


def key(e):
    return "%s|%s" % (e["qid"], e["platform"])


def build_all(resolved, raw, seqs, wpd):
    """`wpd` n'est pas facultatif : sans lui, les 255 sorties venues de
    Wikipédia ne sont pas construites et le test ne couvre que 630 des 885
    identifiants — en le disant « OK »."""
    pids = {k: E.cid("plt", q, E._PLATFORM_BASE + i)
            for i, (k, (q, _, _annee)) in enumerate(PLATFORMS.items())}
    return {key(e): E.build(e, raw[e["qid"]], pids,
                            PLATFORMS[e["platform"]][0], seqs[key(e)],
                            # Même clé composite que l'émetteur : indexer sur
                            # le QID seul donnerait à deux plateformes les
                            # dates d'une seule.
                            wpd.get(key(e)))
            for e in resolved if e["qid"] in raw}


def ids(built):
    """Tous les identifiants émis, œuvres et sorties confondues, APRÈS fusion.

    La fusion retire de la circulation l'identifiant absorbé — Bubble Bobble
    n'a plus qu'une fiche. Comparer avant fusion compterait un identifiant qui
    n'est pas publié, et le garde-fou de couverture échouerait à juste titre.
    """
    fusionnes, _ = E.fusionner(list(built.values()))
    out = {}
    for w in fusionnes:
        q = w["provenance"]["external_id"]
        out[q] = w["canonical_id"]
        for r in w["releases"]:
            out["%s#%s" % (q, r["canonical_id"])] = r["canonical_id"]
    return out


def echec(base, apres, ignorer, quoi):
    bouges = [k for k in base
              if not k.startswith(ignorer) and k in apres and base[k] != apres[k]]
    print("   identifiants déplacés : %d" % len(bouges))
    if bouges:
        for k in bouges[:5]:
            print("      %s : %s -> %s" % (k, base[k], apres[k]))
        sys.exit("ÉCHEC — un CanonicalId a bougé sous « %s » (invariant 9)" % quoi)


def main():
    resolved = json.load(open("resolved.json"))
    raw = json.load(open("raw_fields.json"))
    seqs = json.load(open(E._REGISTRE))
    wpd = json.load(open("wp_dates.json"))

    base = ids(build_all(resolved, raw, seqs, wpd))
    print("identifiants comparés : %d" % len(base))

    # Un test qui n'exerce qu'une partie du pipeline dit « OK » sur ce qu'il
    # n'a pas regardé. On exige la couverture du dataset réellement publié.
    publie = json.load(open("../dataset/poc.json"))
    attendu = len(publie["works"]) + sum(len(w["releases"]) for w in publie["works"])
    if len(base) != attendu:
        sys.exit("ÉCHEC — %d identifiants construits pour %d publiés : "
                 "le test ne couvre pas tout le pipeline" % (len(base), attendu))

    # --- 1. une œuvre perd une date ------------------------------------
    premier = resolved[0]
    print("\n1. %s perd une date" % key(premier))
    secoue = copy.deepcopy(raw)
    if len(secoue[premier["qid"]]["dates"]) < 2:
        sys.exit("SKIP : la première œuvre n'a qu'une date, perturbation sans effet")
    secoue[premier["qid"]]["dates"] = secoue[premier["qid"]]["dates"][:-1]
    echec(base, ids(build_all(resolved, secoue, seqs, wpd)), key(premier), "perte d'une date")

    # --- 2. le classement est rebattu ----------------------------------
    print("\n2. le classement de notoriété est inversé sur chaque plateforme")
    par_pf = {}
    for e in copy.deepcopy(resolved):
        par_pf.setdefault(e["platform"], []).append(e)
    rebattu = []
    for ws in par_pf.values():
        ws = list(reversed(ws))
        for rang, e in enumerate(ws, 1):
            e["notability"] = rang
        rebattu += ws
    apres = ids(build_all(rebattu, raw, seqs, wpd))
    changes = sum(1 for e in rebattu
                  if e["notability"] != next(x["notability"] for x in resolved
                                             if key(x) == key(e)))
    print("   rangs effectivement modifiés : %d" % changes)
    if changes < 100:
        sys.exit("ÉCHEC — la perturbation n'a presque rien changé, elle ne prouve rien")
    echec(base, apres, "\0", "réordonnancement du classement")

    # --- 3. aucun identifiant n'est émis deux fois ---------------------
    print("\n3. unicité des identifiants émis")
    emis = list(base.values())
    doublons = len(emis) - len(set(emis))
    print("   identifiants émis : %d, distincts : %d" % (len(emis), len(set(emis))))
    if doublons:
        sys.exit("ÉCHEC — %d identifiant(s) émis plusieurs fois" % doublons)

    # --- réémission ----------------------------------------------------
    if ids(build_all(resolved, raw, seqs, wpd)) != base:
        sys.exit("ÉCHEC — deux émissions successives divergent")

    print("\nOK — invariant 9 tenu sous les trois perturbations et en réémission")


if __name__ == "__main__":
    main()
