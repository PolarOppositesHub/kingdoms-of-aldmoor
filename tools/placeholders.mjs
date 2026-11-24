/**
 * Every visible door in a town opens a room. Halls that already have an interior are left alone.
 * New rooms are furnished and empty, and listed for a later lore pass.
 */
import { T, TILE } from './frostmere-map.mjs';

const PAIRS = [
  [T.DOOR_BL, T.DOOR_BR, 'timber'],
  [T.SDOOR_BL, T.SDOOR_BR, 'stone'],
  [T.HUMAN_DBL, T.HUMAN_DBR, 'human'],
  [T.ELF_DBL, T.ELF_DBR, 'elf'],
  [T.WOOD_DBL, T.WOOD_DBR, 'wood'],
  [T.DWARF_DBL, T.DWARF_DBR, 'dwarf'],
  [T.OGRE_DBL, T.OGRE_DBR, 'ogre'],
];

const LEFT = new Map(PAIRS.map(([left, right, style]) => [left, { right, style }]));

const PURPOSE = {
  human: ['a tavern', 'a smith annex', 'a stable', 'a cloth store', 'a chapel closet', 'a guild loft', 'a rented room'],
  elf: ['a tavern', 'a pearl smith', 'a stable', 'a silk store', 'a shrine', 'a guild solar', 'a guest residence'],
  wood: ['a tavern', 'a seed store', 'a stable', 'a shrine', 'a guild nest', 'a bough house'],
  dwarf: ['a tavern', 'a smith annex', 'a stable', 'a lamp store', 'a shrine', 'a guild loft', 'a stone dwelling'],
  ogre: ['a tavern', 'a smith pit', 'a stable', 'a meat store', 'a shrine', 'a guild pit', 'a hide lodge'],
  timber: ['a tavern', 'a smith shed', 'a stable', 'a smoke store', 'a guild bench', 'a longhouse room'],
  stone: ['a tavern', 'a smith room', 'a stable', 'a gate store', 'a shrine', 'a guild closet'],
};

const FLOOR = {
  human: T.COBBLE,
  elf: T.WHITE,
  wood: T.MOSS,
  dwarf: T.ROCK_GROUND,
  ogre: T.MUD,
  timber: T.FLOOR,
  stone: T.FLOOR,
};

const WALL = {
  human: T.HUMAN_WALL,
  elf: T.ELF_WALL,
  wood: T.WOOD_WALL,
  dwarf: T.DWARF_WALL,
  ogre: T.OGRE_WALL,
  timber: T.WALL,
  stone: T.STONE,
};

const DOOR = {
  human: [T.HUMAN_DTL, T.HUMAN_DTR, T.HUMAN_DML, T.HUMAN_DMR, T.HUMAN_DBL, T.HUMAN_DBR],
  elf: [T.ELF_DTL, T.ELF_DTR, T.ELF_DML, T.ELF_DMR, T.ELF_DBL, T.ELF_DBR],
  wood: [T.WOOD_DTL, T.WOOD_DTR, T.WOOD_DML, T.WOOD_DMR, T.WOOD_DBL, T.WOOD_DBR],
  dwarf: [T.DWARF_DTL, T.DWARF_DTR, T.DWARF_DML, T.DWARF_DMR, T.DWARF_DBL, T.DWARF_DBR],
  ogre: [T.OGRE_DTL, T.OGRE_DTR, T.OGRE_DML, T.OGRE_DMR, T.OGRE_DBL, T.OGRE_DBR],
  timber: [T.DOOR_TL, T.DOOR_TR, T.DOOR_ML, T.DOOR_MR, T.DOOR_BL, T.DOOR_BR],
  stone: [T.SDOOR_TL, T.SDOOR_TR, T.SDOOR_ML, T.SDOOR_MR, T.SDOOR_BL, T.SDOOR_BR],
};

function feet(tx, ty) {
  return { x: tx * TILE + 8, y: ty * TILE + 14 };
}

function grid(w, h, fill) {
  return Array.from({ length: h }, () => Array(w).fill(fill));
}

function nearDoor(map, tx, ty) {
  const ax = tx * TILE + 8;
  const ay = ty * TILE + 8;
  return map.objects.some((obj) => obj.kind === 'door' && obj.toZone && Math.hypot(obj.x - ax, obj.y - ay) < 28);
}

function landing(map, tx, ty) {
  const spots = [
    [tx, ty + 2],
    [tx + 1, ty + 2],
    [tx - 1, ty + 2],
    [tx + 2, ty + 2],
    [tx, ty + 3],
    [tx + 1, ty + 1],
  ];
  for (const [x, y] of spots) {
    const tile = map.ground[y]?.[x];
    if (tile === undefined || map.solid[y][x]) continue;
    if (tile === T.WATER || tile === T.WATER_B || tile === T.CLIFF) continue;
    return [x, y];
  }
  return [tx, Math.min(map.ground.length - 2, ty + 2)];
}

