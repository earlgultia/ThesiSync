#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const outDir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(outDir, { recursive: true });

function crc32(buf) {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const b of buf) {
    crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  }
  return Buffer.from([crc ^ 0xffffffff]).reverse();
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const chunk = Buffer.concat([len, typeBuf, data]);
  return Buffer.concat([chunk, crc32(Buffer.concat([typeBuf, data]))]);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function mixColor(c1, c2, t) {
  return [
    Math.round(lerp(c1[0], c2[0], t)),
    Math.round(lerp(c1[1], c2[1], t)),
    Math.round(lerp(c1[2], c2[2], t)),
    Math.round(lerp(c1[3], c2[3], t)),
  ];
}

function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function drawIcon(width, height) {
  const data = Buffer.alloc((width * 4 + 1) * height);
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.5;

  for (let y = 0; y < height; y++) {
    const rowIndex = y * (width * 4 + 1);
    data[rowIndex] = 0;
    for (let x = 0; x < width; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      const dx = (px - cx) / radius;
      const dy = (py - cy) / radius;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      const bgTop = [10, 26, 84, 255];
      const bgBottom = [16, 78, 156, 255];
      const bg = mixColor(bgTop, bgBottom, smoothstep(0.2, 0.9, (py / height) ** 1.5));

      let pixel = bg;

      const ring = smoothstep(0.36, 0.42, dist) - smoothstep(0.46, 0.52, dist);
      if (ring > 0) {
        const ringBase = mixColor([70, 182, 255, 255], [105, 125, 255, 255], (Math.sin(angle * 4) + 1) / 2);
        pixel = mixColor(pixel, ringBase, ring * 0.96);
      }

      const halo = smoothstep(0.5, 0.55, dist) - smoothstep(0.62, 0.68, dist);
      if (halo > 0) {
        pixel = mixColor(pixel, [74, 179, 255, 255], halo * 0.28);
      }

      const arrow1 = smoothstep(0.38, 0.42, dist) * smoothstep(-0.3, 0.0, Math.cos(angle - 1.4));
      const arrow2 = smoothstep(0.38, 0.42, dist) * smoothstep(-0.3, 0.0, Math.cos(angle + 1.75));
      const arrowGlow = Math.max(arrow1, arrow2);
      if (arrowGlow > 0) {
        pixel = mixColor(pixel, [190, 240, 255, 255], arrowGlow * 0.8);
      }

      const tBar = py >= height * 0.18 && py <= height * 0.27 && px >= width * 0.30 && px <= width * 0.70;
      const tStem = px >= width * 0.46 && px <= width * 0.54 && py >= height * 0.18 && py <= height * 0.70;
      const isT = tBar || tStem;

      const sBand = Math.abs((px / width - 0.5) - 0.18 * Math.sin((py / height) * Math.PI * 2.2));
      const isS = sBand < 0.06 && py >= height * 0.22 && py <= height * 0.76;
      const isSGlow = sBand < 0.11 && py >= height * 0.22 && py <= height * 0.76;

      if (isSGlow) {
        pixel = mixColor(pixel, [18, 78, 222, 255], 0.28);
      }
      if (isS) {
        const sColor = mixColor([80, 215, 255, 255], [32, 112, 255, 255], 0.5 + 0.4 * Math.sin(angle * 3));
        pixel = mixColor(pixel, sColor, 0.98);
      }

      if (isT) {
        const tColor = [252, 252, 252, 255];
        const tGlow = mixColor(pixel, [160, 220, 255, 255], 0.18);
        pixel = mixColor(tColor, tGlow, 0.82);
      }

      const alpha = 255;
      const offset = rowIndex + 1 + x * 4;
      data[offset] = pixel[0];
      data[offset + 1] = pixel[1];
      data[offset + 2] = pixel[2];
      data[offset + 3] = alpha;
    }
  }

  return data;
}

function writePng(filename, width, height) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = drawIcon(width, height);
  const idat = zlib.deflateSync(raw);

  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);

  fs.writeFileSync(filename, png);
  console.log('Wrote', filename);
}

writePng(path.join(outDir, 'icon-512.png'), 512, 512);
writePng(path.join(outDir, 'icon-192.png'), 192, 192);
