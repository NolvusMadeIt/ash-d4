import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { slotIcon } from "@/lib/d4/icons";
import { KEYWORD_RE } from "@/lib/d4/tooltip";
import type { GroundDrop } from "@/lib/d4/types";
import { cn } from "@/lib/utils";

const RARITY_CLASS: Record<string, string> = {
  common: "text-rarity-common",
  magic: "text-rarity-magic",
  rare: "text-rarity-rare",
  legendary: "text-rarity-legendary",
  unique: "text-rarity-unique",
  mythic: "text-rarity-mythic",
};

export function GaStar({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn("d4-ga-star", className)}
      aria-hidden
    >
      <path d="M8 0.4 9.15 6.2 15.6 8 9.15 9.8 8 15.6 6.85 9.8 0.4 8 6.85 6.2Z" />
      <path d="M8 2.6 8.7 6.7 12.8 8 8.7 9.3 8 13.4 7.3 9.3 3.2 8 7.3 6.7Z" opacity="0.85" />
    </svg>
  );
}

function Diamond() {
  return <span className="d4-tip-diamond" aria-hidden />;
}

function Rule() {
  return (
    <div className="d4-tip-rule" aria-hidden>
      <span />
    </div>
  );
}

function highlight(text: string): ReactNode {
  const nodes: ReactNode[] = [];
  let last = 0;
  const re = new RegExp(KEYWORD_RE.source, "g");
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    nodes.push(
      <span key={k++} className="d4-tip-key">
        {m[0]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function ItemTooltip({
  item,
  x,
  y,
}: {
  item: GroundDrop;
  x: number;
  y: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    let nx = x;
    let ny = y;
    if (nx + w > window.innerWidth - 10) nx = Math.max(8, x - w - 20);
    if (nx < 8) nx = 8;
    if (ny + h > window.innerHeight - 8) ny = Math.max(8, window.innerHeight - h - 8);
    if (ny < 8) ny = 8;
    setPos({ x: nx, y: ny });
  }, [x, y, item.id]);

  const nameColor = RARITY_CLASS[item.rarity];
  const powerIsUnique = Boolean(item.uniqueName);

  return (
    <div
      ref={ref}
      className="d4-tip"
      style={{ left: pos.x, top: pos.y }}
      role="tooltip"
    >
      <span className="d4-tip-corner d4-tip-corner-tl" />
      <span className="d4-tip-corner d4-tip-corner-tr" />
      <span className="d4-tip-corner d4-tip-corner-bl" />
      <span className="d4-tip-corner d4-tip-corner-br" />

      <header className="d4-tip-head">
        <div className="d4-tip-titles">
          <p className={cn("d4-tip-name", nameColor)}>{item.name}</p>
          <p className="d4-tip-type">{item.typeLine}</p>
          <p className="d4-tip-ip">{item.itemPower.toLocaleString("en-US")} Item Power</p>
        </div>
        <img
          src={item.icon}
          alt=""
          width={56}
          height={56}
          className="d4-tip-icon"
          onError={(e) => {
            e.currentTarget.src = slotIcon(item.slot);
          }}
        />
      </header>

      {item.inherents.length > 0 ? (
        <>
          <Rule />
          <ul className="d4-tip-inherents">
            {item.inherents.map((line, i) => (
              <li key={i} className={line.indent ? "indent" : undefined}>
                {line.text}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {item.affixRolls.length > 0 ? (
        <>
          <Rule />
          <ul className="d4-tip-affixes">
            {item.affixRolls.map((a, i) => (
              <li key={`${a.id}-${i}`} className={a.greater ? "is-ga" : undefined}>
                {a.greater ? <GaStar /> : <Diamond />}
                <span>{a.text}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {item.tempers.length > 0 ? (
        <ul className="d4-tip-affixes d4-tip-tempers">
          {item.tempers.map((a, i) => (
            <li key={`${a.id}-${i}`}>
              <Diamond />
              <span>{a.text}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {item.power ? (
        <p className={cn("d4-tip-power", powerIsUnique ? "is-unique" : "is-legend")}>
          <GaStar />
          <span>{highlight(item.power)}</span>
        </p>
      ) : null}

      {item.sockets > 0
        ? Array.from({ length: item.sockets }, (_, i) => (
            <p key={i} className="d4-tip-socket">
              <span className="d4-tip-socket-gem" />
              Empty Socket
            </p>
          ))
        : null}

      {item.flavor ? <p className="d4-tip-flavor">{item.flavor}</p> : null}

      <div className="d4-tip-foot">
        {item.codexUpgrade ? <p>Unlocks new look on salvage</p> : <p />}
        <p>Requires Level {item.requiredLevel}</p>
      </div>
      {item.uniqueName ? (
        <p className="d4-tip-equipped">{item.mythic ? "Mythic Unique Equipped" : "Unique Equipped"}</p>
      ) : null}
    </div>
  );
}
