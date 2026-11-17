/**
 * Canonical Maerthun / Vaelmoor additions.
 * Brightforge and the Lightbrune Slopes, Wyrmrest, and the three peak zones.
 * Original layout. Tile ids match tools/frostmere-map.mjs.
 */
import { T, TILE } from './frostmere-map.mjs';
import { frameGate, stampBuilding } from './buildings.mjs';

export const W = 256;
export const H = 256;

const SC = {
  PINE_SNOW: 1,
  PINE_SNOW_B: 2,
  PINE_DARK: 3,
  PINE_DARK_B: 4,
  TREE: 5,
  TREE_B: 6,
  ROCK: 7,
  ROCK_SMALL: 8,
  BUSH: 10,
  BUSH_GREEN: 11,
  BUSH_DARK: 12,
};

export function grid(w, h, fill) {
  return Array.from({ length: h }, () => Array(w).fill(fill));
}

export function hash(x, y, salt = 0) {
  let n = Math.imul(x + 1 + salt * 131, 0x9e3779b1) ^ Math.imul(y + 1, 0x85ebca6b);
  n = Math.imul(n ^ (n >>> 16), 0xc2b2ae35);
  return ((n >>> 0) % 10000) / 10000;
}

export function feet(tx, ty) {
  return { x: tx * TILE + 8, y: ty * TILE + 14 };
}

function makeMap(id, g, solid, safe, objects, props, scenery = null) {
  return { id, ground: g, solid, safe, objects, props, scenery };
}

function stampRoad(g, solid, road, scenery, x, y) {
  if (x < 1 || y < 1 || x >= g[0].length - 1 || y >= g.length - 1) return;
  if (g[y][x] === T.WATER || g[y][x] === T.WATER_B) return;
  g[y][x] = (x + y) % 5 === 0 ? T.PATH_B : T.PATH;
  solid[y][x] = 0;
  road[y][x] = 1;
  if (scenery) scenery[y][x] = 0;
}

export function stroke(g, solid, road, scenery, points, radius) {
  const w = g[0].length;
  const h = g.length;
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const len = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.ceil(len * 2));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const px = x0 + (x1 - x0) * t;
      const py = y0 + (y1 - y0) * t;
      const cx = Math.round(px);
      const cy = Math.round(py);
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) > radius) continue;
          const x = cx + dx;
          const y = cy + dy;
          if (x < 1 || y < 1 || x >= w - 1 || y >= h - 1) continue;
          stampRoad(g, solid, road, scenery, x, y);
        }
      }
    }
  }
}

function pond(g, solid, cx, cy, rx, ry) {
  const w = g[0].length;
  const h = g.length;
  for (let y = cy - ry; y <= cy + ry; y++) {
    for (let x = cx - rx; x <= cx + rx; x++) {
      if (y < 1 || x < 1 || y >= h - 1 || x >= w - 1) continue;
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy > 1) continue;
      g[y][x] = (x + y) % 2 === 0 ? T.WATER : T.WATER_B;
      solid[y][x] = 1;
    }
  }
}

export function wallBox(g, solid, safe, x0, y0, x1, y1, wallTile, floorTile, gates) {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const edge = x === x0 || x === x1 || y === y0 || y === y1;
      const gate = gates.some(([gx, gy, gw, gh]) => x >= gx && x < gx + gw && y >= gy && y < gy + gh);
      if (edge && !gate) {
        g[y][x] = wallTile;
        solid[y][x] = 1;
        if (safe) safe[y][x] = 0;
      } else {
        g[y][x] = floorTile;
        solid[y][x] = 0;
        if (safe) safe[y][x] = 1;
      }
    }
  }
}

export function stoneHouse(g, solid, x, y, w, h) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      if (!g[yy]) continue;
      const edge = xx === x || yy === y || xx === x + w - 1 || yy === y + h - 1;
      g[yy][xx] = edge ? T.STONE : T.STONE_FRONT;
      solid[yy][xx] = 1;
    }
  }
}

export function border(g, solid) {
  const w = g[0].length;
  const h = g.length;
  for (let x = 0; x < w; x++) {
    solid[0][x] = 1;
    solid[h - 1][x] = 1;
    if (g[0][x] !== T.WATER) g[0][x] = T.CLIFF;
    if (g[h - 1][x] !== T.WATER) g[h - 1][x] = T.CLIFF;
  }
  for (let y = 0; y < h; y++) {
    solid[y][0] = 1;
    solid[y][w - 1] = 1;
  }
}

function openDoors(g, solid, scenery, objects) {
  const h = g.length;
  const w = g[0].length;
  for (const obj of objects) {
    if (obj.kind !== 'door' && obj.kind !== 'spawn' && obj.kind !== 'npc' && obj.kind !== 'mob' && obj.kind !== 'bind') continue;
    const tx = Math.floor(obj.x / TILE);
    const ty = Math.floor(obj.y / TILE);
    if (ty > 0 && ty < h - 1 && tx > 0 && tx < w - 1) {
      solid[ty][tx] = 0;
      if (scenery) scenery[ty][tx] = 0;
      if (g[ty][tx] === T.CLIFF || g[ty][tx] === T.WATER || g[ty][tx] === T.WALL || g[ty][tx] === T.STONE) g[ty][tx] = T.PATH;
    }
  }
}

