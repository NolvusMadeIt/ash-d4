import { matchBaseType } from "./bases";
import { decodeHtmlEntities } from "./decode";

export type ItemRarity =
  | "Normal"
  | "Magic"
  | "Rare"
  | "Unique"
  | "Currency"
  | "Gem"
  | "Other";

export type ParsedItem = {
  className: string;
  rarity: ItemRarity;
  name: string;
  baseType: string;
  itemLevel: number | null;
  quality: number | null;
  identified: boolean;
  raw: string;
};

const RARITY_MAP: Record<string, ItemRarity> = {
  normal: "Normal",
  magic: "Magic",
  rare: "Rare",
  unique: "Unique",
  currency: "Currency",
  gem: "Gem",
};

export function looksLikeItem(text: string): boolean {
  return /Item Class:/i.test(text) || /Rarity:/i.test(text);
}

function rarityOf(value: string): ItemRarity {
  return RARITY_MAP[value.trim().toLowerCase()] ?? "Other";
}

export function parseItem(text: string): ParsedItem | null {
  const raw = decodeHtmlEntities(text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").trim());
  if (!looksLikeItem(raw)) return null;

  const lines = raw.split("\n").map((l) => l.trim());
  const classLine = lines.find((l) => /^Item Class:/i.test(l));
  const rarityLine = lines.find((l) => /^Rarity:/i.test(l));
  if (!rarityLine) return null;

  const className = classLine
    ? classLine.replace(/^Item Class:\s*/i, "").trim()
    : "Unknown";
  const rarity = rarityOf(rarityLine.replace(/^Rarity:\s*/i, "").trim());

  const rIdx = lines.findIndex((l) => /^Rarity:/i.test(l));
  const nameLines: string[] = [];
  for (let i = rIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line === "--------") break;
    if (/^(unique id:|item level:|quality:|levelreq:|implicits:|sockets?:)/i.test(line))
      break;
    nameLines.push(line);
  }
  if (nameLines.length === 0) return null;

  let name = decodeHtmlEntities(nameLines[0]);
  let baseType = name;

  if (nameLines.length >= 2 && (rarity === "Rare" || rarity === "Unique")) {
    name = decodeHtmlEntities(nameLines[0]);
    baseType = decodeHtmlEntities(nameLines[1]);
  } else {
    baseType = matchBaseType(name) ?? name;
  }

  const fromName = matchBaseType(name);
  if (fromName && fromName.length > baseType.length) baseType = fromName;

  let itemLevel: number | null = null;
  const il = lines.find((l) => /^Item Level:/i.test(l));
  if (il) {
    const n = Number.parseInt(il.replace(/[^\d]/g, ""), 10);
    if (Number.isFinite(n)) itemLevel = n;
  }

  let quality: number | null = null;
  const q = lines.find((l) => /^Quality:/i.test(l));
  if (q) {
    const m = q.match(/(-?\d+)/);
    if (m) quality = Number.parseInt(m[1], 10);
  }

  const identified = !lines.some((l) => /^Unidentified$/i.test(l));

  return {
    className,
    rarity,
    name,
    baseType,
    itemLevel,
    quality,
    identified,
    raw,
  };
}
