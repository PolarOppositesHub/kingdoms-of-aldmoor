import type { ContentDb, Equipment, GameState, HeldBag, ItemStack, MapData, PetOrder } from './types';
import { emptyQuests, refreshGear, syncCompanion } from './state';
import { raceScale } from './appearance';
import { bagsFromLegacy, normalizeBags } from './bags';
import { bodyBlocked } from './map';

export const SAVE_VERSION = 3;

export interface CharacterSave {
  version: number;
  savedAt: number;
  zoneId: string;
  x: number;
  y: number;
  facing: GameState['actors'][number]['facing'];
  raceId: string;
  classId: string;
  sex: 'male' | 'female';
  level: number;
  xp: number;
  hp: number;
  mana: number;
  focus: number;
  copper: number;
  baseStats: GameState['baseStats'];
  inventory?: ItemStack[];
  bags?: (HeldBag | null)[];
  equipment: Equipment;
  quests: GameState['quests'];
  learned: string[];
  loadout: string[];
  charts: string[];
  petOrder: PetOrder;
  /** Absent on saves from before the pet window. Those heroes still have their wolf. */
  petAway?: boolean;
  factions: Record<string, number>;
  nodeReady?: Record<string, number>;
  /** Set when an older map layout cannot be trusted. Not written back out. */
  relocated?: boolean;
  note?: string;
}

export function captureSave(state: GameState, savedAt = 0): CharacterSave {
  const player = state.actors.find((actor) => actor.id === state.playerId);
  return {
    version: SAVE_VERSION,
    savedAt,
    zoneId: state.zoneId,
    x: player?.x ?? state.bind.x,
    y: player?.y ?? state.bind.y,
    facing: player?.facing ?? 's',
    raceId: state.raceId,
    classId: state.classId,
    sex: state.sex,
    level: state.level,
    xp: state.xp,
    hp: player?.hp ?? 1,
    mana: state.mana,
    focus: state.focus,
    copper: state.copper,
    baseStats: { ...state.baseStats },
    bags: state.bags.map((bag) => (bag ? { itemId: bag.itemId, slots: bag.slots.map((slot) => (slot ? { ...slot } : null)) } : null)),
    equipment: { ...state.equipment },
    quests: Object.fromEntries(Object.entries(state.quests).map(([id, quest]) => [id, { ...quest }])),
    nodeReady: { ...state.nodeReady },
    learned: [...state.learned],
    loadout: [...state.loadout],
    charts: [...state.charts],
    petOrder: state.petOrder,
    petAway: state.petAway,
    factions: { ...state.factions },
  };
}

function migrateQuests(raw: CharacterSave['quests'] | undefined): CharacterSave['quests'] {
  const quests: CharacterSave['quests'] = {};
  if (raw && typeof raw === 'object') {
    for (const [id, quest] of Object.entries(raw)) {
      if (!quest || typeof quest !== 'object') continue;
      const stage = quest.stage === 'active' || quest.stage === 'done' ? quest.stage : 'none';
      quests[id] = { stage, progress: typeof quest.progress === 'number' ? quest.progress : 0 };
    }
  }
  if (!quests.wolf_pelts) quests.wolf_pelts = { stage: 'none', progress: 0 };
  return quests;
}

