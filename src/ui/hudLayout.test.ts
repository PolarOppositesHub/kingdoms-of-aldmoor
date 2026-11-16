import { describe, expect, it } from 'vitest';
import {
  HUD_IDS,
  HUD_LIMITS,
  clampHudBox,
  clampHudPoint,
  defaultHudBox,
  defaultHudLayout,
  parseHudLayout,
  resetHudLayout,
  resizeHudBox,
  resolveHudBox,
  type HudFit,
  type HudId,
  type HudMode,
  windowsOverlap,
} from './hudLayout';

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
    expect(parseHudLayout(null).sheets).toEqual({});
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

  it('migrates saved layouts that have no sizes', () => {
    const parsed = parseHudLayout(
      JSON.stringify({
        v: 1,
        locked: true,
        portrait: {
          vitals: { x: 20, y: 180 },
          log: { x: 4, y: 9, w: 180, h: 60 },
          target: { x: 8, y: 8, w: 0, h: -4 },
          pad: { x: 1, y: 2, w: Number.NaN, h: 80 },
        },
        wide: { pad: { x: 4, y: 9 } },
      }),
    );
    expect(parsed.portrait.vitals).toEqual({ x: 20, y: 180 });
    expect(parsed.portrait.log).toEqual({ x: 4, y: 9, w: 180, h: 60 });
    expect(parsed.portrait.target).toEqual({ x: 8, y: 8 });
    expect(parsed.portrait.pad).toEqual({ x: 1, y: 2, h: 80 });
    expect(parsed.sheets).toEqual({});

    const fallback = defaultHudBox('vitals', 'portrait', 390, 844);
    const resolved = resolveHudBox('vitals', parsed.portrait.vitals, 'portrait', 390, 844);
    expect(resolved).toEqual({ x: 20, y: 180, w: fallback.w, h: fallback.h });
    expect(resolveHudBox('log', parsed.portrait.log, 'portrait', 390, 844)).toEqual({ x: 4, y: 9, w: 180, h: 60 });
  });

  it('keeps a resized window through a save round trip', () => {
    const start = defaultHudBox('target', 'portrait', 390, 844);
    const resized = resizeHudBox(start, 40, 24, HUD_LIMITS.target, 390, 844);
    expect(resized).toEqual({ x: start.x, y: start.y, w: start.w + 40, h: start.h + 24 });
    const file = defaultHudLayout();
    file.locked = false;
    file.portrait.target = { x: resized.x, y: resized.y, w: resized.w, h: resized.h };
    file.sheets.journal = { x: 16, y: 40, w: 300, h: 420 };
    const again = parseHudLayout(JSON.stringify(file));
    expect(again.portrait.target).toEqual(file.portrait.target);
    expect(again.sheets.journal).toEqual({ x: 16, y: 40, w: 300, h: 420 });
    expect(resolveHudBox('target', again.portrait.target, 'portrait', 390, 844)).toEqual(resized);
    expect(again.locked).toBe(false);
  });

  it('drops sheet sizes that are not numbers and unknown windows', () => {
    const parsed = parseHudLayout(
      JSON.stringify({
        v: 1,
        locked: true,
        portrait: {},
        wide: {},
        sheets: { pack: { w: 320, h: 480 }, journal: { w: 'wide', h: 200 }, nope: { w: 10, h: 10 } },
      }),
    );
    expect(parsed.sheets).toEqual({ pack: { w: 320, h: 480 } });
  });

  it('reset clears positions and sizes and keeps the lock', () => {
    const parsed = parseHudLayout(
      JSON.stringify({
        v: 1,
        locked: false,
        portrait: { log: { x: 12, y: 40, w: 200, h: 80 } },
        wide: { pad: { x: 4, y: 9, w: 100, h: 100 } },
        sheets: { book: { w: 280, h: 360, x: 20, y: 30 } },
      }),
    );
    const cleared = resetHudLayout(parsed);
    expect(cleared.locked).toBe(false);
    expect(cleared.portrait).toEqual({});
    expect(cleared.wide).toEqual({});
    expect(cleared.sheets).toEqual({});
    expect(cleared.v).toBe(1);
  });

  it('stops a corner drag at the screen edge and at the limits', () => {
    const start = { x: 40, y: 80, w: 200, h: 112 };
    expect(resizeHudBox(start, 30, 16, HUD_LIMITS.target, 390, 844)).toEqual({ x: 40, y: 80, w: 230, h: 128 });
    const edge = resizeHudBox({ x: 300, y: 760, w: 80, h: 70 }, 400, 400, HUD_LIMITS.target, 390, 844);
    expect(edge.x).toBe(300);
    expect(edge.y).toBe(760);
    expect(edge.x + edge.w).toBeLessThanOrEqual(390);
    expect(edge.y + edge.h).toBeLessThanOrEqual(844);
    expect(edge.h).toBeLessThanOrEqual(HUD_LIMITS.target.maxH);
    const shrunk = resizeHudBox(start, -500, -500, HUD_LIMITS.target, 390, 844);
    expect(shrunk.w).toBe(HUD_LIMITS.target.minW);
    expect(shrunk.h).toBe(HUD_LIMITS.target.minH);
    expect(shrunk.x).toBe(40);
    expect(shrunk.y).toBe(80);
  });

  it('keeps the movement pad square while it is resized', () => {
    const next = resizeHudBox({ x: 8, y: 700, w: 118, h: 118 }, 24, 6, HUD_LIMITS.pad, 390, 844);
    expect(next.w).toBe(next.h);
    expect(next.w).toBe(142);
    expect(next.x).toBe(8);
    expect(next.y).toBe(700);
  });

  it('clamps a saved window back onto a smaller screen', () => {
    const saved = { x: 250, y: 620, w: 236, h: 140 };
    const phone = resolveHudBox('vitals', saved, 'portrait', 375, 667);
    expect(phone.x).toBeGreaterThanOrEqual(0);
    expect(phone.y).toBeGreaterThanOrEqual(0);
    expect(phone.x + phone.w).toBeLessThanOrEqual(375);
    expect(phone.y + phone.h).toBeLessThanOrEqual(667);
    expect(phone.w).toBeLessThanOrEqual(HUD_LIMITS.vitals.maxW);
    expect(phone.h).toBeLessThanOrEqual(HUD_LIMITS.vitals.maxH);

    const inset = { top: 44, right: 0, bottom: 20, left: 0 };
    const notched = clampHudBox({ x: -20, y: -10, w: 400, h: 300 }, HUD_LIMITS.target, 390, 844, inset);
    expect(notched.y).toBeGreaterThanOrEqual(44);
    expect(notched.x).toBeGreaterThanOrEqual(0);
    expect(notched.x + notched.w).toBeLessThanOrEqual(390);
    expect(notched.y + notched.h).toBeLessThanOrEqual(824);
  });

  it('matches the measured 390×844 stone-bar layout', () => {
    expect(defaultHudBox('target', 'portrait', 390, 844)).toEqual({ x: 58, y: 50, w: 236, h: 112 });
    expect(defaultHudBox('vitals', 'portrait', 390, 844)).toEqual({ x: 8, y: 174, w: 236, h: 89 });
    expect(defaultHudBox('log', 'portrait', 390, 844)).toEqual({ x: 8, y: 286, w: 250, h: 48 });
    expect(defaultHudBox('pet', 'portrait', 390, 844)).toEqual({ x: 8, y: 346, w: 220, h: 174 });
    expect(defaultHudBox('pad', 'portrait', 390, 844)).toEqual({ x: 8, y: 712, w: 118, h: 118 });
    expect(defaultHudBox('sit', 'portrait', 390, 844)).toEqual({ x: 326, y: 684, w: 56, h: 56 });
    expect(defaultHudBox('hotbar-a', 'portrait', 390, 844)).toEqual({ x: 132, y: 746, w: 250, h: 90 });
    expect(defaultHudBox('maps', 'portrait', 390, 844)).toEqual({ x: 8, y: 8, w: 44, h: 94 });
    expect(defaultHudBox('util', 'portrait', 390, 844)).toEqual({ x: 172, y: 592, w: 210, h: 64 });
    const target = defaultHudBox('target', 'portrait', 390, 844);
    const hotbar = defaultHudBox('hotbar-a', 'portrait', 390, 844);
    const ratio = (target.w * target.h) / (hotbar.w * hotbar.h);
    expect(ratio).toBeGreaterThan(0.55);
    expect(ratio).toBeLessThan(1.85);
  });

  it('packs the open windows onto phone screens', () => {
    const phones: Array<[number, number, HudMode, HudFit]> = [
      [375, 667, 'portrait', {}],
      [390, 844, 'portrait', {}],
      [430, 932, 'portrait', {}],
      [375, 667, 'portrait', { hotbar: 'arc' }],
      [390, 844, 'portrait', { hotbar: 'arc' }],
      [430, 932, 'portrait', { hotbar: 'arc' }],
      [667, 375, 'wide', {}],
      [844, 390, 'wide', {}],
      [932, 430, 'wide', {}],
      [667, 375, 'wide', { hotbar: 'arc' }],
      [844, 390, 'wide', { hotbar: 'arc' }],
      [932, 430, 'wide', { hotbar: 'arc' }],
    ];
    for (const [width, height, mode, style] of phones) {
      const boxes = Object.fromEntries(HUD_IDS.map((id) => [id, defaultHudBox(id, mode, width, height, undefined, style)])) as Record<HudId, HudBoxOf>;
      for (const id of HUD_IDS) {
        const box = boxes[id];
        expect(box.x, `${width}x${height} ${id} x`).toBeGreaterThanOrEqual(0);
        expect(box.y, `${width}x${height} ${id} y`).toBeGreaterThanOrEqual(0);
        expect(box.x + box.w, `${width}x${height} ${id} right`).toBeLessThanOrEqual(width);
        expect(box.y + box.h, `${width}x${height} ${id} bottom`).toBeLessThanOrEqual(height);
        expect(box.w, `${width}x${height} ${id} w`).toBeGreaterThanOrEqual(Math.min(HUD_LIMITS[id].minW, width - 16));
        expect(box.h, `${width}x${height} ${id} h`).toBeGreaterThanOrEqual(Math.min(HUD_LIMITS[id].minH, height - 16));
      }
      const hidden: HudId = style.hotbar === 'arc' ? 'hotbar-a' : 'hotbar-b';
      const visible = HUD_IDS.filter((id) => id !== hidden);
      for (let i = 0; i < visible.length; i += 1) {
        for (let j = i + 1; j < visible.length; j += 1) {
          const a = visible[i];
          const b = visible[j];
          if (style.hotbar === 'arc' && ((a === 'sit' && b === 'hotbar-b') || (a === 'hotbar-b' && b === 'sit'))) continue;
          expect(windowsOverlap(boxes[a], boxes[b]), `${width}x${height} ${mode} ${a} overlaps ${b}`).toBe(false);
        }
      }
    }
  });
});

type HudBoxOf = { x: number; y: number; w: number; h: number };
