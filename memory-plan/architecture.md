# Architecture

## Overview

BlurayPOS is a **multi-tenant SaaS POS** for restaurants and retail in the Maldives. It uses **Clean Architecture** on the backend (.NET 9), an **npm workspaces** monorepo for web clients, and a **native Android** terminal app.

Full repo map: [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)

```
┌──────────────────────────────────────────────────────────────────────┐
│                            Clients                                    │
│  ┌────────────┐ ┌────────────┐ ┌─────────────┐ ┌──────────────────┐  │
│  │ POS PWA    │ │ Admin      │ │ Marketing   │ │ Android Terminal │  │
│  │ :5173      │ │ :5174      │ │ :5175       │ │ terminal_app     │  │
│  └─────┬──────┘ └─────┬──────┘ └──────┬──────┘ └────────┬─────────┘  │
│        │   @pos/api-client / Retrofit  │                  │           │
└────────┼───────────────┼───────────────┼──────────────────┼───────────┘
         │               │               │                  │
         └───────────────┴───────────────┴──────────────────┘
                                 │ REST + JWT (+ SignalR)
                                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│              ASP.NET Core 9 API (dev: :5147, prod: api.*)             │
│  Controllers → MediatR (CQRS) → Application services                  │
│  JWT │ SignalR /hubs/pos │ Idempotency │ Tenant query filters        │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
              PostgreSQL               Redis
```

---

## Backend Layers

| Layer | Project | Responsibility |
|-------|---------|----------------|
| API | `Pos.Api` | HTTP controllers, SignalR hub, middleware, Swagger |
| Application | `Pos.Application` | CQRS commands/queries, DTOs, `TenantFeatureResolver` |
| Domain | `Pos.Domain` | Entities, enums (`BusinessType`, `OrderStatus`), domain rules |
| Infrastructure | `Pos.Infrastructure` | EF Core, JWT auth, data seeding, external services |

### Key API Endpoints

| Area | Base Path | Notes |
|------|-----------|-------|
| Auth | `/api/auth` | Login, register, refresh, **me** (business type + tenant features) |
| Public | `/api/public` | Anonymous marketing (plans, customers, stats) |
| Products | `/api/products` | CRUD, search, pagination |
| Categories | `/api/categories` | CRUD |
| Inventory | `/api/inventory` | Per-store stock, adjustments, transfers |
| Orders | `/api/orders` | Create, complete, void |
| Shifts | `/api/shifts` | Open/close register, Z-reports |
| Sync | `/api/sync` | Push mutations, pull events (offline) |
| Reports | `/api/reports` | Dashboard, audit logs |
| Stores | `/api/stores` | Multi-store management, org settings |
| Users | `/api/users` | User provisioning (OrgAdmin) |
| Customers | `/api/customers` | Customer lookup and creation |
| Supplies | `/api/supplies` | Ingredients, supply receiving, logs |
| Recipes | `/api/products/{id}/recipe` | Bill of materials per product |
| Platform | `/api/platform` | Tenant provisioning (SuperAdmin) |
| Plans | `/api/plans` | Subscription plans |
| Subscription | `/api/subscription` | Org billing & plan changes |
| Storage | `/api/storage` | Payment slip uploads |

---

## Industry modes (Restaurant / Retail / Hybrid)

Organizations have `BusinessType`. The backend resolves enabled modules:

| Type | POS emphasis | Catalog emphasis |
|------|--------------|------------------|
| **Restaurant** | Tables, menu tap-to-add | Ingredients, recipes |
| **Retail** | Barcode scan, fast checkout | Products, inventory |
| **Hybrid** | Both | Full catalog workflow |

Resolution: `TenantFeatureResolver` → exposed on `GET /api/auth/me` as `tenantFeatures`.  
See [INDUSTRY_MODES.md](./INDUSTRY_MODES.md).

---

## Frontend Monorepo

### Packages

**`@pos/api-client`** — Typed fetch wrapper with JWT in `localStorage`. Shared types for all apps. `resolveTenantFeatures()` client fallback.

**`@pos/offline-sync`** — Dexie IndexedDB for product caching and outbox queue. `syncPush`/`syncPull`, `useOnlineStatus`.

**`@pos/ui`** — Tailwind v4 shared components for POS: Button, Input, Card, Modal, Table, Badge.

### Apps

