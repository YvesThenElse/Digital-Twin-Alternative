"""Acquisition des jaquettes, sous la posture R&D de VERIFICATION-JURIDIQUE §3.3.

Les cinq conditions y sont écrites ; ce script en applique trois directement :

  1. basse résolution   -> MAX_WIDTH, demandé au serveur, jamais rogné après coup
  2. origine conservée  -> chaque visuel porte son URL, son fichier et sa licence
  5. pas de redistribution -> rien n'est publié ici ; le dossier reste local

Les deux autres — retrait sur demande, diffusion bornée — sont des règles
d'exploitation, pas de code.

Deux régimes coexistent et le script les SÉPARE, parce que les confondre
ferait perdre l'information la plus utile le jour d'une demande de retrait :

  · `free`     : fichier hébergé sur Wikimedia Commons, sous licence libre ou
                 domaine public. Aucun risque, réutilisable tel quel.
  · `non_free` : fichier téléversé localement sur Wikipédia sous exception de
                 fair use américain. C'est l'emprunt révocable que la décision
                 R&D assume — jamais autre chose qu'un emprunt.
"""
import json, os, time, urllib.parse, urllib.request

UA = ("DigitalTwinAlternative-RnD/0.1 "
      "(https://github.com/YvesThenElse/Digital-Twin-Alternative; "
      "R&D prototype; contact via repository)")
# La condition 1 de §3.3 écrit « 512 px de large au plus ». On demande **500**,
# et ce n'est pas une approximation : Wikimedia ne sert qu'une **liste fixe**
# de tailles de vignette, et 512 n'en fait pas partie. Une demande à 512 est
# arrondie SILENCIEUSEMENT — à 960 pour Celeste, soit près du double du
# plafond écrit. 500 est la taille autorisée immédiatement inférieure.
MAX_WIDTH = 500
OUT_DIR = "../dataset/covers"


def api(host, params, tries=3):
    url = "https://%s/w/api.php?%s" % (host, urllib.parse.urlencode(params))
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=40) as r:
                return json.load(r)
        except Exception:
            time.sleep(2 * (attempt + 1))
    return {}


def sitelinks(qids):
    """Article Wikipédia (en, puis fr) correspondant à chaque œuvre."""
    out = {}
    for i in range(0, len(qids), 45):
        batch = qids[i:i + 45]
        d = api("www.wikidata.org", {
            "action": "wbgetentities", "ids": "|".join(batch),
            "props": "sitelinks", "sitefilter": "enwiki|frwiki",
            "format": "json"})
        for q, ent in (d.get("entities") or {}).items():
            sl = ent.get("sitelinks") or {}
            if "enwiki" in sl:
                out[q] = ("en.wikipedia.org", sl["enwiki"]["title"])
            elif "frwiki" in sl:
                out[q] = ("fr.wikipedia.org", sl["frwiki"]["title"])
        print("  sitelinks %d/%d" % (min(i + 45, len(qids)), len(qids)), flush=True)
    return out


import re

# `prop=pageimages` ne convient PAS ici : l'extension PageImages exclut par
# construction les fichiers non libres. Sur Wikipédia anglophone, c'est
# exactement la catégorie des jaquettes — elle ne renvoyait donc rien pour
# 220 articles sur 222, ce qui se lisait comme « pas de jaquette » alors que
# le fichier était là. On lit l'infobox, qui la nomme.
_IMAGE_PARAM = re.compile(
    r"^\s*\|\s*(?:image|cover|image_?file|boxart)\s*=\s*(?:\[\[)?"
    r"(?:File:|Image:)?\s*([^\|\]\n<]+)", re.IGNORECASE | re.MULTILINE)


def infobox_image(host, title):
    """Nom du fichier de jaquette, lu dans l'infobox (section 0)."""
    d = api(host, {"action": "parse", "page": title, "prop": "wikitext",
                   "section": 0, "format": "json"})
    text = ((d.get("parse") or {}).get("wikitext") or {}).get("*") or ""
    for m in _IMAGE_PARAM.finditer(text):
        name = m.group(1)
        # Les infobox intercalent des gabarits — « Foo.jpg{{!}}border ». Le
        # nom de fichier s'arrête à la première accolade.
        name = name.split("{{")[0].split("}}")[0].strip().strip("[]").strip()
        if name and not name.startswith(("{", "<")) and "." in name:
            return name
    return None


def thumbnail(host, filename):
    """Vignette demandée au serveur, plus licence et régime du fichier.

    `iiurlwidth` fait produire la vignette par le serveur, ce qui évite de
    faire transiter l'original. **Mais la borne n'est pas garantie** : le
    serveur arrondit à une taille de sa liste, et répond parfois
    `thumbnail_unscaled` en servant l'original — c'est le cas des `.webp`.
    Les largeurs du manifeste doivent donc être MESURÉES sur le fichier reçu,
    jamais reprises de `thumbwidth` (apprentissage 64)."""
    d = api(host, {"action": "query", "titles": "File:" + filename,
                   "prop": "imageinfo",
                   "iiprop": "url|size|extmetadata",
                   "iiurlwidth": MAX_WIDTH, "format": "json"})
    pages = ((d.get("query") or {}).get("pages") or {})
    for _, page in pages.items():
        infos = page.get("imageinfo") or []
        if not infos:
            continue
        info = infos[0]
        meta = info.get("extmetadata") or {}
        repo = page.get("imagerepository")
        return {
            "url": info.get("thumburl") or info.get("url"),
            "file": filename,
            "width": info.get("thumbwidth"),
            "height": info.get("thumbheight"),
            "licence": (meta.get("LicenseShortName") or {}).get("value"),
            "repository": repo,
            "regime": "free" if repo == "shared" else "non_free",
            "description_url": info.get("descriptionurl"),
        }
    return None


def file_licence(host, filename):
    """Sur Commons (libre) ou téléversé localement sous fair use ?"""
    d = api(host, {"action": "query", "titles": "File:" + filename,
                   "prop": "imageinfo", "iiprop": "url|extmetadata",
                   "format": "json"})
    pages = ((d.get("query") or {}).get("pages") or {})
    for _, page in pages.items():
        info = (page.get("imageinfo") or [{}])[0]
        meta = info.get("extmetadata") or {}
        short = (meta.get("LicenseShortName") or {}).get("value")
        # `imagerepository` == "shared" signale un fichier venu de Commons.
        repo = page.get("imagerepository") or info.get("repository")
        return {"licence": short,
                "repository": repo,
                "regime": "free" if repo == "shared" else "non_free",
                "description_url": info.get("descriptionurl")}
    return {"regime": "unknown"}


def download(url, path):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        data = r.read()
    with open(path, "wb") as f:
        f.write(data)
    return len(data)
