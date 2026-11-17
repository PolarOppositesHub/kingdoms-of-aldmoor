import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadContent } from './content';
import { PNG } from 'pngjs';
import { conColor, formatCoin, maxFocus, maxHp, petStrike, xpLossFraction, xpToNext, xpYield } from './formulas';
import { applyIntent } from './intents';
import { askPrice, ivarIsBusy, mobRespawnDelay, resolveStrike, turnInPelts } from './systems';
import { addItem, countItem, findStack, moveItem } from './bags';
import { applySave, captureSave, migrateSave, normalizeLoadout } from './save';
import { classListLabel, classesForAbility } from './wear';
import { itemIconKey } from './icons';
import { bodyBlocked, nearestStand, placeName } from './map';
import { applyHero, blankActor, commitZone, configurePlayer, createWorld, getPlayer, refreshGear } from './state';
import abilitiesJson from '../content/abilities.json';
import iconMeta from '../assets/icons.json';
import { step } from './step';
import type { MapData } from './types';
import hoffenderRaw from '../assets/hoffender.tmj?raw';
import innRaw from '../assets/zones/inn.tmj?raw';
import warriorRaw from '../assets/zones/warrior.tmj?raw';
import wizardRaw from '../assets/zones/wizard.tmj?raw';
import barrowRaw from '../assets/zones/barrow.tmj?raw';
import frostfangRaw from '../assets/zones/frostfang.tmj?raw';
import { parseTiledMap, type TiledJson } from './map';

const content = loadContent();

function arena(): MapData {
  const width = 24;
  const height = 24;
  const collision = new Uint8Array(width * height);
  const safe = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) collision[y * width + x] = 1;
      if (x >= 1 && x <= 5 && y >= 1 && y <= 5) safe[y * width + x] = 1;
      if (x === 12 && y >= 8 && y <= 16) collision[y * width + x] = 1;
    }
  }
  return {
    width,
    height,
    tileWidth: 16,
    collision,
    safe,
    ground: new Uint16Array(width * height).fill(1),
    scenery: new Uint8Array(width * height),
    spawns: [],
    bind: { x: 40, y: 40 },
    zoneId: 'test',
    townName: 'Hoffender',
    wildsName: 'Frostmere Wilds',
  };
}

describe('formulas', () => {
  it('formats coin in tens', () => {
    expect(formatCoin(0)).toBe('0c');
    expect(formatCoin(14)).toBe('1s 4c');
    expect(formatCoin(50)).toBe('5s');
    expect(formatCoin(1234)).toBe('1p 2g 3s 4c');
  });

  it('uses the locked experience-loss table', () => {
    expect(xpLossFraction(1)).toBe(0);
    expect(xpLossFraction(4)).toBe(0);
    expect(xpLossFraction(5)).toBe(0.025);
    expect(xpLossFraction(9)).toBe(0.025);
    expect(xpLossFraction(10)).toBe(0.05);
  });

  it('colors relative level', () => {
    expect(conColor(1, 1)).toBe('white');
    expect(conColor(1, 2)).toBe('yellow');
    expect(conColor(1, 4)).toBe('red');
    expect(conColor(6, 2)).toBe('gray');
  });
});

describe('simulation', () => {
  it('stays serializable', () => {
    const state = createWorld(content, arena(), 1);
    expect(structuredClone(state).playerId).toBe('player');
  });

  it('slides along walls instead of entering them', () => {
    const map = arena();
    const state = createWorld(content, map, 2);
    const player = getPlayer(state);
    player.x = 24;
    player.y = 40;
    applyIntent(state, { type: 'move', x: -1, y: 0 }, content, map);
    for (let i = 0; i < 30; i++) step(state, content, map);
    expect(player.x).toBeGreaterThan(10);
    expect(bodyBlocked(map, player.x, player.y, 5, 3, false)).toBe(false);
  });

  it('paths around a wall', () => {
    const map = arena();
    const state = createWorld(content, map, 3);
    const player = getPlayer(state);
    player.x = 40;
    player.y = 12 * 16 + 8;
    applyIntent(state, { type: 'moveTo', x: 18 * 16 + 8, y: 12 * 16 + 8 }, content, map);
    for (let i = 0; i < 240; i++) step(state, content, map);
    expect(player.x).toBeGreaterThan(16 * 14);
  });

  it('buys, sells, and equips through intents', () => {
    const map = arena();
    map.spawns.push({ kind: 'npc', name: 'Brenna', x: 80, y: 80, defId: 'brenna', sprite: 'brenna' });
    const state = createWorld(content, map, 4);
    state.copper = 100;
    const brenna = state.actors.find((actor) => actor.defId === 'brenna');
    expect(brenna).toBeTruthy();
    state.ui = { panel: 'merchant', npcId: brenna!.id, nodeId: null, title: null, body: null };
    applyIntent(state, { type: 'buy', itemId: 'bearded_handaxe' }, content, map);
    expect(state.copper).toBe(57);
    const slot = findStack(state, 'bearded_handaxe');
    expect(slot).toBeTruthy();
    applyIntent(state, { type: 'equip', bag: slot!.bag, slot: slot!.slot }, content, map);
    expect(state.equipment.primary).toBe('bearded_handaxe');
    const old = findStack(state, 'worn_axe');
    expect(old).toBeTruthy();
    const before = state.copper;
    applyIntent(state, { type: 'sell', bag: old!.bag, slot: old!.slot }, content, map);
    expect(state.copper).toBe(before + content.items.worn_axe.value);
    applyIntent(state, { type: 'buy', itemId: 'trail_ration' }, content, map);
    state.ui.panel = 'none';
    const ration = findStack(state, 'trail_ration');
    expect(ration).toBeTruthy();
    getPlayer(state).hp = 10;
    applyIntent(state, { type: 'use', bag: ration!.bag, slot: ration!.slot }, content, map);
    expect(getPlayer(state).hp).toBe(28);
  });

  it('fights, loots, and socially pulls a second wolf', () => {
    const map = arena();
    map.spawns.push(
      { kind: 'mob', name: 'a', x: 160, y: 160, defId: 'young_wolf', sprite: 'young_wolf' },
      { kind: 'mob', name: 'b', x: 190, y: 170, defId: 'young_wolf', sprite: 'young_wolf' },
    );
    const first = createWorld(content, map, 11);
    const second = createWorld(content, map, 11);
    const wolf = first.actors.find((actor) => actor.kind === 'mob')!;
    const other = first.actors.filter((actor) => actor.kind === 'mob')[1];
    const player = getPlayer(first);
    player.hp = 200;
    player.maxHp = 200;
    player.x = wolf.x + 16;
    player.y = wolf.y;
    first.targetId = wolf.id;
    first.autoAttack = true;
    const events = applyIntent(first, { type: 'ability', id: 'kick' }, content, map);
    expect(events.some((event) => event.type === 'damage')).toBe(true);
    expect(wolf.hate.some((hate) => hate.id === 'player')).toBe(true);
    expect(other.hate.some((hate) => hate.id === 'player')).toBe(true);

    for (let i = 0; i < 500 && wolf.alive; i++) step(first, content, map);
    expect(wolf.alive).toBe(false);
    expect(first.xp).toBeGreaterThan(0);
    expect(first.ground.length + countItem(first, 'wolf_pelt') + countItem(first, 'wolf_tooth') + countItem(first, 'stringy_meat')).toBeGreaterThan(0);

    // Same seed and same opening kick produce the same remaining health.
    const firstWolfHpAfterKick = createWorld(content, map, 11);
    const a = firstWolfHpAfterKick.actors.find((actor) => actor.kind === 'mob')!;
    const p = getPlayer(firstWolfHpAfterKick);
    p.x = a.x + 16;
    p.y = a.y;
    firstWolfHpAfterKick.targetId = a.id;
    applyIntent(firstWolfHpAfterKick, { type: 'ability', id: 'kick' }, content, map);
    const mirror = createWorld(content, map, 11);
    const b = mirror.actors.find((actor) => actor.kind === 'mob')!;
    const q = getPlayer(mirror);
    q.x = b.x + 16;
    q.y = b.y;
    mirror.targetId = b.id;
    applyIntent(mirror, { type: 'ability', id: 'kick' }, content, map);
    expect(b.hp).toBe(a.hp);
  });

  it('does not aggro from inside the safe yard', () => {
    const map = arena();
    map.spawns.push({ kind: 'mob', name: 'a', x: 48, y: 48, defId: 'young_wolf', sprite: 'young_wolf' });
    const state = createWorld(content, map, 5);
    const player = getPlayer(state);
    player.x = 40;
    player.y = 40;
    expect(bodyBlocked(map, player.x, player.y, 5, 3, false)).toBe(false);
    for (let i = 0; i < 20; i++) step(state, content, map);
    const wolf = state.actors.find((actor) => actor.kind === 'mob')!;
    expect(wolf.hate).toEqual([]);
  });

  it('rejects a teleport unless debug is enabled', () => {
    const map = arena();
    const state = createWorld(content, map, 6);
    const player = getPlayer(state);
    const start = player.x;
    applyIntent(state, { type: 'debugTeleport', x: 200, y: 200 }, content, map);
    expect(player.x).toBe(start);
    state.debug = true;
    applyIntent(state, { type: 'debugTeleport', x: 200, y: 200 }, content, map);
    expect(player.x).toBe(200);
  });

  it('loads Hoffender with a warrior, a merchant, and wolves', () => {
    const map = parseTiledMap(JSON.parse(hoffenderRaw) as TiledJson);
    const state = createWorld(content, map, 7);
    const player = getPlayer(state);
    expect(bodyBlocked(map, player.x, player.y, 5, 3, false)).toBe(false);
    expect(map.width).toBe(256);
    expect(map.height).toBe(256);
    let trunks = 0;
    let bushes = 0;
    for (let i = 0; i < map.scenery.length; i++) {
      const kind = map.scenery[i];
      if (!kind) continue;
      expect(map.ground[i]).not.toBe(57);
      if (kind <= 9) {
        expect(map.collision[i]).toBe(1);
        trunks++;
      } else bushes++;
    }
    expect(trunks).toBeGreaterThan(800);
    expect(bushes).toBeGreaterThan(200);
    expect(state.actors.filter((actor) => actor.kind === 'npc').length).toBeGreaterThanOrEqual(7);
    expect(state.actors.some((actor) => actor.defId === 'brenna')).toBe(false);
    expect(state.actors.some((actor) => actor.defId === 'sigrun')).toBe(true);
    expect(state.actors.filter((actor) => actor.kind === 'mob' && !actor.dormant).length).toBeLessThanOrEqual(40);
    expect(state.actors.filter((actor) => actor.kind === 'mob').length).toBeGreaterThanOrEqual(8);
    for (let i = 0; i < 30; i++) step(state, content, map);
    expect(player.alive).toBe(true);
  });
});

