/**
 * Original pixel art for Kingdoms of Aldmoor.
 * Run: node tools/build-art.mjs
 *
 * Tiles, actors, props, the Hoffender map, and the app icons are drawn here.
 * Nothing in this file is traced from another game.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import {
  blit,
  createImage,
  fromRows,
  hex,
  mulberry,
  scale,
  silhouette,
  writePng,
} from './pixel.mjs';
import { buildHeroArt } from './hero-art.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assetDir = join(root, 'src', 'assets');
const publicDir = join(root, 'public');

const INK = hex('#1c1418');
const SNOW = hex('#e6eef4');
const SNOW_HI = hex('#f8fbfe');
const SNOW_SH = hex('#c3d2de');
const SNOW_DEEP = hex('#9aafc0');
const PATH = hex('#8a5a3c');
const PATH_HI = hex('#c48a58');
const PATH_SH = hex('#5c3a28');
const WATER = hex('#1a4d66');
const WATER_HI = hex('#3c86a2');
const WATER_DEEP = hex('#102f3e');
const ICE = hex('#d5e6f0');
const ICE_LINE = hex('#7ea8bc');
const WOOD = hex('#8d5a38');
const WOOD_HI = hex('#d09a62');
const WOOD_SH = hex('#5c3a26');
const WOOD_DARK = hex('#3a2418');
const ROOF = hex('#f4f8fb');
const ROOF_SH = hex('#d0dce6');
const ROOF_DEEP = hex('#aebfd0');
const RED = hex('#9a3034');
const RED_HI = hex('#d2554c');
const RED_DARK = hex('#5e1c22');
const WINDOW = hex('#f0c56a');
const WINDOW_HI = hex('#ffe7ad');
const IRON = hex('#d7dee6');
const IRON_SH = hex('#8b97a3');
const IRON_DARK = hex('#556068');
const PINE = hex('#2c4a30');
const PINE_MID = hex('#3e6b40');
const PINE_HI = hex('#7aa85a');
const PINE_DEEP = hex('#1e3324');
const FUR = hex('#7a4e32');
const FUR_HI = hex('#c49464');
const FUR_DARK = hex('#4a301f');
const SKIN = hex('#e2b48c');
const SKIN_HI = hex('#f6d2b0');
const SKIN_SH = hex('#c48a64');
const HAIR = hex('#3a241c');
const HAIR_HI = hex('#6b4030');
const BOOT = hex('#241c1e');
const EYEW = hex('#f4f7fb');
const AMBER = hex('#e2a03a');
const WOLF = hex('#8a8178');
const WOLF_HI = hex('#c8c0b6');
const WOLF_SH = hex('#5a534c');
const BELLY = hex('#e7e0d6');
const CLOTH = hex('#3d5e78');
const CLOTH_HI = hex('#6e96b4');
const CLOTH_SH = hex('#2a4254');

const PAL = {
  '.': null,
  K: INK,
  a: HAIR,
  A: HAIR_HI,
  h: SKIN,
  H: SKIN_HI,
  s: SKIN_SH,
  W: EYEW,
  E: AMBER,
  F: FUR,
  f: FUR_HI,
  d: FUR_DARK,
  R: RED,
  r: RED_HI,
  Q: IRON,
  q: IRON_SH,
  Y: hex('#e6c15a'),
  o: WOOD,
  L: WOOD_HI,
  B: BOOT,
  b: hex('#3c3236'),
  n: hex('#a86e4c'),
  C: CLOTH,
  c: CLOTH_HI,
  v: CLOTH_SH,
  G: hex('#6e8f5a'),
  g: hex('#8eae72'),
  P: hex('#d8d2c8'),
  p: hex('#a09890'),
  u: hex('#efe8dc'),
  w: hex('#efe8dc'),
  m: hex('#c45a58'),
};

const TILE = 16;
const COLS = 8;
const MAP_W = 72;
const MAP_H = 90;

const T = {
  SNOW: 1,
  SNOW_B: 2,
  SNOW_C: 3,
  PATH: 4,
  PATH_B: 5,
  ICE: 6,
  WATER: 7,
  WATER_B: 8,
  DOCK: 9,
  WALL: 10,
  WALL_FRONT: 11,
  WINDOW: 12,
  DOOR: 13,
  ROOF: 14,
  ROOF_B: 15,
  ROOF_N: 16,
  ROOF_W: 17,
  ROOF_E: 18,
  ROOF_NW: 19,
  ROOF_NE: 20,
  ROOF_EAVES: 21,
  ROOF_SHOP: 22,
  PALISADE: 23,
  POST: 24,
  CHIMNEY: 25,
  AWNING: 26,
  DOOR_SHOP: 27,
  STONE: 28,
  STONE_FRONT: 29,
  STONE_DOOR: 30,
  STONE_WIN: 31,
  FENCE: 32,
  DOOR_TL: 33,
  DOOR_TR: 34,
  DOOR_ML: 35,
  DOOR_MR: 36,
  DOOR_BL: 37,
  DOOR_BR: 38,
  SDOOR_TL: 39,
  SDOOR_TR: 40,
  SDOOR_ML: 41,
  SDOOR_MR: 42,
  SDOOR_BL: 43,
  SDOOR_BR: 44,
};

function tileCanvas() {
  return createImage(TILE, TILE);
}

function paintSnow(seed) {
  const img = tileCanvas();
  const rand = mulberry(seed);
  img.fill(SNOW);
  for (let i = 0; i < 10; i++) {
    const x = Math.floor(rand() * 16);
    const y = Math.floor(rand() * 16);
    img.set(x, y, rand() > 0.5 ? SNOW_HI : SNOW_SH);
  }
  if (seed % 3 === 0) {
    img.set(4, 11, SNOW_DEEP);
    img.set(5, 11, SNOW_DEEP);
    img.set(12, 5, SNOW_HI);
  }
  return img;
}

function paintPath(variant) {
  const img = tileCanvas();
  img.fill(PATH);
  const rand = mulberry(100 + variant);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const n = rand();
      if (n > 0.86) img.set(x, y, PATH_HI);
      else if (n > 0.72) img.set(x, y, PATH_SH);
    }
  }
  // Ruts
  for (let x = 0; x < 16; x++) {
    if ((x + variant) % 4 !== 0) img.set(x, 5, PATH_SH);
    if ((x + variant) % 5 !== 0) img.set(x, 11, PATH_SH);
  }
  if (variant === 1) {
    img.set(2, 2, SNOW);
    img.set(3, 2, SNOW_SH);
    img.set(13, 13, SNOW);
    img.set(14, 14, SNOW_HI);
  }
  return img;
}

function paintWater(frame) {
  const img = tileCanvas();
  img.fill(WATER_DEEP);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if ((y + frame) % 4 === 0) img.set(x, y, WATER);
    }
  }
  const shift = frame * 3;
  for (let x = 0; x < 16; x++) {
    const wave = (x + shift) % 8;
    if (wave < 4) {
      img.set(x, 4, WATER_HI);
      img.set(x, 11, WATER_HI);
    }
  }
  return img;
}

function paintIce() {
  const img = tileCanvas();
  img.fill(ICE);
  for (let i = 0; i < 16; i++) {
    img.set(i, Math.floor(i * 0.4) + 2, ICE_LINE);
    img.set(15 - i, 12 - Math.floor(i * 0.2), SNOW_HI);
  }
  img.set(4, 8, ICE_LINE);
  img.set(5, 9, ICE_LINE);
  img.set(6, 9, ICE_LINE);
  return img;
}

function paintDock() {
  const img = tileCanvas();
  img.fill(WOOD_SH);
  for (let y = 0; y < 16; y++) {
    const plank = Math.floor(y / 4);
    for (let x = 0; x < 16; x++) {
      img.set(x, y, plank % 2 === 0 ? WOOD : WOOD_HI);
      if (y % 4 === 0) img.set(x, y, WOOD_DARK);
    }
  }
  return img;
}

function paintLogs(front) {
  const img = tileCanvas();
  for (let y = 0; y < 16; y++) {
    const band = Math.floor(y / 4);
    const local = y % 4;
    for (let x = 0; x < 16; x++) {
      let c = WOOD;
      if (local === 0) c = WOOD_DARK;
      else if (local === 1) c = WOOD_HI;
      else if (local === 3) c = WOOD_SH;
      if (x % 8 === 0) c = WOOD_DARK;
      img.set(x, y, c);
    }
    if (band === 3 && front) {
      // stone foundation so the cabin sits on the snow
    }
  }
  if (front) {
    for (let y = 13; y < 16; y++) {
      for (let x = 0; x < 16; x++) img.set(x, y, y === 13 ? hex('#6e6258') : hex('#4e4640'));
    }
  }
  return img;
}

function paintStone(front) {
  const img = tileCanvas();
  const rand = mulberry(front ? 4 : 9);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      let c = hex('#7d746c');
      if ((x + y) % 7 === 0) c = hex('#5c564e');
      else if (rand() > 0.86) c = hex('#b7aa9e');
      if (y % 5 === 0) c = hex('#4e4640');
      img.set(x, y, c);
    }
  }
  // A carved chevron, an original hold-mark, not a copied crest.
  img.set(8, 6, SNOW_HI);
  img.set(7, 7, SNOW_HI);
  img.set(9, 7, SNOW_HI);
  img.set(6, 8, SNOW_HI);
  img.set(10, 8, SNOW_HI);
  if (front) {
    for (let y = 13; y < 16; y++) for (let x = 0; x < 16; x++) img.set(x, y, hex('#3a342e'));
  }
  return img;
}

function paintStoneDoor() {
  return paintDoorLeaf('bl', true);
}

function paintStoneWin() {
  return paintBigWindow(true);
}

function paintFence() {
  const img = tileCanvas();
  img.fill(SNOW);
  for (const y of [6, 7, 11, 12]) for (let x = 0; x < 16; x++) img.set(x, y, y % 2 ? WOOD_SH : WOOD);
  for (const x of [2, 3, 12, 13]) for (let y = 4; y <= 14; y++) img.set(x, y, WOOD_DARK);
  return img;
}

/** A wall tile that is mostly glass, so a 2×2 block reads as one large window. */
function paintBigWindow(stone) {
  const img = stone ? paintStone(false) : paintLogs(false);
  const frame = stone ? hex('#2e2824') : WOOD_DARK;
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const border = x <= 1 || x >= 14 || y <= 1 || y >= 14;
      const mullion = x === 7 || x === 8 || y === 7 || y === 8;
      if (border || mullion) img.set(x, y, frame);
      else img.set(x, y, y < 8 ? WINDOW_HI : WINDOW);
    }
  }
  return img;
}

/**
 * One leaf of a door that fills the whole tile. Stacked three high and two wide,
 * the opening is 32×48, about twice a 24px character.
 * part is tl/tr/ml/mr/bl/br.
 */
function paintDoorLeaf(part, stone) {
  const top = part[0] === 't';
  const bot = part[0] === 'b';
  const left = part[1] === 'l';
  const img = stone ? paintStone(false) : paintLogs(false);
  const frame = stone ? hex('#3a342e') : hex('#3a2418');
  const recess = hex('#1a1210');
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const outer = (left && x <= 2) || (!left && x >= 13) || (top && y <= 2) || (bot && y >= 14);
      const seam = left ? x >= 14 : x <= 1;
      if (outer) {
        img.set(x, y, frame);
        continue;
      }
      if (seam) {
        img.set(x, y, recess);
        continue;
      }
      const band = (left ? x : 15 - x) % 4;
      img.set(x, y, band === 0 ? hex('#4a301f') : band === 1 ? hex('#8d5a38') : hex('#6b4030'));
    }
  }
  if (!left && bot) {
    img.set(4, 8, IRON);
    img.set(5, 8, IRON_SH);
  }
  return img;
}

function paintWindow() {
  return paintBigWindow(false);
}

function paintDoor() {
  return paintDoorLeaf('bl', false);
}

function paintRoof(kind) {
  const img = tileCanvas();
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const shade = y < 3 ? SNOW_HI : y < 9 ? ROOF : ROOF_SH;
      img.set(x, y, kind === 'b' && (x * 3 + y) % 11 === 0 ? ROOF_DEEP : shade);
    }
  }
  const edge = (x0, x1, y0, y1) => {
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) img.set(x, y, WOOD_DARK);
    }
  };
  if (kind === 'n' || kind === 'nw' || kind === 'ne') edge(0, 15, 0, 1);
  if (kind === 'w' || kind === 'nw') edge(0, 1, 0, 15);
  if (kind === 'e' || kind === 'ne') edge(14, 15, 0, 15);
  if (kind === 'eaves' || kind === 'shop') {
    for (let y = 10; y < 16; y++) {
      for (let x = 0; x < 16; x++) img.set(x, y, y === 10 ? SNOW_HI : WOOD_DARK);
    }
    if (kind === 'shop') {
      for (let y = 11; y < 16; y++) {
        for (let x = 0; x < 16; x++) img.set(x, y, x % 4 < 2 ? RED : RED_HI);
      }
    }
  }
  return img;
}

