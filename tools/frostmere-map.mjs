/**
 * Frostmere Wilds, 256×256, plus indoor maps and the Barrow.
 * Original layout. Tile ids match the tileset painted in build-art.mjs.
 */
import { mulberry } from './pixel.mjs';

export const TILE = 16;

export const T = {
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
  FLOOR: 45,
  GRASS: 46,
  GRASS_B: 47,
  MUD: 48,
  SLUSH: 49,
  PINE_GROUND: 50,
  ROCK_GROUND: 51,
  SAND: 52,
  CLIFF: 53,
  ICE_FLOE: 54,
  DEEP_SNOW: 55,
  FARM: 56,
  TREE: 57,
  TREE_B: 58,
  ROCK: 59,
  BUSH: 60,
  CAVE: 61,
  STACK: 62,
  SHELF: 63,
  DUNGEON: 64,
  GLOW: 65,
};

const W = 256;
const H = 256;

const CITY_X = 90;
const CITY_Y = 120;
const CITY_S = 64;

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

/**
 * @param {number[][]} g
 * @param {number[][]} solid
 * @param {number[][]} safe
 * @param {object[]} objects
 */
function makeMap(id, g, solid, safe, objects, props) {
  return { id, ground: g, solid, safe, objects, props };
}

export function buildWorld() {
  const outdoor = buildOutdoor();
  const interiors = buildInteriors(outdoor.buildings, outdoor.barrowDoor);
  const barrow = buildBarrow(outdoor.barrowReturn);
  const maps = [outdoor.map, barrow, ...interiors];
  validate(outdoor, maps);
  return { maps, charts: outdoor.charts };
}

