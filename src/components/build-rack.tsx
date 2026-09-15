import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { ItemPortrait } from "@/components/item-portrait";
import { ItemTooltipCard } from "@/components/item-tooltip";
import { matchingRule } from "@/lib/poe/filter";
import { formatPrice } from "@/lib/poe/catalog";
import { itemDisplayName } from "@/lib/poe/item-stats";
import type { BuildPiece } from "@/lib/poe/pob";
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

const SLOT_ORDER = [
  "Helmet",
  "BodyArmour",
  "Gloves",
  "Boots",
  "Weapon",
  "Offhand",
  "Amulet",
  "Ring1",
  "Ring2",
  "Belt",
  "Gem",
];

function slotRank(slot: string) {
  const key = slot.replace(/\s+/g, "");
  const i = SLOT_ORDER.findIndex(
    (s) => s.toLowerCase() === key.toLowerCase() || key.toLowerCase().includes(s.toLowerCase()),
  );
  return i < 0 ? 99 : i;
}

function tipPosition(rect: DOMRect) {
  const width = 320;
  const pad = 8;
  let x = rect.right + pad;
  let y = rect.top;
  if (typeof window !== "undefined") {
    if (x + width > window.innerWidth - pad) x = rect.left - width - pad;
    if (x < pad) x = pad;
    const maxY = window.innerHeight - pad - 24;
    if (y > maxY - 120) y = Math.max(pad, maxY - 280);
  }
  return { left: x, top: y };
}

function Tile({
  piece,
  active,
  onTip,
}: {
  piece: BuildPiece;
  active: boolean;
  onTip: (piece: BuildPiece | null, rect?: DOMRect) => void;
}) {
  const { rules, selectPiece, setAction } = useCull();
  const rule = matchingRule(rules, piece.item);
  const hidden = rule?.action === "Hide";
  const { title, subtitle } = itemDisplayName(piece.item);
  const price = formatPrice(piece.price ?? 0);

  return (
    <div
      className={cn(
        "flex flex-col rounded-md border bg-elevated",
        active ? "border-border-strong" : "border-border",
      )}
      onMouseEnter={(e) => onTip(piece, e.currentTarget.getBoundingClientRect())}
      onMouseLeave={() => onTip(null)}
      onFocus={(e) => onTip(piece, e.currentTarget.getBoundingClientRect())}
      onBlur={() => onTip(null)}
    >
      <button
        type="button"
        onClick={() => selectPiece(piece.id)}
        className="flex min-h-11 flex-col items-center gap-2 px-2 pt-3 pb-2 text-center"
      >
        <ItemPortrait item={piece.item} />
        <span
          className={cn(
            "w-full truncate text-xs font-medium",
            RARITY_CLASS[piece.item.rarity] ?? "text-fg",
          )}
        >
          {title}
        </span>
        <span className="w-full truncate text-xs text-subtle">
          {subtitle ??
            (piece.item.className && piece.item.className !== "Unknown"
              ? piece.item.className
              : piece.slot)}
          {price ? ` · ${price}` : ""}
        </span>
      </button>
      <div className="grid grid-cols-2 border-t border-border">
        <button
          type="button"
          className={cn(
            "inline-flex h-11 items-center justify-center gap-1 text-xs",
            hidden ? "text-subtle" : "text-ok",
          )}
          onClick={() => {
            selectPiece(piece.id);
            setAction("Show", piece.item);
          }}
        >
          <Eye className="size-3.5" />
          Show
        </button>
        <button
          type="button"
          className={cn(
            "inline-flex h-11 items-center justify-center gap-1 border-l border-border text-xs",
            hidden ? "text-danger" : "text-subtle",
          )}
          onClick={() => {
            selectPiece(piece.id);
            setAction("Hide", piece.item);
          }}
        >
          <EyeOff className="size-3.5" />
          Hide
        </button>
      </div>
    </div>
  );
}

export function BuildRack() {
  const { buildPieces, buildName, item } = useCull();
  const [tip, setTip] = useState<{ piece: BuildPiece; left: number; top: number } | null>(
    null,
  );
  if (buildPieces.length === 0) return null;

  const ordered = [...buildPieces].sort((a, b) => slotRank(a.slot) - slotRank(b.slot));
  const gear = ordered.filter((p) => p.kind !== "gem");
  const gems = ordered.filter((p) => p.kind === "gem");

  function onTip(piece: BuildPiece | null, rect?: DOMRect) {
    if (!piece || !rect) {
      setTip(null);
      return;
    }
    setTip({ piece, ...tipPosition(rect) });
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold">Build items</h3>
        <p className="truncate text-xs text-muted">{buildName}</p>
      </div>
      <p className="mb-3 text-xs text-muted">
        Art is the base type (a Bloodstone Amulet shows as a Bloodstone Amulet). Hover for
        the in-game tooltip.
      </p>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {gear.map((p) => (
          <li key={p.id}>
            <Tile piece={p} active={item?.raw === p.item.raw} onTip={onTip} />
          </li>
        ))}
      </ul>
      {gems.length > 0 ? (
        <>
          <p className="mt-4 mb-2 text-xs font-medium tracking-wide text-subtle uppercase">
            Gems
          </p>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {gems.map((p) => (
              <li key={p.id}>
                <Tile piece={p} active={item?.raw === p.item.raw} onTip={onTip} />
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {tip
        ? createPortal(
            <ItemTooltipCard
              item={tip.piece.item}
              style={{ left: tip.left, top: tip.top }}
            />,
            document.body,
          )
        : null}
    </section>
  );
}
