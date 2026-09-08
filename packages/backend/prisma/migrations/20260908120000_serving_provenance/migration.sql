-- The serving condition every judge call was answered under (issue #71, ADR 0005).
--
-- A Judge's answers reproduce only under uncontended serving — requests in
-- flight at or below the serving replica count — and on 2026-09-07 that
-- condition broke silently: a replica of the pooled qwen3.8-27b-nvfp4 was
-- OOM-killed at 07:10:44 UTC, the harness went on submitting three concurrent
-- requests to two replicas, and the run completed looking entirely normal
-- while producing numbers that were not comparable to the ones beside it.
--
-- From here on every judge call stamps its Serving provenance on the
-- llm_usage_events row it already writes. That table is chosen because it is
-- the one all three drivers write: experiments (experiment_run_id set), the
-- stale re-rating batch and production vlm_eval (workbench_example_id set).
-- Per call, not per run — #63's batch ran 3h49m, and a single verdict over it
-- would be far coarser than the truth.
--
-- A provider whose gateway cannot be reached, or has none, leaves these NULL:
-- unknown, never a satisfied condition that was not checked. serving_source
-- is what tells a read-back apart — 'gateway' was sampled live at dispatch,
-- 'annotated' was written back from a recorded sample after the fact, and
-- NULL was never checked at all. Assumed-good history is what made 09-06 and
-- 09-07 look comparable.

ALTER TABLE llm_usage_events
  ADD COLUMN serving_name         VARCHAR(255),
  ADD COLUMN serving_replicas     INTEGER,
  ADD COLUMN serving_max_inflight INTEGER,
  ADD COLUMN driver_concurrency   INTEGER,
  ADD COLUMN serving_source       VARCHAR(20);

COMMENT ON COLUMN llm_usage_events.serving_name IS
  'The pool''s published name as the judge provider''s gateway reports it. NULL = not checked.';
COMMENT ON COLUMN llm_usage_events.serving_replicas IS
  'R: replicas serving that name in the sampled snapshot. NULL = unknown, never assumed-good.';
COMMENT ON COLUMN llm_usage_events.serving_max_inflight IS
  'Highest per-replica requests in flight in the sampled snapshot; >1 means two requests shared a replica.';
COMMENT ON COLUMN llm_usage_events.driver_concurrency IS
  'N: the driver''s own configured concurrency. NULL where nothing schedules the call (production vlm_eval, chat).';
COMMENT ON COLUMN llm_usage_events.serving_source IS
  'gateway = sampled live at dispatch; annotated = written back from a recorded sample; NULL = never checked.';

-- The reads this feeds are "the condition over a run" and "the condition over
-- a window": #63's batch has no run row and is found by time alone.
CREATE INDEX idx_usage_events_serving
  ON llm_usage_events (serving_name, created_at);
