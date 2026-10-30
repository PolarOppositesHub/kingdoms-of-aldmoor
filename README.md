# Kingdoms of Aldmoor

A top-down 16-bit RPG set in Aldmoor, built first as a web game you can install on an iPhone home screen. Milestone 1 is the core feel of Hoffender, the barbarian starter town: walk, talk, trade, and fight wolves.

The design doc in `docs/design-doc-v0.2.md` is the source of truth. This milestone is the first playable slice, not the whole v1 zone.

## Play it

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173) and use a phone-sized window, or the device toolbar in the browser.

Production build:

```bash
npm run build
npm run preview
```

### iPhone home screen

1. Open the site in Safari.
2. Share → Add to Home Screen.
3. Launch Aldmoor from the icon. It runs standalone, portrait or landscape.

After this branch is merged, GitHub Pages can host a test build. The workflow is `.github/workflows/pages.yml`. In the repo settings, set Pages → Build and deployment → **GitHub Actions** once. The test URL will be:

https://polaroppositeshub.github.io/kingdoms-of-aldmoor/

Pages is not enabled on the repo yet.

## What M1 includes

One map: Hoffender, a snowy fjord hold, and the Frostmere Wilds outside its north gate. The town's look is still provisional (see open questions). Who rules it is not: Jarl Freya Halvarddottir.

- Touch movement: virtual pad, tap or drag the ground, and WASD or arrows on a keyboard.
- Tap a person to walk up and talk. Jarl Freya Halvarddottir stands outside the mead hall. Soren keeps the gate and answers to her word. Hilda runs the Frosthearth Inn, Torvald has a word about the north, and Brenna buys and sells.
- The place name follows you. Inside the palisade it reads Hoffender. Step through the gate and it reads Frostmere Wilds. Those names are also painted on the map.
- One merchant. Sell pelts and teeth. Buy bandages, trail rations, and a faster handaxe, then equip it from the pack.
- Young wolves on the Frostmere Wilds road, wolves in the pines, and frost wolves farther north. Wolves assist nearby kin. The palisade is safe; they will not chase you inside.
- Character creation at the gate. The roster lists every planned race and class. Only Barbarian, Warrior, and Wizard can be chosen. Six bonus points go into the stats. The choice is remembered on this device.
- Warrior combat: real-time auto-attack on a weapon delay, plus Kick on a cooldown. Tap a wolf, then ATK.
- Wizard combat: a mana bar, Shardbolt at range, and Rimefield, which slows every wolf near your target. The staff still swings if a wolf gets close.
- Pinch the map, or use the mouse wheel, to zoom. The Pad button swaps the stick for a D-pad. Look talks to someone or reads a sign.
- Eirik Stonehand at the warrior guild will trade four wolf pelts for coin, a little experience, and a wolf helm you can see on your head.
- Loot and coin. Copper, silver, gold, and platinum, at 10 to 1. Drops land on the snow and are picked up when you step close.
- If you fall, you wake in the inn yard. Experience loss follows the locked table (none below level 5). Gear stays with you. A corpse you have to run back to is Milestone 2.
- Layout refits when the window changes: a tall phone keeps the controls under the map; a wide or near-square window puts them in side panels.

## Controls

| Action | Touch | Keyboard |
| --- | --- | --- |
| Move | Pad, or tap/drag the ground | WASD or arrows |
| Target | Tap a creature, or Next | Tab |
| Auto-attack | ATK | F |
| First ability | Kick, or Shard | 1 |
| Second ability | Rime, for a wizard | 2 |
| Look | Look, a person, or a sign | E |
| Zoom | Pinch the map | Mouse wheel |
| Pack | Pack | I |
| Use a ration | The food button | — |
| Close a panel | Close | Esc |

## Checks

```bash
npm test
npm run build
```

`npm test` runs the simulation: movement, combat, trade, social wolves, and the Hoffender map load. The renderer is not imported there. Rules advance on a fixed tick with a seeded RNG, and every change a player makes is an intent (`move`, `attack`, `buy`, …). That is the seam a later co-op server can sit on. Content lives in `src/content/*.json`. The map is Tiled JSON at `src/assets/hoffender.tmj`.

`node tools/build-art.mjs` redraws the original tiles, sprites, and map. `node tools/feel-check.mjs` (with `npm run preview` already running) walks the phone-sized loop in a browser.

## Art and licenses

Every sprite, tile, line of dialogue, and sound in the game is original. Sounds are synthesized in the browser. No font files are bundled. Third-party code and the art credit are listed in `CREDITS.md`. Nothing here is taken from EverQuest or any other game.

## Not in this milestone

The full equipment paper-doll, corpse runs, a broader inventory, leveling to 10 as a designed climb, the grayed-out races and classes, other zones, and co-op. One pelt quest is in this slice. A refresh keeps the hero you created.

## Open questions for Josh

These do not block M1. The build uses a provisional answer so there is something to feel.

1. Hoffender's look. This build is a snowy fjord village: log houses, a palisade, and ice along the east shore. The other options were a mountain longhouse hold or a frozen coastal port.
2. The camp boss, for a later milestone: bandit chief, alpha frost wolf, or something else.
3. Which of the grayed-out races and classes should open next. A barbarian can already be a wizard. Warden is the beast-pet class, still unbuilt.
4. Coin is 10 copper = 1 silver, 10 silver = 1 gold, 10 gold = 1 platinum. Say if that rate should change.

Settled for this slice: the wilds outside the gate are the Frostmere Wilds. Jarl Freya Halvarddottir rules Hoffender from the mead hall. The town guards answer to her word. She cares more about trade and alliances than war.