function paintAwning(door) {
  const img = tileCanvas();
  for (let y = 0; y < 7; y++) {
    for (let x = 0; x < 16; x++) {
      img.set(x, y, y === 0 ? RED_DARK : x % 4 < 2 ? RED : RED_HI);
    }
  }
  for (let y = 7; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if (door && x >= 5 && x <= 10 && y >= 8) {
        img.set(x, y, x === 5 || x === 10 ? WOOD_DARK : hex('#2a1c16'));
      } else {
        img.set(x, y, y === 7 ? WOOD_HI : WOOD);
        if (x % 8 === 0) img.set(x, y, WOOD_DARK);
      }
    }
  }
  if (door) {
    img.set(9, 11, IRON);
  }
  return img;
}

function paintPalisade(post) {
  const img = tileCanvas();
  img.fill([0, 0, 0, 0]);
  const logs = post ? [1, 10] : [0, 5, 10];
  const width = post ? 6 : 4;
  for (const x0 of logs) {
    for (let x = x0; x < x0 + width && x < 16; x++) {
      const tip = post ? 0 : (x0 === 5 ? 0 : 2);
      for (let y = tip; y < 16; y++) {
        const local = x - x0;
        let c = WOOD;
        if (y < tip + 2) c = SNOW_HI;
        else if (local === 0) c = WOOD_DARK;
        else if (local === 1) c = WOOD_HI;
        else if (local === width - 1) c = WOOD_SH;
        img.set(x, y, c);
      }
    }
  }
  if (post) {
    for (let y = 6; y <= 8; y++) {
      for (let x = 2; x <= 8; x++) img.set(x, y, y === 7 ? RED_HI : RED);
    }
  }
  return img;
}

function paintChimney() {
  const img = paintRoof('mid');
  for (let y = 2; y <= 12; y++) {
    for (let x = 6; x <= 10; x++) {
      const edge = x === 6 || x === 10 || y === 2;
      img.set(x, y, edge ? hex('#4a403c') : y % 2 === 0 ? hex('#8a4038') : hex('#6e342e'));
    }
  }
  img.set(8, 1, hex('#c8ccd0'));
  img.set(9, 0, hex('#e6eaee'));
  return img;
}

function buildTileset() {
  const tiles = new Map();
  tiles.set(T.SNOW, paintSnow(1));
  tiles.set(T.SNOW_B, paintSnow(2));
  tiles.set(T.SNOW_C, paintSnow(5));
  tiles.set(T.PATH, paintPath(0));
  tiles.set(T.PATH_B, paintPath(1));
  tiles.set(T.ICE, paintIce());
  tiles.set(T.WATER, paintWater(0));
  tiles.set(T.WATER_B, paintWater(1));
  tiles.set(T.DOCK, paintDock());
  tiles.set(T.WALL, paintLogs(false));
  tiles.set(T.WALL_FRONT, paintLogs(true));
  tiles.set(T.WINDOW, paintWindow());
  tiles.set(T.DOOR, paintDoor());
  tiles.set(T.ROOF, paintRoof('mid'));
  tiles.set(T.ROOF_B, paintRoof('b'));
  tiles.set(T.ROOF_N, paintRoof('n'));
  tiles.set(T.ROOF_W, paintRoof('w'));
  tiles.set(T.ROOF_E, paintRoof('e'));
  tiles.set(T.ROOF_NW, paintRoof('nw'));
  tiles.set(T.ROOF_NE, paintRoof('ne'));
  tiles.set(T.ROOF_EAVES, paintRoof('eaves'));
  tiles.set(T.ROOF_SHOP, paintRoof('shop'));
  tiles.set(T.PALISADE, paintPalisade(false));
  tiles.set(T.POST, paintPalisade(true));
  tiles.set(T.CHIMNEY, paintChimney());
  tiles.set(T.AWNING, paintAwning(false));
  tiles.set(T.DOOR_SHOP, paintAwning(true));
  tiles.set(T.STONE, paintStone(false));
  tiles.set(T.STONE_FRONT, paintStone(true));
  tiles.set(T.STONE_DOOR, paintStoneDoor());
  tiles.set(T.STONE_WIN, paintStoneWin());
  tiles.set(T.FENCE, paintFence());
  const woodLeaves = { tl: T.DOOR_TL, tr: T.DOOR_TR, ml: T.DOOR_ML, mr: T.DOOR_MR, bl: T.DOOR_BL, br: T.DOOR_BR };
  const stoneLeaves = { tl: T.SDOOR_TL, tr: T.SDOOR_TR, ml: T.SDOOR_ML, mr: T.SDOOR_MR, bl: T.SDOOR_BL, br: T.SDOOR_BR };
  for (const [part, id] of Object.entries(woodLeaves)) tiles.set(id, paintDoorLeaf(part, false));
  for (const [part, id] of Object.entries(stoneLeaves)) tiles.set(id, paintDoorLeaf(part, true));

  const rows = Math.ceil(Math.max(...tiles.keys()) / COLS);
  const margin = 1;
  const spacing = 2;
  const imgW = margin * 2 + COLS * TILE + (COLS - 1) * spacing;
  const imgH = margin * 2 + rows * TILE + (rows - 1) * spacing;
  const sheet = createImage(imgW, imgH);
  for (const [id, tile] of tiles) {
    const index = id - 1;
    const col = index % COLS;
    const row = Math.floor(index / COLS);
    const ox = margin + col * (TILE + spacing);
    const oy = margin + row * (TILE + spacing);
    blit(sheet, tile, ox, oy);
    // Extrude 1px so camera rounding does not show seams.
    for (let y = 0; y < TILE; y++) {
      sheet.set(ox - 1, oy + y, tile.get(0, y));
      sheet.set(ox + TILE, oy + y, tile.get(TILE - 1, y));
    }
    for (let x = 0; x < TILE; x++) {
      sheet.set(ox + x, oy - 1, tile.get(x, 0));
      sheet.set(ox + x, oy + TILE, tile.get(x, TILE - 1));
    }
    sheet.set(ox - 1, oy - 1, tile.get(0, 0));
    sheet.set(ox + TILE, oy - 1, tile.get(TILE - 1, 0));
    sheet.set(ox - 1, oy + TILE, tile.get(0, TILE - 1));
    sheet.set(ox + TILE, oy + TILE, tile.get(TILE - 1, TILE - 1));
  }
  return { sheet, tiles, margin, spacing, columns: COLS, rows, imageWidth: imgW, imageHeight: imgH };
}

function sprite(lines) {
  return fromRows(lines, PAL, 16);
}

function mirror(img) {
  const out = createImage(img.w, img.h);
  blit(out, img, 0, 0, { flipX: true });
  return out;
}

function tintImage(img, map) {
  const tint = new Map(Object.entries(map).map(([k, v]) => [k, v]));
  const out = createImage(img.w, img.h);
  blit(out, img, 0, 0, { tint });
  return out;
}

const key = (c) => `${c[0]},${c[1]},${c[2]}`;

// 16×24 actors. Chunky shapes, 2px features, drawn for a 2× camera on a phone.
const WARRIOR_S = sprite([
  '................',
  '.....KKKKKK.....',
  '....KaaaaaaK....',
  '....KaaAAaaK....',
  '....KhHHHHHhK...',
  '....KhHWWHHhK...',
  '.....HhnnnHh....',
  '......HHHHK.....',
  '...KKFddddFKK...',
  '..KFfRRRRRRfFK..',
  '..KFRFFFFFFRFK..',
  '.KKFRFFKKFFRFKK.',
  '..KFFFFFFK.oYK..',
  '..KFFKKFFFK.oK..',
  '...KFFFFFK.YYK..',
  '....KFFKKFFK....',
  '....KFFFFFFK....',
  '.....KKKKKK.....',
  '....KBBKKBBK....',
  '...KBBK..KBBK...',
  '...KBK....KBK...',
  '....K......K....',
  '................',
  '................',
]);

const WARRIOR_S2 = sprite([
  '................',
  '.....KKKKKK.....',
  '....KaaaaaaK....',
  '....KaaAAaaK....',
  '....KhHHHHHhK...',
  '....KhHWWHHhK...',
  '.....HhnnnHh....',
  '......HHHHK.....',
  '...KKFddddFKK...',
  '..KFfRRRRRRfFK..',
  '..KFRFFFFFFRFK..',
  '.KKFRFFKKFFRFKK.',
  '..KFFFFFFK.oYK..',
  '..KFFKKFFFK.oK..',
  '...KFFFFFK.YYK..',
  '....KKFFKKKK....',
  '....KFFFFFFK....',
  '....KKKKKKKK....',
  '...KBBK..KBBK...',
  '..KBBK....KBBK..',
  '..KBK......KBK..',
  '...K........K...',
  '................',
  '................',
]);

const WARRIOR_E = sprite([
  '................',
  '......KKKKK.....',
  '.....KaaaaaK....',
  '.....KaaaaKK....',
  '.....KhHHHHhK...',
  '.....HhHWWHhK...',
  '.....HHnnnKK....',
  '......HHHK......',
  '....KKFdddK.....',
  '...KFfRRRdFK....',
  '..KKFRFFFdFK....',
  '..KoFRFFFKFK....',
  '..KYKFFFFKK.....',
  '..KKKKFKKK......',
  '....KFFFKK......',
  '....KFFFKK......',
  '....KKKKK.......',
  '....KBBBK.......',
  '...KBBBK........',
  '..KBBKK.........',
  '..KBKK..........',
  '...K............',
  '................',
  '................',
]);

const WARRIOR_E2 = sprite([
  '................',
  '......KKKKK.....',
  '.....KaaaaaK....',
  '.....KaaaaKK....',
  '.....KhHHHHhK...',
  '.....HhHWWHhK...',
  '.....HHnnnKK....',
  '......HHHK......',
  '....KKFdddK.....',
  '...KFfRRRdFK....',
  '..KKFRFFFdFK....',
  '..KoFRFFFKFK....',
  '..KYKFFFFKK.....',
  '..KKKKFKKK......',
  '....KKFFK.......',
  '....KFFFK.......',
  '....KKKKK.......',
  '.....KBBK.......',
  '....KBBBK.......',
  '...KBBKK........',
  '..KBKK..........',
  '..KK............',
  '................',
  '................',
]);

const WARRIOR_N = sprite([
  '................',
  '.....KKKKKK.....',
  '....KaaaaaaK....',
  '....KAAAAAAaK...',
  '....KaaaaaaK....',
  '....KaaaaaaK....',
  '.....KaaaaK.....',
  '......KKKK......',
  '...KKFddddFKK...',
  '..KFfddddddfFK..',
  '..KFddddddddFK..',
  '.KKFdddKKdddFKK.',
  '..KddddddK.oYK..',
  '..KddKKdddK.oK..',
  '...KdddddK.YYK..',
  '....KddKKddK....',
  '....KddddddK....',
  '.....KKKKKK.....',
  '....KBBKKBBK....',
  '...KBBK..KBBK...',
  '...KBK....KBK...',
  '....K......K....',
  '................',
  '................',
]);

const WARRIOR_N2 = sprite([
  '................',
  '.....KKKKKK.....',
  '....KaaaaaaK....',
  '....KAAAAAAaK...',
  '....KaaaaaaK....',
  '....KaaaaaaK....',
  '.....KaaaaK.....',
  '......KKKK......',
  '...KKFddddFKK...',
  '..KFfddddddfFK..',
  '..KFddddddddFK..',
  '.KKFdddKKdddFKK.',
  '..KddddddK.oYK..',
  '..KddKKdddK.oK..',
  '...KdddddK.YYK..',
  '....KKdKKdKK....',
  '....KddddddK....',
  '....KKKKKKKK....',
  '...KBBK..KBBK...',
  '..KBBK....KBBK..',
  '..KBK......KBK..',
  '...K........K...',
  '................',
  '................',
]);

const VILLAGER_S = sprite([
  '................',
  '......KKKK......',
  '.....KaaaaK.....',
  '.....KaAAaK.....',
  '.....KhHHHhK....',
  '.....HhWWHh.....',
  '.....HHnnHH.....',
  '......KKKK......',
  '....KKCCCCKK....',
  '...KcCCCCCCcK...',
  '...KCCCCCCCCK...',
  '..KKCCCKKCCCKK..',
  '..KCCCCCCCCCCK..',
  '..KCCCKKKCCCK...',
  '...KKKKKKKKK....',
  '....KCCKKCCK....',
  '....KCCCCCCK....',
  '.....KKKKKK.....',
  '....KBBKKBBK....',
  '...KBBK..KBBK...',
  '...KBK....KBK...',
  '....K......K....',
  '................',
  '................',
]);

const VILLAGER_S2 = sprite([
  '................',
  '......KKKK......',
  '.....KaaaaK.....',
  '.....KaAAaK.....',
  '.....KhHHHhK....',
  '.....HhWWHh.....',
  '.....HHnnHH.....',
  '......KKKK......',
  '....KKCCCCKK....',
  '...KcCCCCCCcK...',
  '...KCCCCCCCCK...',
  '..KKCCCKKCCCKK..',
  '..KCCCCCCCCCCK..',
  '..KCCCKKKCCCK...',
  '...KKKKKKKKK....',
  '....KKCCKKKK....',
  '....KCCCCCCK....',
  '....KKKKKKKK....',
  '...KBBK..KBBK...',
  '..KBBK....KBBK..',
  '..KBK......KBK..',
  '...K........K...',
  '................',
  '................',
]);

