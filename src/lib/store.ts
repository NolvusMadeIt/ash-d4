import { create } from "zustand";
import { newId } from "./d4/catalog";
import { decodeFilter, encodeFilter } from "./d4/codec";
import { PIT_FARMER, STARTER_FILTER } from "./d4/presets";
import type { Condition, FilterRule, LootFilter } from "./d4/types";

const STORAGE_KEY = "ash-d4-filter-v2";

function freshSeed() {
  return (Math.random() * 0xffffffff) >>> 0 || 1;
}

type Persisted = {
  filters: LootFilter[];
  activeId: string;
};

type AshState = {
  filters: LootFilter[];
  activeId: string;
  selectedRuleId: string | null;
  status: string;
  error: string | null;
  modal: "create" | "rename" | null;
  hydrate: () => void;
  active: () => LootFilter;
  selectedRule: () => FilterRule | null;
  setActive: (id: string) => void;
  selectRule: (id: string | null) => void;
  openModal: (m: "create" | "rename" | null) => void;
  createFilter: (name: string) => void;
  importCode: (code: string, name?: string) => boolean;
  exportActive: () => string;
  renameActive: (name: string) => void;
  duplicateActive: () => void;
  deleteActive: () => void;
  addRule: () => void;
  patchRule: (id: string, patch: Partial<FilterRule>) => void;
  moveRule: (id: string, dir: -1 | 1) => void;
  duplicateRule: (id: string) => void;
  removeRule: (id: string) => void;
  toggleRule: (id: string) => void;
  enableAll: (on: boolean) => void;
  addCondition: (kind: Condition["kind"]) => void;
  patchCondition: (index: number, next: Condition) => void;
  removeCondition: (index: number) => void;
  loadPreset: (filter: LootFilter) => void;
  reshuffleGround: () => void;
};

