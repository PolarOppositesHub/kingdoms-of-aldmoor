import { describe, expect, it } from 'vitest';
import { clampHudPoint, parseHudLayout } from './hudLayout';

describe('hud layout', () => {
  it('keeps a window inside the safe area', () => {
    const inset = { top: 47, right: 12, bottom: 34, left: 8 };
    expect(clampHudPoint(20, 80, 100, 40, 390, 844, inset)).toEqual({ x: 20, y: 80 });
    expect(clampHudPoint(-30, -10, 100, 40, 390, 844, inset)).toEqual({ x: 8, y: 47 });
    expect(clampHudPoint(400, 900, 100, 40, 390, 844, inset)).toEqual({ x: 278, y: 770 });
  });

  it('pins an oversized window to the safe origin', () => {
    expect(clampHudPoint(80, 80, 500, 40, 390, 844, { top: 20, right: 0, bottom: 0, left: 10 })).toEqual({ x: 10, y: 80 });
  });

  it('defaults to a locked layout and ignores junk', () => {
    expect(parseHudLayout(null).locked).toBe(true);
    expect(parseHudLayout('not json').portrait).toEqual({});
    const parsed = parseHudLayout(
      JSON.stringify({
        v: 1,
        locked: false,
        portrait: { vitals: { x: 12, y: 40 }, nope: { x: 1, y: 2 }, target: { x: 'a', y: 3 } },
        wide: { pad: { x: 4, y: 9 } },
      }),
    );
    expect(parsed.locked).toBe(false);
    expect(parsed.portrait).toEqual({ vitals: { x: 12, y: 40 } });
    expect(parsed.wide).toEqual({ pad: { x: 4, y: 9 } });
    expect(parseHudLayout(JSON.stringify({ v: 1 })).locked).toBe(true);
  });
});
