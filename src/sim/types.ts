/** Shared simulation types. Serializable: no functions, no class instances. */

export const TICK_MS = 1000 / 30;

export type Dir = 's' | 'n' | 'e' | 'w';
export type ConColor = 'gray' | 'green' | 'lightblue' | 'blue' | 'white' | 'yellow' | 'red';
export type Panel = 'none' | 'dialogue' | 'merchant' | 'pack' | 'help' | 'inspect' | 'journal' | 'book' | 'maps';

export const BAG_HOLDERS = 8;
export const LOADOUT_CAP = 5;
export type PetOrder = 'follow' | 'attack' | 'stay' | 'backoff';
/** Stay is the guard/sit hold. Dismiss and call are not stances, and taunt only exists on a pet that has it. */
export type PetCommand = PetOrder | 'dismiss' | 'call' | 'taunt';
export type PeltReward = 'helm' | 'jerkin';

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

export type ArmorType = 'plate' | 'chain' | 'leather' | 'cloth' | 'scale';

/** Standing required before a piece can be equipped. Scale armor will use this. */
export interface FactionNeed {
  id: string;
  rank: number;
}

export interface ItemDef {
  id: string;
  name: string;
  kind: 'junk' | 'consumable' | 'weapon' | 'armor' | 'scroll' | 'bag' | 'chart';
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
  /** What a scroll teaches. Buying it spends the coin and adds the ability. */
  teaches?: string;
  /** Warden may equip fist or staff only. */
  grip?: 'axe' | 'blade' | 'staff' | 'fist';
  /** Plate, chain, leather, cloth, or scale. Scale is in the schema and not stocked yet. */
  armorType?: ArmorType;
  /** 1 rusty/tattered, 2 worked, 3 bronze/hardened/wool. */
  tier?: 1 | 2 | 3;
  /** Class ids allowed to equip this. Omitted means no class limit. */
  wearers?: string[];
  /** Faction standing required to equip. No current item sets this. */
  faction?: FactionNeed;
  /** Race id of a later, better craft (dwarf, high_elf, human). Hoffender stock leaves this unset. */
  craftedBy?: string;
  /** How many item slots a bag opens. Bags are 4, 6, or 8. */
  slots?: number;
  /** Region chart this purchase adds to the map case. */
  chart?: string;
  /** Gear-layer row drawn on the hero. Overrides the material guess. */
  look?: string;
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
  /** When set, progress counts kills of this mob. */
  killId?: string;
  /** Take the objective items out of the bags on turn-in. */
  consume?: boolean;
  rewardCopper?: number;
  rewardXp?: number;
  rewardItem?: string;
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
  /** Unique creatures wait longer than the common packs. */
  named?: boolean;
  /** Future pets can bark a foe onto themselves. The snow wolf does not. */
  petTaunt?: boolean;
}

export interface NpcDef {
  id: string;
  name: string;
  title: string;
  dialogue: string;
  /** Body scale. Barbarians stand taller than humans. */
  race?: string;
}

