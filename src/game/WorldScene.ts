import Phaser from 'phaser';
import atlasJson from '../assets/atlas.json';
import actorsUrl from '../assets/actors.png?url';
import propsUrl from '../assets/props.png?url';
import tilesUrl from '../assets/tiles.png?url';
import mapUrl from '../assets/hoffender.tmj?url';
import mapRaw from '../assets/hoffender.tmj?raw';
import { controls } from './controls';
import type { GameApi } from './api';
import { createAudio } from './audio';
import { loadContent } from '../sim/content';
import { applyIntent } from '../sim/intents';
import { parseTiledMap, type TiledJson } from '../sim/map';
import { createWorld } from '../sim/state';
import { step } from '../sim/step';
import { TICK_MS, type Actor, type GameState, type SimEvent } from '../sim/types';

interface Atlas {
  actors: {
    frameW: number;
    frameH: number;
    dirs: string[];
    framesPerDir: number;
    rows: Record<string, number>;
  };
  props: Record<string, { x: number; y: number; w: number; h: number; anchorX: number; anchorY: number }>;
}

const atlas = atlasJson as Atlas;

function clampZoom(value: number): number {
  return Math.round(Math.max(1.75, Math.min(4.5, value)) * 4) / 4;
}

interface ActorView {
  sprite: Phaser.GameObjects.Sprite;
  shadow: Phaser.GameObjects.Ellipse;
  label: Phaser.GameObjects.Text;
  prevX: number;
  prevY: number;
  flash: number;
  lunge: number;
  helm?: Phaser.GameObjects.Sprite;
}

interface Floater {
  text: Phaser.GameObjects.Text;
  life: number;
  vy: number;
}

let ready: ((api: GameApi) => void) | null = null;

export function onGameReady(handler: (api: GameApi) => void): void {
  ready = handler;
}

export class WorldScene extends Phaser.Scene {
  private state!: GameState;
  private content!: ReturnType<typeof loadContent>;
  private mapData!: ReturnType<typeof parseTiledMap>;
  private running = false;
  private acc = 0;
  private views = new Map<string, ActorView>();
  private groundViews = new Map<string, Phaser.GameObjects.Sprite>();
  private propSprites: Phaser.GameObjects.Sprite[] = [];
  private placeLabels: Phaser.GameObjects.Text[] = [];
  private zoom = 3;
  private zoomTouched = false;
  private pinch: { dist: number; zoom: number } | null = null;
  private bolts: { dot: Phaser.GameObjects.Arc; x: number; y: number; tx: number; ty: number; t: number }[] = [];
  private fields: { g: Phaser.GameObjects.Graphics; life: number }[] = [];
  private floaters: Floater[] = [];
  private bracket!: Phaser.GameObjects.Graphics;
  private snow!: Phaser.GameObjects.Graphics;
  private flakes: { x: number; y: number; s: number; v: number }[] = [];
  private water: Phaser.Tilemaps.Tile[] = [];
  private waterFlip = false;
  private cam!: Phaser.Cameras.Scene2D.Camera;
  private audio = createAudio();
  private debugGraphics?: Phaser.GameObjects.Graphics;

  constructor() {
    super('world');
  }

  preload(): void {
    this.load.image('tiles', tilesUrl);
    this.load.tilemapTiledJSON('hoffender', mapUrl);
    this.load.spritesheet('actors', actorsUrl, {
      frameWidth: atlas.actors.frameW,
      frameHeight: atlas.actors.frameH,
    });
    this.load.image('props', propsUrl);
  }

