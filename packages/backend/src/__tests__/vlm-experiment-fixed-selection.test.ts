/**
 * A VLM experiment over a fixed list of examples (#63).
 *
 * The qualification's spot check judges a sample drawn from a re-rating
 * batch, not a seeded draw from categories; the reference must run on
 * exactly those rows. `exampleIds` replaces categories + count + seed, in
 * the order given, and the experiment records the categories it spans.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const m = vi.hoisted(() => ({
  findMany: vi.fn(), expCreate: vi.fn(), runCreate: vi.fn(), selCreate: vi.fn(),
  validateCategories: vi.fn(), validateModels: vi.fn(), queryEligibleExamples: vi.fn(), selectIds: vi.fn(), getVlmExperiment: vi.fn(),
}));
vi.mock("../db/prisma.js", () => ({
  prisma: {
    workbenchExample: { findMany: (...a: unknown[]) => m.findMany(...a) },
    $transaction: async (cb: (tx: unknown) => Promise<unknown>) => cb({
      experiment: { create: (...a: unknown[]) => m.expCreate(...a) },
      experimentRun: { create: (...a: unknown[]) => m.runCreate(...a) },
      vlmExperimentExampleSelection: { create: (...a: unknown[]) => m.selCreate(...a) },
    }),
  },
}));
vi.mock("../services/vlm-experiment.service.js", () => ({
  validateCategories: (...a: unknown[]) => m.validateCategories(...a),
  validateModels: (...a: unknown[]) => m.validateModels(...a),
  queryEligibleExamples: (...a: unknown[]) => m.queryEligibleExamples(...a),
  selectIds: (...a: unknown[]) => m.selectIds(...a),
  getVlmExperiment: (...a: unknown[]) => m.getVlmExperiment(...a),
}));

import { createVlmExperiment } from "../services/vlm-experiment-create.service.js";

const model = { id: "m1", displayName: "Sonnet", provider: "anthropic", modelName: "claude-sonnet-4-6" };
const row = (id: string, categoryId: string, shot: string | null = "s.png") => ({ id, screenshotFront: shot, promptRef: { categoryId } });

beforeEach(() => {
  for (const fn of Object.values(m)) fn.mockReset();
  m.validateModels.mockResolvedValue({ models: [model], uniqueIds: ["m1"] });
  m.expCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: "exp1", ...data }));
  m.getVlmExperiment.mockImplementation(async (id: string) => ({ id }));
});

describe("createVlmExperiment with exampleIds", () => {
  it("selects exactly those examples in the given order and records the categories they span", async () => {
    m.findMany.mockResolvedValue([row("e1", "c1"), row("e2", "c2"), row("e3", "c1")]);
    const exp = await createVlmExperiment({ name: "spot check", exampleIds: ["e2", "e1", "e3"], modelIds: ["m1"], createdBy: "u1" });
    expect(exp).toEqual({ id: "exp1" });
    const data = m.expCreate.mock.calls[0][0].data;
    expect(data).toMatchObject({ name: "spot check", type: "vlm_comparison", promptCount: 3, promptSeed: 0, testedPurpose: "vlm_eval" });
    expect([...data.categoryIds].sort()).toEqual(["c1", "c2"]);
    expect(m.selCreate.mock.calls.map((c) => c[0].data)).toEqual([
      { experimentId: "exp1", exampleId: "e2", selectionOrder: 1 },
      { experimentId: "exp1", exampleId: "e1", selectionOrder: 2 },
      { experimentId: "exp1", exampleId: "e3", selectionOrder: 3 },
    ]);
    expect(m.validateCategories).not.toHaveBeenCalled();
    expect(m.queryEligibleExamples).not.toHaveBeenCalled();
    expect(m.selectIds).not.toHaveBeenCalled();
  });

  it("refuses a list next to categories or a count — one way of choosing, not two", async () => {
    await expect(createVlmExperiment({ name: "x", exampleIds: ["e1"], categoryIds: ["c1"], modelIds: ["m1"], createdBy: "u1" }))
      .rejects.toMatchObject({ statusCode: 400, message: expect.stringMatching(/not both/i) });
    await expect(createVlmExperiment({ name: "x", exampleIds: ["e1"], exampleCount: 5, modelIds: ["m1"], createdBy: "u1" }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it("refuses an empty list, duplicates, unknown ids and examples without screenshots", async () => {
    await expect(createVlmExperiment({ name: "x", exampleIds: [], modelIds: ["m1"], createdBy: "u1" })).rejects.toMatchObject({ statusCode: 400 });
    await expect(createVlmExperiment({ name: "x", exampleIds: ["e1", "e1"], modelIds: ["m1"], createdBy: "u1" })).rejects.toMatchObject({ statusCode: 400 });
    m.findMany.mockResolvedValue([row("e1", "c1")]);
    await expect(createVlmExperiment({ name: "x", exampleIds: ["e1", "e9"], modelIds: ["m1"], createdBy: "u1" }))
      .rejects.toMatchObject({ statusCode: 404, message: expect.stringContaining("e9") });
    m.findMany.mockResolvedValue([row("e1", "c1"), row("e2", "c1", null)]);
    await expect(createVlmExperiment({ name: "x", exampleIds: ["e1", "e2"], modelIds: ["m1"], createdBy: "u1" }))
      .rejects.toMatchObject({ statusCode: 400, message: expect.stringContaining("e2") });
    expect(m.expCreate).not.toHaveBeenCalled();
  });

  it("without exampleIds still draws a seeded selection from categories, as before", async () => {
    m.validateCategories.mockResolvedValue([{ id: "c1", name: "Brackets" }]);
    m.queryEligibleExamples.mockResolvedValue(["e1", "e2", "e3", "e4"]);
    m.selectIds.mockReturnValue(["e3", "e1"]);
    await createVlmExperiment({ name: "seeded", categoryIds: ["c1"], exampleCount: 2, exampleSeed: 7, modelIds: ["m1"], createdBy: "u1" });
    expect(m.validateCategories).toHaveBeenCalledWith(["c1"]);
    expect(m.selectIds).toHaveBeenCalledWith(["e1", "e2", "e3", "e4"], 2, 7);
    expect(m.expCreate.mock.calls[0][0].data).toMatchObject({ categoryIds: ["c1"], promptCount: 2, promptSeed: 7 });
    expect(m.selCreate.mock.calls.map((c) => c[0].data.exampleId)).toEqual(["e3", "e1"]);
  });

  it("requires categories and a count when no list is given", async () => {
    await expect(createVlmExperiment({ name: "x", modelIds: ["m1"], createdBy: "u1" })).rejects.toMatchObject({ statusCode: 400 });
  });
});
