#!/usr/bin/env bash
# First-time Ubuntu server setup for BlurayPOS production
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

export DEBIAN_FRONTEND=noninteractive

echo "==> Installing system packages..."
apt-get update -qq
apt-get install -y -qq git curl ca-certificates nginx certbot python3-certbot-nginx ufw rsync

echo "==> Installing Docker..."
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker

echo "==> Installing .NET 9 SDK..."
if ! command -v dotnet >/dev/null 2>&1; then
  curl -fsSL https://dot.net/v1/dotnet-install.sh -o /tmp/dotnet-install.sh
  bash /tmp/dotnet-install.sh --channel 9.0 --install-dir /usr/share/dotnet
  ln -sf /usr/share/dotnet/dotnet /usr/bin/dotnet
fi

echo "==> Installing Node.js 20..."
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi

echo "==> Creating directories..."
mkdir -p /opt/bluraypos /var/www/bluraypos/{landing,office,pos,menu,order,coupons}
mkdir -p /var/backups/bluraypos
chown -R www-data:www-data /var/www/bluraypos

echo "==> Configuring nginx..."
cp deploy/nginx/snippets/compression.conf /etc/nginx/snippets/bluraypos-compression.conf
cp deploy/nginx/snippets/security-headers.conf /etc/nginx/snippets/bluraypos-security-headers.conf
cp deploy/nginx/bluraypos.conf /etc/nginx/sites-available/bluraypos
ln -sf /etc/nginx/sites-available/bluraypos /etc/nginx/sites-enabled/bluraypos
cp deploy/nginx/bluraypos-modules.conf /etc/nginx/sites-available/bluraypos-modules
ln -sf /etc/nginx/sites-available/bluraypos-modules /etc/nginx/sites-enabled/bluraypos-modules
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "==> Installing systemd service..."
cp deploy/systemd/bluraypos-api.service /etc/systemd/system/bluraypos-api.service
systemctl daemon-reload

echo "==> Configuring firewall (UFW)..."
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable || true

echo "==> Installing backup cron (daily 02:00 UTC)..."
cp scripts/backup-postgres.sh /usr/local/bin/bluraypos-backup
chmod +x /usr/local/bin/bluraypos-backup
echo "0 2 * * * root /usr/local/bin/bluraypos-backup >> /var/log/bluraypos-backup.log 2>&1" \
  > /etc/cron.d/bluraypos-backup

echo "==> Installing SSL monitor cron (daily 06:00 UTC)..."
cp scripts/monitor-ssl.sh /usr/local/bin/bluraypos-ssl-monitor
chmod +x /usr/local/bin/bluraypos-ssl-monitor
echo "0 6 * * * root /usr/local/bin/bluraypos-ssl-monitor >> /var/log/bluraypos-ssl.log 2>&1" \
  > /etc/cron.d/bluraypos-ssl-monitor

echo "Server provisioned. Run: bash scripts/deploy-production.sh"