function buildOutdoor() {
  const g = grid(W, H, T.SNOW);
  const solid = grid(W, H, 0);
  const safe = grid(W, H, 0);
  const road = grid(W, H, 0);
  const objects = [];
  const rand = mulberry(11);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const n = hash(x, y, 3);
      g[y][x] = n < 0.45 ? T.SNOW : n < 0.75 ? T.SNOW_B : T.SNOW_C;
    }
  }

  const shore = buildShore();
  paintSea(g, solid, shore);
  paintBiomes(g, solid, shore);
  paintLake(g, solid);
  paintShelfAndFloes(g, solid, shore);

  const stampRoad = (x, y, tile = T.PATH) => {
    if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) return;
    if (g[y][x] === T.WATER || g[y][x] === T.WATER_B || g[y][x] === T.ICE_FLOE || g[y][x] === T.STACK) return;
    g[y][x] = tile;
    solid[y][x] = 0;
    road[y][x] = 1;
  };

  const stroke = (points, radius, tile = T.PATH) => {
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
        const wob = Math.sin(t * Math.PI * Math.max(1, len / 9)) * 1.15;
        const cx = Math.round(px + nx * wob);
        const cy = Math.round(py + ny * wob);
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) > radius) continue;
            stampRoad(cx + dx, cy + dy, (dx + dy) % 5 === 0 ? T.PATH_B : tile);
          }
        }
      }
    }
  };

  const north = [
    [120, 119],
    [114, 104],
    [126, 90],
    [112, 76],
    [124, 64],
    [110, 52],
  ];
  const toCairns = [
    [110, 52],
    [96, 44],
    [82, 36],
    [70, 28],
    [58, 20],
    [52, 14],
  ];
  const toFrostfang = [
    [110, 52],
    [102, 38],
    [112, 24],
    [98, 14],
    [106, 4],
  ];
  const toRime = [
    [110, 52],
    [126, 44],
    [142, 38],
    [160, 32],
    [176, 28],
    [192, 26],
    [204, 34],
  ];
  const east = [
    [155, 152],
    [170, 144],
    [184, 156],
    [198, 146],
    [214, 158],
    [228, 148],
    [242, 156],
    [252, 152],
  ];
  const south = [
    [120, 185],
    [110, 198],
    [96, 210],
    [108, 222],
    [122, 232],
    [134, 244],
    [140, 252],
  ];

  stroke(north, 1);
  stroke(toCairns, 1);
  stroke(toFrostfang, 1);
  stroke(toRime, 1);
  stroke(east, 1);
  stroke(south, 1);
  paintCreek(g, solid, toRime);

  // Ring, about 30 tiles out, narrow. The west arc follows the bay instead of the water.
  const ring = ringPoints(shore);
  stroke(ring, 0);

  const dock = dockSite(shore);
  stroke(
    [
      [89, 152],
      [Math.floor((89 + dock.x) / 2), 156],
      [dock.x + 1, dock.y],
    ],
    1,
  );
  paintDock(g, solid, dock);

  const buildings = stampCity(g, solid, safe, road);
  paintCoastEdge(g, solid, shore, road);

  const scenery = paintScenery(g, solid, road, safe, shore);

  const entryOf = (hall) => {
    const w = Math.max(14, Math.min(20, hall.w + 4));
    const h = 12;
    const doorX = Math.floor(w / 2);
    return feet(doorX, h - 3);
  };
  const add = (kind, name, tx, ty, extra = {}) => {
    const p = feet(tx, ty);
    objects.push({ kind, name, x: p.x, y: p.y, ...extra });
    if (kind === 'npc' || kind === 'mob' || kind === 'spawn' || kind === 'bind' || kind === 'node' || kind === 'clue') {
      if (ty > 0 && ty < H && tx > 0 && tx < W) {
        solid[ty][tx] = 0;
        const blocking = new Set([T.TREE, T.TREE_B, T.ROCK, T.STACK, T.CAVE, T.CLIFF]);
        if (blocking.has(g[ty][tx])) g[ty][tx] = T.SNOW;
      }
    }
  };

  for (const hall of Object.values(buildings)) {
    if (!hall.doorX && hall.doorX !== 0) continue;
    const entry = entryOf(hall);
    for (const tx of [hall.doorX, hall.doorX + 1]) {
      add('door', hall.id, tx, hall.doorY, { toZone: hall.id, toX: entry.x, toY: entry.y, sprite: 'sign_inn' });
    }
  }

  const playerTx = buildings.inn.doorX + 1;
  const playerTy = buildings.inn.doorY + 2;
  add('spawn', 'player', playerTx, playerTy);
  add('bind', 'inn-yard', playerTx, playerTy);

  add('npc', 'torvald', 112, 146, { defId: 'torvald', sprite: 'torvald' });
  add('npc', 'soren', 116, 123, { defId: 'soren', sprite: 'soren' });
  add('npc', 'sigrun', 124, 123, { defId: 'sigrun', sprite: 'sigrun' });
  add('npc', 'freya', buildings.mead.doorX + 1, buildings.mead.doorY + 2, { defId: 'freya', sprite: 'freya' });
  add('npc', 'ivar', buildings.forge.doorX + 2, buildings.forge.doorY + 2, { defId: 'ivar', sprite: 'ivar' });
  add('npc', 'nils', 128, 112, { defId: 'nils', sprite: 'nils' });
  add('npc', 'brand', 136, 114, { defId: 'brand', sprite: 'brand' });

  add('prop', 'anvil', buildings.forge.doorX + 2, buildings.forge.doorY + 1, { sprite: 'anvil' });
  solid[buildings.forge.doorY + 1][buildings.forge.doorX + 2] = 1;
  add('prop', 'well', 114, 140, { sprite: 'well' });
  solid[140][114] = 1;
  solid[141][114] = 1;
  solid[140][115] = 1;
  add('prop', 'firepit', 120, 144, { sprite: 'firepit' });
  add('prop', 'banner', 120, 128, { sprite: 'banner' });
  add('prop', 'barrel', 100, 136, { sprite: 'barrel' });
  solid[136][100] = 1;
  add('prop', 'crate', 146, 136, { sprite: 'crate' });
  solid[136][146] = 1;
  add('prop', 'barrel', buildings.brandStall.x, buildings.brandStall.y, { sprite: 'barrel' });
  solid[buildings.brandStall.y][buildings.brandStall.x] = 1;

  const sign = (name, tx, ty, text) => add('sign', name, tx, ty, { sprite: 'sign_hall', text });
  sign('Mead Hall', buildings.mead.doorX - 2, buildings.mead.doorY + 1, "Jarl Freya's mead hall. Stone, not a castle. The skald is inside. She would rather fill the hall with traders than with a war-band.");
  sign('Frosthearth Inn', buildings.inn.doorX - 2, buildings.inn.doorY + 1, 'Frosthearth Inn. Hilda Venn keeps the fire. Sefa Chart sells maps of the hold. If you fall in combat, you wake in the yard.');
  sign("Brenna's Goods", buildings.shop.doorX - 2, buildings.shop.doorY + 1, "Brenna's Goods. Pelts, bandages, and a draught that costs more than bread.");
  sign("Ivar's Forge", buildings.forge.doorX - 2, buildings.forge.doorY + 1, "Ivar's Forge. The smith works the outdoor anvil. Marta sells inside, at the price on the slate.");
  sign("Signe's Needles", buildings.needles.doorX - 2, buildings.needles.doorY + 1, "Signe's Needles. Cloth and leather, cut and stitched.");
  sign('Warrior Guild', buildings.warrior.doorX + 1, buildings.warrior.doorY + 1, 'Warrior Guild. Eirik Stonehand is guildmaster. The hall is still new.');
  sign('Wizard Hall', buildings.wizard.doorX - 2, buildings.wizard.doorY + 1, 'Wizard Hall. Ingrid Mire keeps the pages. Barbarians are not taught here.');
  sign('Shaman Hall', buildings.shaman.doorX - 2, buildings.shaman.doorY + 1, 'Shaman Hall. Torunn Ash. Slows, mends, and the burn that stays.');
  sign('Rogue Hall', buildings.rogue.doorX - 2, buildings.rogue.doorY + 1, 'Rogue Hall. Sable Venn. Speak quietly.');
  sign('Berserker Hall', buildings.berserker.doorX - 2, buildings.berserker.doorY + 1, 'Berserker Hall. Hroth Keld. Rage is a tool, not a mood.');
  sign('Warden Hall', buildings.warden.doorX - 2, buildings.warden.doorY + 1, 'Warden Hall. Bjorn Pale. Fists, a staff, and a snow wolf.');
  sign("Sigrid's Steel", buildings.smithy.doorX + 1, buildings.smithy.doorY + 1, "Sigrid's Steel. Yrsa works the upgrades. The rune-blade, if you earn it, is hers to give.");
  add('sign', 'North gate', 112, 116, {
    sprite: 'sign_wilds',
    text: 'North gate of Hoffender. Sigrun Ashmantle captains the scouts. Soren Bram keeps the gate for Jarl Freya. The Frostmere Wilds begin on the road.',
  });
  add('sign', 'Hoffender Bay', dock.x + 2, dock.y + 1, {
    sprite: 'sign_inn',
    text: 'Hoffender Bay. The docks are tied. No boat runs to Thornhaven yet. Gull Point and Saltwind Head keep the worst of the weather off the water.',
  });
  add('sign', "Smugglers' Cove", 0, 0, { sprite: 'sign_wilds', text: '' });

  add('label', 'Hoffender', 120, 142);
  add('label', 'Mead Hall', buildings.mead.doorX + 2, buildings.mead.y + 2);
  add('label', 'Frostmere Wilds', 120, 78);
  add('label', 'Whitepine', 196, 130);
  add('label', 'Scout Camp', 136, 58);
  add('label', 'Icebound Cairns', 74, 36);
  add('label', 'Rimeheart', 196, 22);
  add('label', 'Hoffender Bay', Math.max(8, dock.x - 8), dock.y - 6);
  add('label', 'Gull Point', Math.max(6, dock.x - 14), dock.y - 16);
  add('label', 'Saltwind Head', Math.max(6, dock.x - 12), dock.y + 16);

  // Scout camp, off the north road. Abandoned.
  const campX = 134;
  const campY = 60;
  for (const [dx, dy] of [
    [-2, -1],
    [2, -1],
    [-2, 2],
    [2, 2],
  ]) {
    add('prop', 'cairn-rock', campX + dx, campY + dy, { sprite: 'rock' });
    if (campY + dy > 0) solid[campY + dy][campX + dx] = 1;
  }
  add('prop', 'campfire', campX, campY, { sprite: 'firepit' });
  add('prop', 'camp-crate', campX + 1, campY + 1, { sprite: 'crate' });
  add('sign', 'Frozen journal', campX + 1, campY, {
    sprite: 'sign_wilds',
    text: 'A journal frozen open. The last page is stiff. "Blue lights under the ice, where the creek dies in a black lake. I am going to look." The name under it is a scout of Sigrun\'s, and then nothing.',
  });

  // Barrow entrance, far northwest, on a cleared pad.
  const barrowTx = 54;
  const barrowTy = 16;
  for (let y = barrowTy - 2; y <= barrowTy + 2; y++) {
    for (let x = barrowTx - 2; x <= barrowTx + 2; x++) {
      if (y < 1 || x < 1) continue;
      if (g[y][x] === T.WATER || g[y][x] === T.WATER_B || g[y][x] === T.ICE_FLOE) {
        g[y][x] = T.SHELF;
      }
      solid[y][x] = 0;
    }
  }
  g[barrowTy][barrowTx] = T.CAVE;
  solid[barrowTy][barrowTx] = 1;
  g[barrowTy + 1][barrowTx] = T.PATH;
  solid[barrowTy + 1][barrowTx] = 0;
  add('door', 'Barrow door', barrowTx, barrowTy + 1, { toZone: 'barrow', toX: 24 * TILE + 8, toY: 40 * TILE + 14, sprite: 'sign_wilds' });
  add('sign', 'The Barrow', barrowTx + 2, barrowTy + 1, {
    sprite: 'sign_wilds',
    text: 'The Barrow. The door is a dark cut in the cairn. Torsten Crowe is said to keep the last room. Mira Palehand walks the ground outside.',
  });

  // Smugglers' cove cave, decorative. The inlet is water; the mouth sits on the landward end.
  const cove = coveSite(shore);
  g[cove.y][cove.x] = T.CAVE;
  solid[cove.y][cove.x] = 1;
  // Cliff trail off the south road.
  stroke(
    [
      [100, 214],
      [88, 218],
      [cove.x + 2, cove.y + 1],
    ],
    0,
  );
  objects.forEach((obj) => {
    if (obj.name === "Smugglers' Cove" && obj.kind === 'sign') {
      obj.x = feet(cove.x + 2, cove.y + 1).x;
      obj.y = feet(cove.x + 2, cove.y + 1).y;
      obj.text = "Smugglers' Cove. A narrow cut behind the headland. The cave mouth at the back is not mapped. The trail comes off the south road.";
      obj.sprite = 'sign_wilds';
    }
  });
  add('label', "Smugglers' Cove", cove.x + 4, cove.y - 2);

  // Seams. A short fade, and the road is not open.
  add('seam', 'Frostfang Reach', 106, 3, {
    sprite: 'sign_wilds',
    text: 'The road to Frostfang Reach is not yet open. The Ogre Highlands lie beyond it, in the snow and the bare rock.',
  });
  add('seam', 'Wyrmrest', 252, 152, {
    sprite: 'sign_wilds',
    text: 'The road to Wyrmrest is not yet open. The pines thin here, and the stone of the foothills starts.',
  });
  add('seam', 'Thornhaven', 140, 253, {
    sprite: 'sign_wilds',
    text: 'The road south to Graymoor Hold and Thornhaven is not yet open. The snow is already slush, and the first fields are mud.',
  });
  add('seam', 'Valdoria', 248, 236, {
    sprite: 'sign_wilds',
    text: 'The track to the Kingdom of Valdoria and Blackpine Tower is not yet open. The snow has given way to pine and grass.',
  });

  // Mobs.
  const mobs = [];
  const occupied = grid(W, H, 0);
  const spawnMob = (defId, tx, ty, sprite) => {
    if (tx < 2 || ty < 2 || tx >= W - 2 || ty >= H - 2) return false;
    if (solid[ty][tx] || safe[ty][tx] || road[ty][tx]) return false;
    const tile = g[ty][tx];
    if (tile === T.WATER || tile === T.WATER_B || tile === T.ICE_FLOE || tile === T.STACK || tile === T.CAVE || tile === T.CLIFF) return false;
    if (occupied[ty][tx]) return false;
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        if (occupied[ty + dy]?.[tx + dx]) return false;
      }
    }
    occupied[ty][tx] = 1;
    add('mob', defId, tx, ty, { defId, sprite: sprite ?? defId });
    mobs.push(defId);
    return true;
  };

  const scatter = (defId, sprite, count, pred, gap = 3) => {
    const spots = [];
    for (let y = 2; y < H - 2; y++) {
      for (let x = 2; x < W - 2; x++) {
        if (!pred(x, y)) continue;
        if (solid[y][x] || safe[y][x] || road[y][x]) continue;
        const tile = g[y][x];
        if ([T.WATER, T.WATER_B, T.ICE_FLOE, T.STACK, T.CAVE, T.CLIFF, T.DOCK].includes(tile)) continue;
        spots.push([x, y, hash(x, y, defId.length * 17)]);
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

  const land = (x, y) => solid[y][x] === 0 && g[y][x] !== T.WATER && g[y][x] !== T.WATER_B;
  const near = (x, y, tx, ty, r) => Math.abs(x - tx) + Math.abs(y - ty) <= r;

  scatter('young_wolf', 'young_wolf', 7, (x, y) => !safe[y][x] && (near(x, y, 120, 112, 18) || near(x, y, 120, 192, 16) || near(x, y, 162, 152, 14)));
  scatter('frost_wolf', 'frost_wolf', 8, (x, y) => near(x, y, 120, 108, 16) || near(x, y, 150, 140, 12));
  scatter('wolf', 'wolf', 5, (x, y) => x > 170 && x < 236 && y > 100 && y < 180);
  scatter('red_fox', 'fox', 4, (x, y) => x > 175 && y > 90 && y < 170);
  scatter('frost_spider', 'spider', 3, (x, y) => x > 180 && y > 110 && y < 165);
  scatter('wolf_alpha', 'frost_wolf', 2, (x, y) => (x > 160 && x < 200 && y > 100 && y < 140) || near(x, y, 100, 100, 12));
  scatter('frost_wolf', 'frost_wolf', 4, (x, y) => x > 100 && x < 150 && y > 48 && y < 78 && !near(x, y, campX, campY, 5));
  scatter('wolf', 'wolf', 2, (x, y) => near(x, y, campX, campY, 14) && !near(x, y, campX, campY, 6));
  scatter('barrow_bones', 'bones', 8, (x, y) => x > 48 && x < 100 && y > 20 && y < 52 && !near(x, y, barrowTx, barrowTy, 4));
  scatter('ice_beetle', 'beetle', 4, (x, y) => y < 48 && y > 8 && x > shore[y] + 2 && x < shore[y] + 18);
  scatter('frost_wolf', 'frost_wolf', 3, (x, y) => near(x, y, 190, 40, 16));
  scatter('young_wolf', 'young_wolf', 4, (x, y) => y > 190 && y < 240 && x > shore[y] + 2 && x < 120);
  scatter('snow_hare', 'hare', 5, (x, y) => y > 200 && x > 150 && x < 230);
  scatter('red_fox', 'fox', 2, (x, y) => y > 210 && x > 160 && x < 220);
  scatter('bandit_thug', 'bandit', 3, (x, y) => near(x, y, cove.x, cove.y, 8));
  scatter('bandit_archer', 'archer', 2, (x, y) => near(x, y, cove.x, cove.y, 10));
  scatter('ice_beetle', 'beetle', 2, (x, y) => near(x, y, 200, 48, 10));

  spawnMob('greymaw', 140, 102, 'greymaw') || spawnMob('greymaw', 146, 98, 'greymaw') || spawnMob('greymaw', 132, 100, 'greymaw');
  spawnMob('vetch', 188, 124, 'vetch') || spawnMob('vetch', 184, 132, 'vetch');
  spawnMob('sleetwidow', 154, 42, 'widow') || spawnMob('sleetwidow', 148, 48, 'widow');
  spawnMob('old_bramble', 86, 34, 'bear') || spawnMob('old_bramble', 92, 40, 'bear');
  spawnMob('mira_palehand', 62, 20, 'mira') || spawnMob('mira_palehand', 66, 22, 'mira');
  const forceMob = (defId, tx, ty, sprite) => {
    g[ty][tx] = defId === 'ysolde_black_ice' ? T.GLOW : g[ty][tx] === T.WATER || g[ty][tx] === T.WATER_B ? T.SNOW : g[ty][tx];
    if ([T.TREE, T.TREE_B, T.ROCK, T.CLIFF, T.CAVE, T.STACK].includes(g[ty][tx])) g[ty][tx] = T.SNOW;
    solid[ty][tx] = 0;
    road[ty][tx] = 0;
    safe[ty][tx] = 0;
    add('mob', defId, tx, ty, { defId, sprite });
    mobs.push(defId);
  };
  if (!mobs.includes('greymaw')) forceMob('greymaw', 142, 104, 'greymaw');
  if (!mobs.includes('mira_palehand')) forceMob('mira_palehand', 64, 22, 'mira');
  if (!mobs.includes('ysolde_black_ice')) forceMob('ysolde_black_ice', 196, 30, 'witch');
  if (!mobs.includes('vetch')) forceMob('vetch', 186, 128, 'vetch');
  if (!mobs.includes('sleetwidow')) forceMob('sleetwidow', 150, 46, 'widow');
  if (!mobs.includes('old_bramble')) forceMob('old_bramble', 88, 36, 'bear');

  // Ore nodes in Whitepine.
  let nodes = 0;
  for (let y = 100; y < 180 && nodes < 8; y += 3) {
    for (let x = 176; x < 236 && nodes < 8; x += 5) {
      if (solid[y][x] || road[y][x] || safe[y][x]) continue;
      if ([T.WATER, T.TREE, T.TREE_B, T.ROCK, T.CLIFF].includes(g[y][x])) continue;
      if (hash(x, y, 9) > 0.45) continue;
      add('node', `ore-${nodes}`, x, y, { sprite: 'rock_small', defId: 'iron_ore' });
      nodes++;
    }
  }

  // Border walls, but leave seam tiles open so the player can step on the notice.
  for (let x = 0; x < W; x++) {
    solid[0][x] = 1;
    solid[H - 1][x] = 1;
  }
  for (let y = 0; y < H; y++) {
    solid[y][0] = 1;
    solid[y][W - 1] = 1;
  }
  for (const obj of objects) {
    if (obj.kind !== 'seam' && obj.kind !== 'spawn' && obj.kind !== 'npc' && obj.kind !== 'mob' && obj.kind !== 'door' && obj.kind !== 'clue') continue;
    const tx = Math.floor(obj.x / TILE);
    const ty = Math.floor(obj.y / TILE);
    if (ty > 0 && ty < H - 1 && tx > 0 && tx < W - 1) solid[ty][tx] = 0;
  }
  // Seams sit on the outer walkable tile, one in from the border, so the border can stay solid.
  // (Placed at y=3, x=252, y=253, x=248 — already inside.)

  for (const obj of objects) {
    if (obj.kind === 'prop' || obj.kind === 'label' || obj.kind === 'sign' || obj.kind === 'door' || obj.kind === 'seam') continue;
    const tx = Math.floor(obj.x / TILE);
    const ty = Math.floor(obj.y / TILE);
    if (ty < 0 || tx < 0 || ty >= H || tx >= W || solid[ty][tx]) {
      throw new Error(`${obj.kind} ${obj.name} is blocked at ${tx},${ty} tile ${g[ty]?.[tx]}`);
    }
  }

  const map = makeMap('hoffender', g, solid, safe, objects, [
    { name: 'zoneId', type: 'string', value: 'hoffender' },
    { name: 'townName', type: 'string', value: 'Hoffender' },
    { name: 'wildsName', type: 'string', value: 'Frostmere Wilds' },
  ]);

  const charts = {
    hoffender: { zone: 'hoffender', x: CITY_X, y: CITY_Y, w: CITY_S, h: CITY_S },
    frostmere_road: { zone: 'hoffender', x: 70, y: 96, w: 120, h: 110 },
    frostmere_deep: { zone: 'hoffender', x: 90, y: 20, w: 120, h: 90 },
    whitepine: { zone: 'hoffender', x: 160, y: 80, w: 90, h: 110 },
    cairns: { zone: 'hoffender', x: 36, y: 4, w: 80, h: 60 },
    rimeheart: { zone: 'hoffender', x: 160, y: 4, w: 90, h: 60 },
    bay: { zone: 'hoffender', x: 4, y: 120, w: 100, h: 120 },
    barrow: { zone: 'barrow', x: 0, y: 0, w: 48, h: 48 },
  };

  return {
    map,
    buildings,
    barrowDoor: { x: barrowTx, y: barrowTy + 1 },
    barrowReturn: feet(barrowTx, barrowTy + 2),
    charts,
    shore,
    dock,
    cove,
    scenery,
    mobs,
    g,
    solid,
    road,
    land,
  };
}

function buildShore() {
  const shore = new Array(H);
  for (let y = 0; y < H; y++) {
    const large = Math.sin(y * 0.105) * 8 + Math.sin(y * 0.041 + 0.8) * 6;
    const med = Math.sin(y * 0.47) * 3.1 + Math.sin(y * 0.83 + 0.3) * 1.8;
    const small = (Math.floor(hash(0, y, 4) * 5) - 2);
    let bay = 0;
    if (y >= 142 && y <= 176) {
      const t = (y - 142) / 34;
      bay = Math.sin(t * Math.PI) * 50;
    }
    if (y >= 126 && y <= 142) {
      const t = (y - 126) / 16;
      bay -= Math.sin(t * Math.PI) * 9;
    }
    if (y >= 176 && y <= 196) {
      const t = (y - 176) / 20;
      bay -= Math.sin(t * Math.PI) * 11;
    }
    let cove = 0;
    if (y >= 208 && y <= 220) {
      const t = (y - 208) / 12;
      const bell = Math.sin(Math.min(1, Math.max(0, t)) * Math.PI);
      cove = bell * bell * bell * 24;
    }
    let x = 20 + large + med + small * 0.8 + bay + cove;
    if (y < 42) x = Math.min(x, 26 + Math.sin(y * 0.8) * 4 + small);
    if (y > 208) {
      const t = Math.min(1, (y - 208) / 42);
      const edge = 58 + Math.sin(y * 0.95) * 5 + small;
      x = x * (1 - t) + edge * t;
    }
    // Stay west of the palisade so the bay can reach the docks without flooding the hold.
    shore[y] = Math.max(12, Math.min(CITY_X - 8, Math.round(x)));
  }
  for (let y = 0; y < H; ) {
    let y2 = y + 1;
    while (y2 < H && shore[y2] === shore[y]) y2++;
    if (y2 - y > 8) {
      for (let i = y; i < y2; i++) {
        const wob = (i - y) % 2 === 0 ? 1 : -1;
        if (i !== y && i !== H - 1) shore[i] = Math.max(12, Math.min(CITY_X - 8, shore[i] + wob));
      }
    }
    y = Math.max(y2, y + 1);
  }
  // One more pass in case the wobble itself aligned.
  for (let y = 1; y < H - 1; y++) {
    if (shore[y] === shore[y - 1] && shore[y] === shore[y + 1]) shore[y] += y % 2 === 0 ? 1 : -1;
  }
  return shore;
}

function paintSea(g, solid, shore) {
  for (let y = 0; y < H; y++) {
    const s = shore[y];
    for (let x = 0; x < s; x++) {
      g[y][x] = (x + y) % 2 === 0 ? T.WATER : T.WATER_B;
      solid[y][x] = 1;
    }
    // Narrow ice-choked fjords north of the cairns.
    if (y > 8 && y < 36 && y % 11 < 5) {
      const depth = 4 + (y % 3);
      const wob = Math.round(Math.sin(y * 0.9) * 1);
      for (let d = 0; d < depth; d++) {
        const x = s + d + wob;
        if (x > 1 && x < W - 2 && (d === 0 || d === depth - 1 || y % 2 === 0)) {
          g[y][x] = T.WATER;
          solid[y][x] = 1;
        }
      }
    }
  }
  // Islets and sea stacks. Decorative, and they block movement.
  const islets = [
    [14, 36, 3],
    [18, 62, 2],
    [12, 96, 4],
    [16, 188, 3],
    [22, 214, 2],
    [28, 236, 4],
    [10, 150, 2],
  ];
  for (const [cx, cy, r] of islets) {
    if (cx >= shore[cy]) continue;
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        if (y < 1 || x < 1 || y >= H - 1 || x >= W - 1) continue;
        if (Math.abs(x - cx) + Math.abs(y - cy) > r + (hash(x, y, 8) > 0.6 ? 1 : 0)) continue;
        if (g[y][x] !== T.WATER && g[y][x] !== T.WATER_B) continue;
        g[y][x] = T.ROCK_GROUND;
        solid[y][x] = 1;
      }
    }
    g[cy][cx] = T.ROCK;
    solid[cy][cx] = 1;
  }
  const stacks = [
    [20, 48],
    [24, 84],
    [18, 168],
    [26, 228],
  ];
  for (const [x, y] of stacks) {
    if (g[y][x] === T.WATER || g[y][x] === T.WATER_B) {
      g[y][x] = T.STACK;
      solid[y][x] = 1;
    }
  }
}

