#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const manifestPath = path.join(projectRoot, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
const buildGradlePath = path.join(projectRoot, 'android', 'app', 'build.gradle');

function ensurePermission(manifest, permission) {
  if (manifest.includes(permission)) return manifest;
  const insertIndex = manifest.indexOf('</manifest>');
  if (insertIndex === -1) return manifest;
  const permLine = `    <uses-permission android:name="${permission}" />\n`;
  return manifest.slice(0, insertIndex) + permLine + manifest.slice(insertIndex);
}

function patchManifest() {
  if (!fs.existsSync(manifestPath)) {
    console.log('⚠️  AndroidManifest.xml not found - will be created by Capacitor');
    return false;
  }

  try {
    let manifest = fs.readFileSync(manifestPath, 'utf8');
    const perms = [
      'android.permission.INTERNET',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE'
    ];
    
    for (const p of perms) {
      if (!manifest.includes(p)) {
        manifest = ensurePermission(manifest, p);
        console.log('✅ Added permission', p);
      } else {
        console.log('ℹ️  Permission already present:', p);
      }
    }
    
    fs.writeFileSync(manifestPath, manifest, 'utf8');
    console.log('✅ AndroidManifest.xml patched');
    return true;
  } catch (err) {
    console.error('❌ Error patching manifest:', err.message);
    return false;
  }
}

function patchBuildGradle() {
  if (!fs.existsSync(buildGradlePath)) {
    console.log('⚠️  build.gradle not found');
    return false;
  }

  try {
    let content = fs.readFileSync(buildGradlePath, 'utf8');
    if (content.includes('// ThesiSync auto-permissions')) {
      console.log('ℹ️  build.gradle already patched');
      return true;
    }

    content = content.replace(/(android\s*\{)/, `$1\n    // ThesiSync auto-permissions: marker\n`);
    fs.writeFileSync(buildGradlePath, content, 'utf8');
    console.log('✅ build.gradle patched (marker inserted)');
    return true;
  } catch (err) {
    console.error('❌ Error patching build.gradle:', err.message);
    return false;
  }
}

console.log('Patching native Android files...');
patchManifest();
patchBuildGradle();
console.log('✅ Native patching complete');

