#!/usr/bin/env bash
# Le parcours de bout en bout, dans un navigateur réel.
#
# Trois services doivent tourner ensemble : PostgreSQL, l'API, et le front
# construit. On les démarre, on joue le parcours, on arrête tout — et on
# échoue franchement si l'un d'eux ne vient pas, plutôt que de « sauter » le
# test, ce qui rendrait vert sans rien avoir vérifié.
#
# L'orchestration elle-même vit dans `services.sh`, partagée avec
# `session.sh` : le parcours doit démarrer l'application EXACTEMENT comme un
# testeur la reçoit, sinon il ne prouve rien de ce que le testeur voit.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"
# shellcheck source=services.sh
source "$ROOT/services.sh"

# L'image Docker doit porter EXACTEMENT la version du paquet npm : Playwright
# refuse de s'exécuter sinon. On lit donc la version dans package.json plutôt
# que de l'écrire deux fois — une plage « ^1.49.0 » avait fait glisser le
# paquet en 1.63 pendant que l'image restait en 1.49, et le parcours échouait
# pour une raison sans rapport avec le produit.
VERSION_PW="$(sed -n 's/.*"@playwright\/test": "\([0-9.]*\)".*/\1/p' web/package.json)"
[ -n "$VERSION_PW" ] || { echo "Version de @playwright/test introuvable." >&2; exit 1; }
IMAGE_PW="mcr.microsoft.com/playwright:v${VERSION_PW}-noble"

trap services_nettoyer EXIT
services_nettoyer

services_postgres
services_migrations
services_api
services_front

# PAS d'`exec` : il remplace le shell, et le piège EXIT ne s'exécute jamais.
# Les conteneurs survivaient donc à chaque exécution RÉUSSIE — seule la
# suivante les nettoyait, au démarrage. Deux d'entre eux ont tenu les ports
# pendant deux heures et servi une session de test à la place de l'application
# qu'elle croyait lancer.
echo "── parcours"
docker run --rm -t \
  --network host --user "$(id -u):$(id -g)" \
  -v "$ROOT:/work" -w /work/web \
  -v "$ROOT/.npm-home:/home/node" -e HOME=/home/node \
  -e npm_config_cache=/home/node/.npm \
  "$IMAGE_PW" \
  npx playwright test "$@"
