import type { ContentDb, GameState, Intent, MapData } from './types';
import { collect } from './events';
import { dist } from './formulas';
import { findActor, getPlayer, applyHero, refreshGear, syncCompanion } from './state';
import { abandonQuest, acceptQuest, addHate, addItem, askPrice, grantXp, knownAbilities, learnAbility, nearestMob, openDialogue, openInspect, performAbility, sellAllOf, standUp, turnInPelts, turnInQuest } from './systems';
import { moveBag, moveItem, removeBag, removeOne } from './bags';
import { LOADOUT_CAP } from './types';
import { wearRefusal } from './wear';

function nearestSign(map: MapData, x: number, y: number, maxDist: number) {
  let best: { name: string; text?: string; x: number; y: number; d: number } | null = null;
  for (const spawn of map.spawns) {
    if (spawn.kind !== 'sign') continue;
    const gap = Math.hypot(spawn.x - x, spawn.y - y);
    if (gap > maxDist) continue;
    if (!best || gap < best.d) best = { name: spawn.name, text: spawn.text, x: spawn.x, y: spawn.y, d: gap };
  }
  return best;
}

function clampAxis(value: number): number {
  if (value > 0.4) return 1;
  if (value < -0.4) return -1;
  return 0;
}

export function applyIntent(state: GameState, intent: Intent, content: ContentDb, map: MapData) {
  return collect(state, (emit) => {
    const player = getPlayer(state);
    const busy = state.ui.panel !== 'none';

    switch (intent.type) {
      case 'move': {
        if (state.dead || busy) return;
        state.input.x = clampAxis(intent.x);
        state.input.y = clampAxis(intent.y);
        if (state.input.x !== 0 || state.input.y !== 0) {
          standUp(state, emit);
          state.input.dest = null;
          state.input.pendingInteract = null;
          state.input.pendingSign = null;
        }
        return;
      }
      case 'moveTo': {
        if (state.dead || busy) return;
        standUp(state, emit);
        state.input.dest = { x: intent.x, y: intent.y };
        state.input.pendingInteract = null;
        state.input.pendingSign = null;
        player.pathTx = -999;
        return;
      }
      case 'target': {
        const actor = findActor(state, intent.id);
        if (!actor || !actor.alive || actor.kind === 'player' || actor.pet) return;
        state.targetId = actor.id;
        return;
      }
      case 'clearTarget':
        state.targetId = null;
        return;
      case 'cycleTarget': {
        const nearby = state.actors
          .filter((actor) => actor.kind === 'mob' && actor.alive && dist(actor, player) < 320)
          .sort((a, b) => dist(a, player) - dist(b, player));
        if (!nearby.length) {
          state.targetId = null;
          emit({ type: 'log', text: 'Nothing nearby to fight.' });
          return;
        }
        const index = nearby.findIndex((actor) => actor.id === state.targetId);
        state.targetId = nearby[(index + 1) % nearby.length].id;
        return;
      }
      case 'toggleSit': {
        if (state.dead || busy) return;
        if (state.sitting) {
          state.sitting = false;
          emit({ type: 'log', text: 'You stand.' });
          return;
        }
        if (state.input.x !== 0 || state.input.y !== 0 || state.input.dest) {
          emit({ type: 'log', text: 'You are still moving.' });
          return;
        }
        state.sitting = true;
        state.autoAttack = false;
        emit({ type: 'log', text: 'You sit and let your breath come back.' });
        return;
      }
      case 'toggleAutoAttack': {
        if (state.dead || busy) return;
        state.autoAttack = !state.autoAttack;
        if (state.autoAttack) standUp(state, emit);
        if (!state.autoAttack) return;
        const current = findActor(state, state.targetId);
        if (!current || !current.alive || current.kind !== 'mob') {
          const near = nearestMob(state, player.x, player.y, 240, null);
          state.targetId = near?.id ?? null;
          if (!near) emit({ type: 'log', text: 'Nothing nearby to fight.' });
        }
        if (player.attackMs <= 0) player.attackMs = content.tuning.swingWindupMs;
        return;
      }
      case 'ability': {
        if (state.dead || busy) return;
        performAbility(state, content, map, intent.id, emit);
        return;
      }
      case 'createHero': {
        applyHero(state, content, intent.raceId, intent.classId, intent.bonus, intent.sex ?? state.sex);
        return;
      }
      case 'talkTo': {
        if (state.dead) return;
        const npc = findActor(state, intent.id);
        if (!npc || npc.kind !== 'npc') return;
        if (dist(player, npc) <= content.tuning.interactRange) openDialogue(state, content, npc, emit);
        else {
          state.input.pendingInteract = npc.id;
          state.input.dest = { x: npc.x, y: npc.y };
          player.pathTx = -999;
        }
        return;
      }
      case 'interact': {
        if (state.dead || busy) return;
        let closest: { id: string; d: number } | null = null;
        let walk: { id: string; d: number; x: number; y: number } | null = null;
        for (const actor of state.actors) {
          if (actor.kind !== 'npc') continue;
          const gap = dist(player, actor);
          if (gap <= content.tuning.interactRange && (!closest || gap < closest.d)) closest = { id: actor.id, d: gap };
          if (gap <= 180 && (!walk || gap < walk.d)) walk = { id: actor.id, d: gap, x: actor.x, y: actor.y };
        }
        if (closest) {
          const npc = findActor(state, closest.id);
          if (npc) openDialogue(state, content, npc, emit);
          return;
        }
        const sign = nearestSign(map, player.x, player.y, 36);
        if (sign) {
          openInspect(state, sign.name, sign.text ?? sign.name);
          return;
        }
        if (walk) {
          state.input.pendingInteract = walk.id;
          state.input.pendingSign = null;
          state.input.dest = { x: walk.x, y: walk.y };
          player.pathTx = -999;
          return;
        }
        const farSign = nearestSign(map, player.x, player.y, 160);
        if (farSign) {
          state.input.pendingSign = farSign.name;
          state.input.pendingInteract = null;
          state.input.dest = { x: farSign.x, y: farSign.y };
          player.pathTx = -999;
          return;
        }
        emit({ type: 'log', text: 'Nothing here to look at.' });
        return;
      }
      case 'choice': {
        if (state.ui.panel !== 'dialogue' || !state.ui.npcId || !state.ui.nodeId) return;
        const npc = findActor(state, state.ui.npcId);
        if (!npc) return;
        const def = content.npcs[npc.defId];
        const node = def ? content.dialogue[def.dialogue]?.[state.ui.nodeId] : undefined;
        const choice = node?.choices[intent.index];
        if (!choice) return;
        if (choice.action === 'merchant' && def && content.merchant.vendors.some((vendor) => vendor.npcId === def.id)) {
          state.ui.panel = 'merchant';
          return;
        }
        if (choice.action === 'acceptQuest' && choice.quest) {
          acceptQuest(state, content, choice.quest, emit);
          state.ui = { panel: 'none', npcId: null, nodeId: null, title: null, body: null };
          return;
        }
        if (choice.action === 'turnIn' && choice.quest === 'wolf_pelts') {
          turnInPelts(state, content, emit, choice.reward === 'jerkin' ? 'jerkin' : 'helm');
          state.ui = { panel: 'none', npcId: null, nodeId: null, title: null, body: null };
          return;
        }
        if (choice.action === 'turnIn' && choice.quest) {
          turnInQuest(state, content, choice.quest, emit);
          state.ui = { panel: 'none', npcId: null, nodeId: null, title: null, body: null };
          return;
        }
        if (choice.action === 'sellAll' && choice.itemId) {
          sellAllOf(state, content, choice.itemId, emit);
          return;
        }
        if (choice.action === 'close' || !choice.next) {
          state.ui = { panel: 'none', npcId: null, nodeId: null, title: null, body: null };
          return;
        }
        state.ui.nodeId = choice.next;
        return;
      }
      case 'buy': {
        if (state.ui.panel !== 'merchant' || !state.ui.npcId) return;
        const npc = findActor(state, state.ui.npcId);
        const vendor = npc ? content.merchant.vendors.find((entry) => entry.npcId === npc.defId) : undefined;
        if (!npc || !vendor) return;
        const stock = vendor.stock.find((row) => row.itemId === intent.itemId);
        const item = content.items[intent.itemId];
        if (!stock || !item) return;
        if (item.teaches) {
          const price = askPrice(npc.defId, stock.price);
          if (state.copper < price) {
            emit({ type: 'log', text: "You don't have the coin." });
            return;
          }
          if (!learnAbility(state, content, item.teaches, emit)) return;
          state.copper -= price;
          emit({ type: 'log', text: `You pay ${price} copper.` });
          return;
        }
        if (item.chart) {
          const price = askPrice(npc.defId, stock.price);
          if (state.charts.includes(item.chart)) {
            emit({ type: 'log', text: 'You already have that chart.' });
            return;
          }
          if (state.copper < price) {
            emit({ type: 'log', text: "You don't have the coin." });
            return;
          }
          state.copper -= price;
          state.charts.push(item.chart);
          emit({ type: 'log', text: `You buy the ${item.name}. It is in your map case.` });
          return;
        }
        const price = askPrice(npc.defId, stock.price);
        if (state.copper < price) {
          emit({ type: 'log', text: "You don't have the coin." });
          return;
        }
        const left = addItem(state, content, item.id, 1);
        if (left > 0) {
          emit({ type: 'log', text: 'Your bags are full.' });
          return;
        }
        state.copper -= price;
        emit({ type: 'log', text: `You buy a ${item.name} for ${price} copper.` });
        return;
      }
      case 'sell': {
        if (state.ui.panel !== 'merchant') return;
        const taken = removeOne(state, intent.bag, intent.slot);
        if (!taken) return;
        const item = content.items[taken.itemId];
        if (!item) return;
        state.copper += item.value;
        emit({ type: 'log', text: `You sell a ${item.name} for ${item.value} copper.` });
        return;
      }
      case 'sellBag': {
        if (state.ui.panel !== 'merchant') return;
        const id = removeBag(state, intent.holder);
        if (!id) {
          emit({ type: 'log', text: 'Empty the bag before you sell it.' });
          return;
        }
        const item = content.items[id];
        state.copper += item?.value ?? 0;
        emit({ type: 'log', text: `You sell the ${item?.name ?? 'bag'}.` });
        return;
      }
      case 'use': {
        if (state.itemLockMs > 0 || state.dead) return;
        const held = state.bags[intent.bag]?.slots[intent.slot];
        if (!held) return;
        const item = content.items[held.itemId];
        if (!item || item.kind !== 'consumable' || !item.heal) return;
        if (player.hp >= player.maxHp) {
          emit({ type: 'log', text: 'You are already at full health.' });
          return;
        }
        const healed = Math.min(item.heal, player.maxHp - player.hp);
        player.hp += healed;
        removeOne(state, intent.bag, intent.slot);
        state.itemLockMs = content.tuning.itemLockMs;
        emit({ type: 'heal', targetId: player.id, amount: healed });
        emit({ type: 'log', text: `The ${item.name} restores ${healed} health.` });
        return;
      }
      case 'equip': {
        const held = state.bags[intent.bag]?.slots[intent.slot];
        if (!held) return;
        const item = content.items[held.itemId];
        if (!item?.slot) return;
        const refusal = wearRefusal(state, item);
        if (refusal) {
          emit({ type: 'log', text: refusal });
          return;
        }
        if (state.classId === 'warden' && item.slot === 'primary' && item.grip !== 'fist' && item.grip !== 'staff') {
          emit({ type: 'log', text: 'A warden fights with fists, hand-wraps, or a staff.' });
          return;
        }
        const slot = item.slot;
        const previous = state.equipment[slot];
        removeOne(state, intent.bag, intent.slot);
        if (previous) {
          const leftover = addItem(state, content, previous, 1);
          if (leftover > 0) {
            addItem(state, content, item.id, 1);
            emit({ type: 'log', text: 'Your bags are full.' });
            return;
          }
        }
        state.equipment[slot] = item.id;
        if (slot === 'primary' && item.delayMs && player.attackMs > item.delayMs) player.attackMs = item.delayMs;
        refreshGear(state, content);
        emit({ type: 'log', text: `You equip the ${item.name}.` });
        return;
      }
      case 'unequip': {
        const worn = state.equipment[intent.slot];
        if (!worn) return;
        const left = addItem(state, content, worn, 1);
        if (left > 0) {
          emit({ type: 'log', text: 'Your bags are full.' });
          return;
        }
        state.equipment[intent.slot] = null;
        refreshGear(state, content);
        const name = content.items[worn]?.name ?? 'item';
        emit({ type: 'log', text: `You take off the ${name}.` });
        return;
      }
      case 'moveItem': {
        moveItem(state, content, intent.fromBag, intent.fromSlot, intent.toBag, intent.toSlot);
        return;
      }
      case 'moveBag': {
        moveBag(state, intent.from, intent.to);
        return;
      }
      case 'pet': {
        if (state.classId !== 'warden') return;
        if (intent.order === 'dismiss') {
          if (state.petAway) return;
          state.petAway = true;
          state.petHold = null;
          state.petFocus = null;
          state.petOrder = 'follow';
          state.actors = state.actors.filter((actor) => !actor.pet);
          emit({ type: 'log', text: 'Your wolf slips back into the trees.' });
          return;
        }
        if (intent.order === 'call') {
          state.petAway = false;
          state.petHold = null;
          state.petFocus = null;
          state.petOrder = 'follow';
          syncCompanion(state, content);
          emit({ type: 'log', text: 'Your wolf comes back to your side.' });
          return;
        }
        if (intent.order === 'taunt') {
          if (state.petAway) {
            state.petAway = false;
            syncCompanion(state, content);
          }
          const pet = state.actors.find((actor) => actor.pet && actor.alive);
          const def = pet ? content.mobs[pet.defId] : undefined;
          if (!pet || !def?.petTaunt) return;
          const target = findActor(state, state.targetId);
          if (!target || target.kind !== 'mob' || !target.alive || target.pet) {
            emit({ type: 'log', text: 'Your wolf has nothing to taunt.' });
            return;
          }
          addHate(state, content, map, target, pet.id, 40 + pet.level * 4, emit);
          emit({ type: 'log', text: `Your wolf taunts ${target.name}.` });
          return;
        }
        if (state.petAway) {
          state.petAway = false;
          syncCompanion(state, content);
        }
        state.petOrder = intent.order;
        const pet = state.actors.find((actor) => actor.pet && actor.alive);
        if (intent.order === 'stay' && pet) state.petHold = { x: pet.x, y: pet.y };
        else state.petHold = null;
        if (intent.order === 'attack') {
          const target = findActor(state, state.targetId);
          if (!target || target.kind !== 'mob' || !target.alive || target.pet) {
            emit({ type: 'log', text: 'Your wolf has nothing to attack.' });
            state.petOrder = 'follow';
            state.petFocus = null;
            return;
          }
          state.petFocus = target.id;
          emit({ type: 'log', text: `Your wolf goes for ${target.name}.` });
          return;
        }
        state.petFocus = null;
        const line =
          intent.order === 'stay' ? 'Your wolf holds guard.' : intent.order === 'backoff' ? 'Your wolf backs off.' : 'Your wolf follows.';
        emit({ type: 'log', text: line });
        return;
      }
      case 'openMaps':
        if (state.dead) return;
        state.ui = { panel: 'maps', npcId: null, nodeId: null, title: null, body: null };
        state.input.x = 0;
        state.input.y = 0;
        state.input.dest = null;
        return;
      case 'openBook':
        if (state.dead) return;
        state.ui = { panel: 'book', npcId: null, nodeId: null, title: null, body: null };
        state.input.x = 0;
        state.input.y = 0;
        state.input.dest = null;
        return;
      case 'setLoadout': {
        const known = knownAbilities(state, content);
        const slots: string[] = [];
        for (const id of intent.slots) {
          if (!known.includes(id) || slots.includes(id)) continue;
          slots.push(id);
          if (slots.length >= LOADOUT_CAP) break;
        }
        if (!slots.length) return;
        state.loadout = slots;
        return;
      }
      case 'openJournal':
        if (state.dead) return;
        state.ui = { panel: 'journal', npcId: null, nodeId: null, title: null, body: null };
        state.input.x = 0;
        state.input.y = 0;
        state.input.dest = null;
        return;
      case 'abandonQuest': {
        abandonQuest(state, intent.id, emit);
        return;
      }
      case 'openPack':
        if (state.dead) return;
        state.ui = { panel: 'pack', npcId: null, nodeId: null, title: null, body: null };
        state.input.x = 0;
        state.input.y = 0;
        state.input.dest = null;
        return;
      case 'openHelp':
        state.ui = { panel: 'help', npcId: null, nodeId: null, title: null, body: null };
        state.input.x = 0;
        state.input.y = 0;
        return;
      case 'close':
        state.ui = { panel: 'none', npcId: null, nodeId: null, title: null, body: null };
        return;
      case 'debugTeleport': {
        if (!state.debug) return;
        player.x = intent.x;
        player.y = intent.y;
        player.path = [];
        player.pathTx = -999;
        state.input.dest = null;
        return;
      }
      case 'debugGrantXp': {
        if (!state.debug) return;
        grantXp(state, content, Math.max(0, Math.floor(intent.amount)), emit);
        return;
      }
      default:
        return;
    }
  });
}