function assertClear(g, solid, objects) {
  for (const obj of objects) {
    if (obj.kind === 'prop' || obj.kind === 'label' || obj.kind === 'sign' || obj.kind === 'door' || obj.kind === 'seam') continue;
    const tx = Math.floor(obj.x / TILE);
    const ty = Math.floor(obj.y / TILE);
    if (solid[ty]?.[tx]) throw new Error(`${obj.kind} ${obj.name} is blocked at ${tx},${ty}`);
    if (g[ty][tx] === T.WATER || g[ty][tx] === T.WATER_B) throw new Error(`${obj.kind} ${obj.name} is in water at ${tx},${ty}`);
  }
}

export function paintScenery(g, solid, road, safe, pick) {
  const h = g.length;
  const w = g[0].length;
  const scenery = grid(w, h, 0);
  const nearRoad = (x, y) => {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) if (road[y + dy]?.[x + dx]) return true;
    }
    return false;
  };
  const open = new Set([T.SNOW, T.SNOW_B, T.SNOW_C, T.GRASS, T.GRASS_B, T.MUD, T.SLUSH, T.FARM, T.PINE_GROUND, T.DEEP_SNOW, T.ROCK_GROUND, T.SAND]);
  let rocks = 0;
  for (let y = 2; y < h - 2; y++) {
    for (let x = 2; x < w - 2; x++) {
      if (solid[y][x] || safe[y][x] || road[y][x] || nearRoad(x, y)) continue;
      if (!open.has(g[y][x])) continue;
      const choice = pick(x, y, hash(x, y, 21));
      if (!choice) continue;
      scenery[y][x] = choice.frame;
      if (choice.solid) solid[y][x] = 1;
      if (choice.kind === 'rock') rocks++;
    }
  }
  return { grid: scenery, rocks };
}

export function maker(id, town, wilds) {
  return {
    id,
    objects: [],
    add(kind, name, tx, ty, extra = {}) {
      const p = feet(tx, ty);
      this.objects.push({ kind, name, x: p.x, y: p.y, ...extra });
    },
    finish(g, solid, safe, scenery) {
      openDoors(g, solid, scenery?.grid, this.objects);
      assertClear(g, solid, this.objects);
      return makeMap(id, g, solid, safe, this.objects, [
        { name: 'zoneId', type: 'string', value: id },
        { name: 'townName', type: 'string', value: town },
        { name: 'wildsName', type: 'string', value: wilds },
      ], scenery?.grid ?? null);
    },
  };
}

export function clearPatch(scenery, x0, y0, x1, y1) {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (scenery?.grid[y]) scenery.grid[y][x] = 0;
    }
  }
}

export function placeMobs(m, g, solid, safe, road, scenery, list) {
  const placed = [];
  const taken = new Set();
  const blocked = new Set([T.WATER, T.WATER_B, T.CLIFF, T.WALL, T.STONE, T.PALISADE, T.ROOF, T.STONE_FRONT, T.POST, T.DOCK]);
  const ok = (x, y) => {
    const tile = g[y]?.[x];
    if (tile === undefined || safe[y]?.[x] || road[y]?.[x] || blocked.has(tile)) return false;
    if (taken.has(`${x},${y}`)) return false;
    if (x < 2 || y < 2 || x >= g[0].length - 2 || y >= g.length - 2) return false;
    return true;
  };
  for (const [defId, sprite, tx, ty] of list) {
    let spot = ok(tx, ty) ? [tx, ty] : null;
    for (let r = 1; !spot && r <= 12; r++) {
      for (let dy = -r; dy <= r && !spot; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          if (ok(tx + dx, ty + dy)) {
            spot = [tx + dx, ty + dy];
            break;
          }
        }
      }
    }
    if (!spot) throw new Error(`${defId} has nowhere to stand near ${tx},${ty}`);
    const [x, y] = spot;
    taken.add(`${x},${y}`);
    solid[y][x] = 0;
    if (scenery) scenery.grid[y][x] = 0;
    m.add('mob', defId, x, y, { defId, sprite });
    placed.push(defId);
  }
  return placed;
}

