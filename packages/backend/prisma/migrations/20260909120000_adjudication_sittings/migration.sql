-- The adjudication sitting and its adjudications (issue #92, ADR 0004).
--
-- Four sheets were adjudicated on pages generated per sitting, their verdicts
-- kept in a page's store and a JSON file each. The bar's adjudicated terms
-- and the judge fine-tune both read those verdicts, so they get a home: a
-- sitting freezes the disagreement set of one candidate against one
-- reference under one Instrument id, and each item carries both judges'
-- answers as they were, the human's decision and the triage beside it.
--
-- An adjudication is gold. Deleting an example underneath one is refused
-- (RESTRICT), not cascaded: the loud failure is the point.

CREATE TABLE adjudication_sittings (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                VARCHAR(255) NOT NULL,
  instrument_id        VARCHAR(80) NOT NULL,
  candidate_source     VARCHAR(20) NOT NULL,
  candidate_run_id     UUID REFERENCES experiment_runs(id) ON DELETE SET NULL,
  candidate_label      VARCHAR(255) NOT NULL,
  reference_run_id     UUID REFERENCES experiment_runs(id) ON DELETE SET NULL,
  reference_label      VARCHAR(255) NOT NULL,
  sample_experiment_id UUID REFERENCES experiment_experiments(id) ON DELETE SET NULL,
  adjudicator_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  origin               VARCHAR(20) NOT NULL DEFAULT 'app',
  notes                TEXT,
  item_count           INTEGER NOT NULL,
  example_count        INTEGER NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at         TIMESTAMPTZ
);
CREATE INDEX idx_adj_sittings_created ON adjudication_sittings(created_at);

COMMENT ON COLUMN adjudication_sittings.candidate_source IS
  'run = an experiment run; production = the corpus''s own ratings for the sample (the screen''s --candidate-production).';
COMMENT ON COLUMN adjudication_sittings.origin IS
  'app = started in the app; import = a sheet adjudicated before the app existed (#57, #63, #85, #87).';

CREATE TABLE adjudications (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sitting_id         UUID NOT NULL REFERENCES adjudication_sittings(id) ON DELETE CASCADE,
  example_id         UUID NOT NULL REFERENCES workbench_examples(id) ON DELETE RESTRICT,
  item_index         INTEGER NOT NULL,
  question           TEXT NOT NULL,
  ref_state          VARCHAR(10) NOT NULL,
  ref_detail         TEXT NOT NULL,
  cand_state         VARCHAR(10) NOT NULL,
  cand_detail        TEXT NOT NULL,
  arm2_state         VARCHAR(10),
  arm2_detail        TEXT,
  decision           CHAR(1),
  note               TEXT NOT NULL DEFAULT '',
  agreed_with_triage BOOLEAN NOT NULL DEFAULT false,
  decided_by         UUID REFERENCES users(id) ON DELETE SET NULL,
  decided_at         TIMESTAMPTZ,
  triage_verdict     CHAR(1),
  triage_confidence  VARCHAR(16),
  triage_what        TEXT,
  triage_view        VARCHAR(120),
  triage_resolved_by TEXT,
  triage_model       VARCHAR(120),
  triage_at          TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT adjudications_sitting_item UNIQUE (sitting_id, example_id, item_index),
  CONSTRAINT adjudications_decision_chk CHECK (decision IS NULL OR decision IN ('R', 'C', 'N')),
  CONSTRAINT adjudications_triage_chk CHECK (triage_verdict IS NULL OR triage_verdict IN ('R', 'C', 'N'))
);
CREATE INDEX idx_adjudications_example ON adjudications(example_id);
CREATE INDEX idx_adjudications_decision ON adjudications(decision);

COMMENT ON COLUMN adjudications.decision IS
  'R the reference was right, C the candidate was right, N neither or unanswerable from renders. NULL = still open.';
COMMENT ON COLUMN adjudications.triage_verdict IS
  'A third model''s reading before the human looked; never counted toward the bar.';
