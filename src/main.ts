import './style.css';
import { createGame } from './game/createGame';
import { controls } from './game/controls';
import { onGameReady } from './game/WorldScene';
import { mountCreate } from './ui/create';
import { mountHud } from './ui/hud';

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
    const abilities = apiRef ? apiRef.content.classes[apiRef.getState().classId]?.abilities ?? [] : [];
    const id = abilities[Number(key) - 1];
    if (id) controls.queue.push({ type: 'ability', id });
  }
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
onGameReady((api) => {
  apiRef = api;
  mountHud(api);
  const creator = mountCreate(api);
  enter.disabled = false;
  enter.addEventListener('click', () => {
    if (started) return;
    started = true;
    const hero = creator.read();
    creator.save();
    api.push({ type: 'createHero', raceId: hero.raceId, classId: hero.classId, bonus: hero.bonus });
    api.audio.unlock();
    api.audio.play('ui');
    api.setRunning(true);
    gate.hidden = true;
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
