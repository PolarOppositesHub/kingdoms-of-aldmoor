<cursor_untrusted_data_1337 source="ReadCanvas">

Canvas "Kingdoms of Aldmoor: Design Doc v0.2" (https://cursor.com/canvas/store-278b96d4-ab73-4cd7-ae3b-7881b0c74aa0/d8d9c134-68fe-4cd8-a44f-86d9bb2e380e):

import { Page, Section, Text, Callout, Table, Properties, Rows, NumberedList, Steps, TableOfContents } from "grok/canvas";

export default function App() {
  return (
    <Page title="Kingdoms of Aldmoor: Design Doc v0.2" summary="Plan for an EverQuest-style, top-down 16-bit RPG set in the world of Aldmoor, played on the iPhone Duo. v1 starts in the Barbarian town of Hoffender. Josh is creative director; Grok Bot and the Coding bot are the dev team." width="column">
      <TableOfContents items={[
        { label: "Vision and pillars" }, { label: "Locked decisions" }, { label: "Lore and world" }, { label: "Platform and engine" },
        { label: "Core systems" }, { label: "Starter zone: Hoffender" }, { label: "Frostfang Reach" }, { label: "The Black Ice" }, { label: "The road south" }, { label: "Eldenmoor" }, { label: "Warrior v1 kit" },
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
          { label: "Races", value: "Human, Dwarf, High Elf, Barbarian. High Elf is playable and starts in Eldenmoor. The others still wait." },
          { label: "v1 starter town", value: "Hoffender, the Barbarian town, ruled by Jarl Freya Halvarddottir" },
          { label: "Frostmere Wilds", value: "The country outside Hoffender's north gate" },
          { label: "Frostfang Reach", value: "The Ogre Highlands past the north ridge of the Frostmere Wilds. Levels 10–20. Hearthpass outpost. War-chief Vargan Frostfang." },
          { label: "First class", value: "Warrior" },
          { label: "Second class", value: "Wizard, playable as a Barbarian from the Hoffender gate, with mana, Shardbolt, and Rimefield" },
          { label: "Combat", value: "Real-time auto-attack, EverQuest-style" },
          { label: "Art", value: "16-bit SNES-style pixel art" },
          { label: "Level cap", value: "30. It was 10, then 25. 50 is still the far goal." },
          { label: "Death penalty", value: "Corpse run plus XP loss: none below level 5, 2.5% at 5–9, 5% at 10–19, 7.5% at 20–29, 10% at 30. No delevel." },
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
          ["Leveling", "XP curve per level; cap 30; class drills are bought and gated by level through 30"],
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
        <Text>The Frostmere signs already named the lands south of the snow. Those roads are open, and they do not skip a country. A walker leaves Hoffender by the south road or by the grass track on the southeast edge. Both enter Thornhaven. Valdoria is south of the hold. Eldenmoor is south of Valdoria. The east road to Wyrmrest is still closed.</Text>
        <Rows rows={[
          { title: "Thornhaven", detail: "256×256. Levels 10–18. Mud, slush, and the first fields. Graymoor Hold is the safe yard in the north, kept by Odda Venn. Nell Ash walks the fences. Hask the Reeve is the named bandit on the south road. North returns to Hoffender. The east gate is the grass track. South is Valdoria." },
          { title: "Valdoria", detail: "256×256. Levels 16–26. Pine and grass, the kingdom between the mud and the elves. Blackpine Tower is the safe yard. Osric Blackpine keeps it. Captain Malrek is the named brigand by the water. North is Thornhaven. South is the Eldenweald." },
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
          { title: "The Eldenweald", detail: "The country outside the north gate, levels 1–10, the same job the Frostmere Wilds do for Hoffender. Hares and foxes by the wall, wolves, beetles, spiders, poachers, and bears as the trees thicken. Lark the Poacher is named. The Amber Hart is the rare at the north end. The road north leaves the woods for Valdoria, and that road is not a first walk." },
          { title: "Starter quests", detail: "Sere wants eight weald wolves, then Lark. Halden asks for the Amber Hart in the queen's name. Odda wants boars, then Hask. Osric wants brigands, then Malrek. Each zone on the road has its own work." },
        ]} />
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
        <Text>That table is the old v1 plan. In the game, every class buys later drills from its guild trainer, including Cleric, Enchanter, Paladin, and Magician. The lists run through level 30. Leveling does not grant them. Until the level is reached the line reads Requires level N.</Text>
      </Section>
      <Section heading="Milestone roadmap">
        <Steps steps={[
          { title: "M1 Core feel", detail: "One Hoffender map, movement, NPC talk, one merchant, wolves, auto-attack, loot, coin. Josh judges the feel." },
          { title: "M2 First zone", detail: "Full Hoffender and the Frostmere Wilds, quests, leveling to 10, inventory and equipment, death and corpse runs, local saves." },
          { title: "M3 Second class", detail: "A caster with a spell vendor in its guild, mana and spell casting." },
          { title: "M4 First dungeon", detail: "Done. The Black Ice, three floors past the Fang. Ysolde of the Black Ice is the boss. Kara and Anwen carry the chain." },
          { title: "M5 World growth", detail: "Eldenmoor, the High Elf start, is in, with Thornhaven and Valdoria on the walk south from Hoffender. Still ahead: the other races, the east road to Wyrmrest, the iOS wrap, and co-op with cloud saves." },
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
          "Which race opens after the high elves? Human, Dwarf, Wood Elf, and the rest are still locked. Wyrmrest, east of the Frostmere Wilds, is still a closed road.",
        ]} />
        <Callout lead="Next step">Coding can start M1 now; these answers shape M2.</Callout>
      </Section>
    </Page>
  );
}


</cursor_untrusted_data_1337>