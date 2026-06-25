#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const publicMipmap = path.join(projectRoot, 'public', 'android-mipmap');
const publicIconSource = path.join(projectRoot, 'public', 'icons', 'icon-512.png');
const androidRes = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res');
const launcherBase = 'ic_launcher';
const launcherRound = 'ic_launcher_round';
const launcherForeground = 'ic_launcher_foreground';

function ensurePublicMipmap() {
  const densities = ['mipmap-mdpi', 'mipmap-hdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi'];
  const launcherFiles = [
    `${launcherBase}.png`,
    `${launcherRound}.png`,
    `${launcherForeground}.png`,
  ];

  if (!fs.existsSync(publicMipmap)) {
    fs.mkdirSync(publicMipmap, { recursive: true });
  }

  if (fs.existsSync(publicIconSource)) {
    for (const density of densities) {
      const densityDir = path.join(publicMipmap, density);
      fs.mkdirSync(densityDir, { recursive: true });
      for (const fileName of launcherFiles) {
        fs.copyFileSync(publicIconSource, path.join(densityDir, fileName));
      }
    }
    console.log('✅ Updated android mipmap assets from public/icons/icon-512.png');
    return true;
  }

  if (!fs.existsSync(publicMipmap)) {
    return false;
  }
  const hasDensity = densities.some((density) => fs.existsSync(path.join(publicMipmap, density)));
  return hasDensity;
}

function copyMipmap() {
  if (!ensurePublicMipmap()) {
    console.log('⚠️  No android mipmap assets found at', publicMipmap);
    return false;
  }
  if (!fs.existsSync(androidRes)) {
    console.log('⚠️  Android res folder not found at', androidRes);
    return false;
  }

  const densities = ['mipmap-mdpi', 'mipmap-hdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi'];
  const launcherFiles = [
    `${launcherBase}.png`,
    `${launcherRound}.png`,
    `${launcherForeground}.png`,
  ];

  try {
    for (const density of densities) {
      const srcFolder = path.join(publicMipmap, density);
      const destFolder = path.join(androidRes, density);
      if (!fs.existsSync(srcFolder)) continue;
      if (!fs.existsSync(destFolder)) {
        fs.mkdirSync(destFolder, { recursive: true });
      }

      for (const file of launcherFiles) {
        const src = path.join(srcFolder, file);
        const dest = path.join(destFolder, file);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
          console.log('✅ Copied', src, '->', dest);
        }
      }
    }

    for (const density of densities) {
      const destFolder = path.join(androidRes, density);
      if (!fs.existsSync(destFolder)) continue;
      for (const fileName of launcherFiles) {
        const dest = path.join(destFolder, fileName);
        if (fs.existsSync(publicIconSource)) {
          fs.copyFileSync(publicIconSource, dest);
          console.log('✅ Forced', publicIconSource, '->', dest);
        }
      }
    }

    console.log('✅ Mipmap assets copied');
    return true;
  } catch (err) {
    console.error('❌ Error copying mipmap:', err.message);
    return false;
  }
}

function patchBuildGradle() {
  const buildGradle = path.join(projectRoot, 'android', 'app', 'build.gradle');
  if (!fs.existsSync(buildGradle)) {
    console.log('⚠️  build.gradle not found');
    return false;
  }

  try {
    let content = fs.readFileSync(buildGradle, 'utf8');
    
    if (content.includes('// ThesiSync signing config')) {
      console.log('ℹ️  Signing config already present');
      return true;
    }

    const insertAfter = 'android {';
    const idx = content.indexOf(insertAfter);
    if (idx === -1) {
      console.log('⚠️  Could not find android { block');
      return false;
    }

    const signingSnippet = `
    // ThesiSync signing config
    def keystoreFileProp = project.hasProperty('keystoreFile') ? project.property('keystoreFile') : null
    signingConfigs {
        release {
            if (keystoreFileProp != null) {
                storeFile file(keystoreFileProp)
                storePassword project.property('keystorePassword')
                keyAlias project.property('keyAlias')
                keyPassword project.property('keyPassword')
            }
        }
    }
`;

    content = content.slice(0, idx + insertAfter.length) + signingSnippet + content.slice(idx + insertAfter.length);
    fs.writeFileSync(buildGradle, content, 'utf8');
    console.log('✅ Patched build.gradle with signing config');
    return true;
  } catch (err) {
    console.error('❌ Error patching build.gradle:', err.message);
    return false;
  }
}

console.log('Finalizing Android project...');
copyMipmap();
patchBuildGradle();
console.log('✅ Android finalization complete');

