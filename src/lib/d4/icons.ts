/** Local image API — every icon is served from /images/d4, never a hotlinked CDN. */

export function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function slotIcon(slot: string) {
  return `/images/d4/slots/${slot}.png`;
}

export function uniqueIcon(name: string) {
  return `/images/d4/uniques/${slugify(name)}.png`;
}

export function itemIcon(item: { uniqueName?: string; slot: string; name?: string }) {
  if (item.uniqueName) return uniqueIcon(item.uniqueName);
  if (item.name) {
    const slug = slugify(item.name);
    if (
      /^(harlequin|heir-of|shroud-of-false|tyrael|ring-of-starless|andariel|doombringer|the-grandfather|melted-heart|nesekem|ahavarion)/.test(
        slug,
      )
    ) {
      return uniqueIcon(item.name);
    }
  }
  return slotIcon(item.slot);
}

export const GROUND_BG = "/images/d4/ground/sanctuary.jpg";
export const GROUND_BG_ALT = "/images/d4/ground/dungeon.jpg";
export const CATHEDRAL_TEX = "/images/d4/ground/cathedral.jpg";
