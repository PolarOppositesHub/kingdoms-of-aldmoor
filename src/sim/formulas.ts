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

/** Below 5: none. 5–9: 2.5% of this level's bar. 10+: 5%. No delevel in M1. */
export function xpLossFraction(level: number): number {
  if (level < 5) return 0;
  if (level < 10) return 0.025;
  return 0.05;
}

export function xpToNext(content: ContentDb, level: number): number {
  const table = content.tuning.xpTable;
  return table[level] ?? table[table.length - 1] ?? 100;
}

export function maxHp(content: ContentDb, classId: string, level: number, stats: Stats): number {
  const cls = content.classes[classId];
  return cls.baseHp + stats.sta * cls.hpPerSta + (level - 1) * cls.hpPerLevel;
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