describe('Hoffender and the Frostmere Wilds', () => {
  it('names the ground outside the gate and seats Jarl Freya where she can be reached', () => {
    const map = parseTiledMap(JSON.parse(hoffenderRaw) as TiledJson);
    expect(map.townName).toBe('Hoffender');
    expect(map.wildsName).toBe('Frostmere Wilds');
    expect(map.spawns.some((spawn) => spawn.kind === 'label' && spawn.name === 'Frostmere Wilds')).toBe(true);
    expect(map.spawns.some((spawn) => spawn.kind === 'label' && spawn.name === 'Hoffender')).toBe(true);
    expect(map.spawns.some((spawn) => spawn.kind === 'label' && spawn.name === 'Mead Hall')).toBe(true);

    const state = createWorld(content, map, 21);
    const player = getPlayer(state);
    expect(placeName(map, player.x, player.y)).toBe('Hoffender');

    const wildsLabel = map.spawns.find((spawn) => spawn.kind === 'label' && spawn.name === 'Frostmere Wilds');
    expect(wildsLabel).toBeTruthy();
    expect(placeName(map, wildsLabel!.x, wildsLabel!.y)).toBe('Frostmere Wilds');

    const freya = state.actors.find((actor) => actor.defId === 'freya');
    expect(freya?.name).toBe('Jarl Freya Halvarddottir');
    expect(bodyBlocked(map, freya!.x, freya!.y, 5, 3, false)).toBe(false);
    expect(placeName(map, freya!.x, freya!.y)).toBe('Hoffender');

    applyIntent(state, { type: 'talkTo', id: freya!.id }, content, map);
    for (let i = 0; i < 1200 && state.ui.panel !== 'dialogue'; i++) step(state, content, map);
    expect(state.ui.panel).toBe('dialogue');
    expect(state.ui.npcId).toBe(freya!.id);
    expect(state.ui.nodeId).toBe('start');
    expect(content.dialogue.freya.start.text).toMatch(/mead hall/i);
    expect(content.dialogue.freya.wilds.text).toMatch(/Frostmere Wilds/);
    expect(content.dialogue.soren.rule.text).toMatch(/Jarl Freya Halvarddottir/);
    expect(content.dialogue.soren.rule.text).toMatch(/guards answer to her word/i);

    applyIntent(state, { type: 'choice', index: 2 }, content, map);
    expect(state.ui.nodeId).toBe('wilds');
  });

  it('does not keep placeholder names for this wilds zone', () => {
    const files = ['src/content/dialogue.json', 'README.md', 'docs/design-doc-v0.2.md', 'index.html', 'src/ui/hud.ts', 'src/sim/state.ts'];
    for (const file of files) {
      const text = readFileSync(join(process.cwd(), file), 'utf8');
      expect(text, file).not.toMatch(/Hoffender Tundra|Grey Barrens|gathered families/);
    }
  });
});

describe('wizard and the pelt quest', () => {
  it('lets a barbarian wizard spend mana on a bolt and slow a pack', () => {
    const map = arena();
    map.spawns.push(
      { kind: 'mob', name: 'a', x: 16 * 16 + 8, y: 12 * 16 + 8, defId: 'young_wolf', sprite: 'young_wolf' },
      { kind: 'mob', name: 'b', x: 18 * 16 + 8, y: 12 * 16 + 8, defId: 'young_wolf', sprite: 'young_wolf' },
      { kind: 'mob', name: 'c', x: 40, y: 40, defId: 'young_wolf', sprite: 'young_wolf' },
    );
    const state = createWorld(content, map, 9);
    const bonus = { str: 0, sta: 0, agi: 0, dex: 0, wis: 0, int: 2, cha: 0 };
    expect(applyHero(state, content, 'barbarian', 'wizard', bonus)).toBe(false);
    expect(applyHero(state, content, 'human', 'wizard', bonus)).toBe(false);
    configurePlayer(state, content, 'wizard');
    state.baseStats.int += bonus.int + (content.roster.races.find((race) => race.id === 'barbarian')?.mods.int ?? 0);
    state.stats = { ...state.baseStats };
    refreshGear(state, content);
    const player = getPlayer(state);
    expect(player.sprite).toBe('body_m');
    expect(state.maxMana).toBeGreaterThan(20);
    expect(state.stats.int).toBe(content.classes.wizard.stats.int + content.roster.races[0].mods.int + 2 + (content.items.ash_staff.bonuses?.int ?? 0));
    const mana = state.mana;
    const near = state.actors.filter((actor) => actor.kind === 'mob' && actor.x > 100);
    player.x = 14 * 16 + 8;
    player.y = near[0].y;
    state.targetId = near[0].id;
    const before = near[0].hp;
    applyIntent(state, { type: 'ability', id: 'shardbolt' }, content, map);
    expect(state.mana).toBe(mana - 6);
    expect(near[0].hp).toBeLessThan(before);
    state.targetId = near[0].id;
    applyIntent(state, { type: 'ability', id: 'rimefield' }, content, map);
    expect(near[0].slowMs).toBeGreaterThan(0);
    expect(near[1].slowMs).toBeGreaterThan(0);
    expect(state.actors.find((actor) => actor.x === 40)?.slowMs).toBe(0);
    const blocked = state.mana;
    player.x = 8 * 16;
    player.y = 12 * 16;
    const far = near[0];
    far.x = 16 * 16;
    far.y = 12 * 16;
    state.targetId = far.id;
    applyIntent(state, { type: 'ability', id: 'shardbolt' }, content, map);
    expect(state.mana).toBe(blocked);
  });

  it('turns four pelts into a wolf helm', () => {
    const map = arena();
    const state = createWorld(content, map, 4);
    state.quests.wolf_pelts.stage = 'active';
    addItem(state, content, 'wolf_pelt', 4);
    const xp = state.xp;
    turnInPelts(state, content, () => undefined, 'helm');
    expect(state.quests.wolf_pelts.stage).toBe('done');
    expect(state.equipment.head).toBe('wolf_helm');
    expect(state.xp).toBeGreaterThan(xp);
    expect(countItem(state, 'wolf_pelt')).toBe(0);
  });
});

describe('gear and quests', () => {
  it('equips, describes, and can abandon the pelt quest without losing pelts', () => {
    for (const item of Object.values(content.items)) {
      expect(item.weight).toBeGreaterThan(0);
      expect(item.blurb.length).toBeGreaterThan(8);
    }
    const map = arena();
    const state = createWorld(content, map, 8);
    addItem(state, content, 'bearded_handaxe', 1);
    const slot = findStack(state, 'bearded_handaxe');
    expect(slot).toBeTruthy();
    applyIntent(state, { type: 'equip', bag: slot!.bag, slot: slot!.slot }, content, map);
    expect(state.equipment.primary).toBe('bearded_handaxe');
    expect(state.stats.str).toBe(state.baseStats.str + 1);
    applyIntent(state, { type: 'unequip', slot: 'primary' }, content, map);
    expect(state.equipment.primary).toBeNull();
    expect(findStack(state, 'bearded_handaxe')).toBeTruthy();

    state.quests.wolf_pelts.stage = 'active';
    addItem(state, content, 'wolf_pelt', 2);
    applyIntent(state, { type: 'abandonQuest', id: 'wolf_pelts' }, content, map);
    expect(state.quests.wolf_pelts.stage).toBe('none');
    expect(countItem(state, 'wolf_pelt')).toBe(2);
    expect(content.quests[0]?.reward).toMatch(/wolf-head helm/);
    expect(content.quests[0]?.reward).toMatch(/wolf-hide jerkin/);
  });
});

describe('armor shops', () => {
  const armor = Object.values(content.items).filter((item) => item.armorType);
  const slots = ['head', 'chest', 'hands', 'legs', 'feet', 'secondary'];

  it('stocks four tiers of plate, chain, leather, and cloth, and no scale yet', () => {
    expect(armor.some((item) => item.armorType === 'scale')).toBe(false);
    for (const type of ['plate', 'chain', 'leather', 'cloth'] as const) {
      for (const slot of slots) {
        const line = armor.filter((item) => item.armorType === type && item.slot === slot).sort((a, b) => (a.tier ?? 0) - (b.tier ?? 0));
        expect(line.map((item) => item.tier)).toEqual([1, 2, 3, 4]);
        for (let i = 1; i < line.length; i++) {
          expect(line[i].ac ?? 0).toBeGreaterThanOrEqual(line[i - 1].ac ?? 0);
          expect(line[i].weight).toBeGreaterThan(line[i - 1].weight);
          expect(line[i].value).toBeGreaterThan(line[i - 1].value);
        }
      }
    }
    const ivar = content.merchant.vendors.find((vendor) => vendor.npcId === 'ivar');
    const signe = content.merchant.vendors.find((vendor) => vendor.npcId === 'signe');
    const marta = content.merchant.vendors.find((vendor) => vendor.npcId === 'marta');
    expect(ivar?.stock).toHaveLength(36);
    expect(marta?.stock).toHaveLength(36);
    expect(signe?.stock.filter((row) => content.items[row.itemId].armorType)).toHaveLength(36);
    expect(signe?.stock.some((row) => content.items[row.itemId].kind === 'bag')).toBe(true);
    for (const row of ivar?.stock ?? []) {
      const item = content.items[row.itemId];
      expect(['plate', 'chain']).toContain(item.armorType);
      expect(row.price).toBe(item.value);
    }
    for (const row of signe?.stock ?? []) {
      const item = content.items[row.itemId];
      if (item.kind === 'bag') continue;
      expect(['cloth', 'leather']).toContain(item.armorType);
      expect(row.price).toBe(item.value);
    }
    expect(content.items.bronze_breastplate.value).toBeGreaterThan(content.items.bronze_chain_hauberk.value);
    expect(content.items.tattered_gloves.value).toBeLessThan(content.items.wool_robe.value);
  });

  it('lets a warrior wear plate and refuses it on a wizard', () => {
    const map = arena();
    const warrior = createWorld(content, map, 3);
    addItem(warrior, content, 'iron_helm', 1);
    const warriorHelm = findStack(warrior, 'iron_helm');
    applyIntent(warrior, { type: 'equip', bag: warriorHelm!.bag, slot: warriorHelm!.slot }, content, map);
    expect(warrior.equipment.head).toBe('iron_helm');

    const wizard = createWorld(content, map, 4);
    expect(applyHero(wizard, content, 'barbarian', 'wizard', { str: 0, sta: 0, agi: 0, dex: 0, wis: 0, int: 0, cha: 0 })).toBe(false);
    configurePlayer(wizard, content, 'wizard');
    addItem(wizard, content, 'iron_helm', 1);
    const wizardHelm = findStack(wizard, 'iron_helm');
    applyIntent(wizard, { type: 'equip', bag: wizardHelm!.bag, slot: wizardHelm!.slot }, content, map);
    expect(wizard.equipment.head).toBeNull();
    expect(wizard.log.at(-1)).toMatch(/Wizard cannot wear plate/);
    expect(findStack(wizard, 'iron_helm')).toBeTruthy();
  });

  it('gates a scale piece behind faction standing', () => {
    const map = arena();
    const state = createWorld(content, map, 5);
    content.items.scale_test = {
      id: 'scale_test',
      name: 'scale test',
      kind: 'armor',
      value: 10,
      stack: 1,
      blurb: 'test',
      weight: 1,
      slot: 'chest',
      ac: 18,
      armorType: 'scale',
      wearers: ['warrior', 'berserker'],
      faction: { id: 'zasariz', rank: 2 },
    };
    try {
      addItem(state, content, 'scale_test', 1);
      const held = findStack(state, 'scale_test');
      const slot = held!.slot;
      const bag = held!.bag;
      applyIntent(state, { type: 'equip', bag, slot }, content, map);
      expect(state.equipment.chest).toBe('cracked_leather_tunic');
      expect(state.log.at(-1)).toMatch(/zasariz standing 2/);
      state.factions.zasariz = 2;
      applyIntent(state, { type: 'equip', bag, slot }, content, map);
      expect(state.equipment.chest).toBe('scale_test');
    } finally {
      delete content.items.scale_test;
    }
  });
});

