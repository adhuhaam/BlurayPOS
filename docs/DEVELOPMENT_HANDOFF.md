# BlurayPOS — Development Handoff & Project Memory

> **Purpose:** Complete context for moving dev environment to another laptop or onboarding a new Cursor session.  
> **Repository:** [github.com/adhuhaam/BlurayPOS](https://github.com/adhuhaam/BlurayPOS)  
> **Last updated:** July 2026 (commit `13b5342` on `main`)

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

```powershell
git clone https://github.com/adhuhaam/BlurayPOS.git
cd BlurayPOS

# Database
# In psql or pgAdmin:
# CREATE DATABASE pos_dev;

# Backend
cd backend/src/Pos.Api
dotnet restore
dotnet ef database update --project ../Pos.Infrastructure
dotnet run
# → http://localhost:5142 (migrations + seed run on first dev start)

# Frontend (new terminal)
cd frontend
npm install
npm run dev
# → POS: http://localhost:5173
# → Admin: http://localhost:5174
```

### Environment files (optional)

```env
# frontend/apps/pos-terminal/.env
# frontend/apps/admin-portal/.env
VITE_API_URL=http://localhost:5142
```

Default DB connection: `backend/src/Pos.Api/appsettings.Development.json`  
`Host=localhost;Port=5432;Database=pos_dev;Username=postgres;Password=postgres`

### Cursor context files to read (in order)

1. **This file** — `docs/DEVELOPMENT_HANDOFF.md`
2. [SAAS_REQUIREMENTS.md](./SAAS_REQUIREMENTS.md) — canonical product spec
3. [TERMINOLOGY.md](./TERMINOLOGY.md)
4. [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) — status tracker
5. [README.md](../README.md) — quick start
6. [architecture.md](./architecture.md) — technical architecture
7. [GST_MALDIVES.md](./GST_MALDIVES.md) — future accounting module

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

Demo tenant: slug `demo`, currency MVR, on **Pro** plan.

| Service | URL |
|---------|-----|
| API | http://localhost:5142 |
| Swagger | http://localhost:5142/swagger |
| POS Terminal | http://localhost:5173 |
| Admin Portal | http://localhost:5174 |

---

## 5. Session history — what was built (conversation memory)

This section captures work done across Cursor sessions so nothing is lost.

### 5.1 SaaS foundation & auth fixes

**Problem:** Super Admin “Failed to save plan” — cookie auth from `AddIdentity` intercepted API calls.

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
| Subscription enforcement | Plan limits defined; not fully enforced on every API |
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

1. **Subscription enforcement middleware** — block features when Free plan limits exceeded or subscription expired (read-only mode)
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
| Sidebar nav | `tenant-sidebar.tsx`, `platform-sidebar.tsx` |
| Catalog UX | `ProductsPage.tsx`, `category-picker.tsx`, `catalog-workflow-banner.tsx` |
| Users & RBAC UI | `UsersPage.tsx` |
| Orders admin | `OrdersPage.tsx` |
| POS | `pos-terminal/src/pages/PosPage.tsx`, `OrdersPage.tsx`, `auth.tsx` |
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

---

## 12. How to continue with Cursor on new laptop

1. Clone repo, run setup (section 3)
2. Open workspace in Cursor
3. Tell Cursor: *“Read `docs/DEVELOPMENT_HANDOFF.md` and `docs/SAAS_REQUIREMENTS.md` for project context”*
4. For feature work, reference [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) next item
5. Follow [TERMINOLOGY.md](./TERMINOLOGY.md) for naming in UI and code comments
6. After RBAC changes, remind to test with `cashier@demo.com` and `waiter@demo.com`

### Suggested next sprint (if continuing development)

1. Subscription enforcement middleware (highest SaaS value)
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

## 14. Related documents

| Document | Contents |
|----------|----------|
| [SAAS_REQUIREMENTS.md](./SAAS_REQUIREMENTS.md) | Full product spec (roles, POS UI, billing, security) |
| [TERMINOLOGY.md](./TERMINOLOGY.md) | Naming map |
| [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) | Phase tracker |
| [GST_MALDIVES.md](./GST_MALDIVES.md) | Future accounting |
| [architecture.md](./architecture.md) | Technical diagrams |
| [deployment.md](./deployment.md) | Docker/production |
| [README.md](../README.md) | Quick start |

---

*This document should be updated whenever a major feature ships or architectural decisions change.*
