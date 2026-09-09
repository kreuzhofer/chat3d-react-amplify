/**
 * Loading the runs the qualification screen compares (ADR 0004, ADR 0006).
 *
 * Moved out of `scripts/qualification-screen.ts` so the adjudication sitting
 * (issue #92) draws its disagreement set from the same rows, under the same
 * refusals, as the screen prints them: a run must be completed, and a run
 * the serving gate marked is evidence about the pool, never a term in a
 * pair. The corpus's own ratings can stand as the candidate for an
 * experiment's selections (the screen's `--candidate-production`, #63).
 */
import { prisma } from "../db/prisma.js";
import { pairRefusal } from "./serving-gate.service.js";
import { answeredRows, type ScreenResultRow, type ScreenRun, type StoredChecklistItem } from "./qualification-screen.service.js";

export interface LoadedRun extends ScreenRun {
  experimentId: string;
  wallClockMs: number | null;
  /** The instrument ids the *answered* rows carry; one entry for a run a sitting can use. A failed evaluation stores no id and pairs with nothing. */
  instrumentIds: string[];
}

export class RunNotPairableError extends Error {
  readonly statusCode = 409;
}

/** The instrument ids of the rows that answered (a failed or empty evaluation carries none and is never paired). */
export function answeredInstrumentIds(run: ScreenRun): string[] {
  return [...new Set([...answeredRows(run).values()].map((r) => r.instrumentId ?? "(none)"))].sort();
}

export async function loadRun(runId: string): Promise<LoadedRun> {
  const run = await prisma.experimentRun.findUnique({
    where: { id: runId },
    select: {
      id: true, modelLabel: true, experimentId: true, startedAt: true, completedAt: true, status: true,
      servingViolation: true,
    },
  });
  if (!run) throw new RunNotPairableError(`Run ${runId} not found`);
  if (run.status !== "completed") throw new RunNotPairableError(`Run ${runId} is ${run.status}, not completed`);
  // The screen decides qualification, so it is the last place a marked run
  // may slip into a comparison (ADR 0006).
  const refusal = pairRefusal(run);
  if (refusal) throw new RunNotPairableError(`Run ${runId} — ${refusal}`);
  const results = await prisma.vlmExperimentResult.findMany({
    where: { runId },
    select: {
      exampleId: true, visualScore: true, checklistResults: true, error: true, issues: true,
      instrumentId: true, thinkingEffort: true, durationMs: true, completionTokens: true,
    },
  });
  const rows: ScreenResultRow[] = results.map((r) => ({
    exampleId: r.exampleId,
    visualScore: r.visualScore == null ? null : Number(r.visualScore),
    checklistResults: Array.isArray(r.checklistResults) ? (r.checklistResults as StoredChecklistItem[]) : null,
    error: r.error,
    issues: Array.isArray(r.issues) ? (r.issues as unknown[]).map(String) : [],
    instrumentId: r.instrumentId,
    thinkingEffort: r.thinkingEffort,
    durationMs: r.durationMs,
    completionTokens: r.completionTokens,
  }));
  const wallClockMs = run.startedAt && run.completedAt ? run.completedAt.getTime() - run.startedAt.getTime() : null;
  const loaded = { runId, label: run.modelLabel, rows, experimentId: run.experimentId, wallClockMs };
  return { ...loaded, instrumentIds: answeredInstrumentIds(loaded) };
}

/**
 * The corpus's own ratings for an experiment's selections (#63): the rows
 * the re-rating batch wrote, read as if they were a run. Labelled by the
 * judge(s) that produced them; identity then checks there was one.
 */
export async function loadProductionRun(experimentId: string): Promise<LoadedRun> {
  const selected = await prisma.vlmExperimentExampleSelection.findMany({
    where: { experimentId }, orderBy: { selectionOrder: "asc" }, select: { exampleId: true },
  });
  if (selected.length === 0) throw new RunNotPairableError(`Experiment ${experimentId} has no example selections`);
  const examples = await prisma.workbenchExample.findMany({
    where: { id: { in: selected.map((s) => s.exampleId) } },
    select: {
      id: true, visualScore: true, evalChecklistResults: true, evalIssues: true,
      vlmModel: true, vlmInstrumentId: true, vlmThinkingEffort: true,
    },
  });
  const judges = [...new Set(examples.map((e) => `${e.vlmModel ?? "?"} (${e.vlmThinkingEffort ?? "?"})`))].sort();
  const rows: ScreenResultRow[] = examples.map((e) => ({
    exampleId: e.id,
    visualScore: e.visualScore == null ? null : Number(e.visualScore),
    checklistResults: Array.isArray(e.evalChecklistResults) ? (e.evalChecklistResults as StoredChecklistItem[]) : null,
    error: null,
    issues: Array.isArray(e.evalIssues) ? (e.evalIssues as unknown[]).map(String) : [],
    instrumentId: e.vlmInstrumentId,
    thinkingEffort: e.vlmThinkingEffort,
    durationMs: null,
    completionTokens: null,
  }));
  const loaded = { runId: `production:${experimentId.slice(0, 8)}`, label: `production rating by ${judges.join(" | ")}`, rows, experimentId, wallClockMs: null };
  return { ...loaded, instrumentIds: answeredInstrumentIds(loaded) };
}
