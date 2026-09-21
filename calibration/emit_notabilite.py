# -*- coding: utf-8 -*-
"""Produit dataset/NOTABILITE.md à partir du dataset publié.

Ce fichier était écrit à la main. Il a silencieusement menti pendant une
journée : il annonçait 35 titres NES et deux Bubble Bobble, état antérieur au
correctif des rééditions. Un document qui recopie des chiffres se périme sans
prévenir ; celui-ci se régénère.

    python3 emit_notabilite.py
"""
import json, collections, os

ORDRE = ["nes", "snes", "gb", "gba", "n64", "ps1", "ps2", "switch"]
# Machines sans zonage : l'absence de région n'y est pas une lacune.
SANS_ZONAGE = {"switch"}


def flag_date(rels):
    if any(r["precision"] == "day" for r in rels):
        return "✓", "date au jour"
    if any(r["precision"] == "month" for r in rels):
        return "~", "au mois seulement"
    if rels:
        return "≈", "à l'année seulement"
    return "∅", "aucune date"


def main():
    d = json.load(open("../dataset/poc.json"))
    try:
        manifeste = json.load(open("../dataset/covers/MANIFEST.json"))
    except FileNotFoundError:
        manifeste = {}

    plat = {p["canonical_id"]: p for p in d["platforms"]}
    cle = {p["canonical_id"]: p.get("key", p["name"]) for p in d["platforms"]}

    par_pf = collections.defaultdict(list)
    for w in d["works"]:
        par_pf[w["releases"][0]["platform"]].append(w)

    pids = sorted(plat, key=lambda p: ORDRE.index(cle[p]) if cle[p] in ORDRE else 99)

    out = []
    A = out.append
    A("# Classement de notoriété\n")
    A("> Les %d œuvres du [dataset](./poc.json), dans l'ordre où **E02 les "
      "présentera**. Le rang 1 est le titre qu'un joueur de la plateforme cite "
      "en premier.\n" % len(d["works"]))
    A("> ⚙️ **Fichier généré** — `python3 calibration/emit_notabilite.py`. "
      "Ne pas l'éditer à la main : il se régénère depuis `poc.json`. Pour "
      "changer un rang, changer `notability` dans la liste curée et réémettre. "
      "Depuis le 21 septembre 2026, **réordonner ne déplace plus aucun "
      "`CanonicalId`** (voir `calibration/id_seq.json`).\n")
    A("Ce classement n'a aucune source : c'est un jugement de domaine. §3.3 en "
      "fait un attribut requis — « l'application montre les principaux jeux de "
      "la plateforme » n'a pas de sens sans un ordre.\n")
    A("**Ce qu'il faut regarder** : un titre trop haut fait perdre du temps à "
      "tout le monde ; un titre trop bas, ou absent, est un jeu que le testeur "
      "cherchera sans le trouver — et c'est l'échec qui casse la "
      "reconnaissance.\n")
    A("| Marque | Sens |")
    A("|---|---|")
    A("| `✓` | au moins une date au jour |")
    A("| `~` | au mieux au mois |")
    A("| `≈` | à l'année seulement |")
    A("| `∅` | aucune date |")
    A("| régions | celles attestées ; `—` = aucune |")
    A("| `img` | jaquette acquise |")
    A("")

    for pid in pids:
        ws = sorted(par_pf[pid], key=lambda w: w["notability"])
        zonee = cle[pid] not in SANS_ZONAGE
        A("\n## %s — %d titres\n" % (plat[pid]["name"], len(ws)))
        if not zonee:
            A("> Machine **sans zonage** : une sortie mondiale n'a pas de "
              "région, et `—` n'y signale donc aucune lacune.\n")
        A("| # | Titre | | Régions | |")
        A("|--:|---|:-:|---|---|")
        for w in ws:
            f, _ = flag_date(w["releases"])
            regs = sorted({r["region"] for r in w["releases"] if r.get("region")})
            img = "img" if w["canonical_id"] in manifeste else ""
            A("| %d | %s | %s | %s | %s |"
              % (w["notability"], w["title"], f, " ".join(regs) or "—", img))

    chemin = "../dataset/NOTABILITE.md"
    open(chemin, "w").write("\n".join(out) + "\n")
    print("écrit %s — %d titres sur %d plateformes"
          % (chemin, len(d["works"]), len(pids)))


if __name__ == "__main__":
    main()
