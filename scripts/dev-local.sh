#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Starting PostgreSQL + API (Docker)..."
docker compose up -d postgres api

echo "==> Waiting for API..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:5142/health >/dev/null; then
    echo "    API ready at http://localhost:5142"
    break
  fi
  sleep 1
done

echo "==> Starting frontend dev servers..."
cd frontend
npm run dev
