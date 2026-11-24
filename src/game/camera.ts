/** Camera follow. A small room is framed in the open play area. A large map follows the hero. */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function clampZoom(value: number): number {
  return Math.round(Math.max(1.75, Math.min(5, value)) * 4) / 4;
}

/**
 * Outdoor zoom. A 7-tile facade still fits, and the hero stays large on a phone and an iPad.
 */
export function defaultZoom(viewW: number, viewH: number): number {
  const fitH = (viewH - 16) / (7 * 16);
  const fitW = (viewW - 16) / (6 * 16);
  const fit = Math.min(fitH, fitW);
  const floor = viewH >= 900 ? 4.5 : 3.5;
  return clampZoom(Math.max(floor, Math.min(5, fit)));
}

/** Rooms built as one interior, not a town or a dungeon floor. */
export function isTightRoom(mapW: number, mapH: number): boolean {
  return mapW <= 24 * 16 && mapH <= 24 * 16;
}

/**
 * Largest open rectangle in the view, avoiding HUD windows.
 * The grid is coarse on purpose: the result only has to clear the windows.
 */
export function clearRect(viewW: number, viewH: number, blocks: Rect[]): Rect {
  const cols = 48;
  const rows = 48;
  const cw = viewW / cols;
  const ch = viewH / rows;
  const blocked = (x: number, y: number) => blocks.some((block) => x >= block.x && x < block.x + block.w && y >= block.y && y < block.y + block.h);
  const height = new Array<number>(cols).fill(0);
  let best = { area: 0, c: 0, r: 0, w: cols, h: rows };
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const hit = blocked((c + 0.5) * cw, (r + 0.5) * ch);
      height[c] = hit ? 0 : height[c] + 1;
    }
    const stack: number[] = [];
    for (let c = 0; c <= cols; c++) {
      const h = c === cols ? 0 : height[c];
      while (stack.length > 0 && height[stack[stack.length - 1]] > h) {
        const hh = height[stack.pop() as number];
        const left = stack.length > 0 ? stack[stack.length - 1] + 1 : 0;
        const width = c - left;
        const area = hh * width;
        if (area > best.area) best = { area, c: left, r: r - hh + 1, w: width, h: hh };
      }
      stack.push(c);
    }
  }
  if (best.area <= 0) return { x: 0, y: 0, w: viewW, h: viewH };
  const pad = 6;
  const x = best.c * cw + pad;
  const y = best.r * ch + pad;
  return {
    x,
    y,
    w: Math.max(64, best.w * cw - pad * 2),
    h: Math.max(64, best.h * ch - pad * 2),
  };
}

/** Fit a tight room into the open play area, a little inside the edges. */
export function interiorZoom(mapW: number, mapH: number, clear: Rect): number {
  const availW = Math.max(64, clear.w - 12);
  const availH = Math.max(64, clear.h - 12);
  const zoom = Math.min(availW / mapW, availH / mapH);
  return Math.max(1.25, Math.min(6, Math.floor(zoom * 4) / 4));
}

export interface FollowInput {
  heroX: number;
  heroY: number;
  mapW: number;
  mapH: number;
  viewW: number;
  viewH: number;
  zoom: number;
  /** Screen rectangle the hero or the room should sit in. */
  clear: Rect;
}

/**
 * Phaser's world point at the middle of the camera is scroll + cameraSize / 2.
 * Screen position of a world point is (world - viewOrigin) * zoom.
 * A room smaller than the zoomed view is centered in `clear`.
 * A larger map puts the hero at the center of `clear` and clamps to the map.
 */
export function followScroll(input: FollowInput): { scrollX: number; scrollY: number } {
  const zoom = input.zoom > 0 ? input.zoom : 1;
  const camW = input.viewW;
  const camH = input.viewH;
  const displayW = camW / zoom;
  const displayH = camH / zoom;
  const fits = input.mapW <= displayW + 0.5 && input.mapH <= displayH + 0.5;
  const focusX = fits ? input.mapW / 2 : input.heroX;
  const focusY = fits ? input.mapH / 2 : input.heroY;
  const screenX = input.clear.x + input.clear.w / 2;
  const screenY = input.clear.y + input.clear.h / 2;
  const axis = (focus: number, screen: number, map: number, cam: number, display: number) => {
    let scroll = focus - cam / 2 + display / 2 - screen / zoom;
    if (!fits && map > display) {
      const min = display / 2 - cam / 2;
      const max = map - display / 2 - cam / 2;
      scroll = Math.min(max, Math.max(min, scroll));
    }
    return Math.round(scroll);
  };
  return {
    scrollX: axis(focusX, screenX, input.mapW, camW, displayW),
    scrollY: axis(focusY, screenY, input.mapH, camH, displayH),
  };
}

/** Screen pixel of a world coordinate under the Phaser scroll model. */
export function screenOf(world: number, scroll: number, cam: number, zoom: number): number {
  const display = cam / zoom;
  const origin = scroll + cam / 2 - display / 2;
  return (world - origin) * zoom;
}
