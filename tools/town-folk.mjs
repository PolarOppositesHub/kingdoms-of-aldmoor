/**
 * Named townsfolk. Each one is a real NPC record so a later build can hang a quest on them.
 * They wander. They do not give quests yet.
 */

const LOOK = {
  barbarian: ['folk_barb_guard', 'folk_barb_folk', 'folk_barb_merchant', 'folk_barb_elder'],
  human: ['folk_human_guard', 'folk_human_folk', 'folk_human_merchant', 'folk_human_elder'],
  high_elf: ['folk_elf_guard', 'folk_elf_folk', 'folk_elf_merchant', 'folk_elf_elder'],
  wood_elf: ['folk_wood_guard', 'folk_wood_folk', 'folk_wood_merchant', 'folk_wood_elder'],
  dwarf: ['folk_dwarf_guard', 'folk_dwarf_folk', 'folk_dwarf_merchant', 'folk_dwarf_elder'],
  ogre: ['folk_ogre_guard', 'folk_ogre_folk', 'folk_ogre_merchant', 'folk_ogre_elder'],
};

const ROLE = ['guard', 'townsfolk', 'merchant', 'elder'];

function pack(town, race, rows) {
  return rows.map((row, index) => {
    const [id, name, title, x, y, talk, barkA, barkB] = row;
    return {
      town,
      id,
      name,
      title,
      race,
      sprite: town === 'tavern' ? `drinker_${race}` : LOOK[race][index % LOOK[race].length],
      role: ROLE[index % ROLE.length],
      x,
      y,
      talk,
      barks: [barkA, barkB],
    };
  });
}