function paintBiomes(g, solid, shore) {
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (solid[y][x] && (g[y][x] === T.WATER || g[y][x] === T.WATER_B || g[y][x] === T.STACK || g[y][x] === T.ROCK)) continue;
      if (x < shore[y]) continue;
      const north = y < 40 ? (40 - y) / 40 : 0;
      const east = x > 216 ? (x - 216) / 40 : 0;
      const south = y > 216 ? (y - 216) / 40 : 0;
      const se = x > 196 && y > 188 ? Math.min(1, (x - 196 + (y - 188)) / 90) : 0;
      const roll = hash(x, y, 5);
      if (se > 0.15 && roll < se * 0.85) {
        g[y][x] = roll < se * 0.45 ? T.GRASS : roll < se * 0.7 ? T.GRASS_B : T.PINE_GROUND;
        continue;
      }
      if (north > 0.2 && roll < north) {
        g[y][x] = roll < north * 0.45 ? T.DEEP_SNOW : roll < north * 0.75 ? T.ROCK_GROUND : T.SNOW_C;
        continue;
      }
      if (east > 0.15 && roll < east * 0.9) {
        g[y][x] = roll < east * 0.4 ? T.PINE_GROUND : roll < east * 0.7 ? T.ROCK_GROUND : T.SNOW_C;
        continue;
      }
      if (south > 0.15 && roll < south * 0.9 && x > shore[y] + 2) {
        g[y][x] = roll < south * 0.35 ? T.SLUSH : roll < south * 0.6 ? T.MUD : roll < south * 0.8 ? T.GRASS : T.FARM;
      }
    }
  }
}