export function interior(id, title, exitZone, exit, occupants, blurb) {
  const w = 16;
  const h = 12;
  const g = grid(w, h, T.FLOOR);
  const solid = grid(w, h, 0);
  const safe = grid(w, h, 1);
  for (let x = 0; x < w; x++) {
    g[0][x] = T.WALL;
    g[h - 1][x] = T.WALL;
    solid[0][x] = 1;
    solid[h - 1][x] = 1;
    safe[0][x] = 0;
    safe[h - 1][x] = 0;
  }
  for (let y = 0; y < h; y++) {
    g[y][0] = T.WALL;
    g[y][w - 1] = T.WALL;
    solid[y][0] = 1;
    solid[y][w - 1] = 1;
    safe[y][0] = 0;
    safe[y][w - 1] = 0;
  }
  const doorX = 8;
  g[h - 1][doorX] = T.DOOR_BL;
  g[h - 1][doorX - 1] = T.DOOR_BR;
  solid[h - 1][doorX] = 0;
  solid[h - 1][doorX - 1] = 0;
  safe[h - 1][doorX] = 1;
  safe[h - 1][doorX - 1] = 1;
  const objects = [];
  objects.push({ kind: 'door', name: 'exit', ...feet(doorX, h - 1), toZone: exitZone, toX: exit.x, toY: exit.y, sprite: 'sign_hall' });
  objects.push({ kind: 'spawn', name: 'entry', ...feet(doorX, h - 3) });
  for (const [defId, sprite, tx, ty] of occupants) {
    objects.push({ kind: 'npc', name: defId, defId, sprite, ...feet(tx, ty) });
  }
  objects.push({ kind: 'prop', name: 'fire', sprite: 'firepit', ...feet(3, 3) });
  objects.push({ kind: 'sign', name: title, sprite: 'sign_hall', text: blurb, ...feet(w - 3, 3) });
  return makeMap(id, g, solid, safe, objects, [
    { name: 'zoneId', type: 'string', value: id },
    { name: 'townName', type: 'string', value: title },
    { name: 'wildsName', type: 'string', value: title },
  ]);
}

