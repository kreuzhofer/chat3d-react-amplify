#!/usr/bin/env python3
"""
PROTOTYPE (wayfinder #63) — draw the spot check's sample from the re-rating batch.

Usage: sample63.py <seed> <from ISO> <to ISO> [--exclude <file of example ids>] [--n 125] [--out sample63.txt]

Frame: production rows the batch rated in the window — membership read from the usage log (a judge call with
purpose vlm_evaluation, source workbench, label 'Re-eval:%' on the example inside the window; the re-evaluation
does not touch updated_at) — now under the current Instrument id (no experiment run, render success, a
judge-derived verdict), with a gate-eligible checklist (>= 3 items), outside the held-out 125 (the selections of
experiment 7337a398, where every harness lever was chosen) and outside the excluded ids (rows rated inside a
co-tenant bucket or a two-on-one moment).
Simple random draw with a recorded seed; prints the frame and the sample by category and status. Throwaway.
"""
import random, subprocess, sys

args = sys.argv[1:]
seed, frm, to = int(args[0]), args[1], args[2]
n = 125; out = "sample63.txt"; excl = set()
i = 3
while i < len(args):
    if args[i] == "--exclude": excl = {l.strip() for l in open(args[i + 1]) if l.strip()}; i += 2
    elif args[i] == "--n": n = int(args[i + 1]); i += 2
    elif args[i] == "--out": out = args[i + 1]; i += 2
    else: raise SystemExit(f"unknown arg {args[i]}")

def psql(q):
    r = subprocess.run(["docker", "compose", "exec", "-T", "postgres", "psql", "-U", "chat3d", "-d", "chat3d", "-Atc", q],
                       cwd="/Users/daniel/src/github/kreuzhofer/chat3d-app", capture_output=True, text=True, check=True)
    return [l.split("|") for l in r.stdout.splitlines()]

current = psql("select vlm_instrument_id from workbench_examples where vlm_instrument_id is not null group by 1 order by count(*) desc limit 1")[0][0]
rows = psql(f"""
select e.id, c.name, e.approval_status, jsonb_array_length(e.eval_checklist_results), e.vlm_model
from workbench_examples e join workbench_example_prompts p on p.id=e.prompt_id join workbench_categories c on c.id=p.category_id
where e.vlm_instrument_id='{current}' and e.experiment_run_id is null
  and exists (select 1 from llm_usage_events u where u.workbench_example_id=e.id and u.purpose='vlm_evaluation'
              and u.source='workbench' and u.source_label like 'Re-eval:%' and u.created_at between '{frm}' and '{to}')
  and e.render_status='success' and e.approval_status in ('auto_approved','pending')
  and jsonb_typeof(e.eval_checklist_results)='array' and jsonb_array_length(e.eval_checklist_results) >= 3
  and e.id not in (select example_id from vlm_experiment_example_selections where experiment_id='7337a398-425c-40ed-8455-a8b4ff0d1ec4')
order by e.id""")
frame = [r for r in rows if r[0] not in excl]
print(f"instrument {current}; window {frm} → {to}; candidates {len(rows)}, excluded {len(rows) - len(frame)}, frame {len(frame)}")
if len(frame) < n: raise SystemExit(f"frame smaller than the sample ({len(frame)} < {n})")
rng = random.Random(seed)
sample = rng.sample(frame, n)
sample.sort(key=lambda r: r[0])
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
