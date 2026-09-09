#!/usr/bin/env python3
"""Build the #85 adjudication material from items85.json (the #57/#63 pattern, re-pointed at the re-qualification).

  python3 build85.py sheet                      -> third-opinion85.md (next to this file)
  python3 build85.py page VIEWS_DIR OUT.html    -> the adjudication page, views inlined (the #57 template, retitled)

items85.json comes from dump2json63.py (the #83 screen's dump parsed) with the third-opinion fields filled by the
reading; adjudicated85.json, when present, holds Daniel's verdicts read from the page's store. Field names follow
#57's build.py: `sonnet` is the reference, `qwen` the candidate — here the corpus's own rating by the qualified
judge (qwen3.8-27b-nvfp4, thinking off) written by the first re-rating batch. VIEWS_DIR is views63.sh's output.
"""
import base64, collections, html, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ITEMS = json.load(open(os.path.join(HERE, "items85.json")))
ADJ_PATH = os.path.join(HERE, "adjudicated85.json")
ADJ = {f"{r['short']}-{r['item']}": r for r in json.load(open(ADJ_PATH))} if os.path.exists(ADJ_PATH) else {}
VIEWS = ["front", "back", "left", "right", "top", "bottom", "ortho_45", "ortho_45_bottom"]
REF, CAND = "Claude Sonnet 4.6 (thinking off)", "qwen3.8-27b-nvfp4 (thinking off), candidate arm 05c9a31e"
INSTRUMENT = "production@4892d8d1b160"
TEMPLATE = os.path.join(HERE, "..", "57-adjudication", "page.template.html")


def direction(r):
    q, s = r["qwen"], r["sonnet"]
    if q == "fail" and s == "pass": return "batch fails, Sonnet passes"
    if q == "pass" and s == "fail": return "batch passes, Sonnet fails"
    if q == "uncertain": return f"batch uncertain, Sonnet {s}es"
    return f"Sonnet uncertain, batch {q}s"


def tally(items, verdict_of):
    """Counts under the bar's terms for the hard flips; verdict_of(item) -> R/C/N/None."""
    t = dict(qfp=0, sfp=0, qff=0, sff=0, n=0, undecided=0, hard=0)
    for r in items:
        if r["sonnet"] not in ("pass", "fail") or r["qwen"] not in ("pass", "fail"): continue
        t["hard"] += 1
        v = verdict_of(r) or None
        if v is None: t["undecided"] += 1; continue
        if v == "N": t["n"] += 1; continue
        if r["qwen"] == "fail":   # Sonnet passed
            if v == "R": t["qff"] += 1
            else: t["sfp"] += 1
        else:                     # batch passed, Sonnet failed
            if v == "R": t["qfp"] += 1
            else: t["sff"] += 1
    return t


def sheet():
    T = tally(ITEMS, lambda r: r["third"])
    by_dir = collections.defaultdict(collections.Counter)
    for r in ITEMS: by_dir[direction(r)][r["third"] or "-"] += 1
    n_ex = len({r["example_id"] for r in ITEMS})
    out = [f"# Third opinion on the {len(ITEMS)} disagreements of the re-qualification: {CAND} vs {REF}\n",
           f"Instrument `{INSTRUMENT}`. Candidate arm A (`05c9a31e`, N=3/R=3) against the reference run `bc4354d4` on the fixed 125 "
           f"(#83's screen dump; {n_ex} examples carry a disagreement — ADR 0004's adjudicated terms, #85). Triage per the standing decision on map #45: Fable 5.1 read the eight stored "
           "views of every example (two 2×2 contact sheets per example, single views at full size where a count or a small "
           "feature decided it) and gave each disagreeing item a verdict. **Daniel is the arbiter**; nothing here counts toward "
           "the bar until he confirms it. Verdict: **R** the reference (Sonnet) is right, **C** the candidate (the batch's "
           "rating) is right, **N** neither, or the item cannot be answered from renders.\n",
           "## Tally (third opinion, not verdicts)\n", "| direction | items | R (Sonnet right) | C (batch right) | N |\n|---|---|---|---|---|"]
    for d, c in by_dir.items():
        out.append(f"| {d} | {sum(c.values())} | {c['R']} | {c['C']} | {c['N']} |")
    out.append("")
    out.append(f"On the {T['hard']} hard flips: **batch false passes {T['qfp']} vs Sonnet false passes {T['sfp']}** "
               f"(bar: batch ≤ Sonnet — {'holds' if T['qfp'] <= T['sfp'] else 'fails'}); "
               f"**batch false fails {T['qff']} vs Sonnet false fails {T['sff']}** "
               f"(bar: batch ≤ 2× Sonnet = {2 * T['sff']} — {'holds' if T['qff'] <= 2 * T['sff'] else 'fails'}); "
               f"{T['n']} items N, {T['undecided']} unread.\n")
    if ADJ:
        DT = tally(ITEMS, lambda r: ADJ.get(f"{r['short']}-{r['item']}", {}).get("daniel"))
        agree = sum(1 for r in ITEMS if ADJ.get(f"{r['short']}-{r['item']}", {}).get("daniel") == r["third"])
        out.append("## Daniel's verdicts (from the page's store) — the adjudication that counts\n")
        out.append(f"{len(ADJ)} adjudicated; agrees with the third opinion on {agree}, overrules it on {len(ADJ) - agree}. "
                   f"On the {DT['hard']} hard flips: **batch false passes {DT['qfp']} vs Sonnet false passes {DT['sfp']}** "
                   f"(bar ≤: {'holds' if DT['qfp'] <= DT['sfp'] else 'fails'}); **batch false fails {DT['qff']} vs Sonnet false fails {DT['sff']}**, "
                   f"allowance {2 * DT['sff']} (bar ≤ 2×: {'holds' if DT['qff'] <= 2 * DT['sff'] else 'fails'}); {DT['n']} N, {DT['undecided']} undecided.\n")
        out.append("| example · item | batch | Sonnet | Fable | **Daniel** | note |\n|---|---|---|---|---|---|")
        for r in ITEMS:
            a = ADJ.get(f"{r['short']}-{r['item']}")
            if a and (a.get("daniel") != r["third"] or a.get("daniel_note")):
                out.append(f"| `{r['short']}` #{r['item']} {r['text'][:60]} | {r['qwen'][0].upper()} | {r['sonnet'][0].upper()} | {r['third']} | **{a.get('daniel')}** | {a.get('daniel_note', '')} |")
        out.append("")
    out.append("## The table\n")
    out.append("| # | example | item | batch | Sonnet | third | conf. | what the views show | deciding view | resolved by | **Daniel** |")
    out.append("|---|---|---|---|---|---|---|---|---|---|---|")
    for r in ITEMS:
        z = " (zoom)" if r.get("sonnet_zoom_angle") else ""
        daniel = ADJ.get(f"{r['short']}-{r['item']}", {}).get("daniel", "")
        out.append(f"| {r['ex']} | {r['category']} `{r['short']}` | {r['item']} {r['text']} | {r['qwen'][0].upper()} | "
                   f"{r['sonnet'][0].upper()}{z} | **{r['third']}** | {r['confidence']} | {r['what']} | {r['deciding_view']} | {r['resolved_by']} | {daniel} |")
    out.append("")
    open(os.path.join(HERE, "third-opinion85.md"), "w").write("\n".join(out) + "\n")
    print("sheet written;", T)