const VILLAGER_E = sprite([
  '................',
  '......KKKK......',
  '.....KaaaaK.....',
  '.....KaaaKK.....',
  '.....KhHHHhK....',
  '.....HhWWHHK....',
  '.....HHnnKK.....',
  '......HHK.......',
  '....KKCCcK......',
  '...KcCCCCcK.....',
  '..KKCCCCCCK.....',
  '..KCCCCCKK......',
  '..KCCCCKK.......',
  '...KKKKK........',
  '....KCCK........',
  '....KCCK........',
  '....KKKK........',
  '....KBBK........',
  '...KBBK.........',
  '..KBBK..........',
  '..KBK...........',
  '...K............',
  '................',
  '................',
]);

const VILLAGER_E2 = sprite([
  '................',
  '......KKKK......',
  '.....KaaaaK.....',
  '.....KaaaKK.....',
  '.....KhHHHhK....',
  '.....HhWWHHK....',
  '.....HHnnKK.....',
  '......HHK.......',
  '....KKCCcK......',
  '...KcCCCCcK.....',
  '..KKCCCCCCK.....',
  '..KCCCCCKK......',
  '..KCCCCKK.......',
  '...KKKKK........',
  '....KKCK........',
  '....KCCK........',
  '....KKKK........',
  '.....KBK........',
  '....KBBK........',
  '...KBBK.........',
  '..KBK...........',
  '..KK............',
  '................',
  '................',
]);

const VILLAGER_N = sprite([
  '................',
  '......KKKK......',
  '.....KaaaaK.....',
  '.....KAAAAaK....',
  '.....KaaaaK.....',
  '.....KaaaaK.....',
  '......KaaK......',
  '......KKKK......',
  '....KKddddKK....',
  '...KddddddddK...',
  '...KddddddddK...',
  '..KKddKKKddKK...',
  '..KddddddddddK..',
  '..KdddKKKdddK...',
  '...KKKKKKKKK....',
  '....KddKKddK....',
  '....KddddddK....',
  '.....KKKKKK.....',
  '....KBBKKBBK....',
  '...KBBK..KBBK...',
  '...KBK....KBK...',
  '....K......K....',
  '................',
  '................',
]);

const VILLAGER_N2 = sprite([
  '................',
  '......KKKK......',
  '.....KaaaaK.....',
  '.....KAAAAaK....',
  '.....KaaaaK.....',
  '.....KaaaaK.....',
  '......KaaK......',
  '......KKKK......',
  '....KKddddKK....',
  '...KddddddddK...',
  '...KddddddddK...',
  '..KKddKKKddKK...',
  '..KddddddddddK..',
  '..KdddKKKdddK...',
  '...KKKKKKKKK....',
  '....KKdKKdKK....',
  '....KddddddK....',
  '....KKKKKKKK....',
  '...KBBK..KBBK...',
  '..KBBK....KBBK..',
  '..KBK......KBK..',
  '...K........K...',
  '................',
  '................',
]);

function clothTint(cloth, clothHi, clothSh, hair, hairHi) {
  return {
    [key(CLOTH)]: cloth,
    [key(CLOTH_HI)]: clothHi,
    [key(CLOTH_SH)]: clothSh,
    [key(HAIR)]: hair,
    [key(HAIR_HI)]: hairHi,
  };
}

function paintOver(img, x, y, rows) {
  const patch = fromRows(rows, PAL);
  blit(img, patch, x, y);
  return img;
}

function withOverlay(base, tintMap, overlay) {
  const img = tintImage(base, tintMap);
  if (overlay) overlay(img);
  return img;
}

// Apron and braid for Brenna. Drawn into the south/east/north frames.
function ivarOverlay(dir) {
  return (img) => {
    if (dir === 's') {
      paintOver(img, 5, 11, ['bb', 'bb', 'bb']);
      paintOver(img, 11, 12, ['oQ', 'oQ']);
    } else if (dir === 'e') {
      paintOver(img, 7, 12, ['Q', 'o']);
    } else if (dir === 'n') {
      paintOver(img, 6, 12, ['bb', 'bb']);
    }
  };
}

function signeOverlay(dir) {
  return (img) => {
    if (dir === 's') {
      paintOver(img, 5, 10, ['.CC.', 'CCCC', '.cc.']);
      paintOver(img, 11, 8, ['Y', 'K']);
    } else if (dir === 'e') {
      paintOver(img, 6, 11, ['CC', 'cc']);
    } else if (dir === 'n') {
      paintOver(img, 6, 11, ['CC', 'cc']);
    }
  };
}

function brennaOverlay(dir, frame) {
  return (img) => {
    if (dir === 's') {
      paintOver(img, 5, 10, ['..GG..', '..GG..', '..GG..', '..gg..']);
      if (frame === 0) paintOver(img, 11, 3, ['KK', 'aK', 'aK', 'KK']);
    } else if (dir === 'e') {
      paintOver(img, 6, 11, ['GG', 'GG', 'gg']);
    } else if (dir === 'n') {
      paintOver(img, 6, 2, ['aaaa', 'aaaa', 'aKaa']);
    }
  };
}

function hildaOverlay(dir) {
  return (img) => {
    if (dir === 's' || dir === 'n') {
      // Grey bun and a heavier shawl.
      paintOver(img, 6, 1, ['KppK', 'KuuK']);
    }
    if (dir === 'e') paintOver(img, 8, 1, ['Kp', 'Ku']);
    if (dir === 's') paintOver(img, 4, 9, ['KmmmmK', 'KmmmmK']);
  };
}

function torvaldOverlay(dir) {
  return (img) => {
    if (dir === 's') {
      paintOver(img, 5, 6, ['KppppK', '.KppK.']);
      paintOver(img, 12, 8, ['Ko', 'KL', 'Ko', 'KY', 'KK']);
    } else if (dir === 'e') {
      paintOver(img, 8, 6, ['Kp', 'Kp']);
      paintOver(img, 11, 9, ['o', 'L', 'Y', 'K']);
    } else if (dir === 'n') {
      paintOver(img, 5, 1, ['KppppK']);
      paintOver(img, 2, 10, ['o', 'L', 'o', 'K']);
    }
  };
}

function sorenOverlay(dir) {
  return (img) => {
    if (dir === 's' || dir === 'n') {
      paintOver(img, 5, 1, ['KqqqqK', 'KQQQQK']);
      paintOver(img, 13, 6, ['Q', 'Q', 'Q', 'Y', 'K']);
    }
    if (dir === 's') paintOver(img, 4, 8, ['KRRRRRRK']);
    if (dir === 'e') {
      paintOver(img, 6, 1, ['KqqK', 'KQQq']);
      paintOver(img, 12, 8, ['Q', 'Q', 'Y', 'K']);
    }
    if (dir === 'n') paintOver(img, 4, 8, ['KRRRRRRK']);
  };
}

// Circlet, cloak, and round shield. Original shield-maiden, not a copied crest.
function wizardOverlay(dir) {
  return (img) => {
    const robe = hex('#241848');
    const gem = hex('#b7e3ff');
    const gemHi = hex('#f4fbff');
    if (dir === 's' || dir === 'n') {
      for (let x = 5; x <= 10; x++) img.set(x, 1, robe);
      img.set(6, 2, gem);
      img.set(9, 2, gem);
    } else {
      for (let x = 6; x <= 10; x++) img.set(x, 1, robe);
    }
    const staffX = dir === 'e' ? 12 : 2;
    for (let y = 4; y <= 20; y++) img.set(staffX, y, WOOD_DARK);
    img.set(staffX, 3, gem);
    img.set(staffX, 2, gemHi);
  };
}

function eirikOverlay(dir) {
  return (img) => {
    const iron = hex('#8b97a3');
    if (dir === 's' || dir === 'n') {
      for (let x = 4; x <= 11; x++) img.set(x, 8, iron);
      img.set(3, 10, iron);
      img.set(3, 11, WOOD_DARK);
      img.set(3, 12, iron);
    } else {
      img.set(12, 9, iron);
      img.set(12, 10, WOOD);
      img.set(12, 11, iron);
    }
  };
}

function drawHelm(dir) {
  const img = createImage(16, 24);
  const fur = hex('#8a8178');
  const light = hex('#d8c8b0');
  const mouth = hex('#6a3030');
  if (dir === 's') {
    for (let x = 4; x <= 11; x++) {
      img.set(x, 1, fur);
      img.set(x, 2, light);
    }
    img.set(7, 0, fur);
    img.set(8, 0, fur);
    for (let y = 3; y <= 7; y++) {
      img.set(3, y, fur);
      img.set(12, y, fur);
    }
    img.set(5, 6, mouth);
    img.set(6, 6, mouth);
    img.set(9, 6, mouth);
    img.set(10, 6, mouth);
  } else if (dir === 'n') {
    for (let x = 4; x <= 11; x++) img.set(x, 1, fur);
    for (let y = 2; y <= 6; y++) for (let x = 5; x <= 10; x++) img.set(x, y, y < 4 ? light : fur);
  } else {
    for (let y = 1; y <= 6; y++) img.set(8, y, fur);
    img.set(9, 2, light);
    img.set(10, 3, fur);
    img.set(11, 4, mouth);
    img.set(7, 5, fur);
  }
  return img;
}

function freyaOverlay(dir, frame) {
  return (img) => {
    if (dir === 's' || dir === 'n') paintOver(img, 5, 2, ['KYYYYK']);
    if (dir === 'e') paintOver(img, 6, 2, ['KYYY']);
    if (dir === 's' || dir === 'n') paintOver(img, 4, 8, ['RRRRRRRR']);
    if (dir === 'e') paintOver(img, 5, 9, ['RRRR']);
    if (dir === 's') paintOver(img, 11, 10, ['.QQ', 'QYQ', '.QQ']);
    if (dir === 'e') paintOver(img, 10, 10, ['QQ', 'YQ', 'QQ']);
    if (dir === 'n') {
      paintOver(img, 1, 10, ['QQ', 'QY', 'QQ']);
      paintOver(img, 7, 5, ['A', 'a', 'A', frame ? 'A' : 'a']);
    }
  };
}

const WOLF_E = sprite([
  '................',
  '................',
  '................',
  '................',
  '................',
  '...........KK...',
  '..........KGGK..',
  '.........KGGgKK.',
  '......KKKGggEgK.',
  '....KKgggwwwwwgK',
  '...KgggggggggggK',
  '..KggggggggggggK',
  '..KggK......KggK',
  '...KK........KK.',
  '..............K.',
  '..KK......KK....',
  '.KggK....KggK...',
  '.KKKK....KKKK...',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
]);

const WOLF_E2 = sprite([
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '...........KK...',
  '..........KGGK..',
  '.........KGGgKK.',
  '......KKKGggEgK.',
  '....KKgggwwwwwgK',
  '...KgggggggggggK',
  '..KggggggggggggK',
  '..KggK.....KggK.',
  '.............K..',
  '...KK....KK.....',
  '..KggK..KggK....',
  '..KKKK..KKK.....',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
]);

const WOLF_S = sprite([
  '................',
  '................',
  '................',
  '................',
  '................',
  '.....K....K.....',
  '....KGK..KGK....',
  '....KggKKggK....',
  '...KKggggggKK...',
  '...KguuuuugK....',
  '...KgggggggK....',
  '....KgggggK.....',
  '...KKgggggKK....',
  '..KggKgggKggK...',
  '..KgK.KKK.KgK...',
  '...K...K...K....',
  '..KK...K...KK...',
  '..KgK.....KgK...',
  '..KKK.....KKK...',
  '................',
  '................',
  '................',
  '................',
  '................',
]);

const WOLF_S2 = sprite([
  '................',
  '................',
  '................',
  '................',
  '................',
  '.....K....K.....',
  '....KGK..KGK....',
  '....KggKKggK....',
  '...KKggggggKK...',
  '...KguuuuugK....',
  '...KgggggggK....',
  '....KgggggK.....',
  '...KKgggggKK....',
  '..KggKgggKggK...',
  '..KgK.KgK.KgK...',
  '..KK...K...KK...',
  '.KggK..K..KggK..',
  '.KKKK.....KKKK..',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
]);

const WOLF_N = sprite([
  '................',
  '................',
  '................',
  '................',
  '................',
  '.....KK..KK.....',
  '....KggKKggK....',
  '....KggggggK....',
  '...KKggggggKK...',
  '...KggggggggK...',
  '...KggggggggK...',
  '....KggggggK....',
  '...KKggggggKK...',
  '..KggKggggKggK..',
  '..KgK.KKKK.KgK..',
  '...K...KK...K...',
  '..KK...KK...KK..',
  '..KgK.....KgK...',
  '..KKK.....KKK...',
  '................',
  '................',
  '................',
  '................',
  '................',
]);

const WOLF_N2 = sprite([
  '................',
  '................',
  '................',
  '................',
  '................',
  '.....KK..KK.....',
  '....KggKKggK....',
  '....KggggggK....',
  '...KKggggggKK...',
  '...KggggggggK...',
  '...KggggggggK...',
  '....KggggggK....',
  '...KKggggggKK...',
  '..KggKggggKggK..',
  '..KgK.KggK.KgK..',
  '..KK...KK...KK..',
  '.KggK..KK..KggK.',
  '.KKKK......KKKK.',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
]);

