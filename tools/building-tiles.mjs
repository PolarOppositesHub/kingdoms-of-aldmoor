/**
 * Race architecture tiles. Original pixel work, painted for a 16px tile at phone zoom.
 * Each style is wall, front, window, roof, eave, roof-north, and a 2×3 door.
 */
import { createImage, hex } from './pixel.mjs';
import { T } from './frostmere-map.mjs';

function tile() {
  return createImage(16, 16);
}

function fill(img, c) {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) img.set(x, y, c);
}

const STYLES = {
  human: {
    wall: '#8a7d72',
    wallDk: '#4e463f',
    wallHi: '#d2c3b2',
    timber: '#5c3a28',
    roof: '#5c6a78',
    roofHi: '#9aa8b4',
    roofDk: '#2e3844',
    glass: '#f0c56a',
    glassHi: '#ffe7ad',
    trim: '#e6c15a',
    door: '#100c0a',
    doorPlank: '#3a2418',
  },
  elf: {
    wall: '#f4f1ea',
    wallDk: '#b7c0c8',
    wallHi: '#ffffff',
    timber: '#d5dee8',
    roof: '#2a5080',
    roofHi: '#6aa0d0',
    roofDk: '#14283f',
    glass: '#d5e6f4',
    glassHi: '#f7fbff',
    trim: '#e8eef6',
    door: '#101820',
    doorPlank: '#8aa0b4',
  },
  wood: {
    wall: '#6a4a30',
    wallDk: '#2e2016',
    wallHi: '#a07850',
    timber: '#3e6b40',
    roof: '#245c32',
    roofHi: '#7aaa58',
    roofDk: '#14301c',
    glass: '#c4e090',
    glassHi: '#f4f0c8',
    trim: '#c4a060',
    door: '#0e140c',
    doorPlank: '#4a3018',
  },
  dwarf: {
    wall: '#5a5048',
    wallDk: '#2a2420',
    wallHi: '#8a8078',
    timber: '#e6c15a',
    roof: '#3a342e',
    roofHi: '#6a6058',
    roofDk: '#1c1814',
    glass: '#e07030',
    glassHi: '#ffc080',
    trim: '#e6c15a',
    door: '#0a0808',
    doorPlank: '#4a2818',
  },
  ogre: {
    wall: '#6a6458',
    wallDk: '#2e2a24',
    wallHi: '#a09888',
    timber: '#e6dcc4',
    roof: '#6a4030',
    roofHi: '#a07050',
    roofDk: '#2a1810',
    glass: '#c4a060',
    glassHi: '#f0e0b0',
    trim: '#d8d0c0',
    door: '#120e0c',
    doorPlank: '#4a3828',
  },
};

function paintWall(pal, front) {
  const img = tile();
  const wall = hex(pal.wall);
  const dk = hex(pal.wallDk);
  const hi = hex(pal.wallHi);
  const timber = hex(pal.timber);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const mortar = y % 5 === 0 || (x + Math.floor(y / 5) * 4) % 8 === 0;
      img.set(x, y, mortar ? dk : (x + y) % 7 === 0 ? hi : wall);
      if (x === 0 || x === 15 || y === 0) img.set(x, y, dk);
    }
  }
  for (let y = 2; y < 14; y++) {
    img.set(2, y, timber);
    img.set(13, y, timber);
  }
  for (let x = 2; x < 14; x++) {
    img.set(x, 3, timber);
    img.set(x, 12, timber);
  }
  if (front) {
    for (let y = 13; y < 16; y++) for (let x = 0; x < 16; x++) img.set(x, y, y === 13 ? hi : dk);
  }
  return img;
}

