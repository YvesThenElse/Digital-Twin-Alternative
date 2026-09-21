"""Émet le dataset POC à partir des entrées résolues.

Conforme à MODELE-DE-DOMAINE.md : chaîne Work / Release, CanonicalId opaque
préfixé + ULID, provenance sur chaque donnée, et Confidence qui porte ce qui
n'a pas été vérifié plutôt que de le taire.
"""
import hashlib, json, os, sys

from region_arbitration import REGION_ARBITRATION
import fields
from curated import PLATFORMS

CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
DATASET_VERSION = "poc-2026-09-20"
IMPORTED_AT = "2026-09-20"

# Le rang de curation sert d'horloge : les identifiants se trient dans
# l'ordre de curation, ce que §10.2 demande explicitement. Les plateformes
# occupent les premiers rangs, les œuvres suivent.
_BASE_MS = 1789_000_000_000
_PLATFORM_BASE = 1
_WORK_BASE = 100


def ulid(key, seq):
    """ULID stable : l'horodatage vient du RANG DE CURATION fourni par
    l'appelant, la partie basse est dérivée de `key`. L'identifiant ne dépend
    donc que de (position dans la liste curée, clé) — jamais de l'historique
    des appels.

    Une première version incrémentait un compteur global à chaque appel. Les
    identifiants paraissaient stables tant que le nombre de sorties par œuvre
    ne bougeait pas ; dès qu'une œuvre en gagnait une, toutes les suivantes se
    décalaient. C'est le genre de stabilité qui tient jusqu'au jour où elle
    compte."""
    ts = _BASE_MS + seq
    rand = int(hashlib.sha256(key.encode()).hexdigest(), 16) & ((1 << 80) - 1)
    n = (ts << 80) | rand
    out = []
    for _ in range(26):
        out.append(CROCKFORD[n & 31])
        n >>= 5
    return "".join(reversed(out))


def cid(prefix, key, seq):
    return "%s_%s" % (prefix, ulid(prefix + ":" + key, seq))


_REGISTRE = "id_seq.json"


def _charger_registre(qids):
    """Le registre QID → seq, persistant et en ajout seul.

    Il n'est jamais réordonné ni purgé : un identifiant émis une fois garde
    son horodatage pour toujours, quel que soit le classement de notoriété
    ultérieur. Une œuvre absente du registre y entre au rang suivant."""
    try:
        seqs = json.load(open(_REGISTRE))
    except FileNotFoundError:
        seqs = {}
    prochain = max(seqs.values(), default=_WORK_BASE - 1) + 1
    nouveaux = [q for q in qids if q not in seqs]
    for q in nouveaux:
        seqs[q] = prochain
        prochain += 1
    if nouveaux:
        json.dump(seqs, open(_REGISTRE, "w"), indent=1,
                  ensure_ascii=False, sort_keys=True)
        print("  registre : %d œuvre(s) ajoutée(s)" % len(nouveaux))
    return seqs


SANS_ZONAGE = {"switch"}

_ARBITRAGES_UTILISES = set()
_REGIONS = ("NTSC-J", "NTSC-U", "PAL")


def _statut_regional(platform_key, titre, regions_connues, platform_cid):
    """Le statut des regions SANS sortie connue, pour cette plateforme.

    « absent » est une affirmation positive, arbitree a la main et motivee ;
    tout le reste est « inconnu ». Une region qui a une sortie ne figure pas
    ici : son statut est dit par la sortie elle-meme.
    """
    # Sur une machine sans zonage, la question ne se pose pas : il n y a pas
    # de region a etablir. Mario Kart 8 Deluxe y recevait « PAL : inconnu »,
    # ce qui laissait croire a une dette de curation inexistante.
    if platform_key in SANS_ZONAGE or "WORLDWIDE" in regions_connues:
        return {}
    statut = {}
    for region in _REGIONS:
        if region in regions_connues:
            continue
        cle = (platform_key, titre, region)
        verdict = REGION_ARBITRATION.get(cle)
        if verdict:
            _ARBITRAGES_UTILISES.add(cle)
            statut[region] = "absent"
        else:
            statut[region] = "inconnu"
    return {platform_cid: statut} if statut else {}


