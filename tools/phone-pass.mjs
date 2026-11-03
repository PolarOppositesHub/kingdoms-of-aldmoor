/**
 * Phone-sized pass for the hotbar, XP bar, long-press, sit regen, and levels past 10.
 * Requires `npm run preview` (or GAME_URL) already serving the build.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const outDir = process.env.SHOT_DIR ?? '/tmp/aldmoor-phone';
mkdirSync(outDir, { recursive: true });
const base = process.env.GAME_URL ?? 'http://127.0.0.1:4173/?debug=1';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
await page.addInitScript(() => {
  localStorage.clear();
  localStorage.setItem('aldmoor-move', 'dpad');
  localStorage.setItem('aldmoor-hotbar', 'bar');
});
const errors = [];
page.on('pageerror', (err) => errors.push(String(err)));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});

await page.goto(base, { waitUntil: 'networkidle' });
await page.waitForSelector('canvas', { timeout: 20000 });
await page.waitForFunction(() => window.__ALDMOOR__, { timeout: 20000 });
await page.getByRole('button', { name: /^Shaman/ }).click();
await page.click('#enter');
await page.waitForTimeout(500);

const xpBox = await page.locator('.hotbar-a .xp-readout').boundingBox();
const xpText = await page.locator('.hotbar-a .xp-readout').innerText();
if (!xpBox || xpBox.height < 8 || xpBox.width < 40) throw new Error(`XP readout is not visible: ${JSON.stringify(xpBox)}`);
if (!/Lv 1 XP \d+%/.test(xpText)) throw new Error(`XP readout text: ${xpText}`);
const selected = await page.locator('.hotbar-a .spell.is-selected').count();
if (selected < 1) throw new Error('stone bar has no selected slot');
const bar = await page.locator('.hotbar-a .bar.xp').boundingBox();
if (!bar || bar.height < 6 || bar.width < 80) throw new Error(`XP bar track missing: ${JSON.stringify(bar)}`);

await page.screenshot({ path: `${outDir}/01-stone-bar.png` });

const beforeTip = await page.evaluate(() => window.__ALDMOOR__.getState().mana);
const slot = page.locator('.hotbar-a .spell').first();
await slot.dispatchEvent('pointerdown', { pointerId: 1, clientX: 200, clientY: 700, bubbles: true });
await page.waitForTimeout(700);
const tip = page.locator('#ability-tip');
if (await tip.isHidden()) throw new Error('long-press did not open the ability tooltip');
const tipText = await tip.innerText();
if (!/mana|no cost/i.test(tipText) || !/cooldown/i.test(tipText)) throw new Error(`tooltip missing cost or cooldown: ${tipText}`);
await slot.dispatchEvent('pointerup', { pointerId: 1, bubbles: true });
await page.waitForTimeout(50);
const afterTip = await page.evaluate(() => window.__ALDMOOR__.getState().mana);
if (afterTip !== beforeTip) throw new Error(`long-press cast the spell (${beforeTip} -> ${afterTip})`);
await page.screenshot({ path: `${outDir}/02-long-press.png` });

await page.evaluate(() => {
  const state = window.__ALDMOOR__.getState();
  const player = state.actors.find((actor) => actor.id === 'player');
  player.hp = Math.max(1, Math.floor(player.maxHp * 0.4));
  state.mana = Math.max(0, Math.floor(state.maxMana * 0.35));
});
await page.locator('.sit-a').click();
await page.waitForTimeout(80);
const sat = await page.evaluate(() => {
  const state = window.__ALDMOOR__.getState();
  const player = state.actors.find((actor) => actor.id === 'player');
  return { sitting: state.sitting, hp: player.hp, mana: state.mana };
});
if (!sat.sitting) throw new Error('Sit did not set sitting');
await page.waitForTimeout(3500);
const rested = await page.evaluate(() => {
  const state = window.__ALDMOOR__.getState();
  const player = state.actors.find((actor) => actor.id === 'player');
  return { sitting: state.sitting, hp: player.hp, mana: state.mana };
});
if (rested.mana <= sat.mana) throw new Error(`sitting mana did not rise ${sat.mana} -> ${rested.mana}`);
if (rested.hp <= sat.hp) throw new Error(`sitting hp did not rise ${sat.hp} -> ${rested.hp}`);
await page.screenshot({ path: `${outDir}/03-sitting.png` });

await page.keyboard.down('d');
await page.waitForTimeout(250);
await page.keyboard.up('d');
const stood = await page.evaluate(() => window.__ALDMOOR__.getState().sitting);
if (stood) throw new Error('moving did not stand the player up');
const stoodAt = await page.evaluate(() => window.__ALDMOOR__.getState().mana);
await page.waitForTimeout(3500);
const trickled = await page.evaluate(() => window.__ALDMOOR__.getState().mana);
if (trickled - stoodAt >= rested.mana - sat.mana) {
  throw new Error(`standing regen was not slower (${stoodAt} -> ${trickled}, sit gained ${rested.mana - sat.mana})`);
}

await page.evaluate(() => {
  window.__ALDMOOR__.getState().mana = 0;
});
await page.waitForTimeout(200);
const dry = await page.locator('.hotbar-a .spell.is-dry').count();
if (dry < 1) throw new Error('no insufficient-mana state on the stone bar');
await page.screenshot({ path: `${outDir}/04-dry-mana.png` });

await page.evaluate(() => {
  const api = window.__ALDMOOR__;
  const state = api.getState();
  state.mana = state.maxMana;
  const wolf = state.actors.find((actor) => actor.kind === 'mob' && actor.alive && !actor.pet);
  api.push({ type: 'debugTeleport', x: wolf.x + 18, y: wolf.y });
  api.push({ type: 'target', id: wolf.id });
  api.push({ type: 'ability', id: state.loadout[0] });
});
await page.waitForTimeout(400);
let cooling = await page.locator('.hotbar-a .spell.is-cooling').count();
if (cooling < 1) {
  await page.evaluate(() => {
    const state = window.__ALDMOOR__.getState();
    const id = state.loadout[0];
    if (id) state.cooldowns[id] = 6000;
  });
  await page.waitForTimeout(200);
  cooling = await page.locator('.hotbar-a .spell.is-cooling').count();
}
if (cooling < 1) throw new Error('cooldown sweep did not appear');
const timer = await page.locator('.hotbar-a .slot-timer').first().innerText();
if (!/\d+s/.test(timer)) throw new Error(`cooldown timer missing: ${timer}`);
await page.screenshot({ path: `${outDir}/05-cooldown.png` });

await page.locator('#help').click();
await page.waitForTimeout(200);
await page.getByRole('button', { name: 'Thumb arc' }).click();
await page.getByRole('button', { name: 'Close' }).click();
await page.waitForTimeout(200);
const arc = await page.locator('.primary-atk').boundingBox();
if (!arc || arc.width < 60) throw new Error(`primary attack button missing: ${JSON.stringify(arc)}`);
const orbs = await page.locator('.hotbar-b .orb:not(.orb-fifth)').count();
if (orbs !== 4) throw new Error(`expected 4 arc abilities, saw ${orbs}`);
const edge = await page.locator('.xp-edge .xp-readout').boundingBox();
if (!edge || edge.y < 700) throw new Error(`arc XP readout is not along the bottom: ${JSON.stringify(edge)}`);
await page.screenshot({ path: `${outDir}/06-thumb-arc.png` });

await page.locator('#help').click();
await page.getByRole('button', { name: 'Ability names' }).click();
await page.getByRole('button', { name: 'Close' }).click();
await page.waitForTimeout(150);
const label = await page.locator('.hotbar-b .slot-name').first().innerText();
if (!label.trim()) throw new Error('ability name label did not show');
await page.screenshot({ path: `${outDir}/07-names.png` });

await page.evaluate(() => window.__ALDMOOR__.push({ type: 'debugGrantXp', amount: 8000 }));
await page.waitForTimeout(300);
const leveled = await page.evaluate(() => {
  const state = window.__ALDMOOR__.getState();
  return { level: state.level, xp: state.xp, learned: state.learned };
});
if (leveled.level <= 10) throw new Error(`did not level past 10: ${JSON.stringify(leveled)}`);
const highText = await page.locator('.xp-edge .xp-readout').innerText();
if (!highText.includes(`Lv ${leveled.level}`)) throw new Error(`XP bar did not follow the level: ${highText}`);
await page.screenshot({ path: `${outDir}/08-past-10.png` });

if (errors.length) throw new Error(errors.join('\n'));
await browser.close();
console.log(`phone pass ok, level ${leveled.level}, shots in ${outDir}`);
