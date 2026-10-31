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

function indexById<T extends { id: string }>(rows: T[]): Record<string, T> {
  const out: Record<string, T> = {};
  for (const row of rows) out[row.id] = row;
  return out;
}

export function loadContent(): ContentDb {
  const items = indexById(itemsJson as ItemDef[]);
  const mobs = indexById(mobsJson as MobDef[]);
  const npcs = indexById(npcsJson as NpcDef[]);
  const abilities = indexById(abilitiesJson as AbilityDef[]);
  const classes = indexById(classesJson as ClassDef[]);
  for (const stock of merchantJson.stock) {
    if (!items[stock.itemId]) throw new Error(`merchant stock missing item ${stock.itemId}`);
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
