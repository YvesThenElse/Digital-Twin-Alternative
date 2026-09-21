#!/usr/bin/env bash
# Le parcours de bout en bout, dans un navigateur réel.
#
# Trois services doivent tourner ensemble : PostgreSQL, l'API, et le front
# construit. On les démarre, on joue le parcours, on arrête tout — et on
# échoue franchement si l'un d'eux ne vient pas, plutôt que de « sauter » le
# test, ce qui rendrait vert sans rien avoir vérifié.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

API_CONTENEUR=dt-api-e2e
WEB_CONTENEUR=dt-web-e2e

# L'image Docker doit porter EXACTEMENT la version du paquet npm : Playwright
# refuse de s'exécuter sinon. On lit donc la version dans package.json plutôt
# que de l'écrire deux fois — une plage « ^1.49.0 » avait fait glisser le
# paquet en 1.63 pendant que l'image restait en 1.49, et le parcours échouait
# pour une raison sans rapport avec le produit.
VERSION_PW="$(sed -n 's/.*"@playwright\/test": "\([0-9.]*\)".*/\1/p' web/package.json)"
[ -n "$VERSION_PW" ] || { echo "Version de @playwright/test introuvable." >&2; exit 1; }
IMAGE_PW="mcr.microsoft.com/playwright:v${VERSION_PW}-noble"

nettoyer() {
  docker rm -f "$API_CONTENEUR" "$WEB_CONTENEUR" >/dev/null 2>&1 || true
}
trap nettoyer EXIT
nettoyer

echo "── PostgreSQL"
docker compose up -d postgres >/dev/null
for _ in $(seq 1 60); do
  etat="$(docker inspect -f '{{.State.Health.Status}}' digitaltwin-postgres 2>/dev/null || echo absent)"
  [ "$etat" = "healthy" ] && break
  sleep 1
done
[ "$etat" = "healthy" ] || { echo "PostgreSQL n'est pas sain." >&2; exit 1; }

echo "── migrations"
./dotnet.sh dotnet-ef database update --project src/DigitalTwin.Api >/dev/null

echo "── API"
docker run --rm -d --name "$API_CONTENEUR" \
  --network host --user "$(id -u):$(id -g)" \
  -v "$ROOT:/work" -w /work \
  -v "$ROOT/.dotnet-home:/home/app" -e HOME=/home/app \
  -e DOTNET_CLI_TELEMETRY_OPTOUT=1 \
  -e ASPNETCORE_URLS=http://127.0.0.1:5199 \
  mcr.microsoft.com/dotnet/sdk:10.0 \
  dotnet run --project src/DigitalTwin.Api --no-launch-profile >/dev/null

for _ in $(seq 1 90); do
  curl -sf http://127.0.0.1:5199/health >/dev/null 2>&1 && break
  sleep 2
done
curl -sf http://127.0.0.1:5199/health >/dev/null || {
  echo "L'API n'a pas démarré :" >&2; docker logs "$API_CONTENEUR" 2>&1 | tail -20 >&2; exit 1; }

echo "── front"
./web.sh build >/dev/null
docker run --rm -d --name "$WEB_CONTENEUR" \
  --network host --user "$(id -u):$(id -g)" \
  -v "$ROOT:/work" -w /work/web \
  -v "$ROOT/.npm-home:/home/node" -e HOME=/home/node \
  node:22-alpine npm run preview >/dev/null

for _ in $(seq 1 60); do
  curl -sf http://127.0.0.1:4173/ >/dev/null 2>&1 && break
  sleep 1
done
curl -sf http://127.0.0.1:4173/ >/dev/null || {
  echo "Le front n'a pas démarré." >&2; docker logs "$WEB_CONTENEUR" 2>&1 | tail -20 >&2; exit 1; }

echo "── parcours"
exec docker run --rm -t \
  --network host --user "$(id -u):$(id -g)" \
  -v "$ROOT:/work" -w /work/web \
  -v "$ROOT/.npm-home:/home/node" -e HOME=/home/node \
  -e npm_config_cache=/home/node/.npm \
  "$IMAGE_PW" \
  npx playwright test "$@"
