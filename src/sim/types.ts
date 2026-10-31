/** Shared simulation types. Serializable: no functions, no class instances. */

export const TICK_MS = 1000 / 30;

export type Dir = 's' | 'n' | 'e' | 'w';
export type ConColor = 'gray' | 'green' | 'lightblue' | 'blue' | 'white' | 'yellow' | 'red';
export type Panel = 'none' | 'dialogue' | 'merchant' | 'pack' | 'help' | 'inspect' | 'journal';

export type EquipSlot = 'head' | 'chest' | 'hands' | 'legs' | 'feet' | 'primary' | 'secondary';

export const EQUIP_SLOTS: EquipSlot[] = ['head', 'chest', 'hands', 'legs', 'feet', 'primary', 'secondary'];

export interface Equipment {
  head: string | null;
  chest: string | null;
  hands: string | null;
  legs: string | null;
  feet: string | null;
  primary: string | null;
  secondary: string | null;
}

export interface ItemBonus {
  str?: number;
  sta?: number;
  agi?: number;
  dex?: number;
  wis?: number;
  int?: number;
  cha?: number;
  hp?: number;
  mana?: number;
}

export interface Dice {
  n: number;
  sides: number;
  bonus: number;
}

export interface Stats {
  str: number;
  sta: number;
  agi: number;
  dex: number;
  wis: number;
  int: number;
  cha: number;
}

export interface ItemDef {
  id: string;
  name: string;
  kind: 'junk' | 'consumable' | 'weapon' | 'armor';
  value: number;
  stack: number;
  blurb: string;
  heal?: number;
  slot?: EquipSlot;
  ac?: number;
  weight: number;
  bonuses?: ItemBonus;
  effects?: string;
  delayMs?: number;
  damage?: Dice;
}

export interface QuestDef {
  id: string;
  name: string;
  giver: string;
  description: string;
  objective: string;
  itemId: string;
  need: number;
  reward: string;
}

export interface LootEntry {
  itemId: string;
  chance: number;
  min: number;
  max: number;
}

export interface MobDef {
  id: string;
  name: string;
  level: number;
  hp: number;
  ac: number;
  attack: number;
  damage: Dice;
  delayMs: number;
  aggroRange: number;
  assistRange: number;
  leash: number;
  social: string;
  xp: number;
  speed: number;
  wanderSpeed: number;
  crit: number;
  verb: string;
  loot: LootEntry[];
  coinMin: number;
  coinMax: number;
}

export interface NpcDef {
  id: string;
  name: string;
  title: string;
  dialogue: string;
}

export interface DialogueChoice {
  label: string;
  next?: string;
  action?: 'close' | 'merchant' | 'acceptQuest' | 'turnIn';
  quest?: string;
}

export interface DialogueNode {
  text: string;
  choices: DialogueChoice[];
}

export interface AbilityDef {
  id: string;
  name: string;
  short?: string;
  level: number;
  cooldownMs: number;
  range: number;
  damage: Dice;
  hate: number;
  kind?: 'strike' | 'bolt' | 'field';
  verb?: string;
  mana?: number;
  radius?: number;
  slowMs?: number;
  slowFactor?: number;
  blurb?: string;
}

export interface ClassDef {
  id: string;
  name: string;
  race: string;
  stats: Stats;
  ac: number;
  baseHp: number;
  hpPerLevel: number;
  hpPerSta: number;
  weapon: string;
  sprite: string;
  baseMana: number;
  manaPerLevel: number;
  manaPerInt: number;
  blurb: string;
  abilities: string[];
}

export interface Tuning {
  meleeRange: number;
  interactRange: number;
  pickupRange: number;
  pickupDelayMs: number;
  playerSpeed: number;
  footRx: number;
  footRy: number;
  hitBase: number;
  hitPerAttack: number;
  hitPerLevel: number;
  minHit: number;
  maxHit: number;
  critBase: number;
  critPerDex: number;
  critMult: number;
  strBonusDiv: number;
  acMitigate: number;
  regenDelayMs: number;
  regenHpPerSec: number;
  townRegenHpPerSec: number;
  combatManaPerSec: number;
  restManaPerSec: number;
  townManaPerSec: number;
  swingWindupMs: number;
  itemLockMs: number;
  respawnDelayMs: number;
  corpseFadeMs: number;
  mobRespawnMs: number;
  invulnMs: number;
  levelCap: number;
  bagSlots: number;
  assistHate: number;
  groundTtlMs: number;
  xpTable: number[];
}

export interface MerchantStock {
  itemId: string;
  price: number;
}

export interface ContentDb {
  items: Record<string, ItemDef>;
  mobs: Record<string, MobDef>;
  npcs: Record<string, NpcDef>;
  dialogue: Record<string, Record<string, DialogueNode>>;
  abilities: Record<string, AbilityDef>;
  classes: Record<string, ClassDef>;
  tuning: Tuning;
  merchant: { npcId: string; stock: MerchantStock[] };
  economy: { copperPerSilver: number; silverPerGold: number; goldPerPlatinum: number };
  player: { name: string; classId: string; copper: number; items: { itemId: string; qty: number }[] };
  roster: Roster;
  quests: QuestDef[];
}

