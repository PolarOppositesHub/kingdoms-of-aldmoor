import type { Actor, ContentDb, Dice, GameState, MapData } from './types';
import type { Emit } from './events';
import { dist, facingOf, hitChance, maxHp, roll, rollDice, xpLossFraction, xpToNext } from './formulas';
import { findPath, isSafe, lineOfSight, tileOf, tryMove } from './map';
import { findActor, getPlayer, nextEntityId } from './state';
import { TICK_MS } from './types';

export function subject(actor: Actor): string {
  if (actor.kind === 'player') return 'You';
  if (actor.kind === 'npc') return actor.name;
  return `the ${actor.name}`;
}

export function objectName(actor: Actor): string {
  if (actor.kind === 'player') return 'you';
  if (actor.kind === 'npc') return actor.name;
  return `the ${actor.name}`;
}

export function weaponProfile(state: GameState, content: ContentDb): { dice: Dice; delayMs: number; attack: number } {
  const item = content.items[state.equipment.primary];
  const dice = item?.damage ?? { n: 1, sides: 4, bonus: 0 };
  const strBonus = Math.floor((state.stats.str - 10) / content.tuning.strBonusDiv);
  return {
    dice: { n: dice.n, sides: dice.sides, bonus: dice.bonus + strBonus },
    delayMs: item?.delayMs ?? 2800,
    attack: 8 + state.level * 2 + Math.floor(state.stats.str / 2),
  };
}

function defenseOf(state: GameState, content: ContentDb, actor: Actor): number {
  if (actor.kind === 'player') return state.ac + state.level * 2;
  const mob = content.mobs[actor.defId];
  return (mob?.ac ?? 0) + actor.level * 2;
}

function acOf(state: GameState, content: ContentDb, actor: Actor): number {
  if (actor.kind === 'player') return state.ac;
  return content.mobs[actor.defId]?.ac ?? 0;
}

export function addHate(state: GameState, content: ContentDb, map: MapData, mob: Actor, targetId: string, amount: number, emit: Emit): void {
  const fresh = mob.hate.length === 0;
  let entry = mob.hate.find((hate) => hate.id === targetId);
  if (!entry) {
    entry = { id: targetId, amount: 0 };
    mob.hate.push(entry);
  }
  entry.amount += amount;
  if (!fresh) return;
  emit({ type: 'aggro', actorId: mob.id });
  const def = content.mobs[mob.defId];
  if (!def?.social) return;
  for (const other of state.actors) {
    if (other === mob || other.kind !== 'mob' || !other.alive) continue;
    if (other.social !== def.social || other.hate.length > 0) continue;
    if (dist(other, mob) > def.assistRange) continue;
    if (!lineOfSight(map, other.x, other.y, mob.x, mob.y)) continue;
    other.hate.push({ id: targetId, amount: content.tuning.assistHate });
    other.ai = 'chase';
    emit({ type: 'aggro', actorId: other.id });
  }
}

export function topHateTarget(state: GameState, mob: Actor): Actor | null {
  let best: { actor: Actor; amount: number } | null = null;
  for (const hate of mob.hate) {
    const actor = findActor(state, hate.id);
    if (!actor || !actor.alive) continue;
    if (!best || hate.amount > best.amount) best = { actor, amount: hate.amount };
  }
  return best?.actor ?? null;
}

