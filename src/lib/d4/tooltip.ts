import { affixLabel, RARITY_LABEL, TALISMAN_SETS, typeLabel } from "./catalog";
import {
  AFFIX_STATS,
  ARMOR_MULT,
  ASPECTS,
  TEMPERS,
  UNIQUE_LORE,
  WEAPON_SPEED,
} from "./lore";
import type { AffixRoll, DropItem, GroundDrop, InherentLine } from "./types";

function fmt(n: number) {
  return Math.round(n).toLocaleString("en-US");
}

function lerp(min: number, max: number, t: number) {
  return min + (max - min) * t;
}

export function typeLine(item: DropItem) {
  const slot = typeLabel(item.slot);
  if (item.rarity === "mythic") return `Mythic Unique ${slot}`;
  if (item.rarity === "unique") {
    return item.ancestral ? `Ancestral Unique ${slot}` : `Unique ${slot}`;
  }
  if (item.rarity === "legendary") {
    return item.ancestral ? `Ancestral Legendary ${slot}` : `Legendary ${slot}`;
  }
  return `${RARITY_LABEL[item.rarity]} ${slot}`;
}

function requiredLevel(ip: number) {
  if (ip >= 900) return 60;
  if (ip >= 800) return 60;
  if (ip >= 700) return 55;
  if (ip >= 500) return 40;
  if (ip >= 300) return 25;
  return Math.max(1, Math.floor(ip / 20));
}

function socketsFor(slot: string, rand: () => number) {
  if (slot === "amulet" || slot === "ring") return rand() > 0.25 ? 1 : 0;
  if (slot === "chest" || slot === "pants" || slot.endsWith("2h") || slot === "polearm" || slot === "staff") {
    return rand() > 0.45 ? 2 : 1;
  }
  if (slot === "sword" || slot === "axe" || slot === "mace" || slot === "dagger" || slot === "wand" || slot === "glaive" || slot === "scythe" || slot === "bow" || slot === "crossbow" || slot === "quarterstaff") {
    return 1;
  }
  if (slot === "shield") return 1;
  return rand() > 0.7 ? 1 : 0;
}

function inherentsFor(item: DropItem, rand: () => number): InherentLine[] {
  const lore = item.uniqueName ? UNIQUE_LORE[item.uniqueName] : undefined;
  const lines: InherentLine[] = [];
  const ip = item.itemPower;
  const armorMult = ARMOR_MULT[item.slot];
  if (armorMult) {
    const armor = Math.round(ip * armorMult * (0.96 + rand() * 0.08));
    lines.push({ text: `${fmt(armor)} Armor` });
  }
  const wep = WEAPON_SPEED[item.slot];
  if (wep) {
    const hitMax = Math.round(ip * wep.dps * (0.97 + rand() * 0.06));
    const hitMin = Math.round(hitMax * 0.69);
    const dps = Math.round(((hitMin + hitMax) / 2) * wep.aps);
    lines.push({ text: `${fmt(dps)} Damage Per Second` });
    lines.push({ text: `[${fmt(hitMin)} - ${fmt(hitMax)}] Damage per Hit`, indent: true });
    lines.push({ text: `${wep.aps.toFixed(2)} Attacks per Second (${wep.tag})`, indent: true });
  }
  if (item.slot === "amulet") {
    const resist = Math.round(40 + ip * 0.12);
    lines.push({ text: `${fmt(resist)} Resistance to All Elements` });
  }
  if (item.slot === "shield") {
    lines.push({ text: "20.0% Block Chance" });
    lines.push({ text: "+100% Main Hand Weapon Damage" });
  }
  if (item.slot === "charm" || item.slot === "seal") {
    lines.push({ text: "Can be inserted into Jewelry with sockets." });
  }
  if (lore?.inherent) lines.unshift({ text: lore.inherent });
  return lines;
}

function formatRoll(id: string, value: number, min: number, max: number) {
  const label = affixLabel(id);
  const stat = AFFIX_STATS[id] ?? { kind: "flat" as const, min, max };
  if (stat.kind === "percent") return `+${value.toFixed(1)}% ${label}`;
  if (stat.kind === "ranks") return `+${Math.round(value)} to Core Skills`;
  return `+${fmt(value)} ${label} [${fmt(min)} - ${fmt(max)}]`;
}

