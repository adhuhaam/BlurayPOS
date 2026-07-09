# Agent instructions (BlurayPOS)

Before implementing features or architectural changes:

1. Read [memory-plan/DEVELOPMENT_HANDOFF.md](memory-plan/DEVELOPMENT_HANDOFF.md), [memory-plan/PROJECT_STRUCTURE.md](memory-plan/PROJECT_STRUCTURE.md), [memory-plan/DEV_ENVIRONMENT.md](memory-plan/DEV_ENVIRONMENT.md), and [memory-plan/SAAS_REQUIREMENTS.md](memory-plan/SAAS_REQUIREMENTS.md).
2. For **Office sidebar / plan modules / coupons**, also read [memory-plan/OFFICE_MODULES.md](memory-plan/OFFICE_MODULES.md) and [memory-plan/COUPON_SYSTEM.md](memory-plan/COUPON_SYSTEM.md).
3. Check [memory-plan/DEVELOPMENT_ROADMAP.md](memory-plan/DEVELOPMENT_ROADMAP.md) for phase status and next items.
4. Follow [memory-plan/TERMINOLOGY.md](memory-plan/TERMINOLOGY.md) for product vs code naming.
5. **Keep dev running:** `./scripts/ensure-dev-api.sh` then `./scripts/dev-all.sh` (or existing frontend terminal). Preferred API: **http://localhost:5147** — if blocked by a stale container, check **`.dev-api-port`** (often `5148`).

After shipping a feature or changing the plan:

- Update the relevant file under **`memory-plan/`** (spec, roadmap status, handoff notes).
- See [memory-plan/README.md](memory-plan/README.md) for the file index.
