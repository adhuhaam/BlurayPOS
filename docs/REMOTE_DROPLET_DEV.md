# Remote development on the DigitalOcean droplet

Develop BlurayPOS **on the production droplet** via **Cursor Remote SSH** — not on your local Ubuntu PC.

| Item | Value |
|------|--------|
| Droplet | `bluraypos` / `161.35.5.82` |
| Repo on server | `/opt/bluraypos` |
| SSH host alias | `bluraypos` (in `~/.ssh/config` on your local PC) |

---

## SSH config (local PC)

Your local machine should already have:

```ssh-config
Host bluraypos
    HostName 161.35.5.82
    User root
    IdentityFile ~/.ssh/id_ed25519
```

Test from a terminal on your PC:

```bash
ssh bluraypos
cd /opt/bluraypos && git status
```

---

## Connect with Cursor Remote SSH

1. On your **local PC**, open **Cursor**.
2. **Command Palette** → **Remote-SSH: Connect to Host…** → choose **`bluraypos`**.
3. When connected, **File → Open Folder** → **`/opt/bluraypos`** (exact path).
4. Use **one Cursor window** for this host. Multiple windows can overload a 2 GB droplet and cause SSH install loops.

If connection loops or times out during “Installing Cursor Server”, SSH in and run:

```bash
bash /opt/bluraypos/scripts/reset-cursor-remote.sh
```

Wait ~30 seconds, then reconnect (still one window).

---

## Pull latest code (on droplet)

```bash
cd /opt/bluraypos
git pull
```

`deploy-production.sh` also runs `git pull --ff-only origin main` when you deploy.

---

## After pull: production deploy (default)

Production is the normal workflow on the droplet.

```bash
cd /opt/bluraypos
bash scripts/deploy-production.sh
```

This script:

1. Ensures `/opt/bluraypos/.env` exists (server secrets — see below).
2. Starts PostgreSQL + Redis (`docker compose -f docker-compose.infra.yml`).
3. Runs EF migrations (`dotnet ef database update`).
4. Publishes the API and restarts `bluraypos-api` (systemd).
5. Builds frontends with **`frontend/env/.env.production`** and rsyncs to `/var/www/bluraypos/`.
6. Reloads nginx.

Verify:

```bash
bash scripts/verify-production.sh
curl -s https://api.bluraymaldives.site/health | jq .
```

### Low-RAM frontend build (2 GB droplet)

`npm run build` for six Vite apps can OOM on a 2 GB VM. Prefer building on your PC and syncing:

```bash
# On local PC (after commit + push)
bash scripts/sync-all.sh
```

Or on the droplet, skip server npm and pre-sync `dist/`:

```bash
export SKIP_SERVER_NPM=1
export SKIP_STATIC_PUBLISH=1   # if dist already in /var/www/bluraypos
bash scripts/deploy-production.sh
```

---

## Dev workflow on droplet (optional)

Only if you need hot-reload on the server. **Not recommended** on a 2 GB droplet — use production deploy or `sync-all.sh` instead.

```bash
cd /opt/bluraypos
./scripts/ensure-dev-api.sh    # API + Postgres + Redis (Docker)
./scripts/dev-all.sh           # all Vite dev servers — heavy on RAM
```

Dev frontends use **`frontend/env/.env.development`** (localhost URLs + Vite proxy). See [memory-plan/DEV_ENVIRONMENT.md](../memory-plan/DEV_ENVIRONMENT.md).

---

## Production vs development environment separation

| What | Where | Committed? |
|------|--------|------------|
| Server secrets (DB, JWT, `API_URL`, `POSTGRES_PASSWORD`, …) | `/opt/bluraypos/.env` **on droplet only** | **No** — never commit |
| Frontend production URLs (`VITE_*`) | `frontend/env/.env.production` | Yes |
| Frontend dev URLs | `frontend/env/.env.development` | Yes |
| Per-machine dev overrides | `frontend/env/.env.development.local` | No (gitignored) |

Rules:

