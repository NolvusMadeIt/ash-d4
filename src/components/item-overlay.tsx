import {
  ExternalLink,
  Eye,
  EyeOff,
} from "lucide-react";
import { ItemPortrait } from "@/components/item-portrait";
import { ItemStats } from "@/components/item-tooltip";
import { RuleEditor } from "@/components/rule-editor";
import { Button } from "@/components/ui/button";
import { matchingRule, type Rgb } from "@/lib/poe/filter";
import type { ItemRarity, ParsedItem } from "@/lib/poe/parse-item";
import { formatPrice, lookupUnique } from "@/lib/poe/catalog";
import { itemDisplayName } from "@/lib/poe/item-stats";
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

const GEAR_RARITIES: ItemRarity[] = ["Normal", "Magic", "Rare", "Unique"];

function wikiUrl(base: string) {
  return `https://www.poe2wiki.net/wiki/${encodeURIComponent(base.replace(/ /g, "_"))}`;
}

function poedbUrl(base: string) {
  return `https://poe2db.tw/us/${encodeURIComponent(base.replace(/ /g, "_"))}`;
}

function ColorChip({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Rgb;
  onChange: (c: Rgb) => void;
}) {
  const hex = rgbToHex(value);
  return (
    <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-2 rounded-sm border border-border bg-bg px-3">
      <input
        type="color"
        value={hex}
        onChange={(e) => onChange(hexToRgb(e.target.value))}
        className="size-5 cursor-pointer rounded-sm border-0 bg-transparent p-0"
      />
      <span className="text-xs font-medium tracking-wide text-muted">{label}</span>
    </label>
  );
}

function rgbToHex(c: Rgb) {
  const h = (n: number) => n.toString(16).padStart(2, "0");
  return `#${h(c.r)}${h(c.g)}${h(c.b)}`;
}

function hexToRgb(hex: string): Rgb {
  const n = hex.replace("#", "");
  return {
    r: Number.parseInt(n.slice(0, 2), 16),
    g: Number.parseInt(n.slice(2, 4), 16),
    b: Number.parseInt(n.slice(4, 6), 16),
  };
}

export function ItemOverlay({ item }: { item: ParsedItem }) {
  const { rules, setAction, patchRule, toggleRarity, catalog, league } = useCull();
  const rule = matchingRule(rules, item);
  const hidden = rule?.action === "Hide";
  const rarities = rule?.rarities ?? [item.rarity];
  const scout = lookupUnique(item.name, catalog);
  const price = formatPrice(scout?.price ?? 0);
  const { title, subtitle } = itemDisplayName(item);

  return (
    <section className="rounded-xl border border-border bg-surface p-4 shadow-panel">
      <div className="flex items-start gap-3">
        <div className="flex size-16 items-center justify-center rounded-md bg-elevated p-1">
          <ItemPortrait item={item} />
        </div>
        <div className="min-w-0 flex-1">
          <h2
            className={cn(
              "truncate text-lg font-semibold leading-snug",
              RARITY_CLASS[item.rarity] ?? "text-fg",
            )}
          >
            {title}
          </h2>
          <p className="text-xs text-muted">
            {subtitle ? `${subtitle} · ` : null}
            {item.className}
            {item.itemLevel != null ? ` · iLvl ${item.itemLevel}` : null}
            {item.quality != null && item.quality > 0 ? ` · Q${item.quality}%` : null}
          </p>
          {price ? (
            <p className="mt-1 text-xs text-muted">
              {price}
              {league ? ` · ${league}` : ""}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <a
              href={wikiUrl(item.baseType)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 items-center gap-1 rounded-sm border border-border bg-elevated px-2 text-xs text-muted hover:text-fg"
            >
              Wiki <ExternalLink className="size-3" />
            </a>
            <a
              href={poedbUrl(item.baseType)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 items-center gap-1 rounded-sm border border-border bg-elevated px-2 text-xs text-muted hover:text-fg"
            >
              PoEDB <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button
          variant={hidden ? "ghost" : "default"}
          onClick={() => setAction("Show")}
        >
          <Eye />
          Show
        </Button>
        <Button
          variant={hidden ? "danger" : "ghost"}
          onClick={() => setAction("Hide")}
        >
          <EyeOff />
          Hide
        </Button>
      </div>

      <p className="mt-3 text-xs leading-snug text-muted">
        {hidden ? (
          <>
            Hidden in every zone — not an area-level tier. Export the .filter and
            reload it in-game or the ground will not change.
          </>
        ) : (
          <>
            Hide writes a top-of-file rule with no AreaLevel, so campaign floors
            actually go dark. Build items stay shown on the NeverSink template.
          </>
        )}
      </p>

      <div className="mt-4">
        <ItemStats item={item} />
      </div>

      {item.rarity !== "Currency" && item.rarity !== "Gem" ? (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium tracking-wide text-subtle uppercase">
            Apply to rarities
          </p>
          <div className="flex flex-wrap gap-1.5">
            {GEAR_RARITIES.map((r) => {
              const on = rarities.includes(r);
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => toggleRarity(r)}
                  className={cn(
                    "h-9 rounded-sm border px-3 text-xs font-medium",
                    on
                      ? cn("border-border-strong bg-elevated", RARITY_CLASS[r])
                      : "border-border text-subtle",
                  )}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-4 rounded-md border border-border bg-elevated p-3">
        <p className="mb-2 text-xs font-medium tracking-wide text-subtle uppercase">
          Ground label
        </p>
        <div className="flex flex-col gap-2">
          <ColorChip
            label="Text"
            value={rule?.text ?? { r: 200, g: 220, b: 180 }}
            onChange={(text) => patchRule({ text, action: rule?.action ?? "Show" })}
          />
          <ColorChip
            label="Border"
            value={rule?.border ?? { r: 20, g: 20, b: 22 }}
            onChange={(border) =>
              patchRule({ border, action: rule?.action ?? "Show" })
            }
          />
          <ColorChip
            label="Back"
            value={rule?.background ?? { r: 12, g: 12, b: 14 }}
            onChange={(background) =>
              patchRule({ background, action: rule?.action ?? "Show" })
            }
          />
        </div>
        <label className="mt-3 block">
          <span className="text-xs text-muted">Font size {rule?.fontSize ?? 32}</span>
          <input
            type="range"
            min={18}
            max={45}
            value={rule?.fontSize ?? 32}
            onChange={(e) =>
              patchRule({
                fontSize: Number(e.target.value),
                action: rule?.action ?? "Show",
              })
            }
            className="mt-1 w-full accent-accent"
          />
        </label>
      </div>

      <div className="mt-4">
        <RuleEditor rule={rule} onPatch={patchRule} />
      </div>
    </section>
  );
}
