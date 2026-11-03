/** Field heroes are 24×40. The inventory portrait is 48×80. Gear is a separate row per piece. */
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
const FUR = hex('#8a5a32');
const FUR_HI = hex('#c49464');
const LEATHER = hex('#6a3a28');
const LEATHER_HI = hex('#a86a44');
const CLOTH = hex('#3d5e78');
const CLOTH_HI = hex('#7ea0c0');
const CHAIN = hex('#8b97a3');
const CHAIN_HI = hex('#d5dee6');
const PLATE = hex('#8a7048');
const PLATE_HI = hex('#e6c15a');
const BOOT = hex('#3a241c');
const SHOE = hex('#6a5348');
const WRAP = hex('#d7c4a4');
const WRAP_HI = hex('#f0e2c8');
const WOOD = hex('#8d5a38');
const IRON = hex('#d7dee6');

export const FIELD = { w: 24, h: 40 };
export const PORTRAIT = { w: 48, h: 80 };

export const GEAR_ROWS = [
  'body_m',
  'wolf_helm_m',
  'body_f',
  'wolf_helm_f',
  'chest_leather',
  'chest_cloth',
  'chest_chain',
  'chest_plate',
  'chest_fur',
  'legs_leather',
  'legs_cloth',
  'legs_chain',
  'legs_plate',
  'feet_boot',
  'feet_shoe',
  'hands_glove',
  'hands_wrap',
  'helm_cap',
  'helm_coif',
  'helm_plate',
  'weapon_axe',
  'weapon_blade',
  'weapon_staff',
];

function box(img, x, y, w, h, c) {
  for (let yy = 0; yy < h; yy++) {
    for (let xx = 0; xx < w; xx++) img.set(x + xx, y + yy, c);
  }
}

function finish(img) {
  silhouette(img, INK);
  return img;
}

function hands(img, cx, y, s, dir, step, color, hi) {
  const shift = Math.round(step / 2);
  if (dir === 'n') {
    box(img, cx - 8 * s + shift, y, 3 * s, 4 * s, color);
    box(img, cx + 5 * s - shift, y, 3 * s, 4 * s, hi);
    return;
  }
  if (dir === 'e') {
    box(img, cx + 6 * s, y, 4 * s, 4 * s, hi);
    box(img, cx - 3 * s, y - s, 2 * s, 3 * s, color);
    return;
  }
  box(img, cx - 9 * s - shift, y, 3 * s, 4 * s, color);
  box(img, cx + 6 * s + shift, y, 3 * s, 4 * s, hi);
}