def first_year(dates):
    years = sorted(int(d["date"][:4]) for d in dates if d["date"][:4].isdigit())
    return years[0] if years else None


def _wikipedia_fill(releases, work_id, platform_cid, wp, qid, seen):
    """Complète les régions que Wikidata ne donne pas.

    Wikidata reste PRIORITAIRE là où elle existe : elle est en CC0, et le
    noyau du référentiel doit rester identifiable comme tel. Wikipédia ne fait
    que combler — mais dès qu'elle comble, le partage à l'identique s'applique
    à l'ensemble (voir wp_dates.py).
    """
    have = {r["region"] for r in releases if r["region"]}
    added = []
    for region, v in sorted((wp or {}).get("regions", {}).items()):
        if region in have or region == "UNKNOWN":
            continue
        key = (region, v["date"])
        if key in seen:
            continue
        seen.add(key)
        added.append({
            "canonical_id": cid("rel", "wp|%s|%s|%s" % (qid, region, v["date"]),
                                _seq_of(work_id)),
            "work": work_id,
            "platform": platform_cid,
            "region": region,
            "date": v["date"],
            "precision": v["precision"],
            # Une date d'infobox est vérifiée par des contributeurs mais pas
            # sourcée machine : confiance moyenne, jamais haute.
            "confidence": "medium",
            "provenance": {"source": "wikipedia", "licence": "CC BY-SA 4.0",
                           "article": (wp or {}).get("article"),
                           "basis": "infobox_released"},
        })
    return added


def _seq_of(work_id):
    """Le rang de curation est encodé dans le ULID de l'œuvre ; on le relit
    pour que les sorties ajoutées partagent son horodatage et restent stables."""
    return _WORK_SEQ.get(work_id, 0)


_WORK_SEQ = {}


def build(entry, raw, platform_ids, platform_qid, seq, wp=None):
    """Un Work et ses Releases, tels que le modèle les définit."""
    work_id = cid("wrk", raw["qid"], seq)
    _WORK_SEQ[work_id] = seq

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
        attested = basis == "platform_qualified" and bool(d["region"])
        # Une date non rattachée à une sortie identifiée est précise AU SUJET
        # D'AUTRE CHOSE. « Kirby's Dream Land, 27 avril 1992 » donne le jour,
        # mais on ignore si c'est la sortie japonaise, américaine ou
        # européenne — or c'est la sienne que le joueur cherche. Garder le
        # jour affirmerait donc quelque chose de faux ; on retombe à l'année,
        # et la valeur brute reste en provenance, jamais perdue.
        releases.append({
            "canonical_id": cid("rel", "%s|%s|%s" % (raw["qid"], d["region"], d["date"]), seq),
            "work": work_id,
            "platform": platform_ids[entry["platform"]],
            "region": d["region"],
            "date": d["date"] if attested else d["date"][:4],
            "precision": "day" if attested else "year",
            "confidence": "high" if attested else "low",
            "provenance": {"source": "wikidata", "external_id": raw["qid"],
                           "place_qid": d["place_qid"], "basis": basis,
                           "raw_date": d["date"]},
        })

    releases += _wikipedia_fill(releases, work_id, platform_ids[entry["platform"]],
                                wp, raw["qid"], seen)

    # Une sortie SANS region n est retenue que si aucune autre n en porte.
    # La date non qualifiee est un repli : elle decrit la meme sortie avec
    # moins d information. Tant qu elle etait seule, elle rendait service ;
    # depuis que Wikipedia fournit les dates regionales, elle produit un
    # doublon degrade — « Gradius · ? · 1986 » a cote de « Gradius · Japon ·
    # 25 avril 1986 », pour une seule et meme sortie. 91 des 92 sorties sans
    # region etaient dans ce cas.
    if any(r["region"] for r in releases):
        releases = [r for r in releases if r["region"]]

    releases.sort(key=lambda r: (r["date"], r["region"] or ""))
    regions = [r for r in releases if r["region"]]

    titre = raw["labels"].get("en") or entry["title"]
    statut = _statut_regional(entry["platform"], titre,
                              {r["region"] for r in regions},
                              platform_ids[entry["platform"]])

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
        # §3.3 : rang manuel, décroissant en notoriété, **propre à la
        # plateforme**. C'est une carte et non un entier : la notoriété d'un
        # titre n'est pas la même sur deux machines, et le multiplateforme
        # devient la norme dès la PS1. Bubble Bobble le montrait déjà —
        # 19e sur Game Boy, 22e sur NES.
        "notability": {platform_ids[entry["platform"]]: entry["notability"]},
        # Trois etats et non deux : sortie connue, non-sortie ETABLIE, ou
        # rien d etabli. Sans le troisieme, le silence d une source passe
        # pour une absence — or l infobox anglophone sous-declare les
        # sorties japonaises des jeux occidentaux.
        "region_status": statut,
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


