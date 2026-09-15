import { Pencil } from "lucide-react";
import { useState } from "react";
import { ConditionRow } from "@/components/d4/condition-row";
import { CONDITION_LABEL, RECOLOR_PRESETS, VISIBILITY_LABEL } from "@/lib/d4/catalog";
import { VISIBILITY, type ConditionKind } from "@/lib/d4/types";
import { useAsh } from "@/lib/store";

export function RuleEditor() {
  const rule = useAsh((s) => s.selectedRule());
  const { patchRule, addCondition, patchCondition, removeCondition } = useAsh();
  const [editing, setEditing] = useState(false);

  if (!rule) {
    return (
      <section className="d4-panel flex min-h-0 flex-col">
        <header className="d4-head-stone flex h-10 items-center justify-center">
          Rule Editor
        </header>
        <p className="p-6 text-sm text-muted">
          Select a rule on the left, or add one. Conditions on a rule are AND —
          the item has to match every row.
        </p>
      </section>
    );
  }

  return (
    <section className="d4-panel flex min-h-0 flex-col">
      <header className="d4-head-stone flex h-10 items-center justify-center">
        Rule Editor
      </header>
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        {editing ? (
          <input
            className="d4-input min-w-0 flex-1"
            value={rule.name}
            autoFocus
            onChange={(e) => patchRule(rule.id, { name: e.target.value })}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setEditing(false);
            }}
            aria-label="Rule name"
          />
        ) : (
          <h2 className="min-w-0 flex-1 truncate text-center text-sm tracking-[0.18em] text-gold uppercase">
            {rule.name}
          </h2>
        )}
        <button
          type="button"
          className="d4-btn-ghost size-8 px-0"
          aria-label="Rename rule"
          onClick={() => setEditing(true)}
        >
          <Pencil className="mx-auto size-3.5" />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2 px-3 py-3">
        <AddCondition onAdd={addCondition} />
        <label className="ml-auto flex items-center gap-2 text-xs tracking-widest text-muted uppercase">
          Visibility
          <select
            className="d4-select"
            value={rule.visibility}
            onChange={(e) =>
              patchRule(rule.id, {
                visibility: e.target.value as (typeof VISIBILITY)[number],
              })
            }
          >
            {VISIBILITY.map((v) => (
              <option key={v} value={v}>
                {VISIBILITY_LABEL[v]}
              </option>
            ))}
          </select>
        </label>
        {rule.visibility === "recolor" ? (
          <label className="flex items-center gap-2 text-xs text-muted">
            Color
            <input
              type="color"
              value={rule.color}
              onChange={(e) => patchRule(rule.id, { color: e.target.value })}
              className="size-7 cursor-pointer border border-border bg-transparent p-0"
            />
            <span className="flex gap-1">
              {RECOLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="size-4 border border-border"
                  style={{ background: c }}
                  aria-label={c}
                  onClick={() => patchRule(rule.id, { color: c })}
                />
              ))}
            </span>
          </label>
        ) : null}
      </div>
      <div className="grid grid-cols-[minmax(0,200px)_minmax(0,1fr)_auto] gap-2 border-y border-border px-3 py-1 text-[10px] tracking-[0.18em] text-subtle uppercase max-md:hidden">
        <span>Condition</span>
        <span>Property</span>
        <span />
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-3">
        {rule.conditions.length === 0 ? (
          <p className="py-6 text-sm text-muted">
            Add a condition. Start with rarity or greater affixes.
          </p>
        ) : (
          rule.conditions.map((c, i) => (
            <ConditionRow
              key={`${rule.id}-${i}-${c.kind}`}
              condition={c}
              onChange={(next) => patchCondition(i, next)}
              onRemove={() => removeCondition(i)}
            />
          ))
        )}
      </div>
      <p className="border-t border-border px-3 py-2 text-center text-[11px] text-subtle">
        An item must meet ALL of a rule's conditions to apply
      </p>
    </section>
  );
}

function AddCondition({ onAdd }: { onAdd: (k: ConditionKind) => void }) {
  return (
    <label className="flex items-center gap-2">
      <span className="sr-only">Add condition</span>
      <select
        className="d4-select"
        defaultValue=""
        onChange={(e) => {
          const v = e.target.value as ConditionKind;
          if (v) onAdd(v);
          e.currentTarget.value = "";
        }}
      >
        <option value="">Add Condition</option>
        {(Object.keys(CONDITION_LABEL) as ConditionKind[]).map((k) => (
          <option key={k} value={k}>
            {CONDITION_LABEL[k]}
          </option>
        ))}
      </select>
    </label>
  );
}
