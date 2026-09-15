# Cull

Path of Exile 2 loot filter overlay. Start from a NeverSink template, import a Path of Building, then hide or show items by their picture.

## What it does

- Loads NeverSink filter templates (soft through uber-plus-strict)
- Imports `.build` files or Path of Building paste codes
- Shows each piece as its **base type** art (a Bloodstone Amulet looks like a Bloodstone Amulet)
- Writes **global** Hide/Show rules with no AreaLevel, so campaign floors actually go dark
- Filter conditions: armour / evasion / energy shield, affixes, item level, quality
- Alert sounds: game 1–16, NeverSink pack, or your own file
- Hover tooltips styled like the in-game gold-header card
- On launch, checks item data, base art, and templates for updates. Pictures are served through Cull’s own art API — the browser never hotlinks third-party files.

## Stack

TanStack Start, React 19, Tailwind v4, Zustand (localStorage). No account required.

## Run

```bash
npm install
npm run dev
```

Export a `.filter`, drop it in your PoE2 filter folder, and reload the filter in-game.
