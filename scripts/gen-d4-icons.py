#!/usr/bin/env python3
"""Paint Diablo 4-style inventory tiles. Local PNGs — no CDN hotlink."""

from __future__ import annotations

import math
import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

ROOT = Path("/workspace/public/images/d4")
SIZE = 96

SLOTS = [
    "helm",
    "chest",
    "gloves",
    "pants",
    "boots",
    "amulet",
    "ring",
    "axe",
    "axe2h",
    "mace",
    "mace2h",
    "sword",
    "sword2h",
    "dagger",
    "polearm",
    "staff",
    "wand",
    "bow",
    "crossbow",
    "scythe",
    "scythe2h",
    "quarterstaff",
    "glaive",
    "focus",
    "totem",
    "shield",
    "offhand",
    "charm",
    "seal",
]

UNIQUES = [
    ("Harlequin Crest", "helm", True),
    ("Shroud of False Death", "chest", True),
    ("Heir of Perdition", "helm", True),
    ("Tyrael's Might", "chest", True),
    ("Ring of Starless Skies", "ring", True),
    ("Andariel's Visage", "helm", True),
    ("Doombringer", "sword", True),
    ("The Grandfather", "sword2h", True),
    ("Melted Heart of Selig", "amulet", True),
    ("Nesekem the Herald", "glaive", True),
    ("Ahavarion, Spear of Lycander", "staff", True),
    ("The Butcher's Cleaver", "axe", False),
    ("Fists of Fate", "gloves", False),
    ("Tibault's Will", "pants", False),
    ("Yen's Blessing", "boots", False),
    ("Penitent Greaves", "boots", False),
    ("Tempest Roar", "helm", False),
    ("Insatiable Fury", "chest", False),
    ("Deathless Visage", "helm", False),
    ("Blood Moon Breeches", "pants", False),
    ("Cowl of the Nameless", "helm", False),
    ("Grasp of Shadow", "gloves", False),
    ("Asheara's Khanjar", "dagger", False),
    ("Raiment of the Infinite", "chest", False),
    ("Esadora's Overflowing Cameo", "amulet", False),
    ("Blue Rose", "ring", False),
    ("Paingorger's Gauntlets", "gloves", False),
    ("Godslayer Crown", "helm", False),
    ("Razorplate", "chest", False),
    ("Frostburn", "gloves", False),
    ("Flickerstep", "boots", False),
    ("Banished Lord's Talisman", "amulet", False),
    ("Lidless Wall", "shield", False),
    ("Mother's Embrace", "ring", False),
    ("Condemnation", "dagger", False),
    ("Skyhunter", "bow", False),
    ("The Unbroken Chain", "pants", False),
    ("Tassets of the Dawning Sky", "pants", False),
    ("Soulbrand", "chest", False),
    ("Ring of the Sacrilegious Soul", "ring", False),
    ("Greatstaff of the Crone", "staff", False),
    ("Airidah's Inexorable Will", "ring", False),
    ("Hunter's Zenith", "ring", False),
    ("Waxing Gibbous", "axe", False),
    ("Storm's Companion", "pants", False),
    ("Ugly Bastard Helm", "helm", False),
    ("Locran's Talisman", "amulet", False),
    ("Endurant Faith", "gloves", False),
]


def slugify(name: str) -> str:
    s = name.lower().replace("'", "").replace("’", "")
    out = []
    prev_dash = False
    for ch in s:
        if ch.isalnum():
            out.append(ch)
            prev_dash = False
        else:
            if not prev_dash:
                out.append("-")
                prev_dash = True
    return "".join(out).strip("-")


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(len(a)))


def noise(img: Image.Image, amount: int = 14) -> Image.Image:
    import random

    rnd = random.Random(7)
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            p = px[x, y]
            d = rnd.randint(-amount, amount)
            px[x, y] = tuple(max(0, min(255, c + d)) for c in p[:3]) + ((p[3],) if len(p) == 4 else ())
    return img


