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
    kind: 'human',
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
    kind: 'elf',
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
    kind: 'wood',
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
    kind: 'dwarf',
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
    kind: 'ogre',
  },
};

function paintWall(pal, front) {
  const img = tile();
  const wall = hex(pal.wall);
  const dk = hex(pal.wallDk);
  const hi = hex(pal.wallHi);
  const timber = hex(pal.timber);
  const kind = pal.kind;
  if (kind === 'elf') {
    fill(img, wall);
    for (let y = 0; y < 16; y++) {
      img.set(0, y, hex('#c5d0dc'));
      img.set(15, y, dk);
      if (y % 8 === 0) for (let x = 0; x < 16; x++) img.set(x, y, hex('#d5dee8'));
    }
  } else if (kind === 'wood') {
    fill(img, hex('#4a3018'));
    for (let y = 0; y < 16; y++) {
      img.set(3, y, hex('#6b4030'));
      img.set(8, y, hex('#2a1c12'));
      img.set(12, y, hex('#5c3824'));
      if (y % 5 === 0) img.set(6, y, hex('#1c140c'));
    }
  } else if (kind === 'dwarf') {
    fill(img, hex('#3a342e'));
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        if (y % 8 === 0 || (x + (y < 8 ? 0 : 6)) % 10 === 0) img.set(x, y, hex('#1c1814'));
        else if ((x + y) % 9 === 0) img.set(x, y, hex('#6a6058'));
      }
    }
    img.set(4, 4, hex('#e6c15a'));
    img.set(11, 10, hex('#e6c15a'));
  } else if (kind === 'ogre') {
    fill(img, hex('#5a564c'));
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const blob = (x - 4) * (x - 4) + (y - 5) * (y - 5) < 18 || (x - 11) * (x - 11) + (y - 11) * (y - 11) < 16;
        img.set(x, y, blob ? hex('#7a7568') : hex('#3a3832'));
      }
    }
  } else {
    fill(img, wall);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        if (y < 8 ? y % 8 === 0 || x % 8 === 0 : y === 8 || (x + 4) % 8 === 0) img.set(x, y, dk);
        else if ((x + y) % 6 === 0) img.set(x, y, hi);
      }
    }
    for (let i = 0; i < 16; i++) img.set(i, i < 8 ? 2 + i : 2, timber);
    img.set(2, 4, timber);
    img.set(13, 4, timber);
  }
  if (front) {
    for (let y = 13; y < 16; y++) for (let x = 0; x < 16; x++) img.set(x, y, y === 13 ? hi : dk);
  }
  return img;
}

function paintRoof(pal, part) {
  const img = tile();
  const roof = hex(pal.roof);
  const hi = hex(pal.roofHi);
  const dk = hex(pal.roofDk);
  const kind = pal.kind;
  if (kind === 'elf') {
    fill(img, roof);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        if ((x + y * 2) % 5 === 0) img.set(x, y, hi);
        if (y % 4 === 0) img.set(x, y, dk);
      }
    }
  } else if (kind === 'wood') {
    fill(img, hex('#1c3a22'));
    for (let i = 0; i < 7; i++) {
      const cx = (i * 5) % 14;
      const cy = (i * 3) % 12;
      for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
        if ((x - 2) * (x - 2) + (y - 2) * (y - 2) < 6 && img.w) {
          const px = Math.min(15, cx + x);
          const py = Math.min(15, cy + y);
          img.set(px, py, (x + y) % 2 ? hex('#3e8a40') : hex('#7aaa58'));
        }
      }
    }
  } else if (kind === 'dwarf') {
    fill(img, hex('#4a4038'));
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (y % 5 === 0 || x % 7 === 0) img.set(x, y, hex('#2a2420'));
  } else if (kind === 'ogre') {
    fill(img, hex('#6a4030'));
    for (let x = 0; x < 16; x++) {
      img.set(x, 4, hex('#2a1810'));
      img.set(x, 5, hex('#c4a070'));
      img.set(x, 11, hex('#3a2418'));
    }
    img.set(3, 8, hex('#e6dcc4'));
    img.set(12, 7, hex('#e6dcc4'));
  } else {
    fill(img, roof);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        if (y % 4 === 0 || (x + Math.floor(y / 4) * 4) % 8 === 0) img.set(x, y, dk);
        else if (y % 4 === 1) img.set(x, y, hi);
      }
    }
  }
  if (part === 'n') for (let x = 0; x < 16; x++) img.set(x, 0, hex(pal.trim));
  if (part === 'eave') for (let x = 0; x < 16; x++) {
    img.set(x, 12, hi);
    img.set(x, 13, dk);
    img.set(x, 14, dk);
    img.set(x, 15, hex('#1c1418'));
  }
  return img;
}

