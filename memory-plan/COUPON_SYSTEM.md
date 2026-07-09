# Coupon System — Product & Technical Plan

> **Canonical plan** for store-scoped coupons and promotional campaigns in BlurayPOS.  
> **Inspired by:** [LuckyQR](https://github.com/adhuhaam/LuckyQR) (Bluray Maldives lucky-draw QR campaign).  
> **Aligns with:** [SAAS_REQUIREMENTS.md](./SAAS_REQUIREMENTS.md) § Promotions & Discounts Engine, Loyalty Module.  
> **Status:** 🟡 Phase 1 complete — campaign CRUD, batch QR generation, print sheet, CSV export, code management, winners, public scan/enter. POS redemption 🔲 Phase 2.  
> **Last updated:** July 2026

---

## 1. Executive summary

BlurayPOS stores need a **coupon system** that supports:

1. **Manager-defined promotions** — percentage off, fixed amount, BOGO, category/item rules, time windows, branch scope.
2. **Coupon codes** — human-enterable codes (`BR-7F3K9A`) and QR-linked tokens for print campaigns.
3. **POS redemption** — cashier applies a valid coupon at checkout; discount flows into existing `Order.DiscountAmount` with audit trail.
4. **Optional public claim flow** — customer scans QR (LuckyQR-style), enters phone, receives a redeemable coupon tied to their profile.

LuckyQR is a **marketing lucky-draw app**, not a POS. It gives us proven patterns for QR batches, dual identifiers, scan analytics, and anti-abuse — but BlurayPOS must add **multi-tenant isolation**, **monetary discount math**, **expiry/usage limits**, and **register redemption**.

**Recommended delivery:** Phase A (core coupons + POS apply) → Phase B (campaigns + QR batches) → Phase C (public claim + gamification hooks).

---

## 2. LuckyQR study — what it is

[LuckyQR](https://github.com/adhuhaam/LuckyQR) is a Laravel 12 app: **BLURAY MALDIVES – LUCKYDRAW**. Each physical QR sticker maps to a database row. Customers scan → enter name/phone → participate in a draw. Some stickers can be pre-marked winners.

### 2.1 LuckyQR domain model

| Entity | Purpose | Key fields |
|--------|---------|------------|
| `QrCode` | Physical sticker / token | `code` (26-char ULID URL token), `lucky_id` (human code e.g. `BR-7F3K9A`), `location_hint`, `prize_id`, `is_winner`, `status` |
| `Prize` | Offer definition | `title`, `value_amount`, `value_currency` (MVR), `status` |
| `Entry` | Customer participation | `qr_code_id`, `name`, `phone`, `consent` |
| `Scan` | Analytics on every page load | `qr_code_id`, `ip`, `user_agent`, `referrer` |
| `Winner` | Fulfillment record | `qr_code_id`, `entry_id`, `prize_id`, `announced_at` |
| `Game` / `GameSession` | Optional minigame gate | score, attempts, `qualified_for_prize` |

**No coupon/discount/redeem models exist.** Terms mention 30-day claim windows — policy text only, not enforced in code.

### 2.2 LuckyQR flows (implemented vs stub)

| Flow | Status |
|------|--------|
| Public scan → entry form → thanks page | ✅ Implemented |
| QR PNG generation (`/qr/{code}.png`, cached) | ✅ Implemented |
| Batch code generation CLI (`codes:generate`) | ✅ Implemented |
| Rate limiting, honeypot, one entry per phone per QR | ✅ Implemented |
| Admin dashboard stats | ✅ Implemented |
| Admin CRUD (prizes, winners, export) | 🔲 Empty controller stubs |
| Game play UI | 🔲 Missing views |
| POS / checkout integration | ❌ None |
| Multi-tenant | ❌ Single-tenant campaign app |

### 2.3 Patterns worth adopting for BlurayPOS

| Pattern | LuckyQR | BlurayPOS mapping |
|---------|---------|-------------------|
| **Dual identifier** | `code` (opaque) + `lucky_id` (human) | `CouponToken.InternalCode` + `CouponToken.DisplayCode` |
| **Scan vs commit** | `Scan` (every visit) vs `Entry` (submitted) | `CouponLookupEvent` vs `CouponRedemption` |
| **Pre-assigned outcome** | `is_winner` + `prize_id` on sticker | Instant-win batch codes with fixed promotion |
| **Batch metadata** | `location_hint` on bulk generate | `CampaignBatch` with branch/campaign/store tags |
| **Anti-abuse** | Rate limit, honeypot, phone uniqueness | Reuse for public claim pages + API throttling |
| **Phone normalization** | Default `+960` Maldives | Tenant-configurable locale (Maldives first) |
| **Prize as offer catalog** | `Prize` with MVR value + lifecycle | `Promotion` entity with discount rules |
| **On-demand QR PNG** | Cached render endpoint | Admin print sheet + public scan URLs |
| **Audit log schema** | Polymorphic admin actions | Extend existing `AuditLog` in BlurayPOS |

### 2.4 Gaps LuckyQR does not solve (BlurayPOS must build)

- Row-level **tenant isolation** (`OrganizationId` on every row)
- **Discount types** — %, fixed, BOGO, category/item scoping
- **Expiry**, **max uses**, **min order value**, **stacking rules**
- **POS apply/validate API** at checkout
- **Order linkage** — which sale consumed which coupon
- **Permission gating** — `Sale.Discount` vs coupon-specific permissions
- **GST impact** — discount before/after tax (see [GST_MALDIVES.md](./GST_MALDIVES.md))
- **Plan feature flag** — coupons on Pro/Basic tiers

---

## 3. BlurayPOS current state

| Area | Today | Gap |
|------|-------|-----|
| Order discounts | Manual `DiscountAmount` on order/lines | No code-based rules |
| Permissions | `Sale.Discount` enforced in handlers | No `Promotion.*` permissions |
| Customer | `Customer` entity + `LoyaltyPoints` field | No coupon wallet |
| Roadmap | Item #24 Promotions engine 🔲, #34 Loyalty 🔲 | Coupons bundled in loyalty phase |
| POS UI | Discount amount hardcoded `0` in create flow | No coupon entry field |
| Android | Not built for coupons | Future parity with web POS |

**Existing order math** (`SalesHandlers.cs`):

- Line subtotal = `unitPrice × qty − lineDiscount`
- Order total = `subtotal + tax − orderDiscount`
- Discounts require `Sale.Discount` permission

Coupons should **compute** the discount server-side and write the result to `DiscountAmount` (or a dedicated `CouponDiscountAmount` field for reporting clarity).

---

## 4. Product vision

### 4.1 Coupon types (Phase A–C)

| Type | Description | Example |
|------|-------------|---------|
| **Code coupon** | Manager creates a shared or limited-use code | `SUMMER20` — 20% off |
| **Unique token** | One code per customer/sticker (LuckyQR-style) | `BR-7F3K9A` — pre-assigned 100 MVR off |
| **Auto-applied promotion** | Rule matches cart (no code entry) | Happy hour 15% on drinks category |
| **Customer-bound** | Linked to `CustomerId` after claim | Birthday reward for Ahmed |
| **Loyalty-issued** | Generated when points redeemed | Future — Phase C+ |

### 4.2 Discount rule types (align with SAAS_REQUIREMENTS)

- Percentage off (order or line)
- Fixed amount off (order or line)
- Buy X Get Y (Phase B)
- Category / product restrictions
- Minimum order value
- Maximum discount cap
- Branch-specific (`StoreId` scope)
- Time-based (start/end, days of week, happy hour)

### 4.3 Stacking & priority

When multiple promotions could apply:

1. **Coupon code** (explicit user/cashier intent) — highest priority unless configured otherwise
2. **Auto promotions** — evaluated by priority number (lower = first)
3. **Manual discount** — manager override; cannot stack with coupon unless role allows `Sale.Discount` override

**Rule:** At most **one coupon code** per order. Auto promotions may combine only if `AllowStacking` is true on both (default: false).

Document conflicts in admin UI when creating overlapping promotions.

---

## 5. Domain model

All entities extend `TenantEntity` → scoped by `OrganizationId`. Branch-scoped records also carry `StoreId` where applicable.

### 5.1 Entity diagram

```
Organization (Store / tenant)
└── PromotionCampaign          ← marketing wrapper (optional)
      └── Promotion            ← discount rule definition
            └── CouponBatch    ← print run / QR batch (optional)
                  └── Coupon   ← individual code or token
                        ├── CouponLookupEvent   ← scan/validate attempts
                        └── CouponRedemption    ← consumed on order

Order
└── CouponRedemption (FK)      ← links sale to coupon used
```

### 5.2 `PromotionCampaign` (optional grouping)

| Field | Type | Notes |
|-------|------|-------|
| `Id` | Guid | PK |
| `OrganizationId` | Guid | Tenant |
| `Name` | string | e.g. "Ramadan 2026" |
| `Description` | string? | Internal notes |
| `Status` | enum | `Draft`, `Active`, `Paused`, `Ended` |
| `StartsAt` / `EndsAt` | DateTime? | Campaign window |
| `CreatedByUserId` | Guid | Audit |

### 5.3 `Promotion` (core offer definition)

| Field | Type | Notes |
|-------|------|-------|
| `Id` | Guid | PK |
| `OrganizationId` | Guid | Tenant |
| `CampaignId` | Guid? | Optional parent |
| `Name` | string | "20% off all drinks" |
| `Type` | enum | `Percentage`, `FixedAmount`, `BuyXGetY`, `FreeItem` |
| `Value` | decimal | % (0–100) or fixed MVR |
| `MaxDiscountAmount` | decimal? | Cap for % discounts |
| `MinOrderAmount` | decimal? | Minimum subtotal |
| `Scope` | enum | `Order`, `Line`, `Category`, `Product` |
| `ScopeIds` | jsonb | Category/product IDs when scoped |
| `StoreIds` | jsonb? | null = all branches |
| `StartsAt` / `EndsAt` | DateTime? | |
| `DaysOfWeek` | int? | Bitmask Mon–Sun |
| `TimeStart` / `TimeEnd` | TimeOnly? | Happy hour |
| `RequiresCode` | bool | false = auto-apply |
| `SharedCode` | string? | e.g. `SUMMER20` (unique per org) |
| `MaxRedemptionsTotal` | int? | Global limit |
| `MaxRedemptionsPerCustomer` | int? | |
| `Priority` | int | Lower = evaluated first |
| `AllowStacking` | bool | Default false |
| `Status` | enum | `Draft`, `Active`, `Paused`, `Archived` |

### 5.4 `CouponBatch` (LuckyQR batch equivalent)

| Field | Type | Notes |
|-------|------|-------|
| `Id` | Guid | PK |
| `OrganizationId` | Guid | |
| `PromotionId` | Guid | All codes in batch share this offer |
| `Name` | string | e.g. "Sticker run – Malé stores" |
| `Prefix` | string | Display code prefix, default org slug e.g. `BR-` |
| `Quantity` | int | Codes generated |
| `LocationHint` | string? | LuckyQR `location_hint` equivalent |
| `StoreId` | Guid? | Branch where stickers deployed |
| `CreatedAt` | DateTime | |

### 5.5 `Coupon` (individual code / token)

| Field | Type | Notes |
|-------|------|-------|
| `Id` | Guid | PK |
| `OrganizationId` | Guid | |
| `PromotionId` | Guid | Offer applied when redeemed |
| `BatchId` | Guid? | Optional batch |
| `InternalCode` | string(26) | Opaque URL token (ULID) — QR payload |
| `DisplayCode` | string(16) | Human code — POS entry & support |
| `CustomerId` | Guid? | Set after public claim or manual assign |
| `Status` | enum | `Active`, `Claimed`, `Redeemed`, `Expired`, `Voided` |
| `MaxUses` | int | Default 1 for unique tokens; N for multi-use |
| `UsedCount` | int | |
| `ExpiresAt` | DateTime? | |
| `PreAssigned` | bool | LuckyQR `is_winner` — instant fixed outcome |
| `ClaimedAt` | DateTime? | |
| `Notes` | string? | Admin |

**Indexes:** unique `(OrganizationId, DisplayCode)`, unique `(OrganizationId, InternalCode)`, `(OrganizationId, SharedCode)` on Promotion.

### 5.6 `CouponLookupEvent` (LuckyQR `Scan`)

| Field | Type | Notes |
|-------|------|-------|
| `Id` | Guid | |
| `CouponId` | Guid | |
| `Source` | enum | `PublicQr`, `PosValidate`, `AdminPreview` |
| `IpAddress` | string? | |
| `UserAgent` | string? | |
| `TerminalId` | Guid? | POS device |
| `CreatedAt` | DateTime | |

### 5.7 `CouponRedemption`

| Field | Type | Notes |
|-------|------|-------|
| `Id` | Guid | |
| `OrganizationId` | Guid | |
| `CouponId` | Guid | |
| `PromotionId` | Guid | Snapshot |
| `OrderId` | Guid | |
| `CustomerId` | Guid? | |
| `DiscountApplied` | decimal | MVR actually deducted |
| `RedeemedByUserId` | Guid | Cashier |
| `StoreId` | Guid | Branch |
| `RedeemedAt` | DateTime | |

**Immutable after order complete.** Void order → mark redemption `Reversed` (new status or soft-delete with audit).

### 5.8 Order extension

Add to `Order`:

| Field | Type | Notes |
|-------|------|-------|
| `CouponRedemptionId` | Guid? | FK when coupon applied |
| `PromotionId` | Guid? | Denormalized for reports |
| `CouponDisplayCode` | string? | Snapshot for receipt |

Keep `DiscountAmount` as the **total** discount; optionally add `CouponDiscountAmount` for reporting split from manual discounts.

---

## 6. Business rules

### 6.1 Validation (validate before apply)

A coupon/promotion is **valid** when all pass:

1. `OrganizationId` matches current tenant
2. `Status` = `Active` (coupon + promotion + campaign)
3. Within `StartsAt` / `EndsAt` (promotion + coupon)
4. `UsedCount < MaxUses`
5. Branch allowed (`StoreIds` null or contains current branch)
6. `MinOrderAmount` met (on current cart subtotal)
7. Scope matches (category/product lines exist)
8. Customer limits not exceeded (`MaxRedemptionsPerCustomer`)
9. Global promotion limit not exceeded
10. Not already redeemed on this order (idempotency)

Return structured errors: `Expired`, `NotFound`, `AlreadyUsed`, `MinOrderNotMet`, `WrongBranch`, `NotApplicable`.

### 6.2 Discount calculation

Server-side only — never trust client discount amount when coupon applied.

```
1. Load promotion rules for coupon
2. Filter applicable lines (scope)
3. Compute raw discount
4. Apply MaxDiscountAmount cap
5. Ensure discount ≤ subtotal (never negative total)
6. Round to 2 decimal places (MVR)
7. Return { discountAmount, affectedLineIds, receiptMessage }
```

**GST note:** Follow Maldives rules when implemented — typically discount reduces taxable base before GST calculation. Document in handler when GST module ships.

### 6.3 Redemption lifecycle

```
Active → (optional Claimed via public form) → Redeemed → (void order) → Active or Voided
Active → Expired (background job or check on validate)
Active → Voided (manager action)
```

Multi-use coupon: `UsedCount++` on each redemption until `MaxUses`.

### 6.4 Public claim flow (Phase B — LuckyQR-inspired)

```
GET  /c/{internalCode}     → landing + scan logged
POST /c/{internalCode}/claim  → name, phone, consent
     → normalize phone (+960)
     → rate limit (3 / 15 min / IP)
     → honeypot field
     → one claim per phone per coupon (unique tokens)
     → link Customer (find or create by phone)
     → Coupon.Status = Claimed
     → redirect to thanks with DisplayCode
```

Customer presents **DisplayCode** at POS, or cashier scans QR that resolves to same coupon.

### 6.5 Batch generation (LuckyQR CLI equivalent)

Admin action or API:

```
POST /api/promotions/{id}/batches
{ quantity: 500, prefix: "BR-", locationHint: "Café Central", storeId: "..." }
```

Generates `quantity` `Coupon` rows:

- `InternalCode` = uppercase ULID
- `DisplayCode` = prefix + random base36 (collision retry)
- `MaxUses` = 1, `Status` = Active

Export: CSV + printable PDF with QR images (PNG via server render, 1-year cache like LuckyQR).

---

## 7. User flows

### 7.1 Manager (Admin Office)

1. **Promotions list** — `/promotions` — filter by status, branch, date
2. **Create promotion** — wizard: type → rules → scope → schedule → code settings
3. **Generate batch** — for sticker campaigns; download print sheet
4. **View redemptions** — table: coupon, order #, branch, cashier, amount, date
5. **Void coupon** — invalidate before use
6. **Reports** — redemptions by campaign, ROI (discount given vs attributed sales)

**Permissions (new):**

| Code | Action |
|------|--------|
| `Promotion.View` | List promotions & stats |
| `Promotion.Create` | Create/edit promotions |
| `Promotion.Delete` | Archive/void |
| `Promotion.BatchGenerate` | Bulk QR/code generation |
| `Coupon.Redeem` | Apply at POS (may alias `Sale.Discount`) |

Default: `OrgAdmin`, `StoreManager` get full promotion CRUD; `Cashier` gets `Coupon.Redeem` + existing `Sale.Discount`.

### 7.2 Cashier (POS)

1. Build cart as today
2. Tap **Coupon** in action panel (requires `Sale.Discount` or `Coupon.Redeem`)
3. Enter **DisplayCode** or scan QR (camera / handheld scanner)
4. POS calls `POST /api/orders/{id}/apply-coupon` or validates on draft create
5. UI shows discount line + promotion name; customer display updates
6. On payment complete, redemption recorded atomically with order

**Remove coupon:** before payment only; restores `DiscountAmount`.

**Waiter role:** no coupon UI (same as manual discount today).

### 7.3 Customer (public — Phase B)

1. Scan sticker QR → mobile landing (tenant-branded subdomain or path)
2. See offer summary + `DisplayCode`
3. Submit claim form (phone required for Maldives campaigns)
4. Thank-you page: "Show code **BR-7F3K9A** at checkout"
5. Optional: SMS/Viber link (future marketing module)

**URL shape:** `https://{org-slug}.bluraymaldives.site/c/{internalCode}` or `https://bluraymaldives.site/c/{orgSlug}/{internalCode}`.

---

## 8. API design

Follow existing CQRS pattern (`Pos.Application/Features/Promotions/`).

### 8.1 Admin (authenticated)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/promotions` | List with filters |
| POST | `/api/promotions` | Create |
| GET | `/api/promotions/{id}` | Detail + stats |
| PUT | `/api/promotions/{id}` | Update |
| POST | `/api/promotions/{id}/pause` | Pause |
| POST | `/api/promotions/{id}/batches` | Generate coupon batch |
| GET | `/api/promotions/{id}/batches/{batchId}/export` | CSV/PDF |
| GET | `/api/coupons` | Search by code, status |
| POST | `/api/coupons/{id}/void` | Void single coupon |
| GET | `/api/coupon-redemptions` | Report |

### 8.2 POS (authenticated)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/orders/{id}/validate-coupon` | Preview discount `{ code }` |
| POST | `/api/orders/{id}/apply-coupon` | Apply `{ code }` → updates draft |
| DELETE | `/api/orders/{id}/coupon` | Remove applied coupon |

Include in `CreateOrderRequest` optional `couponCode` for one-shot apply on create (Android parity).

### 8.3 Public (anonymous, rate-limited)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/public/c/{internalCode}` | Offer preview + org branding |
| POST | `/api/public/c/{internalCode}/claim` | Claim form |
| GET | `/api/public/qr/{internalCode}.png` | QR image |

Public routes resolve org from coupon row — never accept `organizationId` from client.

---

## 9. UI surfaces

| App | Screens |
|-----|---------|
| **admin-portal** | Promotions list, promotion editor, batch generator, redemption report, coupon lookup |
| **pos-terminal** | Coupon modal (code entry + scan), applied coupon chip, discount breakdown |
| **marketing-site** | Optional tenant campaign landing template (Phase C) |
| **Android terminal** | Same coupon modal pattern as web POS |
| **Customer display** | Show promotion name + savings (SAAS_REQUIREMENTS § Customer Display) |

### POS coupon modal (sketch)

- Input: DisplayCode (large touch keyboard)
- Scan button (camera / external scanner)
- Preview: "20% off — saves MVR 24.00"
- Apply / Cancel
- Error states: expired, min order, already used

---

## 10. Integration points

| System | Integration |
|--------|-------------|
| **Orders** | `CouponRedemption` on complete; void reverses |
| **Customers** | Claim flow creates/links customer; per-customer limits |
| **Permissions** | New `Promotion.*`, reuse `Sale.Discount` |
| **Plans** | `Plan.HasPromotions` flag — Free: limited (e.g. 1 active promotion); Pro: unlimited + QR batches |
| **TenantFeatures** | `officePromotions`, `posCoupons` in `TenantFeaturesDto` |
| **Audit** | Log create/void/batch generate/redemption override |
| **SignalR** | Optional: customer display promotion banner |
| **Offline POS** | Phase C: cache active shared codes; validate unique tokens online only |
| **LuckyQR migration** | Optional import tool: `Prize` → `Promotion`, `QrCode` → `Coupon` batch for Bluray campaigns |

---

## 11. Security & anti-abuse

Adopt from LuckyQR:

- Rate limiting on public claim (3 attempts / 15 min / IP + coupon)
- Honeypot on public forms
- Phone uniqueness per unique coupon
- Log all lookup events

BlurayPOS-specific:

- Tenant isolation on every query
- Staff redemption requires auth + branch context
- Shared codes: optional PIN or customer phone verification for high-value offers
- No coupon enumeration — generic "invalid or expired" for wrong codes
- Idempotent redemption on order complete (same as payments)

---

## 12. Phased implementation

### Phase A — Core coupons (MVP)

**Goal:** Manager creates code promotions; cashier applies at POS.

| # | Task |
|---|------|
| A1 | Domain entities + EF migration |
| A2 | `Promotion` CRUD handlers + admin list/editor |
| A3 | Shared code coupons (`RequiresCode=true`, single `SharedCode` on promotion OR per-coupon row) |
| A4 | `validate-coupon` + `apply-coupon` on draft orders |
| A5 | POS coupon modal; show applied discount |
| A6 | `CouponRedemption` on order complete |
| A7 | Permissions seed: `Promotion.View`, `Promotion.Create`, `Promotion.Delete` |
| A8 | Unit tests: validation rules, discount math, expiry |

**Out of scope:** QR batches, public pages, BOGO, auto-apply.

### Phase B — Campaigns & QR batches (LuckyQR parity)

| # | Task |
|---|------|
| B1 | `PromotionCampaign` + `CouponBatch` |
| B2 | Batch generator + CSV/PDF export with QR PNGs |
| B3 | Unique tokens (`DisplayCode` + `InternalCode`) |
| B4 | Public claim pages (subdomain or path) |
| B5 | `CouponLookupEvent` analytics in admin |
| B6 | Customer auto-create on claim (phone) |
| B7 | Branch-scoped promotions |

### Phase C — Advanced engine

| # | Task |
|---|------|
| C1 | Auto-apply promotions (no code) |
| C2 | BOGO / Buy X Get Y |
| C3 | Happy hour / day-of-week rules |
| C4 | Stacking priority engine |
| C5 | Loyalty points → coupon issuance |
| C6 | Gamification hook (optional minigame before claim — LuckyQR `GameSession` pattern) |
| C7 | Offline shared-code cache for POS |
| C8 | Android parity |

---

## 13. Terminology

See [TERMINOLOGY.md](./TERMINOLOGY.md) — coupon module additions:

| Product term | Code entity | Notes |
|--------------|-------------|-------|
| Promotion | `Promotion` | Discount rule definition |
| Campaign | `PromotionCampaign` | Groups promotions (Ramadan, launch) |
| Coupon / code | `Coupon` | Redeemable token |
| Coupon batch | `CouponBatch` | Print run of unique codes |
| Display code | `Coupon.DisplayCode` | Human-enterable (LuckyQR `lucky_id`) |
| QR token | `Coupon.InternalCode` | Embedded in QR URL |
| Redemption | `CouponRedemption` | Use on an order |
| Scan / lookup | `CouponLookupEvent` | LuckyQR `Scan` equivalent |

**Permissions prefix:** `Promotion.*`, `Coupon.*`

---

## 14. Open questions

| # | Question | Recommendation |
|---|----------|----------------|
| 1 | Subdomain vs path for public claim? | **`coupons.bluraymaldives.site/s/{code}`** — global subdomain; Office links via [OFFICE_MODULES.md](./OFFICE_MODULES.md) |
| 2 | Split manual vs coupon discount on receipt? | Yes — `CouponDiscountAmount` + label on receipt |
| 3 | Can manager stack manual discount after coupon? | No by default; `OrgAdmin` override only |
| 4 | Import LuckyQR data? | One-time script for Bluray marketing campaigns |
| 5 | Free plan limits? | 1 active promotion, no QR batches until Pro |
| 6 | GST order of operations? | Defer to GST module; spec discount-before-tax |

---

## 15. Success metrics

- Time to create a promotion < 2 minutes
- POS coupon apply < 3 seconds (online)
- Zero cross-tenant coupon leaks (integration test required)
- Redemption report matches order discounts totals
- LuckyQR-style batch: 500 codes generated < 30 seconds

---

## 16. Related documents

| Doc | Relevance |
|-----|-----------|
| [SAAS_REQUIREMENTS.md](./SAAS_REQUIREMENTS.md) | Promotions engine, loyalty, customer display |
| [OFFICE_MODULES.md](./OFFICE_MODULES.md) | Office sidebar, subdomain map, plan flags |
| [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) | Items #24, #34 |
| [TERMINOLOGY.md](./TERMINOLOGY.md) | Product ↔ code naming |
| [INDUSTRY_MODES.md](./INDUSTRY_MODES.md) | Retail vs restaurant — same coupon engine |
| [GST_MALDIVES.md](./GST_MALDIVES.md) | Tax interaction |
| [LuckyQR repo](https://github.com/adhuhaam/LuckyQR) | Reference implementation for QR campaigns |

---

## 17. Reference — LuckyQR code generation

LuckyQR generates batches via Artisan:

```php
// codes:generate {count} --prefix=BR- --location="..."
$code = strtoupper(Str::ulid());
$luckyId = $prefix . strtoupper(base_convert(rand(100000, 999999), 10, 36));
```

BlurayPOS equivalent: `GenerateCouponBatchCommand` in `Pos.Application` or admin API, using `Guid` or ULID for `InternalCode` and configurable prefix from org slug.

---

*Phase A (Office + coupons-site) shipped. Update roadmap when POS apply (Phase 2) starts.*
