#!/usr/bin/env bash
# Generate a release keystore for BlurayPOS Android (run once on your local PC).
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/../terminal_app" && pwd)"
KEYSTORE="$APP_DIR/bluraypos-release.jks"
PROPS="$APP_DIR/keystore.properties"
EXAMPLE="$APP_DIR/keystore.properties.example"

if [ -f "$KEYSTORE" ]; then
  echo "Keystore already exists: $KEYSTORE" >&2
  exit 1
fi

read -r -p "Keystore password: " STORE_PASS
read -r -p "Key password (Enter to match keystore): " KEY_PASS
KEY_PASS="${KEY_PASS:-$STORE_PASS}"

keytool -genkeypair -v \
  -keystore "$KEYSTORE" \
  -alias bluraypos \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass "$STORE_PASS" \
  -keypass "$KEY_PASS" \
  -dname "CN=BlurayPOS, OU=Terminal, O=Bluray Maldives, L=Male, ST=Maldives, C=MV"

cp -n "$EXAMPLE" "$PROPS" 2>/dev/null || true
# shellcheck disable=SC2016
sed -i "s|^storePassword=.*|storePassword=$STORE_PASS|" "$PROPS"
sed -i "s|^keyPassword=.*|keyPassword=$KEY_PASS|" "$PROPS"

echo ""
echo "Created:"
echo "  $KEYSTORE"
echo "  $PROPS"
echo ""
echo "Back up the .jks file securely — you need it for every Play Store update."
