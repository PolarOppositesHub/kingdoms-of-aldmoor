import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const outDir = '/tmp/aldmoor-shots';
mkdirSync(outDir, { recursive: true });
const base = process.env.GAME_URL ?? 'http://127.0.0.1:4173/?debug=1';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
await page.addInitScript(() => localStorage.clear());
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

await page.getByRole('button', { name: /^Warden/ }).click();
await page.click('#enter');
await page.waitForTimeout(400);
await page.screenshot({ path: `${outDir}/02-town.png` });

const start = await page.evaluate(() => {
  const s = window.__ALDMOOR__.getState();
  const p = s.actors.find((a) => a.id === 'player');
  return { x: p.x, y: p.y, hp: p.hp, copper: s.copper };
});

await page.keyboard.down('s');
await page.waitForTimeout(700);
await page.keyboard.up('s');
await page.waitForTimeout(200);
const moved = await page.evaluate(() => {
  const p = window.__ALDMOOR__.getState().actors.find((a) => a.id === 'player');
  return { x: p.x, y: p.y };
});
if (moved.y <= start.y + 10) throw new Error(`keyboard move failed ${start.y} -> ${moved.y}`);
const pet = await page.evaluate((origin) => {
  const wolf = window.__ALDMOOR__.getState().actors.find((actor) => actor.pet);
  return wolf ? { x: wolf.x, y: wolf.y, order: window.__ALDMOOR__.getState().petOrder } : null;
}, start);
if (!pet) throw new Error('warden has no wolf');
if (pet.order !== 'follow') throw new Error(`wolf order ${pet.order}`);
if (pet.y <= start.y + 8) throw new Error(`wolf did not follow ${start.y} -> ${pet.y}`);

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

const indoors = await page.evaluate(() => {
  const api = window.__ALDMOOR__;
  const door = api.map.spawns.find((spawn) => spawn.kind === 'door' && spawn.toZone === 'inn');
  api.push({ type: 'debugTeleport', x: door.x, y: door.y });
  return { x: door.x, y: door.y };
});
await page.waitForFunction(() => window.__ALDMOOR__.getState().zoneId === 'inn', { timeout: 4000 });
await page.screenshot({ path: `${outDir}/04-inn.png` });
await page.evaluate(() => {
  const api = window.__ALDMOOR__;
  const sefa = api.getState().actors.find((actor) => actor.defId === 'sefa');
  api.getState().copper = 80;
  api.push({ type: 'debugTeleport', x: sefa.x, y: sefa.y + 18 });
  api.push({ type: 'talkTo', id: sefa.id });
});
await page.waitForTimeout(400);
const talking = await page.evaluate(() => window.__ALDMOOR__.getState().ui.panel);
if (talking !== 'dialogue') throw new Error(`expected dialogue, got ${talking}`);
await page.getByRole('button', { name: 'Show me the charts.' }).click();
await page.waitForTimeout(200);
await page.screenshot({ path: `${outDir}/05-merchant.png` });
const shopping = await page.evaluate(() => window.__ALDMOOR__.getState().ui.panel);
if (shopping !== 'merchant') throw new Error(`expected merchant, got ${shopping}`);
await page.evaluate(() => {
  const button = [...document.querySelectorAll('button')].find((node) => node.dataset.item === 'chart_hoffender');
  button?.click();
});
await page.waitForTimeout(200);
const bought = await page.evaluate(() => window.__ALDMOOR__.getState().charts.includes('hoffender'));
if (!bought) throw new Error('chart purchase did not enter the map case');
await page.evaluate(() => window.__ALDMOOR__.push({ type: 'openMaps' }));
await page.waitForTimeout(200);
const mapRead = await page.evaluate(() => {
  const canvas = document.querySelector('canvas.map-canvas');
  if (!canvas) return { ok: false, reason: 'no canvas' };
  const ctx = canvas.getContext('2d');
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let ink = 0;
  for (let i = 0; i < data.length; i += 16) {
    if (data[i] + data[i + 1] + data[i + 2] > 40) ink++;
  }
  return { ok: ink > 20, ink, w: canvas.width, h: canvas.height };
});
if (!mapRead.ok) throw new Error(`bought map did not draw ${JSON.stringify(mapRead)}`);
await page.screenshot({ path: `${outDir}/05b-map.png` });
await page.evaluate(() => window.__ALDMOOR__.push({ type: 'close' }));
const exit = await page.evaluate(() => {
  const api = window.__ALDMOOR__;
  const door = api.map.spawns.find((spawn) => spawn.kind === 'door' && spawn.toZone === 'hoffender');
  api.push({ type: 'debugTeleport', x: door.x, y: door.y });
  return door.toZone;
});
await page.waitForFunction(() => window.__ALDMOOR__.getState().zoneId === 'hoffender', { timeout: 4000 });
await page.evaluate(() => window.__ALDMOOR__.push({ type: 'openMaps' }));
await page.waitForTimeout(250);
const plus = await page.evaluate(() => {
  const canvas = document.querySelector('canvas.map-canvas');
  const ctx = canvas.getContext('2d');
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let gold = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > 220 && data[i + 1] < 90 && data[i + 2] > 60 && data[i + 2] < 120) gold++;
  }
  return gold;
});
if (plus < 4) throw new Error(`player plus missing on the Hoffender chart (${plus})`);
await page.evaluate(() => window.__ALDMOOR__.push({ type: 'close' }));
await page.screenshot({ path: `${outDir}/05c-outside.png` });
void indoors;
void exit;

