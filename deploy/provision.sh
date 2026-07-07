#!/usr/bin/env bash
# One-time bootstrap for a fresh Ubuntu 22.04/24.04 DigitalOcean droplet.
# Run as root:  bash provision.sh
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/adhuhaam/BlurayPOS.git}"
APP_DIR="${APP_DIR:-/opt/bluraypos}"

echo "==> Installing base packages"
apt-get update
apt-get install -y ca-certificates curl git ufw

echo "==> Installing Docker Engine + Compose plugin"
install -m 0755 -d /etc/apt/keyrings
if [ ! -f /etc/apt/keyrings/docker.asc ]; then
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
fi
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker

echo "==> Configuring firewall (SSH + HTTP + HTTPS)"
ufw allow OpenSSH || true
ufw allow 80/tcp || true
ufw allow 443/tcp || true
ufw --force enable || true

echo "==> Cloning repository into ${APP_DIR}"
if [ ! -d "${APP_DIR}/.git" ]; then
  git clone "${REPO_URL}" "${APP_DIR}"
else
  git -C "${APP_DIR}" fetch --all && git -C "${APP_DIR}" reset --hard origin/main
fi

echo
echo "==> Provisioning complete."
echo "Next steps:"
echo "  1. cp ${APP_DIR}/deploy/.env.prod.example ${APP_DIR}/deploy/.env.prod"
echo "  2. edit ${APP_DIR}/deploy/.env.prod  (DOMAIN, ACME_EMAIL, passwords, JWT secret)"
echo "  3. Point DNS: api.<DOMAIN>, admin.<DOMAIN>, pos.<DOMAIN> -> this droplet's IP"
echo "  4. bash ${APP_DIR}/deploy/deploy.sh"