function paintRoof(pal, kind) {
  const img = tile();
  const roof = hex(pal.roof);
  const hi = hex(pal.roofHi);
  const dk = hex(pal.roofDk);
  for (let y = 0; y < 16; y++) {
    const course = Math.floor(y / 4);
    for (let x = 0; x < 16; x++) {
      const shift = course % 2 ? 4 : 0;
      const seam = (x + shift) % 8 === 0 || y % 4 === 0;
      img.set(x, y, seam ? dk : y % 4 === 1 ? hi : roof);
    }
  }
  if (kind === 'n') for (let x = 0; x < 16; x++) img.set(x, 0, hex(pal.trim));
  if (kind === 'eave') {
    for (let y = 11; y < 16; y++) {
      for (let x = 0; x < 16; x++) img.set(x, y, y === 11 ? hi : dk);
    }
  }
  return img;
}

function paintWindow(pal) {
  const img = paintWall(pal, false);
  const frame = hex(pal.timber);
  const glass = hex(pal.glass);
  const glow = hex(pal.glassHi);
  for (let y = 3; y < 13; y++) {
    for (let x = 3; x < 13; x++) {
      const mullion = x === 7 || x === 8 || y === 7 || y === 8;
      const edge = x === 3 || x === 12 || y === 3 || y === 12;
      img.set(x, y, edge || mullion ? frame : y < 7 ? glow : glass);
    }
  }
  return img;
}

function paintDoor(pal, part) {
  const img = tile();
  const top = part[0] === 't';
  const mid = part[0] === 'm';
  const bot = part[0] === 'b';
  const left = part[1] === 'l';
  fill(img, hex(pal.wallDk));
  const frame = hex(pal.trim);
  const hole = hex(pal.door);
  const plank = hex(pal.doorPlank);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const outer = (left && x <= 2) || (!left && x >= 13) || (top && y <= 3);
      if (outer) {
        img.set(x, y, y % 2 === 0 ? frame : hex(pal.wall));
        continue;
      }
      img.set(x, y, hole);
      if ((left ? x : 15 - x) % 5 === 3) img.set(x, y, plank);
    }
  }
  if (top) {
    for (let x = left ? 3 : 0; x < (left ? 16 : 13); x++) img.set(x, 10, frame);
  }
  if (bot) {
    for (let x = left ? 3 : 2; x < (left ? 14 : 13); x++) {
      img.set(x, 13, hex(pal.roofHi));
      img.set(x, 14, hex(pal.wall));
      img.set(x, 15, hex(pal.wallDk));
    }
  }
  if (!left && (mid || bot)) {
    img.set(4, 8, frame);
    img.set(5, 8, hex(pal.glassHi));
  }
  return img;
}

function paintGate() {
  const img = tile();
  fill(img, hex('#3a342e'));
  for (let y = 0; y < 16; y++) {
    for (let x = 3; x <= 12; x++) img.set(x, y, x === 3 || x === 12 ? hex('#e6c15a') : hex('#5c4030'));
    img.set(6, y, hex('#2a2018'));
    img.set(9, y, hex('#2a2018'));
  }
  for (let x = 3; x <= 12; x++) {
    img.set(x, 1, hex('#e6c15a'));
    img.set(x, 14, hex('#1c1418'));
  }
  return img;
}

function paintStep() {
  const img = tile();
  fill(img, hex('#8a8078'));
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if (y % 5 === 0) img.set(x, y, hex('#4e4640'));
      else if ((x + y) % 6 === 0) img.set(x, y, hex('#d2c3b2'));
    }
  }
  for (let x = 0; x < 16; x++) img.set(x, 15, hex('#3a342e'));
  return img;
}

function paintSpire() {
  const img = tile();
  fill(img, hex('#14283f'));
  for (let y = 0; y < 16; y++) {
    const half = Math.max(0, 7 - Math.floor((15 - y) / 2));
    for (let x = half; x < 16 - half; x++) img.set(x, y, y < 4 ? hex('#f7fbff') : hex('#3a6ea5'));
  }
  img.set(8, 1, hex('#e6c15a'));
  return img;
}

