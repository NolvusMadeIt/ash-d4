import { decodeHtmlEntities } from "./decode";
import type { ItemRarity, ParsedItem } from "./parse-item";

export type ItemTip = {
  title: string;
  rarity: ItemRarity;
  className: string;
  baseType: string | null;
  identified: boolean;
  properties: { label: string; value: string }[];
  requires: string | null;
  enchants: string[];
  implicits: string[];
  explicits: string[];
  crafted: string[];
  unidentified: boolean;
  corrupted: boolean;
};

const SKIP_META =
  /^(unique id:|implicits:\s*\d|prefixes:\s*\d|suffixes:\s*\d|catalyst:|talisman tier:|armourbasepercentile|evasionbasepercentile|energyshieldbasepercentile|crafted:|fractured:|radius:)/i;

const PROPERTY =
  /^(quality|armour|armor|evasion(?: rating)?|energy shield|ward|spirit|physical damage|elemental damage|chaos damage|critical(?: hit)? chance|attacks per second|reload time|weapon range|block(?: chance)?|chance to block|stack size|consumes|recovers|recovers .+|duration|sockets?|charges|currently has)\b/i;

function rollRange(text: string, t: number): string {
  return text.replace(/\((\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)\)/g, (_, a, b) => {
    const lo = Number(a);
    const hi = Number(b);
    const v = lo + (hi - lo) * t;
    if (Number.isInteger(lo) && Number.isInteger(hi)) return String(Math.round(v));
    return String(Math.round(v * 10) / 10);
  });
}

function cleanMod(line: string): { text: string; tags: Set<string> } {
  const tags = new Set<string>();
  let t: number | null = null;
  let s = line;
  s = s.replace(/\{range:([0-9.]+)\}/gi, (_, n) => {
    t = Number(n);
    return "";
  });
  s = s.replace(/\{enchant\}/gi, () => {
    tags.add("enchant");
    return "";
  });
  s = s.replace(/\{crafted\}/gi, () => {
    tags.add("crafted");
    return "";
  });
  s = s.replace(/\{fractured\}/gi, () => {
    tags.add("fractured");
    return "";
  });
  s = s.replace(/\{corrupted\}/gi, () => {
    tags.add("corrupted");
    return "";
  });
  s = s.replace(/\{variant:[^}]*\}/gi, "");
  s = s.replace(/\{custom\}/gi, "");
  s = s.replace(/<ModRange\b[^>]*\/?\s*>/gi, "");
  s = s.replace(/<[^>]+>/g, "");
  s = s.trim();
  if (t != null && Number.isFinite(t)) s = rollRange(s, t);
  return { text: s, tags };
}

function splitProperty(line: string): { label: string; value: string } | null {
  const cut = line.indexOf(":");
  if (cut < 1) return null;
  const label = line.slice(0, cut).trim();
  const value = line.slice(cut + 1).replace(/\s*\(augmented\)\s*/gi, "").trim();
  if (!label || !value) return null;
  return { label, value };
}

function formatRequires(parts: {
  level?: string;
  str?: string;
  dex?: string;
  int?: string;
}): string | null {
  const bits: string[] = [];
  if (parts.level) bits.push(`Level ${parts.level}`);
  if (parts.str) bits.push(`${parts.str} Str`);
  if (parts.dex) bits.push(`${parts.dex} Dex`);
  if (parts.int) bits.push(`${parts.int} Int`);
  return bits.length ? `Requires: ${bits.join(", ")}` : null;
}

