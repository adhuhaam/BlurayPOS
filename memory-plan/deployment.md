# Production Deployment & Infrastructure Plan

> **Canonical production hosting spec for BlurayPOS.**  
> Dev/local setup: [README.md](../README.md) · Architecture: [architecture.md](./architecture.md) · Project memory: [DEVELOPMENT_HANDOFF.md](./DEVELOPMENT_HANDOFF.md)

---

## Hosting Platform

BlurayPOS production runs on a **DigitalOcean Ubuntu Server**.

| Component | Technology |
|-----------|------------|
| OS | Ubuntu LTS |
| Backend | .NET 9 (`Pos.Api`) |
| Office app | React (Admin Portal + POS web builds) |
| Reverse proxy | Nginx |
| Database | PostgreSQL |
| Cache / jobs | Redis (caching & background jobs) |
| TLS | Let's Encrypt (Certbot) |
| Containers | Docker support — **future phase** (dev uses Docker Compose today) |
| CI/CD | GitHub Actions (automate deployment — future) |
| DNS | DigitalOcean DNS |

---

## Domain & DNS

**Registrar:** Namecheap  
**DNS management:** DigitalOcean (after nameserver cutover)

**Nameservers (set at registrar):**

```
ns1.digitalocean.com
ns2.digitalocean.com
ns3.digitalocean.com
```

> **Important:** Once the domain uses DigitalOcean nameservers, **all DNS records must be managed inside DigitalOcean.** Do **not** use Namecheap Advanced DNS.

---

## Domain Structure

| Purpose | URL | Notes |
|---------|-----|-------|
| Main website | `https://bluraymaldives.site` | Marketing SPA — see [MARKETING_SITE.md](./MARKETING_SITE.md) |
| Office (Admin + web POS) | `https://office.bluraymaldives.site` | React SPA builds |
| API | `https://api.bluraymaldives.site` | .NET backend |
| Auth | `https://auth.bluraymaldives.site` | Future dedicated auth surface (or API auth routes) |
| CDN | `https://cdn.bluraymaldives.site` | Static assets, uploads |
| Status | `https://status.bluraymaldives.site` | Public status / uptime page |

All subdomains use the primary zone **`bluraymaldives.site`**.

---

## HTTPS (Mandatory)

Every production endpoint **must** use HTTPS.

- No HTTP endpoints remain accessible except automatic redirect to HTTPS.
- Certificates: **Let's Encrypt** via **Certbot**.
- Nginx performs permanent **301** redirects: `http://domain` → `https://domain`.
- Certificates must **auto-renew** (Certbot timer + post-renew reload of Nginx).

---

## Nginx Reverse Proxy

Nginx is the **only** public-facing application entry point.

Responsibilities:

- Serve React production builds (office app)
- Reverse proxy .NET API (`api` subdomain)
- Terminate TLS (HTTPS)
- HTTP → HTTPS redirects
- Compression (`gzip` / `brotli` where enabled)
- Static asset caching headers
- Security headers (see below)

Example upstream layout (conceptual):

```
office.bluraymaldives.site  →  /var/www/bluraypos/office/
api.bluraymaldives.site     →  http://127.0.0.1:5000 (Kestrel)
```

---

## Security Headers

Nginx must send (at minimum):

| Header | Purpose |
|--------|---------|
| `Strict-Transport-Security` | Force HTTPS in browsers |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | Clickjacking protection |
| `Referrer-Policy` | Control referrer leakage |
| `Content-Security-Policy` | Restrict script/style sources |
| `Permissions-Policy` | Disable unused browser features |

Tune CSP per app once React build asset paths are fixed.

---

## Production Ports

| Exposure | Ports | Service |
|----------|-------|---------|
| **Public** | 80, 443 | Nginx only |
| **Private (localhost / VPC)** | 5000, 5001 | Kestrel / API |
| **Private** | 5432 | PostgreSQL |
| **Private** | 6379 | Redis |

Only Nginx exposes public traffic. Database and Redis must not be reachable from the internet.

---

## Deployment Flow

Current (manual) flow:

```
GitHub
  ↓
DigitalOcean Ubuntu Server
  ↓
git pull
  ↓
dotnet publish (API)
  ↓
npm run build (React office apps)
  ↓
Restart systemd services
  ↓
Zero-downtime reload (Nginx + rolling API restart)
```

**Future:** Automate with **GitHub Actions** (build, test, SSH deploy or artifact upload).

### Build-time frontend variables

```bash
cd frontend
VITE_API_URL=https://api.bluraymaldives.site npm run build -w @pos/admin-portal
VITE_API_URL=https://api.bluraymaldives.site npm run build -w @pos/pos-terminal
```

Deploy `dist/` output to the Nginx document root for `office.bluraymaldives.site`.

### Backend environment (production)

| Variable | Description |
|----------|-------------|
| `ConnectionStrings__DefaultConnection` | PostgreSQL (localhost or managed) |
| `Redis__ConnectionString` | Redis for cache / background jobs |
| `Jwt__Secret` | Strong secret (≥ 32 chars), not dev default |
| `Jwt__Issuer` / `Jwt__Audience` | Production values |
| `Cors__Origins__*` | `https://office.bluraymaldives.site` (exact origins) |
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `ASPNETCORE_URLS` | `http://127.0.0.1:5000` (behind Nginx) |

Run EF migrations before or during deploy:

```bash
dotnet ef database update --project Pos.Infrastructure --startup-project Pos.Api
```

