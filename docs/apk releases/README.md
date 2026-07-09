# BlurayPOS Android APK releases

Canonical archive of **signed production** and **preview** APKs built from this repo.  
Build instructions: [../ANDROID_PRODUCTION_BUILD.md](../ANDROID_PRODUCTION_BUILD.md) · App manual: [../../memory-plan/TERMINAL_APP.md](../../memory-plan/TERMINAL_APP.md)

---

## Latest release

| Field | Value |
|-------|--------|
| **File** | `BlurayPOS-v0.7.0-release.apk` |
| **Version** | 0.7.0 (`versionCode` 15) |
| **API** | `https://api.bluraymaldives.site` |
| **Signing** | Release keystore (local — not in git) |
| **Built** | July 2026 |
| **Size** | ~9.1 MB |

### Install

**From this folder (USB / file share):**

```bash
adb install -r "docs/apk releases/BlurayPOS-v0.7.0-release.apk"
```

**On device:** open **Files → Downloads** (`BlurayPOS-v0.7.0-release.apk`) and tap to install.  
MIUI may require **Install via USB** enabled in Developer options.

### v0.7.0 highlights

- Production API over HTTPS only (no cleartext in release)
- R8 minify + resource shrinking on release builds
- `targetSdk 34`, release signing via `keystore.properties`
- Build scripts: `./scripts/build-android-release.sh`, `./scripts/build-android-preview.sh`

---

## Build & publish workflow (local)

```bash
git pull origin main
./scripts/build-android-release.sh apk
cp terminal_app/dist/BlurayPOS-v*-release.apk "docs/apk releases/"
adb push terminal_app/dist/BlurayPOS-v*-release.apk /sdcard/Download/
git add "docs/apk releases/" && git commit -m "..." && git push origin main
```

**Release keystore** (`terminal_app/bluraypos-release.jks` + `keystore.properties`) stays on the build machine only — never commit.

**Gradle memory:** release builds need ~2 GB heap for R8 (`build-android-release.sh` passes `-Xmx2048m`).

---

## Archive

| APK | Type | API | Notes |
|-----|------|-----|-------|
| `BlurayPOS-v0.7.0-release.apk` | Release | Production HTTPS | First archived signed production build |

Preview builds remain in `terminal_app/dist/` (gitignored except `.gitkeep`) for local sideload only.

---

## CI / deploy

GitHub Actions workflows were **removed** (July 2026) — they failed without droplet secrets and sent noisy failure notifications.  
Production deploy is **manual**: `bash scripts/push-to-droplet.sh` on the dev machine. See [../../memory-plan/PRODUCTION_INFRASTRUCTURE.md](../../memory-plan/PRODUCTION_INFRASTRUCTURE.md).
