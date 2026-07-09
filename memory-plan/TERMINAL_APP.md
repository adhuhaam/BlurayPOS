# Android Terminal App — Living Manual

> Native POS client in `terminal_app/`. Complements the web PWA at `frontend/apps/pos-terminal`.  
> **Master product spec:** [ANDROID_MASTER_PLAN.md](./ANDROID_MASTER_PLAN.md)

## Why a native app?

The rugged handheld terminal runs **Android 8.1** with a **58 mm thermal printer**, limited RAM (1 GB), and no desktop browser. A native app enables:

* Printer SDK integration (vendor-specific)
* Kiosk / lock-task mode
* Better performance on low-end ARM devices
* Camera barcode scanning
* Offline Room DB + background sync

## Hardware reference

| Spec | Detail |
|------|--------|
| OS | Android 8.1 (API 27 minimum) |
| SoC | MT6580 quad-core Cortex-A7 @ 1.3 GHz |
| Memory | 1 GB RAM, 8 GB ROM |
| Printer | 58 mm thermal, ~42 mm roll, rated 50 km |
| Camera | 5 MP fixed focus (barcode) |
| Size | 209.2 × 87.4 × 51.7 mm |

## Dev environment checklist

| Item | Command / path |
|------|----------------|
| Android Studio | Snap `android-studio` (2026.1+) |
| SDK | `~/Android/Sdk`, platforms `android-36` |
| JDK | `/snap/android-studio/current/jbr` (Java 21) |
| Gradle | `./gradlew` in `terminal_app/` |
| ADB device | `adb devices` → authorize USB debugging |
| API backend | `docker compose up -d` in repo root |
| API URL on device (prod) | `https://api.bluraymaldives.site` (preview + release builds) |
| API URL on device (dev) | `http://<lan-ip>:5147` (debug build; see `BuildConfig.API_URL`) |
| Preview APK | `./scripts/build-android-preview.sh` → `terminal_app/dist/BlurayPOS-v*-preview.apk` |

### Docker permission note

User must be in `docker` group (`sudo usermod -aG docker $USER`) or log out/in after install.

## Architecture

```
┌─────────────────────┐     HTTPS/HTTP      ┌──────────────────┐
│  Android Terminal   │ ◄──────────────────►│  Pos.Api (.NET)  │
│  Kotlin + Compose   │   JWT Bearer        │  PostgreSQL      │
│  Retrofit + DataStore│                    │  SignalR /hubs/pos│
└─────────────────────┘                     └──────────────────┘
```

**Package:** `com.bluraypos.terminal`

**Branding (v0.2.1):**

| Asset | Location |
|-------|----------|
| Brand kit (source) | `terminal_app/branding/bluraypos-brand-kit.png` |
| Cropped logos | `app/src/main/res/drawable-nodpi/branding_*.png` |
| Launcher icon | `branding/app-icon-source.png` → `mipmap-*/ic_launcher.png` |
| Typography | Geist + Poppins (matches admin portal Geist) |
| UI style | **shadcn/ui** — neutral zinc tokens, bordered cards, muted surfaces |
| Colors | shadcn light: `#FAFAFA` primary on white; Bluray blue for brand accents |
| Tagline | SMART POS. SMARTER BUSINESS. |

**Current version:** **0.6.0** (`versionCode` 14)

## Restaurant table orders (v0.6.0)

Full spec: [TABLE_ORDERS.md](./TABLE_ORDERS.md)

| Step | POS action |
|------|------------|
| 1 | Select **table** or **Takeaway** |
| 2 | Add items |
| 3 | **Save & send to kitchen** (no bill) |
| 4 | Customer asks for bill → **Request bill** |
| 5 | **Take payment** |

**Bottom navigation (v0.5.1+):**

| Store type | Tabs (left → right) |
|------------|---------------------|
| **Retail** | POS · Sales · Settings (3 tabs) |
| **Restaurant / café / hybrid** | POS · Orders · Tables · Settings (4 tabs) |

App opens on **POS** by default. Home/Dashboard removed from bottom nav — POS-first workflow.

**Screens:**

1. Splash → Login (email/password, branch)
2. Main shell — bottom nav by tenant type (see table above)
3. **POS** — restaurant: table chip, category chips, Save & send to kitchen, Request bill, Take payment; retail: barcode search, instant checkout
4. **Orders / Sales** — summary, search, filters, order detail; table name on restaurant orders
5. **Tables** (restaurant) — live floor grid from API; tap table → POS with table selected
6. **Settings** — API URL, store type badge, feature chips, device info, connection test, logout

**Fullscreen:** `ImmersiveMode` hides status and navigation bars on launch (kiosk-style; Device Owner mode still 🔲).

**Industry modes:** Synced from `GET /api/auth/me` → `TenantFeatures` (Restaurant / Retail / Hybrid). Persisted in `SessionStore`. See [INDUSTRY_MODES.md](./INDUSTRY_MODES.md).

