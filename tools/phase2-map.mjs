/**
 * Phase 2 overland: Ironhollow, Canipure and the Greenreach, Grokthul Hold and the Grokthul Peaks.
 * Original layout. Tile ids match tools/frostmere-map.mjs.
 */
import { T, TILE } from './frostmere-map.mjs';
import { frameGate, layGround, stampBuilding } from './buildings.mjs';
import {
  H,
  W,
  border,
  clearPatch,
  feet,
  grid,
  hash,
  interior,
  maker,
  outpost,
  paintScenery,
  placeMobs,
  stroke,
  wallBox,
} from './canon-map.mjs';

const SC = {
  PINE_SNOW: 1,
  PINE_DARK: 3,
  TREE: 5,
  TREE_B: 6,
  ROCK: 7,
  ROCK_SMALL: 8,
  BUSH: 10,
  BUSH_GREEN: 11,
  BUSH_DARK: 12,
};

export const HOMES = {
  wood_elf: { zone: 'canipure', tx: 176, ty: 118 },
  ogre: { zone: 'grokthul', tx: 128, ty: 72 },
};

function woodHouse(g, solid, x, y, w, h) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      if (!g[yy]) continue;
      const edge = xx === x || yy === y || xx === x + w - 1 || yy === y + h - 1;
      g[yy][xx] = edge ? T.WALL : T.FLOOR;
      solid[yy][xx] = 1;
    }
  }
}

function fillNoise(g, salt, paints) {
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) g[y][x] = paints(x, y, hash(x, y, salt));
  }
}

export function buildPhase2() {
  const iron = buildIronhollow();
  const canopy = buildCanipure();
  const hold = buildGrokthul();
  const peaks = buildPeaks();
  const maps = [iron.map, canopy.map, ...canopy.halls, hold.map, ...hold.halls, peaks.map];
  return {
    maps,
    charts: {
      ironhollow: { zone: 'ironhollow', x: 90, y: 50, w: 96, h: 100 },
      ironhollow_hills: { zone: 'ironhollow', x: 16, y: 150, w: 224, h: 96 },
      canipure: { zone: 'canipure', x: 140, y: 70, w: 84, h: 110 },
      greenreach: { zone: 'canipure', x: 8, y: 16, w: 130, h: 224 },
      grokthul: { zone: 'grokthul', x: 72, y: 28, w: 112, h: 92 },
      grokthul_valley: { zone: 'grokthul', x: 16, y: 120, w: 224, h: 120 },
      grokthul_peaks: { zone: 'grokthul_peaks', x: 16, y: 16, w: 224, h: 220 },
    },
  };
}

