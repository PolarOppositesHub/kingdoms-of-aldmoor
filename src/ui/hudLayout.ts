/** Per-device HUD positions and sizes. Kept out of the character save so old heroes still load. */

export const HUD_LAYOUT_KEY = 'aldmoor-hud-layout';

export const HUD_IDS = ['vitals', 'target', 'pet', 'hotbar-a', 'hotbar-b', 'pad', 'sit', 'maps', 'log', 'util', 'menu'] as const;

export const SHEET_IDS = ['dialogue', 'merchant', 'pack', 'help', 'inspect', 'journal', 'book', 'maps', 'settings'] as const;

export type HudId = (typeof HUD_IDS)[number];
export type SheetId = (typeof SHEET_IDS)[number];
export type HudMode = 'portrait' | 'wide';
export type HudPoint = { x: number; y: number };
export type HudBox = { x: number; y: number; w: number; h: number };
export type HudSpot = HudPoint & { w?: number; h?: number };
export type SheetSpot = { w: number; h: number; x?: number; y?: number };
export type HudInset = { top: number; right: number; bottom: number; left: number };
export type HudLimits = { minW: number; minH: number; maxW: number; maxH: number; square?: boolean };
export type HudFit = { hotbar?: 'bar' | 'arc' };

export type HudLayoutFile = {
  v: 1;
  locked: boolean;
  portrait: Partial<Record<HudId, HudSpot>>;
  wide: Partial<Record<HudId, HudSpot>>;
  sheets: Partial<Record<SheetId, SheetSpot>>;
};

const EMPTY_INSET: HudInset = { top: 0, right: 0, bottom: 0, left: 0 };

export const HUD_LIMITS: Record<HudId, HudLimits> = {
  vitals: { minW: 148, minH: 64, maxW: 420, maxH: 220 },
  target: { minW: 168, minH: 96, maxW: 460, maxH: 240 },
  pet: { minW: 156, minH: 96, maxW: 420, maxH: 320 },
  'hotbar-a': { minW: 188, minH: 76, maxW: 560, maxH: 160 },
  'hotbar-b': { minW: 180, minH: 180, maxW: 320, maxH: 340 },
  pad: { minW: 88, minH: 88, maxW: 180, maxH: 180, square: true },
  sit: { minW: 40, minH: 40, maxW: 88, maxH: 88, square: true },
  maps: { minW: 44, minH: 84, maxW: 72, maxH: 180 },
  log: { minW: 128, minH: 24, maxW: 480, maxH: 240 },
  util: { minW: 132, minH: 36, maxW: 360, maxH: 180 },
  menu: { minW: 112, minH: 72, maxW: 280, maxH: 180 },
};

const RESIZE_LABEL: Record<HudId, string> = {
  vitals: 'Resize player bars',
  target: 'Resize target window',
  pet: 'Resize pet window',
  'hotbar-a': 'Resize hotbar',
  'hotbar-b': 'Resize arc hotbar',
  pad: 'Resize movement pad',
  sit: 'Resize sit button',
  maps: 'Resize map buttons',
  log: 'Resize log',
  util: 'Resize action buttons',
  menu: 'Resize menu',
};

export function defaultHudLayout(): HudLayoutFile {
  return { v: 1, locked: true, portrait: {}, wide: {}, sheets: {} };
}

/** Drop saved spots and sizes. The lock stays where the player left it. */
export function resetHudLayout(file: HudLayoutFile): HudLayoutFile {
  const next = defaultHudLayout();
  next.locked = file.locked;
  return next;
}

function isHudId(value: string): value is HudId {
  return (HUD_IDS as readonly string[]).includes(value);
}

function isSheetId(value: string): value is SheetId {
  return (SHEET_IDS as readonly string[]).includes(value);
}

function readDim(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return undefined;
  return Math.round(value);
}

function readPoint(value: unknown): HudPoint | null {
  if (!value || typeof value !== 'object') return null;
  const point = value as Partial<HudPoint>;
  if (typeof point.x !== 'number' || typeof point.y !== 'number') return null;
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return null;
  return { x: point.x, y: point.y };
}

function readSpot(value: unknown): HudSpot | null {
  const point = readPoint(value);
  if (!point) return null;
  const raw = value as Partial<HudSpot>;
  const w = readDim(raw.w);
  const h = readDim(raw.h);
  return { x: point.x, y: point.y, ...(w ? { w } : {}), ...(h ? { h } : {}) };
}

