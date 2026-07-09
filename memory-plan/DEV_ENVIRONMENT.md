# BlurayPOS — Local Dev Environment

> **Canonical reference** for running API, frontends, Android, and Docker on a dev machine.  
> **Update this file** whenever ports, containers, scripts, or proxy targets change.

---

## Quick start (one command)

```bash
./scripts/dev-all.sh
```

Starts Postgres + Redis + API (Docker), waits for health, then runs POS + Admin + Marketing frontends in one terminal.

**Keep this terminal open** while developing. Ctrl+C stops frontends only; Docker services keep running.

---

## Service map

| Service | URL | How it runs |
|---------|-----|-------------|
| **API (canonical)** | http://localhost:5147 | Docker `bluraypos-api-industry` |
| **API (fallback)** | http://localhost:5148–5150 | When 5147 blocked — see `.dev-api-port` |
| API health | http://localhost:$(cat .dev-api-port 2>/dev/null || echo 5147)/health | JSON `status: healthy` |
| Swagger | http://localhost:5147/swagger | OpenAPI UI |
| Public marketing | http://localhost:5147/api/public/marketing | Anonymous; lists all stores incl. demo |
| POS terminal | http://localhost:5173 | Vite (`npm run dev`) |
| Admin portal | http://localhost:5174 | Vite |
| Marketing site | http://localhost:5175 | Vite |
| **Coupons site** | http://localhost:5176 | Vite (`@pos/coupons-site`) — public QR entry |
| **Online menu** | http://localhost:5178 | Vite (`@pos/online-menu`) — `{slug}` store menu |
| **Online order** | http://localhost:5177 | Vite (`@pos/online-order`) — `{slug}` checkout |
| PostgreSQL | localhost:5432 | Docker `bluraypos-postgres-1` |
| Redis | localhost:6379 | Docker `bluraypos-redis` |
| Portainer | https://localhost:9444 | Docker UI (optional) |

### LAN access (phone / Android on same Wi‑Fi)

| Service | URL |
|---------|-----|
| API | http://192.168.18.58:$(cat .dev-api-port 2>/dev/null \|\| echo 5147) |
| Marketing | http://192.168.18.58:5175 |
| POS | http://192.168.18.58:5173 |

Replace `192.168.18.58` with your machine IP (`hostname -I | awk '{print $1}'`).

---

## Canonical API port: **5147**

The **latest** API image (`bluraypos-api:latest`) runs as **`bluraypos-api-industry`** on port **5147**.

Includes: public marketing API, industry modes (Restaurant/Retail/Hybrid), Redis, report fixes, demo seed.

```bash
./scripts/ensure-dev-api.sh          # start if healthy
./scripts/ensure-dev-api.sh --rebuild   # rebuild image + start
```

**Stale container detection:** The script probes `GET /api/tables` (expects **401**, not **404**) and compares the running container image to `bluraypos-api:latest`. If the container is stale or unhealthy, it tries `docker rm -f` then `sudo docker rm -f`. If removal fails (e.g. container was started as root), it prints:

```bash
sudo docker rm -f bluraypos-api-industry && ./scripts/ensure-dev-api.sh
```

Until that is run, port **5147** may still serve an old API missing restaurant routes. The script **automatically falls back to port 5148** when 5147 is blocked, and writes the active port to `.dev-api-port` (used by `dev-all.sh`, Vite proxies, and Android builds).

**Cleanup script** (run in a real terminal so sudo can prompt for password):

```bash
./scripts/cleanup-stale-docker-api.sh
```

### Legacy / stale API containers (ignore or remove)

| Container | Port | Status |
|-----------|------|--------|
| `bluraypos-api-1` | 5142 | Stale — old compose image |
| `bluraypos-api-dev` | 5143 | Superseded |
| `bluraypos-api-v2` | 5144 | Superseded |
| `bluraypos-api-v3` | 5145 | Superseded |
| `bluraypos-api-v4` | 5146 | Superseded |
| `bluraypos-api-active` / `bluraypos-api-new` | 5148 | Fallback when 5147 blocked |

**Vite dev proxies** use `DEV_API_PORT` (from `.dev-api-port`, default **5147**).

### Clean up old containers

```bash
./scripts/cleanup-stale-docker-api.sh
# or manually:
sudo docker rm -f bluraypos-api-1 bluraypos-api-dev bluraypos-api-v2 bluraypos-api-v3 bluraypos-api-v4 bluraypos-api-industry bluraypos-api-new bluraypos-api-active
```

---

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/dev-all.sh` | **Main entry** — Docker infra + frontends |
| `scripts/ensure-dev-api.sh` | Start Postgres/Redis + API on 5147 (fallback 5148) |
| `scripts/cleanup-stale-docker-api.sh` | Remove root-owned stale API containers (needs sudo) |
| `scripts/install-android.sh` | Build debug APK + install + launch on USB device (dev API) |
| `scripts/build-android-preview.sh` | Build preview APK → `terminal_app/dist/` (production API, low-RAM Gradle) |
| `scripts/dev-local.sh` | Legacy: compose api on 5142 + frontends |
| `scripts/reset-dev-demo.sh` | Reset demo tenant data |
| `scripts/seed-dev-demo-now.py` | Seed demo products/orders |

---

## Vite API proxies

Frontends proxy `/api` (and `/hubs` where needed) to **`http://localhost:${DEV_API_PORT}`** (default **5147**):

