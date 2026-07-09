# BlurayPOS Marketing Site (`bluraymaldives.site`)

> **Canonical memory** for the public marketing / SaaS homepage.  
> **App path:** `frontend/apps/marketing-site/`  
> **Workspace:** `@pos/marketing-site`  
> **Last updated:** July 2026

---

## 1. Purpose

The marketing site is the **public-facing homepage** for BlurayPOS in the Maldives. It:

- Markets the product vision: **“Free POS. For life.”**
- Showcases the **handheld POS terminal** (Pro plan hardware)
- Lists **live plan pricing** and limits from the API
- Shows **real customer stores** registered on the platform
- Drives registration to **Office** (`/register`)

It is **not** the Office app or POS app — it is a standalone Vite + React SPA.

---

## 2. URLs & deployment

| Environment | URL | Notes |
|-------------|-----|-------|
| Local dev | http://localhost:5175 | Vite, `host: true` for LAN |
| LAN dev | http://\<machine-ip\>:5175 | e.g. `192.168.18.58:5175` |
| Production | https://bluraymaldives.site | Static files at `/var/www/bluraypos/landing/` |

### Production deploy path

```bash
# From dev machine (sync + deploy on droplet)
scripts/push-to-droplet.sh

# Or on server
scripts/deploy-production.sh
# → npm run build -w @pos/marketing-site
# → rsync apps/marketing-site/dist/ → /var/www/bluraypos/landing/
```

### Droplet (production)

| Item | Value |
|------|-------|
| IP | `161.35.5.82` |
| Landing path | `/var/www/bluraypos/landing/` |
| Office | `office.bluraymaldives.site` |
| API | `api.bluraymaldives.site` |
| POS PWA | `pos.bluraymaldives.site` |

---

## 3. Local development

### Quick start

```bash
# Terminal 1 — API + DB (Docker)
./scripts/dev-all.sh
# or API only: ./scripts/ensure-dev-api.sh

# Frontends start automatically with dev-all.sh; or separately:
cd frontend && npm run dev
# Marketing: :5175 | Admin: :5174 | POS: :5173
```

### Environment (`frontend/apps/marketing-site/.env.local`)

```env
# Empty = use Vite proxy to API (recommended for LAN + no CORS)
VITE_API_URL=
VITE_OFFICE_URL=http://localhost:5174
VITE_POS_URL=http://localhost:5173
```

Production `.env` should use full URLs:

```env
VITE_API_URL=https://api.bluraymaldives.site
VITE_OFFICE_URL=https://office.bluraymaldives.site
VITE_POS_URL=https://pos.bluraymaldives.site
```

### Vite proxy

`vite.config.ts` proxies `/api` → `http://localhost:${DEV_API_PORT}` (default **5147**; see `.dev-api-port`). See [DEV_ENVIRONMENT.md](./DEV_ENVIRONMENT.md).

---

## 4. Page structure (section order)

```
Header (sticky nav)
  ↓
Hero                    — vision, device image, CTAs
CustomersSection        — live stores from API (#customers)
StatsBar                — live counts + plan prices
PosTerminalSection      — handheld terminal deep dive (#terminal)
PlatformFeatures        — software features (#features)
TerminalWorkflow        — order → bill → print flow demo
OnboardingSection       — register & setup timeline (#get-started)
PlansSection            — Free vs Pro from API (#plans)
ValueProps              — trust pillars
CtaBanner               — final register CTA
Footer
```

### Header navigation

| Link | Anchor |
|------|--------|
| Terminal | `#terminal` |
| Customers | `#customers` |
| Features | `#features` |
| Get Started | `#get-started` |
| Plans | `#plans` |
| Register | `links.officeRegister` |

---

## 5. Live data integration

### API endpoints (public, no auth)

| Endpoint | Purpose |
|----------|---------|
| `GET /api/public/marketing` | **Primary** — plans + customers + stats |
| `GET /api/plans` | Fallback if marketing endpoint unavailable |

### `PublicMarketingDto` response

