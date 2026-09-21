#!/usr/bin/env bash
# Enveloppe Node : comme pour le SDK .NET, rien n'est installé sur la
# machine. Même motif que dotnet.sh, mêmes raisons.
#
#   ./web.sh install     ./web.sh test     ./web.sh dev     ./web.sh build
#
# --user : sans lui, node_modules appartient à root et plus rien n'est
# modifiable ensuite.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mkdir -p "$ROOT/.npm-home"

cmd="${1:-test}"; shift || true
case "$cmd" in
  install) args=(npm install) ;;
  # Le TYPAGE fait partie de la vérification. Vitest transpile sans
  # contrôler les types : sept erreurs réelles dormaient dans une suite
  # entièrement verte, et seule la construction les a vues.
  test)    args=(sh -c "npm run typecheck && npm run test -- --run") ;;
  dev)     args=(npm run dev) ;;
  preview) args=(npm run preview) ;;
  build)   args=(npm run build) ;;
  npm)     args=(npm "$@"); set -- ;;
  *)       args=(npm run "$cmd") ;;
esac

# --network host : le mandataire de Vite doit joindre l'API sur 127.0.0.1,
# comme le conteneur du SDK .NET le fait pour PostgreSQL.
exec docker run --rm -t \
  --network host \
  --user "$(id -u):$(id -g)" \
  -v "$ROOT:/work" -w /work/web \
  -v "$ROOT/.npm-home:/home/node" \
  -e HOME=/home/node \
  -e npm_config_cache=/home/node/.npm \
  node:22-alpine "${args[@]}" "$@"
