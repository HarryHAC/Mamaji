/*
 * Builds the app/PWA icons from public/logo.png by cropping the square
 * pin+character symbol (excluding the wordmark) and resizing.
 * Pure Node — decodes the PNG (8-bit RGBA), bilinear-resizes, re-encodes.
 * Outputs: public/icon-192.png, icon-512.png, icon-512-maskable.png, icon-180.png, favicon.png
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ── PNG encode (from gen-icons) ──
function crc32(buf) { let c = ~0; for (let i = 0; i < buf.length; i++) { c ^= buf[i]; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1)); } return (~c) >>> 0; }
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0); const t = Buffer.from(type, 'ascii'); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0); return Buffer.concat([len, t, data, crc]); }
function encodePNGRect(w, h, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const stride = w * 4; const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (stride + 1)] = 0; rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride); }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}
const encodePNG = (size, rgba) => encodePNGRect(size, size, rgba);

// Downscale the whole logo (keep aspect + alpha) for web display.
function resizeFull(src, outW) {
  const { width: sw, height: sh, rgba } = src;
  const outH = Math.round(sh * (outW / sw));
  const dst = Buffer.alloc(outW * outH * 4);
  for (let dy = 0; dy < outH; dy++) for (let dx = 0; dx < outW; dx++) {
    const fx = (dx / (outW - 1)) * (sw - 1), fy = (dy / (outH - 1)) * (sh - 1);
    const x0 = Math.floor(fx), y0 = Math.floor(fy), x1 = Math.min(x0 + 1, sw - 1), y1 = Math.min(y0 + 1, sh - 1);
    const wx = fx - x0, wy = fy - y0; const si = (xx, yy) => (yy * sw + xx) * 4;
    let r = 0, g = 0, b = 0, a = 0;
    for (const [xx, yy, w] of [[x0, y0, (1 - wx) * (1 - wy)], [x1, y0, wx * (1 - wy)], [x0, y1, (1 - wx) * wy], [x1, y1, wx * wy]]) {
      const s = si(xx, yy); r += rgba[s] * w; g += rgba[s + 1] * w; b += rgba[s + 2] * w; a += rgba[s + 3] * w;
    }
    const di = (dy * outW + dx) * 4;
    dst[di] = Math.round(r); dst[di + 1] = Math.round(g); dst[di + 2] = Math.round(b); dst[di + 3] = Math.round(a);
  }
  return { w: outW, h: outH, rgba: dst };
}

// ── PNG decode (8-bit RGBA, non-interlaced) ──
function decodePNG(buf) {
  let pos = 8, width = 0, height = 0; const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos); const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.slice(pos + 8, pos + 8 + len);
    if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = 4, stride = width * bpp, out = Buffer.alloc(height * stride);
  const paeth = (a, b, c) => { const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c); return pa <= pb && pa <= pc ? a : (pb <= pc ? b : c); };
  let p = 0;
  for (let y = 0; y < height; y++) {
    const f = raw[p++];
    for (let x = 0; x < stride; x++) {
      const rb = raw[p++];
      const a = x >= bpp ? out[y * stride + x - bpp] : 0;
      const b = y > 0 ? out[(y - 1) * stride + x] : 0;
      const c = (x >= bpp && y > 0) ? out[(y - 1) * stride + x - bpp] : 0;
      let v; switch (f) { case 1: v = rb + a; break; case 2: v = rb + b; break; case 3: v = rb + ((a + b) >> 1); break; case 4: v = rb + paeth(a, b, c); break; default: v = rb; }
      out[y * stride + x] = v & 0xff;
    }
  }
  return { width, height, rgba: out };
}

function makeIcon(src, crop, outSize, maskable) {
  const { width: sw, height: sh, rgba } = src;
  // background = logo's corner colour (cream), so padding blends in
  const bg = [rgba[(crop.y * sw + crop.x) * 4], rgba[(crop.y * sw + crop.x) * 4 + 1], rgba[(crop.y * sw + crop.x) * 4 + 2]];
  const dst = Buffer.alloc(outSize * outSize * 4);
  for (let i = 0; i < dst.length; i += 4) { dst[i] = bg[0]; dst[i + 1] = bg[1]; dst[i + 2] = bg[2]; dst[i + 3] = 255; }
  const scale = maskable ? 0.80 : 1.0;
  const drawSize = Math.round(outSize * scale);
  const off = Math.round((outSize - drawSize) / 2);
  for (let dy = 0; dy < drawSize; dy++) {
    for (let dx = 0; dx < drawSize; dx++) {
      const fx = crop.x + (dx / (drawSize - 1)) * (crop.w - 1);
      const fy = crop.y + (dy / (drawSize - 1)) * (crop.h - 1);
      const x0 = Math.floor(fx), y0 = Math.floor(fy);
      const x1 = Math.min(x0 + 1, sw - 1), y1 = Math.min(y0 + 1, sh - 1);
      const wx = fx - x0, wy = fy - y0;
      const si = (xx, yy) => (yy * sw + xx) * 4;
      let r = 0, g = 0, b = 0, a = 0;
      for (const [xx, yy, w] of [[x0, y0, (1 - wx) * (1 - wy)], [x1, y0, wx * (1 - wy)], [x0, y1, (1 - wx) * wy], [x1, y1, wx * wy]]) {
        const s = si(xx, yy); r += rgba[s] * w; g += rgba[s + 1] * w; b += rgba[s + 2] * w; a += rgba[s + 3] * w;
      }
      a /= 255;
      const di = ((dy + off) * outSize + (dx + off)) * 4;
      dst[di] = Math.round(r * a + bg[0] * (1 - a));
      dst[di + 1] = Math.round(g * a + bg[1] * (1 - a));
      dst[di + 2] = Math.round(b * a + bg[2] * (1 - a));
      dst[di + 3] = 255;
    }
  }
  return dst;
}

const dir = path.join(__dirname, '..', 'public');
const src = decodePNG(fs.readFileSync(path.join(__dirname, 'assets', 'logo-source.png')));
console.log('source', src.width + 'x' + src.height);

// Square crop of the pin + character symbol (excludes the wordmark below).
const crop = { x: 930, y: 88, w: 960, h: 960 };

for (const [name, size, mask] of [
  ['icon-192.png', 192, false], ['icon-512.png', 512, false],
  ['icon-512-maskable.png', 512, true], ['icon-180.png', 180, false],
  ['favicon.png', 64, false],
]) {
  fs.writeFileSync(path.join(dir, name), encodePNG(size, makeIcon(src, crop, size, mask)));
  console.log('wrote', name);
}

// Web-optimized full logo for the login screen (keeps the wordmark).
const web = resizeFull(src, 720);
fs.writeFileSync(path.join(dir, 'logo-web.png'), encodePNGRect(web.w, web.h, web.rgba));
console.log('wrote logo-web.png', web.w + 'x' + web.h);
