#!/usr/bin/env bash
# Run from your dev machine to push BlurayPOS to the DigitalOcean droplet
set -euo pipefail

DROPLET_IP="${DROPLET_IP:-161.35.5.82}"
DROPLET_USER="${DROPLET_USER:-root}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

SSH_OPTS=(-i "$SSH_KEY" -o StrictHostKeyChecking=accept-new)

echo "==> Syncing project to ${DROPLET_USER}@${DROPLET_IP}:/opt/bluraypos ..."
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
  echo "==> Copying .env ..."
  scp "${SSH_OPTS[@]}" "$REPO_ROOT/.env" "${DROPLET_USER}@${DROPLET_IP}:/opt/bluraypos/.env"
else
  echo "==> No local .env found — ensure /opt/bluraypos/.env exists on the server."
fi

echo "==> Provisioning (first run) and deploying on droplet..."
ssh "${SSH_OPTS[@]}" "${DROPLET_USER}@${DROPLET_IP}" bash -s <<'REMOTE'
set -euo pipefail
cd /opt/bluraypos
chmod +x scripts/*.sh
if [ ! -f /var/www/bluraypos/office/index.html ]; then
  bash scripts/provision-droplet.sh
fi
bash scripts/deploy-production.sh
REMOTE

echo "Done."