export const TOWN_FOLK = [
  ...pack('hoffender', 'barbarian', [
    ['holm_venn', 'Holm Venn', 'yard guard', 108, 149, 'Holm Venn. I walk the yard so the gate is not the only pair of eyes. The wilds start the moment the palisade stops.', 'The wind is off the fjord.', 'Freya wants the road clear, not a war.'],
    ['runa_keel', 'Runa Keel', 'mead runner', 136, 149, 'Runa Keel. I carry cups from the mead hall to whoever is still standing. Sit if you are not.', 'The mead is hot.', 'Do not block the hall door.'],
    ['torsten_ash', 'Torsten Ash', 'fur buyer', 150, 142, 'Torsten Ash. I buy pelts when Brenna is busy, and I do not haggle in the street. The hall has the real counter.', 'Good fur year.', 'Keep the door clear.'],
    ['elda_frost', 'Elda Frost', 'elder', 102, 158, 'Elda Frost. I have watched this yard since the palisade was new timber. The cold is a neighbor. Treat it like one.', 'The yard remembers.', 'North is wolves. South is mud.'],
    ['bram_salt', 'Bram Salt', 'fisher', 140, 158, 'Bram Salt. The bay still gives fish if you do not shout at it. The dock is west of the gate.', 'Tide is turning.', 'Salt on the wind.'],
    ['sif_reed', 'Sif Reed', 'townsfolk', 124, 146, 'Sif Reed. I grew up between the halls. If you are lost, the inn door is the one with the fire, and the wilds are north.', 'Mind the cart.', 'The children know every door.'],
  ]),
  ...pack('thornhaven', 'human', [
    ['tamsin_quay', 'Tamsin Quay', 'dock hand', 36, 128, 'Tamsin Quay. This is Thornhaven harbor, not the golden route. That ship leaves Valdoria. I only tie the small boats.', 'The quay holds.', 'Tova counts the ropes.'],
    ['pell_net', 'Pell Net', 'fisher', 40, 142, 'Pell Net. The mud flats feed us. The south lane, east of this castle, is where the young learn to swing. Hares first.', 'Nets are mended.', 'Stay off the south lane if you are not ready for a hare.'],
    ['oda_salt', 'Oda Salt', 'net mender', 28, 150, 'Oda Salt. I mend nets and listen to the tide. King Aldric is in the Thornhaven castle yard, not out on the quay.', 'Salt in the thread.', 'The king does not fish.'],
    ['ned_cooper', 'Ned Cooper', 'cooper', 48, 124, 'Ned Cooper. Barrels for the harbor and the hold. If a door is shut to you, it is only because nobody has named the room yet.', 'Staves are straight.', 'A barrel is not a chair.'],
    ['cira_venn', 'Cira Venn', 'court guard', 100, 40, 'Cira Venn. I keep the Graymoor yard for Odda. King Aldric rules from Thornhaven, the coastal castle west of here.', 'The yard is safe.', 'The south lane is the young road.'],
    ['martin_ash', 'Martin Ash', 'banner bearer', 148, 36, 'Martin Ash. The blue and gold is Valdoria. Thornhaven is the capital, and the king rules from that castle. This hold is Graymoor.', 'Hold the banner high.', 'Gold thread frays in the mud.'],
    ['lise_gold', 'Lise Gold', 'cloth seller', 112, 78, 'Lise Gold. Cloth, thread, and a rumor. The real vendors are the ones with counters. I only walk and talk.', 'Blue sells.', 'Do not stand in the stall.'],
    ['ena_page', 'Ena Page', 'king\'s page', 160, 58, 'Ena Page. If you are new to the kingdom, King Aldric is in Thornhaven, west of Graymoor. The south lane is hares, then wolves, then the harder fields.', 'The king is in Thornhaven.', 'I run messages, not errands for bandits.'],
  ]),
  ...pack('valdoria', 'human', [
    ['aden_pine', 'Aden Pine', 'tower guard', 184, 100, 'Aden Pine. Blackpine Tower answers to King Aldric, and Osric answers for the tower. I answer for this stretch of cobble.', 'The pines are close.', 'Brigands like the road.'],
    ['nessa_loom', 'Nessa Loom', 'townsfolk', 208, 136, 'Nessa Loom. The court is safe. The pines are not a garden. If you came up from Thornhaven, you already know the difference.', 'Looms need light.', 'The dock is east.'],
    ['corin_bale', 'Corin Bale', 'merchant', 160, 152, 'Corin Bale. I sell nothing from my hands. The clothier keeps the counter. I keep the gossip, and the gossip says Malrek is still east.', 'Prices hold.', 'Mind the crate.'],
    ['ilda_ward', 'Ilda Ward', 'elder', 170, 124, 'Ilda Ward. I remember when this tower was a clearing. The free-passage ring of the wood elves is older than my name. Be polite if you meet them.', 'The ring holds.', 'Osric is fair.'],
    ['joss_keel', 'Joss Keel', 'dock watcher', 210, 150, 'Joss Keel. The east dock is the golden trade route. The ship goes to Eldenmoor. You do not walk the water.', 'Ship is due.', 'The dock is not a road.'],
    ['tam_court', 'Tam Court', 'court guard', 158, 118, 'Tam Court. Doors in this castle open. If a room is empty, it is waiting on a name, not on a lock.', 'Step aside.', 'The yard is watched.'],
  ]),
  ...pack('wyrmrest', 'human', [
    ['hed_holt', 'Hed Holt', 'court guard', 88, 100, 'Hed Holt. Wyrmrest is the king\'s castle under the peaks. The dragons are awake. That is why the guard is thick and the small talk is thin.', 'Eyes on the north gate.', 'The west road is Hoffender.'],
    ['mira_ash', 'Mira Ash', 'townsfolk', 140, 120, 'Mira Ash. I live in the court because the moors burned my cousin\'s camp. Brynn has the chain. I have the walking.', 'The cobbles are warm.', 'Do not block a trainer.'],
    ['os_vend', 'Os Vend', 'pack merchant', 156, 160, 'Os Vend. Rations walk better than rumors. Vess has the real steel. I have stories about the elder and no wish to meet him.', 'Pack light.', 'The north climb is not a stroll.'],
    ['bren_old', 'Bren Old', 'elder', 90, 150, 'Bren Old. I saw the peaks when they were only graves. They are nests again. Sit the fire if you mean to fall here.', 'The cold is thinner.', 'Ysolde\'s winter ended.'],
    ['kal_gate', 'Kal Gate', 'west guard', 170, 100, 'Kal Gate. West is the Frostmere road. East, if you find it, is the Grokthul. They fight the dragons. They are not the highland ogres.', 'Gate is clear.', 'Name yourself if you linger.'],
    ['pia_lamp', 'Pia Lamp', 'lamp tender', 120, 90, 'Pia Lamp. I light the court so the trainers can see their lists. The rooms off the yard are quiet. Someone will name them later.', 'Lamps are fed.', 'Watch the step.'],
  ]),
  ...pack('ironhollow', 'human', [
    ['ren_hollen', 'Ren Hollen', 'house guard', 120, 82, 'Ren Hollen. Lord Edric keeps this keep for King Aldric. I keep the court from becoming a pasture. The hills south are the harder road.', 'The lord is in.', 'West is Blackpine.'],
    ['sal_mead', 'Sal Mead', 'townsfolk', 168, 104, 'Sal Mead. Ironhollow is a castle, not a camp. The forest road on the north runs to the wood elves if you stay on it.', 'Good cobble.', 'The hills bite.'],
    ['wim_cart', 'Wim Cart', 'carter', 140, 116, 'Wim Cart. I haul grain between the keep and the tower. I do not haul heroes. The gate is wide enough if you do not stand in it.', 'Cart is loaded.', 'Mind the wheel.'],
    ['etta_hill', 'Etta Hill', 'elder', 110, 108, 'Etta Hill. Edric is a careful lord. Old Marrow, out in the hills, is not. Learn the difference before you leave the court.', 'The court is the safe ground.', 'Bessa has the charts.'],
    ['nils_post', 'Nils Post', 'gate watch', 170, 90, 'Nils Post. North road, both ways. West to Blackpine, east into the Greenreach. I have said it until the stones know it.', 'Road is open.', 'Do not wander the hills at level one.'],
    ['calla_reed', 'Calla Reed', 'gardener', 130, 124, 'Calla Reed. Even a castle needs a garden. The fence is there so the boars do not vote on the herbs.', 'Herbs are up.', 'Shut the garden gate.'],
  ]),
  ...pack('eldenmoor', 'high_elf', [
    ['sira_dawn', 'Sira Dawn', 'court guard', 100, 164, 'Sira Dawn. The outer court is for guests. The halls teach high elves. If a door leads to an empty room, it is a house waiting on a family, not a refusal.', 'The pearl holds.', 'Mind the stair.'],
    ['lisse_aur', 'Lisse Aur', 'townsfolk', 170, 166, 'Lisse Aur. I walk the ring because the city is built in rings and someone should use them. Queen Ellewynn does not stand in the yard. Halden does.', 'Soft stone.', 'The north gate is the weald.'],
    ['quen_lil', 'Quen Lil', 'silk seller', 120, 228, 'Quen Lil. Silk and rumor, and neither from the real counter. Tael has the goods. I have the walking.', 'Pearl dye holds.', 'Do not brush the banner.'],
    ['elder_ith', 'Ith Alder', 'elder', 80, 180, 'Ith Alder. Eldenmoor was tiers before it was a story. Be quiet in the court. The weald is the place for noise, and for wolves.', 'The tiers remember.', 'High elves are welcome. Others may bind and buy bread.'],
    ['cael_star', 'Cael Star', 'lamp elf', 160, 220, 'Cael Star. I tend the lamps between the halls. The empty rooms are not lost. They are simply not written yet.', 'Lamps are even.', 'The ship dock is east.'],
    ['mira_veil', 'Mira Veil', 'guest guide', 90, 220, 'Mira Veil. If you are not of the city, you may still walk. The halls are particular about who they teach. The streets are not.', 'Welcome, quietly.', 'The castle court is inward.'],
  ]),
  ...pack('brightforge', 'dwarf', [
    ['dorr_keel', 'Dorr Keel', 'hold guard', 108, 62, 'Dorr Keel. Brightforge is Lightbrune ground. King Durgan is in the court. I am the one who tells you not to stand in the anvil door.', 'The hold is shut to the deep.', 'North is Graymoor.'],
    ['fina_ash', 'Fina Ash', 'townsfolk', 150, 66, 'Fina Ash. Short legs, long memory. The slopes south are for the young. The deep doors are not doors. They are seams.', 'Mind the rune.', 'The yard is safe.'],
    ['kem_ore', 'Kem Ore', 'ore buyer', 136, 80, 'Kem Ore. I price rock that Henge will not touch. The real plate is on his counter. I only talk.', 'Good vein gossip.', 'Do not block the stair.'],
    ['olda_flint', 'Olda Flint', 'elder', 100, 90, 'Olda Flint. I remember the pass when it was a goat track. Durgan kept the hold anyway. Ashdeep and Veilspire can wait.', 'Stone remembers.', 'Sit the fire if you mean to fall here.'],
    ['bram_lamp', 'Bram Lamp', 'lamp tender', 160, 96, 'Bram Lamp. Dwarf lamps are not decorations. They are how you find the door you meant. The empty rooms still have lamps.', 'Oil is stocked.', 'Watch your beard on the flame.'],
    ['nessa_rune', 'Nessa Rune', 'rune walker', 124, 88, 'Nessa Rune. I walk the runes so they do not fade. If you can read them, you are welcome. If you cannot, you are still welcome. Just do not lean on them.', 'The rune is bright.', 'Bronze and iron. That is the hold.'],
  ]),
  ...pack('canipure', 'wood_elf', [
    ['len_bough', 'Len Bough', 'bough guard', 168, 96, 'Len Bough. Canipure watches the coast. Wood elves and high elves are taught. Others may bind, buy bread, and keep walking.', 'The bough is watched.', 'West is the Greenreach.'],
    ['silo_leaf', 'Silo Leaf', 'townsfolk', 206, 116, 'Silo Leaf. I live in the leaves and I come down for water. The dock faces Vaelmoor. The city is the trees, not the mud.', 'Leaves are loud today.', 'Do not cut a stair.'],
    ['pemma_seed', 'Pemma Seed', 'seed seller', 184, 132, 'Pemma Seed. Seeds, gossip, and nothing that Moss would call a counter. The real stores are the bough with the sign.', 'Seeds are dry.', 'The rope bridge is a road.'],
    ['orin_root', 'Orin Root', 'elder', 156, 116, 'Orin Root. The Greenreach is the young wood. This city is the old one. Be gentle with both.', 'Roots hold.', 'High elves are guests. The rest are tolerated.'],
    ['ves_moss', 'Ves Moss', 'lamp tender', 190, 108, 'Ves Moss. Lanterns in a tree city are a promise that you can find the door after dark. The empty nests are waiting on names.', 'Wicks are cut.', 'Mind the rope.'],
    ['tae_fern', 'Tae Fern', 'gardener', 170, 148, 'Tae Fern. The garden is moss and patience. The fence is there so a boar does not become a gardener.', 'The moss is thick.', 'Shut the little gate.'],
  ]),
  ...pack('grokthul', 'ogre', [
    ['urg_hold', 'Urg Hold', 'hold guard', 108, 66, 'Urg Hold. Grokthul Hold fights dragons. We are not Vargan\'s ogres. If you are small, the valley south is the young road. The peaks are not.', 'The fire is fed.', 'Do not stand in the pit door.'],
    ['grit_mud', 'Grit Mud', 'townsfolk', 168, 82, 'Grit Mud. I walk because my knees hate sitting. The yard is safe. The mud is the floor. Both are honest.', 'Mud is honest.', 'Big feet. Small doors. Mind them.'],
    ['oga_hide', 'Oga Hide', 'hide seller', 90, 82, 'Oga Hide. Hides, not the real counter. Ugga has the stores. I have opinions and a walk.', 'Hide is curing.', 'The skulls are warnings, not hats.'],
    ['old_grak', 'Old Grak', 'elder', 140, 78, 'Old Grak. I saw the dragons sleep and I have seen them wake. This clan chose a side. Remember which one if you walk north.', 'The peaks are loud.', 'Sit the fire if you fall.'],
    ['bruk_not', 'Dreg Tusk', 'tusk watcher', 100, 90, 'Dreg Tusk. I am not Bruk and I do not sell drills. I watch the yard so the trainers can teach.', 'Tusks up.', 'The valley is south.'],
    ['mag_bone', 'Mag Bone', 'bone keeper', 160, 96, 'Mag Bone. The bones on the lodges are ours, taken fairly. The empty lodges are for kin who have not come home yet.', 'Bones are counted.', 'Leave the doorway clear.'],
  ]),
  ...pack('ashfall', 'dwarf', [
    ['ken_ember', 'Ken Ember', 'scout', 112, 200, 'Ken Ember. Emberwatch is a fire on burned ground. South is the castle. North is worse. I walk the yard so the fire is not the only bright thing.', 'Ash on the wind.', 'The yard is safe.'],
    ['dol_flint', 'Dol Flint', 'townsfolk', 140, 204, 'Dol Flint. I came up with the scouts and I stayed because the walk back is long. Korrag is north. I am not.', 'Heath is hot.', 'Mind the palisade gate.'],
    ['arin_pack', 'Arin Pack', 'pack dwarf', 124, 220, 'Arin Pack. Water and hard bread. The real vendor is not me. I just complain in a useful direction.', 'Pack is light.', 'Do not block the fire.'],
    ['essa_ash', 'Essa Ash', 'elder', 108, 214, 'Essa Ash. I have buried friends in this heath and I am not in a hurry to add myself. Sit if you bind here.', 'The moor remembers.', 'Wyrmrest is south.'],
  ]),
  ...pack('scalded', 'dwarf', [
    ['thorn_rest', 'Thorn Rest', 'waystation guard', 112, 196, 'Thorn Rest. Thane\'s Rest is a ruin we are using again. The yard is safe. The canyon is kobolds. I walk so you can tell the difference.', 'Walls still stand.', 'South is Emberwatch.'],
    ['gret_kiln', 'Gret Kiln', 'townsfolk', 148, 200, 'Gret Kiln. Steam, stone, and a dwarf who refuses to leave. The matriarch is north. I am staying by the fire.', 'Steam lies.', 'The gate faces south.'],
    ['ord_pick', 'Ord Pick', 'tool merchant', 120, 210, 'Ord Pick. Picks, if you ask, and no, I am not a counter. I talk. The canyon does the selling of trouble.', 'Iron is dear.', 'Do not nap in the door.'],
    ['mal_deep', 'Mal Deep', 'elder', 150, 214, 'Mal Deep. This waystation was ours before the dragons hired kobolds. It is ours again in the small way that matters: we can sit.', 'The rest holds.', 'North is not a stroll.'],
  ]),
  ...pack('spires', 'human', [
    ['len_step', 'Len Step', 'last watch', 116, 224, 'Len Step. The Last Step is the safe yard under the roosts. I walk it so nobody mistakes the seal for a door.', 'The step holds.', 'The elder is north.'],
    ['ora_wind', 'Ora Wind', 'townsfolk', 136, 228, 'Ora Wind. Thin air and a thick wall. South is the vale. I would not go north for the view.', 'Wind cuts.', 'Sit if you bind here.'],
    ['cam_oil', 'Cam Oil', 'lamp tender', 124, 220, 'Cam Oil. Lamps at this height are a kindness. The sealed door is not. Leave it.', 'Oil is low.', 'The yard is small. Share it.'],
    ['nes_high', 'Nes High', 'elder', 140, 234, 'Nes High. I came up to see the graves and found nests. I walk because sitting makes the height louder.', 'The peaks are awake.', 'South is the way down.'],
  ]),
  ...pack('grokthul_peaks', 'ogre', [
    ['tuk_watch', 'Tuk Watch', 'tusk watch', 110, 180, 'Tuk Watch. Tuskwatch looks at Wyrmrest and at the peaks. We hunt dragons. Vargan\'s clan is a different mountain.', 'The watch is lit.', 'West is the castle.'],
    ['ogr_ash', 'Ogr Ash', 'townsfolk', 150, 184, 'Ogr Ash. I walk the yard because the peaks are no place to stretch. South is the hold and the young valley.', 'Ash on the tusks.', 'The fire is the safe bit.'],
    ['yag_hide', 'Yag Hide', 'hide talker', 120, 196, 'Yag Hide. No counter here. Skaal has the watch. I have a walk and a warning: Cindermaw is not a pet.', 'Hide smells of smoke.', 'Leave the gate clear.'],
    ['amm_old', 'Amm Old', 'elder', 140, 170, 'Amm Old. I remember the sleep. I do not miss it. This yard is the place you fall back to. Use it.', 'The clan chose.', 'South is home.'],
  ]),
  ...pack('frostfang', 'barbarian', [
    ['kel_holm', 'Kel Holm', 'palisade guard', 118, 194, 'Kel Holm. Hearthpass is Kara\'s fire and Freya\'s patience. I walk the stakes so the ogres remember there is a fence.', 'The ridge is open.', 'South is the wilds.'],
    ['ann_keel', 'Ann Keel', 'townsfolk', 130, 196, 'Ann Keel. A small yard and a long view. Orm scouts. I boil water. Between us the pass stays a pass.', 'Water is hot.', 'Do not block the fire.'],
    ['jor_hide', 'Jor Hide', 'hide mender', 124, 190, 'Jor Hide. I mend what the ridge tears. Kara sells the real goods. I complain about thread.', 'Thread is scarce.', 'The gate faces south.'],
    ['mav_old', 'Mav Old', 'elder', 116, 206, 'Mav Old. I came north when the line opened and I stayed because the walk back is the same walk. Sit if you bind here.', 'The fang is further.', 'This yard is the safe one.'],
  ]),
  ...pack('tavern', 'human', [
    ['drinker_human_a', 'Nia Cup', 'drinker', 0, 0, 'Nia Cup. The mug is mine and the stool is borrowed. Sit if there is room, and do not block the door.', 'To the king.', 'This ale is honest.'],
    ['drinker_human_b', 'Col Tap', 'drinker', 0, 0, 'Col Tap. I came in out of the mud. I will leave when the mug is empty, which is not yet.', 'Another pour.', 'The lane can wait.'],
  ]),
  ...pack('tavern', 'barbarian', [
    ['drinker_barb_a', 'Hek Mead', 'drinker', 0, 0, 'Hek Mead. The hall is warm and the mug is full. That is the whole of my news.', 'Skol.', 'The yard is colder.'],
    ['drinker_barb_b', 'Vig Cup', 'drinker', 0, 0, 'Vig Cup. I drink standing. The stools are for people with less pride and better knees.', 'Cold outside.', 'Leave the keg.'],
  ]),
  ...pack('tavern', 'high_elf', [
    ['drinker_elf_a', 'Siel Cup', 'drinker', 0, 0, 'Siel Cup. The wine is pale and the talk is quieter than the street. Both are on purpose.', 'A small glass.', 'The lamps are kind.'],
    ['drinker_elf_b', 'Aer Tap', 'drinker', 0, 0, 'Aer Tap. I keep a stool by the window. The city is better when you are not walking it.', 'Pearl in the cup.', 'Mind the bar.'],
  ]),
  ...pack('tavern', 'wood_elf', [
    ['drinker_wood_a', 'Bri Cup', 'drinker', 0, 0, 'Bri Cup. Leaf-wine, and a stool that is really a root. I am not in a hurry.', 'The grove is loud.', 'Sit lightly.'],
    ['drinker_wood_b', 'Fen Tap', 'drinker', 0, 0, 'Fen Tap. I drink what the boughs spare. It tastes like rain and a little like pride.', 'Green in the cup.', 'The door is a rope.'],
  ]),
  ...pack('tavern', 'dwarf', [
    ['drinker_dwarf_a', 'Kel Cup', 'drinker', 0, 0, 'Kel Cup. Stone ale. It keeps. So do I, until the mug gives up.', 'To the hold.', 'Mind the anvil door.'],
    ['drinker_dwarf_b', 'Dur Tap', 'drinker', 0, 0, 'Dur Tap. I came up from the yard for one cup and the cup became a visit.', 'Warm stone.', 'The keg is not a seat.'],
  ]),
  ...pack('tavern', 'ogre', [
    ['drinker_ogre_a', 'Gug Cup', 'drinker', 0, 0, 'Gug Cup. The mug is small. I make do. The fire is the point.', 'Big swallow.', 'Leave the pit door.'],
    ['drinker_ogre_b', 'Mok Tap', 'drinker', 0, 0, 'Mok Tap. I stand because the stools are a joke. The drink is not.', 'Mud and malt.', 'The yard is safe.'],
  ]),
];