function furnish(style, w, h) {
  const g = grid(w, h, FLOOR[style] ?? T.FLOOR);
  const solid = grid(w, h, 0);
  const safe = grid(w, h, 1);
  const wall = WALL[style] ?? T.WALL;
  for (let x = 0; x < w; x++) {
    g[0][x] = wall;
    g[h - 1][x] = wall;
    solid[0][x] = 1;
    solid[h - 1][x] = 1;
    safe[0][x] = 0;
    safe[h - 1][x] = 0;
  }
  for (let y = 0; y < h; y++) {
    g[y][0] = wall;
    g[y][w - 1] = wall;
    solid[y][0] = 1;
    solid[y][w - 1] = 1;
    safe[y][0] = 0;
    safe[y][w - 1] = 0;
  }
  const door = DOOR[style] ?? DOOR.timber;
  const doorX = Math.floor(w / 2);
  const bands = [
    [h - 3, door[0], door[1]],
    [h - 2, door[2], door[3]],
    [h - 1, door[4], door[5]],
  ];
  for (const [row, left, right] of bands) {
    g[row][doorX] = left;
    g[row][doorX - 1] = right;
    solid[row][doorX] = row === h - 1 ? 0 : 1;
    solid[row][doorX - 1] = row === h - 1 ? 0 : 1;
    safe[row][doorX] = 1;
    safe[row][doorX - 1] = 1;
  }
  g[2][2] = T.BANNER;
  solid[2][2] = 1;
  g[2][w - 3] = style === 'dwarf' ? T.RUNE : style === 'ogre' ? T.SKULL : T.LANTERN;
  solid[2][w - 3] = 1;
  return { g, solid, safe, doorX };
}

function makeRoom(id, title, town, style, exit) {
  const w = 14;
  const h = 11;
  const { g, solid, safe, doorX } = furnish(style, w, h);
  const objects = [
    {
      kind: 'door',
      name: 'exit',
      ...feet(doorX, h - 1),
      toZone: exit.zone,
      toX: exit.x,
      toY: exit.y,
      sprite: 'sign_hall',
    },
    { kind: 'spawn', name: 'entry', ...feet(doorX, h - 3) },
    { kind: 'prop', name: 'crate', sprite: 'crate', ...feet(3, 4) },
    { kind: 'prop', name: 'barrel', sprite: 'barrel', ...feet(4, 4) },
    { kind: 'prop', name: 'banner', sprite: 'banner', ...feet(w - 4, 4) },
    {
      kind: 'sign',
      name: title,
      sprite: 'sign_hall',
      text: `${title}. A quiet room in ${town}. The door leads back out. Nothing here has been claimed yet.`,
      ...feet(w - 4, 3),
    },
  ];
  solid[4][3] = 1;
  solid[4][4] = 1;
  return {
    id,
    ground: g,
    solid,
    safe,
    objects,
    props: [
      { name: 'zoneId', type: 'string', value: id },
      { name: 'townName', type: 'string', value: title },
      { name: 'wildsName', type: 'string', value: title },
    ],
    scenery: null,
  };
}

/**
 * @param {object[]} maps finished zone maps
 * @returns {{ town: string, zone: string, building: string, purpose: string, interior: string }[]}
 */
export function linkPlaceholders(maps) {
  const byId = Object.fromEntries(maps.map((map) => [map.id, map]));
  const backlog = [];
  const counts = {};
  for (const map of maps) {
    if (!map.ground || String(map.id).startsWith('room_')) continue;
    const town = map.props?.find((prop) => prop.name === 'townName')?.value ?? map.id;
    for (let y = 1; y < map.ground.length - 1; y++) {
      for (let x = 1; x < map.ground[0].length - 1; x++) {
        const pair = LEFT.get(map.ground[y][x]);
        if (!pair || map.ground[y][x + 1] !== pair.right) continue;
        if (nearDoor(map, x, y) || nearDoor(map, x + 1, y)) continue;
        map.solid[y][x] = 0;
        map.solid[y][x + 1] = 0;
        const n = (counts[map.id] ?? 0) + 1;
        counts[map.id] = n;
        const purposes = PURPOSE[pair.style] ?? PURPOSE.stone;
        const purpose = purposes[(n - 1) % purposes.length];
        const id = `room_${map.id}_${n}`;
        const title = `${town} room ${n}`;
        const [lx, ly] = landing(map, x, y);
        const back = feet(lx, ly);
        const room = makeRoom(id, title, town, pair.style, { zone: map.id, x: back.x, y: back.y });
        const inside = room.objects.find((obj) => obj.kind === 'spawn');
        map.objects.push({
          kind: 'door',
          name: title,
          ...feet(x, y),
          toZone: id,
          toX: inside.x,
          toY: inside.y,
          sprite: 'sign_hall',
        });
        maps.push(room);
        byId[id] = room;
        backlog.push({ town, zone: map.id, building: title, purpose, interior: id, style: pair.style });
      }
    }
  }
  return backlog;
}
