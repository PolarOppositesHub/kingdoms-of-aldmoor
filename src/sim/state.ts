import type { Actor, ContentDb, Equipment, GameState, MapData, Stats } from './types';
import { LOADOUT_CAP } from './types';
import { maxHp, maxMana } from './formulas';
import { addItem, emptyBags } from './bags';
import { raceScale } from './appearance';

export function getPlayer(state: GameState): Actor {
  const player = state.actors.find((actor) => actor.id === state.playerId);
  if (!player) throw new Error('player missing from state');
  return player;
}

export function findActor(state: GameState, id: string | null): Actor | null {
  if (!id) return null;
  return state.actors.find((actor) => actor.id === id) ?? null;
}

export function blankActor(partial: Pick<Actor, 'id' | 'kind' | 'defId' | 'name' | 'sprite' | 'x' | 'y'> & Partial<Actor>): Actor {
  return {
    facing: 's',
    hp: 1,
    maxHp: 1,
    level: 1,
    alive: true,
    homeX: partial.x,
    homeY: partial.y,
    hate: [],
    attackMs: 0,
    ai: 'idle',
    wander: null,
    wanderMs: 0,
    respawnMs: 0,
    corpseMs: 0,
    social: '',
    path: [],
    pathTx: -999,
    pathTy: -999,
    stuck: 0,
    slowMs: 0,
    slowRate: 1,
    dotMs: 0,
    dotAmount: 0,
    dotBank: 0,
    pet: false,
    dormant: false,
    scale: 1,
    ...partial,
  };
}

/** Starting loadout. Used at world creation and by the gate's class choice, before the first tick. */
export function configurePlayer(state: GameState, content: ContentDb, classId: string): void {
  const cls = content.classes[classId];
  if (!cls) return;
  const player = getPlayer(state);
  const level = 1;
  state.classId = cls.id;
  state.baseStats = { ...cls.stats };
  state.stats = { ...cls.stats };
  state.ac = cls.ac;
  state.level = level;
  state.xp = 0;
  state.equipment = emptyEquipment(cls.weapon);
  state.bags = emptyBags();
  state.copper = content.player.copper;
  state.autoAttack = false;
  state.targetId = null;
  player.defId = cls.id;
  player.sprite = cls.sprite;
  player.level = level;
  player.maxHp = maxHp(content, cls.id, level, state.stats);
  player.hp = player.maxHp;
  player.attackMs = content.tuning.swingWindupMs;
  state.maxMana = maxMana(content, cls.id, level, state.stats);
  state.mana = state.maxMana;
  state.manaRegenBank = 0;
  state.cooldowns = {};
  for (const abilityId of cls.abilities) state.cooldowns[abilityId] = 0;
  state.learned = [];
  state.loadout = cls.abilities.slice(0, LOADOUT_CAP);
  state.charts = [];
  state.petOrder = 'follow';
  state.petHold = null;
  state.petFocus = null;
  state.sneakMs = 0;
  state.evadeMs = 0;
  state.powerMs = 0;
  const focusMax = cls.resource === 'guile' || cls.resource === 'rage' ? cls.baseFocus + cls.focusPerLevel : 0;
  state.focusMax = focusMax;
  state.focus = cls.resource === 'rage' ? 0 : focusMax;
  if (cls.kit) {
    for (const slot of ['head', 'chest', 'hands', 'legs', 'feet', 'secondary'] as const) {
      const piece = cls.kit[slot];
      if (piece) state.equipment[slot] = piece;
    }
  }
  player.sprite = state.sex === 'female' ? 'body_f' : 'body_m';
  player.scale = raceScale(content, state.raceId);
  addItem(state, content, 'threadbare_sack', 1);
  for (const stack of content.player.items) addItem(state, content, stack.itemId, stack.qty);
  refreshGear(state, content);
  syncCompanion(state, content);
}

export function syncCompanion(state: GameState, content: ContentDb): void {
  state.actors = state.actors.filter((actor) => !actor.pet);
  if (state.classId !== 'warden') return;
  const player = getPlayer(state);
  const def = content.mobs.warden_wolf;
  state.actors.push(
    blankActor({
      id: 'pet_wolf',
      kind: 'mob',
      defId: 'warden_wolf',
      name: def?.name ?? 'snow wolf',
      sprite: 'frost_wolf',
      x: player.x - 18,
      y: player.y + 8,
      hp: def?.hp ?? 36,
      maxHp: def?.hp ?? 36,
      level: Math.max(1, state.level),
      social: '',
      pet: true,
      attackMs: def?.delayMs ?? 1800,
    }),
  );
}

export function emptyEquipment(primary: string | null): Equipment {
  return {
    head: null,
    chest: null,
    hands: null,
    legs: null,
    feet: null,
    primary,
    secondary: null,
  };
}

const STAT_KEYS = ['str', 'sta', 'agi', 'dex', 'wis', 'int', 'cha'] as const;

