import { PNG } from 'pngjs';
import { createWriteStream, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

/** @typedef {[number, number, number, number]} RGBA */

/** @param {string} h */
export function hex(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}

/**
 * @param {number} w
 * @param {number} h
 */
export function createImage(w, h) {
  const data = new Uint8Array(w * h * 4);
  return {
    w,
    h,
    data,
    /** @param {number} x @param {number} y */
    get(x, y) {
      if (x < 0 || y < 0 || x >= w || y >= h) return /** @type {RGBA} */ ([0, 0, 0, 0]);
      const i = (y * w + x) * 4;
      return /** @type {RGBA} */ ([data[i], data[i + 1], data[i + 2], data[i + 3]]);
    },
    /** @param {number} x @param {number} y @param {RGBA | null | undefined} c */
    set(x, y, c) {
      if (!c || x < 0 || y < 0 || x >= w || y >= h || c[3] === 0) return;
      const i = (y * w + x) * 4;
      data[i] = c[0];
      data[i + 1] = c[1];
      data[i + 2] = c[2];
      data[i + 3] = c[3];
    },
    /** @param {RGBA} c */
    fill(c) {
      for (let i = 0; i < data.length; i += 4) {
        data[i] = c[0];
        data[i + 1] = c[1];
        data[i + 2] = c[2];
        data[i + 3] = c[3];
      }
    },
    clone() {
      const next = createImage(w, h);
      next.data.set(data);
      return next;
    },
  };
}

/** @param {ReturnType<typeof createImage>} img @param {number} n */
export function scale(img, n) {
  const out = createImage(img.w * n, img.h * n);
  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
      const c = img.get(x, y);
      for (let dy = 0; dy < n; dy++) {
        for (let dx = 0; dx < n; dx++) out.set(x * n + dx, y * n + dy, c);
      }
    }
  }
  return out;
}

/**
 * @param {ReturnType<typeof createImage>} dst
 * @param {ReturnType<typeof createImage>} src
 * @param {number} dx
 * @param {number} dy
 * @param {{ flipX?: boolean, tint?: Map<string, RGBA> }} [opt]
 */
export function blit(dst, src, dx, dy, opt = {}) {
  for (let y = 0; y < src.h; y++) {
    for (let x = 0; x < src.w; x++) {
      const sx = opt.flipX ? src.w - 1 - x : x;
      let c = src.get(sx, y);
      if (c[3] === 0) continue;
      if (opt.tint) {
        const key = `${c[0]},${c[1]},${c[2]}`;
        const mapped = opt.tint.get(key);
        if (mapped) c = mapped;
      }
      dst.set(dx + x, dy + y, c);
    }
  }
}

/** @param {ReturnType<typeof createImage>} img @param {RGBA} color */
export function silhouette(img, color) {
  const orig = img.clone();
  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
      if (orig.get(x, y)[3] !== 0) continue;
      const n =
        orig.get(x - 1, y)[3] ||
        orig.get(x + 1, y)[3] ||
        orig.get(x, y - 1)[3] ||
        orig.get(x, y + 1)[3];
      if (n) img.set(x, y, color);
    }
  }
}

/**
 * @param {string[]} lines
 * @param {Record<string, RGBA | null>} pal
 * @param {number} [w]
 */
export function fromRows(lines, pal, w) {
  const width = w ?? lines[0].length;
  const img = createImage(width, lines.length);
  lines.forEach((line, y) => {
    if (line.length !== width) {
      throw new Error(`sprite row ${y} is ${line.length} chars, expected ${width}`);
    }
    for (let x = 0; x < width; x++) {
      const ch = line[x];
      if (!(ch in pal)) throw new Error(`unknown pixel '${ch}'`);
      const c = pal[ch];
      if (c) img.set(x, y, c);
    }
  });
  return img;
}

/** @param {string} file @param {ReturnType<typeof createImage>} img */
export function writePng(file, img) {
  mkdirSync(dirname(file), { recursive: true });
  const png = new PNG({ width: img.w, height: img.h });
  png.data.set(img.data);
  return new Promise((resolve, reject) => {
    png.pack().pipe(createWriteStream(file)).on('finish', resolve).on('error', reject);
  });
}

/** @param {number} seed */
export function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
