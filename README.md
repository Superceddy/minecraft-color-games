# Minecraft Color Games

A mobile-friendly collection of Minecraft mini-games focused on average block colors.

## Version 0.1.1\n\n- Fixed the Guess the Block start card by wiring it directly to the game-start function, including on mobile browsers.\n- The start action no longer depends solely on a dynamically registered click listener.\n\n## Current prototype

- Main menu with game selection
- **Guess the Block**: five rounds, color picker, RGB sliders and HEX input
- RGB Euclidean color-distance scoring (0–1000 points per round)
- Local top-10 leaderboard stored in the browser
- Responsive layout for phones, tablets and desktop
- Game cards prepared for future color-based mini-games

## Important dataset note

The current `blocks.js` file is a **preview dataset**. Its average colors are provisional estimates and are not yet pixel-calculated from the official Minecraft Java 1.21.1 client textures. The game is playable, but the values must not be presented as authoritative averages yet.

The next data milestone is to generate the full vanilla 1.21.1 block registry and calculate each block's average from its actual model textures. Some blocks need explicit rules (top/side/bottom faces, transparency, animated textures and biome tinting); those rules should be documented in the generated dataset.

## Run locally

Open `index.html` in a browser, or serve this folder with any static web server.

## Deploy

Enable GitHub Pages for the repository and select the `main` branch / root folder.

## Project status

This is an unofficial fan project and is not affiliated with Mojang or Microsoft. Minecraft assets are the property of their respective owners.