function paintLake(g, solid) {
  const cx = 198;
  const cy = 30;
  for (let y = cy - 8; y <= cy + 7; y++) {
    for (let x = cx - 10; x <= cx + 9; x++) {
      const dx = (x - cx) / 10;
      const dy = (y - cy) / 7;
      const n = dx * dx + dy * dy + (hash(x, y, 6) - 0.5) * 0.18;
      if (n > 1) continue;
      g[y][x] = hash(x, y, 7) > 0.82 ? T.GLOW : T.ICE;
      solid[y][x] = 0;
    }
  }
}

function paintShelfAndFloes(g, solid, shore) {
  for (let y = 2; y < 52; y++) {
    for (let d = 0; d < 3; d++) {
      const x = shore[y] + d;
      if (x <= 1 || x >= W - 1) continue;
      if (g[y][x] === T.WATER || g[y][x] === T.WATER_B) continue;
      if (hash(x, y, 12) > 0.25) {
        g[y][x] = T.SHELF;
        solid[y][x] = 0;
      }
    }
    for (let x = 2; x < shore[y] - 1; x++) {
      if (hash(x, y, 13) > 0.09) continue;
      g[y][x] = T.ICE_FLOE;
      solid[y][x] = 1;
    }
  }
}

function paintCreek(g, solid, points) {
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const len = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.ceil(len));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const x = Math.round(x0 + (x1 - x0) * t + 2);
      const y = Math.round(y0 + (y1 - y0) * t + 2);
      if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) continue;
      if (g[y][x] === T.PATH || g[y][x] === T.PATH_B) continue;
      g[y][x] = T.ICE;
      solid[y][x] = 0;
    }
  }
}

