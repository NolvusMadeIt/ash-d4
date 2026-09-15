#!/usr/bin/env python3
"""Download Maxroll d4-tools item art once, serve it from our own folders/API."""

from __future__ import annotations

import io
import json
import re
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from PIL import Image

ROOT = Path("/workspace")
PUBLIC = ROOT / "public" / "images" / "d4" / "maxroll"
DATA_PUBLIC = ROOT / "public" / "data" / "d4"
SRC_LIB = ROOT / "src" / "lib" / "d4"
UA = "Mozilla/5.0 (compatible; AshD4/1.0; +local-cache)"
CDN = "https://assets-ng.maxroll.gg/d4-tools/images/webp/{id}.webp"

TYPE_TO_SLOT = {
    "Helm": "helm",
    "ChestArmor": "chest",
    "Gloves": "gloves",
    "Legs": "pants",
    "Boots": "boots",
    "Amulet": "amulet",
    "Ring": "ring",
    "Axe": "axe",
    "Axe2H": "axe2h",
    "Mace": "mace",
    "Mace2H": "mace2h",
    "Sword": "sword",
    "Sword2H": "sword2h",
    "Dagger": "dagger",
    "Polearm": "polearm",
    "Staff": "staff",
    "Wand": "wand",
    "Bow": "bow",
    "Crossbow2H": "crossbow",
    "Scythe": "scythe",
    "Scythe2H": "scythe2h",
    "Quarterstaff": "quarterstaff",
    "Glaive": "glaive",
    "Focus": "focus",
    "FocusBookOffHand": "focus",
    "OffHandTotem": "totem",
    "Shield": "shield",
    "Offhand": "offhand",
    "Charm": "charm",
    "HoradricSeal": "seal",
    "Flail": "mace",
}

GEAR_SLOTS = set(TYPE_TO_SLOT.values())
SLOT_PRIORITY = {
    "charm": 20,
    "seal": 18,
    "helm": 1,
    "chest": 1,
    "gloves": 1,
    "pants": 1,
    "boots": 1,
    "amulet": 1,
    "ring": 1,
}


def slugify(name: str) -> str:
    s = name.lower().replace("'", "").replace("’", "")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def fetch(url: str, tries: int = 3) -> bytes | None:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for i in range(tries):
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                if r.status != 200:
                    return None
                return r.read()
        except Exception:
            time.sleep(0.4 * (i + 1))
    return None


def save_png(raw: bytes, dest: Path) -> bool:
    try:
        im = Image.open(io.BytesIO(raw)).convert("RGBA")
        dest.parent.mkdir(parents=True, exist_ok=True)
        im.save(dest, "PNG", optimize=True)
        return True
    except Exception:
        return False


def pick_uniques(items: dict, en_items: dict) -> list[dict]:
    best: dict[str, dict] = {}
    for key, rec in items.items():
        if "Unique" not in key:
            continue
        name = (en_items.get(key) or {}).get("name")
        if not name or "(Crucible)" in name or name.startswith("[") or name.lower().startswith("[ph"):
            continue
        slot = TYPE_TO_SLOT.get(rec.get("type") or "")
        if not slot:
            continue
        image = int(rec.get("image") or 0)
        if image <= 0:
            continue
        mythic = rec.get("magicType") == 4
        flavor = (en_items.get(key) or {}).get("flavor") or ""
        cand = {
            "name": name,
            "slot": slot,
            "mythic": mythic,
            "image": image,
            "key": key,
            "flavor": flavor.replace("\r\n", "\n").strip(),
            "type": rec.get("type"),
        }
        prev = best.get(name)
        if prev is None:
            best[name] = cand
            continue
        # Prefer real gear over charm copies; mythic over unique.
        score = (0 if slot == "charm" else 2) + (2 if mythic else 0)
        prev_score = (0 if prev["slot"] == "charm" else 2) + (2 if prev["mythic"] else 0)
        if score > prev_score:
            best[name] = cand
    return sorted(best.values(), key=lambda x: (not x["mythic"], x["name"]))


