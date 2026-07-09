# BlurayPOS — Project Structure & Stack Reference

> **Canonical map** of the repository: folders, layers, apps, ports, and how pieces connect.  
> **Update this file** when adding projects, apps, or changing architecture.

**Last updated:** July 2026

---

## 1. Stack at a glance

| Layer | Technology | Location |
|-------|------------|----------|
| **API** | ASP.NET Core 9, EF Core, MediatR, JWT | `backend/` |
| **Database** | PostgreSQL 17 | Docker `bluraypos-postgres-1` |
| **Cache** | Redis 7 | Docker `bluraypos-redis` |
| **Web** | React 19, Vite, TypeScript, npm workspaces | `frontend/` |
| **Android** | Kotlin, Jetpack Compose, Retrofit | `terminal_app/` |
| **Docs** | Living memory & specs | `memory-plan/` |
| **Dev ops** | Docker Compose, shell scripts, manual deploy | `scripts/`, `docs/apk releases/` |

---

## 2. Repository tree

```
BlurayPOS/
├── backend/                         # .NET 9 solution
│   ├── src/
│   │   ├── Pos.Api/                 # HTTP layer — controllers, middleware, SignalR
│   │   ├── Pos.Application/         # CQRS handlers, DTOs, tenant feature resolver
│   │   ├── Pos.Domain/              # Entities, enums, permissions (no EF)
│   │   └── Pos.Infrastructure/    # EF Core, auth, services, migrations, seed
│   └── tests/
│       ├── Pos.UnitTests/
│       └── Pos.IntegrationTests/
│
├── frontend/                        # npm workspaces monorepo
│   ├── apps/
│   │   ├── pos-terminal/            # Cashier PWA          → :5173
│   │   ├── admin-portal/            # Store / SaaS admin   → :5174
│   │   └── marketing-site/          # Public homepage      → :5175
│   └── packages/
│       ├── api-client/              # Typed API + shared types
│       ├── offline-sync/            # Dexie PWA offline (POS)
│       └── ui/                      # Shared POS UI components
│
├── terminal_app/                    # Native Android POS
│   └── app/src/main/java/com/bluraypos/terminal/
│       ├── data/                    # API, session, tenant features
│       ├── ui/                      # Screens (Compose)
│       └── util/                    # Formatters, immersive mode
│
├── memory-plan/                     # Living documentation (read first)
├── scripts/                         # dev-all.sh, ensure-dev-api.sh, cleanup-stale-docker-api.sh
├── .cursor/rules/                   # Cursor agent rules (dev-environment.mdc)
├── docker-compose.yml               # postgres + redis + api (compose port 5142)
├── Dockerfile                       # API image build
├── AGENTS.md                        # Agent onboarding pointer
└── README.md                        # Quick start
```

---

## 3. Backend — Clean Architecture (.NET)

### Request flow

```
HTTP Request
    ↓
Pos.Api/Controllers              ← thin; delegates to MediatR
    ↓
Pos.Application/Features/*     ← one handler per command/query
    ↓
Services / IPosDbContext         ← Infrastructure implements interfaces
    ↓
PostgreSQL (EF Core) + Redis
```

### Projects

| Project | Path | Responsibility |
|---------|------|----------------|
| **Pos.Api** | `backend/src/Pos.Api/` | Controllers, `Program.cs`, middleware (idempotency), Swagger, SignalR hub |
| **Pos.Application** | `backend/src/Pos.Application/` | `Features/` (Auth, Sales, Catalog, Platform, Reports, Public, …), DTOs, `TenantFeatureResolver` |
| **Pos.Domain** | `backend/src/Pos.Domain/` | `Entities/`, `Enums/` (`BusinessType`, `OrderStatus`), `Permissions/` |
| **Pos.Infrastructure** | `backend/src/Pos.Infrastructure/` | `PosDbContext`, migrations, `DataSeeder`, `AuthService`, `TokenService`, tenant query filters |

### API controllers (areas)

