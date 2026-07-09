# BlurayPOS — Development Handoff & Project Memory

> **Purpose:** Complete context for moving dev environment to another laptop or onboarding a new Cursor session.  
> **Location:** `memory-plan/` — living memory & plans (update when features or architecture change).  
> **Repository:** [github.com/adhuhaam/BlurayPOS](https://github.com/adhuhaam/BlurayPOS)  
> **Last updated:** July 2026 — Android preview APK build (production API), API port fallback (5147/5148)

---

## 1. What is BlurayPOS?

**BlurayPOS** is a **cloud SaaS multi-tenant Point of Sale** system targeting retail and restaurants in the **Maldives** (MVR currency, future MIRA GST compliance).

| Layer | Stack |
|-------|--------|
| Backend | ASP.NET Core 9, EF Core, PostgreSQL, MediatR (CQRS), JWT + Identity |
| Frontend | React 19, Vite, npm workspaces |
| Admin UI | shadcn/ui + Tailwind |
| POS UI | Custom `@pos/ui` (touch-oriented, PWA) |
| Realtime | SignalR (`/hubs/pos`) |
| Offline | Dexie IndexedDB via `@pos/offline-sync` |

**Product vision:** Thousands of independent stores (tenants) on one platform. Super Admin runs the platform; each store has isolated data, subscription plan, staff, catalog, orders, and inventory.

**Inspiration:** Supplies/recipes patterns modeled after [MioPoS](https://github.com/adhuhaam/MioPoS).

---

## 2. Critical terminology (read first)

Product language ≠ code names. Full reference: [TERMINOLOGY.md](./TERMINOLOGY.md).

| Product term | Code entity | Notes |
|--------------|-------------|-------|
| **Store** (tenant) | `Organization` | The business/customer of the SaaS |
| **Branch** | `Store` | Physical location within a tenant |
| **Register** | `Terminal` | POS device at a branch |
| **Manager** | `OrgAdmin` | Tenant-wide admin |
| **Branch Manager** | `StoreManager` | Branch-scoped manager |
| **Super Admin** | `SuperAdmin` | `OrganizationId = null` |

**Never confuse:** UI “Store Admin” = tenant operations. “Platform” = Super Admin only.

---

## 3. Laptop migration checklist

### Prerequisites on new machine

- PostgreSQL 14+
- .NET 9 SDK
- Node.js 20+ (CI uses 22)
- Git
- Cursor IDE

### Clone & setup

```bash
git clone https://github.com/adhuhaam/BlurayPOS.git
cd BlurayPOS

# Full dev stack (Docker Postgres/Redis/API + all frontends)
./scripts/dev-all.sh
# → API: http://localhost:5147 (or check `.dev-api-port` if fallback to 5148)
# → POS: http://localhost:5173
# → Admin: http://localhost:5174
# → Marketing: http://localhost:5175
```

**API only (Docker):** `./scripts/ensure-dev-api.sh`  
**Android:** `./scripts/install-android.sh` (USB device, same Wi‑Fi as dev machine)

### Alternative: dotnet run (no Docker API)

```powershell
cd backend/src/Pos.Api
dotnet restore
dotnet ef database update --project ../Pos.Infrastructure
dotnet run
# → http://localhost:5142 (Kestrel default)
```

### Environment files (optional)

```env
# frontend/apps/{pos-terminal,admin-portal,marketing-site}/.env.local
VITE_API_URL=http://localhost:5147
```

Default DB connection: `backend/src/Pos.Api/appsettings.Development.json`  
`Host=localhost;Port=5432;Database=pos_dev;Username=postgres;Password=postgres`

### Cursor context files to read (in order)

1. **This file** — `memory-plan/DEVELOPMENT_HANDOFF.md`
2. [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) — repo map & stack
3. [DEV_ENVIRONMENT.md](./DEV_ENVIRONMENT.md) — local ports, Docker, scripts
4. [SAAS_REQUIREMENTS.md](./SAAS_REQUIREMENTS.md) — canonical product spec
5. [TERMINOLOGY.md](./TERMINOLOGY.md)
6. [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) — status tracker
7. [README.md](../README.md) — quick start
8. [architecture.md](./architecture.md) — technical architecture
9. [README.md](./README.md) — **memory-plan folder index**
10. [INDUSTRY_MODES.md](./INDUSTRY_MODES.md) — Restaurant vs Retail
11. [PRODUCTION_INFRASTRUCTURE.md](./PRODUCTION_INFRASTRUCTURE.md) — DigitalOcean production hosting
12. [GST_MALDIVES.md](./GST_MALDIVES.md) — future accounting module
13. [ANDROID_MASTER_PLAN.md](./ANDROID_MASTER_PLAN.md) + [TERMINAL_APP.md](./TERMINAL_APP.md) — native Android POS

### Ops notes

- API process often dies with exit code `4294967295` when restarted — kill old `Pos.Api` process before `dotnet run`.
- After RBAC/permission changes, **users must re-login** for JWT to pick up new permissions.
- `PermissionService.SyncAsync()` runs on every seed startup to add new permissions/role mappings without wiping existing DB.

---

## 4. Demo credentials & URLs

| Role | Email | Password | Where to use |
|------|-------|----------|--------------|
| Super Admin | `admin@demo.com` | `Admin123!` | Admin portal → platform routes |
| Manager | `manager@demo.com` | `Manager123!` | Admin portal → full tenant ops |
| Cashier | `cashier@demo.com` | `Cashier123!` | POS terminal (select branch) |
| Waiter | `waiter@demo.com` | `Waiter123!` | POS terminal (select branch) |

Demo tenant: slug `demo`, currency MVR, **BusinessType: Hybrid**, on **Pro** plan.

| Service | URL |
|---------|-----|
| API | http://localhost:5147 (canonical dev — see [DEV_ENVIRONMENT.md](./DEV_ENVIRONMENT.md)) |
| Swagger | http://localhost:5147/swagger |
| **Marketing site** | **http://localhost:5175** |
| POS Terminal | http://localhost:5173 |
| Admin Portal | http://localhost:5174 |

**Start dev stack:** `./scripts/dev-all.sh` · **API only:** `./scripts/ensure-dev-api.sh`

---

## 5. Session history — what was built (conversation memory)

This section captures work done across Cursor sessions so nothing is lost.

### 5.0g Admin Tables & Areas (July 2026)

| Item | Detail |
|------|--------|
| API | `GET/POST /api/dining-areas?storeId=`; table create allows OrgAdmin + StoreManager (`Settings.Manage` or `OnlineMenu.Manage`) |
| Office UI | `/tables` — `DiningTablesPage.tsx`; sidebar under **Operations** when `posTables` |
| Spec | [TABLE_ORDERS.md](./TABLE_ORDERS.md) |

### 5.0f Android preview APK — production API (July 2026)

| Item | Detail |
|------|--------|
| Build type | `preview` in `terminal_app/app/build.gradle.kts` — production URL, debug signing for sideload |
| Script | `./scripts/build-android-preview.sh` → `terminal_app/dist/BlurayPOS-v*-preview.apk` |
| API | `https://api.bluraymaldives.site` (verified `/health`) |
| Low RAM | `gradle.properties`: 1 GB heap, 1 worker, no daemon; script uses 768 MB + skips lint |

### 5.0d HR module demo data (July 2026)

**Demo org** (`demo`, Pro plan, `HasHr`): `EnsureDemoHrAsync` seeds 6 employees (3 POS-linked + 3 HR-only kitchen/delivery/part-time), leave types/balances/requests, 5 days attendance, weekly schedules, performance reviews, finalized last-month payroll + draft current month.

**Dev API:** If HR routes return **404**, stale root-owned Docker containers block 5147/5148 — run `./scripts/cleanup-stale-docker-api.sh` (sudo) or use fallback port in `.dev-api-port` (e.g. **5149** `bluraypos-api-hr`). Restart frontends after port change: `DEV_API_PORT=$(cat .dev-api-port) ./scripts/dev-all.sh`. **Re-login** as `manager@demo.com` to refresh JWT with `Hr.*` permissions.

### 5.0c Office plan modules sidebar (July 2026)

**Spec:** [OFFICE_MODULES.md](./OFFICE_MODULES.md)

| Item | Detail |
|------|--------|
| Sidebar **Modules** | Plan-gated in-portal routes (Coupons, Online Menu, Online Ordering, HR) |
| Registry | `frontend/apps/admin-portal/src/lib/plan-modules.ts` — `portalPath` per module |
| Public preview URLs | `config.ts` — `VITE_COUPONS_URL`, `VITE_MENU_URL`, `VITE_ORDER_URL` |
| HR sub-nav | `/hr/*` routes + sidebar **Human Resources** section |
| Dev ports | Coupons **5176**, Menu **5178**, Order **5177** (public sites only) |

### 5.0b Coupons module Phase 1 (July 2026)

**Pro-plan module** (`Plan.HasCoupons`, `TenantFeaturesDto.OfficeCoupons`): each store creates campaigns, generates QR batches, prints sticker sheets from Office (`/coupons`), customers scan → **`http://localhost:5176/s/{code}`** (prod: `coupons.bluraymaldives.site`). LuckyQR patterns: dual codes, scan analytics, entry form, rate limit. Migration: `AddCouponsModule`. **Not yet:** POS discount apply (Phase 2). Restart API after pull: `./scripts/ensure-dev-api.sh --rebuild` (or `./scripts/cleanup-stale-docker-api.sh` if port 5147 blocked). **Office sidebar:** [OFFICE_MODULES.md](./OFFICE_MODULES.md).

### 5.0a Coupon system plan (July 2026)

Studied [LuckyQR](https://github.com/adhuhaam/LuckyQR) (Bluray Maldives QR lucky-draw app) for campaign patterns: dual codes (ULID + human `lucky_id`), scan vs entry analytics, batch generation, anti-abuse. Documented full BlurayPOS coupon/promotion spec in [COUPON_SYSTEM.md](./COUPON_SYSTEM.md) — domain model, POS redemption, admin flows, public claim (Phase B), three-phase rollout. No implementation yet.

### 5.0 Dev environment & public marketing (July 2026)

**Dev environment canonical doc:** [DEV_ENVIRONMENT.md](./DEV_ENVIRONMENT.md) · **Repo map:** [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)

| Item | Detail |
|------|--------|
| Canonical API | `bluraypos-api-industry` on **port 5147** (`bluraypos-api:latest`) |
| Scripts | `scripts/ensure-dev-api.sh`, `scripts/cleanup-stale-docker-api.sh`, `scripts/dev-all.sh`, `scripts/install-android.sh`, `scripts/build-android-preview.sh` |
| Cursor rule | `.cursor/rules/dev-environment.mdc` — keep stack running |
| Stale APIs | `bluraypos-api-1` (5142) … `bluraypos-api-v4` (5146) — superseded; do not use |

**Public marketing API:** `GET /api/public/marketing` — lists all registered stores (including demo).  
**Fix:** Removed `ExcludedOrganizationSlugs = ["demo"]` from `PublicMarketingService.cs`.  
**Homepage:** `CustomersSection` loads live data via Vite proxy → API 5147.

**Android debug API:** `http://192.168.18.58:5147` in `terminal_app/app/build.gradle.kts`.  
**Install:** `./scripts/install-android.sh` — build, install to USB device, launch app (v0.5.0 on Redmi Note 8).

### 5.0a Industry modes — Restaurant / Retail / Hybrid (July 2026)

**Spec:** [INDUSTRY_MODES.md](./INDUSTRY_MODES.md)

| Layer | Change |
|-------|--------|
| Backend | `Organization.BusinessType` enum; migration `20260709032000_AddOrganizationBusinessType` |
| Backend | `TenantFeatureResolver` — feature flags per business type |
| API | `/api/auth/me` returns `businessType` + resolved tenant features |
| Web POS | `tenant-features.ts` — retail hides categories; restaurant shows tables/kitchen affordances |
| Web Admin | Store settings — business type selector |
| Android | `TenantFeatures.kt`, `TenantSync.kt` — sync from `/api/auth/me`; POS/Orders/Settings adapt |

Demo org `demo` is **Hybrid** (both restaurant and retail features enabled).

### 5.0b Android terminal v0.5.0 (July 2026)

**Living manual:** [TERMINAL_APP.md](./TERMINAL_APP.md)

| Feature | Files / notes |
|---------|---------------|
| Fullscreen kiosk | `util/ImmersiveMode.kt`, `MainActivity.kt` — hide status + nav bars |
| Enhanced Home | `ui/dashboard/DashboardScreen.kt` — hero card, top sellers, recent orders, week metrics |
| Enhanced Orders | `ui/orders/OrdersScreen.kt` — summary card, search, All/Completed/Open filters, detail sheet |
| Enhanced Settings | `ui/settings/SettingsScreen.kt` — store type, feature chips, device info, connection test |
| Retail vs Restaurant POS | `ui/pos/PosScreen.kt` — retail: barcode search, no categories; restaurant: category chips |
| Tab labels | `ui/shell/MainShell.kt` — Orders tab → **Sales** for retail tenants |
| Session persistence | `data/prefs/SessionStore.kt` — caches tenant feature flags |

**Prior releases:** v0.5.1 (POS-first tabs, Tables screen shell), v0.4.1 (POS redesign, connection test), v0.4.2 (richer dashboard).

### 5.0c Android table orders v0.6.0 (July 2026)

**Spec:** [TABLE_ORDERS.md](./TABLE_ORDERS.md)

| Feature | Files / notes |
|---------|---------------|
| Tables API client | `BlurayApi.kt`, `ApiModels.kt` — `getTables`, `updateOrder`, `sendToKitchen`, `requestBill` |
| Shared table context | `data/table/TableSession.kt` — POS ↔ Tables tab |
| Live Tables tab | `TablesViewModel.kt`, `TablesScreen.kt` — floor grid from API |
| Restaurant POS flow | `PosScreen.kt`, `PosViewModel.kt` — table picker, Save & send to kitchen, Request bill, Take payment |
| Backend | `TablesController`, `TableHandlers`, `SendOrderToKitchenCommand`, `RequestOrderBillCommand`, migration `AddDiningTables` |

Demo: `cashier@demo.com` on hybrid org — Tables tab + T1–T12 on Main Floor.

### 5.0d Dev API stale-container fallback (July 2026)

**Problem:** Snap Docker containers started as root could not be stopped by the `docker` group (`permission denied`). Stale `bluraypos-api-industry` on port **5147** served an old image (`GET /api/tables` → 404).

**Fix:**
- [`scripts/ensure-dev-api.sh`](../scripts/ensure-dev-api.sh) — probes `/api/tables` (401 = OK), compares image IDs, auto-falls back to port **5148**, writes [`.dev-api-port`](../.dev-api-port)
- [`scripts/cleanup-stale-docker-api.sh`](../scripts/cleanup-stale-docker-api.sh) — removes all stale API containers (needs sudo in a real terminal)
- [`scripts/dev-all.sh`](../scripts/dev-all.sh) — reads `.dev-api-port`, exports `DEV_API_PORT` for Vite proxies
- [`scripts/install-android.sh`](../scripts/install-android.sh) — passes `DEV_API_PORT` + LAN IP to Gradle
- All `vite.config.ts` — proxy target uses `process.env.DEV_API_PORT || '5147'`
- `terminal_app/app/build.gradle.kts` — debug `API_URL` reads `.dev-api-port` or Gradle `-P` props

**Rule:** Never use `sudo docker` for dev — use plain `docker` so containers remain manageable.

**Docs:** [DEV_ENVIRONMENT.md](./DEV_ENVIRONMENT.md) § troubleshooting

### 5.0e Subscription lifecycle & renewal (July 2026)

| Feature | Files / notes |
|---------|---------------|
| Period calculator | `Pos.Application/Common/SubscriptionPeriodCalculator.cs` — yearly periods, renewal stacking |
| Expiry job | `SubscriptionExpiryHostedService` + `SubscriptionLifecycleService` — hourly; free auto-renew, paid → PastDue + read-only |
| Read-only enforcement | `SubscriptionEnforcementMiddleware` — blocks mutations; allows `/api/subscription`, proof upload |
| Renewal API | `GET/POST /api/subscription/payments`, `GET /api/subscription/billing-info` |
| Admin Billing UI | `BillingPage.tsx` — status banner, bank details, proof upload, payment history |
| Platform verify | `PlatformReportsPage.tsx` — full payments queue with filters |
| Tenants | `TenantsPage.tsx` — period end + days remaining |

### 5.1 SaaS foundation & auth fixes

**Fix:**
- Switched to `AddIdentityCore` (not full `AddIdentity`)
- Explicit JWT `DefaultAuthenticateScheme` / `DefaultChallengeScheme`
- `RoleClaimType = ClaimTypes.Role`
- JSON 401 via `OnChallenge` (no redirect to `/Account/Login`)
- `UseHttpsRedirection()` disabled in Development

**Files:** `backend/src/Pos.Api/Program.cs`, `backend/src/Pos.Infrastructure/DependencyInjection.cs`

### 5.2 Plans simplified to Free + Pro only

Removed junk plans on startup. Canonical plans:

| Plan | Slug | Price | Limits |
|------|------|-------|--------|
| Free | `free` | MVR 0/yr | 1 branch, 3 users, 25 products, 200 orders/mo |
| Pro | `pro` | MVR 14,999/yr | 100,000 threshold = “unlimited” |

- Migrates old `basic` subscribers → Pro
- `DataSeeder.EnsureCanonicalPlansAsync` enforces on every startup

**Files:** `DataSeeder.cs`, `PlansPage.tsx`, docs

### 5.3 Super Admin platform features

| Feature | API | UI |
|---------|-----|-----|
| Platform users list/edit | `GET/PUT /api/platform/users` | `/platform-users` |
| Tenant detail edit | `GET/PUT /api/platform/organizations/{id}` | `TenantsPage` edit dialog |
| Suspend, subscription, receipt settings, manager password reset | Platform handlers | TenantsPage |
| Platform settings | Platform API | `/platform-settings` |
| Plans CRUD | Platform API | `/plans` |

**Split sidebars:** `platform-sidebar.tsx` (Super Admin) vs `tenant-sidebar.tsx` (store ops).

**Route guards:**
- `PlatformOnlyRoute` — Super Admin only
- `TenantOnlyRoute` — blocks Super Admin; restricts Cashier/Waiter to `/orders`
- `RequireRole` — e.g. Users/Billing/Settings = OrgAdmin only

### 5.4 Manager store user management

- `PUT /api/users/{id}` with `UpdateUserRequest`
- Edit name, role, branch, suspend, optional password reset
- Blocks: self-suspend, assigning SuperAdmin, demoting self from OrgAdmin
- User limit enforced on create per plan
- **UI:** `UsersPage.tsx`

### 5.5 Catalog UX overhaul (products, categories, inventory, supplies)

**User request:** Uneven flow — wanted product-first, then recipe; inline categories; smoother journey.

**Implemented:**

| Component | Purpose |
|-----------|---------|
| `catalog-workflow-banner.tsx` | Shows Supplies → Products → Recipes → Inventory flow on all catalog pages |
| `category-picker.tsx` | Inline “+ Add new category” on product form |
| `ProductsPage.tsx` wizard | Step 1: product details → Step 2: recipe (auto-advance for recipe items) |
| Inline ingredient create | In recipe step when no supplies exist |
| `CategoriesPage` | Tip: categories can be added from Products page |
| `InventoryPage` | Explains retail vs recipe stock; summary cards; all retail products in adjust dropdown |
| `SuppliesPage` | Empty states, receive-tab guidance |

**Product types:**
- `FinishedGood` — retail stock tracked in Inventory
- `RecipeBased` — ingredients deduct from Supplies on sale

### 5.6 RBAC & role access levels

**User request:** Managers adjust roles; Cashier = POS + orders edit, no void; Waiter = POS + orders only; standard POS rules.

**Implemented:**

| Piece | Details |
|-------|---------|
| New role | `Waiter` (enum value 7) |
| New permissions | `Sale.Edit`, `Order.View`, `Pos.Access` |
| Global defaults | `PermissionDefinitions.RoleMap` in `PermissionDefinitions.cs` |
| Per-store overrides | `OrganizationRolePermission` table + API |
| Manager UI | Users page → “Role access levels” card with toggles |
| API enforcement | `IPermissionChecker` in sales handlers (create/edit/void/view) |
| JWT | Permission claims on token; org-scoped resolution |
| Frontend | `permissions` in localStorage; `usePermission()` / `hasPermission()` |
| Orders pages | Admin `/orders` + POS `/orders` |
| POS gate | Login requires `Pos.Access`; void hidden without `Sale.Void` |

**Standard defaults:**

| Role | POS | Orders | Edit | Discount | Void |
|------|-----|--------|------|----------|------|
| Waiter | ✓ | ✓ | ✓ | ✗ | ✗ |
| Cashier | ✓ | ✓ | ✓ | ✓ | ✗ |
| StoreManager | ✓ | ✓ | ✓ | ✓ | ✓ |
| OrgAdmin | ✓ | ✓ | ✓ | ✓ | ✓ |

**Migrations:**
- `20260706175032_AddRbacAndSaasFoundation`
- `20260706192230_AddOrganizationRolePermissions`

### 5.7 Marketing site & public API (July 2026)

**User goal:** `bluraymaldives.site` as full SaaS marketing homepage with real system data.

**App:** `frontend/apps/marketing-site` — port **5175**, workspace `@pos/marketing-site`.

**Page flow:** Hero → Customers → Stats → Terminal → Features → Workflow → Onboarding → Plans → ValueProps → CTA → Footer.

**Live data:**
- `GET /api/public/marketing` — plans, active stores (excludes `demo` org), stats
- `MarketingProvider` + `useMarketing()` in React
- Fallback to `GET /api/plans` if marketing endpoint missing
- `DataSeeder.BootstrapPlansAsync()` runs on **every** API startup (not only Development)

**Backend files:** `PublicController.cs`, `PublicMarketingService.cs`, `MarketingHandlers.cs`, DTOs in `Dtos.cs`.

**Production:** `npm run build -w @pos/marketing-site` → `/var/www/bluraypos/landing/`.

**Terminal marketing (canonical — do not regress):**
- Device is **handheld, lightweight, easy to use**
- **58mm bill & receipt printing** built in
- Does **NOT** process payments (no NFC / tap-to-pay on hardware)

**Removed:** `HardwareBar`, `SignupAndPlans`, static `customers.ts`.

**Full spec:** [MARKETING_SITE.md](./MARKETING_SITE.md)

### 5.8 Industry modes — Restaurant vs Retail (July 2026)

**User goal:** One POS for two markets — restaurants (tables, recipes) and retail (barcode, fast checkout).

**Canonical doc:** [INDUSTRY_MODES.md](./INDUSTRY_MODES.md)

**Phase 1 shipped:**

| Piece | Details |
|-------|---------|
| `Organization.BusinessType` | `Restaurant` \| `Retail` \| `Hybrid` (enum + migration) |
| `TenantFeatureResolver` | Combines industry + plan flags → `TenantFeaturesDto` |
| `/api/auth/me` | Returns `businessType` + `tenantFeatures` |
| Register | Industry picker on signup |
| Settings | Manager can change industry |
| Admin sidebar | Catalog steps filtered (retail: Products + Inventory only) |
| Web POS | Retail = barcode-first; Restaurant = Tables nav + product grid |
| `@pos/api-client` | `tenant-features.ts` + shared types |

**Catalog flow by industry:**

| Step | Restaurant | Retail |
|------|------------|--------|
| Ingredients | ✓ | hidden |
| Products | ✓ | ✓ |
| Recipes | ✓ | hidden |
| Inventory | ✓ | ✓ |

**Still roadmap:** floor plan tables, KDS, QR ordering, Android industry gating, plan enforcement middleware.

---

## 6. Current architecture (technical)

### 6.1 Backend projects

```
backend/src/
├── Pos.Api/           Controllers, Program.cs, SignalR, middleware
├── Pos.Application/   MediatR handlers, DTOs, validators
├── Pos.Domain/        Entities, enums, PermissionDefinitions
└── Pos.Infrastructure/ EF Core, AuthService, PermissionService, DataSeeder
```

### 6.2 Key services

| Service | File | Role |
|---------|------|------|
| `AuthService` | `Services/AuthService.cs` | Login, register, refresh, me, user CRUD |
| `TokenService` | `Services/TokenService.cs` | JWT + refresh tokens + permission claims |
| `PermissionService` | `Services/PermissionService.cs` | Seed, sync, org role overrides |
| `PermissionChecker` | `Services/PermissionChecker.cs` | Handler-level authz from JWT claims |
| `SaasServices` | `Services/SaasServices.cs` | Platform tenant/subscription logic |
| `DataSeeder` | `Persistence/DataSeeder.cs` | Migrations, demo data, plan cleanup |

### 6.3 Multi-tenancy

- `ITenantContext` reads `organizationId`, `storeId`, `userId` from JWT
- `PosDbContext` applies global query filters on `OrganizationId`
- Super Admin: `OrganizationId = null` on user record

### 6.4 Auth flow

```
POST /api/auth/login { email, password, storeId? }
  → roles from Identity
  → permissions from PermissionService (global + org overrides)
  → JWT with role + permission claims
  → LoginResponse { user, roles, permissions, stores }

Cashier/Waiter: storeId required at POS login
OrgAdmin: admin portal login (no storeId)
SuperAdmin: platform routes only
```

### 6.5 API controllers (complete list)

| Controller | Route | Auth |
|------------|-------|------|
| AuthController | `/api/auth` | Public login/register |
| CategoriesController | `/api/categories` | Authorized |
| ProductsController | `/api/products` | Authorized |
| InventoryController | `/api/inventory` | Authorized |
| SuppliesController | `/api/supplies` | Authorized |
| RecipesController | `/api/products/{id}/recipe` | Authorized |
| SalesController | `/api/orders` | Authorized + permission checks in handlers |
| ShiftsController | `/api/shifts` | Authorized |
| SyncController | `/api/sync` | Authorized |
| StoresController | `/api/stores` | Authorized |
| UsersController | `/api/users` | OrgAdmin, SuperAdmin |
| RolesController | `/api/roles` | OrgAdmin |
| PlatformController | `/api/platform` | SuperAdmin |
| PlansController | `/api/plans` | Public list |
| SubscriptionController | `/api/subscription` | OrgAdmin |
| ReportsController | `/api/reports` | Authorized |
| CustomersController | `/api/customers` | Authorized |
| StorageController | `/api/storage` | Authorized (slip upload) |

### 6.6 Frontend apps

**Admin portal** (`frontend/apps/admin-portal`)

| Route | Page | Who |
|-------|------|-----|
| `/` | Dashboard or Platform dashboard | All / SuperAdmin |
| `/register` | Self-registration | Public |
| `/plans`, `/tenants`, `/platform-users`, `/platform-settings` | Platform | SuperAdmin |
| `/products`, `/categories`, `/inventory`, `/supplies` | Catalog | Manager+ |
| `/orders` | Orders | Anyone with `Order.View` |
| `/branches`, `/transfers`, `/audit-logs` | Ops | OrgAdmin, StoreManager |
| `/users` | Users & role permissions | OrgAdmin |
| `/billing`, `/settings` | SaaS | OrgAdmin |

**POS terminal** (`frontend/apps/pos-terminal`)

| Route | Page |
|-------|------|
| `/login` | Store selection + login |
| `/shift` | Open/close shift |
| `/` | Main POS (product grid, cart, checkout) |
| `/orders` | Open draft/held orders |

### 6.7 Shared packages

| Package | Purpose |
|---------|---------|
| `@pos/api-client` | Typed API, JWT storage, `pos_permissions` in localStorage |
| `@pos/offline-sync` | Dexie cache, outbox, sync push/pull |
| `@pos/ui` | POS terminal components |

---

## 7. Database entities (high level)

### Core tenant

- `Organization`, `Subscription`, `Plan`, `Store`, `Terminal`
- `ApplicationUser`, `UserStoreAssignment`, `RefreshToken`

### Catalog & inventory

- `Category`, `Product`, `ProductVariant`, `StoreProductPrice`
- `InventoryItem`, `InventoryAdjustment`, `StockTransfer`
- `SupplyItem`, `StoreSupplyStock`, `SupplyLog`, `ProductRecipe`

### Sales

- `Order`, `OrderLine`, `Payment`, `Shift`, `Customer`

### RBAC & platform

- `Permission`, `RolePermission` (global defaults)
- `OrganizationRolePermission` (per-tenant overrides)
- `PlatformSettings`, `SubscriptionPayment`, `PlatformAnnouncement`

### Ops

- `AuditLog`, `IdempotencyRecord`, `SyncCheckpoint`, `SyncEvent`

---

## 8. What is DONE vs IN PROGRESS vs PLANNED

### ✅ Done (working in dev)

- Multi-tenant org/store/terminal model
- JWT auth + refresh tokens
- Self-registration (`/register`)
- Free + Pro plans with seeder enforcement
- Super Admin: tenants, plans, platform users, settings
- Manager: users CRUD, role permission editor
- Products, categories, inventory, supplies, recipes
- Guided catalog workflow + inline category creation
- Orders: create, complete, void (with permission checks)
- Orders UI (admin + POS)
- RBAC: Waiter role, permission claims, org overrides
- Shifts, Z-reports, dashboard reports
- Bank transfer + slip upload + receipt QR
- Offline POS (basic outbox)
- SignalR hub (inventory updates wired in POS)
- CI: backend build/test + frontend build
- Docker compose

### 🟡 In progress / partial

| Item | Gap |
|------|-----|
| Subscription enforcement | Expiry → read-only middleware shipped; plan limit enforcement partial |
| Permission coverage | Orders enforced; catalog/inventory still mostly `[Authorize]` only |
| POS touchscreen UX | Functional but not fully optimized per SAAS_REQUIREMENTS touch spec |
| Hold/recall orders | `OrderStatus.Held` exists; limited POS UI for hold/recall |
| Reports | Basic dashboard; advanced reports incomplete |
| Platform billing | Submit payment proof works; full verification workflow partial |
| Discount gating in POS UI | Backend checks; POS may not hide discount UI for Waiter |
| User store assignments | API supports `StoreIds` on create; not exposed in UsersPage UI |
| OrgAdmin RoleMap | Missing explicit `Sale.Edit`, `Order.View`, `Pos.Access` in RoleMap (bypassed via OrgAdmin check in PermissionChecker) |

### 🔲 Planned (discussed, not built)

From roadmap and requirements — **priority order for next work:**

1. **Plan limit enforcement** — enforce MaxProducts / MaxMonthlyOrders on every API (read-only on expiry is shipped — see §5.0e)
2. **Kitchen Display module** — `Kitchen.View`, `Kitchen.Update` permissions exist; no KDS UI
3. **Delivery module** — permissions exist; no delivery UI
4. **Customer credit payments** — `Customer.Credit` permission; credit payment flow not built
5. **Maldives GST accounting** — spec in `GST_MALDIVES.md`; no implementation
6. **Touch-optimized POS UI** — large tiles, category panel, hold/recall buttons per spec
7. **Platform announcements** — entity exists; no UI
8. **Platform analytics** — not started
9. **Purchase management** — permission exists; no module
10. **Expense module** — permissions exist; limited UI
11. **API access / webhooks** — Pro plan flag only
12. **Per-user permission overrides** — only per-role per-org today
13. **Draft order resume in POS** — “Edit in POS” link exists but full recall-to-cart not implemented
14. **ASP.NET permission policies** — could replace ad-hoc handler checks with `IAuthorizationHandler`

---

## 9. Known issues & gotchas

| Issue | Workaround |
|-------|------------|
| API won't rebuild while running | `Stop-Process` on Pos.Api PID, then `dotnet run` |
| Permission changes not immediate | User must logout/login |
| `SeedAsync` skips if permissions exist | Use `SyncAsync` for new permission codes (already called in DataSeeder) |
| Cashier blocked from admin catalog | By design — only `/orders` unless also StoreManager/OrgAdmin |
| Completed orders cannot be voided | By design in `VoidOrderCommandHandler` |
| Legacy `orgadmin@demo.com` | Migrated to `manager@demo.com` on seed |
| Currency | Demo org uses MVR; product docs assume Maldives market |

---

## 10. Key files quick reference

### Backend — start here for changes

| Task | Files |
|------|-------|
| New permission | `PermissionDefinitions.cs` → `PermissionService.SyncAsync` |
| Role defaults | `PermissionDefinitions.RoleMap` |
| Order business rules | `Features/Sales/SalesHandlers.cs` |
| User management | `Services/AuthService.cs` (UserService), `Features/Users/` |
| Platform/tenants | `Services/SaasServices.cs`, `Features/Platform/` |
| Plans/seed | `Persistence/DataSeeder.cs` |
| Auth/JWT | `Program.cs`, `TokenService.cs`, `DependencyInjection.cs` |
| New migration | `dotnet ef migrations add Name --project Pos.Infrastructure` |

### Frontend — start here

| Task | Files |
|------|-------|
| Admin routing | `apps/admin-portal/src/App.tsx` |
| Auth/permissions | `apps/admin-portal/src/auth.tsx` |
| Sidebar nav | `tenant-sidebar.tsx`, `platform-sidebar.tsx` — plan modules: [OFFICE_MODULES.md](./OFFICE_MODULES.md) |
| Plan module registry | `lib/plan-modules.ts`, `config.ts` (module subdomain URLs) |
| Catalog UX | `ProductsPage.tsx`, `category-picker.tsx`, `catalog-workflow-banner.tsx` |
| Users & RBAC UI | `UsersPage.tsx` |
| Orders admin | `OrdersPage.tsx` |
| POS | `pos-terminal/src/pages/PosPage.tsx`, `OrdersPage.tsx`, `auth.tsx` |
| **Marketing site** | `apps/marketing-site/src/App.tsx`, `context/MarketingContext.tsx` — spec: [MARKETING_SITE.md](./MARKETING_SITE.md) |
| Public marketing API | `PublicController.cs`, `PublicMarketingService.cs` |
| API client | `packages/api-client/src/index.ts`, `client.ts`, `types.ts` |

---

## 11. Ideas & design decisions (preserve these)

### Product decisions

- **Only two plans** (Free, Pro) — user explicitly wanted to remove clutter/Basic tier
- **Yearly billing only** for subscriptions (MVR market)
- **Organization = Store** in product language — never rename entity, document mapping
- **Recipe vs retail** — two inventory modes; don't merge into one stock table
- **Managers customize role permissions** — not hardcoded forever; org overrides stored in DB
- **Waiter is distinct from Cashier** — fewer permissions (no discount, no void)
- **Cashier/Waiter use POS first** — admin portal is orders-only for front staff

### Technical decisions

- **Clean architecture** — handlers in Application, no EF in Domain
- **MediatR CQRS** — one handler per command/query
- **JWT not cookies** for API auth
- **Permissions in JWT** — fine for now; re-login on change is acceptable
- **OrgAdmin bypasses permission checks** in `PermissionChecker` — managers always full access within tenant
- **Idempotency** middleware for order creation
- **Global query filters** for tenant isolation
- **shadcn for admin, custom ui for POS** — different UX needs

### UX decisions

- **Wizard over separate modals** for product+recipe creation
- **Inline category creation** — don't force visit to Categories page
- **Workflow banner** on catalog pages — teaches correct setup order
- **Empty states with CTAs** — guides new store setup
- **Marketing terminal copy** — hardware = order + print only; payments stay in POS software

### Marketing decisions

- **“Free POS. For life.”** — core headline; Free plan is the permanent entry tier
- **Pro includes handheld terminal hardware** — marketed on Pro plan only
- **Customer section shows real stores** from DB, not static placeholders
- **Plan prices/limits always from API** — never hardcode MVR amounts in UI

---

## 12. How to continue with Cursor on new laptop

1. Clone repo, run setup (section 3)
2. Open workspace in Cursor
3. Tell Cursor: *“Read `memory-plan/DEVELOPMENT_HANDOFF.md`, `memory-plan/MARKETING_SITE.md`, and `memory-plan/SAAS_REQUIREMENTS.md` for project context”*
4. For feature work, reference [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) next item
5. Follow [TERMINOLOGY.md](./TERMINOLOGY.md) for naming in UI and code comments
6. After RBAC changes, remind to test with `cashier@demo.com` and `waiter@demo.com`

### Suggested next sprint (if continuing development)

1. Plan limit enforcement on catalog/orders APIs (expiry read-only middleware shipped §5.0e)
2. POS hold/recall + draft resume to cart
3. Kitchen Display MVP
4. Hide discount UI in POS when `Sale.Discount` missing
5. Extend permission checks to catalog write APIs

---

## 13. Git & CI

- **Branch:** `main`
- **Remote:** `origin` → `https://github.com/adhuhaam/BlurayPOS.git`
- **CI:** `.github/workflows/ci.yml` — backend build+test, frontend build on push/PR
- **Latest major commit:** `13b5342` — SaaS platform, RBAC, catalog workflows

---

## 14. Production infrastructure (memory)

**Canonical spec:** [deployment.md](./deployment.md)

### Hosting

| Item | Decision |
|------|----------|
| Cloud | DigitalOcean Ubuntu LTS server |
| Backend | .NET 9 (`Pos.Api`) behind Nginx |
| Frontend | React builds (Admin + web POS) served by Nginx |
| Database | PostgreSQL (private, port 5432) |
| Cache / jobs | Redis (private, port 6379) |
| TLS | Let's Encrypt + Certbot, mandatory HTTPS |
| CI/CD | GitHub → manual deploy now; GitHub Actions later |
| DNS | DigitalOcean DNS (nameservers at Namecheap) |

### Domain (`bluraymaldives.site`)

| Host | Purpose |
|------|---------|
| `bluraymaldives.site` | Main website |
| `office.bluraymaldives.site` | Office app (Admin + web POS) |
| `api.bluraymaldives.site` | API |
| `auth.bluraymaldives.site` | Auth (future) |
| `cdn.bluraymaldives.site` | CDN / static assets |
| `status.bluraymaldives.site` | Status page |

**DNS rule:** After pointing Namecheap to `ns1–3.digitalocean.com`, manage **all** records in DigitalOcean only — not Namecheap Advanced DNS.

### Network & security

- **Public ports:** 80, 443 (Nginx only)
- **Private:** Kestrel 5000/5001, PostgreSQL 5432, Redis 6379
- **UFW:** allow 22, 80, 443; deny rest
- **Nginx:** reverse proxy, gzip/brotli, static caching, security headers (HSTS, CSP, X-Frame-Options, etc.)
- **HTTP:** permanent 301 redirect to HTTPS everywhere

### Operations

- API runs as **`bluraypos-api.service`** (systemd: auto-start, restart on failure)
- Logs: `journalctl`, Nginx logs, app logs; centralized logging future
- Health: `/health` (live), `/ready`, `/live` — DO uptime monitoring
- SSL monitoring: expiry, renewal, redirect checks
- DB backups: daily, weekly, monthly with retention policy

### Deployment flow

```
GitHub → DO Ubuntu → git pull → dotnet publish → npm build React → restart services → zero downtime
```

### Offline POS (production requirement)

Operations must continue during internet outages:

- **Android:** Room SQLite, offline auth cache, local orders/payments/receipts, inventory cache, sync queue, WorkManager, conflict resolution
- **Web POS:** Dexie + outbox (existing partial implementation)

No restaurant should stop serving because of connectivity.

### Android production device requirements

- Kiosk mode, auto-launch after reboot, prevent app exit (Device Owner on Pro)
- Remote / silent APK updates where supported
- Hardware: printer, barcode scanner, camera, Bluetooth, Wi‑Fi, cash drawer, USB/OTG, buzzer, battery monitoring

### Pre-deploy checklist

See full checklist in [deployment.md](./deployment.md) — HTTPS, DNS, health, DB, Redis, systemd, Nginx, firewall, backups, monitoring, offline sync, kiosk, printer, scanner.

---

## 15. Related documents

| Document | Contents |
|----------|----------|
| [SAAS_REQUIREMENTS.md](./SAAS_REQUIREMENTS.md) | Full product spec (roles, POS UI, billing, security) |
| [TERMINOLOGY.md](./TERMINOLOGY.md) | Naming map |
| [INDUSTRY_MODES.md](./INDUSTRY_MODES.md) | Restaurant vs Retail modes |
| [COUPON_SYSTEM.md](./COUPON_SYSTEM.md) | Coupons & promotions plan (LuckyQR-inspired) |
| [OFFICE_MODULES.md](./OFFICE_MODULES.md) | Office sidebar, plan modules, subdomain map |
| [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) | Phase tracker (incl. Phase 9 infra) |
| [deployment.md](./deployment.md) | **Production deployment & infrastructure** |
| [GST_MALDIVES.md](./GST_MALDIVES.md) | Future accounting |
| [architecture.md](./architecture.md) | Technical diagrams + production topology |
| [ANDROID_MASTER_PLAN.md](./ANDROID_MASTER_PLAN.md) | Android product spec |
| [TERMINAL_APP.md](./TERMINAL_APP.md) | Android dev setup |
| [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) | **Repo map** — backend, frontends, Android, ports |
| [DEV_ENVIRONMENT.md](./DEV_ENVIRONMENT.md) | **Local dev** — Docker, ports 5147/5173–5175, scripts |
| [MARKETING_SITE.md](./MARKETING_SITE.md) | Public marketing homepage |
| [README.md](../README.md) | Quick start |

---

*This document should be updated whenever a major feature ships or architectural decisions change.*
