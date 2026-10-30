import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const outDir = '/tmp/aldmoor-shots';
mkdirSync(outDir, { recursive: true });
const base = process.env.GAME_URL ?? 'http://127.0.0.1:4173/?debug=1';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
const errors = [];
page.on('pageerror', (err) => errors.push(String(err)));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});

await page.goto(base, { waitUntil: 'networkidle' });
await page.waitForSelector('canvas', { timeout: 15000 });
await page.waitForFunction(() => window.__ALDMOOR__, { timeout: 15000 });
await page.screenshot({ path: `${outDir}/01-gate.png` });

const canvasBox = await page.locator('canvas').boundingBox();
if (!canvasBox || canvasBox.height < 200 || canvasBox.width < 200) {
  throw new Error(`canvas too small: ${JSON.stringify(canvasBox)}`);
}

await page.click('#enter');
await page.waitForTimeout(400);
await page.screenshot({ path: `${outDir}/02-town.png` });

const start = await page.evaluate(() => {
  const s = window.__ALDMOOR__.getState();
  const p = s.actors.find((a) => a.id === 'player');
  return { x: p.x, y: p.y, hp: p.hp, copper: s.copper };
});

await page.keyboard.down('d');
await page.waitForTimeout(700);
await page.keyboard.up('d');
await page.waitForTimeout(200);
const moved = await page.evaluate(() => {
  const p = window.__ALDMOOR__.getState().actors.find((a) => a.id === 'player');
  return { x: p.x, y: p.y };
});
if (moved.x <= start.x + 10) throw new Error(`keyboard move failed ${start.x} -> ${moved.x}`);

const fight = await page.evaluate(() => {
  const api = window.__ALDMOOR__;
  const wolf = api.getState().actors.find((a) => a.kind === 'mob' && a.defId === 'young_wolf');
  api.push({ type: 'debugTeleport', x: wolf.x + 16, y: wolf.y });
  api.push({ type: 'target', id: wolf.id });
  api.push({ type: 'toggleAutoAttack' });
  return { id: wolf.id, hp: wolf.hp, name: wolf.name };
});
await page.waitForTimeout(500);
await page.screenshot({ path: `${outDir}/03-combat.png` });
await page.waitForTimeout(4500);
const after = await page.evaluate((id) => {
  const s = window.__ALDMOOR__.getState();
  const wolf = s.actors.find((a) => a.id === id);
  const player = s.actors.find((a) => a.id === 'player');
  return {
    wolfHp: wolf.hp,
    alive: wolf.alive,
    playerHp: player.hp,
    xp: s.xp,
    log: s.log.slice(-6),
    auto: s.autoAttack,
  };
}, fight.id);
if (after.wolfHp >= fight.hp && after.alive) {
  throw new Error(`wolf was not hit ${fight.hp} -> ${after.wolfHp} log=${after.log.join(' | ')}`);
}

await page.evaluate(() => {
  const api = window.__ALDMOOR__;
  const brenna = api.getState().actors.find((a) => a.defId === 'brenna');
  api.push({ type: 'debugTeleport', x: brenna.x, y: brenna.y + 20 });
  api.push({ type: 'talkTo', id: brenna.id });
});
await page.waitForTimeout(300);
await page.screenshot({ path: `${outDir}/04-talk.png` });
const talking = await page.evaluate(() => window.__ALDMOOR__.getState().ui.panel);
if (talking !== 'dialogue') throw new Error(`expected dialogue, got ${talking}`);
await page.getByRole('button', { name: 'Show me your stock.' }).click();
await page.waitForTimeout(200);
await page.screenshot({ path: `${outDir}/05-merchant.png` });
const shopping = await page.evaluate(() => window.__ALDMOOR__.getState().ui.panel);
if (shopping !== 'merchant') throw new Error(`expected merchant, got ${shopping}`);

await page.setViewportSize({ width: 844, height: 390 });
await page.waitForTimeout(300);
await page.screenshot({ path: `${outDir}/06-wide.png` });
const layout = await page.evaluate(() => document.getElementById('app').dataset.layout);
if (layout !== 'wide') throw new Error(`expected wide layout, got ${layout}`);

await page.setViewportSize({ width: 390, height: 844 });
await page.evaluate(() => {
  const api = window.__ALDMOOR__;
  api.push({ type: 'close' });
  api.push({ type: 'debugTeleport', x: 200, y: 200 });
});
await page.waitForTimeout(200);
const dead = await page.evaluate(() => {
  const api = window.__ALDMOOR__;
  const player = api.getState().actors.find((a) => a.id === 'player');
  player.hp = 1;
  const wolf = api.getState().actors.find((a) => a.alive && a.kind === 'mob');
  api.push({ type: 'debugTeleport', x: wolf.x + 14, y: wolf.y });
  api.push({ type: 'target', id: wolf.id });
  if (api.getState().autoAttack) api.push({ type: 'toggleAutoAttack' });
  return wolf.id;
});
await page.waitForTimeout(8000);
const woke = await page.evaluate(() => {
  const s = window.__ALDMOOR__.getState();
  const p = s.actors.find((a) => a.id === 'player');
  return { dead: s.dead, hp: p.hp, x: p.x, y: p.y, log: s.log.slice(-3) };
});

console.log(JSON.stringify({ start, moved, fight, after, woke, errors }, null, 2));
if (errors.length) throw new Error(errors.join('\n'));
await browser.close();