| App | Config |
|-----|--------|
| Marketing | `frontend/apps/marketing-site/vite.config.ts` |
| POS | `frontend/apps/pos-terminal/vite.config.ts` |
| Admin | `frontend/apps/admin-portal/vite.config.ts` |
| Coupons | `frontend/apps/coupons-site/vite.config.ts` |
| Online order | `frontend/apps/online-order/vite.config.ts` |
| Online menu | `frontend/apps/online-menu/vite.config.ts` |

`dev-all.sh` sets `DEV_API_PORT` from `.dev-api-port` after `ensure-dev-api.sh` runs.

Optional: `VITE_API_URL=http://localhost:5147` in app `.env.local` files.

Default in `@pos/api-client`: `http://localhost:5147`.

### Admin portal — module subdomain URLs

Office sidebar **Modules** links use in-portal routes (`plan-modules.ts`). Public customer sites use:

| Variable | Dev default | Production |
|----------|-------------|------------|
| `VITE_COUPONS_URL` | http://localhost:5176 | https://coupons.bluraymaldives.site |
| `VITE_MENU_URL` | http://localhost:5178 | https://menu.bluraymaldives.site |
| `VITE_ORDER_URL` | http://localhost:5177 | https://order.bluraymaldives.site |

Full behavior: [OFFICE_MODULES.md](./OFFICE_MODULES.md).

---

## Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@demo.com` | `Admin123!` |
| Manager | `manager@demo.com` | `Manager123!` |
| Cashier | `cashier@demo.com` | `Cashier123!` |
| Waiter | `waiter@demo.com` | `Waiter123!` |

- **Tenant:** slug `demo`, org name "Demo Store", **BusinessType: Hybrid**
- **Branch:** "Main Branch" (code `MAIN`)
- **Plan:** Pro (default on first seed) · **Currency:** MVR

### Switching demo plan in dev

The demo store starts on **Pro** so all modules are available for testing. You can switch plans without re-seeding:

1. Log in as **Manager** (`manager@demo.com`) → **Billing** → **Switch** on Free, Basic, or Pro.
2. Or as **Super Admin** → **Tenants** → change plan on the demo org.

Plan changes persist across API restarts. Super Admin can also toggle modules per plan under **Plans** (e.g. enable Online Ordering on Basic only).

---

## Android terminal app

| Item | Value |
|------|-------|
| Path | `terminal_app/` |
| Version | **0.6.0** |
| Debug API | `http://<LAN-IP>:<port>` — reads `.dev-api-port` (see `app/build.gradle.kts`) |
| Package | `com.bluraypos.terminal` |

```bash
./scripts/install-android.sh
```

---

## Docker compose (`docker-compose.yml`)

Defines `postgres`, `redis`, and `api` (port 5142). **`ensure-dev-api.sh`** uses compose for Postgres/Redis and runs `bluraypos-api-industry` on 5147 separately.

Network: `bluraypos_default`

---

## Health checks

```bash
PORT=$(cat .dev-api-port 2>/dev/null || echo 5147)
curl -s "http://localhost:${PORT}/health" | jq .
curl -s "http://localhost:${PORT}/api/public/marketing" | jq '.data.customers'
curl -s "http://localhost:${PORT}/api/tables" -w "\nHTTP %{http_code}\n"   # expect 401, not 404
curl -s http://localhost:5175/api/public/marketing | jq '.data.customers'
```

---

## Agent / Cursor workflow

1. **At session start:** `./scripts/ensure-dev-api.sh` if API down; `./scripts/dev-all.sh` for full stack.
2. **After backend changes:** `docker build -t bluraypos-api:latest . && ./scripts/ensure-dev-api.sh --rebuild`
3. **After port/proxy changes:** update this file + all `vite.config.ts` + `build.gradle.kts` + `api-client/client.ts`
4. **Document** in `DEVELOPMENT_HANDOFF.md` § session history.

See `.cursor/rules/dev-environment.mdc`.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Manager sidebar missing **Modules** | Log out/in; confirm Pro plan; stale API may omit `hasCoupons` — frontend falls back via `planSlug`; rebuild API for full `/me` |
| API 404 on `/api/public/marketing` | Stale container on 5142 — use 5147 or rebuild |
| `GET /api/tables` returns 404 | Stale `bluraypos-api-industry` — run `./scripts/cleanup-stale-docker-api.sh` |
| `ensure-dev-api.sh` exits with stale warning | Same as above; script probes `/api/tables` (401 = OK, 404 = old image) |
| `permission denied` stopping containers | Containers started as root — use `./scripts/cleanup-stale-docker-api.sh` in a terminal (sudo password), or reboot then `./scripts/ensure-dev-api.sh --rebuild` |
| API on port 5148 instead of 5147 | Automatic fallback when 5147 blocked; check `.dev-api-port` |
| Marketing customers empty | Check API health; proxy must be 5147 |
| POS/Android can't reach API | LAN IP + port from `.dev-api-port`; same Wi‑Fi; run `./scripts/ensure-dev-api.sh` |
| Redis errors | Ensure `bluraypos-redis` running |
| Frontend port in use | Kill old `npm run dev` |

---

## Related docs

| File | Contents |
|------|----------|
| [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) | Full repo map |
| [DEVELOPMENT_HANDOFF.md](./DEVELOPMENT_HANDOFF.md) | Project memory |
| [TERMINAL_APP.md](./TERMINAL_APP.md) | Android |
| [INDUSTRY_MODES.md](./INDUSTRY_MODES.md) | Restaurant vs Retail |
| [OFFICE_MODULES.md](./OFFICE_MODULES.md) | Office sidebar & plan modules |
| [TABLE_ORDERS.md](./TABLE_ORDERS.md) | Restaurant table orders |
