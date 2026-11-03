/**
 * Phone-sized pass for the target window, pet panel, and draggable HUD.
 * Requires `npm run preview` (or GAME_URL) already serving the build.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const outDir = process.env.SHOT_DIR ?? '/tmp/aldmoor-layout';
mkdirSync(outDir, { recursive: true });
const base = process.env.GAME_URL ?? 'http://127.0.0.1:4173/?debug=1';

function near(a, b, slack = 4) {
  return Math.abs(a - b) <= slack;
}

async function box(page, selector) {
  const found = await page.locator(selector).boundingBox();
  if (!found) throw new Error(`missing ${selector}`);
  return found;
}

async function dragFrom(page, x, y, dx, dy) {
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 8 });
  await page.mouse.up();
}

async function drag(page, selector, dx, dy) {
  const handle = page.locator(`${selector} .drag-handle`);
  const from = await handle.boundingBox();
  if (!from) throw new Error(`no drag handle for ${selector}`);
  await dragFrom(page, from.x + from.width / 2, from.y + from.height / 2, dx, dy);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
await page.addInitScript(() => {
  const layout = localStorage.getItem('aldmoor-hud-layout');
  const save = localStorage.getItem('aldmoor-save');
  const hotbar = localStorage.getItem('aldmoor-hotbar');
  localStorage.clear();
  if (layout) localStorage.setItem('aldmoor-hud-layout', layout);
  if (save) localStorage.setItem('aldmoor-save', save);
  localStorage.setItem('aldmoor-move', 'dpad');
  localStorage.setItem('aldmoor-hotbar', hotbar || 'bar');
});
const errors = [];
page.on('pageerror', (err) => errors.push(String(err)));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});

await page.goto(base, { waitUntil: 'networkidle' });
await page.waitForSelector('canvas', { timeout: 20000 });
await page.waitForFunction(() => window.__ALDMOOR__, { timeout: 20000 });
await page.getByRole('button', { name: /^Warden/ }).click();
await page.click('#enter');
await page.waitForTimeout(500);

const locked = await page.evaluate(() => document.documentElement.dataset.hudLock);
if (locked !== '1') throw new Error(`layout lock should start on, saw ${locked}`);
if (await page.locator('.vitals .drag-handle').isVisible()) throw new Error('drag handles show while locked');

const target = await box(page, '#target-box');
const hp = await box(page, '.vitals .bar.hp');
const hotbar = await box(page, '.hotbar-a');
if (target.y + target.height > hp.y + 1) throw new Error(`target window is not above the health bar ${JSON.stringify({ target, hp })}`);
if (target.height < 96 || target.width < 200) throw new Error(`target window is too small ${JSON.stringify(target)}`);
const areaRatio = (target.width * target.height) / (hotbar.width * hotbar.height);
if (areaRatio < 0.55 || areaRatio > 1.85) throw new Error(`target window is not about the hotbar size (${areaRatio.toFixed(2)})`);
const nameSize = await page.locator('#target-name').evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
if (nameSize < 16) throw new Error(`target name is ${nameSize}px`);

await page.locator('#pack').click();
await page.waitForSelector('#panel .paper-doll .slot-frame .icon', { timeout: 4000 });
const gear = await page.evaluate(() => {
  const icons = [...document.querySelectorAll('#panel .slot-frame .icon')];
  return icons.map((icon) => {
    const frame = icon.closest('.slot-frame').getBoundingClientRect();
    const box = icon.getBoundingClientRect();
    const style = getComputedStyle(icon);
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    return {
      missing: icon.classList.contains('icon-missing'),
      image: style.backgroundImage.includes('url'),
      w: box.width,
      h: box.height,
      inside: cx >= frame.left - 1 && cx <= frame.right + 1 && cy >= frame.top - 1 && cy <= frame.bottom + 1,
    };
  });
});
if (gear.length < 4) throw new Error(`expected worn and bagged pictures, saw ${gear.length}`);
const blank = gear.filter((icon) => icon.missing || !icon.image || icon.w < 16 || icon.h < 16 || !icon.inside);
if (blank.length) throw new Error(`gear pictures missing or outside their slots ${JSON.stringify(blank)}`);
await page.screenshot({ path: `${outDir}/00-inventory.png` });
await page.locator('#panel button[data-action="close"]').click();
await page.waitForFunction(() => window.__ALDMOOR__.getState().ui.panel === 'none');
const barHeight = (await box(page, '.target-hp')).height;
if (barHeight < 24) throw new Error(`target health bar is only ${barHeight}px`);

await page.evaluate(() => {
  const api = window.__ALDMOOR__;
  const state = api.getState();
  const wolf = state.actors.find((actor) => actor.kind === 'mob' && actor.alive && !actor.pet);
  wolf.level = 6;
  wolf.hp = Math.round(wolf.maxHp * 0.5);
  api.push({ type: 'target', id: wolf.id });
});
await page.waitForTimeout(200);
const name = await page.locator('#target-name').innerText();
const meta = await page.locator('#target-meta').innerText();
const pct = await page.locator('#target-num').innerText();
const color = await page.locator('#target-name').evaluate((el) => getComputedStyle(el).color);
if (!name.trim() || name === 'No target') throw new Error(`target name missing: ${name}`);
if (!/Lv 6/.test(meta)) throw new Error(`target level missing: ${meta}`);
if (!/^\d+%$/.test(pct)) throw new Error(`target percent missing: ${pct}`);
if (color === 'rgb(203, 187, 168)') throw new Error('target name did not take a con color');
await page.screenshot({ path: `${outDir}/01-target.png` });

const pet = await box(page, '#pet-panel');
if (pet.width < 160 || pet.height < 80) throw new Error(`pet panel too small ${JSON.stringify(pet)}`);
if (await page.locator('#pet-panel [data-pet="taunt"]').isVisible()) throw new Error('snow wolf should not show taunt');
async function expectOrder(order) {
  await page.waitForFunction((expected) => window.__ALDMOOR__.getState().petOrder === expected, order, { timeout: 2000 });
}
await page.locator('#pet-panel [data-pet="stay"]').click();
await expectOrder('stay');
await page.locator('#pet-panel [data-pet="backoff"]').click();
await expectOrder('backoff');
await page.locator('#pet-panel [data-pet="follow"]').click();
await expectOrder('follow');
await page.locator('#pet-panel [data-pet-role="recall"]').click();
await page.waitForFunction(() => window.__ALDMOOR__.getState().petAway === true, null, { timeout: 2000 });
if ((await page.locator('#pet-panel [data-pet-role="recall"]').innerText()) !== 'Call') throw new Error('dismiss did not become Call');
await page.screenshot({ path: `${outDir}/02-pet.png` });
await page.locator('#pet-panel [data-pet-role="recall"]').click();
await page.waitForFunction(() => {
  const state = window.__ALDMOOR__.getState();
  return state.petAway === false && state.actors.some((actor) => actor.pet && actor.alive);
}, null, { timeout: 2000 });

const vitalsBefore = await box(page, '.vitals');
await dragFrom(page, vitalsBefore.x + 30, vitalsBefore.y + 18, 36, 48);
const vitalsLocked = await box(page, '.vitals');
if (!near(vitalsLocked.x, vitalsBefore.x) || !near(vitalsLocked.y, vitalsBefore.y)) {
  throw new Error(`vitals moved while locked ${JSON.stringify({ vitalsBefore, vitalsLocked })}`);
}

await page.locator('#hud-lock').click();
await page.waitForTimeout(50);
if ((await page.evaluate(() => document.documentElement.dataset.hudLock)) !== '0') throw new Error('lock toggle did not unlock');
if (!(await page.locator('.target-box .drag-handle').isVisible())) throw new Error('edit mode did not show a drag handle');
const home = {};
const nudge = {
  '.vitals': [40, 28],
  '#target-box': [36, 24],
  '#pet-panel': [48, 20],
  '#log': [30, 24],
  '.corner-tools': [40, 36],
  '#pad': [36, -40],
  '.sit-dock': [-36, -48],
  '.hotbar-a': [-48, -70],
};
for (const selector of Object.keys(nudge)) {
  home[selector] = await box(page, selector);
  const [dx, dy] = nudge[selector];
  await drag(page, selector, dx, dy);
  const moved = await box(page, selector);
  if (near(moved.x, home[selector].x, 8) && near(moved.y, home[selector].y, 8)) {
    throw new Error(`${selector} did not move while unlocked`);
  }
}
await page.screenshot({ path: `${outDir}/03-edit.png` });

await page.locator('#help').click();
await page.getByRole('button', { name: 'Thumb arc' }).click();
await page.getByRole('button', { name: 'Close' }).click();
await page.waitForTimeout(150);
const arcHome = await box(page, '.hotbar-b');
await drag(page, '.hotbar-b', -30, -40);
const arcMoved = await box(page, '.hotbar-b');
if (near(arcMoved.x, arcHome.x, 8) && near(arcMoved.y, arcHome.y, 8)) throw new Error('arc hotbar did not move');

await page.evaluate(() => document.documentElement.style.setProperty('--sat', '44px'));
const logBeforeClamp = await box(page, '#log');
await drag(page, '#log', -400, -400);
const logClamped = await box(page, '#log');
if (logClamped.y < 44 - 1) throw new Error(`log ignored the safe area ${JSON.stringify(logClamped)}`);
if (logClamped.x < -1) throw new Error(`log left the screen ${JSON.stringify(logClamped)}`);
await page.evaluate(() => document.documentElement.style.removeProperty('--sat'));
await drag(page, '#log', 20, Math.max(40, logBeforeClamp.y - logClamped.y));

const placed = await page.evaluate(() => JSON.parse(localStorage.getItem('aldmoor-hud-layout')));
if (!placed || placed.locked !== false || !placed.portrait?.vitals || !placed.portrait?.['hotbar-b'] || !placed.portrait?.pad) {
  throw new Error(`layout was not saved ${JSON.stringify(placed)}`);
}
const vitalsSaved = await box(page, '.vitals');
await page.reload({ waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__ALDMOOR__, { timeout: 20000 });
const cont = page.locator('#continue-btn');
if (await cont.count()) {
  await cont.click();
  await page.waitForTimeout(400);
}
await page.waitForTimeout(300);
const vitalsReloaded = await box(page, '.vitals');
if (!near(vitalsReloaded.x, vitalsSaved.x, 3) || !near(vitalsReloaded.y, vitalsSaved.y, 3)) {
  throw new Error(`vitals did not persist ${JSON.stringify({ vitalsSaved, vitalsReloaded })}`);
}
if ((await page.evaluate(() => document.documentElement.dataset.hudLock)) !== '0') throw new Error('unlock did not persist');
await page.screenshot({ path: `${outDir}/04-reloaded.png` });

await page.locator('#help').click();
await page.getByRole('button', { name: 'Reset layout' }).click();
await page.getByRole('button', { name: 'Close' }).click();
await page.waitForTimeout(150);
const vitalsReset = await box(page, '.vitals');
if (!near(vitalsReset.x, vitalsBefore.x, 6) || !near(vitalsReset.y, vitalsBefore.y, 6)) {
  throw new Error(`reset did not restore the vitals ${JSON.stringify({ vitalsBefore, vitalsReset })}`);
}
const cleared = await page.evaluate(() => JSON.parse(localStorage.getItem('aldmoor-hud-layout')));
if (cleared.portrait?.vitals) throw new Error('reset left a saved vitals position');
if (cleared.locked !== false) throw new Error('reset should keep the current lock state');
await page.locator('#hud-lock').click();
if ((await page.evaluate(() => document.documentElement.dataset.hudLock)) !== '1') throw new Error('could not lock again');
await dragFrom(page, vitalsReset.x + 30, vitalsReset.y + 18, 30, 30);
const afterRelock = await box(page, '.vitals');
if (!near(afterRelock.x, vitalsReset.x) || !near(afterRelock.y, vitalsReset.y)) throw new Error('dragging worked after locking');
await page.screenshot({ path: `${outDir}/05-reset.png` });

if (errors.length) throw new Error(errors.join('\n'));
await browser.close();
console.log(`layout pass ok, shots in ${outDir}`);