function buildIronhollow() {
  const g = grid(W, H, T.GRASS);
  const solid = grid(W, H, 0);
  const safe = grid(W, H, 0);
  const road = grid(W, H, 0);
  fillNoise(g, 31, (x, y, n) => {
    if (y < 52) return n < 0.55 ? T.PINE_GROUND : n < 0.8 ? T.GRASS : T.GRASS_B;
    return n < 0.4 ? T.GRASS : n < 0.7 ? T.GRASS_B : n < 0.88 ? T.ROCK_GROUND : T.MUD;
  });
  const scenery = paintScenery(g, solid, road, safe, (x, y, roll) => {
    if (y < 52 && roll > 0.9) return { frame: SC.PINE_DARK, solid: true, kind: 'tree' };
    if (y >= 52 && roll > 0.94) return { frame: y < 140 ? SC.TREE : SC.ROCK, solid: true, kind: y < 140 ? 'tree' : 'rock' };
    if (roll < 0.02) return { frame: SC.ROCK_SMALL, solid: true, kind: 'rock' };
    return null;
  });
  stroke(g, solid, road, scenery.grid, [[8, 36], [80, 36], [136, 36], [200, 36], [248, 36]], 1);
  stroke(g, solid, road, scenery.grid, [[136, 36], [136, 56]], 1);
  stroke(g, solid, road, scenery.grid, [[136, 140], [136, 200], [80, 220]], 1);
  wallBox(g, solid, safe, 96, 56, 176, 140, T.STONE, T.PATH, [
    [124, 56, 16, 1],
    [124, 140, 16, 1],
  ]);
  clearPatch(scenery, 97, 57, 175, 139);
  frameGate(g, solid, 124, 56, 16, 1);
  frameGate(g, solid, 124, 140, 16, 1);
  layGround(g, solid, 98, 58, 174, 138, T.COBBLE);
  stampBuilding(g, solid, scenery, 108, 68, 6, 7, 'human', { enter: false });
  stampBuilding(g, solid, scenery, 116, 68, 6, 7, 'human', { enter: false });
  stampBuilding(g, solid, scenery, 124, 68, 6, 7, 'human', { enter: false });
  stampBuilding(g, solid, scenery, 148, 68, 6, 7, 'human', { enter: false });
  stampBuilding(g, solid, scenery, 108, 112, 8, 7, 'human', { enter: false });
  const m = maker('ironhollow', 'Ironhollow Keep', 'Ironhollow Hills');
  m.add('door', 'To Valdoria', 10, 36, { toZone: 'valdoria', toX: feet(236, 40).x, toY: feet(236, 40).y, sprite: 'sign_wilds' });
  m.add('door', 'To the Greenreach', 246, 36, { toZone: 'canipure', toX: feet(18, 128).x, toY: feet(18, 128).y, sprite: 'sign_wilds' });
  m.add('spawn', 'court', 136, 96);
  m.add('bind', 'ironhollow-court', 128, 104);
  m.add('npc', 'edric', 136, 88, { defId: 'edric', sprite: 'edric' });
  m.add('npc', 'oswin', 132, 128, { defId: 'oswin', sprite: 'oswin' });
  m.add('npc', 'cald', 156, 100, { defId: 'cald', sprite: 'cald' });
  m.add('npc', 'bessa', 112, 100, { defId: 'bessa', sprite: 'bessa' });
  m.add('prop', 'banner', 144, 66, { sprite: 'banner' });
  m.add('prop', 'fire', 124, 96, { sprite: 'firepit' });
  m.add('sign', 'Ironhollow Keep', 108, 64, {
    sprite: 'sign_hall',
    text: 'Ironhollow Keep. Lord Edric Hollen keeps this castle for King Aldric Valdor. The court is safe. The forest road along the north runs west to Blackpine Tower and east into the Greenreach, and on to Canipure. South, the Ironhollow Hills. Levels climb with the road. This is the second road east of the pines.',
  });
  m.add('sign', 'West road', 28, 28, {
    sprite: 'sign_wilds',
    text: 'West, through the pines, to Blackpine Tower and Valdoria. The same forest runs the other way, north of this keep, to the Wood Elf lands. King Aldric Valdor rules the kingdom these castles answer to.',
  });
  m.add('sign', 'East road', 220, 28, {
    sprite: 'sign_wilds',
    text: 'East, the forest continues into the Greenreach, then Canipure on the coast that faces Vaelmoor. The hills south of the keep are not that forest. They are the harder road.',
  });
  m.add('sign', 'The hills', 150, 168, {
    sprite: 'sign_wilds',
    text: 'The Ironhollow Hills, levels eighteen to twenty-eight. Wolves, boars, brigands, then Rusk the Hollow. Old Marrow is the rare of the deep hills and does not show often. The keep yard is the safe ground.',
  });
  m.add('label', 'Ironhollow Keep', 136, 48);
  m.add('label', 'Ironhollow Hills', 80, 190);
  const mobs = placeMobs(m, g, solid, safe, road, scenery, [
    ['hill_wolf', 'wolf', 40, 160],
    ['hill_wolf', 'wolf', 80, 168],
    ['hill_wolf', 'wolf', 170, 164],
    ['hill_wolf', 'wolf', 210, 156],
    ['hill_wolf', 'wolf', 48, 180],
    ['hill_boar', 'boar', 36, 188],
    ['hill_boar', 'boar', 100, 184],
    ['hill_boar', 'boar', 190, 176],
    ['hill_boar', 'boar', 230, 190],
    ['hill_brigand', 'bandit', 44, 204],
    ['hill_brigand', 'bandit', 90, 210],
    ['hill_brigand', 'bandit', 150, 206],
    ['hill_brigand', 'bandit', 210, 200],
    ['hill_brigand', 'archer', 60, 220],
    ['hill_bear', 'bear', 40, 232],
    ['hill_bear', 'bear', 120, 228],
    ['hill_bear', 'bear', 180, 236],
    ['hill_bear', 'bear', 230, 220],
    ['rusk', 'leader', 70, 214],
    ['old_marrow', 'bear', 214, 240],
  ]);
  border(g, solid);
  const map = m.finish(g, solid, safe, scenery);
  if (safe[96][136] !== 1) throw new Error('Ironhollow court is not safe');
  if (!mobs.includes('rusk') || !mobs.includes('old_marrow')) throw new Error('Ironhollow names missing');
  return { map, mobs };
}

