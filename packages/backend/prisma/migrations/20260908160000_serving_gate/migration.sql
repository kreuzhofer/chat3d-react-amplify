-- The serving gate's mark on an experiment run (issue #72, ADR 0006).
--
-- ADR 0005 made the serving condition readable and left it inert. The gate
-- acts on it: N <= R as a pre-flight, max per-replica inflight <= 1 before
-- each dispatch. A production rating taken under a violation is simply not
-- taken — the row stays Stale and the resumed batch re-rates it — so it needs
-- no name. An experiment result is different: discarding it is worse than
-- labelling it, since the N=3/R=2 arm is precisely how #67 became evidence.
-- So the result is written and the run is marked, and comparison tooling
-- refuses a marked run as a term in a pair.
--
-- Back-offs are counted beside it because throughput can now degrade quietly:
-- a run that held forty dispatches for a co-tenant is a fact about the pool
-- that must not live only in a log line.

ALTER TABLE experiment_runs
  ADD COLUMN serving_violation VARCHAR(40),
  ADD COLUMN serving_backoffs  INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN experiment_runs.serving_violation IS
  'Why the serving gate halted this run (replica-lost, no-replicas, contention). NULL = the condition held throughout.';
COMMENT ON COLUMN experiment_runs.serving_backoffs IS
  'Dispatches the gate held waiting for per-replica headroom during this run.';
