#!/usr/bin/env bash
# Remove stale root-owned BlurayPOS API containers that block port 5147.
# Requires sudo when containers were started as root (common with snap Docker).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONTAINERS=(
  bluraypos-api-industry
  bluraypos-api-active
  bluraypos-api-hr
  bluraypos-api-fresh
  bluraypos-api-new
  bluraypos-api-v4
  bluraypos-api-v3
  bluraypos-api-v2
  bluraypos-api-dev
  bluraypos-api-1
)

echo "==> Stale BlurayPOS API containers:"
docker ps -a --filter "name=bluraypos-api" --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' 2>/dev/null || true
echo ""

removed=0
for name in "${CONTAINERS[@]}"; do
  if docker ps -a --format '{{.Names}}' | grep -qx "$name"; then
    echo "==> Removing $name..."
    if docker rm -f "$name" 2>/dev/null; then
      removed=$((removed + 1))
      continue
    fi
    if sudo docker rm -f "$name" 2>/dev/null; then
      removed=$((removed + 1))
      continue
    fi
    echo "WARN: Could not remove $name (permission denied)" >&2
  fi
done

echo ""
if [ "$removed" -gt 0 ]; then
  echo "Removed $removed container(s). Starting fresh API on port 5147..."
  exec "$REPO_ROOT/scripts/ensure-dev-api.sh" --rebuild
fi

if docker ps -a --format '{{.Names}}' | grep -qE 'bluraypos-api-(industry|new|active|v[0-9]|dev|-1)'; then
  echo "ERROR: Some containers could not be removed." >&2
  echo "" >&2
  echo "Cause: containers were likely started with sudo; snap Docker blocks non-root kill." >&2
  echo "" >&2
  echo "Fix options:" >&2
  echo "  1. Run this script in a real terminal and enter your sudo password when prompted:" >&2
  echo "       ./scripts/cleanup-stale-docker-api.sh" >&2
  echo "  2. Reboot the machine (containers have restart=no), then run:" >&2
  echo "       ./scripts/ensure-dev-api.sh --rebuild" >&2
  echo "  3. Use the automatic fallback on port 5148:" >&2
  echo "       ./scripts/ensure-dev-api.sh" >&2
  exit 1
fi

echo "No stale containers found. Run ./scripts/ensure-dev-api.sh to start the API."
