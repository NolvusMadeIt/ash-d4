import { AFFIXES, ALL_ITEM_TYPES, TALISMAN_SETS, UNIQUES, typeLabel } from "./catalog";
import { UNIQUE_LORE } from "./lore";
import { itemIcon } from "./icons";
import { decorateDrop } from "./tooltip";
import type { DropItem, GroundDrop, Rarity } from "./types";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(arr: readonly T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)]!;
}

function pickN<T>(arr: readonly T[], n: number, rand: () => number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length; i++) {
    const j = Math.floor(rand() * copy.length);
    out.push(copy.splice(j, 1)[0]!);
  }
  return out;
}

const PREFIX: Record<Rarity, string[]> = {
  common: ["Worn", "Iron", "Hide", "Crude", "Common"],
  magic: ["Glinting", "Whispering", "Runed", "Gleaming"],
  rare: ["Tempered", "Keen", "Hardened", "Etched"],
  legendary: ["Runic", "Boneweave", "Hellforged", "Grave", "Ashen", "Dread", "Nightwoven"],
  unique: [""],
  mythic: [""],
};

function slotNoun(slot: string) {
  const short: Record<string, string> = {
    axe2h: "Greataxe",
    mace2h: "Warhammer",
    sword2h: "Greatsword",
    scythe2h: "Greatscythe",
  };
  return short[slot] ?? typeLabel(slot);
}

function hashSeed(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function baseItem(slot: string, rarity: Rarity, rand: () => number, i: number): DropItem {
  const noun = slotNoun(slot);
  const prefix = pick(PREFIX[rarity], rand);
  const ancestral = rarity === "legendary" ? rand() > 0.35 : rarity === "unique" || rarity === "mythic";
  const ipBase =
    rarity === "common"
      ? 80 + Math.floor(rand() * 250)
      : rarity === "magic"
        ? 400 + Math.floor(rand() * 250)
        : rarity === "rare"
          ? 650 + Math.floor(rand() * 150)
          : 800 + Math.floor(rand() * 150);
  const ga =
    ancestral && (rarity === "legendary" || rarity === "unique" || rarity === "mythic")
      ? 1 + Math.floor(rand() * 3)
      : 0;
  const affixCount =
    rarity === "common" ? 0 : rarity === "magic" ? 1 : rarity === "rare" ? 3 : 4;
  const name = prefix ? `${prefix} ${noun}` : noun;
  const talisman =
    slot === "charm" || slot === "seal" ? pick(TALISMAN_SETS, rand).id : undefined;
  return {
    id: `drop_${i}_${slot}_${rarity}`,
    name,
    base: noun,
    slot,
    rarity,
    itemPower: ancestral ? Math.max(ipBase, 800) : ipBase,
    ancestral,
    mythic: false,
    greaterAffixes: Math.min(ga, affixCount),
    affixes: pickN(AFFIXES, affixCount, rand).map((a) => a.id),
    codexUpgrade: rarity === "legendary" && rand() > 0.55,
    talismanSet: talisman,
  };
}

function uniqueItem(i: number, rand: () => number): DropItem {
  const pool = UNIQUES.filter((u) => u.slot !== "charm" && u.slot !== "seal");
  const u = pick(pool.length ? pool : UNIQUES, rand);
  const mythic = Boolean(u.mythic);
  const lore = UNIQUE_LORE[u.name];
  const affixes = lore?.affixes ?? pickN(AFFIXES, 4, rand).map((a) => a.id);
  const ga = mythic ? 1 + Math.floor(rand() * 2) : 1 + Math.floor(rand() * 2);
  return {
    id: `drop_${i}_${u.name}`,
    name: u.name,
    base: typeLabel(u.slot),
    slot: u.slot,
    rarity: mythic ? "mythic" : "unique",
    itemPower: 880 + Math.floor(rand() * 80),
    ancestral: true,
    mythic,
    greaterAffixes: Math.min(ga, affixes.length),
    affixes,
    uniqueName: u.name,
    codexUpgrade: !mythic && rand() > 0.7,
  };
}

const RARITY_BAG: Rarity[] = [
  "mythic",
  "unique",
  "unique",
  "legendary",
  "legendary",
  "legendary",
  "legendary",
  "rare",
  "rare",
  "magic",
  "common",
  "legendary",
  "rare",
  "magic",
  "common",
  "unique",
];

function scatter(count: number, rand: () => number) {
  const clusters = 2 + Math.floor(rand() * 3);
  const centers = Array.from({ length: clusters }, () => ({
    x: 10 + rand() * 52,
    y: 14 + rand() * 58,
  }));
  const placed: { x: number; y: number; rot: number }[] = [];
  for (let i = 0; i < count; i++) {
    const c = centers[i % clusters]!;
    let x = 12;
    let y = 20;
    for (let t = 0; t < 28; t++) {
      x = c.x + (rand() - 0.5) * 36;
      y = c.y + (rand() - 0.5) * 30;
      x = Math.min(58, Math.max(3, x));
      y = Math.min(78, Math.max(8, y));
      if (!placed.some((p) => Math.abs(p.x - x) < 20 && Math.abs(p.y - y) < 11)) break;
    }
    placed.push({ x, y, rot: 0 });
  }
  return placed;
}

export function generateGroundDrops(seed: number, count = 14): GroundDrop[] {
  const rand = mulberry32(seed || 1);
  const n = Math.max(8, Math.min(22, count));
  const items: DropItem[] = [];
  const usedUniques = new Set<string>();
  for (let i = 0; i < n; i++) {
    const roll = rand();
    if (roll < 0.22) {
      let u = uniqueItem(i, rand);
      let guard = 0;
      while (usedUniques.has(u.name) && guard++ < 8) u = uniqueItem(i + guard, rand);
      usedUniques.add(u.name);
      items.push(u);
    } else {
      const rarity = pick(RARITY_BAG, rand);
      const slot = pick(ALL_ITEM_TYPES, rand).id;
      if (rarity === "unique" || rarity === "mythic") {
        let u = uniqueItem(i, rand);
        let guard = 0;
        while (usedUniques.has(u.name) && guard++ < 8) u = uniqueItem(i + guard, rand);
        usedUniques.add(u.name);
        items.push(u);
      } else items.push(baseItem(slot, rarity, rand, i));
    }
  }
  const pts = scatter(items.length, rand);
  return items.map((item, i) => {
    const extra = decorateDrop(item, rand);
    return {
      ...extra,
      x: pts[i]!.x,
      y: pts[i]!.y,
      rot: pts[i]!.rot,
      icon: itemIcon(item),
    };
  });
}

export function seedFromFilter(id: string, scatterSeed: number) {
  return (hashSeed(id) ^ (scatterSeed >>> 0)) >>> 0;
}
