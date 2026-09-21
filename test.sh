#!/usr/bin/env bash
# La commande de vérification, une seule, sans argument à retenir.
#
# ⚠️ Pourquoi une boucle plutôt que `dotnet test src/DigitalTwin.slnx`
#
# Avec plusieurs projets de test, cette commande n'en exécute **qu'un seul**
# — « A total of 1 test files matched the specified pattern » — et affiche
# `Passed!` comme si tout avait tourné. Le jour où DigitalTwin.Api.Tests a
# été ajouté, les 382 tests du domaine ont cessé d'être exécutés sans que
# rien ne le signale.
#
# On construit donc une fois, puis on exécute chaque projet de test
# explicitement, et on refuse de rendre 0 si la découverte n'a rien trouvé.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

# PostgreSQL est une dépendance DURE de la suite, pas une option.
#
# Les tests de persistance pourraient être « sautés » quand la base est
# absente. Ce serait la pire issue : une suite verte qui n'a pas vérifié la
# persistance ressemble exactement à une suite verte qui l'a vérifiée. On
# démarre donc la base, et on échoue franchement si elle ne vient pas.
if ! docker compose up -d postgres >/dev/null 2>&1; then
  echo "PostgreSQL n'a pas démarré — la suite ne peut pas vérifier la persistance." >&2
  exit 1
fi
for _ in $(seq 1 60); do
  etat="$(docker inspect -f '{{.State.Health.Status}}' digitaltwin-postgres 2>/dev/null || echo absent)"
  [ "$etat" = "healthy" ] && break
  sleep 1
done
if [ "$etat" != "healthy" ]; then
  echo "PostgreSQL n'est pas sain après 60 s (état : $etat)." >&2
  exit 1
fi

./dotnet.sh build src/DigitalTwin.slnx

mapfile -t PROJETS < <(find src -maxdepth 1 -type d -name '*.Tests' | sort)
if [ "${#PROJETS[@]}" -eq 0 ]; then
  echo "AUCUN projet de test trouvé sous src/ — vérification vide, donc fausse." >&2
  exit 1
fi

echo "projets de test : ${#PROJETS[@]}"
ECHECS=0
for projet in "${PROJETS[@]}"; do
  nom="$(basename "$projet")"
  echo "── $nom"
  if ! ./dotnet.sh test "$projet" --no-build "$@"; then
    ECHECS=$((ECHECS + 1))
  fi
done

if [ "$ECHECS" -ne 0 ]; then
  echo "$ECHECS projet(s) de test en échec." >&2
  exit 1
fi
