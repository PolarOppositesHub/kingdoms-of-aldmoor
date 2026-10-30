import type { ContentDb, GameState, MapData } from './types';
import { TICK_MS } from './types';
import { collect } from './events';
import { ai, combat, movement, pickups, regen, respawnMobs, respawnPlayer } from './systems';

/**
 * One fixed simulation tick.
 * UI panels pause the world (single-player policy). A future server can ignore that
 * and keep ticking while a client has a menu open.
 */
export function step(state: GameState, content: ContentDb, map: MapData) {
  return collect(state, (emit) => {
    if (state.ui.panel !== 'none') {
      if (state.itemLockMs > 0) state.itemLockMs = Math.max(0, state.itemLockMs - TICK_MS);
      return;
    }
    if (state.dead) {
      state.deathMs -= TICK_MS;
      if (state.deathMs <= 0) respawnPlayer(state, content, emit);
      state.timeMs += TICK_MS;
      state.tick += 1;
      return;
    }
    for (const id of Object.keys(state.cooldowns)) {
      state.cooldowns[id] = Math.max(0, state.cooldowns[id] - TICK_MS);
    }
    if (state.itemLockMs > 0) state.itemLockMs = Math.max(0, state.itemLockMs - TICK_MS);
    if (state.invulnMs > 0) state.invulnMs = Math.max(0, state.invulnMs - TICK_MS);

    movement(state, content, map, emit);
    if (state.ui.panel !== 'none') {
      state.timeMs += TICK_MS;
      state.tick += 1;
      return;
    }
    ai(state, content, map, emit);
    combat(state, content, map, emit);
    pickups(state, content, emit);
    regen(state, content, map);
    respawnMobs(state, content);
    state.timeMs += TICK_MS;
    state.tick += 1;
  });
}
