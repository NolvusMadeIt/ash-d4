import type { Condition, FilterRule, LootFilter, Rarity, Visibility } from "./types";
import { newId } from "./catalog";

const RARITY_BIT: Record<Rarity, number> = {
  common: 1,
  magic: 2,
  rare: 4,
  legendary: 8,
  unique: 16,
  mythic: 32,
};

const KIND_TO_TYPE: Record<Condition["kind"], number> = {
  itemPower: 0,
  rarity: 1,
  properties: 2,
  codex: 3,
  greaterAffix: 4,
  itemType: 5,
  requiredAffixes: 6,
  optionalAffixes: 7,
  unique: 8,
  talismanSet: 9,
};

const TYPE_TO_KIND = Object.fromEntries(
  Object.entries(KIND_TO_TYPE).map(([k, v]) => [v, k]),
) as Record<number, Condition["kind"]>;

const VIS_TO_NUM: Record<Visibility, number> = {
  show: 0,
  hideLabel: 1,
  recolor: 2,
  hideAll: 3,
};

const NUM_TO_VIS: Record<number, Visibility> = {
  0: "show",
  1: "hideLabel",
  2: "recolor",
  3: "hideAll",
};

function encodeVarint(n: number, out: number[]) {
  let v = n >>> 0;
  while (v > 0x7f) {
    out.push((v & 0x7f) | 0x80);
    v >>>= 7;
  }
  out.push(v);
}

function encodeKey(field: number, wire: number, out: number[]) {
  encodeVarint((field << 3) | wire, out);
}

function encodeString(field: number, s: string, out: number[]) {
  const bytes = Array.from(new TextEncoder().encode(s));
  encodeKey(field, 2, out);
  encodeVarint(bytes.length, out);
  out.push(...bytes);
}

function encodeVarintField(field: number, n: number, out: number[]) {
  encodeKey(field, 0, out);
  encodeVarint(n, out);
}

function encodeFixed32(field: number, n: number, out: number[]) {
  encodeKey(field, 5, out);
  out.push(n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255);
}

function encodeMsg(field: number, bytes: number[], out: number[]) {
  encodeKey(field, 2, out);
  encodeVarint(bytes.length, out);
  out.push(...bytes);
}

function colorToU32(hex: string) {
  const h = hex.replace("#", "");
  const r = Number.parseInt(h.slice(0, 2), 16) || 0;
  const g = Number.parseInt(h.slice(2, 4), 16) || 0;
  const b = Number.parseInt(h.slice(4, 6), 16) || 0;
  return (0xff << 24) | (b << 16) | (g << 8) | r;
}