function wolfTint(body, hi, belly) {
  // G/g/u in the wolf strings are pine/belly stand-ins so they can be recolored.
  return {
    [key(hex('#6e8f5a'))]: body,
    [key(hex('#8eae72'))]: hi,
    [key(hex('#efe8dc'))]: belly,
    // `w` is drawn as the same belly tone; keep both keys if they diverge later.
  };
}

function drawTree(variant) {
  const img = createImage(32, 40);
  const rand = mulberry(200 + variant);
  const layers = [
    { y: 2, h: 12, w: 8, c: PINE_MID },
    { y: 10, h: 12, w: 12, c: PINE },
    { y: 18, h: 12, w: 15, c: variant ? PINE_DEEP : PINE },
  ];
  for (const layer of layers) {
    for (let y = 0; y < layer.h; y++) {
      const half = Math.max(1, Math.round((y / layer.h) * layer.w));
      for (let x = -half; x <= half; x++) {
        const edge = Math.abs(x) >= half - 1 || y < 2;
        let c = edge ? PINE_DEEP : layer.c;
        if (y < 3 && !edge) c = SNOW_HI;
        else if (rand() > 0.92) c = PINE_HI;
        img.set(16 + x, layer.y + y, c);
      }
    }
  }
  for (let y = 28; y < 39; y++) {
    for (let x = 14; x <= 17; x++) {
      img.set(x, y, x === 14 || x === 17 ? WOOD_DARK : y % 2 ? WOOD : WOOD_SH);
    }
  }
  silhouette(img, INK);
  return img;
}

function drawRock(large) {
  const w = large ? 24 : 16;
  const h = large ? 18 : 14;
  const img = createImage(w, h);
  const rand = mulberry(large ? 9 : 4);
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = (x - cx) / cx;
      const ny = (y - cy) / (cy * 0.85);
      if (nx * nx + ny * ny > 1) continue;
      let c = hex('#7d8b98');
      if (y < h * 0.35 && x < w * 0.6) c = hex('#c5d0da');
      else if (y > h * 0.7) c = hex('#4e5964');
      if (rand() > 0.9) c = SNOW_HI;
      img.set(x, y, c);
    }
  }
  silhouette(img, INK);
  return img;
}

function drawBarrel() {
  const img = createImage(16, 16);
  for (let y = 2; y < 15; y++) {
    for (let x = 3; x <= 12; x++) {
      const edge = x === 3 || x === 12;
      img.set(x, y, edge ? WOOD_DARK : x < 7 ? WOOD_HI : WOOD);
    }
  }
  for (const y of [4, 5, 11, 12]) {
    for (let x = 3; x <= 12; x++) img.set(x, y, y % 2 ? IRON_DARK : IRON_SH);
  }
  for (let x = 4; x <= 11; x++) {
    img.set(x, 2, WOOD_HI);
    img.set(x, 1, x > 4 && x < 11 ? WOOD : null);
  }
  silhouette(img, INK);
  return img;
}

function drawCrate() {
  const img = createImage(16, 16);
  for (let y = 3; y <= 14; y++) {
    for (let x = 2; x <= 13; x++) {
      const edge = x === 2 || x === 13 || y === 3 || y === 14;
      img.set(x, y, edge ? WOOD_DARK : WOOD);
    }
  }
  for (let i = 0; i < 10; i++) {
    img.set(3 + i, 4 + i, WOOD_SH);
    img.set(12 - i, 4 + i, WOOD_SH);
  }
  silhouette(img, INK);
  return img;
}

function drawWell() {
  const img = createImage(32, 32);
  // Posts and beam
  for (let y = 6; y < 28; y++) {
    for (const x of [8, 9, 22, 23]) img.set(x, y, WOOD_DARK);
  }
  for (let x = 8; x <= 23; x++) {
    img.set(x, 6, WOOD);
    img.set(x, 7, WOOD_HI);
  }
  // Stone ring
  const cx = 16;
  const cy = 22;
  for (let y = 14; y <= 30; y++) {
    for (let x = 6; x <= 26; x++) {
      const dx = (x - cx) / 10;
      const dy = (y - cy) / 7;
      const d = dx * dx + dy * dy;
      if (d > 1) continue;
      if (d < 0.35) img.set(x, y, hex('#1a242c'));
      else img.set(x, y, d > 0.75 ? hex('#6a6058') : hex('#b7aa9e'));
    }
  }
  img.set(18, 8, IRON_SH);
  silhouette(img, INK);
  return img;
}

function drawFire(frame) {
  const img = createImage(16, 16);
  for (let a = 0; a < 8; a++) {
    const x = 4 + (a % 4) + (a > 3 ? 4 : 0);
    const y = 10 + (a % 2);
    img.set(x, y, hex('#6a6058'));
    img.set(x, y - 1, hex('#8a8078'));
  }
  const flames = frame === 0 ? [[7, 8], [8, 7], [8, 6], [9, 8], [8, 5], [6, 8], [10, 9]] : [[8, 8], [7, 7], [8, 6], [9, 7], [8, 4], [10, 8], [6, 9]];
  for (const [x, y] of flames) img.set(x, y, y < 7 ? hex('#ffe08a') : hex('#e07030'));
  img.set(8, frame === 0 ? 9 : 8, hex('#a83820'));
  silhouette(img, INK);
  return img;
}

function drawBanner() {
  const img = createImage(16, 32);
  for (let y = 2; y < 31; y++) {
    img.set(3, y, WOOD_DARK);
    img.set(4, y, WOOD);
  }
  for (let y = 4; y <= 18; y++) {
    for (let x = 5; x <= 13; x++) {
      const edge = x === 5 || x === 13 || y === 4 || y === 18;
      img.set(x, y, edge ? RED_DARK : RED);
    }
  }
  // White chevron, an original hold-mark.
  img.set(8, 8, SNOW_HI);
  img.set(9, 8, SNOW_HI);
  img.set(7, 9, SNOW_HI);
  img.set(10, 9, SNOW_HI);
  img.set(8, 12, SNOW_HI);
  img.set(9, 12, SNOW_HI);
  img.set(7, 13, SNOW_HI);
  img.set(10, 13, SNOW_HI);
  silhouette(img, INK);
  return img;
}

function drawSign(kind) {
  const img = createImage(16, 24);
  for (let y = 8; y < 23; y++) {
    img.set(7, y, WOOD_DARK);
    img.set(8, y, WOOD);
  }
  for (let y = 2; y <= 12; y++) {
    for (let x = 2; x <= 13; x++) {
      const edge = x <= 3 || x >= 12 || y <= 3 || y >= 11;
      img.set(x, y, edge ? WOOD_DARK : WOOD_HI);
    }
  }
  if (kind === 'inn') {
    img.set(7, 6, hex('#e07030'));
    img.set(8, 6, hex('#ffe08a'));
    img.set(8, 7, hex('#e07030'));
    img.set(6, 8, hex('#a83820'));
    img.set(9, 8, hex('#a83820'));
  } else if (kind === 'hall') {
    // A drinking horn over a red band: the mead hall's mark.
    img.set(5, 5, YELLOW());
    img.set(6, 6, YELLOW());
    img.set(7, 7, YELLOW());
    img.set(8, 7, hex('#f4f0e6'));
    img.set(9, 6, WOOD_DARK);
    img.set(10, 5, WOOD_DARK);
    img.set(6, 8, RED);
    img.set(7, 8, RED);
    img.set(8, 8, RED);
  } else if (kind === 'wilds') {
    // Pine and a north chevron: the trail mark for the Frostmere Wilds.
    img.set(8, 4, PINE_HI);
    img.set(7, 5, PINE);
    img.set(8, 5, PINE_HI);
    img.set(9, 5, PINE);
    img.set(6, 6, PINE_DEEP);
    img.set(7, 6, PINE);
    img.set(8, 6, PINE);
    img.set(9, 6, PINE);
    img.set(10, 6, PINE_DEEP);
    img.set(8, 7, WOOD_DARK);
    img.set(8, 8, WOOD);
    img.set(6, 9, SNOW_HI);
    img.set(7, 9, SNOW_HI);
    img.set(8, 9, SNOW_HI);
    img.set(9, 9, SNOW_HI);
    img.set(10, 9, SNOW_HI);
  } else {
    img.set(6, 6, YELLOW());
    img.set(7, 6, YELLOW());
    img.set(8, 7, YELLOW());
    img.set(9, 7, YELLOW());
    img.set(7, 8, WOOD_DARK);
    img.set(8, 8, WOOD_DARK);
  }
  silhouette(img, INK);
  return img;
}

function YELLOW() {
  return hex('#e6c15a');
}

function drawStump() {
  const img = createImage(16, 16);
  for (let y = 6; y <= 13; y++) {
    for (let x = 4; x <= 11; x++) {
      img.set(x, y, x === 4 || x === 11 ? WOOD_DARK : WOOD);
    }
  }
  for (let x = 4; x <= 11; x++) img.set(x, 5, x > 4 && x < 11 ? WOOD_HI : WOOD_DARK);
  img.set(7, 7, WOOD_SH);
  img.set(8, 8, WOOD_SH);
  silhouette(img, INK);
  return img;
}

function drawBush() {
  const img = createImage(16, 16);
  const rand = mulberry(33);
  for (let y = 4; y <= 13; y++) {
    for (let x = 2; x <= 13; x++) {
      const dx = (x - 8) / 6;
      const dy = (y - 9) / 5;
      if (dx * dx + dy * dy > 1) continue;
      let c = rand() > 0.7 ? PINE_HI : PINE_MID;
      if (y < 7) c = SNOW_HI;
      img.set(x, y, c);
    }
  }
  silhouette(img, INK);
  return img;
}

function drawPouch() {
  const img = createImage(16, 16);
  for (let y = 5; y <= 13; y++) {
    for (let x = 4; x <= 11; x++) {
      img.set(x, y, x < 7 ? hex('#a87848') : hex('#7a5230'));
    }
  }
  for (let x = 6; x <= 9; x++) img.set(x, 4, WOOD_DARK);
  img.set(7, 6, hex('#e6c15a'));
  img.set(8, 6, hex('#e6c15a'));
  silhouette(img, INK);
  return img;
}

function drawCoins() {
  const img = createImage(16, 16);
  const blob = (cx, cy, r, c, hi) => {
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        const d = (x - cx) ** 2 + (y - cy) ** 2;
        if (d > r * r) continue;
        img.set(x, y, d < 2 ? hi : c);
      }
    }
  };
  blob(6, 9, 3, hex('#b8732a'), hex('#f0d090'));
  blob(10, 8, 3, hex('#d7dee6'), hex('#f4f7fb'));
  silhouette(img, INK);
  return img;
}