function ringPoints(shore) {
  const westX = (y) => Math.max(shore[y] + 3, 78);
  const pts = [];
  for (let x = 78; x <= 184; x += 16) pts.push([x, 90]);
  pts.push([184, 90]);
  for (let y = 90; y <= 214; y += 16) pts.push([184, y]);
  pts.push([184, 214]);
  for (let x = 184; x >= 100; x -= 16) pts.push([x, 214]);
  pts.push([westX(200), 200]);
  pts.push([westX(170), 170]);
  pts.push([westX(152), 152]);
  pts.push([westX(130), 130]);
  pts.push([78, 100]);
  pts.push([78, 90]);
  return pts;
}

function dockSite(shore) {
  let best = { x: shore[152], y: 152 };
  for (let y = 146; y <= 170; y++) {
    if (shore[y] > best.x) best = { x: shore[y], y };
  }
  return best;
}

function coveSite(shore) {
  let best = { x: shore[214], y: 214 };
  for (let y = 208; y <= 220; y++) {
    if (shore[y] >= best.x) best = { x: shore[y], y };
  }
  // Landward lip of the inlet.
  return { x: Math.min(W - 4, best.x + 1), y: best.y };
}

function paintDock(g, solid, dock) {
  for (let y = dock.y; y < dock.y + 3 && y < H - 1; y++) {
    for (let x = dock.x - 3; x <= dock.x + 1; x++) {
      if (x < 1 || y < 1) continue;
      g[y][x] = T.DOCK;
      solid[y][x] = 0;
    }
  }
}

