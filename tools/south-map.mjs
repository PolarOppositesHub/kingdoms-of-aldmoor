/**
 * The road south of Hoffender, the High Elf capital, and the Black Ice.
 * Thornhaven and Valdoria are the lands the Frostmere signs already named.
 * Eldenmoor is the tiered city of the high elves, with the Eldenweald outside it.
 * The Black Ice is three cavern floors past the Fang.
 * Original layout. Tile ids match tools/frostmere-map.mjs.
 */
import { T, TILE } from './frostmere-map.mjs';

const W = 256;
const H = 256;

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

function grid(w, h, fill) {
  return Array.from({ length: h }, () => Array(w).fill(fill));
}

function hash(x, y, salt = 0) {
  let n = Math.imul(x + 1 + salt * 131, 0x9e3779b1) ^ Math.imul(y + 1, 0x85ebca6b);
  n = Math.imul(n ^ (n >>> 16), 0xc2b2ae35);
  return ((n >>> 0) % 10000) / 10000;
}

function feet(tx, ty) {
  return { x: tx * TILE + 8, y: ty * TILE + 14 };
}

function makeMap(id, g, solid, safe, objects, props, scenery = null) {
  return { id, ground: g, solid, safe, objects, props, scenery };
}

function stampRoad(g, solid, road, scenery, x, y, tile = T.PATH) {
  if (x < 1 || y < 1 || x >= g[0].length - 1 || y >= g.length - 1) return;
  if (g[y][x] === T.WATER || g[y][x] === T.WATER_B) return;
  g[y][x] = (x + y) % 5 === 0 ? T.PATH_B : tile;
  solid[y][x] = 0;
  road[y][x] = 1;
  if (scenery) scenery[y][x] = 0;
}

function stroke(g, solid, road, scenery, points, radius) {
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

function rect(g, solid, safe, x0, y0, x1, y1, tile, isSolid, isSafe = false) {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (!g[y] || g[y][x] === undefined) continue;
      g[y][x] = tile;
      solid[y][x] = isSolid ? 1 : 0;
      if (safe) safe[y][x] = isSafe ? 1 : 0;
    }
  }
}

function wallBox(g, solid, safe, x0, y0, x1, y1, wallTile, floorTile, gates) {
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

function house(g, solid, x, y, w, h) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      if (!g[yy]) continue;
      const edge = xx === x || yy === y || xx === x + w - 1 || yy === y + h - 1;
      g[yy][xx] = edge ? T.WALL : T.ROOF;
      solid[yy][xx] = 1;
    }
  }
}

function stoneHouse(g, solid, x, y, w, h) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      if (!g[yy]) continue;
      const edge = xx === x || yy === y || xx === x + w - 1 || yy === y + h - 1;
      g[yy][xx] = edge ? T.STONE : T.STONE_FRONT;
      solid[yy][xx] = 1;
    }
  }
}

function border(g, solid) {
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
    if (obj.kind === 'prop' || obj.kind === 'label' || obj.kind === 'sign' || obj.kind === 'door') continue;
    const tx = Math.floor(obj.x / TILE);
    const ty = Math.floor(obj.y / TILE);
    if (solid[ty]?.[tx]) throw new Error(`${obj.kind} ${obj.name} is blocked at ${tx},${ty}`);
    if (g[ty][tx] === T.WATER || g[ty][tx] === T.WATER_B) throw new Error(`${obj.kind} ${obj.name} is in water at ${tx},${ty}`);
  }
}

function paintScenery(g, solid, road, safe, pick) {
  const h = g.length;
  const w = g[0].length;
  const scenery = grid(w, h, 0);
  let trees = 0;
  let rocks = 0;
  let bushes = 0;
  const nearRoad = (x, y) => {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) if (road[y + dy]?.[x + dx]) return true;
    }
    return false;
  };
  const open = new Set([T.SNOW, T.SNOW_B, T.SNOW_C, T.GRASS, T.GRASS_B, T.MUD, T.SLUSH, T.FARM, T.PINE_GROUND, T.DEEP_SNOW, T.ROCK_GROUND]);
  for (let y = 2; y < h - 2; y++) {
    for (let x = 2; x < w - 2; x++) {
      if (solid[y][x] || safe[y][x] || road[y][x] || nearRoad(x, y)) continue;
      if (!open.has(g[y][x])) continue;
      const roll = hash(x, y, 21);
      const choice = pick(x, y, roll);
      if (!choice) continue;
      scenery[y][x] = choice.frame;
      if (choice.solid) solid[y][x] = 1;
      if (choice.kind === 'tree') trees++;
      else if (choice.kind === 'rock') rocks++;
      else bushes++;
    }
  }
  return { grid: scenery, trees, rocks, bushes };
}