  create(): void {
    this.content = loadContent();
    this.mapData = parseTiledMap(JSON.parse(mapRaw) as TiledJson);
    const debug = new URLSearchParams(window.location.search).has('debug');
    this.state = createWorld(this.content, this.mapData, (Date.now() ^ 0xa1d300) >>> 0 || 1, debug);

    const tex = this.textures.get('props');
    for (const [name, frame] of Object.entries(atlas.props)) {
      tex.add(name, 0, frame.x, frame.y, frame.w, frame.h);
    }

    const tiled = this.make.tilemap({ key: 'hoffender' });
    const tiles = tiled.addTilesetImage('hoffender', 'tiles', 16, 16, 1, 2);
    if (!tiles) throw new Error('Hoffender tileset failed to load');
    const ground = tiled.createLayer('ground', tiles, 0, 0);
    if (!ground) throw new Error('Hoffender ground layer failed to load');
    ground.setCullPadding(4, 4);
    ground.forEachTile((tile) => {
      if (tile.index === 7 || tile.index === 8) this.water.push(tile);
    });

    for (const spawn of this.mapData.spawns) {
      if (spawn.kind !== 'prop' && spawn.kind !== 'sign') continue;
      const frame = atlas.props[spawn.sprite];
      if (!frame) continue;
      const sprite = this.add.sprite(spawn.x, spawn.y, 'props', spawn.sprite);
      sprite.setOrigin(frame.anchorX / frame.w, frame.anchorY / frame.h);
      sprite.setDepth(spawn.y);
      this.propSprites.push(sprite);
    }

    this.bracket = this.add.graphics().setDepth(4000);
    this.snow = this.add.graphics().setDepth(5000);
    for (let i = 0; i < 18; i++) {
      this.flakes.push({
        x: Math.random() * tiled.widthInPixels,
        y: Math.random() * tiled.heightInPixels,
        s: 0.6 + Math.random(),
        v: 8 + Math.random() * 10,
      });
    }

    this.cam = this.cameras.main;
    this.cam.setBounds(0, 0, tiled.widthInPixels, tiled.heightInPixels);
    this.cam.roundPixels = true;
    for (const spawn of this.mapData.spawns) {
      if (spawn.kind !== 'label' && spawn.kind !== 'sign') continue;
      const text = this.add.text(spawn.x, spawn.y - 10, spawn.name, {
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        fontSize: '20px',
        color: '#e6c15a',
        stroke: '#1c1418',
        strokeThickness: 4,
        resolution: 2,
      });
      text.setOrigin(0.5, 1);
      text.setDepth(5500);
      this.placeLabels.push(text);
    }
    this.applyZoom();
    const player = this.state.actors[0];
    this.cam.centerOn(player.x, player.y);
    this.scale.on('resize', () => this.applyZoom());

    if (debug) {
      this.debugGraphics = this.add.graphics().setDepth(1500).setAlpha(0.35);
      this.drawCollision();
    }

    this.input.addPointer(2);
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.bothPointers()) {
        this.dragging = false;
        this.pinch = { dist: Math.max(12, this.pointerSpan()), zoom: this.zoom };
        return;
      }
      this.onPointer(pointer, true);
    });
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.pinch && this.bothPointers()) {
        const span = this.pointerSpan();
        this.zoomTouched = true;
        this.zoom = clampZoom(this.pinch.zoom * (span / this.pinch.dist));
        this.applyZoom();
        return;
      }
      if (pointer.isDown && this.dragging) this.onPointer(pointer, false);
    });
    this.input.on('pointerup', () => {
      this.pinch = null;
      this.dragging = false;
    });
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _objects: unknown, _dx: number, dy: number) => {
      this.zoomTouched = true;
      this.zoom = clampZoom(this.zoom * (dy > 0 ? 0.9 : 1.12));
      this.applyZoom();
    });

    const api: GameApi = {
      getState: () => this.state,
      content: this.content,
      map: this.mapData,
      push: (intent) => controls.queue.push(intent),
      setRunning: (running) => {
        this.running = running;
      },
      audio: this.audio,
    };
    if (debug) {
      const hook = window as unknown as { __ALDMOOR__?: GameApi; __ZOOM__?: () => number };
      hook.__ALDMOOR__ = api;
      hook.__ZOOM__ = () => this.zoom;
    }
    ready?.(api);
    this.syncActors(1);
  }

  private dragging = false;

  private bothPointers(): boolean {
    return this.input.pointer1.isDown && this.input.pointer2.isDown;
  }

  private pointerSpan(): number {
    return Phaser.Math.Distance.Between(this.input.pointer1.x, this.input.pointer1.y, this.input.pointer2.x, this.input.pointer2.y);
  }

  private applyZoom(): void {
    // 3× keeps a 16px tile at 48 CSS pixels. Pinch and the wheel snap to quarter steps so the pixels stay crisp.
    if (!this.zoomTouched) this.zoom = this.scale.width >= 320 ? 3 : 2;
    this.cam.setZoom(this.zoom);
    const inv = 1 / this.zoom;
    for (const label of this.placeLabels) label.setScale(inv);
  }

  private drawCollision(): void {
    const g = this.debugGraphics;
    if (!g) return;
    g.clear();
    g.fillStyle(0xc44840, 1);
    const tw = this.mapData.tileWidth;
    for (let y = 0; y < this.mapData.height; y++) {
      for (let x = 0; x < this.mapData.width; x++) {
        if (this.mapData.collision[y * this.mapData.width + x]) g.fillRect(x * tw, y * tw, tw, tw);
      }
    }
  }

  private onPointer(pointer: Phaser.Input.Pointer, first: boolean): void {
    if (!this.running || this.state.ui.panel !== 'none' || this.state.dead) return;
    const world = this.cam.getWorldPoint(pointer.x, pointer.y);
    if (first) {
      const hit = this.pickActor(world.x, world.y);
      if (hit?.kind === 'mob' && hit.alive) {
        this.dragging = false;
        controls.queue.push({ type: 'target', id: hit.id });
        return;
      }
      if (hit?.kind === 'npc') {
        this.dragging = false;
        controls.queue.push({ type: 'talkTo', id: hit.id });
        return;
      }
      this.dragging = true;
    }
    controls.dest = { x: world.x, y: world.y };
  }

  private pickActor(x: number, y: number): Actor | null {
    let best: Actor | null = null;
    let bestDist = 24;
    for (const actor of this.state.actors) {
      if (actor.kind === 'player' || !actor.alive) continue;
      const wolf = actor.kind === 'mob';
      const top = wolf ? 16 : 22;
      if (x < actor.x - 12 || x > actor.x + 12 || y > actor.y + 4 || y < actor.y - top) continue;
      const gap = Math.hypot(actor.x - x, actor.y - 8 - y);
      if (gap < bestDist) {
        best = actor;
        bestDist = gap;
      }
    }
    return best;
  }

  update(_time: number, delta: number): void {
    const events: SimEvent[] = [];
    if (this.running) {
      events.push(...applyIntent(this.state, { type: 'move', x: controls.moveX, y: controls.moveY }, this.content, this.mapData));
      if (controls.dest && this.state.ui.panel === 'none' && !this.state.dead) {
        events.push(...applyIntent(this.state, { type: 'moveTo', x: controls.dest.x, y: controls.dest.y }, this.content, this.mapData));
        controls.dest = null;
      }
      while (controls.queue.length) {
        const intent = controls.queue.shift();
        if (intent) events.push(...applyIntent(this.state, intent, this.content, this.mapData));
      }
      this.acc += Math.min(delta, 80);
      let steps = 0;
      while (this.acc >= TICK_MS && steps < 4) {
        for (const actor of this.state.actors) {
          const view = this.views.get(actor.id);
          if (!view) continue;
          view.prevX = actor.x;
          view.prevY = actor.y;
        }
        events.push(...step(this.state, this.content, this.mapData));
        this.acc -= TICK_MS;
        steps += 1;
      }
    }
    if (events.length) this.playEvents(events);
    const alpha = this.running ? this.acc / TICK_MS : 1;
    this.syncActors(alpha);
    this.syncGround();
    this.animateWater(delta);
    this.animateSnow(delta);
    this.animateFloaters(delta);
    this.animateBolts(delta);
  }

  private playEvents(events: SimEvent[]): void {
    const playerId = this.state.playerId;
    for (const event of events) {
      if (event.type === 'damage') {
        this.audio.play(event.targetId === playerId ? 'hurt' : 'hit');
        const view = this.views.get(event.targetId);
        if (view) view.flash = 1;
        this.float(`${event.crit ? '!' : ''}${event.amount}`, event.targetId, event.crit ? '#e6c15a' : event.targetId === playerId ? '#e15d4c' : '#f4f0e6');
      } else if (event.type === 'miss') {
        this.audio.play('miss');
        this.float('miss', event.targetId, '#9aa3ad');
      } else if (event.type === 'heal') {
        this.float(`+${event.amount}`, event.targetId, '#7dcea0');
      } else if (event.type === 'coin') {
        this.audio.play('coin');
      } else if (event.type === 'level') {
        this.audio.play('level');
      } else if (event.type === 'aggro') {
        this.audio.play('aggro');
      } else if (event.type === 'playerDeath') {
        this.audio.play('death');
      } else if (event.type === 'bolt') {
        this.audio.play('cast');
        const dot = this.add.circle(event.fromX, event.fromY, 3, 0xb7e3ff).setDepth(5000);
        this.bolts.push({ dot, x: event.fromX, y: event.fromY, tx: event.toX, ty: event.toY, t: 0 });
      } else if (event.type === 'field') {
        this.audio.play('snare');
        const g = this.add.graphics().setDepth(4500);
        g.lineStyle(2, 0xb7e3ff, 0.9);
        g.strokeCircle(event.x, event.y, event.radius);
        this.fields.push({ g, life: 520 });
      } else if (event.type === 'swing') {
        const view = this.views.get(event.actorId);
        if (view) view.lunge = 1;
      }
    }
  }

  private float(text: string, actorId: string, color: string): void {
    const actor = this.state.actors.find((entry) => entry.id === actorId);
    if (!actor || this.floaters.length > 24) return;
    const label = this.add.text(actor.x, actor.y - 28, text, {
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      fontSize: '8px',
      color,
      stroke: '#1c1418',
      strokeThickness: 2,
      resolution: 2,
    });
    label.setOrigin(0.5, 1);
    label.setDepth(6000);
    this.floaters.push({ text: label, life: 700, vy: -18 });
  }

  private animateBolts(delta: number): void {
    for (const bolt of this.bolts) {
      bolt.t += delta / 180;
      const k = Math.min(1, bolt.t);
      bolt.dot.setPosition(bolt.x + (bolt.tx - bolt.x) * k, bolt.y + (bolt.ty - bolt.y) * k);
    }
    this.bolts = this.bolts.filter((bolt) => {
      if (bolt.t < 1) return true;
      bolt.dot.destroy();
      return false;
    });
    for (const field of this.fields) {
      field.life -= delta;
      field.g.setAlpha(Math.max(0, field.life / 520));
    }
    this.fields = this.fields.filter((field) => {
      if (field.life > 0) return true;
      field.g.destroy();
      return false;
    });
  }

  private animateFloaters(delta: number): void {
    for (let i = this.floaters.length - 1; i >= 0; i--) {
      const floater = this.floaters[i];
      floater.life -= delta;
      floater.text.y += (floater.vy * delta) / 1000;
      floater.text.setAlpha(Math.max(0, floater.life / 700));
      if (floater.life <= 0) {
        floater.text.destroy();
        this.floaters.splice(i, 1);
      }
    }
  }

  private animateWater(delta: number): void {
    this.waterFlip = Math.floor(this.time.now / 480) % 2 === 0 ? this.waterFlip : !this.waterFlip;
    void delta;
    const showA = Math.floor(this.time.now / 480) % 2 === 0;
    for (const tile of this.water) tile.index = showA ? 7 : 8;
  }

  private animateSnow(delta: number): void {
    const view = this.cam.worldView;
    this.snow.clear();
    this.snow.fillStyle(0xf7fbfe, 0.8);
    for (const flake of this.flakes) {
      flake.y += (flake.v * delta) / 1000;
      flake.x += (flake.s * delta) / 1000;
      if (flake.y > view.bottom) flake.y = view.top;
      if (flake.x > view.right) flake.x = view.left;
      this.snow.fillRect(Math.round(flake.x), Math.round(flake.y), flake.s > 1 ? 2 : 1, flake.s > 1 ? 2 : 1);
    }
  }

  private syncGround(): void {
    const live = new Set<string>();
    for (const pile of this.state.ground) {
      live.add(pile.id);
      let sprite = this.groundViews.get(pile.id);
      if (!sprite) {
        sprite = this.add.sprite(pile.x, pile.y, 'props', pile.itemId ? 'pouch' : 'coins');
        sprite.setOrigin(0.5, 1);
        this.groundViews.set(pile.id, sprite);
      }
      sprite.setPosition(pile.x, pile.y);
      sprite.setDepth(pile.y);
      sprite.setVisible(pile.ageMs > 40);
    }
    for (const [id, sprite] of this.groundViews) {
      if (!live.has(id)) {
        sprite.destroy();
        this.groundViews.delete(id);
      }
    }
  }

  private syncActors(alpha: number): void {
    const state = this.state;
    for (const actor of state.actors) {
      let view = this.views.get(actor.id);
      if (!view) {
        const wolf = actor.kind === 'mob';
        const shadow = this.add.ellipse(actor.x, actor.y, wolf ? 14 : 12, 5, 0x1a1614, 0.35);
        const sprite = this.add.sprite(actor.x, actor.y, 'actors', 0);
        sprite.setOrigin(0.5, wolf ? 18 / 24 : 22 / 24);
        let helm: Phaser.GameObjects.Sprite | undefined;
        if (actor.kind === 'player') {
          helm = this.add.sprite(actor.x, actor.y, 'actors', 0);
          helm.setOrigin(0.5, 22 / 24);
          helm.setVisible(false);
        }
        const label = this.add.text(actor.x, actor.y, actor.kind === 'player' ? '' : actor.name, {
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          fontSize: '14px',
          color: '#f4f0e6',
          stroke: '#1c1418',
          strokeThickness: 3,
          resolution: 2,
        });
        label.setOrigin(0.5, 1);
        view = { sprite, shadow, label, prevX: actor.x, prevY: actor.y, flash: 0, lunge: 0, helm };
        this.views.set(actor.id, view);
      }
      const snapped = Math.hypot(actor.x - view.prevX, actor.y - view.prevY) > 48;
      const x = snapped ? actor.x : view.prevX + (actor.x - view.prevX) * alpha;
      const y = snapped ? actor.y : view.prevY + (actor.y - view.prevY) * alpha;
      if (snapped) {
        view.prevX = actor.x;
        view.prevY = actor.y;
      }
      const facing = actor.facing;
      const lunge = view.lunge * 5;
      const ox = facing === 'e' ? lunge : facing === 'w' ? -lunge : 0;
      const oy = facing === 's' ? lunge : facing === 'n' ? -lunge : 0;
      view.lunge = Math.max(0, view.lunge - 0.12);
      view.sprite.setPosition(Math.round(x + ox), Math.round(y + oy));
      view.shadow.setPosition(Math.round(x), Math.round(y));
      view.sprite.setDepth(y);
      view.shadow.setDepth(y - 0.2);
      const row = atlas.actors.rows[actor.sprite] ?? 0;
      const dirIndex = Math.max(0, atlas.actors.dirs.indexOf(facing));
      const moving = Math.hypot(actor.x - view.prevX, actor.y - view.prevY) > 0.15;
      const frame = moving ? Math.floor(state.timeMs / 160) % 2 : 0;
      view.sprite.setFrame(row * (atlas.actors.dirs.length * atlas.actors.framesPerDir) + dirIndex * 2 + frame);
      const corpse = !actor.alive && actor.kind === 'mob';
      view.sprite.setVisible(!corpse || actor.corpseMs > 0);
      view.shadow.setVisible(view.sprite.visible);
      view.sprite.setAlpha(corpse ? 0.55 : 1);
      if (view.flash > 0) {
        view.sprite.setTintFill(0xfff4ea);
        view.flash = Math.max(0, view.flash - 0.15);
      } else if (actor.slowMs > 0) {
        view.sprite.setTint(0x9fd4ff);
      } else {
        view.sprite.clearTint();
      }
      if (view.helm) {
        const showHelm = actor.kind === 'player' && this.state.equipment.head === 'wolf_helm';
        view.helm.setVisible(showHelm && view.sprite.visible);
        if (showHelm) {
          const helmRow = atlas.actors.rows.wolf_helm ?? 0;
          view.helm.setFrame(helmRow * (atlas.actors.dirs.length * atlas.actors.framesPerDir) + dirIndex * 2 + frame);
          view.helm.setPosition(view.sprite.x, view.sprite.y);
          view.helm.setDepth(y + 1);
        }
      }
      const showLabel =
        actor.kind === 'npc' ||
        (actor.kind === 'mob' && actor.alive && (state.targetId === actor.id || actor.hate.length > 0));
      view.label.setVisible(showLabel && view.sprite.visible);
      if (showLabel) {
        view.label.setScale(1 / (this.cam.zoom || 1));
        view.label.setPosition(Math.round(x), Math.round(y - (actor.kind === 'mob' ? 20 : 26)));
        view.label.setDepth(y + 2);
        if (actor.kind === 'mob') {
          const gap = actor.level - state.level;
          const color = gap <= -4 ? '#9aa3ad' : gap === -3 ? '#6dba74' : gap === -2 ? '#7ec8e3' : gap === -1 ? '#6ea0e0' : gap === 0 ? '#f4f0e6' : gap <= 2 ? '#e6c15a' : '#e15d4c';
          view.label.setColor(color);
          view.label.setText(actor.name);
        }
      }
    }

    this.bracket.clear();
    const target = state.actors.find((actor) => actor.id === state.targetId && actor.alive);
    if (target) {
      const view = this.views.get(target.id);
      const x = view ? view.sprite.x : target.x;
      const y = view ? view.sprite.y : target.y;
      this.bracket.lineStyle(1, 0xf4f0e6, 0.95);
      const w = 14;
      const h = target.kind === 'mob' ? 16 : 20;
      const corners = [
        [x - w, y - h, 4, 0, 0, 4],
        [x + w, y - h, -4, 0, 0, 4],
        [x - w, y, 4, 0, 0, -4],
        [x + w, y, -4, 0, 0, -4],
      ];
      for (const [cx, cy, dx, , , dy] of corners) {
        this.bracket.beginPath();
        this.bracket.moveTo(cx, cy + dy);
        this.bracket.lineTo(cx, cy);
        this.bracket.lineTo(cx + dx, cy);
        this.bracket.strokePath();
      }
    }

    const player = state.actors.find((actor) => actor.id === state.playerId);
    if (!player) return;
    const view = this.views.get(player.id);
    const px = view ? view.sprite.x : player.x;
    const py = view ? view.sprite.y : player.y;
    this.cam.centerOn(Math.round(px), Math.round(py));

    const fire = Math.floor(this.time.now / 180) % 2 === 0 ? 'firepit' : 'firepit_b';
    for (const sprite of this.propSprites) {
      const frame = sprite.frame.name;
      if (frame === 'firepit' || frame === 'firepit_b') sprite.setFrame(fire);
    }
  }
}