function paintCoastEdge(g, solid, shore, road) {
  for (let y = 1; y < H - 1; y++) {
    const x = shore[y];
    if (x < 1 || x >= W - 1) continue;
    if (road[y][x] || g[y][x] === T.DOCK || g[y][x] === T.PATH || g[y][x] === T.PATH_B) continue;
    if (g[y][x] === T.SHELF || g[y][x] === T.ICE || g[y][x] === T.GLOW) continue;
    const slope = Math.abs(shore[y] - shore[y - 1]) + Math.abs(shore[Math.min(H - 1, y + 1)] - shore[y]);
    if (slope >= 3 && y > 50 && y < 200) {
      g[y][x] = T.CLIFF;
      solid[y][x] = 1;
    } else if (g[y][x] !== T.CAVE) {
      g[y][x] = T.SAND;
      solid[y][x] = 0;
    }
    // Rocky points: a nose of rock every so often.
    if (y % 47 === 11 && slope >= 2) {
      g[y][x] = T.ROCK;
      solid[y][x] = 1;
      if (x + 1 < W) {
        g[y][x + 1] = T.ROCK_GROUND;
      }
    }
  }
}

function paintScenery(g, solid, road, safe, shore) {
  let trees = 0;
  let rocks = 0;
  const nearRoad = (x, y) => {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) if (road[y + dy]?.[x + dx]) return true;
    }
    return false;
  };
  for (let y = 2; y < H - 2; y++) {
    for (let x = 2; x < W - 2; x++) {
      if (solid[y][x] || safe[y][x] || road[y][x]) continue;
      if (nearRoad(x, y)) continue;
      const tile = g[y][x];
      if ([T.WATER, T.WATER_B, T.ICE, T.ICE_FLOE, T.DOCK, T.SHELF, T.GLOW, T.SAND, T.PATH, T.PATH_B, T.CAVE, T.STACK].includes(tile)) continue;
      const inCity = x > CITY_X && x < CITY_X + CITY_S && y > CITY_Y && y < CITY_Y + CITY_S;
      if (inCity) continue;
      const east = x > 170;
      const chance = east ? 0.1 : tile === T.PINE_GROUND ? 0.14 : tile === T.GRASS || tile === T.GRASS_B ? 0.05 : 0.035;
      const roll = hash(x, y, 21);
      if (roll < chance) {
        let blocked = false;
        for (let dy = -1; dy <= 1 && !blocked; dy++) {
          for (let dx = -1; dx <= 1; dx++) if (solid[y + dy][x + dx]) blocked = true;
        }
        if (blocked) continue;
        g[y][x] = hash(x, y, 22) > 0.5 ? T.TREE : T.TREE_B;
        solid[y][x] = 1;
        trees++;
      } else if (roll > 0.982) {
        g[y][x] = T.ROCK;
        solid[y][x] = 1;
        rocks++;
      } else if (roll > 0.93 && roll < 0.95) {
        g[y][x] = T.BUSH;
      }
    }
  }
  void shore;
  return { trees, rocks };
}