function paint(w, h, sex, dir, pose, part, palette) {
  const img = createImage(w, h);
  const female = sex === 'female';
  const portrait = h > 50;
  const s = portrait ? 2 : 1;
  const bob = pose === 'idle1' || pose === 'walk1' ? -s : 0;
  const step = pose === 'walk0' ? 2 * s : pose === 'walk1' ? -2 * s : 0;
  const cx = portrait ? 24 : 12;
  const y = (n) => n + bob;
  const skin = palette?.skin ?? SKIN;
  const skinHi = palette?.skinHi ?? SKIN_HI;
  const hair = palette?.hair ?? HAIR;
  const hairHi = palette?.hairHi ?? HAIR_HI;
  if (part === 'body') {
    const foot = portrait ? 74 : 36;
    const hip = portrait ? 48 : 24;
    box(img, cx - 4 * s - Math.max(0, step), hip, 3 * s, foot - hip - 2 * s, SKIN_SH);
    box(img, cx + s + Math.max(0, -step), hip, 3 * s, foot - hip - 2 * s, skin);
    box(img, cx - 5 * s - Math.max(0, step), foot - 3 * s, 4 * s, 3 * s, BOOT);
    box(img, cx + Math.max(0, -step), foot - 3 * s, 4 * s, 3 * s, BOOT);
    const shoulder = female ? 6 * s : 7 * s;
    const chestTop = y(portrait ? 30 : 15);
    const chestH = portrait ? 16 : 8;
    box(img, cx - shoulder + s, chestTop, (shoulder - s) * 2, chestH, SKIN_SH);
    box(img, cx - shoulder + 2 * s, chestTop + s, (shoulder - 2 * s) * 2, chestH - 2 * s, skin);
    box(img, cx - s, y(portrait ? 26 : 13), 2 * s, portrait ? 5 : 3, SKIN_SH);
    box(img, cx - shoulder - s, chestTop + s, 2 * s, portrait ? 12 : 6, SKIN_SH);
    box(img, cx + shoulder - s, chestTop + s, 2 * s, portrait ? 12 : 6, skin);
    hands(img, cx, chestTop + (portrait ? 12 : 6), s, dir, step, SKIN_SH, skinHi);
    box(img, cx - 3 * s, chestTop + chestH - s, 6 * s, s, hex('#5c3a28'));
    const hy = y(portrait ? 16 : 8);
    box(img, cx - 4 * s, hy - 2 * s, 8 * s, 9 * s, skin);
    box(img, cx - 5 * s, hy - 4 * s, 10 * s, 4 * s, hair);
    box(img, cx - 5 * s, hy - s, s, 4 * s, hair);
    box(img, cx + 4 * s, hy - s, s, 4 * s, hair);
    box(img, cx - 3 * s, hy - s, 6 * s, s, BAND);
    img.set(cx - 2 * s, hy + s, EYE);
    img.set(cx + s, hy + s, EYE);
    if (portrait) {
      img.set(cx - 3, hy + 1, EYE);
      img.set(cx + 2, hy + 1, EYE);
      img.set(cx - 2, hy, WHITE);
      img.set(cx + 3, hy, WHITE);
    }
    if (female) {
      box(img, cx - 5 * s, hy + 2 * s, s, 8 * s, hair);
      box(img, cx + 4 * s, hy + 2 * s, s, 8 * s, hairHi);
    } else if (palette?.beard !== false) {
      box(img, cx - 3 * s, hy + 4 * s, 6 * s, 3 * s, palette?.beard ?? BEARD);
      box(img, cx - s, hy + 7 * s, 2 * s, 2 * s, palette?.beard ?? BEARD);
    }
    if (dir === 'n') box(img, cx - 4 * s, hy - s, 8 * s, 6 * s, hair);
    if (dir === 'e') box(img, cx + 3 * s, hy, 2 * s, 3 * s, skinHi);
  } else if (part === 'wolf_helm') {
    const hy = y(portrait ? 14 : 7);
    box(img, cx - 5 * s, hy - 3 * s, 10 * s, 4 * s, hex('#8a8178'));
    box(img, cx - 6 * s, hy - 5 * s, 2 * s, 3 * s, hex('#c8c0b6'));
    box(img, cx + 4 * s, hy - 5 * s, 2 * s, 3 * s, hex('#c8c0b6'));
    box(img, cx - 2 * s, hy - s, 4 * s, 2 * s, hex('#6a645c'));
    if (dir !== 'n') {
      img.set(cx - 3 * s, hy, hex('#6a3030'));
      img.set(cx + 2 * s, hy, hex('#6a3030'));
    }
  } else if (part.startsWith('chest_')) {
    const colors = {
      chest_leather: [LEATHER, LEATHER_HI],
      chest_cloth: [CLOTH, CLOTH_HI],
      chest_chain: [CHAIN, CHAIN_HI],
      chest_plate: [PLATE, PLATE_HI],
      chest_fur: [FUR, FUR_HI],
    };
    const [fill, hi] = colors[part] ?? [LEATHER, LEATHER_HI];
    const chestTop = y(portrait ? 30 : 15);
    const chestH = portrait ? 14 : 7;
    box(img, cx - 6 * s, chestTop, 12 * s, chestH, fill);
    box(img, cx - 4 * s, chestTop + s, 8 * s, chestH - 2 * s, hi);
    if (part === 'chest_plate') box(img, cx - s, chestTop + 2 * s, 2 * s, chestH - 3 * s, PLATE_HI);
    if (part === 'chest_fur') box(img, cx - 6 * s, chestTop, 2 * s, 2 * s, FUR_HI);
  } else if (part.startsWith('legs_')) {
    const colors = {
      legs_leather: LEATHER,
      legs_cloth: CLOTH,
      legs_chain: CHAIN,
      legs_plate: PLATE,
    };
    const fill = colors[part] ?? LEATHER;
    const hip = portrait ? 48 : 24;
    const foot = portrait ? 70 : 34;
    box(img, cx - 4 * s - Math.max(0, step), hip, 3 * s, foot - hip, fill);
    box(img, cx + s + Math.max(0, -step), hip, 3 * s, foot - hip, fill);
  } else if (part === 'feet_boot' || part === 'feet_shoe') {
    const foot = portrait ? 74 : 36;
    const c = part === 'feet_shoe' ? SHOE : BOOT;
    box(img, cx - 5 * s - Math.max(0, step), foot - 4 * s, 4 * s, 4 * s, c);
    box(img, cx + Math.max(0, -step), foot - 4 * s, 4 * s, 4 * s, c);
  } else if (part === 'hands_glove' || part === 'hands_wrap') {
    const chestTop = y(portrait ? 30 : 15);
    const c = part === 'hands_wrap' ? WRAP : LEATHER;
    const hi = part === 'hands_wrap' ? WRAP_HI : LEATHER_HI;
    hands(img, cx, chestTop + (portrait ? 12 : 6), s, dir, step, c, hi);
    if (part === 'hands_wrap' && dir !== 'n') {
      const hy = chestTop + (portrait ? 13 : 7);
      img.set(cx - 7 * s, hy, WRAP_HI);
      img.set(cx + 6 * s, hy, WRAP_HI);
    }
  } else if (part === 'helm_cap' || part === 'helm_coif' || part === 'helm_plate') {
    const hy = y(portrait ? 14 : 7);
    const c = part === 'helm_plate' ? PLATE : part === 'helm_coif' ? CHAIN : LEATHER;
    box(img, cx - 5 * s, hy - 4 * s, 10 * s, 4 * s, c);
    box(img, cx - 4 * s, hy - s, 8 * s, 2 * s, c);
    if (part === 'helm_plate' && dir !== 'n') box(img, cx - 3 * s, hy, 6 * s, s, PLATE_HI);
  } else if (part.startsWith('weapon_')) {
    const chestTop = y(portrait ? 30 : 15);
    const hy = chestTop + (portrait ? 12 : 6);
    const shift = dir === 's' ? Math.round(step / 2) : 0;
    const hx = dir === 'n' ? cx + 7 * s : cx + 8 * s + shift;
    if (part === 'weapon_axe') {
      box(img, hx, hy - 10 * s, s, 16 * s, WOOD);
      box(img, hx - 2 * s, hy - 12 * s, 5 * s, 4 * s, IRON);
    } else if (part === 'weapon_blade') {
      box(img, hx, hy - 12 * s, s, 12 * s, IRON);
      box(img, hx - s, hy, 3 * s, 2 * s, WOOD);
    } else {
      box(img, hx, hy - 14 * s, s, 18 * s, WOOD);
      box(img, hx - s, hy - 14 * s, 3 * s, 2 * s, IRON);
    }
  }
  return finish(img);
}