function buildBrightforge() {
  const g = grid(W, H, T.ROCK_GROUND);
  const solid = grid(W, H, 0);
  const safe = grid(W, H, 0);
  const road = grid(W, H, 0);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const n = hash(x, y, 4);
      if (y < 120) g[y][x] = n < 0.45 ? T.ROCK_GROUND : n < 0.7 ? T.SNOW_C : T.PINE_GROUND;
      else g[y][x] = n < 0.55 ? T.ROCK_GROUND : n < 0.8 ? T.MUD : T.SNOW_C;
    }
  }
  const scenery = paintScenery(g, solid, road, safe, (x, y, roll) => {
    if (roll < 0.02) return { frame: SC.ROCK, solid: true, kind: 'rock' };
    if (roll < 0.035) return { frame: SC.ROCK_SMALL, solid: true, kind: 'rock' };
    if (y < 130 && roll > 0.97) return { frame: SC.PINE_SNOW, solid: true, kind: 'tree' };
    return null;
  });
  stroke(g, solid, road, scenery.grid, [[128, 6], [128, 40], [128, 120], [128, 180], [128, 248]], 1);
  stroke(g, solid, road, scenery.grid, [[128, 200], [70, 210], [40, 230]], 1);
  stroke(g, solid, road, scenery.grid, [[128, 200], [190, 214], [220, 230]], 1);
  wallBox(g, solid, safe, 80, 36, 176, 112, T.STONE, T.PATH, [
    [120, 36, 16, 1],
    [120, 112, 16, 1],
  ]);
  clearPatch(scenery, 81, 37, 175, 111);
  frameGate(g, solid, 120, 36, 16, 1);
  frameGate(g, solid, 120, 112, 16, 1);
  stampBuilding(g, solid, scenery, 90, 49, 12, 8, 'dwarf', { enter: true, doorX: 96 });
  stampBuilding(g, solid, scenery, 152, 49, 12, 8, 'dwarf', { enter: true, doorX: 158 });
  stampBuilding(g, solid, scenery, 90, 79, 12, 8, 'dwarf', { enter: true, doorX: 96 });
  stampBuilding(g, solid, scenery, 152, 79, 12, 8, 'dwarf', { enter: true, doorX: 158 });
  stampBuilding(g, solid, scenery, 118, 92, 16, 9, 'dwarf', { enter: true, doorX: 128 });
  stampBuilding(g, solid, scenery, 142, 92, 12, 9, 'dwarf', { enter: true, doorX: 148 });
  const m = maker('brightforge', 'Brightforge', 'Lightbrune Slopes');
  const back = (tx, ty) => feet(tx, ty);
  m.add('door', 'To Graymoor', 128, 10, { toZone: 'thornhaven', toX: feet(236, 48).x, toY: feet(236, 48).y, sprite: 'sign_wilds' });
  m.add('door', 'Anvil Hall', 96, 56, { toZone: 'bright_warrior', toX: feet(8, 8).x, toY: feet(8, 8).y, sprite: 'sign_hall' });
  m.add('door', 'Lamp Hall', 158, 56, { toZone: 'bright_cleric', toX: feet(8, 8).x, toY: feet(8, 8).y, sprite: 'sign_hall' });
  m.add('door', 'Oath Vault', 96, 86, { toZone: 'bright_paladin', toX: feet(8, 8).x, toY: feet(8, 8).y, sprite: 'sign_hall' });
  m.add('door', 'Quiet Stair', 158, 86, { toZone: 'bright_rogue', toX: feet(8, 8).x, toY: feet(8, 8).y, sprite: 'sign_hall' });
  m.add('door', 'Red Gallery', 128, 100, { toZone: 'bright_berserker', toX: feet(8, 8).x, toY: feet(8, 8).y, sprite: 'sign_hall' });
  m.add('door', 'Henge Stores', 148, 100, { toZone: 'bright_shop', toX: feet(8, 8).x, toY: feet(8, 8).y, sprite: 'sign_inn' });
  m.add('spawn', 'yard', 120, 70);
  m.add('bind', 'brightforge-yard', 116, 74);
  m.add('npc', 'durgan', 128, 64, { defId: 'durgan', sprite: 'durgan' });
  m.add('npc', 'sella', 128, 104, { defId: 'sella', sprite: 'sella' });
  m.add('npc', 'dunn', 112, 108, { defId: 'dunn', sprite: 'dunn' });
  m.add('npc', 'otta', 144, 108, { defId: 'otta', sprite: 'otta' });
  m.add('prop', 'fire', 116, 68, { sprite: 'firepit' });
  m.add('prop', 'banner', 140, 46, { sprite: 'banner' });
  m.add('sign', 'Brightforge', 100, 44, {
    sprite: 'sign_hall',
    text: 'Brightforge, hold of the Lightbrune clan, northernmost of the Dwarven Mountains. King Durgan Ashbeard keeps the court. The halls are the anvil, the lamp, the oath, the quiet stair, and the red gallery. North, the pass returns to Graymoor Hold. South, the slopes. The deep doors to Ashdeep and Veilspire are shut.',
  });
  m.add('sign', 'Lightbrune Pass', 136, 18, {
    sprite: 'sign_wilds',
    text: 'The pass north. Graymoor Hold and Thornhaven are a short walk. The same road comes back. Hoffender and the Frostmere Wilds lie beyond the hold.',
  });
  m.add('sign', 'The slopes', 136, 124, {
    sprite: 'sign_wilds',
    text: 'The Lightbrune Slopes. Hares and beetles by the wall, wolves, then bandits, then Kragg Ashhand. Old Slate is the bear that is rarely seen. This is a young road. The pass north is not.',
  });
  m.add('seam', 'Ashdeep', 48, 236, {
    sprite: 'sign_wilds',
    text: 'A mine door, barred. Ashdeep, hold of the Darkbrune clan, is deeper in the mountains. The tunnel is shut.',
  });
  m.add('seam', 'Veilspire', 210, 236, {
    sprite: 'sign_wilds',
    text: 'A second mine door, barred. Veilspire, hold of the Mistbrune clan, lies further along the deep tunnels. That door is shut.',
  });
  m.add('label', 'Brightforge', 128, 30);
  m.add('label', 'Lightbrune Slopes', 128, 160);
  const mobs = placeMobs(m, g, solid, safe, road, scenery, [
    ['slope_hare', 'hare', 40, 140],
    ['slope_hare', 'hare', 70, 150],
    ['slope_hare', 'hare', 170, 146],
    ['slope_hare', 'hare', 210, 154],
    ['slope_hare', 'hare', 48, 170],
    ['cinder_beetle', 'beetle', 36, 160],
    ['cinder_beetle', 'beetle', 90, 156],
    ['cinder_beetle', 'beetle', 200, 166],
    ['cinder_beetle', 'beetle', 230, 150],
    ['bright_wolf', 'wolf', 40, 188],
    ['bright_wolf', 'wolf', 70, 196],
    ['bright_wolf', 'wolf', 100, 180],
    ['bright_wolf', 'wolf', 160, 184],
    ['bright_wolf', 'wolf', 200, 192],
    ['bright_wolf', 'wolf', 230, 176],
    ['bright_wolf', 'wolf', 50, 210],
    ['bright_wolf', 'wolf', 180, 206],
    ['ridge_bandit', 'bandit', 44, 220],
    ['ridge_bandit', 'bandit', 80, 228],
    ['ridge_bandit', 'bandit', 150, 224],
    ['ridge_bandit', 'bandit', 190, 230],
    ['ridge_bandit', 'bandit', 230, 214],
    ['slate_bear', 'bear', 36, 236],
    ['slate_bear', 'bear', 100, 240],
    ['slate_bear', 'bear', 170, 238],
    ['kragg', 'leader', 64, 232],
    ['old_slate', 'bear', 214, 242],
  ]);
  border(g, solid);
  const map = m.finish(g, solid, safe, scenery);
  if (safe[70][120] !== 1) throw new Error('Brightforge yard is not safe');
  if (!mobs.includes('kragg') || !mobs.includes('old_slate')) throw new Error('Brightforge names missing');
  const halls = [
    interior('bright_warrior', 'Anvil Hall', 'brightforge', back(96, 60), [['brim', 'brim', 6, 4]], 'Anvil Hall. Brim Ash teaches the axe. The door returns to Brightforge.'),
    interior('bright_cleric', 'Lamp Hall', 'brightforge', back(158, 60), [['kelda', 'kelda', 6, 4]], 'Lamp Hall. Kelda Flint keeps the lamp. The door returns to Brightforge.'),
    interior('bright_paladin', 'Oath Vault', 'brightforge', back(96, 90), [['orrin', 'orrin', 6, 4]], 'Oath Vault. Orrin Keel keeps the oath. The door returns to Brightforge.'),
    interior('bright_rogue', 'Quiet Stair', 'brightforge', back(158, 90), [['nala', 'nala', 6, 4]], 'The Quiet Stair. Nala Venn speaks softly. The door returns to Brightforge.'),
    interior('bright_berserker', 'Red Gallery', 'brightforge', back(120, 104), [['bram', 'bram', 6, 4]], 'The Red Gallery. Bram Keld keeps the rage in a room. The door returns to Brightforge.'),
    interior('bright_shop', "Henge's Stores", 'brightforge', back(156, 104), [['henge', 'henge', 5, 4]], "Henge's Stores. Rations, charts, and Lightbrune plate. The door returns to Brightforge."),
  ];
  return { map, halls, mobs };
}