/** Barbarian wizards become warriors. Wizard spells are dropped. Gear and progress stay. */
export function migrateSave(raw: unknown): CharacterSave | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Partial<CharacterSave>;
  if (row.version !== undefined && row.version !== 1 && row.version !== 2 && row.version !== 3) return null;
  if (!row.raceId || !row.classId || !row.baseStats || !row.equipment) return null;
  if (!row.bags && !row.inventory) return null;
  const orders: PetOrder[] = ['follow', 'attack', 'stay', 'backoff'];
  const save: CharacterSave = {
    version: SAVE_VERSION,
    savedAt: row.savedAt ?? 0,
    zoneId: row.zoneId ?? 'hoffender',
    x: row.x ?? 0,
    y: row.y ?? 0,
    facing: row.facing ?? 's',
    raceId: row.raceId,
    classId: row.classId,
    sex: row.sex === 'female' ? 'female' : 'male',
    level: row.level ?? 1,
    xp: row.xp ?? 0,
    hp: row.hp ?? 1,
    mana: row.mana ?? 0,
    focus: row.focus ?? 0,
    copper: row.copper ?? 0,
    baseStats: { ...row.baseStats },
    bags: row.bags ? normalizeBags(row.bags) : bagsFromLegacy(row.inventory ?? []),
    equipment: { ...row.equipment },
    quests: migrateQuests(row.quests),
    nodeReady: { ...(row.nodeReady ?? {}) },
    relocated: (row.version ?? 1) < SAVE_VERSION,
    learned: [...(row.learned ?? [])],
    loadout: [...(row.loadout ?? [])].slice(0, 5),
    charts: [...(row.charts ?? [])],
    petOrder: orders.includes(row.petOrder as PetOrder) ? (row.petOrder as PetOrder) : 'follow',
    petAway: row.petAway === true,
    factions: { ...(row.factions ?? {}) },
  };
  if (save.raceId === 'barbarian' && save.classId === 'wizard') {
    save.classId = 'warrior';
    save.learned = [];
    save.loadout = ['kick', 'heavy_swing'];
    save.note = 'Barbarians cannot walk the wizard path. This hero continues as a Warrior. Wizard spells were set aside.';
  }
  return save;
}

export function applySave(state: GameState, content: ContentDb, map: MapData, raw: unknown): string | null {
  const save = migrateSave(raw);
  if (!save) return null;
  if (!content.classes[save.classId]) return null;
  const player = state.actors.find((actor) => actor.id === state.playerId);
  if (!player) return null;
  state.raceId = save.raceId;
  state.classId = save.classId;
  state.sex = save.sex;
  state.level = save.level;
  state.xp = save.xp;
  state.copper = save.copper;
  state.baseStats = { ...save.baseStats };
  state.bags = normalizeBags(save.bags);
  state.equipment = { ...save.equipment };
  state.quests = emptyQuests(content);
  for (const [id, quest] of Object.entries(save.quests)) state.quests[id] = { ...quest };
  state.nodeReady = { ...(save.nodeReady ?? {}) };
  state.learned = [...save.learned];
  state.loadout = [...save.loadout].slice(0, 5);
  state.charts = [...save.charts];
  state.petOrder = save.petOrder;
  state.petAway = save.petAway === true;
  state.factions = { ...save.factions };
  player.level = save.level;
  player.defId = save.classId;
  player.sprite = save.sex === 'female' ? 'body_f' : 'body_m';
  player.scale = raceScale(content, save.raceId);
  player.facing = save.facing;
  refreshGear(state, content);
  player.hp = Math.max(1, Math.min(player.maxHp, save.hp));
  state.mana = Math.max(0, Math.min(state.maxMana, save.mana));
  state.focus = Math.max(0, Math.min(state.focusMax, save.focus));
  const spawn = map.spawns.find((entry) => entry.kind === 'spawn');
  const fallback = spawn ? { x: spawn.x, y: spawn.y } : state.bind;
  const outOfBounds = save.x < 0 || save.y < 0 || save.x > map.width * map.tileWidth || save.y > map.height * map.tileWidth;
  const blocked = outOfBounds || bodyBlocked(map, save.x, save.y, 5, 3, false);
  const wrongZone = save.zoneId !== map.zoneId && map.zoneId !== 'test';
  if (save.relocated || blocked || wrongZone) {
    player.x = fallback.x;
    player.y = fallback.y;
  } else {
    player.x = save.x;
    player.y = save.y;
  }
  syncCompanion(state, content);
  state.sitting = false;
  if (save.note) state.log.push(save.note);
  return save.note ?? '';
}
