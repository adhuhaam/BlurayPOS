#!/usr/bin/env bash
# Full sync: git push (if configured) → droplet code → local frontend build → production deploy
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

DROPLET_IP="${DROPLET_IP:-161.35.5.82}"
DROPLET_USER="${DROPLET_USER:-root}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519}"
SSH_OPTS=(-i "$SSH_KEY" -o StrictHostKeyChecking=accept-new)

echo "==> Git status"
git status -sb

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "ERROR: Uncommitted changes — commit first." >&2
  exit 1
fi

echo "==> Pushing to GitHub (if credentials available)..."
if git push origin main 2>/dev/null; then
  echo "Git push OK."
else
  echo "WARN: git push failed — no GitHub credentials on this machine." >&2
  echo "      Add SSH key to GitHub or run: gh auth login" >&2
  echo "      Continuing with droplet rsync from local files..." >&2
fi

echo "==> Building frontend locally (low-RAM safe)..."
cd "$REPO_ROOT/frontend"
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=768}"
if [ ! -d node_modules ]; then npm ci; fi
npm run build:production
bash "$REPO_ROOT/scripts/verify-frontend-production-build.sh"

echo "==> Syncing project to droplet..."
cd "$REPO_ROOT"
rsync -az --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude 'frontend/node_modules' \
  --exclude 'terminal_app' \
  --exclude '**/bin' \
  --exclude '**/obj' \
  --exclude '**/build' \
  --exclude '.env' \
  -e "ssh ${SSH_OPTS[*]}" \
  "$REPO_ROOT/" "${DROPLET_USER}@${DROPLET_IP}:/opt/bluraypos/"

if [ -f "$REPO_ROOT/.env" ]; then
  scp "${SSH_OPTS[@]}" "$REPO_ROOT/.env" "${DROPLET_USER}@${DROPLET_IP}:/opt/bluraypos/.env"
fi

echo "==> Syncing frontend dist to /var/www/bluraypos ..."
FRONTEND="$REPO_ROOT/frontend"
ssh "${SSH_OPTS[@]}" "${DROPLET_USER}@${DROPLET_IP}" 'mkdir -p /var/www/bluraypos/{landing,office,pos,menu,order,coupons}'
rsync -az --delete -e "ssh ${SSH_OPTS[*]}" "$FRONTEND/apps/marketing-site/dist/" "${DROPLET_USER}@${DROPLET_IP}:/var/www/bluraypos/landing/"
rsync -az --delete -e "ssh ${SSH_OPTS[*]}" "$FRONTEND/apps/admin-portal/dist/" "${DROPLET_USER}@${DROPLET_IP}:/var/www/bluraypos/office/"
rsync -az --delete -e "ssh ${SSH_OPTS[*]}" "$FRONTEND/apps/pos-terminal/dist/" "${DROPLET_USER}@${DROPLET_IP}:/var/www/bluraypos/pos/"
rsync -az --delete -e "ssh ${SSH_OPTS[*]}" "$FRONTEND/apps/online-menu/dist/" "${DROPLET_USER}@${DROPLET_IP}:/var/www/bluraypos/menu/"
rsync -az --delete -e "ssh ${SSH_OPTS[*]}" "$FRONTEND/apps/online-order/dist/" "${DROPLET_USER}@${DROPLET_IP}:/var/www/bluraypos/order/"
rsync -az --delete -e "ssh ${SSH_OPTS[*]}" "$FRONTEND/apps/coupons-site/dist/" "${DROPLET_USER}@${DROPLET_IP}:/var/www/bluraypos/coupons/"

echo "==> Deploying API on droplet (skip server npm)..."
ssh "${SSH_OPTS[@]}" "${DROPLET_USER}@${DROPLET_IP}" bash -s <<'REMOTE'
set -euo pipefail
cd /opt/bluraypos
chmod +x scripts/*.sh
export SKIP_SERVER_NPM=1
export SKIP_STATIC_PUBLISH=1
bash scripts/deploy-production.sh
chown -R www-data:www-data /var/www/bluraypos
bash scripts/verify-production.sh
REMOTE

echo ""
echo "Sync complete."
echo "  GitHub:  https://github.com/adhuhaam/BlurayPOS"
echo "  Office:  https://office.bluraymaldives.site"
echo "  API:     https://api.bluraymaldives.site/health"
