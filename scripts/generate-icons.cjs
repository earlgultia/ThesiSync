#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Lightweight icon generator without native deps.
// Writes a tiny placeholder PNG (1x1 transparent) into expected sizes and mipmap folders.

const outDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const sizes = [48, 72, 96, 144, 192, 256, 384, 512];
const androidMap = {
  mipmap_mdpi: 48,
  mipmap_hdpi: 72,
  mipmap_xhdpi: 96,
  mipmap_xxhdpi: 144,
  mipmap_xxxhdpi: 192,
};

// A 1x1 transparent PNG in base64
const tinyPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/6X6ZgAAAABJRU5ErkJggg==';
const pngBuffer = Buffer.from(tinyPngBase64, 'base64');

function writePlaceholders() {
  for (const size of sizes) {
    const file = path.join(outDir, `icon-${size}.png`);
    fs.writeFileSync(file, pngBuffer);
    console.log('Wrote', file);
  }

  // Generate simple android mipmap folders under public/android-mipmap
  const androidOut = path.join(__dirname, '..', 'public', 'android-mipmap');
  if (!fs.existsSync(androidOut)) fs.mkdirSync(androidOut, { recursive: true });

  for (const name of Object.keys(androidMap)) {
    const folder = path.join(androidOut, name);
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
    const file = path.join(folder, 'ic_launcher.png');
    fs.writeFileSync(file, pngBuffer);
    console.log('Wrote', file);
  }

  console.log('\nIcon generation complete (placeholders). Copy `public/android-mipmap/*` into `android/app/src/main/res/` when building.');
}

try {
  writePlaceholders();
} catch (err) {
  console.error('Icon generation failed:', err);
  process.exit(1);
}
