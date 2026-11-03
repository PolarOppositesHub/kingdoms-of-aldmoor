import type { ConColor, ContentDb, Dice, GameState, Stats } from './types';
import { nextRng } from './rng';

export function roll(state: GameState): number {
  const next = nextRng(state.rng);
  state.rng = next.state;
  return next.value;
}

export function rollDice(state: GameState, dice: Dice): number {
  let total = dice.bonus;
  for (let i = 0; i < dice.n; i++) total += 1 + Math.floor(roll(state) * dice.sides);
  return total;
}

export function conColor(playerLevel: number, mobLevel: number): ConColor {
  const gap = mobLevel - playerLevel;
  if (gap <= -4) return 'gray';
  if (gap === -3) return 'green';
  if (gap === -2) return 'lightblue';
  if (gap === -1) return 'blue';
  if (gap === 0) return 'white';
  if (gap <= 2) return 'yellow';
  return 'red';
}

export function conLabel(color: ConColor): string {
  switch (color) {
    case 'gray':
      return 'trivial';
    case 'green':
      return 'easy';
    case 'lightblue':
      return 'simple';
    case 'blue':
      return 'fair';
    case 'white':
      return 'even';
    case 'yellow':
      return 'risky';
    case 'red':
      return 'deadly';
  }
}

/** Below 5: none. 5–9: 2.5% of this level's bar. 10+: 5%. No delevel. */
export function xpLossFraction(level: number): number {
  if (level < 5) return 0;
  if (level < 10) return 0.025;
  return 0.05;
}

export function xpToNext(content: ContentDb, level: number): number {
  const table = content.tuning.xpTable;
  return table[level] ?? table[table.length - 1] ?? 100;
}

/** Gray gives nothing. Green is half. The rest of the ladder pays the listed amount. */
export function xpYield(playerLevel: number, mobLevel: number, amount: number): number {
  const color = conColor(playerLevel, mobLevel);
  const mod = color === 'gray' ? 0 : color === 'green' ? 0.5 : 1;
  return Math.floor(amount * mod);
}

export function xpProgress(content: ContentDb, level: number, xp: number): { need: number; ratio: number; capped: boolean } {
  if (level >= content.tuning.levelCap) return { need: 0, ratio: 1, capped: true };
  const need = Math.max(1, xpToNext(content, level));
  return { need, ratio: Math.max(0, Math.min(1, xp / need)), capped: false };
}

/**
 * Levels 1–10 keep the original per-level step.
 * Each level past 10 also adds half a step, so the later climb still grows.
 */
function levelBodies(perLevel: number, level: number): number {
  const climbed = Math.max(0, level - 1);
  const veteran = Math.max(0, level - 10);
  return climbed * perLevel + veteran * Math.ceil(perLevel / 2);
}

export function maxHp(content: ContentDb, classId: string, level: number, stats: Stats): number {
  const cls = content.classes[classId];
  return cls.baseHp + stats.sta * cls.hpPerSta + levelBodies(cls.hpPerLevel, level);
}

export function maxMana(content: ContentDb, classId: string, level: number, stats: Stats): number {
  const cls = content.classes[classId];
  if (!cls || cls.baseMana <= 0) return 0;
  return cls.baseMana + stats.int * cls.manaPerInt + levelBodies(cls.manaPerLevel, level);
}

/** Level 1 matches the old flat `base + perLevel`. Later levels keep adding that step. */
export function maxFocus(content: ContentDb, classId: string, level: number): number {
  const cls = content.classes[classId];
  if (!cls || (cls.resource !== 'guile' && cls.resource !== 'rage')) return 0;
  return cls.baseFocus + cls.focusPerLevel * Math.max(1, level);
}

export function formatCoin(copper: number, economy = { copperPerSilver: 10, silverPerGold: 10, goldPerPlatinum: 10 }): string {
  const silverUnit = economy.copperPerSilver;
  const goldUnit = silverUnit * economy.silverPerGold;
  const platUnit = goldUnit * economy.goldPerPlatinum;
  let rest = Math.max(0, Math.floor(copper));
  const plat = Math.floor(rest / platUnit);
  rest -= plat * platUnit;
  const gold = Math.floor(rest / goldUnit);
  rest -= gold * goldUnit;
  const silver = Math.floor(rest / silverUnit);
  const cop = rest - silver * silverUnit;
  const parts: string[] = [];
  if (plat) parts.push(`${plat}p`);
  if (gold) parts.push(`${gold}g`);
  if (silver) parts.push(`${silver}s`);
  if (cop || parts.length === 0) parts.push(`${cop}c`);
  return parts.join(' ');
}

export function hitChance(
  attack: number,
  attackerLevel: number,
  defense: number,
  defenderLevel: number,
  tuning: ContentDb['tuning'],
): number {
  const raw =
    tuning.hitBase +
    (attack - defense) * tuning.hitPerAttack +
    (attackerLevel - defenderLevel) * tuning.hitPerLevel;
  return Math.min(tuning.maxHit, Math.max(tuning.minHit, raw));
}

export function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function facingOf(dx: number, dy: number, prev: 's' | 'n' | 'e' | 'w'): 's' | 'n' | 'e' | 'w' {
  if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return prev;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'e' : 'w';
  return dy > 0 ? 's' : 'n';
}
