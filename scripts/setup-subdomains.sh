#!/usr/bin/env bash
# Configure nginx + SSL for plan-module subdomains (menu, order, coupons).
# Safe to re-run after deploy — idempotent.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

if [ -f .env ]; then
  # shellcheck disable=SC1091
  set -a && source .env && set +a
fi

DOMAIN="${DOMAIN:-bluraymaldives.site}"
DROPLET_IP="${DROPLET_IP:-$(curl -sf ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')}"

echo "==> Creating web roots..."
mkdir -p /var/www/bluraypos/{menu,order,coupons}
chown -R www-data:www-data /var/www/bluraypos

echo "==> Installing module nginx config..."
cp deploy/nginx/bluraypos-modules.conf /etc/nginx/sites-available/bluraypos-modules
ln -sf /etc/nginx/sites-available/bluraypos-modules /etc/nginx/sites-enabled/bluraypos-modules

nginx -t
systemctl reload nginx

echo "==> Checking DNS (A records should point to ${DROPLET_IP})..."
for host in menu order coupons; do
  ip="$(dig +short "${host}.${DOMAIN}" A 2>/dev/null | head -1 || true)"
  if [ "$ip" = "$DROPLET_IP" ]; then
    echo "  ✔ ${host}.${DOMAIN} → ${ip}"
  else
    echo "  ⚠ ${host}.${DOMAIN} → ${ip:-MISSING} (expected ${DROPLET_IP})"
    echo "    Add in DigitalOcean DNS: A  ${host}  ${DROPLET_IP}"
  fi
done

if [ -z "${CERTBOT_EMAIL:-}" ]; then
  echo "CERTBOT_EMAIL not set — skip SSL expansion."
  exit 0
fi

echo "==> Expanding Let's Encrypt certificate for module subdomains..."
certbot --nginx --expand \
  -d "${DOMAIN}" \
  -d "office.${DOMAIN}" \
  -d "api.${DOMAIN}" \
  -d "pos.${DOMAIN}" \
  -d "menu.${DOMAIN}" \
  -d "order.${DOMAIN}" \
  -d "coupons.${DOMAIN}" \
  --non-interactive --agree-tos -m "${CERTBOT_EMAIL}" --redirect || {
    echo "Certbot failed — ensure DNS A records exist for menu/order/coupons, then re-run:"
    echo "  bash scripts/setup-subdomains.sh"
    exit 1
  }

nginx -t && systemctl reload nginx
echo "Module subdomains configured with HTTPS."
