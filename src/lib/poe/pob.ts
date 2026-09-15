import { inflateSync, unzlibSync } from "fflate";
import { matchBaseType } from "./bases";
import { ddsToUrl, lookupBaseDds, type BaseIconMap } from "./base-icons";
import { classFromBase, lookupUnique, type ScoutItem } from "./catalog";
import { decodeHtmlEntities } from "./decode";
import { parseItem, type ParsedItem } from "./parse-item";

export type BuildPiece = {
  id: string;
  slot: string;
  kind: "unique" | "rare" | "magic" | "normal" | "gem" | "currency" | "other";
  item: ParsedItem;
  icon?: string;
  price?: number;
};

function decodeBase64Url(code: string): Uint8Array {
  let s = code.trim().replace(/\s+/g, "");
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

function inflatePob(code: string): string {
  const bin = decodeBase64Url(code);
  const attempts: Array<() => Uint8Array> = [
    () => inflateSync(bin),
    () => unzlibSync(bin),
    () => inflateSync(bin.subarray(2)),
    () => unzlibSync(bin.subarray(2)),
  ];
  for (const fn of attempts) {
    try {
      const text = new TextDecoder().decode(fn());
      if (text.includes("<") || /Rarity:/i.test(text) || /Item Class:/i.test(text)) {
        return text;
      }
    } catch {
      /* try next decoder */
    }
  }
  throw new Error("Could not decode that Path of Building code.");
}

function kindOf(rarity: string): BuildPiece["kind"] {
  const r = rarity.toLowerCase();
  if (r === "unique") return "unique";
  if (r === "rare") return "rare";
  if (r === "magic") return "magic";
  if (r === "normal") return "normal";
  if (r === "gem") return "gem";
  if (r === "currency") return "currency";
  return "other";
}

function parseLooseItem(text: string): ParsedItem | null {
  const cleaned = decodeHtmlEntities(text);
  const withClass = /Item Class:/i.test(cleaned)
    ? cleaned
    : `Item Class: Unknown\n${cleaned}`;
  return parseItem(withClass);
}

function piecesFromItemText(raw: string, slot: string, i: number): BuildPiece | null {
  const item = parseLooseItem(raw);
  if (!item) return null;
  return {
    id: `p_${i}_${item.baseType}`,
    slot,
    kind: kindOf(item.rarity),
    item,
  };
}

export function extractFromPobXml(xml: string): BuildPiece[] {
  const pieces: BuildPiece[] = [];
  let i = 0;
  const itemTags = xml.matchAll(/<Item\b[^>]*>([\s\S]*?)<\/Item>/gi);

  for (const m of itemTags) {
    const slot =
      /(?:specSlot|slot|id)="([^"]+)"/i.exec(m[0])?.[1] ??
      /id="([^"]+)"/i.exec(m[0])?.[1] ??
      "Item";
    const p = piecesFromItemText(m[1], decodeHtmlEntities(slot), i++);
    if (p) pieces.push(p);
  }

  const gemTags = xml.matchAll(/<Gem\b[^>]*>/gi);

  for (const m of gemTags) {
    const name =
      /(?:nameSpec|nameId|skillId|name)="([^"]+)"/i.exec(m[0])?.[1] ?? "";
    if (!name) continue;
    const pretty = decodeHtmlEntities(name.replace(/_/g, " "));
    const raw = `Item Class: Gems\nRarity: Gem\n${pretty}\n--------\nItem Level: 1`;
    const p = piecesFromItemText(raw, "Gem", i++);
    if (p) pieces.push(p);
  }
  return dedupe(pieces);
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function collectJsonItems(node: unknown, into: unknown[]) {
  if (Array.isArray(node)) {
    for (const x of node) collectJsonItems(x, into);
    return;
  }
  const o = asRecord(node);
  if (!o) return;
  if (typeof o.raw === "string" || typeof o.text === "string" || o.name || o.baseType) {
    into.push(o);
  }
  for (const v of Object.values(o)) {
    if (v && typeof v === "object") collectJsonItems(v, into);
  }
}

export function extractFromBuildJson(json: unknown): BuildPiece[] {
  const pieces: BuildPiece[] = [];
  const found: unknown[] = [];
  collectJsonItems(json, found);
  let i = 0;
  for (const row of found) {
    const o = asRecord(row);
    if (!o) continue;
    const raw =
      (typeof o.raw === "string" && o.raw) ||
      (typeof o.text === "string" && o.text) ||
      null;
    if (raw && /Rarity:/i.test(raw)) {
      const p = piecesFromItemText(raw, String(o.slot ?? o.inventoryId ?? "Item"), i++);
      if (p) pieces.push(p);
      continue;
    }
    const name = decodeHtmlEntities(String(o.name ?? o.itemName ?? ""));
    const base = decodeHtmlEntities(String(o.baseType ?? o.base ?? name));
    const rarity = String(o.rarity ?? o.itemRarity ?? "Rare");
    const className = String(o.class ?? o.itemClass ?? "Unknown");
    if (!name && !base) continue;
    const dump = `Item Class: ${className}\nRarity: ${rarity}\n${name}\n${base === name ? "" : base}\n--------\nItem Level: 1`;
    const p = piecesFromItemText(dump, String(o.slot ?? "Item"), i++);
    if (p) pieces.push(p);
  }
  return dedupe(pieces);
}

function dedupe(pieces: BuildPiece[]) {
  const seen = new Set<string>();
  return pieces.filter((p) => {
    const k = `${p.item.baseType}|${p.item.name}|${p.kind}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function resolveBase(name: string, given: string, uniqueBase?: string, className?: string) {
  const fromName = matchBaseType(name);
  const fromGiven = matchBaseType(given);
  if (uniqueBase && (given === name || className === "Unknown")) return uniqueBase;
  if (fromName && fromName.length >= (fromGiven?.length ?? 0)) return fromName;
  return fromGiven ?? uniqueBase ?? given;
}

export function enrichPieces(
  pieces: BuildPiece[],
  catalog: Map<string, ScoutItem>,
  bases: BaseIconMap,
): BuildPiece[] {
  return pieces.map((p) => {
    const name = decodeHtmlEntities(p.item.name);
    const givenBase = decodeHtmlEntities(p.item.baseType);
    const unique = lookupUnique(name, catalog);
    const baseType = resolveBase(name, givenBase, unique?.base, p.item.className);
    const className =
      p.item.className !== "Unknown"
        ? p.item.className
        : classFromBase(baseType || givenBase, unique?.category);
    const dds =
      lookupBaseDds(name, bases) ??
      lookupBaseDds(baseType, bases) ??
      lookupBaseDds(givenBase, bases);
    return {
      ...p,
      icon: dds ? ddsToUrl(dds) : undefined,
      price: unique?.price,
      item: {
        ...p.item,
        name,
        className,
        baseType,
        raw: decodeHtmlEntities(p.item.raw),
        rarity:
          p.kind === "unique" || p.item.rarity === "Unique" ? "Unique" : p.item.rarity,
      },
    };
  });
}

export async function parseBuildSource(input: string): Promise<BuildPiece[]> {
  const trimmed = input.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return extractFromBuildJson(JSON.parse(trimmed) as unknown);
  }
  if (
    trimmed.startsWith("<") ||
    trimmed.includes("<PathOfBuilding") ||
    trimmed.includes("<Item")
  ) {
    return extractFromPobXml(trimmed);
  }
  const xml = inflatePob(trimmed);
  return extractFromPobXml(xml);
}
