"""Wikidata SPARQL helpers for the curation calibration pilot."""
import hashlib, json, time, urllib.parse, urllib.request

UA = ("DigitalTwinAlternative-RnD/0.1 "
      "(https://github.com/YvesThenElse/Digital-Twin-Alternative; curation calibration)")
ENDPOINT = "https://query.wikidata.org/sparql"

PLATFORMS = {"snes": ("Q183259", "Super Nintendo"),
             "ps1":  ("Q10677",  "PlayStation"),
             "gb":   ("Q186437", "Game Boy")}


def sparql(query, tries=4):
    url = ENDPOINT + "?" + urllib.parse.urlencode({"query": query, "format": "json"})
    last = None
    for attempt in range(tries):
        req = urllib.request.Request(url, headers={"User-Agent": UA,
                                                   "Accept": "application/sparql-results+json"})
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                return json.loads(r.read().decode("utf-8"))["results"]["bindings"]
        except Exception as e:                      # timeouts are common on WDQS
            last = e
            time.sleep(3 * (attempt + 1))
    raise RuntimeError("SPARQL failed after %d tries: %s" % (tries, last))


def qid(binding, var="g"):
    return binding[var]["value"].rsplit("/", 1)[1]


def all_games(platform_qid):
    """Every item that is a video game released on this platform."""
    rows = sparql("SELECT ?g WHERE { ?g wdt:P31 wd:Q7889 ; wdt:P400 wd:%s }" % platform_qid)
    return sorted({qid(b) for b in rows})


def sample(qids, n, seed):
    """Deterministic, reproducible draw — the protocol must be repeatable."""
    return sorted(qids, key=lambda q: hashlib.md5((q + seed).encode()).hexdigest())[:n]