1. **Never** put `VITE_*` in repo-root `.env`.
2. **Never** add `frontend/apps/*/.env.local` — it can poison production builds.
3. Template for server secrets: `.env.production.example` → copy to `/opt/bluraypos/.env` on the droplet.

Details: [frontend/env/README.md](../frontend/env/README.md).

---

## 2 GB droplet notes

- **Swap:** If not already configured, add 2 GB swap so builds and Cursor Server are less likely to kill processes:

  ```bash
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  ```

- **One Cursor window** per droplet session.
- **Do not** run `dev-all.sh` (six Vite apps) alongside production nginx + API + Postgres + Redis unless you are debugging and accept swapping/OOM risk.
- **Prefer** `bash scripts/sync-all.sh` from your PC for frontend releases.
- Monitor memory: `free -h` and `htop`.

---

## Demo logins (testing)

Tenant: **Demo Store** (slug `demo`), branch **Main Branch**.

| Role | Email | Password | App |
|------|-------|----------|-----|
| Super Admin | `admin@demo.com` | `Admin123!` | https://office.bluraymaldives.site (platform) |
| Manager | `manager@demo.com` | `Manager123!` | Office — full tenant admin |
| Cashier | `cashier@demo.com` | `Cashier123!` | https://pos.bluraymaldives.site |
| Waiter | `waiter@demo.com` | `Waiter123!` | POS |

Production URLs:

| Site | URL |
|------|-----|
| Marketing | https://bluraymaldives.site |
| Office | https://office.bluraymaldives.site |
| POS | https://pos.bluraymaldives.site |
| API | https://api.bluraymaldives.site |

---

## Agent on droplet: pull and deploy

Copy this checklist when asking a Cursor agent (connected via Remote SSH to `/opt/bluraypos`) to ship changes.

```
You are on the BlurayPOS droplet. Repo: /opt/bluraypos. Do not commit or edit .env.

1. cd /opt/bluraypos
2. git fetch origin && git pull --ff-only origin main
3. Review git log -1 and confirm expected changes (migrations, API, frontend).
4. If new EF migrations exist under backend/src/Pos.Infrastructure/Persistence/Migrations/:
   - deploy-production.sh runs them automatically; or run manually:
     source .env && export ConnectionStrings__DefaultConnection="Host=127.0.0.1;Port=5432;Database=${POSTGRES_DB:-pos_prod};Username=${POSTGRES_USER:-pos};Password=${POSTGRES_PASSWORD}"
     dotnet ef database update --project backend/src/Pos.Infrastructure/Pos.Infrastructure.csproj --startup-project backend/src/Pos.Api/Pos.Api.csproj
5. Deploy production:
   - Full (if enough RAM): bash scripts/deploy-production.sh
   - Low-RAM (frontend built elsewhere): export SKIP_SERVER_NPM=1 SKIP_STATIC_PUBLISH=1 && bash scripts/deploy-production.sh
6. Verify: bash scripts/verify-production.sh
7. Smoke test: curl -sf https://api.bluraymaldives.site/health && curl -sfI https://office.bluraymaldives.site | head -1
8. Report: commit hash deployed, migration status, API health, any errors from journalctl -u bluraypos-api -n 50
```

---

## Related docs

- [docs/ANDROID_PRODUCTION_BUILD.md](./ANDROID_PRODUCTION_BUILD.md) — local PC: git pull, preview/release APK
- [memory-plan/PRODUCTION_INFRASTRUCTURE.md](../memory-plan/PRODUCTION_INFRASTRUCTURE.md) — nginx, DNS, systemd
- [memory-plan/DEV_ENVIRONMENT.md](../memory-plan/DEV_ENVIRONMENT.md) — local PC dev (ports, Docker)
- [frontend/env/README.md](../frontend/env/README.md) — `VITE_*` env files
- `scripts/push-to-droplet.sh` — rsync from PC + deploy
- `scripts/sync-all.sh` — git push + local frontend build + droplet deploy (low-RAM safe)
