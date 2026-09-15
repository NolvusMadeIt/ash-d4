import { useEffect, useState, type CSSProperties } from "react";
import { classArt, itemArt } from "@/lib/poe/item-art";
import type { ParsedItem } from "@/lib/poe/parse-item";
import { useCull } from "@/lib/store";
import { cn } from "@/lib/utils";

function isFlaskItem(item: ParsedItem) {
  return /flask/i.test(`${item.className} ${item.baseType} ${item.name}`);
}

function sheetFrames(width: number, height: number) {
  if (height <= 0 || width / height <= 1.15) return 1;
  return Math.max(2, Math.round(width / (height * 0.5)));
}

export function ItemPortrait({
  item,
  size = "md",
}: {
  item: ParsedItem;
  size?: "sm" | "md";
}) {
  const { baseIcons, catalog } = useCull();
  const [failed, setFailed] = useState(false);
  const [frames, setFrames] = useState(3);
  const src = failed
    ? classArt(item.className)
    : itemArt(item.baseType, item.className, baseIcons, item.name, catalog);
  const flaskSheet = !failed && isFlaskItem(item) && !src.endsWith(".svg");
  const box = size === "sm" ? "size-10" : "size-14";

  useEffect(() => {
    setFailed(false);
    setFrames(3);
  }, [item.baseType, item.name, item.className]);

  function onLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    if (!flaskSheet) return;
    const img = e.currentTarget;
    setFrames(sheetFrames(img.naturalWidth, img.naturalHeight));
  }

  if (flaskSheet) {
    return (
      <span className={cn(box, "item-art-sheet")}>
        <span
          className="item-art-sheet-frame"
          style={{ ["--sheet-frames"]: frames } as CSSProperties}
        >
          <img src={src} alt="" onError={() => setFailed(true)} onLoad={onLoad} />
        </span>
      </span>
    );
  }

  return (
    <img
      src={src}
      alt=""
      width={size === "sm" ? 40 : 56}
      height={size === "sm" ? 40 : 56}
      className={cn(box, "object-contain")}
      onError={() => setFailed(true)}
    />
  );
}