function maker(id, town, wilds) {
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

function clearPatch(scenery, solid, x0, y0, x1, y1) {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (scenery?.grid[y]) scenery.grid[y][x] = 0;
    }
  }
}

function placeMobs(m, g, solid, safe, road, scenery, list) {
  const placed = [];
  const taken = new Set();
  const blocked = new Set([T.WATER, T.WATER_B, T.CLIFF, T.WALL, T.STONE, T.PALISADE, T.ROOF, T.STONE_FRONT, T.POST]);
  const ok = (x, y) => {
    const tile = g[y]?.[x];
    if (tile === undefined || safe[y]?.[x] || road[y]?.[x] || blocked.has(tile)) return false;
    if (taken.has(`${x},${y}`)) return false;
    if (x < 2 || y < 2 || x >= g[0].length - 2 || y >= g.length - 2) return false;
    return true;
  };
  for (const [defId, sprite, tx, ty] of list) {
    let spot = ok(tx, ty) ? [tx, ty] : null;
    for (let r = 1; !spot && r <= 10; r++) {
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

function buildThornhaven() {
  const g = grid(W, H, T.MUD);
  const solid = grid(W, H, 0);
  const safe = grid(W, H, 0);
  const road = grid(W, H, 0);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const n = hash(x, y, 6);
      if (y < 70) g[y][x] = n < 0.45 ? T.SLUSH : n < 0.7 ? T.MUD : T.SNOW_C;
      else if (y < 150) g[y][x] = n < 0.5 ? T.MUD : n < 0.75 ? T.FARM : T.GRASS;
      else g[y][x] = n < 0.55 ? T.GRASS : n < 0.8 ? T.GRASS_B : T.FARM;
    }
  }
  pond(g, solid, 58, 168, 14, 8);
  pond(g, solid, 200, 190, 10, 7);
  const scenery = paintScenery(g, solid, road, safe, (x, y, roll) => {
    if (roll < 0.012) return { frame: SC.ROCK_SMALL, solid: true, kind: 'rock' };
    if (y < 80 && roll > 0.965) return { frame: roll > 0.982 ? SC.PINE_SNOW : SC.PINE_SNOW_B, solid: true, kind: 'tree' };
    if (y >= 80 && roll > 0.955) return { frame: roll > 0.978 ? SC.TREE : SC.TREE_B, solid: true, kind: 'tree' };
    if (roll > 0.93 && roll < 0.955) return { frame: y < 90 ? SC.BUSH : SC.BUSH_GREEN, solid: false, kind: 'bush' };
    return null;
  });
  stroke(g, solid, road, scenery.grid, [
    [128, 6],
    [128, 40],
    [128, 90],
    [128, 150],
    [128, 210],
    [128, 250],
  ], 1);
  stroke(g, solid, road, scenery.grid, [
    [128, 48],
    [170, 70],
    [210, 90],
    [248, 108],
  ], 1);
  wallBox(g, solid, safe, 108, 28, 152, 68, T.PALISADE, T.PATH, [
    [124, 68, 10, 1],
    [124, 28, 10, 1],
  ]);
  clearPatch(scenery, solid, 109, 29, 151, 67);
  house(g, solid, 116, 36, 10, 8);
  house(g, solid, 136, 36, 10, 8);
  const m = maker('thornhaven', 'Graymoor Hold', 'Thornhaven');
  m.add('door', 'To Hoffender', 128, 8, { toZone: 'hoffender', toX: feet(140, 244).x, toY: feet(140, 244).y, sprite: 'sign_wilds' });
  m.add('spawn', 'north', 128, 16);
  m.add('door', 'From the grass track', 248, 108, { toZone: 'hoffender', toX: feet(240, 228).x, toY: feet(240, 228).y, sprite: 'sign_wilds' });
  m.add('spawn', 'east', 236, 108);
  m.add('door', 'To Valdoria', 128, 248, { toZone: 'valdoria', toX: feet(128, 16).x, toY: feet(128, 16).y, sprite: 'sign_wilds' });
  m.add('npc', 'odda', 130, 48, { defId: 'odda', sprite: 'odda' });
  m.add('npc', 'nell', 142, 52, { defId: 'nell', sprite: 'nell' });
  m.add('bind', 'graymoor-yard', 124, 56);
  m.add('prop', 'fire', 124, 50, { sprite: 'firepit' });
  m.add('prop', 'banner', 128, 34, { sprite: 'banner' });
  m.add('sign', 'Graymoor Hold', 118, 62, {
    sprite: 'sign_hall',
    text: 'Graymoor Hold. Odda keeps the yard. The snow of Hoffender is the road north. South, the fields dry out and the kingdom of Valdoria begins. Sit here if you want a fall to bring you back.',
  });
  m.add('sign', 'North road', 134, 12, {
    sprite: 'sign_wilds',
    text: 'Hoffender and the Frostmere Wilds. The cold starts again past this line. The same road comes back.',
  });
  m.add('sign', 'East track', 236, 102, {
    sprite: 'sign_wilds',
    text: 'The grass track back to the southeast of the Frostmere Wilds. It does not skip the hold. It only comes in from the side.',
  });
  m.add('sign', 'South road', 136, 230, {
    sprite: 'sign_wilds',
    text: 'Valdoria, and Blackpine Tower, lie south. The mud thins. The pines do not.',
  });
  m.add('label', 'Thornhaven', 128, 180);
  m.add('label', 'Graymoor Hold', 128, 24);
  const mobs = placeMobs(m, g, solid, safe, road, scenery, [
    ['field_boar', 'boar', 48, 88],
    ['field_boar', 'boar', 70, 96],
    ['field_boar', 'boar', 90, 110],
    ['field_boar', 'boar', 40, 120],
    ['field_boar', 'boar', 168, 86],
    ['field_boar', 'boar', 190, 78],
    ['field_boar', 'boar', 210, 130],
    ['field_boar', 'boar', 60, 140],
    ['mud_wolf', 'wolf', 44, 78],
    ['mud_wolf', 'wolf', 78, 74],
    ['mud_wolf', 'wolf', 96, 130],
    ['mud_wolf', 'wolf', 176, 124],
    ['mud_wolf', 'wolf', 200, 140],
    ['mud_wolf', 'wolf', 52, 150],
    ['slush_bandit', 'bandit', 70, 188],
    ['slush_bandit', 'bandit', 96, 200],
    ['slush_bandit', 'bandit', 160, 176],
    ['slush_bandit', 'bandit', 184, 168],
    ['slush_bandit', 'bandit', 46, 210],
    ['slush_bandit', 'bandit', 210, 200],
    ['hold_raider', 'archer', 80, 220],
    ['hold_raider', 'archer', 170, 214],
    ['hold_raider', 'archer', 200, 230],
    ['hold_raider', 'archer', 40, 230],
    ['marsh_spider', 'spider', 36, 180],
    ['marsh_spider', 'spider', 86, 156],
    ['marsh_spider', 'spider', 176, 150],
    ['marsh_spider', 'spider', 220, 170],
    ['briar_bear', 'bear', 36, 236],
    ['briar_bear', 'bear', 90, 236],
    ['briar_bear', 'bear', 168, 236],
    ['briar_bear', 'bear', 220, 220],
    ['hask', 'leader', 72, 206],
  ]);
  border(g, solid);
  const map = m.finish(g, solid, safe, scenery);
  if (safe[48][130] !== 1) throw new Error('Graymoor Hold is not safe');
  if (!mobs.includes('hask')) throw new Error('Hask missing');
  if (scenery.trees < 400) throw new Error(`thornhaven only ${scenery.trees} trees`);
  return { map, mobs, scenery };
}

function buildValdoria() {
  const g = grid(W, H, T.GRASS);
  const solid = grid(W, H, 0);
  const safe = grid(W, H, 0);
  const road = grid(W, H, 0);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const n = hash(x, y, 8);
      if (n < 0.35) g[y][x] = T.GRASS;
      else if (n < 0.62) g[y][x] = T.GRASS_B;
      else if (n < 0.82) g[y][x] = T.PINE_GROUND;
      else g[y][x] = T.FARM;
    }
  }
  pond(g, solid, 206, 168, 16, 10);
  const scenery = paintScenery(g, solid, road, safe, (x, y, roll) => {
    if (roll < 0.01) return { frame: SC.ROCK, solid: true, kind: 'rock' };
    if (roll > 0.955 && roll < 0.985) return { frame: hash(x, y, 3) > 0.5 ? SC.PINE_DARK : SC.PINE_DARK_B, solid: true, kind: 'tree' };
    if (roll > 0.985) return { frame: hash(x, y, 4) > 0.5 ? SC.TREE : SC.TREE_B, solid: true, kind: 'tree' };
    if (roll > 0.93 && roll < 0.95) return { frame: SC.BUSH_DARK, solid: false, kind: 'bush' };
    return null;
  });
  stroke(g, solid, road, scenery.grid, [
    [128, 6],
    [128, 60],
    [140, 110],
    [128, 160],
    [120, 210],
    [128, 250],
  ], 1);
  stroke(g, solid, road, scenery.grid, [
    [140, 110],
    [168, 118],
    [188, 124],
  ], 1);
  wallBox(g, solid, safe, 168, 100, 214, 146, T.STONE, T.PATH, [[186, 146, 10, 1]]);
  clearPatch(scenery, solid, 169, 101, 213, 145);
  stoneHouse(g, solid, 180, 108, 16, 14);
  const m = maker('valdoria', 'Blackpine Tower', 'Valdoria');
  m.add('door', 'To Thornhaven', 128, 8, { toZone: 'thornhaven', toX: feet(128, 238).x, toY: feet(128, 238).y, sprite: 'sign_wilds' });
  m.add('spawn', 'north', 128, 16);
  m.add('door', 'To Eldenmoor', 128, 248, { toZone: 'eldenmoor', toX: feet(128, 20).x, toY: feet(128, 20).y, sprite: 'sign_wilds' });
  m.add('npc', 'osric', 190, 132, { defId: 'osric', sprite: 'osric' });
  m.add('bind', 'blackpine-yard', 196, 136);
  m.add('prop', 'banner', 192, 128, { sprite: 'banner' });
  m.add('prop', 'crate', 176, 136, { sprite: 'crate' });
  solid[136][176] = 1;
  m.add('sign', 'Blackpine Tower', 184, 142, {
    sprite: 'sign_hall',
    text: 'Blackpine Tower. Osric keeps the yard for the kingdom of Valdoria. North is Thornhaven and the mud. South, the grass changes its mind and becomes the Eldenweald. The tower is safe. The pines are not.',
  });
  m.add('sign', 'North road', 136, 14, {
    sprite: 'sign_wilds',
    text: 'Thornhaven, Graymoor Hold, and beyond them the snow of Hoffender. The road is the same one you walked down.',
  });
  m.add('sign', 'South road', 136, 230, {
    sprite: 'sign_wilds',
    text: 'Eldenmoor, the high elf capital, stands in tiers past the Eldenweald. The woods outside the wall are a young road. The pines behind you are not.',
  });
  m.add('label', 'Valdoria', 80, 80);
  m.add('label', 'Blackpine Tower', 192, 96);
  const mobs = placeMobs(m, g, solid, safe, road, scenery, [
    ['pine_stag', 'stag', 48, 40],
    ['pine_stag', 'stag', 80, 56],
    ['pine_stag', 'stag', 170, 48],
    ['pine_stag', 'stag', 200, 60],
    ['pine_stag', 'stag', 60, 200],
    ['pine_stag', 'stag', 180, 210],
    ['pine_stag', 'stag', 220, 190],
    ['blackpine_wolf', 'wolf', 40, 80],
    ['blackpine_wolf', 'wolf', 90, 90],
    ['blackpine_wolf', 'wolf', 160, 70],
    ['blackpine_wolf', 'wolf', 220, 80],
    ['blackpine_wolf', 'wolf', 48, 220],
    ['blackpine_wolf', 'wolf', 96, 210],
    ['road_brigand', 'bandit', 70, 120],
    ['road_brigand', 'bandit', 96, 140],
    ['road_brigand', 'bandit', 48, 150],
    ['road_brigand', 'bandit', 80, 170],
    ['road_brigand', 'bandit', 160, 180],
    ['road_brigand', 'bandit', 40, 180],
    ['tower_sentry', 'archer', 156, 110],
    ['tower_sentry', 'archer', 226, 118],
    ['tower_sentry', 'archer', 150, 150],
    ['tower_sentry', 'archer', 230, 140],
    ['pine_bear', 'bear', 40, 110],
    ['pine_bear', 'bear', 70, 60],
    ['pine_bear', 'bear', 230, 50],
    ['pine_bear', 'bear', 210, 220],
    ['malrek', 'leader', 230, 168],
  ]);
  border(g, solid);
  const map = m.finish(g, solid, safe, scenery);
  if (safe[132][190] !== 1) throw new Error('Blackpine yard is not safe');
  if (scenery.trees < 500) throw new Error(`valdoria only ${scenery.trees} trees`);
  return { map, mobs, scenery };
}

