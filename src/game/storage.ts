import { applySave, captureSave, migrateSave, type CharacterSave } from '../sim/save';
import type { ContentDb, GameState, MapData } from '../sim/types';

const KEY = 'aldmoor-save';

export function readSave(): CharacterSave | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return migrateSave(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeSave(state: GameState): void {
  try {
    const save = captureSave(state, Date.now());
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    /* private mode or a full disk */
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* private mode */
  }
}

export function restoreSave(state: GameState, content: ContentDb, map: MapData, save: CharacterSave): string | null {
  return applySave(state, content, map, save);
}

export function requestPersistentStorage(): void {
  const storage = navigator.storage;
  if (!storage?.persist) return;
  void storage.persist();
}
