# Architecture

## Overview

Enterprise POS is a multi-tenant retail point-of-sale system designed for organizations with multiple stores. It follows a clean architecture on the backend and an npm workspaces monorepo on the frontend.

```
┌─────────────────────────────────────────────────────────────┐
│                        Clients                               │
│  ┌──────────────────┐       ┌──────────────────┐            │
│  │  POS Terminal    │       │  Admin Portal    │            │
│  │  (Vite + React)  │       │  (Vite + React)  │            │
│  │  Port 5173       │       │  Port 5174       │            │
│  └────────┬─────────┘       └────────┬─────────┘            │
│           │    @pos/api-client       │                       │
│           │    @pos/ui              │                       │
│           │    @pos/offline-sync    │                       │
└───────────┼─────────────────────────┼───────────────────────┘
            │         REST + JWT       │
            ▼                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   ASP.NET Core API (Port 5142)               │
│  Controllers → MediatR (CQRS) → Domain Services            │
│  JWT Auth │ SignalR Hub │ Idempotency Middleware           │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ PostgreSQL  │
                    └─────────────┘
```

## Backend Layers

| Layer | Project | Responsibility |
|-------|---------|----------------|
| API | `Pos.Api` | HTTP controllers, SignalR hub, middleware, Swagger |
| Application | `Pos.Application` | CQRS commands/queries, DTOs, validation |
| Domain | `Pos.Domain` | Entities, enums, domain rules |
| Infrastructure | `Pos.Infrastructure` | EF Core, JWT auth, data seeding, external services |

### Key API Endpoints

| Area | Base Path | Notes |
|------|-----------|-------|
| Auth | `/api/auth` | Login, current user |
| Products | `/api/products` | CRUD, search, pagination |
| Categories | `/api/categories` | CRUD |
| Inventory | `/api/inventory` | Per-store stock, adjustments, transfers |
| Orders | `/api/orders` | Create, complete, void |
| Shifts | `/api/shifts` | Open/close register, Z-reports |
| Sync | `/api/sync` | Push mutations, pull events (offline) |
| Reports | `/api/reports` | Dashboard, audit logs |
| Stores | `/api/stores` | Multi-store management, org settings |
| Users | `/api/users` | User provisioning (OrgAdmin) |
| Customers | `/api/customers` | Customer lookup and creation |
| Supplies | `/api/supplies` | Ingredients, supply receiving, logs |
| Recipes | `/api/products/{id}/recipe` | Bill of materials per product |
| Platform | `/api/platform` | Tenant provisioning (SuperAdmin) |
| Plans | `/api/plans` | Subscription plans |
| Subscription | `/api/subscription` | Org billing & plan changes |
| Storage | `/api/storage` | Payment slip uploads |

## Frontend Monorepo

### Packages

**`@pos/api-client`** — Typed fetch wrapper with JWT token management in `localStorage`. All API methods return unwrapped `data` from the `ApiResponse<T>` envelope.

**`@pos/offline-sync`** — Dexie-based IndexedDB for product caching and an outbox queue for offline orders. Provides `syncPush`/`syncPull` and `useOnlineStatus`/`usePendingSyncCount` hooks.

**`@pos/ui`** — Tailwind CSS v4 shared components: Button, Input, Card, Modal, Table, Badge, Select, plus theme toggle.

### Apps

**POS Terminal** (`apps/pos-terminal`)
- Touch-friendly full-screen layout
- Store selection at login
- Shift open/close gate before selling
- Product grid with search and barcode scan
- Cart with cash/card checkout
- Receipt view with print support
- Offline mode with pending sync badge
- PWA manifest for installable kiosk use

**Admin Portal** (`apps/admin-portal`)
- Sidebar navigation with protected routes
- Dashboard with sales KPIs
- Products and categories CRUD
- Inventory view with stock adjustments
- Store management and stock transfers
- Audit log viewer
- User creation (OrgAdmin role)

## Authentication Flow

1. Client POSTs credentials to `/api/auth/login`
2. Server returns JWT access token, refresh token, user profile, roles, and accessible stores
3. Client stores token in `localStorage` and attaches `Authorization: Bearer` header
4. POS terminal additionally requires a selected store and open shift

## Offline Sync Strategy

When the POS terminal loses connectivity:

1. Products are served from IndexedDB cache
2. New orders are queued in the outbox with idempotency keys
3. On reconnect, `syncPush` sends queued mutations; `syncPull` fetches server events and refreshes the product cache

## Real-time

A SignalR hub at `/hubs/pos` is available for live updates (inventory changes, order notifications). Frontend integration is prepared via the API client infrastructure.

## Multi-tenancy

All data is scoped to an organization. Users belong to an organization and may have access to one or more stores based on their role.
