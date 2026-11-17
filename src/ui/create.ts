import type { GameApi } from '../game/api';
import type { Stats } from '../sim/types';
import { bodySprite, raceGearRow, raceScale } from '../sim/appearance';
import atlas from '../assets/atlas.json';
import portraitUrl from '../assets/portrait.png?url';

const KEY = 'aldmoor-hero';
const STATS = ['str', 'sta', 'agi', 'dex', 'wis', 'int', 'cha'] as const;
const LABELS: Record<(typeof STATS)[number], string> = {
  str: 'Strength',
  sta: 'Stamina',
  agi: 'Agility',
  dex: 'Dexterity',
  wis: 'Wisdom',
  int: 'Intelligence',
  cha: 'Charisma',
};

export interface HeroDraft {
  raceId: string;
  classId: string;
  sex: 'male' | 'female';
  bonus: Stats;
}

function emptyBonus(): Stats {
  return { str: 0, sta: 0, agi: 0, dex: 0, wis: 0, int: 0, cha: 0 };
}

export function loadHero(): HeroDraft | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as HeroDraft;
    if (!parsed.raceId || !parsed.classId || !parsed.bonus) return null;
    if (parsed.sex !== 'female') parsed.sex = 'male';
    return parsed;
  } catch {
    return null;
  }
}