def page(views_dir, out_path):
    paths = json.load(open(os.path.join(views_dir, "views.json")))
    view_data = {}
    for short in sorted({r["short"] for r in ITEMS}):
        e = next(v for v in paths if v["id"].startswith(short))
        view_data[short] = {k: "data:image/png;base64," + base64.b64encode(open(os.path.join(views_dir, e[k]), "rb").read()).decode()
                            for k in VIEWS}
    items = []
    for r in ITEMS:
        items.append(dict(id=f"{r['short']}-{r['item']}", ex=r["ex"], category=r["category"], short=r["short"],
                          example_id=r["example_id"], item=r["item"], text=r["text"], prompt=r["prompt"],
                          qwen=r["qwen"], qwen_detail=r["qwen_detail"], sonnet=r["sonnet"], sonnet_detail=r["sonnet_detail"],
                          zoom=r.get("sonnet_zoom_angle"), third=r["third"], confidence=r["confidence"], what=r["what"],
                          view=r["deciding_view"], resolved_by=r["resolved_by"], carried=False, direction=direction(r)))
    n_ex = len({r["example_id"] for r in ITEMS})
    tpl = open(TEMPLATE).read()
    tpl = (tpl.replace("<title>The 69 Disagreements</title>", "<title>The Re-qualification</title>")
              .replace("<h1>The 69 Disagreements</h1>", f"<h1>The Re-qualification: {len(ITEMS)} Disagreements</h1>")
              .replace("qwen3.8-27b-nvfp4 vs Claude Sonnet 4.6, thinking off, the 125 under", f"qwen3.8-27b-nvfp4 (thinking off, the 3-node pool, arm 05c9a31e) vs Claude Sonnet 4.6 (thinking off) on the 125 under")
              .replace("adjudication for #57", "adjudication for #85")
              .replace('<span id="progTxt">0 of 69</span>', f'<span id="progTxt">0 of {len(ITEMS)}</span>')
              .replace('const LS_KEY = "adjudication-57-verdicts";', 'const LS_KEY = "adjudication-85-verdicts";')
              # one item has the batch uncertain and Sonnet passing: not a hard flip, its own direction, outside the tally
              .replace('const dirKey = it => it.sonnet === "uncertain" ? "u" : (it.qwen === "fail" ? "fp" : "pf");',
                       'const dirKey = it => (it.sonnet === "uncertain" || it.qwen === "uncertain") ? "u" : (it.qwen === "fail" ? "fp" : "pf");')
              .replace('const dirLabel = it => dirKey(it) === "u" ? `Sonnet uncertain · qwen ${it.qwen}s` : (dirKey(it) === "fp" ? "qwen fails · Sonnet passes" : "qwen passes · Sonnet fails");',
                       'const dirLabel = it => dirKey(it) === "u" ? (it.sonnet === "uncertain" ? `Sonnet uncertain · qwen ${it.qwen}s` : `qwen uncertain · Sonnet ${it.sonnet}es`) : (dirKey(it) === "fp" ? "qwen fails · Sonnet passes" : "qwen passes · Sonnet fails");')
              .replace('    if (it.sonnet === "uncertain") continue;\n    t.hard++;', '    if (it.sonnet === "uncertain" || it.qwen === "uncertain") continue;\n    t.hard++;')
              .replace('<button aria-pressed="false" data-val="u">Sonnet uncertain</button>', '<button aria-pressed="false" data-val="u">one side uncertain</button>'))
    doc = tpl.replace("/*__ITEMS__*/", json.dumps(items, ensure_ascii=False)).replace("/*__VIEWS__*/", json.dumps(view_data))
    open(out_path, "w").write(doc)
    print("page written:", out_path, f"{os.path.getsize(out_path) / 1e6:.1f} MB")


if __name__ == "__main__":
    if sys.argv[1] == "sheet": sheet()
    elif sys.argv[1] == "page": page(sys.argv[2], sys.argv[3])