function buildEldenmoor() {
  const g = grid(W, H, T.GRASS);
  const solid = grid(W, H, 0);
  const safe = grid(W, H, 0);
  const road = grid(W, H, 0);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const n = hash(x, y, 9);
      g[y][x] = n < 0.5 ? T.GRASS : n < 0.82 ? T.GRASS_B : T.FARM;
    }
  }
  pond(g, solid, 196, 70, 18, 12);
  const scenery = paintScenery(g, solid, road, safe, (x, y, roll) => {
    if (y > 148) return null;
    if (roll < 0.01) return { frame: SC.ROCK_SMALL, solid: true, kind: 'rock' };
    if (roll > 0.955) return { frame: hash(x, y, 2) > 0.5 ? SC.TREE : SC.TREE_B, solid: true, kind: 'tree' };
    if (roll > 0.92 && roll < 0.95) return { frame: SC.BUSH_GREEN, solid: false, kind: 'bush' };
    return null;
  });
  stroke(g, solid, road, scenery.grid, [
    [128, 8],
    [120, 40],
    [136, 80],
    [128, 120],
    [128, 156],
  ], 1);
  // Outer wall, the foreigners' ring. North gate opens on the Eldenweald.
  wallBox(g, solid, safe, 64, 156, 192, 246, T.STONE, T.PATH, [[120, 156, 16, 1]]);
  clearPatch(scenery, solid, 65, 157, 191, 245);
  // Second ring: trades and the guild.
  wallBox(g, solid, safe, 86, 176, 170, 230, T.STONE, T.PATH_B, [
    [120, 176, 16, 1],
    [120, 230, 12, 1],
  ]);
  // The castle court. Queen Ellewynn's house. The steward stands in the yard.
  wallBox(g, solid, safe, 108, 190, 148, 218, T.STONE, T.PATH, [[120, 218, 12, 1]]);
  stoneHouse(g, solid, 116, 196, 24, 14);
  house(g, solid, 72, 186, 12, 8);
  house(g, solid, 174, 186, 14, 8);
  house(g, solid, 68, 208, 12, 7);
  house(g, solid, 174, 208, 12, 7);
  house(g, solid, 96, 232, 12, 8);
  house(g, solid, 68, 232, 12, 6);
  house(g, solid, 150, 232, 12, 6);
  const m = maker('eldenmoor', 'Eldenmoor', 'Eldenweald');
  const innEntry = feet(8, 8);
  const wizardEntry = feet(8, 8);
  const shopEntry = feet(8, 8);
  m.add('door', 'Silver Stair', 78, 196, { toZone: 'elden_inn', toX: innEntry.x, toY: innEntry.y, sprite: 'sign_inn' });
  m.add('door', 'The White Pages', 180, 196, { toZone: 'elden_wizard', toX: wizardEntry.x, toY: wizardEntry.y, sprite: 'sign_hall' });
  m.add('door', 'Chapel', 74, 216, { toZone: 'elden_cleric', toX: innEntry.x, toY: innEntry.y, sprite: 'sign_hall' });
  m.add('door', 'Hush Hall', 180, 216, { toZone: 'elden_enchanter', toX: innEntry.x, toY: innEntry.y, sprite: 'sign_hall' });
  m.add('door', 'Oath Hall', 74, 239, { toZone: 'elden_paladin', toX: innEntry.x, toY: innEntry.y, sprite: 'sign_hall' });
  m.add('door', 'Ember Hall', 156, 239, { toZone: 'elden_magician', toX: innEntry.x, toY: innEntry.y, sprite: 'sign_hall' });
  m.add('door', 'Linden Goods', 102, 242, { toZone: 'elden_shop', toX: shopEntry.x, toY: shopEntry.y, sprite: 'sign_inn' });
  m.add('door', 'To Valdoria', 128, 10, { toZone: 'valdoria', toX: feet(128, 238).x, toY: feet(128, 238).y, sprite: 'sign_wilds' });
  m.add('spawn', 'gate', 78, 204);
  m.add('bind', 'inn-yard', 84, 206);
  m.add('npc', 'sere', 140, 164, { defId: 'sere', sprite: 'sere' });
  m.add('npc', 'halden', 128, 214, { defId: 'halden', sprite: 'halden' });
  m.add('prop', 'banner', 128, 186, { sprite: 'banner' });
  m.add('prop', 'well', 96, 200, { sprite: 'well' });
  solid[200][96] = 1;
  solid[201][96] = 1;
  m.add('sign', 'Eldenmoor', 112, 162, {
    sprite: 'sign_hall',
    text: 'Eldenmoor. The outer court holds the halls: Selne for clerics, Miris for enchanters, Adel for paladins, Quen for magicians, Maeriel for wizards. The castle at the center is the house of Queen Ellewynn XVI. Her steward, Halden, stands in the court. The north gate is the Eldenweald.',
  });
  m.add('sign', 'North gate', 144, 150, {
    sprite: 'sign_wilds',
    text: 'The Eldenweald. Hares and foxes near the wall. Wolves, then poachers, then the Amber Hart where the trees thicken. The road north leaves the woods for Valdoria.',
  });
  m.add('sign', 'The road north', 136, 24, {
    sprite: 'sign_wilds',
    text: 'Valdoria and Blackpine Tower. Past them, Thornhaven, and past that the snow of Hoffender. It is a long walk, and the middle of it is not a beginner\'s road.',
  });
  m.add('label', 'Eldenmoor', 128, 222);
  m.add('label', 'Eldenweald', 80, 60);
  const mobs = placeMobs(m, g, solid, safe, road, scenery, [
    ['meadow_hare', 'hare', 48, 140],
    ['meadow_hare', 'hare', 90, 136],
    ['meadow_hare', 'hare', 160, 140],
    ['meadow_hare', 'hare', 200, 132],
    ['meadow_hare', 'hare', 40, 120],
    ['meadow_hare', 'hare', 220, 124],
    ['glade_fox', 'fox', 56, 110],
    ['glade_fox', 'fox', 100, 118],
    ['glade_fox', 'fox', 170, 112],
    ['glade_fox', 'fox', 210, 100],
    ['glade_fox', 'fox', 70, 100],
    ['weald_wolf', 'wolf', 44, 88],
    ['weald_wolf', 'wolf', 80, 80],
    ['weald_wolf', 'wolf', 160, 84],
    ['weald_wolf', 'wolf', 210, 78],
    ['weald_wolf', 'wolf', 100, 70],
    ['weald_wolf', 'wolf', 180, 60],
    ['weald_wolf', 'wolf', 50, 64],
    ['weald_wolf', 'wolf', 230, 90],
    ['glade_beetle', 'beetle', 40, 70],
    ['glade_beetle', 'beetle', 150, 100],
    ['glade_beetle', 'beetle', 220, 64],
    ['glade_beetle', 'beetle', 90, 50],
    ['weald_spider', 'spider', 36, 48],
    ['weald_spider', 'spider', 70, 40],
    ['weald_spider', 'spider', 160, 44],
    ['weald_spider', 'spider', 210, 36],
    ['weald_bandit', 'bandit', 48, 36],
    ['weald_bandit', 'bandit', 100, 32],
    ['weald_bandit', 'bandit', 170, 28],
    ['weald_bandit', 'bandit', 220, 48],
    ['weald_bear', 'bear', 40, 24],
    ['weald_bear', 'bear', 80, 20],
    ['weald_bear', 'bear', 200, 22],
    ['lark_poacher', 'vetch', 60, 30],
    ['amber_hart', 'stag', 180, 36],
  ]);
  border(g, solid);
  // The north door and the inn yard must stay open after the border pass.
  const map = m.finish(g, solid, safe, scenery);
  if (safe[200][128] !== 1) throw new Error('Eldenmoor court is not safe');
  if (safe[40][80] === 1) throw new Error('the Eldenweald was marked safe');
  if (scenery.trees < 400) throw new Error(`eldenweald only ${scenery.trees} trees`);
  const interiors = [
    interior('elden_inn', 'Silver Stair Inn', feet(78, 202), [
      ['liriel', 'liriel', 5, 4],
    ]),
    interior('elden_wizard', 'The White Pages', feet(180, 202), [
      ['maeriel', 'maeriel', 6, 4],
    ]),
    interior('elden_cleric', 'The Chapel', feet(74, 220), [
      ['selne', 'selne', 6, 4],
    ]),
    interior('elden_enchanter', 'Hush Hall', feet(180, 220), [
      ['miris', 'miris', 6, 4],
    ]),
    interior('elden_paladin', 'Oath Hall', feet(74, 242), [
      ['adel', 'adel', 6, 4],
    ]),
    interior('elden_magician', 'Ember Hall', feet(156, 242), [
      ['quen', 'quen', 6, 4],
    ]),
    interior('elden_shop', 'Linden Goods', feet(102, 244), [
      ['tael', 'tael', 5, 4],
    ]),
  ];
  return { map, interiors, mobs, scenery };
}

