/**
 * The stale re-rating batch under the serving gate (issue #72, ADR 0006).
 *
 * This is the driver whose output is an assertion about the corpus, so the
 * rule it carries is the strict one: a rating whose dispatch would violate the
 * condition is never taken, the row stays Stale, and the batch stops and waits
 * for an operator instead of grinding out numbers nobody can compare.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const reEvaluateExample = vi.fn(async (id: string) => ({ exampleId: id, evalScore: 8, approvalStatus: "auto_approved" }));
vi.mock("../services/workbench-reeval.service.js", () => ({
  reEvaluateExample: (id: string) => reEvaluateExample(id),
}));

const { runBatchReEvaluate } = await import("../services/workbench-batch.service.js");
const { openServingGate } = await import("../services/serving-gate.service.js");
import type { BatchJob } from "../services/workbench-batch.service.js";
import type { ServingSnapshot } from "../services/serving-provenance.service.js";

function snapshot(servingCount: number | null, maxInflight: number | null): ServingSnapshot {
  return { publishedName: "qwen3.8-27b-nvfp4", servingCount, maxInflight, source: "gateway", sampledAt: new Date() };
}

/** A gate whose readings are scripted: one for the pre-flight, then one per dispatch. */
function gateOver(readings: Array<ServingSnapshot | null>) {
  let i = 0;
  return openServingGate({
    endpointUrl: "http://192.168.44.14:4000/v1/",
    publishedName: "qwen3.8-27b-nvfp4",
    configuredConcurrency: 1,
    label: "test batch",
    read: async () => readings[Math.min(i++, readings.length - 1)],
    pollIntervalMs: 1,
    backoffBudgetMs: 5,
  });
}

function job(): BatchJob {
  return {
    jobId: "batch-re-rate-stale-1",
    type: "batch-re-rate-stale",
    categoryId: "*",
    categoryName: "Stale ratings (all categories)",
    status: "running",
    total: 3, completed: 0, failed: 0, skipped: 0,
    currentPromptId: null, currentPromptText: null, exampleId: null,
    results: [], error: null,
    createdAt: new Date().toISOString(), finishedAt: null,
    concurrency: 1, servingBackoffs: 0, servingHalt: null,
    pendingPromptIds: new Set(), userId: null,
    abortController: new AbortController(),
  };
}

const rows = [
  { id: "ex1", promptId: "p1", promptRef: { prompt: "a bracket" } },
  { id: "ex2", promptId: "p2", promptRef: { prompt: "a tray" } },
  { id: "ex3", promptId: "p3", promptRef: { prompt: "a lid" } },
];

beforeEach(() => { reEvaluateExample.mockClear(); });

describe("the batch under the gate", () => {
  it("re-rates every row while the condition holds", async () => {
    const j = job();
    await runBatchReEvaluate(j, rows, 1, await gateOver([snapshot(3, 0)]));

    expect(reEvaluateExample).toHaveBeenCalledTimes(3);
    expect(j.status).toBe("completed");
    expect(j.servingHalt).toBeNull();
  });

  it("stops before the dispatch that would violate the condition, leaving its row Stale", async () => {
    // Pre-flight, ex1 clean, then the pool drops to two replicas.
    const j = job();
    await runBatchReEvaluate(j, rows, 1, await gateOver([snapshot(3, 0), snapshot(3, 0), snapshot(2, 1)]));

    // ex1 was rated under a condition that held; ex2 was never dispatched, so
    // there is no rating to distrust and nothing to name — it is still Stale.
    expect(reEvaluateExample).toHaveBeenCalledTimes(1);
    expect(reEvaluateExample).toHaveBeenCalledWith("ex1");
    expect(j.completed).toBe(1);
    expect(j.status).toBe("halted");
    expect(j.servingHalt).toBe("replica-lost");
  });

  it("counts the dispatches a co-tenant held, so degraded throughput is not invisible", async () => {
    const j = job();
    await runBatchReEvaluate(
      j, rows, 1,
      await gateOver([snapshot(3, 0), snapshot(3, 0), snapshot(3, 2), snapshot(3, 0)]),
    );

    expect(reEvaluateExample).toHaveBeenCalledTimes(3);
    expect(j.status).toBe("completed");
    expect(j.servingBackoffs).toBe(1);
  });

  it("halts when the contention outlasts the budget", async () => {
    const j = job();
    await runBatchReEvaluate(j, rows, 1, await gateOver([snapshot(3, 0), snapshot(3, 2)]));

    expect(reEvaluateExample).not.toHaveBeenCalled();
    expect(j.status).toBe("halted");
    expect(j.servingHalt).toBe("contention");
    expect(j.servingBackoffs).toBe(1);
  });

  it("runs ungated when no gate is given, so the category re-evaluation is untouched", async () => {
    const j = job();
    await runBatchReEvaluate(j, rows, 1);

    expect(reEvaluateExample).toHaveBeenCalledTimes(3);
    expect(j.status).toBe("completed");
  });
});
