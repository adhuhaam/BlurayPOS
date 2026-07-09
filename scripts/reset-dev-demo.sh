#!/usr/bin/env bash
# Reset local dev database and reseed the full demo store (users, products, sample sales).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

compose() {
  if docker compose version >/dev/null 2>&1; then
    docker compose "$@"
  else
    sudo docker compose "$@"
  fi
}

echo "==> Stopping API and removing Postgres volume..."
compose down -v

echo "==> Building and starting Postgres + API..."
compose up --build -d

echo "==> Waiting for API health..."
for i in $(seq 1 60); do
  if curl -sf http://localhost:5142/health >/dev/null 2>&1; then
    echo "API is healthy."
    break
  fi
  if [ "$i" -eq 60 ]; then
    echo "API did not become healthy in time. Check: docker compose logs api"
    exit 1
  fi
  sleep 2
done

echo "==> Applying demo catalog/sales SQL (idempotent)..."
docker exec -i bluraypos-postgres-1 psql -U postgres -d pos_dev < "$REPO_ROOT/scripts/seed-dev-demo.sql" >/dev/null

if command -v python3 >/dev/null 2>&1; then
  echo "==> Ensuring extended demo catalog via API..."
  python3 "$REPO_ROOT/scripts/seed-dev-demo-now.py" || true
fi

echo ""
echo "Demo store ready."
echo ""
echo "URLs:"
echo "  Health:  http://localhost:5142/health"
echo "  Swagger: http://localhost:5142/swagger"
echo "  POS:     http://localhost:5173  (run: cd frontend && npm run dev)"
echo "  Admin:   http://localhost:5174"
echo "  Android: http://$(hostname -I 2>/dev/null | awk '{print $1}'):5142"
echo ""
echo "Demo logins (password after /):"
echo "  admin@demo.com    / Admin123!   (platform super admin)"
echo "  manager@demo.com  / Manager123! (store manager)"
echo "  cashier@demo.com  / Cashier123! (POS cashier)"
echo "  waiter@demo.com   / Waiter123!  (POS waiter)"
echo ""
echo "Store: Demo Store → Main Branch (MVR, Pro plan)"
echo "Catalog: beverages, snacks, meals, desserts + sample completed orders"
