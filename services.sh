#!/usr/bin/env bash
# Les trois services de l'application, démarrés de la même façon partout.
#
# Deux appelants : `e2e.sh`, qui joue le parcours puis démonte tout, et
# `session.sh`, qui laisse l'application ouverte pour un testeur. Écrire
# l'orchestration deux fois la ferait diverger — et le jour où elle diverge,
# le parcours de bout en bout ne prouve plus rien de ce que voit le testeur.
#
# Ce fichier n'est pas exécutable : il se source.
#
#   source services.sh
#   services_nettoyer; services_postgres; services_migrations
#   services_api; services_front

SERVICES_RACINE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

API_CONTENEUR=dt-api
WEB_CONTENEUR=dt-web

# Les ports sont FIXÉS, pas configurables : `vite.config.ts` écrit la cible du
# mandataire en dur. Les rendre variables ici donnerait un front qui démarre
# et qui ne joint rien — un écran vide, sans erreur.
# L'API reste TOUJOURS sur la boucle locale, même quand le front est exposé :
# le mandataire de Vite tourne sur cette machine et l'y joint sans passer par
# le réseau. Une surface de moins, et aucune raison d'en ouvrir une seconde.
API_URL=http://127.0.0.1:5199

# Le front, lui, peut être lié ailleurs — voir `session.sh --reseau`.
services_hote_front() {
  SERVICES_FRONT_HOTE="$1"
  FRONT_URL="http://${SERVICES_FRONT_HOTE}:4173"
}
services_hote_front 127.0.0.1

services_nettoyer() {
  # `dt-*-e2e` sont les anciens noms : un dépôt mis à jour peut en traîner,
  # et ils tiennent les mêmes ports.
  docker rm -f "$API_CONTENEUR" "$WEB_CONTENEUR" dt-api-e2e dt-web-e2e \
    >/dev/null 2>&1 || true
}

# Le port doit être LIBRE avant qu'on démarre.
#
# Sans cette vérification, la sonde de démarrage accepte la réponse de
# n'importe quel serveur : un conteneur oublié d'une exécution précédente
# répond `200`, le conteneur qu'on vient de lancer meurt sur « address
# already in use », et l'orchestration se déclare prête. On sert alors une
# AUTRE construction que celle qu'on croit — un testeur mesurerait un produit
# qui n'est pas celui du dépôt, et rien ne le dirait.
#
# C'est arrivé : deux conteneurs vieux de deux heures servaient encore.
services_port_libre() {
  local url="$1" quoi="$2"
  curl -sf --max-time 2 "$url" >/dev/null 2>&1 || return 0
  {
    echo "Quelque chose écoute déjà sur $url — le $quoi ne peut pas démarrer."
    echo "Conteneurs en cours :"
    docker ps --format '  {{.Names}} ({{.Status}})' | grep -E 'dt-|digitaltwin' || echo "  aucun"
    echo "Fermez-les, puis relancez."
  } >&2
  return 1
}

# Notre conteneur tourne-t-il encore ? Un conteneur mort à la seconde n'est
# pas un conteneur lent.
services_vivant() {
  [ "$(docker inspect -f '{{.State.Running}}' "$1" 2>/dev/null)" = "true" ]
}

services_postgres() {
  echo "── PostgreSQL"
  docker compose -f "$SERVICES_RACINE/docker-compose.yml" up -d postgres >/dev/null
  local etat=absent
  for _ in $(seq 1 60); do
    etat="$(docker inspect -f '{{.State.Health.Status}}' digitaltwin-postgres 2>/dev/null || echo absent)"
    [ "$etat" = "healthy" ] && break
    sleep 1
  done
  # Échouer franchement plutôt que de continuer : une base injoignable donne
  # une application qui démarre et qui perd tout ce que le testeur saisit.
  [ "$etat" = "healthy" ] || { echo "PostgreSQL n'est pas sain." >&2; return 1; }
}

services_migrations() {
  echo "── migrations"
  (cd "$SERVICES_RACINE" && ./dotnet.sh dotnet-ef database update \
     --project src/DigitalTwin.Api >/dev/null)
}

services_api() {
  echo "── API"
  services_port_libre "$API_URL/health" "service d'API" || return 1
  docker run --rm -d --name "$API_CONTENEUR" \
    --network host --user "$(id -u):$(id -g)" \
    -v "$SERVICES_RACINE:/work" -w /work \
    -v "$SERVICES_RACINE/.dotnet-home:/home/app" -e HOME=/home/app \
    -e DOTNET_CLI_TELEMETRY_OPTOUT=1 \
    -e ASPNETCORE_URLS="$API_URL" \
    mcr.microsoft.com/dotnet/sdk:10.0 \
    dotnet run --project src/DigitalTwin.Api --no-launch-profile >/dev/null

  for _ in $(seq 1 90); do
    curl -sf "$API_URL/health" >/dev/null 2>&1 && return 0
    services_vivant "$API_CONTENEUR" || break
    sleep 2
  done
  echo "L'API n'a pas démarré :" >&2
  docker logs "$API_CONTENEUR" 2>&1 | tail -20 >&2
  return 1
}

services_front() {
  echo "── front"
  services_port_libre "$FRONT_URL/" "front" || return 1
  (cd "$SERVICES_RACINE" && ./web.sh build >/dev/null)
  docker run --rm -d --name "$WEB_CONTENEUR" \
    --network host --user "$(id -u):$(id -g)" \
    -v "$SERVICES_RACINE:/work" -w /work/web \
    -v "$SERVICES_RACINE/.npm-home:/home/node" -e HOME=/home/node \
    node:22-alpine npm run preview -- --host "$SERVICES_FRONT_HOTE" >/dev/null

  for _ in $(seq 1 60); do
    curl -sf "$FRONT_URL/" >/dev/null 2>&1 && return 0
    services_vivant "$WEB_CONTENEUR" || break
    sleep 1
  done
  echo "Le front n'a pas démarré." >&2
  docker logs "$WEB_CONTENEUR" 2>&1 | tail -20 >&2
  return 1
}
