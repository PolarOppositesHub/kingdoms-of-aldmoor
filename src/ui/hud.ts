import type { GameApi } from '../game/api';
import { controls, pushIntent } from '../game/controls';
import { conColor, conLabel, formatCoin } from '../sim/formulas';
import { isSafe, placeName } from '../sim/map';
import { EQUIP_SLOTS, LOADOUT_CAP, type EquipSlot, type GameState, type ItemDef, type PetOrder } from '../sim/types';
import { armorLabel, classLabel } from '../sim/wear';
import { askPrice, knownAbilities } from '../sim/systems';
import { countItem, firstConsumable } from '../sim/bags';
import { playerVisuals, raceScale } from '../sim/appearance';
import iconsUrl from '../assets/icons.png?url';
import iconMeta from '../assets/icons.json';
import actorsUrl from '../assets/actors.png?url';
import portraitUrl from '../assets/portrait.png?url';
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
      <div class="pet-bar" id="pet-bar" hidden>
        <button type="button" data-pet="attack">Attack</button>
        <button type="button" data-pet="backoff">Back off</button>
        <button type="button" data-pet="stay">Stay</button>
        <button type="button" data-pet="follow">Follow</button>
      </div>
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
    <div class="actions" data-spells="5">
      <button type="button" id="atk" class="atk" aria-pressed="false">ATK</button>
      ${Array.from({ length: LOADOUT_CAP }, (_, index) => `<button type="button" class="spell" data-spell="${index}">—</button>`).join('')}
      <button type="button" id="next">Next</button>
      <button type="button" id="talk">Look</button>
      <button type="button" id="book">Book</button>
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

  const tools = document.createElement('div');
  tools.className = 'corner-tools';
  tools.innerHTML = `
    <button type="button" id="maps" class="corner-btn" aria-label="Maps">
      <span class="pixel-globe" aria-hidden="true"></span>
    </button>
    <button type="button" id="pack" class="corner-btn" aria-label="Inventory">
      <span class="pixel-pack" aria-hidden="true"></span>
    </button>
  `;
  document.getElementById('app')?.appendChild(tools);
  tools.querySelector('#maps')!.addEventListener('click', () => pushIntent({ type: 'openMaps' }));
  tools.querySelector('#pack')!.addEventListener('click', () => {
    detail = null;
    openBag = 0;
    pushIntent({ type: 'openPack' });
  });
  root.querySelector('#atk')!.addEventListener('click', () => pushIntent({ type: 'toggleAutoAttack' }));
  root.querySelectorAll<HTMLButtonElement>('.spell').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.ability;
      if (id) pushIntent({ type: 'ability', id });
    });
  });
  root.querySelectorAll<HTMLButtonElement>('[data-pet]').forEach((button) => {
    button.addEventListener('click', () => pushIntent({ type: 'pet', order: (button.dataset.pet ?? 'follow') as PetOrder }));
  });
  root.querySelector('#next')!.addEventListener('click', () => pushIntent({ type: 'cycleTarget' }));
  root.querySelector('#talk')!.addEventListener('click', () => pushIntent({ type: 'interact' }));
  root.querySelector('#book')!.addEventListener('click', () => pushIntent({ type: 'openBook' }));
  root.querySelector('#quest')!.addEventListener('click', () => {
    abandonArmed = false;
    pushIntent({ type: 'openJournal' });
  });
  root.querySelector('#item')!.addEventListener('click', () => {
    const loc = firstConsumable(api.getState(), api.content);
    if (loc) pushIntent({ type: 'use', bag: loc.bag, slot: loc.slot });
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
  let bookSlot = 0;
  let openBag = 0;
  let dragged = false;

  panel.addEventListener('click', (event) => {
    if (dragged) {
      dragged = false;
      return;
    }
    const button = (event.target as HTMLElement).closest('button');
    if (!button) return;
    const action = button.dataset.action;
    if (action === 'close') {
      detail = null;
      abandonArmed = false;
      pushIntent({ type: 'close' });
    } else if (action === 'choice') pushIntent({ type: 'choice', index: Number(button.dataset.index) });
    else if (action === 'buy') pushIntent({ type: 'buy', itemId: button.dataset.item ?? '' });
    else if (action === 'sell') pushIntent({ type: 'sell', bag: Number(button.dataset.bag), slot: Number(button.dataset.slot) });
    else if (action === 'sell-bag') pushIntent({ type: 'sellBag', holder: Number(button.dataset.holder) });
    else if (action === 'use') pushIntent({ type: 'use', bag: Number(button.dataset.bag), slot: Number(button.dataset.slot) });
    else if (action === 'equip') pushIntent({ type: 'equip', bag: Number(button.dataset.bag), slot: Number(button.dataset.slot) });
    else if (action === 'open-bag') openBag = Number(button.dataset.holder);
    else if (action === 'unequip') pushIntent({ type: 'unequip', slot: (button.dataset.equipSlot ?? 'head') as EquipSlot });
    else if (action === 'focus-item') detail = { itemId: button.dataset.item ?? '' };
    else if (action === 'focus-slot') {
      const worn = button.dataset.item;
      detail = worn ? { itemId: worn } : { emptySlot: (button.dataset.equipSlot ?? 'head') as EquipSlot };
    } else if (action === 'book-slot') bookSlot = Number(button.dataset.slot);
    else if (action === 'learn') {
      const live = api.getState();
      const next = Array.from({ length: LOADOUT_CAP }, (_, index) => live.loadout[index] ?? '');
      next[bookSlot] = button.dataset.ability ?? '';
      pushIntent({ type: 'setLoadout', slots: next.filter((id) => id.length > 0) });
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
  const startItems = countQty(api.getState());
  bindBagDrag(panel, () => {
    dragged = true;
  });

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
    const key = `${panelSignature(state)}|${detail && 'itemId' in detail ? detail.itemId : ''}|${detail && 'emptySlot' in detail ? detail.emptySlot : ''}|${abandonArmed ? 1 : 0}|${bookSlot}|${openBag}`;
    if (key !== panelKey) {
      panelKey = key;
      paintPanel(panel, state, api, detail, abandonArmed, bookSlot, openBag);
    }
    if (!hintedFight && state.ui.panel === 'none' && !isSafe(api.map, getXY(state).x, getXY(state).y)) {
      hintedFight = true;
      if (state.maxMana > 0) showToast('Tap a wolf, then Shard. Rime slows a pack. The blue bar is mana.');
      else showToast('Tap a wolf, then ATK. The button fills between swings.');
    }
    const items = countQty(state);
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
  if (!id) {
    button.disabled = true;
    button.textContent = '—';
    delete button.dataset.ability;
    button.setAttribute('aria-label', 'Empty ability slot');
    return;
  }
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
  const spells = [...root.querySelectorAll<HTMLButtonElement>('.spell')];
  const actions = root.querySelector<HTMLElement>('.actions');
  const petBar = root.querySelector<HTMLElement>('#pet-bar');
  const manaLine = root.querySelector<HTMLElement>('#mana-line');
  const manaFill = root.querySelector<HTMLElement>('#mana-fill');
  const manaNum = root.querySelector('#mana-num');
  const item = root.querySelector<HTMLButtonElement>('#item');
  const targetName = root.querySelector<HTMLElement>('#target-name');
  const targetFill = root.querySelector<HTMLElement>('#target-fill');
  const death = root.querySelector<HTMLElement>('#death');
  if (!who || !place || !coin || !hpNum || !hpFill || !xpFill || !weapon || !log || !atk || spells.length < LOADOUT_CAP || !actions || !item || !targetName || !targetFill || !death) return;

  const className = api.content.classes[state.classId]?.name ?? 'Warrior';
  who.textContent = `Lv ${state.level} ${className}`;
  place.textContent = placeName(api.map, player.x, player.y);
  coin.textContent = formatCoin(state.copper, api.content.economy);
  hpNum.textContent = `${Math.max(0, player.hp)}/${player.maxHp}`;
  hpFill.style.width = `${Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100))}%`;
  if (manaLine && manaFill && manaNum) {
    const resource = api.content.classes[state.classId]?.resource ?? 'none';
    const showMana = state.maxMana > 0;
    const showFocus = !showMana && state.focusMax > 0;
    manaLine.hidden = !(showMana || showFocus);
    manaLine.dataset.resource = showMana ? 'mana' : resource;
    if (showMana) {
      manaFill.style.width = `${Math.max(0, Math.min(100, (state.mana / state.maxMana) * 100))}%`;
      manaNum.textContent = `Mana ${Math.max(0, state.mana)}/${state.maxMana}`;
    } else if (showFocus) {
      manaFill.style.width = `${Math.max(0, Math.min(100, (state.focus / state.focusMax) * 100))}%`;
      const label = resource === 'rage' ? 'Rage' : 'Guile';
      manaNum.textContent = `${label} ${Math.max(0, state.focus)}/${state.focusMax}`;
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

  spells.forEach((button, index) => paintSpell(button, state.loadout[index], state, api));
  actions.dataset.spells = '5';
  if (petBar) {
    const warden = state.classId === 'warden';
    petBar.hidden = !warden;
    petBar.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
      button.setAttribute('aria-pressed', button.dataset.pet === state.petOrder ? 'true' : 'false');
    });
  }

  const food = firstConsumable(state, api.content);
  if (!food) {
    item.textContent = 'No food';
    item.disabled = true;
  } else {
    const stack = state.bags[food.bag]?.slots[food.slot];
    item.disabled = !stack;
    item.textContent = stack ? `${api.content.items[stack.itemId].name} ×${stack.qty}` : 'No food';
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

function countQty(state: GameState): number {
  let total = 0;
  for (const bag of state.bags) {
    if (!bag) continue;
    for (const slot of bag.slots) if (slot) total += slot.qty;
  }
  return total;
}

function panelSignature(state: GameState): string {
  const bag = state.bags
    .map((held, index) => (held ? `${index}:${held.itemId}:${held.slots.map((slot) => (slot ? `${slot.itemId}:${slot.qty}` : '.')).join('/')}` : `${index}:.`))
    .join(',');
  const worn = EQUIP_SLOTS.map((slot) => state.equipment[slot] ?? '').join(',');
  const quest = `${state.quests.wolf_pelts.stage}:${state.quests.wolf_pelts.progress}`;
  return `${state.ui.panel}|${state.ui.nodeId}|${state.ui.title}|${state.copper}|${worn}|${bag}|${quest}|${state.loadout.join(',')}|${state.learned.join(',')}|${state.charts.join(',')}|${state.petOrder}|${state.dead ? 1 : 0}`;
}

function paintPanel(
  panel: HTMLElement,
  state: GameState,
  api: GameApi,
  focus: { itemId: string } | { emptySlot: EquipSlot } | null,
  confirmAbandon: boolean,
  bookSlot: number,
  openBag: number,
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
  else if (state.ui.panel === 'pack') panel.innerHTML = inventoryHtml(state, api, focus, openBag);
  else if (state.ui.panel === 'maps') panel.innerHTML = mapsHtml(state, api);
  else if (state.ui.panel === 'journal') panel.innerHTML = journalHtml(state, api, confirmAbandon);
  else if (state.ui.panel === 'book') panel.innerHTML = bookHtml(state, api, bookSlot);
  else if (state.ui.panel === 'inspect') panel.innerHTML = inspectHtml(state);
  else panel.innerHTML = helpHtml(state, api);
}

function bookHtml(state: GameState, api: GameApi, armed: number): string {
  const known = knownAbilities(state, api.content);
  const slots = Array.from({ length: LOADOUT_CAP }, (_, index) => index)
    .map((index) => {
      const id = state.loadout[index];
      const ability = id ? api.content.abilities[id] : undefined;
      return `<button type="button" class="slot-frame${armed === index ? ' is-on' : ''}" data-action="book-slot" data-slot="${index}">${escapeHtml(ability?.short ?? ability?.name ?? 'Empty')}</button>`;
    })
    .join('');
  const rows = known
    .map((id) => {
      const ability = api.content.abilities[id];
      if (!ability) return '';
      const cost = ability.mana ? `${ability.mana} ${api.content.classes[state.classId]?.resource === 'rage' ? 'rage' : api.content.classes[state.classId]?.resource === 'guile' ? 'guile' : 'mana'}` : 'no cost';
      const on = state.loadout.includes(id) ? 'Slotted' : 'Tap to slot';
      return `<li><span><strong>${escapeHtml(ability.name)}</strong><small>${cost} · ${(ability.cooldownMs / 1000).toFixed(0)}s · ${escapeHtml(ability.blurb ?? '')}</small></span><button type="button" data-action="learn" data-ability="${ability.id}">${on}</button></li>`;
    })
    .join('');
  return `<div class="sheet">
    <header><h2>Book</h2><p>Tap a slot, then the spell that should sit there.</p></header>
    <div class="book-slots">${slots}</div>
    <ul class="trade">${rows}</ul>
    <button type="button" class="close" data-action="close">Close</button>
  </div>`;
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
  const npc = state.actors.find((actor) => actor.id === state.ui.npcId);
  const vendor = api.content.merchant.vendors.find((entry) => entry.npcId === npc?.defId);
  const groups = new Map<string, string[]>();
  for (const row of vendor?.stock ?? []) {
    const item = api.content.items[row.itemId];
    if (!item) continue;
    const key = item.armorType ? armorLabel(item.armorType) : 'Goods';
    const line = `<li><span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.slot ? SLOT_LABEL[item.slot] : item.blurb)}</small></span>
        <button type="button" data-action="buy" data-item="${item.id}">${formatCoin(askPrice(npc?.defId ?? '', row.price), api.content.economy)}</button></li>`;
    const list = groups.get(key) ?? [];
    list.push(line);
    groups.set(key, list);
  }
  const stock = [...groups.entries()].map(([name, rows]) => `<h3>${escapeHtml(name)}</h3><ul class="trade">${rows.join('')}</ul>`).join('');
  return `<div class="sheet">
    <header><h2>${escapeHtml(vendor?.title ?? 'Goods')}</h2><p>Your coin: ${formatCoin(state.copper, api.content.economy)}</p></header>
    ${stock}
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

const DOLL_SCALE = 2;
const portrait = (atlas as { portrait?: { frameW: number; frameH: number; dirs: string[]; framesPerDir: number; rows: Record<string, number> } }).portrait;

function actorLayerStyle(rowName: string): string {
  const sheet = portrait ?? { ...atlas.actors, rows: atlas.actors.rows as Record<string, number> };
  const row = sheet.rows[rowName] ?? 0;
  const frameW = sheet.frameW * DOLL_SCALE;
  const frameH = sheet.frameH * DOLL_SCALE;
  const cols = sheet.dirs.length * sheet.framesPerDir;
  const sheetW = cols * frameW;
  const sheetH = Object.keys(sheet.rows).length * frameH;
  const frameY = row * frameH;
  const url = portrait ? portraitUrl : actorsUrl;
  return `--frame-y:-${frameY}px;--step:${frameW}px;width:${frameW}px;height:${frameH}px;background-image:url(${url});background-size:${sheetW}px ${sheetH}px;`;
}

function dollFigure(state: GameState, api: GameApi): string {
  const body = state.sex === 'female' ? 'body_f' : 'body_m';
  const layers = playerVisuals(state, api.content)
    .map((visual) => `<span class="doll-layer" style="${actorLayerStyle(visual.row)}"></span>`)
    .join('');
  const scale = Math.min(1.16, raceScale(api.content, state.raceId));
  return `<div class="doll-stage" style="transform:scale(${scale});transform-origin:bottom center">
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

function inventoryHtml(state: GameState, api: GameApi, focus: { itemId: string } | { emptySlot: EquipSlot } | null, openBag: number): string {
  const holders = state.bags
    .map((bag, index) => {
      const item = bag ? api.content.items[bag.itemId] : undefined;
      const on = index === openBag ? ' is-on' : '';
      return `<button type="button" class="slot-frame holder${on}" data-action="open-bag" data-holder="${index}" data-drag="bag" data-drop="bag" aria-label="${item ? item.name : 'Empty bag slot'}">
        <span class="slot-art">${item ? iconHtml(item.id) : ''}</span>
        <small>${item ? item.slots ?? bag?.slots.length : 'Bag'}</small>
      </button>`;
    })
    .join('');
  const held = state.bags[openBag];
  const cells = held
    ? held.slots
        .map((stack, index) => {
          const item = stack ? api.content.items[stack.itemId] : undefined;
          const selected = Boolean(item && focus && 'itemId' in focus && focus.itemId === item.id);
          return `<button type="button" class="slot-frame bag-cell${selected ? ' is-on' : ''}" data-action="focus-item" data-item="${item?.id ?? ''}" data-bag="${openBag}" data-slot="${index}" data-drag="item" data-drop="item" aria-label="${item ? `${item.name}, ${stack?.qty}` : 'Empty'}">
            <span class="slot-art">${item ? iconHtml(item.id) : ''}</span>
            <small>${stack ? `×${stack.qty}` : ''}</small>
          </button>`;
        })
        .join('')
    : '<p class="empty">This holder is empty. Bags from Brenna or Signe sit here.</p>';
  const focused = focus && 'itemId' in focus ? api.content.items[focus.itemId] : undefined;
  const wornSlot = focused?.slot && state.equipment[focused.slot] === focused.id ? focused.slot : null;
  const loc = focused ? findHeld(state, focused.id) : null;
  const detail = focused
    ? itemCard(focused, api, wornSlot, loc)
    : focus && 'emptySlot' in focus
      ? `<article class="item-card"><h3>${SLOT_LABEL[focus.emptySlot]}</h3><p>Nothing is worn here.</p></article>`
      : '';
  return `<div class="sheet paper">
    <header><h2>Inventory</h2><p>${formatCoin(state.copper, api.content.economy)}</p></header>
    <div class="paper-doll">
      ${slotButton(state, api, 'head', focus)}
      ${slotButton(state, api, 'chest', focus)}
      ${dollFigure(state, api)}
      ${slotButton(state, api, 'hands', focus)}
      ${slotButton(state, api, 'legs', focus)}
      ${slotButton(state, api, 'feet', focus)}
      ${slotButton(state, api, 'primary', focus)}
      ${slotButton(state, api, 'secondary', focus)}
    </div>
    <h3>Bags</h3>
    <p class="empty">Eight holders. Drag a bag or an item. Weight-light bags are not sold yet.</p>
    <div class="holder-row">${holders}</div>
    <div class="bag-grid">${cells}</div>
    ${detail}
    <button type="button" class="close" data-action="close">Close</button>
  </div>`;
}

function findHeld(state: GameState, itemId: string): { bag: number; slot: number } | null {
  for (let bag = 0; bag < state.bags.length; bag++) {
    const held = state.bags[bag];
    if (!held) continue;
    for (let slot = 0; slot < held.slots.length; slot++) {
      if (held.slots[slot]?.itemId === itemId) return { bag, slot };
    }
  }
  return null;
}

function itemCard(item: ItemDef, api: GameApi, wornSlot: EquipSlot | null, loc: { bag: number; slot: number } | null): string {
  const lines: string[] = [];
  lines.push(`<p><strong>Type.</strong> ${escapeHtml(item.kind)}${item.slot ? `, ${SLOT_LABEL[item.slot]}` : ', bag only'}</p>`);
  if (item.armorType) lines.push(`<p><strong>Material.</strong> ${escapeHtml(armorLabel(item.armorType))}</p>`);
  if (item.wearers?.length) lines.push(`<p><strong>Fits.</strong> ${escapeHtml(item.wearers.map(classLabel).join(', '))}</p>`);
  if (item.faction) lines.push(`<p><strong>Standing.</strong> ${escapeHtml(item.faction.id)} ${item.faction.rank}</p>`);
  if (item.craftedBy) lines.push(`<p><strong>Craft.</strong> ${escapeHtml(item.craftedBy)}</p>`);
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
    !wornSlot && item.slot && loc ? `<button type="button" data-action="equip" data-bag="${loc.bag}" data-slot="${loc.slot}">Equip</button>` : '',
    item.kind === 'consumable' && loc ? `<button type="button" data-action="use" data-bag="${loc.bag}" data-slot="${loc.slot}">Use</button>` : '',
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
      const have = countItem(state, quest.itemId);
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
  const rows: string[] = [];
  state.bags.forEach((bag, bagIndex) => {
    if (!bag) return;
    const bagItem = api.content.items[bag.itemId];
    const empty = bag.slots.every((slot) => !slot);
    if (selling && empty && bagItem) {
      rows.push(`<li><span><strong>${escapeHtml(bagItem.name)}</strong><small>Empty bag</small></span><span class="row-actions"><button type="button" data-action="sell-bag" data-holder="${bagIndex}">Sell ${formatCoin(bagItem.value, api.content.economy)}</button></span></li>`);
    }
    bag.slots.forEach((stack, slot) => {
      if (!stack) return;
      const item = api.content.items[stack.itemId];
      if (!item) return;
      const buttons = [
        item.kind === 'consumable' ? `<button type="button" data-action="use" data-bag="${bagIndex}" data-slot="${slot}">Use</button>` : '',
        item.kind === 'weapon' || item.kind === 'armor' ? `<button type="button" data-action="equip" data-bag="${bagIndex}" data-slot="${slot}">Equip</button>` : '',
        selling ? `<button type="button" data-action="sell" data-bag="${bagIndex}" data-slot="${slot}">Sell ${formatCoin(item.value, api.content.economy)}</button>` : '',
      ].join('');
      rows.push(`<li><span><strong>${escapeHtml(item.name)} ×${stack.qty}</strong><small>${escapeHtml(item.blurb)}</small></span><span class="row-actions">${buttons}</span></li>`);
    });
  });
  if (!rows.length) return `<p class="empty">Nothing in the bags.</p>`;
  return `<ul class="trade">${rows.join('')}</ul>`;
}

function mapsHtml(state: GameState, api: GameApi): string {
  if (!state.charts.length) {
    return `<div class="sheet">
      <header><h2>Maps</h2></header>
      <p class="speech">You have no charts. Sefa Chart, in the Frosthearth Inn, sells Hoffender and the road. Nils Reed, north of the gate, sells the deep wilds and the Barrow. Neither of them sells every map.</p>
      <button type="button" class="close" data-action="close">Close</button>
    </div>`;
  }
  const cards = state.charts
    .map((id) => {
      const chart = api.content.maps[id];
      if (!chart) return '';
      return `<article class="quest-card map-card" data-map="${chart.id}">
        <header><h3>${escapeHtml(chart.name)}</h3></header>
        <div class="map-sketch map-${chart.id}" aria-hidden="true"></div>
        <p>${escapeHtml(chart.blurb)}</p>
      </article>`;
    })
    .join('');
  return `<div class="sheet">
    <header><h2>Maps</h2><p>${state.charts.length} chart${state.charts.length === 1 ? '' : 's'}</p></header>
    ${cards}
    <button type="button" class="close" data-action="close">Close</button>
  </div>`;
}

function bindBagDrag(panel: HTMLElement, onDrag: () => void): void {
  let drag: { kind: 'item' | 'bag'; bag: number; slot: number; x: number; y: number; moved: boolean } | null = null;
  const ghost = document.createElement('div');
  ghost.className = 'drag-ghost';
  ghost.hidden = true;
  document.body.appendChild(ghost);
  panel.addEventListener('pointerdown', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLElement>('[data-drag]');
    if (!button || event.button !== 0) return;
    const kind = button.dataset.drag === 'bag' ? 'bag' : 'item';
    drag = {
      kind,
      bag: Number(button.dataset.bag ?? button.dataset.holder ?? -1),
      slot: Number(button.dataset.slot ?? 0),
      x: event.clientX,
      y: event.clientY,
      moved: false,
    };
    ghost.textContent = button.getAttribute('aria-label') ?? '';
  });
  panel.addEventListener('pointermove', (event) => {
    if (!drag) return;
    if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 8) return;
    drag.moved = true;
    onDrag();
    ghost.hidden = false;
    ghost.style.left = `${event.clientX + 8}px`;
    ghost.style.top = `${event.clientY + 8}px`;
  });
  const end = (event: PointerEvent) => {
    if (!drag) return;
    const current = drag;
    drag = null;
    ghost.hidden = true;
    if (!current.moved) return;
    const hit = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-drop]');
    if (!hit) return;
    if (current.kind === 'bag' && hit.dataset.drop === 'bag') {
      pushIntent({ type: 'moveBag', from: current.bag, to: Number(hit.dataset.holder) });
      return;
    }
    if (current.kind === 'item' && hit.dataset.drop === 'item') {
      pushIntent({
        type: 'moveItem',
        fromBag: current.bag,
        fromSlot: current.slot,
        toBag: Number(hit.dataset.bag),
        toSlot: Number(hit.dataset.slot),
      });
    }
  };
  panel.addEventListener('pointerup', end);
  panel.addEventListener('pointercancel', () => {
    drag = null;
    ghost.hidden = true;
  });
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
      <li>Look talks to a person. On a sign it opens the writing. The pack icon opens bags and worn gear. The globe opens maps you have bought. Quest lists what you have taken up.</li>
      <li>The action bar holds five abilities. The book chooses which five. A warden's wolf follows, attacks your target, and takes Attack, Back off, Stay, and Follow.</li>
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