function readSpots(value: unknown): Partial<Record<HudId, HudSpot>> {
  const spots: Partial<Record<HudId, HudSpot>> = {};
  if (!value || typeof value !== 'object') return spots;
  for (const [key, point] of Object.entries(value)) {
    if (!isHudId(key)) continue;
    const next = readSpot(point);
    if (next) spots[key] = next;
  }
  return spots;
}

function readSheet(value: unknown): SheetSpot | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<SheetSpot>;
  const w = readDim(raw.w);
  const h = readDim(raw.h);
  if (!w || !h) return null;
  const spot: SheetSpot = { w, h };
  if (typeof raw.x === 'number' && Number.isFinite(raw.x)) spot.x = Math.round(raw.x);
  if (typeof raw.y === 'number' && Number.isFinite(raw.y)) spot.y = Math.round(raw.y);
  return spot;
}

function readSheets(value: unknown): Partial<Record<SheetId, SheetSpot>> {
  const sheets: Partial<Record<SheetId, SheetSpot>> = {};
  if (!value || typeof value !== 'object') return sheets;
  for (const [key, spot] of Object.entries(value)) {
    if (!isSheetId(key)) continue;
    const next = readSheet(spot);
    if (next) sheets[key] = next;
  }
  return sheets;
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
    fresh.sheets = readSheets(parsed.sheets);
    return fresh;
  } catch {
    return fresh;
  }
}

export function sheetLimits(kind: SheetId): HudLimits {
  if (kind === 'pack') return { minW: 260, minH: 240, maxW: 520, maxH: 900 };
  if (kind === 'maps') return { minW: 240, minH: 200, maxW: 640, maxH: 900 };
  return { minW: 240, minH: 180, maxW: 560, maxH: 860 };
}

