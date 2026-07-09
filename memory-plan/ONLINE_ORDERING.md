# Online Menu & Online Ordering

Pro-plan modules for customer-facing digital menu and online orders.

## URLs (production)

| App | URL | Dev port |
|-----|-----|----------|
| Online menu (restaurant) | `https://menu.bluraymaldives.site/{org-slug}` | 5176 |
| Online ordering | `https://order.bluraymaldives.site/{org-slug}` | 5177 |
| Table QR | `https://menu.bluraymaldives.site/{slug}/t/{qrToken}` | — |

## Plan modules

| Module | Plan flag | Free | Pro |
|--------|-----------|------|-----|
| Online Menu | `HasOnlineMenu` | No | Yes (restaurant/hybrid) |
| Online Ordering | `HasOnlineOrdering` | No | Yes (all industries) |

Resolved in `TenantFeaturesDto` as `onlineMenu` and `onlineOrdering`.

## Payment (v1)

- **Cash on delivery / pickup** — customer pays on handoff; staff **Accept** in Office Orders.
- **Bank transfer** — customer uploads slip at checkout; staff **Verify & confirm** in Office Orders.

No card gateway in v1.

## Public API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/public/stores/{slug}` | Store profile + enabled services |
| GET | `/api/public/stores/{slug}/menu` | Online-visible catalog |
| GET | `/api/public/tables/{qrToken}` | Resolve table for menu app |
| POST | `/api/public/stores/{slug}/orders` | Place order |
| GET | `/api/public/orders/track/{token}` | Track order status |
| POST | `/api/public/orders/track/{token}/slip` | Attach transfer slip |

Staff (authenticated):

| POST | `/api/orders/{id}/accept` | Accept COD online order |
| POST | `/api/orders/{id}/verify-payment` | Confirm bank transfer |
| POST | `/api/orders/{id}/reject` | Reject with reason |

## Order status (online)

`Submitted` → staff action → `Accepted` → kitchen/POS → `Completed`

Rejected orders → `Voided` with `RejectedReason` shown on tracking page.

## Admin (Office)

- **Settings** — per-branch online toggles, payment methods, min order, delivery fee
- **Online Menu** — preview, tables, print QR cards/posters (Pro + restaurant)
- **Orders** — filter Online; accept / verify / reject; view transfer slip

## Deploy

Build apps: `@pos/online-menu`, `@pos/online-order`

Nginx server blocks for `menu.` and `order.` subdomains → `/var/www/bluraypos/menu/` and `/var/www/bluraypos/order/`

DNS: A records `menu` and `order` → droplet IP

## Migration

`20260709043000_AddOnlineOrderingModule.cs` — plan flags, order fields, store settings, dining tables, product online visibility.
