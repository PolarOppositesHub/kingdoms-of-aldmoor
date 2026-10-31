import type {
  AbilityDef,
  ClassDef,
  ContentDb,
  ItemDef,
  MobDef,
  NpcDef,
  QuestDef,
  Roster,
} from './types';
import itemsJson from '../content/items.json';
import mobsJson from '../content/mobs.json';
import npcsJson from '../content/npcs.json';
import dialogueJson from '../content/dialogue.json';
import abilitiesJson from '../content/abilities.json';
import classesJson from '../content/classes.json';
import tuningJson from '../content/tuning.json';
import merchantJson from '../content/merchant.json';
import economyJson from '../content/economy.json';
import playerJson from '../content/player.json';
import rosterJson from '../content/roster.json';
import questsJson from '../content/quests.json';
import armorJson from '../content/armor.json';
import armorRules from '../content/armor-rules.json';

function indexById<T extends { id: string }>(rows: T[]): Record<string, T> {
  const out: Record<string, T> = {};
  for (const row of rows) out[row.id] = row;
  return out;
}

export function loadContent(): ContentDb {
  const items = indexById([...(itemsJson as ItemDef[]), ...(armorJson as ItemDef[])]);
  if (Object.keys(items).length !== (itemsJson as ItemDef[]).length + (armorJson as ItemDef[]).length) {
    throw new Error('armor ids collide with other items');
  }
  const rules = armorRules as {
    types: string[];
    wearers: Record<string, string[]>;
  };
  if (JSON.stringify(rules.wearers.scale) !== JSON.stringify(rules.wearers.chain)) {
    throw new Error('scale armor must be wearable by every chain-capable class');
  }
  for (const item of armorJson as ItemDef[]) {
    if (!item.armorType || !rules.types.includes(item.armorType)) throw new Error(`${item.id} has no armor type`);
    if (item.armorType === 'scale') throw new Error('scale armor is not stocked yet');
    if (JSON.stringify(item.wearers) !== JSON.stringify(rules.wearers[item.armorType])) {
      throw new Error(`${item.id} wearers do not match the ${item.armorType} rule`);
    }
  }
  const mobs = indexById(mobsJson as MobDef[]);
  const npcs = indexById(npcsJson as NpcDef[]);
  const abilities = indexById(abilitiesJson as AbilityDef[]);
  const classes = indexById(classesJson as ClassDef[]);
  for (const vendor of merchantJson.vendors) {
    for (const stock of vendor.stock) {
      if (!items[stock.itemId]) throw new Error(`${vendor.npcId} stock missing item ${stock.itemId}`);
    }
  }
  for (const mob of Object.values(mobs)) {
    for (const loot of mob.loot) {
      if (!items[loot.itemId]) throw new Error(`${mob.id} loot missing ${loot.itemId}`);
    }
  }
  return {
    items,
    mobs,
    npcs,
    dialogue: dialogueJson as ContentDb['dialogue'],
    abilities,
    classes,
    tuning: tuningJson as ContentDb['tuning'],
    merchant: merchantJson,
    economy: economyJson,
    player: playerJson,
    roster: rosterJson as Roster,
    quests: questsJson as QuestDef[],
  };
}
