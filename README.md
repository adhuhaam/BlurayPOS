# BlurayPOS

**Enterprise multi-tenant POS** — .NET 9 backend, React monorepo frontend, PostgreSQL.

Repository: [github.com/adhuhaam/BlurayPOS](https://github.com/adhuhaam/BlurayPOS)

---

## Features

| Area | Capabilities |
|------|----------------|
| **SaaS platform** | Plans & subscriptions, SuperAdmin tenant provisioning, org billing, usage limits |
| **Multi-tenant** | Organizations, stores, terminals, RBAC with per-store role permissions |
| **POS terminal** | Product grid, cart, cash/card/bank checkout, open orders, receipts, barcode scan, offline sync (PWA) |
| **Admin portal** | Dashboard, catalog workflow (products → recipes → inventory), orders, supplies, users & access, billing |
| **Inventory** | Finished-goods stock per store, adjustments, inter-store transfers |
| **Supplies & recipes** | Ingredient catalog (units: kg, ml, piece), supply receiving, BOM/recipes, auto-deduct on sale |
| **Payments** | Cash, card, bank transfer with slip upload + payment QR on receipt |
| **Operations** | Shifts & Z-reports, SignalR live updates, idempotent orders, refresh tokens |

---

## Tech Stack

| Layer | Stack |
|-------|--------|
| Backend | ASP.NET Core 9, EF Core, PostgreSQL, MediatR (CQRS), JWT + Identity |
| Frontend | React 19, Vite, npm workspaces, Tailwind / shadcn (admin) |
| DevOps | Docker, GitHub Actions CI, integration tests |

---

## Prerequisites

- **PostgreSQL** 14+
- **.NET 9 SDK**
- **Node.js** 20+

---

## Quick Start

### 1. Database

```sql
CREATE DATABASE pos_dev;
```

Default connection (`backend/src/Pos.Api/appsettings.Development.json`):

```
Host=localhost;Port=5432;Database=pos_dev;Username=postgres;Password=postgres
```

### 2. Backend

```powershell
cd backend/src/Pos.Api
dotnet restore
dotnet ef database update --project ../Pos.Infrastructure
dotnet run
```

- API: **http://localhost:5142**
- Swagger: **http://localhost:5142/swagger** (development)
- Health: **http://localhost:5142/health**

Migrations and demo seed run automatically on first start in Development.

### 3. Frontend

```powershell
cd frontend
npm install
npm run dev
```

| App | URL | Port |
|-----|-----|------|
| POS Terminal | http://localhost:5173 | 5173 |
| Admin Portal | http://localhost:5174 | 5174 |

### Environment

```env
VITE_API_URL=http://localhost:5142
```

Set in `frontend/apps/pos-terminal/.env` and `frontend/apps/admin-portal/.env` if needed.

---

## Demo Credentials

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Super Admin | `admin@demo.com` | `Admin123!` | Platform dashboard (no store) |
| Manager | `manager@demo.com` | `Manager123!` | Full store admin, users, billing, role permissions |
| Cashier | `cashier@demo.com` | `Cashier123!` | POS + orders (edit), discounts — no void |
| Waiter | `waiter@demo.com` | `Waiter123!` | POS + orders (edit) only — no void or discounts |

Managers configure role access under **Users & Access** → **Role access levels**. Staff must re-login after permission changes.

---

## Admin Portal Routes

### Super Admin (platform only)

| Route | Description |
|-------|-------------|
| `/` | Platform dashboard |
| `/plans` | Subscription plans |
| `/tenants` | Tenant stores |
| `/platform-users` | All platform users |
| `/platform-settings` | Platform configuration |

### Store owners / managers

| Route | Description |
|-------|-------------|
| `/` | Sales dashboard |
| `/orders` | Orders (draft/held — view, void if permitted) |
| `/products` | Products + guided recipe wizard |
| `/categories` | Categories |
| `/inventory` | Stock |
| `/supplies` | Ingredients & recipes |
| `/branches` | Branch locations |
| `/transfers` | Stock transfers |
| `/users` | Staff & role permissions (Manager) |
| `/billing` | Subscription |
| `/settings` | Store settings |
| `/audit-logs` | Audit trail |

Public: `/register` — self-service store signup

---

## SaaS & Billing

- **Plans**: Free and Pro (MVR 14,999/yr) — yearly billing with feature flags
- **Limits**: Max stores, users, products, monthly orders per plan
- **Self-registration**: `POST /api/auth/register` — creates tenant + manager + Free plan
- **SuperAdmin**: tenant CRUD, suspend/activate, plan change, password reset, payment verification
- **Billing UI**: `/billing` — usage bars, plan switch, submit bank/cash payment proof

### Product documentation

| Doc | Purpose |
|-----|---------|
| [docs/DEVELOPMENT_HANDOFF.md](docs/DEVELOPMENT_HANDOFF.md) | **Full project memory — read when moving machines or starting new Cursor sessions** |
| [docs/master-plan.md](docs/master-plan.md) | Extended master plan & requirements |
| [docs/SAAS_REQUIREMENTS.md](docs/SAAS_REQUIREMENTS.md) | Canonical SaaS architecture spec |
| [docs/TERMINOLOGY.md](docs/TERMINOLOGY.md) | Product ↔ code naming |
| [docs/DEVELOPMENT_ROADMAP.md](docs/DEVELOPMENT_ROADMAP.md) | Phased delivery status |
| [docs/GST_MALDIVES.md](docs/GST_MALDIVES.md) | Maldives GST / MIRA accounting module |

---

## Role-based access (RBAC)

Permissions use `{Module}.{Action}` codes (e.g. `Sale.Void`, `Order.View`). Defaults are seeded per role; **managers can override per store** via `OrganizationRolePermissions`.

### Standard POS defaults

| Role | POS | View orders | Edit drafts | Discounts | Void |
|------|-----|-------------|-------------|-----------|------|
| Waiter | ✓ | ✓ | ✓ | ✗ | ✗ |
| Cashier | ✓ | ✓ | ✓ | ✓ | ✗ |
| Branch Manager | ✓ | ✓ | ✓ | ✓ | ✓ |
| Manager (`OrgAdmin`) | ✓ | ✓ | ✓ | ✓ | ✓ |

- **Cashier / Waiter** in admin portal: `/orders` only (not catalog or settings)
- **POS terminal**: requires `Pos.Access`; void button hidden without `Sale.Void`
- API enforces permissions on order create, edit, complete, and void

---

## Catalog workflow

Recommended setup order (banner shown on catalog pages):

1. **Supplies** — add ingredients
2. **Products** — create product; inline **category** creation; recipe wizard after save
3. **Recipes** — link ingredients (step 2 for recipe-based items)
4. **Inventory** — track retail (finished-goods) stock

---

Modeled after [MioPoS](https://github.com/adhuhaam/MioPoS) patterns:

1. **Supplies** — define ingredients with units and per-store stock
2. **Receive supply** — log deliveries, update stock & cost
3. **Recipe products** — set product inventory type to *Recipe*, add BOM lines
4. **On sale** — ingredients deduct automatically when order completes

Retail products continue to use **finished-goods** inventory (`/inventory`).

---

## Bank Transfer & Receipt QR

1. **Settings** → set *Payment QR Payload* (bank/PromptPay data) and instructions
2. **POS** → checkout → **Bank** → upload transfer slip (image/PDF)
3. **Receipt** → shows payment QR + slip confirmation; print via browser

API: `POST /api/storage/upload` · `GET /api/storage/files/{fileName}`

---

## API Overview

| Area | Path | Notes |
|------|------|-------|
| Auth | `/api/auth` | Login, **register**, refresh, `/me` (permissions in JWT) |
| Products | `/api/products` | CRUD, search |
| Categories | `/api/categories` | CRUD |
| Inventory | `/api/inventory` | Stock, adjustments, transfers |
| Supplies | `/api/supplies` | Ingredients, receive, logs |
| Recipes | `/api/products/{id}/recipe` | BOM lines |
| Orders | `/api/orders` | Create, complete, void |
| Shifts | `/api/shifts` | Open/close, Z-report |
| Sync | `/api/sync` | Offline push/pull |
| Stores | `/api/stores` | Stores, org settings |
| Users | `/api/users` | Staff management |
| Roles | `/api/roles` | Per-store role permission overrides (Manager) |
| Platform | `/api/platform` | Plans CRUD, tenants, settings (SuperAdmin) |
| Plans | `/api/plans` | Public plan list |
| Subscription | `/api/subscription` | Org billing |
| Reports | `/api/reports` | Dashboard, audit logs |
| Storage | `/api/storage` | Slip uploads |
| SignalR | `/hubs/pos` | Live inventory & orders |

Full details: [docs/architecture.md](docs/architecture.md)

---

## Project Structure

```
BlurayPOS/
├── backend/
│   ├── src/
│   │   ├── Pos.Api/              # HTTP API, SignalR, Swagger
│   │   ├── Pos.Application/      # CQRS handlers, DTOs
│   │   ├── Pos.Domain/           # Entities, enums
│   │   └── Pos.Infrastructure/   # EF Core, auth, seeding
│   └── tests/
├── frontend/
│   ├── apps/
│   │   ├── pos-terminal/         # Cashier PWA
│   │   └── admin-portal/         # SaaS admin (shadcn/ui)
│   └── packages/
│       ├── api-client/
│       ├── offline-sync/
│       └── ui/
├── docs/
│   ├── DEVELOPMENT_HANDOFF.md  # Full context for laptop move / Cursor sessions
│   ├── SAAS_REQUIREMENTS.md      # Canonical product spec
│   ├── TERMINOLOGY.md
│   ├── DEVELOPMENT_ROADMAP.md
│   ├── GST_MALDIVES.md
│   ├── architecture.md
│   └── deployment.md
├── docker-compose.yml
├── Dockerfile
└── .github/workflows/ci.yml
```

---

## Docker

```powershell
docker compose up --build
```

See [docs/deployment.md](docs/deployment.md) for production deployment.

---

## Development

```powershell
# Backend tests
cd backend && dotnet test

# Frontend production build
cd frontend && npm run build
```

---

## Backup & Repository

This project is backed up at **[github.com/adhuhaam/BlurayPOS](https://github.com/adhuhaam/BlurayPOS)**.

To push local changes:

```powershell
git add .
git commit -m "Describe your change"
git push origin main
```

Keep this README updated when adding features, endpoints, or setup steps.

---

## License

Private / proprietary — adhuhaam.