function finiteInset(value: number): number {
  return Number.isFinite(value) ? value : 0;
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
  const minX = finiteInset(inset.left);
  const minY = finiteInset(inset.top);
  const safeRight = viewWidth - finiteInset(inset.right);
  const safeBottom = viewHeight - finiteInset(inset.bottom);
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

function clampDim(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

/**
 * Fit a width and height to the window's limits and to the room that is
 * actually on screen. Limits give way when the viewport is smaller than them.
 */
export function clampHudBox(box: HudBox, limits: HudLimits, viewWidth: number, viewHeight: number, inset: HudInset = EMPTY_INSET): HudBox {
  const minX = finiteInset(inset.left);
  const minY = finiteInset(inset.top);
  const maxX = viewWidth - finiteInset(inset.right);
  const maxY = viewHeight - finiteInset(inset.bottom);
  const roomW = Math.max(32, maxX - minX);
  const roomH = Math.max(32, maxY - minY);
  const minW = Math.min(limits.minW, roomW);
  const minH = Math.min(limits.minH, roomH);
  const maxW = Math.max(minW, Math.min(limits.maxW, roomW));
  const maxH = Math.max(minH, Math.min(limits.maxH, roomH));
  let w = clampDim(box.w, minW, maxW);
  let h = clampDim(box.h, minH, maxH);
  if (limits.square) {
    const side = clampDim(Math.max(w, h), Math.max(minW, minH), Math.min(maxW, maxH));
    w = side;
    h = side;
  }
  const point = clampHudPoint(box.x, box.y, w, h, viewWidth, viewHeight, inset);
  if (point.x + w > maxX) w = Math.max(32, maxX - point.x);
  if (point.y + h > maxY) h = Math.max(32, maxY - point.y);
  if (limits.square) {
    const side = Math.min(w, h);
    w = side;
    h = side;
  }
  return { x: point.x, y: point.y, w: Math.round(w), h: Math.round(h) };
}

/**
 * Bottom-right resize. The top-left stays put and the size stops at the
 * screen edge and at the window's min and max.
 */
export function resizeHudBox(
  start: HudBox,
  dx: number,
  dy: number,
  limits: HudLimits,
  viewWidth: number,
  viewHeight: number,
  inset: HudInset = EMPTY_INSET,
): HudBox {
  let dw = dx;
  let dh = dy;
  if (limits.square) {
    const delta = Math.abs(dx) >= Math.abs(dy) ? dx : dy;
    dw = delta;
    dh = delta;
  }
  const minX = finiteInset(inset.left);
  const minY = finiteInset(inset.top);
  const maxX = viewWidth - finiteInset(inset.right);
  const maxY = viewHeight - finiteInset(inset.bottom);
  let x = Math.max(minX, start.x);
  let y = Math.max(minY, start.y);
  const roomW = Math.max(32, maxX - x);
  const roomH = Math.max(32, maxY - y);
  const minW = Math.min(limits.minW, roomW);
  const minH = Math.min(limits.minH, roomH);
  const maxW = Math.max(minW, Math.min(limits.maxW, roomW));
  const maxH = Math.max(minH, Math.min(limits.maxH, roomH));
  let w = clampDim(start.w + dw, minW, maxW);
  let h = clampDim(start.h + dh, minH, maxH);
  if (limits.square) {
    const side = clampDim(Math.min(w, h), Math.max(minW, minH), Math.min(maxW, maxH, roomW, roomH));
    w = side;
    h = side;
  }
  if (x + w > maxX) w = Math.max(32, maxX - x);
  if (y + h > maxY) h = Math.max(32, maxY - y);
  if (limits.square) {
    const side = Math.min(w, h);
    w = side;
    h = side;
  }
  return { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) };
}

export function windowsOverlap(a: HudBox, b: HudBox): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function safeFrame(viewWidth: number, viewHeight: number, inset: HudInset) {
  const left = finiteInset(inset.left);
  const top = finiteInset(inset.top);
  const right = viewWidth - finiteInset(inset.right);
  const bottom = viewHeight - finiteInset(inset.bottom);
  return { left, top, right, bottom, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
}

/**
 * Default window geometry for this viewport. 390×844 portrait with the stone
 * hotbar matches the measured phone layout. Shorter, narrower, and wider
 * phones get a tighter stack so the open windows stay on screen together.
 */
export function defaultHudBox(
  id: HudId,
  mode: HudMode,
  viewWidth: number,
  viewHeight: number,
  inset: HudInset = EMPTY_INSET,
  fit: HudFit = {},
): HudBox {
  const frame = safeFrame(viewWidth, viewHeight, inset);
  const boxes = mode === 'wide' ? wideBoxes(frame, fit) : portraitBoxes(frame, fit);
  return clampHudBox(boxes[id], HUD_LIMITS[id], viewWidth, viewHeight, inset);
}

export function resolveHudBox(
  id: HudId,
  spot: HudSpot | undefined,
  mode: HudMode,
  viewWidth: number,
  viewHeight: number,
  inset: HudInset = EMPTY_INSET,
  fit: HudFit = {},
): HudBox {
  const base = defaultHudBox(id, mode, viewWidth, viewHeight, inset, fit);
  return clampHudBox(
    {
      x: spot?.x ?? base.x,
      y: spot?.y ?? base.y,
      w: spot?.w ?? base.w,
      h: spot?.h ?? base.h,
    },
    HUD_LIMITS[id],
    viewWidth,
    viewHeight,
    inset,
  );
}

export function defaultSheetBox(kind: SheetId, viewWidth: number, viewHeight: number, inset: HudInset = EMPTY_INSET): HudBox {
  const frame = safeFrame(viewWidth, viewHeight, inset);
  const limits = sheetLimits(kind);
  const compact = frame.height <= 760 || frame.width <= 384;
  const width = Math.min(kind === 'pack' ? 400 : 480, frame.width - 16, compact ? 360 : 520);
  const height = Math.min(kind === 'pack' ? 680 : 560, Math.round(frame.height * (compact ? 0.74 : 0.78)));
  const w = Math.max(limits.minW, width);
  const h = Math.max(limits.minH, height);
  return clampHudBox(
    {
      x: frame.left + Math.max(8, Math.round((frame.width - w) / 2)),
      y: frame.bottom - 12 - h,
      w,
      h,
    },
    limits,
    viewWidth,
    viewHeight,
    inset,
  );
}

type Frame = ReturnType<typeof safeFrame>;

/** Journal, spells, and settings. Beside the target when the map is wide, otherwise in the gap right of the health bars. */
function portraitMenu(frame: Frame, target: HudBox, vitals: HudBox, log: HudBox, util: HudBox): HudBox {
  const beside = frame.right - 8 - (target.x + target.w);
  if (beside >= 160) {
    const w = Math.min(220, beside - 8);
    return { x: target.x + target.w + 8, y: target.y, w, h: 76 };
  }
  const gap = frame.right - 8 - (vitals.x + vitals.w);
  const w = Math.min(156, Math.max(112, gap));
  const x = frame.right - 8 - w;
  const room = log.y - vitals.y - 6;
  if (room >= 100) return { x, y: vitals.y, w, h: Math.min(148, room) };
  const top = log.y + log.h + 6;
  const limit = util.y - 8;
  const avail = Math.max(72, limit - top);
  const h = Math.min(140, avail);
  return { x, y: limit - h, w, h };
}

function wideMenu(maps: HudBox, target: HudBox): HudBox {
  const x = maps.x + maps.w + 8;
  const avail = target.x - 8 - x;
  if (avail >= 140) return { x, y: maps.y, w: Math.min(220, avail), h: 72 };
  return { x: maps.x, y: maps.y + maps.h + 8, w: Math.max(140, maps.w + 96), h: 84 };
}

function portraitBoxes(frame: Frame, fit: HudFit): Record<HudId, HudBox> {
  const { left, top, right, bottom, width, height } = frame;
  const compact = height <= 760 || width <= 384;
  const roomy = width >= 414 && height >= 900;
  const arc = fit.hotbar === 'arc';
  if (compact) return portraitCompact(frame, arc);
  if (roomy) return portraitRoomy(frame, arc);
  const target = { x: left + 58, y: top + 50, w: 236, h: 112 };
  const vitals = { x: left + 8, y: top + 174, w: 236, h: 89 };
  const log = { x: left + 8, y: top + 286, w: Math.min(250, width - 16), h: 48 };
  const pet = { x: left + 8, y: top + 346, w: 220, h: 174 };
  const pad = { x: left + 8, y: bottom - (arc ? 24 : 14) - 118, w: 118, h: 118 };
  const hotA = { x: left + 132, y: bottom - 8 - 90, w: Math.max(188, right - 8 - (left + 132)), h: 90 };
  const sit = arc
    ? { x: right - 4 - 42, y: bottom - 214 - 42, w: 42, h: 42 }
    : { x: right - 8 - 56, y: bottom - 104 - 56, w: 56, h: 56 };
  const hotB = { x: right - 4 - 220, y: bottom - 16 - 240, w: 220, h: 240 };
  const util = arc
    ? {
        x: pet.x + pet.w + 6,
        y: Math.min(sit.y, hotB.y) - 8 - 72,
        w: Math.max(132, right - 8 - (pet.x + pet.w + 6)),
        h: 72,
      }
    : { x: right - 8 - 210, y: bottom - 188 - 64, w: 210, h: 64 };
  return {
    maps: { x: left + 8, y: top + 8, w: 44, h: 94 },
    target,
    vitals,
    log,
    pet,
    pad,
    sit,
    'hotbar-a': hotA,
    'hotbar-b': hotB,
    util,
    menu: portraitMenu(frame, target, vitals, log, util),
  };
}

function portraitCompact(frame: Frame, arc: boolean): Record<HudId, HudBox> {
  const { left, top, right, bottom, width } = frame;
  const padSize = 100;
  const hotH = 84;
  const hotX = left + padSize + 12;
  const hotA = { x: hotX, y: bottom - 8 - hotH, w: Math.max(188, right - 8 - hotX), h: hotH };
  const pad = { x: left + 8, y: bottom - (arc ? 20 : 10) - padSize, w: padSize, h: padSize };
  const arcW = Math.min(210, Math.max(180, width - padSize - 28));
  const arcH = 188;
  const hotB = { x: right - 4 - arcW, y: bottom - 12 - arcH, w: arcW, h: arcH };
  const sit = arc
    ? { x: right - 4 - 42, y: hotB.y + 8, w: 42, h: 42 }
    : { x: right - 8 - 48, y: hotA.y - 6 - 48, w: 48, h: 48 };
  const util = arc
    ? { x: right - 8 - 148, y: hotB.y - 8 - 72, w: 148, h: 72 }
    : { x: right - 8 - 176, y: sit.y - 6 - 72, w: 176, h: 72 };
  const target = { x: left + 56, y: top + 44, w: Math.min(210, width - 64), h: 112 };
  const vitals = { x: left + 8, y: target.y + target.h + 6, w: Math.min(210, width - 16), h: 92 };
  const log = { x: left + 8, y: vitals.y + vitals.h + 4, w: Math.min(210, width - 16), h: 48 };
  const petW = Math.min(196, Math.max(156, (arc ? util.x : right) - left - 16));
  const petY = log.y + log.h + 4;
  const clusterTop = arc ? hotB.y : util.y;
  const room = clusterTop - 8 - petY;
  const pet = { x: left + 8, y: petY, w: petW, h: room >= 96 ? Math.min(150, room) : 96 };
  return {
    maps: { x: left + 8, y: top + 8, w: 44, h: 94 },
    target,
    vitals,
    log,
    pet,
    pad,
    sit,
    'hotbar-a': hotA,
    'hotbar-b': hotB,
    util,
    menu: portraitMenu(frame, target, vitals, log, util),
  };
}

function portraitRoomy(frame: Frame, arc: boolean): Record<HudId, HudBox> {
  const { left, top, right, bottom, width } = frame;
  const padSize = 128;
  const hotH = 96;
  const hotX = left + padSize + 16;
  const hotA = { x: hotX, y: bottom - 8 - hotH, w: Math.max(200, right - 8 - hotX), h: hotH };
  const pad = { x: left + 8, y: bottom - (arc ? 24 : 12) - padSize, w: padSize, h: padSize };
  const hotB = { x: right - 8 - 240, y: bottom - 16 - 260, w: 240, h: 260 };
  const sit = arc
    ? { x: right - 8 - 48, y: hotB.y - 8 - 48, w: 48, h: 48 }
    : { x: right - 8 - 56, y: hotA.y - 8 - 56, w: 56, h: 56 };
  const target = { x: left + 64, y: top + 48, w: Math.min(280, width - 80), h: 120 };
  const vitals = { x: left + 8, y: target.y + target.h + 8, w: Math.min(280, width - 16), h: 96 };
  const log = { x: left + 8, y: vitals.y + vitals.h + 6, w: Math.min(300, width - 16), h: 36 };
  const pet = { x: left + 8, y: log.y + log.h + 8, w: Math.min(250, width - 16), h: 180 };
  const util = arc
    ? { x: right - 8 - 180, y: sit.y - 8 - 72, w: 180, h: 72 }
    : { x: right - 8 - 220, y: sit.y - 8 - 68, w: 220, h: 68 };
  return {
    maps: { x: left + 8, y: top + 8, w: 44, h: 94 },
    target,
    vitals,
    log,
    pet,
    pad,
    sit,
    'hotbar-a': hotA,
    'hotbar-b': hotB,
    util,
    menu: portraitMenu(frame, target, vitals, log, util),
  };
}

function wideBoxes(frame: Frame, fit: HudFit): Record<HudId, HudBox> {
  const { left, top, right, bottom, width, height } = frame;
  const side = Math.max(156, Math.min(220, Math.round((right - left) * 0.24)));
  const gutter = 8;
  const colW = Math.max(148, side - 16);
  const short = height <= 520;
  const arc = fit.hotbar === 'arc';
  const vitalsH = short ? 64 : 108;
  const logH = short ? 48 : 52;
  const padSize = short ? 88 : Math.min(124, colW);
  const chrome = 44;
  const targetH = short ? 104 : 120;
  const hotH = short ? 90 : 100;
  const sitSize = arc ? 44 : 56;
  const vitals = { x: left + gutter, y: top + gutter, w: colW, h: vitalsH };
  const log = { x: left + gutter, y: vitals.y + vitals.h + 4, w: colW, h: logH };
  const pad = { x: left + gutter, y: bottom - gutter - chrome - padSize, w: padSize, h: padSize };
  const petY = log.y + log.h + 6;
  const petRoom = pad.y - 8 - petY;
  const petH = Math.max(96, Math.min(short ? 140 : 180, petRoom));
  const pet = { x: left + gutter, y: petY, w: Math.max(156, Math.min(220, colW)), h: petH };
  const hotW = Math.min(Math.max(colW, 200), width - 16);
  const hotA = { x: right - gutter - hotW, y: bottom - gutter - hotH, w: hotW, h: hotH };
  const arcW = Math.min(220, Math.max(180, width - colW - 48));
  const arcH = Math.min(240, Math.max(180, height - targetH - 36));
  const hotB = { x: right - gutter - arcW, y: bottom - gutter - arcH, w: arcW, h: arcH };
  const anchor = arc ? hotB : hotA;
  const sit = {
    x: Math.max(left + gutter, anchor.x - 8 - sitSize),
    y: bottom - gutter - sitSize,
    w: sitSize,
    h: sitSize,
  };
  if (sit.x + sit.w > anchor.x - 4 && sit.y + sit.h > anchor.y) sit.y = Math.max(top + gutter, anchor.y - 8 - sitSize);
  const targetW = Math.min(Math.max(colW, 180), hotW);
  const target = { x: right - gutter - targetW, y: top + gutter, w: targetW, h: targetH };
  const utilW = Math.min(colW, 210);
  const util = { x: right - gutter - utilW, y: target.y + target.h + 8, w: utilW, h: short ? 68 : 72 };
  if (windowsOverlap(util, anchor) || util.y + util.h > anchor.y - 4) {
    util.h = short ? 64 : 72;
    util.w = Math.min(utilW, Math.max(148, anchor.x - (left + colW + 24)));
    util.x = Math.max(left + colW + 12, anchor.x - 8 - util.w);
    util.y = Math.max(top + targetH + 12, sit.y - 8 - util.h);
  }
  const maps = { x: left + side + 8, y: top + gutter, w: 44, h: 94 };
  return {
    maps,
    target,
    vitals,
    log,
    pet,
    pad,
    sit,
    'hotbar-a': hotA,
    'hotbar-b': hotB,
    util,
    menu: wideMenu(maps, target),
  };
}

export type HudLayoutCtl = {
  isLocked: () => boolean;
  setLocked: (locked: boolean) => void;
  reset: () => void;
  refresh: () => void;
  mountSheet: (sheet: HTMLElement, kind: SheetId) => void;
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

function fit(): HudFit {
  return { hotbar: document.documentElement.dataset.hotbar === 'arc' ? 'arc' : 'bar' };
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
    locked
      ? 'Layout locked. Unlock to move or resize windows.'
      : 'Layout unlocked. Drag a window to move it, drag its corner to resize, then lock to play.',
  );
}

function paintDensity(viewWidth: number, viewHeight: number): void {
  const frame = safeFrame(viewWidth, viewHeight, insets());
  const compact = frame.height <= 760 || frame.width <= 384;
  const roomy = frame.width >= 414 && frame.height >= 900;
  document.documentElement.dataset.hudDensity = compact ? 'compact' : roomy ? 'roomy' : 'regular';
}

function resizeHandle(label: string): string {
  return `<button type="button" class="resize-handle" tabindex="-1" aria-label="${label}"></button>`;
}

function dragHandle(label: string): string {
  return `<button type="button" class="drag-handle" tabindex="-1" aria-label="${label}"><span class="grip" aria-hidden="true"></span></button>`;
}

function ensureResizeHandle(el: HTMLElement, label: string): void {
  if (el.querySelector('.resize-handle')) return;
  el.insertAdjacentHTML('beforeend', resizeHandle(label));
}

function paintWidget(el: HTMLElement, box: HudBox, placed: boolean, sized: boolean): void {
  el.classList.add('is-fit');
  el.classList.toggle('is-placed', placed);
  el.classList.toggle('is-sized', sized);
  el.style.left = `${box.x}px`;
  el.style.top = `${box.y}px`;
  el.style.width = `${box.w}px`;
  el.style.height = `${box.h}px`;
}

function clearWidget(el: HTMLElement): void {
  el.classList.remove('is-fit', 'is-placed', 'is-sized');
  el.style.left = '';
  el.style.top = '';
  el.style.width = '';
  el.style.height = '';
}

function hidden(el: HTMLElement): boolean {
  return el.hidden || getComputedStyle(el).display === 'none';
}

function viewSize(): { width: number; height: number } {
  return { width: window.innerWidth, height: window.innerHeight };
}

function applyFile(file: HudLayoutFile): void {
  paintLock(file.locked);
  const { width, height } = viewSize();
  paintDensity(width, height);
  const current = mode();
  const style = fit();
  const edge = insets();
  const spots = file[current];
  for (const el of widgets()) {
    const id = el.dataset.hud;
    if (!id || !isHudId(id)) continue;
    ensureResizeHandle(el, RESIZE_LABEL[id]);
    if (hidden(el)) continue;
    const spot = spots[id];
    const box = resolveHudBox(id, spot, current, width, height, edge, style);
    paintWidget(el, box, Boolean(spot), Boolean(spot?.w || spot?.h));
  }
  for (const sheet of document.querySelectorAll<HTMLElement>('[data-sheet]')) {
    const kind = sheet.dataset.sheet;
    if (!kind || !isSheetId(kind)) continue;
    paintSheet(sheet, kind, file, width, height, edge);
  }
}

function paintSheet(sheet: HTMLElement, kind: SheetId, file: HudLayoutFile, width: number, height: number, edge: HudInset): void {
  ensureResizeHandle(sheet, 'Resize window');
  if (!sheet.querySelector('.drag-handle')) {
    sheet.insertAdjacentHTML('afterbegin', dragHandle('Move window'));
  }
  const saved = file.sheets[kind];
  if (!saved) {
    sheet.classList.remove('is-sized', 'is-placed');
    sheet.style.left = '';
    sheet.style.top = '';
    sheet.style.width = '';
    sheet.style.height = '';
    sheet.style.position = '';
    return;
  }
  const base = defaultSheetBox(kind, width, height, edge);
  const box = clampHudBox(
    { x: saved.x ?? base.x, y: saved.y ?? base.y, w: saved.w, h: saved.h },
    sheetLimits(kind),
    width,
    height,
    edge,
  );
  sheet.classList.add('is-sized');
  sheet.classList.toggle('is-placed', saved.x !== undefined && saved.y !== undefined);
  sheet.style.position = 'fixed';
  sheet.style.left = `${box.x}px`;
  sheet.style.top = `${box.y}px`;
  sheet.style.width = `${box.w}px`;
  sheet.style.height = `${box.h}px`;
}

type Gesture = {
  kind: 'move' | 'resize';
  id: string;
  sheet: boolean;
  pointer: number;
  x: number;
  y: number;
  originX: number;
  originY: number;
  w: number;
  h: number;
  moved: boolean;
};

export function bindHudLayout(): HudLayoutCtl {
  let file = store();
  let gesture: Gesture | null = null;
  let frame = 0;
  let pending: { x: number; y: number } | null = null;

  const refresh = () => {
    file = store();
    applyFile(file);
  };

  const liveBox = (current: Gesture, clientX: number, clientY: number): HudBox => {
    const { width, height } = viewSize();
    const edge = insets();
    if (current.kind === 'resize') {
      const limits = current.sheet && isSheetId(current.id) ? sheetLimits(current.id) : isHudId(current.id) ? HUD_LIMITS[current.id] : HUD_LIMITS.log;
      return resizeHudBox(
        { x: current.originX, y: current.originY, w: current.w, h: current.h },
        clientX - current.x,
        clientY - current.y,
        limits,
        width,
        height,
        edge,
      );
    }
    const point = clampHudPoint(
      current.originX + clientX - current.x,
      current.originY + clientY - current.y,
      current.w,
      current.h,
      width,
      height,
      edge,
    );
    return { ...point, w: current.w, h: current.h };
  };

  const paintGesture = (current: Gesture, clientX: number, clientY: number) => {
    const box = liveBox(current, clientX, clientY);
    if (current.sheet) {
      const sheet = document.querySelector<HTMLElement>(`[data-sheet="${current.id}"]`);
      if (!sheet) return;
      sheet.classList.add('is-sized', 'is-placed');
      sheet.style.position = 'fixed';
      sheet.style.left = `${box.x}px`;
      sheet.style.top = `${box.y}px`;
      sheet.style.width = `${box.w}px`;
      sheet.style.height = `${box.h}px`;
      return;
    }
    const widget = widgets().find((el) => el.dataset.hud === current.id);
    if (!widget) return;
    paintWidget(widget, box, true, current.kind === 'resize' || Boolean(file[mode()][current.id as HudId]?.w));
  };

  const commit = (current: Gesture, clientX: number, clientY: number) => {
    const box = liveBox(current, clientX, clientY);
    const next = store();
    if (current.sheet && isSheetId(current.id)) {
      const prev = next.sheets[current.id];
      next.sheets[current.id] = {
        x: box.x,
        y: box.y,
        w: box.w,
        h: box.h,
        ...(prev ? {} : {}),
      };
    } else if (isHudId(current.id)) {
      const prev = next[mode()][current.id];
      const spot: HudSpot = { x: box.x, y: box.y };
      if (current.kind === 'resize') {
        spot.w = box.w;
        spot.h = box.h;
      } else {
        if (prev?.w) spot.w = prev.w;
        if (prev?.h) spot.h = prev.h;
      }
      next[mode()][current.id] = spot;
    }
    file = next;
    persist(next);
    applyFile(next);
  };

  document.addEventListener(
    'pointerdown',
    (event) => {
      if (event.button !== 0 || gesture) return;
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const handle = target.closest<HTMLElement>('.resize-handle, .drag-handle');
      const host = target.closest<HTMLElement>('[data-hud], [data-sheet]');
      if (!host) return;
      const resizing = Boolean(target.closest('.resize-handle'));
      const sheet = Boolean(host.dataset.sheet);
      if (sheet && !handle) return;
      if (file.locked) return;
      if (!resizing && target.closest('.resize-handle')) return;
      const id = sheet ? host.dataset.sheet : host.dataset.hud;
      if (!id || (sheet ? !isSheetId(id) : !isHudId(id))) return;
      event.preventDefault();
      event.stopPropagation();
      const rect = host.getBoundingClientRect();
      gesture = {
        kind: resizing ? 'resize' : 'move',
        id,
        sheet,
        pointer: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        originX: rect.left,
        originY: rect.top,
        w: rect.width,
        h: rect.height,
        moved: false,
      };
      host.setPointerCapture(event.pointerId);
    },
    true,
  );

  const flush = () => {
    frame = 0;
    if (!gesture || !pending) return;
    paintGesture(gesture, pending.x, pending.y);
  };

  document.addEventListener('pointermove', (event) => {
    if (!gesture || event.pointerId !== gesture.pointer) return;
    if (Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) < 3) return;
    gesture.moved = true;
    pending = { x: event.clientX, y: event.clientY };
    if (!frame) frame = requestAnimationFrame(flush);
  });

  const endGesture = (event: PointerEvent) => {
    if (!gesture || event.pointerId !== gesture.pointer) return;
    const current = gesture;
    gesture = null;
    pending = null;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    if (!current.moved) return;
    commit(current, event.clientX, event.clientY);
  };
  document.addEventListener('pointerup', endGesture);
  document.addEventListener('pointercancel', endGesture);

  const onResize = () => {
    if (gesture) return;
    const { width, height } = viewSize();
    paintDensity(width, height);
    const live = store();
    const current = mode();
    const style = fit();
    const edge = insets();
    const spots = live[current];
    let changed = false;
    for (const el of widgets()) {
      const id = el.dataset.hud;
      if (!id || !isHudId(id)) continue;
      ensureResizeHandle(el, RESIZE_LABEL[id]);
      if (hidden(el)) continue;
      const spot = spots[id];
      const box = resolveHudBox(id, spot, current, width, height, edge, style);
      paintWidget(el, box, Boolean(spot), Boolean(spot?.w || spot?.h));
      if (!spot) continue;
      const moved = box.x !== spot.x || box.y !== spot.y;
      const sized = (spot.w !== undefined && box.w !== spot.w) || (spot.h !== undefined && box.h !== spot.h);
      if (!moved && !sized) continue;
      const saved: HudSpot = { x: box.x, y: box.y };
      if (spot.w !== undefined) saved.w = box.w;
      if (spot.h !== undefined) saved.h = box.h;
      spots[id] = saved;
      changed = true;
    }
    for (const sheet of document.querySelectorAll<HTMLElement>('[data-sheet]')) {
      const kind = sheet.dataset.sheet;
      if (!kind || !isSheetId(kind)) continue;
      const saved = live.sheets[kind];
      paintSheet(sheet, kind, live, width, height, edge);
      if (!saved) continue;
      const base = defaultSheetBox(kind, width, height, edge);
      const box = clampHudBox(
        { x: saved.x ?? base.x, y: saved.y ?? base.y, w: saved.w, h: saved.h },
        sheetLimits(kind),
        width,
        height,
        edge,
      );
      const next: SheetSpot = { w: box.w, h: box.h };
      if (saved.x !== undefined) next.x = box.x;
      if (saved.y !== undefined) next.y = box.y;
      if (next.w !== saved.w || next.h !== saved.h || next.x !== saved.x || next.y !== saved.y) {
        live.sheets[kind] = next;
        changed = true;
      }
    }
    if (changed) persist(live);
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
      file = resetHudLayout(store());
      persist(file);
      applyFile(file);
    },
    refresh,
    mountSheet: (sheet: HTMLElement, kind: SheetId) => {
      sheet.dataset.sheet = kind;
      ensureResizeHandle(sheet, 'Resize window');
      if (!sheet.querySelector('.drag-handle')) sheet.insertAdjacentHTML('afterbegin', dragHandle('Move window'));
      if (gesture?.sheet && gesture.id === kind) return;
      const { width, height } = viewSize();
      paintSheet(sheet, kind, file, width, height, insets());
    },
  };
}
