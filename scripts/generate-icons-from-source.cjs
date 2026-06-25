#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// This script generates all required app icons from a source image
// Place your source icon at: public/icon-source.png (or 512x512+ PNG)
// Then run: node scripts/generate-icons-from-source.cjs

try {
  const sharp = require('sharp');
  
  const sourceFile = path.join(__dirname, '..', 'public', 'icon-source.png');
  const outDir = path.join(__dirname, '..', 'public', 'icons');
  const androidOutDir = path.join(__dirname, '..', 'public', 'android-mipmap');

  // Create output directories
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(androidOutDir, { recursive: true });

  if (!fs.existsSync(sourceFile)) {
    console.error('❌ Source icon not found at:', sourceFile);
    console.error('Please place your icon image (512x512 or larger PNG) at that location.');
    process.exit(1);
  }

  console.log('📦 Starting icon generation from:', sourceFile);

  // Web icon sizes
  const webSizes = [192, 512];
  const androidSizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
  };

  // Generate web icons
  const webPromises = webSizes.map(size =>
    sharp(sourceFile)
      .resize(size, size, { fit: 'cover', position: 'center' })
      .png()
      .toFile(path.join(outDir, `icon-${size}.png`))
      .then(() => console.log(`✓ Generated web icon: ${size}x${size}`))
  );

  // Generate Android mipmap icons
  const androidPromises = Object.entries(androidSizes).map(([folder, size]) => {
    const folderPath = path.join(androidOutDir, folder);
    fs.mkdirSync(folderPath, { recursive: true });
    return sharp(sourceFile)
      .resize(size, size, { fit: 'cover', position: 'center' })
      .png()
      .toFile(path.join(folderPath, 'ic_launcher.png'))
      .then(() => console.log(`✓ Generated Android icon: ${folder} (${size}x${size})`));
  });

  Promise.all([...webPromises, ...androidPromises])
    .then(() => {
      console.log('\n✅ Icon generation complete!');
      console.log('\n📋 Next steps:');
      console.log('1. Icons are ready in public/icons/ and public/android-mipmap/');
      console.log('2. Copy public/android-mipmap/* to android/app/src/main/res/ when building APK');
      console.log('3. Run: npm run android:sync (to sync with Capacitor)');
    })
    .catch(err => {
      console.error('❌ Error generating icons:', err.message);
      process.exit(1);
    });

} catch (err) {
  if (err.code === 'MODULE_NOT_FOUND') {
    console.error('❌ sharp not installed. Installing now...');
    const { execSync } = require('child_process');
    try {
      execSync('npm install sharp --save-dev', { stdio: 'inherit' });
      console.log('\n✓ sharp installed. Please run this script again.');
    } catch (e) {
      console.error('Failed to install sharp. Please run: npm install sharp --save-dev');
      process.exit(1);
    }
  } else {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}
