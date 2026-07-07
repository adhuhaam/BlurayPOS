# Terminology

BlurayPOS product language vs codebase identifiers.

## Tenant hierarchy

```
Platform (BlurayPOS)
└── Organization  ← "Store" / tenant in product docs
    ├── Store (branch)     ← physical location / branch
    │   └── Terminal       ← POS register
    ├── Products, Customers, Orders (store-scoped)
    └── Users (store-scoped, one store per user)
```

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

Only two canonical plans exist:

| Plan | Slug | Billing |
|------|------|---------|
| Free | `free` | MVR 0 / year — up to 25 products |
| Pro | `pro` | MVR 14,999 / year — unlimited |

Feature limits and flags are stored on the `Plan` entity. Yearly billing only (`PriceYearly`); `PriceMonthly` is unused.

## Permissions

Format: `{Module}.{Action}` — e.g. `Product.Create`, `Sale.Void`, `Order.View`, `Pos.Access`.

Stored in `Permissions` table; assigned to roles via `RolePermissions` (global defaults).

Managers can override per store via `OrganizationRolePermissions` (replaces defaults for that role in that org). JWT includes permission claims; handlers enforce on order operations.

## Subscription

- **Plan** — feature template (Free / Pro only)
- **Subscription** — active plan instance per `Organization` (store)
- **SubscriptionPayment** — yearly payment record verified by Super Admin