| Controller | Base path | Purpose |
|------------|-----------|---------|
| AuthController | `/api/auth` | Login, register, refresh, **me** (tenant features) |
| SalesController | `/api/orders` | Create, update, complete, void; send-to-kitchen, request-bill |
| TablesController | `/api/tables` | Dining tables list, create (restaurant) |
| CatalogController | `/api/products`, `/api/categories` | Product & category CRUD |
| InventoryController | `/api/inventory` | Stock, adjustments, transfers |
| ReportsController | `/api/reports` | Dashboard, audit logs |
| StoresController | `/api/stores` | Branches, org settings |
| UsersController | `/api/users` | Staff management |
| PlatformController | `/api/platform` | Super Admin tenants, plans |
| SubscriptionController | `/api/subscription` | Billing, plan changes |
| SyncController | `/api/sync` | Offline push/pull |
| SuppliesController | `/api/supplies` | Ingredients |
| ShiftsController | `/api/shifts` | Register shifts, Z-reports |
| PublicController | `/api/public` | Anonymous marketing data |
| … | | Customers, Roles, Storage |

### Industry modes (Restaurant / Retail / Hybrid)

- **Stored on:** `Organization.BusinessType` (`Restaurant`, `Retail`, `Hybrid`)
- **Resolved by:** `TenantFeatureResolver` → `TenantFeaturesDto` on `/api/auth/me`
- **Spec:** [INDUSTRY_MODES.md](./INDUSTRY_MODES.md)
- **Web:** `frontend/packages/api-client/src/tenant-features.ts`
- **Android:** `terminal_app/.../data/tenant/TenantFeatures.kt`

---

## 4. Frontend — npm workspaces

### Apps

| App | Package | Port | UI stack | Users |
|-----|---------|------|----------|-------|
| POS Terminal | `@pos/pos-terminal` | 5173 | `@pos/ui`, PWA | Cashier, Waiter |
| Admin Portal | `@pos/admin-portal` | 5174 | shadcn/ui + Tailwind | Manager, Super Admin |
| Coupons site | `@pos/coupons-site` | 5176 | shadcn-style | Public QR entry |
| Online menu | `@pos/online-menu` | 5178 | shadcn-style | Public menu `{slug}` |
| Online order | `@pos/online-order` | 5177 | shadcn-style | Public checkout `{slug}` |
| Marketing Site | `@pos/marketing-site` | 5175 | shadcn-style, live API | Public |

### Shared packages

| Package | Purpose |
|---------|---------|
| `@pos/api-client` | Fetch wrapper, JWT, all API types, `resolveTenantFeatures()`, `subscriptionPlanFlag()` |
| `@pos/offline-sync` | Dexie IndexedDB, outbox queue, online status hooks |
| `@pos/ui` | Button, Input, Card, Modal — touch POS components |

### Dev proxy

All apps proxy `/api` (and `/hubs` where needed) via `DEV_API_PORT` (default **5147**, from `.dev-api-port`).

---

## 5. Android app (`terminal_app/`)

| Item | Value |
|------|-------|
| Package | `com.bluraypos.terminal` |
| Current version | **0.6.0** |
| minSdk | 27 (Android 8.1) |
| UI | Jetpack Compose, shadcn-inspired theme |
| Network | Retrofit + Gson |
| Session | DataStore |
| Test device | Redmi Note 8 |

### Screen map

| Tab / screen | File | Notes |
|--------------|------|-------|
| Splash | `ui/splash/SplashScreen.kt` | Session check, tenant sync |
| Login | `ui/login/LoginScreen.kt` | Branch selection, demo prefill |
| Home | `ui/dashboard/DashboardScreen.kt` | Hero metrics, top sellers, quick actions |
| POS | `ui/pos/PosScreen.kt` | Retail vs restaurant; table picker, kitchen/bill/pay flow |
| Orders / Sales | `ui/orders/OrdersScreen.kt` | Filters, search, detail sheet; table name on rows |
| Tables | `ui/tables/TablesScreen.kt` | Live floor grid (restaurant); tap → POS |
| Settings | `ui/settings/SettingsScreen.kt` | Store type, device info, connection test |
| Shell | `ui/shell/MainShell.kt` | Bottom nav: POS-first; 3 or 4 tabs by tenant |

### Fullscreen kiosk

`util/ImmersiveMode.kt` — hides status bar and navigation buttons while app is open.

**Spec:** [TERMINAL_APP.md](./TERMINAL_APP.md) · [ANDROID_MASTER_PLAN.md](./ANDROID_MASTER_PLAN.md)

---

## 6. Local development URLs

