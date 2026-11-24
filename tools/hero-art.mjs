/**
 * Field heroes are 24×40. The inventory portrait is 48×80. Gear is a separate row per piece.
 * Each playable race has its own body, and gear rows that sit on that body.
 * Original pixel art. Nothing here is traced from another game.
 */
import { blit, createImage, hex, silhouette } from './pixel.mjs';

const INK = hex('#1c1418');
const WHITE = hex('#f4f7fb');
const BOOT = hex('#3a241c');
const SHOE = hex('#6a5348');
const WRAP = hex('#d7c4a4');
const WRAP_HI = hex('#f0e2c8');
const WOOD = hex('#8d5a38');
const IRON = hex('#d7dee6');
const BOW_STRING = hex('#efe6c8');
const TUSK = hex('#efe6c8');
const TUSK_SH = hex('#b7aa84');
const EAR_INNER = hex('#e8a0a0');
const EYE_OGRE = hex('#d4c46a');

export const FIELD = { w: 24, h: 40 };
export const PORTRAIT = { w: 48, h: 80 };

const GEAR_PARTS = [
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
  'weapon_bow',
];

/** Unprefixed rows are the barbarian, which is what older saves still name body_m / body_f. */
export const GEAR_ROWS = ['body_m', 'wolf_helm_m', 'body_f', 'wolf_helm_f', ...GEAR_PARTS];

function tone(spec) {
  const c = (h) => hex(h);
  return {
    ...spec,
    skin: c(spec.skin),
    skinHi: c(spec.skinHi),
    skinSh: c(spec.skinSh),
    hair: c(spec.hair),
    hairHi: c(spec.hairHi),
    beard: spec.beard ? c(spec.beard) : null,
    band: c(spec.band),
    bandHi: c(spec.bandHi),
    leaf: spec.leaf ? c(spec.leaf) : null,
    leafHi: spec.leafHi ? c(spec.leafHi) : null,
    browColor: c(spec.browColor),
    wart: c(spec.wart),
    belt: c(spec.belt),
    boot: c(spec.boot),
    eye: c(spec.eye),
    cloth: [c(spec.cloth[0]), c(spec.cloth[1])],
    leather: [c(spec.leather[0]), c(spec.leather[1])],
    chain: [c(spec.chain[0]), c(spec.chain[1])],
    plate: [c(spec.plate[0]), c(spec.plate[1])],
    fur: [c(spec.fur[0]), c(spec.fur[1])],
  };
}

const RAW_RACES = {
  barbarian: {
    id: 'barbarian',
    shoulder: 8,
    chestTop: 14,
    chestH: 9,
    hip: 23,
    foot: 37,
    headY: 6,
    headHalf: 5,
    ears: 'round',
    beardKind: 'wild',
    brow: 1,
    skin: '#c47858',
    skinHi: '#e8a888',
    skinSh: '#8a4838',
    hair: '#4a2010',
    hairHi: '#c47840',
    beard: '#3a1808',
    band: '#8a3030',
    bandHi: '#e6c15a',
    leaf: '#8a3030',
    leafHi: '#e6c15a',
    browColor: '#5a2820',
    wart: '#8a4838',
    belt: '#3a2418',
    boot: '#2a1814',
    eye: '#1c1418',
    cloth: ['#6a4030', '#c48458'],
    leather: ['#5c3018', '#a86a3c'],
    chain: ['#7a8490', '#c5ced6'],
    plate: ['#8a6840', '#e6c15a'],
    fur: ['#8a5a32', '#c49464'],
  },
  human: {
    id: 'human',
    shoulder: 6,
    chestTop: 15,
    chestH: 8,
    hip: 24,
    foot: 36,
    headY: 8,
    headHalf: 4,
    ears: 'round',
    beardKind: 'short',
    brow: 0,
    skin: '#e4b08a',
    skinHi: '#f6d4b6',
    skinSh: '#c48462',
    hair: '#3a2418',
    hairHi: '#6b4030',
    beard: '#4a3020',
    band: '#5c4030',
    bandHi: '#8a6040',
    leaf: '#5c4030',
    leafHi: '#8a6040',
    browColor: '#6a4030',
    wart: '#c48462',
    belt: '#5c3a28',
    boot: '#3a241c',
    eye: '#1c1418',
    cloth: ['#3d5e78', '#7ea0c0'],
    leather: ['#6a3a28', '#a86a44'],
    chain: ['#8b97a3', '#d5dee6'],
    plate: ['#8a7048', '#e6c15a'],
    fur: ['#8a5a32', '#c49464'],
  },
  dwarf: {
    id: 'dwarf',
    shoulder: 8,
    chestTop: 18,
    chestH: 8,
    hip: 27,
    foot: 37,
    headY: 11,
    headHalf: 5,
    ears: 'none',
    beardKind: 'huge',
    brow: 1,
    skin: '#e8b898',
    skinHi: '#f6d4b8',
    skinSh: '#b07858',
    hair: '#6a3a18',
    hairHi: '#e0a060',
    beard: '#5c3010',
    band: '#8a3030',
    bandHi: '#e6c15a',
    leaf: '#8a3030',
    leafHi: '#e6c15a',
    browColor: '#4a2818',
    wart: '#b07858',
    belt: '#3a2418',
    boot: '#2a1814',
    eye: '#1c1418',
    cloth: ['#5c4030', '#a07848'],
    leather: ['#5a3018', '#8a5030'],
    chain: ['#6a7078', '#b0b8c0'],
    plate: ['#7a5830', '#d4a050'],
    fur: ['#6a4028', '#a07048'],
  },
  high_elf: {
    id: 'high_elf',
    shoulder: 5,
    chestTop: 13,
    chestH: 8,
    hip: 23,
    foot: 37,
    headY: 5,
    headHalf: 3,
    ears: 'point',
    beardKind: 'none',
    brow: 0,
    skin: '#f4d8c4',
    skinHi: '#fff0e4',
    skinSh: '#e0b8a0',
    hair: '#d5dbe8',
    hairHi: '#f7fbff',
    beard: '#d5dbe8',
    band: '#8eb4d4',
    bandHi: '#f4f7fb',
    leaf: '#8eb4d4',
    leafHi: '#f4f7fb',
    browColor: '#c4b4b0',
    wart: '#e0b8a0',
    belt: '#2a4a6a',
    boot: '#2a3848',
    eye: '#1c2838',
    cloth: ['#243e5c', '#d5e6f4'],
    leather: ['#4a4038', '#c8c0b4'],
    chain: ['#9aa8b8', '#f4f7fb'],
    plate: ['#c5ced8', '#f7fbff'],
    fur: ['#6a645c', '#d8d2c8'],
  },
  wood_elf: {
    id: 'wood_elf',
    shoulder: 5,
    chestTop: 14,
    chestH: 8,
    hip: 24,
    foot: 37,
    headY: 6,
    headHalf: 3,
    ears: 'point',
    beardKind: 'none',
    brow: 0,
    skin: '#c49662',
    skinHi: '#e0bc88',
    skinSh: '#8a6240',
    hair: '#2e4a28',
    hairHi: '#7aaa50',
    beard: '#2e4a28',
    band: '#3e6b40',
    bandHi: '#8aaa58',
    leaf: '#3e6b40',
    leafHi: '#9ac86a',
    browColor: '#3a3020',
    wart: '#8a6240',
    belt: '#4a3018',
    boot: '#3a2418',
    eye: '#1c2414',
    cloth: ['#2c4a30', '#8ab86a'],
    leather: ['#5c3a22', '#a07848'],
    chain: ['#5a6850', '#b0c090'],
    plate: ['#6a5840', '#c4a878'],
    fur: ['#4a3828', '#7a6848'],
  },
  ogre: {
    id: 'ogre',
    shoulder: 10,
    chestTop: 18,
    chestH: 9,
    hip: 28,
    foot: 38,
    headY: 6,
    headHalf: 5,
    ears: 'small',
    beardKind: 'none',
    brow: 2,
    tusks: true,
    skin: '#6d7a5c',
    skinHi: '#9aaa86',
    skinSh: '#3e4a36',
    hair: '#242820',
    hairHi: '#3a4030',
    beard: '#242820',
    band: '#3a3020',
    bandHi: '#6a5840',
    leaf: '#3a3020',
    leafHi: '#6a5840',
    browColor: '#242820',
    wart: '#4a5a32',
    belt: '#2a2418',
    boot: '#241c18',
    eye: '#d4c46a',
    cloth: ['#4a4030', '#6a5840'],
    leather: ['#3a3024', '#6a5040'],
    chain: ['#5a6058', '#8a9088'],
    plate: ['#4a5048', '#9aa090'],
    fur: ['#4a3828', '#6a5840'],
  },
};

