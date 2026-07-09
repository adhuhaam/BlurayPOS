# BlurayPOS — Memory & Plan

> **Living project memory.** When you add a feature, change architecture, or update production plans, **edit these files first** (or in the same PR) so Cursor and future sessions stay aligned.

## How to use with Cursor

At the start of a session, tell the agent:

> Read `memory-plan/DEVELOPMENT_HANDOFF.md`, `memory-plan/PROJECT_STRUCTURE.md`, `memory-plan/DEV_ENVIRONMENT.md`, and `memory-plan/SAAS_REQUIREMENTS.md` for context. Follow `memory-plan/DEVELOPMENT_ROADMAP.md` for what to build next.

When you change the plan:

1. Update the relevant spec file below (or add a new one here).
2. Update `DEVELOPMENT_ROADMAP.md` status (🟢 / 🟡 / 🔲).
3. Add a short note to `DEVELOPMENT_HANDOFF.md` § session history if it was a major decision.

## File index

| File | Purpose |
|------|---------|
| [DEVELOPMENT_HANDOFF.md](./DEVELOPMENT_HANDOFF.md) | **Start here** — full project memory, setup, session history |
| [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) | **Repo map** — backend layers, frontend apps, Android, ports |
| [SAAS_REQUIREMENTS.md](./SAAS_REQUIREMENTS.md) | Canonical product spec (roles, modules, billing) |
| [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) | Phased delivery tracker |
| [TERMINOLOGY.md](./TERMINOLOGY.md) | Product language ↔ code names |
| [architecture.md](./architecture.md) | Technical architecture & production topology |
| [deployment.md](./deployment.md) | Production deployment checklist |
| [PRODUCTION_INFRASTRUCTURE.md](./PRODUCTION_INFRASTRUCTURE.md) | DigitalOcean hosting plan (canonical infra) |
| [ANDROID_MASTER_PLAN.md](./ANDROID_MASTER_PLAN.md) | Native Android product spec |
| [TERMINAL_APP.md](./TERMINAL_APP.md) | Android dev setup & implementation status |
| [GST_MALDIVES.md](./GST_MALDIVES.md) | Maldives GST / MIRA (future) |
| [MARKETING_SITE.md](./MARKETING_SITE.md) | **Public homepage** — bluraymaldives.site, live API, terminal copy |
| [TABLE_ORDERS.md](./TABLE_ORDERS.md) | **Restaurant table orders** — assign table, kitchen, bill, pay |
| [INDUSTRY_MODES.md](./INDUSTRY_MODES.md) | Restaurant / Retail / Hybrid tenant modes |
| [COUPON_SYSTEM.md](./COUPON_SYSTEM.md) | **Coupons & promotions** — LuckyQR-inspired plan, domain model, phases |
| [OFFICE_MODULES.md](./OFFICE_MODULES.md) | **Office sidebar & plan modules** — subdomain links, plan flags, env vars |
| [DEV_ENVIRONMENT.md](./DEV_ENVIRONMENT.md) | **Local dev** — ports, Docker, scripts, keep stack running |
| [../docs/apk releases/README.md](../docs/apk%20releases/README.md) | **Android APK archive** — signed production releases |
| [master-plan.md](./master-plan.md) | Extended requirements archive |

## Read order (new machine or agent)

1. `DEVELOPMENT_HANDOFF.md`
2. `PROJECT_STRUCTURE.md` — repo map & stack
3. `DEV_ENVIRONMENT.md` — local API/frontends/Docker
4. `SAAS_REQUIREMENTS.md`
5. `DEVELOPMENT_ROADMAP.md`
6. `TERMINOLOGY.md`
7. Area-specific: `OFFICE_MODULES.md`, `COUPON_SYSTEM.md`, `MARKETING_SITE.md`, `INDUSTRY_MODES.md`, `TABLE_ORDERS.md`, `ANDROID_MASTER_PLAN.md`, `PRODUCTION_INFRASTRUCTURE.md`, etc.

---

*Formerly `docs/`. Renamed to `memory-plan` so plans and memory stay in one obvious place.*
