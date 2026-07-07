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
| 3 | Subscription plans | 🟢 | Free + Pro only; seeder enforces; junk plans removed |
| 4 | Store (tenant) management | 🟢 | CRUD, suspend, edit details, subscription on tenant |
| 5 | Self-registration | 🟢 | `/register` + `POST /api/auth/register` |
| 6 | RBAC permissions | 🟡 | DB permissions, JWT claims, org overrides, order enforcement; catalog not fully gated |
| 7 | User management | 🟢 | Manager CRUD, suspend, role assignment, role permission editor |
| 8 | Manager store user edit | 🟢 | Update user, password reset, plan user limits |

---

## Phase 2 — Catalog & POS Operations

| # | Item | Status | Notes |
|---|------|--------|-------|
| 9 | Products & categories | 🟢 | CRUD, search, wizard, inline category picker |
| 10 | Inventory & supplies | 🟢 | Retail stock, ingredients, receive, recipe BOM |
| 11 | Catalog workflow UX | 🟢 | Workflow banner, empty states, guided recipe step |
| 12 | Orders & payments | 🟢 | Create, complete, void; cash/card/bank transfer |
| 13 | Orders UI | 🟢 | Admin `/orders`, POS `/orders` |
| 14 | Role-based POS access | 🟢 | Waiter, Cashier defaults; manager-configurable |
| 15 | Customers | 🟡 | Basic CRUD; credit payments not built |
| 16 | POS touchscreen UI | 🟡 | Works; not fully per touch spec (large tiles, hold/recall) |
| 17 | Hold / recall orders | 🟡 | `Held` status exists; limited UI |
| 18 | Shifts & Z-reports | 🟢 | Open/close shift gate on POS |

---

## Phase 3 — Modules

| # | Item | Status | Notes |
|---|------|--------|-------|
| 19 | Kitchen Display | 🔲 | Permissions seeded; no KDS app |
| 20 | Delivery | 🔲 | Permissions seeded; no delivery UI |
| 21 | Accounting / GST (Maldives) | 🔲 | Spec in GST_MALDIVES.md |
| 22 | Reports | 🟡 | Dashboard KPIs; advanced reports incomplete |
| 23 | Expenses | 🔲 | Permissions only |
| 24 | Purchase management | 🔲 | Permissions only |

---

## Phase 4 — Platform & Enforcement

| # | Item | Status | Notes |
|---|------|--------|-------|
| 25 | Subscription enforcement | 🔲 | Limits on plan entity; middleware not wired |
| 26 | Platform billing verification | 🟡 | Submit payment proof; Super Admin verify flow partial |
| 27 | Announcements | 🔲 | Entity exists |
| 28 | Platform analytics | 🔲 | Not started |
| 29 | API access (Pro) | 🔲 | Plan flag only |

---

## Recommended next sprint

1. Subscription enforcement middleware (limits + read-only on expiry)
2. POS hold/recall + resume draft to cart
3. Permission checks on catalog write APIs
4. Hide POS discount UI when `Sale.Discount` missing
5. Kitchen Display MVP

---

## Completed migrations (reference)

| Migration | Purpose |
|-----------|---------|
| `20260706175032_AddRbacAndSaasFoundation` | Permissions, RolePermissions, platform entities |
| `20260706192230_AddOrganizationRolePermissions` | Per-tenant role permission overrides |
