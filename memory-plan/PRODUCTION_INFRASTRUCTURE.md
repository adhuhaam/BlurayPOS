# BlurayPOS Production Infrastructure

Canonical production deployment plan for DigitalOcean.

## Hosting Platform

| Component | Technology |
|-----------|------------|
| OS | Ubuntu 24.04 LTS |
| Backend | .NET 9 (systemd `bluraypos-api.service`) |
| Office App | React (`@pos/admin-portal`) |
| POS PWA | React (`@pos/pos-terminal`) |
| Reverse Proxy | Nginx |
| Database | PostgreSQL 17 (Docker, localhost only) |
| Cache | Redis 7 (Docker, localhost only) |
| SSL | Let's Encrypt + Certbot |
| CI/CD | Manual deploy (`scripts/push-to-droplet.sh`) |
| DNS | DigitalOcean |

Docker is used for **infrastructure only** (PostgreSQL, Redis). The API runs as a **systemd service**. Full containerization of the API is a future phase.

---

## Domain & DNS

**Registrar:** Namecheap  
**Nameservers (required):**

```
ns1.digitalocean.com
ns2.digitalocean.com
ns3.digitalocean.com
```

Once nameservers point to DigitalOcean, manage **all** DNS records in DigitalOcean — not Namecheap Advanced DNS.

### Domain Structure

| URL | Purpose |
|-----|---------|
| `https://bluraymaldives.site` | Marketing homepage (`@pos/marketing-site` → `/var/www/bluraypos/landing/`) |
| `https://office.bluraymaldives.site` | Office / admin application |
| `https://api.bluraymaldives.site` | .NET API |
| `https://pos.bluraymaldives.site` | POS terminal PWA |

**Future:** `auth.*`, `cdn.*`, `status.*`

### DNS Records (DigitalOcean)

| Type | Name | Value |
|------|------|-------|
| A | @ | Droplet IP |
| A | office | Droplet IP |
| A | api | Droplet IP |
| A | menu | Droplet IP |
| A | order | Droplet IP |
| A | coupons | Droplet IP |

Run `bash scripts/setup-dns.sh` to verify propagation.


## HTTPS (Mandatory)

- All production endpoints use HTTPS
- HTTP redirects to HTTPS via permanent 301 (certbot `--redirect`)
- Certificates auto-renew via certbot
- Security headers applied after SSL setup

Setup (after DNS propagates):

```bash
ssh root@<droplet-ip> 'bash /opt/bluraypos/scripts/setup-ssl.sh'
```

---

## Nginx

Nginx handles:

- Static React builds (landing, office, POS)
- Reverse proxy to API (`127.0.0.1:5000`)
- HTTPS termination
- HTTP → HTTPS redirects
- Gzip compression
- Static asset caching
- Security headers (HSTS, CSP, X-Frame-Options, etc.)

Config: `deploy/nginx/bluraypos.conf`

---

## Security Headers

Enabled via `deploy/nginx/snippets/security-headers.conf`:

- Strict-Transport-Security
- X-Content-Type-Options
- X-Frame-Options
- Referrer-Policy
- Content-Security-Policy
- Permissions-Policy

---

## Ports

| Port | Access | Service |
|------|--------|---------|
| 22 | Public (UFW) | SSH |
| 80 | Public (UFW) | Nginx (redirect) |
| 443 | Public (UFW) | Nginx (HTTPS) |
| 5000 | Localhost only | .NET API |
| 5432 | Localhost only | PostgreSQL |
| 6379 | Localhost only | Redis |

Only Nginx exposes public HTTP/HTTPS traffic.

---

## Deployment Flow

```
Local dev machine
  ↓
bash scripts/push-to-droplet.sh (rsync + SSH)
  ↓
git pull (on server, optional)
  ↓
docker compose up (PostgreSQL + Redis)
  ↓
dotnet ef database update
  ↓
dotnet publish → systemd restart
  ↓
npm build → rsync static files
  ↓
nginx reload
```

**Note:** GitHub Actions workflows were removed (July 2026). Pushes to `main` no longer auto-deploy or run CI. Build and verify locally before `push-to-droplet.sh`.

### Manual deploy

```bash
bash scripts/push-to-droplet.sh
```

### On-server deploy

```bash
bash scripts/deploy-production.sh
```

---

## Systemd

API service: `deploy/systemd/bluraypos-api.service`

```bash
systemctl status bluraypos-api
journalctl -u bluraypos-api -f
```

- Auto-start on boot
- Auto-restart on failure

---

## Health Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/live` | Liveness — process is running |
| `/ready` | Readiness — PostgreSQL + Redis connected |
| `/health` | Full health report with check details |

Monitor via DigitalOcean uptime checks on `https://api.bluraymaldives.site/health`.

---

## Logging

| Source | Command |
|--------|---------|
| API | `journalctl -u bluraypos-api` |
| Nginx access | `/var/log/nginx/access.log` |
| Nginx error | `/var/log/nginx/error.log` |
| Backups | `/var/log/bluraypos-backup.log` |
| SSL monitor | `/var/log/bluraypos-ssl.log` |

---

## Firewall (UFW)

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

---

## Database Backups

Script: `scripts/backup-postgres.sh`  
Cron: daily at 02:00 UTC

| Tier | Retention |
|------|-----------|
| Daily | 7 days |
| Weekly | 4 weeks |
| Monthly | 6 months |

Backups stored in `/var/backups/bluraypos/`.

---

## SSL Monitoring

Script: `scripts/monitor-ssl.sh`  
Cron: daily at 06:00 UTC

Checks:

- Certificate expiration (< 14 days warning)
- HTTPS accessibility
- HTTP → HTTPS redirects
- Certbot renewal dry-run (Sundays)

---

## Production Checklist

Run before/after every deployment:

```bash
bash scripts/verify-production.sh
```

Verifies: HTTPS, redirects, SSL, DNS, API health/ready/live, office/POS apps, PostgreSQL, Redis, systemd, nginx, UFW, backups, monitoring.

---

## Android APK distribution

Signed production APKs are archived in the repo:

```
docs/apk releases/BlurayPOS-v0.7.0-release.apk
```

Build locally with `./scripts/build-android-release.sh apk`. See [../docs/apk releases/README.md](../docs/apk%20releases/README.md).

---

## Offline POS Architecture

The Android POS terminal (`terminal_app/`) must operate without internet:

- Local SQLite database
- Offline authentication cache
- Local orders, payments, receipts
- Inventory cache
- Automatic sync with conflict resolution
- Retry queue + background sync

See `memory-plan/ANDROID_MASTER_PLAN.md` and `memory-plan/TERMINAL_APP.md`.

API URL for devices: `https://api.bluraymaldives.site`

---

## Android POS Device

Supported: Android POS terminals, kiosk mode, auto-launch, hardware (printer, scanner, cash drawer, etc.).

See `memory-plan/ANDROID_MASTER_PLAN.md` for full hardware and kiosk requirements.

---

## File Reference

| Path | Purpose |
|------|---------|
| `docker-compose.infra.yml` | PostgreSQL + Redis |
| `deploy/nginx/bluraypos.conf` | Nginx vhosts |
| `deploy/systemd/bluraypos-api.service` | API systemd unit |
| `scripts/provision-droplet.sh` | First-time server setup |
| `scripts/deploy-production.sh` | Production deploy |
| `scripts/setup-ssl.sh` | Let's Encrypt |
| `scripts/backup-postgres.sh` | Database backups |
| `scripts/monitor-ssl.sh` | SSL monitoring |
| `scripts/verify-production.sh` | Pre-flight checklist |
| `.env.production.example` | Environment template |
