/**
 * Stamps a roofed building. An enterable hall puts its dark doorway on the tiles the player walks through.
 * A closed hall has windows and a face, and no opening.
 */
import { T } from './frostmere-map.mjs';

const STYLE = {
  human: ['HUMAN_WALL', 'HUMAN_FRONT', 'HUMAN_WIN', 'HUMAN_ROOF', 'HUMAN_EAVE', 'HUMAN_ROOFN', 'HUMAN_DTL', 'HUMAN_DTR', 'HUMAN_DML', 'HUMAN_DMR', 'HUMAN_DBL', 'HUMAN_DBR'],
  elf: ['ELF_WALL', 'ELF_FRONT', 'ELF_WIN', 'ELF_ROOF', 'ELF_EAVE', 'ELF_ROOFN', 'ELF_DTL', 'ELF_DTR', 'ELF_DML', 'ELF_DMR', 'ELF_DBL', 'ELF_DBR'],
  wood: ['WOOD_WALL', 'WOOD_FRONT', 'WOOD_WIN', 'WOOD_ROOF', 'WOOD_EAVE', 'WOOD_ROOFN', 'WOOD_DTL', 'WOOD_DTR', 'WOOD_DML', 'WOOD_DMR', 'WOOD_DBL', 'WOOD_DBR'],
  dwarf: ['DWARF_WALL', 'DWARF_FRONT', 'DWARF_WIN', 'DWARF_ROOF', 'DWARF_EAVE', 'DWARF_ROOFN', 'DWARF_DTL', 'DWARF_DTR', 'DWARF_DML', 'DWARF_DMR', 'DWARF_DBL', 'DWARF_DBR'],
  ogre: ['OGRE_WALL', 'OGRE_FRONT', 'OGRE_WIN', 'OGRE_ROOF', 'OGRE_EAVE', 'OGRE_ROOFN', 'OGRE_DTL', 'OGRE_DTR', 'OGRE_DML', 'OGRE_DMR', 'OGRE_DBL', 'OGRE_DBR'],
  barbarian: null,
};

function tilesOf(style) {
  const names = STYLE[style];
  if (!names) return null;
  const [wall, front, win, roof, eave, roofN, dtl, dtr, dml, dmr, dbl, dbr] = names.map((name) => T[name]);
  return { wall, front, win, roof, eave, roofN, dtl, dtr, dml, dmr, dbl, dbr };
}

/**
 * @param {number[][]} g
 * @param {number[][]} solid
 * @param {{grid?: number[][]} | number[][] | null} scenery
 */
