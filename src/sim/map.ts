import type { MapData, Spawn } from './types';

interface TiledProp {
  name: string;
  type?: string;
  value?: unknown;
}

interface TiledObject {
  name: string;
  type?: string;
  class?: string;
  x: number;
  y: number;
  properties?: TiledProp[];
}

interface TiledLayer {
  name: string;
  type: string;
  data?: number[];
  objects?: TiledObject[];
}

export interface TiledJson {
  width: number;
  height: number;
  tilewidth: number;
  layers: TiledLayer[];
  properties?: TiledProp[];
}

export function parseTiledMap(raw: TiledJson): MapData {
  const collisionLayer = raw.layers.find((layer) => layer.name === 'collision');
  const safeLayer = raw.layers.find((layer) => layer.name === 'safe');
  const objectLayer = raw.layers.find((layer) => layer.name === 'objects');
  if (!collisionLayer?.data || !safeLayer?.data) {
    throw new Error('Hoffender map is missing collision or safe data');
  }
  const collision = Uint8Array.from(collisionLayer.data, (cell) => (cell ? 1 : 0));
  const safe = Uint8Array.from(safeLayer.data, (cell) => (cell ? 1 : 0));
  const spawns: Spawn[] = [];
  let bind = { x: raw.tilewidth * 2, y: raw.tilewidth * 2 };
  for (const obj of objectLayer?.objects ?? []) {
    const props = Object.fromEntries((obj.properties ?? []).map((prop) => [prop.name, prop.value]));
    const kind = obj.type || obj.class || '';
    const spawn: Spawn = {
      kind,
      name: obj.name,
      x: obj.x,
      y: obj.y,
      defId: typeof props.defId === 'string' ? props.defId : obj.name,
      sprite: typeof props.sprite === 'string' ? props.sprite : obj.name,
      text: typeof props.text === 'string' ? props.text : undefined,
    };
    if (kind === 'bind') bind = { x: obj.x, y: obj.y };
    spawns.push(spawn);
  }
  const propValue = (name: string) => (raw.properties ?? []).find((prop) => prop.name === name);
  const zone = propValue('zoneId');
  const town = propValue('townName');
  const wilds = propValue('wildsName');
  return {
    width: raw.width,
    height: raw.height,
    tileWidth: raw.tilewidth,
    collision,
    safe,
    spawns,
    bind,
    zoneId: typeof zone?.value === 'string' ? zone.value : 'hoffender',
    townName: typeof town?.value === 'string' ? town.value : 'Hoffender',
    wildsName: typeof wilds?.value === 'string' ? wilds.value : 'Frostmere Wilds',
  };
}

/** Inside the palisade the place is Hoffender. Outside the gate it is the Frostmere Wilds. */
export function placeName(map: MapData, x: number, y: number): string {
  return isSafe(map, x, y) ? map.townName : map.wildsName;
}

export function inBounds(map: MapData, tx: number, ty: number): boolean {
  return tx >= 0 && ty >= 0 && tx < map.width && ty < map.height;
}

export function tileOf(map: MapData, x: number, y: number): { tx: number; ty: number } {
  return { tx: Math.floor(x / map.tileWidth), ty: Math.floor(y / map.tileWidth) };
}

export function solidTile(map: MapData, tx: number, ty: number): boolean {
  if (!inBounds(map, tx, ty)) return true;
  return map.collision[ty * map.width + tx] !== 0;
}

export function safeTile(map: MapData, tx: number, ty: number): boolean {
  if (!inBounds(map, tx, ty)) return false;
  return map.safe[ty * map.width + tx] !== 0;
}

export function isSafe(map: MapData, x: number, y: number): boolean {
  const { tx, ty } = tileOf(map, x, y);
  return safeTile(map, tx, ty);
}

export function bodyBlocked(map: MapData, x: number, y: number, rx: number, ry: number, forMob: boolean): boolean {
  const points: Array<[number, number]> = [
    [x - rx, y - ry],
    [x + rx, y - ry],
    [x - rx, y],
    [x + rx, y],
    [x, y],
  ];
  for (const [px, py] of points) {
    const { tx, ty } = tileOf(map, px, py);
    if (solidTile(map, tx, ty)) return true;
    if (forMob && safeTile(map, tx, ty)) return true;
  }
  return false;
}

export function tryMove(
  map: MapData,
  x: number,
  y: number,
  dx: number,
  dy: number,
  rx: number,
  ry: number,
  forMob: boolean,
): { x: number; y: number } {
  if (!bodyBlocked(map, x + dx, y + dy, rx, ry, forMob)) return { x: x + dx, y: y + dy };
  if (!bodyBlocked(map, x + dx, y, rx, ry, forMob)) return { x: x + dx, y };
  if (!bodyBlocked(map, x, y + dy, rx, ry, forMob)) return { x, y: y + dy };
  return { x, y };
}

