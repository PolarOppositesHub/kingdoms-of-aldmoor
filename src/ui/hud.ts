import type { GameApi } from '../game/api';
import { controls, pushIntent } from '../game/controls';
import { conColor, conLabel, formatCoin } from '../sim/formulas';
import { isSafe, placeName } from '../sim/map';
import type { GameState } from '../sim/types';

export function mountHud(api: GameApi): void {
  const root = document.getElementById('hud');
  const panel = document.getElementById('panel');
  const toast = document.getElementById('toast');
  if (!root || !panel || !toast) return;

  root.innerHTML = `
    <section class="vitals">
      <div class="vitals-top">
        <span id="who">Lv 1 Warrior</span>
        <span id="coin">0c</span>
      </div>
      <div id="place" class="place">Hoffender</div>
      <div class="bar hp" aria-label="Health"><span id="hp-fill"></span></div>
      <div class="vitals-top tiny"><span id="hp-num"></span><span id="weapon"></span></div>
      <div class="bar xp" aria-label="Experience"><span id="xp-fill"></span></div>
    </section>
    <section class="target-box" id="target-box">
      <div id="target-name">No target</div>
      <div class="bar hp thin"><span id="target-fill"></span></div>
    </section>
    <p id="log" aria-live="polite"></p>
    <div class="pad" id="pad" role="group" aria-label="Move">
      <span class="pad-arm up"></span>
      <span class="pad-arm down"></span>
      <span class="pad-arm left"></span>
      <span class="pad-arm right"></span>
      <span class="pad-cap"></span>
    </div>
    <div class="actions">
      <button type="button" id="atk" class="atk" aria-pressed="false">ATK</button>
      <button type="button" id="kick">Kick</button>
      <button type="button" id="next">Next</button>
      <button type="button" id="talk">Talk</button>
      <button type="button" id="pack">Pack</button>
      <button type="button" id="item">Item</button>
    </div>
    <button type="button" id="mute" class="mute" aria-label="Mute">Sound</button>
    <button type="button" id="help" class="help-btn" aria-label="Help">?</button>
    <div id="death" class="death" hidden>The cold takes you.</div>
  `;

  const pad = root.querySelector<HTMLElement>('#pad')!;
  bindPad(pad);

  root.querySelector('#atk')!.addEventListener('click', () => pushIntent({ type: 'toggleAutoAttack' }));
  root.querySelector('#kick')!.addEventListener('click', () => pushIntent({ type: 'ability', id: 'kick' }));
  root.querySelector('#next')!.addEventListener('click', () => pushIntent({ type: 'cycleTarget' }));
  root.querySelector('#talk')!.addEventListener('click', () => pushIntent({ type: 'interact' }));
  root.querySelector('#pack')!.addEventListener('click', () => pushIntent({ type: 'openPack' }));
  root.querySelector('#item')!.addEventListener('click', () => {
    const state = api.getState();
    const slot = state.inventory.findIndex((stack) => api.content.items[stack.itemId]?.kind === 'consumable');
    if (slot >= 0) pushIntent({ type: 'use', slot });
  });
  root.querySelector('#help')!.addEventListener('click', () => pushIntent({ type: 'openHelp' }));
  const mute = root.querySelector<HTMLButtonElement>('#mute')!;
  const paintMute = () => {
    mute.textContent = api.audio.muted ? 'Muted' : 'Sound';
    mute.setAttribute('aria-pressed', api.audio.muted ? 'true' : 'false');
  };
  mute.addEventListener('click', () => {
    api.audio.toggleMute();
    paintMute();
  });
  paintMute();

  panel.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest('button');
    if (!button) return;
    const action = button.dataset.action;
    if (action === 'close') pushIntent({ type: 'close' });
    else if (action === 'choice') pushIntent({ type: 'choice', index: Number(button.dataset.index) });
    else if (action === 'buy') pushIntent({ type: 'buy', itemId: button.dataset.item ?? '' });
    else if (action === 'sell') pushIntent({ type: 'sell', slot: Number(button.dataset.slot) });
    else if (action === 'use') pushIntent({ type: 'use', slot: Number(button.dataset.slot) });
    else if (action === 'equip') pushIntent({ type: 'equip', slot: Number(button.dataset.slot) });
    else if (action === 'reload') window.location.reload();
  });

  let panelKey = '';
  let hintedFight = false;
  let hintedSell = false;
  let lastLevel = 1;
  const startItems = api.getState().inventory.reduce((sum, stack) => sum + stack.qty, 0);

  const showToast = (text: string) => {
    toast.textContent = text;
    toast.hidden = false;
    window.setTimeout(() => {
      if (toast.textContent === text) toast.hidden = true;
    }, 4600);
  };
  showToast('Tap the ground to walk, or use the pad. North of the gate is the Frostmere Wilds.');

  const tick = () => {
    const state = api.getState();
    paintVitals(root, state, api);
    const key = panelSignature(state);
    if (key !== panelKey) {
      panelKey = key;
      paintPanel(panel, state, api);
    }
    if (!hintedFight && state.ui.panel === 'none' && !isSafe(api.map, getXY(state).x, getXY(state).y)) {
      hintedFight = true;
      showToast('Tap a wolf, then ATK. The button fills between swings.');
    }
    const items = state.inventory.reduce((sum, stack) => sum + stack.qty, 0);
    if (!hintedSell && items > startItems) {
      hintedSell = true;
      showToast("Pelts sell at Brenna's — the stall with the red awning.");
    }
    if (state.level > lastLevel) {
      lastLevel = state.level;
      showToast(`Level ${state.level}. You feel a little harder to kill.`);
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function getXY(state: GameState): { x: number; y: number } {
  const player = state.actors.find((actor) => actor.id === state.playerId);
  return player ?? { x: 0, y: 0 };
}

function bindPad(pad: HTMLElement): void {
  const point = (event: PointerEvent) => {
    const rect = pad.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    if (Math.hypot(dx, dy) < rect.width * 0.18) {
      controls.padX = 0;
      controls.padY = 0;
    } else {
      const ax = Math.abs(dx);
      const ay = Math.abs(dy);
      controls.padX = ax > ay * 0.5 ? Math.sign(dx) : 0;
      controls.padY = ay > ax * 0.5 ? Math.sign(dy) : 0;
    }
    pad.dataset.x = String(controls.padX);
    pad.dataset.y = String(controls.padY);
  };
  const end = (event: PointerEvent) => {
    if (pad.hasPointerCapture(event.pointerId)) pad.releasePointerCapture(event.pointerId);
    controls.padX = 0;
    controls.padY = 0;
    pad.dataset.x = '0';
    pad.dataset.y = '0';
  };
  pad.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    pad.setPointerCapture(event.pointerId);
    point(event);
  });
  pad.addEventListener('pointermove', (event) => {
    if (!pad.hasPointerCapture(event.pointerId)) return;
    point(event);
  });
  pad.addEventListener('pointerup', end);
  pad.addEventListener('pointercancel', end);
}

