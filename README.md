# Minecraft Color Games

Mobile-friendly collection of Minecraft mini-games for Java Edition 1.21.1.

## Version 0.5.0

See [GAME_CONTENT.md](GAME_CONTENT.md) for the complete block list and all 50 Krillion questions with accepted answers and rarity tiers.
- Expanded Guess the Block from 41 to 158 vanilla block textures.
- Added a fallback texture host so a failed image source can retry automatically.
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

## Current prototype
- **Guess the Block**: five rounds, HEX input and HSB sliders, 0–1000 points per round.
- **Minecraft Krillion**: seven questions per round, 20 seconds each, up to 210 points.
- Responsive layout for phones, tablets and desktop.
- Separate public leaderboards for both games, using Supabase.

## Guess the Block dataset note
The block colors are hand-estimated preview values, not pixel-calculated averages from the Minecraft client textures. Texture files are served from a version-pinned public asset mirror.

## Run locally
Open `index.html` in a browser, or serve this folder with any static web server.

## Deploy
Enable GitHub Pages for the repository and select the `main` branch / root folder.

Unofficial fan project; not affiliated with Mojang or Microsoft. Minecraft assets are the property of their respective owners.
