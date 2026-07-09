# Office — Plan Modules & Sidebar

> **Canonical reference** for how subscription-plan modules appear in the **Admin portal (Office)** sidebar and how plan flags are resolved on the frontend.  
> **Last updated:** July 2026  
> **Related:** [COUPON_SYSTEM.md](./COUPON_SYSTEM.md) · [SAAS_REQUIREMENTS.md](./SAAS_REQUIREMENTS.md) · [DEV_ENVIRONMENT.md](./DEV_ENVIRONMENT.md) · [INDUSTRY_MODES.md](./INDUSTRY_MODES.md)

---

## 1. Executive summary

Store **Managers** (`OrgAdmin`) and **Branch Managers** (`StoreManager`) use **Office** (`admin-portal`, port **5174**) for day-to-day operations. The sidebar **Modules** section lists **only modules included in the tenant’s subscription plan** and navigates to **in-portal routes** — no separate manager subdomains.

**Customer-facing** public sites (coupon QR scan, digital menu, online checkout) remain on their own subdomains for end customers; managers configure them from Office.

| Concern | Where it lives |
|---------|----------------|
| Open & manage a subscribed module | Sidebar → **Modules** → in-portal route |
| HR sub-pages (employees, payroll, …) | Sidebar → **Human Resources** section (when `HasHr`) |
| Which modules appear | Subscription plan flags + business type (`TenantFeatures`) |
| Super Admin plan editing | Platform → **Plans** |
| Preview public customer site | Links inside module pages (`moduleUrls` in `config.ts`) |

---

## 2. Subdomain & port map

### Production — customer-facing only

| Subdomain | App | Purpose |
|-----------|-----|---------|
| `office.bluraymaldives.site` | Admin portal | Store administration (all plan modules) |
| `pos.bluraymaldives.site` | POS terminal | Register / web POS |
| `bluraymaldives.site` | Marketing | Public homepage |
| `coupons.bluraymaldives.site` | Coupons site | Public QR scan / lucky-draw entry |
| `menu.bluraymaldives.site` | Online menu | Digital menu per store `{slug}` |
| `order.bluraymaldives.site` | Online order | Pickup/delivery checkout `{slug}` |
| `api.bluraymaldives.site` | API | REST + SignalR |

**Menu / order URL pattern:** `https://menu.bluraymaldives.site/{orgSlug}`  
**Coupons scan:** `https://coupons.bluraymaldives.site/s/{internalCode}`

### Local development

| Service | Port | Notes |
|---------|------|-------|
| Admin (Office) | 5174 | All plan modules in-portal |
| Coupons site (public) | 5176 | Customer QR entry |
| Online order (public) | 5177 | `{slug}` checkout |
| Online menu (public) | 5178 | `{slug}` menu |
| POS | 5173 | |
| Marketing | 5175 | |
| API | 5147 (or 5148) | |

Start frontends: `./scripts/dev-all.sh`

---

## 3. Office sidebar layout (tenant)

**File:** `frontend/apps/admin-portal/src/components/tenant-sidebar.tsx`

| Section | Who sees it | Contents |
|---------|-------------|----------|
| **Overview** | Managers + staff with permission | Dashboard, Orders |
| **Catalog setup** | OrgAdmin, StoreManager | Industry-filtered steps + Categories |
| **Modules** | OrgAdmin, StoreManager | Plan-included modules → **in-portal routes** |
| **Human Resources** | OrgAdmin, StoreManager (Pro + `HasHr`) | `/hr/*` sub-nav |
| **Operations** | OrgAdmin, StoreManager | Branches, Stock transfers |
| **Reports** | OrgAdmin, StoreManager | Audit log |
| **Settings** | Mostly OrgAdmin | Users, Billing, Store settings |

**Cashier / Waiter:** sidebar collapses to **Orders only**.

---

## 4. Plan module registry

**File:** `frontend/apps/admin-portal/src/lib/plan-modules.ts`

| Field | Purpose |
|-------|---------|
| `planFlag` | Subscription DTO flag (`hasCoupons`, `hasHr`, …) |
| `tenantFlag` | Resolved tenant feature — business-type gate |
| `portalPath` | In-Office route opened from **Modules** sidebar |
| `roles` | `OrgAdmin`, `StoreManager` |

### Registered modules (July 2026)

| Module | Plan flag | Tenant flag | Office route |
|--------|-----------|-------------|--------------|
| Coupons & Lucky Draw | `hasCoupons` | `officeCoupons` | `/coupons` |
| Online Menu | `hasOnlineMenu` | `onlineMenu` | `/online-menu` |
| Online Ordering | `hasOnlineOrdering` | `onlineOrdering` | `/online-ordering` |
| Human Resources | `hasHr` | `officeHr` | `/hr` |

### Visibility rules

A module appears when **all** of the following are true:

1. User role is `OrgAdmin` or `StoreManager`
2. Subscription includes the plan flag
3. `TenantFeatures` allows the module for business type
4. User is not front-staff-only (cashier/waiter)

**Free plan:** no modules. **Pro plan (demo):** coupons, menu, order, HR (subject to business type).

---

## 5. Plan flags (backend)

**Entity:** `Plan` · **Seeder:** `DataSeeder.CanonicalPlans()`

| Plan flag | Tenant feature | Pro default |
|-----------|----------------|-------------|
| `HasCoupons` | `OfficeCoupons` | ✅ |
| `HasOnlineMenu` | `OnlineMenu` | ✅ (Restaurant/Hybrid) |
| `HasOnlineOrdering` | `OnlineOrdering` | ✅ |
| `HasHr` | `OfficeHr` | ✅ |

Super Admin toggles flags on **Plans** page. Tenant resolution: `TenantFeatureResolver` + frontend `mergeTenantFeatures()`.

---

## 6. Public preview URLs (not sidebar)

**File:** `frontend/apps/admin-portal/src/config.ts`

Build-time env vars for **customer-facing** links shown inside Office pages (e.g. “View live menu”, coupon scan URL):

| Variable | Dev | Production |
|----------|-----|------------|
| `VITE_COUPONS_URL` | http://localhost:5176 | https://coupons.bluraymaldives.site |
| `VITE_MENU_URL` | http://localhost:5178 | https://menu.bluraymaldives.site |
| `VITE_ORDER_URL` | http://localhost:5177 | https://order.bluraymaldives.site |

---

## 7. Testing checklist

1. **Pro demo manager:** `manager@demo.com` / `Manager123!` @ http://localhost:5174  
2. Sidebar **Modules** shows plan items (Coupons, Online Menu, Online Ordering, HR)  
3. Each module opens **in the same tab** at its Office route  
4. HR section shows sub-nav (Overview, Employees, Payroll, …)  
5. Switch to **Free** via Billing → Modules section disappears  
6. **Retail** org on Pro: Online Menu hidden per business type  

---

*Update this file when adding a new plan-gated module or sidebar section.*
