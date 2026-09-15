import { useState } from "react";
import { createPortal } from "react-dom";
import { DEMO_DROPS } from "@/lib/d4/presets";
import { matchItem } from "@/lib/d4/evaluate";
import { RARITY_LABEL, typeLabel } from "@/lib/d4/catalog";
import type { DropItem } from "@/lib/d4/types";
import { useAsh } from "@/lib/store";
import { cn } from "@/lib/utils";

const RARITY_CLASS: Record<string, string> = {
  common: "text-rarity-common",
  magic: "text-rarity-magic",
  rare: "text-rarity-rare",
  legendary: "text-rarity-legendary",
  unique: "text-rarity-unique",
  mythic: "text-rarity-mythic",
};

function Tip({ item, x, y }: { item: DropItem; x: number; y: number }) {
  return (
    <div
      className="pointer-events-none fixed z-50 w-72 border border-gold/50 bg-[#0c0a08] p-3 shadow-panel"
      style={{ left: x, top: y }}
    >
      <p className={cn("text-center text-sm font-semibold", RARITY_CLASS[item.rarity])}>
        {item.ancestral ? "Ancestral " : ""}
        {item.name}
      </p>
      <p className="mt-1 text-center text-[11px] tracking-widest text-muted uppercase">
        {RARITY_LABEL[item.rarity]} · {typeLabel(item.slot)} · {item.itemPower} IP
      </p>
      {item.greaterAffixes > 0 ? (
        <p className="mt-1 text-center text-xs text-rarity-legendary">
          {item.greaterAffixes} Greater Affix{item.greaterAffixes > 1 ? "es" : ""}
        </p>
      ) : null}
      {item.codexUpgrade ? (
        <p className="mt-1 text-center text-xs text-ok">Codex upgrade</p>
      ) : null}
      <ul className="mt-2 space-y-0.5 text-center text-xs text-fg">
        {item.affixes.map((a) => (
          <li key={a}>+ {a.replaceAll("_", " ")}</li>
        ))}
      </ul>
    </div>
  );
}

export function GroundPreview() {
  const filter = useAsh((s) => s.active());
  const [tip, setTip] = useState<{ item: DropItem; x: number; y: number } | null>(null);

  const rows = DEMO_DROPS.map((item) => ({ item, match: matchItem(filter, item) }));
  const visible = rows.filter((r) => r.match.visibility !== "hideAll");
  const hidden = rows.filter((r) => r.match.visibility === "hideAll");

  return (
    <section className="d4-panel relative overflow-hidden">
      <div className="d4-pentagram pointer-events-none absolute inset-0" />
      <header className="d4-head-stone relative flex h-10 items-center justify-center">
        Ground
      </header>
      <div className="relative flex flex-col gap-2 p-4">
        {visible.length === 0 ? (
          <p className="text-sm text-muted">The floor is clean. Toggle the filter off in-game to compare.</p>
        ) : (
          visible.map(({ item, match }, i) => {
            const hiddenLabel = match.visibility === "hideLabel";
            const color =
              match.visibility === "recolor" && match.color ? match.color : undefined;
            return (
              <button
                key={item.id}
                type="button"
                className="item-label min-h-11 w-fit max-w-full truncate px-2 text-left text-sm"
                style={{
                  marginLeft: `${(i % 5) * 18}px`,
                  color: color,
                  opacity: hiddenLabel ? 0.35 : 1,
                }}
                onMouseEnter={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  setTip({ item, x: r.right + 8, y: r.top });
                }}
                onMouseLeave={() => setTip(null)}
              >
                <span className={color ? undefined : RARITY_CLASS[item.rarity]}>
                  {hiddenLabel ? "· · ·" : item.name}
                </span>
              </button>
            );
          })
        )}
      </div>
      {hidden.length > 0 ? (
        <p className="relative border-t border-border px-4 py-2 text-xs text-subtle">
          Hidden ({hidden.length}): {hidden.map((h) => h.item.name).join(" · ")}
        </p>
      ) : null}
      {tip
        ? createPortal(<Tip item={tip.item} x={tip.x} y={tip.y} />, document.body)
        : null}
    </section>
  );
}
