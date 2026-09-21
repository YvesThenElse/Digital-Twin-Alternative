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
  test)    args=(npm run test -- --run) ;;
  dev)     args=(npm run dev -- --host 0.0.0.0) ;;
  build)   args=(npm run build) ;;
  npm)     args=(npm "$@"); set -- ;;
  *)       args=(npm run "$cmd") ;;
esac

exec docker run --rm -t \
  --user "$(id -u):$(id -g)" \
  -v "$ROOT:/work" -w /work/web \
  -v "$ROOT/.npm-home:/home/node" \
  -e HOME=/home/node \
  -e npm_config_cache=/home/node/.npm \
  -p 5173:5173 \
  node:22-alpine "${args[@]}" "$@"
