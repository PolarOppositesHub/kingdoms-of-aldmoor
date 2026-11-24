/**
 * Extra houses, streets, and props inside a town that already has its halls.
 * Skips any footprint that is already solid, wet, or reserved.
 */
import { stampBuilding } from './buildings.mjs';

const PATH = 4;
const PATH_B = 5;
const FENCE = 32;
const LANTERN = 134;
const STEP = 127;
const WET = new Set([7, 8, 9, 53]);

export function roomFor(g, solid, road, x, y, w, h, reserved) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      if (!g[yy] || g[yy][xx] === undefined) return false;
      if (solid[yy][xx] || road?.[yy]?.[xx] || reserved.has(`${xx},${yy}`)) return false;
      if (WET.has(g[yy][xx])) return false;
    }
  }
  return true;
}

export function findOpen(g, solid, x, y, taken, radius = 8) {
  const ok = (tx, ty) => {
    const tile = g[ty]?.[tx];
    if (tile === undefined || solid[ty][tx] || taken.has(`${tx},${ty}`)) return false;
    if (WET.has(tile)) return false;
    return true;
  };
  if (ok(x, y)) return [x, y];
  for (let r = 1; r <= radius; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        if (ok(x + dx, y + dy)) return [x + dx, y + dy];
      }
    }
  }
  return null;
}

/** Cobble or path through open ground. Does not dig through a house. */
export function pave(g, solid, road, scenery, x0, y0, x1, y1, tile = PATH) {
  const grid = scenery?.grid ?? scenery;
  const xMin = Math.min(x0, x1);
  const xMax = Math.max(x0, x1);
  const yMin = Math.min(y0, y1);
  const yMax = Math.max(y0, y1);
  for (let y = yMin; y <= yMax; y++) {
    for (let x = xMin; x <= xMax; x++) {
      if (!g[y] || solid[y]?.[x] || WET.has(g[y][x])) continue;
      g[y][x] = (x + y) % 6 === 0 ? PATH_B : tile;
      if (road?.[y]) road[y][x] = 1;
      if (grid?.[y]) grid[y][x] = 0;
    }
  }
}

function lamp(g, solid, scenery, x, y) {
  if (!g[y] || solid[y][x] || WET.has(g[y][x])) return false;
  g[y][x] = LANTERN;
  solid[y][x] = 1;
  const grid = scenery?.grid ?? scenery;
  if (grid?.[y]) grid[y][x] = 0;
  return true;
}

function fenceAt(g, solid, scenery, x, y) {
  if (!g[y] || solid[y][x] || WET.has(g[y][x])) return;
  if (g[y][x] === PATH || g[y][x] === PATH_B) return;
  g[y][x] = FENCE;
  solid[y][x] = 1;
  const grid = scenery?.grid ?? scenery;
  if (grid?.[y]) grid[y][x] = 0;
}

/** A fenced garden. The inside stays walkable grass or moss. */
export function garden(g, solid, scenery, x, y, w, h, floor = 46) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      const edge = xx === x || yy === y || xx === x + w - 1 || yy === y + h - 1;
      if (edge) fenceAt(g, solid, scenery, xx, yy);
      else if (g[yy] && !solid[yy][xx] && !WET.has(g[yy][xx])) {
        g[yy][xx] = floor;
        const grid = scenery?.grid ?? scenery;
        if (grid?.[yy]) grid[yy][xx] = 0;
      }
    }
  }
  const gateX = x + Math.floor(w / 2);
  if (g[y + h - 1]?.[gateX] === FENCE) {
    solid[y + h - 1][gateX] = 0;
    g[y + h - 1][gateX] = STEP;
  }
}

/**
 * @param spec.houses {x,y,w,h}[]
 * @param spec.streets [x0,y0,x1,y1][]
 * @param spec.lamps [x,y][]
 * @param spec.gardens {x,y,w,h,floor?}[]
 * @param spec.reserved [x,y][] tiles that must stay open (quest givers, binds)
 * @param spec.min how many houses must land
 */
export function dressTown(g, solid, road, scenery, spec) {
  const reserved = new Set((spec.reserved ?? []).map(([x, y]) => `${x},${y}`));
  const placed = [];
  for (const house of spec.houses) {
    if (!roomFor(g, solid, road, house.x, house.y, house.w, house.h, reserved)) continue;
    if (spec.timber) spec.timber(g, solid, house);
    else stampBuilding(g, solid, scenery, house.x, house.y, house.w, house.h, spec.style, { enter: false });
    placed.push(house);
  }
  if (placed.length < (spec.min ?? 1)) {
    throw new Error(`${spec.name ?? spec.style} only placed ${placed.length} extra houses`);
  }
  for (const street of spec.streets ?? []) pave(g, solid, road, scenery, ...street);
  for (const plot of spec.gardens ?? []) garden(g, solid, scenery, plot.x, plot.y, plot.w, plot.h, plot.floor);
  for (const [x, y] of spec.lamps ?? []) lamp(g, solid, scenery, x, y);
  return placed;
}

export function dropProps(maker, g, solid, props) {
  const taken = new Set();
  for (const prop of props) {
    const spot = findOpen(g, solid, prop.x, prop.y, taken, 5);
    if (!spot) continue;
    taken.add(`${spot[0]},${spot[1]}`);
    if (prop.block) solid[spot[1]][spot[0]] = 1;
    maker.add('prop', prop.name, spot[0], spot[1], { sprite: prop.sprite });
  }
}

export function dropFolk(maker, g, solid, folk) {
  const taken = new Set();
  for (const person of folk) {
    const spot = findOpen(g, solid, person.x, person.y, taken, 6);
    if (!spot) throw new Error(`${person.id} has nowhere to stand near ${person.x},${person.y}`);
    taken.add(`${spot[0]},${spot[1]}`);
    const extra = { defId: person.id, sprite: person.sprite };
    if (person.ambient) extra.ambient = true;
    maker.add('npc', person.id, spot[0], spot[1], extra);
  }
}
