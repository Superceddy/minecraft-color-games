# Minecraft Color Games

Mobile-friendly collection of Minecraft mini-games for Minecraft Java Edition 26.3.

## Version 0.7.0

See [GAME_CONTENT.md](GAME_CONTENT.md) for the complete block list and all 50 Krillion questions with accepted answers and rarity tiers.
- Expanded Guess the Block to the complete 26.3 vanilla block registry (1,286 block types; individual blockstates are not separate entries).
- Added Colorle: guess a vanilla block from its average texture color in six tries.
- Removed Minecraft Krillion.
- Added sharp pixel-perfect texture scaling and corrected dynamic saturation/brightness slider gradients.
- Expanded Minecraft Krillion to 50 question prompts; each round randomly selects seven.
- Added a 20-second countdown, typo/abbreviation-tolerant answer matching, and six visible rarity tiers.
- Removed answer spoilers after rejected or timed-out answers.
- Added a Minecraft-inspired grass, dirt, stone and bedrock visual theme.

## Minecraft Krillion scoring
Each answer is worth 5–30 points:
- Basic: 5–7
- Uncommon: 8–11
- Rare: 12–15
- Legendary: 16–19
- Mythic: 20–25
- One in a Minellion: 30

The rarity values are curated game-design values, not live player-frequency measurements. The matcher accepts German/English aliases, common abbreviations and small spelling mistakes. Not every possible wording can be guaranteed, so the accepted answer pool can continue to grow.

## Vanilla data source
- Minecraft Java Edition 26.3 (latest stable release at the time of this update).
- 1,286 registered vanilla block types; technical blocks are part of the registry too.
- The 26.3 registry and English language file are fetched from the version-pinned mc26-data branch. If that source is unavailable, the previous local block list remains as a fallback.

## Current prototype
- **Guess the Block**: five rounds, HEX input and HSB sliders, 0–1000 points per round.
- **Minecraft Krillion**: seven questions per round, 20 seconds each, up to 210 points.
- Responsive layout for phones, tablets and desktop.
- Separate public leaderboards for both games, using Supabase.

## Guess the Block dataset note
The complete block registry and English names are loaded from the Minecraft Java 26.3 data extraction at [mj41/mc26-data](https://github.com/mj41/mc26-data/tree/mc-26.3). The game measures the average color of the loaded flat texture in the browser when possible. A few blocks without a directly matching texture use a fallback color or texture candidate. The dataset includes block types, not every orientation or other blockstate.

## Run locally
Open `index.html` in a browser, or serve this folder with any static web server.

## Deploy
Enable GitHub Pages for the repository and select the `main` branch / root folder.

Unofficial fan project; not affiliated with Mojang or Microsoft. Minecraft assets are the property of their respective owners.
