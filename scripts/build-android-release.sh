#!/usr/bin/env bash
# Build BlurayPOS Android release APK/AAB (production API, signed release keystore).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="$REPO_ROOT/terminal_app"
DIST_DIR="$APP_DIR/dist"
KEYSTORE_PROPS="$APP_DIR/keystore.properties"

export JAVA_HOME="${JAVA_HOME:-/snap/android-studio/current/jbr}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export GRADLE_OPTS="${GRADLE_OPTS:--Xmx2048m -XX:MaxMetaspaceSize=512m -Dfile.encoding=UTF-8}"

if [ ! -f "$KEYSTORE_PROPS" ]; then
  echo "ERROR: Missing $KEYSTORE_PROPS" >&2
  echo "Copy keystore.properties.example → keystore.properties and add your release keystore." >&2
  echo "Or run: bash scripts/generate-android-keystore.sh" >&2
  exit 1
fi

VERSION="$(grep 'versionName' "$APP_DIR/app/build.gradle.kts" | head -1 | sed 's/.*"\(.*\)".*/\1/')"
FORMAT="${1:-apk}"
shift $(( $# > 0 ? 1 : 0 )) || true
GRADLE_EXTRA_ARGS=("$@")

echo "==> Verifying production API..."
if ! curl -sf --max-time 15 "https://api.bluraymaldives.site/health" >/dev/null; then
  echo "WARN: https://api.bluraymaldives.site/health unreachable — APK will still use production URL" >&2
fi

cd "$APP_DIR"
mkdir -p "$DIST_DIR"

case "$FORMAT" in
  apk)
    echo "==> Building signed release APK..."
    ./gradlew assembleRelease --no-daemon --max-workers=2 -x lint -x lintVitalRelease \
      -Dorg.gradle.jvmargs="-Xmx2048m -XX:MaxMetaspaceSize=512m -Dfile.encoding=UTF-8" \
      "${GRADLE_EXTRA_ARGS[@]}"
    APK_SRC="$APP_DIR/app/build/outputs/apk/release/app-release.apk"
    OUT_PATH="$DIST_DIR/BlurayPOS-v${VERSION}-release.apk"
  ;;
  aab|bundle)
    echo "==> Building signed release AAB (Play Store)..."
    ./gradlew bundleRelease --no-daemon --max-workers=2 -x lint -x lintVitalRelease \
      -Dorg.gradle.jvmargs="-Xmx2048m -XX:MaxMetaspaceSize=512m -Dfile.encoding=UTF-8" \
      "${GRADLE_EXTRA_ARGS[@]}"
    APK_SRC="$APP_DIR/app/build/outputs/bundle/release/app-release.aab"
    OUT_PATH="$DIST_DIR/BlurayPOS-v${VERSION}-release.aab"
  ;;
  *)
    echo "Usage: $0 [apk|aab]" >&2
    exit 1
  ;;
esac

if [ ! -f "$APK_SRC" ]; then
  echo "ERROR: Expected artifact not found at $APK_SRC" >&2
  exit 1
fi

cp -f "$APK_SRC" "$OUT_PATH"
BYTES="$(wc -c < "$OUT_PATH" | tr -d ' ')"
MB="$(awk "BEGIN {printf \"%.1f\", $BYTES / 1048576}")"

echo ""
echo "Release artifact ready:"
echo "  $OUT_PATH"
echo "  Size: ${MB} MB"
echo "  API:  https://api.bluraymaldives.site"
echo ""
if [ "$FORMAT" = "apk" ]; then
  echo "Install: adb install -r \"$OUT_PATH\""
else
  echo "Upload to Google Play Console (Production / Internal testing)."
fi