function paintRope() {
  const img = tile();
  fill(img, hex('#6a4a30'));
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if (y % 4 === 0) img.set(x, y, hex('#3a2818'));
      else if (x % 5 === 0) img.set(x, y, hex('#c4a060'));
    }
  }
  for (let i = 0; i < 16; i++) img.set(i, 2, hex('#e6d2a4'));
  return img;
}

function paintTrunk() {
  const img = tile();
  fill(img, hex('#3a2818'));
  for (let y = 0; y < 16; y++) {
    img.set(2, y, hex('#6b4030'));
    img.set(13, y, hex('#2a1c12'));
    if (y % 4 === 0) for (let x = 3; x < 13; x++) img.set(x, y, hex('#5c3824'));
  }
  for (let y = 4; y < 12; y++) for (let x = 5; x < 11; x++) img.set(x, y, hex('#102010'));
  return img;
}

function paintRune() {
  const img = paintWall(STYLES.dwarf, false);
  const gold = hex('#e6c15a');
  for (const [x, y] of [[4, 4], [8, 4], [11, 4], [6, 8], [10, 8], [4, 12], [8, 12], [11, 12]]) img.set(x, y, gold);
  for (let x = 5; x <= 10; x++) img.set(x, 8, gold);
  return img;
}

const ORDER = ['WALL', 'FRONT', 'WIN', 'ROOF', 'EAVE', 'ROOFN', 'DTL', 'DTR', 'DML', 'DMR', 'DBL', 'DBR'];

export function paintArchitectureTiles() {
  const out = new Map();
  for (const [name, pal] of Object.entries(STYLES)) {
    const key = name === 'wood' ? 'WOOD' : name.toUpperCase();
    const prefix = name === 'elf' ? 'ELF' : key;
    const made = {
      WALL: paintWall(pal, false),
      FRONT: paintWall(pal, true),
      WIN: paintWindow(pal),
      ROOF: paintRoof(pal, 'mid'),
      EAVE: paintRoof(pal, 'eave'),
      ROOFN: paintRoof(pal, 'n'),
      DTL: paintDoor(pal, 'tl'),
      DTR: paintDoor(pal, 'tr'),
      DML: paintDoor(pal, 'ml'),
      DMR: paintDoor(pal, 'mr'),
      DBL: paintDoor(pal, 'bl'),
      DBR: paintDoor(pal, 'br'),
    };
    for (const part of ORDER) out.set(T[`${prefix}_${part}`], made[part]);
  }
  out.set(T.GATE, paintGate());
  out.set(T.STEP, paintStep());
  out.set(T.SPIRE, paintSpire());
  out.set(T.ROPE, paintRope());
  out.set(T.TRUNK, paintTrunk());
  out.set(T.RUNE, paintRune());
  out.set(T.SEAL_L, paintSealed(true));
  out.set(T.SEAL_R, paintSealed(false));
  return out;
}

function paintSealed(left) {
  const img = tile();
  fill(img, hex('#3a2418'));
  const frame = hex('#e6c15a');
  const plank = hex('#6b4030');
  const bar = hex('#8b97a3');
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const outer = (left && x <= 2) || (!left && x >= 13) || y <= 1 || y >= 14;
      if (outer) img.set(x, y, y % 2 === 0 ? frame : hex('#5c4030'));
      else img.set(x, y, x % 4 === 0 ? hex('#4a301f') : plank);
    }
  }
  for (let x = left ? 3 : 2; x < (left ? 14 : 13); x++) img.set(x, 8, bar);
  return img;
}

export const DOOR_STEP_TILES = [
  T.DOOR_BL, T.DOOR_BR, T.SDOOR_BL, T.SDOOR_BR,
  T.HUMAN_DBL, T.HUMAN_DBR,
  T.ELF_DBL, T.ELF_DBR,
  T.WOOD_DBL, T.WOOD_DBR,
  T.DWARF_DBL, T.DWARF_DBR,
  T.OGRE_DBL, T.OGRE_DBR,
];