function buildCanipure() {
  const g = grid(W, H, T.GRASS);
  const solid = grid(W, H, 0);
  const safe = grid(W, H, 0);
  const road = grid(W, H, 0);
  fillNoise(g, 44, (_x, _y, n) => (n < 0.62 ? T.GRASS : n < 0.84 ? T.GRASS_B : T.PINE_GROUND));
  for (let y = 1; y < H - 1; y++) {
    for (let x = 228; x < W - 1; x++) {
      g[y][x] = (x + y) % 2 === 0 ? T.WATER : T.WATER_B;
      solid[y][x] = 1;
    }
  }
  const scenery = paintScenery(g, solid, road, safe, (x, y, roll) => {
    if (x > 140) return null;
    if (roll > 0.86) return { frame: roll > 0.93 ? SC.TREE_B : SC.TREE, solid: true, kind: 'tree' };
    if (roll < 0.04) return { frame: SC.BUSH_GREEN, solid: false, kind: 'bush' };
    return null;
  });
  stroke(g, solid, road, scenery.grid, [[8, 128], [60, 128], [120, 128], [150, 120]], 1);
  stroke(g, solid, road, scenery.grid, [[176, 120], [210, 120], [222, 120]], 1);
  wallBox(g, solid, safe, 148, 78, 214, 168, T.WALL, T.FLOOR, [
    [148, 112, 1, 16],
    [214, 112, 1, 12],
  ]);
  clearPatch(scenery, 149, 79, 213, 167);
  frameGate(g, solid, 148, 112, 1, 16);
  frameGate(g, solid, 214, 112, 1, 12);
  layGround(g, solid, 150, 80, 212, 166, T.GRASS, T.MOSS);
  stampBuilding(g, solid, scenery, 172, 93, 6, 7, 'wood', { enter: false });
  stampBuilding(g, solid, scenery, 161, 93, 8, 7, 'wood', { enter: true, doorX: 164 });
  stampBuilding(g, solid, scenery, 191, 93, 8, 7, 'wood', { enter: true, doorX: 194 });
  stampBuilding(g, solid, scenery, 161, 137, 8, 7, 'wood', { enter: true, doorX: 164 });
  stampBuilding(g, solid, scenery, 191, 137, 8, 7, 'wood', { enter: true, doorX: 194 });
  stampBuilding(g, solid, scenery, 175, 151, 8, 7, 'wood', { enter: true, doorX: 178 });
  for (let y = 112; y <= 128; y++) {
    for (let x = 214; x <= 226; x++) {
      g[y][x] = T.DOCK;
      solid[y][x] = 0;
      safe[y][x] = 1;
      if (scenery.grid[y]) scenery.grid[y][x] = 0;
    }
  }
  const m = maker('canipure', 'Canipure', 'The Greenreach');
  const back = (tx, ty) => feet(tx, ty);
  m.add('door', 'To Ironhollow', 10, 128, { toZone: 'ironhollow', toX: feet(236, 36).x, toY: feet(236, 36).y, sprite: 'sign_wilds' });
  m.add('door', 'To Eldenmoor', 222, 120, { toZone: 'eldenmoor', toX: feet(220, 208).x, toY: feet(220, 208).y, sprite: 'sign_wilds' });
  m.add('door', 'Warden bough', 164, 99, { toZone: 'can_warden', toX: feet(8, 8).x, toY: feet(8, 8).y, sprite: 'sign_hall' });
  m.add('door', 'Rogue bough', 194, 99, { toZone: 'can_rogue', toX: feet(8, 8).x, toY: feet(8, 8).y, sprite: 'sign_hall' });
  m.add('door', 'Druid bough', 164, 143, { toZone: 'can_druid', toX: feet(8, 8).x, toY: feet(8, 8).y, sprite: 'sign_hall' });
  m.add('door', 'Ranger bough', 194, 143, { toZone: 'can_ranger', toX: feet(8, 8).x, toY: feet(8, 8).y, sprite: 'sign_hall' });
  m.add('door', 'Moss Stores', 178, 157, { toZone: 'can_shop', toX: feet(8, 8).x, toY: feet(8, 8).y, sprite: 'sign_inn' });
  m.add('spawn', 'bough', HOMES.wood_elf.tx, HOMES.wood_elf.ty);
  m.add('bind', 'canipure-stair', 170, 124);
  m.add('npc', 'vaela', 176, 108, { defId: 'vaela', sprite: 'vaela' });
  m.add('npc', 'sylven', 156, 120, { defId: 'sylven', sprite: 'sylven' });
  m.add('npc', 'oak', 200, 118, { defId: 'oak', sprite: 'oak' });
  m.add('npc', 'fern', 188, 124, { defId: 'fern', sprite: 'fern' });
  m.add('prop', 'banner', 184, 90, { sprite: 'banner' });
  m.add('prop', 'fire', 168, 112, { sprite: 'firepit' });
  m.add('sign', 'Canipure', 160, 86, {
    sprite: 'sign_hall',
    text: 'Canipure, treehouse city of the wood elves, on the east coast facing Vaelmoor. The bough court is safe. Wood elves and high elves are welcome in the halls. Other races may bind at the stair and buy bread from Moss. The halls do not teach them. West is the Greenreach. The dock faces the golden ships and Eldenmoor.',
  });
  m.add('sign', 'The Greenreach', 40, 116, {
    sprite: 'sign_wilds',
    text: 'The Greenreach. Levels one to ten, the young part of the forest that runs west, north of Ironhollow Keep, and on to Blackpine Tower. Hares, beetles, wolves, then Puck the Snare. Mossantler is the rare stag and is not often seen.',
  });
  m.add('sign', 'Vaelmoor dock', 210, 108, {
    sprite: 'sign_wilds',
    text: 'The coast faces Vaelmoor. A ship here crosses to Eldenmoor, the high elf city. The golden trade route also calls at Valdoria. The same ship comes back.',
  });
  m.add('label', 'Canipure', 180, 70);
  m.add('label', 'The Greenreach', 60, 70);
  const mobs = placeMobs(m, g, solid, safe, road, scenery, [
    ['reach_hare', 'hare', 30, 40],
    ['reach_hare', 'hare', 70, 56],
    ['reach_hare', 'hare', 40, 90],
    ['reach_hare', 'hare', 100, 48],
    ['reach_beetle', 'beetle', 24, 70],
    ['reach_beetle', 'beetle', 80, 80],
    ['reach_beetle', 'beetle', 50, 150],
    ['reach_beetle', 'beetle', 110, 160],
    ['green_fox', 'fox', 36, 120],
    ['green_fox', 'fox', 90, 140],
    ['green_fox', 'fox', 28, 180],
    ['green_wolf', 'wolf', 40, 170],
    ['green_wolf', 'wolf', 70, 190],
    ['green_wolf', 'wolf', 100, 200],
    ['green_wolf', 'wolf', 24, 210],
    ['green_wolf', 'wolf', 80, 220],
    ['reach_spider', 'spider', 36, 200],
    ['reach_spider', 'spider', 110, 180],
    ['reach_boar', 'boar', 48, 230],
    ['reach_boar', 'boar', 90, 236],
    ['reach_boar', 'boar', 20, 236],
    ['puck', 'bandit', 60, 214],
    ['mossantler', 'stag', 100, 240],
  ]);
  border(g, solid);
  const map = m.finish(g, solid, safe, scenery);
  if (safe[HOMES.wood_elf.ty][HOMES.wood_elf.tx] !== 1) throw new Error('Canipure yard is not safe');
  if (!mobs.includes('puck') || !mobs.includes('mossantler')) throw new Error('Greenreach names missing');
  const halls = [
    interior('can_warden', 'Warden Bough', 'canipure', back(164, 102), [['larkin', 'larkin', 6, 4]], 'The warden bough. Larkin Bough sells the drills. Nothing is learned by leveling. The list says Requires level N. The door returns to Canipure.'),
    interior('can_rogue', 'Rogue Bough', 'canipure', back(194, 102), [['thistle', 'thistle', 6, 4]], 'The rogue bough. Thistle Venn sells the quiet drills. The level on the line is the lock. The door returns to Canipure.'),
    interior('can_druid', 'Druid Bough', 'canipure', back(164, 146), [['briar', 'briar', 6, 4]], 'The druid bough. Briar Holt sells mends, roots, and the rot that stays. Buying is the only way they are learned. The door returns to Canipure.'),
    interior('can_ranger', 'Ranger Bough', 'canipure', back(194, 146), [['rowan', 'rowan', 6, 4]], 'The ranger bough. Rowan Keel sells the bow drills and the beast-call. The list runs to fifty. The door returns to Canipure.'),
    interior('can_shop', "Moss's Stores", 'canipure', back(178, 160), [['moss', 'moss', 5, 4]], "Moss's stores. Bread and bandages for anyone. Grove cloth and the charts for elves. The door returns to Canipure."),
  ];
  return { map, halls, mobs };
}

