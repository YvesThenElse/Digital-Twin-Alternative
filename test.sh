#!/usr/bin/env bash
# La commande de vérification, une seule, sans argument à retenir.
# .NET 10 utilise le format de solution .slnx.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
exec ./dotnet.sh test src/DigitalTwin.slnx "$@"
