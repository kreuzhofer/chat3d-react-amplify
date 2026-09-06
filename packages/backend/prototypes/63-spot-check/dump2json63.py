#!/usr/bin/env python3
"""
PROTOTYPE (wayfinder #63) — parse the screen's disagreement dump into the adjudication page's record shape.

Usage: dump2json63.py disagreements-batch-vs-sonnet.md items63.json

The dump (qualification-screen-dump.ts) is one section per example — heading with category and id, a quoted
prompt, a table `| # | item | <reference> | <candidate> | verdict |` with `**state** — detail` cells. Records use
the #57 field names (build.py / page.template.html): `sonnet` = the reference, `qwen` = the candidate (here the
corpus's own rating by the qualified judge). The third-opinion fields are left empty for the reading. Throwaway.
"""
import json, re, sys

src, dst = sys.argv[1], sys.argv[2]
text = open(src).read()
head = re.search(r"^# Disagreements: (.+?) vs (.+?)$", text, re.M)
cand_label, ref_label = head.group(1), head.group(2)
items = []; ex_no = 0
for sec in re.split(r"^## (?=\d+\. )", text, flags=re.M)[1:]:
    m = re.match(r"(\d+)\. (.+?) — example `([0-9a-f-]+)`", sec)
    ex_no, category, example_id = int(m.group(1)), m.group(2), m.group(3)
    pm = re.search(r"^> (.*)$", sec, re.M); prompt = pm.group(1) if pm else ""
    for row in re.findall(r"^\| (\d+) \| (.*?) \| \*\*(pass|fail|uncertain)\*\* — (.*?) \| \*\*(pass|fail|uncertain)\*\* — (.*?) \|(?: (same|\*\*.*?) \|)?  \|$", sec, re.M):
        idx, q, rs, rd, cs, cd, arm2 = row
        zoom = None
        if rd.startswith("[2x zoom]"): zoom = "zoom"   # the angle is only in the backend log; marked, resolved later
        items.append(dict(ex=ex_no, category=category, example_id=example_id, prompt=prompt.replace("\\|", "|"),
                          item=int(idx), text=q.replace("\\|", "|"),
                          sonnet=rs, sonnet_detail=rd.replace("\\|", "|"), qwen=cs, qwen_detail=cd.replace("\\|", "|"),
                          arm3=arm2 or "n/a", verdict="", short=example_id[:8], sonnet_zoom_angle=zoom,
                          third="", confidence="", what="", deciding_view="", resolved_by="", source="new"))
json.dump(items, open(dst, "w"), indent=1, ensure_ascii=False)
hard = sum(1 for i in items if i["sonnet"] != "uncertain" and i["qwen"] != "uncertain")
print(f"{cand_label} vs {ref_label}: {len(items)} items on {len({i['example_id'] for i in items})} examples, {hard} hard flips → {dst}")
