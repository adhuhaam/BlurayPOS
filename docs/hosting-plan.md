# BlurayPOS — Hosting & Deployment Plan (DigitalOcean Droplet)

> **Goal:** host BlurayPOS on a single DigitalOcean droplet with automatic HTTPS,
> and auto-deploy on every merge/push to `main` from GitHub.
> Related: [deployment.md](./deployment.md) (generic cloud reference).

---

## 1. Target architecture

A single Ubuntu droplet runs the whole stack with Docker Compose. [Caddy](https://caddyserver.com)
is the edge: it terminates TLS (free Let's Encrypt certs), serves the two SPAs, and
reverse-proxies the API (including the SignalR websocket).

```
                         Internet (HTTPS :443)
                                │
                     ┌──────────▼───────────┐   DigitalOcean droplet
                     │   edge (Caddy)        │   (Docker Compose)
                     │  auto-TLS + routing   │
        ┌────────────┼───────────┬───────────┼─────────────┐
        │            │           │           │             │
 admin.<domain>  pos.<domain>  api.<domain>  │             │
   /srv/admin      /srv/pos    reverse_proxy │             │
   (static SPA)   (static PWA)      │         │             │
                                    ▼         │             │
                              ┌───────────┐   │       ┌───────────┐
                              │  api      │───┼──────▶│  db        │
                              │ .NET 9    │  internal │ postgres17 │
                              │ :8080     │  network  │ (volume)   │
                              └───────────┘           └───────────┘
```

**Subdomains** (all point at the droplet's IP):

| Host | Serves |
|------|--------|
| `admin.<domain>` | Admin Portal SPA |
| `pos.<domain>` | POS Terminal PWA |
| `api.<domain>` | .NET API + `/hubs/pos` (SignalR) |

Everything is defined in [`deploy/docker-compose.prod.yml`](../deploy/docker-compose.prod.yml).

---

## 2. Droplet sizing

| Workload | Recommendation |
|----------|----------------|
| Evaluation / small store | **2 GB RAM / 1–2 vCPU** ($12–18/mo). Building the .NET image + two Vite apps on the droplet needs headroom; 1 GB can OOM during build. |
| Production (few stores) | 2–4 GB RAM, add a swap file, enable weekly droplet backups. |
| Growth | Move PostgreSQL to **DigitalOcean Managed Postgres** and keep the droplet stateless. |

OS image: **Ubuntu 24.04 LTS** (24.04 or 22.04 both work with `deploy/provision.sh`).

---

## 3. Repository deploy artifacts

| File | Purpose |
|------|---------|
| [`deploy/docker-compose.prod.yml`](../deploy/docker-compose.prod.yml) | `db` + `api` + `edge` services |
| [`deploy/Dockerfile.web`](../deploy/Dockerfile.web) | Builds both SPAs (with `VITE_API_URL`) and bakes them into a Caddy image |
| [`deploy/Caddyfile`](../deploy/Caddyfile) | TLS + subdomain routing + API reverse proxy |
| [`deploy/.env.prod.example`](../deploy/.env.prod.example) | Template for secrets/config (copy to `deploy/.env.prod`, never commit) |
| [`deploy/provision.sh`](../deploy/provision.sh) | One-time droplet bootstrap (Docker, firewall, clone) |
| [`deploy/deploy.sh`](../deploy/deploy.sh) | Pull latest + rebuild + restart (used by CI and manually) |
| [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) | Auto-deploy on push to `main`/`master` |
| Root [`Dockerfile`](../Dockerfile) | Existing API image (reused) |

---

## 4. One-time setup

### 4.1 Create the droplet
1. DigitalOcean → **Create → Droplet** → Ubuntu 24.04, 2 GB plan, a region near your users.
2. Add your **SSH key** during creation (and, for CI, a dedicated deploy key — see §6).
3. Note the droplet's **public IPv4**.

### 4.2 DNS
Create **A records** pointing to the droplet IP:

```
api.<domain>    A   <droplet-ip>
admin.<domain>  A   <droplet-ip>
pos.<domain>    A   <droplet-ip>
```

TLS issuance (Caddy/Let's Encrypt) will fail until these resolve, so set them first.

### 4.3 Provision
SSH in as root and run the bootstrap (installs Docker + Compose, opens the firewall, clones the repo):

```bash
ssh root@<droplet-ip>
bash <(curl -fsSL https://raw.githubusercontent.com/adhuhaam/BlurayPOS/main/deploy/provision.sh)
# or: git clone https://github.com/adhuhaam/BlurayPOS.git /opt/bluraypos && bash /opt/bluraypos/deploy/provision.sh
```

### 4.4 Configure secrets
```bash
cd /opt/bluraypos
cp deploy/.env.prod.example deploy/.env.prod
nano deploy/.env.prod          # set DOMAIN, ACME_EMAIL, POSTGRES_PASSWORD, JWT_SECRET (min 32 chars)
```

### 4.5 First deploy
```bash
bash /opt/bluraypos/deploy/deploy.sh
```

Caddy obtains certificates automatically. After a minute:
* `https://admin.<domain>` and `https://pos.<domain>` load the apps
* `https://api.<domain>/health` returns `{"status":"healthy"}`

With `ASPNETCORE_ENVIRONMENT=Development` (the template default) the API auto-runs EF
migrations and seeds canonical plans, a Super Admin, and a demo store — so you can log in
immediately with the demo credentials in the root `README.md`.

---

## 5. Deployment (manual)

Deploys are **manual by choice** — auto-deploy on git push is disabled.

- **On the droplet:** `bash /opt/bluraypos/deploy/deploy.sh` (add `SKIP_BUILD=1` to use pre-loaded images on low-memory boxes — see §5.2).
- **From GitHub (optional):** [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) is `workflow_dispatch`-only — trigger it by hand from the Actions tab. It SSHes in and runs `deploy/deploy.sh`.

### 5.1 Build on the droplet (>= 2 GB RAM)
`deploy/deploy.sh` runs `docker compose ... up -d --build`, rebuilding the .NET image when
backend files change and the SPA image when frontend files change.

### 5.2 Low-memory droplets (build off-box, ship images)
On **512 MB–1 GB** droplets, building the .NET SDK image on the box OOMs/thrashes (it can
render the droplet unresponsive). Instead, build on a bigger machine and ship the small
runtime images (api ≈ 240 MB, edge ≈ 65 MB):

```bash
# on a build machine with Docker + the repo checked out
docker build -t bluraypos-api:latest -f Dockerfile .
docker build -t bluraypos-edge:latest -f deploy/Dockerfile.web \
  --build-arg VITE_API_URL=https://api.<domain> .

# ship both images to the droplet
docker save bluraypos-api:latest bluraypos-edge:latest | gzip | \
  ssh root@<droplet-ip> 'gunzip | docker load'

# start on the droplet without building
ssh root@<droplet-ip> 'cd /opt/bluraypos && SKIP_BUILD=1 bash deploy/deploy.sh'
# (or: docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod up -d --no-build)
```

The compose file pins `image: bluraypos-api` / `bluraypos-edge`, so `--no-build` reuses the
loaded images. Postgres is pulled directly from Docker Hub on the droplet.

### Required GitHub repository secrets
Add under **GitHub → repo → Settings → Secrets and variables → Actions**:

| Secret | Value |
|--------|-------|
| `DEPLOY_SSH_HOST` | droplet public IP or hostname |
| `DEPLOY_SSH_USER` | SSH user (`root` or a `deploy` user) |
| `DEPLOY_SSH_KEY` | **private** SSH key whose public half is in the droplet's `~/.ssh/authorized_keys` |
| `DEPLOY_SSH_PORT` | *(optional)* SSH port, defaults to `22` |

Generate a dedicated CI key so it can be revoked independently:

```bash
ssh-keygen -t ed25519 -C "bluraypos-ci" -f bluraypos_ci -N ""
# add bluraypos_ci.pub to the droplet:
ssh-copy-id -i bluraypos_ci.pub root@<droplet-ip>
# paste the private key (bluraypos_ci) into the DEPLOY_SSH_KEY secret
```

---

## 6. Configuration reference

`deploy/.env.prod` (see [`.env.prod.example`](../deploy/.env.prod.example)):

| Var | Notes |
|-----|-------|
| `DOMAIN` | root domain; subdomains derived automatically |
| `ACME_EMAIL` | Let's Encrypt contact/expiry notices |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | database credentials |
| `JWT_SECRET` | **min 32 chars**, keep secret; rotating it invalidates all tokens |
| `JWT_ISSUER` / `JWT_AUDIENCE` | default `PosApi` / `PosClients` |
| `ASPNETCORE_ENVIRONMENT` | `Development` = auto-migrate + seed + Swagger; `Production` = neither (see §7) |

CORS is wired automatically to `https://admin.<domain>` and `https://pos.<domain>`.
`VITE_API_URL` is baked into the SPA bundles at image-build time as `https://api.<domain>`.

---

## 7. Production hardening

The `Development` default is the least-friction way to get a working system (it auto-migrates
and seeds). Before serving real customers:

1. **Rotate secrets** — set a strong `JWT_SECRET` and `POSTGRES_PASSWORD` (never the dev defaults).
2. **Remove/di­sable demo accounts** — the seeded `*@demo.com` users exist only when first booted in `Development`; delete or change their passwords.
3. **Switch to `ASPNETCORE_ENVIRONMENT=Production`** to disable Swagger, the demo seeder, and enable stricter behavior. Caveat: the app only runs EF migrations automatically in `Development`. In `Production` you must apply migrations yourself, e.g. run once with the SDK image:
   ```bash
   docker run --rm --network bluraypos_default -v /opt/bluraypos:/src -w /src \
     mcr.microsoft.com/dotnet/sdk:9.0 bash -lc \
     "dotnet tool install -g dotnet-ef && export PATH=\$PATH:/root/.dotnet/tools && \
      ConnectionStrings__DefaultConnection='Host=db;Database=<db>;Username=<user>;Password=<pw>' \
      dotnet ef database update --project backend/src/Pos.Infrastructure --startup-project backend/src/Pos.Api"
   ```
   A fresh `Production` database also won't have the canonical plans or a Super Admin (those come from the seeder). Simplest path: do the very first boot in `Development` to seed, then switch to `Production` for subsequent deploys.
4. **Firewall** — `provision.sh` enables UFW for SSH/80/443; keep Postgres unexposed (it has no published port).
5. **Backups** — enable DigitalOcean weekly droplet backups and/or `pg_dump` on a cron (see §8).

---

## 8. Backups & data

PostgreSQL data lives in the `pg_data` Docker volume (persists across deploys/rebuilds).

Manual backup / restore:
```bash
# backup
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod \
  exec -T db pg_dump -U <user> <db> > backup_$(date +%F).sql
# restore
cat backup.sql | docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod \
  exec -T db psql -U <user> <db>
```

For durability, move to **DigitalOcean Managed PostgreSQL** and point
`ConnectionStrings__DefaultConnection` at it (drop the `db` service).

---

## 9. Operations

```bash
cd /opt/bluraypos
COMPOSE="docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod"

$COMPOSE ps            # status
$COMPOSE logs -f api   # tail API logs
$COMPOSE logs -f edge  # tail Caddy/TLS logs
$COMPOSE restart api   # restart one service
$COMPOSE down          # stop everything (data volume is kept)
```

**Rollback:** deploys are plain git checkouts, so roll back by deploying an earlier commit:
```bash
git -C /opt/bluraypos reset --hard <good-commit>
bash /opt/bluraypos/deploy/deploy.sh
```

---

## 10. Troubleshooting

| Symptom | Likely cause / fix |
|---------|--------------------|
| TLS cert not issued | DNS A records not resolving yet, or ports 80/443 blocked. Check `$COMPOSE logs edge`. |
| SPA loads but API calls fail (CORS/404) | `DOMAIN` mismatch — bundles call `https://api.<DOMAIN>`; ensure DNS + `.env.prod` agree, then rebuild `edge`. |
| Frontend calls `localhost:5142` | SPA image was built without `VITE_API_URL`; rebuild with `--build` (the compose passes it automatically). |
| Build OOM on droplet | Too little RAM — resize to 2 GB+ or add swap. |
| Login fails on fresh Production DB | No seed data; boot once in `Development` (§7) or seed manually. |
| SignalR not connecting | Caddy proxies `api.<domain>` incl. websockets by default; confirm the token query param and that `api.<domain>` resolves. |

---

## 11. What the maintainer must provide

To provision/operate this the following are needed (see the PR/agent request):

* A **DigitalOcean droplet** (Ubuntu 24.04) and its **public IP**.
* A **domain** with the three A records from §4.2.
* **SSH access** for the agent to configure the droplet directly (host + user + private key), *or* run the steps in §4 yourself.
* The four **GitHub Actions secrets** in §5 for the CD pipeline.
