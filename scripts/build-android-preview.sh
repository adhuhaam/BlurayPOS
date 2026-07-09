#!/usr/bin/env bash
# Build BlurayPOS Android preview APK (production API, sideload-ready).
# Tuned for low-RAM dev machines: single worker, no daemon, capped JVM heap.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="$REPO_ROOT/terminal_app"
DIST_DIR="$APP_DIR/dist"
APK_SRC="$APP_DIR/app/build/outputs/apk/preview/app-preview.apk"

export JAVA_HOME="${JAVA_HOME:-/snap/android-studio/current/jbr}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"

# gradle.properties already sets daemon=false, workers.max=1; reinforce for CI/low RAM.
export GRADLE_OPTS="${GRADLE_OPTS:--Xmx768m -XX:MaxMetaspaceSize=256m -Dfile.encoding=UTF-8}"

VERSION="$(grep 'versionName' "$APP_DIR/app/build.gradle.kts" | head -1 | sed 's/.*"\(.*\)".*/\1/')"
OUT_NAME="BlurayPOS-v${VERSION}-preview.apk"
OUT_PATH="$DIST_DIR/$OUT_NAME"

echo "==> Verifying production API..."
if ! curl -sf --max-time 15 "https://api.bluraymaldives.site/health" >/dev/null; then
  echo "WARN: https://api.bluraymaldives.site/health unreachable — APK will still use production URL" >&2
fi

echo "==> Building preview APK (production API, low-RAM Gradle settings)..."
cd "$APP_DIR"
./gradlew assemblePreview \
  --no-daemon \
  --max-workers=1 \
  -x lint \
  -x lintVitalPreview \
  "$@"

if [ ! -f "$APK_SRC" ]; then
  echo "ERROR: Expected APK not found at $APK_SRC" >&2
  exit 1
fi

mkdir -p "$DIST_DIR"
cp -f "$APK_SRC" "$OUT_PATH"

BYTES="$(wc -c < "$OUT_PATH" | tr -d ' ')"
MB="$(awk "BEGIN {printf \"%.1f\", $BYTES / 1048576}")"

echo ""
echo "Preview APK ready:"
echo "  $OUT_PATH"
echo "  Size: ${MB} MB"
echo "  API:  https://api.bluraymaldives.site"
echo ""
echo "Install on device:"
echo "  adb install -r \"$OUT_PATH\""
echo "  # MIUI: adb push \"$OUT_PATH\" /data/local/tmp/BlurayPOS.apk && adb shell pm install -r /data/local/tmp/BlurayPOS.apk"