function buildActors() {
  const fw = 16;
  const fh = 24;
  const dirs = ['s', 'e', 'n', 'w'];
  const frames = 2;
  const cols = dirs.length * frames;
  const rowOf = {
    warrior: 0,
    brenna: 1,
    hilda: 2,
    torvald: 3,
    soren: 4,
    freya: 5,
    young_wolf: 6,
    wolf: 7,
    frost_wolf: 8,
    wizard: 9,
    eirik: 10,
    wolf_helm: 11,
    ivar: 12,
    signe: 13,
    ysolde: 14,
    torunn: 15,
    sable: 16,
    hroth: 17,
    bjorn: 18,
    sigrid: 19,
    hare: 20,
    fox: 21,
    beetle: 22,
    spider: 23,
    bear: 24,
    bones: 25,
    bandit: 26,
    archer: 27,
    leader: 28,
  };
  const sheet = createImage(cols * fw, Object.keys(rowOf).length * fh);

  const put = (row, dirIndex, frameIndex, img, flip = false) => {
    const x = (dirIndex * frames + frameIndex) * fw;
    const y = row * fh;
    blit(sheet, img, x, y, { flipX: flip });
  };

  const warrior = [
    [WARRIOR_S, WARRIOR_S2],
    [WARRIOR_E, WARRIOR_E2],
    [WARRIOR_N, WARRIOR_N2],
  ];
  warrior.forEach((pair, dir) => {
    put(0, dir, 0, pair[0]);
    put(0, dir, 1, pair[1]);
  });
  put(0, 3, 0, WARRIOR_E, true);
  put(0, 3, 1, WARRIOR_E2, true);

  const villager = [
    [VILLAGER_S, VILLAGER_S2],
    [VILLAGER_E, VILLAGER_E2],
    [VILLAGER_N, VILLAGER_N2],
  ];

  const people = [
    {
      row: 1,
      tint: clothTint(hex('#6e8f5a'), hex('#8eae72'), hex('#3e5a34'), hex('#6b4030'), hex('#a86840')),
      overlay: brennaOverlay,
    },
    {
      row: 2,
      tint: clothTint(hex('#8a4038'), hex('#c45a50'), hex('#5c2424'), hex('#c8ccd0'), hex('#f4f7fb')),
      overlay: (dir) => hildaOverlay(dir),
    },
    {
      row: 3,
      tint: clothTint(hex('#4a4038'), hex('#6e6258'), hex('#2e2824'), hex('#d8d2c8'), hex('#f4f1ea')),
      overlay: (dir) => torvaldOverlay(dir),
    },
    {
      row: 4,
      tint: clothTint(hex('#3d5e78'), hex('#6e96b4'), hex('#2a4254'), hex('#3a241c'), hex('#6b4030')),
      overlay: (dir) => sorenOverlay(dir),
    },
    {
      row: 5,
      tint: clothTint(hex('#7a2430'), hex('#c45058'), hex('#4a1420'), hex('#c6a56a'), hex('#f0d9a0')),
      overlay: (dir, frame) => freyaOverlay(dir, frame),
    },
    {
      row: 9,
      tint: clothTint(hex('#2c2458'), hex('#5a4c90'), hex('#161228'), hex('#d8d0c4'), hex('#f4f1ea')),
      overlay: (dir) => wizardOverlay(dir),
    },
    {
      row: 10,
      tint: clothTint(hex('#5c2424'), hex('#8a4030'), hex('#2a1414'), hex('#3a241c'), hex('#6b4030')),
      overlay: (dir) => eirikOverlay(dir),
    },
    {
      row: 12,
      tint: clothTint(hex('#3a241c'), hex('#6b4030'), hex('#241610'), hex('#2a2428'), hex('#5c534c')),
      overlay: (dir) => ivarOverlay(dir),
    },
    {
      row: 13,
      tint: clothTint(hex('#2e4a38'), hex('#5e8a62'), hex('#1c3024'), hex('#6b4030'), hex('#c48462')),
      overlay: (dir) => signeOverlay(dir),
    },
    { row: 14, tint: clothTint(hex('#2c2458'), hex('#5a4c90'), hex('#161228'), hex('#d8d0c4'), hex('#f4f1ea')), overlay: () => (img) => img },
    { row: 15, tint: clothTint(hex('#3e5a34'), hex('#6e8f5a'), hex('#24361e'), hex('#3a241c'), hex('#6b4030')), overlay: () => (img) => img },
    { row: 16, tint: clothTint(hex('#241c28'), hex('#4a3a48'), hex('#120e14'), hex('#1c1418'), hex('#3a241c')), overlay: () => (img) => img },
    { row: 17, tint: clothTint(hex('#6a2420'), hex('#a33b32'), hex('#3a1410'), hex('#3a241c'), hex('#6b4030')), overlay: () => (img) => img },
    { row: 18, tint: clothTint(hex('#2a4038'), hex('#4e7a68'), hex('#1a2822'), hex('#c8c0b6'), hex('#f4f1ea')), overlay: () => (img) => img },
    { row: 19, tint: clothTint(hex('#3a3230'), hex('#6a5a50'), hex('#241c1a'), hex('#5c4030'), hex('#a86840')), overlay: () => (img) => img },
  ];

  for (const person of people) {
    const dirNames = ['s', 'e', 'n'];
    dirNames.forEach((name, dir) => {
      const a = withOverlay(villager[dir][0], person.tint, person.overlay(name, 0));
      const b = withOverlay(villager[dir][1], person.tint, person.overlay(name, 1));
      put(person.row, dir, 0, a);
      put(person.row, dir, 1, b);
    });
    const e0 = withOverlay(villager[1][0], person.tint, person.overlay('e', 0));
    const e1 = withOverlay(villager[1][1], person.tint, person.overlay('e', 1));
    put(person.row, 3, 0, e0, true);
    put(person.row, 3, 1, e1, true);
  }

  const wolves = [
    { row: 6, tint: wolfTint(WOLF, WOLF_HI, BELLY) },
    { row: 7, tint: wolfTint(hex('#5c534c'), hex('#8a8178'), hex('#c8c0b6')) },
    { row: 8, tint: wolfTint(hex('#8aa4b4'), hex('#d5e4ee'), hex('#f7fbfe')) },
  ];
  const wolfDirs = [
    [WOLF_S, WOLF_S2],
    [WOLF_E, WOLF_E2],
    [WOLF_N, WOLF_N2],
  ];
  for (const wolf of wolves) {
    wolfDirs.forEach((pair, dir) => {
      put(wolf.row, dir, 0, tintImage(pair[0], wolf.tint));
      put(wolf.row, dir, 1, tintImage(pair[1], wolf.tint));
    });
    put(wolf.row, 3, 0, tintImage(WOLF_E, wolf.tint), true);
    put(wolf.row, 3, 1, tintImage(WOLF_E2, wolf.tint), true);
  }

  const helmSouth = drawHelm('s');
  const helmEast = drawHelm('e');
  const helmNorth = drawHelm('n');
  put(11, 0, 0, helmSouth);
  put(11, 0, 1, helmSouth);
  put(11, 1, 0, helmEast);
  put(11, 1, 1, helmEast);
  put(11, 2, 0, helmNorth);
  put(11, 2, 1, helmNorth);
  put(11, 3, 0, helmEast, true);
  put(11, 3, 1, helmEast, true);

  const critter = (kind) => {
    const img = createImage(16, 24);
    const blob = (x, y, w, h, c) => {
      for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) img.set(x + xx, y + yy, c);
    };
    if (kind === 'hare') {
      blob(6, 4, 2, 6, hex('#e8eef2'));
      blob(9, 4, 2, 6, hex('#e8eef2'));
      blob(5, 10, 6, 5, hex('#f4f7fb'));
      blob(4, 14, 3, 4, hex('#d5dee6'));
      blob(9, 14, 3, 4, hex('#d5dee6'));
    } else if (kind === 'fox') {
      blob(3, 8, 10, 6, hex('#c46a28'));
      blob(10, 10, 4, 3, hex('#e8a060'));
      blob(2, 12, 4, 2, hex('#f4f0e6'));
      blob(5, 14, 2, 5, hex('#a05020'));
      blob(9, 14, 2, 5, hex('#a05020'));
    } else if (kind === 'beetle') {
      blob(4, 8, 8, 8, hex('#1c4a44'));
      blob(5, 9, 6, 3, hex('#3e8a78'));
      blob(3, 12, 2, 4, hex('#163832'));
      blob(11, 12, 2, 4, hex('#163832'));
    } else if (kind === 'spider') {
      blob(6, 10, 4, 4, hex('#2a2428'));
      blob(2, 8, 3, 2, hex('#1c1418'));
      blob(11, 8, 3, 2, hex('#1c1418'));
      blob(2, 14, 3, 2, hex('#1c1418'));
      blob(11, 14, 3, 2, hex('#1c1418'));
    } else if (kind === 'bear') {
      blob(3, 6, 10, 10, hex('#4a3428'));
      blob(2, 4, 3, 3, hex('#3a241c'));
      blob(11, 4, 3, 3, hex('#3a241c'));
      blob(4, 16, 3, 5, hex('#3a241c'));
      blob(9, 16, 3, 5, hex('#3a241c'));
      img.set(6, 10, hex('#1c1418'));
      img.set(9, 10, hex('#1c1418'));
    } else if (kind === 'bones') {
      blob(6, 4, 4, 4, hex('#e6e0d4'));
      blob(5, 9, 6, 6, hex('#d8d0c4'));
      blob(6, 16, 1, 6, hex('#f4f1ea'));
      blob(9, 16, 1, 6, hex('#f4f1ea'));
      img.set(7, 6, hex('#1c1418'));
      img.set(9, 6, hex('#1c1418'));
    } else {
      blob(5, 4, 6, 5, hex('#3a241c'));
      blob(4, 9, 8, 7, kind === 'leader' ? hex('#6a2420') : kind === 'archer' ? hex('#2e4a38') : hex('#4a3428'));
      blob(5, 16, 2, 6, hex('#2a2018'));
      blob(9, 16, 2, 6, hex('#2a2018'));
    }
    silhouette(img, INK);
    return img;
  };
  for (const [name, row] of [
    ['hare', 20],
    ['fox', 21],
    ['beetle', 22],
    ['spider', 23],
    ['bear', 24],
    ['bones', 25],
    ['bandit', 26],
    ['archer', 27],
    ['leader', 28],
  ]) {
    const img = critter(name);
    for (let dir = 0; dir < 4; dir++) {
      put(row, dir, 0, img, dir === 3);
      put(row, dir, 1, img, dir === 3);
    }
  }

  return {
    sheet,
    meta: {
      frameW: fw,
      frameH: fh,
      dirs,
      framesPerDir: frames,
      rows: rowOf,
    },
  };
}

function buildProps() {
  const frames = {
    tree: drawTree(0),
    tree_b: drawTree(1),
    rock: drawRock(true),
    rock_small: drawRock(false),
    barrel: drawBarrel(),
    crate: drawCrate(),
    well: drawWell(),
    firepit: drawFire(0),
    firepit_b: drawFire(1),
    banner: drawBanner(),
    sign_inn: drawSign('inn'),
    sign_shop: drawSign('shop'),
    sign_hall: drawSign('hall'),
    sign_wilds: drawSign('wilds'),
    stump: drawStump(),
    bush: drawBush(),
    pouch: drawPouch(),
    coins: drawCoins(),
  };
  // Pack left to right, wrapping at 128px. Record anchors at bottom center.
  const sheetW = 128;
  let x = 0;
  let y = 0;
  let rowH = 0;
  /** @type {Record<string, {x:number,y:number,w:number,h:number,anchorX:number,anchorY:number}>} */
  const meta = {};
  const placed = [];
  for (const [name, img] of Object.entries(frames)) {
    if (x + img.w > sheetW) {
      x = 0;
      y += rowH;
      rowH = 0;
    }
    placed.push({ name, img, x, y });
    meta[name] = {
      x,
      y,
      w: img.w,
      h: img.h,
      anchorX: Math.floor(img.w / 2),
      anchorY: img.h - 1,
    };
    x += img.w;
    rowH = Math.max(rowH, img.h);
  }
  const sheet = createImage(sheetW, y + rowH);
  for (const p of placed) blit(sheet, p.img, p.x, p.y);
  return { sheet, meta };
}

function grid(w, h, fill) {
  return Array.from({ length: h }, () => Array(w).fill(fill));
}

