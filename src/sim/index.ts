/**
 * Pure game simulation. The renderer is not imported here.
 * Clients send intents; rules advance on a fixed tick with a seeded RNG.
 * The same module is what a future co-op server would run as authority.
 */
export { TICK_MS } from './types';
export type { ContentDb, GameState, Intent, MapData, SimEvent } from './types';
export { loadContent } from './content';
export { parseTiledMap } from './map';
export { createWorld } from './state';
export { applyIntent } from './intents';
export { step } from './step';
export { conColor, conLabel, formatCoin } from './formulas';
