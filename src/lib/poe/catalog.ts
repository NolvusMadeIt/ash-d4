export type ScoutItem = {
  name: string;
  base: string;
  icon: string;
  price: number;
  category: string;
};

export type ScoutCatalog = {
  league: string;
  items: ScoutItem[];
};

const LOCAL: Record<string, ScoutItem> = {
  wanderlust: {
    name: "Wanderlust",
    base: "Wrapped Sandals",
    icon: "/items/uniques/wanderlust.png",
    price: 2,
    category: "armour",
  },
  goldrim: {
    name: "Goldrim",
    base: "Felt Cap",
    icon: "/items/uniques/goldrim.png",
    price: 5,
    category: "armour",
  },
  "kalandra's touch": {
    name: "Kalandra's Touch",
    base: "Ring",
    icon: "/items/uniques/kalandras-touch.png",
    price: 0,
    category: "accessory",
  },
};

export function classFromBase(base: string, category?: string): string {
  const b = base.toLowerCase();
  if (/boot|greave|sandal|slipper|shoe/.test(b)) return "Boots";
  if (/glove|gauntlet|mitt/.test(b)) return "Gloves";
  if (/helm|hat|cap|circlet|mask|hood|crown|cage|pelt|tricorne/.test(b)) return "Helmets";
  if (/robe|armour|armor|vest|plate|mail|jacket|garb|regalia|mantle|wrap|coat/.test(b))
    return "Body Armours";
  if (/\bring\b/.test(b) || b === "ring") return "Rings";
  if (/amulet/.test(b)) return "Amulets";
  if (/belt|vise|sash/.test(b)) return "Belts";
  if (/crossbow/.test(b)) return "Crossbows";
  if (/\bbow\b/.test(b)) return "Bows";
  if (/quarterstaff/.test(b)) return "Quarterstaves";
  if (/\bstaff\b/.test(b)) return "Staves";
  if (/wand/.test(b)) return "Wands";
  if (/mace|hammer|club|maul/.test(b)) return "Maces";
  if (/spear/.test(b)) return "Spears";
  if (/sceptre/.test(b)) return "Sceptres";
  if (/shield|buckler/.test(b)) return "Shields";
  if (/focus|foci/.test(b)) return "Foci";
  if (/quiver/.test(b)) return "Quivers";
  if (/\bcharms?\b/.test(b) || category === "charm") return "Charms";
  if (/flask/.test(b) || category === "flask") return "Flasks";
  if (/jewel/.test(b) || category === "jewel") return "Jewels";
  if (category === "weapon") return "One Hand Maces";
  if (category === "armour") return "Body Armours";
  if (category === "accessory") return "Rings";
  return "Unknown";
}

export function indexCatalog(items: ScoutItem[]): Map<string, ScoutItem> {
  const map = new Map<string, ScoutItem>();
  for (const item of Object.values(LOCAL)) map.set(item.name.toLowerCase(), item);
  for (const item of items) {
    map.set(item.name.toLowerCase(), {
      ...item,
      icon: publicItemIcon(item.name, item.icon),
    });
  }
  return map;
}

export function lookupUnique(name: string, catalog: Map<string, ScoutItem>): ScoutItem | null {
  const key = name.trim().toLowerCase();
  return catalog.get(key) ?? LOCAL[key] ?? null;
}

export function publicItemIcon(name: string, icon?: string) {
  if (icon?.startsWith("/items/")) return icon;
  return `/api/poe/art?u=${encodeURIComponent(name)}`;
}

export async function loadBakedCatalog(): Promise<ScoutCatalog> {
  try {
    const res = await fetch("/scout-catalog.json");
    if (!res.ok) throw new Error("catalog missing");
    const data = (await res.json()) as ScoutCatalog;
    if (!Array.isArray(data.items)) throw new Error("bad catalog");
    return {
      league: data.league,
      items: data.items.map((it) => ({ ...it, icon: publicItemIcon(it.name, it.icon) })),
    };
  } catch {
    return { league: "local", items: Object.values(LOCAL) };
  }
}

export function formatPrice(price: number): string | null {
  if (!Number.isFinite(price) || price <= 0) return null;
  if (price >= 1000) return `${(price / 1000).toFixed(price >= 10000 ? 0 : 1)}k exalt`;
  if (price >= 10) return `${Math.round(price)} exalt`;
  if (Number.isInteger(price)) return `${price} exalt`;
  return `${price.toFixed(1)} exalt`;
}
