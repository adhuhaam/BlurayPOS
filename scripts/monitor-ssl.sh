#!/usr/bin/env bash
# Verify SSL certificates, renewal, HTTPS accessibility, and HTTP redirects
set -euo pipefail

ENV_FILE="/opt/bluraypos/.env"
DOMAIN="${DOMAIN:-bluraymaldives.site}"
DOMAINS=("$DOMAIN" "office.$DOMAIN" "api.$DOMAIN" "pos.$DOMAIN")
FAIL=0

if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  set -a && source "$ENV_FILE" && set +a
  DOMAIN="${DOMAIN:-bluraymaldives.site}"
fi

echo "[$(date -Is)] SSL monitoring for $DOMAIN"

# Certificate expiration
for cert in /etc/letsencrypt/live/*/cert.pem; do
  [ -f "$cert" ] || continue
  expiry=$(openssl x509 -enddate -noout -in "$cert" | cut -d= -f2)
  expiry_epoch=$(date -d "$expiry" +%s)
  now_epoch=$(date +%s)
  days_left=$(( (expiry_epoch - now_epoch) / 86400 ))
  echo "  Certificate $cert expires in $days_left days ($expiry)"
  if [ "$days_left" -lt 14 ]; then
    echo "  WARNING: Certificate expires in less than 14 days"
    FAIL=1
  fi
done

# HTTPS accessibility and redirect checks
for host in "${DOMAINS[@]}"; do
  https_code=$(curl -s -o /dev/null -w "%{http_code}" "https://$host" --max-time 10 || echo "000")
  http_code=$(curl -s -o /dev/null -w "%{http_code}" "http://$host" --max-time 10 || echo "000")
  redirect=$(curl -s -o /dev/null -w "%{redirect_url}" "http://$host" --max-time 10 || echo "")

  echo "  $host: HTTPS=$https_code HTTP=$http_code redirect=$redirect"

  if [ "$https_code" = "000" ]; then
    echo "  WARNING: HTTPS not reachable for $host"
    FAIL=1
  fi

  if [ "$http_code" != "301" ] && [ "$http_code" != "308" ] && [ "$http_code" != "000" ]; then
    echo "  WARNING: HTTP does not redirect for $host (got $http_code)"
    FAIL=1
  fi
done

# Certbot renewal dry-run (weekly on Sundays only to avoid rate limits)
if [ "$(date +%u)" = "7" ]; then
  certbot renew --dry-run --quiet && echo "  Certbot renewal dry-run: OK" \
    || { echo "  WARNING: Certbot renewal dry-run failed"; FAIL=1; }
fi

if [ "$FAIL" -eq 1 ]; then
  echo "[$(date -Is)] SSL monitoring: ISSUES DETECTED"
  exit 1
fi

echo "[$(date -Is)] SSL monitoring: ALL OK"
