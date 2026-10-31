import type { GameState, ItemDef } from './types';

const CLASS_NAME: Record<string, string> = {
  warrior: 'Warrior',
  berserker: 'Berserker',
  rogue: 'Rogue',
  shaman: 'Shaman',
  warden: 'Warden',
  wizard: 'Wizard',
};

export function classLabel(id: string): string {
  return CLASS_NAME[id] ?? id;
}

export function armorLabel(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

/** Why this character cannot equip the item, or null if they can. */
export function wearRefusal(state: GameState, item: ItemDef): string | null {
  if (item.wearers && !item.wearers.includes(state.classId)) {
    const kind = item.armorType ? armorLabel(item.armorType).toLowerCase() : 'this';
    const who = item.wearers.map(classLabel).join(', ');
    return `A ${classLabel(state.classId)} cannot wear ${kind}. It is made for ${who}.`;
  }
  if (item.faction) {
    const have = state.factions[item.faction.id] ?? 0;
    if (have < item.faction.rank) {
      return `${item.faction.id} standing ${item.faction.rank} is required. You have ${have}.`;
    }
  }
  return null;
}
