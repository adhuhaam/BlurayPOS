#!/usr/bin/env bash
# Ensure Postgres, Redis, and latest API (bluraypos-api-industry on port 5147) are running.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PREFERRED_PORT=5147
FALLBACK_PORT=5148
EXTRA_FALLBACK_PORTS=(5149 5150)
API_PORT="$PREFERRED_PORT"
API_NAME="bluraypos-api-industry"
FALLBACK_NAME="bluraypos-api-active"
EXTRA_FALLBACK_NAMES=(bluraypos-api-hr bluraypos-api-fresh)
IMAGE="bluraypos-api:latest"
NETWORK="bluraypos_default"
PORT_FILE="$REPO_ROOT/.dev-api-port"
REBUILD=false

for arg in "$@"; do
  case "$arg" in
    --rebuild) REBUILD=true ;;
  esac
done

compose() {
  if docker compose version >/dev/null 2>&1; then docker compose "$@"
  else sudo docker compose "$@"
  fi
}

health_ok() {
  curl -sf "http://localhost:${API_PORT}/health" 2>/dev/null | grep -qi healthy
}

public_marketing_ok() {
  curl -sf "http://localhost:${API_PORT}/api/public/marketing" 2>/dev/null | grep -q '"success":true'
}

# Route exists when API returns 401 (authorized) — old images return 404.
tables_route_ok() {
  local code port="${1:-$API_PORT}"
  code="$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:${port}/api/tables" 2>/dev/null || echo 000)"
  [ "$code" != "404" ] && [ "$code" != "000" ]
}

# HR module ships in current API; stale containers return 404.
hr_route_ok() {
  local code port="${1:-$API_PORT}"
  code="$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:${port}/api/hr/dashboard" 2>/dev/null || echo 000)"
  [ "$code" != "404" ] && [ "$code" != "000" ]
}

api_ready_on_port() {
  local port="$1"
  API_PORT="$port"
  health_ok && public_marketing_ok && tables_route_ok "$port" && hr_route_ok "$port"
}

container_image_stale() {
  local name="${1:-$API_NAME}"
  if ! docker ps --format '{{.Names}}' | grep -qx "$name"; then
    return 1
  fi
  if ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
    return 0
  fi
  local running_id latest_id
  running_id="$(docker inspect --format '{{.Image}}' "$name" 2>/dev/null || true)"
  latest_id="$(docker image inspect --format '{{.Id}}' "$IMAGE" 2>/dev/null || true)"
  [ -n "$running_id" ] && [ -n "$latest_id" ] && [ "$running_id" != "$latest_id" ]
}

api_ready() {
  health_ok && public_marketing_ok && tables_route_ok && hr_route_ok
}

write_port_file() {
  echo "$API_PORT" > "$PORT_FILE"
}

remove_container() {
  local name="$1"
  if docker rm -f "$name" 2>/dev/null; then
    return 0
  fi
  if sudo -n docker rm -f "$name" 2>/dev/null; then
    return 0
  fi
  if docker ps -a --format '{{.Names}}' | grep -qx "$name"; then
    return 1
  fi
  return 0
}

can_remove_container() {
  local name="$1"
  if ! docker ps -a --format '{{.Names}}' | grep -qx "$name"; then
    return 0
  fi
  remove_container "$name"
}

start_api_container() {
  local name="$1"
  local port="$2"
  echo "==> Starting $name on port ${port}..."
  docker run -d --name "$name" --network "$NETWORK" -p "${port}:8080" \
    -e ASPNETCORE_ENVIRONMENT=Development \
    -e 'ConnectionStrings__DefaultConnection=Host=bluraypos-postgres-1;Port=5432;Database=pos_dev;Username=postgres;Password=postgres' \
    -e 'ConnectionStrings__Redis=bluraypos-redis:6379' \
    -e 'Jwt__Secret=dev-docker-secret-key-min-32-chars-long!!' \
    -e 'Cors__Origins__0=http://localhost:5173' \
    -e 'Cors__Origins__1=http://localhost:5174' \
    -e 'Cors__Origins__2=http://localhost:5175' \
    -e 'Cors__Origins__3=http://localhost:5176' \
    -e 'Cors__Origins__4=http://localhost:5177' \
    -e 'Cors__Origins__5=http://localhost:5178' \
    -e 'Cors__Origins__6=http://localhost:5179' \
    -e 'Coupons__PublicBaseUrl=http://localhost:5176' \
    -e "Coupons__ApiPublicBaseUrl=http://localhost:${port}" \
    "$IMAGE"
}

wait_for_api() {
  for _ in $(seq 1 45); do
    if api_ready; then
      write_port_file
      echo "API ready:"
      echo "  http://localhost:${API_PORT}/swagger"
      echo "  http://localhost:${API_PORT}/api/public/marketing"
      if [ "$API_PORT" != "$PREFERRED_PORT" ]; then
        echo ""
        echo "NOTE: Using fallback port ${API_PORT} because port ${PREFERRED_PORT} is blocked by a stale root-owned container."
        echo "To reclaim port ${PREFERRED_PORT}, run: ./scripts/cleanup-stale-docker-api.sh"
      fi
      return 0
    fi
    sleep 2
  done
  return 1
}

