#!/usr/bin/env bash
# Pull the latest code and (re)build + restart the production stack.
# Run on the droplet, or invoked automatically by the GitHub Actions deploy workflow.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/bluraypos}"
BRANCH="${DEPLOY_BRANCH:-main}"
COMPOSE="docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod"

cd "${APP_DIR}"

echo "==> Fetching ${BRANCH}"
git fetch --all --prune
git reset --hard "origin/${BRANCH}"

if [ ! -f deploy/.env.prod ]; then
  echo "ERROR: deploy/.env.prod is missing. Copy deploy/.env.prod.example and fill it in." >&2
  exit 1
fi

echo "==> Building and starting containers"
${COMPOSE} up -d --build

echo "==> Pruning dangling images"
docker image prune -f

echo "==> Current status"
${COMPOSE} ps
