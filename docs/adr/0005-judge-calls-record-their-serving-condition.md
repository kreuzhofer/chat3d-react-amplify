---
status: accepted
date: 2026-09-07
---

# Every judge call records the serving condition it was answered under

A Judge's answers reproduce only under **uncontended serving** — requests in flight at or below the serving replica count — and on 2026-09-07 that condition broke silently. A replica of the pooled `qwen3.8-27b-nvfp4` was OOM-killed at 07:10:44 UTC; the harness went on submitting three concurrent requests to two replicas, the gateway reported nothing, and the run completed looking entirely normal while producing numbers that were not comparable to the ones beside them (#67). We decided that **every judge call stamps its Serving provenance**, so a rating carries the condition it was produced under, and a run whose condition is unknown says so rather than passing for a good one.

## What is recorded, and where

Each judge call already writes an `llm_usage_events` row. That row gains the pool's published name, the serving replica count, the driver's own concurrency, and the highest per-replica requests in flight in the sampled snapshot. Replica count and inflight come from the judge provider's gateway — the URL derived from `llm_providers.endpoint_url`, never a constant in code — read through a short-lived cached snapshot rather than one HTTP call per judge call. A provider that answers no such endpoint records **unknown**, explicitly; it never records a satisfied condition it did not check.

Per call, not per run, because the three drivers do not share a run. Experiments write `experiment_runs`; the stale re-rating batch and production's own `vlm_eval` have no run row at all. `llm_usage_events` is the one table all three already write, and it carries `experiment_run_id`, `workbench_example_id`, `created_at` and `duration_ms` — everything a later join needs, and what `overlap63.py` joined against by hand. Per-call resolution is also the resolution the corpus needs: #63's batch ran 3h49m, and a whole-batch verdict would be far coarser than the truth, condemning 2,527 ratings for a condition that may have lapsed for minutes.

The Serving provenance is **not** part of the Instrument id. The replica count is a property of a run's conditions, not of the judging procedure: two runs at different counts are the same instrument, once well served and once badly. Folding it into the hash would make every rating in the corpus Stale each time a replica bounced, which is a re-rating pass, not a fact.

## Considered options

- **An operator-run sampler** — `gateway-poll.py` promoted from throwaway to a kept tool, one artefact per run. This is what #65 chose for sole tenancy (a rule over code), which is why it was taken seriously. Rejected because the two conditions are not alike: an operator can decline to submit chat, but cannot notice a replica dying at 07:10, and a sampler nobody remembered to start is the exact gap that produced this ADR.
- **A backend poller** active while an experiment run or batch job is in flight, writing a sample time series. Rejected as more machinery for less: it needs job-lifecycle wiring, misses production's own `vlm_eval` path, and still has to be joined to rows by timestamp — which the per-call stamp gives directly.
- **Recording the member deployment ids on every call.** Rejected: a restarted replica keeps its deployment id (dgx-manager, 2026-09-07), so the roster says which replicas serve but not whether one bounced and came back. The replica count over time answers that; thirty thousand repetitions of an unchanging roster do not.
- **Start-of-run and end-of-run snapshots only.** Rejected for the same reason. The count can change in the middle, which is precisely what happened; #67's first run would have read three at the start and two at the end, with nothing saying when or for how much of the run.
- **Leaving the runs already taken alone.** Rejected in favour of annotating the ones current decisions lean on — #61's stability pair, #63's batch (recoverable from its 20,439-sample TSV), #67's three arms — with everything earlier reading unknown. Assumed-good history is what made 09-06 and 09-07 look comparable.

## Consequences

- The backend gains its first knowledge of the serving gateway. It is derived from provider configuration and treated as an optional capability, so a provider without one is supported and says `unknown`; but the dependency is real and did not exist before this decision.
- Nothing is gated on the recorded condition here. A run under a broken condition still completes and still stores ratings — now labelled. What the harness *does* about a violation (refuse to start, clamp concurrency, or invalidate the affected rows) is #70's decision, and it builds on this feed.
  - *Answered 2026-09-08 (#70, ADR 0006):* the harness gates before each dispatch on this snapshot — concurrency clamped to the serving replica count, a co-tenant backed off, a lost replica halting a run that is then resumed. The feed stays the record; the gate is a predicate over it.
- Whether the fine-tuning filter gains a third admission term beside current-instrument and qualified-judge is left open until #70 decides. Until then, a rating's serving condition is readable but not load-bearing.
  - *Answered 2026-09-08 (#70, ADR 0006):* it does not. A production rating whose dispatch would violate the condition is never written, so no row arrives in a state needing a third name; the filter keeps its two grounds.
- ADR 0004's stability term is amended to name uncontended serving, so a qualification run that cannot show its condition is not evidence of stability.

*Built 2026-09-08 (#71).* `serving-provenance.service.ts` derives the gateway from the provider's `endpoint_url` and reads it through a 5 s cached snapshot; the tracked LLM wrappers sample it **at dispatch** for `vlm_evaluation` calls and stamp `serving_name`, `serving_replicas`, `serving_max_inflight`, `driver_concurrency` and `serving_source` on the `llm_usage_events` row. N reaches the stamp through the usage context, which now merges rather than replaces, so the batch runner can set it once around a whole pool. The runs current decisions lean on are annotated as `serving_source = 'annotated'`: #61's three arms (R=3, N=3), #67's four (R=2 at N=3 and N=2), and #63's 2,524 batch calls matched sample-by-sample to its gateway TSV — which read **R=3, max inflight 1** throughout, confirming the sole tenancy that check reported independently. 29,095 earlier judge calls read R-unknown.
