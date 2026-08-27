/*
 * Self-contained QR Code generator (no third-party library).
 * Byte mode, error-correction level L, automatic version (1–8, single ECC
 * block), all 8 data masks with penalty-based selection. Produces a real,
 * scannable QR matrix. Enough capacity for short payment strings.
 *
 * Algorithm follows the QR Code spec (ISO/IEC 18004). GF(256) with the
 * primitive polynomial 0x11D.
 */

// ── GF(256) tables ──
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(function initGF() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();
function gmul(a, b) {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

// Reed–Solomon divisor polynomial of the given degree.
function rsDivisor(degree) {
  const result = new Uint8Array(degree);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      result[j] = gmul(result[j], root);
      if (j + 1 < degree) result[j] ^= result[j + 1];
    }
    root = gmul(root, 2);
  }
  return result;
}
function rsRemainder(data, divisor) {
  const result = new Uint8Array(divisor.length);
  for (const b of data) {
    const factor = b ^ result[0];
    result.copyWithin(0, 1);
    result[result.length - 1] = 0;
    for (let i = 0; i < result.length; i++) result[i] ^= gmul(divisor[i], factor);
  }
  return result;
}

// ECC level L: total codewords and ECC codewords per version (single block).
const EC_L = {
  1: { total: 26, ecc: 7 },
  2: { total: 44, ecc: 10 },
  3: { total: 70, ecc: 15 },
  4: { total: 100, ecc: 20 },
  5: { total: 134, ecc: 26 },
  6: { total: 172, ecc: 18 },
  7: { total: 196, ecc: 20 },
  8: { total: 242, ecc: 24 },
};

function getBit(x, i) { return ((x >>> i) & 1) !== 0; }

function utf8Bytes(str) {
  const out = [];
  for (const ch of unescape(encodeURIComponent(str))) out.push(ch.charCodeAt(0));
  return out;
}

