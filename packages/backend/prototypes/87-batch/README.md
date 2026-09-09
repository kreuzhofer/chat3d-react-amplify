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