export function outpost(g, solid, safe, scenery, x0, y0, x1, y1, gates) {
  wallBox(g, solid, safe, x0, y0, x1, y1, T.PALISADE, T.PATH, gates);
  clearPatch(scenery, x0 + 1, y0 + 1, x1 - 1, y1 - 1);
}

function buildWyrmrest() {
  const g = grid(W, H, T.ROCK_GROUND);
  const solid = grid(W, H, 0);
  const safe = grid(W, H, 0);
  const road = grid(W, H, 0);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const n = hash(x, y, 12);
      g[y][x] = n < 0.4 ? T.ROCK_GROUND : n < 0.7 ? T.SNOW_C : T.PINE_GROUND;
    }
  }
  const scenery = paintScenery(g, solid, road, safe, (_x, _y, roll) => {
    if (roll < 0.018) return { frame: SC.ROCK, solid: true, kind: 'rock' };
    if (roll > 0.975) return { frame: SC.PINE_DARK, solid: true, kind: 'tree' };
    return null;
  });
  stroke(g, solid, road, scenery.grid, [[8, 140], [40, 140], [70, 140]], 1);
  stroke(g, solid, road, scenery.grid, [[128, 8], [128, 40], [128, 70]], 1);
  wallBox(g, solid, safe, 70, 70, 186, 190, T.STONE, T.PATH, [
    [70, 132, 1, 16],
    [120, 70, 16, 1],
  ]);
  clearPatch(scenery, 71, 71, 185, 189);
  frameGate(g, solid, 70, 132, 1, 16);
  frameGate(g, solid, 120, 70, 16, 1);
  stampBuilding(g, solid, scenery, 108, 74, 12, 8, 'human', { enter: false });
  stampBuilding(g, solid, scenery, 150, 74, 14, 8, 'human', { enter: false });
  stampBuilding(g, solid, scenery, 88, 150, 12, 8, 'human', { enter: false });
  stampBuilding(g, solid, scenery, 152, 148, 14, 8, 'human', { enter: false });
  const m = maker('wyrmrest', 'Wyrmrest', 'Wyrmrest');
  m.add('door', 'To the Frostmere Wilds', 12, 140, { toZone: 'hoffender', toX: feet(240, 152).x, toY: feet(240, 152).y, sprite: 'sign_wilds' });
  m.add('door', 'To the Ashfall Moors', 128, 10, { toZone: 'ashfall', toX: feet(128, 240).x, toY: feet(128, 240).y, sprite: 'sign_wilds' });
  m.add('spawn', 'court', 110, 120);
  m.add('bind', 'wyrmrest-court', 104, 124);
  m.add('npc', 'brynn', 128, 110, { defId: 'brynn', sprite: 'brynn' });
  m.add('npc', 'vess', 150, 128, { defId: 'vess', sprite: 'vess' });
  m.add('npc', 'wry_warrior', 96, 100, { defId: 'wry_warrior', sprite: 'eirik' });
  m.add('npc', 'wry_shaman', 112, 100, { defId: 'wry_shaman', sprite: 'torunn' });
  m.add('npc', 'wry_rogue', 160, 100, { defId: 'wry_rogue', sprite: 'sable' });
  m.add('npc', 'wry_berserker', 176, 100, { defId: 'wry_berserker', sprite: 'hroth' });
  m.add('npc', 'wry_warden', 96, 140, { defId: 'wry_warden', sprite: 'bjorn' });
  m.add('npc', 'wry_wizard', 112, 140, { defId: 'wry_wizard', sprite: 'maeriel' });
  m.add('npc', 'wry_cleric', 160, 140, { defId: 'wry_cleric', sprite: 'selne' });
  m.add('npc', 'wry_enchanter', 176, 140, { defId: 'wry_enchanter', sprite: 'miris' });
  m.add('npc', 'wry_paladin', 120, 160, { defId: 'wry_paladin', sprite: 'adel' });
  m.add('npc', 'wry_magician', 148, 168, { defId: 'wry_magician', sprite: 'wry_magician' });
  m.add('npc', 'wry_druid', 104, 168, { defId: 'wry_druid', sprite: 'wry_druid' });
  m.add('npc', 'wry_ranger', 168, 176, { defId: 'wry_ranger', sprite: 'wry_ranger' });
  m.add('npc', 'gate_holm', 84, 140, { defId: 'gate_holm', sprite: 'gate_holm' });
  m.add('npc', 'gate_moss', 84, 148, { defId: 'gate_moss', sprite: 'gate_moss' });
  m.add('prop', 'banner', 128, 86, { sprite: 'banner' });
  m.add('prop', 'fire', 104, 118, { sprite: 'firepit' });
  m.add('sign', 'Wyrmrest', 96, 80, {
    sprite: 'sign_hall',
    text: 'Wyrmrest. A castle on the northern border of the kingdom, under the Ogre Highlands, northeast of Hoffender. It is named for the dragons laid to rest beneath these peaks after an old war. Ysolde\'s cold kept them asleep. The Black Ice is broken, and they are awake. The west gate is the Frostmere road. The north gate climbs into the Ashfall Moors. Bind here if the peaks are where you mean to fall.',
  });
  m.add('sign', 'West road', 28, 136, {
    sprite: 'sign_wilds',
    text: 'The Frostmere Wilds, and Hoffender beyond them. Thornhaven and Valdoria are south of that hold. The same road comes back.',
  });
  m.add('sign', 'North road', 140, 24, {
    sprite: 'sign_wilds',
    text: 'The Ashfall Moors, then the Scalded Vale, then the Wyrmrest Spires. Levels climb with the peaks. Emberwatch keeps a yard at the foot of the moors. The deeper lair under the spires is sealed.',
  });
  m.add('label', 'Wyrmrest', 128, 150);
  border(g, solid);
  const map = m.finish(g, solid, safe, scenery);
  if (safe[120][110] !== 1) throw new Error('Wyrmrest court is not safe');
  return { map };
}