def canvas(frame: str) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # inner well
    d.rounded_rectangle((2, 2, SIZE - 3, SIZE - 3), radius=6, fill=(18, 14, 10, 255))
    # vertical metal wash
    for y in range(6, SIZE - 6):
        t = y / SIZE
        col = lerp((28, 22, 16), (10, 8, 6), t)
        d.line((8, y, SIZE - 9, y), fill=col + (255,))
    # vignette
    for i in range(18):
        a = int(18 - i)
        d.rounded_rectangle((4 + i, 4 + i, SIZE - 5 - i, SIZE - 5 - i), radius=5, outline=(0, 0, 0, a))
    frames = {
        "normal": ((58, 50, 40), (120, 104, 78)),
        "magic": ((40, 55, 110), (90, 130, 220)),
        "rare": ((120, 100, 30), (220, 190, 70)),
        "legendary": ((140, 70, 18), (240, 140, 40)),
        "unique": ((140, 108, 48), (232, 186, 96)),
        "mythic": ((180, 150, 70), (255, 230, 150)),
    }
    outer, inner = frames[frame]
    d.rounded_rectangle((1, 1, SIZE - 2, SIZE - 2), radius=7, outline=outer + (255,), width=3)
    d.rounded_rectangle((4, 4, SIZE - 5, SIZE - 5), radius=5, outline=inner + (220,), width=1)
    # corner ticks
    tick = inner + (255,)
    for x0, y0, x1, y1 in (
        (6, 6, 18, 6),
        (6, 6, 6, 18),
        (SIZE - 19, 6, SIZE - 7, 6),
        (SIZE - 7, 6, SIZE - 7, 18),
        (6, SIZE - 7, 18, SIZE - 7),
        (6, SIZE - 19, 6, SIZE - 7),
        (SIZE - 19, SIZE - 7, SIZE - 7, SIZE - 7),
        (SIZE - 7, SIZE - 19, SIZE - 7, SIZE - 7),
    ):
        d.line((x0, y0, x1, y1), fill=tick, width=2)
    return img, d


def metal(d, pts, dark, mid, light):
    d.polygon(pts, fill=mid)
    if len(pts) >= 3:
        d.line(pts + [pts[0]], fill=light, width=1)


def draw_helm(d, accent=(180, 160, 120)):
    # bowl
    d.ellipse((26, 22, 70, 70), fill=(42, 36, 30))
    d.ellipse((30, 24, 66, 58), fill=(78, 66, 50))
    d.ellipse((34, 28, 50, 44), fill=(150, 130, 96))  # highlight
    # visor slit
    d.rounded_rectangle((34, 46, 62, 54), radius=3, fill=(8, 6, 5))
    d.line((36, 48, 60, 48), fill=accent + (255,), width=1)
    # crest
    d.polygon([(48, 10), (54, 28), (42, 28)], fill=accent)
    d.polygon([(48, 12), (51, 24), (45, 24)], fill=lerp(accent, (255, 255, 220), 0.4))


def draw_chest(d, accent=(160, 140, 100)):
    d.polygon([(28, 26), (68, 26), (74, 78), (22, 78)], fill=(48, 40, 32))
    d.polygon([(34, 30), (62, 30), (66, 72), (30, 72)], fill=(86, 72, 54))
    d.polygon([(38, 32), (50, 36), (44, 50)], fill=(150, 128, 96))
    d.rectangle((46, 34, 50, 70), fill=accent)
    d.ellipse((42, 40, 54, 52), fill=accent)
    d.ellipse((45, 43, 51, 49), fill=lerp(accent, (255, 240, 180), 0.5))


def draw_gloves(d, accent=(160, 130, 90)):
    d.ellipse((30, 28, 66, 72), fill=(52, 42, 32))
    d.polygon([(38, 26), (58, 26), (62, 48), (34, 48)], fill=(90, 74, 54))
    for i, x in enumerate((36, 44, 52, 60)):
        d.rounded_rectangle((x - 4, 46, x + 3, 76), radius=3, fill=(78, 62, 46))
        d.line((x - 1, 48, x - 1, 72), fill=accent, width=1)
    d.ellipse((40, 30, 56, 46), fill=(120, 100, 74))


def draw_pants(d, accent=(150, 120, 80)):
    d.polygon([(30, 22), (66, 22), (70, 40), (26, 40)], fill=(70, 58, 44))
    d.polygon([(28, 38), (46, 40), (44, 82), (24, 80)], fill=(56, 46, 34))
    d.polygon([(50, 40), (68, 38), (72, 80), (52, 82)], fill=(62, 50, 38))
    d.line((48, 24, 48, 40), fill=accent, width=2)
    d.rectangle((32, 58, 42, 66), fill=accent)
    d.rectangle((54, 58, 64, 66), fill=accent)


