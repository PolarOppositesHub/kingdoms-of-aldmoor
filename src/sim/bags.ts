import type { ContentDb, GameState, HeldBag, ItemStack } from './types';
import { BAG_HOLDERS } from './types';

export function emptyBags(): (HeldBag | null)[] {
  return Array.from({ length: BAG_HOLDERS }, () => null);
}

export function countItem(state: GameState, itemId: string): number {
  let total = 0;
  for (const bag of state.bags) {
    if (!bag) continue;
    for (const slot of bag.slots) if (slot?.itemId === itemId) total += slot.qty;
  }
  return total;
}

export function stackCount(state: GameState): number {
  let total = 0;
  for (const bag of state.bags) {
    if (!bag) continue;
    for (const slot of bag.slots) if (slot) total += 1;
  }
  return total;
}

export function findStack(state: GameState, itemId: string): { bag: number; slot: number } | null {
  for (let bag = 0; bag < state.bags.length; bag++) {
    const held = state.bags[bag];
    if (!held) continue;
    for (let slot = 0; slot < held.slots.length; slot++) {
      if (held.slots[slot]?.itemId === itemId) return { bag, slot };
    }
  }
  return null;
}

export function firstConsumable(state: GameState, content: ContentDb): { bag: number; slot: number } | null {
  for (let bag = 0; bag < state.bags.length; bag++) {
    const held = state.bags[bag];
    if (!held) continue;
    for (let slot = 0; slot < held.slots.length; slot++) {
      const stack = held.slots[slot];
      if (stack && content.items[stack.itemId]?.kind === 'consumable') return { bag, slot };
    }
  }
  return null;
}

/** Puts items into bags. Bags themselves take an empty holder. Returns how many did not fit. */
export function addItem(state: GameState, content: ContentDb, itemId: string, qty: number): number {
  const def = content.items[itemId];
  if (!def || qty <= 0) return qty;
  if (def.kind === 'bag') {
    let left = qty;
    while (left > 0) {
      const index = state.bags.findIndex((bag) => !bag);
      if (index < 0) return left;
      const size = Math.min(8, Math.max(4, def.slots ?? 4));
      state.bags[index] = { itemId, slots: Array.from({ length: size }, () => null) };
      left -= 1;
    }
    return 0;
  }
  let left = qty;
  if (def.stack > 1) {
    for (const bag of state.bags) {
      if (!bag || left <= 0) continue;
      for (const slot of bag.slots) {
        if (!slot || slot.itemId !== itemId || left <= 0) continue;
        const room = def.stack - slot.qty;
        const moved = Math.min(room, left);
        slot.qty += moved;
        left -= moved;
      }
    }
  }
  while (left > 0) {
    let placed = false;
    for (const bag of state.bags) {
      if (!bag) continue;
      const index = bag.slots.findIndex((slot) => !slot);
      if (index < 0) continue;
      const moved = Math.min(def.stack, left);
      bag.slots[index] = { itemId, qty: moved };
      left -= moved;
      placed = true;
      break;
    }
    if (!placed) return left;
  }
  return 0;
}

export function takeItems(state: GameState, itemId: string, qty: number): boolean {
  if (countItem(state, itemId) < qty) return false;
  let left = qty;
  for (const bag of state.bags) {
    if (!bag) continue;
    for (let slot = 0; slot < bag.slots.length && left > 0; slot++) {
      const stack = bag.slots[slot];
      if (!stack || stack.itemId !== itemId) continue;
      const take = Math.min(stack.qty, left);
      stack.qty -= take;
      left -= take;
      if (stack.qty <= 0) bag.slots[slot] = null;
    }
  }
  return true;
}

export function removeOne(state: GameState, bag: number, slot: number): ItemStack | null {
  const held = state.bags[bag];
  const stack = held?.slots[slot];
  if (!held || !stack) return null;
  const taken = { itemId: stack.itemId, qty: 1 };
  stack.qty -= 1;
  if (stack.qty <= 0) held.slots[slot] = null;
  return taken;
}

export function removeBag(state: GameState, holder: number): string | null {
  const bag = state.bags[holder];
  if (!bag) return null;
  if (bag.slots.some((slot) => slot)) return null;
  state.bags[holder] = null;
  return bag.itemId;
}

export function moveItem(state: GameState, content: ContentDb, fromBag: number, fromSlot: number, toBag: number, toSlot: number): boolean {
  const sourceBag = state.bags[fromBag];
  const destBag = state.bags[toBag];
  if (!sourceBag || !destBag) return false;
  if (fromSlot < 0 || toSlot < 0 || fromSlot >= sourceBag.slots.length || toSlot >= destBag.slots.length) return false;
  if (fromBag === toBag && fromSlot === toSlot) return false;
  const source = sourceBag.slots[fromSlot];
  if (!source) return false;
  const dest = destBag.slots[toSlot];
  if (dest && dest.itemId === source.itemId) {
    const limit = content.items[source.itemId]?.stack ?? 1;
    const room = limit - dest.qty;
    if (room > 0) {
      const moved = Math.min(room, source.qty);
      dest.qty += moved;
      source.qty -= moved;
      if (source.qty <= 0) sourceBag.slots[fromSlot] = null;
      return true;
    }
  }
  sourceBag.slots[fromSlot] = dest;
  destBag.slots[toSlot] = source;
  return true;
}

export function moveBag(state: GameState, from: number, to: number): boolean {
  if (from === to || from < 0 || to < 0 || from >= state.bags.length || to >= state.bags.length) return false;
  const swap = state.bags[from];
  state.bags[from] = state.bags[to];
  state.bags[to] = swap;
  return true;
}

/** Old flat packs become threadbare sacks. A hero with nothing still gets one empty sack. */
export function bagsFromLegacy(items: ItemStack[]): (HeldBag | null)[] {
  const bags = emptyBags();
  let holder = 0;
  let slot = 0;
  const open = () => {
    if (!bags[holder]) {
      bags[holder] = { itemId: 'threadbare_sack', slots: Array.from({ length: 4 }, () => null) };
    }
    return bags[holder]!;
  };
  for (const stack of items) {
    if (holder >= BAG_HOLDERS) break;
    if (slot >= open().slots.length) {
      holder += 1;
      slot = 0;
      if (holder >= BAG_HOLDERS) break;
    }
    open().slots[slot] = { itemId: stack.itemId, qty: stack.qty };
    slot += 1;
  }
  if (!bags[0]) bags[0] = { itemId: 'threadbare_sack', slots: Array.from({ length: 4 }, () => null) };
  return bags;
}

export function normalizeBags(raw: unknown): (HeldBag | null)[] {
  const bags = emptyBags();
  if (!Array.isArray(raw)) return bags;
  for (let i = 0; i < BAG_HOLDERS && i < raw.length; i++) {
    const row = raw[i] as { itemId?: unknown; slots?: unknown } | null;
    if (!row || typeof row.itemId !== 'string' || !Array.isArray(row.slots)) continue;
    const slots: (ItemStack | null)[] = row.slots.slice(0, 8).map((entry) => {
      const stack = entry as { itemId?: unknown; qty?: unknown } | null;
      if (!stack || typeof stack.itemId !== 'string') return null;
      const qty = Math.max(1, Math.floor(Number(stack.qty) || 1));
      return { itemId: stack.itemId, qty };
    });
    if (slots.length < 4) while (slots.length < 4) slots.push(null);
    bags[i] = { itemId: row.itemId, slots };
  }
  return bags;
}
