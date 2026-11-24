import { describe, expect, it } from 'vitest';
import { defaultZoom, followScroll } from './camera';

describe('interior camera', () => {
  function viewOrigin(scroll: number, cam: number, zoom: number): number {
    const display = cam / zoom;
    return scroll + cam / 2 - display / 2;
  }

  it('centers a room smaller than the view', () => {
    const scroll = followScroll({ heroX: 40, heroY: 160, mapW: 224, mapH: 176, viewW: 1024, viewH: 900, zoom: 3 });
    expect(viewOrigin(scroll.scrollX, 1024, 3) + 1024 / 3 / 2).toBeCloseTo(112, 0);
    expect(viewOrigin(scroll.scrollY, 900, 3) + 900 / 3 / 2).toBeCloseTo(88, 0);
  });

  it('keeps a large-room view inside the map and the hero on screen', () => {
    const zoom = 4;
    const scroll = followScroll({ heroX: 200, heroY: 240, mapW: 4000, mapH: 4000, viewW: 390, viewH: 512, zoom });
    const left = viewOrigin(scroll.scrollX, 390, zoom);
    const top = viewOrigin(scroll.scrollY, 512, zoom);
    const displayW = 390 / zoom;
    const displayH = 512 / zoom;
    expect(left).toBeGreaterThanOrEqual(-1);
    expect(top).toBeGreaterThanOrEqual(-1);
    expect(left + displayW).toBeLessThanOrEqual(4001);
    expect(top + displayH).toBeLessThanOrEqual(4001);
    expect(200).toBeGreaterThanOrEqual(left - 1);
    expect(200).toBeLessThanOrEqual(left + displayW + 1);
    expect(240).toBeGreaterThan(top);
    expect(240).toBeLessThan(top + displayH);
  });

  it('keeps the default zoom large enough to read a hero on a phone and an iPad', () => {
    expect(defaultZoom(390, 512)).toBeGreaterThanOrEqual(3.5);
    expect(defaultZoom(375, 431)).toBeGreaterThanOrEqual(3.5);
    expect(defaultZoom(1024, 1034)).toBeGreaterThanOrEqual(4.5);
    expect(defaultZoom(926, 1024)).toBeGreaterThanOrEqual(4.5);
  });
});
