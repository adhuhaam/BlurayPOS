# Terminology

BlurayPOS product language vs codebase identifiers.

## Tenant hierarchy

```
Platform (BlurayPOS)
└── Organization  ← "Store" / tenant in product docs
    ├── Store (branch)     ← physical location / branch
    │   └── Terminal       ← POS register
    ├── Products, Customers, Orders (org-scoped; branch where applicable)
    └── Users (org-scoped, one org per user)
```

Every operational record should include **Store ID** (Organization) and **Branch ID** (Store entity) where applicable.

## Roles

| Product | Code enum | `OrganizationId` |
|---------|-----------|------------------|
| Super Admin | `SuperAdmin` | `null` |
| Manager | `OrgAdmin` | required |
| Branch Manager | `StoreManager` | required |
| Cashier | `Cashier` | required |
| Waiter | `Waiter` | required |
| Kitchen | `Kitchen` | required |
| Delivery | `Delivery` | required |
| Accountant | `Accountant` | required |

## Subscription plans

| Plan | Slug | Billing | Status |
|------|------|---------|--------|
| Free | `free` | MVR 0 / year | Implemented |
| Basic | `basic` | TBD / year | Planned (spec only) |
| Pro | `pro` | MVR 14,999 / year | Implemented |

> **Note:** Codebase currently seeds **Free + Pro** only. Basic tier is defined in [SAAS_REQUIREMENTS.md](./SAAS_REQUIREMENTS.md) and will be added when subscription enforcement ships.

Feature limits and flags are stored on the `Plan` entity. Yearly billing only (`PriceYearly`); `PriceMonthly` is unused.

Plan module flags include `HasHr` (HR management module).

## HR vs POS staff

| Product term | Code entity | Notes |
|--------------|-------------|-------|
| **POS user** | `ApplicationUser` | Login account, RBAC, terminal access |
| **Employee (HR)** | `Employee` | HR record: profile, payroll, attendance, leave |
| **Register shift** | `Shift` | Cash drawer open/close (sales), not HR scheduling |
| **Work schedule** | `WorkSchedule` | Weekly HR shift template per employee |

`Employee.UserId` optionally links an HR record to a POS user. Creating/updating a user auto-syncs the linked employee.

## Permissions

Format: `{Module}.{Action}` — e.g. `Product.Create`, `Sale.Void`, `Order.View`, `Pos.Access`.

Stored in `Permissions` table; assigned to roles via `RolePermissions` (global defaults).

Managers can override per store via `OrganizationRolePermissions` (replaces defaults for that role in that org). JWT includes permission claims; handlers enforce on order operations.

## Subscription

- **Plan** — feature template (Free / Pro)
- **Subscription** — active plan instance per `Organization`; `CurrentPeriodStart` / `CurrentPeriodEnd` (yearly)
- **SubscriptionStatus** — `Active`, `PastDue` (expired, read-only), `Trialing`, `Canceled`
- **SubscriptionPayment** — yearly renewal record; tenant submits proof → Super Admin verifies
- **Renewal stacking** — early renewal extends from existing period end (no lost days)

## Industry modes

| Term | Code | Meaning |
|------|------|---------|
| Business type | `Organization.BusinessType` | `Restaurant`, `Retail`, or `Hybrid` |
| Tenant features | `TenantFeaturesDto` | Resolved modules for Office + POS (ingredients, recipes, barcode, tables, kitchen) |
| Finished good | `ProductInventoryMode.FinishedGood` | Retail SKU — stock in **Inventory** |
| Recipe product | `ProductInventoryMode.RecipeBased` | Menu item — stock in **Ingredients** (BOM) |

Full plan: [INDUSTRY_MODES.md](./INDUSTRY_MODES.md).

## Module naming (product ↔ code)

| Product module | Typical permission prefix | Notes |
|----------------|---------------------------|-------|
| Kitchen Display | `Kitchen.*` | Permissions seeded; KDS UI not built |
| Delivery | `Delivery.*` | Permissions seeded; UI not built |
| Reservations | `Reservation.*` | Planned |
| Loyalty | `Loyalty.*` | Planned |
| Gift Cards | `GiftCard.*` | Planned |
| Promotions / Coupons | `Promotion.*` | Phase 1 shipped — [COUPON_SYSTEM.md](./COUPON_SYSTEM.md) |
| Coupons (public site) | `@pos/coupons-site` | `coupons.bluraymaldives.site` — see [OFFICE_MODULES.md](./OFFICE_MODULES.md) |
| Online menu | `@pos/online-menu` | `menu.bluraymaldives.site/{slug}` |
| Online ordering | `@pos/online-order` | `order.bluraymaldives.site/{slug}` |
| Human Resources | admin-portal `/hr/*` | In-portal (plan-gated) |
| Coupon token | `CouponToken` | `DisplayCode` (human) + `InternalCode` (QR URL) |
| Office plan modules | Sidebar **Modules** section | External subdomain links from subscription plan |
| Purchases | `Purchase.*` | Permissions seeded |
| Expenses | `Expense.*` | Permissions seeded |
| Accounting / GST | `Accounting.*` | Spec in GST_MALDIVES.md |
| API access | Plan feature flag | Pro plan |

## Marketing & hardware (public site)

| Product term | Meaning | Notes |
|--------------|---------|-------|
| **Handheld POS terminal** | Pro-plan physical Android device with built-in printer | Not a payment terminal |
| **Office** | Admin portal (`admin-portal` app) | `office.bluraymaldives.site` — sidebar plan modules: [OFFICE_MODULES.md](./OFFICE_MODULES.md) |
| **POS app** | Web POS PWA or Android app | Order taking; payments in software |
| **Bill / receipt** | 58mm thermal printout from terminal | Hardware feature |
| **Free for life** | Free plan (`slug: free`) | Core marketing promise |

**Do not market** NFC, tap-to-pay, or card processing as **terminal hardware** capabilities. Payments are recorded in POS software; the device focuses on orders + printing.
