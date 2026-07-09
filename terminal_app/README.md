# BlurayPOS Android Terminal App

Native Android POS for phones, tablets, and rugged handheld terminals. One codebase — see [memory-plan/ANDROID_MASTER_PLAN.md](../memory-plan/ANDROID_MASTER_PLAN.md).

**Current version:** 0.7.0 · **Package:** `com.bluraypos.terminal` · **targetSdk:** 34

> **Production builds on your PC:** [docs/ANDROID_PRODUCTION_BUILD.md](../docs/ANDROID_PRODUCTION_BUILD.md) — `git pull`, preview APK, signed release / Play Store AAB.

## Restaurant table orders (v0.6.0+)

Full spec: [memory-plan/TABLE_ORDERS.md](../memory-plan/TABLE_ORDERS.md)

| Step | POS action |
|------|------------|
| 1 | Select **table** or **Takeaway** |
| 2 | Add items |
| 3 | **Save & send to kitchen** (no bill) |
| 4 | Customer asks → **Request bill** |
| 5 | **Take payment** → table free |

Demo: `cashier@demo.com` on hybrid org — **Tables** tab shows T1–T12 (Main Floor).

## Bottom navigation

| Store type | Tabs |
|------------|------|
| Retail | **POS** → **Sales** → **Settings** (3) |
| Restaurant / café / hybrid | **POS** → **Orders** → **Tables** → **Settings** (4) |

Opens on POS. Tables tab hidden for pure retail stores.

## Target hardware

Reference device (customer terminal):

| Spec | Value |
|------|--------|
| OS | Android 8.1 (API 27) |
| CPU | 4-core ARM Cortex-A7 MT6580 @ 1.3 GHz |
| RAM / Storage | 1 GB / 8 GB |
| Printer | 58 mm built-in thermal |
| Camera | 5 MP (barcode / QR later) |

**App config:** `minSdk 27`, `targetSdk 34`, Kotlin + Jetpack Compose.

**Test device:** Redmi Note 8 (`adb` over USB; MIUI install workaround documented below).

## Prerequisites (Ubuntu dev machine)

| Tool | Status / install |
|------|------------------|
| Android Studio | Snap: `android-studio` |
| Android SDK | `~/Android/Sdk` (via Studio SDK Manager) |
| JDK | Use Studio bundled JBR: `/snap/android-studio/current/jbr` |
| Gradle | Project wrapper (`./gradlew`) |
| ADB | `sudo apt install adb` |
| Phone / terminal | USB debugging enabled |

### Environment variables (optional)

```bash
export JAVA_HOME=/snap/android-studio/current/jbr
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### API backend

Phone cannot use `localhost` for the API. Use your PC LAN IP on the **same Wi‑Fi**. Port comes from `.dev-api-port` (5147 or 5148).

```bash
cd ~/BlurayPOS   # after git pull
./scripts/ensure-dev-api.sh   # writes .dev-api-port
cat .dev-api-port             # active API port
```

See [memory-plan/DEV_ENVIRONMENT.md](../memory-plan/DEV_ENVIRONMENT.md) for full dev stack.

## Build variants

| Variant | Command | API | Use case |
|---------|---------|-----|----------|
| **Debug** | `./scripts/install-android.sh` | Dev LAN (`http://<ip>:5147`) | Daily dev on USB device |
| **Preview** | `./scripts/build-android-preview.sh` | `https://api.bluraymaldives.site` | Field test / share APK (no keystore) |
| **Release** | `./scripts/build-android-release.sh apk` | Production HTTPS | Signed production APK |
| **Play Store** | `./scripts/build-android-release.sh aab` | Production HTTPS | Google Play upload |

### Preview APK (production API, no keystore)

```bash
git pull origin main
./scripts/build-android-preview.sh
# Output: terminal_app/dist/BlurayPOS-v0.7.0-preview.apk

adb install -r terminal_app/dist/BlurayPOS-v0.7.0-preview.apk
```

No demo credential prefill in preview builds. Use real tenant accounts on production.

### Release APK / AAB (signed)

One-time keystore setup:

```bash
bash scripts/generate-android-keystore.sh
# or copy terminal_app/keystore.properties.example → keystore.properties
```

Then build:

```bash
./scripts/build-android-release.sh apk   # signed APK
./scripts/build-android-release.sh aab   # Play Store bundle
```

**Low RAM:** Gradle is tuned in `gradle.properties` (`-Xmx1024m`, single worker, no daemon). Preview builds further cap heap to 768 MB and skip lint.

