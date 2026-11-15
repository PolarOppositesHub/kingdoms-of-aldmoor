/**
 * Frostfang Reach, the Ogre Highlands north of the Frostmere Wilds.
 * 256×256. The south gate lines up with the Frostmere north road.
 * Original layout. Tile ids match tools/frostmere-map.mjs.
 */
export const TILE = 16;

const T = {
  SNOW: 1,
  SNOW_B: 2,
  SNOW_C: 3,
  PATH: 4,
  PATH_B: 5,
  ICE: 6,
  WATER: 7,
  WATER_B: 8,
  PALISADE: 23,
  POST: 24,
  ROCK_GROUND: 51,
  CLIFF: 53,
  DEEP_SNOW: 55,
  PINE_GROUND: 50,
  CAVE: 61,
  GLOW: 65,
};

const W = 256;
const H = 256;

/** South zone line. Frostmere's north road is the same x. */
export const GATE = { tx: 106, ty: 250 };
/** Where a traveler from Frostmere appears, north of the return door. */
export const ARRIVE = { tx: 106, ty: 244 };
/** Where the return door sends them, south of Frostmere's gate door. */
export const FROSTMERE_RETURN = { tx: 106, ty: 10 };

const SC = {
  PINE_SNOW: 1,
  PINE_SNOW_B: 2,
  PINE_DARK: 3,
  PINE_DARK_B: 4,
  ROCK: 7,
  ROCK_SMALL: 8,
  BUSH_SNOW: 10,
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

export function buildFrostfang() {
  const g = grid(W, H, T.SNOW);
  const solid = grid(W, H, 0);
  const safe = grid(W, H, 0);
  const road = grid(W, H, 0);
  const objects = [];

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const n = hash(x, y, 4);
      const north = y < 90;
      const south = y > 175;
      if (north && n < 0.42) g[y][x] = T.ROCK_GROUND;
      else if (north && n < 0.62) g[y][x] = T.DEEP_SNOW;
      else if (!south && n < 0.28) g[y][x] = T.ROCK_GROUND;
      else if (south && n > 0.82) g[y][x] = T.PINE_GROUND;
      else g[y][x] = n < 0.4 ? T.SNOW : n < 0.72 ? T.SNOW_B : T.SNOW_C;
    }
  }

  paintTarn(g, solid);
  paintCliffs(g, solid);

  let sceneryGrid = null;
  const stampRoad = (x, y) => {
    if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) return;
    g[y][x] = (x + y) % 5 === 0 ? T.PATH_B : T.PATH;
    solid[y][x] = 0;
    road[y][x] = 1;
    if (sceneryGrid) sceneryGrid[y][x] = 0;
  };

  const stroke = (points, radius) => {
    for (let i = 0; i < points.length - 1; i++) {
      const [x0, y0] = points[i];
      const [x1, y1] = points[i + 1];
      const len = Math.hypot(x1 - x0, y1 - y0);
      const steps = Math.max(1, Math.ceil(len * 2));
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const px = x0 + (x1 - x0) * t;
        const py = y0 + (y1 - y0) * t;
        const nx = -(y1 - y0) / (len || 1);
        const ny = (x1 - x0) / (len || 1);
        const wob = Math.sin(t * Math.PI * Math.max(1, len / 10)) * 0.8;
        const cx = Math.round(px + nx * wob);
        const cy = Math.round(py + ny * wob);
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) > radius) continue;
            stampRoad(cx + dx, cy + dy);
          }
        }
      }
    }
  };

  const southRoad = [
    [GATE.tx, GATE.ty],
    [112, 232],
    [120, 216],
    [124, 212],
  ];
  const northRoad = [
    [124, 186],
    [132, 164],
    [120, 140],
    [126, 112],
    [114, 86],
    [108, 64],
    [110, 44],
    [108, 30],
  ];
  const westRoad = [
    [120, 148],
    [96, 144],
    [72, 138],
    [48, 134],
    [36, 128],
  ];
  const eastRoad = [
    [132, 156],
    [154, 152],
    [172, 146],
  ];

  stroke(southRoad, 1);
  stroke(northRoad, 1);
  stroke(westRoad, 1);
  stroke(eastRoad, 1);
  stampCamp(g, solid, safe, road);

  const scenery = paintScenery(g, solid, road, safe);
  sceneryGrid = scenery.grid;

  const add = (kind, name, tx, ty, extra = {}) => {
    const p = feet(tx, ty);
    objects.push({ kind, name, x: p.x, y: p.y, ...extra });
    if (ty > 0 && ty < H && tx > 0 && tx < W && scenery.grid[ty]?.[tx] && kind !== 'label') {
      scenery.grid[ty][tx] = 0;
    }
    if (kind === 'npc' || kind === 'mob' || kind === 'spawn' || kind === 'bind' || kind === 'door') {
      if (ty > 0 && ty < H && tx > 0 && tx < W) {
        solid[ty][tx] = 0;
        if (g[ty][tx] === T.CLIFF || g[ty][tx] === T.CAVE || g[ty][tx] === T.WATER || g[ty][tx] === T.WATER_B) {
          g[ty][tx] = T.PATH;
        }
      }
    }
  };

  carveArena(g, solid, scenery.grid);

  add('door', 'To the Frostmere Wilds', GATE.tx, GATE.ty, {
    toZone: 'hoffender',
    toX: FROSTMERE_RETURN.tx * TILE + 8,
    toY: FROSTMERE_RETURN.ty * TILE + 14,
    sprite: 'sign_wilds',
  });
  add('spawn', 'player', ARRIVE.tx, ARRIVE.ty);
  add('sign', 'Frostfang gate', GATE.tx + 3, GATE.ty - 1, {
    sprite: 'sign_wilds',
    text: 'The ridge road back to the Frostmere Wilds. Hoffender is south, through the pines. Hearthpass, and Kara Holm\'s fire, is the short walk north.',
  });

  add('npc', 'kara', 120, 198, { defId: 'kara', sprite: 'kara' });
  add('npc', 'orm', 132, 200, { defId: 'orm', sprite: 'orm' });
  add('bind', 'hearthpass-fire', 126, 204);
  add('prop', 'campfire', 126, 203, { sprite: 'firepit' });
  add('prop', 'banner', 126, 190, { sprite: 'banner' });
  add('prop', 'crate', 134, 194, { sprite: 'crate' });
  solid[194][134] = 1;
  add('prop', 'barrel', 118, 194, { sprite: 'barrel' });
  solid[194][118] = 1;
  add('sign', 'Hearthpass', 116, 206, {
    sprite: 'sign_hall',
    text: 'Hearthpass. Kara Holm keeps the fire for Jarl Freya. The palisade is the end of an ogre\'s nerve. Sit here. Ask Kara if you want a fall to bring you back to this yard.',
  });

  add('label', 'Frostfang Reach', 124, 228);
  add('label', 'Hearthpass', 126, 180);
  add('label', 'Broken Fangs', 64, 118);
  add('label', 'Tarn of Shards', 196, 122);
  add('label', 'The Fang', 108, 22);

  add('sign', 'Broken Fangs', 52, 126, {
    sprite: 'sign_wilds',
    text: 'The Broken Fangs. Ogre camps in the rock. Grimhild the Toll takes the west road and does not give receipts.',
  });
  add('sign', 'Tarn of Shards', 170, 150, {
    sprite: 'sign_wilds',
    text: 'Tarn of Shards. The ice holds. The water in the middle does not. Ashjaw walks the shore when the tarn feels like company.',
  });
  add('sign', 'The Fang', 112, 46, {
    sprite: 'sign_wilds',
    text: 'The Fang. The cleft of Vargan Frostfang, war-chief of the highland ogres. The road ends at his mouth of stone.',
  });

  // A ring the ogres did not build. They camp in it.
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const rx = Math.round(64 + Math.cos(a) * 5);
    const ry = Math.round(122 + Math.sin(a) * 4);
    if (i === 6) continue;
    add('prop', `circle-${i}`, rx, ry, { sprite: i % 2 ? 'rock' : 'rock_small' });
    if (ry > 0 && rx > 0) solid[ry][rx] = 1;
  }
  add('sign', 'Broken Circle', 64, 126, {
    sprite: 'sign_wilds',
    text: 'A ring of stones older than the camps. The ogres did not raise it. They sleep inside it anyway.',
  });

  const mobs = [];
  const occupied = grid(W, H, 0);
  const spawnMob = (defId, tx, ty, sprite) => {
    if (tx < 2 || ty < 2 || tx >= W - 2 || ty >= H - 2) return false;
    if (solid[ty][tx] || safe[ty][tx] || road[ty][tx]) return false;
    const tile = g[ty][tx];
    if (tile === T.WATER || tile === T.WATER_B || tile === T.CLIFF || tile === T.CAVE) return false;
    if (occupied[ty][tx]) return false;
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        if (occupied[ty + dy]?.[tx + dx]) return false;
      }
    }
    occupied[ty][tx] = 1;
    scenery.grid[ty][tx] = 0;
    solid[ty][tx] = 0;
    add('mob', defId, tx, ty, { defId, sprite: sprite ?? defId });
    mobs.push(defId);
    return true;
  };

  const scatter = (defId, sprite, count, pred, gap = 4) => {
    const spots = [];
    for (let y = 3; y < H - 3; y++) {
      for (let x = 3; x < W - 3; x++) {
        if (!pred(x, y)) continue;
        if (solid[y][x] || safe[y][x] || road[y][x]) continue;
        const tile = g[y][x];
        if (tile === T.WATER || tile === T.WATER_B || tile === T.CLIFF || tile === T.CAVE) continue;
        spots.push([x, y, hash(x, y, defId.length * 13 + 5)]);
      }
    }
    spots.sort((a, b) => a[2] - b[2]);
    let placed = 0;
    for (const [x, y] of spots) {
      if (placed >= count) break;
      let crowded = false;
      for (let dy = -gap; dy <= gap && !crowded; dy++) {
        for (let dx = -gap; dx <= gap; dx++) if (occupied[y + dy]?.[x + dx]) crowded = true;
      }
      if (crowded) continue;
      if (spawnMob(defId, x, y, sprite)) placed++;
    }
    return placed;
  };

  const near = (x, y, tx, ty, r) => Math.abs(x - tx) + Math.abs(y - ty) <= r;
  const counts = {
    highland_wolf: scatter('highland_wolf', 'highland_wolf', 8, (x, y) => y > 188 && y < 242 && x > 60 && x < 180 && !near(x, y, 124, 198, 18)),
    ridge_lynx: scatter('ridge_lynx', 'lynx', 6, (x, y) => y > 176 && y < 236 && x > 40 && x < 210),
    ogre_scout: scatter('ogre_scout', 'ogre', 6, (x, y) => y > 162 && y < 198 && x > 40 && x < 210 && !near(x, y, 124, 198, 20)),
    stone_ram: scatter('stone_ram', 'ram', 5, (x, y) => y > 112 && y < 168 && x > 28 && x < 150),
    ogre_raider: scatter('ogre_raider', 'ogre', 8, (x, y) => y > 108 && y < 168 && x < 118 && x > 24),
    ogre_clubber: scatter('ogre_clubber', 'ogre_brute', 6, (x, y) => y > 112 && y < 158 && x > 28 && x < 96),
    frost_troll: scatter('frost_troll', 'troll', 6, (x, y) => y > 112 && y < 176 && x > 160 && x < 236),
    rime_ogre: scatter('rime_ogre', 'ogre_brute', 6, (x, y) => y > 32 && y < 78 && x > 78 && x < 150),
    fang_guard: scatter('fang_guard', 'ogre_brute', 4, (x, y) => y > 24 && y < 52 && x > 88 && x < 140 && !near(x, y, 108, 28, 4)),
  };

  const forceMob = (defId, tx, ty, sprite) => {
    if (g[ty][tx] === T.WATER || g[ty][tx] === T.WATER_B || g[ty][tx] === T.CLIFF) g[ty][tx] = T.SNOW;
    solid[ty][tx] = 0;
    road[ty][tx] = 0;
    safe[ty][tx] = 0;
    scenery.grid[ty][tx] = 0;
    add('mob', defId, tx, ty, { defId, sprite });
    mobs.push(defId);
  };

  if (!mobs.includes('grimhild')) forceMob('grimhild', 58, 140, 'grimhild');
  if (!mobs.includes('ashjaw')) forceMob('ashjaw', 188, 156, 'ashjaw');
  if (!mobs.includes('skarn')) forceMob('skarn', 96, 58, 'skarn');
  if (!mobs.includes('vargan_frostfang')) {
    g[26][108] = T.GLOW;
    forceMob('vargan_frostfang', 108, 28, 'vargan');
  }
  g[18][108] = T.CAVE;
  solid[18][108] = 1;
  scenery.grid[18][108] = 0;

  for (const [id, n] of Object.entries(counts)) {
    const min = id === 'fang_guard' || id === 'stone_ram' ? 3 : 4;
    if (n < min) throw new Error(`frostfang placed only ${n} ${id}`);
  }

  for (let x = 0; x < W; x++) {
    solid[0][x] = 1;
    solid[H - 1][x] = 1;
    if (g[0][x] !== T.CLIFF) g[0][x] = T.CLIFF;
    if (g[H - 1][x] !== T.CLIFF) g[H - 1][x] = T.CLIFF;
  }
  for (let y = 0; y < H; y++) {
    solid[y][0] = 1;
    solid[y][W - 1] = 1;
  }
  for (const obj of objects) {
    if (obj.kind !== 'door' && obj.kind !== 'spawn' && obj.kind !== 'npc' && obj.kind !== 'mob' && obj.kind !== 'bind') continue;
    const tx = Math.floor(obj.x / TILE);
    const ty = Math.floor(obj.y / TILE);
    if (ty > 0 && ty < H - 1 && tx > 0 && tx < W - 1) {
      solid[ty][tx] = 0;
      scenery.grid[ty][tx] = 0;
    }
  }

  for (const obj of objects) {
    if (obj.kind === 'prop' || obj.kind === 'label' || obj.kind === 'sign' || obj.kind === 'door') continue;
    const tx = Math.floor(obj.x / TILE);
    const ty = Math.floor(obj.y / TILE);
    if (solid[ty]?.[tx]) throw new Error(`${obj.kind} ${obj.name} is blocked at ${tx},${ty}`);
  }

  const map = makeMap('frostfang', g, solid, safe, objects, [
    { name: 'zoneId', type: 'string', value: 'frostfang' },
    { name: 'townName', type: 'string', value: 'Hearthpass' },
    { name: 'wildsName', type: 'string', value: 'Frostfang Reach' },
  ], scenery.grid);

  const charts = {
    hearthpass: { zone: 'frostfang', x: 70, y: 168, w: 110, h: 82 },
    broken_fangs: { zone: 'frostfang', x: 20, y: 96, w: 120, h: 80 },
    tarn_shards: { zone: 'frostfang', x: 140, y: 108, w: 100, h: 72 },
    the_fang: { zone: 'frostfang', x: 48, y: 8, w: 130, h: 78 },
  };

  const campSafe = safe[198][124] === 1;
  if (!campSafe) throw new Error('Hearthpass is not safe ground');
  if (solid[GATE.ty][GATE.tx] || solid[ARRIVE.ty][ARRIVE.tx]) throw new Error('frostfang gate is blocked');
  if (!mobs.includes('vargan_frostfang')) throw new Error('Vargan missing');

  console.log(`frostfang mobs ${mobs.length} trees ${scenery.trees} rocks ${scenery.rocks} bushes ${scenery.bushes}`);
  return { map, charts, mobs, counts };
}