function buildAshfall() {
  const g = grid(W, H, T.MUD);
  const solid = grid(W, H, 0);
  const safe = grid(W, H, 0);
  const road = grid(W, H, 0);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const n = hash(x, y, 17);
      g[y][x] = n < 0.45 ? T.MUD : n < 0.7 ? T.ROCK_GROUND : n < 0.85 ? T.SAND : T.SNOW_C;
      if (n > 0.97) g[y][x] = T.GLOW;
    }
  }
  const scenery = paintScenery(g, solid, road, safe, (_x, _y, roll) => {
    if (roll < 0.02) return { frame: SC.ROCK, solid: true, kind: 'rock' };
    if (roll > 0.985) return { frame: SC.BUSH_DARK, solid: false, kind: 'bush' };
    return null;
  });
  stroke(g, solid, road, scenery.grid, [[128, 6], [128, 80], [128, 160], [128, 248]], 1);
  outpost(g, solid, safe, scenery, 100, 188, 156, 236, [[120, 236, 16, 1], [120, 188, 16, 1]]);
  const m = maker('ashfall', 'Emberwatch', 'Ashfall Moors');
  m.add('door', 'To Wyrmrest', 128, 248, { toZone: 'wyrmrest', toX: feet(128, 20).x, toY: feet(128, 20).y, sprite: 'sign_wilds' });
  m.add('door', 'To the Scalded Vale', 128, 8, { toZone: 'scalded', toX: feet(128, 240).x, toY: feet(128, 240).y, sprite: 'sign_wilds' });
  m.add('spawn', 'south', 128, 230);
  m.add('npc', 'ember_keel', 128, 210, { defId: 'ember_keel', sprite: 'ember_keel' });
  m.add('npc', 'ember_scout', 140, 214, { defId: 'ember_scout', sprite: 'ember_scout' });
  m.add('bind', 'emberwatch', 116, 216);
  m.add('prop', 'fire', 116, 208, { sprite: 'firepit' });
  m.add('sign', 'Emberwatch', 108, 228, {
    sprite: 'sign_hall',
    text: 'Emberwatch. Dwarf scouts and a barbarian fire, on the dragon-burned heath. South is Wyrmrest. North, the moors climb toward the Scalded Vale. Sit here if you want a fall to bring you back. Korrag the Scorched walks the north of the heath.',
  });
  m.add('sign', 'South road', 140, 242, {
    sprite: 'sign_wilds',
    text: 'Wyrmrest, the castle under the peaks. The same road comes back.',
  });
  m.add('sign', 'North road', 140, 20, {
    sprite: 'sign_wilds',
    text: 'The Scalded Vale. Kobolds mine there for the dragons. Thane\'s Rest is a ruined dwarf yard at the south of the canyon.',
  });
  m.add('label', 'Ashfall Moors', 70, 100);
  m.add('label', 'Emberwatch', 128, 180);
  const mobs = placeMobs(m, g, solid, safe, road, scenery, [
    ['ash_wolf', 'ash_wolf', 40, 170],
    ['ash_wolf', 'ash_wolf', 70, 160],
    ['ash_wolf', 'ash_wolf', 170, 164],
    ['ash_wolf', 'ash_wolf', 210, 150],
    ['ash_wolf', 'ash_wolf', 48, 140],
    ['ash_wolf', 'ash_wolf', 200, 130],
    ['ash_cultist', 'cultist', 40, 120],
    ['ash_cultist', 'cultist', 80, 110],
    ['ash_cultist', 'cultist', 160, 116],
    ['ash_cultist', 'cultist', 210, 100],
    ['ash_cultist', 'cultist', 50, 90],
    ['ash_cultist', 'cultist', 190, 80],
    ['young_drake', 'drake', 36, 70],
    ['young_drake', 'drake', 90, 60],
    ['young_drake', 'drake', 170, 64],
    ['young_drake', 'drake', 220, 50],
    ['young_drake', 'drake', 60, 40],
    ['young_drake', 'drake', 140, 36],
    ['korrag', 'cultist', 80, 48],
  ]);
  border(g, solid);
  const map = m.finish(g, solid, safe, scenery);
  if (safe[210][128] !== 1) throw new Error('Emberwatch is not safe');
  if (!mobs.includes('korrag')) throw new Error('Korrag missing');
  return { map, mobs };
}