const road = await page.evaluate(() => {
  const api = window.__ALDMOOR__;
  api.push({ type: 'debugTeleport', x: 120 * 16 + 8, y: 108 * 16 });
  return { x: 120 * 16 + 8, y: 108 * 16 };
});
await page.waitForTimeout(200);
await page.keyboard.down('w');
await page.waitForTimeout(900);
await page.keyboard.up('w');
await page.waitForTimeout(150);
const north = await page.evaluate(() => {
  const player = window.__ALDMOOR__.getState().actors.find((actor) => actor.id === 'player');
  return { x: player.x, y: player.y };
});
if (north.y >= road.y - 10) throw new Error(`north road did not move ${road.y} -> ${north.y}`);

const coast = await page.evaluate(() => {
  const api = window.__ALDMOOR__;
  const shore = api.map.spawns.find((spawn) => spawn.name === 'Hoffender Bay');
  api.push({ type: 'debugTeleport', x: Math.max(24, shore.x - 40), y: shore.y });
  return { x: shore.x, y: shore.y };
});
await page.waitForTimeout(300);
const wet = await page.evaluate(() => {
  const api = window.__ALDMOOR__;
  const player = api.getState().actors.find((actor) => actor.id === 'player');
  const tx = Math.floor(player.x / 16);
  const ty = Math.floor(player.y / 16);
  let water = 0;
  for (let y = ty - 3; y <= ty + 3; y++) {
    for (let x = tx - 6; x <= tx; x++) {
      const id = api.map.ground[y * api.map.width + x];
      if (id === 7 || id === 8 || id === 54) water++;
    }
  }
  return { water, tx, ty, x: player.x, y: player.y };
});
if (wet.water < 4) throw new Error(`coast has no water ${JSON.stringify(wet)}`);
await page.screenshot({ path: `${outDir}/05d-coast.png` });
void coast;

await page.evaluate(() => {
  window.__ALDMOOR__.push({ type: 'debugTeleport', x: 200 * 16 + 8, y: 130 * 16 });
});
await page.waitForTimeout(250);
await page.keyboard.down('d');
const fps = await page.evaluate(() => new Promise((resolve) => {
  let frames = 0;
  const start = performance.now();
  const step = (now) => {
    frames++;
    if (now - start < 1500) requestAnimationFrame(step);
    else resolve(Math.round((frames * 1000) / (now - start)));
  };
  requestAnimationFrame(step);
}));
await page.keyboard.up('d');
const scenery = await page.evaluate(() => (window.__SCENERY__ ? window.__SCENERY__() : 0));
if (scenery < 15) throw new Error(`expected standing trees near the camera, saw ${scenery}`);
if (fps < 30) throw new Error(`frame rate ${fps}`);

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

console.log(JSON.stringify({ start, moved, pet, fight, after, mapRead, plus, fps, scenery, north, wet, woke, errors }, null, 2));
if (errors.length) throw new Error(errors.join('\n'));
await browser.close();