function paintVitals(root: HTMLElement, state: GameState, api: GameApi): void {
  const player = state.actors.find((actor) => actor.id === state.playerId);
  if (!player) return;
  const who = root.querySelector('#who');
  const place = root.querySelector('#place');
  const coin = root.querySelector('#coin');
  const hpNum = root.querySelector('#hp-num');
  const hpFill = root.querySelector<HTMLElement>('#hp-fill');
  const xpFill = root.querySelector<HTMLElement>('#xp-fill');
  const weapon = root.querySelector('#weapon');
  const log = root.querySelector('#log');
  const atk = root.querySelector<HTMLButtonElement>('#atk');
  const kick = root.querySelector<HTMLButtonElement>('#kick');
  const item = root.querySelector<HTMLButtonElement>('#item');
  const targetName = root.querySelector<HTMLElement>('#target-name');
  const targetFill = root.querySelector<HTMLElement>('#target-fill');
  const death = root.querySelector<HTMLElement>('#death');
  if (!who || !place || !coin || !hpNum || !hpFill || !xpFill || !weapon || !log || !atk || !kick || !item || !targetName || !targetFill || !death) return;

  who.textContent = `Lv ${state.level} Warrior`;
  place.textContent = placeName(api.map, player.x, player.y);
  coin.textContent = formatCoin(state.copper, api.content.economy);
  hpNum.textContent = `${Math.max(0, player.hp)}/${player.maxHp}`;
  hpFill.style.width = `${Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100))}%`;
  const need = api.content.tuning.xpTable[state.level] ?? api.content.tuning.xpTable.at(-1) ?? 1;
  xpFill.style.width = `${Math.max(0, Math.min(100, (state.xp / need) * 100))}%`;
  weapon.textContent = api.content.items[state.equipment.primary]?.name ?? '';
  log.textContent = state.log[state.log.length - 1] ?? '';

  const delay = api.content.items[state.equipment.primary]?.delayMs ?? 2600;
  const ready = delay <= 0 ? 1 : 1 - Math.max(0, player.attackMs) / delay;
  atk.style.setProperty('--p', String(Math.round(ready * 100)));
  atk.setAttribute('aria-pressed', state.autoAttack ? 'true' : 'false');
  atk.textContent = state.autoAttack ? 'ATK' : 'ATK';

  const kickCd = state.cooldowns.kick ?? 0;
  kick.textContent = kickCd > 0 ? `Kick ${Math.ceil(kickCd / 1000)}` : 'Kick';
  kick.disabled = kickCd > 0;

  const slot = state.inventory.findIndex((stack) => api.content.items[stack.itemId]?.kind === 'consumable');
  if (slot < 0) {
    item.textContent = 'No food';
    item.disabled = true;
  } else {
    const stack = state.inventory[slot];
    item.disabled = false;
    item.textContent = `${api.content.items[stack.itemId].name} ×${stack.qty}`;
  }

  const target = state.actors.find((actor) => actor.id === state.targetId && actor.alive);
  if (!target || target.kind === 'player') {
    targetName.textContent = 'No target';
    targetName.style.color = '#cbbba8';
    targetFill.style.width = '0%';
  } else if (target.kind === 'mob') {
    const color = conColor(state.level, target.level);
    targetName.textContent = `${target.name}  Lv ${target.level}  ${conLabel(color)}`;
    targetName.style.color = conHex(color);
    targetFill.style.width = `${Math.max(0, (target.hp / target.maxHp) * 100)}%`;
  } else {
    const npc = api.content.npcs[target.defId];
    targetName.textContent = npc ? `${npc.name}, ${npc.title}` : target.name;
    targetName.style.color = '#f3eee4';
    targetFill.style.width = '0%';
  }

  death.hidden = !state.dead;
}