function buildMap(tiles) {
  const g = grid(MAP_W, MAP_H, 0);
  const solid = grid(MAP_W, MAP_H, 0);
  const safe = grid(MAP_W, MAP_H, 0);
  const rand = mulberry(7);

  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const n = Math.floor(mulberry((y + 1) * 1000 + x)() * 3);
      g[y][x] = n === 0 ? T.SNOW : n === 1 ? T.SNOW_B : T.SNOW_C;
    }
  }

  // Fjord along the east.
  const shore = MAP_W - 7;
  for (let y = 0; y < MAP_H; y++) {
    for (let x = shore + 1; x < MAP_W; x++) {
      g[y][x] = (x + y) % 2 === 0 ? T.WATER : T.WATER_B;
      solid[y][x] = 1;
    }
    g[y][shore] = T.ICE;
  }

  const stamp = (x, y, tile, blocked = false) => {
    if (x < 0 || y < 0 || x >= MAP_W || y >= g.length) return;
    g[y][x] = tile;
    if (blocked) solid[y][x] = 1;
  };

  const fillRect = (x, y, w, h, tile, blocked = false) => {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) stamp(xx, yy, tile, blocked);
    }
  };

  // Roads. Vertical avenue and the east-west street.
  fillRect(29, 6, 3, 56, T.PATH);
  fillRect(16, 35, 29, 3, T.PATH);
  // Porches in front of the north buildings.
  fillRect(18, 34, 8, 1, T.PATH_B);
  fillRect(36, 34, 8, 1, T.PATH_B);
  // Approach shoulders
  for (let y = 8; y < 24; y += 3) {
    stamp(28, y, T.PATH_B);
    stamp(32, y, T.PATH_B);
  }

  // Dock on the new shore.
  fillRect(shore - 2, 30, 3, 4, T.DOCK, false);
  for (let y = 30; y <= 33; y++) {
    solid[y][shore] = 0;
    g[y][shore] = T.DOCK;
  }

  // Palisade. Gate is a wide opening on the north wall where the road passes.
  const x0 = 8;
  const y0 = 24;
  const x1 = 60;
  const y1 = 84;
  for (let x = x0; x <= x1; x++) {
    const gate = x >= 28 && x <= 32;
    if (!gate) {
      stamp(x, y0, x === 27 || x === 33 ? T.POST : T.PALISADE, true);
      stamp(x, y1, T.PALISADE, true);
    } else {
      stamp(x, y0, T.PATH);
      solid[y0][x] = 0;
    }
  }
  for (let y = y0 + 1; y < y1; y++) {
    stamp(x0, y, T.PALISADE, true);
    stamp(x1, y, T.PALISADE, true);
  }

  function building(x, y, w, h, opts) {
    const roofH = Math.max(2, Math.round(h * (opts.long ? 0.55 : 0.45)));
    // Character sprites are 24px. A door is 2 tiles wide (32px) and 3 tall (48px),
    // so it stands clearly taller and wider than the person in front of it.
    const doorW = 2;
    const doorH = 3;
    const doorLeft = Math.floor((w - doorW) / 2);
    const doorTop = h - doorH;
    const wallTile = opts.stone ? T.STONE : T.WALL;
    const frontTile = opts.stone ? T.STONE_FRONT : T.WALL_FRONT;
    const windowTile = opts.stone ? T.STONE_WIN : T.WINDOW;
    const leaves = opts.stone
      ? { tl: T.SDOOR_TL, tr: T.SDOOR_TR, ml: T.SDOOR_ML, mr: T.SDOOR_MR, bl: T.SDOOR_BL, br: T.SDOOR_BR }
      : { tl: T.DOOR_TL, tr: T.DOOR_TR, ml: T.DOOR_ML, mr: T.DOOR_MR, bl: T.DOOR_BL, br: T.DOOR_BR };
    const isDoor = (xx, yy) => xx >= doorLeft && xx < doorLeft + doorW && yy >= doorTop && yy < h;
    const windows = new Set();
    const markWindow = (xx, yy) => {
      if (xx < 0 || yy < roofH || xx >= w || yy >= h || isDoor(xx, yy)) return;
      windows.add(yy * w + xx);
    };
    const bay = (x0) => {
      for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) markWindow(x0 + dx, roofH + dy);
    };
    for (let wx = 1; wx + 2 <= doorLeft; wx += 3) bay(wx);
    for (let wx = doorLeft + doorW + 1; wx + 2 <= w - 1; wx += 3) bay(wx);
    for (const yy of [roofH, roofH + 1]) {
      markWindow(0, yy);
      markWindow(w - 1, yy);
    }
    for (let yy = 0; yy < h; yy++) {
      for (let xx = 0; xx < w; xx++) {
        const X = x + xx;
        const Y = y + yy;
        if (opts.chamfer && yy < 2 && (xx < 2 || xx >= w - 2)) continue;
        solid[Y][X] = 1;
        if (yy < roofH) {
          const north = yy === 0;
          const west = xx === 0;
          const east = xx === w - 1;
          const eaves = yy === roofH - 1;
          let tile = (xx + yy) % 5 === 0 ? T.ROOF_B : T.ROOF;
          if (eaves) tile = opts.shop ? T.ROOF_SHOP : T.ROOF_EAVES;
          else if (north && west) tile = T.ROOF_NW;
          else if (north && east) tile = T.ROOF_NE;
          else if (north) tile = T.ROOF_N;
          else if (west) tile = T.ROOF_W;
          else if (east) tile = T.ROOF_E;
          g[Y][X] = tile;
        } else if (isDoor(xx, yy)) {
          const band = yy === doorTop ? 't' : yy === h - 1 ? 'b' : 'm';
          const side = xx === doorLeft ? 'l' : 'r';
          g[Y][X] = leaves[band + side];
        } else if (windows.has(yy * w + xx)) {
          g[Y][X] = windowTile;
        } else if (yy === h - 1) {
          g[Y][X] = opts.shop ? T.AWNING : frontTile;
        } else {
          g[Y][X] = wallTile;
        }
      }
    }
    if (opts.chimney) {
      const cx = x + 2;
      const cy = y + 1;
      if (cy < y + roofH - 1) g[cy][cx] = T.CHIMNEY;
    }
    return { doorX: x + doorLeft, doorY: y + h - 1 };
  }

  const inn = building(16, 26, 12, 8, { chimney: true, chamfer: true, long: true });
  const shop = building(36, 26, 12, 8, { shop: true, chamfer: true });
  // Mead hall: stone, not a castle. Door faces the south yard. Interiors are not enterable.
  const meadHall = building(14, 40, 16, 8, { chimney: true, stone: true, chamfer: true, long: true });
  building(40, 40, 10, 7, { chamfer: true });
  const guild = building(38, 51, 16, 8, { chimney: true, chamfer: true, long: true });
  building(10, 51, 12, 8, { chamfer: true, long: true });
  const forge = building(49, 26, 10, 8, { chimney: true, chamfer: true });
  const needles = building(50, 40, 9, 8, { shop: true, chamfer: true });
  const wizHall = building(10, 64, 14, 8, { chimney: true, chamfer: true, long: true });
  const shaHall = building(26, 64, 14, 8, { chamfer: true, long: true });
  const rogHall = building(42, 64, 14, 8, { chamfer: true, long: true });
  const berHall = building(10, 74, 14, 8, { chimney: true, chamfer: true, long: true });
  const wdHall = building(26, 74, 14, 8, { chamfer: true, long: true });
  const smithy = building(42, 74, 14, 8, { chimney: true, chamfer: true });
  // Alley between the halls, plus the streets their doors open onto.
  fillRect(24, 50, 2, 34, T.PATH);
  fillRect(12, 72, 46, 2, T.PATH);
  fillRect(12, 82, 46, 2, T.PATH);
  fillRect(12, 49, 46, 2, T.PATH);
  // Wooden fences on the outskirts, with the road left open.
  for (let x = 6; x <= 26; x++) stamp(x, 18, T.FENCE, true);
  for (let x = 34; x <= 56; x++) stamp(x, 18, T.FENCE, true);
  // A short stone wall beside the mead hall. Not a castle.
  for (let y = 48; y <= 50; y++) stamp(12, y, T.STONE, true);

  // Safe yard: inside the walls, not the wall tiles themselves, not the gate.
  for (let y = y0 + 1; y < y1; y++) {
    for (let x = x0 + 1; x < x1; x++) safe[y][x] = 1;
  }

  // Props and spawns. Feet positions are pixels.
  const px = (tx, ty) => ({ x: tx * TILE + 8, y: ty * TILE + 14 });
  /** @type {{kind:string,name:string,defId?:string,sprite?:string,x:number,y:number}[]} */
  const objects = [];
  const add = (kind, name, tx, ty, extra = {}) => {
    const p = px(tx, ty);
    objects.push({ kind, name, x: p.x, y: p.y, ...extra });
  };

  add('spawn', 'player', 30, 31);
  add('bind', 'inn-yard', 22, 36);

  add('npc', 'brenna', 39, 34, { defId: 'brenna', sprite: 'brenna' });
  add('npc', 'hilda', 21, 34, { defId: 'hilda', sprite: 'hilda' });
  add('npc', 'torvald', 24, 39, { defId: 'torvald', sprite: 'torvald' });
  add('npc', 'soren', 33, 26, { defId: 'soren', sprite: 'soren' });
  // Just outside the mead-hall door. The door tile itself is solid.
  add('npc', 'freya', meadHall.doorX, meadHall.doorY + 1, { defId: 'freya', sprite: 'freya' });
  add('npc', 'eirik', guild.doorX, guild.doorY + 1, { defId: 'eirik', sprite: 'eirik' });
  add('npc', 'ivar', forge.doorX, forge.doorY + 1, { defId: 'ivar', sprite: 'ivar' });
  add('npc', 'signe', needles.doorX, needles.doorY + 1, { defId: 'signe', sprite: 'signe' });
  add('npc', 'ysolde', wizHall.doorX, wizHall.doorY + 1, { defId: 'ysolde', sprite: 'ysolde' });
  add('npc', 'torunn', shaHall.doorX, shaHall.doorY + 1, { defId: 'torunn', sprite: 'torunn' });
  add('npc', 'sable', rogHall.doorX, rogHall.doorY + 1, { defId: 'sable', sprite: 'sable' });
  add('npc', 'hroth', berHall.doorX, berHall.doorY + 1, { defId: 'hroth', sprite: 'hroth' });
  add('npc', 'bjorn', wdHall.doorX, wdHall.doorY + 1, { defId: 'bjorn', sprite: 'bjorn' });
  add('npc', 'sigrid', smithy.doorX, smithy.doorY + 1, { defId: 'sigrid', sprite: 'sigrid' });

  const mobs = [
    ['young_wolf', 24, 16],
    ['young_wolf', 36, 17],
    ['young_wolf', 27, 12],
    ['wolf', 9, 10],
    ['wolf', 12, 13],
    ['wolf', 43, 12],
    ['frost_wolf', 20, 7],
    ['frost_wolf', 40, 6],
    ['wolf', 7, 32],
  ];
  mobs.forEach(([defId, tx, ty], i) => {
    add('mob', `${defId}_${i}`, tx, ty, { defId, sprite: defId });
  });

  /** @type {{sprite:string,tx:number,ty:number,solid?:boolean}[]} */
  const props = [
    { sprite: 'well', tx: 33, ty: 43, solid: true },
    { sprite: 'firepit', tx: 33, ty: 39 },
    { sprite: 'banner', tx: 33, ty: 30 },
    { sprite: 'barrel', tx: 41, ty: 34, solid: true },
    { sprite: 'barrel', tx: 53, ty: 31, solid: true },
    { sprite: 'crate', tx: 17, ty: 34, solid: true },
    { sprite: 'crate', tx: 40, ty: 47, solid: true },
    { sprite: 'stump', tx: 26, ty: 16, solid: true },
    { sprite: 'stump', tx: 34, ty: 14, solid: true },
  ];

  function nearPath(tx, ty, rad) {
    for (let y = ty - rad; y <= ty + rad; y++) {
      for (let x = tx - rad; x <= tx + rad; x++) {
        if (y < 0 || x < 0 || y >= MAP_H || x >= MAP_W) continue;
        if (g[y][x] === T.PATH || g[y][x] === T.PATH_B) return true;
      }
    }
    return false;
  }

  const treeSpots = [];
  for (let y = 2; y < MAP_H - 2; y++) {
    for (let x = 2; x < 53; x++) {
      if (solid[y][x]) continue;
      if (safe[y][x]) continue;
      if (g[y][x] === T.ICE || g[y][x] === T.DOCK || g[y][x] === T.WATER || g[y][x] === T.WATER_B) continue;
      if (nearPath(x, y, 2)) continue;
      if (y > 20 && x > 10 && x < 50) continue;
      treeSpots.push([x, y]);
    }
  }
  // Stable shuffle
  treeSpots.sort((a, b) => {
    const ha = Math.imul(a[0] * 13 + a[1] * 29, 0x45d9f3b) >>> 0;
    const hb = Math.imul(b[0] * 13 + b[1] * 29, 0x45d9f3b) >>> 0;
    return ha - hb;
  });
  const used = grid(MAP_W, MAP_H, 0);
  let trees = 0;
  for (const [x, y] of treeSpots) {
    if (trees >= 42) break;
    let crowded = false;
    for (let yy = y - 3; yy <= y + 3 && !crowded; yy++) {
      for (let xx = x - 3; xx <= x + 3; xx++) {
        if (yy < 0 || xx < 0 || yy >= MAP_H || xx >= MAP_W) continue;
        if (used[yy][xx]) crowded = true;
      }
    }
    if (crowded) continue;
    used[y][x] = 1;
    props.push({ sprite: trees % 2 ? 'tree_b' : 'tree', tx: x, ty: y, solid: true });
    trees++;
  }

  const rockSpots = [
    [18, 5],
    [23, 8],
    [38, 8],
    [45, 9],
    [6, 8],
    [11, 20],
    [48, 18],
    [4, 40],
    [50, 40],
    [22, 4],
  ];
  for (const [x, y] of rockSpots) {
    if (solid[y][x] || safe[y][x]) continue;
    props.push({ sprite: 'rock', tx: x, ty: y, solid: true });
  }
  for (let i = 0; i < 14; i++) {
    const x = 3 + Math.floor(rand() * 48);
    const y = 3 + Math.floor(rand() * 18);
    if (solid[y][x] || safe[y][x] || nearPath(x, y, 1)) continue;
    if (g[y][x] === T.ICE) continue;
    props.push({ sprite: i % 2 ? 'bush' : 'rock_small', tx: x, ty: y, solid: i % 2 === 0 });
  }

  // Bushes only on open ground. Never inside a wall.
  for (const [tx, ty] of [[20, 46], [48, 48], [22, 60]]) {
    if (!solid[ty][tx] && !safe[ty]?.[tx]) props.push({ sprite: 'bush', tx, ty });
    else if (!solid[ty][tx]) props.push({ sprite: 'bush', tx, ty });
  }

  for (const prop of props) {
    add('prop', prop.sprite, prop.tx, prop.ty, { sprite: prop.sprite });
    if (prop.solid) solid[prop.ty][prop.tx] = 1;
  }

  // Place names drawn over the map. Labels are not feet, so they may sit on a roof.
  add('label', 'Frostmere Wilds', 30, 20);
  add('label', 'Hoffender', 30, 33);
  add('label', 'Mead Hall', meadHall.doorX, meadHall.doorY - 3);
  add('sign', 'Mead Hall', meadHall.doorX - 2, meadHall.doorY + 1, {
    sprite: 'sign_hall',
    text: "Jarl Freya's mead hall. Stone, not a castle. She would rather fill it with traders than with a war-band.",
  });
  add('sign', 'Frosthearth Inn', inn.doorX - 2, inn.doorY + 1, {
    sprite: 'sign_inn',
    text: 'Frosthearth Inn. Hilda Venn keeps the fire. If you fall in combat, you wake in her yard.',
  });
  add('sign', "Brenna's Goods", shop.doorX - 2, shop.doorY + 1, {
    sprite: 'sign_shop',
    text: "Brenna's Goods. Pelts, bandages, and a draught that costs more than bread.",
  });
  add('sign', "Ivar's Forge", forge.doorX - 2, forge.doorY + 1, {
    sprite: 'sign_shop',
    text: "Ivar's Forge. Plate and chain. The smith stands at the door.",
  });
  add('sign', "Signe's Needles", needles.doorX - 2, needles.doorY + 1, {
    sprite: 'sign_shop',
    text: "Signe's Needles. Cloth and leather, cut and stitched.",
  });
  add('sign', 'Warrior Guild', guild.doorX + 2, guild.doorY + 1, {
    sprite: 'sign_hall',
    text: 'Warrior Guild. Eirik Stonehand is guildmaster. The hall is still new.',
  });
  add('sign', 'Wizard Hall', wizHall.doorX - 2, wizHall.doorY + 1, {
    sprite: 'sign_hall',
    text: 'Wizard Hall. Ysolde Mire keeps the pages. Barbarians are not taught here.',
  });
  add('sign', 'Shaman Hall', shaHall.doorX - 2, shaHall.doorY + 1, {
    sprite: 'sign_hall',
    text: 'Shaman Hall. Torunn Ash. Slows, mends, and the burn that stays.',
  });
  add('sign', 'Rogue Hall', rogHall.doorX - 2, rogHall.doorY + 1, {
    sprite: 'sign_hall',
    text: 'Rogue Hall. Sable Venn. Speak quietly.',
  });
  add('sign', 'Berserker Hall', berHall.doorX - 2, berHall.doorY + 1, {
    sprite: 'sign_hall',
    text: 'Berserker Hall. Hroth Keld. Rage is a tool, not a mood.',
  });
  add('sign', 'Warden Hall', wdHall.doorX - 2, wdHall.doorY + 1, {
    sprite: 'sign_hall',
    text: 'Warden Hall. Bjorn Pale. Fists, a staff, and a snow wolf.',
  });
  add('sign', "Sigrid's Steel", smithy.doorX + 2, smithy.doorY + 1, {
    sprite: 'sign_shop',
    text: "Sigrid's Steel. Weapons. Armor is Ivar's forge, north of here.",
  });
  add('sign', 'Frostmere Wilds this way', 26, 22, {
    sprite: 'sign_wilds',
    text: 'Frostmere Wilds this way. North, through the gate. Wolves are on the road.',
  });
  add('sign', 'Hoffender this way', 34, 22, {
    sprite: 'sign_inn',
    text: 'Hoffender this way. The gate is south. Jarl Freya keeps the mead hall.',
  });

  // Border
  for (let x = 0; x < MAP_W; x++) {
    solid[0][x] = 1;
    solid[MAP_H - 1][x] = 1;
  }
  for (let y = 0; y < MAP_H; y++) {
    solid[y][0] = 1;
    solid[y][MAP_W - 1] = 1;
  }

  const WILD = 72;
  const prependRows = (grid2d, fill) => {
    for (let i = 0; i < WILD; i++) grid2d.unshift(Array(MAP_W).fill(fill));
  };
  prependRows(g, T.SNOW);
  prependRows(solid, 0);
  prependRows(safe, 0);
  for (const obj of objects) obj.y += WILD * TILE;
  for (let x = 1; x < MAP_W - 1; x++) solid[WILD][x] = 0;
  for (let y = 0; y < WILD; y++) {
    solid[y][0] = 1;
    solid[y][MAP_W - 1] = 1;
    g[y][0] = T.SNOW_C;
    g[y][MAP_W - 1] = T.SNOW_C;
  }
  for (let x = 0; x < MAP_W; x++) solid[0][x] = 1;
  for (let y = 2; y < WILD - 1; y++) {
    for (let x = 1; x < MAP_W - 1; x++) {
      const n = Math.floor(mulberry(y * 50 + x)() * 5);
      g[y][x] = n === 0 ? T.SNOW_B : n === 1 ? T.SNOW_C : T.SNOW;
    }
  }
  // Frozen stream and the road north from the gate.
  for (let y = 3; y < WILD - 2; y++) {
    const x = 12 + Math.round(Math.sin(y / 5) * 3);
    g[y][x] = T.ICE;
    g[y][x + 1] = T.ICE;
  }
  fillRect(29, 2, 3, WILD + 8, T.PATH);
  const treeAt = (tx, ty) => {
    add('prop', 'pine', tx, ty, { sprite: (tx + ty) % 2 === 0 ? 'tree' : 'tree_b' });
  };
  const rockAt = (tx, ty, big = true) => {
    add('prop', 'boulder', tx, ty, { sprite: big ? 'rock' : 'rock_small' });
    solid[ty][tx] = 1;
  };
  for (let i = 0; i < 70; i++) {
    const tx = 2 + Math.floor(mulberry(8000 + i)() * (MAP_W - 4));
    const ty = 3 + Math.floor(mulberry(9000 + i)() * (WILD - 8));
    if (tx >= 28 && tx <= 32) continue;
    if (i % 5 === 0) rockAt(tx, ty, i % 10 === 0);
    else treeAt(tx, ty);
  }
  // Three camps, deeper as the level climbs. A barrow in the far north.
  const camp = (cx, cy, name) => {
    rockAt(cx - 2, cy - 1, true);
    rockAt(cx + 2, cy - 1, true);
    rockAt(cx - 2, cy + 1, false);
    rockAt(cx + 2, cy + 1, false);
    add('prop', 'fire', cx, cy, { sprite: 'firepit' });
    add('sign', name, cx + 1, cy + 2, { sprite: 'sign_wilds', text: name });
  };
  camp(18, WILD - 16, 'Road camp. Thugs of the near wilds, about the fifth winter.');
  camp(46, 40, 'Pine camp. Archers in the middle wilds, about the seventh winter.');
  camp(22, 12, 'Deep camp. A leader of the tenth winter waits with the last fire.');
  add('sign', 'The Barrow', 40, 8, {
    sprite: 'sign_wilds',
    text: 'The Barrow. Bones that did not stay down. Mira Palehand is said to walk here.',
  });
  const spawnMob = (defId, tx, ty, sprite) => add('mob', defId, tx, ty, { defId, sprite });
  [[24, WILD - 8], [34, WILD - 12], [16, WILD - 6], [40, WILD - 10]].forEach(([tx, ty]) => spawnMob('snow_hare', tx, ty, 'hare'));
  [[20, WILD - 22], [38, WILD - 26], [50, 58]].forEach(([tx, ty]) => spawnMob('red_fox', tx, ty, 'fox'));
  [[14, 50], [52, 48], [18, 36]].forEach(([tx, ty]) => spawnMob('ice_beetle', tx, ty, 'beetle'));
  [[44, 30], [16, 28], [36, 22]].forEach(([tx, ty]) => spawnMob('frost_spider', tx, ty, 'spider'));
  spawnMob('wolf_alpha', 48, WILD - 20, 'frost_wolf');
  spawnMob('wolf_alpha', 12, 44, 'frost_wolf');
  spawnMob('cave_bear', 54, 24, 'bear');
  spawnMob('old_bramble', 8, 18, 'bear');
  spawnMob('barrow_bones', 38, 10, 'bones');
  spawnMob('barrow_bones', 44, 9, 'bones');
  [[17, WILD - 16], [19, WILD - 17], [18, WILD - 19]].forEach(([tx, ty]) => spawnMob('bandit_thug', tx, ty, 'bandit'));
  [[45, 40], [47, 42], [46, 38]].forEach(([tx, ty], i) => spawnMob(i === 2 ? 'bandit_archer' : 'bandit_thug', tx, ty, i === 2 ? 'archer' : 'bandit'));
  spawnMob('bandit_thug', 21, 14, 'bandit');
  spawnMob('bandit_archer', 23, 15, 'archer');
  spawnMob('camp_leader', 22, 16, 'leader');

  // Spawns must stand on open ground.
  for (const o of objects) {
    if (o.kind === 'prop' || o.kind === 'label' || o.kind === 'sign') continue;
    const tx = Math.floor(o.x / TILE);
    const ty = Math.floor(o.y / TILE);
    if (solid[ty][tx]) {
      throw new Error(`${o.kind} ${o.name} is on a blocked tile ${tx},${ty}`);
    }
  }

  // Silence unused vars from building door positions — they document the layout.
  void inn;
  void shop;
  void tiles;

  return { ground: g, solid, safe, objects };
}

