# PROTOTYPE — wayfinder #63: the spot check that confirms the qualification on the first re-rating batch

Throwaway record. Primary source for the resolution on [issue #63](https://github.com/kreuzhofer/chat3d-app/issues/63)
(map #45). The code this ticket landed is on `wayfinder/63-spot-check`: the stale re-rating batch's `concurrency`
option (`workbench-instrument.service.ts`, `workbench-batch.service.ts` through `utils/worker-pool.ts`), a fixed
`exampleIds` selection for `createVlmExperiment`, and `--candidate-production` on `scripts/qualification-screen.ts`.

## The window

`POST /api/admin/workbench/re-rate-stale/batch {"limit": 5000, "concurrency": 3}` — one row per replica of the
`qwen3.8-27b-nvfp4` pool (spark-02/03/04), the condition #61 measured 511/511 in; `vlm_eval` on row `98d284fe`,
thinking off, `production@22e0f10b0505`. Daniel off chat for the window (chat's own visual evaluation shares the
purpose); dgx-manager told the length and holding the three nodes. The re-evaluation pipeline runs a code-review call
(~4 s) on the same served name before each judge call, so the batch is its own light co-tenant even sequentially — at
one request per replica that cannot co-batch; `gateway-poll.py` (prototypes/59-one-instrument) samples per-member
`inflight` every 2 s into `gateway-pool63.tsv` to catch any two-on-one moment.

- `start63.txt` / `end63.txt` — the window; `job63.json` — the job as started.
- `*-smoke.*` — the 3-row smoke at 18:07 UTC: sole tenant, max inflight 1 on every member, 22 s for 3 rows.

## The steps after the batch (`spot63.sh`)

1. `spot63.sh audit` — `tenancy63.sh` (per 3-min bucket: the batch's judge calls, its code-review calls, **other
   tenants — must be 0**), `overlap63.py` (judge calls whose interval touched a two-on-one sample), and the rows with
   another tenant within ±60 s of their judge call → `overlap63-flagged.txt` (excluded from the frame, re-rated alone).
2. `spot63.sh sample <seed>` — `sample63.py`: simple random 125 from the batch's rows (membership from the usage log —
   the re-evaluation does not bump `updated_at`), current id, approved or pending, ≥ 3 checklist items, outside the
   held-out 125 of `7337a398`, outside the flagged ids → `sample63.txt`, `sample63-draw.txt`.
3. `spot63.sh reference` — one experiment with `exampleIds` = the sample, Claude Sonnet 4.6 (Anthropic API, thinking
   off; the recipe of `6f6bb5c0`, #64), started → `exp63.txt`, `start63-sonnet.txt`; `spot63.sh status` to watch.
4. `spot63.sh screen` — the qualification screen with the corpus's rows as the candidate and the Sonnet run as the
   reference → `screen-batch-vs-sonnet.txt`, `disagreements-batch-vs-sonnet.md`, `run63-sonnet-ref.txt`.
5. The alias-named Provisional row `ab9268b7` (qwen38-nvfp4-spark under the current id, never Stale): re-rated by hand
   inside the window (`POST /api/admin/workbench/examples/<id>/re-evaluate`) — the rule while such rows are few.

## The adjudication material (the #57 pattern)

- `dump2json63.py disagreements-batch-vs-sonnet.md items63.json` — the dump as records (validated: reproduces #57's 69).
- `views63.sh items63.json VIEWS_DIR` — the eight views of every example out of the backend's storage;
  `contact63.py VIEWS_DIR OUT` inside a container with Pillow (`docker cp` into `chat3d-app-build123d-1`) — two 2×2
  sheets per example for the reading.
- The third opinion (Fable, from the sheets and single views) fills `items63.json`; `build63.py sheet` writes
  `third-opinion63.md`, `build63.py page VIEWS_DIR out.html` the adjudication page (the #57 template retitled;
  verdicts land in the page's store as `verdicts/<example>-<item>`); `adjudicated63.json` holds Daniel's verdicts once read.

## Readings

- **The batch:** 2,614 rows in 3 h 50 min (19:13–23:02 UTC, 2026-09-06) at concurrency 3, 0 failures, ~5.2 s per row.
  Window audit: **0 other tenants** across 2,523 judge calls (`tenancy63.txt`), **0 two-on-one samples** across 20,439
  gateway samples, max inflight 1 on every replica (`overlap63.txt`), 0 rows flagged. The alias row re-rated at 23:05.
- **The corpus after it:** rated 2,527, current 2,527, Stale 0; export admitted 2,114 of 2,118 approved, provisional 0,
  stale 4 (the #44 rows). 91 rows left the rated set: the re-evaluation short-circuits before the judge when assertions
  fail (19) or code review rejects at 1–3 (72) — pending, no visual score, no instrument id, invisible to the status
  endpoint's counts. Approved fell 2,304 → 2,111 among batch rows (81% vs 88% under the old-text Sonnet ratings).
- **The sample:** frame 1,219 (batch rows with ≥ 3 items outside the held-out 125; 966 approved / 253 pending, 16
  categories); seed 63 → 125 rows, 437 items, 101 approved / 24 pending, 13 categories (`sample63-draw.txt`).
- **The Sonnet arm:** experiment `09411bc4`, run `4d899046`, 23:05–23:14 UTC, 125/125, 13.2 s per example, 0 residual
  uncertain, all six completeness counts zero.
- **The screen** (`screen-batch-vs-sonnet.txt`): identity PASS both sides; completeness PASS (batch: 437 items, 1
  residual uncertain); **94.1% identical, 25 hard flips (5.7%)**, raw false passes 8 of 18 reference fails, raw false
  fails 17 of 419 reference passes; item gate 91.2% agree (false accepts 5 / rejects 6, approves 112 vs 113); scores
  same 17.6%, mean abs Δ 1.016 (batch 9.25 vs Sonnet 8.57). Dump: **26 items on 17 examples** (`disagreements-batch-vs-sonnet.md`).
- **The third opinion** (`third-opinion63.md`, `items63.json`): R 17 / C 8 / N 1. On the 25 hard flips: **batch false
  passes 4 vs Sonnet 5 (holds); batch false fails 12 vs Sonnet 3, allowance 6 (fails as read)**. The batch's false fails
  are misreadings of large visible features — an open, shelled box read as a solid block (×2), a U-channel read as a
  block, a channel + plate read as one plate (×2), a pointed blade tip read as rounded (×2), a bowl's opening read as a
  floor — plus three orientation items on a flat-lying plate (the key holder: 'bottom edge' read as the upper face).
  Sonnet's errors: five false passes by leniency on wrong models (a block with all vertical edges filleted ×2, a box
  with the whole top perimeter rounded, pockets on the wrong side of a torus, a tooth wider at the tip) and three
  false fails, two of them a zoom to an angle that could not show the feature (an edge-on torus, a cap's closed top).
- **Daniel's verdicts (2026-09-07, `adjudicated63.json`, read from the page's store):** all 26; agrees with the third
  opinion on 19, overrules 7 (both paddle tips to C — not a true cusp; the XIAO standoffs to C; the sphere-corner box's
  sides to R; the gear sketch's three items to N — "orientation is the culprit", and two tooth-like parts, so both judges
  wrong; the L-profile N — "an L profile has 8 faces by definition"). On the 25 hard flips: **batch false passes 2 vs
  Sonnet 5 — holds; batch false fails 10 vs Sonnet 4, allowance 8 — fails**, by two items; 4 N. **The qualification is
  not confirmed:** the pair is revoked in `visual-eval-qualified-judges.ts` (its ratings Provisional again, the export's
  admitted 2,114 → 0) until the judge re-qualifies under the next instrument revision (#66, then #67).
- **Five items decided the term as read (before the verdicts):** the key holder's three (frame-dependent wording; N would make them drop out → 9 vs 6),
  the gear sketch's arc (a straight outer edge; low confidence) and the L-profile's face count (N as read; C would
  raise Sonnet's false fails). Daniel's verdicts land in the page's store: *The Spot Check*
  (https://claude.ai/code/artifact/7f7f7f9b-f3f5-45aa-a179-962d6d041f1d), collection `verdicts`.
