import { create } from "zustand";
import {
  classFromBase,
  indexCatalog,
  loadBakedCatalog,
  type ScoutItem,
} from "./poe/catalog";
import { indexBaseIcons, loadBaseIcons, type BaseIconMap } from "./poe/base-icons";
import { DEMO_ITEMS } from "./poe/demo-items";
import {
  DEFAULT_STYLE,
  GEM_STYLE,
  matchingRule,
  newRuleId,
  RARE_STYLE,
  UNIQUE_STYLE,
  type FilterRule,
} from "./poe/filter";
import { NEVER_SINK_TEMPLATES, type NeverSinkId } from "./poe/neversink";
import { decodeHtmlEntities } from "./poe/decode";
import { parseItem, type ItemRarity, type ParsedItem } from "./poe/parse-item";
import {
  enrichPieces,
  parseBuildSource,
  type BuildPiece,
} from "./poe/pob";
import { loadNeverSinkFilter, refreshSources } from "./poe/sync";

const STORAGE_KEY = "cull-filter-v2";

type Persisted = {
  rules: FilterRule[];
  imported: string | null;
  importedName: string | null;
  templateId: NeverSinkId | null;
  buildName: string | null;
  buildPieces: BuildPiece[];
};

type CullState = {
  item: ParsedItem | null;
  error: string | null;
  rules: FilterRule[];
  imported: string | null;
  importedName: string | null;
  templateId: NeverSinkId | null;
  templateLoading: boolean;
  buildName: string | null;
  buildPieces: BuildPiece[];
  catalog: Map<string, ScoutItem>;
  baseIcons: BaseIconMap;
  league: string | null;
  status: string;
  hydrate: () => void;
  loadCatalog: () => Promise<void>;
  ingestText: (text: string, source?: string) => boolean;
  setAction: (action: "Show" | "Hide", target?: ParsedItem) => void;
  patchRule: (patch: Partial<FilterRule>) => void;
  toggleRarity: (rarity: ItemRarity) => void;
  removeRule: (id: string) => void;
  setImported: (text: string | null, name: string | null) => void;
  loadTemplate: (id: NeverSinkId) => Promise<void>;
  importBuild: (source: string, name: string) => Promise<void>;
  selectPiece: (id: string) => void;
  clearBuild: () => void;
  clearItem: () => void;
};

