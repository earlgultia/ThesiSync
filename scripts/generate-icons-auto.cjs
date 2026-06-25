#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const sourceFile = path.join(__dirname, '..', 'public', 'icon-source.png');
const outDir = path.join(__dirname, '..', 'public', 'icons');
const androidOutDir = path.join(__dirname, '..', 'public', 'android-mipmap');

// Create output directories
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
if (!fs.existsSync(androidOutDir)) fs.mkdirSync(androidOutDir, { recursive: true });

if (!fs.existsSync(sourceFile)) {
  console.error('❌ Source icon not found at:', sourceFile);
  process.exit(1);
}

console.log('📦 Installing sharp...');
try {
  execSync('npm install sharp --save-dev', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
} catch (err) {
  console.error('Failed to install sharp');
  process.exit(1);
}

console.log('\n🎨 Generating icons...');

const sharp = require('sharp');

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
    .then(() => console.log(`✓ Generated: icon-${size}.png`))
    .catch(err => console.error(`✗ Error generating icon-${size}.png:`, err.message))
);

// Generate Android mipmap icons
const androidPromises = Object.entries(androidSizes).map(([folder, size]) => {
  const folderPath = path.join(androidOutDir, folder);
  if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
  
  return sharp(sourceFile)
    .resize(size, size, { fit: 'cover', position: 'center' })
    .png()
    .toFile(path.join(folderPath, 'ic_launcher.png'))
    .then(() => console.log(`✓ Generated: ${folder}/ic_launcher.png (${size}x${size})`))
    .catch(err => console.error(`✗ Error generating ${folder}:`, err.message));
});

Promise.all([...webPromises, ...androidPromises])
  .then(() => {
    console.log('\n✅ All icons generated successfully!');
    console.log('\n📋 Completed:');
    console.log('✓ public/icons/ - Web icons (192, 512)');
    console.log('✓ public/android-mipmap/ - Android icons (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)');
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
