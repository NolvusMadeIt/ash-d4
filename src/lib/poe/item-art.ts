import { lookupUnique, type ScoutItem } from "./catalog";
import { ddsToUrl, lookupBaseDds, type BaseIconMap } from "./base-icons";

export function classArt(className: string): string {
  const c = className.toLowerCase();
  if (c.includes("boot")) return "/items/boots.svg";
  if (c.includes("helmet") || c.includes("helm")) return "/items/helm.svg";
  if (c.includes("glove")) return "/items/gloves.svg";
  if (c.includes("body") || c.includes("armour") || c.includes("armor"))
    return "/items/body.svg";
  if (c.includes("ring")) return "/items/ring.svg";
  if (c.includes("amulet")) return "/items/amulet.svg";
  if (c.includes("belt")) return "/items/belt.svg";
  if (c.includes("bow") || c.includes("crossbow")) return "/items/bow.svg";
  if (c.includes("gem")) return "/items/gem.svg";
  if (c.includes("currency")) return "/items/currency.svg";
  if (c.includes("waystone") || c.includes("map")) return "/items/map.svg";
  if (c.includes("flask")) return "/items/flask.svg";
  if (c.includes("charm")) return "/items/charm.svg";
  if (
    c.includes("wand") ||
    c.includes("staff") ||
    c.includes("mace") ||
    c.includes("spear") ||
    c.includes("weapon")
  )
    return "/items/weapon.svg";
  return "/items/generic.svg";
}

export function itemArt(
  baseType: string,
  className: string,
  bases: BaseIconMap,
  itemName?: string,
  catalog?: Map<string, ScoutItem>,
): string {
  if (itemName) {
    const fromName = lookupBaseDds(itemName, bases);
    if (fromName) return ddsToUrl(fromName);
  }
  const fromBase = lookupBaseDds(baseType, bases);
  if (fromBase) return ddsToUrl(fromBase);
  if (itemName && catalog) {
    const unique = lookupUnique(itemName, catalog);
    const fromUniqueBase = unique ? lookupBaseDds(unique.base, bases) : null;
    if (fromUniqueBase) return ddsToUrl(fromUniqueBase);
    if (unique?.icon.startsWith("/") && !unique.icon.startsWith("//")) return unique.icon;
  }
  return classArt(className);
}
