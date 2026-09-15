import { DEMO_ITEMS } from "@/lib/poe/demo-items";
import { matchingRule } from "@/lib/poe/filter";
import { parseItem } from "@/lib/poe/parse-item";
import { useCull } from "@/lib/store";
import { cn } from "@/lib/utils";

const RARITY_CLASS: Record<string, string> = {
  Normal: "text-rarity-normal",
  Magic: "text-rarity-magic",
  Rare: "text-rarity-rare",
  Unique: "text-rarity-unique",
  Currency: "text-rarity-currency",
  Gem: "text-rarity-gem",
};

export function GroundDrops() {
  const ingestText = useCull((s) => s.ingestText);
  const current = useCull((s) => s.item);
  const rules = useCull((s) => s.rules);

  const parsedItems = DEMO_ITEMS.map((d) => ({
    demo: d,
    item: parseItem(d.raw),
  }));
  const visible = parsedItems.filter((row) => {
    if (!row.item) return true;
    return matchingRule(rules, row.item)?.action !== "Hide";
  });
  const hidden = parsedItems.filter((row) => {
    if (!row.item) return false;
    return matchingRule(rules, row.item)?.action === "Hide";
  });

  return (
    <section className="relative min-h-[280px] overflow-hidden rounded-xl border border-border bg-elevated p-5">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, color-mix(in oklab, var(--color-fg) 6%, transparent), transparent 40%), radial-gradient(circle at 80% 70%, color-mix(in oklab, var(--color-fg) 4%, transparent), transparent 45%)",
        }}
      />
      <p className="relative mb-4 text-xs font-medium tracking-wide text-subtle uppercase">
        Ground — hidden items leave
      </p>
      {visible.length === 0 ? (
        <p className="relative text-sm text-muted">No labels on the ground.</p>
      ) : (
        <ul className="relative flex flex-col gap-3">
          {visible.map((row, i) => {
            const active = current?.raw === row.demo.raw;
            return (
              <li key={row.demo.id} style={{ paddingLeft: `${(i % 5) * 12}px` }}>
                <button
                  type="button"
                  onClick={() => ingestText(row.demo.raw, "ground")}
                  className={cn(
                    "min-h-11 rounded-sm px-2 text-left text-sm font-medium underline-offset-4 hover:underline",
                    row.item ? RARITY_CLASS[row.item.rarity] : "text-fg",
                    active && "bg-surface ring-1 ring-border-strong",
                  )}
                >
                  {row.item?.name ?? row.demo.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {hidden.length > 0 ? (
        <div className="relative mt-5 border-t border-border pt-3">
          <p className="mb-2 text-xs font-medium tracking-wide text-subtle uppercase">
            Hidden ({hidden.length})
          </p>
          <ul className="flex flex-col gap-1">
            {hidden.map((row) => (
              <li key={row.demo.id}>
                <button
                  type="button"
                  onClick={() => ingestText(row.demo.raw, "ground")}
                  className="min-h-11 w-full truncate rounded-sm px-2 text-left text-sm text-subtle line-through hover:text-muted"
                >
                  {row.item?.name ?? row.demo.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
