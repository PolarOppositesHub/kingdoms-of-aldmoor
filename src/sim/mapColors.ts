/** Tile colors for the map case. Ids match tools/frostmere-map.mjs. */

const SNOW = '#e6eef4';
const PATH = '#8a5a3c';
const WATER = '#1a4d66';
const ICE = '#d5e6f0';
const WOOD = '#8d5a38';
const ROOF = '#f4f8fb';
const STONE = '#8b97a3';
const PINE = '#2c4a30';
const GRASS = '#6e8f5a';
const MUD = '#6b5344';

const COLORS: Record<number, string> = {
  1: SNOW,
  2: '#d5e0ea',
  3: '#c3d2de',
  4: PATH,
  5: '#a87448',
  6: ICE,
  7: WATER,
  8: '#143f54',
  9: '#8d5a38',
  10: WOOD,
  11: '#5c3a26',
  12: '#f0c56a',
  13: '#6b4428',
  14: ROOF,
  15: '#d0dce6',
  16: ROOF,
  17: ROOF,
  18: ROOF,
  19: ROOF,
  20: ROOF,
  21: '#c5d0da',
  22: '#9a3034',
  23: '#5c3a26',
  24: '#3a2418',
  25: '#6a4038',
  26: '#9a3034',
  27: '#6b4428',
  28: STONE,
  29: '#6a7580',
  30: '#4a4038',
  31: '#f0c56a',
  32: '#8d5a38',
  45: '#c4a574',
  46: GRASS,
  47: '#7f9a62',
  48: MUD,
  49: '#c5d0c8',
  50: '#24362c',
  51: STONE,
  52: '#d9c59a',
  53: '#5c656e',
  54: '#b7d4e4',
  55: '#c5d4e0',
  56: '#8a9a62',
  57: PINE,
  58: '#1e3324',
  59: '#6a7580',
  60: '#3e6b40',
  61: '#1c1418',
  62: '#556068',
  63: ICE,
  64: '#3a342e',
  65: '#7ec8e8',
};

export function tileColor(id: number): string {
  if (id >= 33 && id <= 44) return '#6b4428';
  return COLORS[id] ?? SNOW;
}
