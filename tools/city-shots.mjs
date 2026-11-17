/** City door screenshots. Requires preview on 4173. */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const out = '/opt/cursor/artifacts/phase2';
mkdirSync(out, { recursive: true });
const feet = (tx, ty) => ({ x: tx * 16 + 8, y: ty * 16 + 14 });

const shots = [
  ['hoffender', 'inn', 'hoffender'],
  ['thornhaven', null, 'graymoor', 103, 31],
  ['valdoria', null, 'blackpine', 166, 101],
  ['eldenmoor', 'elden_inn', 'eldenmoor'],
  ['brightforge', 'bright_warrior', 'brightforge'],
  ['wyrmrest', null, 'wyrmrest', 114, 83],
  ['canipure', 'can_warden', 'canipure'],
  ['ironhollow', null, 'ironhollow', 115, 77],
  ['grokthul', 'grok_warrior', 'grokthul'],
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

async function show(page, zone, hall, tx, ty) {
  await page.evaluate(({ zone, hall, tx, ty }) => {
    const api = window.__ALDMOOR__;
    let x;
    let y;
    if (hall) {
      const door = api.zones[zone].spawns.find((spawn) => spawn.kind === 'door' && spawn.toZone === hall);
      x = door.x;
      y = door.y + 28;
    } else {
      x = tx * 16 + 8;
      y = ty * 16 + 14;
    }
    const hud = document.getElementById('hud');
    if (hud) hud.style.visibility = 'hidden';
    api.push({ type: 'debugZone', zoneId: zone, x, y });
  }, { zone, hall, tx, ty });
  await page.waitForTimeout(800);
}

const browser = await chromium.launch();
const errors = [];
for (const [width, height, tag] of [[390, 844, '390x844'], [375, 667, '375x667']]) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2, hasTouch: true });
  page.on('pageerror', (err) => errors.push(String(err)));
  await boot(page, width, height);
  for (const [zone, hall, name, tx, ty] of shots) {
    await show(page, zone, hall, tx, ty);
    const file = `${out}/city-${name}-${tag}.png`;
    await page.screenshot({ path: file });
    console.log(file);
  }
  await page.close();
}
await browser.close();
if (errors.length) throw new Error(errors.join('\n'));
