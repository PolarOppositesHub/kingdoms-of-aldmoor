/** Per-device HUD positions. Kept out of the character save so old heroes still load. */

export const HUD_LAYOUT_KEY = 'aldmoor-hud-layout';

export const HUD_IDS = ['vitals', 'target', 'pet', 'hotbar-a', 'hotbar-b', 'pad', 'sit', 'maps', 'log'] as const;

export type HudId = (typeof HUD_IDS)[number];
export type HudMode = 'portrait' | 'wide';
export type HudPoint = { x: number; y: number };
export type HudInset = { top: number; right: number; bottom: number; left: number };

export type HudLayoutFile = {
  v: 1;
  locked: boolean;
  portrait: Partial<Record<HudId, HudPoint>>;
  wide: Partial<Record<HudId, HudPoint>>;
};

const EMPTY_INSET: HudInset = { top: 0, right: 0, bottom: 0, left: 0 };

export function defaultHudLayout(): HudLayoutFile {
  return { v: 1, locked: true, portrait: {}, wide: {} };
}

function isHudId(value: string): value is HudId {
  return (HUD_IDS as readonly string[]).includes(value);
}

function readPoint(value: unknown): HudPoint | null {
  if (!value || typeof value !== 'object') return null;
  const point = value as Partial<HudPoint>;
  if (typeof point.x !== 'number' || typeof point.y !== 'number') return null;
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return null;
  return { x: point.x, y: point.y };
}

function readSpots(value: unknown): Partial<Record<HudId, HudPoint>> {
  const spots: Partial<Record<HudId, HudPoint>> = {};
  if (!value || typeof value !== 'object') return spots;
  for (const [key, point] of Object.entries(value)) {
    if (!isHudId(key)) continue;
    const next = readPoint(point);
    if (next) spots[key] = next;
  }
  return spots;
}

export function parseHudLayout(raw: string | null): HudLayoutFile {
  const fresh = defaultHudLayout();
  if (!raw) return fresh;
  try {
    const parsed = JSON.parse(raw) as Partial<HudLayoutFile>;
    if (!parsed || typeof parsed !== 'object' || parsed.v !== 1) return fresh;
    fresh.locked = parsed.locked !== false;
    fresh.portrait = readSpots(parsed.portrait);
    fresh.wide = readSpots(parsed.wide);
    return fresh;
  } catch {
    return fresh;
  }
}

/**
 * Keep a window inside the safe area. A window larger than the screen stays
 * pinned to the safe origin so a sliver of it remains on screen.
 */
export function clampHudPoint(
  x: number,
  y: number,
  width: number,
  height: number,
  viewWidth: number,
  viewHeight: number,
  inset: HudInset = EMPTY_INSET,
): HudPoint {
  const minX = Number.isFinite(inset.left) ? inset.left : 0;
  const minY = Number.isFinite(inset.top) ? inset.top : 0;
  const safeRight = viewWidth - (Number.isFinite(inset.right) ? inset.right : 0);
  const safeBottom = viewHeight - (Number.isFinite(inset.bottom) ? inset.bottom : 0);
  const roomX = Math.max(0, safeRight - minX);
  const roomY = Math.max(0, safeBottom - minY);
  const keepX = Math.min(Math.max(width, 1), Math.max(32, roomX));
  const keepY = Math.min(Math.max(height, 1), Math.max(32, roomY));
  const maxX = minX + Math.max(0, roomX - (roomX >= width ? width : keepX));
  const maxY = minY + Math.max(0, roomY - (roomY >= height ? height : keepY));
  return {
    x: Math.round(Math.min(maxX, Math.max(minX, x))),
    y: Math.round(Math.min(maxY, Math.max(minY, y))),
  };
}

export type HudLayoutCtl = {
  isLocked: () => boolean;
  setLocked: (locked: boolean) => void;
  reset: () => void;
  refresh: () => void;
};

function readInset(name: string): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name);
  const value = parseFloat(raw);
  return Number.isFinite(value) ? value : 0;
}

function insets(): HudInset {
  return {
    top: readInset('--sat'),
    right: readInset('--sar'),
    bottom: readInset('--sab'),
    left: readInset('--sal'),
  };
}

function mode(): HudMode {
  return document.getElementById('app')?.dataset.layout === 'wide' ? 'wide' : 'portrait';
}

function widgets(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('[data-hud]')];
}

function store(): HudLayoutFile {
  try {
    return parseHudLayout(localStorage.getItem(HUD_LAYOUT_KEY));
  } catch {
    return defaultHudLayout();
  }
}

function persist(file: HudLayoutFile): void {
  try {
    localStorage.setItem(HUD_LAYOUT_KEY, JSON.stringify(file));
  } catch {
    /* private mode */
  }
}

