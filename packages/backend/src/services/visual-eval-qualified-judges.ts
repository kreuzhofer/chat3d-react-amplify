/**
 * The qualified judges (issue #58, ADR 0004; issue #62).
 *
 * A judge may rate the corpus that the fine-tuning filter reads only once it
 * has cleared the qualification bar — complete, stable, and on adjudicated
 * disagreements no worse than the reference — and qualification is granted
 * per (Judge, Instrument id). This list is that grant, kept in code beside
 * the instrument and changed by reviewed diff, with the qualification run
 * and the adjudication sheet linked from each entry. Any instrument revision
 * revokes it: a new id matches no entry until the terms are re-run.
 *
 * Each judge is named exactly as production stamps it — `provider/model_name`
 * in `vlm_model` and the effective thinking effort in `vlm_thinking_effort`
 * — so a stored row can be matched to its grant without a lookup. A judge
 * that is not on this list under the current id produces Provisional
 * ratings: kept, gate-derived, excluded from the training export.
 */

export interface QualifiedJudge {
  /** `provider/model_name`, as stamped in `vlm_model`. */
  model: string;
  /** The effective thinking effort, as stamped in `vlm_thinking_effort`. */
  thinkingEffort: string;
  /** The Instrument id the judge qualified under; a revision revokes it. */
  instrumentId: string;
  /** The day the adjudication closed (ISO date). */
  qualifiedOn: string;
  /** The qualification run and the adjudication sheet, at least. */
  evidence: readonly string[];
}

export const QUALIFIED_JUDGES: readonly QualifiedJudge[] = [
  // No judge is qualified under production@22e0f10b0505.
  //
  // qwen3.8-27b-nvfp4 (thinking off; model row 98d284fe, the pooled
  // served name) qualified on the 125 on 2026-09-06 (issue #57: false
  // passes 5 vs the reference's 19, false fails 18 vs 16) and was
  // REVOKED on 2026-09-07 by the first re-rating batch's spot check
  // (issue #63, ADR 0004): on 125 sampled corpus rows against the
  // reference once under the same id, Daniel's adjudication of the 25
  // hard flips gave batch false passes 2 vs 5 (holds) and batch false
  // fails 10 vs 4, allowance 8 (fails). Its ratings are Provisional
  // again — kept, gate-derived, outside the training export — until it
  // re-qualifies under the next instrument revision.
  //   https://github.com/kreuzhofer/chat3d-app/issues/63
  //   packages/backend/prototypes/63-spot-check/
];
