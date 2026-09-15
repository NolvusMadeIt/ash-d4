import type { CSSProperties, ReactNode } from "react";

import { parseItemTip, rarityHeader, rarityTone, type ItemTip } from "@/lib/poe/item-stats";
import type { ParsedItem } from "@/lib/poe/parse-item";
import { cn } from "@/lib/utils";

function classLabel(tip: ItemTip): string {
  const raw =
    !tip.className || tip.className === "Unknown"
      ? (tip.baseType ?? "")
      : tip.className;
  return raw.replace(/s$/i, "").toUpperCase();
}

function TipSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-5 py-2 text-center", className)}>{children}</div>
  );
}

function Hairline() {
  return <div className="mx-6 h-px bg-tip-frame/35" />;
}

function ItemTipBody({ item }: { item: ParsedItem }) {
  const tip = parseItemTip(item);
  const klass = classLabel(tip);
  const hasProps = tip.properties.length > 0;
  const hasMods =
    tip.enchants.length +
      tip.implicits.length +
      tip.explicits.length +
      tip.crafted.length >
    0;

  return (
    <div className="bg-tooltip text-xs leading-snug">
      <div
        className={cn(
          "item-tip-header relative px-7 py-2 text-center",
          rarityHeader(tip.rarity),
        )}
      >
        <p className="font-semibold tracking-widest uppercase">{tip.title}</p>
      </div>

      {klass ? (
        <TipSection className="pt-3">
          <p className="text-xs tracking-widest text-muted uppercase underline decoration-muted/60 underline-offset-4">
            {klass}
          </p>
        </TipSection>
      ) : null}

      {hasProps ? (
        <TipSection className={klass ? "pt-1" : "pt-3"}>
          {tip.properties.map((p) => (
            <p key={p.label} className="text-xs tracking-wide text-muted uppercase">
              {p.value ? (
                <>
                  {p.label}: <span className="text-fg">{p.value}</span>
                </>
              ) : (
                <span className="text-fg">{p.label}</span>
              )}
            </p>
          ))}
        </TipSection>
      ) : null}

      {tip.requires ? (
        <TipSection className="pt-1 pb-3">
          <p className="text-xs tracking-widest text-muted uppercase underline decoration-muted/50 underline-offset-4">
            {tip.requires}
          </p>
        </TipSection>
      ) : null}

      {hasMods ? (
        <>
          <Hairline />
          <TipSection className="py-3">
            {tip.enchants.map((line) => (
              <p key={`e-${line}`} className="text-rarity-magic">
                {line}
              </p>
            ))}
            {tip.implicits.map((line) => (
              <p key={`i-${line}`} className="text-fg">
                {line}
              </p>
            ))}
            {tip.enchants.length + tip.implicits.length > 0 &&
            tip.explicits.length + tip.crafted.length > 0 ? (
              <div className="mx-auto my-2 h-px w-16 bg-tip-frame/35" />
            ) : null}
            {tip.explicits.map((line) => (
              <p key={`x-${line}`} className={rarityTone(tip.rarity)}>
                {line}
              </p>
            ))}
            {tip.crafted.map((line) => (
              <p key={`c-${line}`} className="text-rarity-magic">
                {line}
              </p>
            ))}
          </TipSection>
        </>
      ) : null}

      {tip.unidentified ? (
        <TipSection className="pb-3">
          <p className="text-sm text-danger">Unidentified</p>
        </TipSection>
      ) : null}

      {tip.corrupted ? (
        <TipSection className="pb-3">
          <p className="text-sm text-danger">Corrupted</p>
        </TipSection>
      ) : null}
    </div>
  );
}

export function ItemStats({
  item,
  className,
}: {
  item: ParsedItem;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-sm border border-tip-frame/40", className)}>
      <ItemTipBody item={item} />
    </div>
  );
}

export function ItemTooltipCard({
  item,
  style,
}: {
  item: ParsedItem;
  style?: CSSProperties;
}) {
  return (
    <div
      role="tooltip"
      style={style}
      className="pointer-events-none fixed z-50 w-80 max-w-[calc(100vw-1.5rem)] overflow-hidden border border-tip-frame/50 shadow-panel"
    >
      <ItemTipBody item={item} />
    </div>
  );
}
