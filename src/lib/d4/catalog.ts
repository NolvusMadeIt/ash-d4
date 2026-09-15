import type { ConditionKind, Rarity, Visibility } from "./types";

export const VISIBILITY_LABEL: Record<Visibility, string> = {
  show: "Show",
  recolor: "Recolor",
  hideLabel: "Hide Text Label",
  hideAll: "Hide All",
};

export const RARITY_LABEL: Record<Rarity, string> = {
  common: "Common",
  magic: "Magic",
  rare: "Rare",
  legendary: "Legendary",
  unique: "Unique",
  mythic: "Mythic Unique",
};

export const CONDITION_LABEL: Record<ConditionKind, string> = {
  itemPower: "Item Power Range",
  rarity: "Item Rarity Match",
  properties: "Item Properties",
  codex: "Codex Upgrade Check",
  greaterAffix: "Greater Affix Check",
  itemType: "Item Type Match",
  requiredAffixes: "Has Required Affixes",
  optionalAffixes: "Has Optional Affixes",
  unique: "Is Specific Unique",
  talismanSet: "Talisman Set Bonus",
};

export const ITEM_TYPE_GROUPS: { group: string; types: { id: string; label: string }[] }[] = [
  {
    group: "Armor",
    types: [
      { id: "helm", label: "Helm" },
      { id: "chest", label: "Chest" },
      { id: "gloves", label: "Gloves" },
      { id: "pants", label: "Pants" },
      { id: "boots", label: "Boots" },
    ],
  },
  {
    group: "Jewelry",
    types: [
      { id: "amulet", label: "Amulet" },
      { id: "ring", label: "Ring" },
    ],
  },
  {
    group: "Weapons",
    types: [
      { id: "axe", label: "Axe" },
      { id: "axe2h", label: "Two-Handed Axe" },
      { id: "mace", label: "Mace" },
      { id: "mace2h", label: "Two-Handed Mace" },
      { id: "sword", label: "Sword" },
      { id: "sword2h", label: "Two-Handed Sword" },
      { id: "dagger", label: "Dagger" },
      { id: "polearm", label: "Polearm" },
      { id: "staff", label: "Staff" },
      { id: "wand", label: "Wand" },
      { id: "bow", label: "Bow" },
      { id: "crossbow", label: "Crossbow" },
      { id: "scythe", label: "Scythe" },
      { id: "scythe2h", label: "Two-Handed Scythe" },
      { id: "quarterstaff", label: "Quarterstaff" },
      { id: "glaive", label: "Glaive" },
    ],
  },
  {
    group: "Offhand",
    types: [
      { id: "focus", label: "Focus" },
      { id: "totem", label: "Totem" },
      { id: "shield", label: "Shield" },
      { id: "offhand", label: "Offhand" },
    ],
  },
  {
    group: "Talisman",
    types: [
      { id: "charm", label: "Charm" },
      { id: "seal", label: "Horadric Seal" },
    ],
  },
];

export const ALL_ITEM_TYPES = ITEM_TYPE_GROUPS.flatMap((g) => g.types);

export const GEAR_TYPES = ALL_ITEM_TYPES.filter(
  (t) => t.id !== "charm" && t.id !== "seal",
).map((t) => t.id);

export const AFFIXES = [
  { id: "max_life", label: "Maximum Life" },
  { id: "armor", label: "Armor" },
  { id: "all_res", label: "All Resistances" },
  { id: "fire_res", label: "Fire Resistance" },
  { id: "cold_res", label: "Cold Resistance" },
  { id: "lightning_res", label: "Lightning Resistance" },
  { id: "poison_res", label: "Poison Resistance" },
  { id: "shadow_res", label: "Shadow Resistance" },
  { id: "strength", label: "Strength" },
  { id: "dexterity", label: "Dexterity" },
  { id: "intelligence", label: "Intelligence" },
  { id: "willpower", label: "Willpower" },
  { id: "crit_chance", label: "Critical Strike Chance" },
  { id: "crit_damage", label: "Critical Strike Damage" },
  { id: "attack_speed", label: "Attack Speed" },
  { id: "cast_speed", label: "Cast Speed" },
  { id: "move_speed", label: "Movement Speed" },
  { id: "cdr", label: "Cooldown Reduction" },
  { id: "resource_cost", label: "Resource Cost Reduction" },
  { id: "lucky_hit", label: "Lucky Hit Chance" },
  { id: "vulnerable", label: "Vulnerable Damage" },
  { id: "overpower", label: "Overpower Damage" },
  { id: "damage", label: "Damage" },
  { id: "close_damage", label: "Damage to Close" },
  { id: "distant_damage", label: "Damage to Distant" },
  { id: "life_per_hit", label: "Life per Hit" },
  { id: "ranks", label: "+Ranks to Skills" },
  { id: "essence_on_kill", label: "Resource on Kill" },
  { id: "thorns", label: "Thorns" },
  { id: "block", label: "Block Chance" },
  { id: "dodge", label: "Dodge Chance" },
  { id: "max_resource", label: "Maximum Resource" },
] as const;

