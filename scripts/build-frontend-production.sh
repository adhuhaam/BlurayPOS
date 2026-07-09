#!/usr/bin/env bash
# Build all frontend apps for production (uses frontend/env/.env.production)
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT/frontend"

echo "==> Building frontend (production mode — frontend/env/.env.production)..."
npm ci
npm run build:production

echo "Frontend production build complete."