function buildGrokthul() {
  const g = grid(W, H, T.ROCK_GROUND);
  const solid = grid(W, H, 0);
  const safe = grid(W, H, 0);
  const road = grid(W, H, 0);
  fillNoise(g, 52, (x, y, n) => {
    if (y < 130) return n < 0.5 ? T.ROCK_GROUND : n < 0.75 ? T.SNOW_C : T.MUD;
    return n < 0.45 ? T.GRASS : n < 0.7 ? T.MUD : T.ROCK_GROUND;
  });
  const scenery = paintScenery(g, solid, road, safe, (_x, y, roll) => {
    if (roll < 0.02) return { frame: SC.ROCK, solid: true, kind: 'rock' };
    if (y > 140 && roll > 0.96) return { frame: SC.BUSH_DARK, solid: false, kind: 'bush' };
    return null;
  });
  stroke(g, solid, road, scenery.grid, [[128, 8], [128, 36], [128, 120], [128, 248]], 1);
  outpost(g, solid, safe, scenery, 80, 36, 176, 112, [[120, 36, 16, 1], [120, 112, 16, 1]]);
  frameGate(g, solid, 120, 36, 16, 1);
  frameGate(g, solid, 120, 112, 16, 1);
  layGround(g, solid, 82, 38, 174, 110, T.MUD);
  stampBuilding(g, solid, scenery, 106, 53, 6, 7, 'ogre', { enter: false });
  stampBuilding(g, solid, scenery, 95, 53, 8, 7, 'ogre', { enter: true, doorX: 98 });
  stampBuilding(g, solid, scenery, 149, 53, 8, 7, 'ogre', { enter: true, doorX: 152 });
  stampBuilding(g, solid, scenery, 125, 91, 8, 7, 'ogre', { enter: true, doorX: 128 });
  stampBuilding(g, solid, scenery, 147, 88, 8, 7, 'ogre', { enter: true, doorX: 150 });
  const m = maker('grokthul', 'Grokthul Hold', 'Grokthul Valley');
  const back = (tx, ty) => feet(tx, ty);
  m.add('door', 'To the Grokthul Peaks', 128, 12, { toZone: 'grokthul_peaks', toX: feet(128, 232).x, toY: feet(128, 232).y, sprite: 'sign_wilds' });
  m.add('door', 'Warrior pit', 98, 59, { toZone: 'grok_warrior', toX: feet(8, 8).x, toY: feet(8, 8).y, sprite: 'sign_hall' });
  m.add('door', 'Shaman pit', 152, 59, { toZone: 'grok_shaman', toX: feet(8, 8).x, toY: feet(8, 8).y, sprite: 'sign_hall' });
  m.add('door', 'Berserker pit', 128, 97, { toZone: 'grok_berserker', toX: feet(8, 8).x, toY: feet(8, 8).y, sprite: 'sign_hall' });
  m.add('door', "Ugga's Stores", 150, 94, { toZone: 'grok_shop', toX: feet(8, 8).x, toY: feet(8, 8).y, sprite: 'sign_inn' });
  m.add('spawn', 'yard', HOMES.ogre.tx, HOMES.ogre.ty);
  m.add('bind', 'grokthul-fire', 120, 78);
  m.add('npc', 'grukka', 128, 68, { defId: 'grukka', sprite: 'grukka' });
  m.add('npc', 'gash', 96, 100, { defId: 'gash', sprite: 'gash' });
  m.add('npc', 'mara', 156, 100, { defId: 'mara', sprite: 'mara' });
  m.add('prop', 'fire', 116, 72, { sprite: 'firepit' });
  m.add('prop', 'banner', 140, 46, { sprite: 'banner' });
  m.add('sign', 'Grokthul Hold', 96, 44, {
    sprite: 'sign_hall',
    text: 'Grokthul Hold, camp of the Grokthul ogres, in the eastern Ogre Highlands. This clan fights the waking dragons. They are not Vargan Frostfang\'s highland ogres, and they do not serve him. The yard is safe. North, the Grokthul Peaks run toward Wyrmrest. South is the young valley. King Aldric Valdor\'s castle at Wyrmrest is the neighbor, not the master.',
  });
  m.add('sign', 'North road', 140, 24, {
    sprite: 'sign_wilds',
    text: 'The Grokthul Peaks. Levels twenty-eight to thirty-five. Wyrmrest is west of those peaks. This valley is not that road. Hares and wolves first. Brug the Toll and Old Tusk are the names.',
  });
  m.add('sign', 'The valley', 150, 140, {
    sprite: 'sign_wilds',
    text: 'The Grokthul valley, levels one to ten. The peaks north are not for the young. Sit the fire if you mean to fall here.',
  });
  m.add('label', 'Grokthul Hold', 128, 28);
  m.add('label', 'Grokthul Valley', 70, 180);
  const mobs = placeMobs(m, g, solid, safe, road, scenery, [
    ['hold_hare', 'hare', 40, 140],
    ['hold_hare', 'hare', 80, 150],
    ['hold_hare', 'hare', 170, 146],
    ['hold_hare', 'hare', 210, 160],
    ['hold_beetle', 'beetle', 36, 168],
    ['hold_beetle', 'beetle', 100, 160],
    ['hold_beetle', 'beetle', 190, 170],
    ['hold_beetle', 'beetle', 230, 150],
    ['hold_wolf', 'wolf', 48, 186],
    ['hold_wolf', 'wolf', 90, 196],
    ['hold_wolf', 'wolf', 150, 188],
    ['hold_wolf', 'wolf', 200, 200],
    ['hold_wolf', 'wolf', 40, 210],
    ['hold_boar', 'boar', 70, 220],
    ['hold_boar', 'boar', 130, 214],
    ['hold_boar', 'boar', 190, 224],
    ['hold_boar', 'boar', 230, 210],
    ['hold_bear', 'bear', 36, 234],
    ['hold_bear', 'bear', 110, 236],
    ['hold_bear', 'bear', 180, 240],
    ['brug', 'leader', 64, 228],
    ['old_tusk', 'boar', 214, 242],
  ]);
  border(g, solid);
  const map = m.finish(g, solid, safe, scenery);
  if (safe[HOMES.ogre.ty][HOMES.ogre.tx] !== 1) throw new Error('Grokthul yard is not safe');
  if (!mobs.includes('brug') || !mobs.includes('old_tusk')) throw new Error('Grokthul names missing');
  const halls = [
    interior('grok_warrior', 'Warrior Pit', 'grokthul', back(98, 62), [['bruk', 'bruk', 6, 4]], 'The warrior pit. Bruk sells the same drills Eirik sells. The level on the line is the lock. The door returns to Grokthul Hold.'),
    interior('grok_shaman', 'Shaman Pit', 'grokthul', back(152, 62), [['shala', 'shala', 6, 4]], 'The shaman pit. Shala sells Torunn\'s list. Nothing arrives because you grew. The door returns to Grokthul Hold.'),
    interior('grok_berserker', 'Berserker Pit', 'grokthul', back(128, 100), [['ruk', 'ruk', 6, 4]], 'The berserker pit. Ruk the Red sells the rage drills through the last of them. The door returns to Grokthul Hold.'),
    interior('grok_shop', "Ugga's Stores", 'grokthul', back(156, 98), [['ugga', 'ugga', 5, 4]], "Ugga's stores. Rations, the valley charts, and heavy leather. The door returns to Grokthul Hold."),
  ];
  return { map, halls, mobs };
}

