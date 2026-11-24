/**
 * Furnishings for halls and placeholder rooms.
 * Horses are props that share sprite ids with src/content/mounts.json.
 * They are not rideable.
 */
import { TILE } from './frostmere-map.mjs';
import mounts from '../src/content/mounts.json' with { type: 'json' };
import { TOWN_FOLK } from './town-folk.mjs';

const HORSE = Object.fromEntries(mounts.mounts.map((mount) => [mount.race, mount.sprite]));

function feet(tx, ty) {
  return { x: tx * TILE + 8, y: ty * TILE + 14 };
}

export function roomKind(id, purpose = '') {
  const hint = purpose.toLowerCase();
  if (hint.includes('tavern')) return 'tavern';
  if (hint.includes('stable')) return 'stable';
  if (hint.includes('smith')) return 'smith';
  if (/store|pantry|cloth|silk/.test(hint)) return 'store';
  if (/shrine|chapel|temple/.test(hint)) return 'temple';
  if (hint.includes('guild')) return 'guild';
  if (hint) return 'house';
  const s = id.toLowerCase();
  if (/inn|mead|tavern/.test(s)) return 'tavern';
  if (/smith/.test(s) || (s.includes('forge') && !s.startsWith('room_'))) return 'smith';
  if (s.includes('stable')) return 'stable';
  if (/shop|goods|needles|store/.test(s)) return 'store';
  if (/cleric|chapel|shrine|temple/.test(s)) return 'temple';
  if (/warrior|wizard|enchanter|paladin|magician|shaman|rogue|berserker|warden|druid|ranger|bough|guild|oath/.test(s)) return 'guild';
  return 'house';
}

function styleRace(style, town) {
  if (style === 'elf') return 'high_elf';
  if (style === 'wood') return 'wood_elf';
  if (style === 'dwarf') return 'dwarf';
  if (style === 'ogre') return 'ogre';
  if (style === 'timber' || /hoffender|hearth|frost/i.test(town)) return 'barbarian';
  return 'human';
}

function putProp(map, name, sprite, tx, ty, block) {
  if (!map.ground[ty] || map.ground[ty][tx] === undefined) return false;
  if (map.solid[ty][tx]) return false;
  const at = feet(tx, ty);
  if (map.objects.some((obj) => Math.hypot(obj.x - at.x, obj.y - at.y) < 10)) return false;
  map.objects.push({ kind: 'prop', name, sprite, x: at.x, y: at.y, decor: true });
  if (block) map.solid[ty][tx] = 1;
  return true;
}

function layout(kind, race) {
  const horse = HORSE[race] ?? HORSE.human;
  if (kind === 'tavern') {
    return [
      ['bar', 'bar', 3, 3, true],
      ['stool', 'stool', 3, 4, false],
      ['stool', 'stool', 5, 4, false],
      ['table', 'table', 9, 3, true],
      ['chair', 'chair', 8, 4, false],
      ['chair', 'chair', 10, 4, false],
      ['keg', 'keg', 2, 6, true],
      ['keg', 'keg', 11, 6, true],
    ];
  }
  if (kind === 'smith') {
    return [
      ['forge', 'forge', 10, 3, true],
      ['anvil', 'anvil', 4, 4, true],
      ['quench', 'quench', 11, 5, true],
      ['rack', 'rack', 3, 3, true],
      ['shield', 'shield_prop', 7, 3, true],
      ['armor', 'armor_stand', 6, 6, true],
    ];
  }
  if (kind === 'stable') {
    return [
      ['stall', 'stallpost', 3, 3, true],
      ['stall', 'stallpost', 6, 3, true],
      ['hay', 'hay', 4, 6, false],
      ['trough', 'trough', 8, 5, true],
      ['mount', horse, 4, 4, true],
      ['mount', horse, 9, 4, true],
    ];
  }
  if (kind === 'store') {
    return [
      ['shelf', 'shelf', 3, 3, true],
      ['shelf', 'shelf', 9, 3, true],
      ['crate', 'crate', 4, 5, true],
      ['crate', 'crate', 10, 5, true],
      ['barrel', 'barrel', 6, 6, true],
    ];
  }
  if (kind === 'temple') {
    return [
      ['altar', 'altar', 6, 3, true],
      ['candle', 'candle', 4, 3, true],
      ['candle', 'candle', 9, 3, true],
      ['candle', 'candle', 5, 5, false],
      ['banner', 'banner', 10, 5, false],
    ];
  }
  if (kind === 'guild') {
    return [
      ['rack', 'rack', 3, 3, true],
      ['table', 'table', 8, 3, true],
      ['chair', 'chair', 8, 5, false],
      ['banner', 'banner', 11, 3, true],
      ['shield', 'shield_prop', 5, 3, true],
    ];
  }
  return [
    ['table', 'table', 4, 3, true],
    ['chair', 'chair', 4, 5, false],
    ['crate', 'crate', 9, 4, true],
    ['shelf', 'shelf', 10, 3, true],
  ];
}

const DRINKERS = TOWN_FOLK.filter((person) => person.town === 'tavern');

function addDrinkers(map, race) {
  const people = DRINKERS.filter((person) => person.race === race).slice(0, 2);
  const spots = [
    [3, 5],
    [9, 5],
  ];
  people.forEach((person, index) => {
    const [tx, ty] = spots[index] ?? [4, 6];
    if (!map.ground[ty] || map.solid[ty][tx]) return;
    const at = feet(tx, ty);
    map.objects.push({
      kind: 'npc',
      name: person.id,
      defId: person.id,
      sprite: person.sprite,
      x: at.x,
      y: at.y,
      ambient: true,
    });
  });
}

function dressOne(map, kind, race) {
  if (!map.ground || map.ground.length > 40) return;
  if (map.objects.some((obj) => obj.decor)) return;
  for (const [name, sprite, tx, ty, block] of layout(kind, race)) {
    putProp(map, name, sprite, tx, ty, block);
  }
  if (kind === 'tavern') addDrinkers(map, race);
}

/**
 * @param {object[]} maps
 * @param {{ interior: string, purpose: string, style?: string, town: string }[]} backlog
 */
export function dressInteriors(maps, backlog) {
  const purposeOf = Object.fromEntries(backlog.map((row) => [row.interior, row]));
  for (const map of maps) {
    if (!map.ground || map.ground.length > 40) continue;
    const noted = purposeOf[map.id];
    const kind = roomKind(map.id, noted?.purpose ?? '');
    const race = styleRace(noted?.style ?? '', noted?.town ?? map.id);
    dressOne(map, kind, race);
  }
  const byId = Object.fromEntries(maps.map((map) => [map.id, map]));
  for (const map of maps) {
    if (!map.ground || map.ground.length < 64) continue;
    for (const door of map.objects) {
      if (door.kind !== 'door' || !door.toZone || !byId[door.toZone]) continue;
      const dest = byId[door.toZone];
      if (!dest.ground || dest.ground.length > 40) continue;
      const noted = purposeOf[door.toZone];
      const kind = roomKind(door.toZone, noted?.purpose ?? '');
      const tx = Math.floor(door.x / TILE) + 3;
      const ty = Math.floor(door.y / TILE);
      const sprite = kind === 'tavern' ? 'keg' : kind === 'smith' ? 'anvil' : kind === 'stable' ? 'trough' : kind === 'store' ? 'crate' : kind === 'temple' ? 'candle' : kind === 'guild' ? 'rack' : 'chair';
      putProp(map, `yard-${kind}`, sprite, tx, ty, sprite !== 'chair' && sprite !== 'candle');
    }
  }
}
