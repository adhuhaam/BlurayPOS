#!/usr/bin/env bash
# Ensure production frontend bundles use the live API subdomain
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND="$REPO_ROOT/frontend"
PROD_API="https://api.bluraymaldives.site"

check_app() {
  local name="$1"
  local dist="$2"
  if [ ! -d "$dist" ]; then
    echo "Missing build output: $dist"
    return 1
  fi
  if ! grep -rqF "$PROD_API" "$dist"; then
    echo "ERROR: $name bundle missing $PROD_API — check frontend/env/.env.production"
    return 1
  fi
  if grep -rqE 'localhost:5147|127\.0\.0\.1:5147' "$dist"; then
    echo "ERROR: $name bundle still references localhost API — remove per-app .env.local overrides"
    return 1
  fi
  return 0
}

failed=0
check_app "admin-portal" "$FRONTEND/apps/admin-portal/dist" || failed=1
check_app "pos-terminal" "$FRONTEND/apps/pos-terminal/dist" || failed=1
check_app "marketing-site" "$FRONTEND/apps/marketing-site/dist" || failed=1
check_app "coupons-site" "$FRONTEND/apps/coupons-site/dist" || failed=1
check_app "online-menu" "$FRONTEND/apps/online-menu/dist" || failed=1
check_app "online-order" "$FRONTEND/apps/online-order/dist" || failed=1

if [ "$failed" -ne 0 ]; then
  exit 1
fi

echo "Frontend production build verified ($PROD_API in all apps)."