export const RACE_LOOK = Object.fromEntries(Object.entries(RAW_RACES).map(([id, spec]) => [id, tone(spec)]));

export const RACE_IDS = Object.keys(RACE_LOOK);

function box(img, x, y, w, h, c) {
  for (let yy = 0; yy < h; yy++) {
    for (let xx = 0; xx < w; xx++) img.set(x + xx, y + yy, c);
  }
}

function finish(img) {
  silhouette(img, INK);
  return img;
}

function hands(img, cx, y, s, dir, step, color, hi, palm) {
  const p = palm * s;
  const shift = Math.round(step / 2);
  if (dir === 'n') {
    box(img, cx - 8 * s + shift, y, p, 4 * s, color);
    box(img, cx + 5 * s - shift, y, p, 4 * s, hi);
    return;
  }
  if (dir === 'e') {
    box(img, cx + 6 * s, y, p + s, 4 * s, hi);
    box(img, cx - 3 * s, y - s, 2 * s, 3 * s, color);
    return;
  }
  box(img, cx - 9 * s - shift, y, p, 4 * s, color);
  box(img, cx + 6 * s + shift, y, p, 4 * s, hi);
}

/** Pointed ears. The tip sits several pixels outside the skull so it survives a phone zoom. */
function pointedEars(img, cx, hy, s, hh, skin, hi, inner, dir) {
  const y = hy + 2 * s;
  const steps = dir === 'e' ? 5 : 4;
  if (dir !== 'e') {
    for (let i = 0; i < steps; i++) {
      const x = cx - hh - s - i * s;
      const yy = y - i * s;
      img.set(x, yy, i === steps - 1 ? hi : skin);
      if (i < steps - 1) img.set(x, yy + s, inner);
    }
  }
  for (let i = 0; i < steps; i++) {
    const x = cx + hh + i * s;
    const yy = y - i * s;
    img.set(x, yy, i === steps - 1 ? hi : skin);
    if (i < steps - 1) img.set(x, yy + s, inner);
  }
}

function roundEars(img, cx, hy, s, hh, skin, hi) {
  img.set(cx - hh - s, hy + 2 * s, skin);
  img.set(cx + hh, hy + 2 * s, hi);
}