export function parseItemTip(item: ParsedItem): ItemTip {
  const raw = decodeHtmlEntities(item.raw.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n"));
  const lines = raw.split("\n").map((l) => l.trim());

  const properties: { label: string; value: string }[] = [];
  const req: { level?: string; str?: string; dex?: string; int?: string } = {};
  const enchants: string[] = [];
  const implicits: string[] = [];
  const explicits: string[] = [];
  const crafted: string[] = [];
  let implicitBudget = 0;
  let implicitCountKnown = false;
  let inRequirements = false;
  let unidentified = !item.identified;
  let corrupted = false;

  const title = decodeHtmlEntities(item.name);
  const baseType =
    item.baseType && item.baseType !== item.name ? item.baseType : null;

  for (const line of lines) {
    if (!line || line === "--------") {
      inRequirements = false;
      continue;
    }
    if (/^(item class:|rarity:)/i.test(line)) continue;
    if (line === title || (baseType && line === baseType)) continue;
    if (/^<ModRange\b/i.test(line) || /^<\//.test(line)) continue;
    if (SKIP_META.test(line)) {
      const imp = /^Implicits:\s*(\d+)/i.exec(line);
      if (imp) {
        implicitBudget = Number(imp[1]);
        implicitCountKnown = true;
      }
      continue;
    }
    if (/^Unique ID:/i.test(line)) continue;
    if (/^[0-9a-f]{20,}$/i.test(line)) continue;
    if (/^Item Level:/i.test(line)) continue;
    if (/^LevelReq:\s*(\d+)/i.test(line)) {
      req.level = /^LevelReq:\s*(\d+)/i.exec(line)?.[1];
      continue;
    }
    if (/^Unidentified$/i.test(line)) {
      unidentified = true;
      continue;
    }
    if (/^Corrupted$/i.test(line)) {
      corrupted = true;
      continue;
    }
    if (/^Requirements:$/i.test(line)) {
      inRequirements = true;
      continue;
    }
    if (inRequirements || /^(level|str|dex|int):/i.test(line)) {
      const lv = /^Level:\s*(\d+)/i.exec(line);
      const str = /^Str:\s*(\d+)/i.exec(line);
      const dex = /^Dex:\s*(\d+)/i.exec(line);
      const intel = /^Int:\s*(\d+)/i.exec(line);
      if (lv) req.level = lv[1];
      if (str) req.str = str[1];
      if (dex) req.dex = dex[1];
      if (intel) req.int = intel[1];
      if (lv || str || dex || intel) continue;
    }

    if (/^Quality:\s*0%?\s*$/i.test(line)) continue;
    if (/^(recovers|consumes|currently has)\b/i.test(line) && !line.includes(":")) {
      properties.push({ label: line, value: "" });
      continue;
    }
    if (PROPERTY.test(line)) {
      const prop = splitProperty(line);
      if (prop) {
        if (/^quality$/i.test(prop.label) && /^0%?$/.test(prop.value)) continue;
        properties.push(prop);
        continue;
      }
    }

    const { text, tags } = cleanMod(line);
    if (!text) continue;
    if (tags.has("enchant")) {
      enchants.push(text);
      if (implicitCountKnown && implicitBudget > 0) implicitBudget -= 1;
      continue;
    }
    if (tags.has("crafted")) {
      crafted.push(text);
      continue;
    }
    if (implicitCountKnown && implicitBudget > 0) {
      implicits.push(text);
      implicitBudget -= 1;
      continue;
    }
    explicits.push(text);
  }

  return {
    title,
    rarity: item.rarity,
    className: item.className,
    baseType,
    identified: !unidentified,
    properties,
    requires: formatRequires(req),
    enchants,
    implicits,
    explicits,
    crafted,
    unidentified,
    corrupted,
  };
}

export function rarityTone(rarity: ItemRarity): string {
  if (rarity === "Unique") return "text-rarity-unique";
  if (rarity === "Rare") return "text-rarity-rare";
  if (rarity === "Magic") return "text-rarity-magic";
  if (rarity === "Currency") return "text-rarity-currency";
  if (rarity === "Gem") return "text-rarity-gem";
  return "text-rarity-normal";
}

export function rarityHeader(rarity: ItemRarity): string {
  if (rarity === "Unique") return "border-rarity-unique text-rarity-unique";
  if (rarity === "Rare") return "border-rarity-rare text-rarity-rare";
  if (rarity === "Magic") return "border-rarity-magic text-rarity-magic";
  if (rarity === "Currency") return "border-rarity-currency text-rarity-currency";
  if (rarity === "Gem") return "border-rarity-gem text-rarity-gem";
  return "border-tip-frame text-tip-normal";
}

export function itemDisplayName(item: ParsedItem): { title: string; subtitle: string | null } {
  const title = decodeHtmlEntities(item.name);
  const base = decodeHtmlEntities(item.baseType);
  const subtitle = base && base !== title ? base : null;
  return { title, subtitle };
}

/** @deprecated kept for any leftover callers */
export function itemStatBlocks(raw: string): string[][] {
  const tipish = decodeHtmlEntities(raw);
  return tipish
    .split(/\n-{3,}\n/)
    .map((block) =>
      block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    )
    .filter((block) => block.length > 0);
}