describe('save and classes', () => {
  it('rejects a barbarian wizard and migrates that save to a warrior', async () => {
    const { captureSave, migrateSave, applySave } = await import('./save');
    const map = arena();
    const state = createWorld(content, map, 11);
    expect(applyHero(state, content, 'barbarian', 'shaman', { str: 0, sta: 0, agi: 0, dex: 0, wis: 0, int: 0, cha: 0 })).toBe(true);
    expect(getPlayer(state).sprite).toBe('body_m');
    expect(state.maxMana).toBeGreaterThan(0);
    const raw = captureSave(state);
    raw.classId = 'wizard';
    raw.raceId = 'barbarian';
    raw.learned = ['shardbolt'];
    const migrated = migrateSave(raw);
    expect(migrated?.classId).toBe('warrior');
    expect(migrated?.learned).toEqual([]);
    expect(migrated?.note).toMatch(/Warrior/);
    const next = createWorld(content, map, 12);
    applySave(next, content, map, migrated);
    expect(next.classId).toBe('warrior');
  });
});

describe('hotbar, journal classes, and old saves', () => {
  it('names every class that can use a spell for sale', () => {
    expect(classesForAbility(content, 'quiet_mend')).toEqual(['cleric']);
    expect(classListLabel(content, 'quiet_mend')).toBe('Classes: Cleric');
    expect(classListLabel(content, 'small_grace')).toBe('Classes: Paladin');
    const ability = content.abilities.quiet_mend;
    const saved = ability.classes;
    ability.classes = ['cleric', 'paladin'];
    try {
      expect(classListLabel(content, 'quiet_mend')).toBe('Classes: Cleric, Paladin');
    } finally {
      ability.classes = saved;
    }
  });

  it('keeps a saved bar, clears a slot, and fills a bar the save never stored', () => {
    const map = arena();
    const state = createWorld(content, map, 21);
    applyIntent(state, { type: 'setLoadout', slots: ['heavy_swing', 'kick', '', '', ''] }, content, map);
    expect(state.loadout).toEqual(['heavy_swing', 'kick', '', '', '']);
    applyIntent(state, { type: 'setLoadout', slots: ['', 'kick', 'kick', 'missing', ''] }, content, map);
    expect(state.loadout).toEqual(['', 'kick', '', '', '']);

    const raw = captureSave(state);
    delete raw.loadout;
    const restored = createWorld(content, map, 22);
    applySave(restored, content, map, raw);
    expect(restored.loadout.slice(0, 2)).toEqual(['kick', 'heavy_swing']);
    expect(restored.loadout).toHaveLength(5);

    const kept = captureSave(state);
    kept.loadout = ['heavy_swing'];
    applySave(restored, content, map, kept);
    expect(restored.loadout).toEqual(['heavy_swing', '', '', '', '']);
    expect(normalizeLoadout(undefined, content, 'warrior', ['shoulder_rush'])[2]).toBe('shoulder_rush');
  });
});

describe('bags, charts, pets, and respawn', () => {
  it('starts with one sack, five ability slots, and no charts', () => {
    const state = createWorld(content, arena(), 1);
    expect(state.bags.filter(Boolean)).toHaveLength(1);
    expect(state.bags[0]?.slots).toHaveLength(4);
    expect(state.loadout.length).toBe(5);
    expect(state.loadout[0]).toBe('kick');
    expect(state.loadout.filter(Boolean).length).toBeGreaterThan(0);
    expect(state.charts).toEqual([]);
    expect(getPlayer(state).scale).toBeGreaterThan(1);
  });

  it('drags items between bag slots and keeps a flat save readable', () => {
    const map = arena();
    const state = createWorld(content, arena(), 2);
    addItem(state, content, 'canvas_haversack', 1);
    expect(state.bags[1]?.slots).toHaveLength(6);
    addItem(state, content, 'wolf_pelt', 3);
    const from = findStack(state, 'wolf_pelt');
    expect(from).toBeTruthy();
    const destBag = from!.bag === 0 ? 1 : 0;
    expect(moveItem(state, content, from!.bag, from!.slot, destBag, 0)).toBe(true);
    expect(state.bags[destBag]?.slots[0]?.itemId).toBe('wolf_pelt');
    const legacy = captureSave(state) as ReturnType<typeof captureSave> & { inventory?: { itemId: string; qty: number }[] };
    delete legacy.bags;
    legacy.version = 1;
    legacy.inventory = [{ itemId: 'trail_ration', qty: 2 }];
    const migrated = migrateSave(legacy);
    expect(migrated?.bags?.[0]?.slots.some((slot) => slot?.itemId === 'trail_ration' && slot.qty === 2)).toBe(true);
  });

  it('sells each region from a different mapmaker and discounts the smith', () => {
    const charts = content.merchant.vendors.filter((vendor) => vendor.stock.some((row) => content.items[row.itemId]?.kind === 'chart'));
    expect(charts.length).toBeGreaterThan(1);
    const all = Object.keys(content.maps);
    for (const vendor of charts) {
      const sold = vendor.stock.map((row) => content.items[row.itemId]?.chart).filter(Boolean);
      expect(sold.length).toBeGreaterThan(0);
      expect(sold.length).toBeLessThan(all.length);
    }
    const breast = content.merchant.vendors.find((vendor) => vendor.npcId === 'ivar')?.stock[0];
    expect(breast).toBeTruthy();
    expect(askPrice('ivar', breast!.price)).toBeLessThan(breast!.price);
    expect(askPrice('marta', breast!.price)).toBe(breast!.price);
    const state = createWorld(content, arena(), 9);
    state.timeMs = 0;
    const first = ivarIsBusy(state);
    let flipped = first;
    for (let bucket = 1; bucket < 12; bucket++) {
      state.timeMs = bucket * 20000;
      if (ivarIsBusy(state) !== first) flipped = !first;
    }
    expect(flipped).not.toBe(first);
    const common = mobRespawnDelay(state, content, false);
    const named = mobRespawnDelay(state, content, true);
    expect(common).toBeGreaterThanOrEqual(5 * 60 * 1000);
    expect(named).toBeGreaterThan(common - content.tuning.mobRespawnJitterMs);
    expect(content.tuning.namedRespawnMs).toBeGreaterThan(content.tuning.mobRespawnMs);
  });

  it('puts guild folk indoors, the smith at the forge, and named wolves in the wilds', () => {
    const raw = JSON.parse(hoffenderRaw) as TiledJson & { layers: { name: string; data?: number[] }[] };
    const map = parseTiledMap(raw);
    const warrior = parseTiledMap(JSON.parse(warriorRaw) as TiledJson);
    const wizard = parseTiledMap(JSON.parse(wizardRaw) as TiledJson);
    const inn = parseTiledMap(JSON.parse(innRaw) as TiledJson);
    const barrow = parseTiledMap(JSON.parse(barrowRaw) as TiledJson);
    const tileAt = (zone: ReturnType<typeof parseTiledMap>, x: number, y: number) => zone.ground[Math.floor(y / 16) * zone.width + Math.floor(x / 16)];
    const outdoors = createWorld(content, map, 4);
    expect(outdoors.actors.some((actor) => actor.defId === 'eirik')).toBe(false);
    expect(outdoors.actors.some((actor) => actor.defId === 'brenna')).toBe(false);
    const inside = createWorld(content, warrior, 4);
    const eirik = inside.actors.find((actor) => actor.defId === 'eirik');
    const ivar = outdoors.actors.find((actor) => actor.defId === 'ivar');
    const ingrid = createWorld(content, wizard, 4).actors.find((actor) => actor.defId === 'ingrid');
    const freya = outdoors.actors.find((actor) => actor.defId === 'freya');
    expect(tileAt(warrior, eirik!.x, eirik!.y)).toBe(45);
    expect(tileAt(inn, inn.spawns.find((spawn) => spawn.defId === 'hilda')!.x, inn.spawns.find((spawn) => spawn.defId === 'hilda')!.y)).toBe(45);
    expect(tileAt(map, ivar!.x, ivar!.y)).not.toBe(45);
    expect(map.ground.includes(45)).toBe(false);
    expect(ingrid!.scale).toBeLessThan(freya!.scale);
    expect(ingrid!.name).toBe('Ingrid Mire');
    expect(map.spawns.some((spawn) => spawn.defId === 'greymaw')).toBe(true);
    expect(map.spawns.some((spawn) => spawn.defId === 'mira_palehand')).toBe(true);
    expect(map.spawns.some((spawn) => spawn.kind === 'door' && spawn.toZone === 'inn')).toBe(true);
    expect(barrow.spawns.some((spawn) => spawn.defId === 'camp_leader')).toBe(true);
    expect(content.mobs.greymaw.named).toBe(true);
    expect(content.mobs.greymaw.loot.some((loot) => loot.itemId === 'greymaw_pelt_cloak' && loot.chance === 0.25)).toBe(true);
    expect(content.mobs.mira_palehand.named).toBe(true);
    expect(content.maps.hoffender.w).toBeGreaterThan(16);
    expect(content.maps.barrow.zone).toBe('barrow');
    const warden = createWorld(content, arena(), 6);
    configurePlayer(warden, content, 'warden');
    const pet = warden.actors.find((actor) => actor.pet);
    expect(pet).toBeTruthy();
    warden.targetId = 'nobody';
    applyIntent(warden, { type: 'pet', order: 'attack' }, content, arena());
    expect(warden.petOrder).toBe('follow');
    applyIntent(warden, { type: 'pet', order: 'stay' }, content, arena());
    expect(warden.petOrder).toBe('stay');
    expect(warden.petHold).toBeTruthy();

    const follower = createWorld(content, arena(), 8);
    configurePlayer(follower, content, 'warden');
    const hero = getPlayer(follower);
    const wolf = follower.actors.find((actor) => actor.pet);
    expect(wolf).toBeTruthy();
    const start = wolf!.x;
    for (let i = 0; i < 80; i++) {
      follower.input.x = 1;
      follower.input.y = 0;
      step(follower, content, arena());
    }
    expect(hero.x).toBeGreaterThan(start + 24);
    expect(wolf!.x).toBeGreaterThan(start + 12);
    expect(Math.abs(wolf!.x - hero.x)).toBeLessThan(80);

    const home = parseTiledMap(JSON.parse(hoffenderRaw) as TiledJson);
    const saved = createWorld(content, home, 9);
    const stale = captureSave(saved);
    stale.version = 2;
    stale.x = 8;
    stale.y = 8;
    applySave(saved, content, home, stale);
    const moved = getPlayer(saved);
    const spawn = home.spawns.find((entry) => entry.kind === 'spawn');
    expect(moved.x).toBe(spawn!.x);
    expect(moved.y).toBe(spawn!.y);
    const door = home.spawns.find((entry) => entry.kind === 'door' && entry.toZone === 'warrior');
    expect(door?.toX).toBeTypeOf('number');
    commitZone(saved, content, warrior, door!.toX!, door!.toY!);
    expect(saved.zoneId).toBe('warrior');
    expect(saved.actors.some((actor) => actor.defId === 'eirik')).toBe(true);
    expect(getPlayer(saved).pet === undefined || saved.actors.some((actor) => actor.id === 'player')).toBe(true);
  });
});

const bonus = { str: 0, sta: 0, agi: 0, dex: 0, wis: 0, int: 0, cha: 0 };

