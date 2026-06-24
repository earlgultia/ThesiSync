# ThesiSync Android APK Build Guide

This guide explains how to build and install a working Android APK for ThesiSync without using Android Studio GUI.

## Quick Start (One Command)

The fastest way to build a debug APK:

```bash
npm run build:apk
```

This single command will:
1. Generate app icons
2. Set up the Capacitor Android project
3. Build web assets with Vite
4. Finalize the Android build (copy icons, patch gradle)
5. Patch native permissions and build config
6. Build the debug APK

**Expected result:** `android/app/build/outputs/apk/debug/app-debug.apk`

---

## Prerequisites

You **must** have these installed on your system:

- **Node.js** (18+) — [Download](https://nodejs.org/)
- **Java JDK** (11+) — [Download](https://www.oracle.com/java/technologies/downloads/)
- **Android SDK** — Install via Android Studio or command-line tools
- **Gradle** — Usually bundled with Android SDK
- **Git Bash** or PowerShell on Windows

Verify installation:
```bash
node --version
npm --version
java -version
gradle --version
```

### Set Environment Variables

If you installed Android SDK manually (not via Android Studio), set:

```bash
# Windows PowerShell
$env:ANDROID_HOME = "C:\Users\YourUsername\AppData\Local\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:PATH += ";$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\tools\bin"

# Windows Command Prompt
set ANDROID_HOME=C:\Users\YourUsername\AppData\Local\Android\Sdk
set ANDROID_SDK_ROOT=%ANDROID_HOME%
set PATH=%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools\bin

# macOS/Linux
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools/bin
```

---

## Build Steps (Manual)

If `npm run build:apk` doesn't work or you want to debug, run these steps individually:

### 1. Install Dependencies

```bash
npm ci
```

### 2. Generate App Icons

```bash
npm run generate:icons
```

This creates placeholder PNG icons in:
- `public/icons/` (web icons)
- `public/android-mipmap/` (Android native mipmap assets)

### 3. Initialize Capacitor Android Project

```bash
npm run setup:android
```

This will:
- Ensure Capacitor is installed
- Build web assets with Vite
- Initialize Capacitor (if not already done)
- Create the `android/` folder
- Copy web assets to the native project

### 4. Prepare Android Build

```bash
npm run prepare:android
```

This:
- Rebuilds web assets
- Copies assets to the Android project
- Copies mipmap icons into native resource folders
- Patches `android/app/build.gradle` with signing config

### 5. Patch Native Permissions

```bash
npm run android:patch-native
```

This adds required permissions to `AndroidManifest.xml`:
- `INTERNET`
- `READ_EXTERNAL_STORAGE`
- `WRITE_EXTERNAL_STORAGE`

### 6. Build Debug APK

```bash
npm run android:assemble-debug
```

This runs `./gradlew assembleDebug` and produces:
- **Debug APK:** `android/app/build/outputs/apk/debug/app-debug.apk` (~50-100 MB)

---

## Install APK on Your Phone

### Option 1: Using ADB (Recommended)

Connect your Android phone via USB and enable **Developer Mode** → **USB Debugging**.

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

The `-r` flag reinstalls if the app is already present.

### Option 2: Transfer APK File Manually

Copy the APK file to your phone via:
- USB file transfer
- Email
- Cloud storage (Google Drive, OneDrive, etc.)

Then tap the APK file on your phone to install.

---

## Build Release APK (Signed)

For Play Store or production deployment, you need a signed release APK:

### Local Signing (without keystore)

```bash
npm run android:assemble-release
```

This builds an **unsigned** release APK. You'll need to sign it later:

```bash
# This requires a keystore. If you don't have one, create one:
keytool -genkey -v -keystore thesisync.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias thesisync

# Then sign the APK:
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore thesisync.keystore \
  android/app/build/outputs/apk/release/app-release.apk thesisync
```

### CI Signing (via GitHub Actions)

The workflow `.github/workflows/android-build.yml` handles signing automatically if you provide GitHub Secrets:

**Required secrets:**
- `ANDROID_KEYSTORE_BASE64` — Your keystore file encoded in base64
- `ANDROID_KEYSTORE_PASSWORD` — Keystore password
- `ANDROID_KEY_ALIAS` — Key alias (e.g., `thesisync`)
- `ANDROID_KEY_PASSWORD` — Key password

**To set up:**

1. Create a keystore locally:
   ```bash
   keytool -genkey -v -keystore thesisync.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias thesisync
   ```

2. Encode it to base64:
   ```bash
   # Windows PowerShell
   [Convert]::ToBase64String([System.IO.File]::ReadAllBytes("thesisync.keystore"))

   # macOS/Linux
   base64 -i thesisync.keystore | tr -d '\n'
   ```

3. Add as GitHub repository secret: **Settings → Secrets → New repository secret**
   - Name: `ANDROID_KEYSTORE_BASE64`
   - Value: Paste the base64 output

4. Push a tag to trigger the build:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

---

## Troubleshooting

### Error: "gradle not found" or "gradlew not found"

**Solution:** Ensure Android SDK is installed and `ANDROID_HOME` is set correctly.

```bash
# Check if gradlew exists:
ls android/gradlew

# If not, run setup again:
npm run setup:android
```

### Error: "JAVA_HOME not set" or "Java not found"

**Solution:** Install Java JDK 11+ and set `JAVA_HOME`:

```bash
# Windows PowerShell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-11"

# macOS/Linux
export JAVA_HOME=$(dirname $(dirname $(readlink -f $(which java))))
```

### Error: "npm ci failed" or "node_modules issues"

**Solution:** Clean and reinstall:

```bash
rm -r node_modules package-lock.json
npm install
npm run build:apk
```

### APK not found after build

**Check build logs:**

```bash
cat android/app/build/outputs/build-report.txt  # If it exists
```

**Manual build (more verbose):**

```bash
cd android
./gradlew assembleDebug --info
```

### App crashes on startup

**Common causes:**
- Missing web assets (`dist/` folder not copied)
- TypeScript errors in `src/`

**Solution:**

```bash
# Check for TypeScript errors:
npm run build

# Rebuild and re-copy assets:
npm run setup:android
npm run prepare:android
npm run android:assemble-debug
```

---

## What Each Script Does

| Script | Command | Purpose |
|--------|---------|---------|
| `npm run generate:icons` | `node scripts/generate-icons.js` | Create placeholder PNG icons |
| `npm run setup:android` | `node scripts/setup-android.js` | Initialize Capacitor Android project |
| `npm run prepare:android` | (see package.json) | Build web + copy to Android + finalize |
| `npm run android:patch-native` | `node scripts/patch-android-native.js` | Add permissions to AndroidManifest.xml |
| `npm run android:assemble-debug` | `node scripts/build-android-debug.js` | Build debug APK via Gradle |
| `npm run android:assemble-release` | `node scripts/build-android-release.js` | Build release APK via Gradle |
| `npm run build:apk` | (all above chained) | **One-command build** |

---

## File Locations

After building, here are the important locations:

```
ThesiSync/
├── android/                              # Capacitor Android project
│   ├── app/
│   │   ├── src/main/res/
│   │   │   ├── mipmap-mdpi/ic_launcher.png
│   │   │   ├── mipmap-hdpi/ic_launcher.png
│   │   │   └── ...
│   │   ├── build/outputs/apk/
│   │   │   ├── debug/app-debug.apk       ← Debug APK (for testing)
│   │   │   └── release/app-release.apk   ← Release APK (for Play Store)
│   │   └── build.gradle                  ← Gradle config (has signing setup)
│   ├── gradlew                           ← Gradle wrapper (Windows: gradlew.bat)
│   └── gradle.properties                 ← Build properties (CI writes signing info here)
├── public/
│   ├── icons/                            ← Web app icons
│   │   ├── icon-48.png
│   │   ├── icon-192.png
│   │   └── ...
│   └── android-mipmap/                   ← Android native mipmap sources
│       ├── mipmap-mdpi/
│       ├── mipmap-hdpi/
│       └── ...
├── dist/                                 ← Built web assets (created by `npm run build`)
├── src/                                  ← React source code
├── package.json                          ← npm scripts and dependencies
├── capacitor.config.ts                   ← Capacitor config
└── README_ANDROID.md                     ← This file
```

---

## Next Steps

1. **Run the build:**
   ```bash
   npm run build:apk
   ```

2. **Transfer APK to phone:**
   ```bash
   adb install -r android/app/build/outputs/apk/debug/app-debug.apk
   ```

3. **Test the app** on your phone

4. **Fix bugs** by editing React source in `src/` and rebuilding

5. **Release to Play Store:**
   - Follow the CI signing setup above
   - Tag and push to GitHub to trigger the build

---

## Support

For Capacitor docs: [https://capacitorjs.com/docs](https://capacitorjs.com/docs)

For Gradle troubleshooting: [https://gradle.org/](https://gradle.org/)

Good luck! 🚀
