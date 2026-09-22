#!/usr/bin/env bash
# Les contrôles HORS LIGNE du référentiel, en une commande.
#
# ⚠️ Pourquoi ce script existe
#
# `CLAUDE.md` en présentait trois comme lançables. Deux n'acceptaient qu'un
# répertoire courant précis, le troisième aussi — et le quatrième, annoncé
# comme « lançable partout », ne peut PAS tourner sur un dépôt neuf : les
# jaquettes ne sont pas versionnées. **Un garde documenté et non lançable
# fait croire le sujet couvert.**
#
# Les quatre résolvent désormais leurs chemins depuis leur propre fichier :
# ils se lancent depuis n'importe où. Celui des jaquettes distingue « je
# n'ai pas pu » (code 2) de « j'ai trouvé une faute » (code 1) — un contrôle
# qui rendrait 0 sans avoir rien lu serait pire que pas de contrôle.
#
# Ils ne touchent pas au réseau et ne demandent ni .NET ni Node : seulement
# python3, pour les mêmes raisons que `calibration/` existe — ce sont des
# instruments, pas de l'architecture.
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 est absent : les contrôles du référentiel ne peuvent pas tourner." >&2
  exit 1
fi

CONTROLES=(
  "calibration/test_id_stability.py|invariant 9 sous trois perturbations"
  "calibration/test_wp_parser.py|le parseur d'infobox sur ses cas réels"
  "calibration/test_covers.py|les cinq conditions écrites de §3.3"
  "calibration/emit_notabilite.py|régénère dataset/NOTABILITE.md"
)

ECHECS=0
NON_LANCABLES=0
for entree in "${CONTROLES[@]}"; do
  script="${entree%%|*}"
  quoi="${entree##*|}"
  echo "── $script — $quoi"
  sortie="$(python3 "$script" 2>&1)"
  code=$?
  case "$code" in
    0) echo "   ✅ $(echo "$sortie" | tail -1)" ;;
    # 2 = le contrôle n'a pas pu s'exécuter, et il DIT ce qu'il lui faut.
    # Ce n'est pas un échec : c'est une absence déclarée.
    2) NON_LANCABLES=$((NON_LANCABLES + 1))
       echo "$sortie" | sed 's/^/   /' ;;
    *) ECHECS=$((ECHECS + 1))
       echo "$sortie" | tail -20 | sed 's/^/   /'
       echo "   ❌ $script" ;;
  esac
done

echo
if [ "$ECHECS" -ne 0 ]; then
  echo "$ECHECS contrôle(s) en échec." >&2
  exit 1
fi
if [ "$NON_LANCABLES" -ne 0 ]; then
  echo "Tout ce qui pouvait être contrôlé l'a été ; $NON_LANCABLES contrôle(s) ont dit ce qui leur manque."
  exit 0
fi
echo "Les quatre contrôles passent."
