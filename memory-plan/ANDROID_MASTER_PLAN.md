# BlurayPOS Android Application — Enterprise Master Development Plan

> **Canonical Android product spec.** Code in `terminal_app/` must align with this document.  
> Living setup guide: [TERMINAL_APP.md](./TERMINAL_APP.md)

## Vision

BlurayPOS Android is a core product of the BlurayPOS ecosystem.

It supports:

- Android Phones
- Android Tablets
- BlurayPOS Handheld POS Terminals
- Future Kitchen Displays
- Future Customer Displays

**One application. One codebase.**

The application adapts automatically based on:

- Device Profile
- User Role
- Subscription Plan
- Hardware Capabilities
- Store Configuration

---

## SaaS Plans

### Free

- Customer-owned Android phones & tablets
- POS
- Orders
- Tables
- Customers
- Kitchen
- Reports
- Offline Mode
- Bluetooth Printing
- Camera Barcode Scanner
- Android Home Screen Widgets

### Pro

Everything in Free plus:

- BlurayPOS Handheld Terminal
- Built-in Printer
- Built-in Scanner
- Auto Boot
- Device Owner Kiosk Mode
- Remote Device Management
- Hardware Diagnostics
- Remote Configuration

Same Android application. Backend controls features using Feature Flags.

---

## Technology

| Layer | Choice |
|-------|--------|
| Language | Kotlin |
| UI | Jetpack Compose, Material 3 |
| Architecture | MVVM, Clean Architecture, Repository Pattern |
| DI | Hilt |
| Network | Retrofit |
| Local DB | Room |
| Background | WorkManager |
| Preferences | DataStore |
| Images | Coil |
| Logging | Timber |
| Secrets | Android Keystore |

**Minimum SDK:** Android 8.1 (API 27)

---

## Device Profiles

| Profile | Use case |
|---------|----------|
| `PHONE` | Staff phone, waiter |
| `TABLET` | Counter / manager tablet |
| `HANDHELD_TERMINAL` | Rugged POS (58 mm printer, scanner) |
| `KITCHEN_DISPLAY` | KDS screen |
| `CUSTOMER_DISPLAY` | Customer-facing second screen |

---

## Device Registration

Register with backend:

- Device ID
- Store / Branch
- User
- Manufacturer, Model, Android Version, App Version
- Battery, RAM, Storage
- Printer, Scanner presence
- Last Seen, Online Status, Kiosk Status

---

## Offline First (Mission Critical)

Restaurant operations must **never** stop because of internet outages, Wi‑Fi failures, ISP issues, cloud maintenance, or API downtime.

### Offline features (must work without network)

Create/edit/cancel orders, tables, kitchen orders, customers, product search, categories, discounts, taxes, payments, receipt printing, shift operations.

### Local database (Room)

Products, categories, customers, tables, orders, payments, receipts, store settings, permissions, sync queue.

**Principle:** UI reads primarily from local DB for speed.

### Queue-based synchronization

Every transaction enters a persistent queue (survives app restart, reboot, power loss).

Each item stores: local UUID, server UUID, timestamp, device ID, branch ID, user ID, sync status.

### Automatic sync (WorkManager)

On connectivity restore: upload queue → validate server → resolve conflicts → clear completed items.

### Sync status UI

Always show: Online / Offline / Syncing / Sync Error + pending transaction count.

> BlurayPOS must never prevent a restaurant from serving customers because of connectivity. Offline is core design, not optional.

---

## Kiosk Modes

1. **Standard** — normal Android
2. **Screen Pinning** — guided access
3. **Device Owner (Pro Terminal)** — auto launch, auto boot, lock home/recents, fullscreen, PIN exit, remote management

### Production device requirements

| Capability | Detail |
|------------|--------|
| Auto-launch | App starts after device reboot |
| Kiosk lock | Prevent exiting app (Device Owner on Pro terminals) |
| Remote updates | OTA APK delivery; silent install where OEM supports |
| Printer | 58 mm thermal (built-in or Bluetooth) |
| Scanner | Built-in, camera, or Bluetooth barcode |
| Camera | Product lookup, QR |
| Connectivity | Wi‑Fi, Bluetooth, USB, OTG |
| Peripherals | Cash drawer, buzzer |
| Monitoring | Battery level, paper low, heartbeat to API |

Production API base URL: `https://api.bluraymaldives.site` (see [deployment.md](./deployment.md)).

**Preview APK (field test):** `./scripts/build-android-preview.sh` → `terminal_app/dist/BlurayPOS-v*-preview.apk` — production API, debug signing for sideload.

**Release APK (production):** `./scripts/build-android-release.sh apk` → archived in `docs/apk releases/`. See [TERMINAL_APP.md](./TERMINAL_APP.md) and [../docs/apk releases/README.md](../docs/apk%20releases/README.md).

---

## Dashboard

Greeting, store, branch, today's sales, orders, AOV, active tables, kitchen status, pending bills, current shift, offline status, last sync.

**Pro terminal extras:** printer status, paper, battery, device health.

---

## Android Home Screen Widgets (Jetpack Glance)

1. Today's Sales
2. Business Overview
3. Quick Actions
4. Manager Dashboard

Multi-store / multi-branch, tap actions, refresh after sync. Available on Free and Pro.

---

## Main Screens

Splash, Login, Dashboard, POS, Categories, Products, Cart, Checkout, Payment, Receipt, Orders, Tables, Kitchen, Customers, Reports, Notifications, Settings, Device Status, Sync Status, Printer Test, Scanner Test.

---

## UI Philosophy

- One-handed operation
- Large touch targets
- High contrast
- Minimal typing
- Fast navigation
- Optimized for handheld terminals
- Responsive for phones and tablets

---

## Coding Standards

- MVVM, SOLID, Repository Pattern
- Dependency Injection (Hilt)
- No business logic inside Composables
- Feature-based Gradle modules (future)
- Production-ready code

---

## Long-Term Goal

Enterprise-grade POS from a **single Android codebase** — one phone to hundreds of managed BlurayPOS handheld terminals.

---

## Implementation tracker

See [TERMINAL_APP.md](./TERMINAL_APP.md) for dev setup and current v0.1 status.  
Platform roadmap: [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) Phase 8.