function buildScalded() {
  const g = grid(W, H, T.ROCK_GROUND);
  const solid = grid(W, H, 0);
  const safe = grid(W, H, 0);
  const road = grid(W, H, 0);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const n = hash(x, y, 19);
      const canyon = Math.abs(x - 128) < 28 + hash(y, x, 2) * 10;
      g[y][x] = canyon ? (n < 0.5 ? T.MUD : T.SAND) : T.ROCK_GROUND;
    }
  }
  pond(g, solid, 70, 120, 10, 6);
  pond(g, solid, 190, 90, 12, 7);
  const scenery = paintScenery(g, solid, road, safe, (_x, _y, roll) => {
    if (roll < 0.025) return { frame: SC.ROCK, solid: true, kind: 'rock' };
    return null;
  });
  stroke(g, solid, road, scenery.grid, [[128, 6], [120, 80], [136, 150], [128, 248]], 1);
  outpost(g, solid, safe, scenery, 96, 176, 168, 228, [[120, 228, 16, 1]]);
  frameGate(g, solid, 120, 228, 16, 1);
  stampBuilding(g, solid, scenery, 112, 186, 12, 8, 'dwarf', { enter: false });
  const m = maker('scalded', "Thane's Rest", 'The Scalded Vale');
  m.add('door', 'To the Ashfall Moors', 128, 248, { toZone: 'ashfall', toX: feet(128, 16).x, toY: feet(128, 16).y, sprite: 'sign_wilds' });
  m.add('door', 'To the Wyrmrest Spires', 128, 8, { toZone: 'spires', toX: feet(128, 240).x, toY: feet(128, 240).y, sprite: 'sign_wilds' });
  m.add('spawn', 'south', 128, 220);
  m.add('npc', 'thane_rest', 128, 200, { defId: 'thane_rest', sprite: 'thane_rest' });
  m.add('bind', 'thanes-rest', 140, 206);
  m.add('prop', 'fire', 116, 204, { sprite: 'firepit' });
  m.add('sign', "Thane's Rest", 108, 220, {
    sprite: 'sign_hall',
    text: 'Thane\'s Rest. A dwarf waystation, ruined and then used again. The yard is safe. South is the Ashfall Moors and Emberwatch. North, the canyon belongs to the kobolds who mine for the dragons. Skreeva is their matriarch.',
  });
  m.add('sign', 'North canyon', 140, 24, {
    sprite: 'sign_wilds',
    text: 'The Wyrmrest Spires. Roosts, wyverns, and the elder. The sealed door under him is not a road.',
  });
  m.add('label', 'The Scalded Vale', 70, 80);
  const mobs = placeMobs(m, g, solid, safe, road, scenery, [
    ['kobold_miner', 'kobold', 90, 160],
    ['kobold_miner', 'kobold', 150, 156],
    ['kobold_miner', 'kobold', 70, 150],
    ['kobold_miner', 'kobold', 180, 148],
    ['kobold_miner', 'kobold', 100, 140],
    ['kobold_miner', 'kobold', 160, 136],
    ['kobold_digger', 'kobold', 60, 120],
    ['kobold_digger', 'kobold', 100, 110],
    ['kobold_digger', 'kobold', 160, 116],
    ['kobold_digger', 'kobold', 200, 124],
    ['kobold_digger', 'kobold', 80, 96],
    ['kobold_digger', 'kobold', 170, 90],
    ['kobold_guard', 'kobold', 50, 70],
    ['kobold_guard', 'kobold', 90, 60],
    ['kobold_guard', 'kobold', 150, 64],
    ['kobold_guard', 'kobold', 200, 56],
    ['kobold_guard', 'kobold', 70, 44],
    ['kobold_guard', 'kobold', 180, 40],
    ['skreeva', 'kobold', 128, 48],
  ]);
  border(g, solid);
  const map = m.finish(g, solid, safe, scenery);
  if (safe[200][128] !== 1) throw new Error("Thane's Rest is not safe");
  if (!mobs.includes('skreeva')) throw new Error('Skreeva missing');
  return { map, mobs };
}

