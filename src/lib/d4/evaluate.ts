import type { Condition, DropItem, FilterRule, LootFilter, Visibility } from "./types";

export type MatchResult = {
  rule: FilterRule | null;
  visibility: Visibility;
  color?: string;
};

function condOk(c: Condition, item: DropItem): boolean {
  switch (c.kind) {
    case "itemPower":
      return item.itemPower >= c.min && item.itemPower <= c.max;
    case "rarity":
      return c.rarities.length === 0 || c.rarities.includes(item.rarity);
    case "properties": {
      if (c.ancestral && !item.ancestral) return false;
      if (c.mythic && !item.mythic) return false;
      if (!c.ancestral && !c.mythic) return true;
      return true;
    }
    case "codex":
      return c.enabled ? Boolean(item.codexUpgrade) : true;
    case "greaterAffix":
      return c.compare === "fewerThan"
        ? item.greaterAffixes < c.atLeast
        : item.greaterAffixes >= c.atLeast;
    case "itemType": {
      if (c.allClasses || c.types.length === 0) return true;
      return c.types.includes(item.slot);
    }
    case "requiredAffixes": {
      const hits = c.affixes.filter((a) => item.affixes.includes(a)).length;
      return hits >= Math.min(c.atLeast, c.affixes.length || 1);
    }
    case "optionalAffixes": {
      if (c.affixes.length === 0) return true;
      const hits = c.affixes.filter((a) => item.affixes.includes(a)).length;
      return hits >= Math.min(c.atLeast, 1);
    }
    case "unique":
      if (c.names.length === 0) return item.rarity === "unique" || item.rarity === "mythic";
      return Boolean(item.uniqueName && c.names.includes(item.uniqueName));
    case "talismanSet":
      if (c.sets.length === 0) return Boolean(item.talismanSet);
      return Boolean(item.talismanSet && c.sets.includes(item.talismanSet));
  }
}

export function matchItem(filter: LootFilter, item: DropItem): MatchResult {
  for (const rule of filter.rules) {
    if (!rule.enabled) continue;
    if (rule.conditions.length === 0) continue;
    if (rule.conditions.every((c) => condOk(c, item))) {
      return {
        rule,
        visibility: rule.visibility,
        color: rule.visibility === "recolor" ? rule.color : undefined,
      };
    }
  }
  return { rule: null, visibility: "show" };
}

export function ruleSummary(rule: FilterRule) {
  const vis =
    rule.visibility === "hideAll"
      ? "HIDE ALL"
      : rule.visibility === "hideLabel"
        ? "HIDE LABEL"
        : rule.visibility === "recolor"
          ? "RECOLOR"
          : "SHOW";
  return `${vis}  ${rule.name}`;
}