function paintTarn(g, solid) {
  const cx = 198;
  const cy = 140;
  for (let y = cy - 16; y <= cy + 16; y++) {
    for (let x = cx - 22; x <= cx + 22; x++) {
      if (y < 1 || x < 1 || y >= H - 1 || x >= W - 1) continue;
      const dx = (x - cx) / 22;
      const dy = (y - cy) / 14;
      const d = dx * dx + dy * dy;
      if (d > 1) continue;
      if (d < 0.28) {
        g[y][x] = (x + y) % 2 === 0 ? T.WATER : T.WATER_B;
        solid[y][x] = 1;
      } else {
        g[y][x] = T.ICE;
        solid[y][x] = 0;
      }
    }
  }
}

function paintCliffs(g, solid) {
  for (let y = 2; y < 88; y++) {
    for (let x = 2; x < W - 2; x++) {
      const pass = Math.abs(x - 112) <= 10 && y > 26 && y < 80;
      const arena = x > 92 && x < 128 && y > 16 && y < 42;
      if (pass || arena) continue;
      const shoulder = y < 80 && (x < 78 || x > 156);
      const wall = y < 16;
      if (!shoulder && !wall) continue;
      if (hash(x, y, 11) > 0.55 && !wall) continue;
      g[y][x] = T.CLIFF;
      solid[y][x] = 1;
    }
  }
}