```json
{
  "plans": [ /* PlanDto[] */ ],
  "customers": [ /* PublicCustomerDto[] */ ],
  "stats": {
    "organizationCount": 0,
    "storeCount": 0,
    "proCount": 0,
    "freeCount": 0
  }
}
```

### `PublicCustomerDto` (per store)

| Field | Source |
|-------|--------|
| `storeName` | `Store.Name` |
| `address` | `Store.Address` or `Organization.Address` |
| `organizationName` | `Organization.Name` |
| `planName` / `planSlug` | `Subscription.Plan` |
| `currency` | `Organization.Currency` |
| `memberSince` | `Organization.CreatedAt` |

**Excluded from public list:** `slug = "demo"`, suspended organizations.

### Frontend data layer

| File | Role |
|------|------|
| `src/context/MarketingContext.tsx` | `MarketingProvider` + `useMarketing()` hook |
| `src/lib/planUtils.ts` | `formatLimit`, `formatMvr`, `getPlanBySlug`, `accentFromId` |
| `packages/api-client` | `api.getPublicMarketing()`, types |

**Fallback:** If `/api/public/marketing` fails, context loads `/api/plans` only (customers empty).

### Backend implementation

| File | Role |
|------|------|
| `Pos.Api/Controllers/PublicController.cs` | `[AllowAnonymous] GET /api/public/marketing` |
| `Pos.Application/Features/Public/MarketingHandlers.cs` | MediatR query |
| `Pos.Infrastructure/Services/PublicMarketingService.cs` | DB queries |
| `Pos.Application/DTOs/Dtos.cs` | `PublicMarketingDto`, `PublicCustomerDto`, etc. |

### Plan bootstrap (all environments)

`DataSeeder.BootstrapPlansAsync()` runs on **every API startup** (not only Development) so production always has canonical Free + Pro plans.

---

## 6. Canonical plan data (system seed)

| Plan | Slug | Yearly | Key limits |
|------|------|--------|------------|
| Free | `free` | MVR 0 | 1 branch, 3 users, 25 products, 200 orders/mo |
| Pro | `pro` | **MVR 14,999** | 100,000 threshold = “Unlimited” |

Pro includes **handheld POS terminal hardware** (marketing). Free uses **Android POS app** on phone/tablet.

Module flags (`hasInventory`, `hasKitchen`, etc.) come from `PlanDto` and render in the comparison table.

---

## 7. Handheld POS terminal — marketing truth

**Critical:** The physical terminal is **not a payment device**. Marketing copy must reflect:

| ✅ Say | ❌ Do not say |
|--------|----------------|
| Handheld, lightweight, easy to use | NFC / tap-to-pay / contactless on device |
| Built-in **58mm bill & receipt printer** | Accept card/cash payments on hardware |
| Take orders, build bills, print receipts | Payment hardware built into terminal |
| Cloud sync to Office | Rugged payment terminal |

Payments (cash, transfer, etc.) are handled in **POS software** — not marketed as terminal hardware capability.

### Terminal spec cards (PosTerminalSection)

1. 5.5" HD Touchscreen  
2. Built-in 58mm Printer  
3. Lightweight & Handheld  
4. Easy to Use  
5. Android 13/14  
6. All-Day Battery  
7. Cloud Connected  
8. Barcode Scanner  

---

## 8. Components reference

| Component | File | Notes |
|-----------|------|-------|
| Hero | `Hero.tsx` | Dark gradient, particles, “Free POS. For life.” |
| HeroShowcase | `HeroShowcase.tsx` | Device PNG, tilt, floating stats |
| HeroAnimationLayer | `HeroAnimationLayer.tsx` | Grid, aurora, beam |
| ParticleOverlay | `ParticleOverlay.tsx` | Dots, glow, twinkles |
| ShimmerText | `ShimmerText.tsx` | Animated headline accent |
| CustomersSection | `CustomersSection.tsx` | Live stores grid |
| StatsBar | `StatsBar.tsx` | Live stats from API |
| PosTerminalSection | `PosTerminalSection.tsx` | Terminal specs + image |
| PlatformFeatures | `PlatformFeatures.tsx` | 9 software features |
| TerminalWorkflow | `TerminalWorkflow.tsx` | 4-step bill/print demo |
| OnboardingSection | `OnboardingSection.tsx` | 6-step register timeline |
| PlansSection | `PlansSection.tsx` | Cards + comparison table |
| ValueProps | `ValueProps.tsx` | Secure, cloud, reports, support |
| CtaBanner | `CtaBanner.tsx` | Final dark CTA |
| Header / Footer | `Header.tsx`, `Footer.tsx` | Nav + links |
| Logo | `Logo.tsx` | `logo.png` + SVG variants |
| MaldivesFlag | `MaldivesFlag.tsx` | Official Wikimedia SVG |

