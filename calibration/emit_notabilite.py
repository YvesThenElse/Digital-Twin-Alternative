# -*- coding: utf-8 -*-
"""Produit dataset/NOTABILITE.md à partir du dataset publié.

Ce fichier était écrit à la main. Il a silencieusement menti pendant une
journée : il annonçait 35 titres NES et deux Bubble Bobble, état antérieur au
correctif des rééditions. Un document qui recopie des chiffres se périme sans
prévenir ; celui-ci se régénère.

    python3 calibration/emit_notabilite.py
"""
import json, collections, os, pathlib

# Résolu depuis le FICHIER : ce script n'acceptait qu'un répertoire courant
# précis, et la documentation le présentait comme lançable.
RACINE = pathlib.Path(__file__).resolve().parent.parent

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
    d = json.load(open(RACINE / "dataset" / "poc.json"))
    try:
        manifeste = json.load(open(RACINE / "dataset" / "covers" / "MANIFEST.json"))
    except FileNotFoundError:
        manifeste = {}

    plat = {p["canonical_id"]: p for p in d["platforms"]}
    cle = {p["canonical_id"]: p.get("key", p["name"]) for p in d["platforms"]}

    # Une œuvre peut figurer sur plusieurs plateformes avec un rang différent
    # sur chacune — c'est le sens de la carte `notability`. On l'inscrit dans
    # chaque liste où elle est classée.
    par_pf = collections.defaultdict(list)
    for w in d["works"]:
        for pid, rang in w["notability"].items():
            par_pf[pid].append((rang, w))

    pids = sorted(plat, key=lambda p: ORDRE.index(cle[p]) if cle[p] in ORDRE else 99)

    out = []
    A = out.append
    A("# Classement de notoriété\n")
    A("> Les %d œuvres du [dataset](./poc.json), dans l'ordre où **E02 les "
      "présentera**. Le rang 1 est le titre qu'un joueur de la plateforme cite "
      "en premier.\n" % len(d["works"]))
    A("> Le rang est **propre à la plateforme** : une œuvre sortie sur deux "
      "machines y figure deux fois, avec deux rangs. Bubble Bobble est "
      "19<sup>e</sup> sur Game Boy et 22<sup>e</sup> sur NES.\n")
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
    A("| ~~région~~ | **non-sortie établie** — arbitrée à la main, motivée dans "
      "`calibration/region_arbitration.py` |")
    A("| `img` | jaquette acquise |")
    A("")
    A("> Une région qui n'apparaît **ni** en clair **ni** barrée n'est pas une "
      "non-sortie : elle n'est pas établie. Le silence d'une source ne prouve "
      "rien — l'infobox anglophone omet les sorties japonaises de Crash "
      "Bandicoot, de Banjo-Kazooie et de Grand Theft Auto III, qui ont "
      "pourtant toutes eu lieu.")
    A("")

    for pid in pids:
        ws = sorted(par_pf[pid], key=lambda rw: rw[0])
        zonee = cle[pid] not in SANS_ZONAGE
        A("\n## %s — %d titres\n" % (plat[pid]["name"], len(ws)))
        if not zonee:
            A("> Machine **sans zonage** : une sortie mondiale n'a pas de "
              "région, et `—` n'y signale donc aucune lacune.\n")
        A("| # | Titre | | Régions | |")
        A("|--:|---|:-:|---|---|")
        for rang, w in ws:
            # Seules les sorties SUR CETTE PLATEFORME décrivent la ligne : une
            # date Game Boy ne dit rien de la sortie NES du même titre.
            ici = [r for r in w["releases"] if r["platform"] == pid]
            f, _ = flag_date(ici)
            regs = sorted({r["region"] for r in ici if r.get("region")})
            # Une non-sortie ETABLIE se montre, barree : elle n est pas une
            # lacune a combler mais un fait a afficher au joueur.
            statut = (w.get("region_status") or {}).get(pid, {})
            regs += ["~~%s~~" % r for r in sorted(statut) if statut[r] == "absent"]
            img = "img" if w["canonical_id"] in manifeste else ""
            A("| %d | %s | %s | %s | %s |"
              % (rang, w["title"], f, " ".join(regs) or "—", img))

    chemin = RACINE / "dataset" / "NOTABILITE.md"
    open(chemin, "w").write("\n".join(out) + "\n")
    print("écrit %s — %d titres sur %d plateformes"
          % (chemin.relative_to(RACINE), len(d["works"]), len(pids)))


if __name__ == "__main__":
    main()
