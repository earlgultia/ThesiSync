# 🚀 QUICK APK BUILD (NO ANDROID STUDIO NEEDED)

## One Command to Build APK

Open PowerShell/Terminal in your project and run:

```bash
npm run build:full
```

This will:
- ✅ Download Android SDK (lightweight, ~200MB)
- ✅ Install required Android platforms and build-tools
- ✅ Build your React web app
- ✅ Package it as an Android APK
- ✅ Show you where the APK file is

**That's it!** No manual setup, no Android Studio, no complex configuration.

---

## Requirements

Only these need to be pre-installed:
- **Node.js 18+** - https://nodejs.org/
- **Java JDK 11+** - https://adoptium.net/ (or https://www.oracle.com/java/technologies/downloads/)

Verify you have them:
```bash
node --version
npm --version
java -version
```

---

## What Happens

### First time (auto setup):
```
npm run build:full
→ Checks Node, npm, Java
→ Downloads Android SDK (~200MB)
→ Extracts and configures
→ Accepts licenses
→ Installs Android platforms/build-tools
→ Builds your APK (5-10 minutes)
```

### Subsequent times:
```
npm run build:full
→ Reuses existing Android SDK
→ Rebuilds APK (2-3 minutes)
```

---

## Output

When complete, you'll see:

```
✅ SUCCESS!

📦 APK Ready: c:\Users\cherr\Desktop\ThesiSync\android\app\build\outputs\apk\debug\app-debug.apk

📱 Install on phone:
   adb install -r "c:\Users\cherr\Desktop\ThesiSync\android\app\build\outputs\apk\debug\app-debug.apk"

Or transfer manually via USB.
```

---

## Install on Phone

### Option 1: Using ADB (fastest)
Connect phone via USB, enable Developer Mode → USB Debugging, then:
```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### Option 2: Manual transfer
1. Find the APK file (full path shown after build)
2. Copy to phone via USB cable
3. Tap APK to install

---

## Troubleshooting

**Q: "Java not found"**  
A: Install Java JDK 11+ from https://adoptium.net/

**Q: Build fails with Gradle error**  
A: Try: `gradle --stop` then run again

**Q: "npm: command not found"**  
A: Install Node.js from https://nodejs.org/

**Q: "ANDROID_HOME not set"**  
A: The script sets it automatically. If still fails, you may need to restart your terminal.

---

## Manual Alternative

If `npm run build:full` doesn't work:

```bash
npm run generate:icons
npm run setup:android
npm run prepare:android
npm run android:patch-native
npm run android:assemble-debug
```

APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

---

**Run `npm run build:full` now and get your APK! 🎉**
