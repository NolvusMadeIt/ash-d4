import type { ScoutCatalog, ScoutItem } from "./catalog";
import { NEVER_SINK_TEMPLATES, type NeverSinkId } from "./neversink";

const UA = "Cull/1.0";
const SCOUT_ITEMS = "https://api.poe2scout.com/poe2/Leagues";
const REPOE_BASES =
  "https://raw.githubusercontent.com/repoe-fork/poe2/master/data/base_items.json";
const NEVER_SINK_ROOT =
  "https://cdn.jsdelivr.net/gh/NeverSinkDev/NeverSink-Filter-for-PoE2@main/";
const GGPK = "https://image.ggpk.exposed/poe2/";

const KEEP = new Set(["armour", "accessory", "weapon", "jewel", "flask"]);

type Cache<T> = { at: number; etag?: string; value: T };

const scoutCache: { current: Cache<ScoutCatalog> | null } = { current: null };
const basesCache: { current: Cache<Record<string, string>> | null } = { current: null };
const filterCache = new Map<string, Cache<string>>();
const uniqueIcon = new Map<string, string>();
const imageCache = new Map<string, { type: string; body: Uint8Array; at: number }>();

let scoutInflight: Promise<ScoutCatalog> | null = null;
let basesInflight: Promise<Record<string, string>> | null = null;

const TTL = {
  scout: 15 * 60 * 1000,
  bases: 60 * 60 * 1000,
  filter: 30 * 60 * 1000,
  image: 24 * 60 * 60 * 1000,
  minGap: 20 * 1000,
};

export type SourceSnapshot = {
  catalog: ScoutCatalog;
  baseIcons: Record<string, string>;
  league: string;
  checkedAt: number;
  itemCount: number;
  baseCount: number;
};

function publicIcon(name: string, fallback?: string) {
  if (fallback?.startsWith("/items/")) return fallback;
  return `/api/poe/art?u=${encodeURIComponent(name)}`;
}

function publicCatalog(catalog: ScoutCatalog): ScoutCatalog {
  return {
    league: catalog.league,
    items: catalog.items.map((it) => ({ ...it, icon: publicIcon(it.name, it.icon) })),
  };
}

function fresh<T>(cached: Cache<T> | null, ttl: number, force: boolean) {
  if (!cached) return false;
  const age = Date.now() - cached.at;
  if (force) return age < TTL.minGap;
  return age < ttl;
}

async function fetchBuffer(
  url: string,
  extra?: HeadersInit,
): Promise<{ ok: boolean; status: number; etag?: string; type: string; body: Uint8Array }> {
  const res = await fetch(url, { headers: { "User-Agent": UA, ...extra } });
  const etag = res.headers.get("etag") ?? undefined;
  const type = res.headers.get("content-type") ?? "application/octet-stream";
  if (res.status === 304) {
    return { ok: true, status: 304, etag, type, body: new Uint8Array() };
  }
  if (!res.ok) return { ok: false, status: res.status, etag, type, body: new Uint8Array() };
  const buf = new Uint8Array(await res.arrayBuffer());
  return { ok: true, status: res.status, etag, type, body: buf };
}

type League = { Value: string; IsCurrent?: boolean };
type RawItem = {
  Name?: string;
  Type?: string;
  IconUrl?: string;
  CurrentPrice?: number;
  CategoryApiId?: string;
};

function rememberUniqueIcons(items: { name: string; remote: string }[]) {
  const prev = new Map(uniqueIcon);
  uniqueIcon.clear();
  for (const it of items) {
    const key = it.name.toLowerCase();
    uniqueIcon.set(key, it.remote);
    if (prev.get(key) && prev.get(key) !== it.remote) {
      imageCache.delete(`u:${key}`);
    }
  }
}

async function refreshScout(force = false): Promise<ScoutCatalog> {
  const cached = scoutCache.current;
  if (fresh(cached, TTL.scout, force) && cached) return cached.value;
  if (scoutInflight) return scoutInflight;

  scoutInflight = (async () => {
    try {
      const leaguesRes = await fetch(SCOUT_ITEMS, { headers: { "User-Agent": UA } });
      if (!leaguesRes.ok) throw new Error("scout leagues");
      const leagues = (await leaguesRes.json()) as League[];
      const current =
        leagues.find((l) => l.IsCurrent && !/hc/i.test(l.Value)) ?? leagues[0];
      if (!current) throw new Error("no league");
      const league = encodeURIComponent(current.Value);
      const rawRes = await fetch(`${SCOUT_ITEMS}/${league}/Items`, {
        headers: { "User-Agent": UA },
      });
      if (!rawRes.ok) throw new Error("scout items");
      const raw = (await rawRes.json()) as RawItem[];
      const items: ScoutItem[] = [];
      const remotes: { name: string; remote: string }[] = [];
      for (const it of raw) {
        const category = it.CategoryApiId ?? "";
        if (!KEEP.has(category)) continue;
        const name = it.Name?.trim();
        const icon = it.IconUrl?.trim();
        if (!name || !icon) continue;
        remotes.push({ name, remote: icon });
        items.push({
          name,
          base: it.Type ?? "",
          icon: publicIcon(name),
          price: Number(it.CurrentPrice) || 0,
          category,
        });
      }
      rememberUniqueIcons(remotes);
      items.sort((a, b) => a.name.localeCompare(b.name));
      const catalog = { league: current.Value, items };
      scoutCache.current = { at: Date.now(), value: catalog };
      return catalog;
    } catch (err) {
      if (cached) return cached.value;
      throw err instanceof Error ? err : new Error("scout unavailable");
    } finally {
      scoutInflight = null;
    }
  })();

  return scoutInflight;
}

