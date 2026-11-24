/** Per-character window theme. Old saves omit it and fall back to the race default. */

export const UI_SCALE_MIN = 0.85;
export const UI_SCALE_MAX = 1.35;
export const UI_OPACITY_MIN = 0.45;
export const UI_OPACITY_MAX = 1;

export interface UiPrefs {
  /** `race` follows the hero. `custom` keeps the chosen preset or colors. */
  mode: 'race' | 'custom';
  preset: string;
  accent: string;
  window: string;
  opacity: number;
  scale: number;
  /** Per-window opacity. Missing ids use the global opacity. */
  windows: Record<string, number>;
}

export interface ResolvedTheme {
  preset: string;
  accent: string;
  window: string;
  window2: string;
  bg: string;
  text: string;
  muted: string;
  line: string;
  texture: string;
  opacity: number;
  scale: number;
  windows: Record<string, number>;
}

interface Preset {
  id: string;
  name: string;
  accent: string;
  window: string;
  bg: string;
  texture: string;
}

export const UI_PRESETS: Preset[] = [
  { id: 'valdor', name: 'Valdorian blue', accent: '#e6c15a', window: '#16325c', bg: '#0e2240', texture: 'royal' },
  { id: 'pearl', name: 'High elf pearl', accent: '#6e86a0', window: '#f4f0e6', bg: '#e6e0d4', texture: 'pearl' },
  { id: 'grove', name: 'Wood elf grove', accent: '#d4b070', window: '#1c3424', bg: '#101c14', texture: 'leaf' },
  { id: 'forge', name: 'Dwarf forge', accent: '#e0a050', window: '#3a3028', bg: '#221c16', texture: 'rune' },
  { id: 'mud', name: 'Grokthul mud', accent: '#d4c48a', window: '#3e4a32', bg: '#24301c', texture: 'mud' },
  { id: 'frost', name: 'Hoffender frost', accent: '#e6c15a', window: '#2a211c', bg: '#1c1418', texture: 'frost' },
];

export const RACE_THEME: Record<string, string> = {
  human: 'valdor',
  high_elf: 'pearl',
  wood_elf: 'grove',
  dwarf: 'forge',
  ogre: 'mud',
  barbarian: 'frost',
};

const TEXTURE: Record<string, string> = {
  royal:
    'repeating-linear-gradient(90deg, transparent 0 12px, rgba(230,193,90,0.28) 12px 13px), linear-gradient(180deg, rgba(230,193,90,0.16), transparent 46%)',
  pearl:
    'radial-gradient(circle at 18% 22%, rgba(255,255,255,0.7) 0 1px, transparent 2px), radial-gradient(circle at 72% 58%, rgba(255,255,255,0.45) 0 1px, transparent 2px), radial-gradient(circle at 40% 80%, rgba(210,200,180,0.35) 0 2px, transparent 3px)',
  leaf:
    'linear-gradient(118deg, transparent 42%, rgba(90,140,50,0.35) 43%, transparent 46%), radial-gradient(circle at 24% 36%, rgba(120,170,60,0.4) 0 2px, transparent 3px), radial-gradient(circle at 70% 72%, rgba(40,70,24,0.45) 0 3px, transparent 4px)',
  rune:
    'linear-gradient(#e0a050, #e0a050) 10px 10px / 2px 7px no-repeat, linear-gradient(#e0a050, #e0a050) 10px 10px / 7px 2px no-repeat, linear-gradient(#e0a050, #e0a050) 22px 18px / 2px 7px no-repeat, linear-gradient(#e0a050, #e0a050) 22px 18px / 7px 2px no-repeat',
  mud:
    'radial-gradient(circle at 12% 28%, rgba(70,52,22,0.72) 0 4px, transparent 5px), radial-gradient(circle at 78% 64%, rgba(48,36,16,0.7) 0 6px, transparent 7px), radial-gradient(circle at 46% 82%, rgba(110,82,36,0.55) 0 3px, transparent 4px), radial-gradient(circle at 62% 18%, rgba(40,32,14,0.6) 0 2px, transparent 3px)',
  frost:
    'repeating-linear-gradient(128deg, transparent 0 7px, rgba(255,255,255,0.14) 7px 8px)',
};

export function racePresetId(raceId: string): string {
  return RACE_THEME[raceId] ?? 'frost';
}

