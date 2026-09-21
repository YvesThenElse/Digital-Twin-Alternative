#!/usr/bin/env bash
# Une session de test utilisateur (Phase 2).
#
#   ./session.sh marie
#
# Démarre l'application telle qu'un testeur la reçoit — le front CONSTRUIT,
# pas le serveur de développement — et rend l'adresse à ouvrir, profil vierge
# compris. Reste ouverte jusqu'à Ctrl-C.
#
# Pourquoi un script et pas trois commandes dans le protocole : la session
# numéro un ne doit pas commencer par un dépannage. Et le profil est frappé
# ici plutôt que saisi à la main, parce qu'un profil réutilisé ferait lire à
# quelqu'un l'histoire d'un autre — le parcours de bout en bout a déjà passé
# au vert sur des restes une fois.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"
# shellcheck source=services.sh
source "$ROOT/services.sh"

# --- les mesures, une fois la session close -------------------------------
#
# Même script que la session : le testeur suivant arrive vite, et deux
# commandes à retenir en font une à oublier.
if [ "${1:-}" = "--mesures" ]; then
  PROFIL="${2:-}"
  [ -n "$PROFIL" ] || { echo "Usage : ./session.sh --mesures <profil>" >&2; exit 1; }

  # `ON_ERROR_STOP` : une requête qui échoue doit arrêter le relevé, jamais
  # laisser croire que l'indicateur manquant vaut zéro.
  exec docker compose -f "$ROOT/docker-compose.yml" exec -T postgres \
    psql -U digitaltwin -d digitaltwin -v ON_ERROR_STOP=1 \
    -v profil="$PROFIL" -f - < "$ROOT/mesures/kpi.sql"
fi

# --- tout arrêter ---------------------------------------------------------
if [ "${1:-}" = "--arret" ]; then
  services_nettoyer
  echo "Application arrêtée. Les données restent en base."
  exit 0
fi

# --- exposer sur le tailnet ----------------------------------------------
#
# Lié à l'ADRESSE TAILSCALE, pas à 0.0.0.0. Le pare-feu place déjà `ens33`
# dans une zone fermée, mais s'appuyer là-dessus ferait dépendre la portée de
# l'application d'un réglage qu'elle ne contrôle pas. Une liaison explicite
# dit ce qu'on expose, et à qui.
RESEAU=0
if [ "${1:-}" = "--reseau" ]; then
  RESEAU=1
  shift
  command -v tailscale >/dev/null || {
    echo "tailscale est introuvable : impossible d'exposer sur le tailnet." >&2; exit 1; }
  IP_TAILNET="$(tailscale ip -4 2>/dev/null | head -1)"
  [ -n "$IP_TAILNET" ] || {
    echo "Aucune adresse Tailscale : la machine est-elle connectée ?" >&2; exit 1; }
  services_hote_front "$IP_TAILNET"
  NOM_TAILNET="$(tailscale status --json 2>/dev/null \
    | python3 -c 'import sys,json; print(json.load(sys.stdin)["Self"]["DNSName"].rstrip("."))' \
    2>/dev/null || true)"
fi

NOM="${1:-}"
if [ -z "$NOM" ] && [ "$RESEAU" = 0 ]; then
  echo "Usage : ./session.sh <nom-du-testeur>" >&2
  echo "        ./session.sh --reseau [<nom-du-testeur>]  (accessible depuis le tailnet)" >&2
  echo "        ./session.sh --mesures <identifiant-de-profil>" >&2
  echo "        ./session.sh --arret" >&2
  exit 1
fi

# Le nom du testeur ne sert qu'à le reconnaître dans la feuille de session :
# on le réduit à ce qui tient dans un identifiant, sans chercher à être malin.
if [ -n "$NOM" ]; then
  NOM_PROPRE="$(printf '%s' "$NOM" | tr '[:upper:]' '[:lower:]' | tr -c 'a-z0-9' '_' | sed 's/_*$//')"
  [ -n "$NOM_PROPRE" ] || { echo "Nom inutilisable : « $NOM »." >&2; exit 1; }
  # L'horodatage rend le profil unique même si le même testeur revient, ou si
  # deux personnes portent le même prénom. Sans lui, la seconde session lirait
  # l'histoire de la première et la mesure serait fausse sans le dire.
  PROFIL="usr_test_${NOM_PROPRE}_$(date +%Y%m%d%H%M)"
  REQUETE="?profil=$PROFIL"
else
  # `--reseau` sans nom : on regarde l'application, on ne conduit pas une
  # session. Le profil est celui que l'application prend par défaut, et il
  # PERSISTE d'une visite à l'autre — c'est ce qu'on veut pour explorer.
  NOM="(exploration)"
  PROFIL="usr_local"
  REQUETE=""
fi

# Le piège de nettoyage n'existe qu'en mode bloquant. En mode réseau le
# script rend la main et l'application doit SURVIVRE : y laisser le piège
# arrêterait tout à la seconde où la commande se termine.
[ "$RESEAU" = 1 ] || trap services_nettoyer EXIT

services_nettoyer
services_postgres
services_migrations
services_api
services_front

echo
echo "  ────────────────────────────────────────────────────────────────"
echo "   Session : $NOM"
echo "   Profil  : $PROFIL"
echo
echo "   Adresse à ouvrir :"
echo
echo "     ${FRONT_URL}/${REQUETE}"
if [ "$RESEAU" = 1 ] && [ -n "${NOM_TAILNET:-}" ]; then
  echo "     http://${NOM_TAILNET}:4173/${REQUETE}"
fi
echo
if [ "$RESEAU" = 1 ]; then
  echo "   Joignable depuis le tailnet UNIQUEMENT. L'application n'a"
  echo "   aucune authentification : qui atteint cette adresse lit et"
  echo "   écrit n'importe quel profil."
  echo
  echo "   Relevé :  ./session.sh --mesures $PROFIL"
  echo "   Arrêt  :  ./session.sh --arret   (les données restent en base)"
else
  echo "   Notez le profil dans la feuille de session : c'est la seule clé"
  echo "   qui relie l'observation aux mesures."
  echo
  echo "   Enregistrez l'écran. Les gestes ne sont pas instrumentés ; sans"
  echo "   enregistrement, le KPI « gestes par jeu déclaré » n'existe pas."
  echo
  echo "   À la fin :   ./session.sh --mesures $PROFIL"
  echo "   Pour clore : Ctrl-C  (les données restent en base)"
fi
echo "  ────────────────────────────────────────────────────────────────"
echo

# En mode réseau, on rend la main : les services tournent dans des conteneurs
# détachés et n'ont pas besoin de ce shell.
[ "$RESEAU" = 1 ] && exit 0

# Sinon on attend. `wait` seul rendrait la main aussitôt : aucun processus
# enfant n'est suivi ici.
while true; do sleep 3600 & wait $!; done