| Service | URL | Notes |
|---------|-----|-------|
| **API (preferred)** | http://localhost:5147 | Docker `bluraypos-api-industry` |
| **API (fallback)** | http://localhost:5148 | When 5147 blocked — see `.dev-api-port` |
| Swagger | http://localhost:5147/swagger | |
| POS | http://localhost:5173 | |
| Admin | http://localhost:5174 | |
| Coupons | http://localhost:5176 | Public scan |
| Online menu | http://localhost:5178 | `/demo` for demo org |
| Online order | http://localhost:5177 | `/demo` for demo org |
| HR (in Office) | http://localhost:5174/hr | Pro + `HasHr` |
| Marketing | http://localhost:5175 | |
| PostgreSQL | localhost:5432 | `pos_dev` |
| Redis | localhost:6379 | |

**LAN (phone/Android):** `http://<your-ip>:<port>` — port from `.dev-api-port` (5147 or 5148).

**Start everything:** `./scripts/dev-all.sh`  
**Details:** [DEV_ENVIRONMENT.md](./DEV_ENVIRONMENT.md)

---

## 7. Scripts reference

| Script | Purpose |
|--------|---------|
| `scripts/dev-all.sh` | API + all frontends |
| `scripts/ensure-dev-api.sh` | Postgres, Redis, API on 5147 (fallback 5148); writes `.dev-api-port` |
| `scripts/cleanup-stale-docker-api.sh` | Remove root-owned stale API containers (sudo) |
| `scripts/install-android.sh` | Build APK, install, launch on USB device |
| `scripts/reset-dev-demo.sh` | Reset demo tenant |
| `scripts/seed-dev-demo-now.py` | Seed demo products/orders |
| `scripts/deploy-production.sh` | Production deploy on droplet |
| `scripts/push-to-droplet.sh` | Sync + deploy from dev machine |

---

## 8. Documentation index (`memory-plan/`)

| Read first | File |
|------------|------|
| ⭐ Onboarding | [DEVELOPMENT_HANDOFF.md](./DEVELOPMENT_HANDOFF.md) |
| ⭐ Local dev | [DEV_ENVIRONMENT.md](./DEV_ENVIRONMENT.md) |
| ⭐ This file | [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) |
| Product spec | [SAAS_REQUIREMENTS.md](./SAAS_REQUIREMENTS.md) |
| Roadmap | [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) |
| Naming | [TERMINOLOGY.md](./TERMINOLOGY.md) |
| Restaurant vs Retail | [INDUSTRY_MODES.md](./INDUSTRY_MODES.md) |
| Table orders | [TABLE_ORDERS.md](./TABLE_ORDERS.md) |
| Architecture detail | [architecture.md](./architecture.md) |
| Marketing site | [MARKETING_SITE.md](./MARKETING_SITE.md) |
| Android | [TERMINAL_APP.md](./TERMINAL_APP.md) |
| Production | [PRODUCTION_INFRASTRUCTURE.md](./PRODUCTION_INFRASTRUCTURE.md) |

---

## 9. Multi-tenancy model

```
Platform (Super Admin)
    └── Organization (= "Store" in product language)
            ├── BusinessType: Restaurant | Retail | Hybrid
            ├── Subscription → Plan (Free | Pro)
            ├── Stores (= "Branches")
            │       └── Terminals (= "Registers")
            └── Users (roles: OrgAdmin, StoreManager, Cashier, Waiter)
```

Full naming map: [TERMINOLOGY.md](./TERMINOLOGY.md)

---

## 10. Client connection diagram

```
┌─────────────┐  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐
│ POS :5173   │  │ Admin :5174 │  │ Marketing    │  │ Android     │
│             │  │             │  │ :5175        │  │ terminal_app│
└──────┬──────┘  └──────┬──────┘  └──────┬───────┘  └──────┬──────┘
       │                 │                 │                  │
       └──────── @pos/api-client ─────────┘                  │
                     │ REST + JWT                             │
                     ▼                                        │
            ┌────────────────────┐◄───────────────────────────┘
            │  Pos.Api :5147     │
            │  MediatR + EF      │
            └─────────┬──────────┘
                      │
              ┌───────┴───────┐
              ▼               ▼
         PostgreSQL         Redis
```

---

*When you add a new app, service, or major folder — update this file and [DEV_ENVIRONMENT.md](./DEV_ENVIRONMENT.md).*
