import { describe, expect, it } from 'vitest';
import { clearRect, defaultZoom, followScroll, interiorZoom, isTightRoom, screenOf, type Rect } from './camera';

function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** HUD stacks used at the four sizes the owner plays. Portrait windows overlay the map. */
function hudBlocks(viewW: number, viewH: number): Rect[] {
  const wide = viewW / viewH > 0.92 && viewW > viewH;
  if (wide) return [];
  const compact = viewH <= 760 || viewW <= 384;
  const roomy = viewW >= 414 && viewH >= 900;
  if (roomy) {
    return [
      { x: 64, y: 48, w: 280, h: 120 },
      { x: 8, y: 176, w: 280, h: 96 },
      { x: 8, y: 278, w: 300, h: 36 },
      { x: 352, y: 48, w: 220, h: 76 },
      { x: 8, y: viewH - 140, w: 128, h: 128 },
      { x: 152, y: viewH - 104, w: viewW - 168, h: 96 },
    ];
  }
  if (compact) {
    return [
      { x: 56, y: 44, w: Math.min(210, viewW - 64), h: 112 },
      { x: 8, y: 162, w: Math.min(210, viewW - 16), h: 92 },
      { x: 8, y: 258, w: Math.min(210, viewW - 16), h: 48 },
      { x: 8, y: viewH - 118, w: 100, h: 100 },
      { x: 120, y: viewH - 92, w: viewW - 136, h: 84 },
    ];
  }
  return [
    { x: 58, y: 50, w: 236, h: 112 },
    { x: 8, y: 174, w: 236, h: 89 },
    { x: 8, y: 286, w: Math.min(250, viewW - 16), h: 48 },
    { x: 8, y: viewH - 132, w: 118, h: 118 },
    { x: 140, y: viewH - 98, w: viewW - 156, h: 90 },
  ];
}

describe('interior camera', () => {
  const roomW = 224;
  const roomH = 176;
  const corners = [
    [32, 32],
    [roomW - 32, 32],
    [32, roomH - 32],
    [roomW - 32, roomH - 32],
  ];
  const views = [
    { name: 'ipad portrait', w: 1024, h: 1366 },
    { name: 'ipad landscape map', w: 926, h: 1024 },
    { name: 'phone', w: 390, h: 844 },
    { name: 'small phone', w: 375, h: 667 },
  ];

  it('centers a tight room in the open play area at every owner size', () => {
    for (const view of views) {
      const blocks = hudBlocks(view.w, view.h);
      const clear = clearRect(view.w, view.h, blocks);
      const zoom = interiorZoom(roomW, roomH, clear);
      for (const [heroX, heroY] of corners) {
        const scroll = followScroll({
          heroX,
          heroY,
          mapW: roomW,
          mapH: roomH,
          viewW: view.w,
          viewH: view.h,
          zoom,
          clear,
        });
        const hero = {
          x: screenOf(heroX, scroll.scrollX, view.w, zoom) - 14,
          y: screenOf(heroY, scroll.scrollY, view.h, zoom) - 42,
          w: 28,
          h: 44,
        };
        for (const block of blocks) {
          expect(overlaps(hero, block), `${view.name} hero under hud at ${heroX},${heroY}`).toBe(false);
        }
        expect(hero.x).toBeGreaterThan(-2);
        expect(hero.y).toBeGreaterThan(-2);
        expect(hero.x + hero.w).toBeLessThan(view.w + 2);
        expect(hero.y + hero.h).toBeLessThan(view.h + 2);
      }
      const scroll = followScroll({
        heroX: 40,
        heroY: 40,
        mapW: roomW,
        mapH: roomH,
        viewW: view.w,
        viewH: view.h,
        zoom,
        clear,
      });
      const midX = screenOf(roomW / 2, scroll.scrollX, view.w, zoom);
      const midY = screenOf(roomH / 2, scroll.scrollY, view.h, zoom);
      expect(Math.abs(midX - (clear.x + clear.w / 2)), view.name).toBeLessThan(10);
      expect(Math.abs(midY - (clear.y + clear.h / 2)), view.name).toBeLessThan(10);
    }
  });

  it('follows the hero inside a map larger than the view', () => {
    const zoom = 4;
    const clear = { x: 0, y: 80, w: 390, h: 360 };
    const scroll = followScroll({ heroX: 200, heroY: 240, mapW: 4000, mapH: 4000, viewW: 390, viewH: 512, zoom, clear });
    const left = screenOf(0, scroll.scrollX, 390, zoom);
    const heroX = screenOf(200, scroll.scrollX, 390, zoom);
    const heroY = screenOf(240, scroll.scrollY, 512, zoom);
    expect(left).toBeLessThanOrEqual(1);
    expect(heroX).toBeGreaterThan(0);
    expect(heroX).toBeLessThan(390);
    expect(heroY).toBeGreaterThan(0);
    expect(heroY).toBeLessThan(512);
    expect(isTightRoom(4000, 4000)).toBe(false);
    expect(isTightRoom(224, 176)).toBe(true);
  });

  it('keeps the outdoor zoom large enough to read a hero', () => {
    expect(defaultZoom(390, 512)).toBeGreaterThanOrEqual(3.5);
    expect(defaultZoom(375, 431)).toBeGreaterThanOrEqual(3.5);
    expect(defaultZoom(1024, 1034)).toBeGreaterThanOrEqual(4.5);
    expect(defaultZoom(926, 1024)).toBeGreaterThanOrEqual(4.5);
  });

  it('puts the open area below a top-left window stack', () => {
    const blocks = [{ x: 0, y: 0, w: 300, h: 280 }];
    const clear = clearRect(1024, 1366, blocks);
    expect(clear.y).toBeGreaterThan(200);
    expect(clear.w).toBeGreaterThan(700);
  });
});
