import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const out = '/tmp/aldmoor-shots';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
const errors = [];
page.on('pageerror', (err) => errors.push(String(err)));
await page.goto('http://127.0.0.1:4173/?debug=1', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__ALDMOOR__);
await page.click('#enter');
await page.waitForTimeout(250);
await page.screenshot({ path: `${out}/town.png` });

const buttons = await page.evaluate(() => {
  const ids = ['atk', 'kick', 'next', 'talk', 'pack', 'item', 'pad'];
  const hud = document.getElementById('hud').getBoundingClientRect();
  return {
    hudHeight: hud.height,
    hudBottom: hud.bottom,
    view: window.innerHeight,
    items: ids.map((id) => {
      const el = document.getElementById(id);
      const r = el.getBoundingClientRect();
      return { id, top: r.top, bottom: r.bottom, height: r.height, visible: r.bottom <= window.innerHeight + 1 && r.height > 20 };
    }),
  };
});
console.log(JSON.stringify({ buttons, errors }, null, 2));

await page.evaluate(() => {
  const api = window.__ALDMOOR__;
  const wolf = api.getState().actors.find((a) => a.defId === 'young_wolf');
  api.push({ type: 'debugTeleport', x: wolf.x - 18, y: wolf.y });
  api.push({ type: 'target', id: wolf.id });
  api.push({ type: 'toggleAutoAttack' });
});
await page.waitForTimeout(900);
await page.screenshot({ path: `${out}/combat.png` });

await page.setViewportSize({ width: 900, height: 700 });
await page.waitForTimeout(400);
await page.screenshot({ path: `${out}/wide.png` });
const layout = await page.evaluate(() => document.getElementById('app').dataset.layout);
console.log('layout', layout);
if (errors.length) throw new Error(errors.join('\n'));
const clipped = buttons.items.filter((item) => !item.visible);
if (clipped.length) throw new Error(`clipped controls: ${clipped.map((item) => item.id).join(',')}`);
await browser.close();
