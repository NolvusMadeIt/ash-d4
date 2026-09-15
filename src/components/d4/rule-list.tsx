import { ChevronDown, ChevronUp, Copy, Trash2 } from "lucide-react";
import { ruleSummary } from "@/lib/d4/evaluate";
import { useAsh } from "@/lib/store";

export function RuleList() {
  const {
    selectedRuleId,
    selectRule,
    addRule,
    moveRule,
    duplicateRule,
    removeRule,
    toggleRule,
    enableAll,
    filters,
    setActive,
    openModal,
  } = useAsh();
  const filter = useAsh((s) => s.active());
  const count = filter.rules.length;

  return (
    <section className="d4-panel flex h-full min-h-0 flex-col overflow-hidden">
      <header className="d4-head-gold flex h-10 items-center justify-center">
        Selected Loot Filter
      </header>
      <div className="flex flex-col gap-2 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="d4-btn" onClick={() => openModal("create")}>
            New Filter
          </button>
          <select
            className="d4-select min-w-0 flex-1"
            value={filter.id}
            onChange={(e) => setActive(e.target.value)}
            aria-label="Selected loot filter"
          >
            {filters.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <FilterMenu />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="d4-btn" onClick={addRule} disabled={count >= 25}>
            Add Rule
          </button>
          <span className="text-xs text-muted">
            {count} / 25
          </span>
          <span className="ml-auto flex gap-2">
            <button type="button" className="d4-btn-ghost" onClick={() => enableAll(true)}>
              Enable All
            </button>
            <button type="button" className="d4-btn-ghost" onClick={() => enableAll(false)}>
              Disable All
            </button>
          </span>
        </div>
      </div>
      <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-auto px-3 pb-3">
        {filter.rules.length === 0 ? (
          <li className="py-8 text-center text-sm text-muted">
            No rules yet. Add a rule, then stack conditions on the right.
          </li>
        ) : (
          filter.rules.map((r, i) => {
            const active = r.id === selectedRuleId;
            return (
              <li key={r.id}>
                <div
                  data-active={active}
                  className="d4-rule flex items-stretch"
                >
                  <div className="flex flex-col border-r border-border">
                    <button
                      type="button"
                      className="grid size-8 place-items-center text-fg disabled:text-subtle"
                      aria-label="Move rule up"
                      disabled={i === 0}
                      onClick={() => moveRule(r.id, -1)}
                    >
                      <ChevronUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      className="grid size-8 place-items-center text-fg disabled:text-subtle"
                      aria-label="Move rule down"
                      disabled={i === filter.rules.length - 1}
                      onClick={() => moveRule(r.id, 1)}
                    >
                      <ChevronDown className="size-3.5" />
                    </button>
                  </div>
                  <label className="grid w-8 place-items-center border-r border-border">
                    <input
                      type="checkbox"
                      className="d4-check"
                      checked={r.enabled}
                      onChange={() => toggleRule(r.id)}
                      aria-label={`Enable ${r.name}`}
                    />
                  </label>
                  <button
                    type="button"
                    className="min-h-11 min-w-0 flex-1 truncate px-3 text-left text-sm tracking-wide uppercase"
                    onClick={() => selectRule(r.id)}
                  >
                    {ruleSummary(r)}
                  </button>
                  <button
                    type="button"
                    className="grid size-10 place-items-center text-muted hover:text-fg"
                    aria-label={`Duplicate ${r.name}`}
                    onClick={() => duplicateRule(r.id)}
                  >
                    <Copy className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    className="grid size-10 place-items-center text-muted hover:text-danger-fg"
                    aria-label={`Delete ${r.name}`}
                    onClick={() => removeRule(r.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </li>
            );
          })
        )}
      </ul>
      <p className="border-t border-border px-3 py-2 text-center text-[11px] text-subtle">
        Rules are prioritized in descending order (from top to bottom)
      </p>
    </section>
  );
}

function FilterMenu() {
  const { duplicateActive, deleteActive, exportActive, openModal } = useAsh();
  return (
    <details className="relative">
      <summary className="d4-btn list-none px-2 marker:hidden">···</summary>
      <div className="absolute right-0 z-30 mt-1 min-w-40 border border-border bg-bg py-1">
        <button
          type="button"
          className="block w-full px-3 py-2 text-left text-sm text-fg hover:bg-elevated"
          onClick={() => openModal("rename")}
        >
          Rename
        </button>
        <button
          type="button"
          className="block w-full px-3 py-2 text-left text-sm text-fg hover:bg-elevated"
          onClick={duplicateActive}
        >
          Duplicate
        </button>
        <button
          type="button"
          className="block w-full px-3 py-2 text-left text-sm text-fg hover:bg-elevated"
          onClick={async () => {
            const code = exportActive();
            try {
              await navigator.clipboard.writeText(code);
            } catch {
              /* ignore */
            }
          }}
        >
          Export
        </button>
        <button
          type="button"
          className="block w-full px-3 py-2 text-left text-sm text-blood-bright hover:bg-elevated"
          onClick={deleteActive}
        >
          Delete
        </button>
      </div>
    </details>
  );
}