**Table session:** `data/table/TableSession.kt` shares selected table + active order across POS ↔ Tables tabs. Spec: [TABLE_ORDERS.md](./TABLE_ORDERS.md).

**API endpoints used:**

| Method | Path |
|--------|------|
| POST | `/api/auth/login` |
| GET | `/api/auth/me` (tenant features, business type) |
| GET | `/health` (connection test) |
| GET | `/api/products`, `/api/categories` |
| GET | `/api/reports/dashboard` |
| GET | `/api/orders` |
| GET | `/api/tables?storeId=` |
| POST | `/api/orders` (+ `Idempotency-Key`; `diningTableId`, `serviceType`) |
| PUT | `/api/orders/{id}` |
| POST | `/api/orders/{id}/send-to-kitchen` |
| POST | `/api/orders/{id}/request-bill` |
| POST | `/api/orders/{id}/complete` |

## Dev API URL

Debug builds read the API port from repo-root **`.dev-api-port`** (written by `ensure-dev-api.sh`). Default **5147**; **5148** when port 5147 is blocked by a stale container.

`install-android.sh` passes `-PDEV_API_HOST` and `-PDEV_API_PORT` to Gradle. Phone must use **LAN IP**, not `localhost`.

## Preview APK (production API)

For field testing against the live API without a release signing key:

```bash
./scripts/build-android-preview.sh
# → terminal_app/dist/BlurayPOS-v0.6.0-preview.apk
```

| Build type | API URL | Debug prefill | Signing |
|------------|---------|---------------|---------|
| `debug` | `http://<lan-ip>:<port>` | Yes (demo credentials) | Debug keystore |
| `preview` | `https://api.bluraymaldives.site` | No | Debug keystore (sideload) |
| `release` | `https://api.bluraymaldives.site` | No | Release keystore (store) |

**Low-RAM builds:** `gradle.properties` caps JVM at 1 GB, `workers.max=1`, `daemon=false`. The preview script uses `--max-workers=1` and skips lint. Close other heavy apps before building on 4 GB machines.

```bash
# One command — API + build + install + launch (debug / dev API)
./scripts/install-android.sh

# Or manually:
cd ~/BlurayPOS/terminal_app
export JAVA_HOME=/snap/android-studio/current/jbr
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n com.bluraypos.terminal/.MainActivity
```

Or open `terminal_app/` in Android Studio → Run on device.

### MIUI install workaround

USB install may fail with `INSTALL_FAILED_USER_RESTRICTED`. Use:

```bash
adb push app/build/outputs/apk/debug/app-debug.apk /data/local/tmp/BlurayPOS.apk
adb shell pm install -r /data/local/tmp/BlurayPOS.apk
adb shell am start -n com.bluraypos.terminal/.MainActivity
```

## Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Cashier | `cashier@demo.com` | `Cashier123!` |
| Manager | `manager@demo.com` | `Manager123!` |

Cashiers must select a **branch** at login.

## Implementation status (vs master plan)

| Master plan area | Status | Notes |
|------------------|--------|-------|
| Kotlin + Compose + Material 3 | 🟢 | v0.5.0 shadcn-style UI |
| minSdk 27 (Android 8.1) | 🟢 | `targetSdk 30` for MIUI compat |
| Device profiles | 🔲 | PHONE only (Redmi Note 8 test device) |
| Login + branch + JWT | 🟢 | DataStore session, demo prefill in debug |
| Fullscreen immersive mode | 🟢 | v0.5.0 — status/nav bars hidden |
| Industry modes (Restaurant/Retail) | 🟢 | v0.5.0 — TenantFeatures from `/api/auth/me` |
| POS + cart + cash/card checkout | 🟢 | Retail vs restaurant layouts |
| Dashboard (Home) | 🟢 | Hero, top sellers, recent orders, week metrics |
| Orders list/detail + filters | 🟢 | Search, All/Completed/Open, summary card |
| Settings + connection test | 🟢 | Store type, feature chips, `/health` check |
| Tables, Kitchen | 🔲 | Tables placeholder; Kitchen routes to Orders |
| Offline-first + Room + queue | 🔲 | Critical — next major milestone |
| WorkManager sync | 🔲 | Backend `/api/sync` exists |
| Device registration | 🔲 | |
| Kiosk / Device Owner | 🔲 | Immersive UI done; lock-task + Device Owner Pro feature |
| Built-in printer (58 mm) | 🔲 | Vendor SDK needed |
| Barcode scanner | 🟡 | Barcode via POS search field (camera scan 🔲) |
| Home screen widgets | 🔲 | Jetpack Glance |
| Feature flags (Free vs Pro) | 🔲 | Backend plan flags |

## Related docs

* [terminal_app/README.md](../terminal_app/README.md) — quick start
* [SAAS_REQUIREMENTS.md](./SAAS_REQUIREMENTS.md) — product spec
* [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) — phase tracker
* [DEVELOPMENT_HANDOFF.md](./DEVELOPMENT_HANDOFF.md) — full project memory