export function mountCreate(api: GameApi): { read: () => HeroDraft; save: () => void } {
  const races = document.getElementById('race-pick');
  const sexes = document.getElementById('sex-pick');
  const classes = document.getElementById('class-pick');
  const wizardNote = document.getElementById('wizard-note');
  const blurb = document.getElementById('class-blurb');
  const points = document.getElementById('points');
  const list = document.getElementById('stat-list');
  const roster = api.content.roster;
  const saved = loadHero();
  let raceId = saved?.raceId && roster.races.some((race) => race.id === saved.raceId && race.playable) ? saved.raceId : 'barbarian';
  let sex: 'male' | 'female' = saved?.sex === 'female' ? 'female' : 'male';
  const wizardDraft = saved?.classId === 'wizard';
  let classId = saved?.classId && roster.classes.some((cls) => cls.id === saved.classId && cls.playable && cls.races.includes(raceId)) ? saved.classId : 'warrior';
  const bonus = emptyBonus();
  if (saved?.bonus) {
    for (const key of STATS) bonus[key] = Math.max(0, Math.floor(saved.bonus[key] ?? 0));
  }

  const baseOf = (key: (typeof STATS)[number]) => {
    const cls = api.content.classes[classId];
    const race = roster.races.find((entry) => entry.id === raceId);
    return Math.max(1, (cls?.stats[key] ?? 10) + (race?.mods[key] ?? 0));
  };
  const spent = () => STATS.reduce((sum, key) => sum + bonus[key], 0);
  const trimBonus = () => {
    while (spent() > roster.points) {
      const key = [...STATS].reverse().find((stat) => bonus[stat] > 0);
      if (!key) break;
      bonus[key] -= 1;
    }
  };

  const previewKit: Record<string, string[]> = {
    warrior: ['chest_plate', 'weapon_axe'],
    shaman: ['chest_fur', 'weapon_staff'],
    rogue: ['chest_leather', 'weapon_blade'],
    berserker: ['chest_leather', 'weapon_axe'],
    warden: ['chest_cloth', 'hands_wrap'],
    wizard: ['chest_cloth', 'weapon_staff'],
    cleric: ['chest_plate', 'weapon_staff'],
    enchanter: ['chest_cloth', 'weapon_staff'],
    paladin: ['chest_plate', 'weapon_blade'],
    magician: ['chest_cloth', 'weapon_staff'],
    druid: ['chest_cloth', 'weapon_staff'],
    ranger: ['chest_leather', 'weapon_bow'],
  };
  const portrait = atlas.portrait;
  const portraitRows = portrait?.rows as Record<string, number> | undefined;
  const layerStyle = (rowName: string) => {
    const row = portraitRows?.[rowName] ?? 0;
    const frameW = (portrait?.frameW ?? 48) * 2;
    const frameH = (portrait?.frameH ?? 80) * 2;
    const cols = (portrait?.dirs.length ?? 1) * (portrait?.framesPerDir ?? 2);
    const sheetW = cols * frameW;
    const sheetH = Object.keys(portraitRows ?? { x: 0 }).length * frameH;
    return `--frame-y:-${row * frameH}px;--step:${frameW}px;width:${frameW}px;height:${frameH}px;background-image:url(${portraitUrl});background-size:${sheetW}px ${sheetH}px;`;
  };
  const paint = () => {
    if (!races || !classes || !blurb || !points || !list) return;
    const preview = document.getElementById('race-preview');
    if (preview) {
      const race = roster.races.find((entry) => entry.id === raceId);
      const layers = (previewKit[classId] ?? [])
        .map((part) => `<span class="doll-layer" style="${layerStyle(raceGearRow(raceId, part))}"></span>`)
        .join('');
      const scale = raceScale(api.content, raceId);
      preview.innerHTML = `<div class="doll-stage" style="transform:scale(${scale});transform-origin:bottom center">
        <span class="doll-shadow"></span>
        <span class="doll-layer doll-body" style="${layerStyle(bodySprite(raceId, sex))}"></span>
        ${layers}
      </div><p>${race?.name ?? ''} · ${roster.classes.find((cls) => cls.id === classId)?.name ?? ''}</p>`;
    }
    if (sexes) {
      sexes.innerHTML = (['male', 'female'] as const)
        .map((id) => `<button type="button" data-sex="${id}" aria-pressed="${sex === id ? 'true' : 'false'}">${id === 'male' ? 'Male' : 'Female'}<small>${id === 'male' ? 'Beard and a heavier shoulder.' : 'Braids and a leaner shoulder.'}</small></button>`)
        .join('');
    }
    if (wizardNote) {
      wizardNote.hidden = !wizardDraft;
      wizardNote.textContent = wizardDraft
        ? 'A saved Barbarian Wizard cannot continue that path. Pick Warrior, Shaman, Rogue, Berserker, or Warden. A saved game of that kind continues as a Warrior.'
        : '';
    }
    races.innerHTML = roster.races
      .map((race) => {
        const pressed = race.id === raceId;
        return `<button type="button" data-race="${race.id}" aria-pressed="${pressed ? 'true' : 'false'}" ${race.playable ? '' : 'disabled'}>${race.name}<small>${race.playable ? race.blurb : 'Coming soon'}</small></button>`;
      })
      .join('');
    const allowed = roster.classes.filter((cls) => cls.races.includes(raceId));
    if (!allowed.some((cls) => cls.id === classId && cls.playable)) {
      classId = allowed.find((cls) => cls.playable)?.id ?? classId;
    }
    classes.innerHTML = roster.classes
      .map((cls) => {
        const allowedRace = cls.races.includes(raceId);
        const enabled = cls.playable && allowedRace;
        const pressed = cls.id === classId;
        const note = !cls.playable ? 'Coming soon' : !allowedRace ? 'Not for this race' : cls.blurb;
        return `<button type="button" data-class="${cls.id}" aria-pressed="${pressed ? 'true' : 'false'}" ${enabled ? '' : 'disabled'}>${cls.name}<small>${note}</small></button>`;
      })
      .join('');
    blurb.textContent = roster.classes.find((cls) => cls.id === classId)?.blurb ?? '';
    const enter = document.getElementById('enter');
    const gates: Record<string, string> = {
      high_elf: 'Enter Eldenmoor',
      dwarf: 'Enter Brightforge',
      wood_elf: 'Enter Canipure',
      ogre: 'Enter Grokthul Hold',
    };
    if (enter) enter.textContent = gates[raceId] ?? 'Enter Hoffender';
    points.textContent = `Bonus points left: ${roster.points - spent()}`;
    list.innerHTML = STATS.map((key) => {
      const total = baseOf(key) + bonus[key];
      return `<li><span>${LABELS[key]}</span><button type="button" data-stat="${key}" data-dir="-1" ${bonus[key] <= 0 ? 'disabled' : ''}>−</button><strong>${total}</strong><button type="button" data-stat="${key}" data-dir="1" ${spent() >= roster.points ? 'disabled' : ''}>+</button></li>`;
    }).join('');
  };

  sexes?.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest('button');
    const id = button?.dataset.sex;
    if (id !== 'male' && id !== 'female') return;
    sex = id;
    paint();
  });
  races?.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest('button');
    const id = button?.dataset.race;
    const race = roster.races.find((entry) => entry.id === id);
    if (!race?.playable) return;
    raceId = race.id;
    const stillAllowed = roster.classes.some((cls) => cls.id === classId && cls.playable && cls.races.includes(raceId));
    if (!stillAllowed) {
      classId = roster.classes.find((cls) => cls.playable && cls.races.includes(raceId))?.id ?? classId;
    }
    trimBonus();
    paint();
  });
  classes?.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest('button');
    const id = button?.dataset.class;
    const cls = roster.classes.find((entry) => entry.id === id);
    if (!cls?.playable || !cls.races.includes(raceId)) return;
    classId = cls.id;
    trimBonus();
    paint();
  });
  list?.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest('button');
    const key = button?.dataset.stat as (typeof STATS)[number] | undefined;
    const dir = Number(button?.dataset.dir);
    if (!key || !STATS.includes(key)) return;
    if (dir < 0 && bonus[key] > 0) bonus[key] -= 1;
    if (dir > 0 && spent() < roster.points) bonus[key] += 1;
    paint();
  });
  paint();

  return {
    read: () => ({ raceId, classId, sex, bonus: { ...bonus } }),
    save: () => {
      try {
        localStorage.setItem(KEY, JSON.stringify({ raceId, classId, sex, bonus }));
      } catch {
        /* private mode */
      }
    },
  };
}
