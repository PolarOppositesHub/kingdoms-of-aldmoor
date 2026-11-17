/**
 * Race architecture. Each culture has its own silhouette.
 * The door column is still two tiles wide and at least three tall, on the tile you walk through.
 */
import { T } from './frostmere-map.mjs';

const STYLE = {
  human: ['HUMAN_WALL', 'HUMAN_FRONT', 'HUMAN_WIN', 'HUMAN_ROOF', 'HUMAN_EAVE', 'HUMAN_ROOFN', 'HUMAN_DTL', 'HUMAN_DTR', 'HUMAN_DML', 'HUMAN_DMR', 'HUMAN_DBL', 'HUMAN_DBR'],
  elf: ['ELF_WALL', 'ELF_FRONT', 'ELF_WIN', 'ELF_ROOF', 'ELF_EAVE', 'ELF_ROOFN', 'ELF_DTL', 'ELF_DTR', 'ELF_DML', 'ELF_DMR', 'ELF_DBL', 'ELF_DBR'],
  wood: ['WOOD_WALL', 'WOOD_FRONT', 'WOOD_WIN', 'WOOD_ROOF', 'WOOD_EAVE', 'WOOD_ROOFN', 'WOOD_DTL', 'WOOD_DTR', 'WOOD_DML', 'WOOD_DMR', 'WOOD_DBL', 'WOOD_DBR'],
  dwarf: ['DWARF_WALL', 'DWARF_FRONT', 'DWARF_WIN', 'DWARF_ROOF', 'DWARF_EAVE', 'DWARF_ROOFN', 'DWARF_DTL', 'DWARF_DTR', 'DWARF_DML', 'DWARF_DMR', 'DWARF_DBL', 'DWARF_DBR'],
  ogre: ['OGRE_WALL', 'OGRE_FRONT', 'OGRE_WIN', 'OGRE_ROOF', 'OGRE_EAVE', 'OGRE_ROOFN', 'OGRE_DTL', 'OGRE_DTR', 'OGRE_DML', 'OGRE_DMR', 'OGRE_DBL', 'OGRE_DBR'],
};

function tilesOf(style) {
  const names = STYLE[style];
  if (!names) return null;
  const [wall, front, win, roof, eave, roofN, dtl, dtr, dml, dmr, dbl, dbr] = names.map((name) => T[name]);
  return { wall, front, win, roof, eave, roofN, dtl, dtr, dml, dmr, dbl, dbr };
}

function put(g, solid, grid, x, y, tile, blocked) {
  if (!g[y] || g[y][x] === undefined) return false;
  g[y][x] = tile;
  solid[y][x] = blocked ? 1 : 0;
  if (grid?.[y]) grid[y][x] = 0;
  return true;
}

function stampDoor(g, solid, grid, doorX, doorY, look, bands, enter) {
  const top = doorY - (bands.length - 1);
  bands.forEach((band, index) => {
    const walk = enter && index === bands.length - 1;
    for (const [dx, side] of [[0, 'l'], [1, 'r']]) {
      put(g, solid, grid, doorX + dx, top + index, look[`d${band}${side}`], !walk);
    }
  });
}

function porch(g, solid, grid, doorX, doorY) {
  const x = doorX + 2;
  if (g[doorY]?.[x] !== undefined && solid[doorY][x]) put(g, solid, grid, x, doorY, T.STEP, false);
  const south = doorY + 1;
  if (!g[south]) return;
  for (const dx of [0, 1]) {
    const tile = g[south][doorX + dx];
    if (tile === undefined || solid[south][doorX + dx]) continue;
    if (tile === T.WATER || tile === T.WATER_B || tile === T.DOCK) continue;
    put(g, solid, grid, doorX + dx, south, T.STEP, false);
  }
}