def draw_boots(d, accent=(150, 120, 80)):
    d.polygon([(34, 18), (54, 18), (58, 58), (30, 58)], fill=(62, 50, 38))
    d.polygon([(28, 54), (78, 58), (76, 78), (24, 74)], fill=(48, 38, 28))
    d.polygon([(30, 56), (70, 60), (68, 70), (28, 66)], fill=(96, 78, 56))
    d.line((36, 28, 52, 28), fill=accent, width=2)
    d.line((36, 38, 54, 38), fill=accent, width=2)


def draw_amulet(d, accent=(200, 160, 70)):
    d.arc((36, 8, 60, 36), 200, 340, fill=(160, 140, 90), width=4)
    d.ellipse((38, 40, 58, 72), fill=(40, 28, 16))
    d.polygon([(48, 36), (62, 56), (48, 76), (34, 56)], fill=accent)
    d.polygon([(48, 42), (56, 56), (48, 68), (40, 56)], fill=lerp(accent, (255, 230, 140), 0.45))
    d.ellipse((45, 52, 51, 58), fill=(255, 240, 180))


def draw_ring(d, accent=(200, 150, 60)):
    d.ellipse((22, 28, 74, 80), fill=(40, 32, 22))
    d.ellipse((30, 36, 66, 72), fill=(18, 14, 10))
    d.arc((24, 30, 72, 78), 200, 40, fill=(170, 140, 80), width=5)
    d.arc((26, 32, 70, 76), 210, 20, fill=(220, 190, 110), width=2)
    d.polygon([(48, 18), (60, 34), (48, 42), (36, 34)], fill=accent)
    d.ellipse((44, 26, 52, 36), fill=lerp(accent, (255, 255, 220), 0.5))


def draw_sword(d, two=False, accent=(200, 190, 160)):
    w = 8 if two else 5
    d.rectangle((48 - w, 12, 48 + w, 64), fill=(170, 170, 175))
    d.polygon([(48, 8), (48 + w + 2, 16), (48 - w - 2, 16)], fill=(220, 220, 225))
    d.line((48, 12, 48, 60), fill=(240, 240, 245), width=1)
    d.rectangle((30, 60, 66, 66), fill=accent)  # guard
    d.rectangle((44, 66, 52, 86), fill=(70, 50, 32))
    d.ellipse((42, 82, 54, 90), fill=accent)


def draw_axe(d, two=False, accent=(180, 160, 120)):
    d.rectangle((45, 28, 51, 86), fill=(80, 60, 40))
    blade = [(28, 18), (70, 14), (74, 40), (52, 44), (52, 34), (30, 38)] if two else [
        (22, 22),
        (50, 16),
        (54, 42),
        (34, 48),
    ]
    d.polygon(blade, fill=(150, 150, 155))
    d.line(blade, fill=(230, 230, 235), width=1)
    d.ellipse((42, 22, 54, 34), fill=accent)


def draw_mace(d, two=False, accent=(180, 150, 90)):
    d.rectangle((45, 40, 51, 86), fill=(80, 60, 40))
    r = 22 if two else 16
    d.ellipse((48 - r, 14, 48 + r, 14 + r * 2), fill=(90, 80, 70))
    d.ellipse((48 - r + 4, 18, 48 + r - 8, 18 + r * 2 - 8), fill=accent)
    for ang in range(0, 360, 45):
        x = 48 + int(math.cos(math.radians(ang)) * (r - 2))
        y = 14 + r + int(math.sin(math.radians(ang)) * (r - 2))
        d.ellipse((x - 4, y - 4, x + 4, y + 4), fill=(200, 190, 160))


def draw_dagger(d, accent=(200, 180, 130)):
    d.polygon([(48, 10), (56, 48), (48, 54), (40, 48)], fill=(180, 180, 186))
    d.line((48, 12, 48, 50), fill=(240, 240, 245), width=1)
    d.rectangle((32, 52, 64, 58), fill=accent)
    d.rectangle((44, 58, 52, 82), fill=(70, 50, 32))


def draw_polearm(d, accent=(160, 140, 90)):
    d.rectangle((46, 18, 50, 88), fill=(80, 60, 40))
    d.polygon([(48, 8), (70, 28), (54, 32), (52, 24), (28, 34), (30, 22)], fill=(160, 160, 166))
    d.polygon([(48, 10), (62, 26), (50, 28)], fill=(220, 220, 230))


