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
| 3 | Subscription plans | 🟡 | Free + Pro implemented; spec now adds a **Basic** tier — not yet seeded |
| 4 | Store (tenant) management | 🟢 | CRUD, suspend, edit details, subscription on tenant |
| 5 | Self-registration | 🟢 | `/register` + `POST /api/auth/register` |
| 6 | RBAC permissions | 🟡 | DB permissions, JWT claims, org overrides, order enforcement; catalog not fully gated |
| 7 | User management | 🟢 | Manager CRUD, suspend, role assignment, role permission editor |
| 8 | Manager store user edit | 🟢 | Update user, password reset, plan user limits |
| 8a | Branch-level tenancy | 🟡 | `Store` (branch) exists; per-branch settings, routing & branch-scoped access incomplete |

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
| 15 | Customers | 🟡 | Basic CRUD; credit payments & CRM history not built |
| 16 | POS touchscreen UI | 🟡 | Works; not fully per touch spec (large tiles, hold/recall) |
| 17 | Hold / recall orders | 🟡 | `Held` status exists; limited UI |
| 18 | Shifts & Z-reports | 🟢 | Open/close shift gate on POS |

---

## Phase 3 — Core Modules

| # | Item | Status | Notes |
|---|------|--------|-------|
| 19 | Kitchen Display (advanced) | 🔲 | Permissions seeded; no KDS app. Spec: stations, routing, timers, priority, analytics |
| 20 | Delivery management | 🔲 | Permissions seeded; no UI. Spec: rider assignment, zones, charges, proof of delivery |
| 21 | Accounting / GST (Maldives) | 🔲 | Spec in GST_MALDIVES.md; output/input GST, MIRA returns, invoices |
| 22 | Reports module | 🟡 | Dashboard KPIs; sales/inventory/financial/restaurant/customer/employee reports incomplete |
| 23 | Expenses | 🔲 | Permissions only |
| 24 | Purchase management | 🔲 | Permissions only. Spec: PR, PO, GRN, supplier invoices, returns, partial delivery |
| 25 | Supplier portal | 🔲 | Contact, payment terms, balances, purchase history, product catalog |

---

## Phase 4 — Platform & Enforcement

| # | Item | Status | Notes |
|---|------|--------|-------|
| 26 | Subscription enforcement | 🔲 | Limits on plan entity; middleware not wired |
| 27 | Platform billing verification | 🟡 | Submit payment proof; Super Admin verify flow partial |
| 28 | Announcements | 🔲 | Entity exists |
| 29 | Platform analytics | 🔲 | Not started |
| 30 | Public REST API (Pro) | 🔲 | Plan flag only. Spec: OAuth, webhooks, product/order/customer/inventory/accounting APIs |
| 31 | Platform feature flags | 🔲 | Enable/disable modules globally or per plan |

---

## Phase 5 — Restaurant & Customer Engagement

| # | Item | Status | Notes |
|---|------|--------|-------|
| 32 | Restaurant table management | 🔲 | Floor plans, statuses, merge/split/transfer, reservations, wait list |
| 33 | QR ordering | 🔲 | Per-table QR → menu → order into KDS/waiter/POS; optional pay-first |
| 34 | Online ordering | 🔲 | Pickup, delivery, dine-in, scheduled orders |
| 35 | Customer display screen | 🔲 | Dual-screen POS: items, totals, GST, QR pay, loyalty, thank-you |
| 36 | Loyalty module | 🔲 | Points, tiers, birthday rewards, coupons, cashback |
| 37 | Gift cards | 🔲 | Create, balance, top-up, redeem, history, expiry |
| 38 | Promotions & discounts engine | 🔲 | %/fixed, BOGO, happy hour, combos, coupons, time/branch rules, priority |
| 39 | Recipes & ingredients | 🟡 | BOM & auto-deduct exist; versioning, yield, food-cost %, waste % pending |
| 40 | Inventory enhancements | 🔲 | Multi-warehouse, batches, expiry, serials, physical count, auto-reorder |
| 41 | CRM | 🔲 | Profiles, visit/purchase history, spending analytics, feedback |
| 42 | Marketing module | 🔲 | SMS/email/push campaigns, birthday messages, analytics |
| 43 | Reservation system | 🔲 | Calendar, confirmation, reminders, wait list |

---

## Phase 6 — Operations, Devices & Intelligence

| # | Item | Status | Notes |
|---|------|--------|-------|
| 44 | Employee management | 🔲 | Profiles, attendance, scheduling, payroll, leave, clock in/out |
| 45 | Cash management | 🟡 | Shifts/Z-reports exist; float, cash drops, safe deposits, reconciliation pending |
| 46 | Device management | 🔲 | Registration, activation codes, health, kiosk lock, remote disable |
| 47 | Hardware ecosystem | 🔲 | Android kiosk, remote provisioning/updates/diagnostics, heartbeat, printer health |
| 48 | Notification center | 🔲 | Low stock, order ready, subscription/GST due, failed payments, kitchen delays |
| 49 | Dashboard analytics | 🟡 | KPIs partial (dashboard endpoint currently erroring); best sellers, live kitchen pending |
| 50 | Offline mode | 🟡 | PWA offline-sync package exists; conflict resolution & full coverage pending |
| 51 | AI features | 🔲 | Sales summaries, forecasting, reorder suggestions, menu engineering |
| 52 | Third-party integrations | 🔲 | Payment gateways, accounting, delivery, SMS/email, WhatsApp, label printers |

---

## Recommended next sprint

1. Subscription enforcement middleware (limits + read-only on expiry)
2. POS hold/recall + resume draft to cart
3. Permission checks on catalog write APIs
4. Hide POS discount UI when `Sale.Discount` missing
5. Kitchen Display MVP
6. Branch-scoped settings & access (foundation for restaurant modules)

---

## Completed migrations (reference)

| Migration | Purpose |
|-----------|---------|
| `20260706175032_AddRbacAndSaasFoundation` | Permissions, RolePermissions, platform entities |
| `20260706192230_AddOrganizationRolePermissions` | Per-tenant role permission overrides |