function stampCamp(g, solid, safe, road) {
  const x0 = 112;
  const y0 = 186;
  const x1 = 138;
  const y1 = 212;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const edge = x === x0 || x === x1 || y === y0 || y === y1;
      const southGate = y === y1 && x >= 120 && x <= 128;
      const northGate = y === y0 && x >= 120 && x <= 128;
      if (edge && !southGate && !northGate) {
        g[y][x] = x === x0 + 1 || x === x1 - 1 ? T.POST : T.PALISADE;
        solid[y][x] = 1;
        safe[y][x] = 0;
        road[y][x] = 0;
      } else {
        g[y][x] = T.PATH;
        solid[y][x] = 0;
        safe[y][x] = 1;
        road[y][x] = southGate || northGate ? 1 : 0;
      }
    }
  }
}

function carveArena(g, solid, scenery) {
  for (let y = 20; y <= 40; y++) {
    for (let x = 96; x <= 122; x++) {
      if (g[y][x] === T.CLIFF || g[y][x] === T.WATER) g[y][x] = T.ROCK_GROUND;
      solid[y][x] = 0;
      if (scenery[y]) scenery[y][x] = 0;
    }
  }
  g[28][108] = T.GLOW;
}

function paintScenery(g, solid, road, safe) {
  const scenery = grid(W, H, 0);
  let trees = 0;
  let rocks = 0;
  let bushes = 0;
  const nearRoad = (x, y) => {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) if (road[y + dy]?.[x + dx]) return true;
    }
    return false;
  };
  const open = new Set([T.SNOW, T.SNOW_B, T.SNOW_C, T.DEEP_SNOW, T.ROCK_GROUND, T.PINE_GROUND, T.ICE]);
  for (let y = 2; y < H - 2; y++) {
    for (let x = 2; x < W - 2; x++) {
      if (solid[y][x] || safe[y][x] || road[y][x] || nearRoad(x, y)) continue;
      if (!open.has(g[y][x])) continue;
      const roll = hash(x, y, 21);
      const north = y < 100;
      const south = y > 180;
      if (roll < (north ? 0.028 : 0.014)) {
        scenery[y][x] = hash(x, y, 23) > 0.45 ? SC.ROCK : SC.ROCK_SMALL;
        solid[y][x] = 1;
        rocks++;
        continue;
      }
      const treeChance = south ? 0.04 : north ? 0.012 : 0.02;
      if (roll > 0.25 && roll < 0.25 + treeChance) {
        const dark = !south && hash(x, y, 22) > 0.5;
        scenery[y][x] = dark ? (hash(x, y, 8) > 0.5 ? SC.PINE_DARK : SC.PINE_DARK_B) : hash(x, y, 8) > 0.5 ? SC.PINE_SNOW : SC.PINE_SNOW_B;
        solid[y][x] = 1;
        trees++;
        continue;
      }
      if (roll > 0.968) {
        scenery[y][x] = north ? SC.BUSH_DARK : SC.BUSH_SNOW;
        bushes++;
      }
    }
  }
  return { trees, rocks, bushes, grid: scenery };
}
