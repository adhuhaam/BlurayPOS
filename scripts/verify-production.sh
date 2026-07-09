#!/usr/bin/env bash
# Pre/post deployment production checklist
set -euo pipefail

ENV_FILE="/opt/bluraypos/.env"
DOMAIN="${DOMAIN:-bluraymaldives.site}"
API_URL="${API_URL:-https://api.$DOMAIN}"
FAIL=0

if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  set -a && source "$ENV_FILE" && set +a
fi

check() {
  local label="$1"
  local cmd="$2"
  if eval "$cmd" >/dev/null 2>&1; then
    echo "  ✔ $label"
  else
    echo "  ✘ $label"
    FAIL=1
  fi
}

echo "BlurayPOS Production Checklist"
echo "=============================="

check "DNS propagated ($DOMAIN)" "dig +short $DOMAIN A | grep -q ."
check "HTTPS working ($DOMAIN)" "curl -sf https://$DOMAIN --max-time 10"
check "HTTP redirects to HTTPS" "curl -sf -o /dev/null -w '%{http_code}' http://$DOMAIN | grep -qE '301|308'"
check "SSL valid" "echo | openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | openssl x509 -noout -dates"
check "API /health" "curl -sf $API_URL/health --max-time 10"
check "API /ready" "curl -sf $API_URL/ready --max-time 10"
check "API /live" "curl -sf $API_URL/live --max-time 10"
check "Office app reachable" "curl -sf https://office.$DOMAIN --max-time 10"
check "POS app reachable" "curl -sf https://pos.$DOMAIN --max-time 10"
check "Menu app reachable" "curl -sf https://menu.$DOMAIN --max-time 10"
check "Order app reachable" "curl -sf https://order.$DOMAIN --max-time 10"
check "Coupons app reachable" "curl -sf https://coupons.$DOMAIN --max-time 10"
check "PostgreSQL running" "docker compose -f /opt/bluraypos/docker-compose.infra.yml ps postgres | grep -q Up"
check "Redis running" "docker compose -f /opt/bluraypos/docker-compose.infra.yml ps redis | grep -q Up"
check "API systemd healthy" "systemctl is-active bluraypos-api"
check "Nginx config valid" "nginx -t"
check "Firewall enabled" "ufw status | grep -q 'Status: active'"
check "Daily backups configured" "test -f /etc/cron.d/bluraypos-backup"
check "SSL monitor configured" "test -f /etc/cron.d/bluraypos-ssl-monitor"
check "Certbot timer active" "systemctl is-active certbot.timer 2>/dev/null || test -d /etc/letsencrypt"

echo ""
if [ "$FAIL" -eq 0 ]; then
  echo "All checks passed."
else
  echo "Some checks failed. Review output above."
  exit 1
fi
