#!/usr/bin/env python3
"""
PROTOTYPE (wayfinder #63) — two 2×2 contact sheets per example from the eight stored views, for the reading.

Usage (inside a container with Pillow, e.g. the build123d service): contact63.py VIEWS_DIR OUT_DIR [px]
Sheet A: front, back, left, right. Sheet B: top, bottom, 45° down, 45° up. Each view scaled to `px` wide
(default 768), labelled. Reads VIEWS_DIR/views.json as written by views63.sh. Throwaway.
"""
import json, os, sys
from PIL import Image, ImageDraw

views_dir, out_dir = sys.argv[1], sys.argv[2]
px = int(sys.argv[3]) if len(sys.argv) > 3 else 768
os.makedirs(out_dir, exist_ok=True)
SHEETS = {"A": ["front", "back", "left", "right"], "B": ["top", "bottom", "ortho_45", "ortho_45_bottom"]}
LABEL = {"front": "FRONT", "back": "BACK", "left": "LEFT", "right": "RIGHT", "top": "TOP", "bottom": "BOTTOM",
         "ortho_45": "45 DOWN", "ortho_45_bottom": "45 UP"}
n = 0
for e in json.load(open(os.path.join(views_dir, "views.json"))):
    for name, keys in SHEETS.items():
        tiles = []
        for k in keys:
            im = Image.open(os.path.join(views_dir, e[k])).convert("RGB")
            im.thumbnail((px, px))
            tile = Image.new("RGB", (px, px), "white"); tile.paste(im, ((px - im.width) // 2, (px - im.height) // 2))
            d = ImageDraw.Draw(tile); d.rectangle([0, 0, 130, 26], fill="black"); d.text((6, 6), LABEL[k], fill="white")
            tiles.append(tile)
        sheet = Image.new("RGB", (2 * px + 6, 2 * px + 6), "#888")
        for i, t in enumerate(tiles): sheet.paste(t, ((i % 2) * (px + 6), (i // 2) * (px + 6)))
        sheet.save(os.path.join(out_dir, f"{e['id'][:8]}-{name}.png"), optimize=True)
        n += 1
print(f"{n} sheets → {out_dir}")
