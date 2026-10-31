import './style.css';
import { createGame } from './game/createGame';
import { controls } from './game/controls';
import { onGameReady } from './game/WorldScene';
import { mountCreate } from './ui/create';
import { mountHud } from './ui/hud';
import { clearSave, readSave, requestPersistentStorage, restoreSave, writeSave } from './game/storage';

const app = document.querySelector<HTMLElement>('#app');
const mapSlot = document.querySelector<HTMLElement>('#map-slot');
const gate = document.querySelector<HTMLElement>('#gate');
const enter = document.querySelector<HTMLButtonElement>('#enter');
if (!app || !mapSlot || !gate || !enter) throw new Error('missing shell');

function applyLayout(): void {
  const wide = window.innerWidth / window.innerHeight > 0.92;
  app!.dataset.layout = wide ? 'wide' : 'portrait';
  const side = wide ? Math.max(156, Math.min(220, Math.round(window.innerWidth * 0.24))) : 0;
  document.documentElement.style.setProperty('--side', `${side}px`);
}

applyLayout();
window.addEventListener('resize', applyLayout);
window.visualViewport?.addEventListener('resize', applyLayout);

const held = new Set<string>();
function syncKeys(): void {
  const down = (key: string) => held.has(key);
  controls.keyX = (down('d') || down('arrowright') ? 1 : 0) - (down('a') || down('arrowleft') ? 1 : 0);
  controls.keyY = (down('s') || down('arrowdown') ? 1 : 0) - (down('w') || down('arrowup') ? 1 : 0);
}

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
    held.add(key);
    syncKeys();
    return;
  }
  if (event.repeat) return;
  if (key === 'f') controls.queue.push({ type: 'toggleAutoAttack' });
  else if (key === 'e') controls.queue.push({ type: 'interact' });
  else if (key === '1' || key === '2') {
    const id = apiRef ? apiRef.getState().loadout[Number(key) - 1] : undefined;
    if (id) controls.queue.push({ type: 'ability', id });
  }
  else if (key === 'b') controls.queue.push({ type: 'openBook' });
  else if (key === 'i') controls.queue.push({ type: 'openPack' });
  else if (key === 'tab') {
    event.preventDefault();
    controls.queue.push({ type: 'cycleTarget' });
  } else if (key === 'escape') controls.queue.push({ type: 'close' });
});
window.addEventListener('keyup', (event) => {
  held.delete(event.key.toLowerCase());
  syncKeys();
});
window.addEventListener('blur', () => {
  held.clear();
  controls.padX = 0;
  controls.padY = 0;
  controls.keyX = 0;
  controls.keyY = 0;
});

let started = false;
let apiRef: import('./game/api').GameApi | null = null;
requestPersistentStorage();
onGameReady((api) => {
  apiRef = api;
  mountHud(api);
  const creator = mountCreate(api);
  const form = document.getElementById('create-form');
  const saveRow = document.getElementById('save-row');
  const summary = document.getElementById('save-summary');
  const confirmNew = document.getElementById('confirm-new');
  const existing = readSave();
  if (existing && saveRow && form && summary) {
    saveRow.hidden = false;
    form.hidden = true;
    const cls = api.content.classes[existing.classId]?.name ?? existing.classId;
    summary.textContent = `Saved ${cls}, level ${existing.level}. ${existing.note ?? ''}`.trim();
  }
  const begin = () => {
    if (started) return;
    started = true;
    const hero = creator.read();
    creator.save();
    clearSave();
    api.push({ type: 'createHero', raceId: hero.raceId, classId: hero.classId, bonus: hero.bonus, sex: hero.sex });
    api.audio.unlock();
    api.audio.play('ui');
    api.setRunning(true);
    gate.hidden = true;
    window.setTimeout(() => writeSave(api.getState()), 400);
  };
  enter.disabled = false;
  enter.addEventListener('click', begin);
  document.getElementById('continue-btn')?.addEventListener('click', () => {
    if (started) return;
    const save = readSave();
    if (!save) return;
    started = true;
    const note = restoreSave(api.getState(), api.content, api.map, save);
    api.audio.unlock();
    api.setRunning(true);
    gate.hidden = true;
    if (note) {
      const toast = document.getElementById('toast');
      if (toast) {
        toast.textContent = note;
        toast.hidden = false;
      }
    }
    writeSave(api.getState());
  });
  document.getElementById('new-char')?.addEventListener('click', () => {
    if (confirmNew) confirmNew.hidden = false;
  });
  document.getElementById('confirm-new-no')?.addEventListener('click', () => {
    if (confirmNew) confirmNew.hidden = true;
  });
  document.getElementById('confirm-new-yes')?.addEventListener('click', () => {
    clearSave();
    if (confirmNew) confirmNew.hidden = true;
    if (saveRow) saveRow.hidden = true;
    if (form) form.hidden = false;
  });
  let savedAt = 0;
  const autosave = () => {
    if (!started || !apiRef) return;
    const now = Date.now();
    if (now - savedAt < 8000) return;
    savedAt = now;
    writeSave(apiRef.getState());
  };
  window.setInterval(autosave, 8000);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && started && apiRef) writeSave(apiRef.getState());
  });
  window.addEventListener('pagehide', () => {
    if (started && apiRef) writeSave(apiRef.getState());
  });
});

enter.disabled = true;
const game = createGame(mapSlot);
window.addEventListener('resize', () => game.scale.refresh());

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => undefined);
  });
}