describe('levels, rest, and ability icons', () => {
  it('keeps the 1–9 curve and extends it through level 50', () => {
    expect(content.tuning.levelCap).toBe(50);
    expect(content.tuning.xpTable[9]).toBe(750);
    expect(xpToNext(content, 1)).toBe(70);
    expect(xpToNext(content, 10)).toBe(880);
    expect(xpToNext(content, 24)).toBe(3750);
    expect(xpToNext(content, 29)).toBe(5250);
    expect(xpToNext(content, 49)).toBe(13750);
    expect(xpToNext(content, 49)).toBeGreaterThan(xpToNext(content, 29));
    expect(content.tuning.xpTable).toHaveLength(50);
    const stats = content.classes.warrior.stats;
    expect(maxHp(content, 'warrior', 10, stats)).toBe(28 + 12 + 9 * 8);
    expect(maxHp(content, 'warrior', 11, stats)).toBe(28 + 12 + 10 * 8 + 4);
    expect(maxHp(content, 'warrior', 25, stats)).toBeGreaterThan(maxHp(content, 'warrior', 10, stats) + 14 * 8);
    expect(maxFocus(content, 'rogue', 1)).toBe(84);
    expect(maxFocus(content, 'rogue', 25)).toBe(80 + 4 * 25);
    expect(maxFocus(content, 'warrior', 10)).toBe(0);
  });

  it('pays nothing for gray quarry and keeps Frostmere at levels 1–10', () => {
    expect(xpYield(1, 1, 38)).toBe(38);
    expect(xpYield(10, 7, 100)).toBe(50);
    expect(xpYield(20, 10, 280)).toBe(0);
    const wilds = parseTiledMap(JSON.parse(hoffenderRaw) as TiledJson);
    for (const spawn of wilds.spawns) {
      if (spawn.kind !== 'mob') continue;
      const level = content.mobs[spawn.defId].level;
      expect(level).toBeGreaterThanOrEqual(1);
      expect(level).toBeLessThanOrEqual(10);
    }
    expect(content.mobs.vargan_frostfang.level).toBe(20);
  });

  it('levels past 10 without handing out drills, and still reads an old save', () => {
    const map = arena();
    const blocked = createWorld(content, map, 4);
    applyIntent(blocked, { type: 'debugGrantXp', amount: 20000 }, content, map);
    expect(blocked.level).toBe(1);

    const state = createWorld(content, map, 4);
    state.debug = true;
    applyIntent(state, { type: 'debugGrantXp', amount: 20000 }, content, map);
    expect(state.level).toBeGreaterThan(10);
    expect(state.level).toBeLessThan(25);
    expect(state.xp).toBeGreaterThan(0);
    expect(state.learned).not.toContain('shoulder_rush');
    expect(state.loadout).not.toContain('shoulder_rush');
    expect(getPlayer(state).maxHp).toBe(maxHp(content, 'warrior', state.level, state.stats));

    const capped = createWorld(content, map, 9);
    capped.level = 10;
    capped.xp = 40;
    capped.learned = ['sundering_chop', 'shoulder_rush'];
    getPlayer(capped).level = 10;
    const save = captureSave(capped);
    expect(save).not.toHaveProperty('sitting');
    const restored = createWorld(content, map, 9);
    applySave(restored, content, map, save);
    expect(restored.level).toBe(10);
    expect(restored.xp).toBe(40);
    expect(restored.sitting).toBe(false);
    expect(restored.learned).toEqual(['sundering_chop', 'shoulder_rush']);
  });

  it('sells later drills from the guild trainer at their value, locked until that level', () => {
    const trainers: [string, string, string[]][] = [
      ['eirik', 'warrior', ['shoulder_rush', 'second_wind', 'oath_axe']],
      ['torunn', 'shaman', ['peat_bind', 'cinder_mend', 'ashen_circle']],
      ['sable', 'rogue', ['hamstring', 'night_step', 'kingsbane']],
      ['hroth', 'berserker', ['red_sweep', 'war_blood', 'last_howl']],
      ['bjorn', 'warden', ['pack_call', 'deep_root', 'elder_mend']],
      ['ingrid', 'wizard', ['ice_needle', 'rime_wall', 'starfall']],
    ];
    for (const [npcId, classId, abilityIds] of trainers) {
      const vendor = content.merchant.vendors.find((entry) => entry.npcId === npcId);
      expect(vendor, npcId).toBeTruthy();
      const priced = abilityIds.map((id) => {
        const ability = content.abilities[id];
        expect(ability?.classId).toBe(classId);
        expect(ability.level).toBeGreaterThanOrEqual(12);
        const item = Object.values(content.items).find((entry) => entry.teaches === id);
        expect(item, id).toBeTruthy();
        const row = vendor?.stock.find((entry) => entry.itemId === item?.id);
        expect(row?.price).toBe(item?.value);
        expect(row?.price ?? 0).toBeGreaterThan(100);
        return row?.price ?? 0;
      });
      expect(priced[0]).toBeLessThan(priced[1]);
      expect(priced[1]).toBeLessThan(priced[2]);
    }

    const hall = parseTiledMap(JSON.parse(warriorRaw) as TiledJson);
    const state = createWorld(content, hall, 6);
    const eirik = state.actors.find((actor) => actor.defId === 'eirik');
    expect(eirik).toBeTruthy();
    const player = getPlayer(state);
    player.x = eirik!.x;
    player.y = eirik!.y + 10;
    applyIntent(state, { type: 'talkTo', id: eirik!.id }, content, hall);
    applyIntent(state, { type: 'choice', index: 1 }, content, hall);
    expect(state.ui.panel).toBe('merchant');
    state.copper = 5000;
    applyIntent(state, { type: 'buy', itemId: 'scroll_rush' }, content, hall);
    expect(state.learned).not.toContain('shoulder_rush');
    expect(state.copper).toBe(5000);
    expect(state.log.at(-1)).toMatch(/level 12/);
    state.level = 12;
    player.level = 12;
    applyIntent(state, { type: 'buy', itemId: 'scroll_rush' }, content, hall);
    expect(state.learned).toContain('shoulder_rush');
    expect(state.copper).toBe(5000 - 220);
    applyIntent(state, { type: 'buy', itemId: 'scroll_wind' }, content, hall);
    expect(state.learned).not.toContain('second_wind');
    expect(state.copper).toBe(5000 - 220);
    state.level = 18;
    player.level = 18;
    applyIntent(state, { type: 'buy', itemId: 'scroll_wind' }, content, hall);
    expect(state.learned).toContain('second_wind');
    expect(state.copper).toBe(5000 - 220 - 352);
    expect(content.abilities.second_wind.level).toBe(18);
    expect(content.abilities.shoulder_rush.level).toBe(12);
  });

  it('regens a trickle while standing and much faster while sitting', () => {
    const map = arena();
    const state = createWorld(content, map, 11);
    expect(applyHero(state, content, 'barbarian', 'shaman', bonus)).toBe(true);
    const player = getPlayer(state);
    const run = (sitting: boolean) => {
      player.hp = 10;
      state.mana = 0;
      state.regenBank = 0;
      state.manaRegenBank = 0;
      state.sitting = sitting;
      for (let i = 0; i < 90; i++) step(state, content, map);
      return { hp: player.hp, mana: state.mana };
    };
    const sitting = run(true);
    const standing = run(false);
    expect(sitting.mana).toBeGreaterThan(standing.mana + 3);
    expect(sitting.hp).toBeGreaterThan(standing.hp + 4);
    expect(standing.mana).toBeLessThan(2);
  });

  it('stands up when moving, casting, swinging, or being hit', () => {
    const map = arena();
    const state = createWorld(content, map, 12);
    expect(applyHero(state, content, 'barbarian', 'shaman', bonus)).toBe(true);
    const player = getPlayer(state);
    state.sitting = true;
    applyIntent(state, { type: 'move', x: 1, y: 0 }, content, map);
    expect(state.sitting).toBe(false);

    state.sitting = true;
    state.input.x = 0;
    applyIntent(state, { type: 'ability', id: 'frostbind' }, content, map);
    expect(state.sitting).toBe(false);

    player.x = 200;
    player.y = 200;
    const wolf = blankActor({
      id: 'mob_hit',
      kind: 'mob',
      defId: 'wolf',
      name: 'wolf',
      sprite: 'wolf',
      x: 208,
      y: 200,
      hp: 40,
      maxHp: 40,
      level: 2,
    });
    state.actors.push(wolf);
    state.sitting = true;
    resolveStrike(state, content, map, wolf, player, { n: 1, sides: 1, bonus: 4 }, 40, true, 'bites', () => undefined);
    expect(state.sitting).toBe(false);
    expect(player.hp).toBeLessThan(player.maxHp);

    state.sitting = true;
    state.autoAttack = true;
    state.targetId = wolf.id;
    player.attackMs = 1;
    step(state, content, map);
    expect(state.sitting).toBe(false);
  });

  it('draws a distinct icon for every ability', () => {
    const png = PNG.sync.read(readFileSync(join(process.cwd(), 'src', 'assets', 'icons.png')));
    const frames = iconMeta.frames as Record<string, { x: number; y: number; w: number; h: number }>;
    const seen = new Set<string>();
    const hashOf = (id: string) => {
      const frame = frames[id];
      expect(frame, id).toBeTruthy();
      const bytes: number[] = [];
      for (let y = 0; y < frame.h; y++) {
        for (let x = 0; x < frame.w; x++) {
          const i = ((frame.y + y) * png.width + (frame.x + x)) * 4;
          bytes.push(png.data[i], png.data[i + 1], png.data[i + 2], png.data[i + 3]);
        }
      }
      return bytes.join(',');
    };
    for (const ability of abilitiesJson as { id: string }[]) {
      const hash = hashOf(ability.id);
      expect(seen.has(hash), ability.id).toBe(false);
      seen.add(hash);
    }
    const scrolls = Object.values(content.items).filter((item) => item.teaches);
    expect(scrolls.length).toBeGreaterThan(4);
    const scrollHashes = new Set<string>();
    for (const item of scrolls) {
      const hash = hashOf(item.id);
      expect(scrollHashes.has(hash), item.id).toBe(false);
      scrollHashes.add(hash);
      expect(seen.has(hash), item.id).toBe(false);
    }
  });
});