export function stampBuilding(g, solid, scenery, x, y, w, h, style, opts = {}) {
  const look = tilesOf(style);
  if (!look) throw new Error(`unknown building style ${style}`);
  const grid = scenery?.grid ?? scenery;
  const roofH = Math.max(2, h - 4);
  const enter = opts.enter === true;
  const doorLeft = opts.doorX !== undefined ? opts.doorX - x : Math.floor((w - 2) / 2);
  const doorTop = h - 3;
  if (h < 6 || doorLeft < 1 || doorLeft + 2 >= w) throw new Error(`facade ${style} ${x},${y} ${w}x${h} has no room for a door`);
  for (let yy = 0; yy < h; yy++) {
    for (let xx = 0; xx < w; xx++) {
      const X = x + xx;
      const Y = y + yy;
      if (!g[Y] || g[Y][X] === undefined) continue;
      if (grid?.[Y]) grid[Y][X] = 0;
      solid[Y][X] = 1;
      const onDoor = enter && xx >= doorLeft && xx < doorLeft + 2 && yy >= doorTop;
      if (yy < roofH) {
        let tile = look.roof;
        if (yy === roofH - 1) tile = look.eave;
        else if (yy === 0) tile = look.roofN;
        if (style === 'elf' && xx === Math.floor(w / 2) && yy === 0) tile = T.SPIRE;
        if (style === 'dwarf' && yy === 1 && xx === 2) tile = T.RUNE;
        if (style === 'wood' && (xx === 1 || xx === w - 2) && yy < 2) tile = T.TRUNK;
        g[Y][X] = tile;
      } else if (onDoor) {
        const band = yy === doorTop ? 't' : yy === h - 1 ? 'b' : 'm';
        const side = xx === doorLeft ? 'l' : 'r';
        const key = `d${band}${side}`;
        g[Y][X] = look[key];
        if (yy === h - 1) solid[Y][X] = 0;
      } else if (!enter && xx >= doorLeft && xx < doorLeft + 2 && yy >= doorTop) {
        const lintel = yy === doorTop;
        const left = xx === doorLeft;
        g[Y][X] = lintel ? (left ? T.SEAL_TL : T.SEAL_TR) : left ? T.SEAL_L : T.SEAL_R;
      } else if (!enter && yy === h - 2 && xx > 1 && xx < w - 2 && xx % 3 === 1) {
        g[Y][X] = look.win;
      } else if (yy === h - 2 && (xx === 1 || xx === w - 2)) {
        g[Y][X] = look.win;
      } else if (yy === h - 1) {
        g[Y][X] = look.front;
      } else if (style === 'wood' && (xx === 0 || xx === w - 1)) {
        g[Y][X] = T.TRUNK;
      } else if (style === 'ogre' && yy === h - 2 && xx === Math.floor(w / 2)) {
        g[Y][X] = T.TRUNK;
      } else {
        g[Y][X] = look.wall;
      }
    }
  }
  if (style === 'wood' && grid) {
    const bridgeY = y + h;
    for (let xx = doorLeft; xx < doorLeft + 2; xx++) {
      const X = x + xx;
      if (g[bridgeY]?.[X] !== undefined && solid[bridgeY][X] === 0) {
        g[bridgeY][X] = T.ROPE;
        if (grid[bridgeY]) grid[bridgeY][X] = 0;
      }
    }
  }
  const doorX = x + doorLeft;
  const doorY = y + h - 1;
  const lampX = doorX - 1;
  if (g[doorY - 2]?.[lampX] !== undefined) g[doorY - 2][lampX] = T.LANTERN;
  const porchX = doorX + 2;
  if (g[doorY]?.[porchX] !== undefined && solid[doorY][porchX]) {
    solid[doorY][porchX] = 0;
    g[doorY][porchX] = T.STEP;
    if (grid?.[doorY]) grid[doorY][porchX] = 0;
  }
  const south = y + h;
  if (style !== 'wood' && g[south]) {
    for (const xx of [doorLeft, doorLeft + 1]) {
      const X = x + xx;
      if (g[south][X] === undefined || solid[south][X]) continue;
      const tile = g[south][X];
      if (tile === T.WATER || tile === T.WATER_B || tile === T.DOCK) continue;
      g[south][X] = T.STEP;
      if (grid?.[south]) grid[south][X] = 0;
    }
  }
  return {
    x,
    y,
    w,
    h,
    doorX,
    doorY,
    enter,
  };
}

/** Timber posts on either side of a wall opening, and a stone step in the gap. */
export function frameGate(g, solid, x, y, w, h) {
  const mark = (px, py) => {
    if (!g[py] || g[py][px] === undefined) return;
    if (!solid[py][px]) return;
    g[py][px] = T.GATE;
  };
  if (h <= 2) {
    for (let yy = y; yy < y + h; yy++) {
      mark(x - 1, yy);
      mark(x + w, yy);
    }
    for (let xx = x; xx < x + w; xx++) {
      if (g[y]?.[xx] !== undefined && !solid[y][xx]) g[y][xx] = T.STEP;
    }
  } else if (w <= 2) {
    for (let xx = x; xx < x + w; xx++) {
      mark(xx, y - 1);
      mark(xx, y + h);
    }
    for (let yy = y; yy < y + h; yy++) {
      if (g[yy]?.[x] !== undefined && !solid[yy][x]) g[yy][x] = T.STEP;
    }
  }
}