function u32ToColor(n: number) {
  const r = n & 255;
  const g = (n >>> 8) & 255;
  const b = (n >>> 16) & 255;
  const h = (v: number) => v.toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

function fnv(s: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function encodeCondition(c: Condition): number[] {
  const out: number[] = [];
  encodeVarintField(1, KIND_TO_TYPE[c.kind], out);
  if (c.kind === "rarity") {
    const mask = c.rarities.reduce((m, r) => m | RARITY_BIT[r], 0);
    encodeVarintField(4, mask, out);
  } else if (c.kind === "properties") {
    let mask = 0;
    if (c.ancestral) mask |= 4;
    if (c.mythic) mask |= 32;
    encodeVarintField(4, mask, out);
  } else if (c.kind === "codex") {
    encodeVarintField(6, c.enabled ? 1 : 0, out);
  } else if (c.kind === "greaterAffix") {
    encodeVarintField(4, c.atLeast, out);
    encodeVarintField(6, c.compare === "fewerThan" ? 1 : 0, out);
  } else if (c.kind === "itemPower") {
    encodeVarintField(5, c.max, out);
    encodeVarintField(6, c.min, out);
  } else if (c.kind === "itemType") {
    for (const t of c.types) encodeFixed32(2, fnv(t), out);
  } else if (c.kind === "requiredAffixes" || c.kind === "optionalAffixes") {
    for (const a of c.affixes) encodeFixed32(2, fnv(a), out);
    encodeVarintField(4, c.atLeast, out);
  } else if (c.kind === "unique") {
    for (const n of c.names) encodeFixed32(2, fnv(n), out);
  } else if (c.kind === "talismanSet") {
    for (const s of c.sets) encodeFixed32(2, fnv(s), out);
  }
  return out;
}

function encodeRule(rule: FilterRule): number[] {
  const out: number[] = [];
  encodeString(1, rule.name, out);
  encodeVarintField(2, VIS_TO_NUM[rule.visibility], out);
  encodeFixed32(3, colorToU32(rule.color), out);
  for (const c of rule.conditions) encodeMsg(4, encodeCondition(c), out);
  encodeVarintField(5, rule.enabled ? 1 : 0, out);
  return out;
}

export function encodeFilter(filter: LootFilter): string {
  const out: number[] = [];
  for (const r of filter.rules) encodeMsg(1, encodeRule(r), out);
  encodeString(2, filter.name, out);
  encodeVarintField(3, filter.rules.length, out);
  encodeVarintField(4, 1, out);
  const bytes = new Uint8Array(out);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/=+$/, "");
}

class Reader {
  constructor(
    private data: Uint8Array,
    private i = 0,
  ) {}
  get pos() {
    return this.i;
  }
  get remaining() {
    return this.data.length - this.i;
  }
  varint() {
    let v = 0;
    let shift = 0;
    while (this.i < this.data.length) {
      const b = this.data[this.i++]!;
      v |= (b & 0x7f) << shift;
      if (b < 0x80) return v >>> 0;
      shift += 7;
    }
    return v >>> 0;
  }
  bytes(n: number) {
    const slice = this.data.subarray(this.i, this.i + n);
    this.i += n;
    return slice;
  }
  skip(wire: number) {
    if (wire === 0) this.varint();
    else if (wire === 1) this.i += 8;
    else if (wire === 2) this.bytes(this.varint());
    else if (wire === 5) this.i += 4;
  }
}

function readFields(data: Uint8Array) {
  const r = new Reader(data);
  const fields: { field: number; wire: number; bytes?: Uint8Array; num?: number }[] = [];
  while (r.remaining > 0) {
    const key = r.varint();
    const field = key >>> 3;
    const wire = key & 7;
    if (wire === 0) fields.push({ field, wire, num: r.varint() });
    else if (wire === 2) fields.push({ field, wire, bytes: r.bytes(r.varint()) });
    else if (wire === 5) {
      const b = r.bytes(4);
      const num = b[0]! | (b[1]! << 8) | (b[2]! << 16) | (b[3]! << 24);
      fields.push({ field, wire, num: num >>> 0 });
    } else r.skip(wire);
  }
  return fields;
}

function raritiesFromMask(mask: number): Rarity[] {
  return (Object.keys(RARITY_BIT) as Rarity[]).filter((r) => mask & RARITY_BIT[r]);
}

function decodeCondition(data: Uint8Array): Condition | null {
  const fields = readFields(data);
  const type = fields.find((f) => f.field === 1)?.num ?? 1;
  const kind = TYPE_TO_KIND[type] ?? "rarity";
  const mask = fields.find((f) => f.field === 4)?.num ?? 0;
  const hashes = fields.filter((f) => f.field === 2 && f.num != null).map((f) => f.num!);
  const flag = fields.find((f) => f.field === 6)?.num ?? 0;
  const power = fields.find((f) => f.field === 5)?.num ?? 0;

  if (kind === "rarity") return { kind, rarities: raritiesFromMask(mask || 8) };
  if (kind === "properties")
    return { kind, ancestral: Boolean(mask & 4), mythic: Boolean(mask & 32) };
  if (kind === "codex") return { kind, enabled: flag !== 0 || mask !== 0 || true };
  if (kind === "greaterAffix")
    return {
      kind,
      atLeast: mask || 1,
      compare: flag ? "fewerThan" : "atLeast",
    };
  if (kind === "itemPower")
    return { kind, min: flag || 0, max: power || 1000 };
  if (kind === "itemType")
    return {
      kind,
      types: hashes.length > 12 ? [] : hashes.map((h) => `t_${h.toString(16)}`),
      allClasses: hashes.length > 12,
    };
  if (kind === "requiredAffixes")
    return { kind, affixes: hashes.map((h) => `a_${h.toString(16)}`), atLeast: mask || 1 };
  if (kind === "optionalAffixes")
    return { kind, affixes: hashes.map((h) => `a_${h.toString(16)}`), atLeast: mask || 1 };
  if (kind === "unique")
    return { kind, names: hashes.map((h) => `Unique ${h.toString(16)}`) };
  if (kind === "talismanSet")
    return { kind, sets: hashes.map((h) => `set_${h.toString(16)}`) };
  return { kind: "rarity", rarities: ["legendary"] };
}

function decodeRule(data: Uint8Array): FilterRule {
  const fields = readFields(data);
  const nameBytes = fields.find((f) => f.field === 1)?.bytes;
  const name = nameBytes ? new TextDecoder().decode(nameBytes) : "Rule";
  const vis = NUM_TO_VIS[fields.find((f) => f.field === 2)?.num ?? 0] ?? "show";
  const colorNum = fields.find((f) => f.field === 3)?.num ?? 0xffd4aa6a;
  const enabled = (fields.find((f) => f.field === 5)?.num ?? 1) !== 0;
  const conditions = fields
    .filter((f) => f.field === 4 && f.bytes)
    .map((f) => decodeCondition(f.bytes!))
    .filter((c): c is Condition => c != null);
  return {
    id: newId("r"),
    name,
    enabled,
    visibility: vis,
    color: u32ToColor(colorNum),
    conditions,
  };
}

export function decodeFilter(code: string): LootFilter {
  const cleaned = code.trim().replace(/\s+/g, "");
  const pad = "=".repeat((4 - (cleaned.length % 4)) % 4);
  const bin = atob(cleaned + pad);
  const data = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) data[i] = bin.charCodeAt(i);
  const fields = readFields(data);
  const nameBytes = fields.find((f) => f.field === 2)?.bytes;
  const name = nameBytes ? new TextDecoder().decode(nameBytes) : "Imported Filter";
  const rules = fields
    .filter((f) => f.field === 1 && f.bytes)
    .map((f) => decodeRule(f.bytes!));
  if (rules.length === 0) throw new Error("That did not look like a loot filter code.");
  return { id: newId("f"), name: name || "Imported Filter", rules, scatterSeed: (Date.now() ^ (rules.length * 9973)) >>> 0 };
}

export function looksLikeCode(text: string) {
  const t = text.trim();
  return t.length > 40 && /^[A-Za-z0-9+/=]+$/.test(t.replace(/\s+/g, ""));
}