function persist(
  state: Pick<
    CullState,
    "rules" | "imported" | "importedName" | "templateId" | "buildName" | "buildPieces"
  >,
) {
  try {
    const data: Persisted = {
      rules: state.rules,
      imported: state.imported,
      importedName: state.importedName,
      templateId: state.templateId,
      buildName: state.buildName,
      buildPieces: state.buildPieces,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota */
  }
}

function scrubItem(item: ParsedItem): ParsedItem {
  return {
    ...item,
    name: decodeHtmlEntities(item.name),
    baseType: decodeHtmlEntities(item.baseType),
    className: decodeHtmlEntities(item.className),
    raw: decodeHtmlEntities(item.raw),
  };
}

function scrubRule(rule: FilterRule): FilterRule {
  return {
    ...rule,
    className: decodeHtmlEntities(rule.className),
    baseType: decodeHtmlEntities(rule.baseType),
    uniqueName: rule.uniqueName ? decodeHtmlEntities(rule.uniqueName) : rule.uniqueName,
  };
}

function defaultRarities(item: ParsedItem): ItemRarity[] {
  if (item.rarity === "Currency" || item.rarity === "Gem") return [];
  if (item.rarity === "Normal" || item.rarity === "Magic") {
    return ["Normal", "Magic"];
  }
  return [item.rarity];
}

function styleFor(kind: BuildPiece["kind"]) {
  if (kind === "unique") return UNIQUE_STYLE;
  if (kind === "gem") return GEM_STYLE;
  if (kind === "rare") return RARE_STYLE;
  return DEFAULT_STYLE;
}

function upsertForItem(
  rules: FilterRule[],
  item: ParsedItem,
  patch: Partial<FilterRule>,
): FilterRule[] {
  const existing = matchingRule(rules, item);
  if (existing) {
    const updated = { ...existing, ...patch };
    return [updated, ...rules.filter((r) => r.id !== existing.id)];
  }
  const created: FilterRule = {
    id: newRuleId(),
    action: "Hide",
    className: item.className,
    baseType: item.baseType,
    rarities: defaultRarities(item),
    disableDropSound: true,
    uniqueName: item.rarity === "Unique" ? decodeHtmlEntities(item.name) : undefined,
    source: "manual",
    ...DEFAULT_STYLE,
    ...patch,
  };
  return [created, ...rules];
}

function rulesFromBuild(pieces: BuildPiece[], existing: FilterRule[]): FilterRule[] {
  const kept = existing.filter((r) => r.source !== "build");
  const created: FilterRule[] = [];
  for (const p of pieces) {
    if (p.kind === "currency" || p.kind === "other") continue;
    const rarities: ItemRarity[] =
      p.kind === "unique"
        ? ["Unique"]
        : p.kind === "gem"
          ? []
          : defaultRarities(p.item);
    created.push({
      id: newRuleId(),
      action: "Show",
      className: decodeHtmlEntities(p.item.className),
      baseType: decodeHtmlEntities(p.item.baseType),
      rarities,
      disableDropSound: false,
      uniqueName: p.kind === "unique" ? decodeHtmlEntities(p.item.name) : undefined,
      source: "build",
      slot: p.slot,
      ...styleFor(p.kind),
    });
  }
  return [...created, ...kept];
}

export const useCull = create<CullState>((set, get) => ({
  item: parseItem(DEMO_ITEMS[0].raw),
  error: null,
  rules: [],
  imported: null,
  importedName: null,
  templateId: null,
  templateLoading: false,
  buildName: null,
  buildPieces: [],
  catalog: indexCatalog([]),
  baseIcons: new Map(),
  league: null,
  status: "Pick a NeverSink template, then import a build — or paste an item copy.",
  hydrate() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as Persisted;
      const rules = Array.isArray(data.rules) ? data.rules.map(scrubRule) : [];
      const buildPieces = Array.isArray(data.buildPieces)
        ? data.buildPieces.map((p) => ({ ...p, item: scrubItem(p.item) }))
        : [];
      set({
        rules,
        imported: data.imported ?? null,
        importedName: data.importedName ?? null,
        templateId: data.templateId ?? null,
        buildName: data.buildName ?? null,
        buildPieces,
      });
      persist({
        rules,
        imported: data.imported ?? null,
        importedName: data.importedName ?? null,
        templateId: data.templateId ?? null,
        buildName: data.buildName ?? null,
        buildPieces,
      });
    } catch {
      /* ignore */
    }
  },
  async loadCatalog() {
    const [baked, bases] = await Promise.all([loadBakedCatalog(), loadBaseIcons()]);
    const catalog = indexCatalog(baked.items);
    set({
      catalog,
      baseIcons: bases,
      league: baked.league,
      buildPieces: enrichPieces(get().buildPieces, catalog, bases),
      status: "Checking sources for updates…",
    });
    try {
      const live = await refreshSources();
      if (live.catalog.items.length > 0) {
        const next = indexCatalog(live.catalog.items);
        const icons =
          live.baseCount > 0 ? indexBaseIcons(live.baseIcons) : get().baseIcons;
        const pieces = enrichPieces(get().buildPieces, next, icons);
        set({
          catalog: next,
          baseIcons: icons,
          league: live.league,
          buildPieces: pieces,
          status: `Sources checked · ${live.league} · ${live.itemCount} items`,
        });
      } else {
        set({
          status: `Using packed data · ${get().league ?? "offline"}`,
        });
      }
    } catch {
      set({
        status: `Using packed data · ${get().league ?? "offline"}`,
      });
    }
  },
  ingestText(text, source = "clipboard") {
    const parsed = parseItem(text);
    if (!parsed) {
      set({
        error: "That was not a Path of Exile item copy.",
        status: "Need a Ctrl+C item dump.",
      });
      return false;
    }
    const hit = get().catalog.get(parsed.name.toLowerCase());
    const item = hit
      ? {
          ...parsed,
          baseType: hit.base || parsed.baseType,
          className:
            parsed.className === "Unknown"
              ? classFromBase(hit.base || parsed.baseType, hit.category)
              : parsed.className,
        }
      : parsed;
    set({
      item,
      error: null,
      status: `Read ${item.name} from ${source}.`,
    });
    return true;
  },
  setAction(action, target) {
    const item = target ?? get().item;
    if (!item) return;
    const { rules } = get();
    const next = upsertForItem(rules, item, { action, source: "manual" });
    set({
      item,
      rules: next,
      error: null,
      status:
        action === "Hide"
          ? `Hidden ${item.baseType} in every zone. Export the filter, then reload it in-game.`
          : `Showing ${item.baseType} in every zone. Export and reload the filter.`,
    });
    persist({ ...get(), rules: next });
  },
  patchRule(patch) {
    const { item, rules } = get();
    if (!item) return;
    const next = upsertForItem(rules, item, patch);
    set({ rules: next });
    persist({ ...get(), rules: next });
  },
  toggleRarity(rarity) {
    const { item, rules } = get();
    if (!item) return;
    const current = matchingRule(rules, item);
    const list = current?.rarities ?? [item.rarity];
    const rarities = list.includes(rarity)
      ? list.filter((r) => r !== rarity)
      : [...list, rarity];
    const next = upsertForItem(rules, item, { rarities });
    set({ rules: next });
    persist({ ...get(), rules: next });
  },
  removeRule(id) {
    const rules = get().rules.filter((r) => r.id !== id);
    set({ rules });
    persist({ ...get(), rules });
  },
  setImported(text, name) {
    set({ imported: text, importedName: name, templateId: null });
    persist({ ...get(), imported: text, importedName: name, templateId: null });
  },
  async loadTemplate(id) {
    set({ templateLoading: true, error: null, status: `Loading ${id}…` });
    try {
      const text = await loadNeverSinkFilter({ data: id });
      const meta = NEVER_SINK_TEMPLATES.find((t) => t.id === id);
      set({
        imported: text,
        importedName: meta?.file ?? id,
        templateId: id,
        templateLoading: false,
        status: `${meta?.label ?? id} loaded. Cull rules inject above NeverSink.`,
      });
      persist({ ...get(), imported: text, importedName: meta?.file ?? id, templateId: id });
    } catch (err) {
      set({
        templateLoading: false,
        error: err instanceof Error ? err.message : "NeverSink failed to load",
        status: "Could not fetch that template.",
      });
    }
  },
  async importBuild(source, name) {
    try {
      const parsed = await parseBuildSource(source);
      if (parsed.length === 0) {
        set({
          error: "No items found in that build.",
          status: "Need a .build file or Path of Building code.",
        });
        return;
      }
      const pieces = enrichPieces(parsed, get().catalog, get().baseIcons);
      const rules = rulesFromBuild(pieces, get().rules);
      const first = pieces[0];
      set({
        buildPieces: pieces,
        buildName: name,
        rules,
        item: first?.item ?? get().item,
        error: null,
        status: `Detected ${pieces.length} items from ${name}. Filter now shows those bases.`,
      });
      persist({ ...get(), rules, buildPieces: pieces, buildName: name });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Could not read that build.",
        status: "Paste Path of Building code, or drop a .build file.",
      });
    }
  },
  selectPiece(id) {
    const piece = get().buildPieces.find((p) => p.id === id);
    if (!piece) return;
    set({
      item: piece.item,
      error: null,
      status: `Editing ${piece.item.name}.`,
    });
  },
  clearBuild() {
    const rules = get().rules.filter((r) => r.source !== "build");
    set({
      buildPieces: [],
      buildName: null,
      rules,
      status: "Build cleared. Template and manual rules remain.",
    });
    persist({ ...get(), rules, buildPieces: [], buildName: null });
  },
  clearItem() {
    set({ item: null, error: null, status: "Waiting for an item copy." });
  },
}));