function paintWindow(pal) {
  const img = paintWall(pal, false);
  const frame = hex(pal.timber);
  const glass = hex(pal.glass);
  const glow = hex(pal.glassHi);
  const kind = pal.kind;
  if (kind === 'elf') {
    for (let y = 1; y < 15; y++) for (let x = 6; x < 10; x++) img.set(x, y, x === 6 || x === 9 || y === 1 ? frame : glow);
  } else if (kind === 'dwarf') {
    for (let y = 5; y < 11; y++) for (let x = 4; x < 12; x++) img.set(x, y, y < 8 ? hex('#ffc080') : hex('#e07030'));
  } else if (kind === 'wood') {
    for (let y = 5; y < 12; y++) for (let x = 5; x < 11; x++) {
      const d = (x - 8) * (x - 8) + (y - 8) * (y - 8);
      if (d < 10) img.set(x, y, hex('#102010'));
    }
  } else if (kind === 'ogre') {
    for (let y = 6; y < 12; y++) for (let x = 5; x < 12; x++) if ((x + y) % 3) img.set(x, y, hex('#1a120c'));
  } else {
    for (let y = 4; y < 12; y++) for (let x = 4; x < 12; x++) {
      const edge = x === 4 || x === 11 || y === 4 || y === 11 || x === 7;
      img.set(x, y, edge ? frame : y < 8 ? glow : glass);
    }
  }
  return img;
}

function doorOrigin(part) {
  const left = part[1] === 'l';
  const band = part[0];
  return { ox: left ? 0 : 16, oy: band === 't' ? 0 : band === 'm' ? 16 : 32, left, top: band === 't', bot: band === 'b' };
}

function paintDoor(pal, part) {
  const img = tile();
  const { ox, oy, left, top, bot } = doorOrigin(part);
  const kind = pal.kind;
  const hole = hex(pal.door);
  const frame = hex(pal.trim);
  const wall = hex(pal.wall);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const wx = ox + x + 0.5;
      const wy = oy + y + 0.5;
      if (kind === 'wood') {
        const d = Math.hypot(wx - 16, wy - 26);
        img.set(x, y, d < 10 ? hole : d < 13 ? hex('#c4a060') : hex('#3a2818'));
      } else if (kind === 'elf') {
        const arch = wy < 18 ? Math.abs(wx - 16) < (wy - 4) * 0.7 : Math.abs(wx - 16) < 10;
        const rim = wy < 18 ? Math.abs(wx - 16) < (wy - 4) * 0.7 + 2 : Math.abs(wx - 16) < 12;
        img.set(x, y, arch ? hole : rim ? frame : wall);
      } else if (kind === 'dwarf') {
        const inside = wx > 6 && wx < 26 && wy > 8 && wy < 44;
        const rune = top && y === 6 && x % 4 === 1;
        img.set(x, y, rune ? hex('#e6c15a') : inside ? hole : hex('#2a2420'));
        if (!inside && (x < 3 || x > 12 || (top && y < 4))) img.set(x, y, frame);
      } else if (kind === 'ogre') {
        const flap = Math.hypot(wx - 16, wy - 28) < 12 + (x % 3);
        img.set(x, y, flap ? hole : (x + y) % 5 === 0 ? hex('#e6dcc4') : hex('#6a4030'));
      } else {
        const post = left ? x <= 3 : x >= 12;
        const beam = top && y <= 4;
        img.set(x, y, post || beam ? hex('#5c3a28') : hole);
        if (!post && !beam && x % 4 === 0) img.set(x, y, hex('#3a2418'));
      }
    }
  }
  if (bot && kind !== 'ogre' && kind !== 'wood') {
    for (let x = 2; x < 14; x++) {
      img.set(x, 14, hex(pal.wall));
      img.set(x, 15, hex(pal.wallDk));
    }
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
  out.set(T.SEAL_L, paintSealed(true, false));
  out.set(T.SEAL_R, paintSealed(false, false));
  out.set(T.SEAL_TL, paintSealed(true, true));
  out.set(T.SEAL_TR, paintSealed(false, true));
  out.set(T.LANTERN, paintLantern());
  out.set(T.BANNER, paintBanner());
  out.set(T.PROW, paintProw());
  out.set(T.BONE, paintBone());
  out.set(T.SKULL, paintSkull());
  out.set(T.MOSS, paintMoss());
  out.set(T.WHITE, paintWhite());
  out.set(T.COBBLE, paintCobble());
  out.set(T.HIDE, paintHide());
  out.set(T.LEAF, paintLeaf());
  return out;
}

function paintBanner() {
  const img = tile();
  fill(img, hex('#8a7d72'));
  for (let y = 2; y < 14; y++) for (let x = 4; x < 12; x++) img.set(x, y, y % 3 === 0 ? hex('#6a2030') : hex('#a84848'));
  for (let x = 3; x < 13; x++) img.set(x, 2, hex('#e6c15a'));
  return img;
}