export interface RaceDef {
  id: string;
  name: string;
  playable: boolean;
  blurb: string;
  mods: Stats;
}

export interface RosterClass {
  id: string;
  name: string;
  playable: boolean;
  races: string[];
  blurb: string;
}

export interface Roster {
  points: number;
  races: RaceDef[];
  classes: RosterClass[];
}

export interface ItemStack {
  itemId: string;
  qty: number;
}

export interface HateEntry {
  id: string;
  amount: number;
}

export interface Actor {
  id: string;
  kind: 'player' | 'npc' | 'mob';
  defId: string;
  name: string;
  sprite: string;
  x: number;
  y: number;
  facing: Dir;
  hp: number;
  maxHp: number;
  level: number;
  alive: boolean;
  homeX: number;
  homeY: number;
  hate: HateEntry[];
  attackMs: number;
  ai: 'idle' | 'wander' | 'chase' | 'return';
  wander: { x: number; y: number } | null;
  wanderMs: number;
  respawnMs: number;
  corpseMs: number;
  social: string;
  path: { x: number; y: number }[];
  pathTx: number;
  pathTy: number;
  stuck: number;
  slowMs: number;
  slowRate: number;
}

export interface GroundItem {
  id: string;
  x: number;
  y: number;
  itemId: string | null;
  qty: number;
  copper: number;
  ageMs: number;
  notifiedFull: boolean;
}

export interface GameState {
  version: 1;
  seed: number;
  rng: number;
  tick: number;
  timeMs: number;
  nextId: number;
  zoneId: string;
  debug: boolean;
  playerId: string;
  actors: Actor[];
  ground: GroundItem[];
  inventory: ItemStack[];
  equipment: Equipment;
  baseStats: Stats;
  copper: number;
  xp: number;
  level: number;
  stats: Stats;
  ac: number;
  classId: string;
  raceId: string;
  mana: number;
  maxMana: number;
  manaRegenBank: number;
  autoAttack: boolean;
  targetId: string | null;
  cooldowns: Record<string, number>;
  itemLockMs: number;
  outOfCombatMs: number;
  regenBank: number;
  invulnMs: number;
  input: {
    x: number;
    y: number;
    dest: { x: number; y: number } | null;
    pendingInteract: string | null;
    pendingSign: string | null;
  };
  ui: {
    panel: Panel;
    npcId: string | null;
    nodeId: string | null;
    title: string | null;
    body: string | null;
  };
  quests: { wolf_pelts: { stage: 'none' | 'active' | 'done'; progress: number } };
  log: string[];
  bind: { x: number; y: number };
  dead: boolean;
  deathMs: number;
  events: SimEvent[];
}

export type SimEvent =
  | { type: 'log'; text: string }
  | { type: 'damage'; targetId: string; sourceId: string; amount: number; crit: boolean }
  | { type: 'miss'; targetId: string; sourceId: string }
  | { type: 'heal'; targetId: string; amount: number }
  | { type: 'loot'; itemId: string; qty: number }
  | { type: 'coin'; copper: number }
  | { type: 'death'; actorId: string }
  | { type: 'playerDeath' }
  | { type: 'level'; level: number }
  | { type: 'swing'; actorId: string }
  | { type: 'aggro'; actorId: string }
  | { type: 'bolt'; fromX: number; fromY: number; toX: number; toY: number }
  | { type: 'field'; x: number; y: number; radius: number };

export type Intent =
  | { type: 'move'; x: number; y: number }
  | { type: 'moveTo'; x: number; y: number }
  | { type: 'target'; id: string }
  | { type: 'clearTarget' }
  | { type: 'cycleTarget' }
  | { type: 'toggleAutoAttack' }
  | { type: 'ability'; id: string }
  | { type: 'selectClass'; classId: string }
  | { type: 'createHero'; raceId: string; classId: string; bonus: Stats }
  | { type: 'talkTo'; id: string }
  | { type: 'interact' }
  | { type: 'choice'; index: number }
  | { type: 'buy'; itemId: string }
  | { type: 'sell'; slot: number }
  | { type: 'use'; slot: number }
  | { type: 'equip'; slot: number }
  | { type: 'unequip'; slot: EquipSlot }
  | { type: 'openPack' }
  | { type: 'openJournal' }
  | { type: 'abandonQuest'; id: string }
  | { type: 'openHelp' }
  | { type: 'close' }
  | { type: 'debugTeleport'; x: number; y: number };

export interface Spawn {
  kind: string;
  name: string;
  x: number;
  y: number;
  defId: string;
  sprite: string;
  text?: string;
}

export interface MapData {
  width: number;
  height: number;
  tileWidth: number;
  collision: Uint8Array;
  safe: Uint8Array;
  spawns: Spawn[];
  bind: { x: number; y: number };
  zoneId: string;
  townName: string;
  wildsName: string;
}