function stampCity(g, solid, safe, road) {
  const x0 = CITY_X;
  const y0 = CITY_Y;
  const x1 = CITY_X + CITY_S;
  const y1 = CITY_Y + CITY_S;
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      const tile = g[y][x];
      if (
        tile === T.TREE ||
        tile === T.TREE_B ||
        tile === T.ROCK ||
        tile === T.BUSH ||
        tile === T.WATER ||
        tile === T.WATER_B ||
        tile === T.ICE_FLOE ||
        tile === T.STACK
      ) {
        g[y][x] = T.SNOW;
        solid[y][x] = 0;
      }
    }
  }
  const gate = (x, y) => {
    const north = y === y0 && x >= 118 && x <= 122;
    const south = y === y1 && x >= 118 && x <= 122;
    const east = x === x1 && y >= 150 && y <= 154;
    const west = x === x0 && y >= 150 && y <= 154;
    return north || south || east || west;
  };
  for (let x = x0; x <= x1; x++) {
    for (const y of [y0, y1]) {
      if (gate(x, y)) {
        g[y][x] = T.PATH;
        solid[y][x] = 0;
        road[y][x] = 1;
      } else {
        g[y][x] = x === 117 || x === 123 ? T.POST : T.PALISADE;
        solid[y][x] = 1;
      }
    }
  }
  for (let y = y0 + 1; y < y1; y++) {
    for (const x of [x0, x1]) {
      if (gate(x, y)) {
        g[y][x] = T.PATH;
        solid[y][x] = 0;
        road[y][x] = 1;
      } else {
        g[y][x] = T.PALISADE;
        solid[y][x] = 1;
      }
    }
  }
  // Streets.
  for (let y = y0 + 1; y < y1; y++) {
    for (let x = 119; x <= 121; x++) {
      g[y][x] = T.PATH;
      solid[y][x] = 0;
      road[y][x] = 1;
    }
  }
  for (let x = x0 + 1; x < x1; x++) {
    for (let y = 151; y <= 153; y++) {
      g[y][x] = T.PATH;
      solid[y][x] = 0;
      road[y][x] = 1;
    }
  }

  const specs = [
    ['inn', 93, 124, 12, 11, { chimney: true }],
    ['shop', 106, 124, 11, 11, { shop: true }],
    ['needles', 124, 124, 8, 11, { shop: true }],
    ['forge', 133, 124, 10, 11, { chimney: true }],
    ['smithy', 144, 124, 8, 11, { chimney: true }],
    ['mead', 93, 156, 22, 12, { stone: true, chimney: true }],
    ['warrior', 93, 170, 12, 11, { chimney: true }],
    ['warden', 106, 170, 10, 11, {}],
    ['wizard', 124, 156, 13, 11, { chimney: true }],
    ['shaman', 138, 156, 13, 11, {}],
    ['rogue', 124, 170, 13, 11, {}],
    ['berserker', 138, 170, 13, 11, { chimney: true }],
  ];
  const buildings = {};
  for (const [id, x, y, w, h, opts] of specs) {
    buildings[id] = building(g, solid, x, y, w, h, { ...opts, id });
  }
  buildings.brandStall = { x: 138, y: 116 };

  for (let y = y0 + 1; y < y1; y++) {
    for (let x = x0 + 1; x < x1; x++) {
      if (!solid[y][x]) safe[y][x] = 1;
    }
  }
  // Gate tiles are safe so a wolf cannot stand in the doorway.
  for (let x = 118; x <= 122; x++) {
    safe[y0][x] = 1;
    safe[y1][x] = 1;
  }
  for (let y = 150; y <= 154; y++) {
    safe[y][x0] = 1;
    safe[y][x1] = 1;
  }
  return buildings;
}