function paintProw() {
  const img = tile();
  fill(img, hex('#e8eef4'));
  for (let y = 4; y < 13; y++) for (let x = 2; x < 14; x++) {
    if (x > y && x < 16 - (y - 4)) img.set(x, y, hex('#6b4030'));
  }
  img.set(4, 6, hex('#e6c15a'));
  img.set(3, 7, hex('#1c1418'));
  img.set(6, 10, hex('#8a3030'));
  return img;
}

function paintBone() {
  const img = tile();
  fill(img, hex('#6a6458'));
  for (let y = 0; y < 16; y++) {
    img.set(7, y, hex('#e6dcc4'));
    img.set(8, y, hex('#c4b8a0'));
  }
  img.set(5, 2, hex('#f4f0e6'));
  img.set(10, 2, hex('#f4f0e6'));
  img.set(5, 13, hex('#f4f0e6'));
  img.set(10, 13, hex('#f4f0e6'));
  return img;
}

function paintSkull() {
  const img = tile();
  fill(img, hex('#5a4030'));
  for (let y = 2; y < 12; y++) for (let x = 4; x < 12; x++) {
    const d = (x - 8) * (x - 8) + (y - 6) * (y - 6);
    if (d < 16) img.set(x, y, hex('#e6dcc4'));
  }
  img.set(6, 6, hex('#1c1418'));
  img.set(9, 6, hex('#1c1418'));
  img.set(7, 10, hex('#1c1418'));
  img.set(8, 10, hex('#1c1418'));
  return img;
}

function paintMoss() {
  const img = tile();
  fill(img, hex('#3e6b40'));
  for (let i = 0; i < 12; i++) img.set((i * 3) % 16, (i * 5) % 16, i % 2 ? hex('#6e8f5a') : hex('#1c3a22'));
  img.set(8, 8, hex('#c9d48a'));
  return img;
}

function paintWhite() {
  const img = tile();
  fill(img, hex('#f4f1ea'));
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (y % 8 === 0 || (x + (y < 8 ? 0 : 4)) % 8 === 0) img.set(x, y, hex('#c5d0dc'));
  return img;
}

function paintCobble() {
  const img = tile();
  fill(img, hex('#8a8078'));
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    if (y % 5 === 0 || (x + Math.floor(y / 5) * 3) % 6 === 0) img.set(x, y, hex('#4e4640'));
    else if ((x * 3 + y) % 7 === 0) img.set(x, y, hex('#d2c3b2'));
  }
  return img;
}

function paintHide() {
  const img = tile();
  fill(img, hex('#6a4030'));
  for (let x = 0; x < 16; x++) {
    img.set(x, 3, hex('#2a1810'));
    img.set(x, 8, hex('#c4a070'));
    img.set(x, 9, hex('#3a2418'));
  }
  img.set(4, 12, hex('#e6dcc4'));
  img.set(11, 6, hex('#e6dcc4'));
  return img;
}

function paintLeaf() {
  const img = tile();
  fill(img, hex('#14301c'));
  for (let i = 0; i < 6; i++) {
    const cx = (i * 4 + 2) % 13;
    const cy = (i * 5 + 1) % 12;
    for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
      if ((x - 2) * (x - 2) + (y - 2) * (y - 2) < 5) img.set(Math.min(15, cx + x), Math.min(15, cy + y), (x + y) % 2 ? hex('#2e6a32') : hex('#7aaa58'));
    }
  }
  return img;
}

function paintLantern() {
  const img = tile();
  fill(img, hex('#4e463f'));
  for (let y = 0; y < 16; y++) {
    img.set(7, y, hex('#2a2018'));
    img.set(8, y, hex('#6b4030'));
  }
  for (let y = 3; y <= 10; y++) {
    for (let x = 4; x <= 11; x++) {
      const edge = x === 4 || x === 11 || y === 3 || y === 10;
      img.set(x, y, edge ? hex('#e6c15a') : y < 7 ? hex('#ffe7ad') : hex('#e07030'));
    }
  }
  return img;
}

function paintSealed(left, lintel) {
  const img = tile();
  fill(img, hex('#3a2418'));
  const frame = hex('#e6c15a');
  const plank = hex('#6b4030');
  const bar = hex('#8b97a3');
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const outer = (left && x <= 2) || (!left && x >= 13) || (lintel && y <= 2);
      const arch = lintel && y < 8 && (left ? x < 4 + y : x > 11 - y);
      if (outer || arch) img.set(x, y, y % 2 === 0 ? frame : hex('#5c4030'));
      else img.set(x, y, x % 4 === 0 ? hex('#4a301f') : plank);
    }
  }
  if (!lintel) {
    for (let x = left ? 3 : 2; x < (left ? 14 : 13); x++) img.set(x, 8, bar);
  }
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
