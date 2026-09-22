"""Les jaquettes contre les cinq conditions écrites de VERIFICATION-JURIDIQUE §3.3.

Contrôle hors ligne, comme `test_id_stability.py` : il lit les fichiers du
dépôt et n'appelle rien.

Ce qu'il a trouvé la première fois : **le manifeste inscrivait `width: 512`
pour les 218 visuels**, alors que les fichiers mesurent de 213 à 960 px. Ce
n'était pas une mesure mais la taille *demandée* à la source ; le nombre
d'octets, lui, était juste. Or ce manifeste est la pièce qui documente la
conformité — une demande de retrait s'y appuie.

    python3 calibration/test_covers.py
"""
import json
import pathlib
import struct
import sys

RACINE = pathlib.Path(__file__).resolve().parent.parent
COVERS = RACINE / "dataset" / "covers"
MANIFESTE = COVERS / "MANIFEST.json"

# Condition 1 de §3.3 : « 512 px de large au plus ».
LARGEUR_MAX = 512


def dimensions(octets: bytes) -> tuple[int, int] | None:
    """Largeur et hauteur, lues dans l'en-tête. PNG, JPEG et WebP."""
    if octets[:8] == b"\x89PNG\r\n\x1a\n":
        return struct.unpack(">II", octets[16:24])

    if octets[:2] == b"\xff\xd8":
        i = 2
        while i < len(octets) - 9:
            if octets[i] != 0xFF:
                i += 1
                continue
            marqueur = octets[i + 1]
            # Les marqueurs SOF portent les dimensions ; DHT, JPG et DAC non.
            if 0xC0 <= marqueur <= 0xCF and marqueur not in (0xC4, 0xC8, 0xCC):
                hauteur, largeur = struct.unpack(">HH", octets[i + 5 : i + 9])
                return largeur, hauteur
            if marqueur in (0xD8, 0xD9) or 0xD0 <= marqueur <= 0xD7:
                i += 2
                continue
            i += 2 + struct.unpack(">H", octets[i + 2 : i + 4])[0]
        return None

    if octets[:4] == b"RIFF" and octets[8:12] == b"WEBP":
        forme = octets[12:16]
        if forme == b"VP8X":
            largeur = int.from_bytes(octets[24:27], "little") + 1
            hauteur = int.from_bytes(octets[27:30], "little") + 1
            return largeur, hauteur
        if forme == b"VP8 ":
            largeur = struct.unpack("<H", octets[26:28])[0] & 0x3FFF
            hauteur = struct.unpack("<H", octets[28:30])[0] & 0x3FFF
            return largeur, hauteur
        if forme == b"VP8L":
            bits = int.from_bytes(octets[21:25], "little")
            return (bits & 0x3FFF) + 1, ((bits >> 14) & 0x3FFF) + 1
    return None


def controler() -> int:
    manifeste = json.loads(MANIFESTE.read_text())
    fautes: list[str] = []

    fichiers = {
        p.name
        for p in COVERS.iterdir()
        if p.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp")
    }
    attendus = {e["file"] for e in manifeste.values()}

    for absent in sorted(attendus - fichiers):
        fautes.append(f"au manifeste mais absent du disque : {absent}")
    for orphelin in sorted(fichiers - attendus):
        fautes.append(f"sur le disque mais hors manifeste : {orphelin}")

    trop_larges: list[str] = []
    for cle, entree in sorted(manifeste.items()):
        chemin = COVERS / entree["file"]
        if not chemin.exists():
            continue
        octets = chemin.read_bytes()

        mesure = dimensions(octets)
        if mesure is None:
            fautes.append(f"{entree['file']} : format illisible")
            continue
        largeur, hauteur = mesure

        # Condition 2 : l'origine est conservée par visuel. Sans elle, une
        # demande de retrait est ingérable.
        for champ in ("source_url", "licence", "regime"):
            if not entree.get(champ):
                fautes.append(f"{cle} : champ « {champ} » manquant")

        if entree.get("bytes") != len(octets):
            fautes.append(
                f"{cle} : le manifeste annonce {entree.get('bytes')} octets, "
                f"le fichier en porte {len(octets)}"
            )

        # Le manifeste DÉCRIT le fichier ; il ne dit pas ce qu'on espérait.
        if (entree.get("width"), entree.get("height")) != (largeur, hauteur):
            fautes.append(
                f"{cle} : le manifeste annonce "
                f"{entree.get('width')}×{entree.get('height')}, "
                f"le fichier mesure {largeur}×{hauteur}"
            )

        if largeur > LARGEUR_MAX:
            trop_larges.append(f"{cle} : {largeur} px de large ({entree['file']})")

    print(f"{len(manifeste)} visuels au manifeste, {len(fichiers)} sur le disque")

    if trop_larges:
        print(f"\n⚠️  Condition 1 — {LARGEUR_MAX} px de large au plus :")
        for ligne in trop_larges:
            print(f"    {ligne}")

    if fautes:
        print(f"\n❌ {len(fautes)} écart(s) entre le manifeste et les fichiers :")
        for ligne in fautes[:20]:
            print(f"    {ligne}")
        if len(fautes) > 20:
            print(f"    … et {len(fautes) - 20} autres")
        return 1

    if trop_larges:
        return 1

    print("✅ Manifeste et fichiers concordent ; les cinq conditions tiennent.")
    return 0


if __name__ == "__main__":
    sys.exit(controler())