function paintLock(locked: boolean): void {
  document.documentElement.dataset.hudLock = locked ? '1' : '0';
  const button = document.getElementById('hud-lock');
  if (!button) return;
  button.setAttribute('aria-pressed', locked ? 'true' : 'false');
  button.setAttribute(
    'aria-label',
    locked ? 'Layout locked. Unlock to move windows.' : 'Layout unlocked. Drag the outlined windows, then lock to play.',
  );
}

function place(el: HTMLElement, point: HudPoint, width = 0): void {
  el.classList.add('is-placed');
  el.style.left = `${point.x}px`;
  el.style.top = `${point.y}px`;
  if (width > 1) el.style.width = `${Math.round(width)}px`;
}

function clearPlace(el: HTMLElement): void {
  el.classList.remove('is-placed');
  el.style.left = '';
  el.style.top = '';
  el.style.width = '';
}

function measure(el: HTMLElement): { width: number; height: number } {
  const rect = el.getBoundingClientRect();
  return {
    width: rect.width || el.offsetWidth || 48,
    height: rect.height || el.offsetHeight || 48,
  };
}

function applyFile(file: HudLayoutFile): void {
  paintLock(file.locked);
  const spots = file[mode()];
  for (const el of widgets()) {
    const id = el.dataset.hud;
    if (!id || !isHudId(id)) continue;
    const spot = spots[id];
    if (!spot) {
      clearPlace(el);
      continue;
    }
    if (el.hidden || getComputedStyle(el).display === 'none') continue;
    const size = measure(el);
    place(el, clampHudPoint(spot.x, spot.y, size.width, size.height, window.innerWidth, window.innerHeight, insets()), size.width);
  }
}

export function bindHudLayout(): HudLayoutCtl {
  let file = store();
  let drag: { id: HudId; pointer: number; x: number; y: number; originX: number; originY: number; width: number; height: number; moved: boolean } | null = null;

  const refresh = () => {
    file = store();
    applyFile(file);
  };

  const commit = (id: HudId, point: HudPoint) => {
    const next = store();
    next[mode()][id] = point;
    file = next;
    persist(next);
  };

  document.addEventListener(
    'pointerdown',
    (event) => {
      if (event.button !== 0) return;
      if (file.locked || drag) return;
      const widget = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-hud]');
      if (!widget || widget.hidden) return;
      const id = widget.dataset.hud;
      if (!id || !isHudId(id)) return;
      event.preventDefault();
      event.stopPropagation();
      const rect = widget.getBoundingClientRect();
      drag = {
        id,
        pointer: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        originX: rect.left,
        originY: rect.top,
        width: rect.width,
        height: rect.height,
        moved: false,
      };
      widget.setPointerCapture(event.pointerId);
    },
    true,
  );

  document.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.pointer) return;
    if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 4) return;
    drag.moved = true;
    const widget = widgets().find((el) => el.dataset.hud === drag?.id);
    if (!widget) return;
    const next = clampHudPoint(
      drag.originX + event.clientX - drag.x,
      drag.originY + event.clientY - drag.y,
      drag.width,
      drag.height,
      window.innerWidth,
      window.innerHeight,
      insets(),
    );
    place(widget, next, drag.width);
  });

  const endDrag = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.pointer) return;
    const current = drag;
    drag = null;
    if (!current.moved) return;
    const widget = widgets().find((el) => el.dataset.hud === current.id);
    const next = clampHudPoint(
      current.originX + event.clientX - current.x,
      current.originY + event.clientY - current.y,
      current.width,
      current.height,
      window.innerWidth,
      window.innerHeight,
      insets(),
    );
    if (widget) place(widget, next, current.width);
    commit(current.id, next);
  };
  document.addEventListener('pointerup', endDrag);
  document.addEventListener('pointercancel', endDrag);

  const onResize = () => {
    const live = store();
    const spots = live[mode()];
    let changed = false;
    for (const el of widgets()) {
      const id = el.dataset.hud;
      if (!id || !isHudId(id) || !el.classList.contains('is-placed')) continue;
      if (el.hidden || getComputedStyle(el).display === 'none') continue;
      const spot = spots[id];
      if (!spot) continue;
      const size = measure(el);
      const next = clampHudPoint(spot.x, spot.y, size.width, size.height, window.innerWidth, window.innerHeight, insets());
      place(el, next, size.width);
      if (next.x !== spot.x || next.y !== spot.y) {
        spots[id] = next;
        changed = true;
      }
    }
    if (changed) persist(live);
    else applyFile(live);
    file = live;
  };
  window.addEventListener('resize', onResize);
  window.visualViewport?.addEventListener('resize', onResize);

  applyFile(file);

  return {
    isLocked: () => store().locked,
    setLocked: (locked: boolean) => {
      const next = store();
      next.locked = locked;
      file = next;
      persist(next);
      paintLock(locked);
    },
    reset: () => {
      const locked = store().locked;
      file = defaultHudLayout();
      file.locked = locked;
      persist(file);
      applyFile(file);
    },
    refresh,
  };
}
