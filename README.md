# Minecraft Color Games

Mobile-friendly collection of Minecraft mini-games for Java Edition 1.21.1.

## Version 0.4.0
- Added **Minecraft Krillion**, a seven-question open-answer mode inspired by rarity-based answer games.
- Curated Minecraft answers earn 10–100 points based on rarity tiers.
- Separate public top-10 leaderboards for Guess the Block and Minecraft Krillion, using the existing Supabase leaderboard table.

## Krillion scoring note
Rarity tiers are curated game-design values, not measured global answer frequencies. Answers outside the current accepted list receive zero points even if they might be valid in Minecraft; the answer pool can be expanded later.

## Current prototype
- **Guess the Block**: five rounds, HEX input and HSB sliders, 0–1000 points per round.
- **Minecraft Krillion**: seven open questions, rarity-tier scoring, 0–700 points total.
- Responsive layout for phones, tablets and desktop.

## Guess the Block dataset note
The current `blocks.js` file is a preview dataset. Its average colors are provisional estimates, not pixel-calculated averages from official Minecraft Java 1.21.1 textures.

## Run locally
Open `index.html` in a browser, or serve this folder with any static web server.

## Deploy
Enable GitHub Pages for the repository and select the `main` branch / root folder.

Unofficial fan project; not affiliated with Mojang or Microsoft. Minecraft assets are the property of their respective owners.
