import type { ContentDb, GameState, ItemDef } from './types';

const CLASS_NAME: Record<string, string> = {
  warrior: 'Warrior',
  berserker: 'Berserker',
  rogue: 'Rogue',
  shaman: 'Shaman',
  warden: 'Warden',
  wizard: 'Wizard',
  cleric: 'Cleric',
  enchanter: 'Enchanter',
  paladin: 'Paladin',
  magician: 'Magician',
};

export function classLabel(id: string): string {
  return CLASS_NAME[id] ?? id;
}

const CLASS_ORDER = ['warrior', 'berserker', 'rogue', 'shaman', 'warden', 'wizard', 'cleric', 'enchanter', 'paladin', 'magician'];

/** Class ids that can use this spell or ability, in a stable order. */
export function classesForAbility(content: ContentDb, abilityId: string): string[] {
  const ability = content.abilities[abilityId];
  const ids = new Set<string>();
  if (ability?.classes?.length) {
    for (const id of ability.classes) if (id) ids.add(id);
  } else if (ability?.classId) ids.add(ability.classId);
  for (const cls of Object.values(content.classes)) {
    if (cls.abilities.includes(abilityId)) ids.add(cls.id);
  }
  return [...ids].sort((a, b) => {
    const ai = CLASS_ORDER.indexOf(a);
    const bi = CLASS_ORDER.indexOf(b);
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
  });
}

/** Shop and tooltip line, e.g. "Classes: Cleric, Paladin". Empty when the spell is unknown. */
export function classListLabel(content: ContentDb, abilityId: string): string {
  const names = classesForAbility(content, abilityId).map(classLabel);
  return names.length ? `Classes: ${names.join(', ')}` : '';
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