function buildPeaks() {
  const g = grid(W, H, T.ROCK_GROUND);
  const solid = grid(W, H, 0);
  const safe = grid(W, H, 0);
  const road = grid(W, H, 0);
  fillNoise(g, 61, (_x, _y, n) => (n < 0.45 ? T.ROCK_GROUND : n < 0.75 ? T.SNOW_C : T.MUD));
  const scenery = paintScenery(g, solid, road, safe, (_x, _y, roll) => {
    if (roll < 0.025) return { frame: SC.ROCK, solid: true, kind: 'rock' };
    if (roll > 0.985) return { frame: SC.PINE_SNOW, solid: true, kind: 'tree' };
    return null;
  });
  stroke(g, solid, road, scenery.grid, [[8, 140], [80, 140], [128, 140], [128, 200], [128, 248]], 1);
  stroke(g, solid, road, scenery.grid, [[128, 140], [128, 80], [128, 24]], 1);
  outpost(g, solid, safe, scenery, 96, 156, 168, 214, [[112, 214, 16, 1]]);
  const m = maker('grokthul_peaks', 'Tuskwatch', 'Grokthul Peaks');
  m.add('door', 'To Wyrmrest', 12, 140, { toZone: 'wyrmrest', toX: feet(232, 140).x, toY: feet(232, 140).y, sprite: 'sign_wilds' });
  m.add('door', 'To Grokthul Hold', 128, 246, { toZone: 'grokthul', toX: feet(128, 22).x, toY: feet(128, 22).y, sprite: 'sign_wilds' });
  m.add('spawn', 'watch', 128, 190);
  m.add('bind', 'tuskwatch', 140, 186);
  m.add('npc', 'skaal', 128, 176, { defId: 'skaal', sprite: 'skaal' });
  m.add('prop', 'fire', 116, 180, { sprite: 'firepit' });
  m.add('sign', 'Tuskwatch', 108, 200, {
    sprite: 'sign_hall',
    text: 'Tuskwatch. A Grokthul fire on the peaks, beside Wyrmrest. The yard is safe. West is the castle. South is Grokthul Hold and the young valley. The peaks themselves are levels twenty-eight to thirty-five: wolves, wyrm pups, ash drakes, and Cindermaw. These ogres hunt dragons. Vargan Frostfang\'s clan is another people, in another pass.',
  });
  m.add('sign', 'West road', 36, 132, {
    sprite: 'sign_wilds',
    text: 'Wyrmrest, castle on the kingdom\'s northern border, under the Ogre Highlands. King Aldric Valdor\'s castellan keeps it. The same road comes back.',
  });
  m.add('sign', 'South road', 140, 230, {
    sprite: 'sign_wilds',
    text: 'Grokthul Hold, and the valley under it. That ground is for the young. The peaks are not.',
  });
  m.add('label', 'Grokthul Peaks', 70, 70);
  m.add('label', 'Tuskwatch', 128, 148);
  const mobs = placeMobs(m, g, solid, safe, road, scenery, [
    ['peak_wolf', 'ash_wolf', 40, 120],
    ['peak_wolf', 'ash_wolf', 80, 100],
    ['peak_wolf', 'ash_wolf', 170, 110],
    ['peak_wolf', 'ash_wolf', 210, 130],
    ['peak_wolf', 'ash_wolf', 48, 80],
    ['wyrm_pup', 'drake', 40, 70],
    ['wyrm_pup', 'drake', 90, 60],
    ['wyrm_pup', 'drake', 160, 64],
    ['wyrm_pup', 'drake', 210, 50],
    ['ash_drake', 'drake', 36, 48],
    ['ash_drake', 'drake', 80, 40],
    ['ash_drake', 'drake', 150, 44],
    ['ash_drake', 'drake', 200, 36],
    ['ridge_cultist', 'cultist', 50, 36],
    ['ridge_cultist', 'cultist', 110, 30],
    ['ridge_cultist', 'cultist', 180, 28],
    ['cindermaw', 'drake', 128, 24],
  ]);
  border(g, solid);
  const map = m.finish(g, solid, safe, scenery);
  if (safe[176][128] !== 1) throw new Error('Tuskwatch is not safe');
  if (!mobs.includes('cindermaw')) throw new Error('Cindermaw missing');
  return { map, mobs };
}

