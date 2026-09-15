export const DEFENCE_STATS = [
  { id: "armour", label: "Armour", field: "BaseArmour" },
  { id: "evasion", label: "Evasion", field: "BaseEvasion" },
  { id: "energyShield", label: "Energy Shield", field: "BaseEnergyShield" },
] as const;

export type DefenceId = (typeof DEFENCE_STATS)[number]["id"];

export type DefenceWanted = {
  armour?: boolean;
  evasion?: boolean;
  energyShield?: boolean;
  pure?: boolean;
};

export const AFFIX_PRESETS = [
  { id: "life", label: "Life", mods: ["to maximum Life"] },
  { id: "mana", label: "Mana", mods: ["to maximum Mana"] },
  { id: "es", label: "Energy Shield", mods: ["to maximum Energy Shield", "increased Energy Shield"] },
  { id: "evasion", label: "Evasion", mods: ["to Evasion Rating", "increased Evasion"] },
  { id: "armour", label: "Armour", mods: ["to Armour", "increased Armour"] },
  { id: "spirit", label: "Spirit", mods: ["to Spirit"] },
  { id: "ms", label: "Move speed", mods: ["increased Movement Speed"] },
  { id: "fire", label: "Fire res", mods: ["to Fire Resistance"] },
  { id: "cold", label: "Cold res", mods: ["to Cold Resistance"] },
  { id: "lightning", label: "Lightning res", mods: ["to Lightning Resistance"] },
  { id: "chaos", label: "Chaos res", mods: ["to Chaos Resistance"] },
  { id: "allres", label: "All res", mods: ["to all Elemental Resistances"] },
  { id: "str", label: "Strength", mods: ["to Strength"] },
  { id: "dex", label: "Dexterity", mods: ["to Dexterity"] },
  { id: "int", label: "Intelligence", mods: ["to Intelligence"] },
  { id: "rarity", label: "Rarity", mods: ["increased Rarity of Items found"] },
  { id: "as", label: "Attack speed", mods: ["increased Attack Speed"] },
  { id: "cs", label: "Cast speed", mods: ["increased Cast Speed"] },
  { id: "crit", label: "Crit", mods: ["Critical Hit Chance", "Critical Damage Bonus"] },
] as const;

export type AffixId = (typeof AFFIX_PRESETS)[number]["id"];

export function affixById(id: string) {
  return AFFIX_PRESETS.find((a) => a.id === id);
}

export function defenceSummary(d?: DefenceWanted): string[] {
  if (!d) return [];
  const bits: string[] = [];
  if (d.armour) bits.push("AR");
  if (d.evasion) bits.push("EV");
  if (d.energyShield) bits.push("ES");
  if (bits.length && d.pure) bits.push("pure");
  return bits;
}

export function affixSummary(ids?: string[]): string[] {
  if (!ids?.length) return [];
  const labels: string[] = [];
  for (const id of ids) {
    const hit = AFFIX_PRESETS.find((a) => a.id === id);
    if (hit) labels.push(hit.label);
  }
  return labels;
}