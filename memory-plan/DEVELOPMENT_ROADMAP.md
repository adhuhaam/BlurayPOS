# Development Roadmap

Tracked against [SAAS_REQUIREMENTS.md](./SAAS_REQUIREMENTS.md).  
**Full context & session memory:** [DEVELOPMENT_HANDOFF.md](./DEVELOPMENT_HANDOFF.md)

Legend: 🟢 Done · 🟡 Partial · 🔲 Planned

---

## Phase 1 — SaaS Foundation

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Authentication + JWT | 🟢 | Login, register, refresh; JWT not cookies; JSON 401 |
| 2 | Super Admin dashboard | 🟢 | Platform dashboard, tenants, plans, platform users, settings |
| 3 | Subscription plans | 🟡 | Free + Pro implemented; Basic tier in spec, not seeded |
| 4 | Store (tenant) management | 🟢 | CRUD, suspend, edit details, subscription on tenant |
| 5 | Self-registration | 🟢 | `/register` + `POST /api/auth/register` |
| 6 | RBAC permissions | 🟡 | DB permissions, JWT claims, org overrides, order enforcement; catalog not fully gated |
| 7 | User management | 🟢 | Manager CRUD, suspend, role assignment, role permission editor |
| 8 | Manager store user edit | 🟢 | Update user, password reset, plan user limits |
| 9 | Branch management (full) | 🟡 | `Store` entity exists; branch settings, per-branch scoping incomplete |
| 10 | Platform feature flags | 🔲 | Spec added; Super Admin UI not built |

---

## Phase 2 — Catalog & POS Operations

| # | Item | Status | Notes |
|---|------|--------|-------|
| 11 | Products & categories | 🟢 | CRUD, search, wizard, inline category picker |
| 12 | Inventory & supplies | 🟢 | Retail stock, ingredients, receive, recipe BOM |
| 13 | Catalog workflow UX | 🟢 | Workflow banner, empty states, guided recipe step |
| 14 | Orders & payments | 🟢 | Create, complete, void; cash/card/bank transfer |
| 15 | Orders UI | 🟢 | Admin `/orders`, POS `/orders` |
| 16 | Role-based POS access | 🟢 | Waiter, Cashier defaults; manager-configurable |
| 17 | Customers | 🟡 | Basic CRUD; credit payments not built |
| 18 | POS touchscreen UI | 🟡 | Works; not fully per touch spec (large tiles, hold/recall) |
| 19 | Hold / recall orders | 🟡 | `Held` status exists; limited UI |
| 20 | Shifts & Z-reports | 🟢 | Open/close shift gate on POS |
| 21 | Cash management | 🟡 | Shifts exist; cash drops, safe deposits not built |
| 22 | Offline mode (POS) | 🟡 | Basic outbox; full offline kitchen/inventory not built |
| 23 | Customer display screen | 🔲 | Dual-screen POS spec added |
| 24 | Promotions & discounts engine | 🟡 | Phase 1 coupons + Office sidebar modules — [COUPON_SYSTEM.md](./COUPON_SYSTEM.md), [OFFICE_MODULES.md](./OFFICE_MODULES.md); POS apply 🔲 |
| 24a | **Industry modes (Restaurant / Retail)** | 🟢 | `BusinessType`, `TenantFeatures`, conditional Office + POS UX — [INDUSTRY_MODES.md](./INDUSTRY_MODES.md) |

---

## Phase 3 — Restaurant & Kitchen

| # | Item | Status | Notes |
|---|------|--------|-------|
| 25 | Kitchen Display (basic) | 🔲 | Permissions seeded; no KDS app |
| 26 | Kitchen Display (advanced) | 🔲 | Stations, routing, timers, analytics |
| 27 | Restaurant table management | 🟡 | API + Android v0.6.0; admin Tables & Areas page 🟢 |
| 28 | QR ordering | 🔲 | Table QR → menu → kitchen/POS |
| 29 | Reservation system | 🔲 | Calendar, wait list |
| 30 | Recipe enhancements | 🟡 | BOM + auto-deduct; versioning, yield % not built |

