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

_(filled after the batch)_
