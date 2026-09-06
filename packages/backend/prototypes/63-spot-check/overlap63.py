#!/usr/bin/env python3
"""
PROTOTYPE (wayfinder #63) — which judge calls of the re-rating batch overlapped a two-on-one moment on a replica.

Usage: overlap63.py <gateway-pool.tsv> <from ISO> <to ISO> [out-file]

The batch runs one row per replica (concurrency = replicas) under least-outstanding routing; a transient second
request on one replica co-batches with the judge's call there and is not the judge that qualified (ADR 0004,
sole tenancy). gateway-poll.py (prototypes/59-one-instrument) samples per-member `inflight` every 2 s; this
script marks every sample where any member has inflight >= 2, then lists the batch's judge calls
(llm_usage_events: purpose vlm_evaluation, source workbench, label 'Re-eval:%') whose interval
[created_at - duration_ms, created_at] touches such a sample (±2 s). Those examples are excluded from the
spot check's sample frame and re-rated one at a time afterwards. Throwaway.
"""
import subprocess, sys
from datetime import datetime, timedelta, timezone

tsv, frm, to = sys.argv[1], sys.argv[2], sys.argv[3]
out = sys.argv[4] if len(sys.argv) > 4 else None
lo = datetime.fromisoformat(frm.replace("Z", "+00:00")); hi = datetime.fromisoformat(to.replace("Z", "+00:00"))

hot = []  # (ts, node, inflight)
samples = 0; errors = 0; by_node_max = {}
for line in open(tsv):
    parts = line.rstrip("\n").split("\t")
    if len(parts) < 4 or parts[1] == "ERROR":
        errors += parts[1:2] == ["ERROR"]; continue
    ts = datetime.fromisoformat(parts[0])
    if not (lo <= ts <= hi): continue
    samples += 1
    try: inflight = int(parts[3])
    except ValueError: continue
    by_node_max[parts[1]] = max(by_node_max.get(parts[1], 0), inflight)
    if inflight >= 2: hot.append((ts, parts[1], inflight))

print(f"window {frm} → {to}: {samples} member-samples, {errors} poll errors, max inflight per node {by_node_max}")
print(f"two-on-one samples: {len(hot)}" + (f" (first {hot[0][0].isoformat()} on {hot[0][1]}, last {hot[-1][0].isoformat()} on {hot[-1][1]})" if hot else ""))

sql = f"""select u.id, coalesce(u.workbench_example_id::text,''), u.created_at, coalesce(u.duration_ms,0)
from llm_usage_events u
where u.provider_name='vllm-dgx-14' and u.model_name like 'qwen3.8-27b-nvfp4%' and u.purpose='vlm_evaluation'
  and u.source='workbench' and u.source_label like 'Re-eval:%' and u.created_at between '{frm}' and '{to}' order by u.created_at"""
res = subprocess.run(["docker", "compose", "exec", "-T", "postgres", "psql", "-U", "chat3d", "-d", "chat3d", "-Atc", sql],
                     cwd="/Users/daniel/src/github/kreuzhofer/chat3d-app", capture_output=True, text=True, check=True)
calls = []
for line in res.stdout.splitlines():
    cid, ex, created, dur = line.split("|")
    end = datetime.fromisoformat(created.replace(" ", "T")).astimezone(timezone.utc)
    calls.append((cid, ex, end - timedelta(milliseconds=int(dur)), end))
print(f"batch judge calls in window: {len(calls)} on {len({c[1] for c in calls})} examples")

slack = timedelta(seconds=2)
hot_ts = [h[0] for h in hot]
flagged = {}
i = 0
for cid, ex, start, end in calls:
    for ts in hot_ts:
        if start - slack <= ts <= end + slack:
            flagged.setdefault(ex, []).append(ts.isoformat()); break
print(f"judge calls overlapping a two-on-one sample: {sum(1 for c in calls if c[1] in flagged)} on {len(flagged)} examples")
if out:
    with open(out, "w") as f:
        for ex in sorted(flagged): f.write(f"{ex}\n")
    print(f"flagged example ids → {out}")
for ex, ts in list(flagged.items())[:20]: print(f"  {ex[:8]}  {ts[0]}")