function paint(w, h, sex, dir, pose, part, palette, raceId = 'barbarian') {
  const img = createImage(w, h);
  const race = RACE_LOOK[raceId] ?? RACE_LOOK.barbarian;
  const female = sex === 'female';
  const portrait = h > 50;
  const s = portrait ? 2 : 1;
  const bob = pose === 'idle1' || pose === 'walk1' ? -s : 0;
  const step = pose === 'walk0' ? 2 * s : pose === 'walk1' ? -2 * s : 0;
  const cx = portrait ? 24 : 12;
  const yOf = (n) => n + bob;
  const skin = palette?.skin ?? race.skin;
  const skinHi = palette?.skinHi ?? race.skinHi;
  const skinSh = palette?.skinSh ?? race.skinSh;
  const hair = palette?.hair ?? race.hair;
  const hairHi = palette?.hairHi ?? race.hairHi;
  const beardInk = palette?.beard && palette.beard !== true ? palette.beard : race.beard;
  const hh = race.headHalf * s;
  const shoulderCut = female && race.id !== 'ogre' && race.id !== 'dwarf' ? 1 : 0;
  const sh = (race.shoulder - shoulderCut) * s;
  const chestTop = yOf(race.chestTop * s);
  const chestH = race.chestH * s;
  const hip = race.hip * s;
  const foot = race.foot * s;
  const hy = yOf(race.headY * s);
  const legW = race.id === 'dwarf' || race.id === 'ogre' ? 4 * s : 3 * s;

  if (part === 'body') {
    box(img, cx - legW - Math.max(0, step), hip, legW, Math.max(s, foot - hip - 2 * s), skinSh);
    box(img, cx + s + Math.max(0, -step), hip, legW, Math.max(s, foot - hip - 2 * s), skin);
    box(img, cx - legW - s - Math.max(0, step), foot - 3 * s, legW + s, 3 * s, race.boot);
    box(img, cx + Math.max(0, -step), foot - 3 * s, legW + s, 3 * s, race.boot);
    box(img, cx - sh, chestTop, sh * 2, chestH, skinSh);
    box(img, cx - sh + s, chestTop + s, Math.max(s, sh * 2 - 2 * s), Math.max(s, chestH - 2 * s), skin);
    if (race.id === 'ogre') {
      img.set(cx - 3 * s, chestTop + 3 * s, skinHi);
      img.set(cx + 2 * s, chestTop + 2 * s, skinSh);
      img.set(cx + 4 * s, chestTop + 5 * s, race.wart);
      img.set(cx - 4 * s, chestTop + 4 * s, race.wart);
    }
    const armH = race.id === 'ogre' ? 9 * s : 6 * s;
    box(img, cx - sh - s, chestTop + s, 2 * s, armH, skinSh);
    box(img, cx + sh - s, chestTop + s, 2 * s, armH, skin);
    hands(img, cx, chestTop + armH, s, dir, step, skinSh, skinHi, race.id === 'ogre' ? 4 : 3);
    box(img, cx - 3 * s, chestTop + chestH - s, 6 * s, s, race.belt);
    const headH = race.id === 'ogre' ? 9 * s : 8 * s;
    box(img, cx - hh, hy, hh * 2, headH, skin);
    if (race.id === 'ogre') {
      box(img, cx - hh - s, hy + 5 * s, hh * 2 + 2 * s, 4 * s, skinSh);
      box(img, cx - hh, hy + 5 * s, hh * 2, 3 * s, skin);
    }
    const hairRise = race.id === 'barbarian' ? 3 * s : 2 * s;
    box(img, cx - hh - s, hy - hairRise, hh * 2 + 2 * s, hairRise + s, hair);
    box(img, cx - hh, hy - s, hh * 2, s, hairHi);
    if (race.id === 'barbarian') {
      img.set(cx - 2 * s, hy - hairRise - s, hairHi);
      img.set(cx + s, hy - hairRise - 2 * s, hair);
      img.set(cx + 3 * s, hy - hairRise - s, hairHi);
    }
    box(img, cx - hh - s, hy, s, 4 * s, hair);
    box(img, cx + hh, hy, s, 4 * s, hair);
    if (female && race.beardKind !== 'huge') {
      box(img, cx - hh - s, hy + 2 * s, s, 7 * s, hair);
      box(img, cx + hh, hy + 2 * s, s, 7 * s, hairHi);
    }
    const eyeY = hy + (race.brow ? 3 * s : 2 * s);
    const gap = race.id === 'ogre' ? s : 2 * s;
    img.set(cx - gap, eyeY, race.eye);
    img.set(cx + gap, eyeY, race.eye);
    if (portrait) {
      img.set(cx - gap, eyeY - s, WHITE);
      img.set(cx + gap, eyeY - s, WHITE);
    }
    if (race.brow) box(img, cx - hh + s, eyeY - 2 * s, Math.max(s, hh * 2 - 2 * s), race.brow * s, race.browColor);
    if (race.beardKind === 'huge' && beardInk) {
      box(img, cx - hh - s, hy + 3 * s, hh * 2 + 2 * s, 7 * s, beardInk);
      box(img, cx - hh + s, hy + 9 * s, Math.max(s, hh * 2 - 2 * s), 5 * s, beardInk);
      box(img, cx - s, hy + 13 * s, 2 * s, 3 * s, beardInk);
      if (female) box(img, cx, hy + 4 * s, s, 10 * s, hairHi);
      else box(img, cx - s, hy + 5 * s, s, 8 * s, hairHi);
    } else if (!female && race.beardKind === 'wild' && beardInk) {
      box(img, cx - hh, hy + 4 * s, hh * 2, 4 * s, beardInk);
      box(img, cx - s, hy + 8 * s, 2 * s, 3 * s, beardInk);
    } else if (!female && race.beardKind === 'short' && palette?.beard !== false && beardInk) {
      box(img, cx - 2 * s, hy + 5 * s, 4 * s, 2 * s, beardInk);
    }
    if (race.tusks) {
      box(img, cx - hh - s, hy + 6 * s, 3 * s, 2 * s, skinSh);
      box(img, cx + hh - 2 * s, hy + 6 * s, 3 * s, 2 * s, skin);
      box(img, cx - 3 * s, hy + 6 * s, 2 * s, 3 * s, TUSK);
      box(img, cx + s, hy + 6 * s, 2 * s, 3 * s, TUSK);
      img.set(cx - 3 * s, hy + 9 * s, TUSK_SH);
      img.set(cx + 2 * s, hy + 9 * s, TUSK);
      img.set(cx - hh + s, hy + 3 * s, race.wart);
      img.set(cx + hh - 2 * s, hy + 2 * s, race.wart);
      img.set(cx + 2 * s, hy + 4 * s, race.wart);
    }
    if (race.id === 'high_elf') {
      box(img, cx - hh, hy + s, hh * 2, s, race.band);
      img.set(cx, hy, race.bandHi);
    } else if (race.id === 'wood_elf') {
      img.set(cx + hh - s, hy - s, race.leaf);
      img.set(cx + hh, hy - 2 * s, race.leafHi);
      img.set(cx + hh - s, hy - 2 * s, race.leafHi);
    } else if (race.id === 'barbarian') {
      box(img, cx - hh, hy + s, hh * 2, s, race.band);
    } else if (race.id === 'human') {
      box(img, cx - hh, hy + s, hh * 2, Math.max(s, 1), hex('#e6c15a'));
      img.set(cx, hy, hex('#1d4e89'));
      box(img, cx - sh, chestTop - s, sh * 2, s, hex('#1d4e89'));
      img.set(cx, chestTop - s, hex('#e6c15a'));
    }
    if (race.ears === 'point') pointedEars(img, cx, hy, s, hh, skin, skinHi, EAR_INNER, dir);
    else if (race.ears === 'round') roundEars(img, cx, hy, s, hh, skin, skinHi);
    else if (race.ears === 'small') {
      img.set(cx - hh - s, hy + 4 * s, skinSh);
      img.set(cx + hh, hy + 4 * s, skinSh);
    }
    if (dir === 'n') {
      box(img, cx - hh, hy - s, hh * 2, 7 * s, hair);
      if (race.ears === 'point') pointedEars(img, cx, hy, s, hh, skin, skinHi, EAR_INNER, 's');
    }
    if (dir === 'e') {
      box(img, cx + hh - s, hy + s, 2 * s, 3 * s, skinHi);
      if (race.ears === 'point') pointedEars(img, cx, hy, s, hh, skin, skinHi, EAR_INNER, 'e');
    }
  } else if (part === 'wolf_helm') {
    box(img, cx - hh - s, hy - 3 * s, hh * 2 + 2 * s, 4 * s, hex('#8a8178'));
    box(img, cx - hh - 2 * s, hy - 5 * s, 2 * s, 3 * s, hex('#c8c0b6'));
    box(img, cx + hh, hy - 5 * s, 2 * s, 3 * s, hex('#c8c0b6'));
    if (dir !== 'n') {
      img.set(cx - 2 * s, hy, hex('#6a3030'));
      img.set(cx + s, hy, hex('#6a3030'));
    }
  } else if (part.startsWith('chest_')) {
    const key = part.slice('chest_'.length);
    const pair = race[key] ?? race.leather;
    box(img, cx - sh, chestTop, sh * 2, Math.max(s, chestH - s), pair[0]);
    box(img, cx - sh + 2 * s, chestTop + s, Math.max(s, sh * 2 - 4 * s), Math.max(s, chestH - 3 * s), pair[1]);
    if (part === 'chest_plate') box(img, cx - s, chestTop + 2 * s, 2 * s, Math.max(s, chestH - 4 * s), pair[1]);
    if (part === 'chest_fur') box(img, cx - sh, chestTop, 2 * s, 2 * s, pair[1]);
    if (race.id === 'wood_elf' && part === 'chest_cloth') {
      img.set(cx - 2 * s, chestTop + 2 * s, race.leafHi);
      img.set(cx + s, chestTop + 3 * s, race.leaf);
    }
    if (race.id === 'high_elf' && (part === 'chest_cloth' || part === 'chest_plate')) {
      img.set(cx, chestTop + 2 * s, race.bandHi);
    }
  } else if (part.startsWith('legs_')) {
    const key = part.slice('legs_'.length);
    const pair = race[key] ?? race.leather;
    box(img, cx - legW - Math.max(0, step), hip, legW, Math.max(s, foot - hip - 2 * s), pair[0]);
    box(img, cx + s + Math.max(0, -step), hip, legW, Math.max(s, foot - hip - 2 * s), pair[0]);
  } else if (part === 'feet_boot' || part === 'feet_shoe') {
    const c = part === 'feet_shoe' ? SHOE : BOOT;
    box(img, cx - legW - s - Math.max(0, step), foot - 4 * s, legW + s, 4 * s, c);
    box(img, cx + Math.max(0, -step), foot - 4 * s, legW + s, 4 * s, c);
  } else if (part === 'hands_glove' || part === 'hands_wrap') {
    const c = part === 'hands_wrap' ? WRAP : race.leather[0];
    const hi = part === 'hands_wrap' ? WRAP_HI : race.leather[1];
    const armH = race.id === 'ogre' ? 9 * s : 6 * s;
    hands(img, cx, chestTop + armH, s, dir, step, c, hi, race.id === 'ogre' ? 4 : 3);
  } else if (part === 'helm_cap' || part === 'helm_coif' || part === 'helm_plate') {
    const key = part === 'helm_plate' ? 'plate' : part === 'helm_coif' ? 'chain' : 'leather';
    const c = race[key][0];
    box(img, cx - hh - s, hy - 4 * s, hh * 2 + 2 * s, 4 * s, c);
    box(img, cx - hh, hy - s, hh * 2, 2 * s, c);
    if (part === 'helm_plate' && dir !== 'n') box(img, cx - 2 * s, hy, 4 * s, s, race[key][1]);
  } else if (part.startsWith('weapon_')) {
    const armH = race.id === 'ogre' ? 9 * s : 6 * s;
    const handY = chestTop + armH;
    const shift = dir === 's' ? Math.round(step / 2) : 0;
    const hx = dir === 'n' ? cx + 7 * s : cx + 8 * s + shift;
    if (part === 'weapon_axe') {
      box(img, hx, handY - 10 * s, s, 16 * s, WOOD);
      box(img, hx - 2 * s, handY - 12 * s, 5 * s, 4 * s, IRON);
    } else if (part === 'weapon_blade') {
      box(img, hx, handY - 12 * s, s, 12 * s, IRON);
      box(img, hx - s, handY, 3 * s, 2 * s, WOOD);
    } else if (part === 'weapon_bow') {
      for (let i = -7; i <= 6; i++) {
        const bend = Math.abs(i) > 3 ? s : 0;
        img.set(hx + bend, handY + i * s, WOOD);
      }
      img.set(hx - s, handY - 7 * s, WOOD);
      img.set(hx - s, handY + 6 * s, WOOD);
      for (let i = -6; i <= 5; i++) img.set(hx - 2 * s, handY + i * s, BOW_STRING);
    } else {
      box(img, hx, handY - 14 * s, s, 18 * s, WOOD);
      box(img, hx - s, handY - 14 * s, 3 * s, 2 * s, IRON);
    }
  }
  return finish(img);
}