## Build & install (debug)

Or manually:

```bash
cd terminal_app
export JAVA_HOME=/snap/android-studio/current/jbr
./gradlew assembleDebug --no-daemon --max-workers=2
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n com.bluraypos.terminal/.MainActivity
```

**MIUI / Redmi:** USB install often blocked. Use:

```bash
adb push app/build/outputs/apk/debug/app-debug.apk /data/local/tmp/BlurayPOS.apk
adb shell pm install -r /data/local/tmp/BlurayPOS.apk
adb shell am start -n com.bluraypos.terminal/.MainActivity
```

## First login

1. Debug API URL is baked into the APK from `.dev-api-port` + LAN IP (see `app/build.gradle.kts` → `buildTypes.debug`)
2. Sign in — demo prefill in debug only: `cashier@demo.com` / `Cashier123!`
3. Select branch if prompted (**Main Branch**)
4. **Home** — today's sales, quick actions
5. **POS** — restaurant tenants see categories; retail tenants get barcode-focused search
6. **Orders** (or **Sales** for retail) — filter and open order details
7. **Settings** — connection test, store type, feature flags

## v0.7.0 production hardening

| Area | Behavior |
|------|----------|
| targetSdk | 34 (Play Store compliant) |
| HTTPS only | Release/preview — no cleartext; debug allows LAN HTTP |
| R8 shrinking | Enabled on release builds |
| HTTP logging | Debug builds only |
| Release signing | `keystore.properties` + `.jks` (local only, gitignored) |

## v0.5.0 features

| Area | Behavior |
|------|----------|
| Fullscreen | Status + navigation bars hidden (`ImmersiveMode`) |
| Industry modes | Restaurant / Retail / Hybrid from `/api/auth/me` |
| Home | Hero card, top sellers, recent orders, week metrics |
| Orders | Summary, search, All/Completed/Open filters, detail sheet |
| Settings | Store type badge, feature chips, device info |
| POS | Retail hides categories; restaurant shows category chips |

## Project structure

```
terminal_app/
├── app/src/main/java/com/bluraypos/terminal/
│   ├── data/api/          # Retrofit models + BlurayApi
│   ├── data/prefs/        # DataStore session (token, store, features)
│   ├── data/tenant/       # TenantFeatures, TenantSync
│   ├── util/              # ImmersiveMode
│   └── ui/
│       ├── dashboard/     # Home tab
│       ├── pos/           # POS screen
│       ├── orders/        # Orders / Sales tab
│       ├── tables/        # Tables tab (restaurant)
│       ├── settings/      # Settings
│       └── shell/         # MainShell bottom nav
├── branding/              # Logos, app icon source
├── keystore.properties.example
├── dist/                  # Built APKs/AABs (gitignored)
├── build.gradle.kts
└── settings.gradle.kts
```

## Roadmap (this app)

- [x] Login + branch selection
- [x] Product grid + cart + cash/card checkout
- [x] Dashboard / Home (metrics, top sellers, recent orders)
- [x] Orders list + detail + filters
- [x] Settings + connection test
- [x] Fullscreen immersive UI
- [x] Restaurant vs Retail tenant modes
- [x] Tables tab + restaurant kitchen/bill/pay flow (v0.6.0)
- [x] Production build pipeline (preview + signed release, v0.7.0)
- [ ] Shift open/close gate
- [ ] 58 mm thermal printer SDK integration
- [ ] Barcode scan (camera)
- [ ] Offline cache + sync (`/api/sync`)
- [ ] Device Owner kiosk / lock task
- [ ] SignalR live updates
- [ ] Kitchen display (KDS) screen

## Related docs

- [docs/ANDROID_PRODUCTION_BUILD.md](../docs/ANDROID_PRODUCTION_BUILD.md) — **git pull → production APK**
- [memory-plan/TABLE_ORDERS.md](../memory-plan/TABLE_ORDERS.md) — restaurant table flow
- [memory-plan/TERMINAL_APP.md](../memory-plan/TERMINAL_APP.md) — living manual
- [memory-plan/ANDROID_MASTER_PLAN.md](../memory-plan/ANDROID_MASTER_PLAN.md) — product spec
- [memory-plan/INDUSTRY_MODES.md](../memory-plan/INDUSTRY_MODES.md) — business types
- [memory-plan/DEV_ENVIRONMENT.md](../memory-plan/DEV_ENVIRONMENT.md) — API ports & scripts

## Open in Android Studio

**File → Open** → select `terminal_app/` folder. Sync Gradle, run on connected device.
