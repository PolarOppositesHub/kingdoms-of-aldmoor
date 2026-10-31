import type { ContentDb, Equipment, GameState, ItemStack, MapData } from './types';
import { refreshGear, syncCompanion } from './state';
import { bodyBlocked } from './map';

export const SAVE_VERSION = 1;

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
  inventory: ItemStack[];
  equipment: Equipment;
  quests: GameState['quests'];
  learned: string[];
  loadout: string[];
  factions: Record<string, number>;
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
    inventory: state.inventory.map((stack) => ({ ...stack })),
    equipment: { ...state.equipment },
    quests: { wolf_pelts: { ...state.quests.wolf_pelts } },
    learned: [...state.learned],
    loadout: [...state.loadout],
    factions: { ...state.factions },
  };
}

/** Barbarian wizards become warriors. Wizard spells are dropped. Gear and progress stay. */
export function migrateSave(raw: unknown): CharacterSave | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Partial<CharacterSave>;
  if (row.version !== 1 && row.version !== undefined && row.version !== 1) return null;
  if (!row.raceId || !row.classId || !row.baseStats || !row.equipment || !row.inventory) return null;
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
    inventory: row.inventory.map((stack) => ({ ...stack })),
    equipment: { ...row.equipment },
    quests: { wolf_pelts: { stage: row.quests?.wolf_pelts?.stage ?? 'none', progress: row.quests?.wolf_pelts?.progress ?? 0 } },
    learned: [...(row.learned ?? [])],
    loadout: [...(row.loadout ?? [])],
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
  state.inventory = save.inventory.map((stack) => ({ ...stack }));
  state.equipment = { ...save.equipment };
  state.quests = { wolf_pelts: { ...save.quests.wolf_pelts } };
  state.learned = [...save.learned];
  state.loadout = [...save.loadout];
  state.factions = { ...save.factions };
  player.level = save.level;
  player.defId = save.classId;
  player.sprite = save.sex === 'female' ? 'body_f' : 'body_m';
  player.facing = save.facing;
  refreshGear(state, content);
  player.hp = Math.max(1, Math.min(player.maxHp, save.hp));
  state.mana = Math.max(0, Math.min(state.maxMana, save.mana));
  state.focus = Math.max(0, Math.min(state.focusMax, save.focus));
  const blocked = bodyBlocked(map, save.x, save.y, 5, 3, false);
  player.x = blocked ? state.bind.x : save.x;
  player.y = blocked ? state.bind.y : save.y;
  syncCompanion(state, content);
  if (save.note) state.log.push(save.note);
  return save.note ?? '';
}
