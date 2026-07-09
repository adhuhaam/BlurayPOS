#!/usr/bin/env bash
# Daily PostgreSQL backup with retention policy
set -euo pipefail

BACKUP_DIR="/var/backups/bluraypos"
ENV_FILE="/opt/bluraypos/.env"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DAY_OF_WEEK=$(date +%u)
DAY_OF_MONTH=$(date +%d)

mkdir -p "$BACKUP_DIR"/{daily,weekly,monthly}

if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  set -a && source "$ENV_FILE" && set +a
fi

POSTGRES_USER="${POSTGRES_USER:-pos}"
POSTGRES_DB="${POSTGRES_DB:-pos_prod}"
BACKUP_FILE="$BACKUP_DIR/daily/${POSTGRES_DB}_${TIMESTAMP}.sql.gz"

echo "[$(date -Is)] Starting backup..."

docker exec "$(docker compose -f /opt/bluraypos/docker-compose.infra.yml ps -q postgres)" \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$BACKUP_FILE"

echo "[$(date -Is)] Backup saved: $BACKUP_FILE"

# Weekly backup on Sundays
if [ "$DAY_OF_WEEK" = "7" ]; then
  cp "$BACKUP_FILE" "$BACKUP_DIR/weekly/${POSTGRES_DB}_week_${TIMESTAMP}.sql.gz"
fi

# Monthly backup on the 1st
if [ "$DAY_OF_MONTH" = "01" ]; then
  cp "$BACKUP_FILE" "$BACKUP_DIR/monthly/${POSTGRES_DB}_month_${TIMESTAMP}.sql.gz"
fi

# Retention: daily 7 days, weekly 4 weeks, monthly 6 months
find "$BACKUP_DIR/daily" -name "*.sql.gz" -mtime +7 -delete
find "$BACKUP_DIR/weekly" -name "*.sql.gz" -mtime +28 -delete
find "$BACKUP_DIR/monthly" -name "*.sql.gz" -mtime +180 -delete

echo "[$(date -Is)] Backup complete."
