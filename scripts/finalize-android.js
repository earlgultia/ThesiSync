#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const publicMipmap = path.join(projectRoot, 'public', 'android-mipmap');
const androidRes = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res');

function copyMipmap() {
  if (!fs.existsSync(publicMipmap)) {
    console.log('⚠️  No android mipmap assets found at', publicMipmap);
    return false;
  }
  if (!fs.existsSync(androidRes)) {
    console.log('⚠️  Android res folder not found at', androidRes);
    return false;
  }

  try {
    const folders = fs.readdirSync(publicMipmap, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
    
    for (const folder of folders) {
      const srcFolder = path.join(publicMipmap, folder);
      const destFolder = path.join(androidRes, folder);
      if (!fs.existsSync(destFolder)) fs.mkdirSync(destFolder, { recursive: true });
      
      const files = fs.readdirSync(srcFolder).filter((f) => f.endsWith('.png'));
      for (const file of files) {
        const src = path.join(srcFolder, file);
        const dest = path.join(destFolder, file);
        fs.copyFileSync(src, dest);
        console.log('✅ Copied', src, '->', dest);
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