def fusionner(works):
    """Fusionne les œuvres qui partagent un identifiant externe.

    Une même œuvre curée sur deux machines produisait deux `Work` portant le
    même QID — ce que le modèle interdit (la plateforme appartient à la
    Release) et ce que le cas de validation n°8 dit explicitement. Bubble
    Bobble était le seul cas sur 222 ; il ne le restera pas.

    L'identifiant survivant est le **plus ancien** (plus petit `seq`) :
    l'invariant 9 interdit de réattribuer un identifiant, pas d'en retirer un
    de la circulation. Celui qui disparaît entre dans la table de redirection,
    qui n'est jamais purgée.
    """
    par_qid, ordre = {}, []
    for w in works:
        q = w["provenance"]["external_id"]
        if q not in par_qid:
            par_qid[q] = []
            ordre.append(q)
        par_qid[q].append(w)

    fusionnes, redirections = [], {}
    for q in ordre:
        groupe = par_qid[q]
        if len(groupe) == 1:
            fusionnes.append(groupe[0])
            continue
        # Le survivant est celui dont le ULID est le plus petit — donc le
        # premier émis, l'horodatage étant en tête de l'identifiant.
        groupe.sort(key=lambda w: w["canonical_id"])
        survivant, absorbes = groupe[0], groupe[1:]
        for autre in absorbes:
            redirections[autre["canonical_id"]] = survivant["canonical_id"]
            survivant["notability"].update(autre["notability"])
            survivant["region_status"].update(autre.get("region_status") or {})
            for r in autre["releases"]:
                r["work"] = survivant["canonical_id"]
                survivant["releases"].append(r)
        survivant["releases"].sort(key=lambda r: (r["platform"], r["date"],
                                                  r["region"] or ""))
        survivant["platform_release_year"] = first_year(
            [{"date": r["date"]} for r in survivant["releases"]])
        print("  fusion : %s — %d fiches, plateformes %s"
              % (survivant["title"], len(groupe), sorted(survivant["notability"])))
        fusionnes.append(survivant)
    return fusionnes, redirections


