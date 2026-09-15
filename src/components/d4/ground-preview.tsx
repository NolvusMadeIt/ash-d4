import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { generateGroundDrops, seedFromFilter } from "@/lib/d4/drops";
import { matchItem } from "@/lib/d4/evaluate";
import { slotIcon } from "@/lib/d4/icons";
import type { GroundDrop } from "@/lib/d4/types";
import { useAsh } from "@/lib/store";
import { cn } from "@/lib/utils";
import { GaStar, ItemTooltip } from "@/components/d4/item-tooltip";

const RARITY_CLASS: Record<string, string> = {
  common: "text-rarity-common",
  magic: "text-rarity-magic",
  rare: "text-rarity-rare",
  legendary: "text-rarity-legendary",
  unique: "text-rarity-unique",
  mythic: "text-rarity-mythic",
};

export function GroundPreview() {
  const filter = useAsh((s) => s.active());
  const reshuffleGround = useAsh((s) => s.reshuffleGround);
  const [tip, setTip] = useState<{ item: GroundDrop; x: number; y: number } | null>(null);

  const drops = useMemo(
    () => generateGroundDrops(seedFromFilter(filter.id, filter.scatterSeed || 1), 14),
    [filter.id, filter.scatterSeed],
  );

  const rows = drops.map((item) => ({ item, match: matchItem(filter, item) }));
  const visible = rows.filter((r) => r.match.visibility !== "hideAll");
  const hidden = rows.filter((r) => r.match.visibility === "hideAll");

  return (
    <section className="d4-panel relative">
      <header className="d4-head-stone relative flex h-10 items-center justify-between px-3">
        <span className="w-20" />
        <span>Ground</span>
        <button
          type="button"
          className="d4-btn-ghost h-7 px-2 text-xs tracking-widest"
          onClick={reshuffleGround}
        >
          Scatter
        </button>
      </header>
      <div className="ground-stage">
        {visible.length === 0 ? (
          <p className="absolute inset-0 grid place-items-center px-6 text-center font-loot text-sm text-muted">
            The floor is clean. Toggle the filter off in-game to compare.
          </p>
        ) : (
          visible.map(({ item, match }) => {
            const hiddenLabel = match.visibility === "hideLabel";
            const color =
              match.visibility === "recolor" && match.color ? match.color : undefined;
            const stars = item.greaterAffixes;
            return (
              <button
                key={item.id}
                type="button"
                className="loot-drop"
                style={{
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  transform: `translate(-50%, -50%) rotate(${item.rot}deg)`,
                  color,
                  opacity: hiddenLabel ? 0.38 : 1,
                }}
                onPointerEnter={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  setTip({ item, x: r.right + 10, y: r.top - 24 });
                }}
                onPointerLeave={() => setTip(null)}
                onFocus={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  setTip({ item, x: r.right + 10, y: r.top - 24 });
                }}
                onBlur={() => setTip(null)}
              >
                <img
                  src={item.icon}
                  alt=""
                  width={28}
                  height={28}
                  onError={(e) => {
                    e.currentTarget.src = slotIcon(item.slot);
                  }}
                />
                <span className={cn("loot-drop-name", color ? undefined : RARITY_CLASS[item.rarity])}>
                  {hiddenLabel ? "· · ·" : item.name}
                  {!hiddenLabel && stars > 0
                    ? Array.from({ length: Math.min(stars, 4) }, (_, i) => (
                        <GaStar key={i} className="loot-ga" />
                      ))
                    : null}
                </span>
              </button>
            );
          })
        )}
      </div>
      {hidden.length > 0 ? (
        <p className="relative border-t border-border px-4 py-2 font-sans text-xs leading-relaxed text-subtle">
          Hidden ({hidden.length}): {hidden.map((h) => h.item.name).join(" · ")}
        </p>
      ) : null}
      {tip ? createPortal(<ItemTooltip item={tip.item} x={tip.x} y={tip.y} />, document.body) : null}
    </section>
  );
}
