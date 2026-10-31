/** Field heroes are 24×40. The inventory portrait is a separate 48×80 drawing. */
import { blit, createImage, hex, silhouette } from './pixel.mjs';

const INK = hex('#1c1418');
const SKIN = hex('#e4b08a');
const SKIN_HI = hex('#f6d4b6');
const SKIN_SH = hex('#c48462');
const HAIR = hex('#2c1810');
const HAIR_HI = hex('#6b4030');
const BAND = hex('#8a3030');
const BEARD = hex('#3a2418');
const EYE = hex('#1c1418');
const WHITE = hex('#f4f7fb');

export const FIELD = { w: 24, h: 40 };
export const PORTRAIT = { w: 48, h: 80 };

function box(img, x, y, w, h, c) {
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) img.set(x + xx, y + yy, c);
}

function finish(img) {
  silhouette(img, INK);
  return img;
}

function paint(w, h, sex, dir, pose, part) {
  const img = createImage(w, h);
  const female = sex === 'female';
  const portrait = h > 50;
  const s = portrait ? 2 : 1;
  const bob = pose === 'idle1' || pose === 'walk1' ? -s : 0;
  const step = pose === 'walk0' ? 2 * s : pose === 'walk1' ? -2 * s : 0;
  const cx = portrait ? 24 : 12;
  const y = (n) => n + bob;
  if (part === 'body') {
    const foot = portrait ? 74 : 36;
    const hip = portrait ? 48 : 24;
    const boot = hex('#3a241c');
    box(img, cx - 4 * s - Math.max(0, step), hip, 3 * s, foot - hip - 2 * s, SKIN_SH);
    box(img, cx + s + Math.max(0, -step), hip, 3 * s, foot - hip - 2 * s, SKIN);
    box(img, cx - 5 * s - Math.max(0, step), foot - 3 * s, 4 * s, 3 * s, boot);
    box(img, cx + Math.max(0, -step), foot - 3 * s, 4 * s, 3 * s, boot);
    const shoulder = female ? 6 * s : 7 * s;
    const chestTop = y(portrait ? 30 : 15);
    const chestH = portrait ? 16 : 8;
    box(img, cx - shoulder + s, chestTop, (shoulder - s) * 2, chestH, SKIN_SH);
    box(img, cx - shoulder + 2 * s, chestTop + s, (shoulder - 2 * s) * 2, chestH - 2 * s, SKIN);
    box(img, cx - s, y(portrait ? 26 : 13), 2 * s, portrait ? 5 : 3, SKIN_SH);
    box(img, cx - shoulder - s, chestTop + s, 2 * s, portrait ? 14 : 7, SKIN_SH);
    box(img, cx + shoulder - s, chestTop + s, 2 * s, portrait ? 14 : 7, SKIN);
    box(img, cx - 3 * s, chestTop + chestH - s, 6 * s, s, hex('#5c3a28'));
    const hy = y(portrait ? 16 : 8);
    box(img, cx - 4 * s, hy - 2 * s, 8 * s, 9 * s, SKIN);
    box(img, cx - 5 * s, hy - 4 * s, 10 * s, 4 * s, HAIR);
    box(img, cx - 5 * s, hy - s, s, 4 * s, HAIR);
    box(img, cx + 4 * s, hy - s, s, 4 * s, HAIR);
    box(img, cx - 3 * s, hy - s, 6 * s, s, BAND);
    img.set(cx - 2 * s, hy + s, EYE);
    img.set(cx + s, hy + s, EYE);
    if (portrait) {
      img.set(cx - 3, hy + 1, EYE);
      img.set(cx + 2, hy + 1, EYE);
      img.set(cx - 2, hy, WHITE);
      img.set(cx + 3, hy, WHITE);
      img.set(cx, hy + 4, SKIN_SH);
    }
    if (female) {
      box(img, cx - 5 * s, hy + 2 * s, s, 8 * s, HAIR);
      box(img, cx + 4 * s, hy + 2 * s, s, 8 * s, HAIR_HI);
      box(img, cx - 3 * s, y(portrait ? 36 : 18), 6 * s, 2 * s, hex('#efe6d8'));
    } else {
      box(img, cx - 3 * s, hy + 4 * s, 6 * s, 3 * s, BEARD);
      box(img, cx - s, hy + 7 * s, 2 * s, 3 * s, BEARD);
    }
    if (dir === 'n') {
      box(img, cx - 4 * s, hy - s, 8 * s, 6 * s, HAIR);
    }
    if (dir === 'e') {
      box(img, cx + 3 * s, hy, 2 * s, 3 * s, SKIN_HI);
    }
  } else if (part === 'wolf_helm') {
    const hy = y(portrait ? 14 : 7);
    box(img, cx - 5 * s, hy - 3 * s, 10 * s, 4 * s, hex('#8a8178'));
    box(img, cx - 6 * s, hy - 5 * s, 2 * s, 3 * s, hex('#c8c0b6'));
    box(img, cx + 4 * s, hy - 5 * s, 2 * s, 3 * s, hex('#c8c0b6'));
    box(img, cx - 2 * s, hy - s, 4 * s, 2 * s, hex('#6a645c'));
  }
  return finish(img);
}

function sheet(kind) {
  const { w, h } = kind === 'field' ? FIELD : PORTRAIT;
  const dirs = kind === 'field' ? ['s', 'e', 'n', 'w'] : ['s'];
  const poses = kind === 'field' ? ['idle0', 'idle1', 'walk0', 'walk1'] : ['idle0', 'idle1'];
  const sexes = ['male', 'female'];
  const parts = ['body', 'wolf_helm'];
  const rows = {};
  let row = 0;
  const frames = [];
  for (const sex of sexes) {
    for (const part of parts) {
      rows[part === 'body' ? (sex === 'male' ? 'body_m' : 'body_f') : `wolf_helm_${sex === 'male' ? 'm' : 'f'}`] = row++;
      for (const dir of dirs) {
        for (const pose of poses) {
          const img = paint(w, h, sex, dir === 'w' ? 'e' : dir, pose, part);
          frames.push(dir === 'w' ? flip(img) : img);
        }
      }
    }
  }
  const cols = dirs.length * poses.length;
  const out = createImage(cols * w, row * h);
  frames.forEach((frame, index) => {
    blit(out, frame, (index % cols) * w, Math.floor(index / cols) * h);
  });
  return { sheet: out, meta: { frameW: w, frameH: h, dirs, poses, framesPerDir: poses.length, rows } };
}

function flip(img) {
  const out = createImage(img.w, img.h);
  blit(out, img, 0, 0, { flipX: true });
  return out;
}

export function buildHeroArt() {
  return { field: sheet('field'), portrait: sheet('portrait') };
}
