#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runCmd(cmd, args, description) {
  console.log(`\n[BUILD] ${description}...`);
  console.log(`> ${cmd} ${args.join(' ')}\n`);
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: true });
  if (res.status !== 0) {
    console.error(`\n[ERROR] ${description} failed with status ${res.status}`);
    process.exit(res.status || 1);
  }
  console.log(`[OK] ${description} completed successfully`);
  return res;
}

const projectRoot = process.cwd();

// Step 1: Clean install deps
runCmd('npm', ['ci'], 'Installing dependencies');

// Step 2: Generate icons
runCmd('node', [path.join('scripts', 'generate-icons.cjs')], 'Generating placeholder icons');

// Verify icons were created
const iconsDir = path.join(projectRoot, 'public', 'icons');
const androidMimapDir = path.join(projectRoot, 'public', 'android-mipmap');
if (fs.existsSync(iconsDir)) {
  const icons = fs.readdirSync(iconsDir);
  console.log(`[INFO] Generated ${icons.length} web icons`);
}
if (fs.existsSync(androidMimapDir)) {
  const folders = fs.readdirSync(androidMimapDir, { withFileTypes: true }).filter(d => d.isDirectory());
  console.log(`[INFO] Generated ${folders.length} Android mipmap folders`);
}

// Step 3: Build web assets
runCmd('npm', ['run', 'build'], 'Building web assets with Vite');

// Step 4: Setup Android (cap init/add)
runCmd('node', [path.join('scripts', 'setup-android.cjs')], 'Setting up Capacitor Android project');

// Verify Android project exists
const androidDir = path.join(projectRoot, 'android');
if (!fs.existsSync(androidDir)) {
  console.error('\n[FATAL] Android project was not created by Capacitor');
  process.exit(1);
}
console.log(`[INFO] Android project created at ${androidDir}`);

// Step 5: Finalize Android (copy icons, patch gradle)
runCmd('node', [path.join('scripts', 'finalize-android.cjs')], 'Finalizing Android project (copy icons, patch gradle)');

// Step 6: Patch native manifest
runCmd('node', [path.join('scripts', 'patch-android-native.cjs')], 'Patching native manifest and build config');

// Step 7: Assemble debug APK
runCmd('node', [path.join('scripts', 'build-android-debug.cjs')], 'Building debug APK');

// Verify APK exists
const apkPath = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
if (fs.existsSync(apkPath)) {
  const stats = fs.statSync(apkPath);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
  console.log(`\n[SUCCESS] Debug APK built: ${apkPath}`);
  console.log(`[SUCCESS] APK size: ${sizeMB} MB`);
  console.log(`\n[NEXT] Transfer APK to phone: adb install -r "${apkPath}"`);
} else {
  console.error(`\n[FATAL] APK not found at ${apkPath}`);
  process.exit(1);
}

console.log('\n[COMPLETE] Build finished successfully!');
