# Industry Modes — Restaurant vs Retail

> **Canonical plan** for separating BlurayPOS into two primary markets while keeping one codebase.

## Overview

BlurayPOS serves two industries from a single multi-tenant platform:

| Market | Primary UX | Catalog focus | POS focus |
|--------|------------|---------------|-----------|
| **Restaurant / Café** | Menu, tables, kitchen | Ingredients → Products → Recipes | Tap-to-order, table service, send-to-kitchen (planned) |
| **Retail / Shop** | SKUs, barcodes, fast checkout | Products → Inventory | Barcode scan → cart → pay |
| **Hybrid** | Both (demo, food + retail) | Full 4-step catalog | All modules visible |

Industry is stored on the **organization** (`Organization.BusinessType`). Plan flags (`HasKitchen`, `HasDelivery`, `HasInventory`) remain **billing gates** on top.

---

## Architecture

```
Organization.BusinessType     Plan flags (Subscription)
        │                              │
        └──────────┬───────────────────┘
                   ▼
         TenantFeatureResolver (backend)
         resolveTenantFeatures() (frontend fallback)
                   │
                   ▼
         TenantFeaturesDto → /api/auth/me
                   │
     ┌─────────────┼─────────────┐
     ▼             ▼             ▼
 Admin Office   Web POS      Android terminal
 (sidebar,      (barcode vs   (tables placeholder,
  catalog)       tables nav)   KDS later)
```

### `BusinessType` enum

| Value | Default for |
|-------|-------------|
| `Restaurant` | New self-registration (Maldives cafés/restaurants) |
| `Retail` | Shops, minimarts, boutiques |
| `Hybrid` | Existing tenants, demo org (`demo` slug) |

**Database:** `Organizations.BusinessType` (int, default `2` = Hybrid). Migration: `20260709032000_AddOrganizationBusinessType`.

### `TenantFeaturesDto` modules

| Flag | Restaurant | Retail | Hybrid |
|------|------------|--------|--------|
| `catalogIngredients` | ✅ | ❌ | ✅ |
| `catalogRecipes` | ✅ | ❌ | ✅ |
| `catalogInventory` | ✅* | ✅* | ✅* |
| `posBarcodeRetail` | ❌ | ✅ | ✅ |
| `posTables` | ✅ | ❌ | ✅ |
| `posKitchen` | plan | ❌ | plan |
| `posDelivery` | plan | ❌ | plan |

\*Gated by plan `HasInventory` when enforcement is complete.

---

## User flows

### Restaurant onboarding

1. Register → choose **Restaurant / Café**
2. Office sidebar: **Catalog setup** → Ingredients → Products → Recipes → Inventory
3. POS: product grid, **Tables** nav (placeholder until floor plan ships)
4. Future: areas, table status, course firing, KDS, QR ordering

### Retail onboarding

1. Register → choose **Retail / Shop**
2. Office sidebar: **Products** + **Inventory** only (no Ingredients/Recipes)
3. POS: **barcode-first** layout — scan field focused, large scan prompt
4. Product type defaults to `FinishedGood`; barcodes on SKUs

### Changing industry later

**Settings → Industry** — manager can switch `BusinessType`. Existing products are kept; hidden modules reappear when switching to Hybrid or the matching type.

---

## Implementation status

### Phase 1 — Foundation ✅ (this release)

| Item | Location |
|------|----------|
| `BusinessType` on org | `Pos.Domain/Enums/BusinessType.cs`, `Organization.cs` |
| Feature resolver | `Pos.Application/Common/TenantFeatureResolver.cs` |
| `/api/auth/me` exposes features | `MeResponse` + `AuthService.GetCurrentUserAsync` |
| Register industry picker | `admin-portal/RegisterPage.tsx` |
| Settings industry picker | `admin-portal/SettingsPage.tsx` |
| Conditional catalog sidebar | `tenant-sidebar.tsx`, `catalog-flow.ts` |
| Retail POS barcode emphasis | `pos-terminal/PosPage.tsx` |
| Restaurant Tables route (placeholder) | `pos-terminal/TablesPage.tsx` |
| Shared client types | `@pos/api-client/tenant-features.ts` |

### Phase 2 — Restaurant domain 🟡

| Item | Notes |
|------|-------|
| `DiningArea`, `DiningTable` entities | Store-scoped — **shipped** |
| `Order.DiningTableId`, `ServiceType`, kitchen/bill timestamps | **shipped** |
| `GET /api/tables`, send-to-kitchen, request-bill | **shipped** — see [TABLE_ORDERS.md](./TABLE_ORDERS.md) |
| Android table picker + kitchen flow | **v0.6.0** |
| Floor plan UI (admin) | 🔲 |
| Send to kitchen KDS screen | SignalR event shipped; KDS app 🔲 |

### Phase 3 — Retail polish 🔲

| Item | Notes |
|------|-------|
| Camera barcode (Android) | `TERMINAL_APP.md` |
| Retail receipt shortcuts | Quick complete sale |
| Label printing | Optional hardware |
| Stock alerts on scan | Block sale when OOS |

### Phase 4 — Enforcement & marketing 🔲

| Item | Notes |
|------|-------|
| Plan flag middleware | Block API when over limit / missing module |
| Marketing site industry selector | Personalize hero + onboarding CTA |
| Industry-specific demo tenants | `retail@demo`, `restaurant@demo` |
| Reports split | Table turnover vs SKU velocity |

---

## Code map

### Backend

- `backend/src/Pos.Domain/Enums/BusinessType.cs`
- `backend/src/Pos.Application/Common/TenantFeatureResolver.cs`
- `backend/src/Pos.Application/DTOs/Dtos.cs` — `TenantFeaturesDto`, `MeResponse`
- `backend/src/Pos.Infrastructure/Services/AuthService.cs` — register + `/me`
- `backend/src/Pos.Infrastructure/Services/SaasServices.cs` — org settings

### Frontend

- `frontend/packages/api-client/src/tenant-features.ts`
- `frontend/apps/admin-portal/src/auth.tsx` — `tenantFeatures` context
- `frontend/apps/admin-portal/src/lib/catalog-flow.ts` — `getCatalogStepsForFeatures()`
- `frontend/apps/admin-portal/src/components/tenant-sidebar.tsx`
- `frontend/apps/pos-terminal/src/auth.tsx`
- `frontend/apps/pos-terminal/src/pages/PosPage.tsx`

### Product-level split (unchanged)

`Product.InventoryMode`:

- `FinishedGood` — retail stock (`Inventory` page)
- `RecipeBased` — BOM / ingredients (`Supplies` + recipe wizard)

Industry mode **defaults** UX; per-product type still applies inside Hybrid orgs.

---

## Related docs

- [TERMINOLOGY.md](./TERMINOLOGY.md) — `BusinessType`, `TenantFeatures`
- [SAAS_REQUIREMENTS.md](./SAAS_REQUIREMENTS.md) — Table management, kitchen, QR (restaurant modules)
- [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) — Phase 3 Restaurant & Kitchen
- [TERMINAL_APP.md](./TERMINAL_APP.md) — Android tables placeholder, barcode roadmap
- [DEVELOPMENT_HANDOFF.md](./DEVELOPMENT_HANDOFF.md) — session history

---

*Last updated: industry modes Phase 1 shipped in codebase; restaurant tables/KDS remain roadmap.*