export function armorAc(content: ContentDb, state: GameState): number {
  let ac = content.classes[state.classId]?.ac ?? 0;
  for (const id of Object.values(state.equipment)) {
    if (!id) continue;
    ac += content.items[id]?.ac ?? 0;
  }
  return ac;
}

/** Worn items add their bonuses on top of the hero chosen at the gate. */
export function refreshGear(state: GameState, content: ContentDb): void {
  const stats = { ...state.baseStats };
  let bonusHp = 0;
  let bonusMana = 0;
  for (const id of Object.values(state.equipment)) {
    const bonus = id ? content.items[id]?.bonuses : undefined;
    if (!bonus) continue;
    stats.str += bonus.str ?? 0;
    stats.sta += bonus.sta ?? 0;
    stats.agi += bonus.agi ?? 0;
    stats.dex += bonus.dex ?? 0;
    stats.wis += bonus.wis ?? 0;
    stats.int += bonus.int ?? 0;
    stats.cha += bonus.cha ?? 0;
    bonusHp += bonus.hp ?? 0;
    bonusMana += bonus.mana ?? 0;
  }
  state.stats = stats;
  state.ac = armorAc(content, state);
  const player = getPlayer(state);
  player.maxHp = maxHp(content, state.classId, state.level, stats) + bonusHp;
  if (player.hp > player.maxHp) player.hp = player.maxHp;
  state.maxMana = maxMana(content, state.classId, state.level, stats) + bonusMana;
  if (state.mana > state.maxMana) state.mana = state.maxMana;
}

/** Gate creation. Only before the first tick. Race mods and bonus points land on the class base. */
export function applyHero(
  state: GameState,
  content: ContentDb,
  raceId: string,
  classId: string,
  bonus: Stats,
  sex: 'male' | 'female' = 'male',
): boolean {
  if (state.tick > 0) return false;
  const race = content.roster.races.find((entry) => entry.id === raceId);
  const rosterClass = content.roster.classes.find((entry) => entry.id === classId);
  const cls = content.classes[classId];
  if (!race?.playable || !rosterClass?.playable || !cls) return false;
  if (!rosterClass.races.includes(race.id)) return false;
  let spent = 0;
  for (const key of STAT_KEYS) {
    const add = bonus[key] ?? 0;
    if (add < 0 || !Number.isInteger(add)) return false;
    spent += add;
  }
  if (spent > content.roster.points) return false;
  state.sex = sex;
  state.raceId = race.id;
  configurePlayer(state, content, classId);
  const stats = { ...cls.stats };
  for (const key of STAT_KEYS) {
    stats[key] = Math.max(1, cls.stats[key] + (race.mods[key] ?? 0) + (bonus[key] ?? 0));
  }
  state.baseStats = { ...stats };
  state.stats = { ...stats };
  state.sex = state.sex === 'female' ? 'female' : 'male';
  refreshGear(state, content);
  const player = getPlayer(state);
  player.scale = raceScale(content, state.raceId);
  player.sprite = state.sex === 'female' ? 'body_f' : 'body_m';
  player.hp = player.maxHp;
  state.mana = state.maxMana;
  return true;
}

export function emptyQuests(content: ContentDb): GameState['quests'] {
  const quests: GameState['quests'] = {};
  for (const quest of content.quests) quests[quest.id] = { stage: 'none', progress: 0 };
  if (!quests.wolf_pelts) quests.wolf_pelts = { stage: 'none', progress: 0 };
  return quests;
}

export function actorsFromMap(content: ContentDb, map: MapData): Actor[] {
  const actors: Actor[] = [];
  let mobIndex = 0;
  for (const spawn of map.spawns) {
    if (spawn.kind === 'npc') {
      const def = content.npcs[spawn.defId];
      if (!def) throw new Error(`map npc ${spawn.defId} has no definition`);
      actors.push(
        blankActor({
          id: `npc_${def.id}`,
          kind: 'npc',
          defId: def.id,
          name: def.name,
          sprite: spawn.sprite || def.id,
          x: spawn.x,
          y: spawn.y,
          scale: raceScale(content, def.race ?? 'barbarian'),
        }),
      );
    } else if (spawn.kind === 'mob') {
      const def = content.mobs[spawn.defId];
      if (!def) throw new Error(`map mob ${spawn.defId} has no definition`);
      mobIndex += 1;
      actors.push(
        blankActor({
          id: `mob_${map.zoneId}_${mobIndex}`,
          kind: 'mob',
          defId: def.id,
          name: def.name,
          sprite: spawn.sprite || def.id,
          x: spawn.x,
          y: spawn.y,
          hp: def.hp,
          maxHp: def.hp,
          level: def.level,
          social: def.social,
          attackMs: def.delayMs,
          wanderMs: 400 + mobIndex * 180,
        }),
      );
    }
  }
  return actors;
}

