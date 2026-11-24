/** Camera follow that keeps a small room centered and a large room clamped to the hero. */

export function clampZoom(value: number): number {
  return Math.round(Math.max(1.75, Math.min(5, value)) * 4) / 4;
}

/**
 * Default zoom. A 7-tile facade still fits the map view, and the hero stays large
 * on a phone and on an iPad. The map canvas already sits above the HUD.
 */
export function defaultZoom(viewW: number, viewH: number): number {
  const fitH = (viewH - 16) / (7 * 16);
  const fitW = (viewW - 16) / (6 * 16);
  const fit = Math.min(fitH, fitW);
  const floor = viewH >= 900 ? 4.5 : 3.5;
  return clampZoom(Math.max(floor, Math.min(5, fit)));
}

export interface FollowInput {
  heroX: number;
  heroY: number;
  mapW: number;
  mapH: number;
  viewW: number;
  viewH: number;
  zoom: number;
}

/**
 * Phaser scroll is not the left edge of the zoomed view.
 * The world point at the middle of the camera is scroll + cameraSize / 2.
 * A room smaller than the zoomed view is centered.
 * A larger room keeps the hero on screen, a little below center on a tall phone
 * so the target window does not cover them, and clamps at the map edges.
 */
export function followScroll(input: FollowInput): { scrollX: number; scrollY: number } {
  const zoom = input.zoom > 0 ? input.zoom : 1;
  const camW = input.viewW;
  const camH = input.viewH;
  const displayW = camW / zoom;
  const displayH = camH / zoom;
  const anchorY = camH >= camW ? 0.68 : 0.55;
  const axis = (focus: number, map: number, cam: number, display: number, anchor: number) => {
    if (map <= display) return Math.round(map / 2 - cam / 2);
    const min = display / 2 - cam / 2;
    const max = map - display / 2 - cam / 2;
    const raw = focus - anchor * display - cam / 2 + display / 2;
    return Math.round(Math.min(max, Math.max(min, raw)));
  };
  return {
    scrollX: axis(input.heroX, input.mapW, camW, displayW, 0.5),
    scrollY: axis(input.heroY, input.mapH, camH, displayH, anchorY),
  };
}