function buildSpires() {
  const g = grid(W, H, T.ROCK_GROUND);
  const solid = grid(W, H, 0);
  const safe = grid(W, H, 0);
  const road = grid(W, H, 0);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const n = hash(x, y, 23);
      g[y][x] = n < 0.5 ? T.ROCK_GROUND : n < 0.75 ? T.STONE : T.SNOW_C;
      if (n > 0.96) g[y][x] = T.GLOW;
    }
  }
  const scenery = paintScenery(g, solid, road, safe, (_x, _y, roll) => {
    if (roll < 0.03) return { frame: SC.ROCK, solid: true, kind: 'rock' };
    return null;
  });
  stroke(g, solid, road, scenery.grid, [[128, 8], [128, 80], [140, 150], [128, 248]], 1);
  outpost(g, solid, safe, scenery, 108, 210, 148, 244, [[120, 244, 16, 1]]);
  const m = maker('spires', 'The Last Step', 'Wyrmrest Spires');
  m.add('door', 'To the Scalded Vale', 128, 248, { toZone: 'scalded', toX: feet(128, 16).x, toY: feet(128, 16).y, sprite: 'sign_wilds' });
  m.add('spawn', 'south', 128, 232);
  m.add('seam', 'Deeper Lair', 128, 18, {
    sprite: 'sign_wilds',
    text: 'A door in the rock, sealed. The deeper lair under the spires is not open. Vyrmathax the Elder keeps the roost in front of it. Whatever sleeps past the seal can wait.',
  });
  m.add('sign', 'The Last Step', 112, 236, {
    sprite: 'sign_hall',
    text: 'The Last Step. A shelf of stone before the roosts. It is safe. South is the Scalded Vale. North, wyverns, drakes, dragonkin, and Vyrmathax the Elder. The door beyond him is sealed.',
  });
  m.add('label', 'Wyrmrest Spires', 80, 120);
  const mobs = placeMobs(m, g, solid, safe, road, scenery, [
    ['roost_wyvern', 'wyvern', 40, 190],
    ['roost_wyvern', 'wyvern', 80, 180],
    ['roost_wyvern', 'wyvern', 170, 184],
    ['roost_wyvern', 'wyvern', 210, 170],
    ['roost_wyvern', 'wyvern', 50, 160],
    ['spire_drake', 'drake', 40, 140],
    ['spire_drake', 'drake', 90, 130],
    ['spire_drake', 'drake', 160, 136],
    ['spire_drake', 'drake', 210, 124],
    ['spire_drake', 'drake', 70, 110],
    ['dragonkin', 'dragonkin', 36, 90],
    ['dragonkin', 'dragonkin', 80, 80],
    ['dragonkin', 'dragonkin', 150, 86],
    ['dragonkin', 'dragonkin', 200, 74],
    ['dragonkin', 'dragonkin', 60, 60],
    ['dragonkin', 'dragonkin', 180, 56],
    ['dragonkin', 'dragonkin', 100, 48],
    ['vyrmathax', 'drake', 128, 36],
  ]);
  border(g, solid);
  const map = m.finish(g, solid, safe, scenery);
  if (safe[220][128] !== 1) throw new Error('The Last Step is not safe');
  if (!mobs.includes('vyrmathax')) throw new Error('Vyrmathax missing');
  return { map, mobs };
}

function clearArrivals(maps) {
  const byId = Object.fromEntries(maps.map((map) => [map.id, map]));
  for (const map of maps) {
    for (const obj of map.objects) {
      if (obj.kind !== 'door' || !obj.toZone || !byId[obj.toZone]) continue;
      const dest = byId[obj.toZone];
      const tx = Math.floor(obj.toX / TILE);
      const ty = Math.floor(obj.toY / TILE);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const x = tx + dx;
          const y = ty + dy;
          if (!dest.ground[y] || dest.ground[y][x] === undefined) continue;
          const tile = dest.ground[y][x];
          if (tile === T.WATER || tile === T.WATER_B) continue;
          dest.solid[y][x] = 0;
          if (dest.scenery?.[y]) dest.scenery[y][x] = 0;
        }
      }
    }
  }
}

export function clearCrossings(maps) {
  clearArrivals(maps);
}

export function buildCanon() {
  const bright = buildBrightforge();
  const wyrm = buildWyrmrest();
  const ash = buildAshfall();
  const vale = buildScalded();
  const spires = buildSpires();
  const maps = [bright.map, ...bright.halls, wyrm.map, ash.map, vale.map, spires.map];
  clearArrivals(maps);
  const charts = {
    brightforge: { zone: 'brightforge', x: 72, y: 28, w: 112, h: 92 },
    brightforge_slopes: { zone: 'brightforge', x: 16, y: 120, w: 224, h: 124 },
    wyrmrest: { zone: 'wyrmrest', x: 60, y: 60, w: 140, h: 140 },
    ashfall: { zone: 'ashfall', x: 16, y: 16, w: 224, h: 168 },
    emberwatch: { zone: 'ashfall', x: 92, y: 180, w: 72, h: 64 },
    scalded: { zone: 'scalded', x: 16, y: 16, w: 224, h: 160 },
    thanes_rest: { zone: 'scalded', x: 88, y: 168, w: 88, h: 68 },
    spires: { zone: 'spires', x: 16, y: 16, w: 224, h: 190 },
  };
  console.log(`canon brightforge mobs ${bright.mobs.length}; ashfall ${ash.mobs.length}; scalded ${vale.mobs.length}; spires ${spires.mobs.length}`);
  return { maps, charts };
}
