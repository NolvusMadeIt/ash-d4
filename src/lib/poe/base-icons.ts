export type BaseIconMap = Map<string, string>;

const TIER_PREFIX = /^(Advanced|Expert|Exceptional)\s+/i;

export function ddsToUrl(dds: string): string {
  return `/api/poe/art?dds=${encodeURIComponent(dds)}`;
}

export function uniqueArtUrl(name: string): string {
  return `/api/poe/art?u=${encodeURIComponent(name)}`;
}

export function stripItemTier(name: string): string {
  return name.replace(TIER_PREFIX, "").trim();
}

export function indexBaseIcons(raw: Record<string, string>): BaseIconMap {
  const map = new Map<string, string>();
  for (const [name, dds] of Object.entries(raw)) {
    if (typeof dds === "string" && dds) map.set(name.toLowerCase(), dds);
  }
  return map;
}

function pickDds(map: BaseIconMap, needle: string): string | null {
  const exact = map.get(needle);
  if (exact) return exact;

  let best: string | null = null;
  let bestLen = 0;
  let ultimate: string | null = null;

  for (const [key, dds] of map) {
    const nameHits = needle === key || needle.endsWith(` ${key}`);
    const keyHits = key.endsWith(` ${needle}`);
    if (!nameHits && !keyHits) continue;
    if (key.startsWith("ultimate ") && keyHits) ultimate = dds;
    if (key.length > bestLen) {
      best = dds;
      bestLen = key.length;
    }
  }
  return ultimate ?? best;
}

export function lookupBaseDds(name: string, map: BaseIconMap): string | null {
  if (!name || map.size === 0) return null;
  const stripped = stripItemTier(name);
  for (const candidate of [name, stripped]) {
    const hit = pickDds(map, candidate.toLowerCase());
    if (hit) return hit;
  }
  return null;
}

export async function loadBaseIcons(): Promise<BaseIconMap> {
  try {
    const res = await fetch("/base-icons.json");
    if (!res.ok) return new Map();
    const data = (await res.json()) as unknown;
    if (!data || typeof data !== "object") return new Map();
    return indexBaseIcons(data as Record<string, string>);
  } catch {
    return new Map();
  }
}