Disable or protect Swagger in production.

---

## Systemd Services

The API runs as a managed systemd unit.

Example unit name: **`bluraypos-api.service`**

Requirements:

- Auto-start on boot
- Auto-restart on failure
- `Restart=on-failure` / `RestartSec=5`
- `After=network.target postgresql.service redis.service`

Future units may include background workers consuming Redis queues.

---

## Logging

| Source | Tool |
|--------|------|
| API & workers | `journalctl -u bluraypos-api` |
| Nginx access / error | `/var/log/nginx/` |
| Application | Structured logs to journal or file |

**Future:** Centralized logging (e.g. Loki, Datadog, or DO monitoring integration).

---

## SSL Monitoring

On a schedule (cron or monitoring agent), verify:

- Certificate expiration date
- Certbot renewal success
- HTTPS accessibility per hostname
- HTTP → HTTPS redirect works

Alert before expiry (e.g. &lt; 14 days).

---

## Health Monitoring

Expose health endpoints on the API (Nginx proxies to API):

| Endpoint | Purpose |
|----------|---------|
| `/health` | Overall health (exists today) |
| `/ready` | Ready to accept traffic (DB + Redis up) |
| `/live` | Process alive (liveness) |

**DigitalOcean Uptime Monitoring** (or external) should poll:

- `https://api.bluraymaldives.site/health`
- `https://office.bluraymaldives.site/` (office app)

---

## Firewall

**Ubuntu UFW**

| Action | Ports |
|--------|-------|
| Allow | 22 (SSH) |
| Allow | 80, 443 (HTTP/S via Nginx) |
| Deny | Everything else (default incoming) |

PostgreSQL, Redis, and Kestrel bind to localhost only.

---

## Database Backups

**PostgreSQL** on production:

| Schedule | Retention |
|----------|-----------|
| Daily | Short-term (e.g. 7 days) |
| Weekly | Medium (e.g. 4 weeks) |
| Monthly | Long-term (e.g. 12 months) |

Document retention policy and test restore quarterly. Store backups off-server (DO Spaces or separate region).

---

## Offline POS Architecture

Restaurant and retail operations **must not stop** because of internet outages.

Applies to **Android native POS** (`terminal_app/`) and **web POS PWA** (`@pos/offline-sync`).

| Requirement | Android (target) | Web POS (today) |
|-------------|------------------|-----------------|
| Local database | Room (SQLite) | Dexie (IndexedDB) |
| Offline auth cache | Required | Session + cached permissions |
| Local orders & payments | Required | Outbox queue |
| Local receipts | Required | Print / view cached |
| Inventory / product cache | Required | Product cache |
| Automatic sync | WorkManager + `/api/sync` | `syncPush` / `syncPull` |
| Conflict resolution | Server-wins + audit | Idempotency keys |
| Retry queue | Persistent queue | Outbox |
| Background sync | WorkManager | On reconnect |

> No restaurant operation should stop because of an internet outage. See [ANDROID_MASTER_PLAN.md](./ANDROID_MASTER_PLAN.md) § Offline First.

---

## Android POS Device (Production)

Supported hardware and behaviors:

| Area | Requirements |
|------|----------------|
| Devices | Android POS terminal, phones, tablets |
| Kiosk | App auto-launch after reboot; prevent exiting app (Device Owner on Pro) |
| Updates | Remote update support; silent APK where OEM allows |
| Printer | 58 mm thermal (built-in or Bluetooth) |
| Scanner | Built-in, camera, or Bluetooth barcode |
| Connectivity | Wi‑Fi, Bluetooth, USB / OTG |
| Peripherals | Cash drawer, buzzer |
| Monitoring | Battery, paper low, device heartbeat |

Production API URL for devices: `https://api.bluraymaldives.site`

---

## Production Deployment Checklist

Before **every** production deployment, verify:

- [ ] HTTPS working on all hostnames
- [ ] HTTP redirects to HTTPS (301)
- [ ] SSL certificates valid and auto-renew configured
- [ ] DNS propagated (DO DNS records correct)
- [ ] API reachable at `https://api.bluraymaldives.site`
- [ ] Office app reachable at `https://office.bluraymaldives.site`
- [ ] `/health` returns OK
- [ ] `/ready` and `/live` return OK (when implemented)
- [ ] Database connected
- [ ] Redis connected
- [ ] Background jobs running
- [ ] `bluraypos-api.service` healthy (`systemctl status`)
- [ ] Nginx config valid (`nginx -t`)
- [ ] UFW enabled; only 22, 80, 443 open
- [ ] Daily backups enabled and recent backup exists
- [ ] Uptime monitoring active
- [ ] Logging active (`journalctl`, Nginx logs)
- [ ] Auto SSL renewal active (Certbot timer)
- [ ] Offline sync functioning (web + Android)
- [ ] Android kiosk mode functioning (Pro terminals)
- [ ] Printer test successful
- [ ] Barcode scanner test successful

---

## Related Documents

| Document | Contents |
|----------|----------|
| [DEVELOPMENT_HANDOFF.md](./DEVELOPMENT_HANDOFF.md) | Full project memory |
| [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) | Phase 9 — production infra tracker |
| [architecture.md](./architecture.md) | Production topology diagram |
| [ANDROID_MASTER_PLAN.md](./ANDROID_MASTER_PLAN.md) | Offline-first Android spec |
| [TERMINAL_APP.md](./TERMINAL_APP.md) | Android dev setup |
