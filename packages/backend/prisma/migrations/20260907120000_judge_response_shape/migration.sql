-- The answer shape a judge-prompt variant asks for (issue #66).
--
-- A variant could change the instrument's TEXT but not the shape of the
-- answer, and on vLLM the response schema is the decoding grammar: a
-- template that asks for a parts inventory before the checklist cannot get
-- one, because the grammar has no room for the key. A run now records the
-- shape its instrument asks for; it is hashed into the Instrument id, so two
-- variants differing only in the shape are two instruments.
-- NULL means production's shape, as before.

ALTER TABLE experiment_runs
  ADD COLUMN judge_response_shape VARCHAR(32);

COMMENT ON COLUMN experiment_runs.judge_response_shape IS
  'Answer shape the run''s instrument asks for (issue #66): production | inventory. NULL = production.';
