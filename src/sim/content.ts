import type {
  AbilityDef,
  ClassDef,
  ContentDb,
  ItemDef,
  MobDef,
  NpcDef,
  MapChart,
  QuestDef,
  Roster,
  VendorDef,
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
import mapsJson from '../content/maps.json';
import armorJson from '../content/armor.json';
import armorRules from '../content/armor-rules.json';
import chartBounds from '../assets/chart-bounds.json';
import southMobs from '../content/south-mobs.json';
import southNpcs from '../content/south-npcs.json';
import southQuests from '../content/south-quests.json';
import southDialogue from '../content/south-dialogue.json';
import canonMobs from '../content/canon-mobs.json';
import canonNpcs from '../content/canon-npcs.json';
import canonQuests from '../content/canon-quests.json';
import canonDialogue from '../content/canon-dialogue.json';
import canonMaps from '../content/canon-maps.json';
import canonVendors from '../content/canon-vendors.json';
import phase2Mobs from '../content/phase2-mobs.json';
import phase2Npcs from '../content/phase2-npcs.json';
import phase2Quests from '../content/phase2-quests.json';
import phase2Dialogue from '../content/phase2-dialogue.json';
import phase2Maps from '../content/phase2-maps.json';
import phase2Vendors from '../content/phase2-vendors.json';
import { TOWN_FOLK } from '../../tools/town-folk.mjs';

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
  const mapRows = [...(mapsJson as MapChart[]), ...(canonMaps as MapChart[]), ...(phase2Maps as MapChart[])];
  const maps = indexById(mapRows);
  if (Object.keys(maps).length !== mapRows.length) {
    throw new Error('chart ids collide');
  }
  const bounds = chartBounds as Record<string, { zone: string; x: number; y: number; w: number; h: number }>;
  for (const chart of Object.values(maps)) {
    const box = bounds[chart.id];
    if (!box) throw new Error(`${chart.id} has no chart bounds`);
    chart.zone = box.zone;
    chart.x = box.x;
    chart.y = box.y;
    chart.w = box.w;
    chart.h = box.h;
  }
  const vendorRows = [...(merchantJson.vendors as VendorDef[]), ...(canonVendors as VendorDef[]), ...(phase2Vendors as VendorDef[])];
  const vendors: VendorDef[] = vendorRows.map((vendor) => {
    if (!vendor.copyFrom) return vendor;
    const source = vendorRows.find((entry) => entry.npcId === vendor.copyFrom);
    if (!source) throw new Error(`${vendor.npcId} copies missing vendor ${vendor.copyFrom}`);
    return { ...vendor, stock: source.stock.map((row) => ({ ...row })) };
  });
  const mobRows = [...(mobsJson as MobDef[]), ...(southMobs as MobDef[]), ...(canonMobs as MobDef[]), ...(phase2Mobs as MobDef[])];
  const mobs = indexById(mobRows);
  if (Object.keys(mobs).length !== mobRows.length) throw new Error('mob ids collide');
  const folkNpcs: NpcDef[] = TOWN_FOLK.map((folk) => ({
    id: folk.id,
    name: folk.name,
    title: folk.title,
    dialogue: folk.id,
    race: folk.race,
    barks: folk.barks,
  }));
  const npcRows = [...(npcsJson as NpcDef[]), ...(southNpcs as NpcDef[]), ...(canonNpcs as NpcDef[]), ...(phase2Npcs as NpcDef[]), ...folkNpcs];
  const npcs = indexById(npcRows);
  if (Object.keys(npcs).length !== npcRows.length) throw new Error('npc ids collide');
  const abilities = indexById(abilitiesJson as AbilityDef[]);
  const classes = indexById(classesJson as ClassDef[]);
  for (const vendor of vendors) {
    for (const stock of vendor.stock) {
      if (!items[stock.itemId]) throw new Error(`${vendor.npcId} stock missing item ${stock.itemId}`);
      const chart = items[stock.itemId]?.chart;
      if (chart && !maps[chart]) throw new Error(`${stock.itemId} charts an unknown region ${chart}`);
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
    dialogue: {
      ...(dialogueJson as ContentDb['dialogue']),
      ...(southDialogue as ContentDb['dialogue']),
      ...(canonDialogue as ContentDb['dialogue']),
      ...(phase2Dialogue as ContentDb['dialogue']),
      ...Object.fromEntries(
        TOWN_FOLK.map((folk) => [
          folk.id,
          {
            start: {
              text: folk.talk,
              choices: [
                { label: 'I will remember.', action: 'close' as const },
                { label: 'What else is there?', next: 'more' },
              ],
            },
            more: {
              text: folk.barks[0] ?? folk.talk,
              choices: [{ label: 'Fair road.', action: 'close' as const }],
            },
          },
        ]),
      ),
    },
    abilities,
    classes,
    tuning: tuningJson as ContentDb['tuning'],
    merchant: { vendors },
    economy: economyJson,
    player: playerJson,
    roster: rosterJson as Roster,
    quests: [...(questsJson as QuestDef[]), ...(southQuests as QuestDef[]), ...(canonQuests as QuestDef[]), ...(phase2Quests as QuestDef[])],
    maps,
  };
}
