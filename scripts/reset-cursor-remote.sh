#!/usr/bin/env bash
# Reset Cursor Remote SSH state on the droplet (run before reconnecting if SSH loops/timeouts)
set -euo pipefail

echo "==> Stopping cursor-server processes..."
pkill -f cursor-server 2>/dev/null || true
pkill -f multiplex-server 2>/dev/null || true
sleep 1
pkill -9 -f cursor-server 2>/dev/null || true
pkill -9 -f multiplex-server 2>/dev/null || true

echo "==> Clearing remote runtime files..."
rm -f /run/user/0/cursor-remote-* 2>/dev/null || true

echo "==> Server status:"
uptime
free -h
pgrep -c -f cursor-server 2>/dev/null || echo "cursor-server: 0"
echo "Done. Wait ~30s, then connect from Cursor (one window only)."