function interior(id, title, exit, occupants) {
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
  objects.push({
    kind: 'door',
    name: 'exit',
    ...feet(doorX, h - 1),
    toZone: 'eldenmoor',
    toX: exit.x,
    toY: exit.y,
    sprite: 'sign_inn',
  });
  objects.push({ kind: 'spawn', name: 'entry', ...feet(doorX, h - 3) });
  for (const [defId, sprite, tx, ty] of occupants) {
    objects.push({ kind: 'npc', name: defId, defId, sprite, ...feet(tx, ty) });
  }
  objects.push({ kind: 'prop', name: 'fire', sprite: 'firepit', ...feet(3, 3) });
  objects.push({
    kind: 'sign',
    name: title,
    sprite: 'sign_hall',
    text: `${title}. The door returns to Eldenmoor.`,
    ...feet(w - 3, 3),
  });
  return makeMap(id, g, solid, safe, objects, [
    { name: 'zoneId', type: 'string', value: id },
    { name: 'townName', type: 'string', value: title },
    { name: 'wildsName', type: 'string', value: title },
  ]);
}

function carveRoom(g, solid, x, y, w, h) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      g[yy][xx] = (xx + yy) % 6 === 0 ? T.DUNGEON : T.ROCK_GROUND;
      solid[yy][xx] = 0;
    }
  }
}

