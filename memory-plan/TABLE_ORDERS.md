# Restaurant Table Orders — Android + API

> **Shipped:** July 2026 (v0.6.0 Android, API `bluraypos-api-industry`)

## Restaurant dine-in flow

1. **POS** — select **table** (chip) or **Takeaway**
2. Add menu items to cart
3. **Save & send to kitchen** — creates/updates draft order, assigns table, fires kitchen SignalR event (**no bill printed**)
4. Customer eats; staff can reopen table and add more items → save again
5. Customer asks for bill → **Request bill**
6. **Take payment** → order completed → table **Available**

**Retail** and **Takeaway** keep instant **Checkout → Pay** (no table).

## API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/dining-areas?storeId=` | List dining areas |
| POST | `/api/dining-areas?storeId=` | Create area (manager) |
| GET | `/api/tables?storeId=` | List tables + status + active order summary |
| GET | `/api/tables/{id}` | Single table |
| POST | `/api/tables?storeId=` | Create table (manager) |
| POST | `/api/orders` | Create draft (`diningTableId`, `serviceType`) |
| PUT | `/api/orders/{id}` | Update draft lines |
| POST | `/api/orders/{id}/send-to-kitchen` | Kitchen ticket; table **Occupied** |
| POST | `/api/orders/{id}/request-bill` | Customer asked for bill; table **BillRequested** |
| POST | `/api/orders/{id}/complete` | Payment; table **Available** |

## Domain

- `DiningArea`, `DiningTable` — store-scoped floor plan (`backend/src/Pos.Domain/Entities/Dining.cs`)
- `Order.DiningTableId`, `ServiceType`, `SentToKitchenAt`, `BillRequestedAt`
- `DiningTableStatus` — Available, Occupied, BillRequested, Reserved, Cleaning
- Migration: `backend/src/Pos.Infrastructure/Persistence/Migrations/20260709100000_AddDiningTables.cs`

## Backend files

| Area | Path |
|------|------|
| Controller | `backend/src/Pos.Api/Controllers/TablesController.cs` |
| Areas API | `backend/src/Pos.Api/Controllers/DiningAreasController.cs` |
| Table handlers | `backend/src/Pos.Application/Features/Tables/TableHandlers.cs` |
| Order kitchen/bill | `backend/src/Pos.Application/Features/Sales/SalesHandlers.cs` |
| DTOs | `backend/src/Pos.Application/DTOs/Dtos.cs` |
| Demo seed T1–T12 | `backend/src/Pos.Infrastructure/Persistence/DataSeeder.cs` |
| SignalR | `KitchenOrder` via `PosRealtimeNotifier` |

| Admin Office | `frontend/apps/admin-portal/src/pages/DiningTablesPage.tsx` — `/tables` (areas + tables CRUD) |

## Android (v0.6.0)

| Area | File | Behavior |
|------|------|----------|
| **POS** | `ui/pos/PosScreen.kt`, `PosViewModel` | Table chip + picker; Save & send to kitchen; Request bill; Take payment |
| **Tables tab** | `ui/tables/TablesScreen.kt`, `TablesViewModel.kt` | Live API floor grid; tap → POS |
| **Orders** | `ui/orders/OrdersScreen.kt` | Table name on order rows |
| **Shared state** | `data/table/TableSession.kt` | Table + active order across tabs |
| **API client** | `data/api/BlurayApi.kt`, `ApiModels.kt` | `getTables`, `updateOrder`, `sendToKitchen`, `requestBill` |

Demo seed: **Main Floor**, tables **T1–T12** on demo org Main Branch. Login: `cashier@demo.com` / `Cashier123!` (Hybrid tenant).

## Dev environment

- API must include `/api/tables` — probe: `curl -s -o /dev/null -w '%{http_code}' http://localhost:PORT/api/tables` → **401** (not 404)
- Run `./scripts/ensure-dev-api.sh` — auto-detects stale containers, may use port **5148**; writes `.dev-api-port`
- Android debug URL reads `.dev-api-port` via `install-android.sh` / `build.gradle.kts`

## SignalR

`KitchenOrder` event on `/hubs/pos` when order sent to kitchen (KDS app future).

## Not yet built

- ~~Admin floor-plan editor~~ → **Tables & Areas** in Office (`/tables`) for OrgAdmin + StoreManager
- Web POS `TablesPage.tsx` (placeholder)
- Kitchen display (KDS) screen
- Physical kitchen printer

## Related

- [INDUSTRY_MODES.md](./INDUSTRY_MODES.md) — Phase 2 restaurant domain
- [TERMINAL_APP.md](./TERMINAL_APP.md) — Android manual
- [DEV_ENVIRONMENT.md](./DEV_ENVIRONMENT.md) — API ports, stale container fix
- [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) — item #27 table management