function flip(img) {
  const out = createImage(img.w, img.h);
  blit(out, img, 0, 0, { flipX: true });
  return out;
}

const PART_OF = {
  body_m: ['body', 'male'],
  body_f: ['body', 'female'],
  wolf_helm_m: ['wolf_helm', 'male'],
  wolf_helm_f: ['wolf_helm', 'female'],
  chest_leather: ['chest_leather', 'male'],
  chest_cloth: ['chest_cloth', 'male'],
  chest_chain: ['chest_chain', 'male'],
  chest_plate: ['chest_plate', 'male'],
  chest_fur: ['chest_fur', 'male'],
  legs_leather: ['legs_leather', 'male'],
  legs_cloth: ['legs_cloth', 'male'],
  legs_chain: ['legs_chain', 'male'],
  legs_plate: ['legs_plate', 'male'],
  feet_boot: ['feet_boot', 'male'],
  feet_shoe: ['feet_shoe', 'male'],
  hands_glove: ['hands_glove', 'male'],
  hands_wrap: ['hands_wrap', 'male'],
  helm_cap: ['helm_cap', 'male'],
  helm_coif: ['helm_coif', 'male'],
  helm_plate: ['helm_plate', 'male'],
  weapon_axe: ['weapon_axe', 'male'],
  weapon_blade: ['weapon_blade', 'male'],
  weapon_staff: ['weapon_staff', 'male'],
};

function sheet(kind) {
  const { w, h } = kind === 'field' ? FIELD : PORTRAIT;
  const dirs = kind === 'field' ? ['s', 'e', 'n', 'w'] : ['s'];
  const poses = kind === 'field' ? ['idle0', 'idle1', 'walk0', 'walk1'] : ['idle0', 'idle1'];
  const cols = dirs.length * poses.length;
  const out = createImage(cols * w, GEAR_ROWS.length * h);
  GEAR_ROWS.forEach((rowName, row) => {
    const [part, sex] = PART_OF[rowName];
    let col = 0;
    for (const dir of dirs) {
      for (const pose of poses) {
        const img = paint(w, h, sex, dir === 'w' ? 'e' : dir, pose, part);
        blit(out, dir === 'w' ? flip(img) : img, col * w, row * h);
        col += 1;
      }
    }
  });
  const rows = {};
  GEAR_ROWS.forEach((name, index) => {
    rows[name] = index;
  });
  return { sheet: out, meta: { frameW: w, frameH: h, dirs, poses, framesPerDir: poses.length, rows } };
}

