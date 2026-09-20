#!/usr/bin/env bash
# Enveloppe dotnet : le SDK n'est pas installé sur la machine, il tourne en
# conteneur. Cohérent avec la décision « Docker Compose pour le dev local »
# (PHASING §4), et évite d'imposer une installation système.
#
#   ./dotnet.sh build      ./dotnet.sh test      ./dotnet.sh new ...
#
# --user : sans lui, le conteneur écrit des fichiers appartenant à root dans
# l'arbre de travail, et plus rien n'est modifiable ensuite.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mkdir -p "$ROOT/.dotnet-home"
exec docker run --rm -t \
  --user "$(id -u):$(id -g)" \
  -v "$ROOT:/work" -w /work \
  -v "$ROOT/.dotnet-home:/home/app" \
  -e HOME=/home/app \
  -e DOTNET_CLI_TELEMETRY_OPTOUT=1 \
  -e DOTNET_NOLOGO=1 \
  mcr.microsoft.com/dotnet/sdk:10.0 dotnet "$@"
