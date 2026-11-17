/**
 * Phone screenshots for phase 2. Requires `npm run preview` on port 4173.
 */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const out = '/opt/cursor/artifacts/phase2';
mkdirSync(out, { recursive: true });

const feet = (tx, ty) => ({ x: tx * 16 + 8, y: ty * 16 + 14 });

async function boot(page, width, height) {
  await page.setViewportSize({ width, height });
  await page.addInitScript(() => {
    localStorage.removeItem('aldmoor-save');
    localStorage.removeItem('aldmoor-hero');
  });
  await page.goto('http://127.0.0.1:4173/?debug=1', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__ALDMOOR__);
}

async function pick(page, race, cls) {
  await page.locator(`#race-pick button[data-race="${race}"]`).click();
  await page.locator(`#class-pick button[data-class="${cls}"]`).click();
  await page.locator('.create-card').evaluate((el) => {
    el.scrollTop = 0;
  });
  await page.waitForTimeout(200);
}

async function enter(page) {
  await page.click('#enter');
  await page.waitForTimeout(900);
}

async function go(page, zoneId, tx, ty) {
  const at = feet(tx, ty);
  await page.evaluate(({ zoneId, x, y }) => {
    window.__ALDMOOR__.push({ type: 'debugZone', zoneId, x, y });
  }, { zoneId, x: at.x, y: at.y });
  await page.waitForTimeout(800);
}

async function talk(page, defId) {
  await page.evaluate((defId) => {
    const api = window.__ALDMOOR__;
    const npc = api.getState().actors.find((actor) => actor.defId === defId);
    api.push({ type: 'debugTeleport', x: npc.x, y: npc.y + 12 });
    api.push({ type: 'talkTo', id: npc.id });
  }, defId);
  await page.waitForTimeout(300);
}

async function shot(page, name) {
  await page.screenshot({ path: `${out}/${name}.png` });
  console.log(name);
}

const browser = await chromium.launch();
const sizes = [
  [390, 844],
  [375, 667],
];
for (const [width, height] of sizes) {
  const tag = `${width}x${height}`;
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2, hasTouch: true });
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err)));
  await boot(page, width, height);
  await pick(page, 'wood_elf', 'druid');
  await shot(page, `wood-elf-create-${tag}`);
  await enter(page);
  await shot(page, `canipure-elf-${tag}`);
  await talk(page, 'sylven');
  await shot(page, `canipure-welcome-${tag}`);
  await page.evaluate(() => window.__ALDMOOR__.push({ type: 'close' }));
  await go(page, 'canipure', 48, 200);
  await shot(page, `greenreach-${tag}`);
  await go(page, 'ironhollow', 136, 96);
  await shot(page, `ironhollow-keep-${tag}`);
  await go(page, 'ironhollow', 80, 200);
  await shot(page, `ironhollow-hills-${tag}`);
  await go(page, 'can_druid', 8, 8);
  await talk(page, 'briar');
  await page.getByRole('button', { name: 'Show me the drills.' }).click();
  await page.waitForTimeout(200);
  await shot(page, `druid-trainer-${tag}`);
  await page.evaluate(() => window.__ALDMOOR__.push({ type: 'close' }));
  await go(page, 'can_ranger', 8, 8);
  await talk(page, 'rowan');
  await page.getByRole('button', { name: 'Show me the drills.' }).click();
  await page.waitForTimeout(200);
  await shot(page, `ranger-trainer-${tag}`);
  await page.evaluate(() => {
    const api = window.__ALDMOOR__;
    const state = api.getState();
    for (const id of ['canipure', 'greenreach', 'ironhollow', 'ironhollow_hills']) {
      if (!state.charts.includes(id)) state.charts.push(id);
    }
    api.push({ type: 'openMaps' });
  });
  await page.waitForTimeout(200);
  await shot(page, `map-case-${tag}`);
  await page.close();

  const ogre = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2, hasTouch: true });
  ogre.on('pageerror', (err) => errors.push(String(err)));
  await boot(ogre, width, height);
  await pick(ogre, 'ogre', 'berserker');
  await shot(ogre, `ogre-create-${tag}`);
  await enter(ogre);
  await shot(ogre, `grokthul-hold-${tag}`);
  await go(ogre, 'grokthul_peaks', 128, 176);
  await shot(ogre, `grokthul-peaks-${tag}`);
  await go(ogre, 'canipure', 156, 120);
  await talk(ogre, 'sylven');
  await shot(ogre, `canipure-cold-${tag}`);
  await ogre.close();
  if (errors.length) throw new Error(errors.join('\n'));
}
await browser.close();
console.log('done', out);
