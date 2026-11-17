/**
 * Idempotent content for wood elves, Grokthul ogres, Ironhollow, and the druid and ranger lists.
 * Run: node tools/phase2-content.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { feet } from './canon-map.mjs';
import { HOMES } from './phase2-map.mjs';

const root = join(import.meta.dirname, '..');
const read = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const write = (path, data) => writeFileSync(join(root, path), `${JSON.stringify(data, null, 2)}\n`);

function body(level, mult = 1) {
  const hp = Math.round((24 + level * 16 + Math.max(0, level - 15) * 8) * mult);
  const ac = Math.round(4 + level * 0.65 + (mult > 1.8 ? 5 : 0));
  const attack = Math.round(6 + level * 1.1 + (mult > 1.8 ? 6 : 0));
  const n = level >= 24 ? 2 : 1;
  const sides = level >= 20 ? 8 : 6;
  const bonus = 1 + Math.floor(level / 6) + (mult > 2.2 ? 4 : 0);
  const xp = Math.round((18 + level * 14) * Math.min(mult, 2.2));
  return { hp, ac, attack, damage: { n, sides, bonus }, xp, coinMin: Math.max(1, level * 2), coinMax: level * 10 };
}

function mob(spec) {
  const stats = body(spec.level, spec.mult ?? 1);
  return {
    id: spec.id,
    name: spec.name,
    level: spec.level,
    ...stats,
    delayMs: spec.delayMs ?? 2000,
    aggroRange: spec.aggro ?? 100,
    assistRange: 120,
    leash: 190,
    social: spec.social ?? '',
    speed: spec.speed ?? 52,
    wanderSpeed: 22,
    crit: spec.named || spec.rare ? 0.07 : 0.04,
    verb: spec.verb,
    loot: spec.loot,
    ...(spec.named ? { named: true } : {}),
    ...(spec.rare ? { rare: true } : {}),
    ...(spec.scale ? { scale: spec.scale } : {}),
    sprite: spec.sprite,
  };
}

const coal = (itemId, chance = 0.55) => ({ itemId, chance, min: 1, max: 1 });

const mobs = [
  mob({ id: 'reach_hare', name: 'reach hare', level: 1, social: 'hare', verb: 'kicks', sprite: 'hare', loot: [coal('stringy_meat', 0.4)], aggro: 0, speed: 48 }),
  mob({ id: 'reach_beetle', name: 'reach beetle', level: 2, social: 'beetle', verb: 'nips', sprite: 'beetle', loot: [coal('green_sap', 0.6)] }),
  mob({ id: 'green_fox', name: 'green fox', level: 3, social: 'fox', verb: 'nips', sprite: 'fox', loot: [coal('green_sap', 0.3)], aggro: 70 }),
  mob({ id: 'green_wolf', name: 'green wolf', level: 5, social: 'wolf', verb: 'bites', sprite: 'wolf', loot: [coal('green_pelt', 0.65)] }),
  mob({ id: 'reach_spider', name: 'reach spider', level: 6, social: 'spider', verb: 'bites', sprite: 'spider', loot: [coal('green_sap', 0.4)] }),
  mob({ id: 'reach_boar', name: 'reach boar', level: 8, social: 'boar', verb: 'gores', sprite: 'boar', loot: [coal('stringy_meat', 0.5)] }),
  mob({ id: 'puck', name: 'Puck the Snare', level: 9, named: true, mult: 2.1, verb: 'cuts', sprite: 'bandit', loot: [coal('snare_cord', 1)] }),
  mob({ id: 'mossantler', name: 'Mossantler', level: 10, named: true, rare: true, mult: 2.3, verb: 'gores', sprite: 'stag', loot: [coal('moss_antler', 1), coal('green_pelt', 1)] }),
  mob({ id: 'hill_wolf', name: 'hill wolf', level: 18, social: 'wolf', verb: 'bites', sprite: 'wolf', loot: [coal('hill_pelt', 0.6)] }),
  mob({ id: 'hill_boar', name: 'hill boar', level: 20, social: 'boar', verb: 'gores', sprite: 'boar', loot: [coal('stringy_meat', 0.4)] }),
  mob({ id: 'hill_brigand', name: 'hill brigand', level: 22, social: 'bandit', verb: 'cuts', sprite: 'bandit', loot: [coal('hill_token', 0.45)] }),
  mob({ id: 'hill_bear', name: 'hill bear', level: 25, social: 'bear', verb: 'mauls', sprite: 'bear', loot: [coal('hill_pelt', 0.5)] }),
  mob({ id: 'rusk', name: 'Rusk the Hollow', level: 26, named: true, mult: 2.2, verb: 'cuts', sprite: 'leader', loot: [coal('hollow_blade', 0.35), coal('hill_token', 1)] }),
  mob({ id: 'old_marrow', name: 'Old Marrow', level: 28, named: true, rare: true, mult: 2.5, verb: 'mauls', sprite: 'bear', scale: 1.2, loot: [coal('marrow_tooth', 1), coal('hill_pelt', 1)] }),
  mob({ id: 'hold_hare', name: 'valley hare', level: 1, social: 'hare', verb: 'kicks', sprite: 'hare', loot: [coal('stringy_meat', 0.35)], aggro: 0 }),
  mob({ id: 'hold_beetle', name: 'valley beetle', level: 2, social: 'beetle', verb: 'nips', sprite: 'beetle', loot: [coal('tusk_chip', 0.4)] }),
  mob({ id: 'hold_wolf', name: 'valley wolf', level: 4, social: 'wolf', verb: 'bites', sprite: 'wolf', loot: [coal('tusk_chip', 0.5)] }),
  mob({ id: 'hold_boar', name: 'valley boar', level: 7, social: 'boar', verb: 'gores', sprite: 'boar', loot: [coal('stringy_meat', 0.45)] }),
  mob({ id: 'hold_bear', name: 'valley bear', level: 8, social: 'bear', verb: 'mauls', sprite: 'bear', loot: [coal('tusk_chip', 0.4)] }),
  mob({ id: 'brug', name: 'Brug the Toll', level: 9, named: true, mult: 2.1, verb: 'clubs', sprite: 'leader', loot: [coal('toll_tooth', 1)] }),
  mob({ id: 'old_tusk', name: 'Old Tusk', level: 10, named: true, rare: true, mult: 2.3, verb: 'gores', sprite: 'boar', scale: 1.25, loot: [coal('old_tusk', 1)] }),
  mob({ id: 'peak_wolf', name: 'peak wolf', level: 28, social: 'wolf', verb: 'bites', sprite: 'ash_wolf', loot: [coal('cinder_chip', 0.5)] }),
  mob({ id: 'wyrm_pup', name: 'wyrm pup', level: 30, social: 'drake', verb: 'scorches', sprite: 'drake', scale: 1.05, loot: [coal('cinder_chip', 0.55)] }),
  mob({ id: 'ash_drake', name: 'ash drake', level: 32, social: 'drake', verb: 'scorches', sprite: 'drake', scale: 1.2, loot: [coal('drake_scale', 0.4), coal('cinder_chip', 0.4)] }),
  mob({ id: 'ridge_cultist', name: 'ridge cultist', level: 33, social: 'cult', verb: 'cuts', sprite: 'cultist', loot: [coal('cult_token', 0.4)] }),
  mob({ id: 'cindermaw', name: 'Cindermaw', level: 35, named: true, rare: true, mult: 2.6, verb: 'burns', sprite: 'drake', scale: 1.55, loot: [coal('cinder_fang', 1), coal('drake_scale', 1)] }),
];

const npcRows = [
  ['vaela', 'Elder Vaela Thorn', 'elder of Canipure', 'vaela', 'wood_elf'],
  ['sylven', 'Sylven Reed', 'warden of the west bough', 'sylven', 'wood_elf'],
  ['moss', 'Moss Linden', 'provisioner', 'moss', 'wood_elf'],
  ['larkin', 'Larkin Bough', 'warden trainer', 'larkin', 'wood_elf'],
  ['thistle', 'Thistle Venn', 'rogue trainer', 'thistle', 'wood_elf'],
  ['briar', 'Briar Holt', 'druid trainer', 'briar', 'wood_elf'],
  ['rowan', 'Rowan Keel', 'ranger trainer', 'rowan', 'wood_elf'],
  ['oak', 'Oak', 'bough guard', 'oak', 'wood_elf'],
  ['fern', 'Fern', 'bough guard', 'fern', 'wood_elf'],
  ['edric', 'Lord Edric Hollen', 'lord of Ironhollow Keep', 'edric', 'human'],
  ['oswin', 'Sergeant Oswin Keel', 'gate sergeant', 'oswin', 'human'],
  ['cald', 'Cald Hollen', 'castle smith', 'cald', 'human'],
  ['bessa', 'Bessa Quill', 'castle provisioner', 'bessa', 'human'],
  ['grukka', 'Speaker Grukka', 'speaker of Grokthul Hold', 'grukka', 'ogre'],
  ['skaal', 'Skaal', 'keeper of Tuskwatch', 'skaal', 'ogre'],
  ['bruk', 'Bruk', 'warrior trainer', 'bruk', 'ogre'],
  ['shala', 'Shala', 'shaman trainer', 'shala', 'ogre'],
  ['ruk', 'Ruk the Red', 'berserker trainer', 'ruk', 'ogre'],
  ['ugga', 'Ugga', 'provisioner', 'ugga', 'ogre'],
  ['gash', 'Gash', 'hold guard', 'gash', 'ogre'],
  ['mara', 'Mara', 'hold guard', 'mara', 'ogre'],
  ['wry_druid', 'Briar\'s counterpart', 'high drills, druid', 'wry_druid', 'wood_elf'],
  ['wry_ranger', 'Rowan\'s counterpart', 'high drills, ranger', 'wry_ranger', 'wood_elf'],
].map(([id, name, title, dialogue, race]) => ({ id, name, title, dialogue, race }));
npcRows.find((row) => row.id === 'wry_druid').name = 'Linden Moss';
npcRows.find((row) => row.id === 'wry_druid').title = 'high drills, druid';
npcRows.find((row) => row.id === 'wry_ranger').name = 'Keel Ash';
npcRows.find((row) => row.id === 'wry_ranger').title = 'high drills, ranger';

function quest(id, name, giver, description, objective, need, killId, rewardCopper, rewardXp, rewardItem) {
  return {
    id,
    name,
    giver,
    description,
    objective,
    itemId: '',
    need,
    killId,
    rewardCopper,
    rewardXp,
    ...(rewardItem ? { rewardItem } : {}),
    reward: rewardItem
      ? `${rewardItem.replaceAll('_', ' ')}, ${rewardCopper} copper, and ${rewardXp} experience`
      : `${rewardCopper} copper and ${rewardXp} experience`,
  };
}

const quests = [
  quest('green_wolves', 'Wolves in the Greenreach', 'Sylven Reed', 'Green wolves are on the west trail. Sylven wants eight of them down before the snare is named.', 'Green wolves', 8, 'green_wolf', 30, 90),
  quest('puck_snare', 'Puck the Snare', 'Sylven Reed', 'Puck the Snare takes travelers on the west trail and stays down longer than a wolf. Sylven wants the snare ended.', 'Puck the Snare', 1, 'puck', 55, 180),
  quest('mossantler', 'Mossantler', 'Elder Vaela Thorn', 'Mossantler is the stag the Greenreach rarely shows. Elder Vaela wants word that it has been met, and ended.', 'Mossantler', 1, 'mossantler', 80, 240, 'moss_antler'),
  quest('hill_pack', 'Wolves on the Hills', 'Sergeant Oswin Keel', 'Hill wolves have come up to the south road of Ironhollow. Oswin wants eight of them.', 'Hill wolves', 8, 'hill_wolf', 90, 420),
  quest('rusk_hollow', 'Rusk the Hollow', 'Sergeant Oswin Keel', 'Rusk the Hollow takes a toll in the hills and stays down. Oswin wants the toll ended.', 'Rusk the Hollow', 1, 'rusk', 140, 700),
  quest('old_marrow', 'Old Marrow', 'Lord Edric Hollen', 'Old Marrow is the rare of the deep hills. Lord Edric, who keeps this castle for King Aldric Valdor, wants it met.', 'Old Marrow', 1, 'old_marrow', 200, 980, 'marrow_tooth'),
  quest('valley_wolves', 'Wolves in the Valley', 'Speaker Grukka', 'Valley wolves are on the young ground south of Grokthul Hold. Grukka wants eight of them.', 'Valley wolves', 8, 'hold_wolf', 28, 80),
  quest('brug_toll', 'Brug the Toll', 'Speaker Grukka', 'Brug the Toll is not of this clan. He takes coin on the valley road. Grukka wants him ended.', 'Brug the Toll', 1, 'brug', 50, 170),
  quest('ash_drakes', 'Ash Drakes', 'Skaal', 'Ash drakes are on the Grokthul Peaks, the ones the broken cold woke. Skaal wants eight of them. These are not Vargan\'s ogres.', 'Ash drakes', 8, 'ash_drake', 160, 900),
  quest('cindermaw', 'Cindermaw', 'Skaal', 'Cindermaw is the rare drake on the north of the peaks. Skaal wants it ended. The fang, if it drops, is yours besides the watch\'s pay.', 'Cindermaw', 1, 'cindermaw', 240, 1400, 'cinder_fang'),
];

function node(text, choices) {
  return { text, choices };
}
function close(label = 'Another time.') {
  return { label, action: 'close' };
}
const ELVES = 'You are of the trees, or near enough. High elf and wood elf both.';

const dialogue = {
  vaela: {
    start: node(`Elder Vaela Thorn. Canipure keeps the east coast, and the boughs face Vaelmoor. ${ELVES} Mossantler is the stag we rarely see. I would like it met. King Aldric Valdor rules the castles west of the forest. He does not rule this city. We still know his name.`, [
      { label: 'I will look for Mossantler.', action: 'acceptQuest', quest: 'mossantler' },
      { label: 'Who may stand here?', next: 'welcome' },
      close(),
    ]),
    outsider: node('Elder Vaela Thorn. You are not of the trees. The stair will bind you, and Moss will sell bread. I do not give the grove\'s work to outsiders. The halls will not teach you. You may still walk the forest. Be polite while you do.', [
      { label: 'I will keep to the yard.', action: 'close' },
    ]),
    welcome: node('Wood elves wake here. High elves are kin, and the dock faces their city. Everyone else gets the yard, the stair, and the bread. Not the drills.', [{ label: 'Back.', next: 'start' }]),
    hart_active: node('Mossantler. West, where the Greenreach forgets the road. It does not come often.', [close('I am still looking.')]),
    hart_ready: node('You met it.', [{ label: 'Mossantler is down.', action: 'turnIn', quest: 'mossantler' }]),
    done: node('The forest will grow another stag. The coast still faces Vaelmoor.', [close()]),
  },
  sylven: {
    start: node('Sylven Reed. I keep the west bough. The Greenreach is a young forest: hares, beetles, then wolves. Eight green wolves, before you go looking for Puck. The same trees run west, north of Ironhollow Keep, to Blackpine.', [
      { label: 'I will thin the wolves.', action: 'acceptQuest', quest: 'green_wolves' },
      { label: 'Bind me to this stair.', action: 'bind' },
      { label: 'Where do the roads go?', next: 'roads' },
      close(),
    ]),
    outsider: node('Sylven Reed. Cold wind off the sea, and colder for you. This city is for wood elves, and we stand with the high elves. You may bind at the stair and buy what Moss calls bread. The boughs will not train you, and I will not hand you the grove\'s counts. Walk softly.', [
      { label: 'Bind me to this stair.', action: 'bind' },
      { label: 'I understand.', action: 'close' },
    ]),
    wolves_active: node('Eight green wolves. They like the west trail.', [close('Still working.'), { label: 'Bind me to this stair.', action: 'bind' }]),
    wolves_ready: node('Eight. Next is Puck the Snare. He stays down longer than a wolf.', [{ label: 'The wolves are down.', action: 'turnIn', quest: 'green_wolves' }]),
    after_wolves: node('Puck the Snare, west of the road. End it.', [
      { label: 'I will find Puck.', action: 'acceptQuest', quest: 'puck_snare' },
      { label: 'Bind me to this stair.', action: 'bind' },
      close(),
    ]),
    puck_active: node('Puck is still on the trail.', [close('I am on it.')]),
    puck_ready: node('The snare is ended. The elder can have the stag, if you want the rarer job.', [{ label: 'Puck is down.', action: 'turnIn', quest: 'puck_snare' }]),
    done: node('The west trail holds. Ironhollow is that way, then Blackpine. The dock is the other way, toward Vaelmoor.', [
      { label: 'Bind me to this stair.', action: 'bind' },
      close(),
    ]),
    roads: node('West, the Greenreach, then the forest north of Ironhollow Keep, then Blackpine Tower in Valdoria. King Aldric Valdor rules those castles. East, the dock, and Eldenmoor across the water. The hills south of Ironhollow are the harder road, not this one.', [{ label: 'Back.', next: 'start' }]),
  },
  moss: {
    start: node('Moss Linden. Bread, bandages, and the two charts for anyone who can pay. A grove staff and a wood bow are for elves. High elf or wood elf, those are yours to buy.', [
      { label: 'Show me your goods.', action: 'merchant' },
      { label: 'Bind me to this stair.', action: 'bind' },
      close(),
    ]),
    outsider: node('Moss Linden. I will sell you bread and bandages, and the charts, because a lost traveler is a worse neighbor than a rude one. The grove staff is not for you. The halls are not for you. The stair will still take your bind.', [
      { label: 'Show me the basics.', action: 'merchant' },
      { label: 'Bind me to this stair.', action: 'bind' },
      close(),
    ]),
  },
  oak: {
    start: node('Oak. The court is safe. The Greenreach is not. If you are not an elf, be brief.', [close()]),
    outsider: node('Oak. You can stand there. Do not lean on the boughs like you built them.', [close()]),
  },
  fern: {
    start: node('Fern. The dock faces Vaelmoor. The west road is the forest. I watch both.', [close()]),
    outsider: node('Fern. Pass. The bread is Moss. The drills are not.', [close()]),
  },
  larkin: {
    start: node('Larkin Bough. The warden list, the same drills Bjorn sells in Hoffender, through the last of them. Nothing is learned by getting older. If it says Requires level, you are early.', [
      { label: 'Show me the drills.', action: 'merchant' },
      close(),
    ]),
    outsider: node('Larkin Bough. I do not teach outside the blood. High elves may buy, because we stand with them. You may not.', [close('I will go.')]),
  },
  thistle: {
    start: node('Thistle Venn. Quietly. The rogue list, through level fifty. The line that says Requires level is a closed door.', [
      { label: 'Show me the drills.', action: 'merchant' },
      close(),
    ]),
    outsider: node('Thistle Venn. No. The knife is not a souvenir for every traveler King Aldric\'s road sends east.', [close()]),
  },
  briar: {
    start: node('Briar Holt. Druid. A mend, a root, a rot that stays, and a bark you put on yourself. You buy them. Leveling does not hand them over. The list says Requires level N until you are that old.', [
      { label: 'Show me the drills.', action: 'merchant' },
      close(),
    ]),
    outsider: node('Briar Holt. The grove does not sell its words to you. Come back as an elf, or do not come back for this.', [close()]),
  },
  rowan: {
    start: node('Rowan Keel. Ranger. The bow, a knife if they get close, a mark on the trail, and a call that beasts sometimes answer. Bought, not gifted. Through level fifty. Requires level means what it says.', [
      { label: 'Show me the drills.', action: 'merchant' },
      close(),
    ]),
    outsider: node('Rowan Keel. The bow stays on the rack. Elves may buy the drills. You get the yard.', [close()]),
  },
  edric: {
    start: node('Lord Edric Hollen. Ironhollow Keep is mine to hold, and I hold it for King Aldric Valdor. Every castle lord on Maerthun answers to him. The capital is not built in this yard. Old Marrow is the rare of the south hills. I would like it met.', [
      { label: 'I will look for Old Marrow.', action: 'acceptQuest', quest: 'old_marrow' },
      { label: 'What roads leave here?', next: 'roads' },
      { label: 'Bind me to this court.', action: 'bind' },
      close(),
    ]),
    marrow_active: node('Old Marrow. South, off the road, and not often. It stays down when it falls.', [close('I am still looking.')]),
    marrow_ready: node('You met it. That is the word I owed the king\'s map.', [{ label: 'Old Marrow is down.', action: 'turnIn', quest: 'old_marrow' }]),
    done: node('The hills will grow another bear. The forest north of us still runs to Canipure. Tell the king\'s people, if you see them, that the keep stands.', [
      { label: 'Bind me to this court.', action: 'bind' },
      close(),
    ]),
    roads: node('North of the keep, one forest: west to Blackpine Tower and Valdoria, east to the Greenreach and Canipure. South, the hills, eighteen to twenty-eight. Wyrmrest is not this road. It is north of Hoffender, under the peaks, and the Grokthul ogres live east of it.', [{ label: 'Back.', next: 'start' }]),
  },
  oswin: {
    start: node('Sergeant Oswin Keel. The court is safe. The hills are not. Eight hill wolves, before you go naming brigands. Lord Edric answers to King Aldric Valdor. I answer to Lord Edric. That is the whole chain.', [
      { label: 'I will thin the wolves.', action: 'acceptQuest', quest: 'hill_pack' },
      { label: 'Bind me to this court.', action: 'bind' },
      close(),
    ]),
    wolves_active: node('Eight hill wolves. They like the south slope.', [close('Still at it.')]),
    wolves_ready: node('Eight. Rusk the Hollow is next. He takes a toll and he stays down.', [{ label: 'The wolves are down.', action: 'turnIn', quest: 'hill_pack' }]),
    after_wolves: node('Rusk the Hollow, with the brigands. End the toll.', [
      { label: 'I will find Rusk.', action: 'acceptQuest', quest: 'rusk_hollow' },
      { label: 'Bind me to this court.', action: 'bind' },
      close(),
    ]),
    rusk_active: node('Rusk is still collecting.', [close()]),
    rusk_ready: node('The toll is ended. The lord can have the bear.', [{ label: 'Rusk is down.', action: 'turnIn', quest: 'rusk_hollow' }]),
    done: node('The gate holds. North is the forest road. South is the hills.', [{ label: 'Bind me to this court.', action: 'bind' }, close()]),
  },
  cald: {
    start: node('Cald Hollen. I work the castle forge for Lord Edric, and he works it for King Aldric Valdor. Plate and chain, at the price on the slate.', [
      { label: 'Show me the steel.', action: 'merchant' },
      close(),
    ]),
  },
  bessa: {
    start: node('Bessa Quill. Rations, bandages, and the two Ironhollow charts. Osric sells Blackpine. I do not. The forest north of the keep is one wood, from his tower to Canipure.', [
      { label: 'Show me your goods.', action: 'merchant' },
      { label: 'Bind me to this court.', action: 'bind' },
      close(),
    ]),
  },
  grukka: {
    start: node('Speaker Grukka. Grokthul Hold is this clan. We fight the dragons the cold woke. We are not Vargan Frostfang\'s ogres, and we do not want his name on our fire. Eight valley wolves, if you are starting here. King Aldric Valdor\'s castle is Wyrmrest, west of our peaks. We are neighbors. He is not our king. He is theirs.', [
      { label: 'I will thin the wolves.', action: 'acceptQuest', quest: 'valley_wolves' },
      { label: 'Bind me to this fire.', action: 'bind' },
      { label: 'Which ogres?', next: 'which' },
      close(),
    ]),
    which: node('Vargan keeps the Fang, past Hoffender\'s north road. Hostile, and not us. The Grokthul live in these eastern highlands, beside Wyrmrest, and the things we hunt have scales.', [{ label: 'Back.', next: 'start' }]),
    wolves_active: node('Eight valley wolves. South of the palisade.', [close('Still working.')]),
    wolves_ready: node('Eight. Brug the Toll is next. He is not of this clan.', [{ label: 'The wolves are down.', action: 'turnIn', quest: 'valley_wolves' }]),
    after_wolves: node('Brug the Toll, south, with anyone still paying him. End it.', [
      { label: 'I will find Brug.', action: 'acceptQuest', quest: 'brug_toll' },
      { label: 'Bind me to this fire.', action: 'bind' },
      close(),
    ]),
    brug_active: node('Brug is still taking the toll.', [close()]),
    brug_ready: node('The toll is ended. The valley can have its rare boar another day. The peaks are Skaal\'s count.', [{ label: 'Brug is down.', action: 'turnIn', quest: 'brug_toll' }]),
    done: node('The hold stands. North is the peaks, then Wyrmrest to the west. Do not call us Frostfang.', [
      { label: 'Bind me to this fire.', action: 'bind' },
      close(),
    ]),
  },
  skaal: {
    start: node('Skaal. Tuskwatch is the fire on the Grokthul Peaks. West is Wyrmrest. South is the hold, and it is too young for what walks up here. Eight ash drakes. They woke when the Black Ice broke. We were already here.', [
      { label: 'I will take the drakes.', action: 'acceptQuest', quest: 'ash_drakes' },
      { label: 'Bind me to this yard.', action: 'bind' },
      { label: 'Show me the chart.', action: 'merchant' },
      close(),
    ]),
    drakes_active: node('Eight ash drakes. They are the middle of this road, which is not a comfort.', [close('Still at it.')]),
    drakes_ready: node('Eight. Cindermaw is the rare one, north. It stays down.', [{ label: 'The drakes are down.', action: 'turnIn', quest: 'ash_drakes' }]),
    after_drakes: node('Cindermaw. North of the road. End it. The sealed lair under Wyrmrest\'s spires is not this job.', [
      { label: 'I will find Cindermaw.', action: 'acceptQuest', quest: 'cindermaw' },
      { label: 'Bind me to this yard.', action: 'bind' },
      close(),
    ]),
    maw_active: node('Cindermaw is still on the roost.', [close()]),
    maw_ready: node('You came back. The fang is the watch\'s pay, if the roost did not already drop one.', [{ label: 'Cindermaw is down.', action: 'turnIn', quest: 'cindermaw' }]),
    done: node('The peaks are quieter. Wyrmrest still stands west of us. Bind here if you mean to keep hunting scales.', [
      { label: 'Bind me to this yard.', action: 'bind' },
      { label: 'Show me the chart.', action: 'merchant' },
      close(),
    ]),
  },
  bruk: { start: node('Bruk. The pit sells the warrior drills, the same list as Hoffender, through level fifty. If it says Requires level, you are early.', [{ label: 'Show me the drills.', action: 'merchant' }, close()]) },
  shala: { start: node('Shala. Slows, mends, and the burn that stays. Torunn\'s list. I sell it here. The level is the lock.', [{ label: 'Show me the drills.', action: 'merchant' }, close()]) },
  ruk: { start: node('Ruk the Red. Rage is a tool. The pit sells Hroth\'s list, to the end of it.', [{ label: 'Show me the drills.', action: 'merchant' }, close()]) },
  ugga: { start: node('Ugga. Rations, the hold charts, and leather that fits a large chest. The peaks chart is Skaal\'s.', [{ label: 'Show me your goods.', action: 'merchant' }, { label: 'Bind me to this fire.', action: 'bind' }, close()]) },
  gash: { start: node('Gash. The yard is safe. The valley is not. Vargan\'s ogres are a long way west of this fire. Do not mix us up.', [close()]) },
  mara: { start: node('Mara. North is the peaks and the dragons. South is where the young ones learn. I count who comes back.', [close()]) },
  wry_druid: {
    start: node('Linden Moss. The druid list, the same one Briar sells in Canipure, through level fifty. Nothing on it arrives because you leveled. If it says Requires level, you are early.', [
      { label: 'Show me the drills.', action: 'merchant' },
      close(),
    ]),
  },
  wry_ranger: {
    start: node('Keel Ash. The ranger list, through the last arrow. Bought. The level on the line is the lock.', [
      { label: 'Show me the drills.', action: 'merchant' },
      close(),
    ]),
  },
};

const maps = [
  { id: 'ironhollow', name: 'Ironhollow Keep', blurb: 'Lord Edric\'s castle. The ink stops at the wall.' },
  { id: 'ironhollow_hills', name: 'Ironhollow Hills', blurb: 'The hills south of the keep, from the gate to Old Marrow.' },
  { id: 'canipure', name: 'Canipure', blurb: 'The wood elf treehouse city. The ink stops at the boughs.' },
  { id: 'greenreach', name: 'The Greenreach', blurb: 'The young forest west of Canipure.' },
  { id: 'grokthul', name: 'Grokthul Hold', blurb: 'The Grokthul camp. The ink stops at the palisade.' },
  { id: 'grokthul_valley', name: 'Grokthul Valley', blurb: 'The young ground south of the hold.' },
  { id: 'grokthul_peaks', name: 'Grokthul Peaks', blurb: 'The peaks beside Wyrmrest. Cindermaw keeps the north of them.' },
];

function chartItem(mapId, name, blurb, value) {
  return { id: `chart_${mapId}`, name, kind: 'chart', chart: mapId, value, weight: 0.1, stack: 1, blurb, effects: 'Adds the chart to the map case.' };
}
function junk(id, name, value, blurb) {
  return { id, name, kind: 'junk', value, weight: 0.2, stack: 20, blurb, effects: 'Sell it.' };
}
function weapon(id, name, grip, damage, delayMs, value, blurb, look) {
  return { id, name, kind: 'weapon', slot: 'primary', grip, damage, delayMs, value, weight: 3.2, stack: 1, blurb, effects: 'Worn in the hand.', ...(look ? { look } : {}) };
}

const goods = [
  junk('green_sap', 'green sap', 2, 'Sticky, and it smells like the bark it came from.'),
  junk('green_pelt', 'green pelt', 4, 'Wolf or boar. The forest does not label it.'),
  junk('snare_cord', 'snare cord', 18, 'Puck\'s cord. Still tied the way he left it.'),
  junk('moss_antler', 'moss antler', 40, 'Mossantler\'s beam. Lighter than it looks, and greener.'),
  junk('hill_pelt', 'hill pelt', 8, 'A hide off the Ironhollow road.'),
  junk('hill_token', 'hill token', 10, 'A coin the brigands cut down until it is barely a coin.'),
  junk('tusk_chip', 'tusk chip', 3, 'Not a dragon tooth. A valley animal\'s, and small.'),
  junk('toll_tooth', 'toll tooth', 16, 'Brug kept it on a thong.'),
  junk('old_tusk', 'old tusk', 28, 'Old Tusk\'s namesake. It is heavier than the chip.'),
  junk('cinder_chip', 'cinder chip', 12, 'A scale flake, still warm.'),
  weapon('grove_staff', 'grove staff', 'staff', { n: 1, sides: 4, bonus: 1 }, 2400, 16, 'A staff with a leaf caught in the grain. A druid starts with one.', 'weapon_staff'),
  weapon('wood_bow', 'wood bow', 'bow', { n: 1, sides: 5, bonus: 1 }, 2200, 18, 'A short bow of Greenreach yew. The shots that matter are bought. This still swings.', 'weapon_bow'),
  weapon('hollow_blade', 'hollow blade', 'blade', { n: 2, sides: 6, bonus: 3 }, 2000, 220, 'Rusk\'s blade. It has taken more tolls than it should.'),
  weapon('cinder_fang', 'cinder fang', 'axe', { n: 2, sides: 8, bonus: 4 }, 2100, 480, 'A fang of Cindermaw, hafted. Warm in the hand.'),
  weapon('marrow_tooth', 'marrow tooth', 'axe', { n: 2, sides: 6, bonus: 3 }, 2200, 260, 'Old Marrow\'s tooth, set in a haft.'),
  chartItem('ironhollow', 'chart of Ironhollow Keep', 'Bessa\'s ink of the castle court.', 50),
  chartItem('ironhollow_hills', 'chart of the Ironhollow Hills', 'The hills south of the keep, as far as Old Marrow.', 60),
  chartItem('canipure', 'chart of Canipure', 'Moss\'s ink of the bough court.', 30),
  chartItem('greenreach', 'chart of the Greenreach', 'The forest west of the city.', 28),
  chartItem('grokthul', 'chart of Grokthul Hold', 'Ugga\'s ink of the camp.', 24),
  chartItem('grokthul_valley', 'chart of the Grokthul Valley', 'The young ground south of the hold.', 26),
  chartItem('grokthul_peaks', 'chart of the Grokthul Peaks', 'Skaal\'s ink, from Tuskwatch to Cindermaw.', 80),
];

const rules = read('src/content/armor-rules.json');
if (!rules.wearers.cloth.includes('druid')) rules.wearers.cloth.push('druid');
if (!rules.wearers.leather.includes('ranger')) rules.wearers.leather.push('ranger');
write('src/content/armor-rules.json', rules);
const armor = read('src/content/armor.json');
for (const item of armor) {
  if (rules.wearers[item.armorType]) item.wearers = [...rules.wearers[item.armorType]];
}
write('src/content/armor.json', armor.filter((item) => item.id !== 'leaf_robe'));

const dice = (n, sides, bonus) => ({ n, sides, bonus });
function ability(row) {
  const { id, name, short, level, classId, kind, blurb, mana = 0, verb, heal, buff, buffMs, dotMs, dotAmount, slowMs, slowFactor, radius, hotMs, hotAmount } = row;
  const out = {
    id,
    name,
    short,
    level,
    cooldownMs: kind === 'heal' || kind === 'ward' ? 14000 : kind === 'charm' ? 24000 : kind === 'strike' ? 7000 : 5000,
    range: kind === 'heal' || kind === 'ward' ? 0 : kind === 'strike' ? 28 : 200,
    damage: kind === 'heal' || kind === 'ward' || kind === 'charm' ? dice(0, 1, 0) : dice(level >= 40 ? 3 : level >= 16 ? 2 : 1, level >= 28 ? 8 : 6, Math.max(1, Math.round(level / 8))),
    hate: kind === 'heal' || kind === 'ward' ? 0 : 6,
    kind,
    classId,
    blurb,
  };
  if (mana) out.mana = mana;
  if (verb) out.verb = verb;
  if (heal) out.heal = heal;
  if (buff) {
    out.buff = buff;
    out.buffMs = buffMs;
  }
  if (dotMs) {
    out.dotMs = dotMs;
    out.dotAmount = dotAmount;
  }
  if (slowMs) {
    out.slowMs = slowMs;
    out.slowFactor = slowFactor;
  }
  if (radius) out.radius = radius;
  if (hotMs) {
    out.hotMs = hotMs;
    out.hotAmount = hotAmount;
  }
  return out;
}

const kit = [
  ability({ id: 'briar_mend', name: 'Briar Mend', short: 'Briar', level: 1, classId: 'druid', kind: 'heal', blurb: 'A small mend from the green.', heal: 14, mana: 8 }),
  ability({ id: 'thorn_bolt', name: 'Thorn Bolt', short: 'Thorn', level: 1, classId: 'druid', kind: 'bolt', blurb: 'One thorn, thrown.', verb: 'pierce', mana: 6 }),
  ability({ id: 'creeping_rot', name: 'Creeping Rot', short: 'Rot', level: 4, classId: 'druid', kind: 'dot', blurb: 'A rot that keeps working.', verb: 'rots', mana: 10, dotMs: 8000, dotAmount: 3 }),
  ability({ id: 'rootbind', name: 'Rootbind', short: 'Root', level: 8, classId: 'druid', kind: 'bolt', blurb: 'Roots take the feet. They do not let go quickly.', verb: 'root', mana: 14, slowMs: 7000, slowFactor: 0.15 }),
  ability({ id: 'barkskin', name: 'Barkskin', short: 'Bark', level: 12, classId: 'druid', kind: 'ward', blurb: 'You put the bark on yourself.', buff: 'aegis', buffMs: 12000, mana: 16 }),
  ability({ id: 'seed_mend', name: 'Seed Mend', short: 'Seed', level: 16, classId: 'druid', kind: 'heal', blurb: 'A mend that keeps growing.', heal: 20, hotMs: 8000, hotAmount: 4, mana: 18 }),
  ability({ id: 'bramble_field', name: 'Bramble Field', short: 'Bramble', level: 20, classId: 'druid', kind: 'field', blurb: 'Briars on everyone near the target.', verb: 'rake', mana: 24, radius: 70, slowMs: 4000, slowFactor: 0.55 }),
  ability({ id: 'vine_lash', name: 'Vine Lash', short: 'Lash', level: 24, classId: 'druid', kind: 'bolt', blurb: 'A longer vine.', verb: 'lash', mana: 18 }),
  ability({ id: 'grove_root', name: 'Grove Root', short: 'Root', level: 28, classId: 'druid', kind: 'bolt', blurb: 'The root that does not hurry.', verb: 'bind', mana: 22, slowMs: 9000, slowFactor: 0.12 }),
  ability({ id: 'grove_mend', name: 'Grove Mend', short: 'Grove', level: 32, classId: 'druid', kind: 'heal', blurb: 'The grove lends a larger mend.', heal: 70, mana: 28 }),
  ability({ id: 'spore_cloud', name: 'Spore Cloud', short: 'Spore', level: 36, classId: 'druid', kind: 'field', blurb: 'Spores on the crowd.', verb: 'choke', mana: 32, radius: 74 }),
  ability({ id: 'living_bark', name: 'Living Bark', short: 'Bark', level: 40, classId: 'druid', kind: 'ward', blurb: 'The bark stays longer.', buff: 'aegis', buffMs: 18000, mana: 26 }),
  ability({ id: 'thorn_rain', name: 'Thorn Rain', short: 'Rain', level: 44, classId: 'druid', kind: 'field', blurb: 'Thorns on everyone near the target.', verb: 'rain', mana: 36, radius: 80 }),
  ability({ id: 'old_growth', name: 'Old Growth', short: 'Growth', level: 48, classId: 'druid', kind: 'dot', blurb: 'The old rot. It stays.', verb: 'rots', mana: 30, dotMs: 12000, dotAmount: 8 }),
  ability({ id: 'green_crown', name: 'The Green Crown', short: 'Crown', level: 50, classId: 'druid', kind: 'heal', blurb: 'The last mend of the grove, and it keeps mending.', heal: 120, hotMs: 8000, hotAmount: 8, mana: 40 }),
  ability({ id: 'quick_shot', name: 'Quick Shot', short: 'Shot', level: 1, classId: 'ranger', kind: 'bolt', blurb: 'One arrow. The bow is already in your hand.', verb: 'shoot', mana: 4 }),
  ability({ id: 'knife_jab', name: 'Knife Jab', short: 'Jab', level: 1, classId: 'ranger', kind: 'strike', blurb: 'When they get close. Light, and mean.', verb: 'jab' }),
  ability({ id: 'marked_trail', name: 'Marked Trail', short: 'Mark', level: 4, classId: 'ranger', kind: 'ward', blurb: 'You read the ground. Breath comes easier.', buff: 'flow', buffMs: 20000, mana: 8 }),
  ability({ id: 'pinning_shot', name: 'Pinning Shot', short: 'Pin', level: 8, classId: 'ranger', kind: 'bolt', blurb: 'An arrow in the foot.', verb: 'pin', mana: 12, slowMs: 6000, slowFactor: 0.4 }),
  ability({ id: 'sidestep', name: 'Sidestep', short: 'Side', level: 12, classId: 'ranger', kind: 'ward', blurb: 'You are not where the blow lands.', buff: 'evade', buffMs: 6000, mana: 10 }),
  ability({ id: 'volley', name: 'Volley', short: 'Volley', level: 16, classId: 'ranger', kind: 'field', blurb: 'Arrows on everyone near the target.', verb: 'shoot', mana: 20, radius: 68 }),
  ability({ id: 'calm_beast', name: 'Calm Beast', short: 'Calm', level: 20, classId: 'ranger', kind: 'charm', blurb: 'A beast listens, for a while. It is not a promise about people.', buffMs: 18000, mana: 22 }),
  ability({ id: 'low_shot', name: 'Low Shot', short: 'Low', level: 24, classId: 'ranger', kind: 'bolt', blurb: 'A low shot. The feet slow.', verb: 'cut', mana: 16, slowMs: 7000, slowFactor: 0.35 }),
  ability({ id: 'hunters_eye', name: 'Hunter\'s Eye', short: 'Eye', level: 28, classId: 'ranger', kind: 'bolt', blurb: 'One careful shot.', verb: 'pierce', mana: 18 }),
  ability({ id: 'thicket_step', name: 'Thicket Step', short: 'Thicket', level: 32, classId: 'ranger', kind: 'ward', blurb: 'You go quiet. The trail hides you.', buff: 'sneak', buffMs: 16000, mana: 12 }),
  ability({ id: 'arrow_rain', name: 'Arrow Rain', short: 'Rain', level: 36, classId: 'ranger', kind: 'field', blurb: 'The expensive volley.', verb: 'rain', mana: 30, radius: 76 }),
  ability({ id: 'second_mark', name: 'Second Mark', short: 'Mark', level: 40, classId: 'ranger', kind: 'bolt', blurb: 'You already know where it will land.', verb: 'shoot', mana: 22 }),
  ability({ id: 'wild_knit', name: 'Wild Knit', short: 'Knit', level: 44, classId: 'ranger', kind: 'heal', blurb: 'The wild lends a small mend. Animal-friendly, which includes you.', heal: 60, mana: 24 }),
  ability({ id: 'long_shot', name: 'Long Shot', short: 'Long', level: 48, classId: 'ranger', kind: 'bolt', blurb: 'Far, and it costs.', verb: 'pierce', mana: 26 }),
  ability({ id: 'last_arrow', name: 'The Last Arrow', short: 'Last', level: 50, classId: 'ranger', kind: 'bolt', blurb: 'The arrow at the end of the list.', verb: 'end', mana: 34 }),
];

const priceOf = (level) => Math.round(36 + level * 22 + Math.max(0, level - 20) * 28);
const scrolls = kit.map((row) => ({
  id: `scroll_${row.id}`,
  name: row.name.toLowerCase(),
  kind: 'scroll',
  value: priceOf(row.level),
  weight: 0.1,
  stack: 1,
  teaches: row.id,
  blurb: `${row.blurb} Level ${row.level}.`,
  effects: 'Training. Buying it teaches the ability if you are the right class and level.',
}));

const elves = ['wood_elf', 'high_elf'];
const druidStock = kit.filter((row) => row.classId === 'druid').map((row) => ({ itemId: `scroll_${row.id}`, price: priceOf(row.level) }));
const rangerStock = kit.filter((row) => row.classId === 'ranger').map((row) => ({ itemId: `scroll_${row.id}`, price: priceOf(row.level) }));

const vendors = [
  { npcId: 'larkin', title: 'Warden Drills', copyFrom: 'bjorn', races: elves, stock: [] },
  { npcId: 'thistle', title: 'Rogue Drills', copyFrom: 'sable', races: elves, stock: [] },
  { npcId: 'briar', title: 'Grove Drills', races: elves, stock: druidStock },
  { npcId: 'rowan', title: 'Ranger Drills', races: elves, stock: rangerStock },
  { npcId: 'wry_druid', title: 'High Drills', copyFrom: 'briar', stock: [] },
  { npcId: 'wry_ranger', title: 'High Drills', copyFrom: 'rowan', stock: [] },
  { npcId: 'bruk', title: 'Warrior Drills', copyFrom: 'eirik', stock: [] },
  { npcId: 'shala', title: 'Shaman Drills', copyFrom: 'torunn', stock: [] },
  { npcId: 'ruk', title: 'Berserker Drills', copyFrom: 'hroth', stock: [] },
  {
    npcId: 'moss',
    title: 'Bough Stores',
    stock: [
      { itemId: 'trail_ration', price: 8 },
      { itemId: 'wool_bandage', price: 12 },
      { itemId: 'chart_canipure', price: 30 },
      { itemId: 'chart_greenreach', price: 28 },
      { itemId: 'grove_staff', price: 16, races: elves },
      { itemId: 'wood_bow', price: 18, races: elves },
    ],
  },
  {
    npcId: 'bessa',
    title: 'Ironhollow Stores',
    stock: [
      { itemId: 'trail_ration', price: 8 },
      { itemId: 'wool_bandage', price: 12 },
      { itemId: 'chart_ironhollow', price: 50 },
      { itemId: 'chart_ironhollow_hills', price: 60 },
    ],
  },
  { npcId: 'cald', title: 'Ironhollow Forge', copyFrom: 'ivar', stock: [] },
  {
    npcId: 'ugga',
    title: 'Hold Stores',
    stock: [
      { itemId: 'trail_ration', price: 8 },
      { itemId: 'wool_bandage', price: 12 },
      { itemId: 'chart_grokthul', price: 24 },
      { itemId: 'chart_grokthul_valley', price: 26 },
    ],
  },
  {
    npcId: 'skaal',
    title: 'Tuskwatch Stores',
    stock: [
      { itemId: 'trail_ration', price: 8 },
      { itemId: 'wool_bandage', price: 12 },
      { itemId: 'chart_grokthul_peaks', price: 80 },
    ],
  },
];

const abilityFile = read('src/content/abilities.json');
for (const row of kit) {
  const index = abilityFile.findIndex((entry) => entry.id === row.id);
  if (index >= 0) abilityFile[index] = row;
  else abilityFile.push(row);
}
const itemFile = read('src/content/items.json');
for (const row of [...goods, ...scrolls]) {
  const index = itemFile.findIndex((entry) => entry.id === row.id);
  if (index >= 0) itemFile[index] = row;
  else itemFile.push(row);
}
write('src/content/abilities.json', abilityFile);
write('src/content/items.json', itemFile);

const classes = read('src/content/classes.json');
const druid = {
  id: 'druid',
  name: 'Druid',
  race: 'wood_elf',
  stats: { str: 8, sta: 10, agi: 10, dex: 9, wis: 16, int: 12, cha: 10 },
  ac: 3,
  baseHp: 18,
  hpPerLevel: 5,
  hpPerSta: 1,
  weapon: 'grove_staff',
  sprite: 'body_m',
  baseMana: 22,
  manaPerLevel: 6,
  manaPerInt: 1,
  resource: 'mana',
  baseFocus: 0,
  focusPerLevel: 0,
  blurb: 'Roots, a mend, a rot that stays, and bark you put on yourself.',
  abilities: [],
  kit: { chest: 'tattered_robe', feet: 'tattered_shoes' },
};
const ranger = {
  id: 'ranger',
  name: 'Ranger',
  race: 'wood_elf',
  stats: { str: 10, sta: 10, agi: 14, dex: 16, wis: 10, int: 8, cha: 8 },
  ac: 4,
  baseHp: 20,
  hpPerLevel: 5,
  hpPerSta: 1,
  weapon: 'wood_bow',
  sprite: 'body_m',
  baseMana: 14,
  manaPerLevel: 4,
  manaPerInt: 1,
  resource: 'mana',
  baseFocus: 0,
  focusPerLevel: 0,
  blurb: 'A bow, a light knife, a trail you can read, and a kindness toward beasts.',
  abilities: [],
  kit: { chest: 'cracked_leather_tunic', feet: 'cracked_leather_boots' },
};
for (const row of [druid, ranger]) {
  const index = classes.findIndex((entry) => entry.id === row.id);
  if (index >= 0) classes[index] = row;
  else classes.push(row);
}
write('src/content/classes.json', classes);

const roster = read('src/content/roster.json');
const wood = roster.races.find((race) => race.id === 'wood_elf');
const ogre = roster.races.find((race) => race.id === 'ogre');
const woodHome = feet(HOMES.wood_elf.tx, HOMES.wood_elf.ty);
const ogreHome = feet(HOMES.ogre.tx, HOMES.ogre.ty);
Object.assign(wood, {
  playable: true,
  blurb: 'Canipure\'s own. Pointed ears, and a coat the color of leaves.',
  homeZone: 'canipure',
  homeX: woodHome.x,
  homeY: woodHome.y,
  scale: 1.02,
});
Object.assign(ogre, {
  playable: true,
  blurb: 'Grokthul\'s own. Big, hunched, and on the dragons\' side of the fight.',
  homeZone: 'grokthul',
  homeX: ogreHome.x,
  homeY: ogreHome.y,
  scale: 1.45,
});
const dwarf = roster.races.find((race) => race.id === 'dwarf');
const barbarian = roster.races.find((race) => race.id === 'barbarian');
const high = roster.races.find((race) => race.id === 'high_elf');
const human = roster.races.find((race) => race.id === 'human');
if (dwarf) {
  dwarf.scale = 0.82;
  dwarf.blurb = 'Brightforge\'s own. Short, stocky, and bearded to the belt.';
}
if (barbarian) barbarian.scale = 1.2;
if (high) {
  high.scale = 1.08;
  high.blurb = 'Eldenmoor\'s own. Pale, pointed ears, and silver at the brow.';
}
if (human) human.blurb = 'The plain measure the other peoples are seen against.';
const addRace = (id, raceId) => {
  const row = roster.classes.find((entry) => entry.id === id);
  if (row && !row.races.includes(raceId)) row.races.push(raceId);
};
addRace('warden', 'wood_elf');
addRace('rogue', 'wood_elf');
addRace('warrior', 'ogre');
addRace('shaman', 'ogre');
addRace('berserker', 'ogre');
const ensureClass = (row) => {
  const index = roster.classes.findIndex((entry) => entry.id === row.id);
  if (index >= 0) roster.classes[index] = { ...roster.classes[index], ...row };
  else roster.classes.push(row);
};
ensureClass({ id: 'druid', name: 'Druid', playable: true, races: ['wood_elf'], blurb: 'A mend, a root, a rot, and bark you wear.' });
ensureClass({ id: 'ranger', name: 'Ranger', playable: true, races: ['wood_elf'], blurb: 'A bow, a light knife, and a kindness toward beasts.' });
write('src/content/roster.json', roster);

write('src/content/phase2-mobs.json', mobs);
write('src/content/phase2-npcs.json', npcRows);
write('src/content/phase2-quests.json', quests);
write('src/content/phase2-dialogue.json', dialogue);
write('src/content/phase2-maps.json', maps);
write('src/content/phase2-vendors.json', vendors);
console.log(`phase2 mobs ${mobs.length} abilities ${kit.length} vendors ${vendors.length}`);
