/**
 * The third opinion as a purpose (issue #93): the reading is parsed into a
 * fixed shape, a bad letter is refused rather than guessed, and the triage
 * model may be neither party to the sitting.
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("../db/prisma.js", () => ({ prisma: {} }));

import { assertNotAParty, buildTriageSystemPrompt, buildTriageUserText, normaliseReading, parseTriageText, triageOutputBudget } from "../services/adjudication-triage.service.js";
import { SittingError } from "../services/adjudication-sitting.service.js";

describe("triage reading", () => {
  it("parses a JSON reply, upper-casing the letter and defaulting an unknown confidence to low", () => {
    const r = parseTriageText('Here is my reading:\n{"verdict":"c","confidence":"Certain","what":"top shows four posts","deciding_view":"top","resolved_by":"views as they are"}');
    expect(r).toEqual({ verdict: "C", confidence: "low", what: "top shows four posts", deciding_view: "top", resolved_by: "views as they are" });
  });

  it("refuses a reply without a JSON object or with a letter outside R/C/N", () => {
    expect(() => parseTriageText("I think the reference is right.")).toThrow(/no JSON object/);
    expect(() => normaliseReading({ verdict: "X" as never })).toThrow(/not R\/C\/N/);
  });

  it("puts the item, both judges' answers and the labels in the user text", () => {
    const text = buildTriageUserText({
      prompt: "A 1x1 Gridfinity bin", question: "Is the top edge open?", refState: "fail", refDetail: "closed top", candState: "pass", candDetail: "",
      referenceLabel: "Sonnet 4.6", candidateLabel: "qwen3.8",
    });
    expect(text).toContain("Checklist item: Is the top edge open?");
    expect(text).toContain("Reference judge (Sonnet 4.6): FAIL — closed top");
    expect(text).toContain("Candidate judge (qwen3.8): PASS — (no evidence given)");
    expect(buildTriageSystemPrompt()).toContain("You are not a judge");
  });
});

describe("assertNotAParty", () => {
  const parties = [
    { provider: "anthropic", modelName: "claude-sonnet-4-6", role: "reference" },
    { provider: "vllm-dgx-14", modelName: "qwen3.8-27b-nvfp4", role: "candidate" },
  ];
  it("refuses the reference and the candidate as the triage model", () => {
    expect(() => assertNotAParty({ provider: "anthropic", modelName: "claude-sonnet-4-6" }, parties)).toThrow(SittingError);
    expect(() => assertNotAParty({ provider: "vllm-dgx-14", modelName: "qwen3.8-27b-nvfp4" }, parties)).toThrow(/candidate/);
  });
  it("lets a third model through, the same model name on another provider included", () => {
    expect(() => assertNotAParty({ provider: "anthropic", modelName: "claude-fable-5-1" }, parties)).not.toThrow();
    expect(() => assertNotAParty({ provider: "bedrock", modelName: "claude-sonnet-4-6" }, parties)).not.toThrow();
  });
});

describe("triageOutputBudget", () => {
  it("gives a thinking model its own output ceiling, since its reasoning counts against the cap", () => {
    expect(triageOutputBudget({ supportsThinking: true, thinkingEffort: "medium", maxOutputTokens: 32768 })).toBe(32768);
    expect(triageOutputBudget({ supportsThinking: true, thinkingEffort: "low", maxOutputTokens: null })).toBeGreaterThanOrEqual(16384);
  });
  it("keeps a model that cannot think at the answer's own budget", () => {
    expect(triageOutputBudget({ supportsThinking: false, thinkingEffort: null, maxOutputTokens: 32768 })).toBe(2048);
  });
  it("keeps the ceiling for a thinking model set to off, since a provider may ignore the switch", () => {
    expect(triageOutputBudget({ supportsThinking: true, thinkingEffort: "off", maxOutputTokens: 32768 })).toBe(32768);
    expect(triageOutputBudget({ supportsThinking: true, thinkingEffort: null, maxOutputTokens: 32768 })).toBe(32768);
  });
});
