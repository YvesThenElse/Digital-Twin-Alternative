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

NOM="${1:-}"
if [ -z "$NOM" ]; then
  echo "Usage : ./session.sh <nom-du-testeur>" >&2
  echo "        ./session.sh --mesures <identifiant-de-profil>" >&2
  exit 1
fi

# Le nom du testeur ne sert qu'à le reconnaître dans la feuille de session :
# on le réduit à ce qui tient dans un identifiant, sans chercher à être malin.
NOM_PROPRE="$(printf '%s' "$NOM" | tr '[:upper:]' '[:lower:]' | tr -c 'a-z0-9' '_' | sed 's/_*$//')"
[ -n "$NOM_PROPRE" ] || { echo "Nom inutilisable : « $NOM »." >&2; exit 1; }

# L'horodatage rend le profil unique même si le même testeur revient, ou si
# deux personnes portent le même prénom. Sans lui, la seconde session lirait
# l'histoire de la première et la mesure serait fausse sans le dire.
PROFIL="usr_test_${NOM_PROPRE}_$(date +%Y%m%d%H%M)"

trap services_nettoyer EXIT

services_nettoyer
services_postgres
services_migrations
services_api
services_front

cat <<FIN

  ────────────────────────────────────────────────────────────────
   Session : $NOM
   Profil  : $PROFIL

   Adresse à ouvrir :

     ${FRONT_URL}/?profil=${PROFIL}

   Notez le profil dans la feuille de session : c'est la seule clé
   qui relie l'observation aux mesures.

   Enregistrez l'écran. Les gestes ne sont pas instrumentés ; sans
   enregistrement, le KPI « gestes par jeu déclaré » n'existe pas.

   À la fin :   ./session.sh --mesures $PROFIL
   Pour clore : Ctrl-C  (les données restent en base)
  ────────────────────────────────────────────────────────────────

FIN

# On attend. `wait` seul rendrait la main aussitôt : aucun processus enfant
# n'est suivi ici, les services tournant dans des conteneurs détachés.
while true; do sleep 3600 & wait $!; done