function flip(img) {
  const out = createImage(img.w, img.h);
  blit(out, img, 0, 0, { flipX: true });
  return out;
}

function rowPlan() {
  const rows = [
    { name: 'body_m', part: 'body', sex: 'male', race: 'barbarian' },
    { name: 'wolf_helm_m', part: 'wolf_helm', sex: 'male', race: 'barbarian' },
    { name: 'body_f', part: 'body', sex: 'female', race: 'barbarian' },
    { name: 'wolf_helm_f', part: 'wolf_helm', sex: 'female', race: 'barbarian' },
  ];
  for (const part of GEAR_PARTS) rows.push({ name: part, part, sex: 'male', race: 'barbarian' });
  for (const race of RACE_IDS) {
    if (race === 'barbarian') continue;
    rows.push({ name: `body_${race}_m`, part: 'body', sex: 'male', race });
    rows.push({ name: `body_${race}_f`, part: 'body', sex: 'female', race });
    rows.push({ name: `${race}_wolf_helm_m`, part: 'wolf_helm', sex: 'male', race });
    rows.push({ name: `${race}_wolf_helm_f`, part: 'wolf_helm', sex: 'female', race });
    for (const part of GEAR_PARTS) rows.push({ name: `${race}_${part}`, part, sex: 'male', race });
  }
  return rows;
}

function sheet(kind) {
  const { w, h } = kind === 'field' ? FIELD : PORTRAIT;
  const dirs = kind === 'field' ? ['s', 'e', 'n', 'w'] : ['s'];
  const poses = kind === 'field' ? ['idle0', 'idle1', 'walk0', 'walk1'] : ['idle0', 'idle1'];
  const cols = dirs.length * poses.length;
  const plan = rowPlan();
  const out = createImage(cols * w, plan.length * h);
  plan.forEach((row, index) => {
    let col = 0;
    for (const dir of dirs) {
      for (const pose of poses) {
        const img = paint(w, h, row.sex, dir === 'w' ? 'e' : dir, pose, row.part, null, row.race);
        blit(out, dir === 'w' ? flip(img) : img, col * w, index * h);
        col += 1;
      }
    }
  });
  const rows = {};
  plan.forEach((row, index) => {
    rows[row.name] = index;
  });
  return { sheet: out, meta: { frameW: w, frameH: h, dirs, poses, framesPerDir: poses.length, rows } };
}