export function defaultUi(raceId: string): UiPrefs {
  return {
    mode: 'race',
    preset: racePresetId(raceId),
    accent: '',
    window: '',
    opacity: 1,
    scale: 1,
    windows: {},
  };
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function hexByte(value: string): number | null {
  if (!/^[\da-f]{2}$/i.test(value)) return null;
  return Number.parseInt(value, 16);
}

export function parseHex(value: string): string | null {
  const raw = value.trim().toLowerCase();
  const match = raw.match(/^#([\da-f]{6})$/i);
  if (!match) return null;
  return `#${match[1].toLowerCase()}`;
}

function rgbOf(hex: string): { r: number; g: number; b: number } | null {
  const parsed = parseHex(hex);
  if (!parsed) return null;
  const r = hexByte(parsed.slice(1, 3));
  const g = hexByte(parsed.slice(3, 5));
  const b = hexByte(parsed.slice(5, 7));
  if (r === null || g === null || b === null) return null;
  return { r, g, b };
}

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** Relative luminance. Light grounds need dark ink so the words stay readable. */
export function luminance(hex: string): number {
  const rgb = rgbOf(hex);
  if (!rgb) return 0;
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

export function mixHex(a: string, b: string, t: number): string {
  const left = rgbOf(a);
  const right = rgbOf(b);
  if (!left || !right) return a;
  const pick = (from: number, to: number) => Math.round(from + (to - from) * t);
  const hex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${hex(pick(left.r, right.r))}${hex(pick(left.g, right.g))}${hex(pick(left.b, right.b))}`;
}

function presetById(id: string): Preset {
  return UI_PRESETS.find((preset) => preset.id === id) ?? UI_PRESETS[UI_PRESETS.length - 1];
}

export function normalizeUi(raw: unknown, raceId: string): UiPrefs {
  const base = defaultUi(raceId);
  if (!raw || typeof raw !== 'object') return base;
  const row = raw as Partial<UiPrefs>;
  const known = typeof row.preset === 'string' && (row.preset === 'custom' || UI_PRESETS.some((entry) => entry.id === row.preset));
  const preset = known ? (row.preset as string) : base.preset;
  const windows: Record<string, number> = {};
  if (row.windows && typeof row.windows === 'object') {
    for (const [id, value] of Object.entries(row.windows)) {
      if (typeof value !== 'number') continue;
      windows[id] = clamp(value, UI_OPACITY_MIN, UI_OPACITY_MAX);
    }
  }
  return {
    mode: row.mode === 'custom' ? 'custom' : 'race',
    preset,
    accent: parseHex(row.accent ?? '') ?? '',
    window: parseHex(row.window ?? '') ?? '',
    opacity: clamp(typeof row.opacity === 'number' ? row.opacity : 1, UI_OPACITY_MIN, UI_OPACITY_MAX),
    scale: clamp(typeof row.scale === 'number' ? row.scale : 1, UI_SCALE_MIN, UI_SCALE_MAX),
    windows,
  };
}

export function resolveTheme(prefs: UiPrefs, raceId: string): ResolvedTheme {
  const preset = presetById(prefs.mode === 'race' ? racePresetId(raceId) : prefs.preset);
  const custom = prefs.mode === 'custom' && prefs.preset === 'custom';
  const window = custom && prefs.window ? prefs.window : preset.window;
  const accent = custom && prefs.accent ? prefs.accent : preset.accent;
  const light = luminance(window) > 0.42;
  const bg = custom && prefs.window ? mixHex(window, light ? '#ffffff' : '#000000', light ? 0.08 : 0.28) : preset.bg;
  return {
    preset: prefs.mode === 'race' ? racePresetId(raceId) : prefs.preset,
    accent,
    window,
    window2: mixHex(window, light ? '#000000' : '#ffffff', light ? 0.08 : 0.12),
    bg,
    text: light ? '#1c1418' : '#f4f1ea',
    muted: light ? '#4a3c34' : '#cbbba8',
    line: light ? mixHex(accent, '#1c1418', 0.35) : accent,
    texture: TEXTURE[preset.texture] ?? 'none',
    opacity: prefs.opacity,
    scale: prefs.scale,
    windows: prefs.windows,
  };
}

const WINDOW_IDS = ['vitals', 'target', 'pet', 'hotbar-a', 'hotbar-b', 'pad', 'sit', 'maps', 'log', 'util', 'menu', 'dialogue', 'merchant', 'pack', 'help', 'inspect', 'journal', 'book', 'settings'];

export function applyTheme(prefs: UiPrefs, raceId: string, root: HTMLElement = document.documentElement): void {
  const theme = resolveTheme(prefs, raceId);
  const style = root.style;
  style.setProperty('--gold', theme.accent);
  style.setProperty('--panel', theme.window);
  style.setProperty('--panel-2', theme.window2);
  style.setProperty('--bg', theme.bg);
  style.setProperty('--text', theme.text);
  style.setProperty('--muted', theme.muted);
  style.setProperty('--line', theme.line);
  style.setProperty('--ui-texture', theme.texture);
  style.setProperty('--ui-fade', String(theme.opacity));
  style.setProperty('--ui-scale', String(theme.scale));
  root.dataset.uiTheme = theme.preset;
  root.dataset.uiInk = luminance(theme.window) > 0.42 ? 'dark' : 'light';
  const fadeOf = (id: string) => theme.windows[id] ?? theme.opacity;
  for (const id of WINDOW_IDS) root.style.setProperty(`--fade-${id}`, String(fadeOf(id)));
}
