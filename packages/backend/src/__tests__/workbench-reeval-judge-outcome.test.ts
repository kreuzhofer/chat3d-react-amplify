/**
 * A judge that did not answer must not overwrite a stored rating (issue #87).
 *
 * On 2026-09-09 the containers lost the gateway mid-batch; every judge call
 * failed, the orchestrator "proceeded with code-only", and the re-evaluation
 * wrote `visualScore NULL` and `pending` over 175 rows' stored ratings while
 * the batch counted them as completed. The pipeline result now names the
 * judge's outcome, and the re-evaluation refuses to write a `failed` one.
 * A deliberate skip (code review too low) is still written, as before.
 */
import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";

vi.mock("../services/eval-orchestrator.service.js", () => ({ runFullEvaluation: vi.fn() }));
vi.mock("../services/file-storage.service.js", () => ({
  storageFileExists: vi.fn(async () => true),
  readStorageFile: vi.fn(async () => Buffer.from("png")),
}));

import { prisma } from "../db/prisma.js";
import { runFullEvaluation, type FullEvalResult } from "../services/eval-orchestrator.service.js";
import { reEvaluateExample } from "../services/workbench-reeval.service.js";
import { deleteTestCategory } from "./support/workbench-category-fixture.js";

const base: Omit<FullEvalResult, "judgeOutcome"> = {
  compositeScore: 1, visualScore: null, codeScore: 1, assertionPassRate: 1, assertionsFailed: false,
  source: "code_only", compositeWeightSource: "global", vlmIssues: [], vlmSuggestions: [],
  codeIssues: ["[CODE] Code review failed: Empty response from code review LLM"],
  checklistResults: undefined, vlmModel: null, codeReviewModel: null, totalPromptTokens: 0, totalCompletionTokens: 0,
  vlmInstrumentId: null, vlmThinkingEffort: null, evalChecklistState: null,
} as Omit<FullEvalResult, "judgeOutcome">;

describe("re-evaluation and the judge's outcome", () => {
  let categoryId: string | undefined;
  let exampleId: string;

  beforeEach(async () => {
    const nextRank = ((await prisma.workbenchCategory.aggregate({ _max: { rank: true } }))._max.rank ?? 0) + 1;
    const cat = await prisma.workbenchCategory.create({
      data: { name: `reeval-judge-${Date.now()}-${nextRank}`, description: "", complexity: 1, rank: nextRank },
    });
    categoryId = cat.id;
    const prompt = await prisma.workbenchExamplePrompt.create({ data: { categoryId: cat.id, index: 1, prompt: "p" } });
    const ex = await prisma.workbenchExample.create({
      data: {
        id: crypto.randomUUID(), promptId: prompt.id, iteration: 1, code: "x",
        renderStatus: "success", renderError: null, approvalStatus: "auto_approved",
        evalScore: 8.5, visualScore: 9, codeEvalScore: 8, vlmModel: "vllm-dgx-14/qwen3.8-27b-nvfp4",
        vlmInstrumentId: "production@000000000000", evalChecklistState: "real",
        screenshotFront: "f.png", screenshotTop: "t.png",
      },
    });
    exampleId = ex.id;
  });
  afterAll(async () => { await deleteTestCategory(categoryId); });

  it("refuses to write a failed judge call: the stored rating and verdict survive", async () => {
    vi.mocked(runFullEvaluation).mockResolvedValueOnce({ ...base, judgeOutcome: "failed" } as FullEvalResult);
    await expect(reEvaluateExample(exampleId)).rejects.toThrow(/judge call failed/i);
    const row = await prisma.workbenchExample.findUniqueOrThrow({ where: { id: exampleId } });
    expect(Number(row.visualScore)).toBe(9);
    expect(row.vlmInstrumentId).toBe("production@000000000000");
    expect(row.approvalStatus).toBe("auto_approved");
    expect(Number(row.evalScore)).toBe(8.5);
  });

  it("still writes a deliberate skip (code review too low): pending, no rating, as before", async () => {
    vi.mocked(runFullEvaluation).mockResolvedValueOnce({ ...base, codeScore: 2, codeIssues: [], judgeOutcome: "skipped_code_review" } as FullEvalResult);
    const res = await reEvaluateExample(exampleId);
    expect(res.approvalStatus).toBe("pending");
    const row = await prisma.workbenchExample.findUniqueOrThrow({ where: { id: exampleId } });
    expect(row.visualScore).toBeNull();
    expect(row.approvalStatus).toBe("pending");
  });
});