function conHex(color: string): string {
  switch (color) {
    case 'gray':
      return '#9aa3ad';
    case 'green':
      return '#6dba74';
    case 'lightblue':
      return '#7ec8e3';
    case 'blue':
      return '#6ea0e0';
    case 'yellow':
      return '#e6c15a';
    case 'red':
      return '#e15d4c';
    default:
      return '#f4f0e6';
  }
}

function panelSignature(state: GameState): string {
  const bag = state.inventory.map((stack) => `${stack.itemId}:${stack.qty}`).join(',');
  return `${state.ui.panel}|${state.ui.nodeId}|${state.copper}|${state.equipment.primary}|${bag}|${state.dead ? 1 : 0}`;
}

function paintPanel(panel: HTMLElement, state: GameState, api: GameApi): void {
  if (state.ui.panel === 'none') {
    panel.hidden = true;
    panel.innerHTML = '';
    return;
  }
  panel.hidden = false;
  if (state.ui.panel === 'dialogue') panel.innerHTML = dialogueHtml(state, api);
  else if (state.ui.panel === 'merchant') panel.innerHTML = merchantHtml(state, api);
  else if (state.ui.panel === 'pack') panel.innerHTML = packHtml(state, api, false);
  else panel.innerHTML = helpHtml();
}

function dialogueHtml(state: GameState, api: GameApi): string {
  const npc = state.actors.find((actor) => actor.id === state.ui.npcId);
  const def = npc ? api.content.npcs[npc.defId] : undefined;
  const node = def && state.ui.nodeId ? api.content.dialogue[def.dialogue]?.[state.ui.nodeId] : undefined;
  if (!def || !node) return `<div class="sheet"><button type="button" data-action="close">Close</button></div>`;
  const choices = node.choices
    .map((choice, index) => `<button type="button" data-action="choice" data-index="${index}">${escapeHtml(choice.label)}</button>`)
    .join('');
  return `<div class="sheet">
    <header><h2>${escapeHtml(def.name)}</h2><p>${escapeHtml(def.title)}</p></header>
    <p class="speech">${escapeHtml(node.text)}</p>
    <div class="choice-list">${choices}</div>
  </div>`;
}