export interface DialogueChoice {
  label: string;
  next?: string;
  action?: 'close' | 'merchant' | 'acceptQuest' | 'turnIn' | 'sellAll';
  quest?: string;
  reward?: PeltReward;
  /** Item sold in bulk by a sellAll choice. */
  itemId?: string;
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
  kind?: 'strike' | 'bolt' | 'field' | 'heal' | 'ward' | 'dot' | 'backstab';
  verb?: string;
  mana?: number;
  radius?: number;
  slowMs?: number;
  slowFactor?: number;
  heal?: number;
  buff?: 'evade' | 'sneak' | 'power';
  buffMs?: number;
  dotMs?: number;
  dotAmount?: number;
  blurb?: string;
  classId?: string;
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
  resource: 'none' | 'mana' | 'guile' | 'rage';
  baseFocus: number;
  focusPerLevel: number;
  kit?: Partial<Equipment>;
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
  standHpPerSec: number;
  sitHpPerSec: number;
  standManaPerSec: number;
  sitManaPerSec: number;
  townPostureMult: number;
  /** Multiplier added per level above 1 on top of the standing and sitting rates. */
  regenLevelGrowth: number;
  swingWindupMs: number;
  itemLockMs: number;
  respawnDelayMs: number;
  corpseFadeMs: number;
  mobRespawnMs: number;
  mobRespawnJitterMs: number;
  namedRespawnMs: number;
  namedRespawnJitterMs: number;
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

export interface VendorDef {
  npcId: string;
  title: string;
  stock: MerchantStock[];
  /** Copy another vendor's list. Prices stay listed; the counter can still discount. */
  copyFrom?: string;
}

export interface ContentDb {
  items: Record<string, ItemDef>;
  mobs: Record<string, MobDef>;
  npcs: Record<string, NpcDef>;
  dialogue: Record<string, Record<string, DialogueNode>>;
  abilities: Record<string, AbilityDef>;
  classes: Record<string, ClassDef>;
  tuning: Tuning;
  merchant: { vendors: VendorDef[] };
  economy: { copperPerSilver: number; silverPerGold: number; goldPerPlatinum: number };
  player: { name: string; classId: string; copper: number; items: { itemId: string; qty: number }[] };
  roster: Roster;
  quests: QuestDef[];
  maps: Record<string, MapChart>;
}

export interface MapChart {
  id: string;
  name: string;
  blurb: string;
  /** Zone this chart draws. */
  zone: string;
  /** Tile rectangle inside that zone. */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RaceDef {
  id: string;
  name: string;
  playable: boolean;
  blurb: string;
  mods: Stats;
  /** 1 is a human. Barbarians are larger. */
  scale: number;
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

/** One of the eight bag holders. Null means the holder is empty. */
export interface HeldBag {
  itemId: string;
  slots: (ItemStack | null)[];
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
  dotMs: number;
  dotAmount: number;
  dotBank: number;
  pet: boolean;
  /** Far from the player. Skipped by AI and hidden by the renderer. */
  dormant: boolean;
  /** Drawn size. Feet stay put; the body grows up from them. */
  scale: number;
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
  bags: (HeldBag | null)[];
  equipment: Equipment;
  baseStats: Stats;
  copper: number;
  /** Faction id to standing. Empty until a later story grants it. Scale armor will read this. */
  factions: Record<string, number>;
  xp: number;
  level: number;
  stats: Stats;
  ac: number;
  classId: string;
  raceId: string;
  mana: number;
  maxMana: number;
  manaRegenBank: number;
  focus: number;
  focusMax: number;
  learned: string[];
  loadout: string[];
  charts: string[];
  petOrder: PetOrder;
  /** The companion was sent away. Missing on old saves, which still bring the wolf. */
  petAway: boolean;
  petHold: { x: number; y: number } | null;
  petFocus: string | null;
  /** Blocks a door from firing again the moment a zone loads. */
  portalLockMs: number;
  /** Node name to the timeMs when it can be gathered again. */
  nodeReady: Record<string, number>;
  sneakMs: number;
  evadeMs: number;
  powerMs: number;
  sex: 'male' | 'female';
  autoAttack: boolean;
  /** Resting. Standing is the trickle; sitting is the fast regen. Not written to the save. */
  sitting: boolean;
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
  quests: Record<string, { stage: 'none' | 'active' | 'done'; progress: number }>;
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
  | { type: 'field'; x: number; y: number; radius: number }
  | { type: 'zone'; zoneId: string; x: number; y: number }
  | { type: 'seam'; title: string };

export type Intent =
  | { type: 'move'; x: number; y: number }
  | { type: 'moveTo'; x: number; y: number }
  | { type: 'target'; id: string }
  | { type: 'clearTarget' }
  | { type: 'cycleTarget' }
  | { type: 'toggleAutoAttack' }
  | { type: 'toggleSit' }
  | { type: 'ability'; id: string }
  | { type: 'selectClass'; classId: string }
  | { type: 'createHero'; raceId: string; classId: string; bonus: Stats; sex?: 'male' | 'female' }
  | { type: 'openBook' }
  | { type: 'setLoadout'; slots: string[] }
  | { type: 'pet'; order: PetCommand }
  | { type: 'openMaps' }
  | { type: 'moveItem'; fromBag: number; fromSlot: number; toBag: number; toSlot: number }
  | { type: 'moveBag'; from: number; to: number }
  | { type: 'talkTo'; id: string }
  | { type: 'interact' }
  | { type: 'choice'; index: number }
  | { type: 'buy'; itemId: string }
  | { type: 'sell'; bag: number; slot: number }
  | { type: 'sellBag'; holder: number }
  | { type: 'use'; bag: number; slot: number }
  | { type: 'equip'; bag: number; slot: number }
  | { type: 'unequip'; slot: EquipSlot }
  | { type: 'openPack' }
  | { type: 'openJournal' }
  | { type: 'abandonQuest'; id: string }
  | { type: 'openHelp' }
  | { type: 'close' }
  | { type: 'debugTeleport'; x: number; y: number }
  | { type: 'debugGrantXp'; amount: number };

export interface Spawn {
  kind: string;
  name: string;
  x: number;
  y: number;
  defId: string;
  sprite: string;
  text?: string;
  toZone?: string;
  toX?: number;
  toY?: number;
}

export interface MapData {
  width: number;
  height: number;
  tileWidth: number;
  collision: Uint8Array;
  safe: Uint8Array;
  /** Ground tile ids, row-major. Used to draw purchased charts. */
  ground: Uint16Array;
  /** Standing scenery ids, row-major. 0 is empty. Trunks and rocks also set collision. */
  scenery: Uint8Array;
  spawns: Spawn[];
  bind: { x: number; y: number };
  zoneId: string;
  townName: string;
  wildsName: string;
}
