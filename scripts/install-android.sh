#!/usr/bin/env bash
# Build and install BlurayPOS Android app to connected device.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="$REPO_ROOT/terminal_app"
APK="$APP_DIR/app/build/outputs/apk/debug/app-debug.apk"

export JAVA_HOME="${JAVA_HOME:-/snap/android-studio/current/jbr}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export PATH="$PATH:$ANDROID_HOME/platform-tools"

echo "==> Ensuring dev API is up..."
if ! "$REPO_ROOT/scripts/ensure-dev-api.sh"; then
  echo "WARN: ensure-dev-api failed; trying fallback port 5148 if available" >&2
fi
API_PORT="$(cat "$REPO_ROOT/.dev-api-port" 2>/dev/null || echo 5147)"
LAN_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"

DEVICE="$(adb devices | awk 'NR>1 && $2=="device" {print $1; exit}')"
if [ -z "$DEVICE" ]; then
  echo "ERROR: No Android device connected. Enable USB debugging and run: adb devices" >&2
  exit 1
fi
echo "==> Device: $DEVICE"

echo "==> Building debug APK (API http://${LAN_IP}:${API_PORT})..."
cd "$APP_DIR"
./gradlew assembleDebug --no-daemon --max-workers=2 -PDEV_API_HOST="$LAN_IP" -PDEV_API_PORT="$API_PORT"

echo "==> Installing..."
if ! adb -s "$DEVICE" install -r "$APK" 2>/dev/null; then
  echo "    Direct install blocked — using MIUI push method..."
  adb -s "$DEVICE" push "$APK" /data/local/tmp/BlurayPOS.apk
  adb -s "$DEVICE" shell pm install -r /data/local/tmp/BlurayPOS.apk
fi

echo "==> Launching BlurayPOS..."
adb -s "$DEVICE" shell am start -n com.bluraypos.terminal/.MainActivity

LAN_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
echo ""
echo "Installed v$(grep versionName "$APP_DIR/app/build.gradle.kts" | head -1 | sed 's/.*"\(.*\)".*/\1/')"
echo "Debug API: http://${LAN_IP}:${API_PORT}"
echo "Login: cashier@demo.com / Cashier123!"