function merchantHtml(state: GameState, api: GameApi): string {
  const stock = api.content.merchant.stock
    .map((row) => {
      const item = api.content.items[row.itemId];
      if (!item) return '';
      return `<li><span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.blurb)}</small></span>
        <button type="button" data-action="buy" data-item="${item.id}">${formatCoin(row.price, api.content.economy)}</button></li>`;
    })
    .join('');
  return `<div class="sheet">
    <header><h2>Brenna's Goods</h2><p>Your coin: ${formatCoin(state.copper, api.content.economy)}</p></header>
    <h3>For sale</h3>
    <ul class="trade">${stock}</ul>
    <h3>Your pack</h3>
    ${bagRows(state, api, true)}
    <button type="button" class="close" data-action="close">Close</button>
  </div>`;
}

function packHtml(state: GameState, api: GameApi, selling: boolean): string {
  return `<div class="sheet">
    <header><h2>Pack</h2><p>${escapeHtml(api.content.items[state.equipment.primary]?.name ?? '')} · ${formatCoin(state.copper, api.content.economy)}</p></header>
    ${bagRows(state, api, selling)}
    <button type="button" class="close" data-action="close">Close</button>
  </div>`;
}

function bagRows(state: GameState, api: GameApi, selling: boolean): string {
  if (!state.inventory.length) return `<p class="empty">Nothing in the pack.</p>`;
  const rows = state.inventory
    .map((stack, index) => {
      const item = api.content.items[stack.itemId];
      if (!item) return '';
      const buttons = [
        item.kind === 'consumable' ? `<button type="button" data-action="use" data-slot="${index}">Use</button>` : '',
        item.kind === 'weapon' ? `<button type="button" data-action="equip" data-slot="${index}">Equip</button>` : '',
        selling ? `<button type="button" data-action="sell" data-slot="${index}">Sell ${formatCoin(item.value, api.content.economy)}</button>` : '',
      ].join('');
      return `<li><span><strong>${escapeHtml(item.name)} ×${stack.qty}</strong><small>${escapeHtml(item.blurb)}</small></span><span class="row-actions">${buttons}</span></li>`;
    })
    .join('');
  return `<ul class="trade">${rows}</ul>`;
}

function helpHtml(): string {
  return `<div class="sheet">
    <header><h2>How to move through Hoffender</h2></header>
    <ul class="help-list">
      <li>Pad, or tap the ground, walks. WASD works on a keyboard.</li>
      <li>Tap a wolf to mark it, then ATK. Swings land on their own timer.</li>
      <li>Kick is immediate, then it needs a breath.</li>
      <li>Tap a person, or Talk, to speak. Jarl Freya stands outside the mead hall. Brenna buys and sells.</li>
      <li>Inside the palisade is Hoffender. North of the gate is the Frostmere Wilds. Fall out there and you wake in Hilda's yard.</li>
    </ul>
    <button type="button" data-action="reload">Start a new warrior</button>
    <button type="button" class="close" data-action="close">Close</button>
  </div>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