def slot_image_ids(items: dict) -> dict[str, int]:
    chosen: dict[str, tuple[int, int]] = {}
    for key, rec in items.items():
        slot = TYPE_TO_SLOT.get(rec.get("type") or "")
        if not slot:
            continue
        image = int(rec.get("image") or 0)
        if image <= 0:
            continue
        magic = int(rec.get("magicType") or 0)
        # Prefer normal/magic bases, not unique portraits, for generic slot tiles.
        if "Unique" in key:
            rank = 50
        elif "Normal" in key:
            rank = 0
        elif "Magic" in key:
            rank = 1
        else:
            rank = 10
        rank += magic
        prev = chosen.get(slot)
        if prev is None or rank < prev[0]:
            chosen[slot] = (rank, image)
    return {slot: img for slot, (_, img) in chosen.items()}


def download_one(image_id: int, dest: Path) -> tuple[int, bool]:
    if dest.exists() and dest.stat().st_size > 200:
        return image_id, True
    raw = fetch(CDN.format(id=image_id))
    if not raw or len(raw) < 80:
        return image_id, False
    ok = save_png(raw, dest)
    return image_id, ok


def main() -> None:
    data = json.loads(Path("/tmp/mr/data.min.json").read_text())
    en = json.loads(Path("/tmp/mr/data.enus.json").read_text())
    version = data.get("version", "unknown")
    uniques = pick_uniques(data["items"], en["items"])
    slots = slot_image_ids(data["items"])
    print(f"version {version} uniques {len(uniques)} slots {len(slots)}")

    jobs: dict[int, Path] = {}
    aliases: list[tuple[int, Path]] = []
    for u in uniques:
        dest = PUBLIC / "uniques" / f"{slugify(u['name'])}.png"
        aliases.append((u["image"], dest))
        jobs.setdefault(u["image"], PUBLIC / "by-id" / f"{u['image']}.png")
    for slot, img in slots.items():
        dest = PUBLIC / "slots" / f"{slot}.png"
        aliases.append((img, dest))
        jobs.setdefault(img, PUBLIC / "by-id" / f"{img}.png")

    ok = fail = 0
    with ThreadPoolExecutor(max_workers=16) as pool:
        futs = {pool.submit(download_one, i, p): i for i, p in jobs.items()}
        for f in as_completed(futs):
            _id, success = f.result()
            if success:
                ok += 1
            else:
                fail += 1
    print(f"downloaded distinct ok={ok} fail={fail}")

    import shutil

    copied = 0
    for image_id, dest in aliases:
        src = PUBLIC / "by-id" / f"{image_id}.png"
        if not src.exists():
            continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        if dest.resolve() != src.resolve():
            shutil.copyfile(src, dest)
            copied += 1
    print(f"copied aliases {copied}")

    slim = []
    for u in uniques:
        path = f"/images/d4/maxroll/uniques/{slugify(u['name'])}.png"
        local = PUBLIC / "uniques" / f"{slugify(u['name'])}.png"
        slim.append(
            {
                "name": u["name"],
                "slot": u["slot"],
                "mythic": bool(u["mythic"]),
                "icon": path if local.exists() else f"/images/d4/slots/{u['slot']}.png",
                "flavor": u["flavor"],
            }
        )

    DATA_PUBLIC.mkdir(parents=True, exist_ok=True)
    catalog = {
        "version": version,
        "source": "Maxroll d4-tools game dump, cached locally. No hotlinks.",
        "counts": {
            "uniques": len(slim),
            "slots": len(slots),
            "files": ok,
        },
        "slots": {
            s: f"/images/d4/maxroll/slots/{s}.png" for s in sorted(slots)
        },
        "uniques": slim,
    }
    (DATA_PUBLIC / "maxroll-catalog.json").write_text(json.dumps(catalog, indent=2) + "\n")
    SRC_LIB.mkdir(parents=True, exist_ok=True)
    (SRC_LIB / "maxroll-uniques.json").write_text(
        json.dumps([{"name": u["name"], "mythic": u["mythic"], "slot": u["slot"]} for u in slim], indent=2)
        + "\n"
    )
    print("wrote catalogs")


if __name__ == "__main__":
    main()