export const UNIQUES = [
  { name: "Harlequin Crest", mythic: true, slot: "helm" },
  { name: "Shroud of False Death", mythic: true, slot: "chest" },
  { name: "Heir of Perdition", mythic: true, slot: "helm" },
  { name: "Tyrael's Might", mythic: true, slot: "chest" },
  { name: "Ring of Starless Skies", mythic: true, slot: "ring" },
  { name: "Andariel's Visage", mythic: true, slot: "helm" },
  { name: "Doombringer", mythic: true, slot: "sword" },
  { name: "The Grandfather", mythic: true, slot: "sword2h" },
  { name: "Melted Heart of Selig", mythic: true, slot: "amulet" },
  { name: "Nesekem the Herald", mythic: true, slot: "glaive" },
  { name: "Ahavarion, Spear of Lycander", mythic: true, slot: "staff" },
  { name: "The Butcher's Cleaver", mythic: false, slot: "axe" },
  { name: "Fists of Fate", mythic: false, slot: "gloves" },
  { name: "Tibault's Will", mythic: false, slot: "pants" },
  { name: "Yen's Blessing", mythic: false, slot: "boots" },
  { name: "Penitent Greaves", mythic: false, slot: "boots" },
  { name: "Tempest Roar", mythic: false, slot: "helm" },
  { name: "Insatiable Fury", mythic: false, slot: "chest" },
  { name: "Deathless Visage", mythic: false, slot: "helm" },
  { name: "Blood Moon Breeches", mythic: false, slot: "pants" },
  { name: "Cowl of the Nameless", mythic: false, slot: "helm" },
  { name: "Grasp of Shadow", mythic: false, slot: "gloves" },
  { name: "Asheara's Khanjar", mythic: false, slot: "dagger" },
  { name: "Raiment of the Infinite", mythic: false, slot: "chest" },
  { name: "Esadora's Overflowing Cameo", mythic: false, slot: "amulet" },
  { name: "Blue Rose", mythic: false, slot: "ring" },
  { name: "Paingorger's Gauntlets", mythic: false, slot: "gloves" },
  { name: "Godslayer Crown", mythic: false, slot: "helm" },
  { name: "Razorplate", mythic: false, slot: "chest" },
  { name: "Frostburn", mythic: false, slot: "gloves" },
  { name: "Flickerstep", mythic: false, slot: "boots" },
  { name: "Banished Lord's Talisman", mythic: false, slot: "amulet" },
  { name: "Lidless Wall", mythic: false, slot: "shield" },
  { name: "Mother's Embrace", mythic: false, slot: "ring" },
  { name: "Condemnation", mythic: false, slot: "dagger" },
  { name: "Skyhunter", mythic: false, slot: "bow" },
  { name: "The Unbroken Chain", mythic: false, slot: "pants" },
  { name: "Tassets of the Dawning Sky", mythic: false, slot: "pants" },
  { name: "Soulbrand", mythic: false, slot: "chest" },
  { name: "Ring of the Sacrilegious Soul", mythic: false, slot: "ring" },
  { name: "Greatstaff of the Crone", mythic: false, slot: "staff" },
  { name: "Airidah's Inexorable Will", mythic: false, slot: "ring" },
  { name: "Hunter's Zenith", mythic: false, slot: "ring" },
  { name: "Waxing Gibbous", mythic: false, slot: "axe" },
  { name: "Storm's Companion", mythic: false, slot: "pants" },
  { name: "Ugly Bastard Helm", mythic: false, slot: "helm" },
  { name: "Locran's Talisman", mythic: false, slot: "amulet" },
  { name: "Endurant Faith", mythic: false, slot: "gloves" },
] as const;

export const TALISMAN_SETS = [
  { id: "nilfur", label: "Nilfur's Narrow Eye" },
  { id: "werebear", label: "Werebear Companions" },
  { id: "blood", label: "Blood Lord's Pact" },
  { id: "shadow", label: "Shadow Imbuement" },
  { id: "hydra", label: "Hydra's Coil" },
  { id: "thunderspike", label: "Thunderspike" },
  { id: "pulverize", label: "Pulverize Totem" },
  { id: "bone", label: "Bone Spear Reliquary" },
  { id: "rapid", label: "Rapid Fire Latch" },
  { id: "firewall", label: "Firewall Sigil" },
  { id: "rupture", label: "Rupture Brand" },
  { id: "evade", label: "Evade Charm" },
];

export function typeLabel(id: string) {
  return ALL_ITEM_TYPES.find((t) => t.id === id)?.label ?? id;
}

export function affixLabel(id: string) {
  return AFFIXES.find((a) => a.id === id)?.label ?? id;
}

export function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export const RECOLOR_PRESETS = [
  "#f08a2a",
  "#e8c45a",
  "#6fd08a",
  "#5aa0e0",
  "#c46ae0",
  "#e05656",
  "#f0f0f0",
  "#d4aa6a",
];