function building(g, solid, x, y, w, h, opts) {
  const roofH = Math.max(2, h - 4);
  const doorW = 2;
  const doorLeft = Math.floor((w - doorW) / 2);
  const doorTop = h - 3;
  const wallTile = opts.stone ? T.STONE : T.WALL;
  const frontTile = opts.stone ? T.STONE_FRONT : T.WALL_FRONT;
  const windowTile = opts.stone ? T.STONE_WIN : T.WINDOW;
  const leaves = opts.stone
    ? { tl: T.SDOOR_TL, tr: T.SDOOR_TR, ml: T.SDOOR_ML, mr: T.SDOOR_MR, bl: T.SDOOR_BL, br: T.SDOOR_BR }
    : { tl: T.DOOR_TL, tr: T.DOOR_TR, ml: T.DOOR_ML, mr: T.DOOR_MR, bl: T.DOOR_BL, br: T.DOOR_BR };
  for (let yy = 0; yy < h; yy++) {
    for (let xx = 0; xx < w; xx++) {
      const X = x + xx;
      const Y = y + yy;
      solid[Y][X] = 1;
      const isDoor = xx >= doorLeft && xx < doorLeft + doorW && yy >= doorTop;
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
      } else if (isDoor) {
        const band = yy === doorTop ? 't' : yy === h - 1 ? 'b' : 'm';
        const side = xx === doorLeft ? 'l' : 'r';
        g[Y][X] = leaves[band + side];
        // Only the outer step is walkable. The door face above it stays solid, so the room is not visible or enterable.
        if (yy === h - 1) solid[Y][X] = 0;
      } else if (yy === h - 2 && (xx === 1 || xx === w - 2)) {
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
  const doorX = x + doorLeft;
  const doorY = y + h - 1;
  return { id: opts.id, x, y, w, h, doorX, doorY };
}

function buildInteriors(buildings, _barrowDoor) {
  const occupants = {
    inn: [
      ['hilda', 'hilda', 6, 5],
      ['sefa', 'sefa', 9, 5],
    ],
    shop: [['brenna', 'brenna', 7, 5]],
    needles: [['signe', 'signe', 4, 5]],
    forge: [['marta', 'marta', 5, 5]],
    smithy: [
      ['sigrid', 'sigrid', 3, 5],
      ['yrsa', 'yrsa', 6, 5],
    ],
    mead: [['hjorvin', 'hjorvin', 8, 5]],
    warrior: [['eirik', 'eirik', 6, 5]],
    warden: [['bjorn', 'bjorn', 5, 5]],
    wizard: [['ingrid', 'ingrid', 6, 5]],
    shaman: [['torunn', 'torunn', 6, 5]],
    rogue: [['sable', 'sable', 6, 5]],
    berserker: [['hroth', 'hroth', 6, 5]],
  };
  const titles = {
    inn: 'Frosthearth Inn',
    shop: "Brenna's Goods",
    needles: "Signe's Needles",
    forge: "Ivar's Forge",
    smithy: "Sigrid's Steel",
    mead: 'Mead Hall',
    warrior: 'Warrior Guild',
    warden: 'Warden Hall',
    wizard: 'Wizard Hall',
    shaman: 'Shaman Hall',
    rogue: 'Rogue Hall',
    berserker: 'Berserker Hall',
  };
  return Object.keys(occupants).map((id) => {
    const hall = buildings[id];
    const w = Math.max(14, Math.min(20, hall.w + 4));
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
    const doorX = Math.floor(w / 2);
    g[h - 1][doorX] = T.DOOR_BL;
    g[h - 1][doorX - 1] = T.DOOR_BR;
    solid[h - 1][doorX] = 0;
    solid[h - 1][doorX - 1] = 0;
    safe[h - 1][doorX] = 1;
    safe[h - 1][doorX - 1] = 1;
    // A rug of floor variety and a fire.
    for (let x = 3; x < w - 3; x++) g[6][x] = T.PATH_B;
    const objects = [];
    const exitX = hall.doorX * TILE + 8;
    const exitY = (hall.doorY + 2) * TILE + 14;
    objects.push({
      kind: 'door',
      name: 'exit',
      ...feet(doorX, h - 1),
      toZone: 'hoffender',
      toX: exitX,
      toY: exitY,
      sprite: 'sign_inn',
    });
    objects.push({ kind: 'spawn', name: 'entry', ...feet(doorX, h - 3) });
    objects.push({ kind: 'bind', name: 'entry', ...feet(doorX, h - 3) });
    for (const [defId, sprite, tx, ty] of occupants[id]) {
      const px = Math.min(w - 2, Math.max(2, tx));
      objects.push({ kind: 'npc', name: defId, defId, sprite, ...feet(px, ty) });
    }
    objects.push({ kind: 'prop', name: 'fire', sprite: 'firepit', ...feet(3, 3) });
    objects.push({
      kind: 'sign',
      name: titles[id],
      sprite: 'sign_hall',
      text: `${titles[id]}. The door south returns to Hoffender.`,
      ...feet(w - 3, 3),
    });
    return makeMap(id, g, solid, safe, objects, [
      { name: 'zoneId', type: 'string', value: id },
      { name: 'townName', type: 'string', value: titles[id] },
      { name: 'wildsName', type: 'string', value: titles[id] },
    ]);
  });
}

function buildBarrow(returnPoint) {
  const w = 48;
  const h = 48;
  const g = grid(w, h, T.STONE);
  const solid = grid(w, h, 1);
  const safe = grid(w, h, 0);
  const carve = (x, y, rw, rh) => {
    for (let yy = y; yy < y + rh; yy++) {
      for (let xx = x; xx < x + rw; xx++) {
        g[yy][xx] = (xx + yy) % 7 === 0 ? T.DUNGEON : T.ROCK_GROUND;
        solid[yy][xx] = 0;
      }
    }
  };
  const corridor = (x0, y0, x1, y1) => {
    let x = x0;
    let y = y0;
    const step = () => carve(x - 1, y - 1, 3, 3);
    step();
    while (x !== x1 || y !== y1) {
      if (x !== x1) x += Math.sign(x1 - x);
      else if (y !== y1) y += Math.sign(y1 - y);
      step();
    }
  };
  carve(20, 36, 8, 8);
  corridor(24, 38, 24, 28);
  carve(16, 22, 16, 8);
  corridor(18, 26, 8, 26);
  carve(4, 20, 8, 10);
  corridor(30, 26, 40, 18);
  carve(34, 12, 10, 10);
  corridor(24, 24, 24, 10);
  carve(18, 4, 12, 8);
  // A few bones rooms already carved. Exit at the south of the entry room.
  const objects = [];
  objects.push({
    kind: 'door',
    name: 'exit',
    ...feet(24, 42),
    toZone: 'hoffender',
    toX: returnPoint.x,
    toY: returnPoint.y,
    sprite: 'sign_wilds',
  });
  objects.push({ kind: 'spawn', name: 'entry', ...feet(24, 40) });
  objects.push({ kind: 'mob', name: 'camp_leader', defId: 'camp_leader', sprite: 'leader', ...feet(24, 7) });
  objects.push({ kind: 'mob', name: 'barrow_bones', defId: 'barrow_bones', sprite: 'bones', ...feet(8, 24) });
  objects.push({ kind: 'mob', name: 'barrow_bones', defId: 'barrow_bones', sprite: 'bones', ...feet(38, 16) });
  objects.push({ kind: 'mob', name: 'barrow_bones', defId: 'barrow_bones', sprite: 'bones', ...feet(20, 26) });
  objects.push({
    kind: 'sign',
    name: 'Barrow door',
    sprite: 'sign_wilds',
    text: 'The way back to the Frostmere Wilds. The cold here is older than the snow.',
    ...feet(27, 40),
  });
  objects.push({ kind: 'label', name: 'The Barrow', ...feet(24, 14) });
  return makeMap('barrow', g, solid, safe, objects, [
    { name: 'zoneId', type: 'string', value: 'barrow' },
    { name: 'townName', type: 'string', value: 'The Barrow' },
    { name: 'wildsName', type: 'string', value: 'The Barrow' },
  ]);
}

function validate(outdoor, maps) {
  const { map, shore, mobs, scenery } = outdoor;
  if (map.ground.length !== 256 || map.ground[0].length !== 256) throw new Error('map is not 256x256');
  let run = 1;
  for (let y = 1; y < shore.length; y++) {
    run = shore[y] === shore[y - 1] ? run + 1 : 1;
    if (run > 8) throw new Error(`coast runs straight for ${run} at y=${y} x=${shore[y]}`);
  }
  const water = map.ground.filter((row) => row.some((tile) => tile === T.WATER)).length;
  if (water < 180) throw new Error('the west coast is missing');
  // South-center exit stays on land.
  if (map.ground[250][140] === T.WATER || map.solid[250][140]) throw new Error('south exit is not open land');
  const ids = new Set(maps.map((zone) => zone.id));
  for (const id of ['hoffender', 'barrow', 'inn', 'warrior', 'wizard', 'mead', 'smithy']) {
    if (!ids.has(id)) throw new Error(`missing map ${id}`);
  }
  const npc = (id) => map.objects.some((obj) => obj.defId === id);
  for (const id of ['sigrun', 'soren', 'brand', 'freya', 'ivar', 'nils']) {
    if (!npc(id)) throw new Error(`outdoor npc ${id} missing`);
  }
  if (map.objects.some((obj) => obj.defId === 'brenna' || obj.defId === 'eirik' || obj.defId === 'ingrid')) {
    throw new Error('indoor npc leaked onto the outdoor map');
  }
  if (!map.objects.some((obj) => obj.kind === 'door' && obj.toZone === 'barrow')) throw new Error('no barrow door');
  if (!map.objects.some((obj) => obj.kind === 'door' && obj.toZone === 'inn')) throw new Error('no inn door');
  if (!mobs.includes('greymaw') || !mobs.includes('mira_palehand') || !mobs.includes('ysolde_black_ice')) {
    throw new Error(`named mobs missing: ${mobs.filter((id) => id === 'greymaw' || id === 'mira_palehand' || id === 'ysolde_black_ice').join(',')}`);
  }
  if (scenery.trees < 400) throw new Error(`only ${scenery.trees} trees`);
  const floor = map.ground.some((row) => row.includes(T.FLOOR));
  if (floor) throw new Error('outdoor map shows an interior floor');
  const inn = maps.find((zone) => zone.id === 'inn');
  if (!inn.objects.some((obj) => obj.defId === 'hilda' && obj.kind === 'npc')) throw new Error('hilda not in the inn');
  console.log(
    `frostmere shore ${Math.min(...shore)}-${Math.max(...shore)} trees ${scenery.trees} rocks ${scenery.rocks} mobs ${mobs.length} objects ${map.objects.length}`,
  );
}