export function lineOfSight(map: MapData, x0: number, y0: number, x1: number, y1: number): boolean {
  let { tx, ty } = tileOf(map, x0, y0);
  const end = tileOf(map, x1, y1);
  const dx = Math.abs(end.tx - tx);
  const dy = Math.abs(end.ty - ty);
  const sx = tx < end.tx ? 1 : -1;
  const sy = ty < end.ty ? 1 : -1;
  let err = dx - dy;
  while (tx !== end.tx || ty !== end.ty) {
    const doubled = 2 * err;
    if (doubled > -dy) {
      err -= dy;
      tx += sx;
    }
    if (doubled < dx) {
      err += dx;
      ty += sy;
    }
    if (tx === end.tx && ty === end.ty) break;
    if (solidTile(map, tx, ty)) return false;
  }
  return true;
}

interface PathNode {
  tx: number;
  ty: number;
  g: number;
  f: number;
  parent: number;
}

/** 8-connected A*. Goal tile is nudged to a nearby open tile if the point itself is blocked. */
export function findPath(
  map: MapData,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  forMob: boolean,
): { x: number; y: number }[] {
  const start = tileOf(map, fromX, fromY);
  let goal = tileOf(map, toX, toY);
  const openTile = (tx: number, ty: number) => {
    if (!inBounds(map, tx, ty)) return false;
    if (solidTile(map, tx, ty)) return false;
    if (forMob && safeTile(map, tx, ty)) return false;
    return true;
  };
  if (!openTile(goal.tx, goal.ty)) {
    let best: { tx: number; ty: number; d: number } | null = null;
    for (let ty = goal.ty - 2; ty <= goal.ty + 2; ty++) {
      for (let tx = goal.tx - 2; tx <= goal.tx + 2; tx++) {
        if (!openTile(tx, ty)) continue;
        const d = Math.abs(tx - goal.tx) + Math.abs(ty - goal.ty);
        if (!best || d < best.d) best = { tx, ty, d };
      }
    }
    if (!best) return [];
    goal = best;
  }
  if (start.tx === goal.tx && start.ty === goal.ty) return [];

  const key = (tx: number, ty: number) => ty * map.width + tx;
  const nodes: PathNode[] = [];
  const open: number[] = [];
  const closed = new Uint8Array(map.width * map.height);
  const seen = new Int32Array(map.width * map.height);
  seen.fill(-1);

  const push = (tx: number, ty: number, g: number, parent: number) => {
    const k = key(tx, ty);
    const h = Math.max(Math.abs(goal.tx - tx), Math.abs(goal.ty - ty));
    const existing = seen[k];
    if (existing >= 0 && nodes[existing].g <= g) return;
    const node: PathNode = { tx, ty, g, f: g + h, parent };
    seen[k] = nodes.length;
    nodes.push(node);
    open.push(nodes.length - 1);
  };
  push(start.tx, start.ty, 0, -1);

  const dirs = [
    [1, 0, 1],
    [-1, 0, 1],
    [0, 1, 1],
    [0, -1, 1],
    [1, 1, 1.41],
    [1, -1, 1.41],
    [-1, 1, 1.41],
    [-1, -1, 1.41],
  ] as const;

  let guard = 0;
  let found = -1;
  while (open.length && guard < 2500) {
    guard += 1;
    let bestIndex = 0;
    for (let i = 1; i < open.length; i++) {
      if (nodes[open[i]].f < nodes[open[bestIndex]].f) bestIndex = i;
    }
    const currentIndex = open.splice(bestIndex, 1)[0];
    const current = nodes[currentIndex];
    const ck = key(current.tx, current.ty);
    if (closed[ck]) continue;
    closed[ck] = 1;
    if (current.tx === goal.tx && current.ty === goal.ty) {
      found = currentIndex;
      break;
    }
    for (const [dx, dy, cost] of dirs) {
      const nx = current.tx + dx;
      const ny = current.ty + dy;
      if (!openTile(nx, ny)) continue;
      if (dx !== 0 && dy !== 0 && (!openTile(current.tx + dx, current.ty) || !openTile(current.tx, current.ty + dy))) {
        continue;
      }
      push(nx, ny, current.g + cost, currentIndex);
    }
  }
  if (found < 0) return [];
  const tiles: Array<{ tx: number; ty: number }> = [];
  let cursor = found;
  while (cursor >= 0) {
    tiles.push({ tx: nodes[cursor].tx, ty: nodes[cursor].ty });
    cursor = nodes[cursor].parent;
  }
  tiles.reverse();
  if (tiles.length && tiles[0].tx === start.tx && tiles[0].ty === start.ty) tiles.shift();
  const half = map.tileWidth / 2;
  return tiles.map((tile) => ({ x: tile.tx * map.tileWidth + half, y: tile.ty * map.tileWidth + half }));
}
