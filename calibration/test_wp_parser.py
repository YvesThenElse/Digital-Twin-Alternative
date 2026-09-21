# -*- coding: utf-8 -*-
"""Test du parseur d'infobox, sur les cas réels qui l'ont mis en défaut.

Les wikitextes sont ceux de `wp_echecs.json`, mis en cache le 21 septembre
2026 : le test ne dépend pas du réseau, et ne change pas de verdict parce
qu'un contributeur a réécrit un article.

Chaque cas porte le nom du défaut qu'il exerce. Sans cela, un test qui passe
ne dit pas ce qu'il protège.
"""
import json, sys
import wp_dates as W

CAS = [
    # (QID, plateforme, régions attendues, défaut exercé)
    ("Q1408723", "n64",
     {"NTSC-U": "2000-05-22", "PAL": "2000-06-30"},
     "le modèle {{vgr}} — abréviation de {{vgrelease}} — était supprimé comme parasite"),

    ("Q1064350", "ps1",
     {"NTSC-U": "1997-09-18", "PAL": "1997-09-18"},
     "le code de région combiné « NA/PAL » n'était pas reconnu"),

    ("Q225912", "ps2",
     {"NTSC-J": "2002-03-28", "NTSC-U": "2002-09-17", "PAL": "2002-11-15"},
     "la tête en gras « Final Mix » n'est pas une plateforme et faisait tout rejeter"),

    ("Q223381", "ps2",
     {"NTSC-J": "2001-07-19", "NTSC-U": "2001-12-18"},
     "idem avec « International »"),

    # ⚠️ La date japonaise attendue est le 18 septembre 1987, celle du
    # « Shouhin-ban » — une cartouche dorée offerte lors d'un concours, pas
    # une sortie commerciale. C'est ce que la source dit, et le parseur retient
    # la plus ancienne par région. LIMITE CONNUE : quand un titre a plusieurs
    # éditions sur la même plateforme, on obtient la plus ancienne, qui n'est
    # pas forcément celle dont le joueur se souvient (ici, « Mike Tyson's
    # Punch-Out!! », 21 novembre 1987). Le test consigne le comportement réel
    # plutôt que le comportement souhaité.
    ("Q2705496", "nes",
     {"NTSC-U": "1987-10", "NTSC-J": "1987-09-18", "PAL": "1987-12-15"},
     "tête en gras portant un titre japonais"),

    ("Q2881381", "gb",
     {"NTSC-U": "1990-10"},
     "le titre du jeu en gras-italique était pris pour une tête de plateforme"),

    ("Q637137", "gb",
     {"NTSC-J": "1996-02-27", "NTSC-U": "1998-09-28", "PAL": "1998-10-23"},
     "têtes en gras portant des noms d'éditions, et {{ubl}} imbriqué"),

    ("Q17185964", "switch",
     {"WORLDWIDE": "2017-03-03"},
     "{{ubl}} supprimé avec son contenu ; date sans région sur machine sans zonage"),

    ("Q59756366", "switch",
     {"WORLDWIDE": "2020-09-17"},
     "{{Unbulleted list}} supprimé avec son contenu"),

    ("Q108670544", "switch",
     {"WORLDWIDE": "2022-03-25"},
     "date nue séparée par <br/>, sans modèle"),

    ("Q1045765", "snes",
     {"NTSC-J": "1995-08-05", "NTSC-U": "1995-10-04"},
     "{{vgrelease new}} n'était pas reconnu comme modèle de sortie"),
]


def main():
    cache = json.load(open("wp_echecs.json"))
    echecs = 0
    for qid, pf, attendu, defaut in CAS:
        e = cache[qid]
        obtenu = W.parse_released(e["wikitexte"], pf)
        plat = {k: v[0] for k, v in obtenu.items()}
        manquant = {r: d for r, d in attendu.items()
                    if not plat.get(r, "").startswith(d)}
        if manquant:
            echecs += 1
            print("ÉCHEC  %-34s [%s]" % (e["titre"][:34], pf))
            print("   défaut exercé : %s" % defaut)
            print("   attendu       : %s" % attendu)
            print("   obtenu        : %s" % plat)
        else:
            print("ok     %-34s [%s]  %s" % (e["titre"][:34], pf, plat))

    print("\n%d/%d cas" % (len(CAS) - echecs, len(CAS)))
    if echecs:
        sys.exit("%d cas en échec" % echecs)


if __name__ == "__main__":
    main()
