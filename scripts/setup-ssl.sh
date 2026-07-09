#!/usr/bin/env bash
# Enable Let's Encrypt SSL for all production domains
set -euo pipefail
cd /opt/bluraypos
source .env

certbot --nginx --expand \
  -d "${DOMAIN:-bluraymaldives.site}" \
  -d "office.${DOMAIN:-bluraymaldives.site}" \
  -d "api.${DOMAIN:-bluraymaldives.site}" \
  -d "pos.${DOMAIN:-bluraymaldives.site}" \
  -d "menu.${DOMAIN:-bluraymaldives.site}" \
  -d "order.${DOMAIN:-bluraymaldives.site}" \
  -d "coupons.${DOMAIN:-bluraymaldives.site}" \
  --non-interactive --agree-tos -m "${CERTBOT_EMAIL}" --redirect

# Apply security headers to HTTPS server blocks
for conf in /etc/nginx/sites-enabled/*; do
  if ! grep -q bluraypos-security-headers "$conf" 2>/dev/null; then
    sed -i '/ssl_certificate/a \    include /etc/nginx/snippets/bluraypos-security-headers.conf;' "$conf" 2>/dev/null || true
  fi
done

nginx -t && systemctl reload nginx
echo "HTTPS enabled for bluraymaldives.site, office, api, pos, menu, order, coupons"
