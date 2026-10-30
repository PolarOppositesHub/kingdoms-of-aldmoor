import type { Actor, ContentDb, GameState, MapData } from './types';
import { maxHp } from './formulas';

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
    ...partial,
  };
}

export function createWorld(content: ContentDb, map: MapData, seed: number, debug = false): GameState {
  const cls = content.classes[content.player.classId];
  if (!cls) throw new Error(`missing class ${content.player.classId}`);
  const stats = { ...cls.stats };
  const level = 1;
  const hp = maxHp(content, cls.id, level, stats);
  const playerSpawn = map.spawns.find((spawn) => spawn.kind === 'spawn');
  const origin = playerSpawn ?? { x: map.bind.x, y: map.bind.y };
  const player = blankActor({
    id: 'player',
    kind: 'player',
    defId: cls.id,
    name: content.player.name,
    sprite: 'warrior',
    x: origin.x,
    y: origin.y,
    hp,
    maxHp: hp,
    level,
    attackMs: content.tuning.swingWindupMs,
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

  const cooldowns: Record<string, number> = {};
  for (const abilityId of cls.abilities) cooldowns[abilityId] = 0;

  return {
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
    inventory: content.player.items.map((stack) => ({ ...stack })),
    equipment: { primary: cls.weapon },
    copper: content.player.copper,
    xp: 0,
    level,
    stats,
    ac: cls.ac,
    classId: cls.id,
    autoAttack: false,
    targetId: null,
    cooldowns,
    itemLockMs: 0,
    outOfCombatMs: 0,
    regenBank: 0,
    invulnMs: 0,
    input: { x: 0, y: 0, dest: null, pendingInteract: null },
    ui: { panel: 'none', npcId: null, nodeId: null },
    log: ['The gate of Hoffender is north. Wolves are already on the road.'],
    bind: { ...map.bind },
    dead: false,
    deathMs: 0,
    events: [],
  };
}

export function nextEntityId(state: GameState, prefix: string): string {
  state.nextId += 1;
  return `${prefix}_${state.nextId}`;
}