function corridor(g, solid, x0, y0, x1, y1) {
  let x = x0;
  let y = y0;
  const step = () => carveRoom(g, solid, x - 1, y - 1, 3, 3);
  step();
  while (x !== x1 || y !== y1) {
    if (x !== x1) x += Math.sign(x1 - x);
    else y += Math.sign(y1 - y);
    step();
  }
}

function buildFloor(id, town, rooms, halls, spec) {
  const w = 96;
  const h = 96;
  const g = grid(w, h, T.STONE);
  const solid = grid(w, h, 1);
  const safe = grid(w, h, 0);
  for (const [x, y, rw, rh] of rooms) carveRoom(g, solid, x, y, rw, rh);
  for (const [x0, y0, x1, y1] of halls) corridor(g, solid, x0, y0, x1, y1);
  const m = maker(id, town, town);
  for (const door of spec.doors) {
    m.add('door', door.name, door.tx, door.ty, {
      toZone: door.toZone,
      toX: feet(door.toTx, door.toTy).x,
      toY: feet(door.toTx, door.toTy).y,
      sprite: 'sign_wilds',
    });
  }
  if (spec.spawn) m.add('spawn', 'entry', spec.spawn[0], spec.spawn[1]);
  for (const sign of spec.signs) m.add('sign', sign.name, sign.tx, sign.ty, { sprite: 'sign_wilds', text: sign.text });
  for (const label of spec.labels) m.add('label', label[0], label[1], label[2]);
  if (spec.npc) m.add('npc', spec.npc[0], spec.npc[1], spec.npc[2], { defId: spec.npc[0], sprite: spec.npc[3] });
  const scenery = { grid: grid(w, h, 0) };
  for (let y = 2; y < h - 2; y++) {
    for (let x = 2; x < w - 2; x++) {
      if (solid[y][x]) continue;
      if (hash(x, y, 15) > 0.04) continue;
      scenery.grid[y][x] = hash(x, y, 16) > 0.5 ? SC.ROCK : SC.ROCK_SMALL;
      solid[y][x] = 1;
    }
  }
  const mobs = placeMobs(m, g, solid, safe, grid(w, h, 0), scenery, spec.mobs);
  for (const [tx, ty] of spec.glow ?? []) {
    if (g[ty] && !solid[ty][tx]) g[ty][tx] = T.GLOW;
  }
  const map = m.finish(g, solid, safe, scenery);
  return { map, mobs };
}

