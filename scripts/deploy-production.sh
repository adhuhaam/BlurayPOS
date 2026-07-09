#!/usr/bin/env bash
# BlurayPOS production deploy — systemd API + Docker infra (PostgreSQL, Redis)
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

if [ ! -f .env ]; then
  echo "Missing .env — copy .env.production.example to .env and set secrets."
  exit 1
fi

# shellcheck disable=SC1091
set -a && source .env && set +a

: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD required}"
: "${JWT_SECRET:?JWT_SECRET required}"
: "${API_URL:?API_URL required}"

API_PORT="${API_PORT:-5000}"
PUBLISH_DIR="/opt/bluraypos/publish/api"

echo "==> Pulling latest code..."
if [ -d .git ]; then
  git pull --ff-only origin main || true
fi

echo "==> Starting infrastructure (PostgreSQL + Redis)..."
docker compose -f docker-compose.infra.yml up -d
sleep 5

echo "==> Running database migrations..."
export PATH="/usr/share/dotnet:$PATH:$HOME/.dotnet/tools"
export DOTNET_CLI_TELEMETRY_OPTOUT=1
if ! command -v dotnet-ef >/dev/null 2>&1; then
  dotnet tool install --global dotnet-ef --version 9.0.4
fi
export ConnectionStrings__DefaultConnection="Host=127.0.0.1;Port=5432;Database=${POSTGRES_DB:-pos_prod};Username=${POSTGRES_USER:-pos};Password=${POSTGRES_PASSWORD}"
dotnet ef database update \
  --project backend/src/Pos.Infrastructure/Pos.Infrastructure.csproj \
  --startup-project backend/src/Pos.Api/Pos.Api.csproj

echo "==> Publishing API..."
mkdir -p "$PUBLISH_DIR"
dotnet publish backend/src/Pos.Api/Pos.Api.csproj \
  -c Release \
  -o "$PUBLISH_DIR" \
  --no-self-contained

chown -R www-data:www-data "$PUBLISH_DIR"

echo "==> Building frontend (frontend/env/.env.production)..."
bash "$REPO_ROOT/scripts/build-frontend-production.sh"
bash "$REPO_ROOT/scripts/verify-frontend-production-build.sh"

echo "==> Publishing static files..."
FRONTEND="$REPO_ROOT/frontend"
rsync -a --delete "$FRONTEND/apps/marketing-site/dist/" /var/www/bluraypos/landing/
rsync -a --delete "$FRONTEND/apps/admin-portal/dist/" /var/www/bluraypos/office/
rsync -a --delete "$FRONTEND/apps/pos-terminal/dist/" /var/www/bluraypos/pos/
mkdir -p /var/www/bluraypos/menu /var/www/bluraypos/order /var/www/bluraypos/coupons
rsync -a --delete "$FRONTEND/apps/online-menu/dist/" /var/www/bluraypos/menu/
rsync -a --delete "$FRONTEND/apps/online-order/dist/" /var/www/bluraypos/order/
rsync -a --delete "$FRONTEND/apps/coupons-site/dist/" /var/www/bluraypos/coupons/
chown -R www-data:www-data /var/www/bluraypos

echo "==> Restarting API service..."
systemctl daemon-reload
systemctl enable bluraypos-api
systemctl restart bluraypos-api

echo "==> Waiting for API health..."
for i in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:${API_PORT}/live" >/dev/null 2>&1; then
    echo "API is live."
    break
  fi
  sleep 2
done

echo "==> Reloading nginx..."
cd "$REPO_ROOT"
bash scripts/setup-subdomains.sh || true
nginx -t && systemctl reload nginx

echo ""
echo "Deployment complete."
echo "  Website: https://${DOMAIN:-bluraymaldives.site}"
echo "  Office:  https://office.${DOMAIN:-bluraymaldives.site}"
echo "  POS:     https://pos.${DOMAIN:-bluraymaldives.site}"
echo "  Menu:    https://menu.${DOMAIN:-bluraymaldives.site}"
echo "  Order:   https://order.${DOMAIN:-bluraymaldives.site}"
echo "  Coupons: https://coupons.${DOMAIN:-bluraymaldives.site}"
echo "  API:     ${API_URL}"
echo "  Health:  ${API_URL}/health"
echo "  Ready:   ${API_URL}/ready"
echo "  Live:    ${API_URL}/live"
