# PROTOTYPE — wayfinder #87: the re-rating batch and its spot check under production@4892d8d1b160

Throwaway record. Primary source for the resolution on [issue #87](https://github.com/kreuzhofer/chat3d-app/issues/87)
(map #45). The last leg of #83: the corpus re-rated under the three-view instrument by the judge #85 qualified, then
#63's spot check on 125 of the batch's rows against Sonnet 4.6 — the step that confirms or revokes the grant.

## The batch

`POST /api/admin/workbench/re-rate-stale/batch {"limit": 5000, "concurrency": 3}` — one row per replica of the
`qwen3.8-27b-nvfp4` pool (spark-02/03/04), `vlm_eval` on row `98d284fe` (thinking off), the serving gate (#72) carrying
#65's rule. Daniel's window: **start now** (2026-09-09, a Wednesday morning), off chat for the run; the gate backs a
co-tenant off and halts after 60 s, resumable. `gateway-poll.py` (prototypes/59-one-instrument) samples per-member
`inflight` every 2 s into `gateway-pool87.tsv`.

- `start87.txt` — the window start; `job87.json` — the job as started (`job-1788945085179-1`, total 2,527, concurrency 3).
- The gate's pre-flight: `configured 3, servingReplicas 3, concurrency 3, clamped false`.
- `spot87.sh` — #63's `spot63.sh` re-pointed: `audit` | `sample <seed>` | `reference` | `status` | `screen`; the
  audit, overlap and sampler scripts are reused from `../63-spot-check/` by path.

## The outage (2026-09-09, first attempt)

- 09:11:25Z start, `job-1788945085179-1`, 12–13 rows/min, 0 failures, 0 back-offs, one request per replica.
- **10:47:55Z** last judge call that reached the pool. From then on every container on this Mac could not reach
  `192.168.44.14:4000` ("connection refused"; ping to the host fails from the Colima VM, internet TCP still works),
  while the Mac itself reaches the gateway (HTTP 200). The Mac's own connectivity had flapped between 09:34 and
  11:10 UTC (`gateway-pool87.tsv`: 875 poller errors — "Connection reset", "No route to host") and recovered; the VM
  did not. `colima restart` did not fix it; both VM paths (slirp `eth0` and vmnet `col0`) fail to every LAN host.
  Leading suspect: macOS Local Network privacy for the Lima host process (`limactl usernet`) — LAN blocked, internet
  allowed, from inside the VM only. Daniel: reboot.
- **The batch kept "completing" rows against the dead gateway**: code review failed after 3 attempts, the orchestrator
  "continued to VLM", the judge call failed, and the re-evaluation "proceeded with code-only" — writing
  `visual_score NULL`, `vlm_instrument_id NULL`, `pending` over each row's stored (Stale) rating. `completed` rose,
  `failed` stayed 0, the serving gate saw R-unknown and proceeded. **Cancelled at 11:12:03Z at 1,361 completed.**
- **175 rows voided** (`voided87.txt` = re-evaluated in the window ∩ now unrated pending; `reeval-since-1040.txt`,
  `unrated-pending-now.txt`, `backend-log-outage87.txt`): rated 2,527 → 2,360, the #68 class 134 → 310 (+176, one
  from a non-void cause), export admitted 1,047 at the cancel. They are invisible to the stale batch (its frame needs a
  visual score) and must be re-rated by id.
- **Defect to fix before resuming:** a failed judge call in the re-evaluation path must fail the row, not overwrite a
  stored rating with a void one — a terminal status is a claim about the process, not the output (the #83 lesson).

## The recovery (2026-09-09, after the reboot)

- A reboot restored the VM's LAN access (`colima restart` alone had not); Colima had to be started by hand afterwards.
- **The defect is fixed on `main` (e1bb94a, merge of fc273fd):** the pipeline result names the judge's outcome
  (`rated` / `reused` / `skipped_no_images` / `skipped_code_review` / `skipped_assertions` / `failed`) and the
  re-evaluation refuses to write a `failed` one — the row keeps its stored rating and the batch counts a failure.
  The stale batch accepts `exampleIds`, because an unrated row is outside the Stale frame. Tests:
  `workbench-reeval-judge-outcome.test.ts` (the void write, and the deliberate skip that still writes),
  `workbench-instrument.test.ts` (the by-id frame). `tsc` 55 before and after; suite 807 passed with the one known failure.
- **The void signature**, for the record: `visual_score NULL`, `code_eval_score 1.0`, `eval_score 1.0`,
  `eval_source 'code_only'`, `vlm_instrument_id NULL`, `pending`, `eval_issues` carrying
  "Code review failed: Empty response from code review LLM". 178 rows matched it; with the 175 identified at the
  cancel that made **179** (`voided87-final.txt`; the four extras were in flight at the cancel or pre-existing).
- **The 179 re-rated by id** — `job-1788953848740-1`, 11:37:28–11:52 UTC, concurrency 3, 179/179, 0 failures, 0 back-offs,
  **0 other tenants** in the window (`start87-voided.txt`, `end87-voided.txt`, `gateway-pool87-voided.tsv`):
  158 auto-approved, 20 pending, 1 left unrated by the code-review short-circuit (the #68 class, legitimately).
  Corpus after: rated 2,531 / current 1,360 / stale 1,171; export 2,108 approved / 1,205 admitted.
- **The stale batch resumed at 11:53:17 UTC** as `job-1788954797766-2` on the remaining **1,166** rows, concurrency 3
  (`start87b.txt`, `job87b.json`), with the monitor also watching the rated count for any drop.

## The batch, complete (2026-09-09)

- `job-1788954797766-2`: 1,166/1,166 rows, 11:53:17–13:53 UTC, 0 failures, 0 back-offs, ~11 rows/min.
- **Corpus after:** rated 2,522 / current 2,517 / Stale 5 (the 5 unratable rows without the eight views);
  **export 2,121 approved / 2,112 admitted / 0 provisional / 9 stale.** Among current-id rows: 2,112 auto-approved,
  405 pending. The #68 class (unrated pending, render ok) 134 → **144** beside this run.
- **Audit over the whole window 09:11:25–13:54:10 UTC** (`tenancy87.txt`, `overlap87.txt`): 2,517 judge calls on
  2,517 examples, **0 other tenants**, max inflight 1 on every node across 20,436 member-samples, **0 two-on-one**,
  **0 flagged**.
- **Sample** (`sample87.py` seed 87, `sample87-draw.txt`): frame 1,216 (batch rows under the current id with ≥ 3 items,
  outside the held-out 125; 965 approved / 251 pending, 16 categories) → 125 rows, 456 items, 85 approved / 40 pending.
- **Reference**: experiment `dadf32f4`, Claude Sonnet 4.6 (Anthropic API, thinking off, the #64 recipe) on exactly
  those rows, started 13:54:33 UTC (`exp87.txt`, `start87-sonnet.txt`).

## The spot check (2026-09-09)

- **Reference arm** `dadf32f4` (run `02c24abc`): 125/125, 13:54:33–14:06 UTC, 16.4 s per example, 526 output tokens, 0 residual uncertain, all six completeness counts zero.
- **The screen** (`screen87-batch-vs-sonnet.txt`): identity PASS both sides; completeness PASS (batch 456 items, 0 residual uncertain);
  **93.2% identical, 31 hard flips (6.8%)**, raw false passes 14 of 24 reference fails, raw false fails 17 of 432
  reference passes; item gate 84.8% agree (false accepts 10 / rejects 9, approves 107 vs 106); scores same 18.4%, mean
  abs Δ 1.224 (batch 9.06 vs Sonnet 8.28). Dump: **31 items on 23 examples** (`disagreements87-batch-vs-sonnet.md`).
- **The page:** *The Second Spot Check* — https://claude.ai/code/artifact/77301d83-215d-4b90-9581-5250257318a4
  (capability `db`, collection `verdicts`; 7.0 MB). `build87.py` / `third87.py` are #85's builders re-pointed.
- **The third opinion (triage, not verdicts)** — Fable 5.1 from the sheets, single views at full size where it
  decided (`third-opinion87.md`); one count measured rather than read (`59cd58c4`: 24 tooth flanks on every scanned
  row of the full-size top view):

  | direction | items | R (Sonnet right) | C (batch right) | N |
  |---|---|---|---|---|
  | batch passes, Sonnet fails | 14 | 6 | 8 | 0 |
  | batch fails, Sonnet passes | 17 | 14 | 2 | 1 |

  As read: **batch false passes 6 vs Sonnet 2 — fails the term for the first time**; **batch false fails 14 vs Sonnet 8,
  allowance 16 — holds**; 1 N. Three of the six false passes sit on one example, the wrecked strap hinge `10a93ee5`
  (knuckles, pin, leaves credited to a strip with a stub); the others are the rack's 24 teeth counted as 25, retaining
  lips on a plain U, and a spike's taper read as an arc. Sonnet's two false passes are a kidney bean's cusp and a
  gear-tooth trapezoid read wider at the wrong end. The batch's false fails are the #63 class again — an open U read
  as solid (`6b30228e`, the same example), a T-slot's undercut missed, a castellated nut's slots extended to the base,
  a cutout missed, a floating plate, a D-handle (Sonnet's error), a taper, a pin — plus two items on the same blade
  where a sharp tip was called blunt. Daniel's calibration from #85 (corner rings are posts) applied on `8ef4a5b9`.

## Daniel's verdicts (2026-09-09, `adjudicated87.json`, read from the page's store) — the adjudication that counts

All 31; agrees with the third opinion on 23, overrules it on 8. On the 31 hard flips: **batch false passes 3 vs
Sonnet 4 — holds; batch false fails 10 vs Sonnet 10, allowance 20 — holds**; 4 N.

The overrules:

- `10a93ee5` #5 → C: "the barrel is there but is vertical — if that is the barrel, qwen would be right; that both parts
  look merged is not part of the question." (Items #2 and #3 on the same hinge stayed R.)
- `59cd58c4` #3 → C: **"I hand-counted 25."** The reading's scan of the full-size top view found 24 dark flanks on every
  row; Daniel's count on the page is the verdict. Recorded as a disagreement between a measurement and the arbiter.
- `6edac583` #1 → C: "the tip is rounded, it's not sharp — define sharp and the answer will be more accurate." (The
  sibling blade `8d81a4b9` stayed R.)
- `bf7400b0` #2 → C: "I see two teeth, if that is what you refer to as the spikes — what is a tooth vs a spike?"
- `ff87549e` #3 → C.
- **Three to N**: `1a2cb147` #3 ("misleading or unclear question — top to tip? what is top to tip?"), `8c059166` #2
  ("three questions in one; I would give it to none of them"), `bf7400b0` #1 ("orientation problem — the part is not
  oriented the way the question expects in the first place").
- `aa556764` #1 stays R, with a note for the criteria side: "if you already have the definition of a two-level
  staircase, was that also specified so it's not guessed by the code generator?"

**Outcome.** The spot check confirms the qualification: on the corpus's own rows the judge holds both adjudicated
terms of ADR 0004, and the grant in `visual-eval-qualified-judges.ts` is **no longer provisional** — the first time a
grant has survived its spot check. The export's 2,112 admitted rows are the fine-tuning filter's trusted set.