function buildBlackIce() {
  const mouth = buildFloor('blackice1', 'The Rime Mouth', [
    [40, 70, 16, 18],
    [28, 40, 40, 18],
    [8, 42, 14, 14],
    [72, 42, 16, 14],
    [40, 12, 16, 16],
  ], [
    [48, 78, 48, 50],
    [48, 48, 16, 48],
    [48, 48, 78, 48],
    [48, 48, 48, 20],
  ], {
    doors: [
      { name: 'Back to the Fang', tx: 48, ty: 86, toZone: 'frostfang', toTx: 108, toTy: 22 },
      { name: 'Down to the Gallery', tx: 48, ty: 16, toZone: 'blackice2', toTx: 48, toTy: 78 },
    ],
    spawn: [48, 80],
    signs: [
      {
        name: 'The mouth',
        tx: 56,
        ty: 80,
        text: 'The Rime Mouth. The stair behind you returns to the Fang, and to Vargan\'s cleft. The stair north goes down into the Shatter Gallery. Anwen keeps a fire in the west room, if the cold has not taken it.',
      },
    ],
    labels: [['The Rime Mouth', 48, 60]],
    npc: ['anwen', 14, 48, 'anwen'],
    glow: [[48, 78], [14, 46]],
    mobs: [
      ['rime_crawler', 'crawler', 34, 46],
      ['rime_crawler', 'crawler', 40, 52],
      ['rime_crawler', 'crawler', 58, 46],
      ['rime_crawler', 'crawler', 62, 54],
      ['rime_crawler', 'crawler', 36, 74],
      ['rime_crawler', 'crawler', 58, 74],
      ['rime_crawler', 'crawler', 44, 40],
      ['rime_crawler', 'crawler', 52, 36],
      ['shard_lurker', 'widow', 12, 46],
      ['shard_lurker', 'widow', 16, 52],
      ['shard_lurker', 'widow', 76, 46],
      ['shard_lurker', 'widow', 80, 52],
      ['rime_sentry', 'bones', 44, 22],
      ['rime_sentry', 'bones', 54, 24],
      ['rime_sentry', 'bones', 48, 28],
      ['warden_pell', 'leader', 78, 48],
    ],
  });
  const gallery = buildFloor('blackice2', 'The Shatter Gallery', [
    [40, 70, 16, 18],
    [20, 36, 56, 22],
    [8, 16, 16, 14],
    [72, 16, 16, 14],
    [40, 12, 16, 14],
  ], [
    [48, 78, 48, 48],
    [48, 46, 16, 24],
    [48, 46, 80, 24],
    [48, 46, 48, 18],
  ], {
    doors: [
      { name: 'Up to the Mouth', tx: 48, ty: 84, toZone: 'blackice1', toTx: 48, toTy: 24 },
      { name: 'Down to the Vault', tx: 48, ty: 16, toZone: 'blackice3', toTx: 48, toTy: 78 },
    ],
    spawn: [48, 76],
    signs: [
      {
        name: 'The gallery',
        tx: 58,
        ty: 74,
        text: 'The Shatter Gallery. Ice that broke and kept the shape of a hall. Magister Calden walks the middle. The north stair is Ysolde\'s vault. The south stair returns to the Mouth.',
      },
    ],
    labels: [['The Shatter Gallery', 48, 44]],
    glow: [[48, 46], [28, 42], [68, 42]],
    mobs: [
      ['gallery_guard', 'mira', 28, 42],
      ['gallery_guard', 'mira', 36, 50],
      ['gallery_guard', 'mira', 60, 42],
      ['gallery_guard', 'mira', 68, 50],
      ['gallery_guard', 'mira', 44, 40],
      ['gallery_guard', 'mira', 52, 52],
      ['blackice_knight', 'bones', 14, 20],
      ['blackice_knight', 'bones', 18, 24],
      ['blackice_knight', 'bones', 76, 20],
      ['blackice_knight', 'bones', 80, 24],
      ['shard_lurker', 'widow', 24, 46],
      ['shard_lurker', 'widow', 70, 46],
      ['magister_calden', 'witch', 48, 44],
    ],
  });
  const vault = buildFloor('blackice3', 'The Black Vault', [
    [40, 68, 16, 18],
    [24, 20, 48, 36],
    [8, 28, 12, 12],
    [76, 28, 12, 12],
  ], [
    [48, 76, 48, 40],
    [48, 36, 14, 34],
    [48, 36, 80, 34],
  ], {
    doors: [
      { name: 'Up to the Gallery', tx: 48, ty: 82, toZone: 'blackice2', toTx: 48, toTy: 24 },
    ],
    spawn: [48, 74],
    signs: [
      {
        name: 'The vault',
        tx: 58,
        ty: 72,
        text: 'The Black Vault. Ysolde of the Black Ice keeps the far end of the hall. She is not the shade on Rimeheart Lake, and she is not Vargan. The stair south is the only way back.',
      },
    ],
    labels: [['The Black Vault', 48, 52]],
    glow: [[48, 30], [36, 28], [60, 28]],
    mobs: [
      ['blackice_knight', 'bones', 32, 32],
      ['blackice_knight', 'bones', 40, 40],
      ['blackice_knight', 'bones', 56, 40],
      ['blackice_knight', 'bones', 64, 32],
      ['rime_sentry', 'bones', 12, 32],
      ['rime_sentry', 'bones', 80, 32],
      ['blackice_knight', 'bones', 30, 48],
      ['blackice_knight', 'bones', 66, 48],
      ['ysolde', 'ysolde', 48, 28],
    ],
  });
  for (const floor of [mouth, gallery, vault]) {
    if (floor.mobs.length < 6) throw new Error(`${floor.map.id} is thin`);
  }
  if (!vault.mobs.includes('ysolde')) throw new Error('Ysolde missing');
  if (!mouth.mobs.includes('anwen') && !mouth.map.objects.some((obj) => obj.defId === 'anwen')) {
    throw new Error('Anwen missing');
  }
  return [mouth.map, gallery.map, vault.map];
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

export function buildSouthlands() {
  const thornhaven = buildThornhaven();
  const valdoria = buildValdoria();
  const elden = buildEldenmoor();
  const ice = buildBlackIce();
  const maps = [thornhaven.map, valdoria.map, elden.map, ...elden.interiors, ...ice];
  clearArrivals(maps);
  const charts = {
    graymoor: { zone: 'thornhaven', x: 100, y: 20, w: 60, h: 56 },
    thornhaven_fields: { zone: 'thornhaven', x: 16, y: 80, w: 224, h: 160 },
    blackpine: { zone: 'valdoria', x: 150, y: 90, w: 80, h: 70 },
    valdoria_road: { zone: 'valdoria', x: 16, y: 16, w: 224, h: 220 },
    eldenmoor: { zone: 'eldenmoor', x: 60, y: 150, w: 140, h: 100 },
    eldenweald: { zone: 'eldenmoor', x: 16, y: 8, w: 224, h: 140 },
    rime_mouth: { zone: 'blackice1', x: 4, y: 8, w: 88, h: 84 },
    shatter_gallery: { zone: 'blackice2', x: 4, y: 8, w: 88, h: 84 },
    black_vault: { zone: 'blackice3', x: 4, y: 12, w: 88, h: 78 },
  };
  console.log(
    `southlands thornhaven mobs ${thornhaven.mobs.length} trees ${thornhaven.scenery.trees}; valdoria mobs ${valdoria.mobs.length} trees ${valdoria.scenery.trees}; elden mobs ${elden.mobs.length} trees ${elden.scenery.trees}`,
  );
  return { maps, charts };
}
