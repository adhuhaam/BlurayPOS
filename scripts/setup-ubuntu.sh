#!/usr/bin/env bash
# BlurayPOS — first-time Ubuntu setup (run once in your terminal)
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

echo "==> Installing system packages (needs sudo once)..."
sudo apt update
sudo apt install -y git curl unzip ca-certificates

echo "==> Adding $USER to docker group (log out/in after if docker still fails)..."
sudo usermod -aG docker "$USER" || true

echo "==> Node.js via nvm..."
export NVM_DIR="$HOME/.nvm"
if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
fi
# shellcheck source=/dev/null
. "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20

echo "==> Starting Postgres + API (Docker)..."
if docker compose version >/dev/null 2>&1; then
  docker compose up --build -d
else
  sudo docker compose up --build -d
fi

echo "==> Waiting for API..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:5142/health >/dev/null 2>&1; then
    echo "API is up."
    break
  fi
  sleep 2
done

echo "==> Frontend dependencies..."
cd "$REPO_ROOT/frontend"
npm install

echo ""
echo "Done. Start the UI in a new terminal:"
echo "  cd $REPO_ROOT/frontend && npm run dev"
echo ""
echo "URLs:"
echo "  API/Swagger: http://localhost:5142/swagger"
echo "  POS:         http://localhost:5173"
echo "  Admin:       http://localhost:5174"
echo ""
echo "Demo login: manager@demo.com / Manager123!"