function resolve(x, y, w, h, opts) {
  const doorLeft = opts.doorX !== undefined ? opts.doorX - x : Math.floor((w - 2) / 2);
  if (h < 6 || doorLeft < 0 || doorLeft + 1 >= w) throw new Error(`facade ${x},${y} ${w}x${h} has no room for a door`);
  return { doorX: x + doorLeft, doorY: y + h - 1, enter: opts.enter === true };
}

function stampHuman(g, solid, grid, x, y, w, h, look, opts) {
  const { doorX, doorY, enter } = resolve(x, y, w, h, opts);
  const mid = Math.floor(w / 2);
  for (let yy = 0; yy < 3; yy++) {
    const inset = 2 - yy;
    for (let xx = inset; xx < w - inset; xx++) {
      const tile = yy === 0 ? look.roofN : yy === 2 ? look.eave : look.roof;
      put(g, solid, grid, x + xx, y + yy, tile, true);
    }
  }
  put(g, solid, grid, x + Math.max(0, mid - 2), y, T.BANNER, true);
  for (let yy = 3; yy < h; yy++) {
    for (let xx = 0; xx < w; xx++) {
      const onDoor = xx >= doorX - x && xx <= doorX - x + 1 && y + yy >= doorY - 2;
      if (onDoor) continue;
      const window = yy === h - 2 && (xx === 1 || xx === w - 2);
      put(g, solid, grid, x + xx, y + yy, window ? look.win : yy === h - 1 ? look.front : look.wall, true);
    }
  }
  stampDoor(g, solid, grid, doorX, doorY, look, ['t', 'm', 'b'], enter);
  porch(g, solid, grid, doorX, doorY);
  return { x, y, w, h, doorX, doorY, enter };
}

function stampElf(g, solid, grid, x, y, w, h, look, opts) {
  const { doorX, doorY, enter } = resolve(x, y, w, h, opts);
  const roofRows = h - 3;
  for (let yy = 0; yy < roofRows; yy++) {
    const inset = Math.max(0, roofRows - 1 - yy);
    for (let xx = inset; xx < w - inset; xx++) {
      const peak = yy === 0 && xx === Math.floor(w / 2);
      put(g, solid, grid, x + xx, y + yy, peak ? T.SPIRE : yy === roofRows - 1 ? look.eave : look.roof, true);
    }
  }
  for (let yy = roofRows; yy < h; yy++) {
    for (let xx = 1; xx < w - 1; xx++) {
      const onDoor = xx >= doorX - x && xx <= doorX - x + 1 && y + yy >= doorY - 2;
      if (onDoor) continue;
      const slit = xx === 1 && yy > roofRows && yy < h - 1;
      put(g, solid, grid, x + xx, y + yy, slit ? look.win : look.wall, true);
    }
    put(g, solid, grid, x, y + yy, look.wall, true);
    put(g, solid, grid, x + w - 1, y + yy, look.wall, true);
  }
  stampDoor(g, solid, grid, doorX, doorY, look, ['t', 'm', 'b'], enter);
  porch(g, solid, grid, doorX, doorY);
  return { x, y, w, h, doorX, doorY, enter };
}

function stampWood(g, solid, grid, x, y, w, h, look, opts) {
  const { doorX, doorY, enter } = resolve(x, y, w, h, opts);
  const trunkL = Math.max(0, doorX - x - 1);
  const trunkR = Math.min(w - 1, doorX - x + 2);
  for (let yy = 0; yy < h; yy++) {
    for (let xx = trunkL; xx <= trunkR; xx++) {
      const onDoor = xx >= doorX - x && xx <= doorX - x + 1 && y + yy >= doorY - 2;
      if (onDoor) continue;
      put(g, solid, grid, x + xx, y + yy, look.wall, true);
    }
  }
  for (let yy = 0; yy < 3; yy++) {
    const spread = 3 - yy;
    for (let xx = trunkL - spread; xx <= trunkR + spread; xx++) {
      if (xx < -1 || xx > w) continue;
      const edge = xx === trunkL - spread || xx === trunkR + spread;
      if ((xx + yy) % 3 === 0 && edge) continue;
      put(g, solid, grid, x + xx, y + yy, T.LEAF, true);
    }
  }
  stampDoor(g, solid, grid, doorX, doorY, look, ['t', 'm', 'b'], enter);
  for (const dx of [-2, -1, 2, 3]) {
    put(g, solid, grid, doorX + dx, doorY, T.ROPE, false);
  }
  const south = doorY + 1;
  for (const dx of [0, 1, 2]) put(g, solid, grid, doorX + dx, south, T.ROPE, false);
  return { x, y, w, h, doorX, doorY, enter };
}

