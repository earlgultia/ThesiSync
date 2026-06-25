#!/usr/bin/env node
/**
 * ThesiSync - Complete Android APK Builder
 * One command to set up environment and build APK
 * No Android Studio required!
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

const projectRoot = process.cwd();
const isWindows = process.platform === 'win32';

console.log('\n' + '='.repeat(70));
console.log('🚀 THESISYNC APK BUILDER - AUTO SETUP');
console.log('='.repeat(70));

// ============================================================================
// STEP 1: Check Prerequisites
// ============================================================================

console.log('\n📋 Checking prerequisites...\n');

const checks = {
  node: { cmd: 'node --version', name: 'Node.js' },
  npm: { cmd: 'npm --version', name: 'npm' },
  java: { cmd: 'java -version', name: 'Java JDK' },
};

let missingJava = false;

for (const [key, check] of Object.entries(checks)) {
  try {
    const result = execSync(check.cmd, { encoding: 'utf8', stdio: 'pipe' });
    const version = result.split('\n')[0];
    console.log(`✅ ${check.name.padEnd(20)} ${version.trim()}`);
  } catch {
    console.log(`❌ ${check.name.padEnd(20)} NOT FOUND`);
    if (key === 'java') missingJava = true;
  }
}

if (missingJava) {
  console.log('\n⚠️  Java JDK not found.');
  console.log('   Installing Java JDK 11 (OpenJDK)...\n');
  
  if (isWindows) {
    console.log('   On Windows, downloading OpenJDK 11...');
    console.log('   Please download and install from: https://adoptium.net/');
    console.log('   After installation, restart this build.\n');
    process.exit(1);
  } else {
    console.log('   Run: brew install openjdk@11 (macOS) or sudo apt install openjdk-11-jdk (Linux)\n');
    process.exit(1);
  }
}

// ============================================================================
// STEP 2: Setup Android SDK (Lightweight - no Studio!)
// ============================================================================

console.log('\n🔧 Setting up Android SDK (command-line tools)...\n');

const androidHome = path.join(process.env.LOCALAPPDATA || process.env.HOME, 'Android', 'Sdk');
const androidToolsBin = path.join(androidHome, 'cmdline-tools', 'latest', 'bin');

if (!fs.existsSync(androidHome)) {
  console.log(`   Creating Android SDK directory: ${androidHome}`);
  fs.mkdirSync(androidHome, { recursive: true });
}

// Check if SDK already exists
if (fs.existsSync(androidToolsBin)) {
  console.log(`✅ Android SDK found at ${androidHome}`);
} else {
  console.log('   Downloading Android SDK command-line tools...');
  console.log('   (This downloads minimal SDK without Studio - ~200MB)\n');
  
  const cmdlineToolsUrl = isWindows
    ? 'https://dl.google.com/android/repository/cmdline-tools-windows-10406996_latest.zip'
    : 'https://dl.google.com/android/repository/cmdline-tools-linux-10406996_latest.zip';

  console.log(`   Downloading from: ${cmdlineToolsUrl}`);
  console.log('   This may take a few minutes...\n');
  
  // Use PowerShell on Windows or curl on Unix
  if (isWindows) {
    const tempZip = path.join(androidHome, 'cmdline-tools.zip');
    try {
      execSync(
        `powershell -Command "Invoke-WebRequest -Uri '${cmdlineToolsUrl}' -OutFile '${tempZip}' -UseBasicParsing"`,
        { stdio: 'inherit' }
      );
      console.log('\n   Extracting...');
      execSync(`powershell -Command "Expand-Archive -Path '${tempZip}' -DestinationPath '${androidHome}' -Force"`, {
        stdio: 'inherit',
      });
      fs.unlinkSync(tempZip);
      console.log(`✅ Android SDK extracted to ${androidHome}`);
    } catch (err) {
      console.error('❌ Failed to download Android SDK');
      console.log('   Manual setup: Download from https://developer.android.com/studio/command-line/');
      process.exit(1);
    }
  } else {
    try {
      execSync(`curl -L ${cmdlineToolsUrl} -o ${androidHome}/cmdline-tools.zip`, { stdio: 'inherit' });
      execSync(`unzip -q ${androidHome}/cmdline-tools.zip -d ${androidHome}`, { stdio: 'inherit' });
      fs.unlinkSync(path.join(androidHome, 'cmdline-tools.zip'));
      console.log(`✅ Android SDK extracted`);
    } catch {
      console.error('❌ Failed to download Android SDK');
      process.exit(1);
    }
  }
}

// ============================================================================
// STEP 3: Accept Android Licenses
// ============================================================================

console.log('\n✅ Accepting Android licenses...\n');

const sdkmanager = path.join(androidToolsBin, isWindows ? 'sdkmanager.bat' : 'sdkmanager');
if (fs.existsSync(sdkmanager)) {
  try {
    // Accept licenses
    execSync(`echo y | "${sdkmanager}" --licenses`, {
      cwd: androidHome,
      stdio: 'inherit',
      shell: true,
    });
  } catch {
    // Licenses might already be accepted
    console.log('   (Licenses already accepted or skipped)');
  }

  // Install required SDK platforms and build tools
  console.log('\n   Installing Android SDK platforms and build-tools...');
  try {
    execSync(`"${sdkmanager}" "platforms;android-35" "build-tools;35.0.0" "platform-tools"`, {
      stdio: 'inherit',
      shell: true,
    });
    console.log('✅ SDK platforms and build-tools installed');
  } catch (err) {
    console.log('⚠️  Some SDK components failed to install (may already exist)');
  }
}

// ============================================================================
// STEP 4: Set Environment Variables
// ============================================================================

console.log('\n🌍 Setting environment variables...\n');

const env = {
  ANDROID_HOME: androidHome,
  ANDROID_SDK_ROOT: androidHome,
};

for (const [key, value] of Object.entries(env)) {
  process.env[key] = value;
  console.log(`   ${key}=${value}`);
}

// ============================================================================
// STEP 5: Build the APK
// ============================================================================

console.log('\n' + '='.repeat(70));
console.log('🏗️  BUILDING APK');
console.log('='.repeat(70) + '\n');

const buildScript = path.join(projectRoot, 'build.cjs');
try {
  const res = spawnSync('node', [buildScript], {
    cwd: projectRoot,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });

  if (res.status !== 0) {
    console.error('\n❌ Build failed');
    process.exit(res.status || 1);
  }
} catch (err) {
  console.error('❌ Build error:', err.message);
  process.exit(1);
}

console.log('\n' + '='.repeat(70));
console.log('✅ SUCCESS!');
console.log('='.repeat(70) + '\n');

const apkPath = path.join(projectRoot, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
if (fs.existsSync(apkPath)) {
  console.log(`📦 APK Ready: ${apkPath}\n`);
  console.log('📱 Install on phone:\n');
  console.log(`   adb install -r "${apkPath}"\n`);
  console.log('Or transfer manually via USB.\n');
} else {
  console.error('⚠️  APK not found at expected location');
  process.exit(1);
}