use_fallback_port() {
  API_PORT="$FALLBACK_PORT"
  API_NAME="$FALLBACK_NAME"
  echo "WARN: Falling back to port ${FALLBACK_PORT} (port ${PREFERRED_PORT} blocked by unremovable container)" >&2
}

echo "==> Docker: Postgres + Redis..."
cd "$REPO_ROOT"
compose up -d postgres
if ! curl -sf localhost:6379 >/dev/null 2>&1; then
  compose up -d redis 2>/dev/null || true
fi
if ! docker ps --format '{{.Names}}' | grep -qE 'bluraypos-redis'; then
  echo "WARN: Redis not detected; API may fail without it." >&2
fi

if [ "$REBUILD" = true ] || ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
  echo "==> Building API image..."
  docker build -t "$IMAGE" "$REPO_ROOT"
fi

# Prefer port 5147 when healthy and current.
API_PORT="$PREFERRED_PORT"
API_NAME="bluraypos-api-industry"
if docker ps --format '{{.Names}}' | grep -qx "$API_NAME"; then
  if api_ready && ! container_image_stale "$API_NAME"; then
    write_port_file
    echo "==> API already healthy on http://localhost:${API_PORT}"
    exit 0
  fi
  if ! tables_route_ok "$PREFERRED_PORT" || container_image_stale "$API_NAME"; then
    echo "WARN: API container is stale (missing /api/tables or old image)" >&2
    if ! can_remove_container "$API_NAME"; then
      use_fallback_port
    else
      echo "==> Replacing stale $API_NAME..."
    fi
  elif ! api_ready; then
    if can_remove_container "$API_NAME"; then
      echo "==> Replacing unhealthy $API_NAME..."
    else
      use_fallback_port
    fi
  fi
elif ! tables_route_ok "$PREFERRED_PORT" && curl -sf "http://localhost:${PREFERRED_PORT}/health" >/dev/null 2>&1; then
  echo "WARN: Something on port ${PREFERRED_PORT} is not the latest API" >&2
  use_fallback_port
fi

# Reuse existing healthy fallback containers (bluraypos-api-active, bluraypos-api-new, bluraypos-api-hr, …).
if [ "$API_PORT" = "$FALLBACK_PORT" ]; then
  for existing in "$FALLBACK_NAME" bluraypos-api-new bluraypos-api-hr bluraypos-api-fresh; do
    if docker ps --format '{{.Names}}' | grep -qx "$existing"; then
      API_NAME="$existing"
      if api_ready_on_port "$FALLBACK_PORT" && ! container_image_stale "$existing"; then
        write_port_file
        echo "==> API already healthy on http://localhost:${API_PORT} ($existing)"
        exit 0
      fi
      if can_remove_container "$existing"; then
        API_NAME="$FALLBACK_NAME"
      fi
      break
    fi
  done
  API_NAME="${API_NAME:-$FALLBACK_NAME}"
fi

# When 5147/5148 are blocked by root-owned stale containers, try extra ports (5149, 5150).
if ! api_ready_on_port "$API_PORT" 2>/dev/null; then
  idx=0
  for extra_port in "${EXTRA_FALLBACK_PORTS[@]}"; do
    extra_name="${EXTRA_FALLBACK_NAMES[$idx]:-bluraypos-api-fresh}"
    idx=$((idx + 1))
    if docker ps --format '{{.Names}}' | grep -qx "$extra_name"; then
      if api_ready_on_port "$extra_port" && ! container_image_stale "$extra_name"; then
        API_PORT="$extra_port"
        API_NAME="$extra_name"
        write_port_file
        echo "==> API already healthy on http://localhost:${API_PORT} ($extra_name)"
        exit 0
      fi
      can_remove_container "$extra_name" || continue
    fi
    if ! curl -sf "http://localhost:${extra_port}/health" >/dev/null 2>&1; then
      API_PORT="$extra_port"
      API_NAME="$extra_name"
      start_api_container "$API_NAME" "$API_PORT"
      echo "==> Waiting for API on port ${API_PORT}..."
      if wait_for_api; then
        exit 0
      fi
    fi
  done
fi

# Start or replace container on chosen port.
if docker ps --format '{{.Names}}' | grep -qx "$API_NAME"; then
  if ! can_remove_container "$API_NAME"; then
    if [ "$API_PORT" = "$FALLBACK_PORT" ] && api_ready_on_port "$FALLBACK_PORT"; then
      write_port_file
      echo "==> API already healthy on http://localhost:${API_PORT}"
      exit 0
    fi
    echo "ERROR: Cannot replace $API_NAME and port ${API_PORT} is unavailable." >&2
    echo "Run: ./scripts/cleanup-stale-docker-api.sh" >&2
    exit 1
  fi
fi

start_api_container "$API_NAME" "$API_PORT"

echo "==> Waiting for API..."
if wait_for_api; then
  exit 0
fi

echo "ERROR: API did not become healthy on port ${API_PORT}" >&2
exit 1