// Build the QR matrix (2D boolean array) for `text`. Throws if too long.
export function generateQrMatrix(text) {
  const bytes = utf8Bytes(text);

  // Pick the smallest version that fits (byte capacity = dataCW - 2 for v<10).
  let version = 0, info = null;
  for (let v = 1; v <= 8; v++) {
    const it = EC_L[v];
    const dataCW = it.total - it.ecc;
    if (bytes.length <= dataCW - 2) { version = v; info = it; break; }
  }
  if (!version) throw new Error('data too long for QR');

  const size = 17 + version * 4;
  const dataCW = info.total - info.ecc;

  // ── Bit buffer → data codewords ──
  const bb = [];
  const appendBits = (val, len) => { for (let i = len - 1; i >= 0; i--) bb.push((val >>> i) & 1); };
  appendBits(0b0100, 4);          // byte mode
  appendBits(bytes.length, 8);    // char count (versions 1–9)
  for (const b of bytes) appendBits(b, 8);
  const capacityBits = dataCW * 8;
  appendBits(0, Math.min(4, capacityBits - bb.length)); // terminator
  while (bb.length % 8 !== 0) bb.push(0);               // pad to byte
  for (let pad = 0xEC; bb.length < capacityBits; pad ^= 0xEC ^ 0x11) appendBits(pad, 8);

  const dataCodewords = new Uint8Array(dataCW);
  for (let i = 0; i < bb.length; i++) dataCodewords[i >>> 3] |= bb[i] << (7 - (i & 7));

  // ── ECC + full codeword stream (single block) ──
  const eccCodewords = rsRemainder(dataCodewords, rsDivisor(info.ecc));
  const allCodewords = new Uint8Array(info.total);
  allCodewords.set(dataCodewords, 0);
  allCodewords.set(eccCodewords, dataCW);

  // ── Matrix + function-module map ──
  const modules = Array.from({ length: size }, () => new Array(size).fill(false));
  const isFunc = Array.from({ length: size }, () => new Array(size).fill(false));
  const setFn = (x, y, dark) => { modules[y][x] = dark; isFunc[y][x] = true; };

  // Timing patterns
  for (let i = 0; i < size; i++) { setFn(6, i, i % 2 === 0); setFn(i, 6, i % 2 === 0); }

  // Finder patterns (+ separators via the dist 4 ring)
  const finder = (cx, cy) => {
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const x = cx + dx, y = cy + dy;
      if (x < 0 || x >= size || y < 0 || y >= size) continue;
      const dist = Math.max(Math.abs(dx), Math.abs(dy));
      setFn(x, y, dist !== 2 && dist !== 4);
    }
  };
  finder(3, 3); finder(size - 4, 3); finder(3, size - 4);

  // Alignment pattern (versions 2–8 have one central pattern here)
  if (version >= 2) {
    const p = size - 7;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++)
      setFn(p + dx, p + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  }

  // ── Format info (ECC L = 0b01) ──
  const drawFormat = (mask) => {
    const data = (1 << 3) | mask; // 5 bits
    let rem = data;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bits = ((data << 10) | rem) ^ 0x5412;
    for (let i = 0; i <= 5; i++) setFn(8, i, getBit(bits, i));
    setFn(8, 7, getBit(bits, 6));
    setFn(8, 8, getBit(bits, 7));
    setFn(7, 8, getBit(bits, 8));
    for (let i = 9; i < 15; i++) setFn(14 - i, 8, getBit(bits, i));
    for (let i = 0; i < 8; i++) setFn(size - 1 - i, 8, getBit(bits, i));
    for (let i = 8; i < 15; i++) setFn(8, size - 15 + i, getBit(bits, i));
    setFn(8, size - 8, true); // always-dark module
  };
  drawFormat(0); // reserve the format cells (marks them as function)

  // ── Place data codewords (zigzag) ──
  let bitIdx = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (!isFunc[y][x] && bitIdx < allCodewords.length * 8) {
          modules[y][x] = getBit(allCodewords[bitIdx >>> 3], 7 - (bitIdx & 7));
          bitIdx++;
        }
      }
    }
  }

  // ── Masking ──
  const maskCond = (m, x, y) => {
    switch (m) {
      case 0: return (x + y) % 2 === 0;
      case 1: return y % 2 === 0;
      case 2: return x % 3 === 0;
      case 3: return (x + y) % 3 === 0;
      case 4: return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
      case 5: return ((x * y) % 2) + ((x * y) % 3) === 0;
      case 6: return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
      case 7: return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
      default: return false;
    }
  };
  const applyMask = (m) => {
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++)
      if (!isFunc[y][x] && maskCond(m, x, y)) modules[y][x] = !modules[y][x];
  };

  const penalty = () => {
    let score = 0;
    // Rule 1: runs of 5+ in rows and columns
    for (let y = 0; y < size; y++) {
      let run = 1;
      for (let x = 1; x < size; x++) {
        if (modules[y][x] === modules[y][x - 1]) { run++; if (run === 5) score += 3; else if (run > 5) score++; }
        else run = 1;
      }
    }
    for (let x = 0; x < size; x++) {
      let run = 1;
      for (let y = 1; y < size; y++) {
        if (modules[y][x] === modules[y - 1][x]) { run++; if (run === 5) score += 3; else if (run > 5) score++; }
        else run = 1;
      }
    }
    // Rule 2: 2x2 blocks
    for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) {
      const c = modules[y][x];
      if (c === modules[y][x + 1] && c === modules[y + 1][x] && c === modules[y + 1][x + 1]) score += 3;
    }
    // Rule 3: finder-like 1:1:3:1:1 patterns with 4-light border
    const pat1 = [true, false, true, true, true, false, true, false, false, false, false];
    const pat2 = [false, false, false, false, true, false, true, true, true, false, true];
    const matches = (get, len) => {
      for (let i = 0; i <= len - 11; i++) {
        let m1 = true, m2 = true;
        for (let k = 0; k < 11; k++) { const v = get(i + k); if (v !== pat1[k]) m1 = false; if (v !== pat2[k]) m2 = false; }
        if (m1) score += 40;
        if (m2) score += 40;
      }
    };
    for (let y = 0; y < size; y++) matches((i) => modules[y][i], size);
    for (let x = 0; x < size; x++) matches((i) => modules[i][x], size);
    // Rule 4: dark-module balance
    let dark = 0;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (modules[y][x]) dark++;
    const total = size * size;
    const k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
    score += Math.max(0, k) * 10;
    return score;
  };

  let bestMask = 0, bestScore = Infinity;
  for (let m = 0; m < 8; m++) {
    applyMask(m); drawFormat(m);
    const s = penalty();
    if (s < bestScore) { bestScore = s; bestMask = m; }
    applyMask(m); // undo (XOR twice)
  }
  applyMask(bestMask);
  drawFormat(bestMask);

  return modules; // 2D boolean: true = dark module
}
