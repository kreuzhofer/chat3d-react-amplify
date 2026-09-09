#!/usr/bin/env python3
"""
PROTOTYPE (wayfinder #91) — draw a sitting's sample from the corpus's current rows.

Usage: sample91.py <seed> [--n 125] [--exclude <file of example ids>]...

Frame: production rows under the current Instrument id (no experiment run, render success, a judge-derived verdict —
auto_approved or pending), with a gate-eligible checklist (>= 3 items), outside the held-out 125 (the selections of
experiment 7337a398) and outside every excluded list — the earlier spot-check samples (#63, #87) and every earlier
#91 sample, so a row is adjudicated at most once. Simple random draw with a recorded seed. Writes
sample91-<seed>.txt next to this file and prints the frame and the sample by category and status.
"""
import os, random, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
HELD_OUT = "7337a398-425c-40ed-8455-a8b4ff0d1ec4"
args = sys.argv[1:]
seed = int(args[0]); n = 125; excl = set()
i = 1
while i < len(args):
    if args[i] == "--exclude": excl |= {l.strip() for l in open(args[i + 1]) if l.strip()}; i += 2
    elif args[i] == "--n": n = int(args[i + 1]); i += 2
    else: raise SystemExit(f"unknown arg {args[i]}")


def psql(q):
    r = subprocess.run(["docker", "compose", "exec", "-T", "postgres", "psql", "-U", "chat3d", "-d", "chat3d", "-Atc", q],
                       cwd=os.path.join(HERE, "..", "..", "..", ".."), capture_output=True, text=True, check=True)
    return [l.split("|") for l in r.stdout.splitlines()]


current = psql("select vlm_instrument_id from workbench_examples where vlm_instrument_id is not null group by 1 order by count(*) desc limit 1")[0][0]
rows = psql(f"""
select e.id, c.name, e.approval_status, jsonb_array_length(e.eval_checklist_results), e.vlm_model
from workbench_examples e join workbench_example_prompts p on p.id=e.prompt_id join workbench_categories c on c.id=p.category_id
where e.vlm_instrument_id='{current}' and e.experiment_run_id is null
  and e.render_status='success' and e.approval_status in ('auto_approved','pending')
  and jsonb_typeof(e.eval_checklist_results)='array' and jsonb_array_length(e.eval_checklist_results) >= 3
  and e.id not in (select example_id from vlm_experiment_example_selections where experiment_id='{HELD_OUT}')
order by e.id""")
frame = [r for r in rows if r[0] not in excl]
print(f"instrument {current}; candidates outside the held-out 125: {len(rows)}, excluded {len(rows) - len(frame)}, frame {len(frame)}")
if len(frame) < n: raise SystemExit(f"frame smaller than the sample ({len(frame)} < {n})")
rng = random.Random(seed)
sample = sorted(rng.sample(frame, n), key=lambda r: r[0])
out = os.path.join(HERE, f"sample91-{seed}.txt")
with open(out, "w") as f:
    for r in sample: f.write(r[0] + "\n")


def dist(rs, k):
    d = {}
    for r in rs: d[r[k]] = d.get(r[k], 0) + 1
    return dict(sorted(d.items(), key=lambda kv: -kv[1]))


print(f"seed {seed}, sample {n} → {out}")
print("frame by category: ", dist(frame, 1))
print("sample by category:", dist(sample, 1))
print("frame by status:   ", dist(frame, 2), "| sample:", dist(sample, 2))
print("items in sample:   ", sum(int(r[3]) for r in sample), "| judges:", dist(sample, 4))
