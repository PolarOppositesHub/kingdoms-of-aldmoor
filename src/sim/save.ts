import { LOADOUT_CAP, type ContentDb, type Equipment, type GameState, type HeldBag, type ItemStack, type MapData, type PetOrder } from './types';
import { emptyQuests, refreshGear, syncCompanion } from './state';
import { bodySprite, raceScale } from './appearance';
import { bagsFromLegacy, normalizeBags } from './bags';
import { bodyBlocked, nearestStand } from './map';

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
  /** Absent on saves from before slotted hotbars. Those heroes get their known spells. */
  loadout?: string[];
  charts: string[];
  petOrder: PetOrder;
  /** Absent on saves from before the pet window. Those heroes still have their wolf. */
  petAway?: boolean;
  factions: Record<string, number>;
  nodeReady?: Record<string, number>;
  /** Set when an older map layout cannot be trusted. Not written back out. */
  relocated?: boolean;
  note?: string;
  /** Absent on saves from before Hearthpass. Those heroes still wake in Hoffender. */
  bindZone?: string;
  bindX?: number;
  bindY?: number;
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
    bindZone: state.bindZone,
    bindX: state.bind.x,
    bindY: state.bind.y,
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
    loadout: Array.isArray(row.loadout) ? row.loadout.filter((id): id is string => typeof id === 'string').slice(0, LOADOUT_CAP) : undefined,
    charts: [...(row.charts ?? [])],
    petOrder: orders.includes(row.petOrder as PetOrder) ? (row.petOrder as PetOrder) : 'follow',
    petAway: row.petAway === true,
    factions: { ...(row.factions ?? {}) },
    bindZone: typeof row.bindZone === 'string' ? row.bindZone : undefined,
    bindX: typeof row.bindX === 'number' ? row.bindX : undefined,
    bindY: typeof row.bindY === 'number' ? row.bindY : undefined,
  };
  if (save.raceId === 'barbarian' && save.classId === 'wizard') {
    save.classId = 'warrior';
    save.learned = [];
    save.loadout = ['kick', 'heavy_swing'];
    save.note = 'Barbarians cannot walk the wizard path. This hero continues as a Warrior. Wizard spells were set aside.';
  }
  const elfOnly = ['wizard', 'cleric', 'enchanter', 'paladin', 'magician'];
  if (save.raceId === 'high_elf' && !elfOnly.includes(save.classId)) {
    save.classId = 'wizard';
    save.learned = [];
    save.loadout = ['shardbolt', 'rimefield'];
    save.petAway = false;
    for (const slot of ['head', 'chest', 'hands', 'legs', 'feet', 'secondary'] as const) {
      const worn = save.equipment[slot];
      if (!worn) continue;
      save.equipment[slot] = null;
    }
    save.note = 'High elves do not walk that path. This hero continues as a Wizard. The other drills, and armor that was not a wizard\'s, were set aside.';
  }
  return save;
}

/** Keep a saved bar. A save with no loadout field is filled from spells the hero already knows. */
export function normalizeLoadout(raw: string[] | undefined, content: ContentDb, classId: string, learned: string[]): string[] {
  const starters = content.classes[classId]?.abilities ?? [];
  const extras = learned.filter((id) => content.abilities[id] && !starters.includes(id));
  const source = raw ?? [...starters, ...extras].slice(0, LOADOUT_CAP);
  const slots: string[] = [];
  const seen = new Set<string>();
  for (const id of source.slice(0, LOADOUT_CAP)) {
    if (!id || !content.abilities[id] || seen.has(id)) {
      slots.push('');
      continue;
    }
    seen.add(id);
    slots.push(id);
  }
  while (slots.length < LOADOUT_CAP) slots.push('');
  return slots;
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
  state.loadout = normalizeLoadout(save.loadout, content, save.classId, save.learned);
  state.charts = [...save.charts];
  state.petOrder = save.petOrder;
  state.petAway = save.petAway === true;
  state.factions = { ...save.factions };
  if (save.bindZone && typeof save.bindX === 'number' && typeof save.bindY === 'number') {
    state.bindZone = save.bindZone;
    state.bind = { x: save.bindX, y: save.bindY };
  }
  player.level = save.level;
  player.defId = save.classId;
  player.sprite = bodySprite(save.raceId, save.sex === 'female' ? 'female' : 'male');
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
  if (save.relocated || wrongZone) {
    player.x = fallback.x;
    player.y = fallback.y;
  } else if (blocked) {
    const near = nearestStand(map, save.x, save.y);
    player.x = near?.x ?? fallback.x;
    player.y = near?.y ?? fallback.y;
  } else {
    player.x = save.x;
    player.y = save.y;
  }
  syncCompanion(state, content);
  state.sitting = false;
  if (save.note) state.log.push(save.note);
  return save.note ?? '';
}