function flatten(grid2d) {
  const out = [];
  for (const row of grid2d) {
    for (const cell of row) out.push(cell);
  }
  return out;
}

function layer(id, name, type, extra) {
  return { id, name, type, opacity: 1, visible: true, x: 0, y: 0, ...extra };
}

function buildTmj(map, tileset) {
  let oid = 1;
  const objects = map.objects.map((o) => {
    const properties = [];
    if (o.defId) properties.push({ name: 'defId', type: 'string', value: o.defId });
    if (o.sprite) properties.push({ name: 'sprite', type: 'string', value: o.sprite });
    if (o.text) properties.push({ name: 'text', type: 'string', value: o.text });
    return {
      id: oid++,
      name: o.name,
      type: o.kind,
      x: o.x,
      y: o.y,
      width: 0,
      height: 0,
      rotation: 0,
      visible: true,
      point: true,
      properties,
    };
  });

  const tileProps = [];
  for (const id of [T.WALL, T.WALL_FRONT, T.WINDOW, T.DOOR, T.ROOF, T.ROOF_B, T.ROOF_N, T.ROOF_W, T.ROOF_E, T.ROOF_NW, T.ROOF_NE, T.ROOF_EAVES, T.ROOF_SHOP, T.PALISADE, T.POST, T.CHIMNEY, T.AWNING, T.DOOR_SHOP, T.WATER, T.WATER_B, T.STONE, T.STONE_FRONT, T.STONE_DOOR, T.STONE_WIN, T.FENCE, T.DOOR_TL, T.DOOR_TR, T.DOOR_ML, T.DOOR_MR, T.DOOR_BL, T.DOOR_BR, T.SDOOR_TL, T.SDOOR_TR, T.SDOOR_ML, T.SDOOR_MR, T.SDOOR_BL, T.SDOOR_BR]) {
    tileProps.push({
      id: id - 1,
      properties: [{ name: 'collide', type: 'bool', value: true }],
    });
  }

  return {
    compressionlevel: -1,
    width: MAP_W,
    height: map.ground.length,
    tilewidth: TILE,
    tileheight: TILE,
    infinite: false,
    orientation: 'orthogonal',
    renderorder: 'right-down',
    type: 'map',
    tiledversion: '1.10.2',
    version: '1.10',
    nextlayerid: 5,
    nextobjectid: oid,
    properties: [
      { name: 'zoneId', type: 'string', value: 'hoffender' },
      { name: 'townName', type: 'string', value: 'Hoffender' },
      { name: 'wildsName', type: 'string', value: 'Frostmere Wilds' },
    ],
    tilesets: [
      {
        columns: tileset.columns,
        firstgid: 1,
        image: 'tiles.png',
        imageheight: tileset.imageHeight,
        imagewidth: tileset.imageWidth,
        margin: tileset.margin,
        spacing: tileset.spacing,
        name: 'hoffender',
        tilecount: tileset.columns * tileset.rows,
        tilewidth: TILE,
        tileheight: TILE,
        tiles: tileProps,
      },
    ],
    layers: [
      layer(1, 'ground', 'tilelayer', {
        width: MAP_W,
        height: map.ground.length,
        data: flatten(map.ground),
      }),
      layer(2, 'collision', 'tilelayer', {
        width: MAP_W,
        height: map.ground.length,
        visible: false,
        data: flatten(map.solid),
      }),
      layer(3, 'safe', 'tilelayer', {
        width: MAP_W,
        height: map.ground.length,
        visible: false,
        data: flatten(map.safe),
      }),
      layer(4, 'objects', 'objectgroup', {
        draworder: 'topdown',
        objects,
      }),
    ],
  };
}

function renderPreview(map, tileset, props, actors) {
  const scaleN = 2;
  const worldH = map.ground.length;
  const world = createImage(MAP_W * TILE, worldH * TILE);
  for (let y = 0; y < worldH; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const id = map.ground[y][x];
      const tile = tileset.tiles.get(id);
      if (tile) blit(world, tile, x * TILE, y * TILE);
    }
  }
  const propImgs = {
    tree: drawTree(0),
    tree_b: drawTree(1),
    rock: drawRock(true),
    rock_small: drawRock(false),
    barrel: drawBarrel(),
    crate: drawCrate(),
    well: drawWell(),
    firepit: drawFire(0),
    banner: drawBanner(),
    sign_inn: drawSign('inn'),
    sign_shop: drawSign('shop'),
    sign_hall: drawSign('hall'),
    sign_wilds: drawSign('wilds'),
    stump: drawStump(),
    bush: drawBush(),
  };
  for (const o of map.objects) {
    if (o.kind !== 'prop') continue;
    const img = propImgs[o.sprite];
    if (!img) continue;
    const meta = props.meta[o.sprite];
    blit(world, img, o.x - meta.anchorX, o.y - meta.anchorY);
  }
  // Mark actors as small dots so layout can be checked. Real sprites are in the contact sheet.
  for (const o of map.objects) {
    if (o.kind === 'prop') continue;
    const c = o.kind === 'mob' ? hex('#c44840') : o.kind === 'npc' ? hex('#e6c15a') : hex('#3c86a2');
    for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) world.set(o.x + x, o.y + y, c);
  }
  return scale(world, scaleN);
}

