/**
 * Original pixel art for Kingdoms of Aldmoor.
 * Run: node tools/build-art.mjs
 *
 * Tiles, actors, props, the Hoffender map, and the app icons are drawn here.
 * Nothing in this file is traced from another game.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
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
const MAP_W = 60;
const MAP_H = 54;

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

function paintWindow() {
  const img = paintLogs(false);
  for (let y = 5; y <= 10; y++) {
    for (let x = 4; x <= 11; x++) {
      const edge = x === 4 || x === 11 || y === 5 || y === 10 || x === 7 || x === 8;
      img.set(x, y, edge ? WOOD_DARK : y < 8 ? WINDOW_HI : WINDOW);
    }
  }
  return img;
}

function paintDoor() {
  const img = paintLogs(true);
  for (let y = 3; y <= 12; y++) {
    for (let x = 5; x <= 10; x++) {
      const edge = x === 5 || x === 10 || y === 3;
      img.set(x, y, edge ? WOOD_DARK : y % 3 === 0 ? WOOD_SH : WOOD);
    }
  }
  img.set(9, 8, IRON);
  img.set(9, 9, IRON_SH);
  return img;
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

  const rows = Math.ceil(28 / COLS);
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
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 55; x < MAP_W; x++) {
      g[y][x] = (x + y) % 2 === 0 ? T.WATER : T.WATER_B;
      solid[y][x] = 1;
    }
    g[y][54] = T.ICE;
  }

  const stamp = (x, y, tile, blocked = false) => {
    if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return;
    g[y][x] = tile;
    if (blocked) solid[y][x] = 1;
  };

  const fillRect = (x, y, w, h, tile, blocked = false) => {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) stamp(xx, yy, tile, blocked);
    }
  };

  // Roads. Vertical avenue and the east-west street.
  fillRect(29, 6, 3, 43, T.PATH);
  fillRect(16, 35, 29, 3, T.PATH);
  // Porches in front of the north buildings.
  fillRect(18, 34, 8, 1, T.PATH_B);
  fillRect(36, 34, 8, 1, T.PATH_B);
  // Approach shoulders
  for (let y = 8; y < 24; y += 3) {
    stamp(28, y, T.PATH_B);
    stamp(32, y, T.PATH_B);
  }

  // Dock
  fillRect(52, 30, 3, 4, T.DOCK, false);
  solid[30][54] = 0;
  solid[31][54] = 0;
  solid[32][54] = 0;
  solid[33][54] = 0;
  g[30][54] = T.DOCK;
  g[31][54] = T.DOCK;
  g[32][54] = T.DOCK;
  g[33][54] = T.DOCK;

  // Palisade. Gate is a wide opening on the north wall where the road passes.
  const x0 = 14;
  const y0 = 24;
  const x1 = 46;
  const y1 = 50;
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
    const roofH = Math.max(2, Math.round(h * 0.45));
    const doorCol = x + Math.floor(w / 2);
    for (let yy = 0; yy < h; yy++) {
      for (let xx = 0; xx < w; xx++) {
        const X = x + xx;
        const Y = y + yy;
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
        } else if (yy === h - 1) {
          if (X === doorCol) g[Y][X] = opts.shop ? T.DOOR_SHOP : T.DOOR;
          else g[Y][X] = opts.shop ? T.AWNING : T.WALL_FRONT;
        } else {
          const mid = yy === roofH;
          const win = mid && (xx === 1 || xx === w - 2);
          g[Y][X] = win ? T.WINDOW : T.WALL;
        }
      }
    }
    if (opts.chimney) {
      const cx = x + 2;
      const cy = y + 1;
      if (cy < y + roofH - 1) g[cy][cx] = T.CHIMNEY;
    }
    return { doorX: doorCol, doorY: y + h - 1 };
  }

  const inn = building(16, 26, 10, 8, { chimney: true });
  const shop = building(34, 26, 10, 8, { shop: true });
  // Mead hall: the largest house, door facing the south yard. Interiors are not enterable.
  const meadHall = building(16, 40, 14, 8, { chimney: true });
  building(36, 40, 8, 7, {});

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
    { sprite: 'sign_inn', tx: 18, ty: 34 },
    { sprite: 'sign_shop', tx: 36, ty: 34 },
    { sprite: 'sign_hall', tx: meadHall.doorX - 3, ty: meadHall.doorY + 1 },
    { sprite: 'sign_wilds', tx: 26, ty: 22 },
    { sprite: 'barrel', tx: 41, ty: 34, solid: true },
    { sprite: 'barrel', tx: 53, ty: 31, solid: true },
    { sprite: 'crate', tx: 17, ty: 34, solid: true },
    { sprite: 'crate', tx: 40, ty: 47, solid: true },
    { sprite: 'stump', tx: 26, ty: 18, solid: true },
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

  // A couple of bushes inside the green, not on the road.
  props.push({ sprite: 'bush', tx: 20, ty: 46 });
  props.push({ sprite: 'bush', tx: 42, ty: 38 });

  for (const prop of props) {
    add('prop', prop.sprite, prop.tx, prop.ty, { sprite: prop.sprite });
    if (prop.solid) solid[prop.ty][prop.tx] = 1;
  }

  // Place names drawn over the map. Labels are not feet, so they may sit on a roof.
  add('label', 'Frostmere Wilds', 30, 20);
  add('label', 'Hoffender', 30, 33);
  add('label', 'Mead Hall', meadHall.doorX, meadHall.doorY - 3);

  // Border
  for (let x = 0; x < MAP_W; x++) {
    solid[0][x] = 1;
    solid[MAP_H - 1][x] = 1;
  }
  for (let y = 0; y < MAP_H; y++) {
    solid[y][0] = 1;
    solid[y][MAP_W - 1] = 1;
  }

  // Spawns must stand on open ground.
  for (const o of objects) {
    if (o.kind === 'prop' || o.kind === 'label') continue;
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
  for (const id of [T.WALL, T.WALL_FRONT, T.WINDOW, T.DOOR, T.ROOF, T.ROOF_B, T.ROOF_N, T.ROOF_W, T.ROOF_E, T.ROOF_NW, T.ROOF_NE, T.ROOF_EAVES, T.ROOF_SHOP, T.PALISADE, T.POST, T.CHIMNEY, T.AWNING, T.DOOR_SHOP, T.WATER, T.WATER_B]) {
    tileProps.push({
      id: id - 1,
      properties: [{ name: 'collide', type: 'bool', value: true }],
    });
  }

  return {
    compressionlevel: -1,
    width: MAP_W,
    height: MAP_H,
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
        height: MAP_H,
        data: flatten(map.ground),
      }),
      layer(2, 'collision', 'tilelayer', {
        width: MAP_W,
        height: MAP_H,
        visible: false,
        data: flatten(map.solid),
      }),
      layer(3, 'safe', 'tilelayer', {
        width: MAP_W,
        height: MAP_H,
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
  const world = createImage(MAP_W * TILE, MAP_H * TILE);
  for (let y = 0; y < MAP_H; y++) {
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

async function main() {
  mkdirSync(assetDir, { recursive: true });
  mkdirSync(join(publicDir, 'icons'), { recursive: true });
  const tileset = buildTileset();
  const actors = buildActors();
  const props = buildProps();
  const map = buildMap(tileset);
  const tmj = buildTmj(map, tileset);
  const atlas = { actors: actors.meta, props: props.meta };

  await writePng(join(assetDir, 'tiles.png'), tileset.sheet);
  await writePng(join(assetDir, 'actors.png'), actors.sheet);
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