describe('pet window commands', () => {
  it('dismisses and calls the wolf without breaking an old save', () => {
    const map = arena();
    const warden = createWorld(content, map, 6);
    configurePlayer(warden, content, 'warden');
    const foe = blankActor({
      id: 'foe',
      kind: 'mob',
      defId: 'young_wolf',
      name: 'young wolf',
      sprite: 'wolf',
      x: 80,
      y: 80,
      hp: 20,
      maxHp: 20,
      level: 1,
      social: 'wolf',
      pet: false,
    });
    warden.actors.push(foe);
    warden.targetId = foe.id;
    applyIntent(warden, { type: 'pet', order: 'attack' }, content, map);
    expect(warden.petOrder).toBe('attack');
    applyIntent(warden, { type: 'pet', order: 'stay' }, content, map);
    expect(warden.petOrder).toBe('stay');
    applyIntent(warden, { type: 'pet', order: 'backoff' }, content, map);
    expect(warden.petOrder).toBe('backoff');
    applyIntent(warden, { type: 'pet', order: 'follow' }, content, map);
    expect(warden.petOrder).toBe('follow');
    applyIntent(warden, { type: 'pet', order: 'taunt' }, content, map);
    expect(warden.petOrder).toBe('follow');
    expect(foe!.hate.some((hate) => hate.id === 'pet_wolf')).toBe(false);

    applyIntent(warden, { type: 'pet', order: 'dismiss' }, content, map);
    expect(warden.petAway).toBe(true);
    expect(warden.actors.some((actor) => actor.pet)).toBe(false);
    expect(warden.petOrder).toBe('follow');
    const saved = captureSave(warden);
    expect(saved.petAway).toBe(true);
    const resumed = createWorld(content, map, 6);
    applySave(resumed, content, map, saved);
    expect(resumed.petAway).toBe(true);
    expect(resumed.actors.some((actor) => actor.pet)).toBe(false);

    applyIntent(resumed, { type: 'pet', order: 'call' }, content, map);
    const wolf = resumed.actors.find((actor) => actor.pet);
    expect(wolf?.alive).toBe(true);
    expect(resumed.petAway).toBe(false);
    expect(resumed.petOrder).toBe('follow');

    const legacy = captureSave(resumed);
    delete legacy.petAway;
    legacy.version = 2;
    const migrated = migrateSave(legacy);
    expect(migrated?.petAway).toBe(false);
    const restored = createWorld(content, map, 4);
    applySave(restored, content, map, legacy);
    expect(restored.petAway).toBe(false);
    expect(restored.actors.some((actor) => actor.pet)).toBe(true);

    content.mobs.warden_wolf.petTaunt = true;
    try {
      const taunter = createWorld(content, map, 3);
      configurePlayer(taunter, content, 'warden');
      const mob = blankActor({
        id: 'foe',
        kind: 'mob',
        defId: 'young_wolf',
        name: 'young wolf',
        sprite: 'wolf',
        x: 90,
        y: 90,
        hp: 20,
        maxHp: 20,
        level: 2,
        social: '',
        pet: false,
      });
      taunter.actors.push(mob);
      taunter.targetId = mob.id;
      applyIntent(taunter, { type: 'pet', order: 'taunt' }, content, map);
      expect(mob!.hate.some((hate) => hate.id === 'pet_wolf')).toBe(true);
    } finally {
      delete content.mobs.warden_wolf.petTaunt;
    }
  });
});

describe('old save item pictures', () => {
  it('resolves every worn and bagged item from a version 1 pack to an icon', () => {
    const map = arena();
    const state = createWorld(content, map, 4);
    const stats = { str: 14, sta: 12, agi: 10, dex: 10, wis: 8, int: 8, cha: 8 };
    const legacy = {
      version: 1,
      savedAt: 1,
      zoneId: 'hoffender',
      x: 8,
      y: 8,
      facing: 's' as const,
      raceId: 'barbarian',
      classId: 'warrior',
      sex: 'male' as const,
      level: 3,
      xp: 12,
      hp: 40,
      mana: 0,
      focus: 0,
      copper: 30,
      baseStats: stats,
      inventory: [
        { itemId: 'wolf_pelt', qty: 4 },
        { itemId: 'wool_bandage', qty: 2 },
        { itemId: 'bearded_handaxe', qty: 1 },
        { itemId: 'wolf_helm', qty: 1 },
      ],
      equipment: {
        head: null,
        chest: 'cracked_leather_tunic',
        hands: null,
        legs: 'cracked_leather_pants',
        feet: 'cracked_leather_boots',
        primary: 'worn_axe',
        secondary: 'rusty_iron_shield',
      },
      quests: { wolf_pelts: { stage: 'active' as const, progress: 1 } },
      learned: ['kick'],
      loadout: ['kick'],
      factions: {},
    };
    applySave(state, content, map, legacy);
    expect(state.equipment.primary).toBe('worn_axe');
    expect(state.equipment.chest).toBe('cracked_leather_tunic');
    expect(state.bags[0]?.itemId).toBe('threadbare_sack');
    const held = state.bags[0]?.slots.map((slot) => slot?.itemId).filter((id): id is string => Boolean(id)) ?? [];
    expect(held).toEqual(['wolf_pelt', 'wool_bandage', 'bearded_handaxe', 'wolf_helm']);
    const shown = [state.bags[0]!.itemId, ...held, ...Object.values(state.equipment).filter((id): id is string => Boolean(id))];
    const frames = iconMeta.frames as Record<string, { w: number; h: number }>;
    for (const id of shown) {
      const key = itemIconKey(id, frames);
      expect(key, id).toBe(id);
      expect(frames[key!].w).toBeGreaterThan(0);
      expect(frames[key!].h).toBeGreaterThan(0);
    }
    const fresh = captureSave(state);
    applySave(createWorld(content, map, 5), content, map, fresh);
  });
});

describe('Frostfang Reach', () => {
  const home = parseTiledMap(JSON.parse(hoffenderRaw) as TiledJson);
  const fang = parseTiledMap(JSON.parse(frostfangRaw) as TiledJson);

  it('is a full zone on the far side of the Frostmere ridge, with a road back', () => {
    expect(fang.width).toBeGreaterThanOrEqual(256);
    expect(fang.height).toBeGreaterThanOrEqual(256);
    expect(fang.zoneId).toBe('frostfang');
    expect(fang.wildsName).toBe('Frostfang Reach');
    expect(fang.townName).toBe('Hearthpass');
    const outbound = home.spawns.find((spawn) => spawn.kind === 'door' && spawn.toZone === 'frostfang');
    const inbound = fang.spawns.find((spawn) => spawn.kind === 'door' && spawn.toZone === 'hoffender');
    expect(outbound?.toX).toBeTypeOf('number');
    expect(inbound?.toX).toBeTypeOf('number');
    expect(Math.hypot(outbound!.toX! - inbound!.x, outbound!.toY! - inbound!.y)).toBeGreaterThan(14);
    expect(Math.hypot(inbound!.toX! - outbound!.x, inbound!.toY! - outbound!.y)).toBeGreaterThan(14);
    expect(fang.spawns.some((spawn) => spawn.defId === 'kara')).toBe(true);
    expect(fang.spawns.some((spawn) => spawn.defId === 'orm')).toBe(true);
    expect(fang.spawns.some((spawn) => spawn.defId === 'vargan_frostfang')).toBe(true);
    expect(content.mobs.vargan_frostfang.level).toBe(20);
    expect(content.mobs.vargan_frostfang.named).toBe(true);
    for (const id of ['grimhild', 'ashjaw', 'skarn']) {
      expect(content.mobs[id].named, id).toBe(true);
      expect(content.mobs[id].rare, id).toBe(true);
    }
    expect(content.tuning.rareRespawnMs).toBeGreaterThan(content.tuning.namedRespawnMs + content.tuning.namedRespawnJitterMs);

    const tileY = (spawn: { y: number }) => Math.floor(spawn.y / fang.tileWidth);
    const mobsAt = (pred: (y: number) => boolean) =>
      fang.spawns.filter((spawn) => spawn.kind === 'mob' && pred(tileY(spawn)));
    for (const spawn of mobsAt((y) => y > 210)) expect(content.mobs[spawn.defId].level).toBeLessThanOrEqual(12);
    for (const spawn of mobsAt((y) => y < 40)) expect(content.mobs[spawn.defId].level).toBeGreaterThanOrEqual(18);
    expect(conColor(10, content.mobs.highland_wolf.level)).toBe('white');
    expect(conColor(10, content.mobs.ogre_scout.level)).toBe('yellow');
    expect(conColor(10, content.mobs.ogre_raider.level)).toBe('red');
    expect(conColor(15, content.mobs.ogre_clubber.level)).toBe('white');
    expect(conColor(15, content.mobs.highland_wolf.level)).toBe('gray');
    expect(conColor(18, content.mobs.rime_ogre.level)).toBe('white');
    expect(conColor(18, content.mobs.fang_guard.level)).toBe('yellow');
    expect(conColor(20, content.mobs.vargan_frostfang.level)).toBe('white');

    const camp = fang.spawns.find((spawn) => spawn.defId === 'kara');
    expect(placeName(fang, camp!.x, camp!.y)).toBe('Hearthpass');
    const gate = fang.spawns.find((spawn) => spawn.kind === 'spawn');
    expect(placeName(fang, gate!.x, gate!.y)).toBe('Frostfang Reach');

    let xp = 0;
    for (const spawn of fang.spawns) {
      if (spawn.kind === 'mob') xp += content.mobs[spawn.defId].xp;
    }
    for (const quest of content.quests) {
      if (['the_open_road', 'pass_wolves', 'ogre_scouts', 'grimhilds_toll', 'tarn_shards', 'one_tusk', 'the_fang'].includes(quest.id)) {
        xp += quest.rewardXp ?? 0;
      }
    }
    let need = 0;
    for (let level = 10; level < 20; level++) need += xpToNext(content, level);
    expect(xp).toBeGreaterThan(need);
    expect(content.maps.hearthpass.zone).toBe('frostfang');
    expect(content.maps.the_fang.w).toBeGreaterThan(16);
    expect(content.merchant.vendors.find((vendor) => vendor.npcId === 'kara')?.stock.some((row) => row.itemId === 'chart_fang')).toBe(true);
  });

  it('walks an old save through the ridge and back', () => {
    const outbound = home.spawns.find((spawn) => spawn.kind === 'door' && spawn.toZone === 'frostfang');
    const inbound = fang.spawns.find((spawn) => spawn.kind === 'door' && spawn.toZone === 'hoffender');
    expect(outbound && inbound).toBeTruthy();

    const legacy = {
      version: 1,
      savedAt: 1,
      zoneId: 'hoffender',
      x: 200,
      y: 200,
      facing: 's' as const,
      raceId: 'barbarian',
      classId: 'warrior',
      sex: 'male' as const,
      level: 10,
      xp: 40,
      hp: 80,
      mana: 0,
      focus: 0,
      copper: 30,
      baseStats: { str: 14, sta: 12, agi: 10, dex: 10, wis: 8, int: 6, cha: 8 },
      inventory: [{ itemId: 'wolf_pelt', qty: 2 }],
      equipment: {
        head: null,
        chest: 'cracked_leather_tunic',
        hands: null,
        legs: null,
        feet: 'cracked_leather_boots',
        primary: 'worn_axe',
        secondary: null,
      },
      quests: { wolf_pelts: { stage: 'active' as const, progress: 2 } },
      learned: ['kick'],
      loadout: ['kick', 'heavy_swing'],
      factions: {},
    };
    const arrived = createWorld(content, home, 4);
    applySave(arrived, content, home, legacy);
    expect(arrived.quests.wolf_pelts.stage).toBe('active');
    expect(arrived.quests.the_open_road.stage).toBe('none');
    expect(arrived.bindZone).toBe('hoffender');
    expect(arrived.level).toBe(10);
    const spawn = home.spawns.find((entry) => entry.kind === 'spawn');
    expect(getPlayer(arrived).x).toBe(spawn!.x);

    const state = createWorld(content, home, 5);
    const current = captureSave(state);
    current.version = 3;
    current.level = 10;
    current.x = outbound!.x;
    current.y = outbound!.y + 48;
    delete current.bindZone;
    delete current.bindX;
    delete current.bindY;
    applySave(state, content, home, current);
    const player = getPlayer(state);
    expect(player.x).toBe(outbound!.x);
    expect(player.y).toBe(outbound!.y + 48);
    expect(state.bindZone).toBe('hoffender');

    player.x = outbound!.x;
    player.y = outbound!.y;
    state.portalLockMs = 0;
    const leaving = step(state, content, home);
    const gone = leaving.find((event) => event.type === 'zone');
    expect(gone).toMatchObject({ type: 'zone', zoneId: 'frostfang' });
    if (gone?.type !== 'zone') return;
    commitZone(state, content, fang, gone.x, gone.y);
    expect(state.zoneId).toBe('frostfang');
    expect(state.actors.some((actor) => actor.defId === 'kara')).toBe(true);
    expect(placeName(fang, getPlayer(state).x, getPlayer(state).y)).toBe('Frostfang Reach');

    const hero = getPlayer(state);
    hero.x = inbound!.x;
    hero.y = inbound!.y;
    state.portalLockMs = 0;
    state.ui.panel = 'none';
    const returning = step(state, content, fang);
    expect(returning.find((event) => event.type === 'zone')).toMatchObject({ type: 'zone', zoneId: 'hoffender' });
  });

  it('lets Kara bind the fire, and a level 15 still stands up to a clubber', () => {
    const state = createWorld(content, fang, 8);
    const kara = state.actors.find((actor) => actor.defId === 'kara');
    const player = getPlayer(state);
    expect(kara).toBeTruthy();
    player.x = kara!.x;
    player.y = kara!.y + 12;
    applyIntent(state, { type: 'talkTo', id: kara!.id }, content, fang);
    const index = content.dialogue.kara.start.choices.findIndex((choice) => choice.action === 'bind');
    expect(index).toBeGreaterThanOrEqual(0);
    applyIntent(state, { type: 'choice', index }, content, fang);
    expect(state.bindZone).toBe('frostfang');
    expect(state.log.at(-1)).toMatch(/Hearthpass/);

    state.zoneId = 'hoffender';
    state.dead = true;
    state.deathMs = 0;
    const events = step(state, content, fang);
    expect(events.find((event) => event.type === 'zone')).toMatchObject({ type: 'zone', zoneId: 'frostfang' });
    expect(state.log.at(-1)).toMatch(/Hearthpass/);

    const pit = arena();
    const fight = createWorld(content, pit, 3);
    fight.level = 15;
    const hero = getPlayer(fight);
    hero.level = 15;
    refreshGear(fight, content);
    hero.hp = hero.maxHp;
    hero.x = 160;
    hero.y = 176;
    const def = content.mobs.ogre_clubber;
    const mob = blankActor({
      id: 'clubber',
      kind: 'mob',
      defId: 'ogre_clubber',
      name: def.name,
      sprite: 'ogre_brute',
      x: 176,
      y: 176,
      hp: def.hp,
      maxHp: def.hp,
      level: def.level,
      social: 'ogre',
    });
    fight.actors.push(mob);
    fight.targetId = mob.id;
    fight.autoAttack = true;
    mob.hate = [{ id: hero.id, amount: 20 }];
    hero.attackMs = 0;
    for (let i = 0; i < 30 * 40; i++) step(fight, content, pit);
    expect(mob.hp).toBeLessThan(def.hp);
    expect(hero.alive).toBe(true);
    expect(hero.hp).toBeGreaterThan(0);
  });
});