function rollOne(id: string, ip: number, greater: boolean, rand: () => number, mythic: boolean): AffixRoll {
  const stat = AFFIX_STATS[id] ?? { kind: "flat" as const, min: 10, max: 40 };
  const scale = Math.max(0.55, ip / 800);
  let min = stat.min * scale;
  let max = stat.max * scale;
  if (mythic) {
    min *= 1.15;
    max *= 1.15;
  }
  if (greater) {
    min = max;
    max = max * 1.5;
  }
  const t = greater ? 0.85 + rand() * 0.15 : 0.45 + rand() * 0.55;
  const value = lerp(min, max, t);
  return {
    id,
    greater,
    text: formatRoll(id, value, min, max),
  };
}

function rollAffixes(item: DropItem, rand: () => number): AffixRoll[] {
  const lore = item.uniqueName ? UNIQUE_LORE[item.uniqueName] : undefined;
  const ids = lore?.affixes ?? item.affixes;
  const ga = Math.min(item.greaterAffixes, ids.length);
  const marked = new Set<number>();
  while (marked.size < ga && ids.length) {
    marked.add(Math.floor(rand() * ids.length));
    if (marked.size >= ids.length) break;
  }
  return ids.map((id, i) => rollOne(id, item.itemPower, marked.has(i), rand, item.mythic));
}

function rollTempers(item: DropItem, rand: () => number): AffixRoll[] {
  if (item.rarity !== "legendary" && item.rarity !== "rare") return [];
  if (item.slot === "charm" || item.slot === "seal") return [];
  const n = item.rarity === "legendary" ? 2 : rand() > 0.4 ? 2 : 1;
  const used = new Set<number>();
  const out: AffixRoll[] = [];
  for (let i = 0; i < n; i++) {
    let idx = Math.floor(rand() * TEMPERS.length);
    let guard = 0;
    while (used.has(idx) && guard++ < 8) idx = Math.floor(rand() * TEMPERS.length);
    used.add(idx);
    const t = TEMPERS[idx]!;
    const val = (8 + rand() * 16).toFixed(1);
    out.push({ id: t.id, text: t.text(val), greater: false });
  }
  return out;
}

function powerFor(item: DropItem, rand: () => number) {
  if (item.uniqueName) return UNIQUE_LORE[item.uniqueName]?.power;
  if (item.rarity === "legendary") return ASPECTS[Math.floor(rand() * ASPECTS.length)];
  if (item.slot === "charm" || item.slot === "seal") {
    const set = TALISMAN_SETS.find((s) => s.id === item.talismanSet);
    if (set) return `${set.label}: You gain 15%[x] increased damage while the set is complete.`;
  }
  return undefined;
}

function flavorFor(item: DropItem) {
  if (item.uniqueName) return UNIQUE_LORE[item.uniqueName]?.flavor;
  return undefined;
}

export function decorateDrop(item: DropItem, rand: () => number): Omit<GroundDrop, "x" | "y" | "rot" | "icon"> {
  const lore = item.uniqueName ? UNIQUE_LORE[item.uniqueName] : undefined;
  const affixIds = lore?.affixes ?? item.affixes;
  const decorated = { ...item, affixes: affixIds };
  return {
    ...decorated,
    typeLine: typeLine(decorated),
    inherents: inherentsFor(decorated, rand),
    affixRolls: rollAffixes(decorated, rand),
    tempers: rollTempers(decorated, rand),
    power: powerFor(decorated, rand),
    flavor: flavorFor(decorated),
    requiredLevel: requiredLevel(item.itemPower),
    sockets: socketsFor(item.slot, rand),
  };
}

export const KEYWORD_RE =
  /(Vulnerable|Unstoppable|Stealth|Freeze|Frozen|Chilled|Fear|Stunned|Immobilize|Barrier|Overpower|Berserking|Healthy|Injured|Crowd Controlled|Elite|Lucky Hit|Critical Strike|Core Skills?|Basic Skills?|Defensive Skills?|Mother's Favor|Holy|Poison|Shadow|Fire|Cold|Lightning|Werewolf|Werebear|Bone Storm|Teleport|Evade|Marksman|Cutthroat|Storm Strike|Storm Skills?|Claw|Shred|Ambush)/g;
