<cursor_untrusted_data_1337 source="ReadCanvas">

Canvas "Kingdoms of Aldmoor: Design Doc v0.2" (https://cursor.com/canvas/store-278b96d4-ab73-4cd7-ae3b-7881b0c74aa0/d8d9c134-68fe-4cd8-a44f-86d9bb2e380e):

import { Page, Section, Text, Callout, Table, Properties, Rows, NumberedList, Steps, TableOfContents } from "grok/canvas";

export default function App() {
  return (
    <Page title="Kingdoms of Aldmoor: Design Doc v0.2" summary="Plan for an EverQuest-style, top-down 16-bit RPG set in the world of Aldmoor, played on the iPhone Duo. v1 starts in the Barbarian town of Hoffender. Josh is creative director; Grok Bot and the Coding bot are the dev team." width="column">
      <TableOfContents items={[
        { label: "Vision and pillars" }, { label: "Locked decisions" }, { label: "Lore and world" }, { label: "Platform and engine" },
        { label: "Core systems" }, { label: "World map" }, { label: "Starter zone: Hoffender" }, { label: "Frostfang Reach" }, { label: "The Black Ice" }, { label: "The road south" }, { label: "Brightforge" }, { label: "Eldenmoor" }, { label: "Wyrmrest" }, { label: "Ironhollow" }, { label: "Canipure" }, { label: "Grokthul" }, { label: "Warrior v1 kit" }, { label: "Touch HUD" },
        { label: "Milestone roadmap" }, { label: "Multiplayer-ready architecture" }, { label: "Open questions for Josh" },
      ]} />
      <Section heading="Vision and pillars">
        <Text>A classic-class MMO feel in a handheld, Pokémon Yellow-style overhead world: explore towns, talk to NPCs, grind outside the gates, and work up from simple fetch quests to dungeon bosses.</Text>
        <NumberedList items={[
          "Class identity first: each class plays distinctly, with gear and spells bought from guilds and merchants.",
          "Meaningful risk: deaths cost XP and a corpse run, so camps and pulls matter.",
          "A living economy: loot junk, sell it, buy upgrades from blacksmiths, tailors and spell vendors.",
          "Small and polished: one zone and one class at a time, played and tuned before growing.",
          "Built for two: co-op with Josh's brother is planned from day one.",
        ]} />
      </Section>
      <Section heading="Locked decisions">
        <Properties items={[
          { label: "Game / world", value: "Kingdoms of Aldmoor / Aldmoor" },
          { label: "Races", value: "Barbarian starts in Hoffender. High Elf starts in Eldenmoor. Dwarf starts in Brightforge. Wood Elf starts in Canipure. Ogre, the Grokthul clan, starts in Grokthul Hold. Valdorian Human starts in Thornhaven and may walk any class except Shaman, Enchanter, and Warden. Dark elf, troll, and halfling still wait." },
          { label: "v1 starter town", value: "Hoffender, the Barbarian town, ruled by Jarl Freya Halvarddottir" },
          { label: "Frostmere Wilds", value: "The country outside Hoffender's north gate" },
          { label: "Frostfang Reach", value: "The Ogre Highlands past the north ridge of the Frostmere Wilds. Levels 10–20. Hearthpass outpost. War-chief Vargan Frostfang." },
          { label: "First class", value: "Warrior" },
          { label: "Second class", value: "Wizard, playable as a Barbarian from the Hoffender gate, with mana, Shardbolt, and Rimefield" },
          { label: "Combat", value: "Real-time auto-attack, EverQuest-style" },
          { label: "Art", value: "16-bit SNES-style pixel art" },
          { label: "Level cap", value: "50. It was 10, then 25, then 30." },
          { label: "Death penalty", value: "Corpse run plus XP loss: none below level 5, 2.5% at 5–9, 5% at 10–19, 7.5% at 20–29, 10% at 30–39, 12.5% at 40–49, 15% at 50. No delevel." },
          { label: "Saves", value: "Local saves first; cloud saves arrive together with co-op" },
          { label: "Multiplayer", value: "Single-player first; architecture ready for co-op" },
        ]} />
      </Section>
      <Section heading="Lore and world">
        <Text>Eldenmoor, the High Elf capital, is a castle city built in tiers.</Text>
        <Rows rows={[
          { title: "Outside the main wall", detail: "Foreigners trading, immigrating and visiting" },
          { title: "First inner ring", detail: "Stables, blacksmiths, tailors and other trades" },
          { title: "Second ring", detail: "Taverns, shops, guilds and city business" },
          { title: "Third ring", detail: "Standard housing with quest givers; player housing later" },
          { title: "Center", detail: "The main castle, home of High Elf royalty, including Her Majesty Queen Ellewynn XVI" },
        ]} />
        <Callout tone="info" lead="More lore to come">Josh will add more lore. When the team needs lore, ask Josh and bring suggestions.</Callout>
      </Section>
      <Section heading="Platform and engine">
        <Properties items={[
          { label: "Platform", value: "Web game installed as a PWA on the iPhone Duo; wrapped as an iOS app later (Capacitor, built on Cassy's M1 Mac)" },
          { label: "Engine", value: "Phaser 3 + TypeScript, built with Vite" },
          { label: "Maps", value: "Tiled editor (.tmj), loaded natively by Phaser" },
          { label: "Screens", value: "Folded: portrait, HUD below the map. Unfolded: near-square, wider view with side panels. Re-layout on resize." },
          { label: "Touch", value: "Virtual d-pad plus tap-to-move, auto-attack toggle, 4–6 ability buttons, tap-to-target" },
          { label: "Starter art", value: "CC0/CC-BY packs: Kenney (CC0), OpenGameArt LPC sprites, Ninja Adventure pack (CC0); credits file kept in repo" },
        ]} />
        <Text>Why Phaser: mature 2D tilemap, sprite and input support, runs in Safari with no install, huge community, and TypeScript keeps a growing codebase manageable for the bots.</Text>
      </Section>
      <Section heading="Core systems">
        <Table columns={["System", "v1 design"]} rows={[
          ["Stats", "STR, STA, AGI, DEX, WIS, INT, CHA; HP, mana/endurance, AC, attack"],
          ["Leveling", "XP curve per level; cap 50; class drills are bought and gated by level through 50"],
          ["Combat", "Auto-attack on a weapon delay timer; hit, miss and crit rolls; skills on cooldowns"],
          ["Aggro", "Hate list per mob; damage and taunt add hate; social mobs assist nearby kin"],
          ["Con colors", "Gray, green, light blue, blue, white, yellow, red by level gap"],
          ["Death", "XP loss per locked table; respawn at bind point; corpse holds gear and must be recovered"],
          ["Inventory", "Bag slots plus equipment slots: head, chest, arms, legs, hands, feet, primary, secondary, ranged"],
          ["Economy", "Copper, silver, gold, platinum; merchants buy anything, sell by type; faction later"],
          ["Quests", "Data-driven: collect, kill, deliver, then chains ending in boss kills"],
          ["Saves", "Local (IndexedDB) save of serialized game state"],
        ]} />
      </Section>
      <Section heading="World map">
        <Text>Maerthun is the big western continent, and the kingdom on it is Valdoria. Hoffender and Frostfang Reach sit on the frozen northwest fjord. The Ogre Highlands run across the far north. Wyrmrest is a castle city on the kingdom's northern border, under those highlands, northeast of Hoffender. Thornhaven is a west-coast port, with Graymoor Hold just inland. Blackpine Tower is a castle in the central pines, inside a wood-elf free-passage ring. Ironhollow Keep is open in the eastern hills. Saltmere Castle, on the south coast, is not open. The Dwarven Mountains run diagonally across southern Maerthun from near Thornhaven and Graymoor: Brightforge of the Lightbrune clan is the northernmost hold, then Ashdeep of the Darkbrune, then Veilspire of the Mistbrune. The deep mine tunnels between them are shut. One forest runs from west of Blackpine, north of Ironhollow Keep, and east to the Wood Elf lands. Canipure, the wood elf treehouse city, stands on that east coast facing Vaelmoor, the high elf staging ground. The Grokthul Peaks sit in the eastern Ogre Highlands beside Wyrmrest. King Aldric Valdor rules the Kingdom of Valdoria from Thornhaven, the west-coast port, and stands in the Graymoor yard. Every castle lord answers to him. Vaelmoor is a separate continent across the water to the northeast: Eldenmoor, the Dwarven Ruins, the Troll Fens, and Illindral of the dark elves. Golden trade ships link Maerthun and Vaelmoor by the Wood Elf coast. Vescara, seat of the Shadow King at Morzul, is southeast across the Sundering Sea, and it is not open.</Text>
      </Section>
      <Section heading="Starter zone: Hoffender">
        <Rows rows={[
          { title: "Hoffender (Barbarian town)", detail: "Jarl Freya Halvarddottir rules from the mead hall; the town guards answer to her word. She favors trade and alliances over war. Planned services: warriors' guild (trainer, guildmaster quests), blacksmith, tailor, general merchant, bank, inn bind point, 3–4 quest givers" },
          { title: "Frostmere Wilds", detail: "The country outside Hoffender's gate. Rats, snakes, young wolves, then gnolls or bandits deeper in; gray-to-blue spread for levels 1–8" },
          { title: "Camp boss", detail: "A named bandit chief or alpha wolf at a small camp, level 9–10, rare drop" },
          { title: "Starter quests", detail: "10 wolf teeth for the tailor, rat whiskers for the general merchant, deliver a letter, clear the snake den, then defeat the camp boss" },
        ]} />
      </Section>
      <Section heading="Frostfang Reach">
        <Text>The world map of the Frostmere Wilds already ended the north road at a closed line: Frostfang Reach, the Ogre Highlands, snow and bare rock beyond the ridge. That line is open. A traveler who has walked the wilds takes the same road north, between two posts, and can walk back the same way. Jarl Freya Halvarddottir did not send a war-band. She keeps a fire.</Text>
        <Rows rows={[
          { title: "Hearthpass", detail: "A small palisade a short walk past the ridge, levels 10–12 on the road around it. Kara Holm keeps the stores, the charts, and the fire. Orm Keel scouts from the same yard. Sitting inside the palisade is safe. Kara can bind a hero to the fire, so a fall wakes there instead of in Hilda Venn's yard. Old saves that never bind still wake in Hoffender." },
          { title: "Broken Fangs", detail: "The west rocks, an older stone ring the ogres did not build, and their camps. Levels 13–15. Grimhild the Toll holds the west road. She is named, and she stays down longer than a common pack." },
          { title: "Tarn of Shards", detail: "East of the ridge road. Ice you can walk, and a black middle you cannot. Frost trolls at levels 14–16. Ashjaw is the named troll on the shore, seen rarely." },
          { title: "The Fang", detail: "The high cleft, levels 18–20, where the rock closes on the road. Skarn One-Tusk is the rare ogre on the climb. Vargan Frostfang, level 20, is war-chief of the highland ogres and stands at the stone mouth. He is not Ysolde of the Black Ice and he does not serve the Shadow King. The ogres were in these passes before her cold pushed the wolves down into the Frostmere Wilds. The stone mouth behind him is open. It is the door to the Black Ice." },
          { title: "Charts", detail: "Kara sells Hearthpass, the Broken Fangs, the Tarn, the Fang, and the three cavern charts. Nils Reed does not. Sefa Chart does not. The purchased charts draw in the map case, with the hero marked while you are standing in that ink." },
        ]} />
      </Section>
      <Section heading="The Black Ice">
        <Text>Past Vargan's cleft the stone mouth is a door. The Black Ice is three caverns, levels 21–28, and it is the first multi-level dungeon. The shade on Rimeheart Lake still wears Ysolde's name. She is not that shade, and she is not Vargan.</Text>
        <Rows rows={[
          { title: "The Rime Mouth", detail: "Floor one. Rime crawlers, shard lurkers, and sentries, levels 21–23. Anwen Pell keeps a fire in the west room. Warden Pell, named, holds the east room and stays down longer than the rest." },
          { title: "The Shatter Gallery", detail: "Floor two. Gallery guards and black-ice knights, levels 24–26. Magister Calden walks the middle. He is named, and he is the reason the stair north is not a hallway." },
          { title: "The Black Vault", detail: "Floor three. Knights and sentries, and Ysolde of the Black Ice at level 28. The only stair out goes back up." },
          { title: "The chain", detail: "Kara Holm, after the Fang, asks for eight rime crawlers and word for Anwen. Anwen turns that in, then sends you after Calden, then after Ysolde. The vault is reported back to the Hearthpass fire. The reward is the black ice staff. Kara also sells the three cavern charts." },
        ]} />
      </Section>
      <Section heading="The road south">
        <Text>The Frostmere signs already named the lands south of the snow. Those roads are open, and they do not skip a country. A walker leaves Hoffender by the south road or by the grass track on the southeast edge. Both enter Thornhaven. Valdoria is south of the hold. Eldenmoor is not south of Valdoria. It is on Vaelmoor, and the way there is the ship at Valdoria's east dock. The east road out of the Frostmere Wilds is open, and it reaches Wyrmrest.</Text>
        <Rows rows={[
          { title: "Thornhaven", detail: "256×256. Levels 10–18. A west-coast port, mud, and the first fields. Graymoor Hold is a castle just inland, kept by Odda Venn, with gate guards, a smith, and a bind point. Nell Ash walks the fences. Hask the Reeve is the named bandit on the south road. North returns to Hoffender. One east road is the grass track back to the wilds. Another, from the castle, is the Lightbrune Pass to Brightforge. South is Valdoria." },
          { title: "Valdoria", detail: "256×256. Levels 16–26. Pine and grass, the central kingdom. Blackpine Tower is a castle, kept by Osric Blackpine, with gate guards, a clothier, and a bind point. Captain Malrek is the named brigand by the water. North is Thornhaven. The east dock is the golden trade route to Eldenmoor. South goes on toward Saltmere, and that coast is shut." },
        ]} />
      </Section>
      <Section heading="Eldenmoor">
        <Text>High Elf is playable. A new high elf wakes in Eldenmoor, not Hoffender, and binds at the Silver Stair unless they bind somewhere else. The paths open to them are Wizard, Cleric, Enchanter, Paladin, and Magician. Warrior, Shaman, Rogue, Warden, and Berserker stay Hoffender paths. A barbarian still cannot be a wizard. A save that already has a high elf on one of those Hoffender paths continues as a Wizard, and those drills are set aside. Each elven class has a hall in the outer court. Maeriel Voss keeps the White Pages. Selne Aur keeps the chapel, Miris Vale the hush hall, Adel Cor the oath hall, and Quen Ash the ember hall. Nothing is learned by leveling. The list says Requires level N until the level is reached. Clerics and paladins can wear plate. Enchanters and magicians wear cloth.</Text>
        <Rows rows={[
          { title: "The city", detail: "256×256, the south of the same map as the woods. Three rings you can walk: an outer wall for travelers, an inner ring for the trades, and the castle court. The outer court holds the five halls. Queen Ellewynn XVI does not stand in the yard. Her steward, Halden Cour, does. Liriel Dawn keeps the Silver Stair. Tael Linden sells rations and the two elven charts. Sere Alder keeps the north gate." },
          { title: "Cleric", detail: "Selne Aur. Plate, a quiet mend, a light that lingers, a ward, and a spark that hates bones. Later, a last light that pulls you back if you fall. The chapel staff is the starting weapon." },
          { title: "Enchanter", detail: "Miris Vale. A hush that holds a foe still, a slow, a mana tide, a thin needle of force, and a borrowed will that makes one foe follow for a while. The hush rod is the starting weapon." },
          { title: "Paladin", detail: "Adel Cor. Plate and a shield, an oath cut, a small grace, a bell that stuns, and a challenge that pulls hate. The oath blade is the starting weapon." },
          { title: "Magician", detail: "Quen Ash. A cinder bolt, a called ember that uses the pet window, and a conjured ration. The ember staff is the starting weapon. The ember does not come until the call is bought and spoken." },
          { title: "The Eldenweald", detail: "The country outside the north gate, levels 1–10, the same job the Frostmere Wilds do for Hoffender. Hares and foxes by the wall, wolves, beetles, spiders, poachers, and bears as the trees thicken. Lark the Poacher is named. The Amber Hart is the rare at the north end. The woods end. They do not become Valdoria. The ship at the east dock is the way back to Maerthun." },
          { title: "Starter quests", detail: "Sere wants eight weald wolves, then Lark. Halden asks for the Amber Hart in the queen's name. Odda wants boars, then Hask. Osric wants brigands, then Malrek. Each zone on the road has its own work." },
        ]} />
      </Section>
      <Section heading="Brightforge">
        <Text>Dwarf is playable. A new dwarf wakes in Brightforge, hold of the Lightbrune clan, and binds in the yard unless they bind somewhere else. The paths open to them are Warrior, Cleric, Paladin, Rogue, and Berserker, the same class definitions the other races already use. Barbarian and high elf class lists are unchanged. Brim, Kelda, Orrin, Nala, and Bram keep the halls. King Durgan Ashbeard stands in the court. The deep doors to Ashdeep and Veilspire are seams, not roads.</Text>
        <Rows rows={[
          { title: "The hold", detail: "A stone castle in the north of the mountain map. Henge sells rations, the two charts, and Lightbrune plate. The pass north returns to Graymoor Hold, so a dwarf can join the road that already runs from level 10 to 28." },
          { title: "Lightbrune Slopes", detail: "The country outside the south gate, levels 1–10, the same job the Frostmere Wilds and the Eldenweald do. Hares and beetles, wolves, bandits, and bears. Kragg Ashhand is named. Old Slate is the rare bear." },
          { title: "Starter quests", detail: "Sella wants eight bright wolves, then Kragg. Durgan asks for Old Slate." },
        ]} />
      </Section>
      <Section heading="Wyrmrest">
        <Text>Wyrmrest is named for the dragons laid to rest beneath the northern peaks after an ancient war. Ysolde's cold kept them asleep. Breaking the Black Ice wakes them. The castle is the level 30–50 hub: a bind point, Brynn Holt for the chain, Vess for the peak armor and weapons, and a high-drill vendor for every class. The west gate is the Frostmere road. Three 256×256 zones climb north into the eastern Ogre Highlands.</Text>
        <Rows rows={[
          { title: "Ashfall Moors", detail: "Levels 30–37. Dragon-burned heath. Emberwatch is the safe outpost, dwarf scouts and a barbarian. Ash wolves, cultists, and young drakes. Korrag the Scorched is named." },
          { title: "The Scalded Vale", detail: "Levels 36–43. A steaming canyon. Kobold clans mine for the dragons. Thane's Rest is the ruined dwarf waystation, and it is safe. Skreeva is the kobold matriarch." },
          { title: "Wyrmrest Spires", detail: "Levels 42–50. Roosts. Wyverns, drakes, and dragonkin. Vyrmathax the Elder, level 50, is the oldest of the wakened. The door behind him is sealed for a later raid. The Last Step, at the south of the spires, is safe." },
          { title: "The chain", detail: "Brynn asks for eight ash wolves, then Korrag, then Skreeva, then Vyrmathax. The castle's reward is the elder fang." },
          { title: "Saves", detail: "Old saves still load. A hero standing on a tile a rebuilt map removed is set down on the nearest open ground, a safe yard when one is close. Saves from before the big map moves still wake at the zone entrance." },
        ]} />
      </Section>

      <Section heading="Ironhollow">
        <Text>Ironhollow Keep is a castle city in the eastern hills, ruled by Lord Edric Hollen. He answers to King Aldric Valdor, as every castle lord does. The keep and the hills share one 256×256 map. The court is safe. A forest road runs along the north of the keep: west to Blackpine Tower, east into the Greenreach. The hills south of the court are the second leveling road east of Blackpine, levels 18–28. Bessa sells the two charts. Oswin keeps the gate chain. Old Marrow is the named rare.</Text>
      </Section>
      <Section heading="Canipure">
        <Text>Wood Elf is playable. A new wood elf wakes in Canipure, the treehouse city on the east coast, and binds at the stair unless they bind somewhere else. The paths open to them are Warden, Rogue, Druid, and Ranger. Druid is a nature caster: heals, roots, a damage-over-time, and bark worn as a self-buff. Ranger is a bow: ranged shots, a light knife, a trail-reading buff, and a call that a beast may answer. Trainers stand in the boughs. Nothing is learned by leveling. The list says Requires level N until the level is reached, through 50. High elves are welcomed. Other races get a cold welcome: they may bind and buy bread, bandages, and the charts, and the halls will not teach them. The Greenreach, levels 1–10, is the forest west of the city, the same wood that runs north of Ironhollow. The dock faces Vaelmoor and sails to Eldenmoor.</Text>
      </Section>
      <Section heading="Grokthul">
        <Text>Ogre is playable, and this clan is not Vargan Frostfang's. The Grokthul fight the waking dragons from the eastern Ogre Highlands, beside Wyrmrest. A new ogre wakes in Grokthul Hold and binds at the fire. The paths are Warrior, Shaman, and Berserker, the same class definitions the other races already use. The valley south of the hold is levels 1–10. The Grokthul Peaks, levels 28–35, run north of the hold and west to Wyrmrest. Tuskwatch is the safe yard. Cindermaw is the named rare. Ogres are drawn big, hunched, and tusked. The sprite scale matches.</Text>
      </Section>
      <Section heading="Warrior v1 kit">
        <Table columns={["Level", "Skill", "Effect"]} rows={[
          ["1", "Auto-attack", "Weapon-delay melee swings"],
          ["1", "Kick", "Small damage, short cooldown"],
          ["3", "Taunt", "Become top of the hate list"],
          ["5", "Bash", "Requires shield; may interrupt"],
          ["6", "Defensive Stance", "Less damage taken, less dealt"],
          ["8", "Shout of Challenge", "Small area hate to nearby mobs"],
          ["10", "Second Wind", "Restore some HP, long cooldown"],
        ]} />
        <Text>That table is the old v1 plan. In the game, every class buys later drills from its guild trainer, including Cleric, Enchanter, Paladin, Magician, Druid, and Ranger, and the dwarf, wood elf, and ogre halls sell the lists for the classes those peoples may walk. The lists run through level 50. Leveling does not grant them. Until the level is reached the line reads Requires level N. A spell or ability for sale names every class that can use it, for example Classes: Cleric, Paladin. Pets grow with the hero: more health, a harder swing.</Text>
      </Section>
      <Section heading="Touch HUD">
        <Text>Combat buttons stay ATK, Next, Interact, and the ration. Journal, Spells (Abilities when the hero does not use mana), and Settings are a compact menu so a phone does not grow a second row of tiny labels. Interact talks to a person or opens a sign. Journal lists active and completed quests and their objectives. The spell book lists every spell and ability the hero knows, with icon, name, cost, and description. Tap one, then a hotbar slot, to assign it. A larger screen can drag. Slots can be rearranged or cleared, and the bar is saved with the character. An old save with no bar is filled from spells the hero already knows.</Text>
        <Text>Settings holds the hotbar style, ability names, the layout lock, and Fill the screen. Fill is off by default, so the letterboxed layout with black side bars stays. Turning it on scales the game to the edges of a larger screen and calls the Fullscreen API when the browser has it. Home-screen web apps that cannot enter fullscreen still fill the page. Every window, including shops, the journal, the book, inventory, dialogue, and settings, has a close mark pinned to the top-right of the header, at least 44 by 44 CSS pixels, that stays put while the body scrolls. The windows can still be moved and resized when the layout is unlocked.</Text>
      </Section>
      <Section heading="Milestone roadmap">
        <Steps steps={[
          { title: "M1 Core feel", detail: "One Hoffender map, movement, NPC talk, one merchant, wolves, auto-attack, loot, coin. Josh judges the feel." },
          { title: "M2 First zone", detail: "Full Hoffender and the Frostmere Wilds, quests, leveling to 10, inventory and equipment, death and corpse runs, local saves." },
          { title: "M3 Second class", detail: "A caster with a spell vendor in its guild, mana and spell casting." },
          { title: "M4 First dungeon", detail: "Done. The Black Ice, three floors past the Fang. Ysolde of the Black Ice is the boss. Kara and Anwen carry the chain." },
          { title: "M5 World growth", detail: "Phase 2 is in, and Valdorian humans now start in Thornhaven. Wood elves start in Canipure. Grokthul ogres start in Grokthul Hold. Ironhollow Keep and the hills are the road east of Blackpine. Eldenmoor, Brightforge, and the Wyrmrest road to 50 were already in. Still ahead: the remaining races, Ashdeep and Veilspire, the sealed lair under the spires, Saltmere, Vescara, rideable mounts, the iOS wrap, and co-op with cloud saves." },
        ]} />
      </Section>
      <Section heading="Multiplayer-ready architecture">
        <NumberedList items={[
          "Keep game rules in a pure simulation module, separate from Phaser rendering.",
          "All changes go through player intents (move, attack, buy), never direct state edits.",
          "Fixed tick rate with deterministic, seedable random rolls.",
          "Serializable game state with stable entity IDs, ready to sync over the network and to cloud saves.",
          "Later, the same simulation runs on a small server (Node + Colyseus or WebSockets) as the authority.",
          "Content (items, mobs, quests, spells) lives in JSON data files, not code.",
        ]} />
      </Section>
      <Section heading="Open questions for Josh">
        <NumberedList items={[
          "Hoffender's look: snowy fjord village, mountain longhouse hold, or frozen coastal port? M1 ships the fjord village.",
          "Camp boss flavor: bandit chief, alpha frost wolf, or gnoll warlord?",
          "Valdorian humans are open. Dark elf, troll, and halfling are still locked. Ashdeep, Veilspire, the lair under the spires, Saltmere, and Vescara are still shut.",
        ]} />
        <Callout lead="Next step">Coding can start M1 now; these answers shape M2.</Callout>
      </Section>
      <Section heading="Valdorians">
        <Text>Human is playable. A new Valdorian wakes in the Graymoor yard at Thornhaven, capital of the Kingdom of Valdoria, and binds there unless they bind somewhere else. King Aldric Valdor stands in that yard. The paths open to them are every class except Shaman, Enchanter, and Warden. Wren Holt sells the grove drills and Keel Marsh the bow drills in the yard. The other halls are the ones that already stand in Hoffender, Eldenmoor, Brightforge, and Canipure. The south lane, on the road just outside the hold, is levels 1 to 10: hares, foxes, wolves, boars, bandits, and a bear. The older fields stay 10 to 18. Aldric's first work is six lane hares, then five lane wolves.</Text>
      </Section>
      <Section heading="Window themes">
        <Text>Each playable race opens on its own window theme: Valdorians in royal blue and gold, high elves in white and pearl, wood elves in leaf and bark, dwarves in forge iron and bronze with rune marks, Grokthul ogres in green with a mud splatter, and Hoffender barbarians in the old frost colors with a light scratch. Settings can pick another preset, or a custom accent and window color. Text stays dark on a light window and light on a dark one. Opacity, including one window at a time, and UI scale are saved with the hero. An old save with none of this gets the race default. Reset to race default puts the theme back. Move, lock, and reset layout stay on the device, as they were.</Text>
      </Section>
      <Section heading="Placeholder rooms">
        <Text>Every visible door in a town opens. Halls that already had a teacher keep that room. A door that had no interior opens a furnished placeholder in that race's colors: a tavern, smith, stable, store, shrine, guild loft, or plain room, depending on the building. The full list, with town, building, and suggested purpose, is written to src/content/placeholder-rooms.json whenever the art is built. Those rooms are empty of quests on purpose, so a later build can give each one its lore.</Text>
      </Section>
      <Section heading="Backlog">
        <NumberedList items={[
          "Rideable mounts (future build). Stables already keep horses as their own sprite ids, listed in src/content/mounts.json with rideable set to false. A later build can sell those mounts from the stables, make them faster than walking, and keep the race themes already painted: Valdorian palfrey, fjord pony, pearl courser, grove mare, iron pony, and tusk draft. Do not invent a second horse.",
          "Name and stock the placeholder rooms listed in src/content/placeholder-rooms.json. Each row is a town, a building, and a suggested purpose.",
          "Dark elf, troll, and halfling. Ashdeep, Veilspire, the lair under the spires, Saltmere, and Vescara.",
        ]} />
      </Section>
    </Page>
  );
}


</cursor_untrusted_data_1337>