import type { ItemRarity, ParsedItem } from "./parse-item";
import { decodeHtmlEntities } from "./decode";
import { affixById, type DefenceWanted } from "./mods";
import { injectOverride } from "./neversink";
import { quoteSoundFile, type FilterSound } from "./sounds";

export type Rgb = { r: number; g: number; b: number; a?: number };

export type FilterRule = {
  id: string;
  action: "Show" | "Hide";
  className: string;
  baseType: string;
  rarities: ItemRarity[];
  disableDropSound: boolean;
  fontSize: number;
  text: Rgb;
  border: Rgb;
  background: Rgb;
  uniqueName?: string;
  source?: "manual" | "build";
  slot?: string;
  defence?: DefenceWanted;
  affixes?: string[];
  itemLevelMin?: number;
  qualityMin?: number;
  sound?: FilterSound;
};

export const DEFAULT_STYLE = {
  fontSize: 32,
  text: { r: 200, g: 220, b: 180 },
  border: { r: 20, g: 20, b: 22 },
  background: { r: 12, g: 12, b: 14 },
};

export const UNIQUE_STYLE = {
  fontSize: 40,
  text: { r: 175, g: 96, b: 37 },
  border: { r: 175, g: 96, b: 37 },
  background: { r: 20, g: 12, b: 8 },
};

export const RARE_STYLE = {
  fontSize: 36,
  text: { r: 255, g: 255, b: 119 },
  border: { r: 255, g: 255, b: 119 },
  background: { r: 20, g: 18, b: 8 },
};

export const GEM_STYLE = {
  fontSize: 32,
  text: { r: 27, g: 162, b: 155 },
  border: { r: 27, g: 162, b: 155 },
  background: { r: 8, g: 18, b: 16 },
};

function rgbLine(cmd: string, c: Rgb) {
  const a = c.a ?? 255;
  return `    ${cmd} ${c.r} ${c.g} ${c.b} ${a}`;
}

function rarityLine(rarities: ItemRarity[]) {
  const usable = rarities.filter((r) =>
    ["Normal", "Magic", "Rare", "Unique"].includes(r),
  );
  if (usable.length === 0) return null;
  return `    Rarity ${usable.join(" ")}`;
}

function quoteMods(mods: readonly string[]): string {
  return mods.map((m) => `"${m.replace(/"/g, "")}"`).join(" ");
}

function defenceLines(d?: DefenceWanted): string[] {
  if (!d) return [];
  const wantA = !!d.armour;
  const wantE = !!d.evasion;
  const wantS = !!d.energyShield;
  if (!wantA && !wantE && !wantS) return [];
  if (d.pure) {
    return [
      `    BaseArmour ${wantA ? "> 0" : "0"}`,
      `    BaseEvasion ${wantE ? "> 0" : "0"}`,
      `    BaseEnergyShield ${wantS ? "> 0" : "0"}`,
    ];
  }
  const lines: string[] = [];
  if (wantA) lines.push("    BaseArmour > 0");
  if (wantE) lines.push("    BaseEvasion > 0");
  if (wantS) lines.push("    BaseEnergyShield > 0");
  return lines;
}

function affixLines(ids?: string[]): string[] {
  if (!ids?.length) return [];
  const lines: string[] = [];
  for (const id of ids) {
    const preset = affixById(id);
    if (!preset) continue;
    lines.push(`    HasExplicitMod ${quoteMods(preset.mods)}`);
  }
  return lines;
}

function soundLines(rule: FilterRule): string[] {
  const sound = rule.sound;
  const kind = sound?.kind ?? (rule.disableDropSound ? "mute" : "none");
  const volume = Math.min(300, Math.max(0, sound?.volume ?? 300));
  if (kind === "mute") return ["    DisableDropSound True"];
  if (kind === "builtin") {
    const id = sound?.id && sound.id >= 1 && sound.id <= 16 ? sound.id : 3;
    return [`    PlayAlertSound ${id} ${volume}`];
  }
  if (kind === "neversink" && sound?.file) {
    return [`    CustomAlertSound ${quoteSoundFile(sound.file)} ${volume}`];
  }
  if (kind === "custom" && sound?.file?.trim()) {
    return [`    CustomAlertSound ${quoteSoundFile(sound.file)} ${volume}`];
  }
  return [];
}

export function ruleToBlock(rule: FilterRule): string {
  const label = rule.uniqueName
    ? `${decodeHtmlEntities(rule.uniqueName)} (${decodeHtmlEntities(rule.baseType)})`
    : decodeHtmlEntities(rule.baseType);
  const className = decodeHtmlEntities(rule.className);
  const baseType = decodeHtmlEntities(rule.baseType);
  const lines = [
    `# Cull: ${rule.action} ${label} — all zones, no AreaLevel`,
    rule.action,
    `    Class == "${className}"`,
    `    BaseType == "${baseType}"`,
  ];
  const rarity = rarityLine(rule.rarities);
  if (rarity) lines.push(rarity);
  if (rule.itemLevelMin && rule.itemLevelMin > 0) {
    lines.push(`    ItemLevel >= ${Math.round(rule.itemLevelMin)}`);
  }
  if (rule.qualityMin && rule.qualityMin > 0) {
    lines.push(`    Quality >= ${Math.round(rule.qualityMin)}`);
  }
  lines.push(...defenceLines(rule.defence));
  lines.push(...affixLines(rule.affixes));
  if (rule.action === "Show") {
    lines.push(rgbLine("SetTextColor", rule.text));
    lines.push(rgbLine("SetBorderColor", rule.border));
    lines.push(rgbLine("SetBackgroundColor", rule.background));
    lines.push(`    SetFontSize ${rule.fontSize}`);
  }
  lines.push(...soundLines(rule));
  return lines.join("\n");
}

export function buildFilterFile(rules: FilterRule[], imported: string | null) {
  const header = [
    "# Cull overlay rules — FIRST MATCH WINS.",
    "# Hide is global (every zone). No AreaLevel gates.",
    "",
  ].join("\n");
  const ordered = [...rules].sort((a, b) => {
    if (a.action === b.action) return 0;
    return a.action === "Hide" ? -1 : 1;
  });
  const body = ordered.map(ruleToBlock).join("\n\n");
  const cull = `${header}${body}\n`;
  if (imported?.trim()) return injectOverride(imported, cull);
  return cull;
}

export function matchingRule(rules: FilterRule[], item: ParsedItem) {
  const itemName = decodeHtmlEntities(item.name);
  const itemBase = decodeHtmlEntities(item.baseType);
  return (
    rules.find((r) => {
      if (r.uniqueName && decodeHtmlEntities(r.uniqueName) === itemName) return true;
      if (decodeHtmlEntities(r.baseType) !== itemBase) return false;
      return r.rarities.length === 0 || r.rarities.includes(item.rarity);
    }) ?? null
  );
}

export function newRuleId() {
  return `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}