**POS Terminal** (`apps/pos-terminal`)
- Touch full-screen layout, store selection at login
- **Retail mode:** barcode-focused search
- **Restaurant mode:** category chips, tap-to-add
- Cart, cash/card/bank checkout, receipts
- Offline mode with Dexie + outbox (partial)
- PWA installable

**Admin Portal** (`apps/admin-portal`)
- Platform vs tenant sidebars (Super Admin / Store Admin)
- Dashboard, catalog workflow (products → recipes → inventory)
- Industry-aware nav (hide supplies for retail-only)
- Users, billing, settings (`BusinessType` picker)
- shadcn/ui + Tailwind

**Marketing Site** (`apps/marketing-site`)
- Public homepage `bluraymaldives.site`
- Live plans + customer stores from `/api/public/marketing`
- Standalone Vite SPA on :5175

---

## Android (`terminal_app/`)

- Kotlin + Jetpack Compose, Retrofit, DataStore
- **v0.6.0:** restaurant table orders (kitchen → bill → pay), live Tables tab
- v0.5.x: fullscreen kiosk, tenant features, POS-first navigation
- Same API as web; debug uses LAN IP + `.dev-api-port` (5147 or 5148)
- Offline Room + WorkManager: planned ([ANDROID_MASTER_PLAN.md](./ANDROID_MASTER_PLAN.md))

---

## Authentication Flow

1. Client POSTs credentials to `/api/auth/login` (optional `storeId` for branch)
2. Server returns JWT, refresh token, user, roles, permissions, stores
3. Client calls `/api/auth/me` for `businessType` + `tenantFeatures`
4. Subsequent requests use `Authorization: Bearer`
5. Cashier/Waiter must select branch; permissions in JWT (re-login after RBAC changes)

---

## Offline Sync Strategy (Web POS)

1. Products served from IndexedDB when offline
2. Orders queued in outbox with idempotency keys
3. On reconnect: `syncPush` then `syncPull`

Android offline: not yet implemented (Room planned).

---

## Real-time

SignalR hub at `/hubs/pos` for inventory/order updates. POS web uses `usePosHub`.

---

## Multi-tenancy

All tenant data scoped by `OrganizationId`. Global query filters in EF Core. Super Admin has `OrganizationId = null`.

Product "Store" = `Organization`. Product "Branch" = `Store` entity.

---

## Production Topology (DigitalOcean)

```
                    Internet
                        │
                        ▼
              ┌─────────────────┐
              │  DigitalOcean   │
              │  Ubuntu LTS     │
              │  UFW: 22,80,443 │
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │     Nginx       │
              │  TLS (Certbot)  │
              └───┬─────────┬───┘
                  │         │
     office.*     │         │  api.*
   React static   │         │  reverse proxy
                  │         │
         ┌────────▼──┐  ┌───▼────────────┐
         │  /var/www │  │  Kestrel :5000  │
         │  landing  │  │  Pos.Api (.NET9)│
         │  office   │  └───┬──────┬──────┘
         └───────────┘      │      │
                     ┌──────▼──┐ ┌─▼─────┐
                     │PostgreSQL│ │ Redis │
                     └──────────┘ └───────┘
```

| Hostname | Serves |
|----------|--------|
| `bluraymaldives.site` | Marketing site |
| `office.bluraymaldives.site` | Admin portal (Office) |
| `pos.bluraymaldives.site` | POS PWA |
| `coupons.bluraymaldives.site` | Public coupon / lucky-draw scan (`@pos/coupons-site`) |
| `menu.bluraymaldives.site` | Online menu per store `{slug}` |
| `order.bluraymaldives.site` | Online ordering per store `{slug}` |
| `api.bluraymaldives.site` | REST API, SignalR |

Full spec: [PRODUCTION_INFRASTRUCTURE.md](./PRODUCTION_INFRASTRUCTURE.md) · [deployment.md](./deployment.md)

---

## Local development

| Service | Port |
|---------|------|
| API (preferred) | **5147** (`bluraypos-api-industry`) |
| API (fallback) | **5148** when 5147 blocked — `.dev-api-port` |
| POS | 5173 |
| Admin | 5174 |
| Marketing | 5175 |
| Coupons | 5176 |
| Online order | 5177 |
| Online menu | 5178 |

See [DEV_ENVIRONMENT.md](./DEV_ENVIRONMENT.md) · [OFFICE_MODULES.md](./OFFICE_MODULES.md) for module subdomain details.