/** Each townsperson is one baked row of the detailed model, with their own hair and kit. */
export const PEOPLE = [
  { id: 'brenna', sex: 'female', hair: '#6b3030', hairHi: '#a85048', chest: 'chest_leather', legs: 'legs_leather', feet: 'feet_boot' },
  { id: 'hilda', sex: 'female', hair: '#c4a574', hairHi: '#e6d2a4', chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_shoe', beard: false },
  { id: 'torvald', sex: 'male', hair: '#d8d0c4', hairHi: '#f4f0e6', beard: '#e6e0d4', chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_boot' },
  { id: 'soren', sex: 'male', hair: '#2c1810', chest: 'chest_chain', legs: 'legs_chain', feet: 'feet_boot', helm: 'helm_coif', weapon: 'weapon_axe' },
  { id: 'freya', sex: 'female', hair: '#e6c15a', hairHi: '#ffe7ad', chest: 'chest_fur', legs: 'legs_leather', feet: 'feet_boot', helm: 'helm_cap' },
  { id: 'eirik', sex: 'male', hair: '#3a2418', beard: '#5c3a28', chest: 'chest_plate', legs: 'legs_plate', feet: 'feet_boot', helm: 'helm_plate', weapon: 'weapon_axe' },
  { id: 'ivar', sex: 'male', hair: '#1c1418', beard: '#3a2418', chest: 'chest_leather', legs: 'legs_leather', feet: 'feet_boot', weapon: 'weapon_axe' },
  { id: 'marta', sex: 'female', hair: '#8a4030', hairHi: '#c47058', chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_shoe' },
  { id: 'signe', sex: 'female', hair: '#2a2438', hairHi: '#6a6080', chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_shoe' },
  { id: 'ysolde', sex: 'female', hair: '#1a2840', hairHi: '#3c5878', skin: '#f3d2b4', skinHi: '#ffe4cc', chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_shoe', weapon: 'weapon_staff' },
  { id: 'torunn', sex: 'female', hair: '#4a2018', hairHi: '#8a4030', chest: 'chest_fur', legs: 'legs_leather', feet: 'feet_boot' },
  { id: 'sable', sex: 'female', hair: '#1c1418', hairHi: '#3a3038', chest: 'chest_leather', legs: 'legs_leather', feet: 'feet_boot', weapon: 'weapon_blade' },
  { id: 'hroth', sex: 'male', hair: '#6a2018', hairHi: '#a84830', beard: '#4a1814', chest: 'chest_leather', legs: 'legs_leather', feet: 'feet_boot', weapon: 'weapon_axe' },
  { id: 'bjorn', sex: 'male', hair: '#c8c0b6', hairHi: '#f4f0e6', beard: '#a09890', chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_boot', hands: 'hands_wrap' },
  { id: 'sigrid', sex: 'female', hair: '#3a241c', hairHi: '#6b4030', chest: 'chest_chain', legs: 'legs_chain', feet: 'feet_boot', weapon: 'weapon_blade' },
  { id: 'sefa', sex: 'female', hair: '#4a3020', hairHi: '#8a6040', chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_shoe' },
  { id: 'nils', sex: 'male', hair: '#2a2018', hairHi: '#5c4030', beard: '#3a2c24', skin: '#f0c8a4', skinHi: '#ffe0c0', chest: 'chest_leather', legs: 'legs_leather', feet: 'feet_boot', helm: 'helm_cap' },
];

function compositePerson(w, h, person, dir, pose) {
  const palette = {
    skin: person.skin ? hex(person.skin) : undefined,
    skinHi: person.skinHi ? hex(person.skinHi) : undefined,
    hair: hex(person.hair),
    hairHi: hex(person.hairHi ?? person.hair),
    beard: person.beard ? hex(person.beard) : person.sex === 'female' ? false : undefined,
  };
  const base = paint(w, h, person.sex, dir === 'w' ? 'e' : dir, pose, 'body', palette);
  const layers = [person.legs, person.feet, person.chest, person.hands, person.helm, person.weapon].filter(Boolean);
  for (const part of layers) {
    const overlay = paint(w, h, person.sex, dir === 'w' ? 'e' : dir, pose, part, palette);
    blit(base, overlay, 0, 0);
  }
  return dir === 'w' ? flip(base) : base;
}

export function buildPeopleArt() {
  const { w, h } = FIELD;
  const dirs = ['s', 'e', 'n', 'w'];
  const poses = ['idle0', 'idle1', 'walk0', 'walk1'];
  const cols = dirs.length * poses.length;
  const out = createImage(cols * w, PEOPLE.length * h);
  const rows = {};
  PEOPLE.forEach((person, row) => {
    rows[person.id] = row;
    let col = 0;
    for (const dir of dirs) {
      for (const pose of poses) {
        blit(out, compositePerson(w, h, person, dir, pose), col * w, row * h);
        col += 1;
      }
    }
  });
  return { sheet: out, meta: { frameW: w, frameH: h, dirs, poses, framesPerDir: poses.length, rows } };
}

export function buildHeroArt() {
  return { field: sheet('field'), portrait: sheet('portrait') };
}