function persist(filters: LootFilter[], activeId: string) {
  try {
    const data: Persisted = { filters, activeId };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

function cloneFilter(f: LootFilter, name: string): LootFilter {
  return {
    id: newId("f"),
    name,
    scatterSeed: freshSeed(),
    rules: f.rules.map((r) => ({
      ...r,
      id: newId("r"),
      conditions: r.conditions.map((c) => ({ ...c })),
    })),
  };
}

function emptyRule(): FilterRule {
  return {
    id: newId("r"),
    name: "New Rule",
    enabled: true,
    visibility: "show",
    color: "#f08a2a",
    conditions: [],
  };
}

function defaultCondition(kind: Condition["kind"]): Condition {
  switch (kind) {
    case "itemPower":
      return { kind, min: 0, max: 1000 };
    case "rarity":
      return { kind, rarities: ["legendary"] };
    case "properties":
      return { kind, ancestral: true, mythic: false };
    case "codex":
      return { kind, enabled: true };
    case "greaterAffix":
      return { kind, atLeast: 1, compare: "atLeast" };
    case "itemType":
      return { kind, types: [], allClasses: true };
    case "requiredAffixes":
      return { kind, affixes: [], atLeast: 1 };
    case "optionalAffixes":
      return { kind, affixes: [], atLeast: 1 };
    case "unique":
      return { kind, names: [] };
    case "talismanSet":
      return { kind, sets: [] };
  }
}

export const useAsh = create<AshState>((set, get) => ({
  filters: [structuredClone(PIT_FARMER)],
  activeId: PIT_FARMER.id,
  selectedRuleId: PIT_FARMER.rules[0]?.id ?? null,
  status: "Rules apply top to bottom. An item must meet every condition on a rule.",
  error: null,
  modal: null,
  hydrate() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as Persisted;
      if (!Array.isArray(data.filters) || data.filters.length === 0) return;
      const activeId =
        data.filters.some((f) => f.id === data.activeId) ? data.activeId : data.filters[0]!.id;
      const active = data.filters.find((f) => f.id === activeId)!;
      set({
        filters: data.filters.map((f) => ({
          ...f,
          scatterSeed: f.scatterSeed || freshSeed(),
        })),
        activeId,
        selectedRuleId: active.rules[0]?.id ?? null,
      });
    } catch {
      /* ignore */
    }
  },
  active() {
    return get().filters.find((f) => f.id === get().activeId) ?? get().filters[0]!;
  },
  selectedRule() {
    const f = get().active();
    return f.rules.find((r) => r.id === get().selectedRuleId) ?? null;
  },
  setActive(id) {
    const f = get().filters.find((x) => x.id === id);
    if (!f) return;
    set({
      activeId: id,
      selectedRuleId: f.rules[0]?.id ?? null,
      error: null,
      status: `${f.name} selected.`,
    });
    persist(get().filters, id);
  },
  selectRule(id) {
    set({ selectedRuleId: id });
  },
  openModal(m) {
    set({ modal: m, error: null });
  },
  createFilter(name) {
    const f = cloneFilter(STARTER_FILTER, name.trim() || "New Filter");
    const filters = [...get().filters, f];
    set({
      filters,
      activeId: f.id,
      selectedRuleId: null,
      modal: null,
      status: `${f.name} created.`,
    });
    persist(filters, f.id);
  },
  importCode(code, name) {
    try {
      const f = decodeFilter(code);
      if (name?.trim()) f.name = name.trim();
      const filters = [...get().filters, f];
      set({
        filters,
        activeId: f.id,
        selectedRuleId: f.rules[0]?.id ?? null,
        modal: null,
        error: null,
        status: `Imported ${f.name} · ${f.rules.length} rules.`,
      });
      persist(filters, f.id);
      return true;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Invalid loot filter code.",
        status: "Could not read that code.",
      });
      return false;
    }
  },
  exportActive() {
    const code = encodeFilter(get().active());
    set({ status: "Filter code copied. Paste it in-game under New Filter → Import." });
    return code;
  },
  renameActive(name) {
    const n = name.trim();
    if (!n) return;
    const filters = get().filters.map((f) =>
      f.id === get().activeId ? { ...f, name: n } : f,
    );
    set({ filters, modal: null, status: `Renamed to ${n}.` });
    persist(filters, get().activeId);
  },
  duplicateActive() {
    const copy = cloneFilter(get().active(), `${get().active().name} Copy`);
    const filters = [...get().filters, copy];
    set({
      filters,
      activeId: copy.id,
      selectedRuleId: copy.rules[0]?.id ?? null,
      status: `Duplicated as ${copy.name}.`,
    });
    persist(filters, copy.id);
  },
  deleteActive() {
    let filters = get().filters.filter((f) => f.id !== get().activeId);
    if (filters.length === 0) filters = [cloneFilter(STARTER_FILTER, "New Filter")];
    const activeId = filters[0]!.id;
    set({
      filters,
      activeId,
      selectedRuleId: filters[0]!.rules[0]?.id ?? null,
      status: "Filter deleted.",
    });
    persist(filters, activeId);
  },
  addRule() {
    const rule = emptyRule();
    const filters = get().filters.map((f) =>
      f.id === get().activeId
        ? { ...f, scatterSeed: freshSeed(), rules: [...f.rules, rule] }
        : f,
    );
    set({
      filters,
      selectedRuleId: rule.id,
      status: "Rule added. Conditions are AND — every one must match.",
    });
    persist(filters, get().activeId);
  },
  patchRule(id, patch) {
    const nameOnly = Object.keys(patch).length === 1 && "name" in patch;
    const filters = get().filters.map((f) =>
      f.id === get().activeId
        ? {
            ...f,
            scatterSeed: nameOnly ? f.scatterSeed : freshSeed(),
            rules: f.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)),
          }
        : f,
    );
    set({ filters });
    persist(filters, get().activeId);
  },
  moveRule(id, dir) {
    const filters = get().filters.map((f) => {
      if (f.id !== get().activeId) return f;
      const rules = [...f.rules];
      const i = rules.findIndex((r) => r.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= rules.length) return f;
      const [row] = rules.splice(i, 1);
      rules.splice(j, 0, row!);
      return { ...f, rules };
    });
    set({ filters });
    persist(filters, get().activeId);
  },
  duplicateRule(id) {
    const filters = get().filters.map((f) => {
      if (f.id !== get().activeId) return f;
      const src = f.rules.find((r) => r.id === id);
      if (!src) return f;
      const copy: FilterRule = {
        ...src,
        id: newId("r"),
        name: `${src.name} Copy`,
        conditions: src.conditions.map((c) => ({ ...c })),
      };
      const i = f.rules.findIndex((r) => r.id === id);
      const rules = [...f.rules];
      rules.splice(i + 1, 0, copy);
      return { ...f, scatterSeed: freshSeed(), rules };
    });
    set({ filters, status: "Rule duplicated." });
    persist(filters, get().activeId);
  },
  removeRule(id) {
    const filters = get().filters.map((f) =>
      f.id === get().activeId
        ? { ...f, scatterSeed: freshSeed(), rules: f.rules.filter((r) => r.id !== id) }
        : f,
    );
    const next = filters.find((f) => f.id === get().activeId);
    set({
      filters,
      selectedRuleId:
        get().selectedRuleId === id ? (next?.rules[0]?.id ?? null) : get().selectedRuleId,
    });
    persist(filters, get().activeId);
  },
  toggleRule(id) {
    const filters = get().filters.map((f) =>
      f.id === get().activeId
        ? {
            ...f,
            scatterSeed: freshSeed(),
            rules: f.rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
          }
        : f,
    );
    set({ filters });
    persist(filters, get().activeId);
  },
  enableAll(on) {
    const filters = get().filters.map((f) =>
      f.id === get().activeId
        ? { ...f, scatterSeed: freshSeed(), rules: f.rules.map((r) => ({ ...r, enabled: on })) }
        : f,
    );
    set({ filters });
    persist(filters, get().activeId);
  },
  addCondition(kind) {
    const id = get().selectedRuleId;
    if (!id) return;
    const cond = defaultCondition(kind);
    const filters = get().filters.map((f) =>
      f.id === get().activeId
        ? {
            ...f,
            scatterSeed: freshSeed(),
            rules: f.rules.map((r) =>
              r.id === id ? { ...r, conditions: [...r.conditions, cond] } : r,
            ),
          }
        : f,
    );
    set({ filters });
    persist(filters, get().activeId);
  },
  patchCondition(index, next) {
    const id = get().selectedRuleId;
    if (!id) return;
    const filters = get().filters.map((f) =>
      f.id === get().activeId
        ? {
            ...f,
            scatterSeed: freshSeed(),
            rules: f.rules.map((r) => {
              if (r.id !== id) return r;
              const conditions = r.conditions.map((c, i) => (i === index ? next : c));
              return { ...r, conditions };
            }),
          }
        : f,
    );
    set({ filters });
    persist(filters, get().activeId);
  },
  removeCondition(index) {
    const id = get().selectedRuleId;
    if (!id) return;
    const filters = get().filters.map((f) =>
      f.id === get().activeId
        ? {
            ...f,
            scatterSeed: freshSeed(),
            rules: f.rules.map((r) =>
              r.id === id
                ? { ...r, conditions: r.conditions.filter((_, i) => i !== index) }
                : r,
            ),
          }
        : f,
    );
    set({ filters });
    persist(filters, get().activeId);
  },
  loadPreset(filter) {
    const copy = cloneFilter(filter, filter.name);
    const filters = [...get().filters, copy];
    set({
      filters,
      activeId: copy.id,
      selectedRuleId: copy.rules[0]?.id ?? null,
      status: `${copy.name} loaded.`,
    });
    persist(filters, copy.id);
  },
  reshuffleGround() {
    const filters = get().filters.map((f) =>
      f.id === get().activeId ? { ...f, scatterSeed: freshSeed() } : f,
    );
    set({ filters, status: "New drop on the ground." });
    persist(filters, get().activeId);
  },
}));
