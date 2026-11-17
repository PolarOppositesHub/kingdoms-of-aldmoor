/** City door screenshots. Requires preview on 4173. */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const out = '/opt/cursor/artifacts/phase2';
mkdirSync(out, { recursive: true });

const shots = [
  ['hoffender', 'inn', 'hoffender', 'barbarian'],
  ['thornhaven', null, 'graymoor', 'human', 108, 28],
  ['thornhaven', null, 'thornhaven', 'human', 104, 70],
  ['valdoria', null, 'blackpine', 'human', 164, 96],
  ['eldenmoor', 'elden_inn', 'eldenmoor', 'high_elf'],
  ['brightforge', 'bright_warrior', 'brightforge', 'dwarf'],
  ['wyrmrest', null, 'wyrmrest', 'human', 120, 80],
  ['canipure', 'can_warden', 'canipure', 'wood_elf'],
  ['ironhollow', null, 'ironhollow', 'human', 120, 74],
  ['grokthul', 'grok_warrior', 'grokthul', 'ogre'],
];

async function boot(page, width, height) {
  await page.setViewportSize({ width, height });
  await page.addInitScript(() => {
    localStorage.removeItem('aldmoor-save');
    localStorage.removeItem('aldmoor-hero');
  });
  await page.goto('http://127.0.0.1:4173/?debug=1', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__ALDMOOR__);
  await page.locator('#race-pick button[data-race="human"]').click().catch(() => {});
  await page.locator('#race-pick button[data-race="barbarian"]').click();
  await page.locator('#class-pick button[data-class="warrior"]').click();
  await page.click('#enter');
  await page.waitForTimeout(900);
}

async function show(page, zone, hall, raceId, tx, ty) {
  await page.evaluate(({ zone, hall, raceId, tx, ty }) => {
    const api = window.__ALDMOOR__;
    let x;
    let y;
    if (hall) {
      const door = api.zones[zone].spawns.find((spawn) => spawn.kind === 'door' && spawn.toZone === hall);
      x = door.x + 32;
      y = door.y;
    } else {
      x = tx * 16 + 8;
      y = ty * 16 + 14;
    }
    const state = api.getState();
    const player = state.actors.find((actor) => actor.kind === 'player');
    const race = api.content.roster.races.find((entry) => entry.id === raceId);
    state.raceId = raceId;
    player.sprite = raceId === 'barbarian' ? 'body_m' : `body_${raceId}_m`;
    player.scale = race?.scale ?? 1;
    window.__SET_ZOOM__?.(1.25);
    for (const id of ['hud', 'panel', 'toast', 'log']) {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    }
    document.querySelectorAll('.corner-tools').forEach((el) => {
      el.style.display = 'none';
    });
    api.push({ type: 'debugZone', zoneId: zone, x, y });
  }, { zone, hall, raceId, tx, ty });
  await page.waitForTimeout(800);
}

const browser = await chromium.launch();
const errors = [];
for (const [width, height, tag] of [[390, 844, '390x844'], [375, 667, '375x667']]) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2, hasTouch: true });
  page.on('pageerror', (err) => errors.push(String(err)));
  await boot(page, width, height);
  for (const [zone, hall, name, raceId, tx, ty] of shots) {
    await show(page, zone, hall, raceId, tx, ty);
    const file = `${out}/city-${name}-${tag}.png`;
    await page.screenshot({ path: file });
    console.log(file);
  }
  await page.close();
}
await browser.close();
if (errors.length) throw new Error(errors.join('\n'));
