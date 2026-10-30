<cursor_untrusted_data_1337 source="ReadCanvas">

Canvas "Kingdoms of Aldmoor: Design Doc v0.2" (https://cursor.com/canvas/store-278b96d4-ab73-4cd7-ae3b-7881b0c74aa0/d8d9c134-68fe-4cd8-a44f-86d9bb2e380e):

import { Page, Section, Text, Callout, Table, Properties, Rows, NumberedList, Steps, TableOfContents } from "grok/canvas";

export default function App() {
  return (
    <Page title="Kingdoms of Aldmoor: Design Doc v0.2" summary="Plan for an EverQuest-style, top-down 16-bit RPG set in the world of Aldmoor, played on the iPhone Duo. v1 starts in the Barbarian town of Hoffender. Josh is creative director; Grok Bot and the Coding bot are the dev team." width="column">
      <TableOfContents items={[
        { label: "Vision and pillars" }, { label: "Locked decisions" }, { label: "Lore and world" }, { label: "Platform and engine" },
        { label: "Core systems" }, { label: "Starter zone: Hoffender" }, { label: "Warrior v1 kit" },
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
          { label: "Races", value: "Human, Dwarf, High Elf, Barbarian; each gets its own starting zone later" },
          { label: "v1 starter town", value: "Hoffender, the Barbarian town, ruled by Jarl Freya Halvarddottir" },
          { label: "Frostmere Wilds", value: "The country outside Hoffender's north gate" },
          { label: "First class", value: "Warrior" },
          { label: "Combat", value: "Real-time auto-attack, EverQuest-style" },
          { label: "Art", value: "16-bit SNES-style pixel art" },
          { label: "Level cap", value: "10 for v1; 50 eventually" },
          { label: "Death penalty", value: "Corpse run plus XP loss: none below level 5, 2.5% at levels 5–9, 5% at level 10+" },
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
          ["Leveling", "XP curve per level; cap 10 in v1; class skill caps rise with level"],
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
      </Section>
      <Section heading="Milestone roadmap">
        <Steps steps={[
          { title: "M1 Core feel", detail: "One Hoffender map, movement, NPC talk, one merchant, wolves, auto-attack, loot, coin. Josh judges the feel." },
          { title: "M2 First zone", detail: "Full Hoffender and the Frostmere Wilds, quests, leveling to 10, inventory and equipment, death and corpse runs, local saves." },
          { title: "M3 Second class", detail: "A caster with a spell vendor in its guild, mana and spell casting." },
          { title: "M4 First dungeon", detail: "Multi-level dungeon, a boss, and a quest chain leading to it." },
          { title: "M5 World growth", detail: "Other races' starting zones (Eldenmoor and more), iOS app wrap, co-op with cloud saves." },
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
          "Which class comes second in M3, and should it be one Barbarians can play (like a Shaman)?",
        ]} />
        <Callout lead="Next step">Coding can start M1 now; these answers shape M2.</Callout>
      </Section>
    </Page>
  );
}


</cursor_untrusted_data_1337>