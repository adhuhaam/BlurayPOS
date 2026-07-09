#!/usr/bin/env bash
# Start full BlurayPOS dev stack (API + web). Android: build separately in terminal_app/.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LAN_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"

echo "==> Ensuring API + database..."
"$REPO_ROOT/scripts/ensure-dev-api.sh"
API_PORT="$(cat "$REPO_ROOT/.dev-api-port" 2>/dev/null || echo 5147)"
export DEV_API_PORT="$API_PORT"

echo "==> Frontend (POS + Admin + Marketing)..."
export NVM_DIR="$HOME/.nvm"
# shellcheck source=/dev/null
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
cd "$REPO_ROOT/frontend"
if [ ! -d node_modules ]; then npm install; fi

echo ""
echo "Dev URLs (see memory-plan/DEV_ENVIRONMENT.md):"
echo "  API:       http://localhost:${API_PORT}/swagger"
echo "  POS:       http://localhost:5173"
echo "  Admin:     http://localhost:5174"
echo "  Marketing: http://localhost:5175"
echo "  Coupons:   http://localhost:5176"
echo "  LAN API:   http://${LAN_IP}:${API_PORT}"
echo ""
echo "Demo: cashier@demo.com / Cashier123!"
echo ""
echo "Starting frontend (Ctrl+C stops web only; Docker API keeps running)..."
npm run dev