export function linkPhase2(maps) {
  const byId = Object.fromEntries(maps.map((map) => [map.id, map]));
  const addDoor = (zoneId, name, tx, ty, toZone, toTx, toTy) => {
    const map = byId[zoneId];
    if (!map) throw new Error(`missing ${zoneId}`);
    const here = feet(tx, ty);
    const there = feet(toTx, toTy);
    map.objects.push({
      kind: 'door',
      name,
      x: here.x,
      y: here.y,
      toZone,
      toX: there.x,
      toY: there.y,
      sprite: 'sign_wilds',
    });
    if (map.solid?.[ty]) map.solid[ty][tx] = 0;
    if (map.scenery?.[ty]) map.scenery[ty][tx] = 0;
    const tile = map.ground?.[ty]?.[tx];
    if (tile === T.WATER || tile === T.WATER_B || tile === T.CLIFF || tile === T.STONE || tile === T.WALL) {
      map.ground[ty][tx] = T.PATH;
    }
  };
  addDoor('valdoria', 'To Ironhollow', 244, 40, 'ironhollow', 16, 36);
  addDoor('wyrmrest', 'To the Grokthul Peaks', 244, 140, 'grokthul_peaks', 20, 140);
  addDoor('eldenmoor', 'To Canipure', 200, 208, 'canipure', 208, 120);
  const note = (zoneId, signName, extra) => {
    const sign = byId[zoneId]?.objects.find((obj) => obj.kind === 'sign' && obj.name === signName);
    if (sign && !sign.text.includes(extra.slice(0, 24))) sign.text = `${sign.text} ${extra}`;
  };
  note('valdoria', 'Blackpine Tower', 'East of the pines, the forest road is open: Ironhollow Keep, then the Greenreach and Canipure. King Aldric Valdor rules Valdoria, and the castle lords answer to him.');
  note('wyrmrest', 'Wyrmrest', 'East, the Grokthul Peaks. The Grokthul ogres fight the waking dragons and are not Vargan Frostfang\'s clan. King Aldric Valdor is the king these castles answer to.');
  return { tile: TILE };
}