describe('Eldenmoor, the road south, and the Black Ice', () => {
  const zoneDir = join(process.cwd(), 'src', 'assets', 'zones');
  const maps = new Map<string, ReturnType<typeof parseTiledMap>>();
  maps.set('hoffender', parseTiledMap(JSON.parse(hoffenderRaw) as TiledJson));
  for (const file of readdirSync(zoneDir).filter((name) => name.endsWith('.tmj'))) {
    const map = parseTiledMap(JSON.parse(readFileSync(join(zoneDir, file), 'utf8')) as TiledJson);
    maps.set(map.zoneId, map);
  }

  function reachable(start: string): Set<string> {
    const seen = new Set<string>();
    const queue = [start];
    while (queue.length) {
      const id = queue.pop();
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const map = maps.get(id);
      if (!map) continue;
      for (const spawn of map.spawns) {
        if (spawn.kind === 'door' && spawn.toZone && maps.has(spawn.toZone)) queue.push(spawn.toZone);
      }
    }
    return seen;
  }

  it('can be walked from Hoffender and from Eldenmoor, both ways', () => {
    expect(maps.has('eldenmoor')).toBe(true);
    expect(maps.has('thornhaven')).toBe(true);
    expect(maps.has('valdoria')).toBe(true);
    expect(maps.has('blackice1')).toBe(true);
    expect(maps.has('blackice3')).toBe(true);
    const fromHoffender = reachable('hoffender');
    const fromElden = reachable('eldenmoor');
    for (const id of maps.keys()) {
      expect(fromHoffender.has(id), id).toBe(true);
      expect(fromElden.has(id), id).toBe(true);
    }
    for (const map of maps.values()) {
      for (const door of map.spawns) {
        if (door.kind !== 'door' || !door.toZone || door.toX === undefined || door.toY === undefined) continue;
        const dest = maps.get(door.toZone);
        expect(dest, `${map.zoneId} -> ${door.toZone}`).toBeTruthy();
        expect(bodyBlocked(dest!, door.toX, door.toY, 5, 3, false), `${door.name} lands blocked`).toBe(false);
        for (const back of dest!.spawns) {
          if (back.kind !== 'door' || back.toZone !== map.zoneId) continue;
          expect(Math.hypot(back.x - door.toX, back.y - door.toY)).toBeGreaterThan(14);
        }
      }
    }
  });

  it('keeps level bands that follow the roads', () => {
    const levels = (zoneId: string, pred: (spawn: { y: number }) => boolean = () => true) =>
      maps.get(zoneId)!.spawns.filter((spawn) => spawn.kind === 'mob' && pred(spawn)).map((spawn) => content.mobs[spawn.defId].level);
    const elden = maps.get('eldenmoor')!;
    for (const level of levels('eldenmoor', (spawn) => spawn.y < 150 * 16)) {
      expect(level).toBeGreaterThanOrEqual(1);
      expect(level).toBeLessThanOrEqual(10);
    }
    expect(levels('eldenmoor', (spawn) => spawn.y > 160 * 16)).toHaveLength(0);
    for (const level of levels('thornhaven')) {
      expect(level).toBeGreaterThanOrEqual(10);
      expect(level).toBeLessThanOrEqual(18);
    }
    for (const level of levels('valdoria')) {
      expect(level).toBeGreaterThanOrEqual(16);
      expect(level).toBeLessThanOrEqual(26);
    }
    for (const level of levels('blackice1')) expect(level).toBeGreaterThanOrEqual(21);
    for (const level of levels('blackice3')) expect(level).toBeGreaterThanOrEqual(23);
    expect(content.mobs.ysolde.level).toBe(28);
    expect(content.mobs.ysolde.name).toBe('Ysolde of the Black Ice');
    expect(content.mobs.ysolde_black_ice.name).toBe('Rimeheart Shade');
    expect(elden.zoneId).toBe('eldenmoor');
    expect(elden.width).toBeGreaterThanOrEqual(256);
    expect(maps.get('thornhaven')!.width).toBeGreaterThanOrEqual(256);
    expect(maps.get('valdoria')!.width).toBeGreaterThanOrEqual(256);
    expect(maps.get('blackice1')!.spawns.some((spawn) => spawn.defId === 'anwen')).toBe(true);
    expect(maps.get('blackice3')!.spawns.some((spawn) => spawn.defId === 'ysolde')).toBe(true);
    const race = content.roster.races.find((entry) => entry.id === 'high_elf');
    expect(race?.playable).toBe(true);
    expect(content.roster.classes.find((entry) => entry.id === 'wizard')?.races).toContain('high_elf');
    const spawn = elden.spawns.find((entry) => entry.kind === 'spawn');
    expect(spawn?.x).toBe(race?.homeX);
    expect(spawn?.y).toBe(race?.homeY);
  });

  it('raises the cap to 50 without teaching the new drills, and keeps an old save', () => {
    expect(xpLossFraction(10)).toBe(0.05);
    expect(xpLossFraction(19)).toBe(0.05);
    expect(xpLossFraction(20)).toBe(0.075);
    expect(xpLossFraction(29)).toBe(0.075);
    expect(xpLossFraction(30)).toBe(0.1);
    expect(xpLossFraction(39)).toBe(0.1);
    expect(xpLossFraction(40)).toBe(0.125);
    expect(xpLossFraction(49)).toBe(0.125);
    expect(xpLossFraction(50)).toBe(0.15);
    expect(conColor(30, 30)).toBe('white');
    expect(conColor(30, 26)).toBe('gray');
    expect(conColor(30, 27)).toBe('green');
    expect(conColor(30, 33)).toBe('red');
    expect(maxHp(content, 'warrior', 30, content.classes.warrior.stats)).toBeGreaterThan(maxHp(content, 'warrior', 25, content.classes.warrior.stats));
    expect(maxFocus(content, 'rogue', 30)).toBe(80 + 4 * 30);

    const map = arena();
    const state = createWorld(content, map, 4);
    state.debug = true;
    applyIntent(state, { type: 'debugGrantXp', amount: 500000 }, content, map);
    expect(state.level).toBe(50);
    expect(state.learned).not.toContain('cleaving_oath');
    expect(state.learned).not.toContain('black_rime');
    expect(state.learned).not.toContain('last_wall');
    expect(state.learned).not.toContain('last_winter');

    const legacy = {
      version: 3,
      savedAt: 4,
      zoneId: 'hoffender',
      x: 400,
      y: 400,
      facing: 's' as const,
      raceId: 'barbarian',
      classId: 'warrior',
      sex: 'male' as const,
      level: 12,
      xp: 40,
      hp: 90,
      mana: 0,
      focus: 0,
      copper: 80,
      baseStats: { str: 14, sta: 12, agi: 10, dex: 10, wis: 8, int: 6, cha: 8 },
      bags: [{ itemId: 'bag_small', slots: [{ itemId: 'wolf_pelt', qty: 2 }, null, null, null] }],
      equipment: {
        head: null,
        chest: 'cracked_leather_tunic',
        hands: null,
        legs: null,
        feet: 'cracked_leather_boots',
        primary: 'worn_axe',
        secondary: null,
        ranged: null,
      },
      quests: { wolf_pelts: { stage: 'done' as const, progress: 4 }, the_fang: { stage: 'active' as const, progress: 0 } },
      learned: ['kick', 'shoulder_rush'],
      loadout: ['kick', 'shoulder_rush'],
      charts: ['hoffender'],
      petOrder: 'follow' as const,
      factions: {},
      bindZone: 'hoffender',
      bindX: 320,
      bindY: 480,
    };
    const restored = createWorld(content, map, 8);
    applySave(restored, content, map, legacy);
    expect(restored.level).toBe(12);
    expect(restored.xp).toBe(40);
    expect(restored.bindZone).toBe('hoffender');
    expect(restored.bind).toEqual({ x: 320, y: 480 });
    expect(restored.learned).toEqual(['kick', 'shoulder_rush']);
    expect(restored.quests.wolf_pelts.stage).toBe('done');
    expect(restored.quests.the_fang.stage).toBe('active');
    expect(restored.quests.cold_mouth.stage).toBe('none');
    expect(restored.quests.weald_wolves.stage).toBe('none');
    expect(restored.raceId).toBe('barbarian');

    const born = createWorld(content, map, 3);
    const events = applyIntent(born, {
      type: 'createHero',
      raceId: 'high_elf',
      classId: 'wizard',
      bonus: { str: 0, sta: 0, agi: 0, dex: 0, wis: 0, int: 0, cha: 0 },
    }, content, map);
    expect(born.raceId).toBe('high_elf');
    expect(born.classId).toBe('wizard');
    expect(born.bindZone).toBe('eldenmoor');
    expect(events.find((event) => event.type === 'zone')).toMatchObject({ type: 'zone', zoneId: 'eldenmoor', x: 1256, y: 3278 });
    expect(applyHero(createWorld(content, map, 1), content, 'barbarian', 'wizard', { str: 0, sta: 0, agi: 0, dex: 0, wis: 0, int: 0, cha: 0 })).toBe(false);

    const hall = parseTiledMap(JSON.parse(warriorRaw) as TiledJson);
    const buyer = createWorld(content, hall, 6);
    const eirik = buyer.actors.find((actor) => actor.defId === 'eirik');
    const player = getPlayer(buyer);
    player.x = eirik!.x;
    player.y = eirik!.y + 10;
    buyer.level = 29;
    player.level = 29;
    buyer.copper = 5000;
    applyIntent(buyer, { type: 'talkTo', id: eirik!.id }, content, hall);
    applyIntent(buyer, { type: 'choice', index: 1 }, content, hall);
    applyIntent(buyer, { type: 'buy', itemId: 'scroll_cleave' }, content, hall);
    expect(buyer.learned).not.toContain('cleaving_oath');
    expect(buyer.log.at(-1)).toMatch(/level 30/);
    buyer.level = 30;
    player.level = 30;
    applyIntent(buyer, { type: 'buy', itemId: 'scroll_cleave' }, content, hall);
    expect(buyer.learned).toContain('cleaving_oath');
    expect(content.abilities.cleaving_oath.level).toBe(30);
    expect(content.abilities.black_rime.level).toBe(30);
    expect(content.abilities.iron_guard.classId).toBe('warrior');
  });

  it('lets a high elf of each open class be created, reach an Eldenmoor trainer, and keep the save', () => {
    const bonus = { str: 0, sta: 0, agi: 0, dex: 0, wis: 0, int: 0, cha: 0 };
    const open = [
      ['wizard', 'maeriel', '', 'scroll_lance'],
      ['cleric', 'selne', 'scroll_quiet_mend', 'scroll_grave_lamp'],
      ['enchanter', 'miris', 'scroll_hush', 'scroll_borrowed_will'],
      ['paladin', 'adel', 'scroll_small_grace', 'scroll_vow_mend'],
      ['magician', 'quen', 'scroll_cinder_bolt', 'scroll_ember_star'],
    ] as const;
    expect(content.roster.classes.find((entry) => entry.id === 'shaman')?.races).toEqual(['barbarian']);
    expect(content.roster.classes.find((entry) => entry.id === 'warden')?.races).toEqual(['barbarian']);
    for (const id of ['warrior', 'rogue', 'berserker']) {
      expect(content.roster.classes.find((entry) => entry.id === id)?.races).toEqual(['barbarian', 'dwarf']);
    }
    for (const closed of ['warrior', 'shaman', 'rogue', 'warden', 'berserker']) {
      expect(applyHero(createWorld(content, arena(), 1), content, 'high_elf', closed, bonus)).toBe(false);
    }
    expect(applyHero(createWorld(content, arena(), 1), content, 'barbarian', 'warrior', bonus)).toBe(true);

    const migrated = migrateSave({
      version: 3,
      savedAt: 1,
      zoneId: 'eldenmoor',
      x: 100,
      y: 100,
      facing: 's',
      raceId: 'high_elf',
      classId: 'warrior',
      sex: 'female',
      level: 4,
      xp: 10,
      hp: 40,
      mana: 0,
      focus: 0,
      copper: 20,
      baseStats: { str: 13, sta: 11, agi: 11, dex: 11, wis: 9, int: 8, cha: 8 },
      bags: [{ itemId: 'threadbare_sack', slots: [null, null, null, null] }],
      equipment: {
        head: null,
        chest: 'rusty_iron_breastplate',
        hands: null,
        legs: null,
        feet: null,
        primary: 'worn_axe',
        secondary: null,
      },
      quests: { wolf_pelts: { stage: 'none', progress: 0 } },
      learned: ['kick'],
      loadout: ['kick'],
      charts: [],
      petOrder: 'follow',
      factions: {},
      bindZone: 'eldenmoor',
      bindX: 1256,
      bindY: 3278,
    });
    expect(migrated?.classId).toBe('wizard');
    expect(migrated?.loadout).toEqual(['shardbolt', 'rimefield']);
    expect(migrated?.learned).toEqual([]);
    expect(migrated?.equipment.chest).toBeNull();
    expect(migrated?.note).toMatch(/Wizard/);
    expect(migrated?.bindZone).toBe('eldenmoor');

    const city = maps.get('eldenmoor');
    expect(city).toBeTruthy();
    for (const [classId, trainerId, starterScroll, laterScroll] of open) {
      const races = classId === 'cleric' || classId === 'paladin' ? ['high_elf', 'dwarf'] : ['high_elf'];
      expect(content.roster.classes.find((entry) => entry.id === classId)?.races).toEqual(races);
      const door = city!.spawns.find((spawn) => spawn.kind === 'door' && spawn.toZone === `elden_${classId}`);
      expect(door?.toX, classId).toBeTypeOf('number');
      const hall = maps.get(`elden_${classId}`);
      expect(hall, classId).toBeTruthy();
      const state = createWorld(content, arena(), 4);
      const events = applyIntent(state, { type: 'createHero', raceId: 'high_elf', classId, bonus }, content, arena());
      expect(events.find((event) => event.type === 'zone')).toMatchObject({ type: 'zone', zoneId: 'eldenmoor' });
      expect(state.raceId).toBe('high_elf');
      expect(state.classId).toBe(classId);
      expect(state.bindZone).toBe('eldenmoor');
      expect(state.bind).toEqual({ x: 1256, y: 3278 });
      const later = content.items[laterScroll];
      expect(content.abilities[later.teaches!].level).toBeGreaterThan(1);
      if (starterScroll) {
        expect(content.abilities[content.items[starterScroll].teaches!].level).toBe(1);
        expect(state.learned).not.toContain(content.items[starterScroll].teaches);
      } else {
        expect(state.learned).not.toContain('shardbolt');
        expect(content.classes.wizard.abilities).toContain('shardbolt');
      }
      commitZone(state, content, hall!, door!.toX!, door!.toY!);
      const trainer = state.actors.find((actor) => actor.defId === trainerId);
      expect(trainer, trainerId).toBeTruthy();
      const player = getPlayer(state);
      player.x = trainer!.x;
      player.y = trainer!.y + 8;
      state.copper = 8000;
      applyIntent(state, { type: 'talkTo', id: trainer!.id }, content, hall!);
      applyIntent(state, { type: 'choice', index: 0 }, content, hall!);
      expect(state.ui.panel).toBe('merchant');
      applyIntent(state, { type: 'buy', itemId: laterScroll }, content, hall!);
      expect(state.learned).not.toContain(later.teaches);
      expect(state.log.at(-1)).toMatch(/level/);
      if (starterScroll) {
        applyIntent(state, { type: 'buy', itemId: starterScroll }, content, hall!);
        expect(state.learned).toContain(content.items[starterScroll].teaches);
      }
      const save = captureSave(state);
      const restored = createWorld(content, hall!, 9);
      applySave(restored, content, hall!, save);
      expect(restored.raceId).toBe('high_elf');
      expect(restored.classId).toBe(classId);
      expect(restored.bindZone).toBe('eldenmoor');
      expect(restored.bind).toEqual({ x: 1256, y: 3278 });
      if (starterScroll) expect(restored.learned).toContain(content.items[starterScroll].teaches);
      else expect(restored.classId).toBe('wizard');
    }
  });

  it('calls an ember for a magician and mends a cleric', () => {
    const bonus = { str: 0, sta: 0, agi: 0, dex: 0, wis: 0, int: 0, cha: 0 };
    const map = arena();
    const mage = createWorld(content, map, 5);
    applyIntent(mage, { type: 'createHero', raceId: 'high_elf', classId: 'magician', bonus }, content, map);
    expect(mage.actors.some((actor) => actor.pet)).toBe(false);
    mage.learned = ['call_ember', 'cinder_bolt'];
    mage.loadout = ['call_ember', 'cinder_bolt'];
    mage.mana = mage.maxMana;
    applyIntent(mage, { type: 'ability', id: 'call_ember' }, content, map);
    const ember = mage.actors.find((actor) => actor.pet);
    expect(ember?.defId).toBe('ember_wisp');
    expect(ember?.alive).toBe(true);
    const foe = blankActor({
      id: 'foe',
      kind: 'mob',
      defId: 'young_wolf',
      name: 'young wolf',
      sprite: 'wolf',
      x: ember!.x + 20,
      y: ember!.y,
      hp: 30,
      maxHp: 30,
      level: 1,
      social: 'wolf',
    });
    mage.actors.push(foe);
    mage.targetId = foe.id;
    applyIntent(mage, { type: 'pet', order: 'attack' }, content, map);
    expect(mage.petOrder).toBe('attack');
    expect(mage.petFocus).toBe(foe.id);
    const saved = captureSave(mage);
    const loaded = createWorld(content, map, 6);
    applySave(loaded, content, map, saved);
    expect(loaded.classId).toBe('magician');
    expect(loaded.actors.some((actor) => actor.pet && actor.defId === 'ember_wisp')).toBe(true);

    const cleric = createWorld(content, map, 7);
    applyIntent(cleric, { type: 'createHero', raceId: 'high_elf', classId: 'cleric', bonus }, content, map);
    cleric.learned = ['quiet_mend'];
    cleric.loadout = ['quiet_mend'];
    cleric.mana = cleric.maxMana;
    const body = getPlayer(cleric);
    body.hp = 5;
    applyIntent(cleric, { type: 'ability', id: 'quiet_mend' }, content, map);
    expect(body.hp).toBeGreaterThan(5);
    expect(cleric.equipment.chest).toBe('rusty_iron_breastplate');
  });
});

