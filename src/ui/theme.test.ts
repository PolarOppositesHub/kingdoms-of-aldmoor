import { describe, expect, it } from 'vitest';
import { defaultUi, luminance, normalizeUi, resolveTheme } from './theme';

describe('race themes', () => {
  it('gives each playable race a readable default', () => {
    for (const race of ['human', 'high_elf', 'wood_elf', 'dwarf', 'ogre', 'barbarian']) {
      const theme = resolveTheme(defaultUi(race), race);
      const ink = luminance(theme.text);
      const ground = luminance(theme.window);
      expect(Math.abs(ink - ground)).toBeGreaterThan(0.35);
    }
    expect(resolveTheme(defaultUi('high_elf'), 'high_elf').preset).toBe('pearl');
    expect(resolveTheme(defaultUi('ogre'), 'ogre').preset).toBe('mud');
    expect(resolveTheme(defaultUi('human'), 'human').preset).toBe('valdor');
  });

  it('keeps an old save on the race default and a custom accent', () => {
    expect(normalizeUi(undefined, 'dwarf').mode).toBe('race');
    const custom = normalizeUi({ mode: 'custom', preset: 'custom', accent: '#112233', window: '#f4f0e6', opacity: 0.5, scale: 1.2, windows: { book: 0.6 } }, 'ogre');
    expect(custom.accent).toBe('#112233');
    expect(custom.windows.book).toBe(0.6);
    expect(resolveTheme(custom, 'ogre').text).toBe('#1c1418');
  });
});