export function resolveStrike(
  state: GameState,
  content: ContentDb,
  map: MapData,
  source: Actor,
  target: Actor,
  dice: Dice,
  attack: number,
  alwaysHit: boolean,
  verb: string,
  emit: Emit,
): void {
  if (!target.alive || state.dead) return;
  if (target.kind === 'player' && (state.invulnMs > 0 || isSafe(map, target.x, target.y))) return;
  if (source.kind === 'player' && isSafe(map, source.x, source.y)) return;
  emit({ type: 'swing', actorId: source.id });
  const chance = alwaysHit
    ? 1
    : hitChance(attack, source.level, defenseOf(state, content, target), target.level, content.tuning);
  if (roll(state) > chance) {
    emit({ type: 'miss', targetId: target.id, sourceId: source.id });
    const line =
      source.kind === 'player'
        ? `You miss ${objectName(target)}.`
        : `${cap(subject(source))} misses ${objectName(target)}.`;
    emit({ type: 'log', text: line });
    return;
  }
  let damage = rollDice(state, dice) - Math.floor(acOf(state, content, target) / content.tuning.acMitigate);
  if (damage < 1) damage = 1;
  const critChance =
    source.kind === 'player'
      ? content.tuning.critBase + state.stats.dex * content.tuning.critPerDex
      : (content.mobs[source.defId]?.crit ?? 0.04);
  const crit = roll(state) < critChance;
  if (crit) damage = Math.max(1, Math.floor(damage * content.tuning.critMult));
  target.hp -= damage;
  emit({ type: 'damage', targetId: target.id, sourceId: source.id, amount: damage, crit });
  const how = crit ? ' hard' : '';
  const line =
    source.kind === 'player'
      ? `You ${verb} ${objectName(target)}${how} for ${damage}.`
      : `${cap(subject(source))} ${verb} ${objectName(target)}${how} for ${damage}.`;
  emit({ type: 'log', text: line });
  state.outOfCombatMs = 0;
  if (target.kind === 'mob') addHate(state, content, map, target, source.id, damage, emit);
  if (target.hp <= 0) finishKill(state, content, map, source, target, emit);
}

