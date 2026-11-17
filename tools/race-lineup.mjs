/**
 * Side-by-side race and class silhouettes from the portrait sheet.
 * Original art, same painter as the game.
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createImage, scale, blit, writePng, hex } from './pixel.mjs';
import { PORTRAIT, paintFrame } from './hero-art.mjs';

const KIT = {
  warrior: ['chest_plate', 'weapon_axe'],
  shaman: ['chest_fur', 'weapon_staff'],
  rogue: ['chest_leather', 'weapon_blade'],
  berserker: ['chest_leather', 'weapon_axe'],
  warden: ['chest_cloth', 'hands_wrap'],
  wizard: ['chest_cloth', 'weapon_staff'],
  cleric: ['chest_plate', 'weapon_staff'],
  enchanter: ['chest_cloth', 'weapon_staff'],
  paladin: ['chest_plate', 'weapon_blade'],
  magician: ['chest_cloth', 'weapon_staff'],
  druid: ['chest_cloth', 'weapon_staff'],
  ranger: ['chest_leather', 'weapon_bow'],
};

const ROWS = [
  ['Human', 'human', ['warrior']],
  ['Barbarian', 'barbarian', ['warrior', 'shaman', 'rogue', 'berserker', 'warden']],
  ['Dwarf', 'dwarf', ['warrior', 'cleric', 'paladin', 'rogue', 'berserker']],
  ['High Elf', 'high_elf', ['wizard', 'cleric', 'enchanter', 'paladin', 'magician']],
  ['Wood Elf', 'wood_elf', ['warden', 'rogue', 'druid', 'ranger']],
  ['Ogre', 'ogre', ['warrior', 'shaman', 'berserker']],
];

function figure(race, sex, parts) {
  const { w, h } = PORTRAIT;
  const body = paintFrame(w, h, sex, 's', 'idle0', 'body', race);
  for (const part of parts) blit(body, paintFrame(w, h, sex, 's', 'idle0', part, race), 0, 0);
  return body;
}

const FONT = {
  A: ['010', '101', '111', '101', '101'],
  B: ['110', '101', '110', '101', '110'],
  C: ['011', '100', '100', '100', '011'],
  D: ['110', '101', '101', '101', '110'],
  E: ['111', '100', '110', '100', '111'],
  F: ['111', '100', '110', '100', '100'],
  G: ['011', '100', '101', '101', '011'],
  H: ['101', '101', '111', '101', '101'],
  I: ['111', '010', '010', '010', '111'],
  K: ['101', '110', '100', '110', '101'],
  L: ['100', '100', '100', '100', '111'],
  M: ['101', '111', '101', '101', '101'],
  N: ['101', '111', '111', '101', '101'],
  O: ['010', '101', '101', '101', '010'],
  P: ['110', '101', '110', '100', '100'],
  R: ['110', '101', '110', '101', '101'],
  S: ['011', '100', '010', '001', '110'],
  T: ['111', '010', '010', '010', '010'],
  U: ['101', '101', '101', '101', '111'],
  W: ['101', '101', '101', '111', '101'],
  Y: ['101', '101', '010', '010', '010'],
};

function text(img, phrase, x, y, color) {
  let cx = x;
  for (const ch of phrase) {
    const glyph = FONT[ch];
    if (!glyph) {
      cx += 4;
      continue;
    }
    glyph.forEach((row, gy) => {
      [...row].forEach((bit, gx) => {
        if (bit === '1') img.set(cx + gx, y + gy, color);
      });
    });
    cx += 4;
  }
}

const scaleN = 2;
const cellW = PORTRAIT.w * scaleN;
const cellH = PORTRAIT.h * scaleN;
const cols = 5;
const ink = hex('#f4f0e6');
const rowH = 8 + cellH + 12;
const sheet = createImage(cols * cellW, ROWS.length * rowH + 4);
sheet.fill(hex('#1c1418'));

ROWS.forEach((row, index) => {
  const [name, race, classes] = row;
  const y = 4 + index * rowH;
  text(sheet, name.toUpperCase(), 2, y, ink);
  classes.forEach((cls, col) => {
    const img = scale(figure(race, col === 0 ? 'female' : 'male', KIT[cls]), scaleN);
    const x = col * cellW;
    blit(sheet, img, x, y + 8);
    text(sheet, cls.slice(0, 4).toUpperCase(), x + 2, y + 8 + cellH + 1, ink);
  });
});

const outDir = '/opt/cursor/artifacts/phase2';
mkdirSync(outDir, { recursive: true });
const out = join(outDir, 'race-lineup.png');
await writePng(out, sheet);
console.log(out);