function contact(actors, props) {
  const a = scale(actors.sheet, 4);
  const p = scale(props.sheet, 3);
  const out = createImage(Math.max(a.w, p.w), a.h + p.h + 8);
  out.fill(hex('#8aa0b0'));
  blit(out, a, 0, 0);
  blit(out, p, 0, a.h + 8);
  return out;
}

function drawIcon(size) {
  const img = createImage(size, size);
  img.fill(hex('#1c1418'));
  const rand = mulberry(3);
  for (let i = 0; i < size * 2; i++) {
    img.set(Math.floor(rand() * size), Math.floor(rand() * size), hex('#2a333c'));
  }
  // A red banner and a simple axe. Original mark, not a copied crest.
  const u = size / 32;
  const px = (x, y, c) => {
    for (let yy = 0; yy < u; yy++) for (let xx = 0; xx < u; xx++) img.set(Math.floor(x * u + xx), Math.floor(y * u + yy), c);
  };
  for (let y = 4; y <= 28; y++) {
    px(6, y, WOOD);
    px(7, y, WOOD_HI);
  }
  for (let y = 6; y <= 20; y++) {
    for (let x = 8; x <= 22; x++) px(x, y, x === 8 || x === 22 || y === 6 || y === 20 ? RED_DARK : RED);
  }
  for (let x = 12; x <= 16; x++) px(x, 10, SNOW_HI);
  px(11, 11, SNOW_HI);
  px(17, 11, SNOW_HI);
  for (let x = 12; x <= 16; x++) px(x, 15, SNOW_HI);
  px(11, 16, SNOW_HI);
  px(17, 16, SNOW_HI);
  // Axe head at the top of a second haft
  for (let y = 18; y <= 27; y++) px(24, y, WOOD);
  for (let y = 14; y <= 18; y++) for (let x = 21; x <= 27; x++) px(x, y, y === 16 ? hex('#e6c15a') : IRON);
  return img;
}

function iconCanvas() {
  return createImage(16, 16);
}

function drawGearIcons() {
  const items = JSON.parse(readFileSync(join(root, 'src', 'content', 'items.json'), 'utf8'));
  const frames = {};
  for (const item of items) {
    if (!item.teaches && !['bone_staff', 'skinning_knife', 'paired_hatchets', 'hand_wraps'].includes(item.id)) continue;
    const img = iconCanvas();
    if (item.teaches) {
      for (let y = 2; y <= 13; y++) for (let x = 4; x <= 11; x++) img.set(x, y, hex('#e7d3a4'));
      for (let y = 4; y <= 11; y++) img.set(6, y, hex('#6b4428'));
      img.set(8, 3, hex('#a33b32'));
    } else if (item.grip === 'staff' || item.id === 'bone_staff') {
      for (let y = 1; y <= 14; y++) img.set(8, y, hex('#e6dcc8'));
      img.set(7, 2, hex('#8d97a3'));
      img.set(9, 2, hex('#8d97a3'));
    } else if (item.id === 'skinning_knife') {
      for (let i = 0; i < 10; i++) img.set(3 + i, 12 - i, hex('#d7dee6'));
      img.set(4, 13, hex('#8d5a38'));
    } else if (item.id === 'paired_hatchets') {
      for (let i = 0; i < 8; i++) img.set(3 + i, 4 + i, hex('#8d5a38'));
      for (let i = 0; i < 8; i++) img.set(12 - i, 4 + i, hex('#8d5a38'));
      img.set(3, 3, hex('#c5ced6'));
      img.set(12, 3, hex('#c5ced6'));
    } else {
      for (let y = 6; y <= 10; y++) for (let x = 3; x <= 12; x++) img.set(x, y, hex('#d7cbb8'));
      img.set(5, 8, hex('#8d5340'));
      img.set(10, 8, hex('#8d5340'));
    }
    frames[item.id] = img;
  }
  return frames;
}

function drawArmorIcons() {
  const armor = JSON.parse(readFileSync(join(root, 'src', 'content', 'armor.json'), 'utf8'));
  const colors = {
    plate: ['#5c4a32', '#8d7a58', '#d4b46a'],
    chain: ['#4e585e', '#8b97a3', '#d5dee6'],
    leather: ['#4a2c22', '#8a5438', '#c48462'],
    cloth: ['#6a3840', '#b8a48c', '#e4d8c8'],
  };
  const frames = {};
  for (const item of armor) {
    const img = iconCanvas();
    const fill = hex(colors[item.armorType][item.tier - 1]);
    const edge = hex('#1c1418');
    const put = (x, y, c) => img.set(x, y, c);
    const box = (x, y, w, h, c) => {
      for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) put(x + xx, y + yy, yy === 0 || xx === 0 || yy === h - 1 || xx === w - 1 ? edge : c);
    };
    if (item.slot === 'head') {
      box(4, 3, 8, 7, fill);
      put(6, 6, edge);
      put(9, 6, edge);
    } else if (item.slot === 'chest') {
      box(4, 3, 8, 9, fill);
      put(7, 5, edge);
      put(8, 5, edge);
    } else if (item.slot === 'hands') {
      box(2, 6, 5, 5, fill);
      box(9, 6, 5, 5, fill);
    } else if (item.slot === 'legs') {
      box(4, 3, 3, 10, fill);
      box(9, 3, 3, 10, fill);
    } else if (item.slot === 'feet') {
      box(3, 8, 4, 4, fill);
      box(9, 8, 4, 4, fill);
    } else if (item.armorType === 'cloth') {
      box(3, 5, 10, 6, fill);
    } else {
      box(4, 2, 8, 11, fill);
      put(8, 6, hex('#e6c15a'));
    }
    for (let i = 0; i < item.tier; i++) put(13, 12 + i, hex('#e6c15a'));
    frames[item.id] = img;
  }
  return frames;
}

function drawItemIcons() {
  const frames = {
    wolf_pelt: (() => {
      const img = iconCanvas();
      for (let y = 3; y <= 12; y++) {
        for (let x = 2; x <= 13; x++) {
          const dx = (x - 7) / 6;
          const dy = (y - 8) / 5;
          if (dx * dx + dy * dy > 1) continue;
          img.set(x, y, x < 7 ? hex('#8a5a3c') : hex('#5c3a28'));
        }
      }
      img.set(6, 6, hex('#c48a58'));
      img.set(9, 9, hex('#3a2418'));
      return img;
    })(),
    wolf_tooth: (() => {
      const img = iconCanvas();
      for (let i = 0; i < 8; i++) {
        img.set(5 + i, 3 + i, hex('#f4f7fb'));
        img.set(6 + i, 3 + i, hex('#d7dee6'));
      }
      img.set(12, 11, hex('#8b97a3'));
      return img;
    })(),
    cracked_fang: (() => {
      const img = iconCanvas();
      for (let i = 0; i < 10; i++) {
        img.set(3 + i, 2 + i, hex('#f4f0e6'));
        img.set(4 + i, 2 + i, hex('#e6c15a'));
      }
      img.set(8, 7, hex('#1c1418'));
      img.set(9, 8, hex('#1c1418'));
      return img;
    })(),
    stringy_meat: (() => {
      const img = iconCanvas();
      for (let y = 4; y <= 12; y++) {
        for (let x = 3; x <= 12; x++) {
          if ((x + y) % 5 === 0) continue;
          img.set(x, y, y < 8 ? hex('#a33b32') : hex('#6e2424'));
        }
      }
      img.set(6, 6, hex('#f3eee4'));
      return img;
    })(),
    wool_bandage: (() => {
      const img = iconCanvas();
      for (let y = 4; y <= 11; y++) for (let x = 3; x <= 12; x++) img.set(x, y, hex('#f4f7fb'));
      for (let x = 3; x <= 12; x++) img.set(x, 7, hex('#a33b32'));
      for (let x = 3; x <= 12; x++) img.set(x, 8, hex('#a33b32'));
      return img;
    })(),
    trail_ration: (() => {
      const img = iconCanvas();
      for (let y = 5; y <= 12; y++) for (let x = 3; x <= 12; x++) img.set(x, y, hex('#c48a58'));
      for (let x = 4; x <= 11; x++) img.set(x, 4, hex('#e6c15a'));
      img.set(6, 8, hex('#5c3a28'));
      img.set(9, 9, hex('#5c3a28'));
      return img;
    })(),
    worn_axe: (() => {
      const img = iconCanvas();
      for (let i = 2; i <= 13; i++) img.set(i, i, hex('#8d5a38'));
      for (let y = 2; y <= 7; y++) for (let x = 2; x <= 8; x++) img.set(x, y, y === 4 ? hex('#e6c15a') : hex('#8b97a3'));
      return img;
    })(),
    bearded_handaxe: (() => {
      const img = iconCanvas();
      for (let i = 3; i <= 13; i++) img.set(i, 16 - i, hex('#5c3a26'));
      for (let y = 2; y <= 8; y++) for (let x = 2; x <= 9; x++) img.set(x, y, y > 5 ? hex('#d7dee6') : hex('#8b97a3'));
      return img;
    })(),
    ash_staff: (() => {
      const img = iconCanvas();
      for (let y = 3; y <= 14; y++) {
        img.set(7, y, hex('#8d5a38'));
        img.set(8, y, hex('#d09a62'));
      }
      for (let y = 1; y <= 4; y++) for (let x = 6; x <= 9; x++) img.set(x, y, hex('#b7e3ff'));
      img.set(7, 2, hex('#f4fbff'));
      return img;
    })(),
    yarrow_draught: (() => {
      const img = iconCanvas();
      for (let y = 2; y <= 5; y++) for (let x = 7; x <= 8; x++) img.set(x, y, hex('#6b4e3a'));
      for (let y = 6; y <= 13; y++) for (let x = 5; x <= 10; x++) img.set(x, y, y < 9 ? hex('#8eae72') : hex('#3e6b40'));
      img.set(6, 8, hex('#d7f0c0'));
      return img;
    })(),
    wolf_helm: (() => {
      const img = iconCanvas();
      for (let y = 3; y <= 12; y++) for (let x = 3; x <= 12; x++) img.set(x, y, hex('#8a8178'));
      img.set(6, 2, hex('#c8c0b6'));
      img.set(9, 2, hex('#c8c0b6'));
      img.set(5, 8, hex('#6a3030'));
      img.set(6, 8, hex('#6a3030'));
      img.set(9, 8, hex('#6a3030'));
      img.set(10, 8, hex('#6a3030'));
      img.set(7, 6, hex('#1c1418'));
      img.set(8, 6, hex('#1c1418'));
      return img;
    })(),
  };
  Object.assign(frames, drawArmorIcons(), drawGearIcons());
  const order = Object.keys(frames);
  const sheet = createImage(order.length * 16, 16);
  const meta = {};
  order.forEach((id, index) => {
    blit(sheet, frames[id], index * 16, 0);
    meta[id] = { x: index * 16, y: 0, w: 16, h: 16 };
  });
  return { sheet, meta: { sheetW: sheet.w, sheetH: sheet.h, frames: meta } };
}

async function main() {
  mkdirSync(assetDir, { recursive: true });
  mkdirSync(join(publicDir, 'icons'), { recursive: true });
  const tileset = buildTileset();
  const actors = buildActors();
  const hero = buildHeroArt();
  const props = buildProps();
  const map = buildMap(tileset);
  const tmj = buildTmj(map, tileset);
  const atlas = { actors: actors.meta, props: props.meta, hero: hero.field.meta, portrait: hero.portrait.meta };
  const itemIcons = drawItemIcons();

  await writePng(join(assetDir, 'tiles.png'), tileset.sheet);
  await writePng(join(assetDir, 'icons.png'), itemIcons.sheet);
  writeFileSync(join(assetDir, 'icons.json'), JSON.stringify(itemIcons.meta, null, 2));
  await writePng(join(assetDir, 'actors.png'), actors.sheet);
  await writePng(join(assetDir, 'hero.png'), hero.field.sheet);
  await writePng(join(assetDir, 'portrait.png'), hero.portrait.sheet);
  await writePng(join(assetDir, 'props.png'), props.sheet);
  writeFileSync(join(assetDir, 'hoffender.tmj'), JSON.stringify(tmj));
  writeFileSync(join(assetDir, 'atlas.json'), JSON.stringify(atlas, null, 2));
  await writePng(join(publicDir, 'favicon.png'), scale(drawIcon(32), 1));
  await writePng(join(publicDir, 'icons', 'apple-touch-icon.png'), drawIcon(180));
  await writePng(join(publicDir, 'icons', 'icon-192.png'), drawIcon(192));
  await writePng(join(publicDir, 'icons', 'icon-512.png'), drawIcon(512));

  const previewDir = '/tmp/aldmoor-art';
  mkdirSync(previewDir, { recursive: true });
  await writePng(join(previewDir, 'map.png'), renderPreview(map, tileset, props, actors));
  await writePng(join(previewDir, 'sprites.png'), contact(actors, props));
  await writePng(join(previewDir, 'tiles.png'), scale(tileset.sheet, 4));
  console.log(`map ${MAP_W}x${MAP_H}, objects ${map.objects.length}, tiles ${tileset.imageWidth}x${tileset.imageHeight}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
