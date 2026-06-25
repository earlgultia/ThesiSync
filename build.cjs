#!/usr/bin/env node
/**
 * ThesiSync APK Builder - Robust build with detailed error handling
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
let hasErrors = false;

function log(msg) {
  console.log(msg);
}

function logError(msg) {
  console.error('❌ ERROR: ' + msg);
  hasErrors = true;
}

function logSuccess(msg) {
  console.log('✅ ' + msg);
}

function runCmd(label, cmd, args, options = {}) {
  log(`\n▶️  ${label}`);
  log(`   Command: ${cmd} ${args.join(' ')}`);
  
  const result = spawnSync(cmd, args, {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: true,
    ...options,
  });

  if (result.status !== 0) {
    logError(`${label} failed (exit code ${result.status})`);
    if (options.critical) {
      log('\n❌ CRITICAL ERROR - Cannot continue');
      process.exit(1);
    }
    return false;
  }
  
  logSuccess(label);
  return true;
}

log('\n' + '='.repeat(70));
log('🚀 THESISYNC APK BUILD');
log('='.repeat(70));

// Step 1: Verify Node/npm
log('\n1️⃣  Checking environment...');
const nodeVer = spawnSync('node', ['--version'], { encoding: 'utf8' });
const npmVer = spawnSync('npm', ['--version'], { encoding: 'utf8' });
if (nodeVer.status === 0 && npmVer.status === 0) {
  logSuccess(`Node ${nodeVer.stdout.trim()} and npm ${npmVer.stdout.trim()} found`);
} else {
  logError('Node or npm not found!');
  process.exit(1);
}

// Step 2: Generate icons
log('\n2️⃣  Generating app icons...');
runCmd(
  'Icon generation',
  'node',
  ['scripts/generate-icons.cjs'],
  { critical: true }
);

// Verify icons
const publicIconsDir = path.join(projectRoot, 'public', 'icons');
const publicMimapDir = path.join(projectRoot, 'public', 'android-mipmap');
if (fs.existsSync(publicIconsDir)) {
  const count = fs.readdirSync(publicIconsDir).length;
  logSuccess(`${count} web icons created`);
} else {
  logError('Icons directory not created');
}

if (fs.existsSync(publicMimapDir)) {
  const count = fs.readdirSync(publicMimapDir).length;
  logSuccess(`${count} Android mipmap folders created`);
} else {
  logError('Android mipmap directory not created');
}

// Step 3: Build web assets
log('\n3️⃣  Building web assets with Vite...');
runCmd(
  'Vite build',
  'npm',
  ['run', 'build'],
  { critical: true }
);

const distDir = path.join(projectRoot, 'dist');
if (fs.existsSync(distDir)) {
  const size = getDirectorySize(distDir);
  logSuccess(`Web assets built (${size} MB)`);
} else {
  logError('dist/ folder not created');
}

// Step 4: Setup Capacitor Android
log('\n4️⃣  Setting up Capacitor Android project...');
log('   (This may take a few minutes on first run)');

runCmd(
  'Install Capacitor',
  'npm',
  ['install', '@capacitor/cli', '@capacitor/core'],
  { critical: false }
);

runCmd(
  'Capacitor initialization',
  'npx',
  ['cap', 'init', 'ThesiSync', 'com.example.thesisync', '--web-dir=dist'],
  { critical: false }
);

runCmd(
  'Add Android platform',
  'npx',
  ['cap', 'add', 'android'],
  { critical: false }
);

runCmd(
  'Copy web assets to Android',
  'npx',
  ['cap', 'copy', 'android'],
  { critical: false }
);

// Check if android folder was created
const androidDir = path.join(projectRoot, 'android');
if (!fs.existsSync(androidDir)) {
  logError('Android project was not created. Capacitor initialization likely failed.');
  log('\nTroubleshooting:');
  log('  1. Ensure Java JDK 11+ is installed: java -version');
  log('  2. Ensure Android SDK is installed (via Android Studio or command-line tools)');
  log('  3. Set ANDROID_HOME environment variable');
  log('  4. Try: npm cache clean --force && rm -r node_modules && npm install');
  process.exit(1);
}

logSuccess('Android project created');

// Step 5: Finalize Android
log('\n5️⃣  Finalizing Android project...');
runCmd(
  'Copy icons to Android res',
  'node',
  ['scripts/finalize-android.cjs'],
  { critical: false }
);

// Step 6: Patch manifest
log('\n6️⃣  Patching Android manifest...');
runCmd(
  'Patch native permissions',
  'node',
  ['scripts/patch-android-native.cjs'],
  { critical: false }
);

// Step 7: Build APK
log('\n7️⃣  Building debug APK with Gradle...');
log('   (This may take 5-10 minutes)');

const gradlewPath = path.join(androidDir, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');
if (!fs.existsSync(gradlewPath)) {
  logError('Gradle wrapper not found. Android project setup incomplete.');
  process.exit(1);
}

// Make gradlew executable on non-Windows
if (process.platform !== 'win32') {
  spawnSync('chmod', ['+x', gradlewPath]);
}

const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
runCmd(
  'Gradle assembleDebug',
  gradlew,
  ['assembleDebug', '-x', 'lint'],
  { cwd: androidDir, critical: true }
);

// Step 8: Verify APK
log('\n8️⃣  Verifying APK...');
const apkPath = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
if (fs.existsSync(apkPath)) {
  const stats = fs.statSync(apkPath);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
  logSuccess(`APK built successfully! (${sizeMB} MB)`);
} else {
  logError('APK file was not created at expected path');
  logError(`Expected: ${apkPath}`);
  process.exit(1);
}

// Final summary
log('\n' + '='.repeat(70));
log('🎉 BUILD COMPLETE!\n');
log('📁 APK Location:');
log(`   ${apkPath}\n`);
log('📱 Next steps to install on your phone:\n');
log('   Option 1 - Using ADB (requires USB debugging enabled):');
log(`   adb install -r "${apkPath}"\n`);
log('   Option 2 - Manual transfer:');
log('   1. Copy the APK file to your phone via USB cable');
log('   2. Tap the APK file to install\n');
log('='.repeat(70));

function getDirectorySize(dirPath) {
  let size = 0;
  const files = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const file of files) {
    const filePath = path.join(dirPath, file.name);
    if (file.isDirectory()) {
      size += getDirectorySize(filePath);
    } else {
      size += fs.statSync(filePath).size;
    }
  }
  return (size / 1024 / 1024).toFixed(1);
}
