/**
 * Idempotent content for Brightforge, Wyrmrest, the peak zones, and the level-50 drills.
 * Run once: node tools/gen-canon-content.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const read = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const write = (path, data) => writeFileSync(join(root, path), `${JSON.stringify(data, null, 2)}\n`);

function body(level, mult = 1) {
  const hp = Math.round((24 + level * 16 + Math.max(0, level - 15) * 8 + Math.max(0, level - 30) * 14) * mult);
  const ac = Math.round(6 + level * 0.7 + (mult > 1.8 ? 6 : 0));
  const attack = Math.round(8 + level * 1.15 + (mult > 1.8 ? 8 : 0));
  const n = level >= 42 ? 3 : level >= 16 ? 2 : 1;
  const sides = level >= 28 ? 10 : level >= 10 ? 8 : 6;
  const bonus = 2 + Math.floor(level / 5) + (mult > 2.5 ? 6 : 0);
  const xp = Math.round((20 + level * 16 + Math.max(0, level - 10) * 8) * Math.min(mult, 2.4));
  return {
    hp,
    ac,
    attack,
    damage: { n, sides, bonus },
    xp,
    coinMin: Math.max(1, level * 3),
    coinMax: level * 14,
  };
}

function mob(spec) {
  const stats = body(spec.level, spec.mult ?? 1);
  return {
    id: spec.id,
    name: spec.name,
    level: spec.level,
    ...stats,
    delayMs: spec.delayMs ?? 2100,
    aggroRange: spec.aggro ?? 110,
    assistRange: 130,
    leash: 200,
    social: spec.social ?? '',
    speed: spec.speed ?? 52,
    wanderSpeed: 24,
    crit: spec.named || spec.rare ? 0.07 : 0.04,
    verb: spec.verb,
    loot: spec.loot,
    ...(spec.named ? { named: true } : {}),
    ...(spec.rare ? { rare: true } : {}),
    ...(spec.scale ? { scale: spec.scale } : {}),
    sprite: spec.sprite,
  };
}

const coal = (id, chance = 0.6) => ({ itemId: id, chance, min: 1, max: 1 });

const mobs = [
  mob({ id: 'slope_hare', name: 'slope hare', level: 1, social: 'hare', verb: 'kicks', sprite: 'hare', loot: [coal('stringy_meat', 0.4)], aggro: 0, speed: 48 }),
  mob({ id: 'cinder_beetle', name: 'cinder beetle', level: 2, social: 'beetle', verb: 'nips', sprite: 'beetle', loot: [coal('cinder_coal', 0.7)] }),
  mob({ id: 'bright_wolf', name: 'bright wolf', level: 4, social: 'wolf', verb: 'bites', sprite: 'wolf', loot: [coal('slope_pelt', 0.7), coal('stringy_meat', 0.3)] }),
  mob({ id: 'ridge_bandit', name: 'ridge bandit', level: 7, social: 'bandit', verb: 'cuts', sprite: 'bandit', loot: [coal('cinder_coal', 0.4)] }),
  mob({ id: 'slate_bear', name: 'slate bear', level: 8, social: 'bear', verb: 'mauls', sprite: 'bear', loot: [coal('slope_pelt', 0.5)] }),
  mob({ id: 'kragg', name: 'Kragg Ashhand', level: 9, named: true, mult: 2.1, social: '', verb: 'cuts', sprite: 'leader', loot: [coal('ash_brand', 1), coal('cinder_coal', 0.8)] }),
  mob({ id: 'old_slate', name: 'Old Slate', level: 10, named: true, rare: true, mult: 2.3, social: '', verb: 'mauls', sprite: 'bear', loot: [coal('slate_tooth', 1), coal('slope_pelt', 1)] }),
  mob({ id: 'ash_wolf', name: 'ash wolf', level: 31, social: 'ash_wolf', verb: 'bites', sprite: 'ash_wolf', loot: [coal('ash_fang', 0.65)] }),
  mob({ id: 'ash_cultist', name: 'ash cultist', level: 33, social: 'cult', verb: 'cuts', sprite: 'cultist', loot: [coal('cult_token', 0.55)] }),
  mob({ id: 'young_drake', name: 'young drake', level: 36, social: 'drake', verb: 'scorches', sprite: 'drake', scale: 1.15, loot: [coal('drake_scale', 0.5)] }),
  mob({ id: 'korrag', name: 'Korrag the Scorched', level: 37, named: true, mult: 2.2, social: '', verb: 'scorches', sprite: 'cultist', loot: [coal('scorched_axe', 0.35), coal('cult_token', 1)] }),
  mob({ id: 'kobold_miner', name: 'kobold miner', level: 36, social: 'kobold', verb: 'picks', sprite: 'kobold', scale: 0.86, loot: [coal('kobold_tooth', 0.6), coal('cinder_coal', 0.4)] }),
  mob({ id: 'kobold_digger', name: 'kobold digger', level: 39, social: 'kobold', verb: 'claws', sprite: 'kobold', scale: 0.86, loot: [coal('kobold_tooth', 0.55)] }),
  mob({ id: 'kobold_guard', name: 'kobold guard', level: 42, social: 'kobold', verb: 'stabs', sprite: 'kobold', scale: 0.9, loot: [coal('kobold_tooth', 0.5)] }),
  mob({ id: 'skreeva', name: 'Skreeva', level: 43, named: true, mult: 2.3, social: '', verb: 'shrieks', sprite: 'kobold', scale: 1.05, loot: [coal('matriarch_pick', 0.4), coal('kobold_tooth', 1)] }),
  mob({ id: 'roost_wyvern', name: 'roost wyvern', level: 43, social: 'wyvern', verb: 'rakes', sprite: 'wyvern', scale: 1.25, loot: [coal('drake_scale', 0.45)] }),
  mob({ id: 'spire_drake', name: 'spire drake', level: 46, social: 'drake', verb: 'scorches', sprite: 'drake', scale: 1.3, loot: [coal('drake_scale', 0.6)] }),
  mob({ id: 'dragonkin', name: 'dragonkin', level: 48, social: 'dragonkin', verb: 'rakes', sprite: 'dragonkin', scale: 1.15, loot: [coal('drake_scale', 0.5), coal('cult_token', 0.3)] }),
  mob({ id: 'vyrmathax', name: 'Vyrmathax the Elder', level: 50, named: true, mult: 3.6, social: '', verb: 'burns', sprite: 'drake', scale: 1.85, delayMs: 2400, aggro: 160, loot: [coal('elder_fang', 0.5), coal('drake_scale', 1)] }),
];

const npcs = [
  ['durgan', 'Durgan Ashbeard', 'king of Brightforge', 'durgan', 'dwarf'],
  ['sella', 'Sella Flint', 'gate warden of Brightforge', 'sella', 'dwarf'],
  ['dunn', 'Dunn Keel', 'gate guard', 'dunn', 'dwarf'],
  ['otta', 'Otta Venn', 'gate guard', 'otta', 'dwarf'],
  ['brim', 'Brim Ash', 'warrior trainer', 'brim', 'dwarf'],
  ['kelda', 'Kelda Flint', 'cleric trainer', 'kelda', 'dwarf'],
  ['orrin', 'Orrin Keel', 'paladin trainer', 'orrin', 'dwarf'],
  ['nala', 'Nala Venn', 'rogue trainer', 'nala', 'dwarf'],
  ['bram', 'Bram Keld', 'berserker trainer', 'bram', 'dwarf'],
  ['henge', 'Henge Ash', 'provisioner', 'henge', 'dwarf'],
  ['merric', 'Merric Holt', 'gate guard of Graymoor', 'merric', 'human'],
  ['edda', 'Edda Venn', 'gate guard of Graymoor', 'edda', 'human'],
  ['harl', 'Harl Smith', 'castle smith', 'harl', 'human'],
  ['tova', 'Tova Quay', 'harbormaster', 'tova', 'human'],
  ['pike', 'Pike Rowan', 'gate guard of Blackpine', 'pike', 'human'],
  ['cress', 'Cress Rowan', 'gate guard of Blackpine', 'cress', 'human'],
  ['wynn', 'Wynn Linden', 'castle clothier', 'wynn', 'human'],
  ['joren', 'Joren Quill', 'dock clerk', 'joren', 'human'],
  ['brynn', 'Brynn Holt', 'castellan of Wyrmrest', 'brynn', 'human'],
  ['vess', 'Vess Ash', 'quartermaster', 'vess', 'dwarf'],
  ['ember_keel', 'Keel Ash', 'keeper of Emberwatch', 'ember_keel', 'dwarf'],
  ['ember_scout', 'Soren Holm', 'barbarian scout', 'ember_scout', 'barbarian'],
  ['thane_rest', 'Old Thane', 'keeper of the rest', 'thane_rest', 'dwarf'],
  ['gate_holm', 'Holm Gate', 'west gate', 'gate_holm', 'human'],
  ['gate_moss', 'Moss Gate', 'west gate', 'gate_moss', 'human'],
  ['wry_warrior', 'Eirik\'s counterpart', 'high drills, warrior', 'wry_warrior', 'human'],
  ['wry_shaman', 'Torunn\'s counterpart', 'high drills, shaman', 'wry_shaman', 'human'],
  ['wry_rogue', 'Sable\'s counterpart', 'high drills, rogue', 'wry_rogue', 'human'],
  ['wry_berserker', 'Hroth\'s counterpart', 'high drills, berserker', 'wry_berserker', 'human'],
  ['wry_warden', 'Bjorn\'s counterpart', 'high drills, warden', 'wry_warden', 'human'],
  ['wry_wizard', 'Maeriel\'s counterpart', 'high drills, wizard', 'wry_wizard', 'high_elf'],
  ['wry_cleric', 'Selne\'s counterpart', 'high drills, cleric', 'wry_cleric', 'high_elf'],
  ['wry_enchanter', 'Miris\'s counterpart', 'high drills, enchanter', 'wry_enchanter', 'high_elf'],
  ['wry_paladin', 'Adel\'s counterpart', 'high drills, paladin', 'wry_paladin', 'high_elf'],
  ['wry_magician', 'Quen\'s counterpart', 'high drills, magician', 'wry_magician', 'high_elf'],
].map(([id, name, title, dialogue, race]) => ({ id, name, title, dialogue, race }));

// Fix the awkward counterpart names to sound like people.
const names = {
  wry_warrior: ['Captain Darr', 'high drills, warrior'],
  wry_shaman: ['Svala Peat', 'high drills, shaman'],
  wry_rogue: ['Isk Quill', 'high drills, rogue'],
  wry_berserker: ['Red Hroth', 'high drills, berserker'],
  wry_warden: ['Pell Den', 'high drills, warden'],
  wry_wizard: ['Ilen Page', 'high drills, wizard'],
  wry_cleric: ['Sera Lamp', 'high drills, cleric'],
  wry_enchanter: ['Vale Hush', 'high drills, enchanter'],
  wry_paladin: ['Cor Oath', 'high drills, paladin'],
  wry_magician: ['Ash Ember', 'high drills, magician'],
};
for (const npc of npcs) {
  if (names[npc.id]) {
    npc.name = names[npc.id][0];
    npc.title = names[npc.id][1];
  }
}

const quests = [
  {
    id: 'slope_wolves',
    name: 'Wolves on the Slope',
    giver: 'Sella Flint',
    description: 'Bright wolves have come down to the wall of Brightforge. Sella wants eight of them back up the slope.',
    objective: 'Bright wolves',
    itemId: '',
    need: 8,
    killId: 'bright_wolf',
    rewardCopper: 40,
    rewardXp: 120,
    reward: '40 copper and 120 experience',
  },
  {
    id: 'kragg_ashhand',
    name: 'Kragg Ashhand',
    giver: 'Sella Flint',
    description: 'Kragg Ashhand takes a toll on the south slope and stays down longer than a bandit. Sella wants the toll ended.',
    objective: 'Kragg Ashhand',
    itemId: '',
    need: 1,
    killId: 'kragg',
    rewardCopper: 70,
    rewardXp: 220,
    reward: '70 copper and 220 experience',
  },
  {
    id: 'old_slate',
    name: 'Old Slate',
    giver: 'Durgan Ashbeard',
    description: 'Old Slate is the bear the slopes rarely show. King Durgan wants word that it has been met, and ended.',
    objective: 'Old Slate',
    itemId: '',
    need: 1,
    killId: 'old_slate',
    rewardCopper: 90,
    rewardXp: 280,
    reward: '90 copper and 280 experience',
  },
  {
    id: 'ash_pack',
    name: 'The Ash Pack',
    giver: 'Brynn Holt',
    description: 'Ash wolves are on the heath above Wyrmrest. Brynn wants eight of them down before the cult is tried.',
    objective: 'Ash wolves',
    itemId: '',
    need: 8,
    killId: 'ash_wolf',
    rewardCopper: 180,
    rewardXp: 1400,
    reward: '180 copper and 1400 experience',
  },
  {
    id: 'korrag_scorched',
    name: 'Korrag the Scorched',
    giver: 'Brynn Holt',
    description: 'Korrag the Scorched leads the cult on the moors. He is named, and he stays down. Brynn wants him ended.',
    objective: 'Korrag the Scorched',
    itemId: '',
    need: 1,
    killId: 'korrag',
    rewardCopper: 260,
    rewardXp: 2000,
    reward: '260 copper and 2000 experience',
  },
  {
    id: 'skreeva_matriarch',
    name: 'Skreeva',
    giver: 'Brynn Holt',
    description: 'The kobolds in the Scalded Vale mine for the dragons. Skreeva is their matriarch. She is named. End her, then come back.',
    objective: 'Skreeva',
    itemId: '',
    need: 1,
    killId: 'skreeva',
    rewardCopper: 340,
    rewardXp: 2600,
    reward: '340 copper and 2600 experience',
  },
  {
    id: 'vyrmathax_elder',
    name: 'Vyrmathax the Elder',
    giver: 'Brynn Holt',
    description: 'Vyrmathax the Elder is the oldest of the dragons the Black Ice woke. He keeps the roost in the Wyrmrest Spires. The door behind him stays sealed. Brynn wants the elder ended, and the fang if it drops is yours besides the one the castle owes you.',
    objective: 'Vyrmathax the Elder',
    itemId: '',
    need: 1,
    killId: 'vyrmathax',
    rewardItem: 'elder_fang',
    rewardCopper: 500,
    rewardXp: 4000,
    reward: 'The elder fang, 500 copper, and 4000 experience',
  },
];

function node(text, choices) {
  return { text, choices };
}
function close(label = 'Another time.') {
  return { label, action: 'close' };
}

const dialogue = {
  durgan: {
    start: node('Durgan Ashbeard. Brightforge is the Lightbrune hold, the nearest of the mountain clans to Graymoor. The deep doors to Ashdeep and Veilspire are shut. Old Slate is not. The bear is rarely on the slope. I would like it met.', [
      { label: 'I will look for Old Slate.', action: 'acceptQuest', quest: 'old_slate' },
      { label: 'What woke the east?', next: 'dragons' },
      close(),
    ]),
    slate_active: node('Old Slate. South, where the slope forgets the road. It does not come often.', [close('I am still looking.')]),
    slate_ready: node('You met it. That is the word I wanted.', [{ label: 'Old Slate is down.', action: 'turnIn', quest: 'old_slate' }]),
    done: node('The slopes will grow another bear. The doors below us stay shut until I say otherwise.', [close()]),
    dragons: node('Wyrmrest was named for dragons laid under the northern peaks after an old war. Ysolde\'s cold kept them asleep. The Black Ice is broken. They are hungry. That castle is northeast of Hoffender, on the kingdom\'s northern border. The pass north of here reaches it only by going through Graymoor and the wilds.', [{ label: 'Back.', next: 'start' }]),
  },
  sella: {
    start: node('Sella Flint. I keep the south gate. The slopes are a young road: hares, beetles, then wolves. Eight bright wolves, before you go looking for names.', [
      { label: 'I will thin the wolves.', action: 'acceptQuest', quest: 'slope_wolves' },
      { label: 'Bind me to this yard.', action: 'bind' },
      { label: 'Where do the roads go?', next: 'roads' },
      close(),
    ]),
    wolves_active: node('Eight bright wolves. They like the wall. The wall does not like them back.', [
      close('Still working.'),
      { label: 'Bind me to this yard.', action: 'bind' },
    ]),
    wolves_ready: node('Eight. Next is Kragg Ashhand. He takes a toll on the south slope and he does not stay down like the others.', [
      { label: 'The wolves are down.', action: 'turnIn', quest: 'slope_wolves' },
    ]),
    after_wolves: node('Kragg Ashhand. South of the road, with the bandits who still pay him. End the toll.', [
      { label: 'I will find Kragg.', action: 'acceptQuest', quest: 'kragg_ashhand' },
      { label: 'Bind me to this yard.', action: 'bind' },
      close(),
    ]),
    kragg_active: node('Kragg is still taking the toll. He stays down longer than a common bandit.', [close('I am on it.')]),
    kragg_ready: node('The toll is ended. The king can have the bear, if you want a rarer job. I am done with mine.', [
      { label: 'Kragg is down.', action: 'turnIn', quest: 'kragg_ashhand' },
    ]),
    done: node('The gate holds. North is Graymoor. South is the slope, and it will fill in again.', [
      { label: 'Bind me to this yard.', action: 'bind' },
      close(),
    ]),
    roads: node('North, the Lightbrune Pass, then Graymoor Hold and Thornhaven. Hoffender is beyond that, and the east road out of the Frostmere Wilds is Wyrmrest. Ashdeep and Veilspire are the mine doors in the south. Both are shut.', [
      { label: 'Back.', next: 'start' },
    ]),
  },
  dunn: { start: node('Dunn Keel. The gate is shut to trouble and open to you. North is Graymoor. Do not take the slopes for a yard.', [close()]) },
  otta: { start: node('Otta Venn. I watch the south gate. Sella counts the wolves. I count who comes back.', [close()]) },
  brim: { start: node('Brim Ash. The anvil hall sells the same drills Eirik sells in Hoffender. Nothing is learned by getting older. The list says the level.', [{ label: 'Show me the drills.', action: 'merchant' }, close()]) },
  kelda: { start: node('Kelda Flint. The lamp hall. Plate, a mend, and the drills a cleric buys. Dwarves and high elves both walk this path. The list still waits on your level.', [{ label: 'Show me the drills.', action: 'merchant' }, close()]) },
  orrin: { start: node('Orrin Keel. Oaths, a shield, and the drills Adel sells in Eldenmoor. I sell the same list. Level is the lock.', [{ label: 'Show me the drills.', action: 'merchant' }, close()]) },
  nala: { start: node('Nala Venn. Speak quietly. The stair sells what Sable sells. If the line says Requires level, you are early.', [{ label: 'Show me the drills.', action: 'merchant' }, close()]) },
  bram: { start: node('Bram Keld. Rage is a tool. The red gallery sells Hroth\'s list, through the last of it.', [{ label: 'Show me the drills.', action: 'merchant' }, close()]) },
  henge: { start: node('Henge Ash. Rations, the two Brightforge charts, and Lightbrune plate. The deep clans do not sell here. Their doors are shut.', [{ label: 'Show me your goods.', action: 'merchant' }, { label: 'Bind me to this yard.', action: 'bind' }, close()]) },
  merric: { start: node('Merric Holt. Graymoor Hold is a castle, not a camp. The court is safe. The fields are not. Odda is warden. I just keep the gate.', [close()]) },
  edda: { start: node('Edda Venn. East is the Lightbrune Pass and Brightforge. West is the harbor. South is Valdoria. North is the snow. None of those are the same road.', [close()]) },
  harl: { start: node('Harl Smith. I work the castle forge. Plate and chain, at the price on the slate. Ivar in Hoffender is a cousin of the trade, not of the blood.', [{ label: 'Show me the steel.', action: 'merchant' }, close()]) },
  tova: { start: node('Tova Quay. This is the west harbor of Thornhaven. The golden trade route is not this water. That ship leaves the east dock of Valdoria and crosses to Eldenmoor, on Vaelmoor, by way of the Wood Elf coast.', [close()]) },
  pike: { start: node('Pike Rowan. Blackpine Tower is the castle in the central pines. The court is safe. The ring of free passage is the wood elves\' word, and it is not a wall you can see.', [close()]) },
  cress: { start: node('Cress Rowan. South is not Eldenmoor. South is pines, and Saltmere is shut. The ship is east.', [close()]) },
  wynn: { start: node('Wynn Linden. Cloth and leather for the castle. Osric keeps the charts and the yard. I keep the needle.', [{ label: 'Show me the cloth.', action: 'merchant' }, close()]) },
  joren: { start: node('Joren Quill. The ship at this dock is the golden trade route. It crosses to Vaelmoor and lands at Eldenmoor. Step on it when you mean to go. It comes back the same way.', [close()]) },
  brynn: {
    start: node('Brynn Holt, castellan of Wyrmrest. The castle sits on the northern border, under the peaks, northeast of Hoffender. The dragons were laid to rest here after an old war. Ysolde\'s cold held them. The Black Ice is broken, and the heath is burned. Eight ash wolves, first.', [
      { label: 'I will take the ash pack.', action: 'acceptQuest', quest: 'ash_pack' },
      { label: 'Bind me to this court.', action: 'bind' },
      { label: 'Show me the charts.', action: 'merchant' },
      { label: 'What is north?', next: 'north' },
      close(),
    ]),
    ash_active: node('Eight ash wolves. They are the easy part of the heath, which is not a comfort.', [close('Still at it.'), { label: 'Bind me to this court.', action: 'bind' }]),
    ash_ready: node('Eight. Korrag the Scorched is next. He leads the cult and he stays down longer than they do.', [{ label: 'The wolves are down.', action: 'turnIn', quest: 'ash_pack' }]),
    after_ash: node('Korrag the Scorched, north of Emberwatch. End him.', [
      { label: 'I will find Korrag.', action: 'acceptQuest', quest: 'korrag_scorched' },
      { label: 'Bind me to this court.', action: 'bind' },
      close(),
    ]),
    korrag_active: node('Korrag is still on the moors. Emberwatch can point you. I want him ended.', [close()]),
    korrag_ready: node('The cult is thinner. The vale is next. Skreeva rules the kobolds who mine for the dragons.', [{ label: 'Korrag is down.', action: 'turnIn', quest: 'korrag_scorched' }]),
    after_korrag: node('Skreeva, in the Scalded Vale. She is the matriarch. Thane\'s Rest is the safe yard at the south of that canyon.', [
      { label: 'I will find Skreeva.', action: 'acceptQuest', quest: 'skreeva_matriarch' },
      close(),
    ]),
    skreeva_active: node('Skreeva is not a miner. She stays down. The canyon is hers until you change that.', [close()]),
    skreeva_ready: node('The vale can breathe. The spires cannot. Vyrmathax the Elder is the oldest of the ones the cold woke. The door behind him stays sealed.', [{ label: 'Skreeva is down.', action: 'turnIn', quest: 'skreeva_matriarch' }]),
    after_skreeva: node('Vyrmathax the Elder, level with the top of this road. End him. Do not pry the sealed door. That lair is not this year\'s work.', [
      { label: 'I will face the elder.', action: 'acceptQuest', quest: 'vyrmathax_elder' },
      { label: 'Bind me to this court.', action: 'bind' },
      close(),
    ]),
    elder_active: node('The elder is still on the roost. The Last Step is safe. Past it is not.', [close()]),
    elder_ready: node('You came back. The fang the castle owes you is here, whether or not the roost dropped another.', [{ label: 'Vyrmathax is down.', action: 'turnIn', quest: 'vyrmathax_elder' }]),
    done: node('The peaks are quieter, not kind. Bind here if you mean to keep climbing. The sealed door can wait.', [
      { label: 'Bind me to this court.', action: 'bind' },
      { label: 'Show me the charts.', action: 'merchant' },
      close(),
    ]),
    north: node('North of the castle: Ashfall Moors and Emberwatch, then the Scalded Vale and Thane\'s Rest, then the Wyrmrest Spires. The levels climb with the road. West is the Frostmere Wilds, and Hoffender, and from there the south road to Thornhaven and Valdoria.', [{ label: 'Back.', next: 'start' }]),
  },
  vess: { start: node('Vess Ash. Quartermaster. Ashforged plate, scorched chain, wyrmhide, cinder cloth, and the weapons that belong above level thirty. The drills are the captains in the court, not me.', [{ label: 'Show me the stores.', action: 'merchant' }, close()]) },
  ember_keel: { start: node('Keel Ash. Emberwatch is the yard on the burned heath. Dwarves and a barbarian scout. South is Wyrmrest. North is Korrag\'s country. Sit here if the moors are where you expect to fall.', [{ label: 'Show me the stores.', action: 'merchant' }, { label: 'Bind me to this yard.', action: 'bind' }, close()]) },
  ember_scout: { start: node('Soren Holm, out of Hoffender\'s gate and a long way from it. The ash wolves run in packs. The cultists do not run. The young drakes are the ones that still think they are large.', [close()]) },
  thane_rest: { start: node('They call me Old Thane because the waystation is older than the name I had. Thane\'s Rest is safe. The kobolds are not. Skreeva sits the north of the canyon and calls it a mine for the dragons.', [{ label: 'Show me what you have.', action: 'merchant' }, { label: 'Bind me to this yard.', action: 'bind' }, close()]) },
  gate_holm: { start: node('Holm, on the west gate. The road out is the Frostmere Wilds. Hoffender is at the other end of that cold. Do not confuse it with the north gate. North is the burned heath.', [close()]) },
  gate_moss: { start: node('Moss, on the same gate. Wyrmrest is a castle, not a camp. The court is safe. The peaks are why the castle is here.', [close()]) },
};

for (const id of ['wry_warrior', 'wry_shaman', 'wry_rogue', 'wry_berserker', 'wry_warden', 'wry_wizard', 'wry_cleric', 'wry_enchanter', 'wry_paladin', 'wry_magician']) {
  const npc = npcs.find((row) => row.id === id);
  dialogue[id] = {
    start: node(`${npc.name}. The high drills, the same list as the hall that first taught them, through level 50. Nothing on that list arrives because you leveled. If it says Requires level, you are early.`, [
      { label: 'Show me the drills.', action: 'merchant' },
      close(),
    ]),
  };
}

const maps = [
  { id: 'brightforge', name: 'Brightforge', blurb: 'The Lightbrune hold. The ink stops at the wall.' },
  { id: 'brightforge_slopes', name: 'Lightbrune Slopes', blurb: 'The mountains outside Brightforge, from the wall to the shut mine doors.' },
  { id: 'wyrmrest', name: 'Wyrmrest', blurb: 'The castle on the northern border, under the Ogre Highlands.' },
  { id: 'ashfall', name: 'Ashfall Moors', blurb: 'The burned heath north of Wyrmrest.' },
  { id: 'emberwatch', name: 'Emberwatch', blurb: 'The scout yard on the Ashfall Moors.' },
  { id: 'scalded', name: 'The Scalded Vale', blurb: 'The steaming canyon, and the kobolds who mine it.' },
  { id: 'thanes_rest', name: "Thane's Rest", blurb: 'The ruined dwarf waystation at the south of the vale.' },
  { id: 'spires', name: 'Wyrmrest Spires', blurb: 'The roosts. Vyrmathax keeps the north of them. The deeper door is sealed.' },
];

function chart(id, name, blurb, value) {
  return { id, name, kind: 'chart', chart: id.replace(/^chart_/, ''), value, weight: 0.1, stack: 1, blurb, effects: 'Adds the chart to the map case.' };
}
// chart ids must match maps.json ids. Name the items chart_<id> and set chart field to the map id.
function chartItem(mapId, name, blurb, value) {
  return { id: `chart_${mapId}`, name, kind: 'chart', chart: mapId, value, weight: 0.1, stack: 1, blurb, effects: 'Adds the chart to the map case.' };
}

const charts = [
  chartItem('brightforge', 'chart of Brightforge', "Henge's ink of the Lightbrune hold.", 40),
  chartItem('brightforge_slopes', 'chart of the Lightbrune Slopes', 'The mountains outside the hold, as far as the shut doors.', 45),
  chartItem('wyrmrest', 'chart of Wyrmrest', "Brynn's ink of the castle court.", 80),
  chartItem('ashfall', 'chart of the Ashfall Moors', 'The burned heath north of the castle.', 90),
  chartItem('emberwatch', 'chart of Emberwatch', 'The scout yard on the moors.', 70),
  chartItem('scalded', 'chart of the Scalded Vale', 'The canyon and the kobold camps.', 110),
  chartItem('thanes_rest', 'chart of Thane\'s Rest', 'The waystation at the south of the vale.', 80),
  chartItem('spires', 'chart of the Wyrmrest Spires', 'The roosts, as far as the sealed door.', 140),
];

function junk(id, name, value, blurb) {
  return { id, name, kind: 'junk', value, weight: 0.2, stack: 20, blurb, effects: 'Sell it.' };
}
function weapon(id, name, grip, damage, delayMs, value, blurb) {
  return { id, name, kind: 'weapon', slot: 'primary', grip, damage, delayMs, value, weight: 4.5, stack: 1, blurb, effects: 'Worn in the hand.' };
}

const goods = [
  junk('cinder_coal', 'cinder coal', 3, 'A black lump from the Lightbrune slope. It still smells like a fire.'),
  junk('slope_pelt', 'slope pelt', 5, 'Wolf or bear, the mountain does not label it.'),
  junk('ash_fang', 'ash fang', 14, 'A tooth from a wolf that has been breathing cinders.'),
  junk('cult_token', 'cult token', 18, 'A scorched coin the cultists carry. It is not kingdom money.'),
  junk('drake_scale', 'drake scale', 28, 'Warm to the hand. It does not cool quickly.'),
  junk('kobold_tooth', 'kobold tooth', 12, 'Small, sharp, and usually still dirty.'),
  junk('ash_brand', 'ash brand', 40, 'Kragg\'s mark, burned into a strip of leather.'),
  junk('slate_tooth', 'slate tooth', 36, 'Old Slate\'s tooth. Heavier than it should be.'),
  weapon('scorched_axe', 'scorched axe', 'axe', { n: 2, sides: 8, bonus: 6 }, 2200, 640, 'Korrag\'s axe. The edge is black and it still cuts.'),
  weapon('matriarch_pick', 'matriarch\'s pick', 'blade', { n: 2, sides: 8, bonus: 5 }, 2000, 720, 'Skreeva\'s pick. It was a tool. It is not only a tool.'),
  weapon('elder_fang', 'elder fang', 'axe', { n: 3, sides: 8, bonus: 8 }, 2400, 1400, 'A fang of Vyrmathax, set in a haft. It is the castle\'s gift and sometimes the roost\'s as well.'),
  weapon('ashforged_axe', 'ashforged axe', 'axe', { n: 2, sides: 8, bonus: 8 }, 2100, 880, 'Lightbrune steel for the years after thirty. It is not subtle.'),
  weapon('scalded_blade', 'scalded blade', 'blade', { n: 2, sides: 8, bonus: 7 }, 1900, 860, 'A blade that has been in the steam. The edge held.'),
  weapon('wyrm_staff', 'wyrm staff', 'staff', { n: 2, sides: 6, bonus: 6 }, 2300, 900, 'A staff capped with a scale. It is for the casters who came up the peaks.'),
  ...charts,
];

const rules = read('src/content/armor-rules.json');
const armor = read('src/content/armor.json');
const tierNames = {
  plate: ['ashforged helm', 'ashforged breastplate', 'ashforged gauntlets', 'ashforged greaves', 'ashforged sabatons', 'ashforged shield'],
  chain: ['scorched coif', 'scorched hauberk', 'scorched mittens', 'scorched leggings', 'scorched boots', 'scorched buckler'],
  leather: ['wyrmhide cap', 'wyrmhide tunic', 'wyrmhide gloves', 'wyrmhide pants', 'wyrmhide boots', 'wyrmhide buckler'],
  cloth: ['cinder hood', 'cinder robe', 'cinder gloves', 'cinder trousers', 'cinder shoes', 'cinder sash'],
};
const slotOrder = ['head', 'chest', 'hands', 'legs', 'feet', 'secondary'];
const tier4 = [];
for (const type of ['plate', 'chain', 'leather', 'cloth']) {
  slotOrder.forEach((slot, index) => {
    const prev = armor.find((item) => item.armorType === type && item.slot === slot && item.tier === 3);
    if (!prev) throw new Error(`missing tier 3 ${type} ${slot}`);
    const id = `${type}_t4_${slot}`;
    tier4.push({
      id,
      name: tierNames[type][index],
      kind: 'armor',
      armorType: type,
      tier: 4,
      slot,
      ac: (prev.ac ?? 0) + (slot === 'chest' ? 6 : slot === 'head' || slot === 'legs' ? 3 : 2),
      weight: Math.round((prev.weight + 0.6) * 10) / 10,
      value: Math.round(prev.value * 2.4),
      stack: 1,
      wearers: rules.wearers[type],
      ...(type === 'plate' ? { craftedBy: 'dwarf' } : {}),
      blurb: `${tierNames[type][index]}. Made for the years from thirty to fifty. Heavier than the bronze, and meant to be.`,
      effects: `${type[0].toUpperCase()}${type.slice(1)} armor.`,
    });
  });
}

const dice = (n, sides, bonus) => ({ n, sides, bonus });
const prices = { 34: 980, 38: 1280, 42: 1620, 46: 1980, 50: 2400 };
function ability(id, name, short, level, classId, kind, extra) {
  const scale = 1 + (level - 30) / 20;
  const base = {
    id,
    name,
    short,
    level,
    cooldownMs: kind === 'heal' || kind === 'ward' ? 16000 : kind === 'backstab' ? 12000 : 9000,
    range: kind === 'bolt' || kind === 'field' || kind === 'stun' ? 200 : kind === 'heal' || kind === 'ward' ? 0 : 28,
    damage: kind === 'heal' || kind === 'ward' ? dice(0, 1, 0) : dice(level >= 46 ? 4 : 3, level >= 42 ? 10 : 8, Math.round(6 * scale)),
    hate: kind === 'heal' || kind === 'ward' ? 0 : 12,
    kind,
    classId,
    blurb: extra.blurb,
    ...(extra.mana ? { mana: extra.mana } : {}),
    ...(extra.verb ? { verb: extra.verb } : {}),
    ...(extra.heal ? { heal: extra.heal } : {}),
    ...(extra.buff ? { buff: extra.buff, buffMs: extra.buffMs } : {}),
    ...(extra.dotMs ? { dotMs: extra.dotMs, dotAmount: extra.dotAmount } : {}),
    ...(extra.stunMs ? { stunMs: extra.stunMs } : {}),
    ...(extra.radius ? { radius: extra.radius } : {}),
    ...(extra.slowMs ? { slowMs: extra.slowMs, slowFactor: extra.slowFactor } : {}),
    ...(extra.vsUndead ? { vsUndead: extra.vsUndead } : {}),
    ...(extra.hotMs ? { hotMs: extra.hotMs, hotAmount: extra.hotAmount } : {}),
  };
  return base;
}

const kit = [
  ['warrior', 34, 'iron_line', 'Iron Line', 'Line', 'strike', { blurb: 'A longer cut. It asks for the room.', verb: 'cut' }],
  ['warrior', 38, 'shield_break', 'Shield Break', 'Break', 'strike', { blurb: 'The blow that finds the gap in a guard.', verb: 'break' }],
  ['warrior', 42, 'hold_the_gate', 'Hold the Gate', 'Hold', 'ward', { blurb: 'You brace. Blows land heavier for a while.', buff: 'power', buffMs: 14000 }],
  ['warrior', 46, 'war_step', 'War Step', 'Step', 'strike', { blurb: 'One step, and the axe is already there.', verb: 'step' }],
  ['warrior', 50, 'last_wall', 'Last Wall', 'Wall', 'strike', { blurb: 'The last of the guard. Slow, and it means it.', verb: 'wall' }],
  ['shaman', 34, 'peat_lance', 'Peat Lance', 'Lance', 'bolt', { blurb: 'A heavier peat, thrown.', verb: 'lance', mana: 22, slowMs: 4000, slowFactor: 0.5 }],
  ['shaman', 38, 'blood_knit', 'Blood Knit', 'Knit', 'heal', { blurb: 'The deep knit, paid in mana.', heal: 80, mana: 30 }],
  ['shaman', 42, 'ash_tide', 'Ash Tide', 'Tide', 'field', { blurb: 'Ash on everyone near the target.', verb: 'tide', mana: 36, radius: 70 }],
  ['shaman', 46, 'winter_hex', 'Winter Hex', 'Hex', 'bolt', { blurb: 'One foe, and the cold stays on the feet.', verb: 'hex', mana: 28, slowMs: 7000, slowFactor: 0.35 }],
  ['shaman', 50, 'old_cold', 'The Old Cold', 'Cold', 'field', { blurb: 'The cold the peaks remember. Everyone near the target stands in it.', verb: 'freeze', mana: 44, radius: 80, slowMs: 6000, slowFactor: 0.4 }],
  ['rogue', 34, 'quiet_vein', 'Quiet Vein', 'Vein', 'dot', { blurb: 'A cut that keeps paying.', verb: 'cut', mana: 16, dotMs: 10000, dotAmount: 8 }],
  ['rogue', 38, 'side_step', 'Side Step', 'Side', 'ward', { blurb: 'You are not where the blow lands.', buff: 'evade', buffMs: 8000, mana: 18 }],
  ['rogue', 42, 'throat_cut', 'Throat Cut', 'Throat', 'backstab', { blurb: 'From behind, it ends more than it starts. From the front it still refuses.', verb: 'cut', mana: 28 }],
  ['rogue', 46, 'smoke_step', 'Smoke Step', 'Smoke', 'ward', { blurb: 'You go quiet. The next step is not announced.', buff: 'sneak', buffMs: 20000, mana: 16 }],
  ['rogue', 50, 'last_knife', 'The Last Knife', 'Knife', 'backstab', { blurb: 'The quiet knife at the end of the list.', verb: 'end', mana: 36 }],
  ['berserker', 34, 'red_line', 'Red Line', 'Line', 'strike', { blurb: 'A cut that spends rage.', verb: 'cut', mana: 24 }],
  ['berserker', 38, 'gut_howl', 'Gut Howl', 'Gut', 'strike', { blurb: 'The howl and the axe together.', verb: 'howl', mana: 30 }],
  ['berserker', 42, 'blood_price', 'Blood Price', 'Price', 'heal', { blurb: 'Turn rage into blood. It is not free.', heal: 70, mana: 40 }],
  ['berserker', 46, 'twin_ruin', 'Twin Ruin', 'Twin', 'strike', { blurb: 'Both axes, one breath.', verb: 'ruin', mana: 36 }],
  ['berserker', 50, 'red_end', 'The Red End', 'End', 'strike', { blurb: 'The last of the rage, spent on one foe.', verb: 'end', mana: 50 }],
  ['warden', 34, 'den_mend', 'Den Mend', 'Den', 'heal', { blurb: 'The den lends a knit.', heal: 78, mana: 28 }],
  ['warden', 38, 'wolf_snare', 'Wolf Snare', 'Snare', 'bolt', { blurb: 'The ground takes a foe\'s feet.', verb: 'snare', mana: 20, slowMs: 7000, slowFactor: 0.4 }],
  ['warden', 42, 'pack_ward', 'Pack Ward', 'Ward', 'ward', { blurb: 'The pack stands in front of the next blow.', buff: 'aegis', buffMs: 12000, mana: 24 }],
  ['warden', 46, 'old_fang', 'Old Fang', 'Fang', 'bolt', { blurb: 'One fang, thrown a long way.', verb: 'bite', mana: 26 }],
  ['warden', 50, 'den_mother', 'Den Mother', 'Den', 'heal', { blurb: 'The deep mend, and it keeps mending.', heal: 90, hotMs: 8000, hotAmount: 8, mana: 36 }],
  ['wizard', 34, 'glass_spear', 'Glass Spear', 'Glass', 'bolt', { blurb: 'A spear of ice with no patience.', verb: 'spear', mana: 24 }],
  ['wizard', 38, 'rime_crown', 'Rime Crown', 'Crown', 'field', { blurb: 'A crown of rime on everyone near the target.', verb: 'crown', mana: 36, radius: 72, slowMs: 5000, slowFactor: 0.45 }],
  ['wizard', 42, 'pale_needle', 'Pale Needle', 'Needle', 'bolt', { blurb: 'Thin, fast, and it still costs.', verb: 'pierce', mana: 22 }],
  ['wizard', 46, 'star_well', 'Star Well', 'Well', 'field', { blurb: 'Cold stars, and they land on the crowd.', verb: 'fall', mana: 42, radius: 80 }],
  ['wizard', 50, 'last_winter', 'The Last Winter', 'Winter', 'bolt', { blurb: 'The expensive cold. One foe, and it shows.', verb: 'freeze', mana: 48 }],
  ['cleric', 34, 'grave_light', 'Grave Light', 'Grave', 'bolt', { blurb: 'A light that hates bones.', verb: 'sear', mana: 22, vsUndead: 12 }],
  ['cleric', 38, 'quiet_ward', 'Quiet Ward', 'Ward', 'ward', { blurb: 'A ward, held quietly.', buff: 'aegis', buffMs: 14000, mana: 26 }],
  ['cleric', 42, 'last_rite', 'Last Rite', 'Rite', 'heal', { blurb: 'The mend you keep for when the first one was not enough.', heal: 100, mana: 34 }],
  ['cleric', 46, 'bone_lamp', 'Bone Lamp', 'Lamp', 'bolt', { blurb: 'Brighter than the grave light. Bones take it worse.', verb: 'burn', mana: 28, vsUndead: 18 }],
  ['cleric', 50, 'dawn_mend', 'Dawn Mend', 'Dawn', 'heal', { blurb: 'The last light. It pulls a great deal of you back.', heal: 140, mana: 42 }],
  ['enchanter', 34, 'soft_word', 'Soft Word', 'Soft', 'stun', { blurb: 'A word, and the foe stops.', verb: ' hush', mana: 22, stunMs: 4000 }],
  ['enchanter', 38, 'thin_will', 'Thin Will', 'Will', 'stun', { blurb: 'A shorter stop, sooner ready.', verb: 'hold', mana: 18, stunMs: 2500 }],
  ['enchanter', 42, 'hush_field', 'Hush Field', 'Field', 'field', { blurb: 'The hush spreads. Feet slow.', verb: 'hush', mana: 34, radius: 70, slowMs: 6000, slowFactor: 0.4 }],
  ['enchanter', 46, 'borrowed_step', 'Borrowed Step', 'Step', 'stun', { blurb: 'You borrow the next moment. They do not get it.', verb: 'take', mana: 26, stunMs: 3500 }],
  ['enchanter', 50, 'long_hush', 'The Long Hush', 'Hush', 'stun', { blurb: 'The last hush. It holds.', verb: 'silence', mana: 36, stunMs: 6000 }],
  ['paladin', 34, 'oath_strike', 'Oath Strike', 'Oath', 'strike', { blurb: 'The oath, in the blade.', verb: 'strike', mana: 16 }],
  ['paladin', 38, 'small_dawn', 'Small Dawn', 'Dawn', 'heal', { blurb: 'A grace, larger than the first.', heal: 70, mana: 24 }],
  ['paladin', 42, 'oath_bell', 'Oath Bell', 'Bell', 'stun', { blurb: 'The bell. One foe stops.', verb: 'stun', mana: 22, stunMs: 3500 }],
  ['paladin', 46, 'vow_ward', 'Vow Ward', 'Vow', 'ward', { blurb: 'The vow stands up in front of you.', buff: 'aegis', buffMs: 14000, mana: 24 }],
  ['paladin', 50, 'kept_oath', 'The Kept Oath', 'Kept', 'strike', { blurb: 'The oath you kept for the end of the list.', verb: 'cleave', mana: 28 }],
  ['magician', 34, 'cinder_lance', 'Cinder Lance', 'Lance', 'bolt', { blurb: 'A longer cinder.', verb: 'lance', mana: 22 }],
  ['magician', 38, 'ember_field', 'Ember Field', 'Field', 'field', { blurb: 'Cinders on everyone near the target.', verb: 'burst', mana: 34, radius: 70 }],
  ['magician', 42, 'second_ration', 'Second Ration', 'Ration', 'conjure', { blurb: 'Trail rations, again, from nothing you carried.', mana: 12, conjure: { itemId: 'trail_ration', qty: 3 } }],
  ['magician', 46, 'star_cinder', 'Star Cinder', 'Star', 'bolt', { blurb: 'One bright cinder. It costs.', verb: 'strike', mana: 30 }],
  ['magician', 50, 'cinder_crown', 'Cinder Crown', 'Crown', 'field', { blurb: 'The last of the ember hall. It lands on the crowd.', verb: 'crown', mana: 46, radius: 80 }],
];

const abilities = kit.map(([classId, level, id, name, short, kind, extra]) => {
  const row = ability(id, name, short, level, classId, kind, { ...extra, mana: extra.mana });
  if (kind === 'conjure') row.conjure = extra.conjure;
  if (id === 'soft_word') row.verb = 'hush';
  return row;
});

const scrolls = abilities.map((row) => ({
  id: `scroll_${row.id}`,
  name: row.name.toLowerCase(),
  kind: 'scroll',
  value: prices[row.level],
  weight: 0.1,
  stack: 1,
  teaches: row.id,
  blurb: `${row.blurb} Level ${row.level}.`,
  effects: 'Training. Buying it teaches the ability if you are the right class and level.',
}));

const trainerOf = {
  warrior: ['eirik'],
  shaman: ['torunn'],
  rogue: ['sable'],
  berserker: ['hroth'],
  warden: ['bjorn'],
  wizard: ['maeriel', 'ingrid'],
  cleric: ['selne'],
  enchanter: ['miris'],
  paladin: ['adel'],
  magician: ['quen'],
};

const merchant = read('src/content/merchant.json');
for (const row of abilities) {
  const itemId = `scroll_${row.id}`;
  for (const npcId of trainerOf[row.classId]) {
    const vendor = merchant.vendors.find((entry) => entry.npcId === npcId);
    if (!vendor) throw new Error(`missing trainer ${npcId}`);
    if (!vendor.stock.some((stock) => stock.itemId === itemId)) vendor.stock.push({ itemId, price: prices[row.level] });
  }
}
for (const id of ['chart_brightforge', 'chart_brightforge_slopes']) {
  const vendor = merchant.vendors.find((entry) => entry.npcId === 'odda');
  const item = charts.find((chart) => chart.id === id);
  if (!vendor.stock.some((stock) => stock.itemId === id)) vendor.stock.push({ itemId: id, price: item.value });
}

const existingItems = read('src/content/items.json');
const stock = (ids) => ids.map((itemId) => {
  const item = [...existingItems, ...goods, ...tier4, ...scrolls].find((row) => row.id === itemId);
  if (!item) throw new Error(`missing stock item ${itemId}`);
  return { itemId, price: item.value };
});
const vendors = [
  { npcId: 'brim', title: 'Anvil Drills', copyFrom: 'eirik', stock: [] },
  { npcId: 'kelda', title: 'Lamp Drills', copyFrom: 'selne', stock: [] },
  { npcId: 'orrin', title: 'Oath Drills', copyFrom: 'adel', stock: [] },
  { npcId: 'nala', title: 'Quiet Drills', copyFrom: 'sable', stock: [] },
  { npcId: 'bram', title: 'Red Drills', copyFrom: 'hroth', stock: [] },
  { npcId: 'henge', title: 'Lightbrune Stores', stock: stock(['trail_ration', 'wool_bandage', 'chart_brightforge', 'chart_brightforge_slopes', ...tier4.filter((item) => item.armorType === 'plate').map((item) => item.id)]) },
  { npcId: 'harl', title: 'Graymoor Forge', copyFrom: 'ivar', stock: [] },
  { npcId: 'wynn', title: 'Blackpine Cloth', copyFrom: 'signe', stock: [] },
  { npcId: 'vess', title: 'Wyrmrest Stores', stock: stock([...tier4.map((item) => item.id), 'ashforged_axe', 'scalded_blade', 'wyrm_staff', 'elder_fang', 'trail_ration', 'yarrow_draught']) },
  { npcId: 'brynn', title: 'Wyrmrest Charts', stock: stock(['trail_ration', 'wool_bandage', 'chart_wyrmrest', 'chart_ashfall', 'chart_emberwatch', 'chart_scalded', 'chart_thanes_rest', 'chart_spires']) },
  { npcId: 'ember_keel', title: 'Emberwatch Stores', stock: stock(['trail_ration', 'wool_bandage', 'chart_ashfall', 'chart_emberwatch']) },
  { npcId: 'thane_rest', title: "Thane's Stores", stock: stock(['trail_ration', 'wool_bandage', 'yarrow_draught', 'chart_scalded', 'chart_thanes_rest']) },
  { npcId: 'wry_warrior', title: 'High Drills', copyFrom: 'eirik', stock: [] },
  { npcId: 'wry_shaman', title: 'High Drills', copyFrom: 'torunn', stock: [] },
  { npcId: 'wry_rogue', title: 'High Drills', copyFrom: 'sable', stock: [] },
  { npcId: 'wry_berserker', title: 'High Drills', copyFrom: 'hroth', stock: [] },
  { npcId: 'wry_warden', title: 'High Drills', copyFrom: 'bjorn', stock: [] },
  { npcId: 'wry_wizard', title: 'High Drills', copyFrom: 'maeriel', stock: [] },
  { npcId: 'wry_cleric', title: 'High Drills', copyFrom: 'selne', stock: [] },
  { npcId: 'wry_enchanter', title: 'High Drills', copyFrom: 'miris', stock: [] },
  { npcId: 'wry_paladin', title: 'High Drills', copyFrom: 'adel', stock: [] },
  { npcId: 'wry_magician', title: 'High Drills', copyFrom: 'quen', stock: [] },
];

const abilityFile = read('src/content/abilities.json');
for (const row of abilities) {
  if (!abilityFile.some((entry) => entry.id === row.id)) abilityFile.push(row);
}
const itemFile = read('src/content/items.json');
for (const row of [...goods, ...scrolls]) {
  if (!itemFile.some((entry) => entry.id === row.id)) itemFile.push(row);
}
const armorFile = read('src/content/armor.json');
for (const row of tier4) {
  if (!armorFile.some((entry) => entry.id === row.id)) armorFile.push(row);
}

write('src/content/canon-mobs.json', mobs);
write('src/content/canon-npcs.json', npcs);
write('src/content/canon-quests.json', quests);
write('src/content/canon-dialogue.json', dialogue);
write('src/content/canon-maps.json', maps);
write('src/content/canon-vendors.json', vendors);
write('src/content/abilities.json', abilityFile);
write('src/content/items.json', itemFile);
write('src/content/armor.json', armorFile);
write('src/content/merchant.json', merchant);
console.log(`abilities +${abilities.length} scrolls +${scrolls.length} armor +${tier4.length} mobs ${mobs.length}`);
