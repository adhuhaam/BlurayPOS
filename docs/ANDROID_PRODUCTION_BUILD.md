# Android production build (local machine)

Build signed release APKs and Play Store AABs on your **local Ubuntu PC** with Android Studio / SDK. The production API is already deployed at `https://api.bluraymaldives.site`.

---

## 1. Pull latest code

```bash
git clone https://github.com/adhuhaam/BlurayPOS.git
cd BlurayPOS
# or, if you already have the repo:
git pull origin main
```

Remote droplet development (optional): see [REMOTE_DROPLET_DEV.md](./REMOTE_DROPLET_DEV.md).

---

## 2. Prerequisites (local PC)

| Tool | Install |
|------|---------|
| Android Studio | Snap: `sudo snap install android-studio --classic` |
| Android SDK | Studio → SDK Manager → API 36 platform, build-tools |
| ADB | `sudo apt install adb` |
| JDK | Use Studio JBR: `export JAVA_HOME=/snap/android-studio/current/jbr` |

```bash
export JAVA_HOME=/snap/android-studio/current/jbr
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

---

## 3. Build variants

| Variant | Script | API URL | Signing | Use case |
|---------|--------|---------|---------|----------|
| **debug** | `./scripts/install-android.sh` | `http://<lan-ip>:5147` | Debug | USB dev against local API |
| **preview** | `./scripts/build-android-preview.sh` | `https://api.bluraymaldives.site` | Debug | Field test / sideload |
| **release** | `./scripts/build-android-release.sh` | `https://api.bluraymaldives.site` | Release keystore | Production / Play Store |

**v0.7.0** changes: `targetSdk 34`, HTTPS-only in release/preview, R8 minify on release, release signing via `keystore.properties`.

---

## 4. Preview APK (no keystore needed)

Quick production smoke test on a phone:

```bash
./scripts/build-android-preview.sh
adb install -r terminal_app/dist/BlurayPOS-v0.7.0-preview.apk
```

Log in with a real tenant account (no demo prefill in preview).

---

## 5. Release keystore (one-time)

Generate on your PC — **never commit** the `.jks` or `keystore.properties`:

```bash
bash scripts/generate-android-keystore.sh
```

Or manually:

```bash
cp terminal_app/keystore.properties.example terminal_app/keystore.properties
# Edit storeFile, passwords, keyAlias
keytool -genkeypair -v -keystore terminal_app/bluraypos-release.jks ...
```

Back up `bluraypos-release.jks` securely. You need the same key for every Play Store update.

---

## 6. Production release build

**Signed APK** (direct install / MDM):

```bash
./scripts/build-android-release.sh apk
# → terminal_app/dist/BlurayPOS-v0.7.0-release.apk
```

**Play Store AAB**:

```bash
./scripts/build-android-release.sh aab
# → terminal_app/dist/BlurayPOS-v0.7.0-release.aab
```

Upload the `.aab` to [Google Play Console](https://play.google.com/console).

---

## 7. Debug against local API

Phone and PC must be on the same Wi‑Fi:

```bash
./scripts/ensure-dev-api.sh    # starts API, writes .dev-api-port
./scripts/install-android.sh   # builds debug + installs via USB
```

See [memory-plan/DEV_ENVIRONMENT.md](../memory-plan/DEV_ENVIRONMENT.md).

---

## 8. Security notes

| Item | Release / Preview | Debug |
|------|-------------------|-------|
| Cleartext HTTP | Disabled | Allowed (LAN dev API) |
| HTTP body logging | Off | On (Logcat) |
| Demo login prefill | Off | On |
| Code shrinking (R8) | Release only | Off |

---

## Related docs

- [terminal_app/README.md](../terminal_app/README.md) — app features & hardware
- [memory-plan/TERMINAL_APP.md](../memory-plan/TERMINAL_APP.md) — living manual
- [memory-plan/ANDROID_MASTER_PLAN.md](../memory-plan/ANDROID_MASTER_PLAN.md) — product roadmap
