import type { Actor, ContentDb, Equipment, GameState, MapData, Stats } from './types';
import { maxHp, maxMana } from './formulas';

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
  state.inventory = content.player.items.map((stack) => ({ ...stack }));
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
  refreshGear(state, content);
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
  configurePlayer(state, content, classId);
  const stats = { ...cls.stats };
  for (const key of STAT_KEYS) {
    stats[key] = Math.max(1, cls.stats[key] + (race.mods[key] ?? 0) + (bonus[key] ?? 0));
  }
  state.baseStats = { ...stats };
  state.stats = { ...stats };
  state.raceId = race.id;
  refreshGear(state, content);
  const player = getPlayer(state);
  player.hp = player.maxHp;
  state.mana = state.maxMana;
  return true;
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

  const actors: Actor[] = [player];
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
        }),
      );
    } else if (spawn.kind === 'mob') {
      const def = content.mobs[spawn.defId];
      if (!def) throw new Error(`map mob ${spawn.defId} has no definition`);
      mobIndex += 1;
      actors.push(
        blankActor({
          id: `mob_${mobIndex}`,
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
    inventory: [],
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
    autoAttack: false,
    targetId: null,
    cooldowns: {},
    itemLockMs: 0,
    outOfCombatMs: 0,
    regenBank: 0,
    invulnMs: 0,
    input: { x: 0, y: 0, dest: null, pendingInteract: null, pendingSign: null },
    ui: { panel: 'none', npcId: null, nodeId: null, title: null, body: null },
    quests: { wolf_pelts: { stage: 'none', progress: 0 } },
    log: ['The gate of Hoffender is north. The Frostmere Wilds, and the wolves on their road, wait beyond it.'],
    bind: { ...map.bind },
    dead: false,
    deathMs: 0,
    events: [],
  };
  configurePlayer(world, content, cls.id);
  return world;
}

export function nextEntityId(state: GameState, prefix: string): string {
  state.nextId += 1;
  return `${prefix}_${state.nextId}`;
}
