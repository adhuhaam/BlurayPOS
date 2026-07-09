# Frontend environment (dev vs production)

**Single source of truth** for all Vite apps. Each app’s `vite.config.ts` sets `envDir` to this folder.

| File | Committed | Used when |
|------|-----------|-----------|
| `.env.development` | Yes | `npm run dev` (local PC) |
| `.env.production` | Yes | `npm run build` / deploy to droplet |
| `.env.development.local` | No (gitignored) | Optional LAN overrides on your machine |

## URLs

| Variable | Development | Production |
|----------|-------------|------------|
| `VITE_API_URL` | *(empty → Vite proxy)* | `https://api.bluraymaldives.site` |
| `VITE_OFFICE_URL` | `http://localhost:5174` | `https://office.bluraymaldives.site` |
| `VITE_POS_URL` | `http://localhost:5173` | `https://pos.bluraymaldives.site` |
| `VITE_MARKETING_URL` | `http://localhost:5175` | `https://bluraymaldives.site` |
| `VITE_COUPONS_URL` | `http://localhost:5176` | `https://coupons.bluraymaldives.site` |
| `VITE_MENU_URL` | `http://localhost:5178` | `https://menu.bluraymaldives.site` |
| `VITE_ORDER_URL` | `http://localhost:5177` | `https://order.bluraymaldives.site` |

## Rules

1. **Never** put `VITE_*` URLs in repo-root `.env` — that file is for server secrets (DB, JWT) on the droplet only.
2. **Never** add `frontend/apps/*/.env.local` — it overrides production builds. Use `frontend/env/.env.development.local` instead.
3. **Deploy**: `bash scripts/push-to-droplet.sh` runs `deploy-production.sh`, which calls `npm run build:production` (uses `.env.production` automatically).