def draw_staff(d, accent=(160, 110, 200)):
    d.rectangle((45, 36, 51, 88), fill=(90, 64, 36))
    d.ellipse((32, 10, 64, 42), fill=(30, 20, 40))
    d.ellipse((36, 14, 60, 38), fill=accent)
    d.ellipse((42, 18, 54, 30), fill=lerp(accent, (255, 255, 255), 0.45))
    d.arc((34, 12, 62, 40), 200, 40, fill=(255, 230, 160), width=2)


def draw_wand(d, accent=(120, 160, 220)):
    d.polygon([(50, 12), (56, 78), (44, 78)], fill=(90, 70, 50))
    d.ellipse((40, 8, 56, 24), fill=accent)
    d.ellipse((44, 12, 52, 20), fill=(230, 240, 255))


def draw_bow(d, accent=(180, 140, 80)):
    d.arc((22, 10, 74, 86), 250, 110, fill=accent, width=6)
    d.arc((26, 14, 70, 82), 255, 105, fill=(90, 60, 36), width=3)
    d.line((30, 22, 30, 74), fill=(210, 200, 170), width=2)
    d.polygon([(28, 46), (62, 42), (62, 50), (28, 50)], fill=(160, 150, 120))


def draw_crossbow(d, accent=(160, 130, 80)):
    d.rectangle((20, 42, 76, 50), fill=accent)
    d.polygon([(22, 34), (74, 34), (70, 44), (26, 44)], fill=(90, 70, 48))
    d.rectangle((44, 44, 52, 84), fill=(70, 50, 34))
    d.line((24, 36, 72, 36), fill=(210, 200, 170), width=2)


def draw_scythe(d, two=False, accent=(180, 50, 50)):
    d.rectangle((44, 20, 50, 88), fill=(70, 50, 34))
    d.polygon([(48, 8), (82, 18), (78, 38), (52, 28), (50, 16)], fill=(150, 150, 156))
    d.polygon([(52, 12), (76, 20), (74, 30), (52, 22)], fill=accent if two else (220, 220, 226))


def draw_quarterstaff(d, accent=(160, 130, 80)):
    d.rectangle((44, 10, 52, 86), fill=(90, 68, 42))
    d.ellipse((40, 8, 56, 20), fill=accent)
    d.ellipse((40, 76, 56, 88), fill=accent)


def draw_glaive(d, accent=(180, 160, 90)):
    d.rectangle((45, 30, 51, 88), fill=(80, 60, 40))
    d.polygon([(20, 16), (76, 10), (70, 32), (50, 28), (48, 22), (24, 30)], fill=(170, 170, 176))
    d.polygon([(28, 16), (68, 12), (64, 24), (48, 22)], fill=(230, 230, 236))


def draw_focus(d, accent=(120, 90, 200)):
    d.ellipse((24, 20, 72, 76), fill=(28, 20, 40))
    d.ellipse((32, 28, 64, 68), fill=accent)
    d.ellipse((40, 36, 56, 52), fill=(230, 220, 255))
    d.arc((26, 22, 70, 74), 200, 40, fill=(255, 210, 140), width=2)


def draw_totem(d, accent=(140, 100, 50)):
    d.polygon([(48, 10), (68, 30), (62, 84), (34, 84), (28, 30)], fill=(70, 50, 30))
    d.ellipse((38, 22, 58, 44), fill=accent)
    d.ellipse((42, 26, 54, 38), fill=(20, 12, 8))
    d.rectangle((42, 48, 54, 78), fill=(90, 66, 40))


def draw_shield(d, accent=(180, 150, 70)):
    d.polygon([(48, 12), (78, 28), (72, 68), (48, 86), (24, 68), (18, 28)], fill=(50, 42, 32))
    d.polygon([(48, 18), (70, 30), (66, 64), (48, 78), (30, 64), (26, 30)], fill=(90, 74, 52))
    d.polygon([(48, 22), (58, 32), (48, 44), (38, 32)], fill=accent)
    d.line((48, 20, 48, 76), fill=(220, 190, 110), width=2)


def draw_offhand(d, accent=(160, 140, 90)):
    d.ellipse((26, 22, 70, 76), fill=(50, 40, 30))
    d.arc((28, 24, 68, 74), 200, 20, fill=accent, width=6)
    d.ellipse((42, 40, 54, 54), fill=(200, 180, 120))