function stampDwarf(g, solid, grid, x, y, w, h, look, opts) {
  const { doorX, doorY, enter } = resolve(x, y, w, h, opts);
  const sky = [1, 0, 2, 0, 1, 2, 0, 1];
  for (let xx = 0; xx < w; xx++) {
    const start = sky[xx % sky.length];
    for (let yy = start; yy < h; yy++) {
      const onDoor = xx >= doorX - x && xx <= doorX - x + 1 && y + yy >= doorY - 2;
      if (onDoor) continue;
      const glow = xx === doorX - x - 2 && yy === h - 3;
      const chimney = xx === w - 2 && yy < 3;
      const tile = glow ? look.win : chimney ? (yy === start ? T.GLOW : look.roof) : look.wall;
      put(g, solid, grid, x + xx, y + yy, tile, true);
    }
  }
  put(g, solid, grid, doorX, doorY - 3, T.RUNE, true);
  stampDoor(g, solid, grid, doorX, doorY, look, ['t', 'm', 'b'], enter);
  porch(g, solid, grid, doorX, doorY);
  return { x, y, w, h, doorX, doorY, enter };
}

function stampOgre(g, solid, grid, x, y, w, h, look, opts) {
  const { doorX, doorY, enter } = resolve(x, y, w, h, opts);
  const bands = ['t', 'm', 'm', 'b'];
  const doorTop = doorY - (bands.length - 1);
  for (let yy = 0; yy < h; yy++) {
    const row = y + yy;
    const span = yy < doorTop - y ? yy + 1 : Math.floor(w / 2);
    const left = Math.max(0, Math.floor(w / 2) - span);
    const right = Math.min(w - 1, Math.floor(w / 2) + span);
    for (let xx = left; xx <= right; xx++) {
      const onDoor = xx >= doorX - x && xx <= doorX - x + 1 && row >= doorTop;
      if (onDoor) continue;
      const pole = (xx === left || xx === right) && row >= doorTop;
      put(g, solid, grid, x + xx, row, pole ? T.BONE : T.HIDE, true);
    }
  }
  stampDoor(g, solid, grid, doorX, doorY, look, bands, enter);
  put(g, solid, grid, doorX - 2, doorY - 1, T.SKULL, true);
  put(g, solid, grid, doorX - 2, doorY, T.BONE, true);
  porch(g, solid, grid, doorX, doorY);
  return { x, y, w, h, doorX, doorY, enter };
}

const STAMP = { human: stampHuman, elf: stampElf, wood: stampWood, dwarf: stampDwarf, ogre: stampOgre };

export function stampBuilding(g, solid, scenery, x, y, w, h, style, opts = {}) {
  const look = tilesOf(style);
  const draw = STAMP[style];
  if (!look || !draw) throw new Error(`unknown building style ${style}`);
  const grid = scenery?.grid ?? scenery;
  return draw(g, solid, grid, x, y, w, h, look, opts);
}

/** Town floor. Skips water and anything already solid. */
export function layGround(g, solid, x0, y0, x1, y1, tile, scatter) {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (!g[y] || g[y][x] === undefined || solid[y][x]) continue;
      const cur = g[y][x];
      if (cur === T.WATER || cur === T.WATER_B || cur === T.DOCK) continue;
      const speckle = scatter && (x * 13 + y * 7) % 11 === 0;
      g[y][x] = speckle ? scatter : tile;
    }
  }
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
