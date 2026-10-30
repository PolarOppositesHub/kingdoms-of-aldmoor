import type { Intent } from '../sim/types';

function clamp(value: number): number {
  if (value > 0.4) return 1;
  if (value < -0.4) return -1;
  return 0;
}

/** Shared input. The simulation only sees this through intents once per frame. */
export const controls = {
  padX: 0,
  padY: 0,
  keyX: 0,
  keyY: 0,
  dest: null as { x: number; y: number } | null,
  queue: [] as Intent[],
  get moveX() {
    return clamp(this.padX + this.keyX);
  },
  get moveY() {
    return clamp(this.padY + this.keyY);
  },
};

export function pushIntent(intent: Intent): void {
  controls.queue.push(intent);
}
