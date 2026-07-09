#!/usr/bin/env bash
# Deploy BlurayPOS to the current server (run from repo root on the droplet)
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

if [ ! -f .env ]; then
  echo "Missing .env — copy .env.production.example to .env and set secrets."
  exit 1
fi

# shellcheck disable=SC1091
set -a && source .env && set +a

: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD required in .env}"
: "${JWT_SECRET:?JWT_SECRET required in .env}"
: "${API_URL:?API_URL required in .env}"

echo "==> Pulling latest code..."
if [ -d .git ]; then
  git pull --ff-only origin main || true
fi

echo "==> Building and starting API + database..."
docker compose -f docker-compose.prod.yml up -d --build postgres
sleep 5

echo "==> Running database migrations..."
docker compose -f docker-compose.prod.yml run --rm migrate

echo "==> Starting API..."
docker compose -f docker-compose.prod.yml up -d --build api

echo "==> Building frontend..."
cd frontend
npm ci
VITE_API_URL="$API_URL" npm run build -w @pos/admin-portal
VITE_API_URL="$API_URL" npm run build -w @pos/pos-terminal

echo "==> Publishing static files..."
rsync -a --delete apps/admin-portal/dist/ /var/www/bluraypos/admin/
rsync -a --delete apps/pos-terminal/dist/ /var/www/bluraypos/pos/

echo "==> Reloading nginx..."
nginx -t && systemctl reload nginx

echo ""
echo "Deployment complete."
echo "  Admin:  https://${DOMAIN:-bluraymaldives.site}"
echo "  POS:    https://pos.${DOMAIN:-bluraymaldives.site}"
echo "  API:    ${API_URL}"
echo "  Health: ${API_URL}/health"
echo ""
echo "Register your first store at https://${DOMAIN:-bluraymaldives.site}/register"