/** Each townsperson is one baked row of the detailed model, with their own hair and kit. */
export const PEOPLE = [
  { id: 'brenna', race: 'barbarian', sex: 'female', hair: '#6b3030', hairHi: '#a85048', chest: 'chest_leather', legs: 'legs_leather', feet: 'feet_boot' },
  { id: 'hilda', race: 'barbarian', sex: 'female', hair: '#c4a574', hairHi: '#e6d2a4', chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_shoe', beard: false },
  { id: 'torvald', race: 'barbarian', sex: 'male', hair: '#d8d0c4', hairHi: '#f4f0e6', beard: '#e6e0d4', chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_boot' },
  { id: 'soren', race: 'barbarian', sex: 'male', hair: '#2c1810', chest: 'chest_chain', legs: 'legs_chain', feet: 'feet_boot', helm: 'helm_coif', weapon: 'weapon_axe' },
  { id: 'freya', race: 'barbarian', sex: 'female', hair: '#e6c15a', hairHi: '#ffe7ad', chest: 'chest_fur', legs: 'legs_leather', feet: 'feet_boot', helm: 'helm_cap' },
  { id: 'eirik', race: 'barbarian', sex: 'male', hair: '#3a2418', beard: '#5c3a28', chest: 'chest_plate', legs: 'legs_plate', feet: 'feet_boot', helm: 'helm_plate', weapon: 'weapon_axe' },
  { id: 'ivar', race: 'barbarian', sex: 'male', hair: '#1c1418', beard: '#3a2418', chest: 'chest_leather', legs: 'legs_leather', feet: 'feet_boot', weapon: 'weapon_axe' },
  { id: 'marta', race: 'barbarian', sex: 'female', hair: '#8a4030', hairHi: '#c47058', chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_shoe' },
  { id: 'signe', race: 'barbarian', sex: 'female', hair: '#2a2438', hairHi: '#6a6080', chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_shoe' },
  { id: 'ingrid', race: 'human', sex: 'female', hair: '#1a2840', hairHi: '#3c5878', skin: '#f3d2b4', skinHi: '#ffe4cc', chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_shoe', weapon: 'weapon_staff' },
  { id: 'torunn', race: 'barbarian', sex: 'female', hair: '#4a2018', hairHi: '#8a4030', chest: 'chest_fur', legs: 'legs_leather', feet: 'feet_boot' },
  { id: 'sable', race: 'barbarian', sex: 'female', hair: '#1c1418', hairHi: '#3a3038', chest: 'chest_leather', legs: 'legs_leather', feet: 'feet_boot', weapon: 'weapon_blade' },
  { id: 'hroth', race: 'barbarian', sex: 'male', hair: '#6a2018', hairHi: '#a84830', beard: '#4a1814', chest: 'chest_leather', legs: 'legs_leather', feet: 'feet_boot', weapon: 'weapon_axe' },
  { id: 'bjorn', race: 'barbarian', sex: 'male', hair: '#c8c0b6', hairHi: '#f4f0e6', beard: '#a09890', chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_boot', hands: 'hands_wrap' },
  { id: 'sigrid', race: 'barbarian', sex: 'female', hair: '#3a241c', hairHi: '#6b4030', chest: 'chest_chain', legs: 'legs_chain', feet: 'feet_boot', weapon: 'weapon_blade' },
  { id: 'sefa', race: 'barbarian', sex: 'female', hair: '#4a3020', hairHi: '#8a6040', chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_shoe' },
  { id: 'nils', race: 'human', sex: 'male', hair: '#2a2018', hairHi: '#5c4030', beard: '#3a2c24', skin: '#f0c8a4', skinHi: '#ffe0c0', chest: 'chest_leather', legs: 'legs_leather', feet: 'feet_boot', helm: 'helm_cap' },
  { id: 'sigrun', race: 'barbarian', sex: 'female', hair: '#6a3030', hairHi: '#a85848', chest: 'chest_chain', legs: 'legs_leather', feet: 'feet_boot', helm: 'helm_coif', weapon: 'weapon_axe' },
  { id: 'brand', race: 'barbarian', sex: 'male', hair: '#8a8078', hairHi: '#d8d0c4', beard: '#c8c0b6', chest: 'chest_fur', legs: 'legs_leather', feet: 'feet_boot', helm: 'helm_cap' },
  { id: 'yrsa', race: 'barbarian', sex: 'female', hair: '#3a2018', hairHi: '#6b4030', chest: 'chest_leather', legs: 'legs_leather', feet: 'feet_boot', weapon: 'weapon_axe' },
  { id: 'hjorvin', race: 'barbarian', sex: 'male', hair: '#c4a060', hairHi: '#e6c15a', beard: '#8a5a30', chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_boot' },
  { id: 'kara', race: 'barbarian', sex: 'female', hair: '#6a3030', hairHi: '#a84840', chest: 'chest_fur', legs: 'legs_leather', feet: 'feet_boot', helm: 'helm_cap', weapon: 'weapon_axe' },
  { id: 'orm', race: 'barbarian', sex: 'male', hair: '#8a8078', hairHi: '#d8d0c4', beard: '#6a645c', chest: 'chest_leather', legs: 'legs_leather', feet: 'feet_boot', helm: 'helm_cap' },
  { id: 'odda', race: 'human', sex: 'female', hair: '#3a2418', hairHi: '#6b4030', chest: 'chest_plate', legs: 'legs_plate', feet: 'feet_boot', weapon: 'weapon_blade' },
  { id: 'nell', race: 'human', sex: 'female', hair: '#6a4030', hairHi: '#a07050', chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_shoe' },
  { id: 'osric', race: 'human', sex: 'male', hair: '#2a2018', hairHi: '#5c4030', beard: '#3a2820', chest: 'chest_plate', legs: 'legs_plate', feet: 'feet_boot', weapon: 'weapon_blade' },
  { id: 'pike', race: 'human', sex: 'male', hair: '#1c1418', chest: 'chest_chain', legs: 'legs_chain', feet: 'feet_boot', helm: 'helm_coif', weapon: 'weapon_axe' },
  { id: 'cress', race: 'human', sex: 'female', hair: '#5a3028', hairHi: '#a06048', chest: 'chest_chain', legs: 'legs_chain', feet: 'feet_boot', weapon: 'weapon_blade' },
  { id: 'wynn', race: 'human', sex: 'female', hair: '#6a5040', hairHi: '#c4a080', chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_shoe' },
  { id: 'joren', race: 'human', sex: 'male', hair: '#3a3028', hairHi: '#6a5848', beard: '#4a3828', chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_boot' },
  { id: 'liriel', race: 'high_elf', sex: 'female', hair: '#e8eef8', hairHi: '#ffffff', chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_shoe' },
  { id: 'maeriel', race: 'high_elf', sex: 'female', hair: '#d5dbe8', hairHi: '#f7fbff', chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_shoe', weapon: 'weapon_staff' },
  { id: 'tael', race: 'high_elf', sex: 'male', hair: '#c5ced8', hairHi: '#f4f7fb', beard: false, chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_shoe' },
  { id: 'sere', race: 'high_elf', sex: 'male', hair: '#b9c6d4', hairHi: '#eef3f8', beard: false, chest: 'chest_chain', legs: 'legs_chain', feet: 'feet_boot', weapon: 'weapon_blade' },
  { id: 'halden', race: 'high_elf', sex: 'male', hair: '#e6e0d4', hairHi: '#f7fbff', beard: false, chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_shoe' },
  { id: 'selne', race: 'high_elf', sex: 'female', hair: '#f4f7fb', hairHi: '#ffffff', chest: 'chest_plate', legs: 'legs_plate', feet: 'feet_boot', weapon: 'weapon_staff' },
  { id: 'miris', race: 'high_elf', sex: 'female', hair: '#c8d4e4', hairHi: '#f4f7fb', chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_shoe', weapon: 'weapon_staff' },
  { id: 'adel', race: 'high_elf', sex: 'male', hair: '#d8dee8', hairHi: '#f7fbff', beard: false, chest: 'chest_plate', legs: 'legs_plate', feet: 'feet_boot', weapon: 'weapon_blade' },
  { id: 'quen', race: 'high_elf', sex: 'male', hair: '#b8c4d0', hairHi: '#e8eef4', beard: false, chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_shoe', weapon: 'weapon_staff' },
  { id: 'anwen', race: 'human', sex: 'female', hair: '#6a3030', hairHi: '#a85848', chest: 'chest_leather', legs: 'legs_leather', feet: 'feet_boot' },
  { id: 'durgan', race: 'dwarf', sex: 'male', hair: '#c48848', hairHi: '#e6c15a', beard: '#8a5018', chest: 'chest_plate', legs: 'legs_plate', feet: 'feet_boot', helm: 'helm_plate' },
  { id: 'sella', race: 'dwarf', sex: 'female', hair: '#a06030', hairHi: '#e0a060', beard: '#6a3810', chest: 'chest_chain', legs: 'legs_chain', feet: 'feet_boot', weapon: 'weapon_axe' },
  { id: 'dunn', race: 'dwarf', sex: 'male', hair: '#5c3010', beard: '#3a2010', chest: 'chest_chain', legs: 'legs_chain', feet: 'feet_boot', helm: 'helm_coif', weapon: 'weapon_axe' },
  { id: 'otta', race: 'dwarf', sex: 'female', hair: '#8a4820', hairHi: '#d09050', beard: '#5c3010', chest: 'chest_chain', legs: 'legs_chain', feet: 'feet_boot' },
  { id: 'brim', race: 'dwarf', sex: 'male', hair: '#6a3818', beard: '#4a2810', chest: 'chest_plate', legs: 'legs_plate', feet: 'feet_boot', weapon: 'weapon_axe' },
  { id: 'kelda', race: 'dwarf', sex: 'female', hair: '#e0c080', hairHi: '#f4e0b0', beard: '#a07040', chest: 'chest_plate', legs: 'legs_plate', feet: 'feet_boot', weapon: 'weapon_staff' },
  { id: 'orrin', race: 'dwarf', sex: 'male', hair: '#8a6840', beard: '#5c4020', chest: 'chest_plate', legs: 'legs_plate', feet: 'feet_boot', weapon: 'weapon_blade' },
  { id: 'nala', race: 'dwarf', sex: 'female', hair: '#3a2418', hairHi: '#6a4830', beard: '#2a1810', chest: 'chest_leather', legs: 'legs_leather', feet: 'feet_boot', weapon: 'weapon_blade' },
  { id: 'bram', race: 'dwarf', sex: 'male', hair: '#8a2020', beard: '#5a1010', chest: 'chest_leather', legs: 'legs_leather', feet: 'feet_boot', weapon: 'weapon_axe' },
  { id: 'henge', race: 'dwarf', sex: 'male', hair: '#6a5030', beard: '#4a3018', chest: 'chest_leather', legs: 'legs_leather', feet: 'feet_boot' },
  { id: 'brynn', race: 'human', sex: 'female', hair: '#4a3028', hairHi: '#8a6050', chest: 'chest_chain', legs: 'legs_chain', feet: 'feet_boot', weapon: 'weapon_blade' },
  { id: 'vess', race: 'dwarf', sex: 'female', hair: '#5c4030', hairHi: '#a08060', beard: '#3a2818', chest: 'chest_chain', legs: 'legs_chain', feet: 'feet_boot' },
  { id: 'ember_keel', race: 'dwarf', sex: 'male', hair: '#4a3020', beard: '#2a1810', chest: 'chest_leather', legs: 'legs_leather', feet: 'feet_boot', helm: 'helm_cap' },
  { id: 'ember_scout', race: 'barbarian', sex: 'male', hair: '#6a3030', beard: '#4a2018', chest: 'chest_fur', legs: 'legs_leather', feet: 'feet_boot', weapon: 'weapon_axe' },
  { id: 'thane_rest', race: 'dwarf', sex: 'male', hair: '#c0b8a8', hairHi: '#f0ece4', beard: '#a09888', chest: 'chest_chain', legs: 'legs_chain', feet: 'feet_boot' },
  { id: 'gate_holm', race: 'human', sex: 'male', hair: '#2a2018', chest: 'chest_chain', legs: 'legs_chain', feet: 'feet_boot', helm: 'helm_coif', weapon: 'weapon_axe' },
  { id: 'gate_moss', race: 'human', sex: 'female', hair: '#5a4030', hairHi: '#a07858', chest: 'chest_chain', legs: 'legs_chain', feet: 'feet_boot', weapon: 'weapon_blade' },
  { id: 'wry_warrior', race: 'human', sex: 'male', hair: '#3a2418', beard: '#5c3a28', chest: 'chest_plate', legs: 'legs_plate', feet: 'feet_boot', weapon: 'weapon_axe' },
  { id: 'wry_shaman', race: 'barbarian', sex: 'female', hair: '#6a3030', hairHi: '#a85848', chest: 'chest_fur', legs: 'legs_leather', feet: 'feet_boot', weapon: 'weapon_staff' },
  { id: 'wry_rogue', race: 'human', sex: 'male', hair: '#1c1418', beard: false, chest: 'chest_leather', legs: 'legs_leather', feet: 'feet_boot', weapon: 'weapon_blade' },
  { id: 'wry_berserker', race: 'barbarian', sex: 'male', hair: '#8a2018', beard: '#5a1010', chest: 'chest_leather', legs: 'legs_leather', feet: 'feet_boot', weapon: 'weapon_axe' },
  { id: 'wry_warden', race: 'barbarian', sex: 'male', hair: '#c8c0b6', beard: '#8a8078', chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_boot', hands: 'hands_wrap' },
  { id: 'wry_wizard', race: 'high_elf', sex: 'male', hair: '#d5dbe8', hairHi: '#f7fbff', beard: false, chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_shoe', weapon: 'weapon_staff' },
  { id: 'wry_cleric', race: 'high_elf', sex: 'female', hair: '#f4f7fb', hairHi: '#ffffff', chest: 'chest_plate', legs: 'legs_plate', feet: 'feet_boot', weapon: 'weapon_staff' },
  { id: 'wry_enchanter', race: 'high_elf', sex: 'female', hair: '#c8d4e4', hairHi: '#f4f7fb', chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_shoe', weapon: 'weapon_staff' },
  { id: 'wry_paladin', race: 'high_elf', sex: 'male', hair: '#e6e0d4', hairHi: '#f7fbff', beard: false, chest: 'chest_plate', legs: 'legs_plate', feet: 'feet_boot', weapon: 'weapon_blade' },
  { id: 'wry_magician', race: 'high_elf', sex: 'male', hair: '#b8c4d0', hairHi: '#e8eef4', beard: false, chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_shoe', weapon: 'weapon_staff' },
  { id: 'wry_druid', race: 'wood_elf', sex: 'female', hair: '#3e6b40', hairHi: '#8ab86a', chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_shoe', weapon: 'weapon_staff' },
  { id: 'wry_ranger', race: 'wood_elf', sex: 'male', hair: '#5c4030', hairHi: '#8a6848', beard: false, chest: 'chest_leather', legs: 'legs_leather', feet: 'feet_boot', weapon: 'weapon_bow' },
  { id: 'vaela', race: 'wood_elf', sex: 'female', hair: '#e0c878', hairHi: '#f4e8b0', chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_shoe', weapon: 'weapon_staff' },
  { id: 'sylven', race: 'wood_elf', sex: 'male', hair: '#2e4a28', hairHi: '#6a9a48', beard: false, chest: 'chest_leather', legs: 'legs_leather', feet: 'feet_boot', weapon: 'weapon_blade' },
  { id: 'moss', race: 'wood_elf', sex: 'female', hair: '#6a8a48', hairHi: '#b0d080', chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_shoe' },
  { id: 'larkin', race: 'wood_elf', sex: 'male', hair: '#c8b080', hairHi: '#f0e0b0', beard: false, chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_boot', hands: 'hands_wrap' },
  { id: 'thistle', race: 'wood_elf', sex: 'female', hair: '#1c2414', hairHi: '#3e5a30', chest: 'chest_leather', legs: 'legs_leather', feet: 'feet_boot', weapon: 'weapon_blade' },
  { id: 'briar', race: 'wood_elf', sex: 'female', hair: '#3e6b40', hairHi: '#9ac86a', chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_shoe', weapon: 'weapon_staff' },
  { id: 'rowan', race: 'wood_elf', sex: 'male', hair: '#5a4030', hairHi: '#a07850', beard: false, chest: 'chest_leather', legs: 'legs_leather', feet: 'feet_boot', weapon: 'weapon_bow' },
  { id: 'oak', race: 'wood_elf', sex: 'male', hair: '#2a3820', hairHi: '#5a7840', beard: false, chest: 'chest_leather', legs: 'legs_leather', feet: 'feet_boot', weapon: 'weapon_bow' },
  { id: 'fern', race: 'wood_elf', sex: 'female', hair: '#6a5030', hairHi: '#c4a060', chest: 'chest_leather', legs: 'legs_leather', feet: 'feet_boot' },
  { id: 'edric', race: 'human', sex: 'male', hair: '#3a2818', hairHi: '#6a4830', beard: '#4a3020', chest: 'chest_plate', legs: 'legs_plate', feet: 'feet_boot', weapon: 'weapon_blade' },
  { id: 'oswin', race: 'human', sex: 'male', hair: '#2a2018', beard: '#3a2820', chest: 'chest_chain', legs: 'legs_chain', feet: 'feet_boot', helm: 'helm_coif', weapon: 'weapon_axe' },
  { id: 'cald', race: 'human', sex: 'male', hair: '#1c1418', beard: '#3a2418', chest: 'chest_leather', legs: 'legs_leather', feet: 'feet_boot', weapon: 'weapon_axe' },
  { id: 'bessa', race: 'human', sex: 'female', hair: '#6a4030', hairHi: '#c09070', chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_shoe' },
  { id: 'grukka', race: 'ogre', sex: 'female', hair: '#242820', hairHi: '#4a5440', chest: 'chest_leather', legs: 'legs_leather', feet: 'feet_boot', weapon: 'weapon_staff' },
  { id: 'skaal', race: 'ogre', sex: 'male', hair: '#1c2018', hairHi: '#3a4030', chest: 'chest_chain', legs: 'legs_chain', feet: 'feet_boot', weapon: 'weapon_axe' },
  { id: 'bruk', race: 'ogre', sex: 'male', hair: '#242820', chest: 'chest_plate', legs: 'legs_plate', feet: 'feet_boot', weapon: 'weapon_axe' },
  { id: 'shala', race: 'ogre', sex: 'female', hair: '#3a4030', hairHi: '#5a6450', chest: 'chest_fur', legs: 'legs_leather', feet: 'feet_boot', weapon: 'weapon_staff' },
  { id: 'ruk', race: 'ogre', sex: 'male', hair: '#4a2018', hairHi: '#6a4030', chest: 'chest_leather', legs: 'legs_leather', feet: 'feet_boot', weapon: 'weapon_axe' },
  { id: 'ugga', race: 'ogre', sex: 'female', hair: '#2a3024', hairHi: '#4a5440', chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_boot' },
  { id: 'gash', race: 'ogre', sex: 'male', hair: '#1c1814', chest: 'chest_chain', legs: 'legs_chain', feet: 'feet_boot', helm: 'helm_cap', weapon: 'weapon_axe' },
  { id: 'mara', race: 'ogre', sex: 'female', hair: '#3a3428', hairHi: '#5a5448', chest: 'chest_leather', legs: 'legs_leather', feet: 'feet_boot' },
  { id: 'folk_barb_guard', race: 'barbarian', sex: 'male', hair: '#3a2418', beard: '#5c3a28', chest: 'chest_chain', legs: 'legs_chain', feet: 'feet_boot', helm: 'helm_cap', weapon: 'weapon_axe' },
  { id: 'folk_barb_folk', race: 'barbarian', sex: 'female', hair: '#c4a574', hairHi: '#e6d2a4', chest: 'chest_fur', legs: 'legs_leather', feet: 'feet_boot' },
  { id: 'folk_barb_merchant', race: 'barbarian', sex: 'male', hair: '#6a3030', beard: '#4a2018', chest: 'chest_leather', legs: 'legs_leather', feet: 'feet_boot' },
  { id: 'folk_barb_elder', race: 'barbarian', sex: 'female', hair: '#d8d0c4', hairHi: '#f4f0e6', chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_shoe' },
  { id: 'folk_human_guard', race: 'human', sex: 'male', hair: '#2a2018', beard: '#3a2820', chest: 'chest_chain', legs: 'legs_chain', feet: 'feet_boot', helm: 'helm_coif', weapon: 'weapon_blade' },
  { id: 'folk_human_folk', race: 'human', sex: 'female', hair: '#6a4030', hairHi: '#c4a080', chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_shoe' },
  { id: 'folk_human_merchant', race: 'human', sex: 'male', hair: '#4a3020', beard: '#5c4030', chest: 'chest_leather', legs: 'legs_leather', feet: 'feet_boot' },
  { id: 'folk_human_elder', race: 'human', sex: 'female', hair: '#c8b090', hairHi: '#f0e0c0', chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_shoe' },
  { id: 'folk_elf_guard', race: 'high_elf', sex: 'male', hair: '#d5dbe8', hairHi: '#f7fbff', beard: false, chest: 'chest_chain', legs: 'legs_chain', feet: 'feet_boot', weapon: 'weapon_blade' },
  { id: 'folk_elf_folk', race: 'high_elf', sex: 'female', hair: '#f4f7fb', hairHi: '#ffffff', chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_shoe' },
  { id: 'folk_elf_merchant', race: 'high_elf', sex: 'male', hair: '#c5ced8', hairHi: '#eef3f8', beard: false, chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_shoe' },
  { id: 'folk_elf_elder', race: 'high_elf', sex: 'female', hair: '#e6e0d4', hairHi: '#ffffff', chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_shoe' },
  { id: 'folk_wood_guard', race: 'wood_elf', sex: 'male', hair: '#2e4a28', hairHi: '#6a9a48', beard: false, chest: 'chest_leather', legs: 'legs_leather', feet: 'feet_boot', weapon: 'weapon_bow' },
  { id: 'folk_wood_folk', race: 'wood_elf', sex: 'female', hair: '#6a5030', hairHi: '#c4a060', chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_shoe' },
  { id: 'folk_wood_merchant', race: 'wood_elf', sex: 'male', hair: '#3e6b40', hairHi: '#9ac86a', beard: false, chest: 'chest_leather', legs: 'legs_leather', feet: 'feet_boot' },
  { id: 'folk_wood_elder', race: 'wood_elf', sex: 'female', hair: '#c8b080', hairHi: '#f0e0b0', chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_shoe' },
  { id: 'folk_dwarf_guard', race: 'dwarf', sex: 'male', hair: '#6a3818', beard: '#4a2810', chest: 'chest_chain', legs: 'legs_chain', feet: 'feet_boot', helm: 'helm_cap', weapon: 'weapon_axe' },
  { id: 'folk_dwarf_folk', race: 'dwarf', sex: 'female', hair: '#a06030', hairHi: '#e0a060', beard: '#6a3810', chest: 'chest_leather', legs: 'legs_leather', feet: 'feet_boot' },
  { id: 'folk_dwarf_merchant', race: 'dwarf', sex: 'male', hair: '#8a6840', beard: '#5c4020', chest: 'chest_leather', legs: 'legs_leather', feet: 'feet_boot' },
  { id: 'folk_dwarf_elder', race: 'dwarf', sex: 'female', hair: '#e0c080', hairHi: '#f4e0b0', beard: '#a07040', chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_boot' },
  { id: 'folk_ogre_guard', race: 'ogre', sex: 'male', hair: '#1c1814', chest: 'chest_chain', legs: 'legs_chain', feet: 'feet_boot', weapon: 'weapon_axe' },
  { id: 'folk_ogre_folk', race: 'ogre', sex: 'female', hair: '#3a4030', hairHi: '#5a6450', chest: 'chest_leather', legs: 'legs_leather', feet: 'feet_boot' },
  { id: 'folk_ogre_merchant', race: 'ogre', sex: 'male', hair: '#242820', chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_boot' },
  { id: 'folk_ogre_elder', race: 'ogre', sex: 'female', hair: '#4a5440', hairHi: '#6a7460', chest: 'chest_fur', legs: 'legs_leather', feet: 'feet_boot', weapon: 'weapon_staff' },
  { id: 'aldric', race: 'human', sex: 'male', hair: '#c4a060', hairHi: '#e6c15a', beard: '#8a6840', chest: 'chest_plate', legs: 'legs_plate', feet: 'feet_boot', helm: 'helm_plate', weapon: 'weapon_blade' },
  { id: 'wren', race: 'human', sex: 'female', hair: '#3e6b40', hairHi: '#8ab86a', chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_shoe', weapon: 'weapon_staff' },
  { id: 'keel', race: 'human', sex: 'male', hair: '#5a4030', hairHi: '#a07850', beard: '#4a3020', chest: 'chest_leather', legs: 'legs_leather', feet: 'feet_boot', weapon: 'weapon_bow' },
  { id: 'drinker_human', race: 'human', sex: 'male', hair: '#5a4030', beard: '#3a2820', chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_shoe', mug: true },
  { id: 'drinker_barbarian', race: 'barbarian', sex: 'male', hair: '#6a3030', beard: '#4a2018', chest: 'chest_fur', legs: 'legs_leather', feet: 'feet_boot', mug: true },
  { id: 'drinker_high_elf', race: 'high_elf', sex: 'female', hair: '#f4f7fb', hairHi: '#ffffff', chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_shoe', mug: true },
  { id: 'drinker_wood_elf', race: 'wood_elf', sex: 'female', hair: '#6a5030', hairHi: '#c4a060', chest: 'chest_cloth', legs: 'legs_cloth', feet: 'feet_shoe', mug: true },
  { id: 'drinker_dwarf', race: 'dwarf', sex: 'male', hair: '#8a6840', beard: '#5c4020', chest: 'chest_leather', legs: 'legs_leather', feet: 'feet_boot', mug: true },
  { id: 'drinker_ogre', race: 'ogre', sex: 'male', hair: '#242820', chest: 'chest_leather', legs: 'legs_leather', feet: 'feet_boot', mug: true },
];

function compositePerson(w, h, person, dir, pose) {
  const race = person.race ?? 'barbarian';
  const palette = {
    skin: person.skin ? hex(person.skin) : undefined,
    skinHi: person.skinHi ? hex(person.skinHi) : undefined,
    hair: hex(person.hair),
    hairHi: hex(person.hairHi ?? person.hair),
    beard: person.beard === false ? false : person.beard ? hex(person.beard) : undefined,
  };
  const base = paint(w, h, person.sex, dir === 'w' ? 'e' : dir, pose, 'body', palette, race);
  const layers = [person.legs, person.feet, person.chest, person.hands, person.helm, person.weapon].filter(Boolean);
  for (const part of layers) {
    const overlay = paint(w, h, person.sex, dir === 'w' ? 'e' : dir, pose, part, palette, race);
    blit(base, overlay, 0, 0);
  }
  if (person.mug && dir !== 'n') {
    const cx = 16;
    const y = 20;
    for (let yy = 0; yy < 4; yy++) for (let xx = 0; xx < 3; xx++) base.set(cx + xx, y + yy, hex('#e6c15a'));
    base.set(cx + 3, y + 1, hex('#f4f0e6'));
    base.set(cx + 1, y + 4, hex('#8d5a38'));
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

export function paintFrame(w, h, sex, dir, pose, part, raceId) {
  return paint(w, h, sex, dir, pose, part, null, raceId);
}