### Public assets (`public/`)

| Asset | Purpose |
|-------|---------|
| `hero-devices.png` | Handheld terminal + laptop (transparent PNG) |
| `logo.png` | 3D B brand mark |
| `logo.svg`, `logo-mark.svg` | Vector logos |
| `maldives-flag.svg` | Official flag geometry |
| `favicon.svg` | Tab icon |

### Styling

- **Theme:** shadcn/ui + Geist font + oklch tokens (`src/index.css`)
- **Hero gradient:** black → navy `#0b1f6d` → blue `#1a4fd6`
- **Animations:** float, aurora, particles, shimmer, receipt-print, scroll-reveal (`Reveal.tsx`)
- **Reduced motion:** all animations respect `prefers-reduced-motion`

---

## 9. Brand & copy

| Element | Value |
|---------|-------|
| Core vision label | “Our core vision” |
| Headline | “Free POS.” + shimmer “For life.” |
| Core promise | Free plan stays **free for life** |
| Domain | bluraymaldives.site |
| Register URL | `office.bluraymaldives.site/register` |
| Currency | MVR (Maldives Rufiyaa) |

---

## 10. Removed / deprecated

| Item | Reason |
|------|--------|
| `HardwareBar.tsx` | Replaced by `CustomersSection` |
| `SignupAndPlans.tsx` | Split into `OnboardingSection` + `PlansSection` |
| `GetStarted.tsx` | Renamed/replaced by `OnboardingSection` |
| `src/data/customers.ts` | Static placeholders — now live API |
| NFC / payment hardware claims | Terminal does not process payments |

---

## 11. Known issues & ops notes

1. **API rebuild** after backend changes: `docker build -t bluraypos-api:latest . && ./scripts/ensure-dev-api.sh --rebuild`
2. **Empty customers section** — API unreachable or wrong proxy port; check `.dev-api-port` (5147 or 5148)
3. **Deploy** — `bash scripts/push-to-droplet.sh` (manual; GitHub Actions removed July 2026)
4. **Multiple Docker API containers** — run `./scripts/cleanup-stale-docker-api.sh`; see [DEV_ENVIRONMENT.md](./DEV_ENVIRONMENT.md)
5. **Production plans** — ensured by `BootstrapPlansAsync` on startup; full demo seed only in Development
6. **Demo stores** — included in public marketing API (no longer excluded)

---

## 12. Build commands

```bash
cd frontend
npm run dev -w @pos/marketing-site      # dev server :5175
npm run build -w @pos/marketing-site    # production build → dist/
```

---

## 13. Related memory-plan files

| File | Relevance |
|------|-----------|
| [DEV_ENVIRONMENT.md](./DEV_ENVIRONMENT.md) | Local API ports, Docker, scripts |
| [DEVELOPMENT_HANDOFF.md](./DEVELOPMENT_HANDOFF.md) | Full project memory, demo creds, session history |
| [PRODUCTION_INFRASTRUCTURE.md](./PRODUCTION_INFRASTRUCTURE.md) | Droplet, nginx, SSL |
| [deployment.md](./deployment.md) | Deploy checklist |
| [SAAS_REQUIREMENTS.md](./SAAS_REQUIREMENTS.md) | Product spec, billing |
| [TERMINOLOGY.md](./TERMINOLOGY.md) | Store vs Branch naming |

---

*Update this file when marketing sections, API contracts, terminal messaging, or deploy paths change.*