def draw_charm(d, accent=(80, 180, 120)):
    d.rounded_rectangle((28, 18, 68, 78), radius=10, fill=(28, 40, 32))
    d.rounded_rectangle((32, 22, 64, 74), radius=8, fill=(36, 56, 42))
    d.ellipse((40, 34, 56, 54), fill=accent)
    d.ellipse((44, 38, 52, 46), fill=(200, 255, 210))


def draw_seal(d, accent=(180, 50, 40)):
    d.ellipse((20, 20, 76, 76), fill=(40, 24, 18))
    d.ellipse((26, 26, 70, 70), fill=(90, 40, 28))
    d.polygon([(48, 30), (58, 48), (48, 66), (38, 48)], fill=accent)
    d.ellipse((44, 44, 52, 52), fill=(255, 200, 120))


DRAW = {
    "helm": draw_helm,
    "chest": draw_chest,
    "gloves": draw_gloves,
    "pants": draw_pants,
    "boots": draw_boots,
    "amulet": draw_amulet,
    "ring": draw_ring,
    "axe": lambda d, a=(180, 160, 120): draw_axe(d, False, a),
    "axe2h": lambda d, a=(180, 160, 120): draw_axe(d, True, a),
    "mace": lambda d, a=(180, 150, 90): draw_mace(d, False, a),
    "mace2h": lambda d, a=(180, 150, 90): draw_mace(d, True, a),
    "sword": lambda d, a=(200, 190, 160): draw_sword(d, False, a),
    "sword2h": lambda d, a=(200, 190, 160): draw_sword(d, True, a),
    "dagger": draw_dagger,
    "polearm": draw_polearm,
    "staff": draw_staff,
    "wand": draw_wand,
    "bow": draw_bow,
    "crossbow": draw_crossbow,
    "scythe": lambda d, a=(180, 50, 50): draw_scythe(d, False, a),
    "scythe2h": lambda d, a=(180, 50, 50): draw_scythe(d, True, a),
    "quarterstaff": draw_quarterstaff,
    "glaive": draw_glaive,
    "focus": draw_focus,
    "totem": draw_totem,
    "shield": draw_shield,
    "offhand": draw_offhand,
    "charm": draw_charm,
    "seal": draw_seal,
}

UNIQUE_ACCENT = {
    "Harlequin Crest": (220, 70, 70),
    "Heir of Perdition": (180, 40, 40),
    "Andariel's Visage": (80, 200, 90),
    "Tyrael's Might": (220, 210, 140),
    "Shroud of False Death": (80, 80, 100),
    "Ring of Starless Skies": (90, 140, 255),
    "Doombringer": (90, 40, 120),
    "The Grandfather": (230, 210, 140),
    "Melted Heart of Selig": (220, 80, 60),
    "Mother's Embrace": (200, 50, 70),
    "Greatstaff of the Crone": (160, 90, 200),
    "Storm's Companion": (90, 160, 220),
    "Blue Rose": (80, 140, 220),
    "Frostburn": (140, 200, 255),
    "Penitent Greaves": (140, 200, 230),
    "Skyhunter": (200, 180, 80),
    "Lidless Wall": (200, 40, 40),
    "Ugly Bastard Helm": (180, 90, 40),
}


def paint(slot: str, frame: str, accent=None) -> Image.Image:
    img, d = canvas(frame)
    fn = DRAW.get(slot, draw_sword)
    if accent is None:
        accent = (180, 150, 90)
    fn(d, accent)
    img = noise(img, 10)
    return img


def save(img: Image.Image, path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "PNG", optimize=True)


def main():
    n = 0
    for slot in SLOTS:
        save(paint(slot, "normal"), ROOT / "slots" / f"{slot}.png")
        n += 1
    for name, slot, mythic in UNIQUES:
        accent = UNIQUE_ACCENT.get(name)
        if accent is None:
            h = sum(ord(c) * (i + 3) for i, c in enumerate(name))
            accent = (90 + h % 140, 70 + (h // 3) % 120, 50 + (h // 7) % 140)
        img = paint(slot, "mythic" if mythic else "unique", accent)
        save(img, ROOT / "uniques" / f"{slugify(name)}.png")
        n += 1
    print(f"wrote {n} pngs")


if __name__ == "__main__":
    main()