def main():
    resolved = json.load(open("resolved.json"))
    qids = [e["qid"] for e in resolved]
    print("récupération des champs pour %d œuvres..." % len(qids), flush=True)

    # Cache des champs bruts : réémettre est une opération fréquente dès lors
    # que les règles évoluent, et refaire quatre requêtes lourdes à chaque
    # ajustement décourage de corriger. Supprimer raw_fields.json force le
    # rechargement.
    try:
        raw = json.load(open("raw_fields.json"))
        missing = [q for q in qids if q not in raw]
    except Exception:
        raw, missing = {}, list(qids)

    if missing:
        for i in range(0, len(missing), 60):
            raw.update(fields.fetch(missing[i:i + 60]))
            print("  %d/%d" % (min(i + 60, len(missing)), len(missing)), flush=True)
        json.dump(raw, open("raw_fields.json", "w"), ensure_ascii=False)
    else:
        print("  (champs relus depuis le cache)")

    platform_ids = {k: cid("plt", q, _PLATFORM_BASE + i)
                    for i, (k, (q, _, _annee)) in enumerate(PLATFORMS.items())}
    # Une machine sans zonage n'impose aucune restriction régionale : une
    # sortie qui n'y porte pas de région est **mondiale**, pas incomplète.
    # Ce n'est pas « toute sortie y est mondiale » — un titre peut rester
    # exclusif au Japon et le déclarer.
    platforms = [{"canonical_id": platform_ids[k], "key": k, "name": name,
                  # Une sortie ne peut pas précéder sa machine : l'annee de
                  # lancement rend l'invariant verifiable par le chargeur.
                  "launch_year": annee,
                  "region_free": k in SANS_ZONAGE,
                  "provenance": {"source": "wikidata", "external_id": q,
                                 "license": "CC0"}}
                 for k, (q, name, annee) in PLATFORMS.items()]

    try:
        wpd = json.load(open("wp_dates.json"))
    except Exception:
        wpd = {}
    # Le `seq` d'une œuvre vient du REGISTRE, pas de sa position dans la liste
    # curée. C'est la correction du 21 septembre 2026 : le rang de notoriété
    # est un jugement révisable, l'identifiant ne l'est pas. Les indexer sur la
    # même valeur faisait qu'intervertir deux titres ÉCHANGEAIT leurs
    # identifiants — une réattribution, précisément ce que l'invariant 9
    # interdit (MODELE-DE-DOMAINE §10.2).
    #
    # Le registre encode l'ordre de PREMIÈRE émission, qui est la sémantique
    # que ULID attend de son horodatage. Une œuvre nouvelle prend le rang
    # suivant ; aucune œuvre déjà émise n'en change jamais.
    # La clé est (QID, plateforme) et non le QID seul : une même œuvre peut
    # être curée sur deux machines — Bubble Bobble l'est sur Game Boy et sur
    # NES. Or la partie basse du ULID ne dérive que du QID : deux entrées
    # partageant le même `seq` recevraient des identifiants IDENTIQUES.
    # C'était masqué par le couplage au rang, qui les séparait par accident.
    seqs = _charger_registre(["%s|%s" % (e["qid"], e["platform"])
                              for e in resolved if e["qid"] in raw])
    works = [build(e, raw[e["qid"]], platform_ids, PLATFORMS[e["platform"]][0],
                   seqs["%s|%s" % (e["qid"], e["platform"])], wpd.get("%s|%s" % (e["qid"], e["platform"])))
             for e in resolved if e["qid"] in raw]

    inutilises = set(REGION_ARBITRATION) - _ARBITRAGES_UTILISES
    if inutilises:
        # Une cle qui ne correspond a rien ne fait RIEN, et en silence. C est
        # exactement la classe de defaut qui a coute le plus cher a ce projet.
        sys.exit("arbitrages de region jamais appliques (titre ou plateforme "
                 "errone ?) :\n  " + "\n  ".join(repr(k) for k in sorted(inutilises)))

    works, redirections = fusionner(works)

    dataset = {"dataset_version": DATASET_VERSION,
               # Le partage à l'identique de Wikipédia se propage à l'ensemble
               # dès lors qu'une seule de ses dates est incorporée.
               "license": "CC BY-SA 4.0 — Wikidata (CC0) + Wikipédia (CC BY-SA 4.0). "
                          "Voir VERIFICATION-JURIDIQUE.md",
               "sources": [
                   {"name": "Wikidata", "licence": "CC0",
                    "url": "https://www.wikidata.org"},
                   {"name": "Wikipédia", "licence": "CC BY-SA 4.0",
                    "url": "https://en.wikipedia.org",
                    "usage": "dates de sortie régionales absentes de Wikidata"},
               ],
               "platforms": platforms,
               # §10.2 : la table de redirection n'est jamais purgée. Un
               # export utilisateur vieux de trois ans doit encore se résoudre.
               "redirects": redirections,
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
    day = sum(1 for w in works for r in w["releases"] if r["precision"] == "day")
    print("  sorties au jour près      %3d / %d" % (day, rel))
    wpc = sum(1 for w in works for r in w["releases"]
              if r["provenance"].get("source") == "wikipedia")
    print("  sorties venues de Wikipédia %3d" % wpc)
    for reg in ("PAL", "NTSC-U", "NTSC-J"):
        c = sum(1 for w in works if any(r["region"] == reg for r in w["releases"]))
        print("  région %-7s attestée   %3d (%.0f%%)" % (reg, c, 100.0 * c / n))


if __name__ == "__main__":
    main()
