# Development Roadmap

Tracked against [SAAS_REQUIREMENTS.md](./SAAS_REQUIREMENTS.md).

## Phase 1 — Foundation (current)

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Authentication + JWT | 🟡 | Register, permissions in token |
| 2 | Super Admin dashboard | 🟡 | Org list, suspend, payments |
| 3 | Subscription plans | 🟡 | Free/Pro + feature flags |
| 4 | Store (tenant) management | 🟡 | CRUD, suspend |
| 5 | Self-registration | 🟡 | `POST /api/auth/register` |
| 6 | RBAC permissions | 🟡 | DB-driven Permission + RolePermission |
| 7 | User management | 🟢 | Basic CRUD exists |

## Phase 2 — Operations

| # | Item | Status |
|---|------|--------|
| 8 | POS touchscreen UI | 🟡 |
| 9 | Products & categories | 🟢 |
| 10 | Inventory & supplies | 🟢 |
| 11 | Customers + credit | 🔲 |
| 12 | Orders & payments | 🟢 |

## Phase 3 — Modules

| # | Item | Status |
|---|------|--------|
| 13 | Kitchen Display | 🔲 |
| 14 | Delivery | 🔲 |
| 15 | Accounting / GST | 🔲 |
| 16 | Reports | 🟡 |
| 17 | Subscription enforcement | 🟡 |
| 18 | Platform billing | 🟡 |

## Phase 4 — Platform

| # | Item | Status |
|---|------|--------|
| 19 | Announcements | 🔲 |
| 20 | Platform analytics | 🔲 |

Legend: 🟢 Done · 🟡 In progress · 🔲 Planned
