/*
 * Generates the PWA PNG icons (no external dependencies — a tiny pure-Node PNG
 * encoder). Draws a green rounded-square icon with a white shopping bag.
 * Outputs: public/icon-192.png, icon-512.png, icon-512-maskable.png, icon-180.png
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1));
  }
  return (~c) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}
function encodePNG(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit, RGBA
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // no filter
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

function draw(size, maskable) {
  const rgba = Buffer.alloc(size * size * 4);
  const radius = size * 0.22;
  // Shopping-bag geometry (a bit tighter inside the safe zone for maskable).
  const inset = maskable ? 0.34 : 0.29;
  const bx0 = size * inset, bx1 = size * (1 - inset);
  const bw = bx1 - bx0;
  const by0 = size * (maskable ? 0.48 : 0.46), by1 = size * (maskable ? 0.70 : 0.72);
  // Two small handles (like a shopping bag), not one arc (which reads as a lock).
  const h1x = bx0 + bw * 0.30, h2x = bx0 + bw * 0.70;
  const hr = bw * 0.18, ht = size * 0.032;
  const bagR = size * 0.045; // bag corner rounding

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      let r = 0, g = 0, b = 0, a = 0;
      // Background (rounded square for "any", full bleed for maskable)
      let inBg = true;
      if (!maskable) {
        const dx = Math.max(radius - x, x - (size - radius), 0);
        const dy = Math.max(radius - y, y - (size - radius), 0);
        if (dx > 0 && dy > 0 && Math.hypot(dx, dy) > radius) inBg = false;
      }
      if (inBg) {
        const t = (x + y) / (2 * size);
        r = Math.round(0x1E + (0x0F - 0x1E) * t);
        g = Math.round(0x6B + (0x3A - 0x6B) * t);
        b = Math.round(0x47 + (0x26 - 0x47) * t);
        a = 255;
      }
      // White bag body (rounded rect)
      let inBody = false;
      if (x >= bx0 && x <= bx1 && y >= by0 && y <= by1) {
        const cdx = Math.max(bx0 + bagR - x, x - (bx1 - bagR), 0);
        const cdy = Math.max(by0 + bagR - y, y - (by1 - bagR), 0);
        inBody = !(cdx > 0 && cdy > 0 && Math.hypot(cdx, cdy) > bagR);
      }
      // Two white handles (top-half arcs) => shopping bag
      const d1 = Math.hypot(x - h1x, y - by0);
      const d2 = Math.hypot(x - h2x, y - by0);
      const inHandle = (y < by0) && (
        (d1 > hr - ht && d1 < hr + ht) || (d2 > hr - ht && d2 < hr + ht)
      );
      if (a === 255 && (inBody || inHandle)) { r = 255; g = 255; b = 255; }
      rgba[i] = r; rgba[i + 1] = g; rgba[i + 2] = b; rgba[i + 3] = a;
    }
  }
  return rgba;
}

const outDir = path.join(__dirname, '..', 'public');
const targets = [
  ['icon-192.png', 192, false],
  ['icon-512.png', 512, false],
  ['icon-512-maskable.png', 512, true],
  ['icon-180.png', 180, false],
];
for (const [name, size, mask] of targets) {
  fs.writeFileSync(path.join(outDir, name), encodePNG(size, draw(size, mask)));
  console.log('wrote', name, size + 'x' + size);
}
