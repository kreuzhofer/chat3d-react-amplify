/**
 * What the comparison surfaces do with a marked run (issue #72, ADR 0006).
 *
 * The gate keeps an experiment result taken under a violated condition, because
 * discarding it would have cost us #67's evidence. The other half of that
 * bargain is this: nothing may draw a pair from it by accident.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    experiment: { findUnique: vi.fn(async () => ({ id: "exp1", type: "vlm_comparison" })) },
    experimentRun: { findMany: vi.fn() },
    vlmExperimentResult: { findMany: vi.fn() },
  },
}));
vi.mock("../db/prisma.js", () => ({ prisma: prismaMock }));

const { getVlmInterRaterAgreement } = await import("../services/vlm-experiment-comparison.service.js");

/** Four examples both runs scored, so a pair would otherwise be computable. */
function scores(runId: string, values: number[]) {
  return values.map((visualScore, i) => ({ runId, exampleId: `ex${i}`, visualScore }));
}

beforeEach(() => {
  prismaMock.experimentRun.findMany.mockReset();
  prismaMock.vlmExperimentResult.findMany.mockResolvedValue([
    ...scores("runA", [8, 7, 6, 9]),
    ...scores("runB", [8, 6, 6, 8]),
  ]);
});

describe("inter-rater agreement", () => {
  it("pairs two clean runs", async () => {
    prismaMock.experimentRun.findMany.mockResolvedValue([
      { id: "runA", modelLabel: "qwen", servingViolation: null },
      { id: "runB", modelLabel: "sonnet", servingViolation: null },
    ]);

    const { pairs } = await getVlmInterRaterAgreement("exp1");

    expect(pairs[0].totalPaired).toBe(4);
    expect(pairs[0].refused).toBeNull();
  });

  it("refuses the pair when one run was taken under a violated condition", async () => {
    prismaMock.experimentRun.findMany.mockResolvedValue([
      { id: "runA", modelLabel: "qwen", servingViolation: "replica-lost" },
      { id: "runB", modelLabel: "sonnet", servingViolation: null },
    ]);

    const { pairs } = await getVlmInterRaterAgreement("exp1");

    // The pair is still listed — a silently missing row is how #67 happened —
    // but it carries no numbers, only the reason it carries none.
    expect(pairs).toHaveLength(1);
    expect(pairs[0].refused).toContain("replica-lost");
    expect(pairs[0].spearmanCorrelation).toBeNull();
    expect(pairs[0].meanAbsDifference).toBeNull();
    expect(pairs[0].totalPaired).toBe(0);
  });
});