export function createWorld(content: ContentDb, map: MapData, seed: number, debug = false): GameState {
  const cls = content.classes[content.player.classId];
  if (!cls) throw new Error(`missing class ${content.player.classId}`);
  const playerSpawn = map.spawns.find((spawn) => spawn.kind === 'spawn');
  const origin = playerSpawn ?? { x: map.bind.x, y: map.bind.y };
  const player = blankActor({
    id: 'player',
    kind: 'player',
    defId: cls.id,
    name: content.player.name,
    sprite: cls.sprite,
    x: origin.x,
    y: origin.y,
  });

  const actors: Actor[] = [player, ...actorsFromMap(content, map)];

  const world: GameState = {
    version: 1,
    seed: seed >>> 0,
    rng: seed >>> 0,
    tick: 0,
    timeMs: 0,
    nextId: 1,
    zoneId: map.zoneId,
    debug,
    playerId: player.id,
    actors,
    ground: [],
    bags: emptyBags(),
    equipment: emptyEquipment(cls.weapon),
    baseStats: { ...cls.stats },
    copper: 0,
    factions: {},
    xp: 0,
    level: 1,
    stats: { ...cls.stats },
    ac: cls.ac,
    classId: cls.id,
    raceId: 'barbarian',
    mana: 0,
    maxMana: 0,
    manaRegenBank: 0,
    focus: 0,
    focusMax: 0,
    learned: [],
    loadout: [],
    charts: [],
    petOrder: 'follow',
    petHold: null,
    petFocus: null,
    portalLockMs: 0,
    nodeReady: {},
    sneakMs: 0,
    evadeMs: 0,
    powerMs: 0,
    sex: 'male',
    autoAttack: false,
    targetId: null,
    cooldowns: {},
    itemLockMs: 0,
    outOfCombatMs: 0,
    regenBank: 0,
    invulnMs: 0,
    input: { x: 0, y: 0, dest: null, pendingInteract: null, pendingSign: null },
    ui: { panel: 'none', npcId: null, nodeId: null, title: null, body: null },
    quests: emptyQuests(content),
    log: ['The gate of Hoffender is north. The Frostmere Wilds, and the wolves on their road, wait beyond it.'],
    bind: { ...map.bind },
    dead: false,
    deathMs: 0,
    events: [],
  };
  configurePlayer(world, content, cls.id);
  refreshMobActivity(world, map);
  return world;
}

const CELL_TILES = 32;
const CELL_RANGE = 2;
const ACTIVE_CAP = 40;

/** Simulate mobs only in cells near the player, and keep about 40 of them awake. */
export function refreshMobActivity(state: GameState, map: MapData): void {
  const player = getPlayer(state);
  const cell = map.tileWidth * CELL_TILES;
  const pcx = Math.floor(player.x / cell);
  const pcy = Math.floor(player.y / cell);
  const ranked = state.actors
    .filter((actor) => actor.kind === 'mob' && !actor.pet)
    .map((mob) => {
      const cx = Math.floor(mob.homeX / cell);
      const cy = Math.floor(mob.homeY / cell);
      const cheb = Math.max(Math.abs(cx - pcx), Math.abs(cy - pcy));
      const engaged = mob.hate.length > 0 || state.targetId === mob.id || state.petFocus === mob.id;
      const dx = mob.x - player.x;
      const dy = mob.y - player.y;
      return { mob, cheb, engaged, d: dx * dx + dy * dy };
    });
  ranked.sort((a, b) => Number(b.engaged) - Number(a.engaged) || a.cheb - b.cheb || a.d - b.d);
  let active = 0;
  for (const row of ranked) {
    const wake = row.engaged || (row.cheb <= CELL_RANGE && active < ACTIVE_CAP);
    row.mob.dormant = !wake;
    if (wake) active += 1;
  }
}

/** Swap the living cast for another map. The player, the wolf, and the inn bind stay. */
export function commitZone(state: GameState, content: ContentDb, map: MapData, x: number, y: number): void {
  const player = getPlayer(state);
  const pet = state.actors.find((actor) => actor.pet);
  const spawned = actorsFromMap(content, map);
  state.actors = pet ? [player, pet, ...spawned] : [player, ...spawned];
  player.x = x;
  player.y = y;
  player.path = [];
  player.pathTx = -999;
  player.pathTy = -999;
  if (pet) {
    pet.x = x - 16;
    pet.y = y + 10;
    pet.homeX = pet.x;
    pet.homeY = pet.y;
    pet.path = [];
    pet.pathTx = -999;
    pet.dormant = false;
  }
  state.zoneId = map.zoneId;
  state.ground = [];
  state.targetId = null;
  state.autoAttack = false;
  state.petFocus = null;
  if (state.petOrder === 'attack') state.petOrder = 'follow';
  state.input.dest = null;
  state.input.pendingInteract = null;
  state.input.pendingSign = null;
  state.portalLockMs = 800;
  refreshMobActivity(state, map);
}

export function nextEntityId(state: GameState, prefix: string): string {
  state.nextId += 1;
  return `${prefix}_${state.nextId}`;
}
