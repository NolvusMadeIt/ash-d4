# Ash

Diablo 4 loot filter editor. Same two-panel layout as Lord of Hatred: rules on the left, conditions on the right, then a ground preview so you can see what still drops.

## What it does

- Create filters with up to 25 rules (top rule wins)
- Visibility: Show, Recolor, Hide Text Label, Hide All
- All 10 in-game condition types: item power, rarity, properties (Ancestral / Mythic), Codex upgrade, greater affixes, item type, required / optional affixes, specific uniques, talisman sets
- Import a loot-filter code (the string you paste in-game)
- Export a code to clipboard for **Options → Gameplay → Open Loot Filter → New Filter → Import**
- Ground preview with in-game-style labels and tooltips

## Run

```bash
npm install
npm run dev
```

## In-game

Only one filter is active at a time. After importing a code, enable the filter in Diablo 4 and toggle it from the Game Menu if you pinned the shortcut.

Cull (Path of Exile 2) lives at https://github.com/NolvusMadeIt/cull
