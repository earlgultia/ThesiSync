#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = process.cwd();

console.log('\n🚀 ThesiSync APK Builder (Simple Mode)\n');

// Step 1: Install npm deps
console.log('1️⃣  Installing npm dependencies...');
try {
  execSync('npm ci --prefer-offline', { cwd: projectRoot, stdio: 'inherit' });
  console.log('✅ Dependencies installed\n');
} catch {
  console.log('⚠️  npm ci had issues, trying npm install...');
  try {
    execSync('npm install --legacy-peer-deps', { cwd: projectRoot, stdio: 'inherit' });
    console.log('✅ Dependencies installed\n');
  } catch (err) {
    console.error('❌ npm install failed:', err.message);
    process.exit(1);
  }
}

// Step 2: Generate icons
console.log('2️⃣  Generating app icons...');
try {
  execSync('node scripts/generate-icons.cjs', { cwd: projectRoot, stdio: 'inherit' });
  console.log('✅ Icons generated\n');
} catch (err) {
  console.error('❌ Icon generation failed:', err.message);
  process.exit(1);
}

// Step 3: Build web
console.log('3️⃣  Building web app...');
try {
  execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' });
  console.log('✅ Web app built\n');
} catch (err) {
  console.error('❌ Web build failed:', err.message);
  process.exit(1);
}

// Step 4: Check if Capacitor is installed
console.log('4️⃣  Setting up Capacitor...');
try {
  execSync('npm install @capacitor/cli @capacitor/core --save', { cwd: projectRoot, stdio: 'inherit' });
} catch {
  console.log('⚠️  Capacitor install had issues (may already be installed)');
}

// Step 5: Initialize Android (if needed)
const androidDir = path.join(projectRoot, 'android');
if (!fs.existsSync(androidDir)) {
  console.log('5️⃣  Initializing Capacitor Android project...');
  try {
    execSync('npx cap init ThesiSync com.example.thesisync --web-dir=dist', { 
      cwd: projectRoot, 
      stdio: 'inherit' 
    });
    console.log('✅ Capacitor initialized\n');
  } catch (err) {
    console.error('❌ cap init failed - Java/Android SDK may not be installed');
    console.error('Error:', err.message);
    console.log('\n📝 You need to install:');
    console.log('   1. Java JDK 11+: https://adoptium.net/');
    console.log('   2. Android SDK: https://developer.android.com/studio/command-line/\n');
    process.exit(1);
  }

  console.log('6️⃣  Adding Android platform...');
  try {
    execSync('npx cap add android', { cwd: projectRoot, stdio: 'inherit' });
    console.log('✅ Android platform added\n');
  } catch (err) {
    console.error('❌ cap add android failed:', err.message);
    process.exit(1);
  }
}

// Step 6: Copy web assets
console.log('7️⃣  Copying web assets to Android...');
try {
  execSync('npx cap copy android', { cwd: projectRoot, stdio: 'inherit' });
  console.log('✅ Assets copied\n');
} catch (err) {
  console.error('❌ cap copy failed:', err.message);
  process.exit(1);
}

// Step 7: Finalize
console.log('8️⃣  Finalizing Android project...');
try {
  execSync('node scripts/finalize-android.cjs', { cwd: projectRoot, stdio: 'inherit' });
  console.log('✅ Finalized\n');
} catch {
  console.log('⚠️  finalize had issues (continuing anyway)\n');
}

// Step 8: Patch manifest
console.log('9️⃣  Patching permissions...');
try {
  execSync('node scripts/patch-android-native.cjs', { cwd: projectRoot, stdio: 'inherit' });
  console.log('✅ Permissions patched\n');
} catch {
  console.log('⚠️  Patch had issues (continuing anyway)\n');
}

// Step 9: Build APK
console.log('🔟 Building APK with Gradle...');
console.log('   (This takes 5-15 minutes, be patient...)\n');

const gradlewPath = path.join(androidDir, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');
const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';

if (!fs.existsSync(gradlewPath)) {
  console.error('❌ Gradle wrapper not found');
  process.exit(1);
}

try {
  execSync(`${gradlew} assembleDebug -x lint`, { 
    cwd: androidDir, 
    stdio: 'inherit',
    shell: true
  });
} catch (err) {
  console.error('\n❌ Gradle build failed');
  console.error('Error:', err.message);
  process.exit(1);
}

// Verify APK
console.log('\n✅ Build completed!\n');
const apkPath = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
if (fs.existsSync(apkPath)) {
  const stats = fs.statSync(apkPath);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
  console.log('📦 APK READY:\n');
  console.log(`   ${apkPath}\n`);
  console.log(`   Size: ${sizeMB} MB\n`);
  console.log('📱 Install with ADB:\n');
  console.log(`   adb install -r "${apkPath}"\n`);
  console.log('Or transfer manually to your phone and tap to install.\n');
} else {
  console.error('⚠️  APK not found at expected path');
  console.error(`   Expected: ${apkPath}`);
  process.exit(1);
}
