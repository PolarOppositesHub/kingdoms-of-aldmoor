import type { GameApi } from '../game/api';
import { controls, pushIntent } from '../game/controls';
import { conColor, conLabel, formatCoin } from '../sim/formulas';
import { isSafe, placeName } from '../sim/map';
import { EQUIP_SLOTS, type EquipSlot, type GameState, type ItemDef } from '../sim/types';
import iconsUrl from '../assets/icons.png?url';
import iconMeta from '../assets/icons.json';
import actorsUrl from '../assets/actors.png?url';
import atlas from '../assets/atlas.json';

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
      <div class="mana-line" id="mana-line" hidden>
        <div class="bar mana" aria-label="Mana"><span id="mana-fill"></span></div>
        <span id="mana-num"></span>
      </div>
      <div class="vitals-top tiny"><span id="hp-num"></span><span id="weapon"></span></div>
      <div class="bar xp" aria-label="Experience"><span id="xp-fill"></span></div>
    </section>
    <section class="target-box" id="target-box">
      <div id="target-name">No target</div>
      <div class="bar hp thin"><span id="target-fill"></span></div>
    </section>
    <p id="log" aria-live="polite"></p>
    <div class="pad" id="pad" data-scheme="stick" role="group" aria-label="Move">
      <span class="pad-arm up"></span>
      <span class="pad-arm down"></span>
      <span class="pad-arm left"></span>
      <span class="pad-arm right"></span>
      <span class="pad-cap"></span>
      <button type="button" class="dir up" data-dir="n" aria-label="Up">▲</button>
      <button type="button" class="dir left" data-dir="w" aria-label="Left">◀</button>
      <button type="button" class="dir right" data-dir="e" aria-label="Right">▶</button>
      <button type="button" class="dir down" data-dir="s" aria-label="Down">▼</button>
    </div>
    <div class="actions" data-spells="1">
      <button type="button" id="atk" class="atk" aria-pressed="false">ATK</button>
      <button type="button" id="spell-a">Kick</button>
      <button type="button" id="spell-b" hidden>Spell</button>
      <button type="button" id="next">Next</button>
      <button type="button" id="talk">Look</button>
      <button type="button" id="pack">Inv</button>
      <button type="button" id="quest">Quest</button>
      <button type="button" id="item">Item</button>
    </div>
    <button type="button" id="mute" class="mute" aria-label="Mute">Sound</button>
    <button type="button" id="scheme" class="help-btn scheme-btn" aria-label="Movement scheme">Pad</button>
    <button type="button" id="help" class="help-btn" aria-label="Help">?</button>
    <div id="death" class="death" hidden>The cold takes you.</div>
  `;

  const pad = root.querySelector<HTMLElement>('#pad')!;
  bindPad(pad);
  bindDpad(pad);
  const scheme = root.querySelector<HTMLButtonElement>('#scheme')!;
  const applyScheme = (next: 'stick' | 'dpad') => {
    pad.dataset.scheme = next;
    controls.padX = 0;
    controls.padY = 0;
    scheme.textContent = next === 'dpad' ? 'D-pad' : 'Stick';
    try {
      localStorage.setItem('aldmoor-move', next);
    } catch {
      /* private mode */
    }
  };
  let stored: 'stick' | 'dpad' = 'stick';
  try {
    stored = localStorage.getItem('aldmoor-move') === 'dpad' ? 'dpad' : 'stick';
  } catch {
    stored = 'stick';
  }
  applyScheme(stored);
  scheme.addEventListener('click', () => applyScheme(pad.dataset.scheme === 'dpad' ? 'stick' : 'dpad'));

  const cast = (slot: 'a' | 'b') => {
    const button = root.querySelector<HTMLButtonElement>(slot === 'a' ? '#spell-a' : '#spell-b');
    const id = button?.dataset.ability;
    if (id) pushIntent({ type: 'ability', id });
  };
  root.querySelector('#atk')!.addEventListener('click', () => pushIntent({ type: 'toggleAutoAttack' }));
  root.querySelector('#spell-a')!.addEventListener('click', () => cast('a'));
  root.querySelector('#spell-b')!.addEventListener('click', () => cast('b'));
  root.querySelector('#next')!.addEventListener('click', () => pushIntent({ type: 'cycleTarget' }));
  root.querySelector('#talk')!.addEventListener('click', () => pushIntent({ type: 'interact' }));
  root.querySelector('#pack')!.addEventListener('click', () => {
    detail = null;
    pushIntent({ type: 'openPack' });
  });
  root.querySelector('#quest')!.addEventListener('click', () => {
    abandonArmed = false;
    pushIntent({ type: 'openJournal' });
  });
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

  let detail: { itemId: string } | { emptySlot: EquipSlot } | null = null;
  let abandonArmed = false;

  panel.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest('button');
    if (!button) return;
    const action = button.dataset.action;
    if (action === 'close') {
      detail = null;
      abandonArmed = false;
      pushIntent({ type: 'close' });
    } else if (action === 'choice') pushIntent({ type: 'choice', index: Number(button.dataset.index) });
    else if (action === 'buy') pushIntent({ type: 'buy', itemId: button.dataset.item ?? '' });
    else if (action === 'sell') pushIntent({ type: 'sell', slot: Number(button.dataset.slot) });
    else if (action === 'use') pushIntent({ type: 'use', slot: Number(button.dataset.slot) });
    else if (action === 'equip') pushIntent({ type: 'equip', slot: Number(button.dataset.slot) });
    else if (action === 'unequip') pushIntent({ type: 'unequip', slot: (button.dataset.equipSlot ?? 'head') as EquipSlot });
    else if (action === 'focus-item') detail = { itemId: button.dataset.item ?? '' };
    else if (action === 'focus-slot') {
      const worn = button.dataset.item;
      detail = worn ? { itemId: worn } : { emptySlot: (button.dataset.equipSlot ?? 'head') as EquipSlot };
    } else if (action === 'abandon-ask') abandonArmed = true;
    else if (action === 'abandon-no') abandonArmed = false;
    else if (action === 'abandon-yes') {
      abandonArmed = false;
      pushIntent({ type: 'abandonQuest', id: button.dataset.quest ?? '' });
    } else if (action === 'reload') window.location.reload();
    panelKey = '';
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
    const key = `${panelSignature(state)}|${detail && 'itemId' in detail ? detail.itemId : ''}|${detail && 'emptySlot' in detail ? detail.emptySlot : ''}|${abandonArmed ? 1 : 0}`;
    if (key !== panelKey) {
      panelKey = key;
      paintPanel(panel, state, api, detail, abandonArmed);
    }
    if (!hintedFight && state.ui.panel === 'none' && !isSafe(api.map, getXY(state).x, getXY(state).y)) {
      hintedFight = true;
      if (state.maxMana > 0) showToast('Tap a wolf, then Shard. Rime slows a pack. The blue bar is mana.');
      else showToast('Tap a wolf, then ATK. The button fills between swings.');
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

function paintSpell(button: HTMLButtonElement, id: string | undefined, state: GameState, api: GameApi): void {
  if (!id) return;
  const ability = api.content.abilities[id];
  if (!ability) return;
  button.dataset.ability = id;
  const cd = state.cooldowns[id] ?? 0;
  const cost = ability.mana ?? 0;
  const short = ability.short ?? ability.name;
  button.disabled = cd > 0 || (cost > 0 && state.mana < cost);
  button.textContent = cd > 0 ? `${short} ${Math.ceil(cd / 1000)}` : cost > 0 ? `${short} ${cost}` : short;
  button.setAttribute('aria-label', cost > 0 ? `${ability.name}, ${cost} mana` : ability.name);
}

function bindDpad(pad: HTMLElement): void {
  const held = new Set<string>();
  const sync = () => {
    if (pad.dataset.scheme !== 'dpad') {
      held.clear();
      return;
    }
    let x = 0;
    let y = 0;
    if (held.has('e')) x += 1;
    if (held.has('w')) x -= 1;
    if (held.has('s')) y += 1;
    if (held.has('n')) y -= 1;
    controls.padX = Math.max(-1, Math.min(1, x));
    controls.padY = Math.max(-1, Math.min(1, y));
    pad.dataset.x = String(controls.padX);
    pad.dataset.y = String(controls.padY);
  };
  for (const button of pad.querySelectorAll<HTMLButtonElement>('.dir')) {
    const dir = button.dataset.dir ?? '';
    const down = (event: PointerEvent) => {
      event.preventDefault();
      event.stopPropagation();
      button.setPointerCapture(event.pointerId);
      held.add(dir);
      sync();
    };
    const up = (event: PointerEvent) => {
      held.delete(dir);
      sync();
    };
    button.addEventListener('pointerdown', down);
    button.addEventListener('pointerup', up);
    button.addEventListener('pointercancel', up);
  }
}

function bindPad(pad: HTMLElement): void {
  const point = (event: PointerEvent) => {
    if (pad.dataset.scheme === 'dpad') return;
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
  const spellA = root.querySelector<HTMLButtonElement>('#spell-a');
  const spellB = root.querySelector<HTMLButtonElement>('#spell-b');
  const actions = root.querySelector<HTMLElement>('.actions');
  const manaLine = root.querySelector<HTMLElement>('#mana-line');
  const manaFill = root.querySelector<HTMLElement>('#mana-fill');
  const manaNum = root.querySelector('#mana-num');
  const item = root.querySelector<HTMLButtonElement>('#item');
  const targetName = root.querySelector<HTMLElement>('#target-name');
  const targetFill = root.querySelector<HTMLElement>('#target-fill');
  const death = root.querySelector<HTMLElement>('#death');
  if (!who || !place || !coin || !hpNum || !hpFill || !xpFill || !weapon || !log || !atk || !spellA || !spellB || !actions || !item || !targetName || !targetFill || !death) return;

  const className = api.content.classes[state.classId]?.name ?? 'Warrior';
  who.textContent = `Lv ${state.level} ${className}`;
  place.textContent = placeName(api.map, player.x, player.y);
  coin.textContent = formatCoin(state.copper, api.content.economy);
  hpNum.textContent = `${Math.max(0, player.hp)}/${player.maxHp}`;
  hpFill.style.width = `${Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100))}%`;
  if (manaLine && manaFill && manaNum) {
    const showMana = state.maxMana > 0;
    manaLine.hidden = !showMana;
    if (showMana) {
      manaFill.style.width = `${Math.max(0, Math.min(100, (state.mana / state.maxMana) * 100))}%`;
      manaNum.textContent = `${Math.max(0, state.mana)}/${state.maxMana}`;
    }
  }
  const need = api.content.tuning.xpTable[state.level] ?? api.content.tuning.xpTable.at(-1) ?? 1;
  xpFill.style.width = `${Math.max(0, Math.min(100, (state.xp / need) * 100))}%`;
  weapon.textContent = (state.equipment.primary && api.content.items[state.equipment.primary]?.name) || '';
  log.textContent = state.log[state.log.length - 1] ?? '';

  const delay = (state.equipment.primary && api.content.items[state.equipment.primary]?.delayMs) || 2600;
  const ready = delay <= 0 ? 1 : 1 - Math.max(0, player.attackMs) / delay;
  atk.style.setProperty('--p', String(Math.round(ready * 100)));
  atk.setAttribute('aria-pressed', state.autoAttack ? 'true' : 'false');
  atk.textContent = state.autoAttack ? 'ATK' : 'ATK';

  const known = api.content.classes[state.classId]?.abilities ?? [];
  paintSpell(spellA, known[0], state, api);
  paintSpell(spellB, known[1], state, api);
  actions.dataset.spells = known.length > 1 ? '2' : '1';
  spellB.hidden = known.length < 2;

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
  const worn = EQUIP_SLOTS.map((slot) => state.equipment[slot] ?? '').join(',');
  const quest = `${state.quests.wolf_pelts.stage}:${state.quests.wolf_pelts.progress}`;
  return `${state.ui.panel}|${state.ui.nodeId}|${state.ui.title}|${state.copper}|${worn}|${bag}|${quest}|${state.dead ? 1 : 0}`;
}

function paintPanel(
  panel: HTMLElement,
  state: GameState,
  api: GameApi,
  focus: { itemId: string } | { emptySlot: EquipSlot } | null,
  confirmAbandon: boolean,
): void {
  if (state.ui.panel === 'none') {
    panel.hidden = true;
    panel.innerHTML = '';
    delete panel.dataset.kind;
    return;
  }
  panel.hidden = false;
  panel.dataset.kind = state.ui.panel === 'pack' ? 'paper' : '';
  if (state.ui.panel === 'dialogue') panel.innerHTML = dialogueHtml(state, api);
  else if (state.ui.panel === 'merchant') panel.innerHTML = merchantHtml(state, api);
  else if (state.ui.panel === 'pack') panel.innerHTML = inventoryHtml(state, api, focus);
  else if (state.ui.panel === 'journal') panel.innerHTML = journalHtml(state, api, confirmAbandon);
  else if (state.ui.panel === 'inspect') panel.innerHTML = inspectHtml(state);
  else panel.innerHTML = helpHtml(state, api);
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

const SLOT_LABEL: Record<EquipSlot, string> = {
  head: 'Head',
  chest: 'Chest',
  hands: 'Hands',
  legs: 'Legs',
  feet: 'Feet',
  primary: 'Primary',
  secondary: 'Secondary',
};

function iconHtml(itemId: string, className = 'icon'): string {
  const frame = iconMeta.frames[itemId as keyof typeof iconMeta.frames];
  if (!frame) return `<span class="${className} icon-missing"></span>`;
  const scale = 2;
  const style = `background-image:url(${iconsUrl});background-position:-${frame.x * scale}px -${frame.y * scale}px;background-size:${iconMeta.sheetW * scale}px ${iconMeta.sheetH * scale}px;`;
  return `<span class="${className}" style="${style}"></span>`;
}

const DOLL_SCALE = 6;
const ACTOR_COLS = atlas.actors.dirs.length * atlas.actors.framesPerDir;

function actorLayerStyle(rowName: string): string {
  const row = atlas.actors.rows[rowName as keyof typeof atlas.actors.rows] ?? 0;
  const frameW = atlas.actors.frameW * DOLL_SCALE;
  const frameH = atlas.actors.frameH * DOLL_SCALE;
  const sheetW = ACTOR_COLS * frameW;
  const sheetH = Object.keys(atlas.actors.rows).length * frameH;
  const frameY = row * frameH;
  return `--frame-y:-${frameY}px;--step:${frameW}px;width:${frameW}px;height:${frameH}px;background-image:url(${actorsUrl});background-size:${sheetW}px ${sheetH}px;`;
}

function dollFigure(state: GameState): string {
  const player = state.actors.find((actor) => actor.id === state.playerId);
  const body = player?.sprite && player.sprite in atlas.actors.rows ? player.sprite : 'warrior';
  const layers = EQUIP_SLOTS.map((slot) => state.equipment[slot])
    .filter((id): id is string => Boolean(id && id in atlas.actors.rows))
    .map((id) => `<span class="doll-layer" style="${actorLayerStyle(id)}"></span>`)
    .join('');
  return `<div class="doll-stage">
    <span class="doll-shadow"></span>
    <span class="doll-layer doll-body" style="${actorLayerStyle(body)}"></span>
    ${layers}
  </div>`;
}

function slotButton(
  state: GameState,
  api: GameApi,
  slot: EquipSlot,
  focus: { itemId: string } | { emptySlot: EquipSlot } | null,
): string {
  const id = state.equipment[slot];
  const item = id ? api.content.items[id] : undefined;
  const selected =
    (focus && 'itemId' in focus && Boolean(id) && focus.itemId === id) ||
    (focus && 'emptySlot' in focus && !id && focus.emptySlot === slot);
  return `<button type="button" class="slot-frame slot-${slot}${selected ? ' is-on' : ''}" data-action="focus-slot" data-equip-slot="${slot}" data-item="${id ?? ''}" aria-pressed="${selected ? 'true' : 'false'}" aria-label="${SLOT_LABEL[slot]}${item ? `, ${item.name}` : ', empty'}">
    <span class="slot-art">${item ? iconHtml(item.id) : ''}</span>
    <small>${SLOT_LABEL[slot]}</small>
  </button>`;
}

function inventoryHtml(state: GameState, api: GameApi, focus: { itemId: string } | { emptySlot: EquipSlot } | null): string {
  const cells = state.inventory
    .map((stack, index) => {
      const item = api.content.items[stack.itemId];
      if (!item) return '';
      const selected = focus && 'itemId' in focus && focus.itemId === item.id;
      return `<button type="button" class="slot-frame bag-cell${selected ? ' is-on' : ''}" data-action="focus-item" data-item="${item.id}" data-slot="${index}" aria-pressed="${selected ? 'true' : 'false'}" aria-label="${item.name}, ${stack.qty}">
        <span class="slot-art">${iconHtml(item.id)}</span>
        <small>×${stack.qty}</small>
      </button>`;
    })
    .join('');
  const focused = focus && 'itemId' in focus ? api.content.items[focus.itemId] : undefined;
  const wornSlot = focused?.slot && state.equipment[focused.slot] === focused.id ? focused.slot : null;
  const bagIndex = focused ? state.inventory.findIndex((stack) => stack.itemId === focused.id) : -1;
  const detail = focused
    ? itemCard(focused, api, wornSlot, bagIndex)
    : focus && 'emptySlot' in focus
      ? `<article class="item-card"><h3>${SLOT_LABEL[focus.emptySlot]}</h3><p>Nothing is worn here.</p></article>`
      : '';
  return `<div class="sheet paper">
    <header><h2>Inventory</h2><p>${formatCoin(state.copper, api.content.economy)}</p></header>
    <div class="paper-doll">
      ${slotButton(state, api, 'head', focus)}
      ${slotButton(state, api, 'chest', focus)}
      ${dollFigure(state)}
      ${slotButton(state, api, 'hands', focus)}
      ${slotButton(state, api, 'legs', focus)}
      ${slotButton(state, api, 'feet', focus)}
      ${slotButton(state, api, 'primary', focus)}
      ${slotButton(state, api, 'secondary', focus)}
    </div>
    <h3>Bag</h3>
    <div class="bag-grid">${cells || '<p class="empty">Nothing in the bag.</p>'}</div>
    ${detail}
    <button type="button" class="close" data-action="close">Close</button>
  </div>`;
}

function itemCard(item: ItemDef, api: GameApi, wornSlot: EquipSlot | null, bagIndex: number): string {
  const lines: string[] = [];
  lines.push(`<p><strong>Type.</strong> ${escapeHtml(item.kind)}${item.slot ? `, ${SLOT_LABEL[item.slot]}` : ', bag only'}</p>`);
  if (item.damage) lines.push(`<p><strong>Damage.</strong> ${item.damage.n}d${item.damage.sides}${item.damage.bonus ? `+${item.damage.bonus}` : ''}${item.delayMs ? ` every ${(item.delayMs / 1000).toFixed(1)}s` : ''}</p>`);
  if (item.ac) lines.push(`<p><strong>Armor.</strong> ${item.ac}</p>`);
  const bonus = item.bonuses;
  if (bonus) {
    const parts = (['str', 'sta', 'agi', 'dex', 'wis', 'int', 'cha', 'hp', 'mana'] as const)
      .filter((key) => bonus[key])
      .map((key) => `${key.toUpperCase()} +${bonus[key]}`);
    if (parts.length) lines.push(`<p><strong>Bonus.</strong> ${escapeHtml(parts.join(', '))}</p>`);
  }
  if (item.heal) lines.push(`<p><strong>Health.</strong> Restores ${item.heal}</p>`);
  if (item.effects) lines.push(`<p><strong>Effect.</strong> ${escapeHtml(item.effects)}</p>`);
  lines.push(`<p><strong>Weight.</strong> ${item.weight}</p>`);
  lines.push(`<p><strong>Value.</strong> ${formatCoin(item.value, api.content.economy)}</p>`);
  const actions = [
    wornSlot ? `<button type="button" data-action="unequip" data-equip-slot="${wornSlot}">Unequip</button>` : '',
    !wornSlot && item.slot && bagIndex >= 0 ? `<button type="button" data-action="equip" data-slot="${bagIndex}">Equip</button>` : '',
    item.kind === 'consumable' && bagIndex >= 0 ? `<button type="button" data-action="use" data-slot="${bagIndex}">Use</button>` : '',
  ].join('');
  return `<article class="item-card">
    <header>${iconHtml(item.id, 'icon icon-lg')}<div><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.blurb)}</p></div></header>
    ${lines.join('')}
    <div class="row-actions">${actions}</div>
  </article>`;
}

function journalHtml(state: GameState, api: GameApi, confirmAbandon: boolean): string {
  const cards = api.content.quests
    .map((quest) => {
      const progress = state.quests.wolf_pelts;
      if (quest.id !== 'wolf_pelts' || progress.stage === 'none') return '';
      let have = 0;
      for (const stack of state.inventory) if (stack.itemId === quest.itemId) have += stack.qty;
      const shown = progress.stage === 'done' ? quest.need : Math.min(quest.need, have);
      const abandon = progress.stage === 'active'
        ? confirmAbandon
          ? `<p>Abandon this quest? Pelts already in your bag stay, and Eirik will offer it again.</p>
             <div class="row-actions">
               <button type="button" data-action="abandon-yes" data-quest="${quest.id}">Abandon</button>
               <button type="button" data-action="abandon-no">Keep it</button>
             </div>`
          : `<button type="button" data-action="abandon-ask">Abandon</button>`
        : '';
      return `<article class="quest-card">
        <header><h3>${escapeHtml(quest.name)}</h3><p>${progress.stage === 'done' ? 'Completed' : 'Active'}</p></header>
        <p><strong>Giver.</strong> ${escapeHtml(quest.giver)}</p>
        <p>${escapeHtml(quest.description)}</p>
        <p><strong>Objective.</strong> ${escapeHtml(quest.objective)} — ${shown}/${quest.need}</p>
        <p><strong>Reward.</strong> ${escapeHtml(quest.reward)}</p>
        ${abandon}
      </article>`;
    })
    .join('');
  return `<div class="sheet">
    <header><h2>Quests</h2></header>
    ${cards || '<p class="empty">No quests yet. Eirik at the warrior guild is looking for pelts.</p>'}
    <button type="button" class="close" data-action="close">Close</button>
  </div>`;
}

function packHtml(state: GameState, api: GameApi, selling: boolean): string {
  return `<div class="sheet">
    <header><h2>Pack</h2><p>${escapeHtml(api.content.items[state.equipment.primary ?? '']?.name ?? 'Empty hands')} · ${formatCoin(state.copper, api.content.economy)}</p></header>
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
        item.kind === 'weapon' || item.kind === 'armor' ? `<button type="button" data-action="equip" data-slot="${index}">Equip</button>` : '',
        selling ? `<button type="button" data-action="sell" data-slot="${index}">Sell ${formatCoin(item.value, api.content.economy)}</button>` : '',
      ].join('');
      return `<li><span><strong>${escapeHtml(item.name)} ×${stack.qty}</strong><small>${escapeHtml(item.blurb)}</small></span><span class="row-actions">${buttons}</span></li>`;
    })
    .join('');
  return `<ul class="trade">${rows}</ul>`;
}

