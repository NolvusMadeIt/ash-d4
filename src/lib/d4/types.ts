export const VISIBILITY = [
  "show",
  "recolor",
  "hideLabel",
  "hideAll",
] as const;

export type Visibility = (typeof VISIBILITY)[number];

export const RARITIES = [
  "common",
  "magic",
  "rare",
  "legendary",
  "unique",
  "mythic",
] as const;

export type Rarity = (typeof RARITIES)[number];

export const CONDITION_KINDS = [
  "itemPower",
  "rarity",
  "properties",
  "codex",
  "greaterAffix",
  "itemType",
  "requiredAffixes",
  "optionalAffixes",
  "unique",
  "talismanSet",
] as const;

export type ConditionKind = (typeof CONDITION_KINDS)[number];

export type Condition =
  | { kind: "itemPower"; min: number; max: number }
  | { kind: "rarity"; rarities: Rarity[] }
  | { kind: "properties"; ancestral: boolean; mythic: boolean }
  | { kind: "codex"; enabled: boolean }
  | { kind: "greaterAffix"; atLeast: number; compare: "atLeast" | "fewerThan" }
  | { kind: "itemType"; types: string[]; allClasses: boolean }
  | { kind: "requiredAffixes"; affixes: string[]; atLeast: number }
  | { kind: "optionalAffixes"; affixes: string[]; atLeast: number }
  | { kind: "unique"; names: string[] }
  | { kind: "talismanSet"; sets: string[] };

export type FilterRule = {
  id: string;
  name: string;
  enabled: boolean;
  visibility: Visibility;
  color: string;
  conditions: Condition[];
};

export type LootFilter = {
  id: string;
  name: string;
  rules: FilterRule[];
};

export type DropItem = {
  id: string;
  name: string;
  base: string;
  slot: string;
  rarity: Rarity;
  itemPower: number;
  ancestral: boolean;
  mythic: boolean;
  greaterAffixes: number;
  affixes: string[];
  uniqueName?: string;
  codexUpgrade?: boolean;
  talismanSet?: string;
};