type RepoItem = {
  name?: string;
  visual_identity?: { dds_file?: string };
};

async function refreshBases(force = false): Promise<Record<string, string>> {
  const cached = basesCache.current;
  if (fresh(cached, TTL.bases, force) && cached) return cached.value;
  if (basesInflight) return basesInflight;

  basesInflight = (async () => {
    try {
      const headers: HeadersInit = { "User-Agent": UA };
      if (cached?.etag) headers["If-None-Match"] = cached.etag;
      const res = await fetch(REPOE_BASES, { headers });
      if (res.status === 304 && cached) {
        cached.at = Date.now();
        return cached.value;
      }
      if (!res.ok) throw new Error("bases");
      const etag = res.headers.get("etag") ?? undefined;
      const raw = (await res.json()) as Record<string, RepoItem>;
      const map: Record<string, string> = {};
      for (const row of Object.values(raw)) {
        const name = row.name?.trim();
        const dds = row.visual_identity?.dds_file?.trim();
        if (!name || !dds || !dds.endsWith(".dds")) continue;
        map[name] = dds;
      }
      basesCache.current = { at: Date.now(), etag, value: map };
      return map;
    } catch {
      if (cached) return cached.value;
      return {};
    } finally {
      basesInflight = null;
    }
  })();

  return basesInflight;
}

export async function loadNeverSinkFilter(id: NeverSinkId, force = false): Promise<string> {
  const meta = NEVER_SINK_TEMPLATES.find((t) => t.id === id);
  if (!meta) throw new Error("Unknown NeverSink template");
  const cached = filterCache.get(id);
  if (fresh(cached ?? null, TTL.filter, force) && cached) return cached.value;
  const url = NEVER_SINK_ROOT + encodeURIComponent(meta.file);
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) {
    if (cached) return cached.value;
    throw new Error(`NeverSink ${id} failed to load`);
  }
  const text = await res.text();
  filterCache.set(id, { at: Date.now(), value: text });
  return text;
}

export async function refreshAll(force = true): Promise<SourceSnapshot> {
  const [scout, bases] = await Promise.all([refreshScout(force), refreshBases(force)]);
  void Promise.all(
    NEVER_SINK_TEMPLATES.map((t) => loadNeverSinkFilter(t.id, force)),
  ).catch(() => undefined);
  return {
    catalog: publicCatalog(scout),
    baseIcons: bases,
    league: scout.league,
    checkedAt: Date.now(),
    itemCount: scout.items.length,
    baseCount: Object.keys(bases).length,
  };
}

export function isSafeDds(path: string) {
  return /^Art\/2DItems\/[A-Za-z0-9_./-]+\.dds$/i.test(path);
}

function rememberImage(key: string, rec: { type: string; body: Uint8Array; at: number }) {
  imageCache.set(key, rec);
  if (imageCache.size <= 250) return;
  const first = imageCache.keys().next().value;
  if (first) imageCache.delete(first);
}

function allowedCdn(url: string) {
  try {
    const host = new URL(url).hostname;
    return host === "web.poecdn.com" || host === "cdn.poecdn.com" || host.endsWith(".poecdn.com");
  } catch {
    return false;
  }
}

export async function fetchArt(opts: {
  dds?: string | null;
  unique?: string | null;
}): Promise<{ type: string; body: Uint8Array } | null> {
  const dds = opts.dds?.trim() ?? "";
  const unique = opts.unique?.trim() ?? "";
  const key = dds ? `dds:${dds}` : unique ? `u:${unique.toLowerCase()}` : "";
  if (!key) return null;
  const hit = imageCache.get(key);
  if (hit && Date.now() - hit.at < TTL.image) return hit;

  let url = "";
  if (dds) {
    if (!isSafeDds(dds)) return null;
    url = `${GGPK}${dds}?format=png`;
  } else {
    let icon = uniqueIcon.get(unique.toLowerCase());
    if (!icon) {
      try {
        await refreshScout();
      } catch {
        /* baked map may still miss */
      }
      icon = uniqueIcon.get(unique.toLowerCase());
    }
    if (!icon || !allowedCdn(icon)) return null;
    url = icon;
  }

  const res = await fetchBuffer(url);
  if (!res.ok || res.body.byteLength === 0) return hit ?? null;
  const rec = { type: res.type || "image/png", body: res.body, at: Date.now() };
  rememberImage(key, rec);
  return rec;
}
