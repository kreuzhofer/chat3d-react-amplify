#!/usr/bin/env python3
"""PROTOTYPE (wayfinder #85) — Fable's third-opinion reading, one call per item: third85.py add <short> <item> <R|C|N> <confidence> "<what>" "<deciding views>" "<resolved by>"; writes into items85.json."""
import json, sys
p = "items85.json"; items = json.load(open(p))
_, cmd, short, item, third, conf, what, view, res = sys.argv[:9]
hit = [r for r in items if r["short"] == short and r["item"] == int(item)]
assert len(hit) == 1, f"{short} #{item}: {len(hit)} matches"
hit[0].update(third=third, confidence=conf, what=what, deciding_view=view, resolved_by=res)
json.dump(items, open(p, "w"), indent=1, ensure_ascii=False)
done = sum(1 for r in items if r["third"]); print(f"{short} #{item} → {third} ({conf}); {done}/{len(items)} read")