---

## Phase 4 — Commerce & CRM

| # | Item | Status | Notes |
|---|------|--------|-------|
| 31 | Delivery management | 🔲 | Permissions seeded; no delivery UI |
| 32 | Online ordering | 🔲 | Pickup, delivery, dine-in, scheduled |
| 33 | CRM | 🔲 | Profiles, visit history, analytics |
| 34 | Loyalty module | 🔲 | Points, tiers, coupons, cashback — coupons Phase A in [COUPON_SYSTEM.md](./COUPON_SYSTEM.md) |
| 35 | Gift cards | 🔲 | Create, top-up, redeem, history |
| 36 | Marketing module | 🔲 | SMS, email, push campaigns |

---

## Phase 5 — Supply Chain & Inventory

| # | Item | Status | Notes |
|---|------|--------|-------|
| 37 | Inventory enhancements | 🟡 | Transfers exist; warehouses, batch/expiry, serial not built |
| 38 | Purchase management | 🔲 | PO, GRN, returns; permissions only |
| 39 | Supplier portal | 🔲 | Supplier catalog, payment terms, balance |

---

## Phase 6 — Finance & Compliance

| # | Item | Status | Notes |
|---|------|--------|-------|
| 40 | Accounting / GST (Maldives) | 🔲 | Spec in GST_MALDIVES.md + SAAS_REQUIREMENTS |
| 41 | Expenses | 🔲 | Permissions only |
| 42 | Reports (advanced) | 🟡 | Dashboard KPIs; full report suite incomplete |
| 43 | Dashboard analytics | 🟡 | Basic dashboard; live kitchen, profit, GST payable not built |
| 44 | Audit system (full) | 🟡 | Audit log entity + admin view; immutable full audit not complete |

---

## Phase 7 — Platform, Devices & Integrations

| # | Item | Status | Notes |
|---|------|--------|-------|
| 45 | Subscription enforcement | 🟢 | Expiry job, read-only middleware, period calculator |
| 46 | Basic plan tier | 🔲 | Spec added; seeder still Free + Pro only |
| 47 | Platform billing verification | 🟢 | Tenant renewal UI + full payments queue on Reports |
| 48 | Announcements | 🔲 | Entity exists |
| 49 | Notification center | 🔲 | Low stock, GST due, kitchen delays, etc. |
| 50 | Device management | 🟡 | Terminal entity; remote disable, heartbeat not built |
| 51 | Hardware ecosystem | 🔲 | Kiosk mode, remote provisioning, printer health |
| 52 | Public REST API (Pro) | 🔲 | Plan flag only; OAuth/webhooks not built |
| 53 | Third-party integrations | 🔲 | Payment gateways, SMS, WhatsApp, etc. |
| 54 | Platform analytics | 🔲 | Not started |
| 55 | Employee management (HR) | ✅ | Full HR module: employees, payroll/payslips, attendance, leave, scheduling, performance; plan-gated via `HasHr` |
| 56 | AI sales assistant | 🔲 | Forecasting, NL reporting, menu engineering |

---

## Phase 8 — Android Native App (`terminal_app/`)

Spec: [ANDROID_MASTER_PLAN.md](./ANDROID_MASTER_PLAN.md) · Setup: [TERMINAL_APP.md](./TERMINAL_APP.md)

