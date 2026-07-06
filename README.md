# BlurayPOS

**Enterprise multi-tenant POS** — .NET 9 backend, React monorepo frontend, PostgreSQL.

Repository: [github.com/adhuhaam/BlurayPOS](https://github.com/adhuhaam/BlurayPOS)

---

## Features

| Area | Capabilities |
|------|----------------|
| **SaaS platform** | Plans & subscriptions, SuperAdmin tenant provisioning, org billing, usage limits |
| **Multi-tenant** | Organizations, stores, terminals, role-based access (SuperAdmin → Cashier) |
| **POS terminal** | Product grid, cart, cash/card/bank checkout, receipts, barcode scan, offline sync (PWA) |
| **Admin portal** | Dashboard, products, categories, inventory, supplies, stores, users, transfers, audit logs |
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
| SuperAdmin | `admin@demo.com` | `Admin123!` | Platform tenants + full demo org |
| Org Admin | `orgadmin@demo.com` | `OrgAdmin123!` | Stores, users, billing, settings |
| Store Manager | `manager@demo.com` | `Manager123!` | Assigned store |
| Cashier | `cashier@demo.com` | `Cashier123!` | POS terminal only |

---

## Admin Portal Routes

| Route | Description |
|-------|-------------|
| `/` | Dashboard |
| `/products` | Product catalog + recipe BOM editor |
| `/categories` | Categories |
| `/inventory` | Finished-goods stock |
| `/supplies` | Ingredients, supply receiving, logs |
| `/stores` | Stores (+ auto store manager on create) |
| `/users` | Staff accounts |
| `/transfers` | Stock transfers |
| `/billing` | Plan & subscription (OrgAdmin) |
| `/settings` | Org settings, payment QR payload |
| `/organizations` | Tenant provisioning (SuperAdmin) |
| `/audit-logs` | Audit trail |

---

## SaaS & Billing

- **Plans**: Starter ($29), Professional ($79), Enterprise ($199)
- **Limits**: Max stores, users, terminals per plan
- **SuperAdmin**: `POST /api/platform/organizations` — creates org + subscription + OrgAdmin
- **Billing UI**: `/billing` — usage bars, plan switch (Stripe checkout stub ready)

---

## Supplies & Recipes (ingredient-based inventory)

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
| Auth | `/api/auth` | Login, refresh, `/me` |
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
| Platform | `/api/platform` | Tenants (SuperAdmin) |
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
