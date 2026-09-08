# PROTOTYPE — wayfinder #83: the re-qualification under the three-view follow-up

Throwaway record. Primary source for the resolution on [issue #83](https://github.com/kreuzhofer/chat3d-app/issues/83)
(map #45). The code this ticket lands is the **adoption of `wayfinder/67-zoom-views`** — the follow-up's fixed view
set — plus the one call site the merge exposed; the measurement below is what the adoption is judged by.

## The adoption

`wayfinder/67-zoom-views` merged to `main`. #67 decided the fixed set `top` + 45° down + 45° up and deliberately
deferred adoption to "the next instrument revision"; this is it. The merge was clean except for one file both sides
had rewritten — `visual-eval-zoom.service.ts`, where #67's three-view logic and #71's `endpointUrl` stamp on the
follow-up call both had to survive, and they do — and one call site that only broke once the branch met `main`:
`eval-orchestrator.service.ts` still read `ZoomFollowUpDetail.angle` after #67 renamed it to `.angles`, so the
trace's tool-call summary now records the whole view set (`views: top, ortho_45, ortho_45_bottom`) instead of a
single angle. `tsc` 55 before and after — `main`'s count, not #42's recorded 53. Suite 791 passed with the one
known baseline failure (`component-render.test.ts`).

**The id moved as #67 predicted**, computed before deploying and confirmed after:

    production@22e0f10b0505  →  production@4892d8d1b160

The serving work of #69–#72 does not touch the procedure hash, so the prediction survived four tickets. After the
deploy `GET /api/admin/workbench/instrument` reads **rated 2,527, current 0, Stale 2,527** (staleApproved 2,114),
and the export **2,118 approved / 0 admitted / 0 provisional / 2,118 stale**. Staleness is computed, never written,
so a revert restores the corpus exactly.

## The condition the pair runs under

Daniel's call: **N=3 / R=3**, #61's clean-pair condition, so stability is compared like-for-like against the run the
bar was set on. `global.vlm_experiment_concurrency` 2 → 3 (it had read 2 since 09-07 15:48 while the pool came back
to three replicas). This pair doubles as the **concurrency-3 self-pair dgx-manager asked for** — the one deferred
after spark-02's return, proving the restored replica reproduces on outputs and not only on config.

**This is the first judge run the serving gate covers end to end.** Its pre-flight logged
`configured 3, servingReplicas 3, concurrency 3, clamped false`, and #71's stamp lands on every call:
`serving_replicas 3, driver_concurrency 3, serving_max_inflight 0–1, serving_source gateway` — the 0-or-1 reading
#71 documented for N ≤ R, where a 2 is the co-tenant the gate trips on. Sole tenancy is kept by rule (#65): Daniel
off chat for the qwen window, tenancy read back from `llm_usage_events` afterwards.

## The runs

| run | judge | experiment | when (UTC) | role |
|---|---|---|---|---|
| `05c9a31e` | qwen3.8-27b-nvfp4 (thinking off) | `4bbbee7c` | 10:55:07–11:08:44 | candidate arm A |
| `f97687ee` | same | `3f7d07f2` | 11:08:53–11:21:41 | candidate arm B (stability pair) |
| `bc4354d4` | Claude Sonnet 4.6 (Anthropic, thinking off) | `3f7a63aa` | 11:22:10–11:38:19 | reference under the new id |

Pinned replica probe, 40 of the 125, N=1, straight at each node's `:8000` (no gateway):

| run | node | when (UTC) | outcome |
|---|---|---|---|
| `a890259c` | spark-02 | 11:39:47–11:49:29 | arm 02a |
| `91bb394f` | spark-02 | 11:49:29–11:58:10 | arm 02b (self-pair) |
| `e54bf32e` | spark-03 | 11:58:10–12:21:54 | **VOID** — engine hung, then the node was torn down |
| `93176602` | spark-04 | 12:21:54–12:30:55 | arm 04 |

## Files

- `examples125.txt` — the fixed 125, the selections of `7337a398`, copied by id.
- `run83.sh` — one subcommand per step: `arm`, `status`, `runid`, `screen`, `tenancy`.
- `exp83-*.txt` / `start83-*.txt` / `end83-*.txt` / `run83-*.txt` — the ids and the window.
- `screen83.txt` — the qualification screen; `disagreements-qwen-vs-sonnet.md` — the dump the adjudication works from.

## Readings

### The screen: MECHANICAL PASS (`screen83.txt`)

- **Identity** PASS — `production@4892d8d1b160`, effort `off`, same id across all three runs.
- **Completeness** PASS — both judges, all six counts zero. **Residual uncertain 0 on both**, against Sonnet's 14
  under the old follow-up (#61). 57 items were uncertain at first pass and every one resolved. This is the
  revision's clearest win and it is a *completeness* gain, not a leniency shift.
- **Stability** PASS — 2.7% hard flips (limit 2.9%), 97.3% identical (limit 90%).
- **Raw agreement with the reference** (recorded, not gating): 86.3% identical, 13.7% hard flips (70 items);
  raw false passes 28 of 110 reference fails, raw false fails 42 of 401 reference passes; item gate 79.2% agree
  (false accepts 15 / rejects 5, approves 48 vs 38). Dump: **70 items on 47 examples**.
- **Throughput**: qwen 18.0–19.3 s/example, 12.6–13.5 min for 125; Sonnet 22.8 s, 15.9 min.
- **Adjudicated terms are NOT decided** — they need Daniel's verdicts on the dump (ADR 0004).

### The finding: the pool stopped reproducing, and the replicas are why

The stability term passed, but only by sitting at the edge of a floor it used to be nowhere near. **#61 measured
this exact condition at 511/511 items identical and 124/125 responses byte-identical.** Today the same condition
gives 497/511 and **67 of 125 example results identical**, spread evenly across the run (identical per fifth:
11/18/12/13/13). Score-level it is invisible — mean abs delta 0.184, *inside* Sonnet's own 0.288 floor — which is
the map's standing lesson landing again: the mean hid it, the item level showed it.

The serving condition was not assumed, it was recorded. Every one of the 279 judge calls stamped
`serving_replicas 3, driver_concurrency 3, serving_max_inflight <= 1, serving_source gateway`, and the tenancy
audit shows **0 other tenants in all ten 3-minute buckets** (`tenancy83.txt`). N <= R held throughout, with no
co-tenant and no replica loss. **This was the first judge run the serving gate covered end to end**, and it worked:
the pre-flight logged `configured 3, servingReplicas 3, clamped false`.

**The pinned probe settles it** (`probe-comparisons.txt`), 40 examples, 136 items, N=1, gateway bypassed:

| pair | items | same verdict | hard flips | identical detail |
|---|---|---|---|---|
| **02a vs 02b** (same node) | 136 | 136 | **0** | **136/136** |
| **02a vs 04** (across nodes) | 136 | 126 | **10 (7.4%)** | **5/136** |

**A pinned node reproduces itself byte-for-byte.** So nothing per-request breaks determinism — MTP is exonerated
on qwen, and dgx-manager's glm result (5 distinct replies from 32 sequential requests at N=1/R=1) is a glm
statement, not a cluster one. **Two replicas of the same model, same build, same flags, disagree on 7.4% of
items — more than twice the 2.9% the bar allows between two runs of the judge — and produce different text on
131 of 136.**

The mechanism, dgx-manager's, as corrected by dgx-manager. **Both superseded steps are kept deliberately**, because
the ticket needs them to explain why anyone believed the conclusion:

1. *(superseded)* The gateway keeps one rotation counter per published name that persists across runs, so arm B's
   examples were served by different replicas than arm A's. Arithmetic real (arm A consumed 139 calls, 139 mod 3 = 1)
   but **largely inert at N=3**: walking `selectLeastOutstanding`, once three requests are in flight the tied set
   collapses to one and selection is *forced* to whichever replica just completed. The counter is consumed on every
   call and almost never chooses.
2. *(superseded)* An "arm C" with the counter realigned would restore the mapping. Dropped: arm C at N=1 would have a
   rotation-determined mapping compared against arm A's *timing*-determined one, varying concurrency and mapping at
   once. 02a/02b is the test that should have been proposed first — a pair whose mapping is not merely deterministic
   but **constant**.
3. **What survives.** Replicas are not numerically interchangeable (measured above), and at N=3 which replica serves
   an example is timing-dependent and therefore varies run to run. Link 1 does all the work; the timing dependence
   only makes it observable — which also explains why 09-06 reproduced 511/511 under the *same* N=3 timing
   dependence: with interchangeable replicas, assignment could shuffle freely with no visible effect.

**Why the replicas differ.** Same build, same flags on all three (`v0.27.2rc1.dev113+g5cecfc013`, FlashInfer, MTP 5
draft tokens, `max_num_seqs` 8, `gmu` 0.88), but they are different **processes**: engines started 09-06 10:50
(spark-04), 09-07 18:27 (spark-02, after the OOM), 09-08 12:40 (spark-03, after this incident). FlashInfer autotunes
per process and the three logs do not agree on how much of it they did — 24 autotune lines, 8, 16. Hardware is
excluded: spark-02's bandwidth fingerprint is healthy (read 226 GB/s > copy 203 GB/s under load; the degraded state
that cost the AC drain had the ordering *inverted*, read 130 < copy 160). That rests on spark-02 alone — dgx-manager
abandoned the spark-03/04 probes mid-job rather than risk OOM-killing a serving replica, which was the right call.

### Two void-run near-misses, and the rule that survives them

**Both would have produced a confident answer from an empty table, and one of them got past a guard written to stop
exactly that.**

1. The three pinned providers were created with a null `provider_type`, so every call raised
   `Unsupported provider` before reaching a node. The runs still reported `completed, 40/40`. Caught only because
   40 examples came back in 20 s instead of 11 min — had it been slower, `compare 02a 02b` would have read
   **0 scored vs 0 scored as perfect agreement**, which is the answer I was hoping for.
2. The guard added in response counted rows with a **non-null `visual_score`** and aborted below 40. Arm 03 returned
   40 rows — every one a failed evaluation stored as **score 1.0**, which is non-null. The guard passed a completely
   void arm; it was caught only because the comparison SQL choked on `checklist_results` being JSON null.

**The rule: a terminal status is a claim about the process, not about the output — and a guard on a field the
failure path also populates is not a guard.** Test the output: a non-empty checklist array, not a score that a
failure also writes. dgx-manager found the same shape independently in the benchmark server
(`finalizeThroughput` completes on exit code alone with no data check, so two empty runs compare as agreement).
Three instances in one session.

### spark-03: hung, then deleted by an automatic teardown

Arm 03 started 11:58:10Z and wrote **no rows for nine minutes** — the engine accepted connections and never
answered. First row 12:07:16Z (a hard timeout), teardown 12:07:35Z, remaining 39 rows failing fast. Nobody issued
it: `ws/deployment-status-handler.ts:169` tears down every rank of a dgxrun deployment when any rank reports
`failed`, and the agent's trigger (`dgxrun-metrics.ts:81`) watches **container state and restart count, not whether
the engine answers**. So a hung engine inside a running container was invisible for nine minutes; then the container
died and the response was instant and destructive. The undeploy removed the container, the deployment log had
stopped being written on 09-06, and the recorded `error` is `firstErrorLine()` — a benign startup warning. **The
cause is now unrecoverable rather than merely unknown.** Both dgx-manager's bandwidth probe (~11:27Z) and this
ticket's pinned arm (from 11:58Z) sit in the window and neither can be ruled out. dgx-manager filed it as #94, and
the `finalizeThroughput` sibling as #95.

spark-03 was restored 12:40:52Z and the pool reads `servingCount 3` again — **but that is three deploy generations,
not two. Restoring capacity did not restore interchangeability.**

### State left behind

- `global.vlm_experiment_concurrency`: found at **2** (a leftover from 09-07 when R was 2), set to **3** for the
  pair, **1** for the pinned probe, and **restored to 3** — matching the pool, with #72's clamp as the backstop.
- Three provider rows (`vllm-spark-02/03/04`, `openai-compatible`) and three model rows
  (`e581e03d`, `25d01f5a`, `c7bd148d`) pinning each node. Additive, unused by any purpose map. Keep them if the
  pairwise sweep becomes routine; otherwise they can be deleted.
- The corpus: **2,527 rated, 0 current, 2,527 Stale**; export 2,118 approved / 0 admitted / 0 provisional /
  2,118 stale. The qualified-judges list is still empty and the batch has not been run.