| # | Item | Status | Notes |
|---|------|--------|-------|
| 57 | Project scaffold (Kotlin, Compose) | 🟢 | `terminal_app/`, v0.6.0 |
| 58 | Login + branch + POS + cash/card sale | 🟢 | Retrofit, DataStore, app shell |
| 58b | Dashboard + orders detail + connection test | 🟢 | v0.4.1 — online badge, week metrics |
| 58c | Fullscreen kiosk + industry modes | 🟢 | v0.5.0 — ImmersiveMode, TenantFeatures, retail/restaurant UX |
| 58d | Enhanced Home / Orders / Settings | 🟢 | v0.5.0 — filters, store type chips, Sales tab for retail |
| 59 | Hilt + Clean Architecture modules | 🔲 | Master plan stack |
| 60 | Room offline cache | 🔲 | Mission-critical per plan |
| 61 | Sync queue + WorkManager | 🔲 | `/api/sync` integration |
| 62 | Device profiles (phone/tablet/terminal) | 🔲 | Adaptive UI |
| 63 | Device registration API | 🔲 | Heartbeat, hardware info |
| 64 | 58 mm printer SDK | 🔲 | Handheld terminal hardware |
| 65 | Barcode scanner (camera) | 🔲 | Free plan |
| 66 | Kiosk / Device Owner mode | 🔲 | Pro plan |
| 67 | Dashboard + widgets (Glance) | 🔲 | Free plan |
| 58e | Table orders (assign, kitchen, bill, pay) | 🟢 | v0.6.0 — [TABLE_ORDERS.md](./TABLE_ORDERS.md) |
| 68 | Tables + Kitchen screens | 🟡 | Tables tab live; KDS 🔲 |

---

## Phase 9 — Production Infrastructure (DigitalOcean)

Spec: [deployment.md](./deployment.md)

| # | Item | Status | Notes |
|---|------|--------|-------|
| 69 | DigitalOcean Ubuntu server | 🔲 | Ubuntu LTS production VM |
| 70 | Domain + DO DNS | 🔲 | `bluraymaldives.site`; Namecheap → DO nameservers |
| 71 | Nginx reverse proxy | 🔲 | Office static + API proxy, gzip, caching |
| 72 | HTTPS / Let's Encrypt | 🔲 | Certbot, 301 HTTP→HTTPS, auto-renew |
| 73 | Security headers | 🔲 | HSTS, CSP, X-Frame-Options, etc. |
| 74 | systemd API service | 🔲 | `bluraypos-api.service`, auto-restart |
| 75 | Redis (cache + jobs) | 🔲 | Not in dev compose yet; production requirement |
| 76 | UFW firewall | 🔲 | Allow 22, 80, 443 only |
| 77 | PostgreSQL backups | 🔲 | Daily / weekly / monthly retention |
| 78 | Health endpoints | 🟡 | `/health` exists; `/ready`, `/live` planned |
| 79 | SSL + uptime monitoring | 🔲 | Cert expiry, DO uptime checks |
| 80 | GitHub Actions deploy | 🔲 | Manual git pull today |
| 81 | Docker production phase | 🔲 | Future; dev uses Docker Compose |
| 82 | Production checklist | 🔲 | Pre-deploy verification in deployment.md |
| 83 | Subdomains live | 🔲 | office, api, auth, cdn, status |

---

## Phase 10 — Marketing site (`bluraymaldives.site`)

Spec: [MARKETING_SITE.md](./MARKETING_SITE.md)

| # | Item | Status | Notes |
|---|------|--------|-------|
| 84 | Marketing SPA (`@pos/marketing-site`) | 🟢 | Vite :5175, shadcn, hero + sections |
| 85 | Live plan pricing from API | 🟢 | `PlansSection`, comparison table |
| 86 | Public marketing API | 🟢 | `GET /api/public/marketing` |
| 87 | Real customer stores on homepage | 🟢 | Excludes demo org |
| 88 | Onboarding + plans split sections | 🟢 | `#get-started`, `#plans` |
| 89 | Terminal copy (print, not payments) | 🟢 | No NFC/payment hardware claims |
| 90 | Production landing deploy | 🟡 | `deploy-production.sh`; manual push works |
| 91 | Marketing CI / auto-deploy | 🔲 | GitHub Actions secrets TBD |

---

## Recommended next sprint

**Backend:** subscription enforcement, POS hold/recall, catalog permission checks  
**Android:** Hilt + Room foundation, offline product/order cache, sync status bar  
**Infra:** DO droplet, DNS cutover, Nginx + Certbot, `bluraypos-api.service`

---

## Completed migrations (reference)

| Migration | Purpose |
|-----------|---------|
| `20260706175032_AddRbacAndSaasFoundation` | Permissions, RolePermissions, platform entities |
| `20260706192230_AddOrganizationRolePermissions` | Per-tenant role permission overrides |