describe('Brightforge, Wyrmrest, and the cap at 50', () => {
  const zoneDir = join(process.cwd(), 'src', 'assets', 'zones');
  const maps = new Map<string, ReturnType<typeof parseTiledMap>>();
  maps.set('hoffender', parseTiledMap(JSON.parse(hoffenderRaw) as TiledJson));
  for (const file of readdirSync(zoneDir).filter((name) => name.endsWith('.tmj'))) {
    const map = parseTiledMap(JSON.parse(readFileSync(join(zoneDir, file), 'utf8')) as TiledJson);
    maps.set(map.zoneId, map);
  }
  const bonus = { str: 0, sta: 0, agi: 0, dex: 0, wis: 0, int: 0, cha: 0 };

  it('opens Brightforge to dwarves and keeps the other race rules', () => {
    const race = content.roster.races.find((entry) => entry.id === 'dwarf');
    expect(race?.playable).toBe(true);
    expect(race?.homeZone).toBe('brightforge');
    const city = maps.get('brightforge');
    expect(city?.width).toBeGreaterThanOrEqual(256);
    const spawn = city?.spawns.find((entry) => entry.kind === 'spawn');
    expect(spawn?.x).toBe(race?.homeX);
    expect(spawn?.y).toBe(race?.homeY);
    for (const id of ['warrior', 'cleric', 'paladin', 'rogue', 'berserker']) {
      expect(applyHero(createWorld(content, arena(), 2), content, 'dwarf', id, bonus)).toBe(true);
    }
    for (const id of ['shaman', 'warden', 'wizard', 'enchanter', 'magician']) {
      expect(applyHero(createWorld(content, arena(), 3), content, 'dwarf', id, bonus)).toBe(false);
    }
    expect(applyHero(createWorld(content, arena(), 4), content, 'barbarian', 'cleric', bonus)).toBe(false);
    expect(applyHero(createWorld(content, arena(), 5), content, 'barbarian', 'paladin', bonus)).toBe(false);
    const born = createWorld(content, arena(), 6);
    const events = applyIntent(born, { type: 'createHero', raceId: 'dwarf', classId: 'warrior', bonus }, content, arena());
    expect(born.bindZone).toBe('brightforge');
    expect(events.find((event) => event.type === 'zone')).toMatchObject({ type: 'zone', zoneId: 'brightforge' });
    const slopes = city!.spawns.filter((spawn) => spawn.kind === 'mob').map((spawn) => content.mobs[spawn.defId].level);
    expect(slopes.length).toBeGreaterThan(10);
    for (const level of slopes) {
      expect(level).toBeGreaterThanOrEqual(1);
      expect(level).toBeLessThanOrEqual(10);
    }
    expect(content.mobs.kragg.named).toBe(true);
    expect(content.mobs.old_slate.rare).toBe(true);
    expect(maps.get('brightforge')!.spawns.some((spawn) => spawn.kind === 'seam' && spawn.name === 'Ashdeep')).toBe(true);
    expect(maps.get('brightforge')!.spawns.some((spawn) => spawn.kind === 'seam' && spawn.name === 'Veilspire')).toBe(true);
  });

  it('sails to Eldenmoor and climbs from Wyrmrest to Vyrmathax', () => {
    const valdoria = maps.get('valdoria')!;
    const elden = maps.get('eldenmoor')!;
    expect(valdoria.spawns.some((spawn) => spawn.kind === 'door' && spawn.toZone === 'eldenmoor')).toBe(true);
    expect(elden.spawns.some((spawn) => spawn.kind === 'door' && spawn.toZone === 'valdoria')).toBe(true);
    expect(valdoria.spawns.some((spawn) => spawn.kind === 'door' && spawn.toZone === 'eldenmoor' && spawn.y < 140 * 16)).toBe(true);
    expect(elden.spawns.some((spawn) => spawn.toZone === 'valdoria' && spawn.y < 40 * 16)).toBe(false);
    const hoffender = maps.get('hoffender')!;
    expect(hoffender.spawns.some((spawn) => spawn.kind === 'door' && spawn.toZone === 'wyrmrest')).toBe(true);
    expect(hoffender.spawns.some((spawn) => spawn.kind === 'seam' && spawn.name === 'Wyrmrest')).toBe(false);
    for (const [zone, lo, hi] of [
      ['ashfall', 30, 37],
      ['scalded', 36, 43],
      ['spires', 42, 50],
    ] as const) {
      const levels = maps.get(zone)!.spawns.filter((spawn) => spawn.kind === 'mob').map((spawn) => content.mobs[spawn.defId].level);
      expect(levels.length, zone).toBeGreaterThan(8);
      for (const level of levels) {
        expect(level, zone).toBeGreaterThanOrEqual(lo);
        expect(level, zone).toBeLessThanOrEqual(hi);
      }
      expect(maps.get(zone)!.width).toBeGreaterThanOrEqual(256);
    }
    expect(content.mobs.korrag.name).toBe('Korrag the Scorched');
    expect(content.mobs.skreeva.name).toBe('Skreeva');
    expect(content.mobs.vyrmathax.level).toBe(50);
    expect(content.mobs.vyrmathax.name).toBe('Vyrmathax the Elder');
    expect(maps.get('spires')!.spawns.some((spawn) => spawn.kind === 'seam' && spawn.name === 'Deeper Lair')).toBe(true);
    expect(maps.get('wyrmrest')!.width).toBeGreaterThanOrEqual(256);
    expect(maps.get('ashfall')!.spawns.some((spawn) => spawn.kind === 'door' && spawn.toZone === 'scalded')).toBe(true);
    expect(maps.get('scalded')!.spawns.some((spawn) => spawn.kind === 'door' && spawn.toZone === 'spires')).toBe(true);
    const safe = (zone: string) => maps.get(zone)!.safe.some((cell) => cell !== 0);
    expect(safe('wyrmrest')).toBe(true);
    expect(safe('ashfall')).toBe(true);
    expect(safe('scalded')).toBe(true);
    expect(safe('thornhaven')).toBe(true);
    expect(safe('valdoria')).toBe(true);
  });

  it('sells a level 50 drill only after the level, and scales a pet', () => {
    const hall = maps.get('bright_warrior');
    expect(hall).toBeTruthy();
    const buyer = createWorld(content, hall!, 6);
    applyIntent(buyer, { type: 'createHero', raceId: 'dwarf', classId: 'warrior', bonus }, content, hall!);
    commitZone(buyer, content, hall!, hall!.spawns.find((spawn) => spawn.kind === 'spawn')!.x, hall!.spawns.find((spawn) => spawn.kind === 'spawn')!.y);
    const trainer = buyer.actors.find((actor) => actor.defId === 'brim');
    expect(trainer).toBeTruthy();
    const player = getPlayer(buyer);
    player.x = trainer!.x;
    player.y = trainer!.y + 8;
    buyer.level = 49;
    player.level = 49;
    buyer.copper = 5000;
    applyIntent(buyer, { type: 'talkTo', id: trainer!.id }, content, hall!);
    applyIntent(buyer, { type: 'choice', index: 0 }, content, hall!);
    expect(buyer.ui.panel).toBe('merchant');
    applyIntent(buyer, { type: 'buy', itemId: 'scroll_last_wall' }, content, hall!);
    expect(buyer.learned).not.toContain('last_wall');
    expect(buyer.log.at(-1)).toMatch(/level 50/);
    buyer.level = 50;
    player.level = 50;
    applyIntent(buyer, { type: 'buy', itemId: 'scroll_last_wall' }, content, hall!);
    expect(buyer.learned).toContain('last_wall');
    expect(content.abilities.last_wall.level).toBe(50);
    for (const classId of ['warrior', 'shaman', 'rogue', 'berserker', 'warden', 'wizard', 'cleric', 'enchanter', 'paladin', 'magician']) {
      const top = Object.values(content.abilities).filter((ability) => ability.classId === classId).map((ability) => ability.level);
      expect(Math.max(...top), classId).toBe(50);
    }
    const wolf = content.mobs.warden_wolf;
    const young = petStrike(wolf.damage, wolf.attack, 1);
    const grown = petStrike(wolf.damage, wolf.attack, 50);
    expect(grown.attack).toBeGreaterThan(young.attack);
    expect(grown.damage.bonus).toBeGreaterThan(young.damage.bonus);
    const warden = createWorld(content, arena(), 8);
    applyIntent(warden, { type: 'createHero', raceId: 'barbarian', classId: 'warden', bonus }, content, arena());
    const cub = warden.actors.find((actor) => actor.pet);
    expect(cub?.level).toBe(1);
    warden.level = 20;
    getPlayer(warden).level = 20;
    warden.xp = 0;
    // Level-up from 20 is not how the pet hears it; grant the rest of the climb.
    warden.debug = true;
    applyIntent(warden, { type: 'debugGrantXp', amount: 500000 }, content, arena());
    const elder = warden.actors.find((actor) => actor.pet);
    expect(elder?.level).toBe(50);
    expect(elder!.maxHp).toBeGreaterThan(cub!.maxHp);
  });

  it('moves a hero off a removed tile and keeps old saves', () => {
    const map = maps.get('thornhaven')!;
    let blockedX = 0;
    let blockedY = 0;
    for (let ty = 2; ty < map.height - 2 && blockedX === 0; ty++) {
      for (let tx = 2; tx < map.width - 2; tx++) {
        const x = tx * map.tileWidth + 8;
        const y = ty * map.tileWidth + 14;
        if (bodyBlocked(map, x, y, 5, 3, false)) {
          blockedX = x;
          blockedY = y;
          break;
        }
      }
    }
    expect(blockedX).toBeGreaterThan(0);
    const legacy = {
      version: 3,
      savedAt: 9,
      zoneId: 'thornhaven',
      x: blockedX,
      y: blockedY,
      facing: 's' as const,
      raceId: 'barbarian',
      classId: 'warrior',
      sex: 'male' as const,
      level: 14,
      xp: 12,
      hp: 80,
      mana: 0,
      focus: 0,
      copper: 40,
      baseStats: { str: 14, sta: 12, agi: 10, dex: 10, wis: 8, int: 6, cha: 8 },
      bags: [{ itemId: 'threadbare_sack', slots: [null, null, null, null] }],
      equipment: {
        head: null,
        chest: 'cracked_leather_tunic',
        hands: null,
        legs: null,
        feet: null,
        primary: 'worn_axe',
        secondary: null,
      },
      quests: { wolf_pelts: { stage: 'done' as const, progress: 4 } },
      learned: ['kick'],
      loadout: ['kick'],
      charts: ['hoffender'],
      petOrder: 'follow' as const,
      factions: {},
      bindZone: 'thornhaven',
      bindX: 320,
      bindY: 480,
    };
    const moved = createWorld(content, map, 11);
    applySave(moved, content, map, legacy);
    const body = getPlayer(moved);
    expect(bodyBlocked(map, body.x, body.y, 5, 3, false)).toBe(false);
    expect(nearestStand(map, blockedX, blockedY)).toEqual({ x: body.x, y: body.y });
    expect(moved.level).toBe(14);
    expect(moved.raceId).toBe('barbarian');
    expect(moved.bindZone).toBe('thornhaven');

    const v1 = migrateSave({
      version: 1,
      savedAt: 1,
      zoneId: 'hoffender',
      x: 100,
      y: 100,
      facing: 's',
      raceId: 'barbarian',
      classId: 'warrior',
      sex: 'male',
      level: 3,
      xp: 5,
      hp: 40,
      mana: 0,
      focus: 0,
      copper: 10,
      baseStats: { str: 14, sta: 12, agi: 10, dex: 10, wis: 8, int: 6, cha: 8 },
      inventory: [{ itemId: 'wolf_pelt', qty: 1 }],
      equipment: {
        head: null,
        chest: null,
        hands: null,
        legs: null,
        feet: null,
        primary: 'worn_axe',
        secondary: null,
      },
      quests: {},
      learned: [],
      loadout: ['kick'],
      charts: [],
      factions: {},
    });
    expect(v1?.classId).toBe('warrior');
    expect(v1?.raceId).toBe('barbarian');
    expect(v1?.level).toBe(3);
  });
});

describe('sim boundary', () => {
  it('does not reach for Phaser, wall-clock time, or Math.random', () => {
    const dir = join(process.cwd(), 'src', 'sim');
    const files = readdirSync(dir).filter((file) => file.endsWith('.ts') && !file.endsWith('.test.ts'));
    for (const file of files) {
      const text = readFileSync(join(dir, file), 'utf8');
      expect(text).not.toMatch(/phaser/i);
      expect(text).not.toMatch(/Math\.random/);
      expect(text).not.toMatch(/Date\.now/);
    }
  });
});