function inspectHtml(state: GameState): string {
  return `<div class="sheet parchment">
    <p class="parchment-kicker">Written on the board</p>
    <header><h2>${escapeHtml(state.ui.title ?? 'Sign')}</h2></header>
    <p class="speech">${escapeHtml(state.ui.body ?? '')}</p>
    <button type="button" class="close" data-action="close">Close</button>
  </div>`;
}

function helpHtml(state: GameState, api: GameApi): string {
  const caster = state.maxMana > 0;
  const spells = (api.content.classes[state.classId]?.abilities ?? [])
    .map((id) => api.content.abilities[id])
    .filter((ability) => ability?.blurb)
    .map((ability) => `<li>${escapeHtml(ability!.name)}. ${escapeHtml(ability!.blurb!)}</li>`)
    .join('');
  return `<div class="sheet">
    <header><h2>How to move through Hoffender</h2></header>
    <ul class="help-list">
      <li>Stick or D-pad, or tap the ground, walks. The Pad button swaps them. WASD works on a keyboard. Pinch the map, or use the mouse wheel, to zoom.</li>
      <li>Tap a wolf to mark it, then ATK. Swings land on their own timer.</li>
      ${caster ? spells : '<li>Kick is immediate, then it needs a breath.</li>'}
      <li>Look talks to a person. On a sign it opens the writing. Inv is your pack and worn gear. Quest lists what you have taken up.</li>
      <li>Inside the palisade is Hoffender. North of the gate is the Frostmere Wilds. Fall in combat and you wake in Hilda's yard.</li>
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
