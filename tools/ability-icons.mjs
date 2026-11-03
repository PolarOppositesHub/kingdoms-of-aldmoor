/**
 * Original 16×16 icons for every ability. Each spell has its own picture.
 * Scrolls reuse that picture inside a parchment edge so no two drills share one seal.
 */
import { createImage, hex } from './pixel.mjs';

function img() {
  return createImage(16, 16);
}

function fill(image, x, y, w, h, color) {
  const c = hex(color);
  for (let yy = 0; yy < h; yy++) {
    for (let xx = 0; xx < w; xx++) image.set(x + xx, y + yy, c);
  }
}

function px(image, color, pts) {
  const c = hex(color);
  for (let i = 0; i < pts.length; i += 2) image.set(pts[i], pts[i + 1], c);
}

function disc(image, cx, cy, r, color) {
  const c = hex(color);
  const rr = r * r;
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y <= rr) image.set(cx + x, cy + y, c);
    }
  }
}

function line(image, x0, y0, x1, y1, color) {
  const c = hex(color);
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    image.set(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), c);
  }
}

/** @type {Record<string, (image: ReturnType<typeof img>) => void>} */
const DRAW = {
  kick(image) {
    fill(image, 2, 9, 9, 4, '#8a5438');
    fill(image, 9, 6, 5, 5, '#c48462');
    fill(image, 10, 7, 3, 2, '#e6c15a');
    px(image, '#3a2418', [2, 9, 2, 12, 10, 12, 13, 10, 13, 6, 9, 6]);
  },
  heavy_swing(image) {
    line(image, 3, 13, 11, 3, '#6b4428');
    line(image, 4, 13, 12, 3, '#a87848');
    fill(image, 8, 1, 6, 4, '#9aa6b0');
    fill(image, 9, 2, 4, 2, '#e7eef4');
    px(image, '#5c6a74', [8, 1, 13, 1, 8, 4, 13, 4]);
  },
  sundering_chop(image) {
    fill(image, 2, 3, 7, 8, '#8b97a3');
    fill(image, 3, 4, 5, 6, '#d7dee6');
    line(image, 6, 4, 6, 9, '#1c1418');
    line(image, 4, 7, 8, 7, '#1c1418');
    line(image, 9, 12, 14, 4, '#e6c15a');
    line(image, 10, 13, 14, 6, '#8d5a38');
  },
  breaker_swing(image) {
    line(image, 2, 12, 8, 3, '#c5ced6');
    line(image, 3, 13, 9, 4, '#8d5a38');
    line(image, 13, 12, 7, 3, '#e6c15a');
    line(image, 14, 13, 8, 4, '#8d5a38');
    disc(image, 8, 8, 1, '#f4f7fb');
  },
  shoulder_rush(image) {
    fill(image, 2, 5, 8, 7, '#c48462');
    fill(image, 8, 4, 6, 8, '#8a5438');
    fill(image, 11, 6, 3, 3, '#e6c15a');
    line(image, 3, 12, 13, 12, '#1c1418');
    px(image, '#f4f0e6', [4, 7, 5, 7, 6, 8]);
  },
  second_wind(image) {
    disc(image, 8, 8, 5, '#d7f0c0');
    disc(image, 8, 8, 3, '#f4fbff');
    line(image, 2, 5, 6, 8, '#7eb6e0');
    line(image, 2, 11, 6, 8, '#7eb6e0');
    line(image, 14, 4, 10, 8, '#e6c15a');
    line(image, 14, 12, 10, 8, '#e6c15a');
  },
  oath_axe(image) {
    line(image, 4, 14, 12, 2, '#e6c15a');
    line(image, 5, 14, 13, 2, '#8d5a38');
    fill(image, 8, 1, 6, 5, '#d4b46a');
    fill(image, 9, 2, 4, 2, '#fff4c8');
    px(image, '#a33b32', [10, 3, 11, 4]);
  },
  shardbolt(image) {
    line(image, 2, 13, 13, 2, '#b7e3ff');
    line(image, 3, 14, 14, 3, '#7ec8e8');
    px(image, '#f4fbff', [12, 2, 13, 3, 11, 3]);
    px(image, '#1a4d66', [3, 12, 4, 13]);
  },
  rimefield(image) {
    disc(image, 8, 8, 5, '#d5e6f0');
    disc(image, 8, 8, 3, '#f4fbff');
    px(image, '#3c86a2', [8, 2, 8, 13, 2, 8, 13, 8, 4, 4, 12, 4, 4, 12, 12, 12]);
    px(image, '#1a4d66', [8, 8]);
  },
  glacier_spike(image) {
    fill(image, 7, 2, 3, 10, '#d5e6f0');
    fill(image, 6, 4, 1, 7, '#7ec8e8');
    fill(image, 10, 4, 1, 7, '#f4fbff');
    px(image, '#1a4d66', [7, 12, 8, 13, 9, 12, 8, 14]);
    px(image, '#3c86a2', [8, 2, 7, 3, 9, 3]);
  },
  whiteout(image) {
    disc(image, 8, 8, 6, '#f4fbff');
    disc(image, 8, 8, 3, '#d5e6f0');
    px(image, '#7ec8e8', [8, 1, 8, 14, 1, 8, 14, 8, 3, 3, 12, 12, 3, 12, 12, 3]);
  },
  ice_needle(image) {
    line(image, 8, 1, 8, 14, '#f4fbff');
    line(image, 7, 3, 7, 12, '#7ec8e8');
    line(image, 9, 3, 9, 12, '#b7e3ff');
    px(image, '#1a4d66', [8, 14, 7, 13, 9, 13]);
  },
  rime_wall(image) {
    fill(image, 2, 3, 3, 11, '#d5e6f0');
    fill(image, 6, 2, 3, 12, '#f4fbff');
    fill(image, 10, 4, 3, 10, '#7ec8e8');
    px(image, '#1a4d66', [3, 6, 7, 5, 11, 8, 3, 10, 7, 11]);
  },
  starfall(image) {
    px(image, '#e6c15a', [8, 2, 7, 3, 8, 3, 9, 3, 6, 5, 7, 5, 8, 5, 9, 5, 10, 5, 8, 6, 8, 7]);
    line(image, 4, 9, 6, 14, '#b7e3ff');
    line(image, 8, 8, 8, 14, '#f4fbff');
    line(image, 12, 9, 10, 14, '#7ec8e8');
  },
  frostbind(image) {
    disc(image, 8, 8, 4, '#d5e6f0');
    line(image, 3, 5, 13, 6, '#7ec8e8');
    line(image, 3, 8, 13, 8, '#f4fbff');
    line(image, 3, 11, 13, 10, '#3c86a2');
    px(image, '#1a4d66', [5, 8, 11, 8]);
  },
  kindle(image) {
    disc(image, 8, 11, 3, '#e6c15a');
    fill(image, 7, 6, 2, 5, '#e07a32');
    fill(image, 6, 4, 2, 4, '#f4d35a');
    px(image, '#fff4c8', [7, 3, 8, 2, 9, 4]);
  },
  ember_rot(image) {
    disc(image, 8, 8, 4, '#3a2418');
    disc(image, 8, 8, 2, '#e07a32');
    px(image, '#6dba74', [4, 4, 12, 5, 5, 12, 12, 11, 3, 8]);
    px(image, '#1c1418', [7, 8, 9, 7]);
  },
  gale_hex(image) {
    line(image, 2, 4, 13, 4, '#d5e6f0');
    line(image, 3, 8, 14, 7, '#7ec8e8');
    line(image, 2, 12, 12, 11, '#f4fbff');
    px(image, '#e6c15a', [5, 6, 10, 9]);
  },
  ancestor_ward(image) {
    line(image, 8, 2, 8, 13, '#e7d3a4');
    line(image, 5, 5, 11, 5, '#f4f0e6');
    line(image, 6, 10, 10, 10, '#c4a574');
    disc(image, 8, 3, 1, '#a33b32');
    px(image, '#6b4428', [7, 13, 8, 14, 9, 13]);
  },
  peat_bind(image) {
    line(image, 3, 13, 6, 4, '#5c3a28');
    line(image, 8, 14, 7, 3, '#6b4428');
    line(image, 12, 13, 10, 5, '#8a5438');
    disc(image, 8, 6, 2, '#3e6b40');
    px(image, '#d7f0c0', [8, 5, 7, 6]);
  },
  cinder_mend(image) {
    px(image, '#a33b32', [8, 4, 7, 5, 8, 5, 9, 5, 6, 6, 7, 6, 8, 6, 9, 6, 10, 6, 6, 7, 7, 7, 8, 7, 9, 7, 10, 7, 7, 8, 8, 8, 9, 8, 8, 9]);
    fill(image, 7, 10, 2, 3, '#e07a32');
    px(image, '#e6c15a', [8, 13, 6, 11, 10, 11]);
  },
  ashen_circle(image) {
    disc(image, 8, 8, 5, '#8a8178');
    disc(image, 8, 8, 3, '#1c1418');
    px(image, '#e07a32', [8, 2, 3, 8, 13, 8, 5, 13, 11, 4]);
    px(image, '#e6c15a', [8, 8]);
  },
  sneak(image) {
    fill(image, 4, 3, 8, 5, '#2a241c');
    fill(image, 5, 8, 6, 5, '#3a3024');
    px(image, '#e6c15a', [6, 5, 9, 5]);
    px(image, '#1c1418', [7, 6, 10, 7, 4, 11]);
  },
  backstab(image) {
    line(image, 3, 12, 12, 3, '#d7dee6');
    line(image, 4, 13, 13, 4, '#8b97a3');
    fill(image, 2, 11, 3, 3, '#5c3a28');
    px(image, '#a33b32', [11, 4, 12, 5]);
  },
  evade(image) {
    fill(image, 2, 8, 3, 4, '#c48462');
    fill(image, 9, 4, 3, 4, '#e6c15a');
    line(image, 5, 10, 9, 6, '#f4f0e6');
    px(image, '#1c1418', [3, 12, 10, 8]);
  },
  poisoned_blade(image) {
    line(image, 4, 13, 12, 3, '#c5ced6');
    fill(image, 3, 12, 3, 2, '#6b4428');
    px(image, '#6dba74', [10, 6, 9, 8, 8, 10, 7, 11]);
    disc(image, 12, 4, 1, '#3e6b40');
  },
  vanish(image) {
    fill(image, 5, 3, 6, 4, '#2a241c');
    px(image, '#8a8178', [6, 8, 9, 9, 7, 11, 11, 12, 4, 6, 12, 5]);
    px(image, '#e6c15a', [7, 4]);
  },
  hamstring(image) {
    line(image, 2, 8, 13, 8, '#f4d3c4');
    line(image, 4, 12, 11, 3, '#d7dee6');
    px(image, '#a33b32', [8, 8, 9, 7, 7, 9]);
    fill(image, 3, 11, 2, 2, '#5c3a28');
  },
  night_step(image) {
    disc(image, 5, 4, 2, '#f4f7fb');
    fill(image, 8, 9, 3, 4, '#c48462');
    fill(image, 9, 7, 4, 3, '#2a241c');
    px(image, '#7ec8e8', [11, 3, 13, 5, 3, 9]);
  },
  kingsbane(image) {
    line(image, 8, 6, 8, 14, '#d7dee6');
    line(image, 7, 7, 7, 13, '#8b97a3');
    fill(image, 5, 2, 6, 2, '#e6c15a');
    px(image, '#e6c15a', [6, 4, 8, 1, 10, 4, 8, 4]);
    px(image, '#a33b32', [8, 9]);
  },
  frenzy(image) {
    line(image, 2, 13, 7, 2, '#e15d4c');
    line(image, 5, 14, 10, 3, '#a33b32');
    line(image, 8, 13, 14, 2, '#e6c15a');
    px(image, '#fff4c8', [12, 3, 6, 4]);
  },
  cleave(image) {
    line(image, 3, 13, 6, 3, '#8d5a38');
    fill(image, 4, 2, 4, 3, '#c5ced6');
    line(image, 9, 13, 12, 3, '#5c3a26');
    fill(image, 10, 2, 4, 3, '#e6c15a');
  },
  execution(image) {
    line(image, 8, 1, 8, 12, '#d7dee6');
    line(image, 7, 2, 7, 11, '#8b97a3');
    fill(image, 6, 12, 5, 2, '#5c3a28');
    px(image, '#a33b32', [8, 6, 9, 7, 7, 8]);
    px(image, '#e6c15a', [8, 1]);
  },
  blood_feast(image) {
    disc(image, 8, 8, 4, '#a33b32');
    disc(image, 8, 8, 2, '#6e2424');
    px(image, '#f4d3c4', [6, 7, 10, 7, 8, 10]);
    px(image, '#e15d4c', [4, 4, 12, 5, 5, 12, 12, 12]);
  },
  red_sweep(image) {
    line(image, 2, 11, 6, 6, '#e15d4c');
    line(image, 4, 13, 9, 5, '#a33b32');
    line(image, 7, 12, 13, 4, '#e6c15a');
    disc(image, 13, 3, 1, '#fff4c8');
  },
  war_blood(image) {
    disc(image, 8, 5, 2, '#e15d4c');
    line(image, 8, 7, 8, 12, '#a33b32');
    line(image, 6, 12, 10, 12, '#6e2424');
    line(image, 5, 14, 11, 14, '#f4d3c4');
    px(image, '#fff4c8', [8, 4]);
  },
  last_howl(image) {
    fill(image, 3, 6, 10, 6, '#2a241c');
    fill(image, 5, 8, 6, 3, '#e15d4c');
    px(image, '#f4f0e6', [5, 7, 10, 7, 6, 4, 9, 4]);
    px(image, '#e6c15a', [4, 3, 11, 3, 8, 2]);
  },
  fist(image) {
    fill(image, 4, 5, 7, 6, '#e6b898');
    fill(image, 5, 3, 5, 3, '#f4d3c4');
    fill(image, 6, 11, 4, 3, '#c48462');
    px(image, '#a33b32', [6, 6, 8, 6, 10, 6]);
  },
  mend(image) {
    fill(image, 7, 3, 2, 10, '#d7f0c0');
    fill(image, 3, 7, 10, 2, '#8eae72');
    px(image, '#3e6b40', [7, 3, 8, 12, 3, 7, 12, 8]);
  },
  snare(image) {
    disc(image, 8, 9, 4, '#6b4428');
    disc(image, 8, 9, 2, '#1c1418');
    line(image, 8, 2, 8, 6, '#c4a574');
    px(image, '#e6c15a', [8, 2, 7, 3]);
  },
  bear_heart(image) {
    disc(image, 5, 5, 2, '#8a8178');
    disc(image, 11, 5, 2, '#c8c0b6');
    fill(image, 4, 6, 8, 6, '#6a5348');
    px(image, '#1c1418', [6, 8, 10, 8]);
    px(image, '#a33b32', [8, 10, 7, 11, 9, 11]);
  },
  deep_mend(image) {
    fill(image, 7, 2, 2, 12, '#3e6b40');
    fill(image, 3, 7, 10, 2, '#1e4030');
    disc(image, 8, 8, 1, '#d7f0c0');
    px(image, '#8eae72', [8, 4, 8, 12, 5, 8, 11, 8]);
  },
  pack_call(image) {
    fill(image, 4, 6, 8, 6, '#d5e6f0');
    px(image, '#f4fbff', [5, 4, 6, 3, 10, 4, 11, 3]);
    px(image, '#1c1418', [6, 8, 10, 8, 8, 10]);
    line(image, 2, 5, 5, 6, '#7ec8e8');
    line(image, 13, 5, 11, 6, '#7ec8e8');
  },
  deep_root(image) {
    line(image, 8, 2, 8, 8, '#8eae72');
    line(image, 8, 8, 3, 14, '#5c3a28');
    line(image, 8, 8, 8, 14, '#6b4428');
    line(image, 8, 8, 13, 14, '#3e6b40');
    disc(image, 8, 4, 1, '#d7f0c0');
  },
  elder_mend(image) {
    disc(image, 8, 8, 5, '#d7f0c0');
    fill(image, 7, 3, 2, 10, '#f4fbff');
    fill(image, 3, 7, 10, 2, '#f4fbff');
    px(image, '#3e6b40', [8, 5, 8, 10, 5, 8, 11, 8]);
  },
};

export function abilityIds() {
  return Object.keys(DRAW);
}

export function paintAbilityIcon(id) {
  const draw = DRAW[id];
  if (!draw) throw new Error(`no ability icon for ${id}`);
  const image = img();
  draw(image);
  return image;
}

/** The spell's own picture, set on a parchment edge so the drill is not a bare glyph. */
export function scrollIcon(abilityId) {
  const image = paintAbilityIcon(abilityId);
  const edge = hex('#e7d3a4');
  const ink = hex('#6b4428');
  for (let i = 0; i < 16; i++) {
    image.set(i, 0, edge);
    image.set(i, 15, edge);
    image.set(0, i, edge);
    image.set(15, i, ink);
  }
  image.set(14, 1, hex('#a33b32'));
  return image;
}
