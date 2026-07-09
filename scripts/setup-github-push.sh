#!/usr/bin/env bash
# One-time GitHub push setup for the BlurayPOS droplet.
# Usage:
#   GITHUB_TOKEN=ghp_xxx bash scripts/setup-github-push.sh
# Or add the printed deploy key manually at:
#   https://github.com/adhuhaam/BlurayPOS/settings/keys
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KEY_PRIV="/root/.ssh/github_bluraypos"
KEY_PUB="/root/.ssh/github_bluraypos.pub"
REPO="adhuhaam/BlurayPOS"

mkdir -p /root/.ssh
chmod 700 /root/.ssh

if [ ! -f "$KEY_PRIV" ]; then
  ssh-keygen -t ed25519 -f "$KEY_PRIV" -N "" -C "bluraypos-droplet-deploy"
fi

cat > /root/.ssh/config <<'EOF'
Host github.com
  HostName github.com
  User git
  IdentityFile /root/.ssh/github_bluraypos
  IdentitiesOnly yes
  StrictHostKeyChecking accept-new
EOF
chmod 600 /root/.ssh/config "$KEY_PRIV"

cd "$REPO_ROOT"
git remote set-url origin "git@github.com:${REPO}.git"

PUBKEY="$(cat "$KEY_PUB")"

if [ -n "${GITHUB_TOKEN:-}" ]; then
  echo "==> Registering deploy key via GitHub API..."
  EXISTING="$(gh api "repos/${REPO}/keys" --jq ".[].key" 2>/dev/null || true)"
  if echo "$EXISTING" | grep -qF "$(echo "$PUBKEY" | awk '{print $2}')"; then
    echo "Deploy key already registered."
  else
    gh api -X POST "repos/${REPO}/keys" \
      -f title="bluraypos-droplet-$(hostname -s)" \
      -f key="$PUBKEY" \
      -f read_only=false
    echo "Deploy key added."
  fi
else
  echo "==> Add this deploy key to GitHub (Allow write access):"
  echo "    https://github.com/${REPO}/settings/keys"
  echo ""
  echo "$PUBKEY"
  echo ""
  echo "Then run: cd $REPO_ROOT && git push origin main"
  echo "Or re-run with: GITHUB_TOKEN=ghp_xxx bash scripts/setup-github-push.sh"
  exit 1
fi

echo "==> Testing GitHub SSH..."
ssh -T git@github.com 2>&1 | grep -v "successfully authenticated" || true

echo "==> Pushing to origin/main..."
git push origin main
git status -sb
echo "Done."