function cap(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function finishKill(state: GameState, content: ContentDb, map: MapData, source: Actor, target: Actor, emit: Emit): void {
  target.hp = 0;
  target.alive = false;
  target.hate = [];
  target.path = [];
  emit({ type: 'death', actorId: target.id });
  if (target.kind === 'player') {
    state.dead = true;
    state.deathMs = content.tuning.respawnDelayMs;
    state.autoAttack = false;
    state.input.dest = null;
    state.input.pendingInteract = null;
    emit({ type: 'playerDeath' });
    emit({ type: 'log', text: 'The cold takes you.' });
    return;
  }
  target.corpseMs = content.tuning.corpseFadeMs;
  target.respawnMs = content.tuning.mobRespawnMs;
  emit({ type: 'log', text: `${cap(subject(target))} falls.` });
  if (state.targetId === target.id) state.targetId = null;
  for (const actor of state.actors) {
    if (actor.kind === 'mob') actor.hate = actor.hate.filter((hate) => hate.id !== target.id);
  }
  if (source.kind !== 'player') return;
  const def = content.mobs[target.defId];
  if (!def) return;
  grantXp(state, content, def.xp, emit);
  dropLoot(state, content, map, target, emit);
}

function grantXp(state: GameState, content: ContentDb, amount: number, emit: Emit): void {
  if (amount <= 0 || state.level >= content.tuning.levelCap) return;
  state.xp += amount;
  emit({ type: 'log', text: `You gain ${amount} experience.` });
  while (state.level < content.tuning.levelCap && state.xp >= xpToNext(content, state.level)) {
    state.xp -= xpToNext(content, state.level);
    state.level += 1;
    const player = getPlayer(state);
    player.level = state.level;
    player.maxHp = maxHp(content, state.classId, state.level, state.stats);
    player.hp = player.maxHp;
    emit({ type: 'level', level: state.level });
    emit({ type: 'log', text: `You reach level ${state.level}. The cold feels a little thinner.` });
  }
}

function dropLoot(state: GameState, content: ContentDb, map: MapData, mob: Actor, emit: Emit): void {
  const def = content.mobs[mob.defId];
  if (!def) return;
  for (const entry of def.loot) {
    if (roll(state) > entry.chance) continue;
    const span = entry.max - entry.min + 1;
    const qty = entry.min + Math.floor(roll(state) * span);
    if (qty <= 0) continue;
    const spot = scatter(state, map, mob.x, mob.y);
    state.ground.push({
      id: nextEntityId(state, 'ground'),
      x: spot.x,
      y: spot.y,
      itemId: entry.itemId,
      qty,
      copper: 0,
      ageMs: 0,
      notifiedFull: false,
    });
  }
  if (def.coinMax > 0) {
    const span = def.coinMax - def.coinMin + 1;
    const copper = def.coinMin + Math.floor(roll(state) * span);
    if (copper > 0) {
      const spot = scatter(state, map, mob.x, mob.y);
      state.ground.push({
        id: nextEntityId(state, 'ground'),
        x: spot.x,
        y: spot.y,
        itemId: null,
        qty: 0,
        copper,
        ageMs: 0,
        notifiedFull: false,
      });
    }
  }
  void emit;
}

function scatter(state: GameState, map: MapData, x: number, y: number): { x: number; y: number } {
  const angle = roll(state) * Math.PI * 2;
  const mag = 4 + roll(state) * 8;
  return tryMove(map, x, y, Math.cos(angle) * mag, Math.sin(angle) * mag, 2, 2, false);
}

export function addItem(state: GameState, content: ContentDb, itemId: string, qty: number): number {
  const def = content.items[itemId];
  if (!def || qty <= 0) return qty;
  let left = qty;
  if (def.stack > 1) {
    for (const stack of state.inventory) {
      if (stack.itemId !== itemId || left <= 0) continue;
      const room = def.stack - stack.qty;
      const moved = Math.min(room, left);
      stack.qty += moved;
      left -= moved;
    }
  }
  while (left > 0 && state.inventory.length < content.tuning.bagSlots) {
    const moved = Math.min(def.stack, left);
    state.inventory.push({ itemId, qty: moved });
    left -= moved;
  }
  return left;
}

function followPath(map: MapData, actor: Actor, goal: { x: number; y: number }, speed: number, forMob: boolean, rx: number, ry: number): void {
  const goalTile = tileOf(map, goal.x, goal.y);
  if (actor.pathTx !== goalTile.tx || actor.pathTy !== goalTile.ty) {
    actor.path = findPath(map, actor.x, actor.y, goal.x, goal.y, forMob);
    actor.pathTx = goalTile.tx;
    actor.pathTy = goalTile.ty;
    actor.stuck = 0;
  }
  const waypoint = actor.path[0] ?? goal;
  let dx = waypoint.x - actor.x;
  let dy = waypoint.y - actor.y;
  let distance = Math.hypot(dx, dy);
  if (distance < 5 && actor.path.length) {
    actor.path.shift();
    const next = actor.path[0] ?? goal;
    dx = next.x - actor.x;
    dy = next.y - actor.y;
    distance = Math.hypot(dx, dy);
  }
  if (distance < 0.5) return;
  const step = Math.min(speed, distance);
  const beforeX = actor.x;
  const beforeY = actor.y;
  const moved = tryMove(map, actor.x, actor.y, (dx / distance) * step, (dy / distance) * step, rx, ry, forMob);
  actor.facing = facingOf(moved.x - actor.x, moved.y - actor.y, actor.facing);
  actor.x = moved.x;
  actor.y = moved.y;
  if (actor.x === beforeX && actor.y === beforeY) {
    actor.stuck += 1;
    if (actor.stuck > 8) {
      actor.path.shift();
      actor.stuck = 0;
      actor.pathTx = -999;
    }
  } else {
    actor.stuck = 0;
  }
}

function approachPoint(from: Actor, target: Actor, range: number): { x: number; y: number } {
  const dx = from.x - target.x;
  const dy = from.y - target.y;
  const distance = Math.hypot(dx, dy) || 1;
  return { x: target.x + (dx / distance) * range, y: target.y + (dy / distance) * range };
}

export function movement(state: GameState, content: ContentDb, map: MapData, emit: Emit): void {
  const player = getPlayer(state);
  const tuning = content.tuning;
  const speed = tuning.playerSpeed * (TICK_MS / 1000);
  const steering = state.input.x !== 0 || state.input.y !== 0;
  if (steering) {
    state.input.dest = null;
    state.input.pendingInteract = null;
    player.path = [];
    player.pathTx = -999;
    const length = Math.hypot(state.input.x, state.input.y);
    const moved = tryMove(
      map,
      player.x,
      player.y,
      (state.input.x / length) * speed,
      (state.input.y / length) * speed,
      tuning.footRx,
      tuning.footRy,
      false,
    );
    player.facing = facingOf(moved.x - player.x, moved.y - player.y, player.facing);
    player.x = moved.x;
    player.y = moved.y;
    return;
  }

  if (state.autoAttack && state.targetId && !state.input.dest && !isSafe(map, player.x, player.y)) {
    const target = findActor(state, state.targetId);
    if (target?.alive && target.kind === 'mob') {
      if (dist(player, target) > tuning.meleeRange) {
        state.input.dest = approachPoint(player, target, Math.max(8, tuning.meleeRange - 4));
      } else {
        player.path = [];
        player.facing = facingOf(target.x - player.x, target.y - player.y, player.facing);
      }
    }
  }

  if (state.input.pendingInteract) {
    const npc = findActor(state, state.input.pendingInteract);
    if (npc && dist(player, npc) <= tuning.interactRange) {
      openDialogue(state, content, npc, emit);
      return;
    }
  }

  if (!state.input.dest) return;
  followPath(map, player, state.input.dest, speed, false, tuning.footRx, tuning.footRy);
  if (dist(player, state.input.dest) < 6) {
    state.input.dest = null;
    player.path = [];
  }
}

export function openDialogue(state: GameState, content: ContentDb, npc: Actor, _emit: Emit): void {
  const def = content.npcs[npc.defId];
  if (!def) return;
  state.ui = { panel: 'dialogue', npcId: npc.id, nodeId: 'start' };
  state.input.dest = null;
  state.input.pendingInteract = null;
  state.input.x = 0;
  state.input.y = 0;
  const player = getPlayer(state);
  player.path = [];
  player.facing = facingOf(npc.x - player.x, npc.y - player.y, player.facing);
}

export function ai(state: GameState, content: ContentDb, map: MapData, emit: Emit): void {
  const player = getPlayer(state);
  const tuning = content.tuning;
  const playerHidden = state.dead || !player.alive || isSafe(map, player.x, player.y);
  if (playerHidden) {
    for (const actor of state.actors) {
      if (actor.kind !== 'mob') continue;
      const before = actor.hate.length;
      actor.hate = actor.hate.filter((hate) => hate.id !== player.id);
      if (before && actor.hate.length === 0 && dist(actor, { x: actor.homeX, y: actor.homeY }) > 8) actor.ai = 'return';
    }
  }

  for (const mob of state.actors) {
    if (mob.kind !== 'mob') continue;
    const def = content.mobs[mob.defId];
    if (!def) continue;
    if (!mob.alive) {
      mob.corpseMs -= TICK_MS;
      mob.respawnMs -= TICK_MS;
      continue;
    }
    const home = { x: mob.homeX, y: mob.homeY };
    const target = topHateTarget(state, mob);
    if (target && dist(mob, home) > def.leash) {
      mob.hate = [];
      mob.ai = 'return';
    }
    const liveTarget = topHateTarget(state, mob);
    if (liveTarget) {
      mob.ai = 'chase';
      const gap = dist(mob, liveTarget);
      if (gap > tuning.meleeRange * 0.9) {
        followPath(map, mob, liveTarget, def.speed * (TICK_MS / 1000), true, tuning.footRx, tuning.footRy);
      } else {
        mob.path = [];
        mob.facing = facingOf(liveTarget.x - mob.x, liveTarget.y - mob.y, mob.facing);
      }
      continue;
    }
    if (mob.ai === 'return') {
      if (dist(mob, home) > 6) {
        followPath(map, mob, home, def.wanderSpeed * (TICK_MS / 1000), true, tuning.footRx, tuning.footRy);
        continue;
      }
      mob.ai = 'idle';
      mob.path = [];
    }
    if (!playerHidden && dist(mob, player) <= def.aggroRange && lineOfSight(map, mob.x, mob.y, player.x, player.y)) {
      addHate(state, content, map, mob, player.id, 1, emit);
      continue;
    }
    mob.wanderMs -= TICK_MS;
    if (mob.wander && dist(mob, mob.wander) < 6) mob.wander = null;
    if (!mob.wander && mob.wanderMs <= 0) {
      mob.wanderMs = 1400 + roll(state) * 2200;
      if (roll(state) < 0.55) {
        const tx = mob.homeX + (roll(state) - 0.5) * 64;
        const ty = mob.homeY + (roll(state) - 0.5) * 64;
        const moved = tryMove(map, mob.homeX, mob.homeY, tx - mob.homeX, ty - mob.homeY, 4, 4, true);
        if (moved.x !== mob.homeX || moved.y !== mob.homeY) mob.wander = moved;
      }
    }
    if (mob.wander) {
      mob.ai = 'wander';
      followPath(map, mob, mob.wander, def.wanderSpeed * (TICK_MS / 1000), true, tuning.footRx, tuning.footRy);
    } else {
      mob.ai = 'idle';
    }
  }
}

export function combat(state: GameState, content: ContentDb, map: MapData, emit: Emit): void {
  const player = getPlayer(state);
  const tuning = content.tuning;
  if (state.autoAttack && state.targetId && !state.dead) {
    const target = findActor(state, state.targetId);
    if (target?.alive && target.kind === 'mob' && !isSafe(map, player.x, player.y) && dist(player, target) <= tuning.meleeRange) {
      player.attackMs -= TICK_MS;
      if (player.attackMs <= 0) {
        const profile = weaponProfile(state, content);
        player.facing = facingOf(target.x - player.x, target.y - player.y, player.facing);
        resolveStrike(state, content, map, player, target, profile.dice, profile.attack, false, 'strike', emit);
        player.attackMs = profile.delayMs;
      }
    }
  }
  if (state.dead) return;
  for (const mob of state.actors) {
    if (state.dead) return;
    if (mob.kind !== 'mob' || !mob.alive) continue;
    const target = topHateTarget(state, mob);
    if (!target) continue;
    if (dist(mob, target) > tuning.meleeRange) continue;
    const def = content.mobs[mob.defId];
    if (!def) continue;
    mob.attackMs -= TICK_MS;
    if (mob.attackMs <= 0) {
      mob.facing = facingOf(target.x - mob.x, target.y - mob.y, mob.facing);
      resolveStrike(state, content, map, mob, target, def.damage, def.attack, false, def.verb, emit);
      mob.attackMs = def.delayMs;
    }
  }
}

export function pickups(state: GameState, content: ContentDb, emit: Emit): void {
  if (state.dead) return;
  const player = getPlayer(state);
  const tuning = content.tuning;
  const kept: GameState['ground'] = [];
  for (const pile of state.ground) {
    pile.ageMs += TICK_MS;
    const near = dist(player, pile) <= tuning.pickupRange && pile.ageMs >= tuning.pickupDelayMs;
    if (!near) {
      if (pile.ageMs < tuning.groundTtlMs) kept.push(pile);
      continue;
    }
    if (pile.copper > 0) {
      state.copper += pile.copper;
      emit({ type: 'coin', copper: pile.copper });
      emit({ type: 'log', text: `You find ${pile.copper} copper.` });
      pile.copper = 0;
    }
    if (pile.itemId && pile.qty > 0) {
      const left = addItem(state, content, pile.itemId, pile.qty);
      const gained = pile.qty - left;
      if (gained > 0) {
        const name = content.items[pile.itemId]?.name ?? 'something';
        emit({ type: 'loot', itemId: pile.itemId, qty: gained });
        emit({ type: 'log', text: gained === 1 ? `You pick up a ${name}.` : `You pick up ${gained} ${name}.` });
      }
      pile.qty = left;
      if (left > 0) {
        if (!pile.notifiedFull) {
          pile.notifiedFull = true;
          emit({ type: 'log', text: 'Your pack is full.' });
        }
        kept.push(pile);
        continue;
      }
    }
    if ((pile.qty > 0 && pile.itemId) || pile.copper > 0) kept.push(pile);
  }
  state.ground = kept;
}

export function regen(state: GameState, content: ContentDb, map: MapData): void {
  if (state.dead) return;
  const player = getPlayer(state);
  const fighting = state.actors.some(
    (actor) => actor.kind === 'mob' && actor.alive && actor.hate.some((hate) => hate.id === player.id),
  );
  if (fighting) {
    state.outOfCombatMs = 0;
    return;
  }
  state.outOfCombatMs += TICK_MS;
  if (state.outOfCombatMs < content.tuning.regenDelayMs || player.hp >= player.maxHp) return;
  const rate = isSafe(map, player.x, player.y) ? content.tuning.townRegenHpPerSec : content.tuning.regenHpPerSec;
  state.regenBank += (rate * TICK_MS) / 1000;
  if (state.regenBank >= 1) {
    const heal = Math.floor(state.regenBank);
    state.regenBank -= heal;
    player.hp = Math.min(player.maxHp, player.hp + heal);
  }
}

export function respawnMobs(state: GameState, content: ContentDb): void {
  const player = getPlayer(state);
  for (const mob of state.actors) {
    if (mob.kind !== 'mob' || mob.alive || mob.respawnMs > 0) continue;
    if (dist(mob, player) < 28) {
      mob.respawnMs = 1000;
      continue;
    }
    const def = content.mobs[mob.defId];
    mob.alive = true;
    mob.hp = def?.hp ?? mob.maxHp;
    mob.maxHp = mob.hp;
    mob.x = mob.homeX;
    mob.y = mob.homeY;
    mob.hate = [];
    mob.path = [];
    mob.pathTx = -999;
    mob.ai = 'idle';
    mob.wander = null;
    mob.corpseMs = 0;
    mob.attackMs = def?.delayMs ?? 2000;
  }
}

export function respawnPlayer(state: GameState, content: ContentDb, emit: Emit): void {
  const player = getPlayer(state);
  const fraction = xpLossFraction(state.level);
  if (fraction > 0) {
    const loss = Math.min(state.xp, Math.floor(xpToNext(content, state.level) * fraction));
    if (loss > 0) {
      state.xp -= loss;
      emit({ type: 'log', text: `You lose ${loss} experience.` });
    }
  }
  player.alive = true;
  player.hp = player.maxHp;
  player.x = state.bind.x;
  player.y = state.bind.y;
  player.path = [];
  player.pathTx = -999;
  player.hate = [];
  state.dead = false;
  state.deathMs = 0;
  state.autoAttack = false;
  state.targetId = null;
  state.input = { x: 0, y: 0, dest: null, pendingInteract: null };
  state.invulnMs = content.tuning.invulnMs;
  state.outOfCombatMs = content.tuning.regenDelayMs;
  for (const mob of state.actors) {
    if (mob.kind !== 'mob') continue;
    mob.hate = mob.hate.filter((hate) => hate.id !== player.id);
    if (mob.alive && dist(mob, { x: mob.homeX, y: mob.homeY }) > 8) mob.ai = 'return';
  }
  emit({ type: 'log', text: 'You wake in the yard of the Frosthearth Inn.' });
}

export function nearestMob(state: GameState, x: number, y: number, maxDist: number, exclude: string | null): Actor | null {
  let best: Actor | null = null;
  let bestDist = maxDist;
  for (const actor of state.actors) {
    if (actor.kind !== 'mob' || !actor.alive || actor.id === exclude) continue;
    const gap = Math.hypot(actor.x - x, actor.y - y);
    if (gap < bestDist) {
      best = actor;
      bestDist = gap;
    }
  }
  return best;
}
