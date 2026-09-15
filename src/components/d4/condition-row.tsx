import { Search } from "lucide-react";
import {
  AFFIXES,
  CONDITION_LABEL,
  ITEM_TYPE_GROUPS,
  RARITY_LABEL,
  TALISMAN_SETS,
  UNIQUES,
  affixLabel,
} from "@/lib/d4/catalog";
import type { Condition, ConditionKind, Rarity } from "@/lib/d4/types";
import { RARITIES } from "@/lib/d4/types";
import { useState } from "react";

const KINDS = Object.keys(CONDITION_LABEL) as ConditionKind[];

function ChipList({
  options,
  selected,
  onToggle,
}: {
  options: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = selected.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onToggle(o.id)}
            className={
              on
                ? "min-h-8 border border-blood-bright bg-danger/40 px-2 text-xs text-fg"
                : "min-h-8 border border-border bg-bg px-2 text-xs text-muted"
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function SearchPick({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: { id: string; label: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="relative min-w-0 flex-1">
      <button
        type="button"
        className="d4-input flex w-full items-center justify-between text-left text-gold"
        onClick={() => setOpen((v) => !v)}
      >
        <span>
          {selected.length} {label}
        </span>
        <Search className="size-3.5 text-subtle" />
      </button>
      {open ? (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto border border-border bg-bg p-2 shadow-panel">
          <input
            className="d4-input mb-2 w-full"
            placeholder="Search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <ul className="flex flex-col gap-1">
            {filtered.map((o) => (
              <li key={o.id}>
                <label className="flex min-h-9 cursor-pointer items-center gap-2 px-1 text-xs">
                  <input
                    type="checkbox"
                    className="d4-check"
                    checked={selected.includes(o.id)}
                    onChange={() =>
                      onChange(
                        selected.includes(o.id)
                          ? selected.filter((x) => x !== o.id)
                          : [...selected, o.id],
                      )
                    }
                  />
                  {o.label}
                </label>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function ConditionRow({
  condition,
  onChange,
  onRemove,
}: {
  condition: Condition;
  onChange: (c: Condition) => void;
  onRemove: () => void;
}) {
  function switchKind(kind: ConditionKind) {
    const base = { ...condition, kind } as Condition;
    onChange(base.kind === kind ? retarget(kind) : retarget(kind));
  }

  function retarget(kind: ConditionKind): Condition {
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

  return (
    <div className="grid grid-cols-1 gap-2 border-b border-border py-2 md:grid-cols-[minmax(0,200px)_minmax(0,1fr)_auto] md:items-start">
      <select
        className="d4-select w-full"
        value={condition.kind}
        onChange={(e) => switchKind(e.target.value as ConditionKind)}
        aria-label="Condition"
      >
        {KINDS.map((k) => (
          <option key={k} value={k}>
            {CONDITION_LABEL[k]}
          </option>
        ))}
      </select>
      <div className="min-w-0">
        {condition.kind === "itemPower" ? (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted">Min</span>
            <input
              className="d4-input w-20"
              type="number"
              min={0}
              max={1000}
              value={condition.min}
              onChange={(e) =>
                onChange({ ...condition, min: Number(e.target.value) })
              }
            />
            <span className="text-muted">Max</span>
            <input
              className="d4-input w-20"
              type="number"
              min={0}
              max={1000}
              value={condition.max}
              onChange={(e) =>
                onChange({ ...condition, max: Number(e.target.value) })
              }
            />
          </div>
        ) : null}
        {condition.kind === "rarity" ? (
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {RARITIES.map((r) => (
              <label key={r} className="flex min-h-8 items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  className="d4-check"
                  checked={condition.rarities.includes(r)}
                  onChange={() => {
                    const rarities = condition.rarities.includes(r)
                      ? condition.rarities.filter((x) => x !== r)
                      : [...condition.rarities, r];
                    onChange({ ...condition, rarities });
                  }}
                />
                {RARITY_LABEL[r as Rarity]}
              </label>
            ))}
          </div>
        ) : null}
        {condition.kind === "properties" ? (
          <div className="flex flex-wrap gap-4 text-xs">
            <label className="flex min-h-8 items-center gap-1.5">
              <input
                type="checkbox"
                className="d4-check"
                checked={condition.ancestral}
                onChange={() =>
                  onChange({ ...condition, ancestral: !condition.ancestral })
                }
              />
              Ancestral
            </label>
            <label className="flex min-h-8 items-center gap-1.5">
              <input
                type="checkbox"
                className="d4-check"
                checked={condition.mythic}
                onChange={() => onChange({ ...condition, mythic: !condition.mythic })}
              />
              Mythic
            </label>
          </div>
        ) : null}
        {condition.kind === "codex" ? (
          <label className="flex min-h-8 items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              className="d4-check"
              checked={condition.enabled}
              onChange={() => onChange({ ...condition, enabled: !condition.enabled })}
            />
            Codex Upgrade Check
          </label>
        ) : null}
        {condition.kind === "greaterAffix" ? (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              className="d4-select"
              value={condition.compare}
              onChange={(e) =>
                onChange({
                  ...condition,
                  compare: e.target.value as "atLeast" | "fewerThan",
                })
              }
            >
              <option value="atLeast">Must have at least</option>
              <option value="fewerThan">Must have fewer than</option>
            </select>
            <select
              className="d4-select w-16"
              value={condition.atLeast}
              onChange={(e) =>
                onChange({ ...condition, atLeast: Number(e.target.value) })
              }
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span className="text-muted">Greater Affixes</span>
          </div>
        ) : null}
        {condition.kind === "itemType" ? (
          <div className="flex flex-col gap-2">
            <label className="flex min-h-8 items-center gap-1.5 text-xs">
              <input
                type="checkbox"
                className="d4-check"
                checked={condition.allClasses}
                onChange={() =>
                  onChange({ ...condition, allClasses: !condition.allClasses })
                }
              />
              Show All Classes
            </label>
            {ITEM_TYPE_GROUPS.map((g) => (
              <div key={g.group}>
                <p className="mb-1 text-[10px] tracking-widest text-subtle uppercase">
                  {g.group}
                </p>
                <ChipList
                  options={g.types}
                  selected={condition.types}
                  onToggle={(id) =>
                    onChange({
                      ...condition,
                      types: condition.types.includes(id)
                        ? condition.types.filter((t) => t !== id)
                        : [...condition.types, id],
                    })
                  }
                />
              </div>
            ))}
          </div>
        ) : null}
        {condition.kind === "requiredAffixes" || condition.kind === "optionalAffixes" ? (
          <div className="flex flex-col gap-2">
            <SearchPick
              label={condition.affixes.length === 1 ? "Affix selected" : "Affixes selected"}
              options={AFFIXES.map((a) => ({ id: a.id, label: a.label }))}
              selected={condition.affixes}
              onChange={(affixes) => onChange({ ...condition, affixes })}
            />
            <label className="flex flex-wrap items-center gap-2 text-xs">
              Must have at least
              <select
                className="d4-select w-16"
                value={condition.atLeast}
                onChange={(e) =>
                  onChange({ ...condition, atLeast: Number(e.target.value) })
                }
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              of the selected affixes
            </label>
            {condition.affixes.length > 0 ? (
              <p className="text-xs text-gold">
                {condition.affixes.map(affixLabel).join(" · ")}
              </p>
            ) : null}
          </div>
        ) : null}
        {condition.kind === "unique" ? (
          <SearchPick
            label={condition.names.length === 1 ? "Unique selected" : "Uniques selected"}
            options={UNIQUES.map((u) => ({ id: u.name, label: u.name }))}
            selected={condition.names}
            onChange={(names) => onChange({ ...condition, names })}
          />
        ) : null}
        {condition.kind === "talismanSet" ? (
          <ChipList
            options={TALISMAN_SETS}
            selected={condition.sets}
            onToggle={(id) =>
              onChange({
                ...condition,
                sets: condition.sets.includes(id)
                  ? condition.sets.filter((s) => s !== id)
                  : [...condition.sets, id],
              })
            }
          />
        ) : null}
      </div>
      <button
        type="button"
        className="d4-btn-ghost size-8 px-0"
        aria-label="Remove condition"
        onClick={onRemove}
      >
        ×
      </button>
    </div>
  );
}

