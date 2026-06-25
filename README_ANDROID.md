## Progressive Web App support
This project now includes a PWA setup with offline asset caching and installable web app behavior. Run `npm run dev` to test the PWA in development, and `npm run build` to produce the web build used by Capacitor for APK packaging.

## Build APK locally (debug + release)
After you run `npm run setup:android` or `npm run prepare:android` you can build APKs locally using the helper scripts:

Debug APK (install on device/emulator directly):
```bash
npm run android:assemble-debug
# result: android/app/build/outputs/apk/debug/app-debug.apk
```

CLI-only Android SDK setup (requires Java JDK 11+):
```bash
npm run android:setup-sdk
```

If you do not have Java installed, install OpenJDK and set `JAVA_HOME` or add `java.exe` to your PATH before running the setup script.

Then initialize and build the native Android project:
```bash
npm run setup:android
npm run android:assemble-debug
```

Or run everything in one command:
```bash
npm run android:build-all
```

This workflow downloads Android command-line tools into `%LOCALAPPDATA%\Android\Sdk`, installs required SDK packages, and creates `android/local.properties` for the Capacitor project.

Release APK:
```bash
npm run android:assemble-release
# result: android/app/build/outputs/apk/release/app-release.apk
```

Install APK to an attached device (requires `adb`):
```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Notes:
- The release build may require signing. Use the CI approach (keystore secrets) or configure `android/gradle.properties` locally with your keystore and passwords.
- The app icon for the native APK comes from the `public/android-mipmap/*` assets. Run `npm run generate:icons` and `npm run prepare:android` to ensure icons are copied into the native project before building.

If you want, I can run through your local terminal output step-by-step — run `npm run android:assemble-debug` and paste the output here. I'll fix any errors you encounter.

## Automated Play Store release (CI)
I've added a workflow template `.github/workflows/release-to-playstore.yml` that runs on tag push (`v*`) and will:

- build the web assets
- copy and finalize the Android project
- run `./gradlew assembleRelease`
- upload the release APK to Google Play using `r0adkll/upload-google-play`

Required repository secrets for Play Store deployment:
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` — service account JSON (full JSON text)
- `PLAYSTORE_PACKAGE_NAME` — your Android package name (e.g. `com.example.thesisync`)

Warning: publishing to Play requires careful testing; I recommend running the CI on a test track first.

# Building Android APK (Capacitor)

This project uses Vite + React. The recommended approach to produce an Android APK is to wrap the web build with Capacitor and build the native Android project from Android Studio.

Prerequisites
- Node.js (18+)
- npm or pnpm
- Java JDK 11+ (for Android Gradle)
- Android Studio (with SDK, emulator, and platform tools)

Quick steps

1. Install Capacitor and dependencies:

```bash
npm install @capacitor/core @capacitor/cli --save
```

## Gradle signing snippet (example)
Add this to `android/app/build.gradle` inside the `android` block's `signingConfigs` section or modify accordingly:

```groovy
signingConfigs {
	release {
		storeFile file(project.property("keystoreFile"))
		storePassword project.property("keystorePassword")
		keyAlias project.property("keyAlias")
		keyPassword project.property("keyPassword")
	}
}

buildTypes {
	release {
		signingConfig signingConfigs.release
		minifyEnabled false
	}
}
```

Make sure `android/gradle.properties` contains the properties written by the CI: `keystoreFile`, `keystorePassword`, `keyAlias`, `keyPassword`.
# Building Android APK (Capacitor)

This project uses Vite + React. The recommended approach to produce an Android APK is to wrap the web build with Capacitor and build the native Android project from Android Studio.

Prerequisites
- Node.js (18+)
- npm or pnpm
- Java JDK 11+ (for Android Gradle)
- Android Studio (with SDK, emulator, and platform tools)

Quick steps

1. Install Capacitor and dependencies:

```bash
npm install @capacitor/core @capacitor/cli --save
```

2. Build the web app:

```bash
npm run build
```

3. Initialize Capacitor (only first time):

```bash
npm run cap:init
```

4. Add Android platform (only first time):

```bash
npm run android:add
```

5. Copy web assets and open Android Studio:

```bash
npm run android:sync
npm run android:open
```

6. In Android Studio: select a device/emulator and Run -> Build APK(s) or Run.

Notes
- You may need to adjust `capacitor.config.ts` appId/appName.
- Replace the placeholder icons in `public/icons/` with proper PNGs before building.
- For CI, you can run `npm run build` then use Gradle in `android/` to build release APKs.

Troubleshooting
- If Android Studio complains about missing SDKs, open SDK Manager and install required platforms and build-tools.
- If you change web files, run `npm run android:sync` to copy updated assets into the native project.

If you want, I can add a small Gradle wrapper script or create a GitHub Actions workflow to produce an APK automatically.
