/** Mulberry32. The only randomness in the simulation, so a seed replays cleanly. */

export function nextRng(state: number): { state: number; value: number } {
  let a = state >>> 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { state: a >>> 0, value };
}
