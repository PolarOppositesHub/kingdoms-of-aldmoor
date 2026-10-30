import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadContent } from './content';
import { conColor, formatCoin, xpLossFraction } from './formulas';
import { applyIntent } from './intents';
import { turnInPelts } from './systems';
import { bodyBlocked, placeName } from './map';
import { applyHero, createWorld, getPlayer } from './state';
import { step } from './step';
import type { MapData } from './types';
import hoffenderRaw from '../assets/hoffender.tmj?raw';
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
    const slot = state.inventory.findIndex((stack) => stack.itemId === 'bearded_handaxe');
    applyIntent(state, { type: 'equip', slot }, content, map);
    expect(state.equipment.primary).toBe('bearded_handaxe');
    const old = state.inventory.findIndex((stack) => stack.itemId === 'worn_axe');
    expect(old).toBeGreaterThanOrEqual(0);
    const before = state.copper;
    applyIntent(state, { type: 'sell', slot: old }, content, map);
    expect(state.copper).toBe(before + content.items.worn_axe.value);
    applyIntent(state, { type: 'buy', itemId: 'trail_ration' }, content, map);
    state.ui.panel = 'none';
    const ration = state.inventory.findIndex((stack) => stack.itemId === 'trail_ration');
    getPlayer(state).hp = 10;
    applyIntent(state, { type: 'use', slot: ration }, content, map);
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
    expect(first.ground.length + first.inventory.length).toBeGreaterThan(1);

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
    expect(state.actors.filter((actor) => actor.kind === 'npc')).toHaveLength(6);
    expect(state.actors.filter((actor) => actor.kind === 'mob').length).toBeGreaterThanOrEqual(8);
    expect(state.actors.some((actor) => actor.defId === 'brenna')).toBe(true);
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
    expect(applyHero(state, content, 'barbarian', 'wizard', bonus)).toBe(true);
    expect(applyHero(state, content, 'human', 'wizard', bonus)).toBe(false);
    const player = getPlayer(state);
    expect(player.sprite).toBe('wizard');
    expect(state.maxMana).toBeGreaterThan(20);
    expect(state.stats.int).toBe(content.classes.wizard.stats.int + content.roster.races[0].mods.int + 2);
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
    state.inventory.push({ itemId: 'wolf_pelt', qty: 4 });
    const xp = state.xp;
    turnInPelts(state, content, () => undefined);
    expect(state.quests.wolf_pelts.stage).toBe('done');
    expect(state.equipment.head).toBe('wolf_helm');
    expect(state.xp).toBeGreaterThan(xp);
    expect(state.inventory.some((stack) => stack.itemId === 'wolf_pelt')).toBe(false);
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
